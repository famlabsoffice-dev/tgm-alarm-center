import type { EventDefinition } from './eventModel';

const source = {
  id: 'internal-masterplan',
  sourceType: 'official' as const,
  label: 'Configured product rule',
  reference: 'local://masterplan/event-rules',
  observedAt: '2026-09-05T00:00:00.000Z',
};

const moments = (minutes: number[]) => [
  ...minutes.map((minutesBefore) => ({ kind: 'warning' as const, minutesBefore })),
  { kind: 'start' as const },
];

export const MASTER_EVENT_CATALOG: readonly EventDefinition[] = [
  {
    id: 'game-reset', version: 1, category: 'global', titleKey: 'event.gameReset', ruleType: 'fixedUtc',
    schedule: { ruleType: 'fixedUtc', localTime: '00:00' },
    criticalMoments: moments([15]), sources: [source], confidence: 1,
  },
  {
    id: 'personal-event', version: 1, category: 'personal', titleKey: 'event.personal', ruleType: 'intervalFromAnchor',
    schedule: { ruleType: 'intervalFromAnchor', anchorUtc: '2026-01-01T00:00:00.000Z', intervalMinutes: 180 },
    variantSource: { mode: 'unknownUntilConfirmed' },
    criticalMoments: moments([15]), sources: [source], confidence: 1,
  },
  {
    id: 'hell-event', version: 1, category: 'personal', titleKey: 'event.hell', ruleType: 'fixedUtc',
    schedule: { ruleType: 'fixedUtc', localTime: ':00', durationMinutes: 55 },
    variantSource: { mode: 'unknownUntilConfirmed' },
    duration: { minutes: 55 }, criticalMoments: moments([15]), sources: [source], confidence: 1,
  },
  {
    id: 'six-hour-task-cycle', version: 1, category: 'tasks', titleKey: 'event.sixHourTasks', ruleType: 'intervalFromAnchor',
    schedule: { ruleType: 'intervalFromAnchor', intervalMinutes: 360 },
    criticalMoments: moments([15]), sources: [source], confidence: 1,
  },
  {
    id: 'governors-war-cycle', version: 1, category: 'governorsWar', titleKey: 'event.governorsWar', ruleType: 'intervalFromAnchor',
    schedule: { ruleType: 'intervalFromAnchor', anchorUtc: '2026-01-01T00:00:00.000Z', intervalMinutes: 7200, durationMinutes: 1440 },
    duration: { minutes: 1440 }, criticalMoments: moments([60, 30, 15]), sources: [source], confidence: 1,
  },
  {
    id: 'faction-call-up', version: 1, category: 'faction', titleKey: 'event.factionCallUp', ruleType: 'dynamicRemote',
    schedule: { ruleType: 'dynamicRemote' }, criticalMoments: moments([60, 15]), sources: [source], confidence: 0.5,
  },
  {
    id: 'massacre-day', version: 1, category: 'governorsWar', titleKey: 'event.massacreDay', ruleType: 'dynamicRemote',
    schedule: { ruleType: 'dynamicRemote' }, criticalMoments: moments([60, 30, 15]), sources: [source], confidence: 0.5,
  },
];

export function eventDefinition(id: string): EventDefinition | null {
  return MASTER_EVENT_CATALOG.find((definition) => definition.id === id) ?? null;
}
