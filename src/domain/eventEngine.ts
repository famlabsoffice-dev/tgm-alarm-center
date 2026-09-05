import type { EventDefinition, EventOccurrence } from './eventModel';
import { validateEventDefinition } from './eventModel';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type CalendarDate = { year: number; month: number; day: number };

type DatePart = { type: string; value: string };

function requiredNumberPart(parts: DatePart[], type: string): number {
  const part = parts.find((item) => item.type === type);
  const value = part ? Number(part.value) : Number.NaN;
  if (!Number.isInteger(value)) throw new Error(`Missing Intl date part: ${type}`);
  return value;
}

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

function localDateAt(instant: Date, timeZone: string): CalendarDate {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  return {
    year: requiredNumberPart(parts, 'year'),
    month: requiredNumberPart(parts, 'month'),
    day: requiredNumberPart(parts, 'day'),
  };
}

function zonedLocalToUtc(date: CalendarDate, hour: number, minute: number, timeZone: string): Date {
  let candidate = new Date(Date.UTC(date.year, date.month - 1, date.day, hour, minute));
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(candidate);
    const rendered = Date.UTC(
      requiredNumberPart(parts, 'year'),
      requiredNumberPart(parts, 'month') - 1,
      requiredNumberPart(parts, 'day'),
      requiredNumberPart(parts, 'hour'),
      requiredNumberPart(parts, 'minute'),
    );
    const target = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
    const delta = target - rendered;
    if (delta === 0) break;
    candidate = new Date(candidate.getTime() + delta);
  }
  return candidate;
}

function nextCalendarDate(date: CalendarDate): CalendarDate {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day) + DAY_MS);
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() };
}

function dailyOccurrences(definition: EventDefinition, from: Date, until: Date): EventOccurrence[] {
  const time = definition.schedule.localTime;
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return [];
  const [hour, minute] = time.split(':').map(Number);
  const timeZone = definition.schedule.timezoneId ?? 'UTC';
  const startDate = localDateAt(from, timeZone);
  const result: EventOccurrence[] = [];
  for (let date = startDate; ; date = nextCalendarDate(date)) {
    const start = zonedLocalToUtc(date, hour, minute, timeZone);
    if (start > until) break;
    if (start >= from) result.push(makeOccurrence(definition, start));
    if (result.length >= 512) break;
  }
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
      if (definition.id === 'game-reset') return dailyOccurrences({ ...definition, schedule: { ...definition.schedule, localTime: '00:00', timezoneId: 'UTC' } }, fromUtc, untilUtc);
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
