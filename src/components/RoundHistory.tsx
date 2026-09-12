import { Text, View } from "react-native";
import { getPlayersInTurnOrder } from "../domain/game";
import { scoreLabel } from "../domain/rules";
import { Player, Round, Rules } from "../domain/types";
import { styles } from "../styles";

type Props = {
  rounds: Round[];
  players: Player[];
  rules: Rules;
};

export function RoundHistory({ rounds, players, rules }: Props) {
  return (
    <View style={styles.historyList}>
      {[...rounds].reverse().map((round) => {
        const fallbackDistributor = getPlayersInTurnOrder(players)[(round.number - 1) % players.length];
        const distributor = players.find((player) => player.id === round.dealerPlayerId) ?? fallbackDistributor;
        return (
          <View key={round.id} style={styles.historyCard}>
            <Text style={styles.historyRound}>Round {round.number}{distributor ? ` - Cards by ${distributor.name}` : ""}</Text>
            {round.entries.map((entry) => {
              const player = players.find((candidate) => candidate.id === entry.playerId);
              return <Text key={entry.playerId} style={styles.historyEntry}>{player?.name ?? "Player"}: {scoreLabel(entry.kind, rules)}{entry.kind === "manual" ? ` · ${entry.score}` : ""}</Text>;
            })}
          </View>
        );
      })}
    </View>
  );
}
