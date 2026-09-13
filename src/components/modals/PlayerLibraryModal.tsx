import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { SavedPlayer } from "../../domain/types";
import { MAX_PLAYER_NAME_LENGTH } from "../../constants";
import { styles } from "../../styles";
import { PrimaryButton } from "../PrimaryButton";

type Props = {
  visible: boolean;
  name: string;
  players: SavedPlayer[];
  error: string;
  onClose: () => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onDelete: (playerId: string) => void;
};

export function PlayerLibraryModal({ visible, name, players, error, onClose, onNameChange, onSave, onDelete }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Saved players</Text><Pressable style={styles.modalCloseControl} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close saved players"><Text style={styles.closeText}>Done</Text></Pressable></View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalLead}>Save player names once. When setting up a game, tap + beside a name to add it in table order.</Text>
            <Text style={styles.fieldLabel}>Player name</Text>
            <TextInput value={name} onChangeText={onNameChange} placeholder="e.g. Asha" placeholderTextColor="#7A8798" style={styles.nameInput} maxLength={MAX_PLAYER_NAME_LENGTH} returnKeyType="done" onSubmitEditing={onSave} />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <PrimaryButton label="Save player" onPress={onSave} />
            <Text style={[styles.formTitle, styles.libraryPlayersTitle]}>Players</Text>
            {players.length ? <View style={styles.libraryPlayerList}>{players.map((player) => <View key={player.id} style={styles.libraryPlayerRow}><Text style={styles.libraryPlayerName}>{player.name}</Text><Pressable style={styles.libraryDeleteButton} onPress={() => onDelete(player.id)} accessibilityRole="button" accessibilityLabel={`Delete ${player.name}`}><Text style={styles.libraryDeleteText}>Delete</Text></Pressable></View>)}</View> : <Text style={styles.emptyLibraryText}>No saved players yet.</Text>}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
