import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, extname, resolve, normalize } from 'node:path';

const args = process.argv.slice(2);
let port = 8080;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) { port = parseInt(args[i + 1], 10); i++; }
}

const gameDir = resolve(join(import.meta.dirname || '.', 'game'));

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${port}`);
  let path = decodeURIComponent(url.pathname);
  if (path === '/') path = '/index.html';
  const resolved = normalize(join(gameDir, path));
  if (!resolved.startsWith(gameDir)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  try {
    const data = readFileSync(resolved);
    const ext = extname(resolved).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`Serving game/ on http://localhost:${port}`);
});
