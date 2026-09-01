import { createHash, createPublicKey, X509Certificate, verify as verifySignature } from 'node:crypto';

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

function decodeBase64Url(value: string): Buffer {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new SecurityError('Ungültige Base64url-Kodierung.');
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='), 'base64');
}

function decodeJson(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(value).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not-object');
    return parsed as Record<string, unknown>;
  } catch {
    throw new SecurityError('Signierte Payload enthält kein gültiges JSON.');
  }
}

function rawEcdsaSignatureToDer(signature: Buffer): Buffer {
  if (signature.length !== 64) throw new SecurityError('Ungültige ES256-Signaturgröße.');
  const integer = (offset: number): Buffer => {
    let value = signature.subarray(offset, offset + 32);
    while (value.length > 1 && value[0] === 0) value = value.subarray(1);
    const first = value[0];
    if (first !== undefined && first & 0x80) value = Buffer.concat([Buffer.from([0]), value]);
    return Buffer.concat([Buffer.from([0x02, value.length]), value]);
  };
  const r = integer(0);
  const s = integer(32);
  const sequence = Buffer.concat([r, s]);
  return Buffer.concat([Buffer.from([0x30, sequence.length]), sequence]);
}

function assertCertificateDates(cert: X509Certificate, now = Date.now()): void {
  const validFrom = Date.parse(cert.validFrom);
  const validTo = Date.parse(cert.validTo);
  if (!Number.isFinite(validFrom) || !Number.isFinite(validTo) || now < validFrom || now > validTo) throw new SecurityError('Zertifikatskette ist außerhalb ihrer Gültigkeit.');
}

function verifyCertificateChain(certificates: string[], trustedRootPem: string): X509Certificate {
  if (certificates.length < 2) throw new SecurityError('Apple-JWS enthält keine vollständige Zertifikatskette.');
  const chain = certificates.map((value) => new X509Certificate(Buffer.from(value, 'base64')));
  const trustedRoot = new X509Certificate(trustedRootPem);
  chain.forEach(assertCertificateDates);
  assertCertificateDates(trustedRoot);
  for (let index = 0; index < chain.length - 1; index += 1) {
    const issuer = chain[index];
    const subject = chain[index + 1];
    if (!issuer || !subject || !issuer.checkIssued(subject)) throw new SecurityError('Apple-Zertifikatskette ist ungültig.');
    if (!issuer.verify(subject.publicKey)) throw new SecurityError('Apple-Zertifikatsignatur ist ungültig.');
  }
  const leaf = chain[0];
  const last = chain[chain.length - 1];
  if (!leaf || !last || !last.checkIssued(trustedRoot) || !last.verify(trustedRoot.publicKey)) throw new SecurityError('Apple-Root-Zertifikat ist nicht vertrauenswürdig.');
  return leaf;
}

export interface VerifiedJws {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  digest: string;
}

export function verifyAppleJws(compactJws: string, trustedRootPem: string): VerifiedJws {
  const parts = compactJws.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) throw new SecurityError('Apple-JWS muss drei Segmente enthalten.');
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodeJson(headerPart);
  const payload = decodeJson(payloadPart);
  if (header.alg !== 'ES256') throw new SecurityError('Nur ES256-Apple-JWS sind zulässig.');
  if (header.typ !== 'JWT') throw new SecurityError('Apple-JWS-Typ ist ungültig.');
  if (!Array.isArray(header.x5c) || !header.x5c.every((item) => typeof item === 'string')) throw new SecurityError('Apple-JWS enthält keine Zertifikatskette.');
  const leaf = verifyCertificateChain(header.x5c as string[], trustedRootPem);
  const signature = rawEcdsaSignatureToDer(decodeBase64Url(signaturePart));
  const signingInput = Buffer.from(`${headerPart}.${payloadPart}`, 'ascii');
  if (!verifySignature('sha256', signingInput, leaf.publicKey, signature)) throw new SecurityError('Apple-JWS-Signatur ist ungültig.');
  return { header, payload, digest: createHash('sha256').update(compactJws).digest('hex') };
}

export interface VerifiedGoogleOidc {
  header: Record<string, unknown>;
  claims: Record<string, unknown>;
  digest: string;
}

export function verifyGoogleOidcClaims(token: string, trustedPublicKeyPem: string, expectedAudience: string, now = Math.floor(Date.now() / 1000)): VerifiedGoogleOidc {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) throw new SecurityError('Google-OIDC-Token muss drei Segmente enthalten.');
  const [headerPart, claimsPart, signaturePart] = parts;
  const header = decodeJson(headerPart);
  const claims = decodeJson(claimsPart);
  if (header.alg !== 'RS256') throw new SecurityError('Nur RS256-Google-OIDC-Tokens sind zulässig.');
  if (claims.iss !== 'https://accounts.google.com' && claims.iss !== 'accounts.google.com') throw new SecurityError('Google-OIDC-Issuer ist ungültig.');
  if (claims.aud !== expectedAudience) throw new SecurityError('Google-OIDC-Audience stimmt nicht überein.');
  if (typeof claims.exp !== 'number' || claims.exp <= now) throw new SecurityError('Google-OIDC-Token ist abgelaufen.');
  if (typeof claims.iat !== 'number' || claims.iat > now + 60) throw new SecurityError('Google-OIDC-Token liegt in der Zukunft.');
  const signature = decodeBase64Url(signaturePart);
  if (!verifySignature('RSA-SHA256', Buffer.from(`${headerPart}.${claimsPart}`, 'ascii'), createPublicKey(trustedPublicKeyPem), signature)) throw new SecurityError('Google-OIDC-Signatur ist ungültig.');
  return { header, claims, digest: createHash('sha256').update(token).digest('hex') };
}

export function constantTimeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return leftBuffer.equals(rightBuffer);
}
