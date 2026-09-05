import type { EventDefinition, Provenance } from './eventModel';

const source: Provenance = {
  id: 'internal-masterplan',
  sourceType: 'configured',
  label: 'Configured product rule',
  reference: 'local://masterplan/event-rules',
  observedAt: '2026-09-05T00:00:00.000Z',
};

const moments = (minutes: number[]) => [
  ...minutes.map((minutesBefore) => ({ kind: 'warning' as const, minutesBefore })),
  { kind: 'start' as const },
];

const dynamic = (id: string, category: string, titleKey: string, minutes: number[], confidence = 0.5): EventDefinition => ({
  id,
  version: 1,
  category,
  titleKey,
  ruleType: 'dynamicRemote',
  schedule: { ruleType: 'dynamicRemote' },
  criticalMoments: moments(minutes),
  sources: [source],
  confidence,
});

export const MASTER_EVENT_CATALOG: readonly EventDefinition[] = [
  {
    id: 'game-reset', version: 1, category: 'global', titleKey: 'event.gameReset', ruleType: 'fixedUtc',
    schedule: { ruleType: 'fixedUtc', localTime: '00:00' }, criticalMoments: moments([15]), sources: [source], confidence: 1,
  },
  {
    id: 'personal-event', version: 1, category: 'personal', titleKey: 'event.personal', ruleType: 'intervalFromAnchor',
    schedule: { ruleType: 'intervalFromAnchor', anchorUtc: '2026-01-01T00:00:00.000Z', intervalMinutes: 180 },
    variantSource: { mode: 'unknownUntilConfirmed' }, criticalMoments: moments([15]), sources: [source], confidence: 1,
  },
  {
    id: 'hell-event', version: 1, category: 'personal', titleKey: 'event.hell', ruleType: 'fixedUtc',
    schedule: { ruleType: 'fixedUtc', localTime: '00:00', durationMinutes: 55 }, variantSource: { mode: 'unknownUntilConfirmed' },
    duration: { minutes: 55 }, criticalMoments: moments([15]), sources: [source], confidence: 1,
  },
  {
    id: 'personal-tasks', version: 1, category: 'tasks', titleKey: 'event.personalTasks', ruleType: 'dailyLocal',
    schedule: { ruleType: 'dailyLocal', localTime: '00:00' }, criticalMoments: moments([15]), sources: [source], confidence: 0.8,
  },
  {
    id: 'six-hour-task-cycle', version: 1, category: 'tasks', titleKey: 'event.sixHourTasks', ruleType: 'intervalFromAnchor',
    schedule: { ruleType: 'intervalFromAnchor', anchorUtc: '2026-01-01T00:00:00.000Z', intervalMinutes: 360 },
    criticalMoments: moments([15]), sources: [source], confidence: 1,
  },
  {
    id: 'governors-war-cycle', version: 1, category: 'governorsWar', titleKey: 'event.governorsWar', ruleType: 'intervalFromAnchor',
    schedule: { ruleType: 'intervalFromAnchor', anchorUtc: '2026-01-01T00:00:00.000Z', intervalMinutes: 7200, durationMinutes: 1440 },
    duration: { minutes: 1440 }, criticalMoments: moments([60, 30, 15]), sources: [source], confidence: 1,
  },
  dynamic('vip-tasks', 'tasks', 'event.vipTasks', [15], 0.6),
  dynamic('private-club-reset', 'tasks', 'event.privateClubReset', [15], 0.6),
  dynamic('smuggler-tasks', 'tasks', 'event.smugglerTasks', [15], 0.7),
  dynamic('family-tasks', 'tasks', 'event.familyTasks', [15], 0.7),
  dynamic('faction-tasks', 'faction', 'event.factionTasks', [15], 0.7),
  dynamic('weapon-trades', 'commerce', 'event.weaponTrades', [15], 0.6),
  dynamic('daily-task-deadlines', 'tasks', 'event.dailyTaskDeadlines', [60, 15], 0.6),
  dynamic('weekly-task-deadlines', 'tasks', 'event.weeklyTaskDeadlines', [1440, 60, 15], 0.6),
  dynamic('faction-call-up', 'faction', 'event.factionCallUp', [60, 15]),
  dynamic('restricted-base-siege', 'faction', 'event.restrictedBaseSiege', [60, 15]),
  dynamic('glory-of-oakvale', 'faction', 'event.gloryOfOakvale', [60, 15]),
  dynamic('underground-market', 'faction', 'event.undergroundMarket', [60, 15]),
  dynamic('governors-war-warm-up', 'governorsWar', 'event.governorsWarWarmUp', [1440, 60, 15]),
  dynamic('strongest-leader', 'governorsWar', 'event.strongestLeader', [1440, 60, 15]),
  dynamic('faction-hegemony', 'governorsWar', 'event.factionHegemony', [1440, 60, 15]),
  dynamic('massacre-day', 'governorsWar', 'event.massacreDay', [60, 30, 15]),
  dynamic('resource-development-influence-day', 'governorsWar', 'event.resourceDevelopmentInfluenceDay', [1440, 60, 15]),
  dynamic('battle-for-city-hall', 'city', 'event.battleForCityHall', [1440, 60, 15]),
  dynamic('city-vs-city', 'city', 'event.cityVsCity', [1440, 60, 15]),
  dynamic('city-capture-battle', 'city', 'event.cityCaptureBattle', [60, 15]),
  dynamic('abandoned-building-exploration', 'special', 'event.abandonedBuildingExploration', [60, 15]),
  dynamic('lupos-operation', 'special', 'event.luposOperation', [60, 15]),
  dynamic('white-dove-activities', 'special', 'event.whiteDoveActivities', [60, 15]),
  dynamic('hellcat-professor-token-source', 'special', 'event.hellcatProfessorTokenSource', [60, 15]),
  dynamic('bone-crusher-gw-path', 'special', 'event.boneCrusherGwPath', [60, 15]),
  dynamic('season-of-chaos', 'season', 'event.seasonOfChaos', [1440, 60, 15]),
  dynamic('stained-in-red', 'season', 'event.stainedInRed', [1440, 60, 15]),
  dynamic('narcos-crossover', 'crossover', 'event.narcos', [1440, 60, 15]),
  dynamic('kof-xv-crossover', 'crossover', 'event.kofXV', [1440, 60, 15]),
  dynamic('sale-events', 'commerce', 'event.saleEvents', [60, 15]),
  dynamic('pack-events', 'commerce', 'event.packEvents', [60, 15]),
  dynamic('premium-dealer', 'commerce', 'event.premiumDealer', [60, 15]),
  dynamic('weapon-emporium', 'commerce', 'event.weaponEmporium', [60, 15]),
  dynamic('super-saver', 'commerce', 'event.superSaver', [60, 15]),
  dynamic('reward-claim-window', 'commerce', 'event.rewardClaimWindow', [60, 15]),
];

export function eventDefinition(id: string): EventDefinition | null {
  return MASTER_EVENT_CATALOG.find((definition) => definition.id === id) ?? null;
}
