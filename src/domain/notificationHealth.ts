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

export interface NotificationHealthUserCopy {
  headline: string;
  detail: string;
}

const USER_COPY: Record<NotificationHealthState, NotificationHealthUserCopy> = {
  READY: { headline: 'Benachrichtigungen sind bereit', detail: 'Zeitkritische Alarme können auf diesem Gerät geplant werden.' },
  PERMISSION_REQUIRED: { headline: 'Berechtigung fehlt', detail: 'Erlaube Benachrichtigungen in den Geräteeinstellungen, damit Alarme zugestellt werden können.' },
  EXACT_ALARM_REQUIRED: { headline: 'Exakte Alarme nicht aktiviert', detail: 'Aktiviere „Alarme & Erinnerungen“, damit zeitkritische Termine exakt geplant werden können.' },
  BATTERY_RESTRICTION: { headline: 'Batterieschutz kann Zustellung verzögern', detail: 'Die Akkuverwaltung des Geräts kann Hintergrundaktivität einschränken.' },
  CLOCK_SUSPECT: { headline: 'Uhrzeit prüfen', detail: 'Die Gerätezeit weicht ungewöhnlich ab. Prüfe Datum, Uhrzeit und automatische Zeitsynchronisierung.' },
  RECOVERY_PENDING: { headline: 'Alarmplan wird wiederhergestellt', detail: 'Die App prüft und erneuert die lokalen Alarmpläne.' },
  RECONCILIATION_REQUIRED: { headline: 'Alarmplan wird aktualisiert', detail: 'Gespeicherte und aktuell geplante Alarme werden abgeglichen.' },
  SCHEDULE_ERROR: { headline: 'Alarmplanung fehlgeschlagen', detail: 'Mindestens ein Alarm konnte nicht geplant werden und muss erneut geprüft werden.' },
};

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

export function notificationHealthUserCopy(report: NotificationHealthReport): NotificationHealthUserCopy {
  return USER_COPY[report.state];
}
