import type { AlarmTemplate, AlarmType, RepeatMode, SoundProfile } from './alarm';

export const SHAREABLE_TEMPLATE_FORMAT = 'tgm-alarm-center-template';
export const SHAREABLE_TEMPLATE_VERSION = 1;

export interface ShareableAlarmTemplate {
  format: typeof SHAREABLE_TEMPLATE_FORMAT;
  version: 1;
  title: string;
  type: AlarmType;
  warnings: number[];
  repeat: RepeatMode;
  sound: SoundProfile;
  protected: boolean;
}

const MAX_TITLE = 80;
const MAX_WARNINGS = 16;
const MAX_WARNING_MINUTES = 7 * 24 * 60;
const TYPES = new Set<AlarmType>(['bubble', 'gwBubble', 'custom', 'individual', 'rss']);
const REPEATS = new Set<RepeatMode>(['once', 'daily', 'gw5d']);
const SOUNDS = new Set<SoundProfile>(['pulse', 'siren', 'chime']);

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function makeShareableTemplate(template: AlarmTemplate): ShareableAlarmTemplate {
  const parsed = validateShareableTemplate({ format: SHAREABLE_TEMPLATE_FORMAT, version: 1, ...template });
  return parsed;
}

export function validateShareableTemplate(value: unknown): ShareableAlarmTemplate {
  if (!isRecord(value) || value.format !== SHAREABLE_TEMPLATE_FORMAT || value.version !== SHAREABLE_TEMPLATE_VERSION) throw new Error('Vorlagenformat ist nicht kompatibel');
  if (typeof value.title !== 'string' || value.title.trim().length < 1 || value.title.length > MAX_TITLE) throw new Error('Vorlagen-Titel ist ungültig');
  if (typeof value.type !== 'string' || !TYPES.has(value.type as AlarmType)) throw new Error('Vorlagentyp ist ungültig');
  if (!Array.isArray(value.warnings) || value.warnings.length > MAX_WARNINGS || !value.warnings.every((item) => typeof item === 'number' && Number.isInteger(item) && item >= 1 && item <= MAX_WARNING_MINUTES)) throw new Error('Vorlagen-Warnungen sind ungültig');
  const warnings = [...new Set(value.warnings as number[])].sort((a, b) => b - a);
  if (typeof value.repeat !== 'string' || !REPEATS.has(value.repeat as RepeatMode)) throw new Error('Vorlagenwiederholung ist ungültig');
  if (typeof value.sound !== 'string' || !SOUNDS.has(value.sound as SoundProfile)) throw new Error('Vorlagenton ist ungültig');
  if (typeof value.protected !== 'boolean') throw new Error('Vorlagenschutz ist ungültig');
  return {
    format: SHAREABLE_TEMPLATE_FORMAT,
    version: 1,
    title: value.title.trim(),
    type: value.type as AlarmType,
    warnings,
    repeat: value.repeat as RepeatMode,
    sound: value.sound as SoundProfile,
    protected: value.protected,
  };
}

export function serializeShareableTemplate(template: AlarmTemplate): string {
  return JSON.stringify(makeShareableTemplate(template));
}

export function importShareableTemplate(payload: string | unknown): AlarmTemplate {
  const parsed = validateShareableTemplate(typeof payload === 'string' ? JSON.parse(payload) as unknown : payload);
  return {
    title: parsed.title,
    type: parsed.type,
    warnings: [...parsed.warnings],
    repeat: parsed.repeat,
    sound: parsed.sound,
    protected: parsed.protected,
  };
}
