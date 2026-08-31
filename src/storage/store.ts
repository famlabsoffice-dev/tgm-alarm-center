import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alarm,
  AlarmType,
  AppState,
  NotificationPreferences,
  RepeatMode,
  SoundProfile,
  Tier,
  localDateTimeToUtc,
  localInputFromUtc,
  validateDateTime,
} from '../domain/alarm';

export const STORAGE_KEY = 'tgm-alarm-center-v1';
export const defaultPreferences: NotificationPreferences = {
  sound: 'pulse',
  warningSound: true,
  eventSound: true,
  vibration: true,
  criticalAlerts: true,
  preview: true,
};

export const emptyState = (): AppState => ({
  schemaVersion: 1,
  accounts: [],
  alarms: [],
  activeAccountId: null,
  tier: 'free',
  notificationPreferences: { ...defaultPreferences },
  testConfirmedAt: null,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function isoOr(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : fallback;
}

function validType(value: unknown): AlarmType {
  return value === 'bubble' || value === 'gwBubble' || value === 'custom' ? value : 'custom';
}

function validRepeat(value: unknown, type: AlarmType, legacyGwCycle: unknown): RepeatMode {
  if (value === 'daily' || value === 'gw5d') return value;
  if (legacyGwCycle === true && type === 'gwBubble') return 'gw5d';
  return 'once';
}

function validSound(value: unknown): SoundProfile {
  return value === 'siren' || value === 'chime' || value === 'pulse' ? value : 'pulse';
}

function validWarnings(value: unknown, fallback: number[]): number[] {
  if (!Array.isArray(value)) return [...fallback];
  const warnings = value
    .filter((item): item is number => typeof item === 'number' && Number.isInteger(item) && item >= 1 && item <= 7 * 24 * 60)
    .filter((item, index, all) => all.indexOf(item) === index)
    .sort((a, b) => b - a);
  return warnings.length > 0 ? warnings : [...fallback];
}

function defaultWarnings(type: AlarmType): number[] {
  if (type === 'gwBubble') return [60, 30, 15];
  if (type === 'bubble') return [60, 15];
  return [15];
}

function migrateCompleted(value: unknown, alarmId: string): Record<string, true> {
  const completed: Record<string, true> = {};
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === 'string') {
        const separator = entry.indexOf('|');
        const key = separator >= 0 ? `${alarmId}:${entry.slice(separator + 1)}` : `${alarmId}:${entry}`;
        completed[key] = true;
      }
    }
    return completed;
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) if (item === true) completed[key] = true;
  }
  return completed;
}

function normalizeAlarm(value: unknown, accountIds: Set<string>): Alarm | null {
  if (!isRecord(value)) return null;
  const type = validType(value.type);
  const accountId = stringOr(value.accountId, '');
  if (!accountId || !accountIds.has(accountId)) return null;
  const id = stringOr(value.id, '');
  const title = stringOr(value.title, '');
  if (!id || !title || title.length > 80) return null;
  let date = typeof value.date === 'string' ? value.date : '';
  let time = typeof value.time === 'string' ? value.time : '';
  let eventAtUtc = typeof value.eventAtUtc === 'string' ? value.eventAtUtc : '';
  if (!Number.isFinite(new Date(eventAtUtc).getTime()) && validateDateTime(date, time)) {
    eventAtUtc = localDateTimeToUtc(date, time) ?? '';
  }
  if (!Number.isFinite(new Date(eventAtUtc).getTime())) return null;
  if (!validateDateTime(date, time)) {
    try {
      ({ date, time } = localInputFromUtc(eventAtUtc));
    } catch {
      return null;
    }
  }
  const createdAt = isoOr(value.createdAt, new Date().toISOString());
  const updatedAt = isoOr(value.updatedAt, createdAt);
  return {
    id,
    accountId,
    title,
    type,
    date,
    time,
    eventAtUtc: new Date(eventAtUtc).toISOString(),
    warnings: validWarnings(value.warnings, defaultWarnings(type)),
    repeat: validRepeat(value.repeat, type, value.gwCycle),
    sound: validSound(value.sound),
    active: value.active !== false,
    protected: value.protected === true,
    completedOccurrences: migrateCompleted(value.completedOccurrences, id),
    createdAt,
    updatedAt,
  };
}

function normalizeState(value: unknown): AppState {
  const base = emptyState();
  if (!isRecord(value)) return base;
  const accounts = Array.isArray(value.accounts)
    ? value.accounts.filter(isRecord).map((account) => ({
      id: stringOr(account.id, ''),
      name: stringOr(account.name, ''),
      color: stringOr(account.color, '#F0C76A'),
      createdAt: isoOr(account.createdAt, new Date().toISOString()),
    })).filter((account) => account.id && account.name && account.name.length <= 80)
    : [];
  const uniqueAccounts = accounts.filter((account, index, all) => all.findIndex((item) => item.id === account.id) === index);
  const accountIds = new Set(uniqueAccounts.map((account) => account.id));
  const alarms = Array.isArray(value.alarms)
    ? value.alarms.map((alarm) => normalizeAlarm(alarm, accountIds)).filter((alarm): alarm is Alarm => alarm !== null)
    : [];
  const legacyTier = value.tierId === 'street' ? 'streetBoss' : value.tierId === 'caporegime' ? 'caporegime' : value.tierId === 'godfather' ? 'godfather' : value.tier;
  const tier: Tier = legacyTier === 'streetBoss' || legacyTier === 'caporegime' || legacyTier === 'godfather' ? legacyTier : 'free';
  const rawPreferences = isRecord(value.notificationPreferences) ? value.notificationPreferences : isRecord(value.preferences) ? value.preferences : {};
  const preferences: NotificationPreferences = {
    sound: validSound(rawPreferences.sound),
    warningSound: rawPreferences.warningSound !== false,
    eventSound: rawPreferences.eventSound !== false && rawPreferences.alarmSound !== false,
    vibration: rawPreferences.vibration !== false,
    criticalAlerts: rawPreferences.criticalAlerts !== false && rawPreferences.criticalAlertsEnabled !== false,
    preview: rawPreferences.preview !== false,
  };
  const requestedAccount = typeof value.activeAccountId === 'string' && accountIds.has(value.activeAccountId) ? value.activeAccountId : null;
  const activeAccountId = requestedAccount ?? uniqueAccounts[0]?.id ?? null;
  const testConfirmedAt = value.testConfirmedAt === null || value.testConfirmedAt === undefined
    ? null
    : (() => {
      const normalized = isoOr(value.testConfirmedAt, '');
      return normalized || null;
    })();
  return {
    schemaVersion: 1,
    accounts: uniqueAccounts,
    alarms,
    activeAccountId,
    tier,
    notificationPreferences: preferences,
    testConfirmedAt,
  };
}

export async function loadState(): Promise<AppState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyState();
  try {
    return normalizeState(JSON.parse(raw) as unknown);
  } catch {
    return emptyState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  const normalized = normalizeState(state);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export async function resetState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
