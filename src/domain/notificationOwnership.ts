import { Alarm } from './alarm';
import { findOwnedAlarm } from './accountIsolation';

export type NotificationAlarmPayload = {
  accountId?: unknown;
  alarmId?: unknown;
};

/**
 * Resolves a notification action only when the notification carries a valid
 * account id and that account owns the referenced alarm.
 *
 * Notification actions are global OS events and therefore must never rely on
 * the currently selected UI account. The payload's persisted accountId is the
 * authority for the action target.
 */
export function findNotificationAlarm(
  alarms: readonly Alarm[],
  payload: NotificationAlarmPayload,
): Alarm | null {
  if (typeof payload.alarmId !== 'string' || typeof payload.accountId !== 'string') return null;
  return findOwnedAlarm(alarms, payload.alarmId, payload.accountId);
}

/**
 * Applies a notification action to its payload-owned alarm only. A stale,
 * malformed, or cross-account notification becomes a safe no-op.
 */
export function updateNotificationAlarm(
  alarms: readonly Alarm[],
  payload: NotificationAlarmPayload,
  update: (alarm: Alarm) => Alarm,
): Alarm[] {
  const target = findNotificationAlarm(alarms, payload);
  if (!target) return [...alarms];
  return alarms.map((alarm) => alarm.id === target.id ? update(alarm) : alarm);
}
