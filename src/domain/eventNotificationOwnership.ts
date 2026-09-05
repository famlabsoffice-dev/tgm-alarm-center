export interface EventNotificationOwnership {
  accountId: string;
  occurrenceId: string;
  eventTimeUtc: string;
  kind: 'warning' | 'start' | 'end-warning' | 'end';
  warningMinutes: number | null;
}

export function eventNotificationOwnershipKey(input: EventNotificationOwnership): string {
  if (!input.accountId || input.accountId.length > 160) throw new Error('Invalid account id');
  if (!input.occurrenceId || input.occurrenceId.length > 240) throw new Error('Invalid occurrence id');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.eventTimeUtc) || !Number.isFinite(Date.parse(input.eventTimeUtc))) throw new Error('Invalid event time');
  if (!Number.isInteger(input.warningMinutes) && input.warningMinutes !== null) throw new Error('Invalid warning minutes');
  if (input.warningMinutes !== null && (input.warningMinutes < 0 || input.warningMinutes > 10080)) throw new Error('Invalid warning minutes');
  return `${input.accountId}|${input.occurrenceId}|${input.eventTimeUtc}|${input.kind}|${input.warningMinutes ?? 0}`;
}
