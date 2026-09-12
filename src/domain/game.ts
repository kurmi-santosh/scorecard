import { Player, Round, Rules } from "./types";

export const rebuildPlayers = (players: Player[], rounds: Round[], rules: Rules) =>
  players.map((player) => {
    const total = rounds.reduce((sum, round) => {
      const entry = round.entries.find((candidate) => candidate.playerId === player.id);
      return sum + (entry?.score ?? 0);
    }, 0);
    return { ...player, total, eliminated: total >= rules.maxScore };
  });

export const getPlayersInTurnOrder = (players: Player[]) => [...players].sort((a, b) => a.seat - b.seat);

export const getLegacyOpenCardPlayerId = (players: Player[], rounds: Round[]) => {
  const activePlayers = getPlayersInTurnOrder(players).filter((player) => !player.eliminated);
  return activePlayers.length ? activePlayers[(rounds.length + 1) % activePlayers.length].id : null;
};

export const getNextOpenCardPlayerId = (players: Player[], currentPlayerId: string | null) => {
  const orderedPlayers = getPlayersInTurnOrder(players);
  const currentIndex = currentPlayerId ? orderedPlayers.findIndex((player) => player.id === currentPlayerId) : -1;
  if (currentIndex < 0) return orderedPlayers.find((player) => !player.eliminated)?.id ?? null;

  for (let step = 1; step <= orderedPlayers.length; step += 1) {
    const candidate = orderedPlayers[(currentIndex + step) % orderedPlayers.length];
    if (!candidate.eliminated) return candidate.id;
  }
  return null;
};

export const getCurrentOpenCardPlayerId = (players: Player[], currentPlayerId: string | null) => (
  players.some((player) => player.id === currentPlayerId && !player.eliminated)
    ? currentPlayerId
    : getNextOpenCardPlayerId(players, currentPlayerId)
);
