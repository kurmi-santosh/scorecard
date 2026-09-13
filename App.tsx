import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, SafeAreaView, StatusBar as NativeStatusBar, Text, View } from "react-native";
import { DEFAULT_RULES, DEFAULT_RULES_STORAGE_KEY, makeId, MAX_PLAYER_NAME_LENGTH, MAX_PLAYERS, PLAYERS_STORAGE_KEY, STORAGE_KEY } from "./src/constants";
import { PlayerLibraryModal } from "./src/components/modals/PlayerLibraryModal";
import { RejoinModal } from "./src/components/modals/RejoinModal";
import { RoundModal } from "./src/components/modals/RoundModal";
import { SettingsModal } from "./src/components/modals/SettingsModal";
import { SetupModal } from "./src/components/modals/SetupModal";
import { getCardDistributorPlayerId, getCurrentOpenCardPlayerId, getLegacyOpenCardPlayerId, getNextOpenCardPlayerId, getRejoinEligiblePlayerIds, rebuildPlayers, rejoinPlayerAtScore } from "./src/domain/game";
import { getRulesError, getRulesFromDraft, getScoreForKind, normalizeRules, toRulesDraft } from "./src/domain/rules";
import { DraftEntry, Game, Player, Round, RoundEntry, Rules, RulesDraft, SavedPlayer } from "./src/domain/types";
import { ScoreboardScreen } from "./src/screens/ScoreboardScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { styles } from "./src/styles";

export default function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHome, setShowHome] = useState(true);
  const [setupVisible, setSetupVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [playerLibraryVisible, setPlayerLibraryVisible] = useState(false);
  const [rejoinVisible, setRejoinVisible] = useState(false);
  const [roundVisible, setRoundVisible] = useState(false);
  const [newGameConfirmationVisible, setNewGameConfirmationVisible] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [savedPlayers, setSavedPlayers] = useState<SavedPlayer[]>([]);
  const [defaultRules, setDefaultRules] = useState<Rules>(DEFAULT_RULES);
  const [draftNames, setDraftNames] = useState([""]);
  const [draftRules, setDraftRules] = useState<RulesDraft>(toRulesDraft(DEFAULT_RULES));
  const [settingsDraft, setSettingsDraft] = useState<RulesDraft>(toRulesDraft(DEFAULT_RULES));
  const [setupError, setSetupError] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [playerLibraryName, setPlayerLibraryName] = useState("");
  const [playerLibraryError, setPlayerLibraryError] = useState("");
  const [roundError, setRoundError] = useState("");
  const [roundDraft, setRoundDraft] = useState<Record<string, DraftEntry>>({});

  useEffect(() => {
    void (async () => {
      try {
        const [storedGame, storedPlayers, storedDefaultRules] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(PLAYERS_STORAGE_KEY),
          AsyncStorage.getItem(DEFAULT_RULES_STORAGE_KEY),
        ]);
        const restoredDefaults = storedDefaultRules ? normalizeRules(JSON.parse(storedDefaultRules) as Partial<Rules>) : DEFAULT_RULES;
        const parsedGame = storedGame ? (JSON.parse(storedGame) as Game) : null;
        const restoredGame = parsedGame
          ? {
              ...parsedGame,
              rules: normalizeRules(parsedGame.rules),
              openCardPlayerId: parsedGame.openCardPlayerId ?? getLegacyOpenCardPlayerId(parsedGame.players, parsedGame.rounds),
            }
          : null;
        const restoredPlayers = storedPlayers ? (JSON.parse(storedPlayers) as SavedPlayer[]) : [];
        const savedNames = new Set(restoredPlayers.map((player) => player.name.toLocaleLowerCase()));
        const playersFromGame = (restoredGame?.players ?? [])
          .map((player) => player.name.trim())
          .filter((name) => name && !savedNames.has(name.toLocaleLowerCase()))
          .map((name) => ({ id: makeId(), name }));
        const nextSavedPlayers = [...restoredPlayers, ...playersFromGame];

        if (restoredGame) setGame(restoredGame);
        if (nextSavedPlayers.length) setSavedPlayers(nextSavedPlayers);
        setDefaultRules(restoredDefaults);
        if (playersFromGame.length) await AsyncStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(nextSavedPlayers));
      } catch {
        Alert.alert("Scorecard", "Your saved game could not be restored.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (nextGame: Game | null) => {
    setGame(nextGame);
    try {
      if (nextGame) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextGame));
      else await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      Alert.alert("Saved locally", "The screen updated, but local saving was unavailable.");
    }
  };

  const persistSavedPlayers = async (names: string[]) => {
    const existingNames = new Set(savedPlayers.map((player) => player.name.toLocaleLowerCase()));
    const additions = names
      .map((name) => name.trim())
      .filter((name) => name && !existingNames.has(name.toLocaleLowerCase()))
      .map((name) => ({ id: makeId(), name }));
    if (!additions.length) return;

    const nextPlayers = [...savedPlayers, ...additions];
    setSavedPlayers(nextPlayers);
    try {
      await AsyncStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(nextPlayers));
    } catch {
      Alert.alert("Saved on this device", "The player was added for this session, but could not be saved for later.");
    }
  };

  const rankedPlayers = useMemo(
    () => game ? [...game.players].sort((a, b) => a.total - b.total || a.seat - b.seat) : [],
    [game],
  );

  const openSetup = () => {
    setDraftNames([""]);
    setDraftRules(toRulesDraft(defaultRules));
    setSetupError("");
    setSetupVisible(true);
  };

  const openNewGame = () => {
    if (!game) {
      openSetup();
      return;
    }
    setNewGameConfirmationVisible(true);
  };

  const openSettings = () => {
    setSettingsDraft(toRulesDraft(defaultRules));
    setSettingsError("");
    setSettingsVisible(true);
  };

  const openPlayerLibrary = () => {
    setPlayerLibraryName("");
    setPlayerLibraryError("");
    setPlayerLibraryVisible(true);
  };

  const updateName = (index: number, value: string) => {
    setDraftNames((names) => names.map((name, position) => (position === index ? value.slice(0, MAX_PLAYER_NAME_LENGTH) : name)));
  };

  const addPlayer = () => {
    if (draftNames.length < MAX_PLAYERS) setDraftNames((names) => [...names, ""]);
  };

  const removePlayer = (index: number) => {
    if (draftNames.length > 1) setDraftNames((names) => names.filter((_, position) => position !== index));
  };

  const addSavedPlayerToGame = (name: string) => {
    setDraftNames((names) => {
      if (names.some((candidate) => candidate.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) return names;
      const firstEmptySeat = names.findIndex((candidate) => !candidate.trim());
      if (firstEmptySeat >= 0) return names.map((candidate, index) => (index === firstEmptySeat ? name : candidate));
      return names.length < MAX_PLAYERS ? [...names, name] : names;
    });
  };

  const savePlayerToLibrary = () => {
    const name = playerLibraryName.trim();
    if (!name) {
      setPlayerLibraryError("Enter a player name first.");
      return;
    }
    if (savedPlayers.some((player) => player.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setPlayerLibraryError("That player is already saved.");
      return;
    }
    void persistSavedPlayers([name]);
    setPlayerLibraryName("");
    setPlayerLibraryError("");
  };

  const deleteSavedPlayer = (playerId: string) => {
    const player = savedPlayers.find((candidate) => candidate.id === playerId);
    if (!player) return;

    Alert.alert("Delete saved player?", `${player.name} will be removed from saved players. Games already in progress are unchanged.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const nextPlayers = savedPlayers.filter((candidate) => candidate.id !== playerId);
          setSavedPlayers(nextPlayers);
          void AsyncStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(nextPlayers)).catch(() => {
            Alert.alert("Player removed", "The player was removed for this session, but the update could not be saved for later.");
          });
        },
      },
    ]);
  };

  const saveDefaultRules = () => {
    const nextRules = getRulesFromDraft(settingsDraft);
    const rulesError = getRulesError(nextRules);
    if (rulesError) {
      setSettingsError(rulesError);
      return;
    }
    setDefaultRules(nextRules);
    void (async () => {
      try {
        await AsyncStorage.setItem(DEFAULT_RULES_STORAGE_KEY, JSON.stringify(nextRules));
      } catch {
        Alert.alert("Settings updated", "The new defaults work for this session, but could not be saved for later.");
      }
    })();
    setSettingsVisible(false);
  };

  const startGame = () => {
    const names = draftNames.map((name) => name.trim());
    const rules = getRulesFromDraft(draftRules);
    if (names.length < 2) {
      setSetupError("Add at least two players to start a game.");
      return;
    }
    if (names.some((name) => !name)) {
      setSetupError("Enter a name for every seat.");
      return;
    }
    if (new Set(names.map((name) => name.toLocaleLowerCase())).size !== names.length) {
      setSetupError("Use a different name for each player.");
      return;
    }
    const rulesError = getRulesError(rules);
    if (rulesError) {
      setSetupError(rulesError);
      return;
    }

    const players: Player[] = names.map((name, index) => ({ id: makeId(), name, seat: index + 1, total: 0, eliminated: false }));
    const nextGame: Game = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      rules,
      players,
      rounds: [],
      status: "active",
      openCardPlayerId: players[1]?.id ?? players[0]?.id ?? null,
    };
    void persistSavedPlayers(names);
    void persist(nextGame);
    setSetupVisible(false);
    setShowHome(false);
  };

  const openRound = () => {
    if (!game || game.status === "complete") return;
    const nextDraft: Record<string, DraftEntry> = {};
    game.players.filter((player) => !player.eliminated).forEach((player) => { nextDraft[player.id] = { kind: null, score: "" }; });
    setRoundDraft(nextDraft);
    setRoundError("");
    setEditingRound(null);
    setRoundVisible(true);
  };

  const openLastRoundEditor = () => {
    if (!game?.rounds.length) return;
    const lastRound = game.rounds[game.rounds.length - 1];
    const nextDraft: Record<string, DraftEntry> = {};
    lastRound.entries.forEach((entry) => { nextDraft[entry.playerId] = { kind: entry.kind, score: String(entry.score) }; });
    setRoundDraft(nextDraft);
    setRoundError("");
    setEditingRound(lastRound);
    setRoundVisible(true);
  };

  const updateRoundDraft = (playerId: string, update: Partial<DraftEntry>) => {
    setRoundDraft((draft) => {
      const updatedDraft = { ...draft };
      if (update.kind === "winner") {
        Object.keys(updatedDraft).forEach((id) => {
          if (id !== playerId && updatedDraft[id]?.kind === "winner") updatedDraft[id] = { ...updatedDraft[id], kind: null, score: "" };
        });
      }
      return { ...updatedDraft, [playerId]: { ...updatedDraft[playerId], ...update } };
    });
  };

  const saveRound = () => {
    if (!game) return;
    const roundPlayers = editingRound
      ? game.players.filter((player) => editingRound.entries.some((entry) => entry.playerId === player.id))
      : game.players.filter((player) => !player.eliminated);
    const playersMissingScores = roundPlayers.filter((player) => {
      const draft = roundDraft[player.id];
      return !draft?.kind || (draft.kind === "manual" && !draft.score.trim());
    });
    if (playersMissingScores.length) {
      setRoundError(`Add a score for ${playersMissingScores.map((player) => player.name).join(", ")}.`);
      return;
    }

    const winners = roundPlayers.filter((player) => roundDraft[player.id]?.kind === "winner");
    if (winners.length !== 1) {
      setRoundError("Choose exactly one round winner.");
      return;
    }

    const entries: RoundEntry[] = [];
    for (const player of roundPlayers) {
      const draft = roundDraft[player.id];
      const score = draft ? getScoreForKind(draft, game.rules) : Number.NaN;
      if (draft?.kind === "manual" && (!Number.isSafeInteger(score) || score <= 0 || score >= game.rules.fullScore)) {
        setRoundError(`Enter a positive score below ${game.rules.fullScore} for ${player.name}.`);
        return;
      }
      if (!Number.isInteger(score) || score < 0 || score > game.rules.maxScore) {
        setRoundError(`Enter a score from 0 to ${game.rules.maxScore} for ${player.name}.`);
        return;
      }
      entries.push({ playerId: player.id, kind: draft!.kind!, score });
    }

    const round: Round = editingRound
      ? { ...editingRound, entries }
      : {
          id: makeId(),
          number: game.rounds.length + 1,
          savedAt: new Date().toISOString(),
          dealerPlayerId: getCardDistributorPlayerId(game.players, game.openCardPlayerId),
          entries,
        };
    const rounds = editingRound
      ? game.rounds.map((existingRound) => existingRound.id === round.id ? round : existingRound)
      : [...game.rounds, round];
    const players = rebuildPlayers(game.players, rounds, game.rules);
    const remainingPlayers = players.filter((player) => !player.eliminated);
    const openCardPlayerId = editingRound
      ? getCurrentOpenCardPlayerId(players, game.openCardPlayerId)
      : getNextOpenCardPlayerId(players, game.openCardPlayerId);
    void persist({ ...game, players, rounds, status: remainingPlayers.length <= 1 ? "complete" : "active", openCardPlayerId });
    setRoundVisible(false);
    setEditingRound(null);
  };

  const rejoinPlayer = (playerId: string) => {
    if (!game) return;
    const player = game.players.find((candidate) => candidate.id === playerId);
    const eligiblePlayerIds = getRejoinEligiblePlayerIds(game.players, game.rounds, game.rules);
    if (!player?.eliminated || !eligiblePlayerIds.includes(playerId)) return;
    const otherActivePlayers = game.players.filter((candidate) => candidate.id !== playerId && !candidate.eliminated);
    const rejoinScore = otherActivePlayers.length ? Math.max(...otherActivePlayers.map((candidate) => candidate.total)) + 1 : 0;
    if (rejoinScore >= game.rules.maxScore) {
      Alert.alert("Cannot rejoin yet", `The rejoin score would be ${rejoinScore}, which reaches the elimination score.`);
      return;
    }

    const lastRound = game.rounds[game.rounds.length - 1];
    if (!lastRound) return;
    const players = rejoinPlayerAtScore(game.players, playerId, rejoinScore, lastRound.id);
    void persist({ ...game, players, status: "active", openCardPlayerId: getCurrentOpenCardPlayerId(players, game.openCardPlayerId) });
    setRejoinVisible(false);
  };

  if (loading) {
    return <SafeAreaView style={styles.safeArea}><StatusBar style="light" /><View style={styles.loading}><Text style={styles.loadingText}>Loading Scorecard…</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={[styles.safeArea, Platform.OS === "android" && { paddingTop: NativeStatusBar.currentHeight ?? 0 }]}>
      <StatusBar style="light" />
      {game && !showHome ? (
        <ScoreboardScreen
          game={game}
          rankedPlayers={rankedPlayers}
          historyVisible={historyVisible}
          onToggleHistory={() => setHistoryVisible((visible) => !visible)}
          onAddRound={openRound}
          onNewGame={openNewGame}
          onOpenSettings={openSettings}
          onOpenRejoin={() => setRejoinVisible(true)}
          onEditLastRound={openLastRoundEditor}
        />
      ) : <WelcomeScreen hasGame={Boolean(game)} onStart={openNewGame} onResume={() => setShowHome(false)} onManagePlayers={openPlayerLibrary} />}

      <SetupModal visible={setupVisible} names={draftNames} rules={draftRules} error={setupError} onClose={() => setSetupVisible(false)} onNameChange={updateName} onAddPlayer={addPlayer} onRemovePlayer={removePlayer} savedPlayers={savedPlayers} onAddSavedPlayer={addSavedPlayerToGame} onRulesChange={(key, value) => setDraftRules((rules) => ({ ...rules, [key]: value }))} onStart={startGame} />
      <SettingsModal visible={settingsVisible} rules={settingsDraft} players={savedPlayers} error={settingsError} onClose={() => setSettingsVisible(false)} onRulesChange={(key, value) => { setSettingsDraft((rules) => ({ ...rules, [key]: value })); setSettingsError(""); }} onSave={saveDefaultRules} onManagePlayers={() => { setSettingsVisible(false); openPlayerLibrary(); }} />
      <PlayerLibraryModal visible={playerLibraryVisible} name={playerLibraryName} players={savedPlayers} error={playerLibraryError} onClose={() => setPlayerLibraryVisible(false)} onNameChange={(name) => { setPlayerLibraryName(name.slice(0, MAX_PLAYER_NAME_LENGTH)); setPlayerLibraryError(""); }} onSave={savePlayerToLibrary} onDelete={deleteSavedPlayer} />
      {game && <RejoinModal visible={rejoinVisible} game={game} onClose={() => setRejoinVisible(false)} onRejoin={rejoinPlayer} />}
      {game && <RoundModal visible={roundVisible} game={game} draft={roundDraft} error={roundError} roundToEdit={editingRound} onClose={() => { setRoundVisible(false); setEditingRound(null); }} onChange={updateRoundDraft} onSave={saveRound} />}
      <Modal transparent visible={newGameConfirmationVisible} animationType="fade" onRequestClose={() => setNewGameConfirmationVisible(false)}>
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationCard} accessibilityViewIsModal>
            <Text style={styles.confirmationTitle}>Start a new game?</Text>
            <Text style={styles.confirmationCopy}>Your current game stays saved while you set up the new table. Starting the new scorecard will then replace it.</Text>
            <View style={styles.confirmationActions}>
              <Pressable style={[styles.confirmationAction, styles.confirmationCancel]} onPress={() => setNewGameConfirmationVisible(false)} accessibilityRole="button"><Text style={styles.confirmationCancelText}>Cancel</Text></Pressable>
              <Pressable style={[styles.confirmationAction, styles.confirmationContinue]} onPress={() => { setNewGameConfirmationVisible(false); openSetup(); }} accessibilityRole="button"><Text style={styles.confirmationContinueText}>Continue</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
