import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { AppState, Platform } from 'react-native';
import { Alarm, NotificationMoment, NotificationPreferences, upcomingMoments } from '../domain/alarm';
import { buildNotificationPlan, NotificationPlanEntry } from './notificationSchedule';
import { getVolatileState, getVolatileStateRevision, loadState } from '../storage/store';
import { canScheduleExactAlarms, consumeRecoverySignals, openExactAlarmSettings } from '../../modules/tgm-exact-alarm';

export const CHANNEL_ID = 'time-critical-events-v2';
const SOUND_CHANNELS = { pulse: `${CHANNEL_ID}-pulse`, siren: `${CHANNEL_ID}-siren`, chime: `${CHANNEL_ID}-chime`, silent: `${CHANNEL_ID}-silent` } as const;
const NOTIFICATION_REGISTRY_KEY = 'tgm-alarm-center-notification-registry-v1';
type NotificationRegistry = Record<string, string>;
let lastReconciledRevision = -1;
let reconciliationQueue: Promise<void> = Promise.resolve();
let resumeSubscription: { remove: () => void } | null = null;

const soundFor = (sound: Alarm['sound']): string => sound === 'siren' ? 'alarm-siren.wav' : sound === 'chime' ? 'alarm-chime.wav' : 'alarm-pulse.wav';
export interface NotificationReadiness { supported: boolean; permission: boolean; exactAlarm: boolean; channel: boolean; recoveryPending?: boolean; }

async function ensureAndroidChannels(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    await Promise.all([
      Notifications.setNotificationChannelAsync(SOUND_CHANNELS.pulse, { name: 'Zeitkritische Ereignisse · Pulse', importance: Notifications.AndroidImportance.MAX, sound: 'alarm-pulse.wav', vibrationPattern: [0, 250, 150, 250], lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC }),
      Notifications.setNotificationChannelAsync(SOUND_CHANNELS.siren, { name: 'Zeitkritische Ereignisse · Siren', importance: Notifications.AndroidImportance.MAX, sound: 'alarm-siren.wav', vibrationPattern: [0, 250, 150, 250], lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC }),
      Notifications.setNotificationChannelAsync(SOUND_CHANNELS.chime, { name: 'Zeitkritische Ereignisse · Chime', importance: Notifications.AndroidImportance.MAX, sound: 'alarm-chime.wav', vibrationPattern: [0, 250, 150, 250], lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC }),
      Notifications.setNotificationChannelAsync(SOUND_CHANNELS.silent, { name: 'Zeitkritische Ereignisse · Ohne Ton', importance: Notifications.AndroidImportance.MAX, sound: null, vibrationPattern: [0, 250, 150, 250], lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC }),
    ]);
    const channels = await Promise.all([
      Notifications.getNotificationChannelAsync(SOUND_CHANNELS.pulse),
      Notifications.getNotificationChannelAsync(SOUND_CHANNELS.siren),
      Notifications.getNotificationChannelAsync(SOUND_CHANNELS.chime),
      Notifications.getNotificationChannelAsync(SOUND_CHANNELS.silent),
    ]);
    return channels.every(Boolean);
  } catch {
    return false;
  }
}

function channelFor(alarm: Alarm, soundEnabled: boolean): string | undefined {
  if (Platform.OS !== 'android') return undefined;
  if (!soundEnabled) return SOUND_CHANNELS.silent;
  return alarm.sound === 'siren' ? SOUND_CHANNELS.siren : alarm.sound === 'chime' ? SOUND_CHANNELS.chime : SOUND_CHANNELS.pulse;
}

export async function initializeNotifications(): Promise<NotificationReadiness> {
  if (!Device.isDevice || Platform.OS === 'web') return { supported: false, permission: false, exactAlarm: false, channel: false, recoveryPending: false };
  const channel = await ensureAndroidChannels();
  let permission = false;
  try {
    const current = await Notifications.getPermissionsAsync();
    permission = current.status === Notifications.PermissionStatus.GRANTED;
    if (!permission && current.status === Notifications.PermissionStatus.UNDETERMINED) permission = (await Notifications.requestPermissionsAsync()).status === Notifications.PermissionStatus.GRANTED;
  } catch {
    permission = false;
  }
  let exactAlarm = true;
  let recoveryPending = false;
  if (Platform.OS === 'android') {
    try {
      exactAlarm = await canScheduleExactAlarms();
      const signals = await consumeRecoverySignals();
      recoveryPending = signals.bootReconciliationNeeded || signals.exactAlarmPermissionChanged;
    } catch {
      exactAlarm = false;
    }
  }
  installResumeRecovery();
  return { supported: true, permission, exactAlarm, channel, recoveryPending };
}

function installResumeRecovery(): void {
  if (resumeSubscription || Platform.OS === 'web' || !Device.isDevice) return;
  resumeSubscription = AppState.addEventListener('change', (nextState) => {
    if (nextState !== 'active') return;
    void (async () => {
      const readiness = await initializeNotificationsForResume();
      if (!readiness.permission || !readiness.supported) return;
      const state = getVolatileState() ?? await loadState();
      const revision = getVolatileStateRevision();
      if (readiness.exactAlarm && (revision !== lastReconciledRevision || readiness.recoveryPending)) {
        await reconcileScheduledNotifications(state.alarms, state.notificationPreferences, revision);
      }
    })().catch(() => undefined);
  });
}

async function initializeNotificationsForResume(): Promise<NotificationReadiness> {
  const channel = await ensureAndroidChannels();
  let permission = false;
  try { permission = (await Notifications.getPermissionsAsync()).status === Notifications.PermissionStatus.GRANTED; } catch { permission = false; }
  let exactAlarm = true;
  let recoveryPending = false;
  if (Platform.OS === 'android') {
    try {
      exactAlarm = await canScheduleExactAlarms();
      const signals = await consumeRecoverySignals();
      recoveryPending = signals.bootReconciliationNeeded || signals.exactAlarmPermissionChanged;
    } catch { exactAlarm = false; }
  }
  return { supported: true, permission, exactAlarm, channel, recoveryPending };
}

export async function requestExactAlarmAccess(): Promise<boolean> { if (Platform.OS !== 'android') return true; return openExactAlarmSettings(); }

export async function cancelAllScheduled(): Promise<void> {
  if (Platform.OS === 'web') return;
  const revision = getVolatileStateRevision();
  if (revision === lastReconciledRevision) return;
  const state = getVolatileState() ?? await loadState();
  await reconcileScheduledNotifications(state.alarms, state.notificationPreferences, revision);
}

function notificationOwnershipKey(entry: Pick<NotificationPlanEntry, 'alarmId' | 'eventTime' | 'kind' | 'warningMinutes'>): string {
  return `${entry.alarmId}|${entry.eventTime}|${entry.kind}|${entry.warningMinutes ?? ''}`;
}

function contentFor(alarm: Alarm, moment: NotificationMoment, preferences: NotificationPreferences, accountName: string, ownershipKey: string): Notifications.NotificationContentInput {
  const eventLabel = alarm.type === 'gwBubble' ? 'Massacre Alarm' : alarm.type === 'bubble' ? 'Bubble Alarm' : alarm.type === 'custom' ? 'Event Alarm' : alarm.type === 'individual' ? 'Individual Timer' : 'RSS Timer';
  const isWarning = moment.kind === 'warning';
  const isEndWarning = moment.kind === 'end-warning';
  const isEnd = moment.kind === 'end';
  const accountLabel = accountName.trim() || 'Unbekannter Account';
  const title = isEnd ? `TGM · ${accountLabel} · ${alarm.title} endet` : isEndWarning ? `TGM · ${accountLabel} · ${alarm.title}` : isWarning ? `TGM · ${accountLabel} · ${alarm.title}` : `TGM ALARM CENTER · ${accountLabel} · ${alarm.title}`;
  const body = isEndWarning ? `${accountLabel}: ${alarm.title}: Der Schutz endet um ${moment.endAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : isEnd ? `${accountLabel}: ${alarm.title}: Der Bubble Alarm endet jetzt.` : isWarning ? `${accountLabel}: ${eventLabel} beginnt um ${moment.eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : `${accountLabel}: Termin ${moment.eventTime.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}.`;
  const soundEnabled = isWarning || isEndWarning ? preferences.warningSound : preferences.eventSound;
  return {
    title,
    body,
    sound: soundEnabled ? soundFor(alarm.sound) : undefined,
    vibrate: preferences.vibration ? [0, 250, 150, 250] : undefined,
    data: { accountId: alarm.accountId, alarmId: alarm.id, eventTime: moment.eventTime.toISOString(), kind: moment.kind, warningMinutes: moment.warningMinutes ?? null, endAt: moment.endAt?.toISOString() ?? null, ownershipKey },
    categoryIdentifier: isWarning || isEndWarning ? 'tgm-warning' : 'tgm-event',
    interruptionLevel: preferences.criticalAlerts ? 'timeSensitive' : 'active',
    ...(Platform.OS === 'android' ? { channelId: channelFor(alarm, soundEnabled) } : {}),
  };
}

async function readRegistry(): Promise<NotificationRegistry> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const raw = await AsyncStorage.getItem(NOTIFICATION_REGISTRY_KEY);
    if (!raw) return {};
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string'));
  } catch {
    return {};
  }
}

async function writeRegistry(registry: NotificationRegistry): Promise<void> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem(NOTIFICATION_REGISTRY_KEY, JSON.stringify(registry));
}

function pendingOwnershipKey(notification: Notifications.NotificationRequest): string | null {
  const data = notification.content.data as { ownershipKey?: unknown; alarmId?: unknown; eventTime?: unknown; kind?: unknown; warningMinutes?: unknown } | undefined;
  if (typeof data?.ownershipKey === 'string' && data.ownershipKey.length > 0) return data.ownershipKey;
  if (typeof data?.alarmId !== 'string' || typeof data?.eventTime !== 'string' || typeof data?.kind !== 'string') return null;
  const warningMinutes = typeof data.warningMinutes === 'number' ? data.warningMinutes : '';
  return `${data.alarmId}|${data.eventTime}|${data.kind}|${warningMinutes}`;
}

async function schedulePlanEntry(entry: NotificationPlanEntry, alarm: Alarm, preferences: NotificationPreferences, accountName: string, now: Date): Promise<string> {
  const moments = upcomingMoments(alarm, now);
  const moment = moments.find((candidate) => candidate.kind === entry.kind && candidate.eventTime.toISOString() === entry.eventTime && (candidate.warningMinutes ?? null) === (entry.warningMinutes ?? null));
  if (!moment) throw new Error(`Benachrichtigungszeitpunkt für Alarm ${alarm.id} konnte nicht rekonstruiert werden.`);
  return Notifications.scheduleNotificationAsync({
    content: contentFor(alarm, moment, preferences, accountName, notificationOwnershipKey(entry)),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: moment.at },
  });
}

async function reconcileScheduledNotificationsInternal(alarms: readonly Alarm[], preferences: NotificationPreferences, revision?: number): Promise<void> {
  if (Platform.OS === 'web') return;
  if (Platform.OS === 'android' && !(await canScheduleExactAlarms())) throw new Error('Die Android-Berechtigung „Alarme & Erinnerungen“ ist nicht aktiviert.');

  const effectiveRevision = revision ?? getVolatileStateRevision();
  if (effectiveRevision === lastReconciledRevision) return;
  const now = new Date();
  const plan = buildNotificationPlan([...alarms], preferences, now);
  const accountState = getVolatileState() ?? await loadState();
  const accountNames = new Map(accountState.accounts.map((account) => [account.id, account.name]));
  const alarmById = new Map(alarms.map((alarm) => [alarm.id, alarm]));
  const desired = new Map(plan.map((entry) => [notificationOwnershipKey(entry), entry]));
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const registry = await readRegistry();
  const current = new Map<string, string>();

  for (const notification of pending) {
    const key = pendingOwnershipKey(notification);
    if (!key) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      continue;
    }
    if (!desired.has(key) || current.has(key)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      continue;
    }
    current.set(key, notification.identifier);
  }

  for (const [key, entry] of desired) {
    if (current.has(key)) continue;
    const alarm = alarmById.get(entry.alarmId);
    if (!alarm) continue;
    const id = await schedulePlanEntry(entry, alarm, preferences, accountNames.get(alarm.accountId) ?? alarm.accountId, now);
    current.set(key, id);
  }

  for (const [key, id] of Object.entries(registry)) {
    if (!current.has(key) && id) {
      try { await Notifications.cancelScheduledNotificationAsync(id); } catch { /* notification already gone */ }
    }
  }

  await writeRegistry(Object.fromEntries(current));
  if (effectiveRevision === getVolatileStateRevision()) lastReconciledRevision = effectiveRevision;
}

export async function reconcileScheduledNotifications(alarms: readonly Alarm[], preferences: NotificationPreferences, revision?: number): Promise<void> {
  const run = reconciliationQueue.then(
    () => reconcileScheduledNotificationsInternal(alarms, preferences, revision),
    () => reconcileScheduledNotificationsInternal(alarms, preferences, revision),
  );
  reconciliationQueue = run.catch(() => undefined);
  await run;
}

export async function scheduleAlarm(alarm: Alarm, preferences: NotificationPreferences, accountName?: string): Promise<string[]> {
  if (Platform.OS === 'web') return [];
  const revision = getVolatileStateRevision();
  if (revision === lastReconciledRevision) return [];
  const state = accountName === undefined ? (getVolatileState() ?? await loadState()) : null;
  const resolvedAccountName = accountName ?? state?.accounts.find((account) => account.id === alarm.accountId)?.name ?? alarm.accountId;
  await reconcileScheduledNotifications(state ? state.alarms : [alarm], preferences, revision);
  const registry = await readRegistry();
  return Object.entries(registry).filter(([key]) => key.startsWith(`${alarm.id}|`)).map(([, id]) => id);
}

export async function scheduleLocalTestNotification(): Promise<string> {
  if (!Device.isDevice || Platform.OS === 'web') throw new Error('Der lokale Gerätetest ist nur auf einem echten Android- oder iOS-Gerät verfügbar.');
  if (Platform.OS === 'android' && !(await canScheduleExactAlarms())) throw new Error('Die Android-Berechtigung „Alarme & Erinnerungen“ ist nicht aktiviert.');
  return Notifications.scheduleNotificationAsync({ content: { title: 'TGM ALARM CENTER · Gerätetest', body: 'Lokale Benachrichtigung erfolgreich ausgelöst.', sound: soundFor('pulse'), vibrate: [0, 250, 150, 250], data: { kind: 'local-test' }, categoryIdentifier: 'tgm-event', interruptionLevel: 'timeSensitive', ...(Platform.OS === 'android' ? { channelId: SOUND_CHANNELS.pulse } : {}) }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(Date.now() + 1500) } });
}

export async function registerCategories(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Promise.allSettled([
    Notifications.setNotificationCategoryAsync('tgm-warning', [{ identifier: 'open', buttonTitle: 'Öffnen', options: { opensAppToForeground: true } }]),
    Notifications.setNotificationCategoryAsync('tgm-event', [{ identifier: 'open', buttonTitle: 'Öffnen', options: { opensAppToForeground: true } }, { identifier: 'done', buttonTitle: 'Erledigt', options: { opensAppToForeground: false } }]),
  ]);
}
