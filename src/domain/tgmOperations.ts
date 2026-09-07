import type { AlarmType, RepeatMode, SoundProfile } from './alarm';
import type { UtilityAlarmIntent, UtilityCategory } from '../integration/utility-events';
import { toAlarmIntent, UTILITY_DEFAULTS } from '../integration/utility-events';

export interface TgmOperationEvent {
  id: string;
  title: string;
  accountId: string;
  category: UtilityCategory;
  startAtUtc: string;
  endAtUtc?: string | null;
  warnings?: number[];
  alarmType?: AlarmType;
  repeat?: RepeatMode;
  sound?: SoundProfile;
  protected?: boolean;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface GoalOperation extends TgmOperationEvent {
  current: number;
  target: number;
  deadlineAtUtc: string;
  unit: string;
}

export interface FactionReminderOperation extends TgmOperationEvent {
  missingMembers: number;
  totalMembers: number;
}

export interface GwCommandCenterOperation {
  accountId: string;
  cycleId: string;
  startAtUtc: string;
  endAtUtc: string;
  bubbleAtUtc?: string;
  rewardDeadlineAtUtc?: string;
  prepAtUtc?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface CalendarEntry {
  id: string;
  title: string;
  accountId: string;
  category: UtilityCategory;
  startsAtUtc: string;
  endsAtUtc: string | null;
  source: 'event' | 'goal' | 'gw' | 'faction';
  alarmIntent: UtilityAlarmIntent;
}

const trimRecord = (metadata: Record<string, string | number | boolean | null> | undefined) => ({ ...(metadata ?? {}) });

export function plannerResultToAlarm(input: TgmOperationEvent): UtilityAlarmIntent {
  const defaults = UTILITY_DEFAULTS[input.category];
  return toAlarmIntent({
    id: input.id,
    category: input.category,
    title: input.title,
    accountId: input.accountId,
    startAtUtc: input.startAtUtc,
    endAtUtc: input.endAtUtc ?? null,
    metadata: trimRecord(input.metadata),
    warnings: input.warnings ?? defaults.warnings,
    alarmType: input.alarmType ?? defaults.alarmType,
    repeat: input.repeat ?? defaults.repeat,
    sound: input.sound ?? defaults.sound,
    protected: input.protected ?? defaults.protected,
  });
}

export function goalToAlarm(input: GoalOperation): UtilityAlarmIntent {
  if (!Number.isFinite(input.current) || !Number.isFinite(input.target) || input.current < 0 || input.target <= 0) throw new Error('Ungültige Zielwerte');
  if (input.current >= input.target) throw new Error('Ziel ist bereits erreicht');
  if (!input.unit.trim()) throw new Error('Zieleinheit fehlt');
  return plannerResultToAlarm({
    ...input,
    startAtUtc: input.deadlineAtUtc,
    metadata: { ...trimRecord(input.metadata), current: input.current, target: input.target, remaining: input.target - input.current, unit: input.unit.trim(), deadlineAtUtc: input.deadlineAtUtc },
  });
}

export function factionReminderToAlarm(input: FactionReminderOperation): UtilityAlarmIntent {
  if (!Number.isInteger(input.missingMembers) || input.missingMembers < 0 || !Number.isInteger(input.totalMembers) || input.totalMembers < 0 || input.missingMembers > input.totalMembers) throw new Error('Ungültige Fraktionswerte');
  if (input.missingMembers === 0) throw new Error('Keine fehlenden Mitglieder');
  return plannerResultToAlarm({ ...input, category: 'faction', metadata: { ...trimRecord(input.metadata), missingMembers: input.missingMembers, totalMembers: input.totalMembers } });
}

export function buildGwCommandCenter(input: GwCommandCenterOperation): UtilityAlarmIntent[] {
  if (!input.accountId.trim() || !input.cycleId.trim()) throw new Error('Ungültige GW-Identität');
  const commonMetadata = { cycleId: input.cycleId, ...(input.metadata ?? {}) };
  const events: TgmOperationEvent[] = [
    { id: `gw-start:${input.cycleId}`, title: 'GW Start', accountId: input.accountId, category: 'gw', startAtUtc: input.startAtUtc, endAtUtc: input.endAtUtc, metadata: { ...commonMetadata, phase: 'start' } },
    { id: `gw-end:${input.cycleId}`, title: 'GW Ende', accountId: input.accountId, category: 'gw-reward', startAtUtc: input.endAtUtc, endAtUtc: null, metadata: { ...commonMetadata, phase: 'end' } },
  ];
  if (input.bubbleAtUtc) events.push({ id: `gw-bubble:${input.cycleId}`, title: 'GW Bubble', accountId: input.accountId, category: 'gw', startAtUtc: input.bubbleAtUtc, endAtUtc: null, metadata: { ...commonMetadata, phase: 'bubble' } });
  if (input.rewardDeadlineAtUtc) events.push({ id: `gw-reward:${input.cycleId}`, title: 'GW Reward', accountId: input.accountId, category: 'gw-reward', startAtUtc: input.rewardDeadlineAtUtc, endAtUtc: null, metadata: { ...commonMetadata, phase: 'reward' } });
  if (input.prepAtUtc) events.push({ id: `gw-prep:${input.cycleId}`, title: 'GW Vorbereitung', accountId: input.accountId, category: 'gw-prep', startAtUtc: input.prepAtUtc, endAtUtc: null, metadata: { ...commonMetadata, phase: 'prep' } });
  return events.map(plannerResultToAlarm).sort((a, b) => a.eventAtUtc.localeCompare(b.eventAtUtc));
}

export function buildSmartTemplate(category: UtilityCategory, accountId: string, id: string, title: string, startAtUtc: string, endAtUtc: string | null, metadata?: Record<string, string | number | boolean | null>): UtilityAlarmIntent {
  const defaults = UTILITY_DEFAULTS[category];
  return plannerResultToAlarm({ id, category, title, accountId, startAtUtc, endAtUtc, metadata, ...defaults });
}

export function buildPersonalTgmCalendar(entries: UtilityAlarmIntent[]): CalendarEntry[] {
  return [...entries]
    .sort((a, b) => a.eventAtUtc.localeCompare(b.eventAtUtc) || a.accountId.localeCompare(b.accountId) || a.sourceEventId.localeCompare(b.sourceEventId))
    .map((alarmIntent) => {
      const category = typeof alarmIntent.metadata.utility === 'string' && UTILITY_DEFAULTS[alarmIntent.metadata.utility as UtilityCategory] ? alarmIntent.metadata.utility as UtilityCategory : 'custom-operation';
      const source: CalendarEntry['source'] = category === 'gw' || category === 'gw-prep' || category === 'gw-reward' ? 'gw' : category === 'faction' ? 'faction' : category.includes('goal') || category === 'resource-goal' || category === 'helicopter-training' ? 'goal' : 'event';
      return { id: alarmIntent.sourceEventId, title: alarmIntent.title, accountId: alarmIntent.accountId, category, startsAtUtc: alarmIntent.eventAtUtc, endsAtUtc: typeof alarmIntent.metadata.endAtUtc === 'string' ? alarmIntent.metadata.endAtUtc : null, source, alarmIntent };
    });
}
