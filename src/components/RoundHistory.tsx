import { Text, View } from "react-native";
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
      {[...rounds].reverse().map((round) => (
        <View key={round.id} style={styles.historyCard}>
          <Text style={styles.historyRound}>Round {round.number}</Text>
          {round.entries.map((entry) => {
            const player = players.find((candidate) => candidate.id === entry.playerId);
            return <Text key={entry.playerId} style={styles.historyEntry}>{player?.name ?? "Player"}: {scoreLabel(entry.kind, rules)}{entry.kind === "manual" ? ` · ${entry.score}` : ""}</Text>;
          })}
        </View>
      ))}
    </View>
  );
}
