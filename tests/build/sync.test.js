import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseArgs, validatePaths } = require('../../scripts/sync.cjs');

test('sync separates a reviewed commit from a push', () => {
  assert.equal(parseArgs([]).command, 'plan');
  assert.deepEqual(parseArgs(['commit', '--message', 'reviewed', '--files', 'index.html', 'README.md', '--dry-run']), { command: 'commit', message: 'reviewed', files: ['index.html', 'README.md'], staged: false, dryRun: true });
  assert.equal(parseArgs(['push']).command, 'push');
  assert.throws(() => parseArgs(['a former implicit commit message']), /Usage/);
  assert.throws(() => parseArgs(['commit', '--message', 'unscoped']), /scope/);
  assert.throws(() => parseArgs(['push', '--files', 'index.html']), /only accepted/);
});

test('sync accepts exact maintained files and rejects directory/broad/outside scopes', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yb171-sync-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src/main.js'), '');
  assert.deepEqual(validatePaths(root, ['src/main.js']), ['src/main.js']);
  for (const input of ['.', 'src', '../other', '.git/config', 'dist/index.html', 'node_modules/x']) assert.throws(() => validatePaths(root, [input]));
});
