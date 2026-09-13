import { Text, TextInput, View } from "react-native";
import { styles } from "../styles";

type Props = {
  label?: string;
  value: string;
  placeholder?: string;
  accessibilityLabel?: string;
  compact?: boolean;
  error?: boolean;
  errorMessage?: string;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
};

export function NumberField({ label, value, placeholder, accessibilityLabel, compact, error, errorMessage, onChangeText, onFocus }: Props) {
  const fieldAccessibilityLabel = error ? `${accessibilityLabel ?? label ?? "Number input"}. ${errorMessage ?? "Invalid value"}` : accessibilityLabel ?? label;

  return (
    <View style={[styles.field, compact && styles.compactField]}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        keyboardType="number-pad"
        style={[styles.numberInput, compact && styles.compactNumberInput, error && styles.numberInputError]}
        placeholder={placeholder}
        placeholderTextColor="#7A8798"
        accessibilityLabel={fieldAccessibilityLabel}
        maxLength={3}
      />
    </View>
  );
}
