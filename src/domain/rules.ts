import { DEFAULT_RULES } from "../constants";
import { DraftEntry, Rules, RulesDraft, ScoreKind } from "./types";

export const toRulesDraft = (rules: Rules): RulesDraft => ({
  maxScore: String(rules.maxScore),
  fullScore: String(rules.fullScore),
  firstDropScore: String(rules.firstDropScore),
  middleDropScore: String(rules.middleDropScore),
});

export const normalizeRules = (rules: Partial<Rules>): Rules => ({ ...DEFAULT_RULES, ...rules });

export const getRulesFromDraft = (draft: RulesDraft): Rules => ({
  maxScore: Number.parseInt(draft.maxScore, 10),
  fullScore: Number.parseInt(draft.fullScore, 10),
  firstDropScore: Number.parseInt(draft.firstDropScore, 10),
  middleDropScore: Number.parseInt(draft.middleDropScore, 10),
});

export const getRulesError = (rules: Rules) => {
  if (!rules.maxScore || !rules.fullScore || !rules.firstDropScore || !rules.middleDropScore) return "Use positive scores for every setting.";
  if (rules.fullScore > rules.maxScore) return "Full score cannot exceed the game score.";
  if (rules.middleDropScore < rules.firstDropScore) return "Mid score must be at least as high as Drop score.";
  return "";
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
  !entry.kind ? Number.NaN : entry.kind === "manual" ? Number.parseInt(entry.score, 10) : getPresetScore(entry.kind, rules)
);

export const roundChoiceLabel = (kind: Exclude<ScoreKind, "manual">) => ({
  winner: "Win",
  firstDrop: "Drop",
  middleDrop: "Mid",
  full: "Full",
}[kind]);

export const getScoreTone = (score: number, rules: Rules, isLowestScore: boolean) => {
  const safePoints = Math.max(0, rules.maxScore - score - 1);
  const remainingDrops = Math.floor(safePoints / rules.firstDropScore);

  if (remainingDrops === 0) return { accent: "#BE4A43", surface: "#FDEBE9", border: "#E37A72" };
  if (remainingDrops <= 1) return { accent: "#C46C08", surface: "#FFF1E0", border: "#E7A34C" };
  if (isLowestScore) return { accent: "#25834A", surface: "#FFFFFF", border: "#9DCEAA" };
  return { accent: "#53697E", surface: "#FFFFFF", border: "#E2E7ED" };
};
