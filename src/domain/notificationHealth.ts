export type NotificationHealthState =
  | 'READY'
  | 'PERMISSION_REQUIRED'
  | 'EXACT_ALARM_REQUIRED'
  | 'BATTERY_RESTRICTION'
  | 'CLOCK_SUSPECT'
  | 'RECOVERY_PENDING'
  | 'RECONCILIATION_REQUIRED'
  | 'SCHEDULE_ERROR';

export interface NotificationHealthInput {
  notificationsGranted: boolean;
  exactAlarmGranted: boolean;
  batteryRestricted: boolean;
  clockSkewMinutes: number;
  recoveryPending: boolean;
  reconciliationRequired: boolean;
  scheduleError: boolean;
}

export interface NotificationHealthReport {
  state: NotificationHealthState;
  healthy: boolean;
  reasons: NotificationHealthState[];
}

export function evaluateNotificationHealth(input: NotificationHealthInput): NotificationHealthReport {
  const reasons: NotificationHealthState[] = [];
  if (!input.notificationsGranted) reasons.push('PERMISSION_REQUIRED');
  if (!input.exactAlarmGranted) reasons.push('EXACT_ALARM_REQUIRED');
  if (input.batteryRestricted) reasons.push('BATTERY_RESTRICTION');
  if (!Number.isFinite(input.clockSkewMinutes) || Math.abs(input.clockSkewMinutes) > 2) reasons.push('CLOCK_SUSPECT');
  if (input.recoveryPending) reasons.push('RECOVERY_PENDING');
  if (input.reconciliationRequired) reasons.push('RECONCILIATION_REQUIRED');
  if (input.scheduleError) reasons.push('SCHEDULE_ERROR');
  return { state: reasons[0] ?? 'READY', healthy: reasons.length === 0, reasons };
}
