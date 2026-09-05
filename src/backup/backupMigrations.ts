import type { AppState } from '../domain/alarm';
import { FORMAT as V1_FORMAT, VERSION as V1_VERSION, validateBackup, type Backup as BackupV1 } from './backup';

export const CURRENT_BACKUP_VERSION = 2 as const;
export const CURRENT_BACKUP_SCHEMA_VERSION = 2 as const;

export interface BackupV2 {
  format: typeof V1_FORMAT;
  version: 2;
  exportedAt: string;
  schemaVersion: 2;
  data: AppState;
  migrations: string[];
}

export type SupportedBackup = BackupV1 | BackupV2;

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isIso = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));

export function upgradeBackupV1ToV2(backup: BackupV1): BackupV2 {
  if (backup.version !== V1_VERSION || backup.schemaVersion !== 1) throw new Error('Nur Backup Schema 1 kann auf Schema 2 migriert werden');
  return {
    format: V1_FORMAT,
    version: 2,
    exportedAt: backup.exportedAt,
    schemaVersion: 2,
    data: structuredClone(backup.data),
    migrations: ['backup-v1-to-v2'],
  };
}

export function validateBackupV2(value: unknown): BackupV2 {
  if (!isRecord(value) || value.format !== V1_FORMAT || value.version !== CURRENT_BACKUP_VERSION || value.schemaVersion !== CURRENT_BACKUP_SCHEMA_VERSION || !isIso(value.exportedAt) || !isRecord(value.data) || !Array.isArray(value.migrations) || !value.migrations.every((item) => typeof item === 'string' && item.length > 0 && item.length <= 120)) throw new Error('Backup Schema 2 ist ungültig');
  if (!value.migrations.includes('backup-v1-to-v2')) throw new Error('Backup Schema 2 benötigt den Migrationsnachweis');
  const source = { ...value, version: 1, schemaVersion: 1 };
  validateBackup(source);
  return value as unknown as BackupV2;
}

export function migrateBackupPayload(payload: string | unknown): BackupV2 {
  const parsed = typeof payload === 'string' ? JSON.parse(payload) as unknown : payload;
  if (!isRecord(parsed) || parsed.format !== V1_FORMAT || typeof parsed.version !== 'number') throw new Error('Backup-Version oder Format ist nicht kompatibel');
  if (parsed.version === 1) return upgradeBackupV1ToV2(validateBackup(parsed));
  if (parsed.version === 2) return validateBackupV2(parsed);
  throw new Error(`Unbekannte Backup-Version: ${String(parsed.version)}`);
}

export function rollbackBackupV2ToV1(backup: BackupV2): BackupV1 {
  validateBackupV2(backup);
  return {
    format: V1_FORMAT,
    version: 1,
    exportedAt: backup.exportedAt,
    schemaVersion: 1,
    data: structuredClone(backup.data),
  };
}
