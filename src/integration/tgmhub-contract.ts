import type { NotificationPreferences } from '../domain/alarm';
import type { UtilityEventInput, UtilityCategory, UtilityAlarmIntent } from './utility-events';
import { toAlarmIntent, validateUtilityEvent } from './utility-events';

export interface TGMhubEvent {
  event: string;
  start: string;
  end: string | null;
  category: UtilityCategory;
  metadata: Record<string, string | number | boolean | null>;
}

export interface TGMhubContext { eventId: string; accountId: string; }

export function fromTGMhubEvent(event: TGMhubEvent, context: TGMhubContext, defaults: Pick<UtilityEventInput, 'warnings' | 'alarmType' | 'repeat' | 'sound' | 'protected'>): UtilityAlarmIntent {
  const input: UtilityEventInput = {
    id: context.eventId,
    category: event.category,
    title: event.event,
    accountId: context.accountId,
    startAtUtc: event.start,
    endAtUtc: event.end,
    metadata: { ...event.metadata },
    ...defaults,
  };
  validateUtilityEvent(input);
  return toAlarmIntent(input);
}

export interface TGMhubAlarmOutput {
  eventId: string;
  accountId: string;
  event: string;
  start: string;
  schedule: Array<{ kind: 'warning' | 'main'; at: string; warningMinutes?: number }>;
  notifications: { enabled: boolean; critical: boolean };
  tone: UtilityAlarmIntent['sound'];
  userPreferences: NotificationPreferences;
}

export function toTGMhubIntegrationOutput(intent: UtilityAlarmIntent, preferences: NotificationPreferences): TGMhubAlarmOutput {
  const eventTime = new Date(intent.eventAtUtc).getTime();
  const schedule: TGMhubAlarmOutput['schedule'] = intent.warnings.map((warningMinutes) => ({
    kind: 'warning',
    at: new Date(eventTime - warningMinutes * 60 * 1000).toISOString(),
    warningMinutes,
  }));
  schedule.push({ kind: 'main', at: intent.eventAtUtc });
  return {
    eventId: intent.sourceEventId,
    accountId: intent.accountId,
    event: intent.title,
    start: intent.eventAtUtc,
    schedule,
    notifications: { enabled: preferences.warningSound || preferences.eventSound, critical: preferences.criticalAlerts },
    tone: intent.sound,
    userPreferences: { ...preferences },
  };
}
