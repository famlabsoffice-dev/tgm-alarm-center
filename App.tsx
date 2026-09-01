import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  Alarm,
  AlarmTemplate,
  AppState,
  Tier,
  TEMPLATES,
  TIER_LIMITS,
  alarmTypeLabel,
  buildAlarm,
  localInputFromUtc,
  momentLabel,
  nextOccurrence,
  occurrenceKey,
  repeatLabel,
  titleIsValid,
  upcomingMoments,
  validateDateTime,
} from './src/domain/alarm';
import { effectiveTierForAccount } from './src/domain/pricing';
import { BillingPanel } from './src/billing/BillingPanel';
import { exportBackup, restoreBackup } from './src/backup/backup';
import { emptyState, loadState, saveState } from './src/storage/store';
import {
  NotificationReadiness,
  cancelAllScheduled,
  initializeNotifications,
  registerCategories,
  scheduleAlarm,
} from './src/native/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const COLORS = {
  background: '#090C12',
  panel: '#171B21',
  card: '#1E242B',
  cardAlt: '#252C34',
  border: '#38414A',
  text: '#EAE6D8',
  muted: '#9BA0A5',
  gold: '#F0C76A',
  mint: '#79C95B',
  danger: '#D65A50',
  blue: '#58B7E8',
};

const nowIso = (): string => new Date().toISOString();
const makeId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const localDate = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const localTime = (date: Date): string => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const formatDateTime = (date: Date): string => date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const formatCountdown = (date: Date, now: number): string => {
  const remaining = Math.max(0, date.getTime() - now);
  if (remaining < 60_000) return `${Math.max(0, Math.floor(remaining / 1000))} Sek.`;
  const minutes = Math.floor(remaining / 60_000);
  if (minutes < 60) return `${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} Std. · ${minutes % 60} Min.`;
  return `${Math.floor(hours / 24)} Tage · ${hours % 24} Std.`;
};

type TemplateKey = keyof typeof TEMPLATES;

type EditorValues = {
  type: Alarm['type'];
  title: string;
  date: string;
  time: string;
  warnings: number[];
  repeat: Alarm['repeat'];
  sound: Alarm['sound'];
  protected: boolean;
};

const defaultEditor = (template: AlarmTemplate): EditorValues => {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  return {
    type: template.type,
    title: template.title,
    date: localDate(date),
    time: localTime(date),
    warnings: [...template.warnings],
    repeat: template.repeat,
    sound: template.sound,
    protected: template.protected,
  };
};

function readinessText(readiness: NotificationReadiness): string {
  if (!readiness.supported) return 'Gerätetest erforderlich';
  if (!readiness.permission) return 'Berechtigung fehlt';
  if (!readiness.channel && Platform.OS === 'android') return 'Kanal fehlt';
  return 'Bereit';
}

function isOccurrenceCompleted(alarm: Alarm, event: Date): boolean {
  return alarm.completedOccurrences[occurrenceKey(alarm.id, event)] === true;
}

export default function App() {
  const [state, setState] = useState<AppState>(emptyState());
  const [ready, setReady] = useState(false);
  const [readiness, setReadiness] = useState<NotificationReadiness>({ supported: false, permission: false, exactAlarm: false, channel: false });
  const [editorVisible, setEditorVisible] = useState(false);
  const [editor, setEditor] = useState<EditorValues>(() => defaultEditor(TEMPLATES.bubble));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [storageError, setStorageError] = useState<string | null>(null);
  const initialized = useRef(false);
  const notificationGeneration = useRef(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const loaded = await loadState();
      await registerCategories();
      const notificationState = await initializeNotifications();
      if (mounted) {
        setState(loaded);
        setReadiness(notificationState);
        setReady(true);
        initialized.current = true;
      }
    })().catch((error: unknown) => {
      if (mounted) Alert.alert('Startfehler', error instanceof Error ? error.message : 'Daten konnten nicht geladen werden.');
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!ready || !initialized.current) return;
    saveState(state).then(() => setStorageError(null)).catch(() => setStorageError('Änderungen konnten nicht dauerhaft gespeichert werden.'));
  }, [state, ready]);

  useEffect(() => {
    if (!ready || !readiness.supported || !readiness.permission) return;
    const generation = notificationGeneration.current + 1;
    notificationGeneration.current = generation;
    let cancelled = false;
    const reconcile = async (): Promise<void> => {
      if (cancelled || generation !== notificationGeneration.current) return;
      await cancelAllScheduled();
      if (cancelled || generation !== notificationGeneration.current) return;
      for (const alarm of state.alarms.filter((item) => item.active)) {
        if (cancelled || generation !== notificationGeneration.current) return;
        await scheduleAlarm(alarm, state.notificationPreferences);
      }
    };
    reconcile().catch(() => setStorageError('Benachrichtigungen konnten nicht neu geplant werden.'));
    return () => { cancelled = true; };
  }, [state.alarms, state.notificationPreferences, readiness.permission, readiness.supported, ready]);

  const completeFromNotification = useCallback((response: Notifications.NotificationResponse | null) => {
    const data = response?.notification.request.content.data as { alarmId?: unknown; eventTime?: unknown } | undefined;
    if (response?.actionIdentifier !== 'done' || typeof data?.alarmId !== 'string' || typeof data.eventTime !== 'string') return;
    const event = new Date(data.eventTime);
    if (!Number.isFinite(event.getTime())) return;
    setState((current) => ({
      ...current,
      alarms: current.alarms.map((alarm) => alarm.id === data.alarmId ? {
        ...alarm,
        completedOccurrences: { ...alarm.completedOccurrences, [occurrenceKey(alarm.id, event)]: true },
        updatedAt: nowIso(),
      } : alarm),
    }));
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(completeFromNotification);
    Notifications.getLastNotificationResponseAsync().then(completeFromNotification).catch(() => undefined);
    return () => subscription.remove();
  }, [completeFromNotification]);

  const next = useMemo(() => state.alarms
    .map((alarm) => ({ alarm, event: nextOccurrence(alarm, new Date(now)) }))
    .filter((item): item is { alarm: Alarm; event: Date } => item.event !== null)
    .sort((a, b) => a.event.getTime() - b.event.getTime())[0] ?? null, [state.alarms, now]);

  const activeAccount = state.accounts.find((account) => account.id === state.activeAccountId) ?? null;
  const confirmStoreTier = useCallback((tier: Tier): void => {
    setState((current) => current.tier === tier ? current : { ...current, tier });
  }, []);
  const effectiveAppTier = effectiveTierForAccount(state.tier, activeAccount?.name ?? '');
  const tierLimit = TIER_LIMITS[effectiveAppTier].alarms;
  const alarmLimitText = Number.isFinite(tierLimit) ? `${state.alarms.length}/${tierLimit}` : `${state.alarms.length}`;

  const openEdit = (alarm: Alarm): void => {
    const input = localInputFromUtc(alarm.eventAtUtc);
    setEditingId(alarm.id);
    setEditor({
      type: alarm.type,
      title: alarm.title,
      date: input.date,
      time: input.time,
      warnings: [...alarm.warnings],
      repeat: alarm.repeat,
      sound: alarm.sound,
      protected: alarm.protected,
    });
    setEditorVisible(true);
  };

  const createAccountIfNeeded = (current: AppState): { state: AppState; accountId: string } => {
    if (current.activeAccountId && current.accounts.some((account) => account.id === current.activeAccountId)) return { state: current, accountId: current.activeAccountId };
    const account = { id: makeId(), name: 'Mein TGM-Kommando', color: COLORS.gold, createdAt: nowIso() };
    return { state: { ...current, accounts: [...current.accounts, account], activeAccountId: account.id }, accountId: account.id };
  };

  const saveEditor = (): void => {
    const title = editor.title.trim();
    if (!titleIsValid(title)) {
      Alert.alert('Titel fehlt', 'Gib einen Titel mit 1 bis 80 Zeichen ein.');
      return;
    }
    if (!validateDateTime(editor.date, editor.time)) {
      Alert.alert('Zeitpunkt ungültig', 'Verwende ein gültiges Datum im Format JJJJ-MM-TT und eine Uhrzeit im Format HH:MM.');
      return;
    }
    const candidate = new Date(`${editor.date}T${editor.time}:00`);
    if (!editingId && editor.repeat === 'once' && candidate.getTime() <= Date.now()) {
      Alert.alert('Zeitpunkt liegt zurück', 'Ein einmaliger Alarm muss in der Zukunft liegen.');
      return;
    }
    if (!editingId && Number.isFinite(tierLimit) && state.alarms.length >= tierLimit) {
      Alert.alert('Limit erreicht', 'Dein aktueller Plan erlaubt keine weiteren Alarme.');
      return;
    }
    const activeAccountId = activeAccount?.id ?? state.activeAccountId;
    const accountAlarms = state.alarms.filter((alarm) => alarm.accountId === activeAccountId);
    const categoryCount = editor.type === 'bubble' || editor.type === 'gwBubble'
      ? accountAlarms.filter((alarm) => alarm.type === 'bubble' || alarm.type === 'gwBubble').length
      : editor.type === 'custom'
        ? accountAlarms.filter((alarm) => alarm.type === 'custom').length
        : editor.type === 'individual'
          ? accountAlarms.filter((alarm) => alarm.type === 'individual').length
          : accountAlarms.filter((alarm) => alarm.type === 'rss').length;
    const categoryLimit = editor.type === 'bubble' || editor.type === 'gwBubble'
      ? TIER_LIMITS[effectiveAppTier].perAccount.bubbleAlarms
      : editor.type === 'custom'
        ? TIER_LIMITS[effectiveAppTier].perAccount.eventAlarms
        : editor.type === 'individual'
          ? TIER_LIMITS[effectiveAppTier].perAccount.individualAlarms
          : TIER_LIMITS[effectiveAppTier].perAccount.rssAlarms;
    if (!editingId && Number.isFinite(categoryLimit) && categoryCount >= categoryLimit) {
      Alert.alert('Limit erreicht', `Dein aktueller Plan erlaubt ${categoryLimit} ${alarmTypeLabel(editor.type)} je Account.`);
      return;
    }
    setState((current) => {
      const ensured = createAccountIfNeeded(current);
      if (editingId) {
        return {
          ...ensured.state,
          alarms: ensured.state.alarms.map((alarm) => alarm.id === editingId ? {
            ...alarm,
            title,
            date: editor.date,
            time: editor.time,
            eventAtUtc: new Date(`${editor.date}T${editor.time}:00`).toISOString(),
            warnings: [...editor.warnings].sort((a, b) => b - a),
            repeat: editor.repeat,
            sound: editor.sound,
            protected: editor.protected,
            updatedAt: nowIso(),
          } : alarm),
        };
      }
      const template: AlarmTemplate = {
        title,
        type: editor.type,
        warnings: [...editor.warnings],
        repeat: editor.repeat,
        sound: editor.sound,
        protected: editor.protected,
      };
      const alarm = buildAlarm(template, ensured.accountId, editor.date, editor.time);
      return { ...ensured.state, alarms: [...ensured.state.alarms, alarm] };
    });
    setEditorVisible(false);
  };

  const quickCreate = (key: TemplateKey): void => {
    const template = TEMPLATES[key];
    setEditingId(null);
    setEditor(defaultEditor(template));
    setEditorVisible(true);
  };

  const toggleAlarm = (alarmId: string): void => {
    setState((current) => ({ ...current, alarms: current.alarms.map((alarm) => alarm.id === alarmId ? { ...alarm, active: !alarm.active, updatedAt: nowIso() } : alarm) }));
  };

  const completeAlarm = (alarm: Alarm): void => {
    const event = nextOccurrence(alarm, new Date(now));
    if (!event) return;
    setState((current) => ({
      ...current,
      alarms: current.alarms.map((item) => item.id === alarm.id ? { ...item, completedOccurrences: { ...item.completedOccurrences, [occurrenceKey(item.id, event)]: true }, updatedAt: nowIso() } : item),
    }));
  };

  const deleteAlarm = (alarm: Alarm): void => {
    Alert.alert('Alarm löschen?', alarm.title, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => setState((current) => ({ ...current, alarms: current.alarms.filter((item) => item.id !== alarm.id) })) },
    ]);
  };

  const updatePreference = <K extends keyof AppState['notificationPreferences']>(key: K, value: AppState['notificationPreferences'][K]): void => {
    setState((current) => ({ ...current, notificationPreferences: { ...current.notificationPreferences, [key]: value } }));
  };

  const exportCurrentBackup = (): void => {
    exportBackup(state).catch((error: unknown) => Alert.alert('Backup fehlgeschlagen', error instanceof Error ? error.message : 'Backup konnte nicht erstellt werden.'));
  };

  const importBackup = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const asset = result.assets.at(0);
      if (!asset) throw new Error('Keine Backup-Datei ausgewählt');
      const payload = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const restored = restoreBackup(payload);
      setState(restored);
      setEditorVisible(false);
      Alert.alert('Backup importiert', `${restored.alarms.length} Alarm${restored.alarms.length === 1 ? '' : 'e'} und ${restored.accounts.length} Account${restored.accounts.length === 1 ? '' : 's'} wurden wiederhergestellt.`);
    } catch (error: unknown) {
      Alert.alert('Backup ungültig', error instanceof Error ? error.message : 'Die Datei konnte nicht wiederhergestellt werden.');
    }
  };

  const renderAlarm = ({ item }: { item: Alarm }): React.ReactElement => {
    const event = nextOccurrence(item, new Date(now));
    const moments = upcomingMoments(item, new Date(now));
    const completed = event ? isOccurrenceCompleted(item, event) : false;
    return (
      <View style={styles.alarmCard}>
        <View style={styles.alarmHeader}>
          <View style={styles.flex}>
            <Text style={styles.alarmTitle}>{item.title}</Text>
            <Text style={styles.muted}>{alarmTypeLabel(item.type)} · {repeatLabel(item.repeat)}</Text>
          </View>
          <View style={[styles.statusPill, item.active ? styles.activePill : styles.pausedPill]}>
            <Text style={styles.statusText}>{item.active ? 'AKTIV' : 'PAUSIERT'}</Text>
          </View>
        </View>
        <View style={styles.badgeRow}>
          {item.protected ? <Text style={styles.badgeGold}>GESCHÜTZT</Text> : null}
          {item.repeat === 'gw5d' ? <Text style={styles.badgeBlue}>24 STD. BUBBLE</Text> : null}
          {moments[0] ? <Text style={styles.badgeNeutral}>{momentLabel(moments[0])}</Text> : null}
        </View>
        <View style={styles.alarmTimeBox}>
          <Text style={styles.muted}>NÄCHSTER TERMIN</Text>
          <Text style={styles.alarmTime}>{event ? formatDateTime(event) : completed ? 'Für diesen Zyklus erledigt' : 'Kein zukünftiger Termin'}</Text>
          {event ? <Text style={styles.goldText}>{formatCountdown(event, now)}</Text> : null}
        </View>
        <View style={styles.actionRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${item.title} bearbeiten`} onPress={() => openEdit(item)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Bearbeiten</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`${item.title} ${item.active ? 'pausieren' : 'aktivieren'}`} onPress={() => toggleAlarm(item.id)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{item.active ? 'Pausieren' : 'Aktivieren'}</Text></Pressable>
          {event ? <Pressable accessibilityRole="button" accessibilityLabel={`${item.title} erledigen`} onPress={() => completeAlarm(item)} style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}><Text style={styles.doneButtonText}>Erledigt</Text></Pressable> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={`${item.title} löschen`} onPress={() => deleteAlarm(item)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Text style={styles.iconButtonText}>×</Text></Pressable>
        </View>
      </View>
    );
  };

  if (!ready) return <SafeAreaView style={styles.root}><View style={styles.loading}><Text style={styles.brand}>TGM ALARM CENTER</Text><Text style={styles.muted}>Wird geladen …</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={state.alarms}
        keyExtractor={(item) => item.id}
        renderItem={renderAlarm}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.topRow}>
              <View style={styles.flex}><Text style={styles.brand}>TGM ALARM CENTER</Text><Text style={styles.subtitle}>Persönliche Alarmzentrale</Text></View>
              <View style={styles.accountPill}><View style={styles.accountDot} /><Text style={styles.accountText}>{activeAccount?.name ?? 'Kein Account'}</Text></View>
            </View>
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>ALS NÄCHSTES</Text>
              {next ? <><Text style={styles.nextTitle}>{next.alarm.title}</Text><Text style={styles.nextTime}>{formatDateTime(next.event)}</Text><Text style={styles.countdown}>{formatCountdown(next.event, now)}</Text><Text style={styles.muted}>{alarmTypeLabel(next.alarm.type)} · {next.alarm.repeat === 'gw5d' ? 'Bubble Alarm aktiv ab Beginn' : 'Vorwarnungen aktiv'}</Text></> : <><Text style={styles.nextTitle}>Keine offenen Termine</Text><Text style={styles.muted}>Lege deinen nächsten TGM-Alarm an.</Text></>}
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}><Text style={styles.eyebrow}>ALARME</Text><Text style={styles.statValue}>{alarmLimitText}</Text><Text style={styles.muted}>im aktuellen Plan</Text></View>
              <View style={styles.statCard}><Text style={styles.eyebrow}>BUBBLE ALARM</Text><Text style={styles.statValue}>{state.alarms.filter((alarm) => alarm.repeat === 'gw5d' && alarm.active).length}</Text><Text style={styles.muted}>Massacre Alarm-Zyklen aktiv</Text></View>
              <View style={styles.statCard}><Text style={styles.eyebrow}>NOTIFICATIONS</Text><Text style={[styles.statValue, readiness.permission ? styles.mintText : styles.warningText]}>{readinessText(readiness)}</Text><Text style={styles.muted}>{readiness.exactAlarm ? 'Exact Alarm geprüft' : 'Exakte Alarmberechtigung nicht verifiziert'}</Text></View>
            </View>
            <Text style={styles.sectionTitle}>Schnellstart</Text>
            <View style={styles.templateGrid}>
              {(['bubble', 'gwBubble', 'custom', 'individual', 'rss'] as TemplateKey[]).map((key) => <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${TEMPLATES[key].title} erstellen`} onPress={() => quickCreate(key)} style={({ pressed }) => [styles.templateCard, pressed && styles.pressed]}><Text style={styles.templateTitle}>{TEMPLATES[key].title}</Text><Text style={styles.muted}>{key === 'bubble' || key === 'gwBubble' ? 'Siren' : key === 'rss' ? 'Chime' : 'Pulse'}</Text></Pressable>)}
            </View>
            <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>Deine Alarme</Text><Text style={styles.muted}>{state.alarms.length} gespeichert</Text></View>
          </View>
        }
        ListEmptyComponent={<View style={styles.emptyCard}><Text style={styles.emptyTitle}>Noch kein Alarm angelegt</Text><Text style={styles.muted}>Nutze einen Schnellstart oder erstelle einen Event Alarm.</Text></View>}
        ListFooterComponent={
          <View>
            {storageError ? <View style={styles.errorBanner}><Text style={styles.errorText}>{storageError}</Text></View> : null}
            <Text style={styles.sectionTitle}>Benachrichtigungen</Text>
            <View style={styles.settingsCard}>
              <SettingRow label="Vorwarnungen mit Ton" value={state.notificationPreferences.warningSound} onValueChange={(value) => updatePreference('warningSound', value)} />
              <SettingRow label="Hauptereignisse mit Ton" value={state.notificationPreferences.eventSound} onValueChange={(value) => updatePreference('eventSound', value)} />
              <SettingRow label="Vibration" value={state.notificationPreferences.vibration} onValueChange={(value) => updatePreference('vibration', value)} />
              <SettingRow label="Zeitkritische Hinweise" value={state.notificationPreferences.criticalAlerts} onValueChange={(value) => updatePreference('criticalAlerts', value)} />
            </View>
            {Platform.OS !== 'web' ? <BillingPanel currentTier={state.tier} onTierConfirmed={confirmStoreTier} /> : null}
            <View style={styles.actionRowFooter}>
              <Pressable accessibilityRole="button" onPress={exportCurrentBackup} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Backup exportieren</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={importBackup} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Backup importieren</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => Alert.alert('Notification-Test', readiness.permission ? 'Ein kurzer Gerätetest wird vorbereitet.' : 'Aktiviere zuerst die Benachrichtigungsberechtigung in den Geräteeinstellungen.')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Gerätetest</Text></Pressable>
            </View>
            <Text style={styles.footer}>UTC wird intern gespeichert · Anzeige in lokaler Gerätezeit · Schema 1</Text>
          </View>
        }
      />
      <Modal visible={editorVisible} animationType="slide" transparent onRequestClose={() => setEditorVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>{editingId ? 'Alarm bearbeiten' : 'Neuer Alarm'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Editor schließen" onPress={() => setEditorVisible(false)} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable></View>
            <Text style={styles.fieldLabel}>SCHNELLSTART-TYP</Text>
            <View style={styles.choiceRow}>
              {(['bubble', 'gwBubble', 'custom', 'individual', 'rss'] as TemplateKey[]).map((key) => <Pressable key={key} onPress={() => setEditor((current) => ({ ...current, ...defaultEditor(TEMPLATES[key]), title: current.title }))} style={[styles.choice, editor.type === TEMPLATES[key].type && styles.choiceActive]}><Text style={styles.choiceText}>{alarmTypeLabel(TEMPLATES[key].type)}</Text></Pressable>)}
            </View>
            <Text style={styles.fieldLabel}>BEZEICHNUNG</Text>
            <TextInput value={editor.title} onChangeText={(title) => setEditor((current) => ({ ...current, title }))} placeholder="z. B. Samstagabend Bubble Alarm" placeholderTextColor={COLORS.muted} maxLength={80} style={styles.input} returnKeyType="done" />
            <View style={styles.twoColumns}><View style={styles.column}><Text style={styles.fieldLabel}>DATUM</Text><TextInput value={editor.date} onChangeText={(date) => setEditor((current) => ({ ...current, date }))} placeholder="JJJJ-MM-TT" placeholderTextColor={COLORS.muted} keyboardType="numbers-and-punctuation" style={styles.input} /></View><View style={styles.column}><Text style={styles.fieldLabel}>UHRZEIT</Text><TextInput value={editor.time} onChangeText={(time) => setEditor((current) => ({ ...current, time }))} placeholder="HH:MM" placeholderTextColor={COLORS.muted} keyboardType="numbers-and-punctuation" style={styles.input} /></View></View>
            <Text style={styles.fieldLabel}>VORWARNUNGEN</Text>
            <View style={styles.choiceRow}>{[60, 30, 15].map((minutes) => <Pressable key={minutes} onPress={() => setEditor((current) => ({ ...current, warnings: current.warnings.includes(minutes) ? current.warnings.filter((item) => item !== minutes) : [...current.warnings, minutes] }))} style={[styles.choice, editor.warnings.includes(minutes) && styles.choiceActive]}><Text style={styles.choiceText}>{minutes} Min.</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>WIEDERHOLUNG</Text>
            <View style={styles.choiceRow}>{(['once', 'daily', 'gw5d'] as Alarm['repeat'][]).map((repeat) => <Pressable key={repeat} onPress={() => setEditor((current) => ({ ...current, repeat }))} style={[styles.choice, editor.repeat === repeat && styles.choiceActive]}><Text style={styles.choiceText}>{repeatLabel(repeat)}</Text></Pressable>)}</View>
            <View style={styles.switchLine}><Text style={styles.switchLabel}>Als geschützt markieren</Text><Switch value={editor.protected} onValueChange={(value) => setEditor((current) => ({ ...current, protected: value }))} trackColor={{ false: COLORS.border, true: '#60783D' }} thumbColor={editor.protected ? COLORS.mint : '#D0D6DB'} /></View>
            <Pressable accessibilityRole="button" onPress={saveEditor} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{editingId ? 'Änderungen speichern' : 'Alarm speichern'}</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function SettingRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }): React.ReactElement {
  return <View style={styles.settingRow}><Text style={styles.settingLabel}>{label}</Text><Switch value={value} onValueChange={onValueChange} trackColor={{ false: COLORS.border, true: '#60783D' }} thumbColor={value ? COLORS.mint : '#D0D6DB'} /></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  content: { padding: 18, paddingBottom: 40, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  flex: { flex: 1 },
  brand: { color: COLORS.gold, fontSize: 23, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: COLORS.muted, marginTop: 3 },
  accountPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderColor: COLORS.border, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, maxWidth: 150 },
  accountDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: COLORS.gold },
  accountText: { color: COLORS.text, fontSize: 11, fontWeight: '700', flexShrink: 1 },
  heroCard: { backgroundColor: COLORS.panel, borderColor: '#5A4A2C', borderWidth: 1, borderRadius: 18, padding: 20, marginBottom: 12 },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  nextTitle: { color: COLORS.text, fontSize: 24, fontWeight: '900', marginTop: 8 },
  nextTime: { color: COLORS.gold, fontSize: 16, fontWeight: '800', marginTop: 5 },
  countdown: { color: COLORS.gold, fontSize: 27, fontWeight: '900', marginTop: 8 },
  muted: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 9, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 14, padding: 13, minHeight: 90 },
  statValue: { color: COLORS.text, fontSize: 17, fontWeight: '900', marginTop: 7 },
  mintText: { color: COLORS.mint },
  warningText: { color: COLORS.gold },
  sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900', marginTop: 10, marginBottom: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  templateGrid: { gap: 9, marginBottom: 4 },
  templateCard: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 14, padding: 15 },
  templateTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900', marginBottom: 4 },
  alarmCard: { backgroundColor: COLORS.panel, borderColor: COLORS.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 10 },
  alarmHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  alarmTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  statusPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5 },
  activePill: { backgroundColor: '#17351B' },
  pausedPill: { backgroundColor: '#2A3036' },
  statusText: { color: COLORS.mint, fontSize: 9, fontWeight: '900' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  badgeGold: { color: '#F8D889', backgroundColor: '#231E13', borderColor: '#67532D', borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '900' },
  badgeBlue: { color: '#ABE0FB', backgroundColor: '#131F29', borderColor: '#2A5470', borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '900' },
  badgeNeutral: { color: COLORS.text, backgroundColor: '#141A20', borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '900' },
  alarmTimeBox: { backgroundColor: '#12171D', borderRadius: 12, padding: 12, marginTop: 12 },
  alarmTime: { color: COLORS.text, fontSize: 15, fontWeight: '800', marginTop: 4 },
  goldText: { color: COLORS.gold, fontSize: 14, fontWeight: '900', marginTop: 4 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  secondaryButton: { backgroundColor: COLORS.cardAlt, borderColor: '#444C55', borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9 },
  secondaryButtonText: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  doneButton: { backgroundColor: COLORS.mint, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  doneButtonText: { color: '#10150D', fontSize: 12, fontWeight: '900' },
  iconButton: { backgroundColor: '#3B1D20', borderColor: '#66312E', borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6 },
  iconButtonText: { color: '#FFB5AB', fontSize: 18, fontWeight: '700' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  emptyCard: { backgroundColor: COLORS.panel, borderColor: COLORS.border, borderWidth: 1, borderRadius: 16, padding: 25, alignItems: 'center', marginBottom: 10 },
  emptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900', marginBottom: 5 },
  settingsCard: { backgroundColor: COLORS.panel, borderColor: COLORS.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, marginBottom: 10 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 54, borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth },
  settingLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  actionRowFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  errorBanner: { backgroundColor: '#3B1D20', borderColor: '#66312E', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  errorText: { color: '#FFB5AB', fontSize: 12, fontWeight: '700' },
  footer: { color: '#6F7880', fontSize: 10, textAlign: 'center', marginTop: 25 },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.78)' },
  modalCard: { backgroundColor: '#181D24', borderColor: '#414B55', borderWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 30, maxHeight: '94%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  closeButton: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardAlt },
  closeText: { color: COLORS.muted, fontSize: 25 },
  fieldLabel: { color: '#CDD3D8', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#0F1419', color: '#FFF', borderColor: '#3C4650', borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, minHeight: 45 },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { backgroundColor: '#12171D', borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9 },
  choiceActive: { borderColor: COLORS.gold, backgroundColor: '#2B2416' },
  choiceText: { color: COLORS.text, fontSize: 11, fontWeight: '800' },
  switchLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 12 },
  switchLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  primaryButton: { backgroundColor: COLORS.gold, borderRadius: 12, alignItems: 'center', paddingVertical: 14, marginTop: 10 },
  primaryButtonText: { color: '#1B160D', fontSize: 15, fontWeight: '900' },
});
