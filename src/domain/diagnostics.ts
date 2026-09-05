export type DiagnosticEventType =
  | 'notification.schedule'
  | 'notification.failure'
  | 'entitlement.verification'
  | 'lifecycle.install'
  | 'lifecycle.onboarding_complete'
  | 'lifecycle.first_alarm'
  | 'billing.purchase'
  | 'billing.restore'
  | 'billing.refund'
  | 'billing.churn_proxy'
  | 'incident';

export type DiagnosticSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface DiagnosticEvent {
  id: string;
  type: DiagnosticEventType;
  severity: DiagnosticSeverity;
  occurredAt: string;
  appBuild: string;
  platform: 'android' | 'ios' | 'web';
  code: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface CrashReportEnvelope {
  event: DiagnosticEvent;
  stack?: string;
}

export interface DiagnosticSink {
  record(event: DiagnosticEvent): void;
}

export const MAX_DIAGNOSTIC_EVENTS = 200;
const ALLOWED_METADATA = new Set([
  'durationMs',
  'scheduledCount',
  'failedCount',
  'notificationState',
  'entitlementState',
  'result',
  'reasonCode',
  'lifecycleStep',
  'productPeriod',
  'platformCapability',
  'incidentCode',
]);

function safeString(value: unknown, maxLength = 120): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized.slice(0, maxLength) : null;
}

export function sanitizeMetadata(input: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!ALLOWED_METADATA.has(key)) continue;
    if (typeof value === 'boolean' || value === null) output[key] = value;
    else if (typeof value === 'number' && Number.isFinite(value)) output[key] = value;
    else if (typeof value === 'string') output[key] = safeString(value);
  }
  return output;
}

export function createDiagnosticEvent(input: Omit<DiagnosticEvent, 'id' | 'occurredAt' | 'metadata'> & { id?: string; occurredAt?: string; metadata?: Record<string, unknown> }): DiagnosticEvent {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  if (!Number.isFinite(new Date(occurredAt).getTime())) throw new Error('Ungültiger Diagnostic-Zeitpunkt');
  if (!input.appBuild.trim() || !input.code.trim()) throw new Error('Diagnostic appBuild/code erforderlich');
  return {
    id: input.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type: input.type,
    severity: input.severity,
    occurredAt,
    appBuild: input.appBuild.trim().slice(0, 64),
    platform: input.platform,
    code: input.code.trim().slice(0, 96),
    metadata: sanitizeMetadata(input.metadata ?? {}),
  };
}

export class LocalDiagnosticBuffer implements DiagnosticSink {
  private readonly events: DiagnosticEvent[] = [];

  record(event: DiagnosticEvent): void {
    this.events.push(event);
    if (this.events.length > MAX_DIAGNOSTIC_EVENTS) this.events.splice(0, this.events.length - MAX_DIAGNOSTIC_EVENTS);
  }

  snapshot(): DiagnosticEvent[] {
    return this.events.map((event) => ({ ...event, metadata: { ...event.metadata } }));
  }

  clear(): void {
    this.events.length = 0;
  }
}

export function toCrashReportEnvelope(event: DiagnosticEvent, stack?: string): CrashReportEnvelope {
  const normalizedStack = safeString(stack, 4000);
  return normalizedStack ? { event, stack: normalizedStack } : { event };
}
