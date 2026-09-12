import { Pressable, Text } from "react-native";
import { ScoreKind } from "../domain/types";
import { styles } from "../styles";

type Props = {
  kind: Exclude<ScoreKind, "manual">;
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function KindButton({ kind, label, selected, onPress }: Props) {
  const toneStyle = {
    winner: styles.kindButtonWin,
    firstDrop: styles.kindButtonDrop,
    middleDrop: styles.kindButtonMid,
    full: styles.kindButtonFull,
  }[kind];
  const selectedToneStyle = {
    winner: styles.kindButtonWinSelected,
    firstDrop: styles.kindButtonDropSelected,
    middleDrop: styles.kindButtonMidSelected,
    full: styles.kindButtonFullSelected,
  }[kind];

  return (
    <Pressable onPress={onPress} style={[styles.kindButton, toneStyle, selected && selectedToneStyle]} accessibilityRole="button" accessibilityState={{ selected }}>
      <Text style={[styles.kindButtonText, selected && styles.kindButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}
