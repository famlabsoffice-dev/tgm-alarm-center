import type { AlarmType, RepeatMode, SoundProfile } from '../domain/alarm';

export type EventPriority = 'low' | 'normal' | 'high' | 'critical';
export type EventSourceKind = 'native' | 'partner' | 'manual' | 'import';
export type AlarmAction = 'notify' | 'notify-and-open';

export interface AlarmableEvent {
  id: string;
  source: EventSourceKind;
  sourceId: string;
  sourceEventId: string;
  title: string;
  description: string;
  category: string;
  startAtUtc: string;
  endAtUtc: string | null;
  timezone: string;
  priority: EventPriority;
  alarmType: AlarmType;
  repeat: RepeatMode;
  warningMinutes: number[];
  sound: SoundProfile;
  action: AlarmAction;
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalEventInput {
  source: EventSourceKind;
  sourceId: string;
  sourceEventId: string;
  title: string;
  description?: string;
  category?: string;
  startAtUtc: string;
  endAtUtc?: string | null;
  timezone?: string;
  priority?: EventPriority;
  alarmType?: AlarmType;
  repeat?: RepeatMode;
  warningMinutes?: number[];
  sound?: SoundProfile;
  action?: AlarmAction;
  metadata?: Record<string, string | number | boolean>;
}

const PRIORITY_WEIGHT: Record<EventPriority, number> = { low: 0, normal: 1, high: 2, critical: 3 };
const DEFAULT_WARNINGS = [60, 15];
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_WARNING_MINUTES = 7 * 24 * 60;

function isValidIsoUtc(value: string): boolean {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && value === parsed.toISOString();
}

function normalizeWarnings(values: number[] | undefined): number[] {
  const warnings = (values ?? DEFAULT_WARNINGS).filter((value) => Number.isInteger(value) && value > 0 && value <= MAX_WARNING_MINUTES);
  return [...new Set(warnings)].sort((a, b) => b - a);
}

export function validateExternalEvent(input: ExternalEventInput): string[] {
  const errors: string[] = [];
  if (!input.sourceId.trim()) errors.push('sourceId is required');
  if (!input.sourceEventId.trim()) errors.push('sourceEventId is required');
  const title = input.title.trim();
  if (!title) errors.push('title is required');
  if (title.length > MAX_TITLE_LENGTH) errors.push(`title exceeds ${MAX_TITLE_LENGTH} characters`);
  if ((input.description ?? '').length > MAX_DESCRIPTION_LENGTH) errors.push(`description exceeds ${MAX_DESCRIPTION_LENGTH} characters`);
  if (!isValidIsoUtc(input.startAtUtc)) errors.push('startAtUtc must be an ISO UTC timestamp');
  if (input.endAtUtc !== undefined && input.endAtUtc !== null && !isValidIsoUtc(input.endAtUtc)) errors.push('endAtUtc must be an ISO UTC timestamp');
  if (input.endAtUtc && isValidIsoUtc(input.startAtUtc) && new Date(input.endAtUtc).getTime() <= new Date(input.startAtUtc).getTime()) errors.push('endAtUtc must be after startAtUtc');
  if (input.priority && !(input.priority in PRIORITY_WEIGHT)) errors.push('invalid priority');
  if (input.warningMinutes?.some((value) => !Number.isInteger(value) || value <= 0 || value > MAX_WARNING_MINUTES)) errors.push('warningMinutes contains an invalid value');
  return errors;
}

export function normalizeExternalEvent(input: ExternalEventInput, now = new Date()): AlarmableEvent {
  const errors = validateExternalEvent(input);
  if (errors.length) throw new Error(`Invalid external event: ${errors.join('; ')}`);
  const timestamp = now.toISOString();
  const title = input.title.trim();
  return {
    id: `${input.source}:${input.sourceId}:${input.sourceEventId}`,
    source: input.source,
    sourceId: input.sourceId.trim(),
    sourceEventId: input.sourceEventId.trim(),
    title,
    description: (input.description ?? '').trim(),
    category: (input.category ?? 'general').trim() || 'general',
    startAtUtc: input.startAtUtc,
    endAtUtc: input.endAtUtc ?? null,
    timezone: input.timezone?.trim() || 'UTC',
    priority: input.priority ?? 'normal',
    alarmType: input.alarmType ?? 'custom',
    repeat: input.repeat ?? 'once',
    warningMinutes: normalizeWarnings(input.warningMinutes),
    sound: input.sound ?? 'chime',
    action: input.action ?? 'notify',
    metadata: { ...(input.metadata ?? {}) },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function compareEventPriority(a: AlarmableEvent, b: AlarmableEvent): number {
  return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
}

export function deduplicateEvents(events: AlarmableEvent[]): AlarmableEvent[] {
  const byId = new Map<string, AlarmableEvent>();
  for (const event of events) {
    const existing = byId.get(event.id);
    if (!existing || event.updatedAt >= existing.updatedAt) byId.set(event.id, event);
  }
  return [...byId.values()];
}
