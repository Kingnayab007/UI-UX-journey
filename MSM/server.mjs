/**
 * Zero-dependency preview server.
 * Serves the static redesign and proxies the two existing form endpoints to
 * the live API so validation + submission behaviour stays untouched.
 *
 *   node server.mjs            -> http://localhost:4173
 *   PORT=8080 node server.mjs
 */
import http from 'node:http';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const UPSTREAM = 'https://msm-e.com';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml'
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const resolved = path.resolve(ROOT, '.' + decoded);
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
}

async function serveStatic(req, res, urlPath) {
  let file = safePath(urlPath);
  if (!file) { res.writeHead(403).end('Forbidden'); return; }
  try {
    let s = await stat(file);
    if (s.isDirectory()) {
      file = path.join(file, 'index.html');
      s = await stat(file);
    }
    if (!s.isFile()) throw new Error('not a file');
    const body = await readFile(file);
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const compressible = /^(text\/|application\/(javascript|json))/i.test(type);
    const accepts = String(req.headers['accept-encoding'] || '').toLowerCase();
    let payload = body;
    const headers = {
      'Content-Type': type,
      'Cache-Control': file.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Accept-Encoding'
    };
    if (compressible && body.length > 1024) {
      if (accepts.includes('br')) {
        payload = brotliCompressSync(body);
        headers['Content-Encoding'] = 'br';
      } else if (accepts.includes('gzip')) {
        payload = gzipSync(body);
        headers['Content-Encoding'] = 'gzip';
      }
    }
    headers['Content-Length'] = payload.length;
    res.writeHead(200, headers);
    if (req.method === 'HEAD') res.end(); else res.end(payload);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Not Found');
  }
}

async function proxyApi(req, res) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  try {
    const upstream = await fetch(UPSTREAM + req.url, {
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'] || 'application/json',
        'accept': 'application/json',
        'user-agent': 'MSM-Local-Proxy/1.0'
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : body
    });
    const text = await upstream.text();
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(text);
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: 'Upstream unavailable', detail: String(error) }));
  }
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) { proxyApi(req, res); return; }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end('Method Not Allowed'); return; }
  serveStatic(req, res, req.url);
}).listen(PORT, () => {
  console.log(`MSM redesign running at http://localhost:${PORT}`);
});
