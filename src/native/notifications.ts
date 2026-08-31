import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Alarm, NotificationMoment, NotificationPreferences, upcomingMoments } from '../domain/alarm';

export const CHANNEL_ID = 'time-critical-events';
const soundFor = (sound: Alarm['sound']): string => sound === 'siren' ? 'alarm-siren.wav' : sound === 'chime' ? 'alarm-chime.wav' : 'alarm-pulse.wav';

export interface NotificationReadiness {
  supported: boolean;
  permission: boolean;
  exactAlarm: boolean;
  channel: boolean;
}

export async function initializeNotifications(): Promise<NotificationReadiness> {
  if (!Device.isDevice || Platform.OS === 'web') return { supported: false, permission: false, exactAlarm: false, channel: false };
  let channel = true;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Zeitkritische Ereignisse',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'alarm-pulse.wav',
      vibrationPattern: [0, 250, 150, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    channel = Boolean(await Notifications.getNotificationChannelAsync(CHANNEL_ID));
  }
  const current = await Notifications.getPermissionsAsync();
  let permission = current.status === Notifications.PermissionStatus.GRANTED;
  if (!permission && current.status === Notifications.PermissionStatus.UNDETERMINED) {
    permission = (await Notifications.requestPermissionsAsync()).status === Notifications.PermissionStatus.GRANTED;
  }
  return { supported: true, permission, exactAlarm: Platform.OS === 'android', channel };
}

export async function cancelAllScheduled(): Promise<void> {
  if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
}

function contentFor(alarm: Alarm, moment: NotificationMoment, preferences: NotificationPreferences): Notifications.NotificationContentInput {
  const eventLabel = alarm.type === 'gwBubble' ? 'GW Bubble' : alarm.type === 'bubble' ? 'Bubble' : 'Event';
  const isWarning = moment.kind === 'warning';
  const isEndWarning = moment.kind === 'end-warning';
  const isEnd = moment.kind === 'end';
  const title = isEnd ? `TGM · ${alarm.title} endet` : isEndWarning ? `TGM · ${alarm.title}` : isWarning ? `TGM · ${alarm.title}` : `TGM ALARM CENTER · ${alarm.title}`;
  const body = isEndWarning
    ? `${alarm.title}: Der Schutz endet um ${moment.endAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
    : isEnd
      ? `${alarm.title}: Das Bubble-Schutzfenster endet jetzt.`
      : isWarning
        ? `${eventLabel} beginnt um ${moment.eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        : `Termin ${moment.eventTime.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}.`;
  const soundEnabled = isWarning || isEndWarning ? preferences.warningSound : preferences.eventSound;
  const content: Notifications.NotificationContentInput = {
    title,
    body,
    sound: soundEnabled ? soundFor(alarm.sound) : undefined,
    vibrate: preferences.vibration ? [0, 250, 150, 250] : undefined,
    data: { alarmId: alarm.id, eventTime: moment.eventTime.toISOString(), kind: moment.kind, endAt: moment.endAt?.toISOString() ?? null },
    categoryIdentifier: isWarning || isEndWarning ? 'tgm-warning' : 'tgm-event',
    interruptionLevel: preferences.criticalAlerts ? 'timeSensitive' : 'active',
  };
  return content;
}

export async function scheduleAlarm(alarm: Alarm, preferences: NotificationPreferences): Promise<string[]> {
  if (Platform.OS === 'web') return [];
  const ids: string[] = [];
  for (const moment of upcomingMoments(alarm)) {
    const id = await Notifications.scheduleNotificationAsync({
      content: contentFor(alarm, moment, preferences),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: moment.at,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
    });
    ids.push(id);
  }
  return ids;
}

export async function registerCategories(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.setNotificationCategoryAsync('tgm-warning', [
    { identifier: 'open', buttonTitle: 'Öffnen', options: { opensAppToForeground: true } },
  ]);
  await Notifications.setNotificationCategoryAsync('tgm-event', [
    { identifier: 'open', buttonTitle: 'Öffnen', options: { opensAppToForeground: true } },
    { identifier: 'done', buttonTitle: 'Erledigt', options: { opensAppToForeground: false } },
  ]);
}
