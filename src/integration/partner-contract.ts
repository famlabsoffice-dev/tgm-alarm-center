import { createHash } from 'node:crypto';

export const PARTNER_API_VERSION = '1';
export const MAX_BULK_EVENTS = 100;
export const MAX_REQUEST_BYTES = 512 * 1024;

export type PartnerRoute = 'POST /events' | 'POST /events/bulk' | 'POST /alarms' | 'GET /events' | 'GET /alarm-status';

export interface PartnerIdentity { partnerId: string; keyId: string; }
export interface PartnerEvent { id: string; accountId: string; event: string; start: string; end: string | null; category: string; metadata: Record<string, string | number | boolean | null>; }
export interface PartnerAlarm { id: string; eventId: string | null; accountId: string; title: string; start: string; warnings: number[]; category: string; metadata: Record<string, string | number | boolean | null>; }
export interface PartnerRequest { method: 'GET' | 'POST'; route: PartnerRoute; timestamp: number; nonce: string; body: string; identity: PartnerIdentity; signature: string; }

const HEX = /^[0-9a-f]{64}$/;
const TOKEN = /^[A-Za-z0-9._~-]{8,128}$/;

export function canonicalRequest(request: Omit<PartnerRequest, 'signature'>): string {
  return [request.method, request.route, PARTNER_API_VERSION, request.identity.partnerId, request.identity.keyId, String(request.timestamp), request.nonce, sha256(request.body)].join('\n');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function validatePartnerRequest(request: PartnerRequest, nowMs = Date.now()): void {
  if (!TOKEN.test(request.identity.partnerId) || !TOKEN.test(request.identity.keyId) || !TOKEN.test(request.nonce)) throw new Error('Ungültige Partner-Identität');
  if (!Number.isSafeInteger(request.timestamp) || Math.abs(nowMs - request.timestamp) > 5 * 60 * 1000) throw new Error('Partner-Request außerhalb des Zeitfensters');
  if (Buffer.byteLength(request.body, 'utf8') > MAX_REQUEST_BYTES) throw new Error('Partner-Request ist zu groß');
  if (!HEX.test(request.signature)) throw new Error('Ungültige Partner-Signatur');
}

export interface SignatureVerifier { verify(canonicalPayload: string, signatureHex: string, keyId: string): Promise<boolean>; }

export async function verifyPartnerRequest(request: PartnerRequest, verifier: SignatureVerifier, nowMs = Date.now()): Promise<void> {
  validatePartnerRequest(request, nowMs);
  const valid = await verifier.verify(canonicalRequest(request), request.signature, request.identity.keyId);
  if (!valid) throw new Error('Partner-Signatur ungültig');
}

export function validateBulkSize(events: readonly PartnerEvent[]): void {
  if (events.length === 0 || events.length > MAX_BULK_EVENTS) throw new Error('Ungültige Bulk-Größe');
}

export function routeIsInternalOnly(route: PartnerRoute): boolean { return route === 'POST /events' || route === 'POST /events/bulk' || route === 'POST /alarms' || route === 'GET /events' || route === 'GET /alarm-status'; }
