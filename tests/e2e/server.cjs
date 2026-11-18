// Serves the actual build under a repository Pages prefix for browser tests.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { checkArtifacts } = require('../../scripts/check-artifacts.cjs');
const { sourceFingerprint } = require('../../scripts/artifact-files.cjs');
const { readVersion } = require('../../scripts/write-version.cjs');
const projectRoot = path.resolve(__dirname, '../..');
const root = path.join(projectRoot, 'dist');
const port = Number(process.env.PORT || 4173);
const prefix = '/171YbDatabase/';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
function verifyBrowserBuild(project, output = path.join(project, 'dist')) {
  if (!fs.existsSync(path.join(output, 'index.html'))) {
    throw new Error('Missing dist/index.html. Run npm run check before browser tests.');
  }
  const { buildInfo } = checkArtifacts(output, { quiet: true });
  const checkout = readVersion(project).appCommit;
  if (buildInfo.appCommit !== checkout || buildInfo.sourceFingerprint !== sourceFingerprint(project)) {
    throw new Error(
      'Browser artifact SHA ' + buildInfo.appCommit + ' does not match the current build inputs (checkout SHA ' +
      checkout + '). Run npm run check before browser tests.'
    );
  }
  return buildInfo;
}

function serve() {
  const build = verifyBrowserBuild(projectRoot);
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
  server.listen(port, '127.0.0.1', () => {
    console.log('Pages build preview: http://127.0.0.1:' + port + prefix + ' (build SHA ' + build.appCommit + ').');
  });
  process.on('SIGINT', () => server.close(() => process.exit(0)));
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
}

module.exports = { verifyBrowserBuild };
if (require.main === module) serve();
