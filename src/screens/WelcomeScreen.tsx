import { Pressable, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { styles } from "../styles";

type Props = {
  hasGame: boolean;
  onStart: () => void;
  onResume: () => void;
  onManagePlayers: () => void;
};

export function WelcomeScreen({ hasGame, onStart, onResume, onManagePlayers }: Props) {
  return (
    <View style={styles.welcome}>
      <View style={styles.brandMark}><Text style={styles.brandDiamond}>♦</Text></View>
      <Text style={styles.appName}>Scorecard</Text>
      <Text style={styles.tagline}>A clear, offline scorekeeper for your Rummy table.</Text>
      <PrimaryButton label="Start new game" onPress={onStart} />
      <Pressable
        style={[styles.welcomeSecondaryButton, !hasGame && styles.welcomeSecondaryButtonDisabled]}
        onPress={onResume}
        disabled={!hasGame}
        accessibilityRole="button"
        accessibilityState={{ disabled: !hasGame }}
      >
        <Text style={[styles.welcomeSecondaryButtonText, !hasGame && styles.disabledText]}>Resume last game</Text>
      </Pressable>
      <Pressable onPress={onManagePlayers} style={styles.libraryLink} accessibilityRole="button"><Text style={styles.libraryLinkText}>Manage saved players</Text></Pressable>
      <Text style={styles.helper}>{hasGame ? "Your latest scorecard is ready to resume." : "Save player names now, then add them to a game in order."}</Text>
    </View>
  );
}
