export type AlarmType = 'bubble' | 'gwBubble' | 'custom';
export type RepeatMode = 'once' | 'daily' | 'gw5d';
export type SoundProfile = 'pulse' | 'siren' | 'chime';
export type Tier = 'free' | 'streetBoss' | 'caporegime' | 'underboss' | 'godfather';
export type OccurrenceKind = 'warning' | 'main' | 'end-warning' | 'end';

export interface Account {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Alarm {
  id: string;
  accountId: string;
  title: string;
  type: AlarmType;
  date: string;
  time: string;
  eventAtUtc: string;
  warnings: number[];
  repeat: RepeatMode;
  sound: SoundProfile;
  active: boolean;
  protected: boolean;
  completedOccurrences: Record<string, true>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  sound: SoundProfile;
  warningSound: boolean;
  eventSound: boolean;
  vibration: boolean;
  criticalAlerts: boolean;
  preview: boolean;
}

export interface AppState {
  schemaVersion: 1;
  accounts: Account[];
  alarms: Alarm[];
  activeAccountId: string | null;
  tier: Tier;
  notificationPreferences: NotificationPreferences;
  testConfirmedAt: string | null;
}

export interface AlarmTemplate {
  title: string;
  type: AlarmType;
  warnings: number[];
  repeat: RepeatMode;
  sound: SoundProfile;
  protected: boolean;
}

export interface NotificationMoment {
  alarmId: string;
  eventTime: Date;
  at: Date;
  kind: OccurrenceKind;
  warningMinutes?: number;
  endAt?: Date;
}

export const TIER_LIMITS: Record<Tier, { accounts: number; alarms: number; events: number; perAccount: { bubbleAlarms: number; eventAlarms: number } }> = {
  free: { accounts: 1, alarms: 2, events: 1, perAccount: { bubbleAlarms: 1, eventAlarms: 1 } },
  streetBoss: { accounts: 2, alarms: 4, events: 2, perAccount: { bubbleAlarms: 1, eventAlarms: 1 } },
  caporegime: { accounts: 3, alarms: 6, events: 3, perAccount: { bubbleAlarms: 1, eventAlarms: 1 } },
  underboss: { accounts: 5, alarms: 10, events: 5, perAccount: { bubbleAlarms: 1, eventAlarms: 1 } },
  godfather: { accounts: Number.POSITIVE_INFINITY, alarms: Number.POSITIVE_INFINITY, events: Number.POSITIVE_INFINITY, perAccount: { bubbleAlarms: Number.POSITIVE_INFINITY, eventAlarms: Number.POSITIVE_INFINITY } },
};

export const TEMPLATES: Record<'bubble' | 'gwBubble' | 'custom', AlarmTemplate> = {
  bubble: { title: 'Bubble-Zeitfenster', type: 'bubble', warnings: [60, 15], repeat: 'once', sound: 'pulse', protected: true },
  gwBubble: { title: 'GW-Zeitfenster', type: 'gwBubble', warnings: [60, 30, 15], repeat: 'once', sound: 'siren', protected: true },
  custom: { title: 'Mein TGM-Event', type: 'custom', warnings: [15], repeat: 'once', sound: 'chime', protected: false },
};

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TITLE_LENGTH = 80;

export function titleIsValid(title: string): boolean {
  const normalized = title.trim();
  return normalized.length > 0 && normalized.length <= MAX_TITLE_LENGTH;
}

export function validateDateTime(date: string, time: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const hour = Number(time.slice(0, 2));
  const minute = Number(time.slice(3, 5));
  const candidate = new Date(year, month - 1, day, hour, minute, 0, 0);
  return candidate.getFullYear() === year && candidate.getMonth() === month - 1 && candidate.getDate() === day && candidate.getHours() === hour && candidate.getMinutes() === minute;
}

export function localDateTimeToUtc(date: string, time: string): string | null {
  if (!validateDateTime(date, time)) return null;
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const hour = Number(time.slice(0, 2));
  const minute = Number(time.slice(3, 5));
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

export function localInputFromUtc(utc: string): { date: string; time: string } {
  const instant = new Date(utc);
  if (!Number.isFinite(instant.getTime())) throw new Error('Ungültiger UTC-Zeitpunkt');
  return {
    date: `${instant.getFullYear()}-${String(instant.getMonth() + 1).padStart(2, '0')}-${String(instant.getDate()).padStart(2, '0')}`,
    time: `${String(instant.getHours()).padStart(2, '0')}:${String(instant.getMinutes()).padStart(2, '0')}`,
  };
}

function baseLocalDateTime(alarm: Alarm): Date | null {
  const utc = new Date(alarm.eventAtUtc);
  if (!Number.isFinite(utc.getTime())) return null;
  if (!validateDateTime(alarm.date, alarm.time)) return utc;
  const year = Number(alarm.date.slice(0, 4));
  const month = Number(alarm.date.slice(5, 7));
  const day = Number(alarm.date.slice(8, 10));
  const hour = Number(alarm.time.slice(0, 2));
  const minute = Number(alarm.time.slice(3, 5));
  const local = new Date(year, month - 1, day, hour, minute, 0, 0);
  return Number.isFinite(local.getTime()) ? local : utc;
}

function isCompleted(alarm: Alarm, eventTime: Date): boolean {
  return alarm.completedOccurrences[occurrenceKey(alarm.id, eventTime)] === true;
}

function nextDailyOccurrence(alarm: Alarm, now: Date): Date | null {
  const base = baseLocalDateTime(alarm);
  if (!base) return null;
  const candidate = new Date(base);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    if (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 1);
  }
  for (let attempts = 0; attempts < 370; attempts += 1) {
    if (!isCompleted(alarm, candidate)) return candidate;
    candidate.setDate(candidate.getDate() + 1);
  }
  return null;
}

function nextGwOccurrence(alarm: Alarm, now: Date): Date | null {
  const base = new Date(alarm.eventAtUtc);
  if (!Number.isFinite(base.getTime())) return null;
  const delta = now.getTime() - base.getTime();
  const cycles = delta < 0 ? 0 : Math.floor(delta / FIVE_DAYS_MS) + 1;
  const candidate = new Date(base.getTime() + cycles * FIVE_DAYS_MS);
  for (let attempts = 0; attempts < 370; attempts += 1) {
    if (candidate.getTime() > now.getTime() && !isCompleted(alarm, candidate)) return candidate;
    candidate.setTime(candidate.getTime() + FIVE_DAYS_MS);
  }
  return null;
}

export function nextOccurrence(alarm: Alarm, now = new Date()): Date | null {
  if (!alarm.active) return null;
  if (alarm.repeat === 'once') {
    const event = new Date(alarm.eventAtUtc);
    return Number.isFinite(event.getTime()) && event.getTime() > now.getTime() && !isCompleted(alarm, event) ? event : null;
  }
  if (alarm.repeat === 'daily') return nextDailyOccurrence(alarm, now);
  return nextGwOccurrence(alarm, now);
}

export function occurrenceKey(alarmId: string, eventTime: Date): string {
  return `${alarmId}:${eventTime.toISOString()}`;
}

export function occurrenceEnd(alarm: Alarm, eventTime: Date): Date | null {
  return alarm.repeat === 'gw5d' ? new Date(eventTime.getTime() + DAY_MS) : null;
}

export function upcomingMoments(alarm: Alarm, now = new Date()): NotificationMoment[] {
  const eventTime = nextOccurrence(alarm, now);
  if (!eventTime) return [];
  const moments: NotificationMoment[] = [];
  for (const warningMinutes of [...alarm.warnings].sort((a, b) => b - a)) {
    const at = new Date(eventTime.getTime() - warningMinutes * 60 * 1000);
    if (at.getTime() > now.getTime()) moments.push({ alarmId: alarm.id, eventTime, at, kind: 'warning', warningMinutes });
  }
  if (eventTime.getTime() > now.getTime()) moments.push({ alarmId: alarm.id, eventTime, at: eventTime, kind: 'main' });
  const endAt = occurrenceEnd(alarm, eventTime);
  if (endAt) {
    const endWarningAt = new Date(endAt.getTime() - 60 * 60 * 1000);
    if (endWarningAt.getTime() > now.getTime()) moments.push({ alarmId: alarm.id, eventTime, at: endWarningAt, kind: 'end-warning', endAt });
    if (endAt.getTime() > now.getTime()) moments.push({ alarmId: alarm.id, eventTime, at: endAt, kind: 'end', endAt });
  }
  return moments.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function buildAlarm(template: AlarmTemplate, accountId: string, date: string, time: string, now = new Date()): Alarm {
  const eventAtUtc = localDateTimeToUtc(date, time);
  if (!eventAtUtc) throw new Error('Datum oder Uhrzeit ist ungültig');
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    accountId,
    title: template.title,
    type: template.type,
    date,
    time,
    eventAtUtc,
    warnings: [...template.warnings],
    repeat: template.repeat,
    sound: template.sound,
    active: true,
    protected: template.protected,
    completedOccurrences: {},
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function alarmTypeLabel(type: AlarmType): string {
  if (type === 'bubble') return 'Bubble';
  if (type === 'gwBubble') return 'GW Bubble';
  return 'Eigenes Event';
}

export function repeatLabel(repeat: RepeatMode): string {
  if (repeat === 'daily') return 'Täglich';
  if (repeat === 'gw5d') return 'GW-Zyklus · alle 5 Tage';
  return 'Einmalig';
}

export function momentLabel(moment: NotificationMoment): string {
  if (moment.kind === 'warning') return `${moment.warningMinutes} Min. Vorwarnung`;
  if (moment.kind === 'end-warning') return 'Bubble-Ende-Warnung';
  if (moment.kind === 'end') return 'Bubble endet';
  return 'Hauptereignis';
}
