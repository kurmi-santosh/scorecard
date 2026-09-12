import { Text, View } from "react-native";
import { getScoreTone } from "../domain/rules";
import { Player, Rules } from "../domain/types";
import { styles } from "../styles";

type Props = {
  player: Player;
  rules: Rules;
  isLowestScore: boolean;
  isOpenCardPlayer: boolean;
  isDistributor: boolean;
};

export function PlayerCard({ player, rules, isLowestScore, isOpenCardPlayer, isDistributor }: Props) {
  const progress = Math.min(player.total / rules.maxScore, 1);
  const scoreTone = getScoreTone(player.total, rules, isLowestScore);
  const safePointsRemaining = Math.max(0, rules.maxScore - player.total - 1);
  const remainingDrops = Math.floor(safePointsRemaining / rules.firstDropScore);
  const showRemainingStatus = player.total >= rules.maxScore - rules.fullScore;

  return (
    <View style={[styles.playerCard, { backgroundColor: scoreTone.surface, borderColor: scoreTone.border }]}>
      <View style={styles.playerHeader}>
        <View style={styles.playerNameBlock}>
          <View style={styles.playerNameRow}>
            <Text style={styles.playerName}>{player.name}</Text>
            {isDistributor && <Text style={styles.distributorStar} accessibilityLabel="Card distributor">★</Text>}
            {isOpenCardPlayer && <View style={styles.openCardCue} accessible accessibilityLabel="Take the open card"><View style={styles.openCardIcon}><Text style={styles.openCardDiamond}>♦</Text></View><Text style={styles.openCardLabel}>Open card</Text></View>}
            {showRemainingStatus && <Text style={[styles.remainingStatus, { color: scoreTone.accent }]}>{remainingDrops} drops · {safePointsRemaining} left</Text>}
          </View>
        </View>
        <View style={styles.totalBlock}><Text style={[styles.playerTotal, { color: scoreTone.accent }]}>{player.total}</Text><Text style={styles.totalLimit}>/ {rules.maxScore}</Text></View>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: scoreTone.accent }]} /></View>
    </View>
  );
}
