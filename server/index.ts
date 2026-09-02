import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { loadServerConfig } from './config';
import { BillingRepository } from './repository';
import { BillingWebhookService } from './webhooks';
import { SecurityError } from './security';

const MAX_BODY_BYTES = 256 * 1024;

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new SecurityError('Webhook-Payload ist zu groß.');
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new SecurityError('Request enthält kein gültiges JSON.');
  }
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}

function pathname(request: IncomingMessage): string {
  return new URL(request.url ?? '/', 'http://billing.local').pathname;
}

function bearer(request: IncomingMessage): string {
  const value = request.headers.authorization;
  if (!value?.startsWith('Bearer ')) throw new SecurityError('Bearer-Authentifizierung fehlt.');
  const token = value.slice('Bearer '.length).trim();
  if (!token) throw new SecurityError('Bearer-Token ist leer.');
  return token;
}

export function createBillingServer(): ReturnType<typeof createServer> {
  const config = loadServerConfig();
  const repository = new BillingRepository(config.dataFile);
  const service = new BillingWebhookService(config, repository);
  return createServer(async (request, response) => {
    try {
      const path = pathname(request);
      if (request.method === 'GET' && path.startsWith('/v1/entitlements/')) {
        const userId = decodeURIComponent(path.slice('/v1/entitlements/'.length));
        if (!userId || userId.length > 256) throw new SecurityError('Nutzer-ID ist ungültig.');
        const entitlement = await repository.getActiveEntitlement(userId);
        json(response, 200, { entitlement });
        return;
      }
      if (request.method !== 'POST') {
        response.setHeader('allow', 'GET, POST');
        json(response, 405, { error: 'Methode nicht erlaubt.' });
        return;
      }
      const body = await readJson(request);
      if (path === '/v1/verify/purchase') {
        const entitlement = await service.verifyPurchase(body as Parameters<BillingWebhookService['verifyPurchase']>[0]);
        json(response, 200, { entitlement });
        return;
      }
      if (path === '/v1/webhooks/apple') {
        const result = await service.receiveAppleNotification(body);
        json(response, 200, { result });
        return;
      }
      if (path === '/v1/webhooks/google') {
        const result = await service.receiveGoogleNotification(bearer(request), body);
        json(response, 200, { result });
        return;
      }
      json(response, 404, { error: 'Route nicht gefunden.' });
    } catch (error: unknown) {
      const status = error instanceof SecurityError ? 400 : 500;
      json(response, status, { error: error instanceof Error ? error.message : 'Interner Serverfehler.' });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadServerConfig();
  createBillingServer().listen(config.port, '0.0.0.0', () => {
    console.log(`TGM Billing Server listening on port ${config.port}`);
  });
}
