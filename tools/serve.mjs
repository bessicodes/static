/*
 * Tiny zero-dependency static server for local development.
 *   node tools/serve.mjs          -> http://localhost:5173
 *   node tools/serve.mjs 8080     -> http://localhost:8080
 *
 * You need a real HTTP server rather than opening index.html from disk,
 * because ES modules and fetch() are both blocked on file:// URLs.
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = normalize(join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const PORT = Number(process.argv[2]) || 5173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp'
};

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let path = normalize(join(ROOT, url));

    // never serve outside the repo
    if (!path.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }

    try {
      if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('404 ' + url);
      return;
    }

    const body = await readFile(path);
    res.writeHead(200, {
      'content-type': TYPES[extname(path).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache'
    }).end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('404');
  }
}).listen(PORT, () => {
  console.log(`STATIC serving ${ROOT}`);
  console.log(`http://localhost:${PORT}`);
});
