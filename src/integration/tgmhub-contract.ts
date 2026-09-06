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
  warnings: number[];
  tone: string;
  preferencesRequired: true;
}

export function toTGMhubIntegrationOutput(intent: UtilityAlarmIntent): TGMhubAlarmOutput {
  return {
    eventId: intent.sourceEventId,
    accountId: intent.accountId,
    event: intent.title,
    start: intent.eventAtUtc,
    warnings: [...intent.warnings],
    tone: intent.sound,
    preferencesRequired: true,
  };
}
