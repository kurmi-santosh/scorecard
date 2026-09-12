export type ScoreKind = "winner" | "manual" | "firstDrop" | "middleDrop" | "full";
export type GameStatus = "active" | "complete";

export type Rules = {
  maxScore: number;
  fullScore: number;
  firstDropScore: number;
  middleDropScore: number;
};

export type RulesDraft = Record<keyof Rules, string>;

export type Player = {
  id: string;
  name: string;
  seat: number;
  total: number;
  eliminated: boolean;
};

export type SavedPlayer = {
  id: string;
  name: string;
};

export type RoundEntry = {
  playerId: string;
  kind: ScoreKind;
  score: number;
};

export type Round = {
  id: string;
  number: number;
  savedAt: string;
  entries: RoundEntry[];
};

export type Game = {
  id: string;
  createdAt: string;
  rules: Rules;
  players: Player[];
  rounds: Round[];
  status: GameStatus;
  openCardPlayerId: string | null;
};

export type DraftEntry = {
  kind: ScoreKind | null;
  score: string;
};
