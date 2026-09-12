import { Pressable, Text } from "react-native";
import { styles } from "../styles";

type Props = {
  label: string;
  onPress: () => void;
};

export function PrimaryButton({ label, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button">
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}
