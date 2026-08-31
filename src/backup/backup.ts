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
  if (!Array.isArray(d.accounts) || !Array.isArray(d.alarms) || !Array.isArray(d.notificationPreferences)) throw new Error('Backup-Struktur ist ungültig');
  return value as Backup;
}

export async function exportBackup(data: AppState): Promise<void> {
  const file = `${FileSystem.cacheDirectory}tgm-alarm-center-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(file, JSON.stringify(makeBackup(data), null, 2), { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen ist auf diesem Gerät nicht verfügbar');
  await Sharing.shareAsync(file, { mimeType: 'application/json', dialogTitle: 'TGM ALARM CENTER Backup' });
}
