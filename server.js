const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const { URL } = require('node:url');

const port = Number(process.env.PORT || process.env.NODE_PORT || 3000);
const backendOrigin = process.env.DMB_API_ORIGIN || '';
const soketiOrigin = process.env.DMB_SOKETI_ORIGIN || '';

const rootDir = __dirname;
const userDist = path.join(rootDir, 'New User Panel Frontend', 'dist');
const adminDist = path.join(rootDir, 'public', 'admin-panel');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8'
};

const backendPrefixes = [
  '/api',
  '/sanctum',
  '/broadcasting',
  '/storage',
  '/uploads',
  '/uploaded-files'
];
const websocketPrefixes = ['/app', '/apps'];

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function normalizeStaticPath(baseDir, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, '');
  const fullPath = path.join(baseDir, normalized);
  if (!fullPath.startsWith(baseDir)) return null;
  return fullPath;
}

function serveFile(req, res, baseDir, urlPath, spaFallback = true) {
  let filePath = normalizeStaticPath(baseDir, urlPath);
  if (!filePath) return send(res, 400, 'Bad request');

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath) && spaFallback) {
    filePath = path.join(baseDir, 'index.html');
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return send(res, 404, 'Not found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const headers = {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable'
  };
  fs.createReadStream(filePath)
    .on('error', () => send(res, 500, 'Unable to read file'))
    .pipe(res.writeHead(200, headers));
}

function proxy(req, res, targetOrigin) {
  if (!targetOrigin) return send(res, 502, 'Backend origin is not configured');
  const target = new URL(req.url, targetOrigin);
  const headers = { ...req.headers, host: target.host };
  headers['x-forwarded-host'] = req.headers.host || '';
  headers['x-forwarded-proto'] = req.headers['x-forwarded-proto'] || 'https';

  const transport = target.protocol === 'https:' ? https : http;
  const upstream = transport.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      method: req.method,
      path: `${target.pathname}${target.search}`,
      headers
    },
    upstreamRes => {
      const responseHeaders = { ...upstreamRes.headers };
      delete responseHeaders['content-security-policy'];
      res.writeHead(upstreamRes.statusCode || 502, responseHeaders);
      upstreamRes.pipe(res);
    }
  );

  upstream.on('error', error => {
    console.error('Proxy error:', error.message);
    send(res, 502, 'Bad gateway');
  });

  req.pipe(upstream);
}

function proxyUpgrade(req, socket, head, targetOrigin) {
  if (!targetOrigin) return socket.destroy();
  const target = new URL(req.url, targetOrigin);
  const transport = target.protocol === 'https:' ? https : http;
  const upstream = transport.request({
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port,
    method: req.method,
    path: `${target.pathname}${target.search}`,
    headers: { ...req.headers, host: target.host }
  });

  upstream.on('upgrade', (upstreamRes, upstreamSocket, upstreamHead) => {
    socket.write(
      `HTTP/${upstreamRes.httpVersion} ${upstreamRes.statusCode} ${upstreamRes.statusMessage}\r\n` +
        Object.entries(upstreamRes.headers).map(([key, value]) => `${key}: ${value}`).join('\r\n') +
        '\r\n\r\n'
    );
    upstreamSocket.pipe(socket).pipe(upstreamSocket);
    if (upstreamHead.length) socket.write(upstreamHead);
  });

  upstream.on('error', () => socket.destroy());
  upstream.end(head);
}

function isPrefixed(urlPath, prefixes) {
  return prefixes.some(prefix => urlPath === prefix || urlPath.startsWith(`${prefix}/`));
}

const server = http.createServer((req, res) => {
  const urlPath = new URL(req.url || '/', 'http://localhost').pathname;

  if (isPrefixed(urlPath, backendPrefixes)) {
    return proxy(req, res, backendOrigin);
  }

  if (urlPath === '/healthz') {
    return send(res, 200, 'ok', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  if (urlPath === '/admin-panel') {
    res.writeHead(308, { Location: '/admin-panel/' });
    return res.end();
  }

  if (urlPath.startsWith('/admin-panel/')) {
    return serveFile(req, res, adminDist, urlPath.replace(/^\/admin-panel\/?/, ''), true);
  }

  return serveFile(req, res, userDist, urlPath, true);
});

server.on('upgrade', (req, socket, head) => {
  const urlPath = new URL(req.url || '/', 'http://localhost').pathname;
  if (isPrefixed(urlPath, websocketPrefixes)) {
    return proxyUpgrade(req, socket, head, soketiOrigin);
  }
  socket.destroy();
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Doctor Marriage Bureau web app listening on ${port}`);
  console.log(`Backend proxy: ${backendOrigin}`);
  console.log(`Soketi proxy: ${soketiOrigin}`);
});
