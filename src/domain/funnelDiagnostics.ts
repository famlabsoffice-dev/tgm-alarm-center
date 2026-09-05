export type FunnelStage =
  | 'install'
  | 'first_alarm'
  | 'notification_engagement'
  | 'return';

export interface FunnelEvent {
  stage: FunnelStage;
  occurredAt: string;
  count: number;
}

export interface FunnelSnapshot {
  schemaVersion: 1;
  firstSeenAt: string | null;
  completedStages: FunnelStage[];
  events: FunnelEvent[];
}

const MAX_EVENTS = 64;
const STAGE_ORDER: readonly FunnelStage[] = ['install', 'first_alarm', 'notification_engagement', 'return'];
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function validStage(value: unknown): value is FunnelStage {
  return typeof value === 'string' && STAGE_ORDER.includes(value as FunnelStage);
}

function normalizeIso(value: unknown): string | null {
  if (typeof value !== 'string' || !ISO_UTC.test(value)) return null;
  return Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
}

export function emptyFunnelSnapshot(): FunnelSnapshot {
  return { schemaVersion: 1, firstSeenAt: null, completedStages: [], events: [] };
}

export function recordFunnelStage(snapshot: FunnelSnapshot, stage: FunnelStage, occurredAt = new Date().toISOString()): FunnelSnapshot {
  const timestamp = normalizeIso(occurredAt);
  if (!timestamp) throw new Error('Ungültiger Funnel-Zeitpunkt');
  const completedStages = STAGE_ORDER.filter((candidate) => snapshot.completedStages.includes(candidate) || candidate === stage);
  const existing = snapshot.events.find((event) => event.stage === stage);
  const event: FunnelEvent = existing
    ? { ...existing, occurredAt: existing.occurredAt <= timestamp ? existing.occurredAt : timestamp, count: existing.count + 1 }
    : { stage, occurredAt: timestamp, count: 1 };
  const events = [...snapshot.events.filter((item) => item.stage !== stage), event]
    .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt))
    .slice(-MAX_EVENTS);
  return {
    schemaVersion: 1,
    firstSeenAt: snapshot.firstSeenAt ?? timestamp,
    completedStages,
    events,
  };
}

export function funnelProgress(snapshot: FunnelSnapshot): number {
  return snapshot.completedStages.length / STAGE_ORDER.length;
}

export function funnelConversion(snapshot: FunnelSnapshot): { installToFirstAlarm: number; firstAlarmToEngagement: number; engagementToReturn: number } {
  const count = (stage: FunnelStage): number => snapshot.events.find((event) => event.stage === stage)?.count ?? 0;
  const ratio = (numerator: number, denominator: number): number => denominator > 0 ? Math.min(1, numerator / denominator) : 0;
  return {
    installToFirstAlarm: ratio(count('first_alarm'), count('install')),
    firstAlarmToEngagement: ratio(count('notification_engagement'), count('first_alarm')),
    engagementToReturn: ratio(count('return'), count('notification_engagement')),
  };
}

export function serializeFunnelSnapshot(snapshot: FunnelSnapshot): string {
  return JSON.stringify(snapshot);
}

export function parseFunnelSnapshot(value: unknown): FunnelSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Funneldaten sind ungültig');
  const input = value as Record<string, unknown>;
  if (input.schemaVersion !== 1) throw new Error('Funnel-Schema ist nicht kompatibel');
  const firstSeenAt = input.firstSeenAt === null ? null : normalizeIso(input.firstSeenAt);
  if (input.firstSeenAt !== null && firstSeenAt === null) throw new Error('Funnel firstSeenAt ist ungültig');
  const rawStages = input.completedStages;
  if (!Array.isArray(rawStages) || !rawStages.every(validStage)) throw new Error('Funnel stages sind ungültig');
  const completedStages = STAGE_ORDER.filter((stage) => rawStages.includes(stage));
  const rawEvents = input.events;
  if (!Array.isArray(rawEvents) || rawEvents.length > MAX_EVENTS) throw new Error('Funnel event buffer ist ungültig');
  const events: FunnelEvent[] = rawEvents.map((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Funnel event ist ungültig');
    const event = raw as Record<string, unknown>;
    const occurredAt = normalizeIso(event.occurredAt);
    const count = event.count;
    if (!validStage(event.stage) || !occurredAt || !Number.isInteger(count) || count < 1 || count > 100000) throw new Error('Funnel event ist ungültig');
    return { stage: event.stage, occurredAt, count };
  });
  return {
    schemaVersion: 1,
    firstSeenAt,
    completedStages,
    events,
  };
}
