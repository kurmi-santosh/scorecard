import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { Rules, RulesDraft, SavedPlayer } from "../../domain/types";
import { styles } from "../../styles";
import { NumberField } from "../NumberField";
import { PrimaryButton } from "../PrimaryButton";

type Props = {
  visible: boolean;
  rules: RulesDraft;
  players: SavedPlayer[];
  error: string;
  onClose: () => void;
  onRulesChange: (key: keyof Rules, value: string) => void;
  onSave: () => void;
  onManagePlayers: () => void;
};

export function SettingsModal({ visible, rules, players, error, onClose, onRulesChange, onSave, onManagePlayers }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Default scores</Text><Pressable style={styles.modalCloseControl} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close default scores"><Text style={styles.dangerCloseText}>Close</Text></Pressable></View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalLead}>Used for new games only.</Text>
            <View style={styles.scoreGrid}>
              <View style={styles.scoreGridItem}><NumberField compact label="Game score" value={rules.maxScore} onChangeText={(value) => onRulesChange("maxScore", value)} /></View>
              <View style={styles.scoreGridItem}><NumberField compact label="Full score" value={rules.fullScore} onChangeText={(value) => onRulesChange("fullScore", value)} /></View>
              <View style={styles.scoreGridItem}><NumberField compact label="Drop score" value={rules.firstDropScore} onChangeText={(value) => onRulesChange("firstDropScore", value)} /></View>
              <View style={styles.scoreGridItem}><NumberField compact label="Mid score" value={rules.middleDropScore} onChangeText={(value) => onRulesChange("middleDropScore", value)} /></View>
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <PrimaryButton label="Save defaults" onPress={onSave} />
            <Text style={[styles.formTitle, styles.settingsPlayersTitle]}>Saved players</Text>
            {players.length ? <View style={styles.libraryPlayerList}>{players.map((player) => <Text key={player.id} style={styles.libraryPlayerName}>{player.name}</Text>)}</View> : <Text style={styles.emptyLibraryText}>No saved players yet.</Text>}
            <Pressable style={styles.managePlayersButton} onPress={onManagePlayers} accessibilityRole="button"><Text style={styles.managePlayersButtonText}>Manage players</Text></Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
