import { Pressable, ScrollView, Text, View } from "react-native";
import { PlayerCard } from "../components/PlayerCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { RoundHistory } from "../components/RoundHistory";
import { getCurrentOpenCardPlayerId, getPlayersInTurnOrder } from "../domain/game";
import { Game, Player } from "../domain/types";
import { styles } from "../styles";

type Props = {
  game: Game;
  rankedPlayers: Player[];
  historyVisible: boolean;
  onToggleHistory: () => void;
  onAddRound: () => void;
  onNewGame: () => void;
  onOpenSettings: () => void;
  onOpenRejoin: () => void;
  onEditLastRound: () => void;
};

export function ScoreboardScreen({
  game,
  rankedPlayers,
  historyVisible,
  onToggleHistory,
  onAddRound,
  onNewGame,
  onOpenSettings,
  onOpenRejoin,
  onEditLastRound,
}: Props) {
  const winner = game.status === "complete" ? rankedPlayers[0] : undefined;
  const activePlayers = getPlayersInTurnOrder(game.players).filter((player) => !player.eliminated);
  const hasEliminatedPlayers = activePlayers.length !== game.players.length;
  const lowestActiveScore = Math.min(...activePlayers.map((player) => player.total));
  const openCardPlayerId = getCurrentOpenCardPlayerId(game.players, game.openCardPlayerId);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={onOpenSettings} accessibilityRole="button" accessibilityLabel="Open settings"><Text style={styles.topBarTitle}>Scorecard</Text></Pressable>
        <Pressable onPress={onNewGame} accessibilityRole="button"><Text style={styles.topBarAction}>New game</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {game.status === "complete" && (
          <View style={styles.completeBanner}>
            <Text style={styles.completeEyebrow}>GAME COMPLETE</Text>
            <Text style={styles.completeTitle}>{winner?.name ?? "Game"} leads the table</Text>
            <Text style={styles.completeCopy}>Lowest score wins. Final score: {winner?.total ?? 0}.</Text>
          </View>
        )}

        {activePlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            rules={game.rules}
            isLowestScore={player.total === lowestActiveScore}
            isOpenCardPlayer={player.id === openCardPlayerId}
          />
        ))}

        {hasEliminatedPlayers && <Pressable style={styles.rejoinButton} onPress={onOpenRejoin} accessibilityRole="button"><Text style={styles.rejoinButtonText}>Rejoin a player</Text></Pressable>}

        {game.status === "active" ? (
          <>
            <PrimaryButton label="Add round" onPress={onAddRound} />
          </>
        ) : (
          <>
            <PrimaryButton label="Start a new game" onPress={onNewGame} />
          </>
        )}

        {game.rounds.length > 0 && (
          <>
            <View style={styles.roundActions}>
              <Pressable style={styles.roundAction} onPress={onEditLastRound} accessibilityRole="button"><Text style={styles.secondaryButtonText}>Edit last round</Text></Pressable>
              <Pressable style={styles.roundAction} onPress={onToggleHistory} accessibilityRole="button"><Text style={styles.secondaryButtonText}>{historyVisible ? "Hide history" : "View history"}</Text></Pressable>
            </View>
            {historyVisible && <View style={styles.historyArea}><RoundHistory rounds={game.rounds} players={game.players} rules={game.rules} /></View>}
          </>
        )}
      </ScrollView>
    </View>
  );
}
