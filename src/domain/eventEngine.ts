import type { EventDefinition, EventOccurrence } from './eventModel';
import { validateEventDefinition } from './eventModel';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function occurrenceId(definition: EventDefinition, startUtc: string): string {
  return `${definition.id}@${startUtc}`;
}

function boundedConfidence(definition: EventDefinition): number {
  return Math.min(1, Math.max(0, definition.confidence));
}

function makeOccurrence(definition: EventDefinition, start: Date, variant: string | null = null): EventOccurrence {
  const end = definition.duration?.minutes ? new Date(start.getTime() + definition.duration.minutes * 60_000) : null;
  return {
    id: occurrenceId(definition, start.toISOString()),
    definitionId: definition.id,
    definitionVersion: definition.version,
    startUtc: start.toISOString(),
    endUtc: end?.toISOString() ?? null,
    variant,
    status: variant ? 'communityConfirmed' : 'predicted',
    confidence: boundedConfidence(definition),
    sourceRefs: definition.sources.map((source) => source.id),
    metadata: { category: definition.category, titleKey: definition.titleKey },
  };
}

function hourlyOccurrences(definition: EventDefinition, from: Date, until: Date): EventOccurrence[] {
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), from.getUTCHours(), 0, 0, 0));
  if (cursor < from) cursor.setTime(cursor.getTime() + HOUR_MS);
  const result: EventOccurrence[] = [];
  for (; cursor <= until; cursor.setTime(cursor.getTime() + HOUR_MS)) result.push(makeOccurrence(definition, new Date(cursor)));
  return result;
}

function anchoredOccurrences(definition: EventDefinition, from: Date, until: Date): EventOccurrence[] {
  const { anchorUtc, intervalMinutes } = definition.schedule;
  if (!anchorUtc || !intervalMinutes) return [];
  const anchor = new Date(anchorUtc);
  const interval = intervalMinutes * 60_000;
  if (!Number.isFinite(anchor.getTime()) || interval <= 0) return [];
  const firstIndex = Math.max(0, Math.ceil((from.getTime() - anchor.getTime()) / interval));
  const result: EventOccurrence[] = [];
  for (let index = firstIndex; ; index += 1) {
    const start = new Date(anchor.getTime() + index * interval);
    if (start > until) break;
    if (start >= from) result.push(makeOccurrence(definition, start));
    if (result.length >= 512) break;
  }
  return result;
}

function dailyOccurrences(definition: EventDefinition, from: Date, until: Date): EventOccurrence[] {
  const time = definition.schedule.localTime;
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return [];
  const [hour, minute] = time.split(':').map(Number);
  const result: EventOccurrence[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), hour, minute));
  if (cursor < from) cursor.setUTCDate(cursor.getUTCDate() + 1);
  for (; cursor <= until; cursor.setTime(cursor.getTime() + DAY_MS)) result.push(makeOccurrence(definition, new Date(cursor)));
  return result;
}

export function generateOccurrences(definition: EventDefinition, fromUtc: Date, untilUtc: Date): EventOccurrence[] {
  const validation = validateEventDefinition(definition);
  if (validation.length) throw new Error(`Invalid event definition: ${validation.join(',')}`);
  if (!Number.isFinite(fromUtc.getTime()) || !Number.isFinite(untilUtc.getTime()) || fromUtc > untilUtc) throw new Error('Invalid occurrence range');
  if (definition.effectiveFrom && untilUtc < new Date(definition.effectiveFrom)) return [];
  if (definition.effectiveUntil && fromUtc >= new Date(definition.effectiveUntil)) return [];

  switch (definition.ruleType) {
    case 'intervalFromAnchor':
      return anchoredOccurrences(definition, fromUtc, untilUtc);
    case 'dailyLocal':
      return dailyOccurrences(definition, fromUtc, untilUtc);
    case 'fixedUtc':
      if (definition.id === 'game-reset') return dailyOccurrences({ ...definition, schedule: { ...definition.schedule, localTime: '00:00' } }, fromUtc, untilUtc);
      if (definition.id === 'hell-event') return hourlyOccurrences(definition, fromUtc, untilUtc);
      return [];
    case 'dynamicRemote':
    case 'eventWindow':
    case 'fixedLocal':
    case 'intervalFromCheckIn':
    case 'intervalFromCompletion':
    case 'seasonPhase':
    case 'manual':
    case 'randomWithinWindow':
      return [];
    default: {
      const exhaustive: never = definition.ruleType;
      return exhaustive;
    }
  }
}

export function mergeOccurrenceConfirmation(
  occurrence: EventOccurrence,
  variant: string,
  confidence: number,
  sourceRef: string,
): EventOccurrence {
  const normalizedVariant = variant.trim();
  if (!normalizedVariant || normalizedVariant.length > 120) throw new Error('Invalid event variant');
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new Error('Invalid confidence');
  if (!sourceRef || sourceRef.length > 160) throw new Error('Invalid source reference');
  return {
    ...occurrence,
    variant: normalizedVariant,
    status: 'communityConfirmed',
    confidence,
    sourceRefs: [...new Set([...occurrence.sourceRefs, sourceRef])],
  };
}
