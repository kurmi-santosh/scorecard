import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { MAX_PLAYERS } from "../../constants";
import { Rules, RulesDraft, SavedPlayer } from "../../domain/types";
import { styles } from "../../styles";
import { NumberField } from "../NumberField";
import { PrimaryButton } from "../PrimaryButton";

type Props = {
  visible: boolean;
  names: string[];
  rules: RulesDraft;
  error: string;
  onClose: () => void;
  onNameChange: (index: number, value: string) => void;
  onAddPlayer: () => void;
  onRemovePlayer: (index: number) => void;
  savedPlayers: SavedPlayer[];
  onAddSavedPlayer: (name: string) => void;
  onRulesChange: (key: keyof Rules, value: string) => void;
  onStart: () => void;
};

export function SetupModal({
  visible, names, rules, error, onClose, onNameChange, onAddPlayer, onRemovePlayer, savedPlayers, onAddSavedPlayer, onRulesChange, onStart,
}: Props) {
  const [rulesExpanded, setRulesExpanded] = useState(false);

  useEffect(() => {
    if (visible) setRulesExpanded(false);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Set up the table</Text><Pressable onPress={onClose}><Text style={styles.dangerCloseText}>Close</Text></Pressable></View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalLead}>Players are added in turn order. Seat order is permanent once the game starts.</Text>
            <Text style={styles.formTitle}>Players in order</Text>
            {names.map((name, index) => (
              <View style={styles.nameRow} key={index}>
                <View style={styles.seatBadge}><Text style={styles.seatText}>{index + 1}</Text></View>
                <TextInput value={name} onChangeText={(value) => onNameChange(index, value)} placeholder={`Player ${index + 1}`} placeholderTextColor="#7A8798" style={styles.nameInput} maxLength={24} returnKeyType="next" />
                <Pressable onPress={() => onRemovePlayer(index)} disabled={names.length === 1} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove player ${index + 1}`} accessibilityState={{ disabled: names.length === 1 }}><Text style={[styles.removeControl, names.length === 1 && styles.disabledText]}>×</Text></Pressable>
              </View>
            ))}
            {names.length < MAX_PLAYERS && <Pressable onPress={onAddPlayer} style={styles.addPlayer}><Text style={styles.addPlayerText}>+ Add player</Text></Pressable>}

            {savedPlayers.length > 0 && (
              <View style={styles.savedPlayersSection}>
                <Text style={styles.formTitle}>Saved players</Text>
                <Text style={styles.savedPlayersHint}>Tap + to put a player in the next available seat.</Text>
                <View style={styles.savedPlayersList}>
                  {savedPlayers.map((player) => {
                    const alreadyAdded = names.some((name) => name.trim().toLocaleLowerCase() === player.name.toLocaleLowerCase());
                    const hasOpenSeat = names.some((name) => !name.trim()) || names.length < MAX_PLAYERS;
                    const canAdd = !alreadyAdded && hasOpenSeat;
                    return (
                      <Pressable key={player.id} onPress={() => onAddSavedPlayer(player.name)} disabled={!canAdd} style={[styles.savedPlayerButton, !canAdd && styles.savedPlayerButtonDisabled]} accessibilityRole="button" accessibilityLabel={`Add ${player.name} to the game`} accessibilityState={{ disabled: !canAdd }}>
                        <Text style={[styles.savedPlayerName, !canAdd && styles.disabledText]}>{player.name}</Text>
                        <Text style={[styles.savedPlayerAdd, !canAdd && styles.disabledText]}>+</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <Pressable style={styles.rulesToggle} onPress={() => setRulesExpanded((expanded) => !expanded)} accessibilityRole="button" accessibilityLabel={rulesExpanded ? "Collapse table rules" : "Expand table rules"} accessibilityState={{ expanded: rulesExpanded }}>
              <Text style={styles.formTitle}>Table rules</Text>
              <Text style={styles.rulesToggleText}>{rulesExpanded ? "Hide" : "Edit"}</Text>
            </Pressable>
            {rulesExpanded && <View style={styles.rulesContent}>
              <Text style={styles.ruleHint}>The maximum is the cumulative score that puts a player out.</Text>
              <NumberField label="Game score" value={rules.maxScore} onChangeText={(value) => onRulesChange("maxScore", value)} />
              <NumberField label="Full score" value={rules.fullScore} onChangeText={(value) => onRulesChange("fullScore", value)} />
              <NumberField label="Drop score" value={rules.firstDropScore} onChangeText={(value) => onRulesChange("firstDropScore", value)} />
              <NumberField label="Mid score" value={rules.middleDropScore} onChangeText={(value) => onRulesChange("middleDropScore", value)} />
            </View>}
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <PrimaryButton label="Start scorecard" onPress={onStart} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
