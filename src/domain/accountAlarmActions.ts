import { Alarm } from './alarm';
import { findOwnedAlarm, ownsAlarm } from './accountIsolation';

export type AlarmUpdater = (alarm: Alarm) => Alarm;

/**
 * Account-scoped alarm mutation primitives. Every mutation requires an
 * explicit account id and an alarm id; the selected UI account is never
 * inferred from the alarm itself.
 */
export function updateAccountAlarm(
  alarms: readonly Alarm[],
  accountId: string | null | undefined,
  alarmId: string,
  update: AlarmUpdater,
): Alarm[] {
  if (!accountId || !alarmId) return [...alarms];
  return alarms.map((alarm) => (
    alarm.id === alarmId && ownsAlarm(alarm, accountId) ? update(alarm) : alarm
  ));
}

export function deleteAccountAlarm(
  alarms: readonly Alarm[],
  accountId: string | null | undefined,
  alarmId: string,
): Alarm[] {
  if (!accountId || !alarmId) return [...alarms];
  const target = findOwnedAlarm(alarms, alarmId, accountId);
  if (!target) return [...alarms];
  return alarms.filter((alarm) => alarm.id !== target.id);
}

export function toggleAccountAlarm(
  alarms: readonly Alarm[],
  accountId: string | null | undefined,
  alarmId: string,
  nowIso: string,
): Alarm[] {
  return updateAccountAlarm(alarms, accountId, alarmId, (alarm) => ({
    ...alarm,
    active: !alarm.active,
    updatedAt: nowIso,
  }));
}

export function completeAccountOccurrence(
  alarms: readonly Alarm[],
  accountId: string | null | undefined,
  alarmId: string,
  occurrenceId: string,
  nowIso: string,
): Alarm[] {
  return updateAccountAlarm(alarms, accountId, alarmId, (alarm) => ({
    ...alarm,
    completedOccurrences: {
      ...alarm.completedOccurrences,
      [occurrenceId]: true,
    },
    updatedAt: nowIso,
  }));
}
