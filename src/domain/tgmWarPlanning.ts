import type { Alarm, FactionEvent } from './alarm';
import { nextOccurrence, upcomingMoments } from './alarm';

export type WarPlanPhase = 'preparation' | 'battle' | 'cooldown';

export interface WarPlanItem {
  id: string;
  title: string;
  phase: WarPlanPhase;
  atUtc: string;
  alarmId: string | null;
}

export interface NextCriticalEvent {
  alarm: Alarm;
  event: Date;
  minutesUntil: number;
  kind: 'event' | 'warning' | 'end';
}

export interface WarPlan {
  title: string;
  eventType: 'gw' | 'cvc' | 'faction';
  startsAt: string;
  battleDayAt: string | null;
  endsAt: string;
  items: WarPlanItem[];
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export function nextCriticalEvent(alarms: Alarm[], now = new Date()): NextCriticalEvent | null {
  const candidates: NextCriticalEvent[] = [];
  for (const alarm of alarms) {
    const event = nextOccurrence(alarm, now);
    if (!event) continue;
    const minutesUntil = Math.max(0, Math.ceil((event.getTime() - now.getTime()) / MINUTE));
    candidates.push({ alarm, event, minutesUntil, kind: 'event' });
    const moments = upcomingMoments(alarm, now);
    for (const moment of moments) {
      if (moment.at.getTime() <= now.getTime()) continue;
      candidates.push({
        alarm,
        event: moment.at,
        minutesUntil: Math.max(0, Math.ceil((moment.at.getTime() - now.getTime()) / MINUTE)),
        kind: moment.kind === 'end' || moment.kind === 'end-warning' ? 'end' : 'warning',
      });
    }
  }
  candidates.sort((a, b) => a.event.getTime() - b.event.getTime());
  return candidates[0] ?? null;
}

export function buildWarPlan(alarm: Alarm, now = new Date()): WarPlan | null {
  const startsAt = nextOccurrence(alarm, now);
  if (!startsAt) return null;
  if (alarm.type === 'gwBubble') {
    const endsAt = new Date(startsAt.getTime() + DAY);
    const battleDayAt = new Date(endsAt.getTime() - DAY);
    return {
      title: alarm.title,
      eventType: 'gw',
      startsAt: startsAt.toISOString(),
      battleDayAt: battleDayAt.toISOString(),
      endsAt: endsAt.toISOString(),
      items: [
        { id: `${alarm.id}:gw-start`, title: 'GW Bubble Start', phase: 'preparation', atUtc: startsAt.toISOString(), alarmId: alarm.id },
        { id: `${alarm.id}:massacre`, title: 'Massacre Day', phase: 'battle', atUtc: battleDayAt.toISOString(), alarmId: alarm.id },
        { id: `${alarm.id}:gw-end`, title: 'GW Bubble End', phase: 'cooldown', atUtc: endsAt.toISOString(), alarmId: alarm.id },
      ],
    };
  }
  if (alarm.type === 'cvc') {
    const endsAt = new Date(startsAt.getTime() + DAY);
    const battleDayAt = new Date(endsAt.getTime() - DAY);
    return {
      title: alarm.title,
      eventType: 'cvc',
      startsAt: startsAt.toISOString(),
      battleDayAt: battleDayAt.toISOString(),
      endsAt: endsAt.toISOString(),
      items: [
        { id: `${alarm.id}:cvc-start`, title: 'CvC Preparation', phase: 'preparation', atUtc: startsAt.toISOString(), alarmId: alarm.id },
        { id: `${alarm.id}:battle`, title: 'CvC Battle Day', phase: 'battle', atUtc: battleDayAt.toISOString(), alarmId: alarm.id },
        { id: `${alarm.id}:cvc-end`, title: 'CvC Cycle End', phase: 'cooldown', atUtc: endsAt.toISOString(), alarmId: alarm.id },
      ],
    };
  }
  if (alarm.type === 'faction') {
    const endsAt = new Date(startsAt.getTime() + DAY);
    return {
      title: factionLabel(alarm.factionEvent),
      eventType: 'faction',
      startsAt: startsAt.toISOString(),
      battleDayAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      items: [
        { id: `${alarm.id}:faction-start`, title: factionLabel(alarm.factionEvent), phase: 'battle', atUtc: startsAt.toISOString(), alarmId: alarm.id },
        { id: `${alarm.id}:faction-end`, title: 'Faction Event End', phase: 'cooldown', atUtc: endsAt.toISOString(), alarmId: alarm.id },
      ],
    };
  }
  return null;
}

export function factionLabel(event: FactionEvent | undefined): string {
  if (event === 'oakvale') return 'Oakvale';
  if (event === 'undergroundMarket') return 'Underground Market';
  return 'Faction Battle Event';
}
