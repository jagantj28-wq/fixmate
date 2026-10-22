/**
 * Production Web Server for FixMate on Render / Cloud Platforms
 * Serves the exported Expo web SPA with fallback routing on $PORT.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 10000;
const DIST_DIR = path.join(__dirname, 'dist');

// If dist directory doesn't exist, build it on the fly
if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.log('[FixMate Server] Web build not found in dist/. Triggering "npx expo export -p web"...');
  try {
    execSync('npx expo export -p web', { stdio: 'inherit' });
    console.log('[FixMate Server] Web build completed successfully.');
  } catch (err) {
    console.error('[FixMate Server] Failed to build web assets:', err);
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  // Normalize URL and remove query strings/hashes
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Health check endpoint
  if (pathname === '/healthz' || pathname === '/_health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  let filePath = path.join(DIST_DIR, pathname);

  // If path is directory or root, target index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If file does not exist, check for .html extension or fallback to SPA index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else {
      // SPA Fallback for client routes (/explore, /bookings, /profile, /book, etc.)
      filePath = path.join(DIST_DIR, 'index.html');
    }
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[FixMate Server] Running on http://0.0.0.0:${PORT}`);
});
