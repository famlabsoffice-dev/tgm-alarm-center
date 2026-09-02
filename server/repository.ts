import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Tier } from '../src/domain/alarm';

export interface StoredEntitlement {
  userId: string;
  platform: 'ios' | 'android';
  productId: string;
  productKey: string;
  tier: Tier;
  transactionId: string;
  purchaseToken: string | null;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  environment: 'sandbox' | 'production';
  expiresAt: string | null;
  updatedAt: string;
  sourceEventId: string;
}

export interface StoredWebhookEvent {
  eventId: string;
  platform: 'ios' | 'android';
  receivedAt: string;
  payloadDigest: string;
}

interface Database {
  entitlements: StoredEntitlement[];
  events: StoredWebhookEvent[];
}

const EMPTY_DATABASE: Database = { entitlements: [], events: [] };

export class BillingRepository {
  private database: Database = { ...EMPTY_DATABASE };
  private loaded = false;

  constructor(private readonly filePath: string) {}

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Billing-Speicher ist ungültig.');
      const value = parsed as Partial<Database>;
      this.database = {
        entitlements: Array.isArray(value.entitlements) ? value.entitlements : [],
        events: Array.isArray(value.events) ? value.events : [],
      };
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      this.database = { entitlements: [], events: [] };
    }
    this.loaded = true;
  }

  async hasEvent(eventId: string): Promise<boolean> {
    await this.load();
    return this.database.events.some((event) => event.eventId === eventId);
  }

  async recordEvent(event: StoredWebhookEvent): Promise<boolean> {
    await this.load();
    if (this.database.events.some((candidate) => candidate.eventId === event.eventId)) return false;
    this.database.events.push({ ...event });
    await this.persist();
    return true;
  }

  async findUserByPurchaseToken(purchaseToken: string): Promise<string | null> {
    await this.load();
    return this.database.entitlements.find((entitlement) => entitlement.purchaseToken === purchaseToken)?.userId ?? null;
  }

  async upsertEntitlement(entitlement: StoredEntitlement): Promise<void> {
    await this.load();
    const index = this.database.entitlements.findIndex((candidate) => candidate.transactionId === entitlement.transactionId && candidate.platform === entitlement.platform);
    if (index < 0) this.database.entitlements.push({ ...entitlement });
    else this.database.entitlements[index] = { ...entitlement };
    await this.persist();
  }

  async entitlementsForUser(userId: string): Promise<StoredEntitlement[]> {
    await this.load();
    return this.database.entitlements.filter((entitlement) => entitlement.userId === userId).map((entitlement) => ({ ...entitlement }));
  }

  async getActiveEntitlement(userId: string, at = Date.now()): Promise<StoredEntitlement | null> {
    const entitlements = await this.entitlementsForUser(userId);
    return entitlements
      .filter((entitlement) => entitlement.status === 'active' && (entitlement.expiresAt === null || Date.parse(entitlement.expiresAt) > at))
      .sort((left, right) => tierRank(right.tier) - tierRank(left.tier))[0] ?? null;
  }

  private async persist(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp`;
    await writeFile(temporary, JSON.stringify(this.database, null, 2), { encoding: 'utf8', mode: 0o600 });
    await rename(temporary, this.filePath);
  }
}

function tierRank(tier: Tier): number {
  return ({ free: 0, streetBoss: 1, caporegime: 2, underboss: 3, boss: 4, godfather: 5 })[tier];
}
