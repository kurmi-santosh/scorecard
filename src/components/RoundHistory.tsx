import { Text, useWindowDimensions, View } from "react-native";
import { getPlayersInTurnOrder } from "../domain/game";
import { Player, Round } from "../domain/types";
import { styles } from "../styles";

type Props = {
  rounds: Round[];
  players: Player[];
};

export function RoundHistory({ rounds, players }: Props) {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.historyList}>
      {[...rounds].reverse().map((round) => {
        const fallbackDistributor = getPlayersInTurnOrder(players)[(round.number - 1) % players.length];
        const distributor = players.find((player) => player.id === round.dealerPlayerId) ?? fallbackDistributor;
        const useThreeColumns = width >= 360 && (round.entries.length === 3 || round.entries.length >= 5);
        return (
          <View key={round.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyRound}>R{round.number}{distributor ? ` (${distributor.name})` : ""}</Text>
            </View>
            <View style={styles.historyEntries}>{round.entries.map((entry) => {
              const player = players.find((candidate) => candidate.id === entry.playerId);
              return <View key={entry.playerId} style={[styles.historyEntry, useThreeColumns && styles.historyEntryThreeColumn]}><Text numberOfLines={1} style={styles.historyEntryName}>{player?.name ?? "Player"}</Text><Text style={styles.historySeparator}>:</Text><Text style={styles.historyScore}>{entry.score}</Text></View>;
            })}</View>
          </View>
        );
      })}
    </View>
  );
}
