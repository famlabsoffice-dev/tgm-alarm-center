import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
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
  alarmsForAccount,
  buildAlarm,
  localInputFromUtc,
  nextOccurrence,
  occurrenceKey,
  titleIsValid,
  validateDateTime,
} from './src/domain/alarm';
import { effectiveTierForAccount } from './src/domain/pricing';
import { updateAccountAlarm, deleteAccountAlarm, toggleAccountAlarm, completeAccountOccurrence } from './src/domain/accountAlarmActions';
import { exportBackup, restoreBackup } from './src/backup/backup';
import { emptyState, loadState, saveState } from './src/storage/store';
import {
  NotificationReadiness,
  initializeNotifications,
  registerCategories,
  scheduleLocalTestNotification,
} from './src/native/notifications';
import { reconcileAlarmNotifications } from './src/native/schedulerService';
import { AlarmCard } from './src/ui/screens/AlarmCard';
import { AlarmEditorModal, defaultEditor, type EditorValues } from './src/ui/screens/AlarmEditorModal';
import { CommandCenterScreen } from './src/ui/screens/CommandCenterScreen';
import { SettingsScreen } from './src/ui/screens/SettingsScreen';

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


;

function readinessText(readiness: NotificationReadiness): string {
  if (!readiness.supported) return 'Gerätetest erforderlich';
  if (!readiness.permission) return 'Berechtigung fehlt';
  if (!readiness.channel && Platform.OS === 'android') return 'Kanal fehlt';
  return 'Bereit';
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
      await reconcileAlarmNotifications(state.alarms, state.notificationPreferences);
      if (cancelled || generation !== notificationGeneration.current) return;
    };
    reconcile().catch(() => setStorageError('Benachrichtigungen konnten nicht neu geplant werden.'));
    return () => { cancelled = true; };
  }, [state.alarms, state.notificationPreferences, readiness.permission, readiness.supported, ready]);

  const openAlarmFromNotification = useCallback((alarmId: string, accountId: string | null): void => {
    if (!accountId) {
      Alert.alert('Alarm nicht verfügbar', 'Der Account-Kontext für diesen Alarm fehlt.');
      return;
    }
    const alarm = state.alarms.find((item) => item.id === alarmId && item.accountId === accountId);
    if (!alarm) {
      Alert.alert('Alarm nicht verfügbar', 'Der angeforderte Alarm gehört nicht zum angegebenen Account oder existiert nicht mehr.');
      return;
    }
    setEditingId(alarm.id);
    const input = localInputFromUtc(alarm.eventAtUtc);
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
  }, [state.alarms]);

  const completeFromNotification = useCallback((response: Notifications.NotificationResponse | null) => {
    const data = response?.notification.request.content.data as { alarmId?: unknown; accountId?: unknown; eventTime?: unknown; kind?: unknown } | undefined;
    if (!data || typeof data.alarmId !== 'string' || typeof data.accountId !== 'string') return;
    if (data.kind === 'local-test') return;
    if (response?.actionIdentifier === 'open') {
      openAlarmFromNotification(data.alarmId, data.accountId);
      return;
    }
    if (response?.actionIdentifier !== 'done' || typeof data.eventTime !== 'string') return;
    const event = new Date(data.eventTime);
    if (!Number.isFinite(event.getTime())) return;
    setState((current) => ({
      ...current,
      alarms: completeAccountOccurrence(current.alarms, data.accountId as string, data.alarmId as string, occurrenceKey(data.alarmId as string, event), nowIso()),
    }));
  }, [openAlarmFromNotification]);

  useEffect(() => {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(completeFromNotification);
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as { kind?: unknown } | undefined;
      if (data?.kind !== 'local-test') return;
      setState((current) => ({ ...current, testConfirmedAt: nowIso() }));
      Alert.alert('Notification-Test erfolgreich', 'Die lokale Benachrichtigung wurde vom Gerät empfangen.');
    });
    Notifications.getLastNotificationResponseAsync().then(completeFromNotification).catch(() => undefined);
    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [completeFromNotification]);

  const visibleAlarms = useMemo(() => alarmsForAccount(state.alarms, state.activeAccountId), [state.alarms, state.activeAccountId]);

  const next = useMemo(() => visibleAlarms
    .map((alarm) => ({ alarm, event: nextOccurrence(alarm, new Date(now)) }))
    .filter((item): item is { alarm: Alarm; event: Date } => item.event !== null)
    .sort((a, b) => a.event.getTime() - b.event.getTime())[0] ?? null, [visibleAlarms, now]);

  const activeAccount = state.accounts.find((account) => account.id === state.activeAccountId) ?? null;
  const confirmStoreTier = useCallback((tier: Tier): void => {
    setState((current) => current.tier === tier ? current : { ...current, tier });
  }, []);
  const effectiveAppTier = effectiveTierForAccount(state.tier, activeAccount?.name ?? '');
  const tierLimit = TIER_LIMITS[effectiveAppTier].alarms;
  const alarmLimitText = Number.isFinite(tierLimit) ? `${state.alarms.length}/${tierLimit}` : `${state.alarms.length}`;

  const openEdit = (alarm: Alarm): void => {
    if (!activeAccount || alarm.accountId !== activeAccount.id) return;
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
      Alert.alert('Limit erreicht', 'Dein aktueller Plan erlaubt keine weiteren Alarme. Öffne die Planansicht für mehr Spielraum.');
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
        const accountId = ensured.accountId;
        return {
          ...ensured.state,
          alarms: updateAccountAlarm(ensured.state.alarms, accountId, editingId, (alarm) => ({
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
          })),
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
    const accountId = activeAccount?.id ?? state.activeAccountId;
    setState((current) => ({ ...current, alarms: toggleAccountAlarm(current.alarms, accountId, alarmId, nowIso()) }));
  };

  const completeAlarm = (alarm: Alarm): void => {
    const accountId = activeAccount?.id ?? state.activeAccountId;
    if (!accountId || alarm.accountId !== accountId) return;
    const event = nextOccurrence(alarm, new Date(now));
    if (!event) return;
    setState((current) => ({
      ...current,
      alarms: completeAccountOccurrence(current.alarms, accountId, alarm.id, occurrenceKey(alarm.id, event), nowIso()),
    }));
  };

  const deleteAlarm = (alarm: Alarm): void => {
    const accountId = activeAccount?.id ?? state.activeAccountId;
    if (!accountId || alarm.accountId !== accountId) return;
    Alert.alert('Alarm löschen?', alarm.title, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => setState((current) => ({ ...current, alarms: deleteAccountAlarm(current.alarms, accountId, alarm.id) })) },
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

  const runDeviceTest = async (): Promise<void> => {
    if (!readiness.supported || !readiness.permission) {
      Alert.alert('Notification-Test nicht möglich', 'Aktiviere zuerst die Benachrichtigungsberechtigung auf dem Gerät.');
      return;
    }
    try {
      await scheduleLocalTestNotification();
      Alert.alert('Notification-Test geplant', 'Das Gerät sendet die lokale Testbenachrichtigung in Kürze. Der Status wird nach dem tatsächlichen Empfang bestätigt.');
    } catch (error: unknown) {
      Alert.alert('Notification-Test fehlgeschlagen', error instanceof Error ? error.message : 'Der lokale Test konnte nicht geplant werden.');
    }
  };

;

  if (!ready) return <CommandCenterScreen><View style={styles.loading}><Text style={styles.brand}>TGM ALARM CENTER</Text><Text style={styles.muted}>Wird geladen …</Text></View></CommandCenterScreen>;

  return (
    <CommandCenterScreen>
      <FlatList
        data={visibleAlarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AlarmCard alarm={item} now={now} onEdit={openEdit} onToggle={toggleAlarm} onComplete={completeAlarm} onDelete={deleteAlarm} />}
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
              <View style={styles.statCard}><Text style={styles.eyebrow}>BUBBLE ALARM</Text><Text style={styles.statValue}>{visibleAlarms.filter((alarm) => alarm.repeat === 'gw5d' && alarm.active).length}</Text><Text style={styles.muted}>Massacre Alarm-Zyklen aktiv</Text></View>
              <View style={styles.statCard}><Text style={styles.eyebrow}>NOTIFICATIONS</Text><Text style={[styles.statValue, readiness.permission ? styles.mintText : styles.warningText]}>{readinessText(readiness)}</Text><Text style={styles.muted}>{readiness.exactAlarm ? 'Exact Alarm geprüft' : 'Exakte Alarmberechtigung nicht verifiziert'}</Text></View>
            </View>
            <Text style={styles.sectionTitle}>Schnellstart</Text>
            <View style={styles.templateGrid}>
              {(['bubble', 'gwBubble', 'custom', 'individual', 'rss'] as TemplateKey[]).map((key) => <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${TEMPLATES[key].title} erstellen`} hitSlop={8} onPress={() => quickCreate(key)} style={({ pressed }) => [styles.templateCard, pressed && styles.pressed]}><Text style={styles.templateTitle}>{TEMPLATES[key].title}</Text><Text style={styles.muted}>{key === 'bubble' || key === 'gwBubble' ? 'Siren' : key === 'rss' ? 'Chime' : 'Pulse'}</Text></Pressable>)}
            </View>
            <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>Deine Alarme</Text><Text style={styles.muted}>{visibleAlarms.length} gespeichert</Text></View>
          </View>
        }
        ListEmptyComponent={<View style={styles.emptyCard}><Text style={styles.emptyTitle}>Noch kein Alarm angelegt</Text><Text style={styles.muted}>Nutze einen Schnellstart oder erstelle einen Event Alarm.</Text></View>}
        ListFooterComponent={
          <SettingsScreen
            storageError={storageError}
            notificationPreferences={state.notificationPreferences}
            currentTier={state.tier}
            showBilling={Platform.OS !== 'web'}
            onUpdatePreference={updatePreference}
            onTierConfirmed={confirmStoreTier}
            onExportBackup={exportCurrentBackup}
            onImportBackup={importBackup}
            onDeviceTest={runDeviceTest}
          />
        }
      />
      <AlarmEditorModal
        visible={editorVisible}
        editingId={editingId}
        editor={editor}
        onChange={setEditor}
        onClose={() => setEditorVisible(false)}
        onSave={saveEditor}
      />
    </CommandCenterScreen>
  );
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
  templateCard: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 14, padding: 15, minHeight: 48 },
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
  secondaryButton: { backgroundColor: COLORS.cardAlt, borderColor: '#444C55', borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, minHeight: 44 },
  secondaryButtonText: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  doneButton: { backgroundColor: COLORS.mint, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, minHeight: 44 },
  doneButtonText: { color: '#10150D', fontSize: 12, fontWeight: '900' },
  iconButton: { backgroundColor: '#3B1D20', borderColor: '#66312E', borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6, minHeight: 44 },
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
  closeButton: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardAlt },
  closeText: { color: COLORS.muted, fontSize: 25 },
  fieldLabel: { color: '#CDD3D8', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#0F1419', color: '#FFF', borderColor: '#3C4650', borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, minHeight: 45 },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { backgroundColor: '#12171D', borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, minHeight: 44 },
  choiceActive: { borderColor: COLORS.gold, backgroundColor: '#2B2416' },
  choiceText: { color: COLORS.text, fontSize: 11, fontWeight: '800' },
  switchLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 12 },
  switchLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  primaryButton: { backgroundColor: COLORS.gold, borderRadius: 12, alignItems: 'center', paddingVertical: 14, minHeight: 48, marginTop: 10 },
  primaryButtonText: { color: '#1B160D', fontSize: 15, fontWeight: '900' },
});
