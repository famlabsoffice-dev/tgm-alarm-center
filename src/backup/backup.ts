import { AppState, Alarm, AlarmType, RepeatMode, SoundProfile, Tier, validateDateTime } from '../domain/alarm';

export const FORMAT = 'tgm-alarm-center-backup';
export const VERSION = 1;
export interface Backup { format: typeof FORMAT; version: 1; exportedAt: string; schemaVersion: 1; data: AppState; }

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
};
const isIso = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(new Date(value).getTime());
const validType = (value: unknown): value is AlarmType => value === 'bubble' || value === 'gwBubble' || value === 'custom' || value === 'individual' || value === 'rss';
const validRepeat = (value: unknown): value is RepeatMode => value === 'once' || value === 'daily' || value === 'gw5d';
const validSound = (value: unknown): value is SoundProfile => value === 'pulse' || value === 'siren' || value === 'chime';
const validTier = (value: unknown): value is Tier => value === 'free' || value === 'streetBoss' || value === 'caporegime' || value === 'underboss' || value === 'boss' || value === 'godfather';
const validColor = (value: unknown): value is string => typeof value === 'string' && /^(#[0-9A-Fa-f]{6}|[a-zA-Z]{1,24})$/.test(value);
const MAX_ACCOUNTS = 50;
const MAX_ALARMS = 500;
const MAX_COMPLETED_OCCURRENCES = 500;
const MAX_WARNINGS = 16;
const MAX_BACKUP_BYTES = 512 * 1024;
const BACKUP_KEYS = ['format', 'version', 'exportedAt', 'schemaVersion', 'data'] as const;

function validateAccount(value: unknown, ids: Set<string>): void {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.length === 0 || ids.has(value.id) || typeof value.name !== 'string' || value.name.trim().length === 0 || value.name.length > 80 || !validColor(value.color) || !isIso(value.createdAt)) throw new Error('Ungültige Accountdaten');
  ids.add(value.id);
}

function validateCompleted(value: unknown): boolean {
  return isRecord(value) && Object.keys(value).length <= MAX_COMPLETED_OCCURRENCES && Object.entries(value).every(([key, item]) => key.length <= 180 && item === true);
}

function validateAlarm(value: unknown, accountIds: Set<string>, alarmIds: Set<string>): void {
  if (!isRecord(value)) throw new Error('Ungültige Alarmdaten');
  const alarm = value as Partial<Alarm> & Record<string, unknown>;
  const warnings = alarm.warnings;
  if (typeof alarm.id !== 'string' || alarm.id.length === 0 || alarmIds.has(alarm.id) || typeof alarm.accountId !== 'string' || !accountIds.has(alarm.accountId) || typeof alarm.title !== 'string' || alarm.title.trim().length === 0 || alarm.title.length > 80 || !validType(alarm.type) || typeof alarm.date !== 'string' || typeof alarm.time !== 'string' || !validateDateTime(alarm.date, alarm.time) || typeof alarm.eventAtUtc !== 'string' || !isIso(alarm.eventAtUtc) || !Array.isArray(warnings) || warnings.length > MAX_WARNINGS || !warnings.every((item) => typeof item === 'number' && Number.isInteger(item) && item >= 1 && item <= 7 * 24 * 60) || !validRepeat(alarm.repeat) || !validSound(alarm.sound) || typeof alarm.active !== 'boolean' || typeof alarm.protected !== 'boolean' || !validateCompleted(alarm.completedOccurrences) || !isIso(alarm.createdAt) || !isIso(alarm.updatedAt)) throw new Error('Ungültige Alarmdaten');
  alarmIds.add(alarm.id);
}

function stripEntitlement(data: AppState): AppState {
  return { ...data, tier: 'free' };
}

export function makeBackup(data: AppState): Backup {
  return { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), schemaVersion: 1, data: stripEntitlement(data) };
}

export function validateBackup(value: unknown): Backup {
  if (!isRecord(value) || !hasOnlyKeys(value, BACKUP_KEYS) || value.format !== FORMAT || value.version !== VERSION || value.schemaVersion !== 1 || !isIso(value.exportedAt) || !isRecord(value.data)) throw new Error('Backup-Version oder Format ist nicht kompatibel');
  const data = value.data;
  if (data.schemaVersion !== 1 || !Array.isArray(data.accounts) || data.accounts.length > MAX_ACCOUNTS || !Array.isArray(data.alarms) || data.alarms.length > MAX_ALARMS || !isRecord(data.notificationPreferences) || (data.activeAccountId !== null && typeof data.activeAccountId !== 'string') || !validTier(data.tier) || (data.testConfirmedAt !== null && !isIso(data.testConfirmedAt))) throw new Error('Backup-Struktur ist ungültig');
  const accountIds = new Set<string>();
  for (const account of data.accounts) validateAccount(account, accountIds);
  if (data.activeAccountId !== null && !accountIds.has(data.activeAccountId)) throw new Error('Aktiver Account fehlt im Backup');
  const preferences = data.notificationPreferences;
  if (!validSound(preferences.sound) || typeof preferences.warningSound !== 'boolean' || typeof preferences.eventSound !== 'boolean' || typeof preferences.vibration !== 'boolean' || typeof preferences.criticalAlerts !== 'boolean' || typeof preferences.preview !== 'boolean') throw new Error('Ungültige Notification-Einstellungen');
  const alarmIds = new Set<string>();
  for (const alarm of data.alarms) validateAlarm(alarm, accountIds, alarmIds);
  return value as unknown as Backup;
}

export function restoreBackup(payload: string | unknown): AppState {
  const parsed = typeof payload === 'string' ? (() => {
    if (payload.length > MAX_BACKUP_BYTES) throw new Error('Backup-Datei ist zu groß');
    return JSON.parse(payload) as unknown;
  })() : payload;
  return stripEntitlement(validateBackup(parsed).data);
}

export async function exportBackup(data: AppState): Promise<void> {
  const FileSystem = await import('expo-file-system');
  const Sharing = await import('expo-sharing');
  const file = `${FileSystem.cacheDirectory}tgm-alarm-center-${Date.now()}.json`;
  const payload = JSON.stringify(makeBackup(data), null, 2);
  if (payload.length > MAX_BACKUP_BYTES) throw new Error('Backup-Datei wäre zu groß');
  await FileSystem.writeAsStringAsync(file, payload, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen ist auf diesem Gerät nicht verfügbar');
  await Sharing.shareAsync(file, { mimeType: 'application/json', dialogTitle: 'TGM ALARM CENTER Backup' });
}
