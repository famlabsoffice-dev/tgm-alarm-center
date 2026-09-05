export const MAFIA_COMMAND_CENTER_TOKENS = Object.freeze({
  background: '#0B0D0F',
  panel: '#121416',
  raisedPanel: '#191C1F',
  bronze: '#7A592D',
  gold: '#D1A84D',
  goldHighlight: '#E4C16A',
  danger: '#A62B2B',
  deepRed: '#6F1C1C',
  text: '#EEE8DB',
  secondaryText: '#B6B1A5',
  muted: '#78756E',
} as const);

export type MafiaCommandCenterToken = keyof typeof MAFIA_COMMAND_CENTER_TOKENS;

export function tokenValue(token: MafiaCommandCenterToken): string {
  return MAFIA_COMMAND_CENTER_TOKENS[token];
}
