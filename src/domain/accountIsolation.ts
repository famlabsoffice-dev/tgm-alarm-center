import { Alarm } from './alarm';

/**
 * Single ownership predicate for all account-scoped alarm reads and writes.
 * A missing account context never grants access to an alarm.
 */
export function ownsAlarm(alarm: Alarm, accountId: string | null | undefined): boolean {
  return typeof accountId === 'string' && accountId.length > 0 && alarm.accountId === accountId;
}

/**
 * Returns only alarms owned by the selected account. The returned array is a
 * fresh projection so callers cannot accidentally alter the source collection.
 */
export function ownedAlarms(alarms: readonly Alarm[], accountId: string | null | undefined): Alarm[] {
  if (typeof accountId !== 'string' || accountId.length === 0) return [];
  return alarms.filter((alarm) => ownsAlarm(alarm, accountId));
}

/**
 * Finds an alarm only when both its identifier and account ownership match.
 */
export function findOwnedAlarm(
  alarms: readonly Alarm[],
  alarmId: string,
  accountId: string | null | undefined,
): Alarm | null {
  if (!accountId || !alarmId) return null;
  return alarms.find((alarm) => alarm.id === alarmId && ownsAlarm(alarm, accountId)) ?? null;
}

/**
 * Applies a mutation to exactly one account-owned alarm. Foreign alarms are
 * returned byte-for-byte by reference and are never passed to the mutator.
 */
export function updateOwnedAlarm(
  alarms: readonly Alarm[],
  alarmId: string,
  accountId: string | null | undefined,
  update: (alarm: Alarm) => Alarm,
): Alarm[] {
  if (!accountId || !alarmId) return [...alarms];
  return alarms.map((alarm) => alarm.id === alarmId && ownsAlarm(alarm, accountId) ? update(alarm) : alarm);
}
