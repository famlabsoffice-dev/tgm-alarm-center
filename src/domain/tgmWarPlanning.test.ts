import { buildAlarm, BUBBLE_DURATIONS, TEMPLATES, upcomingMoments } from './alarm';
import { buildWarPlan, nextCriticalEvent } from './tgmWarPlanning';

describe('TGM war planning', () => {
  const accountId = 'test-account';
  const now = new Date('2026-09-05T08:00:00.000Z');

  it('exposes all requested bubble durations', () => {
    expect(BUBBLE_DURATIONS.map((item) => item.hours)).toEqual([4, 8, 24, 72, 168, 336, 504]);
  });

  it('uses the selected long-term bubble duration for its end moment', () => {
    const alarm = buildAlarm({ ...TEMPLATES.bubble, durationHours: 336 }, accountId, '2026-09-06', '10:00');
    const moments = upcomingMoments(alarm, now);
    const end = moments.find((moment) => moment.kind === 'end');
    expect(end?.endAt?.getTime()).toBe(new Date(alarm.eventAtUtc).getTime() + 336 * 60 * 60 * 1000);
  });

  it('creates CvC preparation, battle day and end phases', () => {
    const alarm = buildAlarm(TEMPLATES.cvc, accountId, '2026-09-06', '10:00');
    const plan = buildWarPlan(alarm, now);
    expect(plan?.eventType).toBe('cvc');
    expect(plan?.items.map((item) => item.title)).toEqual(['CvC Preparation', 'CvC Battle Day', 'CvC Cycle End']);
    expect(plan?.battleDayAt).not.toBeNull();
  });

  it('creates faction plans for Oakvale and Underground Market', () => {
    const oakvale = buildAlarm({ ...TEMPLATES.faction, factionEvent: 'oakvale' }, accountId, '2026-09-06', '12:00');
    const market = buildAlarm({ ...TEMPLATES.faction, factionEvent: 'undergroundMarket' }, accountId, '2026-09-06', '14:00');
    expect(buildWarPlan(oakvale, now)?.title).toBe('Oakvale');
    expect(buildWarPlan(market, now)?.title).toBe('Underground Market');
  });

  it('returns the earliest critical notification or event', () => {
    const later = buildAlarm(TEMPLATES.custom, accountId, '2026-09-06', '12:00');
    const earlier = buildAlarm(TEMPLATES.custom, accountId, '2026-09-05', '10:00');
    const next = nextCriticalEvent([later, earlier], now);
    expect(next?.alarm.id).toBe(earlier.id);
    expect(next?.kind).toBe('warning');
  });
});
