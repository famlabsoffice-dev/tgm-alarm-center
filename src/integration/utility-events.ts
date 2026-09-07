import type { AlarmType, RepeatMode, SoundProfile } from '../domain/alarm';

export type UtilityCategory =
  | 'gw' | 'bubble' | 'event' | 'protection' | 'resource' | 'training' | 'upgrade' | 'faction'
  | 'insignia-goal' | 'family-currency-goal' | 'helicopter-training' | 'resource-goal'
  | 'gw-reward' | 'gw-prep' | 'custom-operation';

export interface UtilityEventInput {
  id: string; category: UtilityCategory; title: string; accountId: string;
  startAtUtc: string; endAtUtc: string | null;
  metadata: Record<string, string | number | boolean | null>;
  warnings: number[]; alarmType: AlarmType; repeat: RepeatMode; sound: SoundProfile; protected: boolean;
}
export interface UtilityAlarmIntent {
  sourceEventId: string; accountId: string; title: string; type: AlarmType; eventAtUtc: string;
  warnings: number[]; repeat: RepeatMode; sound: SoundProfile; protected: boolean;
  metadata: Record<string, string | number | boolean | null>;
}

const CATEGORIES: readonly UtilityCategory[] = [
  'gw','bubble','event','protection','resource','training','upgrade','faction',
  'insignia-goal','family-currency-goal','helicopter-training','resource-goal','gw-reward','gw-prep','custom-operation',
];
const ALARM_TYPES: readonly AlarmType[] = ['bubble','gwBubble','custom','individual','rss'];
const REPEATS: readonly RepeatMode[] = ['once','daily','gw5d'];
const SOUNDS: readonly SoundProfile[] = ['pulse','siren','chime'];
const isIso = (value: string): boolean => Number.isFinite(new Date(value).getTime()) && value === new Date(value).toISOString();
const isRecord = (value: unknown): value is Record<string, string | number | boolean | null> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isIntegerWarning = (value: number): boolean => Number.isInteger(value) && value >= 1 && value <= 7 * 24 * 60;

export function validateUtilityEvent(input: UtilityEventInput): void {
  if (!input.id.trim() || !input.accountId.trim() || !input.title.trim() || input.title.length > 80) throw new Error('Ungültige Utility-Event-Identität');
  if (!CATEGORIES.includes(input.category)) throw new Error('Unbekannte Utility-Kategorie');
  if (!isIso(input.startAtUtc) || (input.endAtUtc !== null && !isIso(input.endAtUtc))) throw new Error('Ungültiger Utility-Zeitpunkt');
  if (!ALARM_TYPES.includes(input.alarmType) || !REPEATS.includes(input.repeat) || !SOUNDS.includes(input.sound)) throw new Error('Ungültige Alarmparameter');
  if (!Array.isArray(input.warnings) || input.warnings.length > 16 || input.warnings.some((warning) => !isIntegerWarning(warning))) throw new Error('Ungültige Warnungen');
  if (input.endAtUtc !== null && new Date(input.endAtUtc).getTime() < new Date(input.startAtUtc).getTime()) throw new Error('Event-Ende liegt vor dem Start');
  if (!isRecord(input.metadata)) throw new Error('Ungültige Event-Metadaten');
}

export function toAlarmIntent(input: UtilityEventInput): UtilityAlarmIntent {
  validateUtilityEvent(input);
  return {
    sourceEventId: input.id,
    accountId: input.accountId,
    title: input.title.trim(),
    type: input.alarmType,
    eventAtUtc: input.startAtUtc,
    warnings: [...new Set(input.warnings)].sort((a, b) => b - a),
    repeat: input.repeat,
    sound: input.sound,
    protected: input.protected,
    metadata: { ...input.metadata, utility: input.category, endAtUtc: input.endAtUtc },
  };
}

export const UTILITY_DEFAULTS: Readonly<Record<UtilityCategory, Pick<UtilityEventInput, 'alarmType' | 'repeat' | 'sound' | 'warnings' | 'protected'>>> = {
  gw: { alarmType: 'gwBubble', repeat: 'gw5d', sound: 'siren', warnings: [60,30,15], protected: true },
  bubble: { alarmType: 'bubble', repeat: 'once', sound: 'pulse', warnings: [60,15], protected: true },
  event: { alarmType: 'custom', repeat: 'once', sound: 'chime', warnings: [15], protected: false },
  protection: { alarmType: 'custom', repeat: 'once', sound: 'pulse', warnings: [60,15], protected: true },
  resource: { alarmType: 'individual', repeat: 'once', sound: 'pulse', warnings: [15], protected: false },
  training: { alarmType: 'individual', repeat: 'once', sound: 'chime', warnings: [15], protected: false },
  upgrade: { alarmType: 'individual', repeat: 'once', sound: 'chime', warnings: [15], protected: false },
  faction: { alarmType: 'custom', repeat: 'daily', sound: 'pulse', warnings: [30,15], protected: false },
  'insignia-goal': { alarmType: 'individual', repeat: 'daily', sound: 'chime', warnings: [60,15], protected: false },
  'family-currency-goal': { alarmType: 'individual', repeat: 'daily', sound: 'chime', warnings: [60,15], protected: false },
  'helicopter-training': { alarmType: 'individual', repeat: 'once', sound: 'chime', warnings: [60,15], protected: false },
  'resource-goal': { alarmType: 'individual', repeat: 'daily', sound: 'pulse', warnings: [60,15], protected: false },
  'gw-reward': { alarmType: 'custom', repeat: 'once', sound: 'chime', warnings: [360,60,15], protected: true },
  'gw-prep': { alarmType: 'gwBubble', repeat: 'gw5d', sound: 'siren', warnings: [1440,360,60,15], protected: true },
  'custom-operation': { alarmType: 'custom', repeat: 'once', sound: 'chime', warnings: [15], protected: false },
};
