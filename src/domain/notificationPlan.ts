import type { EventOccurrence, CriticalMomentRule } from './eventModel';

export interface PlannedNotification {
  id: string;
  occurrenceId: string;
  atUtc: string;
  kind: CriticalMomentRule['kind'];
  warningMinutes: number | null;
}

export function buildNotificationPlan(occurrence: EventOccurrence, rules: readonly CriticalMomentRule[]): PlannedNotification[] {
  const start = Date.parse(occurrence.startUtc);
  if (!Number.isFinite(start)) throw new Error('Invalid occurrence start');
  const end = occurrence.endUtc ? Date.parse(occurrence.endUtc) : null;
  if (end !== null && (!Number.isFinite(end) || end <= start)) throw new Error('Invalid occurrence end');
  const plans: PlannedNotification[] = [];
  for (const rule of rules) {
    const minutes = rule.minutesBefore ?? 0;
    const at = rule.kind === 'end' || rule.kind === 'end-warning' ? end : start;
    if (at === null) continue;
    const timestamp = rule.kind === 'end' ? at : at - minutes * 60_000;
    if (timestamp < 0) continue;
    const warningMinutes = rule.kind === 'warning' || rule.kind === 'end-warning' ? minutes : null;
    plans.push({
      id: `${occurrence.id}|${rule.kind}|${warningMinutes ?? 0}`,
      occurrenceId: occurrence.id,
      atUtc: new Date(timestamp).toISOString(),
      kind: rule.kind,
      warningMinutes,
    });
  }
  return plans.sort((a, b) => Date.parse(a.atUtc) - Date.parse(b.atUtc));
}
