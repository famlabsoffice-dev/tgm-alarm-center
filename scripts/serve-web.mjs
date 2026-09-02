import http from 'node:http';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join, normalize, resolve, extname } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const root = resolve(process.cwd(), valueAfter('--root', 'dist/web'));
const port = Number(valueAfter('--port', '4173'));
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`Invalid port: ${port}`);
if (!existsSync(root) || !statSync(root).isDirectory()) throw new Error(`Web root does not exist: ${root}`);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.wav': 'audio/wav',
};

const server = http.createServer((req, res) => {
  try {
    const rawPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const requested = rawPath === '/' ? '/index.html' : rawPath;
    const candidate = resolve(root, `.${normalize(requested)}`);
    if (candidate !== root && !candidate.startsWith(`${root}/`)) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }
    if (!existsSync(candidate) || !statSync(candidate).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const content = readFileSync(candidate);
    res.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': types[extname(candidate).toLowerCase()] || 'application/octet-stream',
      'content-length': content.length,
    });
    res.end(content);
  } catch {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
  }
});

server.listen(port, '127.0.0.1', () => {
  const address = server.address();
  const activePort = typeof address === 'object' && address ? address.port : port;
  console.log(`WEB_SERVER_READY http://127.0.0.1:${activePort}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);