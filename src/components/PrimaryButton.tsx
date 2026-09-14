import { type ComponentRef, type Ref } from "react";
import { Pressable, Text } from "react-native";
import { styles } from "../styles";

type Props = {
  label: string;
  onPress: () => void;
  buttonRef?: Ref<ComponentRef<typeof Pressable>>;
  isFocused?: boolean;
};

export function PrimaryButton({ label, onPress, buttonRef, isFocused }: Props) {
  return (
    <Pressable ref={buttonRef} focusable style={({ pressed }) => [styles.primaryButton, isFocused && styles.primaryButtonFocused, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button">
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}
