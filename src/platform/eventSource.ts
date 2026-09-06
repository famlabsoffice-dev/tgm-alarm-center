import type { AlarmableEvent, ExternalEventInput } from './alarmableEvent';
import { normalizeExternalEvent } from './alarmableEvent';

export interface EventSourceAdapter<TInput = unknown> {
  readonly source: AlarmableEvent['source'];
  readonly sourceId: string;
  normalize(input: TInput, now?: Date): AlarmableEvent;
}

export class EventSourceRegistry {
  private readonly adapters = new Map<string, EventSourceAdapter<unknown>>();

  register<TInput>(adapter: EventSourceAdapter<TInput>): void {
    if (!adapter.sourceId.trim()) throw new Error('sourceId is required');
    if (this.adapters.has(adapter.sourceId)) throw new Error(`Event source already registered: ${adapter.sourceId}`);
    this.adapters.set(adapter.sourceId, adapter as EventSourceAdapter<unknown>);
  }

  get(sourceId: string): EventSourceAdapter<unknown> | null {
    return this.adapters.get(sourceId) ?? null;
  }

  normalize(sourceId: string, input: unknown, now?: Date): AlarmableEvent {
    const adapter = this.get(sourceId);
    if (!adapter) throw new Error(`Unknown event source: ${sourceId}`);
    return adapter.normalize(input, now);
  }
}

export interface CanonicalEventAdapterInput extends ExternalEventInput {}

export function createCanonicalAdapter(source: AlarmableEvent['source'], sourceId: string): EventSourceAdapter<CanonicalEventAdapterInput> {
  return {
    source,
    sourceId,
    normalize: (input, now) => {
      if (input.source !== source || input.sourceId !== sourceId) throw new Error('Event source identity mismatch');
      return normalizeExternalEvent(input, now);
    },
  };
}
