import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { build } = require('../../scripts/build.cjs');
const { checkArtifacts } = require('../../scripts/check-artifacts.cjs');
const { exportEvidence } = require('../../scripts/evidence-data.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yb171-build-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const folder of ['src', 'data', 'assets']) fs.mkdirSync(path.join(root, folder));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: 'test' }));
  fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><html lang="zh-CN"><script type="module" src="src/main.js"></script><a href="assets/05.21_yb171_65s_hyperfine.csv">CSV</a></html>');
  fs.writeFileSync(path.join(root, 'src/main.js'), "import { value } from './value.js'; export { value };\n");
  fs.writeFileSync(path.join(root, 'src/value.js'), 'export const value = 1;\n');
  fs.writeFileSync(path.join(root, 'assets/05.21_yb171_65s_hyperfine.csv'), 'F,energy\n');
  fs.writeFileSync(path.join(root, 'data/dataset.json'), JSON.stringify({ datasetVersion: 'test-data' }));
  return root;
}

test('clean build removes resources deleted since the previous build', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'src/obsolete.js'), 'export {};');
  build(root, { quiet: true });
  assert(fs.existsSync(path.join(root, 'dist/src/obsolete.js')));
  fs.unlinkSync(path.join(root, 'src/obsolete.js'));
  build(root, { quiet: true });
  assert(!fs.existsSync(path.join(root, 'dist/src/obsolete.js')));
  assert.doesNotThrow(() => checkArtifacts(path.join(root, 'dist'), { quiet: true }));
});

test('identical source has deterministic files and artifact hashes', t => {
  const root = fixture(t);
  const first = build(root, { quiet: true, commit: 'fixture', sourceTimestamp: '2026-10-26T00:00:00Z' });
  const second = build(root, { quiet: true, commit: 'fixture', sourceTimestamp: '2026-10-26T00:00:00Z' });
  assert.deepEqual(first, second);
});

test('artifact checks fail on a missing production import and a root-relative Pages path', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'src/main.js'), "import './missing.js';\n");
  build(root, { quiet: true });
  assert.throws(() => checkArtifacts(path.join(root, 'dist'), { quiet: true }), /Missing built resource/);
  fs.writeFileSync(path.join(root, 'src/main.js'), 'export {};\n');
  fs.writeFileSync(path.join(root, 'index.html'), '<script type="module" src="/src/main.js"></script>');
  build(root, { quiet: true });
  assert.throws(() => checkArtifacts(path.join(root, 'dist'), { quiet: true }), /Root-relative/);
});

test('artifact checks reject a changed file after packaging', t => {
  const root = fixture(t);
  build(root, { quiet: true });
  fs.appendFileSync(path.join(root, 'dist/src/main.js'), '\n// changed');
  assert.throws(() => checkArtifacts(path.join(root, 'dist'), { quiet: true }), /mismatch/);
});

test('local literature originals and audit evidence never enter the website artifact',t=>{
  const root=fixture(t);
  fs.mkdirSync(path.join(root,'data/literature/raw'),{recursive:true});
  fs.mkdirSync(path.join(root,'references/papers'),{recursive:true});
  fs.writeFileSync(path.join(root,'data/literature/raw/paper.txt'),'local source text');
  fs.writeFileSync(path.join(root,'references/papers/paper.pdf'),'%PDF-local research evidence');
  const manifest=build(root,{quiet:true});
  assert.equal(fs.existsSync(path.join(root,'dist/data/literature')),false);
  assert.equal(fs.existsSync(path.join(root,'dist/references')),false);
  assert.equal(fs.existsSync(path.join(root,'dist/data/dataset.json')),true);
  assert.ok(manifest.files.every(file=>!file.path.includes('literature/')&&!file.path.includes('references/')));
});

test('build packages validated public evidence and rejects stale or unsafe evidence before rebuilding',t=>{
  const root=fixture(t);
  const evidence=JSON.parse(fs.readFileSync(new URL('../../data/evidence.json',import.meta.url),'utf8'));
  fs.writeFileSync(path.join(root,'data/evidence.json'),JSON.stringify(evidence));
  exportEvidence({root});
  const manifest=build(root,{quiet:true});
  assert.ok(manifest.files.some(file=>file.path==='data/evidence.json'));
  assert.ok(manifest.files.some(file=>file.path==='src/data/generated-evidence.js'));
  evidence.evidenceVersion='2026.10.31.2';
  fs.writeFileSync(path.join(root,'data/evidence.json'),JSON.stringify(evidence));
  assert.throws(()=>build(root,{quiet:true}),/stale/);
  evidence.rawPDF='/Users/seven/private-paper.pdf';
  fs.writeFileSync(path.join(root,'data/evidence.json'),JSON.stringify(evidence));
  assert.throws(()=>build(root,{quiet:true}),/Invalid public evidence/);
});
