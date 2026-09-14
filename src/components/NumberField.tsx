import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { styles } from "../styles";

type Props = {
  label?: string;
  value: string;
  placeholder?: string;
  accessibilityLabel?: string;
  compact?: boolean;
  prominent?: boolean;
  maxLength?: number;
  inputRef?: (input: TextInput | null) => void;
  error?: boolean;
  errorMessage?: string;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
};

export function NumberField({ label, value, placeholder, accessibilityLabel, compact, prominent, maxLength = 3, inputRef, error, errorMessage, onChangeText, onFocus }: Props) {
  const [focused, setFocused] = useState(false);
  const fieldAccessibilityLabel = error ? `${accessibilityLabel ?? label ?? "Number input"}. ${errorMessage ?? "Invalid value"}` : accessibilityLabel ?? label;

  return (
    <View style={[styles.field, compact && styles.compactField]}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        style={[styles.numberInput, compact && styles.compactNumberInput, prominent && styles.prominentNumberInput, focused && !error && styles.numberInputFocused, error && styles.numberInputError]}
        placeholder={placeholder}
        placeholderTextColor="#7A8798"
        accessibilityLabel={fieldAccessibilityLabel}
        maxLength={maxLength}
      />
    </View>
  );
}
