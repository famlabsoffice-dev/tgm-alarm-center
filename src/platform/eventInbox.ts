import type { Alarm, Tier } from '../domain/alarm';
import { TIER_LIMITS } from '../domain/alarm';
import { alarmFromEvent } from './eventToAlarm';
import type { AlarmableEvent } from './alarmableEvent';

export type EventInboxStatus = 'new' | 'dismissed' | 'added';

export interface EventInboxItem {
  event: AlarmableEvent;
  status: EventInboxStatus;
  receivedAt: string;
  dismissedAt?: string;
  addedAlarmId?: string;
}

export interface EventRecommendation {
  event: AlarmableEvent;
  score: number;
  reasons: string[];
}

const PRIORITY_SCORE = { low: 5, normal: 15, high: 30, critical: 50 } as const;
const UPCOMING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function upsertInboxEvent(items: EventInboxItem[], event: AlarmableEvent, receivedAt = new Date()): EventInboxItem[] {
  const existingIndex = items.findIndex((item) => item.event.id === event.id);
  const replacement: EventInboxItem = existingIndex >= 0
    ? { ...items[existingIndex], event, status: items[existingIndex].status === 'dismissed' ? 'new' : items[existingIndex].status }
    : { event, status: 'new', receivedAt: receivedAt.toISOString() };
  if (existingIndex < 0) return [replacement, ...items];
  return items.map((item, index) => index === existingIndex ? replacement : item);
}

export function dismissInboxEvent(items: EventInboxItem[], eventId: string, now = new Date()): EventInboxItem[] {
  return items.map((item) => item.event.id === eventId
    ? { ...item, status: 'dismissed', dismissedAt: now.toISOString() }
    : item);
}

export function markInboxEventAdded(items: EventInboxItem[], eventId: string, alarmId: string): EventInboxItem[] {
  return items.map((item) => item.event.id === eventId
    ? { ...item, status: 'added', addedAlarmId: alarmId }
    : item);
}

export function visibleInboxItems(items: EventInboxItem[]): EventInboxItem[] {
  return items.filter((item) => item.status !== 'dismissed').sort((a, b) => new Date(a.event.startAtUtc).getTime() - new Date(b.event.startAtUtc).getTime());
}

export function recommendEvents(items: EventInboxItem[], alarms: Alarm[], now = new Date()): EventRecommendation[] {
  const nowMs = now.getTime();
  const accountAlarmIds = new Set(alarms.map((alarm) => alarm.id));
  return visibleInboxItems(items)
    .filter((item) => item.status === 'new' || !item.addedAlarmId || !accountAlarmIds.has(item.addedAlarmId))
    .map((item) => {
      const event = item.event;
      const startMs = new Date(event.startAtUtc).getTime();
      const delta = startMs - nowMs;
      let score = PRIORITY_SCORE[event.priority];
      const reasons: string[] = [`Priorität: ${event.priority}`];
      if (delta > 0 && delta <= UPCOMING_WINDOW_MS) {
        score += 20;
        reasons.push('Ereignis liegt in den nächsten 7 Tagen');
      }
      if (event.warningMinutes.length > 0) {
        score += Math.min(15, event.warningMinutes.length * 5);
        reasons.push(`${event.warningMinutes.length} Vorwarnung${event.warningMinutes.length === 1 ? '' : 'en'} hinterlegt`);
      }
      if (event.action === 'notify-and-open') {
        score += 10;
        reasons.push('Öffnen nach Benachrichtigung vorgesehen');
      }
      if (event.repeat !== 'once') {
        score += 5;
        reasons.push('Wiederkehrendes Ereignis');
      }
      return { event, score: normalizeScore(score), reasons };
    })
    .sort((a, b) => b.score - a.score || new Date(a.event.startAtUtc).getTime() - new Date(b.event.startAtUtc).getTime());
}

export function canAddEventAlarm(tier: Tier, alarms: Alarm[], accountId: string): { allowed: boolean; reason?: string } {
  const limits = TIER_LIMITS[tier];
  const accountAlarms = alarms.filter((alarm) => alarm.accountId === accountId);
  if (Number.isFinite(limits.alarms) && alarms.length >= limits.alarms) return { allowed: false, reason: 'Alarm-Limit des Plans erreicht' };
  const eventAlarms = accountAlarms.filter((alarm) => alarm.type === 'custom').length;
  if (Number.isFinite(limits.perAccount.eventAlarms) && eventAlarms >= limits.perAccount.eventAlarms) {
    return { allowed: false, reason: 'Event-Alarm-Limit des Accounts erreicht' };
  }
  return { allowed: true };
}

export function buildInboxAlarm(item: EventInboxItem, accountId: string, now = new Date()): Alarm {
  return alarmFromEvent(item.event, { accountId, now, titlePrefix: item.event.source === 'manual' ? undefined : item.event.sourceId });
}
