const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const defaultRoot = path.resolve(__dirname, '../dist');
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.md': 'text/plain; charset=utf-8',
};

function createPreviewServer({ root = defaultRoot } = {}) {
  if (!fs.existsSync(path.join(root, 'index.html'))) {
    throw new Error('Missing dist/index.html. Run npm run check before npm run preview.');
  }
  const directory = fs.realpathSync(root);
  const contained = file => file.startsWith(directory + path.sep);
  const privateFile = file => /^(?:references|data\/literature)(?:\/|$)/.test(path.relative(directory, file).split(path.sep).join('/')) || path.extname(file).toLowerCase() === '.pdf';
  return http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const fail = (status, message) => {
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : message);
    };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      fail(405, 'Method not allowed');
      return;
    }
    try {
      let pathname;
      try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
      catch { fail(400, 'Invalid URL'); return; }
      if (pathname.includes('\0')) { fail(400, 'Invalid URL'); return; }
      const file = path.resolve(directory, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
      // Preview only the public build, including protection against symlink escapes.
      const relative = path.relative(directory, file).split(path.sep).join('/');
      if (!contained(file) || privateFile(file)) {
        fail(404, 'Not found'); return;
      }
      const actual = await fs.promises.realpath(file);
      const info = await fs.promises.stat(actual);
      if (!contained(actual) || privateFile(actual) || !info.isFile()) { fail(404, 'Not found'); return; }
      response.statusCode = 200;
      response.setHeader('Content-Type', mime[path.extname(actual).toLowerCase()] || 'application/octet-stream');
      response.setHeader('Content-Length', info.size);
      if (request.method === 'HEAD') { response.end(); return; }
      const stream = fs.createReadStream(actual);
      stream.on('error', error => {
        console.error(`Preview could not read ${relative}: ${error.code || error.message}`);
        if (response.headersSent) response.destroy();
        else { response.removeHeader('Content-Length'); fail(500, 'Could not read preview file'); }
      });
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    } catch (error) {
      if (['ENOENT', 'ENOTDIR'].includes(error.code)) fail(404, 'Not found');
      else { console.error(`Preview request failed: ${error.code || error.message}`); fail(500, 'Preview request failed'); }
    }
  });
}

module.exports = { createPreviewServer };

if (require.main === module) {
  const port = Number(process.env.PORT || 8766);
  try {
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
    const server = createPreviewServer();
    server.on('error', error => {
      console.error(error.code === 'EADDRINUSE'
        ? `Local preview port ${port} is already in use. Stop its existing preview or set PORT to another port.`
        : `Local preview failed: ${error.message}`);
      process.exitCode = 1;
    });
    server.listen({ port, host: '127.0.0.1', backlog: 511 }, () => {
      console.log(`Local build preview: http://localhost:${port}/index.html`);
    });
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
