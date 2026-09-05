export type EventRuleType =
  | 'fixedUtc'
  | 'fixedLocal'
  | 'dailyLocal'
  | 'intervalFromAnchor'
  | 'intervalFromCheckIn'
  | 'intervalFromCompletion'
  | 'seasonPhase'
  | 'eventWindow'
  | 'manual'
  | 'dynamicRemote'
  | 'randomWithinWindow';

export type EventOccurrenceStatus =
  | 'predicted'
  | 'confirmed'
  | 'communityConfirmed'
  | 'disputed'
  | 'expired';

export interface CriticalMomentRule {
  kind: 'warning' | 'start' | 'end-warning' | 'end';
  minutesBefore?: number;
}

export interface Provenance {
  id: string;
  sourceType: 'official' | 'community' | 'user' | 'configured';
  label: string;
  reference: string;
  observedAt: string;
}

export interface EventSchedule {
  ruleType: EventRuleType;
  intervalMinutes?: number;
  anchorUtc?: string;
  localTime?: string;
  /** IANA timezone used for dailyLocal/fixedLocal schedules; omitted means UTC. */
  timezoneId?: string;
  durationMinutes?: number;
  windowStartUtc?: string;
  windowEndUtc?: string;
  seasonPhase?: string;
}

export interface EventDefinition {
  id: string;
  version: number;
  category: string;
  titleKey: string;
  ruleType: EventRuleType;
  schedule: EventSchedule;
  duration?: { minutes: number };
  variantSource?: { mode: 'unknownUntilConfirmed' | 'configured' | 'remote' };
  seasonScope?: string[];
  criticalMoments: CriticalMomentRule[];
  sources: Provenance[];
  confidence: number;
  effectiveFrom?: string;
  effectiveUntil?: string;
}

export interface EventOccurrence {
  id: string;
  definitionId: string;
  definitionVersion: number;
  startUtc: string;
  endUtc: string | null;
  variant: string | null;
  status: EventOccurrenceStatus;
  confidence: number;
  sourceRefs: string[];
  metadata: Record<string, unknown>;
}

export function isValidIsoUtc(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

export function validateEventDefinition(definition: EventDefinition): string[] {
  const errors: string[] = [];
  if (!/^[a-z0-9][a-z0-9._-]{1,119}$/.test(definition.id)) errors.push('invalid-id');
  if (!Number.isInteger(definition.version) || definition.version < 1) errors.push('invalid-version');
  if (!definition.category.trim() || definition.category.length > 80) errors.push('invalid-category');
  if (!definition.titleKey.trim() || definition.titleKey.length > 120) errors.push('invalid-title-key');
  if (!Number.isFinite(definition.confidence) || definition.confidence < 0 || definition.confidence > 1) errors.push('invalid-confidence');
  if (!definition.criticalMoments.length) errors.push('missing-critical-moments');
  for (const moment of definition.criticalMoments) {
    if (moment.kind === 'warning' || moment.kind === 'end-warning') {
      if (!Number.isInteger(moment.minutesBefore) || (moment.minutesBefore ?? 0) < 1 || (moment.minutesBefore ?? 0) > 10080) errors.push('invalid-warning');
    }
  }
  if (definition.schedule.anchorUtc && !isValidIsoUtc(definition.schedule.anchorUtc)) errors.push('invalid-anchor');
  if (definition.effectiveFrom && !isValidIsoUtc(definition.effectiveFrom)) errors.push('invalid-effective-from');
  if (definition.effectiveUntil && !isValidIsoUtc(definition.effectiveUntil)) errors.push('invalid-effective-until');
  if (definition.effectiveFrom && definition.effectiveUntil && Date.parse(definition.effectiveFrom) >= Date.parse(definition.effectiveUntil)) errors.push('invalid-effective-range');
  if (definition.schedule.intervalMinutes !== undefined && (!Number.isInteger(definition.schedule.intervalMinutes) || definition.schedule.intervalMinutes <= 0)) errors.push('invalid-interval');
  if (definition.duration && (!Number.isInteger(definition.duration.minutes) || definition.duration.minutes <= 0)) errors.push('invalid-duration');
  if (definition.schedule.timezoneId !== undefined) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: definition.schedule.timezoneId }).format(new Date(0));
    } catch {
      errors.push('invalid-timezone');
    }
  }
  if (definition.schedule.localTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(definition.schedule.localTime)) errors.push('invalid-local-time');
  for (const source of definition.sources) {
    if (!source.id || !source.label || !isValidIsoUtc(source.observedAt)) errors.push('invalid-provenance');
  }
  return [...new Set(errors)];
}
