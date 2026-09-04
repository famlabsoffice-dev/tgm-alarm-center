import { Alarm, NotificationMoment, NotificationPreferences, upcomingMoments } from '../domain/alarm';

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

export function buildNotificationPlan(
  alarms: Alarm[],
  preferences: NotificationPreferences,
  now = new Date(),
): NotificationPlanEntry[] {
  const entries = alarms
    .filter((alarm) => alarm.active)
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
    })));

  const unique = new Map<string, NotificationPlanEntry>();
  for (const entry of entries) {
    const key = `${entry.alarmId}|${entry.eventTime}|${entry.kind}|${entry.warningMinutes ?? ''}`;
    if (!unique.has(key)) unique.set(key, entry);
  }

  return [...unique.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
