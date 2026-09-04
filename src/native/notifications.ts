import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Alarm, NotificationMoment, NotificationPreferences, upcomingMoments } from '../domain/alarm';
import { buildNotificationPlan } from './notificationSchedule';

export const CHANNEL_ID = 'time-critical-events-v2';
const SOUND_CHANNELS = {
  pulse: `${CHANNEL_ID}-pulse`,
  siren: `${CHANNEL_ID}-siren`,
  chime: `${CHANNEL_ID}-chime`,
  silent: `${CHANNEL_ID}-silent`,
} as const;

const soundFor = (sound: Alarm['sound']): string => sound === 'siren' ? 'alarm-siren.wav' : sound === 'chime' ? 'alarm-chime.wav' : 'alarm-pulse.wav';

export interface NotificationReadiness {
  supported: boolean;
  permission: boolean;
  exactAlarm: boolean;
  channel: boolean;
}

async function ensureAndroidChannels(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    await Promise.all([
      Notifications.setNotificationChannelAsync(SOUND_CHANNELS.pulse, {
        name: 'Zeitkritische Ereignisse · Pulse',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'alarm-pulse.wav',
        vibrationPattern: [0, 250, 150, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
      Notifications.setNotificationChannelAsync(SOUND_CHANNELS.siren, {
        name: 'Zeitkritische Ereignisse · Siren',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'alarm-siren.wav',
        vibrationPattern: [0, 250, 150, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
      Notifications.setNotificationChannelAsync(SOUND_CHANNELS.chime, {
        name: 'Zeitkritische Ereignisse · Chime',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'alarm-chime.wav',
        vibrationPattern: [0, 250, 150, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
      Notifications.setNotificationChannelAsync(SOUND_CHANNELS.silent, {
        name: 'Zeitkritische Ereignisse · Ohne Ton',
        importance: Notifications.AndroidImportance.MAX,
        sound: null,
        vibrationPattern: [0, 250, 150, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
    ]);
    return Boolean(await Notifications.getNotificationChannelAsync(SOUND_CHANNELS.pulse));
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
  if (!Device.isDevice || Platform.OS === 'web') return { supported: false, permission: false, exactAlarm: false, channel: false };

  const channel = await ensureAndroidChannels();

  let permission = false;
  try {
    const current = await Notifications.getPermissionsAsync();
    permission = current.status === Notifications.PermissionStatus.GRANTED;
    if (!permission && current.status === Notifications.PermissionStatus.UNDETERMINED) {
      permission = (await Notifications.requestPermissionsAsync()).status === Notifications.PermissionStatus.GRANTED;
    }
  } catch {
    permission = false;
  }

  // expo-notifications does not expose the Android SCHEDULE_EXACT_ALARM app-op
  // state. Do not present the platform declaration itself as a runtime check.
  const exactAlarm = false;
  return { supported: true, permission, exactAlarm, channel };
}

export async function cancelAllScheduled(): Promise<void> {
  if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
}

function contentFor(alarm: Alarm, moment: NotificationMoment, preferences: NotificationPreferences): Notifications.NotificationContentInput {
  const eventLabel = alarm.type === 'gwBubble' ? 'Massacre Alarm' : alarm.type === 'bubble' ? 'Bubble Alarm' : alarm.type === 'custom' ? 'Event Alarm' : alarm.type === 'individual' ? 'Individual Timer' : 'RSS Timer';
  const isWarning = moment.kind === 'warning';
  const isEndWarning = moment.kind === 'end-warning';
  const isEnd = moment.kind === 'end';
  const title = isEnd ? `TGM · ${alarm.title} endet` : isEndWarning ? `TGM · ${alarm.title}` : isWarning ? `TGM · ${alarm.title}` : `TGM ALARM CENTER · ${alarm.title}`;
  const body = isEndWarning
    ? `${alarm.title}: Der Schutz endet um ${moment.endAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
    : isEnd
      ? `${alarm.title}: Der Bubble Alarm endet jetzt.`
      : isWarning
        ? `${eventLabel} beginnt um ${moment.eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        : `Termin ${moment.eventTime.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}.`;
  const soundEnabled = isWarning || isEndWarning ? preferences.warningSound : preferences.eventSound;
  return {
    title,
    body,
    sound: soundEnabled ? soundFor(alarm.sound) : undefined,
    vibrate: preferences.vibration ? [0, 250, 150, 250] : undefined,
    data: { accountId: alarm.accountId, alarmId: alarm.id, eventTime: moment.eventTime.toISOString(), kind: moment.kind, endAt: moment.endAt?.toISOString() ?? null },
    categoryIdentifier: isWarning || isEndWarning ? 'tgm-warning' : 'tgm-event',
    interruptionLevel: preferences.criticalAlerts ? 'timeSensitive' : 'active',
    ...(Platform.OS === 'android' ? { channelId: channelFor(alarm, soundEnabled) } : {}),
  };
}

export async function scheduleAlarm(alarm: Alarm, preferences: NotificationPreferences): Promise<string[]> {
  if (Platform.OS === 'web') return [];
  const ids: string[] = [];
  const plan = buildNotificationPlan([alarm], preferences);
  const moments = upcomingMoments(alarm);
  for (const entry of plan) {
    const moment = moments.find((candidate) => candidate.kind === entry.kind && candidate.eventTime.toISOString() === entry.eventTime && (candidate.warningMinutes ?? null) === (entry.warningMinutes ?? null));
    if (!moment) continue;
    const id = await Notifications.scheduleNotificationAsync({
      content: contentFor(alarm, moment, preferences),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: moment.at,
      },
    });
    ids.push(id);
  }
  return ids;
}

export async function scheduleLocalTestNotification(): Promise<string> {
  if (!Device.isDevice || Platform.OS === 'web') throw new Error('Der lokale Gerätetest ist nur auf einem echten Android- oder iOS-Gerät verfügbar.');
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'TGM ALARM CENTER · Gerätetest',
      body: 'Lokale Benachrichtigung erfolgreich ausgelöst.',
      sound: soundFor('pulse'),
      vibrate: [0, 250, 150, 250],
      data: { kind: 'local-test' },
      categoryIdentifier: 'tgm-event',
      interruptionLevel: 'timeSensitive',
      ...(Platform.OS === 'android' ? { channelId: SOUND_CHANNELS.pulse } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(Date.now() + 1500),
    },
  });
}

export async function registerCategories(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Promise.allSettled([
    Notifications.setNotificationCategoryAsync('tgm-warning', [
      { identifier: 'open', buttonTitle: 'Öffnen', options: { opensAppToForeground: true } },
    ]),
    Notifications.setNotificationCategoryAsync('tgm-event', [
      { identifier: 'open', buttonTitle: 'Öffnen', options: { opensAppToForeground: true } },
      { identifier: 'done', buttonTitle: 'Erledigt', options: { opensAppToForeground: false } },
    ]),
  ]);
}
