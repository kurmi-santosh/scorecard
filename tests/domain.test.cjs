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
const { getCardDistributorPlayerId, rebuildPlayers, rejoinPlayerAtScore } = require("../src/domain/game.ts");
const { getRulesError, getRulesFromDraft, getScoreForKind, normalizeRules } = require("../src/domain/rules.ts");

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

  const rejoinedPlayers = rejoinPlayerAtScore(eliminatedPlayers, "a", 101, eliminationRound.id);
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
