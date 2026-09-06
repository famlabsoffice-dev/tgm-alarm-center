import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EventInboxItem } from './eventInbox';
import type { AlarmableEvent, EventPriority, EventSourceKind, AlarmAction } from './alarmableEvent';

export const EVENT_INBOX_STORAGE_KEY = 'tgm-alarm-center-event-inbox-v1';
const MAX_ITEMS = 200;
const MAX_METADATA_KEYS = 40;

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isSource = (value: unknown): value is EventSourceKind => value === 'native' || value === 'partner' || value === 'manual' || value === 'import';
const isPriority = (value: unknown): value is EventPriority => value === 'low' || value === 'normal' || value === 'high' || value === 'critical';
const isAction = (value: unknown): value is AlarmAction => value === 'notify' || value === 'notify-and-open';
const iso = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(new Date(value).getTime());

function normalizeEvent(value: unknown): AlarmableEvent | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.sourceId !== 'string' || typeof value.sourceEventId !== 'string' || typeof value.title !== 'string') return null;
  if (!isSource(value.source) || !isPriority(value.priority) || !isAction(value.action)) return null;
  if (!iso(value.startAtUtc) || (value.endAtUtc !== null && !iso(value.endAtUtc)) || !iso(value.createdAt) || !iso(value.updatedAt)) return null;
  if (!Array.isArray(value.warningMinutes) || !value.warningMinutes.every((item) => Number.isInteger(item) && item > 0 && item <= 7 * 24 * 60)) return null;
  const metadata = isRecord(value.metadata) ? Object.fromEntries(Object.entries(value.metadata).slice(0, MAX_METADATA_KEYS).filter(([, item]) => ['string', 'number', 'boolean'].includes(typeof item))) as Record<string, string | number | boolean> : {};
  return {
    id: value.id,
    source: value.source,
    sourceId: value.sourceId,
    sourceEventId: value.sourceEventId,
    title: value.title,
    description: typeof value.description === 'string' ? value.description : '',
    category: typeof value.category === 'string' ? value.category : 'general',
    startAtUtc: value.startAtUtc,
    endAtUtc: value.endAtUtc === null ? null : value.endAtUtc,
    timezone: typeof value.timezone === 'string' ? value.timezone : 'UTC',
    priority: value.priority,
    alarmType: value.alarmType === 'bubble' || value.alarmType === 'gwBubble' || value.alarmType === 'custom' || value.alarmType === 'individual' || value.alarmType === 'rss' ? value.alarmType : 'custom',
    repeat: value.repeat === 'daily' || value.repeat === 'gw5d' || value.repeat === 'once' ? value.repeat : 'once',
    warningMinutes: [...new Set(value.warningMinutes)].sort((a, b) => b - a),
    sound: value.sound === 'siren' || value.sound === 'pulse' || value.sound === 'chime' ? value.sound : 'chime',
    action: value.action,
    metadata,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function normalizeItem(value: unknown): EventInboxItem | null {
  if (!isRecord(value)) return null;
  const event = normalizeEvent(value.event);
  if (!event || (value.status !== 'new' && value.status !== 'dismissed' && value.status !== 'added') || !iso(value.receivedAt)) return null;
  const result: EventInboxItem = { event, status: value.status, receivedAt: value.receivedAt };
  if (typeof value.dismissedAt === 'string' && iso(value.dismissedAt)) result.dismissedAt = value.dismissedAt;
  if (typeof value.addedAlarmId === 'string' && value.addedAlarmId) result.addedAlarmId = value.addedAlarmId;
  return result;
}

export async function loadEventInbox(): Promise<EventInboxItem[]> {
  const raw = await AsyncStorage.getItem(EVENT_INBOX_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeItem).filter((item): item is EventInboxItem => item !== null).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export async function saveEventInbox(items: EventInboxItem[]): Promise<void> {
  const trimmed = items.slice(0, MAX_ITEMS);
  await AsyncStorage.setItem(EVENT_INBOX_STORAGE_KEY, JSON.stringify(trimmed));
}
