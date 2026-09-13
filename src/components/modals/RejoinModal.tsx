import { Modal, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { Game } from "../../domain/types";
import { getRejoinEligiblePlayerIds } from "../../domain/game";
import { styles } from "../../styles";

type Props = {
  visible: boolean;
  game: Game;
  onClose: () => void;
  onRejoin: (playerId: string) => void;
};

export function RejoinModal({ visible, game, onClose, onRejoin }: Props) {
  const eligiblePlayerIds = getRejoinEligiblePlayerIds(game.players, game.rounds, game.rules);
  const outPlayers = game.players.filter((player) => eligiblePlayerIds.includes(player.id));
  const activePlayers = game.players.filter((player) => !player.eliminated);
  const rejoinScore = activePlayers.length ? Math.max(...activePlayers.map((player) => player.total)) + 1 : 0;
  const canRejoin = rejoinScore < game.rules.maxScore;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>Rejoin a player</Text><Pressable style={styles.modalCloseControl} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close rejoin player"><Text style={styles.dangerCloseText}>Close</Text></Pressable></View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {canRejoin ? <Text style={styles.modalLead}>A returning player starts at {rejoinScore}: one point above the highest score still at the table.</Text> : <Text style={styles.errorText}>Rejoining is unavailable because the return score would reach the elimination score.</Text>}
          <View style={styles.rejoinList}>
            {outPlayers.map((player) => (
              <Pressable key={player.id} onPress={() => onRejoin(player.id)} disabled={!canRejoin} style={[styles.rejoinPlayerButton, !canRejoin && styles.rejoinPlayerButtonDisabled]} accessibilityRole="button" accessibilityLabel={`Rejoin ${player.name} at ${rejoinScore}`} accessibilityState={{ disabled: !canRejoin }}>
                <Text style={[styles.rejoinPlayerName, !canRejoin && styles.disabledText]}>{player.name}</Text>
                <Text style={[styles.rejoinPlayerScore, !canRejoin && styles.disabledText]}>Rejoin at {rejoinScore}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
