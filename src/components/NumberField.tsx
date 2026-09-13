import { Text, TextInput, View } from "react-native";
import { styles } from "../styles";

type Props = {
  label?: string;
  value: string;
  placeholder?: string;
  accessibilityLabel?: string;
  compact?: boolean;
  onChangeText: (value: string) => void;
};

export function NumberField({ label, value, placeholder, accessibilityLabel, compact, onChangeText }: Props) {
  return (
    <View style={[styles.field, compact && styles.compactField]}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        style={[styles.numberInput, compact && styles.compactNumberInput]}
        placeholder={placeholder}
        placeholderTextColor="#7A8798"
        accessibilityLabel={accessibilityLabel ?? label}
        maxLength={3}
      />
    </View>
  );
}
