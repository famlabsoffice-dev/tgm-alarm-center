import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AppState } from '../domain/alarm';

export const FORMAT = 'tgm-alarm-center-backup';
export const VERSION = 1;
export interface Backup { format: typeof FORMAT; version: 1; exportedAt: string; schemaVersion: 1; data: AppState; }

export function makeBackup(data: AppState): Backup { return { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), schemaVersion: 1, data }; }

export function validateBackup(value: unknown): Backup {
  if (!value || typeof value !== 'object') throw new Error('Ungültiges Backup');
  const x = value as Record<string, unknown>;
  if (x.format !== FORMAT || x.version !== VERSION || x.schemaVersion !== 1 || !x.data || typeof x.data !== 'object') throw new Error('Backup-Version oder Format ist nicht kompatibel');
  const d = x.data as Record<string, unknown>;
  if (!Array.isArray(d.accounts) || !Array.isArray(d.alarms) || !d.notificationPreferences || typeof d.notificationPreferences !== 'object' || typeof d.activeAccountId !== 'string' && d.activeAccountId !== null) throw new Error('Backup-Struktur ist ungültig');
  for (const account of d.accounts as unknown[]) { if (!account || typeof account !== 'object') throw new Error('Ungültiger Account'); const a = account as Record<string, unknown>; if (typeof a.id !== 'string' || typeof a.name !== 'string' || typeof a.color !== 'string' || typeof a.createdAt !== 'string') throw new Error('Ungültige Accountdaten'); }
  for (const alarm of d.alarms as unknown[]) { if (!alarm || typeof alarm !== 'object') throw new Error('Ungültiger Alarm'); const a = alarm as Record<string, unknown>; if (typeof a.id !== 'string' || typeof a.accountId !== 'string' || typeof a.title !== 'string' || typeof a.date !== 'string' || typeof a.time !== 'string' || !Array.isArray(a.warnings) || (a.repeat !== 'once' && a.repeat !== 'daily') || typeof a.completedOccurrences !== 'object') throw new Error('Ungültige Alarmdaten'); }
  return value as Backup;
}

export async function exportBackup(data: AppState): Promise<void> {
  const file = `${FileSystem.cacheDirectory}tgm-alarm-center-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(file, JSON.stringify(makeBackup(data), null, 2), { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen ist auf diesem Gerät nicht verfügbar');
  await Sharing.shareAsync(file, { mimeType: 'application/json', dialogTitle: 'TGM ALARM CENTER Backup' });
}
