import type { Alarm, AlarmTemplate } from '../domain/alarm';
import type { AlarmableEvent } from './alarmableEvent';

export interface EventAlarmMapping {
  accountId: string;
  protected?: boolean;
  titlePrefix?: string;
  now?: Date;
}

export function alarmTemplateFromEvent(event: AlarmableEvent): AlarmTemplate {
  return {
    title: event.title,
    type: event.alarmType,
    warnings: [...event.warningMinutes],
    repeat: event.repeat,
    sound: event.sound,
    protected: event.priority === 'critical' || event.priority === 'high',
  };
}

export function alarmFromEvent(event: AlarmableEvent, mapping: EventAlarmMapping): Alarm {
  const start = new Date(event.startAtUtc);
  if (!Number.isFinite(start.getTime())) throw new Error('Event startAtUtc is invalid');
  const template = alarmTemplateFromEvent(event);
  const now = mapping.now ?? new Date();
  return {
    id: `event:${event.id}`,
    accountId: mapping.accountId,
    title: mapping.titlePrefix ? `${mapping.titlePrefix} · ${template.title}` : template.title,
    type: template.type,
    date: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-${String(start.getUTCDate()).padStart(2, '0')}`,
    time: `${String(start.getUTCHours()).padStart(2, '0')}:${String(start.getUTCMinutes()).padStart(2, '0')}`,
    eventAtUtc: event.startAtUtc,
    warnings: [...template.warnings],
    repeat: template.repeat,
    sound: template.sound,
    active: true,
    protected: mapping.protected ?? template.protected,
    completedOccurrences: {},
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
