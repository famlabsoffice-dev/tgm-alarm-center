export type OwnerAuthorizationFailure = 'unauthenticated' | 'forbidden';

export interface AuthenticatedOwner {
  subject: string;
  issuedAt: string;
  expiresAt: string;
}

export interface OwnerAuthorizationResult {
  authorized: true;
  ownerId: string;
}

function validIdentityTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value));
}

export function authorizeOwnerAccess(
  identity: AuthenticatedOwner | null | undefined,
  requestedOwnerId: string,
  now = new Date(),
): OwnerAuthorizationResult | OwnerAuthorizationFailure {
  if (!identity || !identity.subject.trim() || !validIdentityTimestamp(identity.issuedAt) || !validIdentityTimestamp(identity.expiresAt)) return 'unauthenticated';
  if (!Number.isFinite(now.getTime()) || Date.parse(identity.expiresAt) <= now.getTime()) return 'unauthenticated';
  if (!requestedOwnerId.trim() || identity.subject !== requestedOwnerId) return 'forbidden';
  return { authorized: true, ownerId: identity.subject };
}

export function assertOwnerAccess(
  identity: AuthenticatedOwner | null | undefined,
  requestedOwnerId: string,
  now = new Date(),
): OwnerAuthorizationResult {
  const result = authorizeOwnerAccess(identity, requestedOwnerId, now);
  if (result === 'unauthenticated') throw new Error('401 UNAUTHENTICATED');
  if (result === 'forbidden') throw new Error('403 FORBIDDEN');
  return result;
}
