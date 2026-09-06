import type { AlarmableEvent, EventPriority } from './alarmableEvent';
import { normalizeExternalEvent } from './alarmableEvent';

export type FirstPartyUtilityCategory =
  | 'gw'
  | 'bubble'
  | 'events'
  | 'protection'
  | 'resource'
  | 'training'
  | 'upgrade'
  | 'custom-operation';

export interface FirstPartyUtilityEventInput {
  utility: FirstPartyUtilityCategory;
  id: string;
  title: string;
  description?: string;
  startAtUtc: string;
  endAtUtc?: string;
  timezone?: string;
  priority?: EventPriority;
  warningMinutes?: number[];
  metadata?: Record<string, unknown>;
}

const sourceId = 'tgm-alarm-center';

export function firstPartyUtilityEvent(input: FirstPartyUtilityEventInput): AlarmableEvent {
  return normalizeExternalEvent({
    source: 'native',
    sourceId,
    sourceEventId: `${input.utility}:${input.id}`,
    title: input.title,
    description: input.description,
    category: input.utility,
    startAtUtc: input.startAtUtc,
    endAtUtc: input.endAtUtc,
    timezone: input.timezone,
    priority: input.priority,
    alarmType: input.utility === 'bubble' ? 'bubble' : input.utility === 'gw' ? 'gwBubble' : 'custom',
    warningMinutes: input.warningMinutes,
    metadata: {
      ...input.metadata,
      utility: input.utility,
    },
  });
}

export function firstPartyUtilityEvents(inputs: FirstPartyUtilityEventInput[]): AlarmableEvent[] {
  const byId = new Map<string, AlarmableEvent>();
  for (const input of inputs) {
    const event = firstPartyUtilityEvent(input);
    const existing = byId.get(event.id);
    if (!existing || event.updatedAt > existing.updatedAt) {
      byId.set(event.id, event);
    }
  }
  return [...byId.values()].sort((a, b) => a.startAtUtc.localeCompare(b.startAtUtc));
}
