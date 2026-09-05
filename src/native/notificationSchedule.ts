import { Alarm, NotificationMoment, NotificationPreferences, upcomingMoments } from '../domain/alarm';

export const NOTIFICATION_ROLLING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface NotificationPlanEntry {
  alarmId: string;
  accountId: string;
  eventTime: string;
  at: string;
  kind: NotificationMoment['kind'];
  warningMinutes?: number;
  endAt?: string;
  sound: Alarm['sound'] | null;
  soundEnabled: boolean;
}

/** Notification scheduling is global to the locally loaded state, never to the selected UI account. */
export function activeAlarmsForNotification(alarms: readonly Alarm[]): Alarm[] {
  return alarms.filter((alarm) => alarm.active);
}

export function isWithinRollingNotificationWindow(at: Date, now: Date, windowMs = NOTIFICATION_ROLLING_WINDOW_MS): boolean {
  const timestamp = at.getTime();
  const lower = now.getTime();
  const upper = lower + windowMs;
  return Number.isFinite(timestamp) && Number.isFinite(lower) && Number.isFinite(upper) && timestamp > lower && timestamp <= upper;
}

export function buildNotificationPlan(
  alarms: Alarm[],
  preferences: NotificationPreferences,
  now = new Date(),
  windowMs = NOTIFICATION_ROLLING_WINDOW_MS,
): NotificationPlanEntry[] {
  if (!Number.isFinite(now.getTime()) || !Number.isFinite(windowMs) || windowMs <= 0) throw new Error('Invalid notification rolling window');
  const entries = activeAlarmsForNotification(alarms)
    .flatMap((alarm) => upcomingMoments(alarm, now).map((moment) => ({
      alarmId: alarm.id,
      accountId: alarm.accountId,
      eventTime: moment.eventTime.toISOString(),
      at: moment.at.toISOString(),
      kind: moment.kind,
      warningMinutes: moment.warningMinutes,
      endAt: moment.endAt?.toISOString(),
      sound: alarm.sound,
      soundEnabled: moment.kind === 'warning' || moment.kind === 'end-warning'
        ? preferences.warningSound
        : preferences.eventSound,
    })))
    .filter((entry) => isWithinRollingNotificationWindow(new Date(entry.at), now, windowMs));

  const unique = new Map<string, NotificationPlanEntry>();
  for (const entry of entries) {
    const key = `${entry.alarmId}|${entry.eventTime}|${entry.kind}|${entry.warningMinutes ?? ''}`;
    if (!unique.has(key)) unique.set(key, entry);
  }

  return [...unique.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
