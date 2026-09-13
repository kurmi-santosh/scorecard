import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { getPresetScore, roundChoiceLabel } from "../../domain/rules";
import { DraftEntry, Game, Round, ScoreKind } from "../../domain/types";
import { styles } from "../../styles";
import { KindButton } from "../KindButton";
import { NumberField } from "../NumberField";
import { PrimaryButton } from "../PrimaryButton";

type Props = {
  visible: boolean;
  game: Game;
  draft: Record<string, DraftEntry>;
  error: string;
  roundToEdit: Round | null;
  onClose: () => void;
  onChange: (playerId: string, update: Partial<DraftEntry>) => void;
  onSave: () => void;
};

export function RoundModal({ visible, game, draft, error, roundToEdit, onClose, onChange, onSave }: Props) {
  const roundPlayers = roundToEdit ? game.players.filter((player) => roundToEdit.entries.some((entry) => entry.playerId === player.id)) : game.players.filter((player) => !player.eliminated);
  const roundNumber = roundToEdit?.number ?? game.rounds.length + 1;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>{roundToEdit ? "Edit" : "Round"} {roundNumber}</Text><Pressable style={styles.modalCloseControl} onPress={onClose} accessibilityRole="button" accessibilityLabel={roundToEdit ? "Close editor" : "Cancel round"}><Text style={roundToEdit ? styles.dangerCloseText : styles.closeText}>{roundToEdit ? "Close" : "Cancel"}</Text></Pressable></View>
          {!!error && <Text style={styles.roundErrorBanner} accessibilityLiveRegion="assertive">{error}</Text>}
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {roundPlayers.map((player) => {
              const entry = draft[player.id] ?? { kind: null, score: "" };
              return (
                <View style={styles.roundCard} key={player.id}>
                  <View style={styles.roundPlayerHeader}>
                    <View style={styles.roundPlayerDetails}><Text style={styles.roundPlayerName}>{player.name}</Text><Text style={styles.roundPlayerTotal}>{player.total} / {game.rules.maxScore}</Text></View>
                    <View style={styles.roundManualScore}><NumberField value={entry.score} placeholder="Score" accessibilityLabel={`Manual score for ${player.name}`} compact onChangeText={(value) => onChange(player.id, { kind: "manual", score: value })} /></View>
                  </View>
                  <View style={styles.kindGrid}>
                    {(["winner", "firstDrop", "middleDrop", "full"] as Exclude<ScoreKind, "manual">[]).map((kind) => <KindButton key={kind} kind={kind} selected={entry.kind === kind} label={roundChoiceLabel(kind)} onPress={() => onChange(player.id, { kind, score: String(getPresetScore(kind, game.rules)) })} />)}
                  </View>
                </View>
              );
            })}
            <PrimaryButton label={roundToEdit ? "Save changes" : "Save round"} onPress={onSave} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
