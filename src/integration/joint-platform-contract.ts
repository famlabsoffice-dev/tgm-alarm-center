export interface SharedIdentity { userId: string; provider: 'tgmhub' | 'tgm-alarm-center'; }
export interface SharedEventRecord { id: string; ownerId: string; source: 'tgmhub' | 'tgm-alarm-center' | 'partner'; category: string; startAtUtc: string; endAtUtc: string | null; metadata: Record<string, string | number | boolean | null>; }
export interface SharedUserPreferences { timezone: string; warningMinutes: number[]; sound: 'pulse' | 'siren' | 'chime'; vibration: boolean; criticalAlerts: boolean; }
export interface CrossNavigationTarget { product: 'tgmhub' | 'tgm-alarm-center'; route: string; entityId: string; }
export interface CrossUpgradeContext { sourceProduct: 'tgmhub' | 'tgm-alarm-center'; targetProduct: 'tgmhub' | 'tgm-alarm-center'; currentTier: string; requestedCapability: string; }

const TOKEN = /^[A-Za-z0-9._~-]{1,128}$/;

export function validateSharedIdentity(identity: SharedIdentity): void {
  if (!TOKEN.test(identity.userId) || (identity.provider !== 'tgmhub' && identity.provider !== 'tgm-alarm-center')) throw new Error('Ungültige gemeinsame Identität');
}

export function buildCrossNavigation(target: CrossNavigationTarget): CrossNavigationTarget {
  if (!TOKEN.test(target.entityId) || !target.route.startsWith('/')) throw new Error('Ungültiges Navigationsziel');
  return { ...target };
}

export function buildCrossUpgrade(context: CrossUpgradeContext): CrossUpgradeContext {
  if (!TOKEN.test(context.currentTier) || !TOKEN.test(context.requestedCapability)) throw new Error('Ungültiger Upgrade-Kontext');
  return { ...context };
}
