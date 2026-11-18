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
const { exportData } = require('../../scripts/export-data.cjs');
const { DATA_FILES } = require('../../scripts/validate-data.cjs');
const { verifyBrowserBuild } = require('../e2e/server.cjs');

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
  assert.match(fs.readFileSync(path.join(root, 'dist/src/version.js'), 'utf8'), /APP_COMMIT = "fixture"/);
});

test('missing imports and staged artifact validation failures preserve the installed build', t => {
  const root = fixture(t);
  const output = path.join(root, 'dist');
  const manifest = build(root, { quiet: true });
  fs.writeFileSync(path.join(root, 'src/main.js'), "import './missing.js';\n");
  assert.throws(() => build(root, { quiet: true }), /Missing startup module/);
  fs.writeFileSync(path.join(root, 'src/main.js'), 'export {};\n');
  fs.writeFileSync(path.join(root, 'index.html'), '<script type="module" src="/src/main.js"></script>');
  assert.throws(() => build(root, { quiet: true }), /Root-relative/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'artifact-manifest.json'))), manifest);
  assert.doesNotThrow(() => checkArtifacts(output, { quiet: true }));
  assert.deepEqual(fs.readdirSync(path.join(root, 'tmp')), []);
});

test('a failed directory publication restores the installed build', t => {
  const root = fixture(t);
  const output = path.join(root, 'dist');
  const manifest = build(root, { quiet: true });
  fs.appendFileSync(path.join(root, 'index.html'), '<!-- replacement -->');
  const rename = fs.renameSync;
  const realOutput = fs.realpathSync(output);
  t.mock.method(fs, 'renameSync', (from, to) => {
    if (path.basename(from) === 'candidate' && to === realOutput) {
      throw new Error('Simulated install failure');
    }
    rename(from, to);
  });
  assert.throws(() => build(root, { quiet: true }), /Simulated install failure/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'artifact-manifest.json'))), manifest);
  assert.doesNotThrow(() => checkArtifacts(output, { quiet: true }));
  assert.deepEqual(fs.readdirSync(path.join(root, 'tmp')), []);
});

test('a competing publisher leaves the installed build and its lock intact', t => {
  const root = fixture(t);
  const output = path.join(root, 'dist');
  const first = build(root, { quiet: true });
  const scratch = path.join(root, 'tmp');
  fs.mkdirSync(path.join(scratch, 'dist-publish.lock'));
  assert.throws(() => build(root, { quiet: true }), /Another build is publishing/);
  assert.deepEqual(fs.readdirSync(scratch), ['dist-publish.lock']);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'artifact-manifest.json'))), first);
});

test('standalone build refuses stale canonical exports before changing dist', t => {
  const root = fixture(t);
  fs.cpSync(new URL('../../schemas/', import.meta.url), path.join(root, 'schemas'), { recursive: true });
  for (const file of [...DATA_FILES, 'dataset.json']) {
    fs.copyFileSync(new URL('../../data/' + file, import.meta.url), path.join(root, 'data', file));
  }
  exportData({ root });
  const manifest = build(root, { quiet: true });
  const sources = path.join(root, 'data/sources.json');
  const sourceData = JSON.parse(fs.readFileSync(sources, 'utf8'));
  sourceData.sources[0].reviewStatus += ' (changed)';
  fs.writeFileSync(sources, JSON.stringify(sourceData));
  assert.throws(() => build(root, { quiet: true }), /dataset\.json is stale/);
  const output = path.join(root, 'dist');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'artifact-manifest.json'))), manifest);
  assert.doesNotThrow(() => checkArtifacts(output, { quiet: true }));
});

test('browser reuse accepts the verified build without generated source metadata', t => {
  const root = fixture(t);
  const manifest = build(root, { quiet: true });
  fs.unlinkSync(path.join(root, 'src/version.js'));
  const { files, ...metadata } = manifest;
  assert.deepEqual(verifyBrowserBuild(root), metadata);
  fs.appendFileSync(path.join(root, 'src/value.js'), '// unbuilt source change\n');
  assert.throws(() => verifyBrowserBuild(root), /does not match.*current build inputs/);
});

test('browser startup rejects an artifact with a different commit even if content matches', t => {
  const root = fixture(t);
  build(root, { quiet: true, commit: 'older-build' });
  assert.throws(() => verifyBrowserBuild(root), /Browser artifact SHA older-build/);
});

test('artifact checks reject a changed file after packaging', t => {
  const root = fixture(t);
  build(root, { quiet: true });
  fs.appendFileSync(path.join(root, 'dist/src/main.js'), '\n// changed');
  assert.throws(() => checkArtifacts(path.join(root, 'dist'), { quiet: true }), /mismatch/);
});

test('local literature evidence and workstation metadata never enter the website artifact',t=>{
  const root=fixture(t);
  fs.mkdirSync(path.join(root,'data/literature/raw'),{recursive:true});
  fs.mkdirSync(path.join(root,'references/papers'),{recursive:true});
  fs.writeFileSync(path.join(root,'data/literature/raw/paper.txt'),'local source text');
  fs.writeFileSync(path.join(root,'references/papers/paper.pdf'),'%PDF-local research evidence');
  fs.writeFileSync(path.join(root,'src/.DS_Store'),'local Finder metadata');
  fs.writeFileSync(path.join(root,'assets/._private'),'local resource fork');
  const manifest=build(root,{quiet:true});
  assert.equal(fs.existsSync(path.join(root,'dist/data/literature')),false);
  assert.equal(fs.existsSync(path.join(root,'dist/references')),false);
  assert.equal(fs.existsSync(path.join(root,'dist/data/dataset.json')),true);
  assert.equal(fs.existsSync(path.join(root,'dist/src/.DS_Store')),false);
  assert.equal(fs.existsSync(path.join(root,'dist/assets/._private')),false);
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
