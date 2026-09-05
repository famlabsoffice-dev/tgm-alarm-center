import type { AlarmTemplate, BubbleDurationHours, FactionEvent } from './alarm';
import { BUBBLE_DURATIONS, FACTION_EVENT_OPTIONS, TEMPLATES } from './alarm';

export interface QuickAction {
  id: 'bubble' | 'gw' | 'cvc' | 'oakvale' | 'undergroundMarket' | 'custom';
  label: string;
  template: AlarmTemplate;
  requiresDuration: boolean;
}

export const QUICK_ACTIONS: readonly QuickAction[] = [
  { id: 'bubble', label: 'Bubble', template: TEMPLATES.bubble, requiresDuration: true },
  { id: 'gw', label: 'GW / Massacre', template: TEMPLATES.gwBubble, requiresDuration: true },
  { id: 'cvc', label: 'CvC', template: TEMPLATES.cvc, requiresDuration: false },
  { id: 'oakvale', label: 'Oakvale', template: { ...TEMPLATES.faction, title: 'Oakvale', factionEvent: 'oakvale' }, requiresDuration: false },
  { id: 'undergroundMarket', label: 'Underground Market', template: { ...TEMPLATES.faction, title: 'Underground Market', factionEvent: 'undergroundMarket' }, requiresDuration: false },
  { id: 'custom', label: 'Custom', template: TEMPLATES.custom, requiresDuration: false },
];

export function bubbleDurationLabel(hours: BubbleDurationHours): string {
  return BUBBLE_DURATIONS.find((item) => item.hours === hours)?.label ?? `${hours} Stunden`;
}

export function factionEventLabel(event: FactionEvent): string {
  return FACTION_EVENT_OPTIONS.find((item) => item.id === event)?.label ?? 'Faction Battle Event';
}

export function templateForQuickAction(id: QuickAction['id']): AlarmTemplate {
  const action = QUICK_ACTIONS.find((item) => item.id === id);
  if (!action) throw new Error(`Unbekannte Quick Action: ${id}`);
  return { ...action.template, warnings: [...action.template.warnings] };
}
