import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, findNodeHandle, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
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

const confettiPieces = [
  { symbol: "●", color: "#F6B73C", x: -74, y: -38, rotation: "-35deg" },
  { symbol: "◆", color: "#E75850", x: -42, y: -82, rotation: "18deg" },
  { symbol: "✦", color: "#2468B1", x: 4, y: -96, rotation: "42deg" },
  { symbol: "●", color: "#2F8A52", x: 54, y: -72, rotation: "-28deg" },
  { symbol: "◆", color: "#9C62B8", x: 82, y: -30, rotation: "25deg" },
  { symbol: "✦", color: "#F6B73C", x: 28, y: -22, rotation: "-18deg" },
];

function ConfettiBurst() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [progress]);

  return (
    <View pointerEvents="none" style={styles.confettiBurst}>
      {confettiPieces.map((piece, index) => (
        <Animated.Text
          key={`${piece.symbol}-${index}`}
          style={[styles.confettiPiece, {
            color: piece.color,
            opacity: progress.interpolate({ inputRange: [0, 0.12, 0.76, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.x] }) },
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.y] }) },
              { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", piece.rotation] }) },
              { scale: progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.3, 1.15, 0.7] }) },
            ],
          }]}
        >{piece.symbol}</Animated.Text>
      ))}
    </View>
  );
}

export function RoundModal({ visible, game, draft, error, roundToEdit, onClose, onChange, onSave }: Props) {
  const roundPlayers = roundToEdit ? game.players.filter((player) => roundToEdit.entries.some((entry) => entry.playerId === player.id)) : game.players.filter((player) => !player.eliminated);
  const roundNumber = roundToEdit?.number ?? game.rounds.length + 1;
  const scrollViewRef = useRef<ScrollView>(null);
  const playerCardOffsets = useRef<Record<string, number>>({});
  const scoreInputRefs = useRef<Record<string, TextInput | null>>({});
  const saveButtonRef = useRef<React.ComponentRef<typeof Pressable>>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [saveFocused, setSaveFocused] = useState(false);

  const revealScoreField = (playerId: string) => {
    setSaveFocused(false);
    const offset = playerCardOffsets.current[playerId];
    if (offset === undefined) return;

    requestAnimationFrame(() => scrollViewRef.current?.scrollTo({ y: Math.max(0, offset - 12), animated: true }));
  };

  const focusNextScore = (playerId: string, playerIndex: number) => {
    const nextEmptyPlayer = roundPlayers.slice(playerIndex + 1).find((player) => (draft[player.id]?.score ?? "").trim() === "");
    if (nextEmptyPlayer) {
      setSaveFocused(false);
      scoreInputRefs.current[nextEmptyPlayer.id]?.focus();
      return;
    }
    scoreInputRefs.current[playerId]?.blur();
    setSaveFocused(true);
    scrollViewRef.current?.scrollToEnd({ animated: true });
    requestAnimationFrame(() => {
      saveButtonRef.current?.focus();
      const saveButtonNode = findNodeHandle(saveButtonRef.current);
      if (saveButtonNode) AccessibilityInfo.setAccessibilityFocus(saveButtonNode);
    });
  };

  const updateManualScore = (playerId: string, playerIndex: number, value: string) => {
    onChange(playerId, { kind: "manual", score: value });
    if (value.length === 2) requestAnimationFrame(() => focusNextScore(playerId, playerIndex));
  };

  const selectPresetScore = (playerId: string, playerIndex: number, kind: Exclude<ScoreKind, "manual">) => {
    onChange(playerId, { kind, score: String(getPresetScore(kind, game.rules)) });
    requestAnimationFrame(() => focusNextScore(playerId, playerIndex));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>{roundToEdit ? "Edit" : "Round"} {roundNumber}</Text><Pressable style={styles.modalCloseControl} onPress={onClose} accessibilityRole="button" accessibilityLabel={roundToEdit ? "Close editor" : "Cancel round"}><Text style={roundToEdit ? styles.dangerCloseText : styles.closeText}>{roundToEdit ? "Close" : "Cancel"}</Text></Pressable></View>
          {!!error && <Text style={styles.roundErrorBanner} accessibilityLiveRegion="assertive">{error}</Text>}
          <ScrollView ref={scrollViewRef} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {roundPlayers.map((player, playerIndex) => {
              const entry = draft[player.id] ?? { kind: null, score: "" };
              const manualScore = Number(entry.score);
              const scoreIsOutOfRange = entry.kind === "manual" && entry.score.trim() !== "" && (manualScore < 2 || manualScore > game.rules.fullScore);
              return (
                <View style={styles.roundCard} key={player.id} onLayout={(event) => { playerCardOffsets.current[player.id] = event.nativeEvent.layout.y; }}>
                  <View style={styles.roundPlayerHeader}>
                    <View style={styles.roundPlayerDetails}><Text style={styles.roundPlayerName}>{player.name}</Text><Text style={styles.roundPlayerTotal}>{player.total} / {game.rules.maxScore}</Text></View>
                    <View style={styles.roundManualScore}><NumberField value={entry.score} placeholder="Score" accessibilityLabel={`Manual score for ${player.name}`} compact prominent maxLength={2} inputRef={(input) => { scoreInputRefs.current[player.id] = input; }} error={scoreIsOutOfRange} errorMessage={`Score must be 2–${game.rules.fullScore}.`} onChangeText={(value) => updateManualScore(player.id, playerIndex, value)} onFocus={() => revealScoreField(player.id)} /></View>
                  </View>
                  <View style={styles.kindGrid}>
                    {(["winner", "firstDrop", "middleDrop", "full"] as Exclude<ScoreKind, "manual">[]).map((kind) => <KindButton key={kind} kind={kind} selected={entry.kind === kind} label={roundChoiceLabel(kind)} onPress={() => { if (kind === "winner") setConfettiKey((key) => key + 1); selectPresetScore(player.id, playerIndex, kind); }} />)}
                  </View>
                </View>
              );
            })}
            <PrimaryButton buttonRef={saveButtonRef} isFocused={saveFocused} label={roundToEdit ? "Save changes" : "Save round"} onPress={onSave} />
          </ScrollView>
        </KeyboardAvoidingView>
        {confettiKey > 0 && <ConfettiBurst key={confettiKey} />}
      </SafeAreaView>
    </Modal>
  );
}
