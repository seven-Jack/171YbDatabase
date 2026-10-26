const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { filesBelow } = require('./build.cjs');

function checkArtifacts(directory, options = {}) {
  const root = path.resolve(directory);
  const htmlFile = path.join(root, 'index.html');
  assert(fs.existsSync(htmlFile), 'Missing built index.html');
  const html = fs.readFileSync(htmlFile, 'utf8');
  const fileSet = new Set(filesBelow(root).map(file => path.relative(root, file).split(path.sep).join('/')));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'artifact-manifest.json'), 'utf8'));
  const expected = new Set(['artifact-manifest.json', ...manifest.files.map(file => file.path)]);
  assert.deepEqual([...fileSet].sort(), [...expected].sort(), 'Built file list differs from manifest (stale/missing resources)');
  for (const entry of manifest.files) {
    const bytes = fs.readFileSync(path.join(root, entry.path));
    assert.equal(bytes.length, entry.bytes, `Size mismatch: ${entry.path}`);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), entry.sha256, `Hash mismatch: ${entry.path}`);
  }
  let checked = 0;
  function localReference(from, reference) {
    if (!reference || /^(?:[a-z]+:|\/\/|#)/i.test(reference)) return;
    assert(!reference.startsWith('/'), `Root-relative resource breaks Pages subpath: ${from} → ${reference}`);
    const clean = decodeURIComponent(reference.split(/[?#]/)[0]);
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(from), clean));
    assert(!resolved.startsWith('../'), `Resource escapes publishing root: ${from} → ${reference}`);
    assert(fileSet.has(resolved) || fileSet.has(`${resolved}/index.html`), `Missing built resource: ${from} → ${reference}`);
    const deployed = new URL(reference, new URL(from, 'https://example.invalid/171YbDatabase/'));
    assert(deployed.pathname.startsWith('/171YbDatabase/'), `Resource escapes Pages prefix: ${reference}`);
    checked++;
  }
  for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) localReference('index.html', match[1]);
  for (const relative of fileSet) {
    if (!/\.(?:js|css)$/.test(relative)) continue;
    const content = fs.readFileSync(path.join(root, relative), 'utf8');
    if (relative.endsWith('.js')) {
      for (const match of content.matchAll(/\b(?:import|export)\s+(?:[^;"']*?\sfrom\s*)?["'](\.[^"']+)["']/g)) localReference(relative, match[1]);
      for (const match of content.matchAll(/\bimport\s*\(\s*["'](\.[^"']+)["']/g)) localReference(relative, match[1]);
      for (const match of content.matchAll(/new\s+URL\s*\(\s*["'](\.[^"']+)["']\s*,\s*import\.meta\.url/g)) localReference(relative, match[1]);
    } else {
      for (const match of content.matchAll(/url\(\s*["']?([^\s)"']+)/g)) localReference(relative, match[1]);
      for (const match of content.matchAll(/@import\s+["']([^"']+)["']/g)) localReference(relative, match[1]);
    }
  }
  assert(fileSet.has('assets/05.21_yb171_65s_hyperfine.csv'), '65S CSV download must remain published');
  if (!options.quiet) console.log(`Artifact checks passed: ${fileSet.size} files, ${checked} local references, Pages prefix preserved.`);
  return { files: fileSet.size, references: checked };
}
module.exports = { checkArtifacts };
if (require.main === module) checkArtifacts(path.resolve(__dirname, '..', 'dist'));
