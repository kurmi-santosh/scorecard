const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  module._compile(output, filename);
};

const { DEFAULT_RULES } = require("../src/constants.ts");
const { getCardDistributorPlayerId, getCurrentDealerPlayerId, getRejoinEligiblePlayerIds, rebuildPlayers, rejoinPlayerAtScore } = require("../src/domain/game.ts");
const { getRemainingTableStatus, getRulesError, getRulesFromDraft, getScoreForKind, normalizeRules } = require("../src/domain/rules.ts");

const players = [
  { id: "a", name: "Ari", seat: 1, total: 0, eliminated: false },
  { id: "b", name: "Bea", seat: 2, total: 0, eliminated: false },
];

const eliminationRound = {
  id: "round-1",
  number: 1,
  savedAt: "2026-01-01T00:00:00.000Z",
  dealerPlayerId: "a",
  entries: [
    { playerId: "a", kind: "full", score: 200 },
    { playerId: "b", kind: "manual", score: 100 },
  ],
};

test("the player before the open-card player distributes each round", () => {
  const table = [
    { id: "a", name: "Ari", seat: 1, total: 0, eliminated: false },
    { id: "b", name: "Bea", seat: 2, total: 0, eliminated: false },
    { id: "c", name: "Cyd", seat: 3, total: 0, eliminated: false },
  ];
  assert.equal(getCardDistributorPlayerId(table, "b"), "a");
  assert.equal(getCardDistributorPlayerId(table, "c"), "b");
  assert.equal(getCardDistributorPlayerId(table, "a"), "c");
});

test("a rejoined player keeps the rejoin score through future rebuilds and historical edits", () => {
  const eliminatedPlayers = rebuildPlayers(players, [eliminationRound], DEFAULT_RULES);
  assert.equal(eliminatedPlayers[0].eliminated, true);

  const rejoinedPlayers = rejoinPlayerAtScore(eliminatedPlayers, "a", 101, eliminationRound.id, "b");
  assert.deepEqual(rejoinedPlayers[0].scoreReset, { afterRoundId: eliminationRound.id, total: 101 });

  const nextRound = {
    id: "round-2",
    number: 2,
    savedAt: "2026-01-02T00:00:00.000Z",
    entries: [
      { playerId: "a", kind: "firstDrop", score: 24 },
      { playerId: "b", kind: "winner", score: 0 },
    ],
  };
  const rebuiltAfterNextRound = rebuildPlayers(rejoinedPlayers, [eliminationRound, nextRound], DEFAULT_RULES);
  assert.equal(rebuiltAfterNextRound[0].total, 125);
  assert.equal(rebuiltAfterNextRound[0].eliminated, false);

  const editedEliminationRound = { ...eliminationRound, entries: [{ playerId: "a", kind: "manual", score: 80 }, { playerId: "b", kind: "manual", score: 100 }] };
  const rebuiltAfterEdit = rebuildPlayers(rejoinedPlayers, [editedEliminationRound, nextRound], DEFAULT_RULES);
  assert.equal(rebuiltAfterEdit[0].total, 125);
});

test("a rejoined player is dealt last without changing the current distribution", () => {
  const table = [
    { id: "a", name: "Ari", seat: 1, total: 30, eliminated: false },
    { id: "b", name: "Bea", seat: 2, total: 40, eliminated: false },
    { id: "c", name: "Cyd", seat: 3, total: 200, eliminated: true },
    { id: "d", name: "Dev", seat: 4, total: 50, eliminated: false },
  ];

  const rejoinedPlayers = rejoinPlayerAtScore(table, "c", 51, "round-4", "b");
  assert.deepEqual(rejoinedPlayers.filter((player) => !player.eliminated).sort((left, right) => left.seat - right.seat).map((player) => player.id), ["c", "a", "b", "d"]);
  assert.equal(getCardDistributorPlayerId(rejoinedPlayers, "b"), "a");
  assert.equal(getCurrentDealerPlayerId(rejoinedPlayers, "b", "a"), "a");
  assert.equal(getCurrentDealerPlayerId(rejoinedPlayers, "d", null), "b");
});

test("two rejoined players fill the final deal positions without changing the distributor", () => {
  const table = [
    { id: "a", name: "Ari", seat: 1, total: 30, eliminated: false },
    { id: "b", name: "Bea", seat: 2, total: 40, eliminated: false },
    { id: "c", name: "Cyd", seat: 3, total: 200, eliminated: true },
    { id: "d", name: "Dev", seat: 4, total: 200, eliminated: true },
    { id: "e", name: "Eli", seat: 5, total: 50, eliminated: false },
  ];

  const firstRejoin = rejoinPlayerAtScore(table, "c", 51, "round-4", "b");
  const secondRejoin = rejoinPlayerAtScore(firstRejoin, "d", 52, "round-4", "b");
  const activeOrder = secondRejoin.filter((player) => !player.eliminated).sort((left, right) => left.seat - right.seat).map((player) => player.id);

  assert.deepEqual(activeOrder, ["c", "d", "a", "b", "e"]);
  assert.equal(getCardDistributorPlayerId(secondRejoin, "b"), "a");
  assert.equal(getCurrentDealerPlayerId(secondRejoin, "b", "a"), "a");
});

test("only a player eliminated in the latest round can rejoin", () => {
  const eliminatedPlayers = rebuildPlayers(players, [eliminationRound], DEFAULT_RULES);
  assert.deepEqual(getRejoinEligiblePlayerIds(eliminatedPlayers, [eliminationRound], DEFAULT_RULES), ["a"]);

  const nextRound = { ...eliminationRound, id: "round-2", number: 2, entries: [{ playerId: "b", kind: "winner", score: 0 }] };
  assert.deepEqual(getRejoinEligiblePlayerIds(eliminatedPlayers, [eliminationRound, nextRound], DEFAULT_RULES), []);
});

test("rules require positive whole numbers and usable preset scores", () => {
  assert.equal(getRulesError(DEFAULT_RULES), "");
  assert.match(getRulesError({ maxScore: 200, fullScore: 80, firstDropScore: -5, middleDropScore: -1 }), /positive whole-number/);
  assert.match(getRulesError({ maxScore: 200, fullScore: 80, firstDropScore: 201, middleDropScore: 201 }), /exceed/);
  assert.match(getRulesError({ maxScore: 200, fullScore: 80, firstDropScore: 24.5, middleDropScore: 48 }), /positive whole-number/);
  assert.deepEqual(normalizeRules({ firstDropScore: -5, middleDropScore: -1 }), DEFAULT_RULES);
});

test("manual score parsing does not truncate invalid input", () => {
  const draft = { maxScore: "200", fullScore: "80", firstDropScore: "24.5", middleDropScore: "48" };
  assert.match(getRulesError(getRulesFromDraft(draft)), /positive whole-number/);
  assert.ok(Number.isNaN(getScoreForKind({ kind: "manual", score: "" }, DEFAULT_RULES)));
  assert.equal(getScoreForKind({ kind: "manual", score: "19" }, DEFAULT_RULES), 19);
  assert.equal(getScoreForKind({ kind: "manual", score: "19.5" }, DEFAULT_RULES), 19.5);
  assert.ok(Number.isNaN(getScoreForKind({ kind: "manual", score: "19 points" }, DEFAULT_RULES)));
});

test("remaining drops and points use the game's configured table rules", () => {
  const rules = { maxScore: 150, fullScore: 60, firstDropScore: 20, middleDropScore: 40 };
  assert.deepEqual(getRemainingTableStatus(29, rules), { safePointsRemaining: 120, remainingDrops: 6 });
});
