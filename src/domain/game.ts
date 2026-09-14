import { Player, Round, Rules } from "./types";

export const rebuildPlayers = (players: Player[], rounds: Round[], rules: Rules) =>
  players.map((player) => {
    const scoreReset = player.scoreReset;
    const resetRoundIndex = scoreReset
      ? rounds.findIndex((round) => round.id === scoreReset.afterRoundId)
      : -1;
    const scoreRounds = resetRoundIndex >= 0 ? rounds.slice(resetRoundIndex + 1) : rounds;
    const startingTotal = resetRoundIndex >= 0 ? scoreReset?.total ?? 0 : 0;
    const total = scoreRounds.reduce((sum, round) => {
      const entry = round.entries.find((candidate) => candidate.playerId === player.id);
      return sum + (entry?.score ?? 0);
    }, startingTotal);
    return { ...player, total, eliminated: total >= rules.maxScore };
  });

export const rejoinPlayerAtScore = (players: Player[], playerId: string, total: number, afterRoundId: string, openCardPlayerId: string | null) => {
  const player = players.find((candidate) => candidate.id === playerId);
  if (!player?.eliminated) return players;

  const activePlayers = getPlayersInTurnOrder(players).filter((candidate) => !candidate.eliminated);
  const openCardPlayerIndex = activePlayers.findIndex((candidate) => candidate.id === openCardPlayerId);
  const insertAt = openCardPlayerIndex < 0 ? activePlayers.length : openCardPlayerIndex;
  const turnOrder = [...activePlayers.slice(0, insertAt), player, ...activePlayers.slice(insertAt)];
  const seats = new Map(turnOrder.map((candidate, index) => [candidate.id, index + 1]));

  return players.map((candidate) => candidate.id === playerId
    ? { ...candidate, total, eliminated: false, seat: seats.get(candidate.id)!, scoreReset: { afterRoundId, total } }
    : seats.has(candidate.id) ? { ...candidate, seat: seats.get(candidate.id)! } : candidate);
};

export const getRejoinEligiblePlayerIds = (players: Player[], rounds: Round[], rules: Rules) => {
  if (!rounds.length) return [];

  const playersBeforeLastRound = rebuildPlayers(players, rounds.slice(0, -1), rules);
  return players
    .filter((player) => player.eliminated && !playersBeforeLastRound.find((candidate) => candidate.id === player.id)?.eliminated)
    .map((player) => player.id);
};

export const getPlayersInTurnOrder = (players: Player[]) => [...players].sort((a, b) => a.seat - b.seat);

export const getCardDistributorPlayerId = (players: Player[], openCardPlayerId: string | null) => {
  const activePlayers = getPlayersInTurnOrder(players).filter((player) => !player.eliminated);
  if (!activePlayers.length) return null;

  const openCardPlayerIndex = activePlayers.findIndex((player) => player.id === openCardPlayerId);
  const distributorIndex = openCardPlayerIndex < 0 ? activePlayers.length - 1 : (openCardPlayerIndex - 1 + activePlayers.length) % activePlayers.length;
  return activePlayers[distributorIndex].id;
};

export const getCurrentDealerPlayerId = (players: Player[], openCardPlayerId: string | null, currentDealerPlayerId?: string | null) => (
  players.some((player) => player.id === currentDealerPlayerId && !player.eliminated)
    ? currentDealerPlayerId!
    : getCardDistributorPlayerId(players, openCardPlayerId)
);

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
