import AsyncStorage from '@react-native-async-storage/async-storage';

const TELEMETRY_CONFIG_KEY = 'tgm-alarm-center-telemetry-config-v1';
const TELEMETRY_EVENTS_KEY = 'tgm-alarm-center-telemetry-events-v1';
const TELEMETRY_INSTALLATION_KEY = 'tgm-alarm-center-telemetry-installation-v1';
const MAX_QUEUE_SIZE = 500;

export type TelemetryLevel = 'info' | 'warn' | 'error';
export type TelemetryEventName =
  | 'app_opened'
  | 'session_started'
  | 'retention_day'
  | 'activation_completed'
  | 'alarm_created'
  | 'alarm_scheduled'
  | 'alarm_scheduling_failed'
  | 'alarm_delivery_received'
  | 'alarm_confirmed'
  | 'backup_exported'
  | 'backup_restored'
  | 'purchase_started'
  | 'purchase_completed'
  | 'restore_completed'
  | 'telemetry_error';

export type TelemetryValue = string | number | boolean;
export type TelemetryProperties = Record<string, TelemetryValue>;

export interface TelemetryEvent {
  id: string;
  name: TelemetryEventName;
  level: TelemetryLevel;
  occurredAt: string;
  installationId: string;
  properties: TelemetryProperties;
}

export interface TelemetryConfig {
  enabled: boolean;
  firstOpenedAt: string | null;
  lastSessionAt: string | null;
}

export interface TelemetryExport {
  schemaVersion: 1;
  generatedAt: string;
  events: TelemetryEvent[];
}

function validDate(value: string | null): value is string {
  return value !== null && Number.isFinite(Date.parse(value));
}

function newId(): string {
  const cryptoLike = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoLike?.randomUUID) return cryptoLike.randomUUID();
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function dayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function safeProperties(properties: TelemetryProperties | undefined): TelemetryProperties {
  if (!properties) return {};
  return Object.fromEntries(Object.entries(properties).filter(([key, value]) => /^[a-z][a-z0-9_]{1,40}$/.test(key) && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')).slice(0, 12));
}

export function retentionDay(firstOpenedAt: string, occurredAt: string): number | null {
  const first = Date.parse(firstOpenedAt);
  const current = Date.parse(occurredAt);
  if (!Number.isFinite(first) || !Number.isFinite(current) || current < first) return null;
  return Math.floor((current - first) / 86_400_000);
}

export class TelemetryClient {
  private installationId: string | null = null;
  private config: TelemetryConfig = { enabled: false, firstOpenedAt: null, lastSessionAt: null };
  private events: TelemetryEvent[] = [];

  async initialize(): Promise<void> {
    const [storedConfig, storedEvents, storedInstallationId] = await Promise.all([
      AsyncStorage.getItem(TELEMETRY_CONFIG_KEY),
      AsyncStorage.getItem(TELEMETRY_EVENTS_KEY),
      AsyncStorage.getItem(TELEMETRY_INSTALLATION_KEY),
    ]);
    this.config = this.parseConfig(storedConfig);
    this.events = this.parseEvents(storedEvents);
    this.installationId = storedInstallationId && /^[0-9a-f-]{36}$/i.test(storedInstallationId) ? storedInstallationId : newId();
    await AsyncStorage.setItem(TELEMETRY_INSTALLATION_KEY, this.installationId);
    if (this.config.firstOpenedAt === null) {
      this.config.firstOpenedAt = new Date().toISOString();
      await this.persistConfig();
    }
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.config.enabled = enabled;
    await this.persistConfig();
    if (!enabled) {
      this.events = [];
      await AsyncStorage.removeItem(TELEMETRY_EVENTS_KEY);
    }
  }

  async startSession(occurredAt = new Date().toISOString()): Promise<void> {
    if (!this.config.enabled) return;
    const previous = this.config.lastSessionAt;
    this.config.lastSessionAt = occurredAt;
    await this.persistConfig();
    await this.track('app_opened', { app_version: 1 }, occurredAt);
    await this.track('session_started', {}, occurredAt);
    if (this.config.firstOpenedAt) {
      const day = retentionDay(this.config.firstOpenedAt, occurredAt);
      if (day !== null && (!previous || dayKey(new Date(previous)) !== dayKey(new Date(occurredAt)))) await this.track('retention_day', { day }, occurredAt);
    }
  }

  async trackOnce(key: string, name: TelemetryEventName, properties?: TelemetryProperties, occurredAt = new Date().toISOString()): Promise<void> {
    if (!this.config.enabled || this.events.some((event) => event.name === name && event.properties.once_key === key)) return;
    await this.track(name, { ...properties, once_key: key }, occurredAt);
  }

  async track(name: TelemetryEventName, properties?: TelemetryProperties, occurredAt = new Date().toISOString(), level: TelemetryLevel = 'info'): Promise<void> {
    if (!this.config.enabled || !this.installationId || !validDate(occurredAt)) return;
    const event: TelemetryEvent = { id: newId(), name, level, occurredAt: new Date(occurredAt).toISOString(), installationId: this.installationId, properties: safeProperties(properties) };
    this.events = [...this.events, event].slice(-MAX_QUEUE_SIZE);
    await AsyncStorage.setItem(TELEMETRY_EVENTS_KEY, JSON.stringify(this.events));
  }

  async log(level: TelemetryLevel, message: string, properties?: TelemetryProperties): Promise<void> {
    const normalized = message.trim().replace(/[^a-zA-Z0-9._ -]/g, '').slice(0, 80);
    if (normalized.length === 0) return;
    await this.track('telemetry_error', { ...properties, message: normalized }, new Date().toISOString(), level);
  }

  async exportEvents(): Promise<TelemetryExport> {
    return { schemaVersion: 1, generatedAt: new Date().toISOString(), events: this.config.enabled ? [...this.events] : [] };
  }

  async clearExportedEvents(): Promise<void> {
    this.events = [];
    await AsyncStorage.removeItem(TELEMETRY_EVENTS_KEY);
  }

  private parseConfig(raw: string | null): TelemetryConfig {
    const buildDefault = process.env.EXPO_PUBLIC_TELEMETRY_ENABLED === 'true';
    if (!raw) return { enabled: buildDefault, firstOpenedAt: null, lastSessionAt: null };
    try {
      const value = JSON.parse(raw) as Record<string, unknown>;
      return { enabled: value.enabled === true, firstOpenedAt: typeof value.firstOpenedAt === 'string' && validDate(value.firstOpenedAt) ? new Date(value.firstOpenedAt).toISOString() : null, lastSessionAt: typeof value.lastSessionAt === 'string' && validDate(value.lastSessionAt) ? new Date(value.lastSessionAt).toISOString() : null };
    } catch {
      return { enabled: buildDefault, firstOpenedAt: null, lastSessionAt: null };
    }
  }

  private parseEvents(raw: string | null): TelemetryEvent[] {
    if (!raw) return [];
    try {
      const value = JSON.parse(raw) as unknown;
      if (!Array.isArray(value)) return [];
      return value.filter((event): event is TelemetryEvent => {
        if (!event || typeof event !== 'object' || Array.isArray(event)) return false;
        const candidate = event as Record<string, unknown>;
        const occurredAt = candidate.occurredAt;
        return typeof candidate.id === 'string' && typeof candidate.name === 'string' && typeof occurredAt === 'string' && validDate(occurredAt);
      }).slice(-MAX_QUEUE_SIZE);
    } catch {
      return [];
    }
  }

  private async persistConfig(): Promise<void> {
    await AsyncStorage.setItem(TELEMETRY_CONFIG_KEY, JSON.stringify(this.config));
  }
}

export const telemetry = new TelemetryClient();
