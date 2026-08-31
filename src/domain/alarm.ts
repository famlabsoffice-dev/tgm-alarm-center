export type AlarmType = 'bubble' | 'gwBubble' | 'custom';
export type RepeatMode = 'once' | 'daily';
export type SoundProfile = 'pulse' | 'siren' | 'chime';
export type Tier = 'free' | 'streetBoss' | 'caporegime' | 'godfather';

export interface Account { id: string; name: string; color: string; createdAt: string; }
export interface Alarm {
  id: string; accountId: string; title: string; type: AlarmType; date: string; time: string;
  warnings: number[]; repeat: RepeatMode; sound: SoundProfile; active: boolean; protected: boolean;
  completedOccurrences: Record<string, true>; createdAt: string; updatedAt: string;
}
export interface NotificationPreferences {
  sound: SoundProfile; warningSound: boolean; eventSound: boolean; vibration: boolean;
  criticalAlerts: boolean; preview: boolean;
}
export interface AppState {
  schemaVersion: 1; accounts: Account[]; alarms: Alarm[]; activeAccountId: string | null;
  tier: Tier; notificationPreferences: NotificationPreferences; testConfirmedAt: string | null;
}

export const TIER_LIMITS: Record<Tier, { accounts: number; alarms: number; events: number }> = {
  free: { accounts: 1, alarms: 1, events: 1 },
  streetBoss: { accounts: 2, alarms: 2, events: 2 },
  caporegime: { accounts: 3, alarms: 3, events: 3 },
  godfather: { accounts: Infinity, alarms: Infinity, events: Infinity },
};

export const TEMPLATES = {
  bubble: { title: 'Bubble-Zeitfenster', warnings: [60, 15], repeat: 'once' as const, sound: 'pulse' as const },
  gwBubble: { title: 'GW-Zeitfenster', warnings: [60, 30, 15], repeat: 'once' as const, sound: 'siren' as const },
  custom: { title: 'Mein TGM-Event', warnings: [15], repeat: 'once' as const, sound: 'chime' as const },
};

export function nextOccurrence(alarm: Alarm, now = new Date()): Date | null {
  const [y, m, d] = alarm.date.split('-').map(Number);
  const [hh, mm] = alarm.time.split(':').map(Number);
  const candidate = new Date(y, m - 1, d, hh, mm, 0, 0);
  if (!Number.isFinite(candidate.getTime())) return null;
  if (alarm.repeat === 'once') return candidate.getTime() > now.getTime() ? candidate : null;
  while (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 1);
  return candidate;
}

export function validateDateTime(date: string, time: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return false;
  const [y, m, d] = date.split('-').map(Number); const [h, min] = time.split(':').map(Number);
  if (m < 1 || m > 12 || d < 1 || h > 23 || min > 59) return false;
  const x = new Date(y, m - 1, d, h, min);
  return x.getFullYear() === y && x.getMonth() === m - 1 && x.getDate() === d && x.getHours() === h && x.getMinutes() === min;
}

export function occurrenceKey(alarmId: string, eventTime: Date): string { return `${alarmId}:${eventTime.toISOString()}`; }
