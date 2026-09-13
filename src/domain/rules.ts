import { DEFAULT_RULES } from "../constants";
import { DraftEntry, Rules, RulesDraft, ScoreKind } from "./types";

export const toRulesDraft = (rules: Rules): RulesDraft => ({
  maxScore: String(rules.maxScore),
  fullScore: String(rules.fullScore),
  firstDropScore: String(rules.firstDropScore),
  middleDropScore: String(rules.middleDropScore),
});

const getNumberFromDraft = (value: string) => value.trim() ? Number(value) : Number.NaN;

export const getRulesFromDraft = (draft: RulesDraft): Rules => ({
  maxScore: getNumberFromDraft(draft.maxScore),
  fullScore: getNumberFromDraft(draft.fullScore),
  firstDropScore: getNumberFromDraft(draft.firstDropScore),
  middleDropScore: getNumberFromDraft(draft.middleDropScore),
});

export const getRulesError = (rules: Rules) => {
  const scores = [rules.maxScore, rules.fullScore, rules.firstDropScore, rules.middleDropScore];
  if (!scores.every((score) => Number.isSafeInteger(score) && score > 0)) return "Use positive whole-number scores for every setting.";
  if (rules.fullScore > rules.maxScore || rules.firstDropScore > rules.maxScore || rules.middleDropScore > rules.maxScore) return "No round score can exceed the game score.";
  if (rules.middleDropScore < rules.firstDropScore) return "Mid score must be at least as high as Drop score.";
  return "";
};

export const normalizeRules = (rules: Partial<Rules>): Rules => {
  const normalized = { ...DEFAULT_RULES, ...rules };
  return getRulesError(normalized) ? DEFAULT_RULES : normalized;
};

export const scoreLabel = (kind: ScoreKind, rules: Rules) => {
  switch (kind) {
    case "winner": return "Winner · 0";
    case "firstDrop": return `Drop · ${rules.firstDropScore}`;
    case "middleDrop": return `Middle drop · ${rules.middleDropScore}`;
    case "full": return `Full · ${rules.fullScore}`;
    default: return "Score";
  }
};

export const getPresetScore = (kind: Exclude<ScoreKind, "manual">, rules: Rules) => {
  if (kind === "winner") return 0;
  if (kind === "firstDrop") return rules.firstDropScore;
  if (kind === "middleDrop") return rules.middleDropScore;
  return rules.fullScore;
};

export const getScoreForKind = (entry: DraftEntry, rules: Rules) => (
  !entry.kind ? Number.NaN : entry.kind === "manual" ? getNumberFromDraft(entry.score) : getPresetScore(entry.kind, rules)
);

export const getRemainingTableStatus = (score: number, rules: Rules) => {
  const safePointsRemaining = Math.max(0, rules.maxScore - score - 1);
  return {
    safePointsRemaining,
    remainingDrops: Math.floor(safePointsRemaining / rules.firstDropScore),
  };
};

export const roundChoiceLabel = (kind: Exclude<ScoreKind, "manual">) => ({
  winner: "Win",
  firstDrop: "Drop",
  middleDrop: "Mid",
  full: "Full",
}[kind]);

export const getScoreTone = (score: number, rules: Rules, isLowestScore: boolean) => {
  const { remainingDrops } = getRemainingTableStatus(score, rules);

  if (remainingDrops === 0) return { accent: "#BE4A43", surface: "#FDEBE9", border: "#E37A72" };
  if (remainingDrops <= 1) return { accent: "#C46C08", surface: "#FFF1E0", border: "#E7A34C" };
  if (isLowestScore) return { accent: "#25834A", surface: "#FFFFFF", border: "#9DCEAA" };
  return { accent: "#53697E", surface: "#FFFFFF", border: "#E2E7ED" };
};
