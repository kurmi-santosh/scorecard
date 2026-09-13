import { Rules } from "./domain/types";

export const STORAGE_KEY = "scorecard.active-game.v1";
export const PLAYERS_STORAGE_KEY = "scorecard.saved-players.v1";
export const DEFAULT_RULES_STORAGE_KEY = "scorecard.default-rules.v1";
export const MAX_PLAYERS = 6;
export const MAX_PLAYER_NAME_LENGTH = 12;

export const DEFAULT_RULES: Rules = {
  maxScore: 200,
  fullScore: 80,
  firstDropScore: 24,
  middleDropScore: 48,
};

export const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
