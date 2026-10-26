// Serves the actual build under a repository Pages prefix for browser tests.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../dist');
const port = Number(process.env.PORT || 4173);
const prefix = '/171YbDatabase/';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Run npm run check before browser tests: dist/index.html is missing.');
const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname); }
  catch { response.writeHead(400).end('Invalid URL'); return; }
  if (!pathname.startsWith(prefix)) { response.writeHead(404).end('Unknown Pages prefix'); return; }
  const relative = pathname.slice(prefix.length) || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404).end('Not found'); return; }
  response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(response);
});
server.listen(port, '127.0.0.1', () => console.log(`Pages build preview: http://127.0.0.1:${port}${prefix}`));
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
