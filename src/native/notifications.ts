import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Alarm, occurrenceKey } from '../domain/alarm';

export const CHANNEL_ID = 'time-critical-events';
const soundFor = (sound: Alarm['sound']) => sound === 'siren' ? 'alarm-siren.wav' : sound === 'chime' ? 'alarm-chime.wav' : 'alarm-pulse.wav';

export async function initializeNotifications() {
  if (!Device.isDevice) return { supported: false, permission: false, exactAlarm: false, channel: false };
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: 'Zeitkritische Ereignisse', importance: Notifications.AndroidImportance.MAX, sound: 'alarm-pulse.wav', vibrationPattern: [0, 250, 150, 250], lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC });
  const current = await Notifications.getPermissionsAsync();
  let permission = current.status === Notifications.PermissionStatus.GRANTED;
  if (!permission && current.status === Notifications.PermissionStatus.UNDETERMINED) permission = (await Notifications.requestPermissionsAsync()).status === Notifications.PermissionStatus.GRANTED;
  const channel = Platform.OS === 'android' ? !!(await Notifications.getNotificationChannelAsync(CHANNEL_ID)) : true;
  return { supported: true, permission, exactAlarm: Platform.OS === 'android', channel };
}

export async function cancelAllScheduled(): Promise<void> { await Notifications.cancelAllScheduledNotificationsAsync(); }

export async function scheduleAlarm(alarm: Alarm, eventTime: Date, warningMinutes: number[], preview: boolean, vibration: boolean) {
  if (eventTime.getTime() <= Date.now()) return [];
  const ids: string[] = [];
  const moments = [...warningMinutes.map(m => ({ at: new Date(eventTime.getTime() - m * 60000), warning: true })), { at: eventTime, warning: false }];
  for (const moment of moments) {
    if (moment.at.getTime() <= Date.now() || alarm.completedOccurrences[occurrenceKey(alarm.id, eventTime)]) continue;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: moment.warning ? `TGM · ${alarm.title}` : `TGM ALARM CENTER · ${alarm.title}`,
        body: moment.warning ? `${alarm.type === 'gwBubble' ? 'GW Bubble' : alarm.type === 'bubble' ? 'Bubble' : 'Event'} beginnt um ${eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : `Termin ${eventTime.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}.`,
        sound: preview ? soundFor(alarm.sound) : undefined,
        vibrate: vibration ? [0, 250, 150, 250] : undefined,
        data: { alarmId: alarm.id, eventTime: eventTime.toISOString(), kind: moment.warning ? 'warning' : 'event' },
        categoryIdentifier: moment.warning ? 'tgm-warning' : 'tgm-event',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: moment.at, ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}) },
    });
    ids.push(id);
  }
  return ids;
}

export async function registerCategories() {
  await Notifications.setNotificationCategoryAsync('tgm-warning', [{ identifier: 'open', buttonTitle: 'Öffnen', options: { opensAppToForeground: true } }]);
  await Notifications.setNotificationCategoryAsync('tgm-event', [{ identifier: 'open', buttonTitle: 'Öffnen', options: { opensAppToForeground: true } }, { identifier: 'done', buttonTitle: 'Erledigt', options: { opensAppToForeground: false } }]);
}
