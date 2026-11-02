import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {reproduce as conditionalReproduction} from '../../data/literature/offer-clock-conditional-2026-10-30/reproduce.mjs';
import {reproduce as normalizationReproduction} from '../../data/literature/offer-saturation-cg-2026-10-30/reproduce.mjs';
import {reproduce as clockReproduction} from '../../data/literature/clock-rabi-audit-2026-10-30/reproduce.mjs';
import {auditPackages, compareReproductionSnapshot, buildManifest, verifyManifest, writeCurrentOutputs, checkBacklog, refreshManifests} from '../../scripts/literature-audit.mjs';

const root = new URL('../../', import.meta.url);
const read = relative => JSON.parse(fs.readFileSync(new URL(relative, root), 'utf8'));
const conditional = conditionalReproduction(), normalization = normalizationReproduction();

for (const [name, checked] of Object.entries(conditional.engineeringChecks)) {
  test(`Offer conditional calculation: ${name}`, () => assert.equal(checked, true));
}
for (const [name, checked] of Object.entries(normalization.engineeringChecks)) {
  test(`Offer saturation and angular conventions: ${name}`, () => assert.equal(checked, true));
}

test('Offer available power and fit power retain distinct provenance and no experimental pass', () => {
  assert.deepEqual(conditional.powerCases.map(item => item.power_mW), [1070, 338]);
  assert.match(conditional.powerCases[0].powerEvidenceKind, /measured\/available/);
  assert.match(conditional.powerCases[1].powerEvidenceKind, /fitted/);
  assert.equal(conditional.independentExperimentalValidationPassed, false);
  assert.equal(normalization.independentExperimentalValidationPassed, false);
  assert.equal(normalization.exactAuthorNormalizationEstablished, false);
  assert.equal(normalization.authorCGOmissionEstablished, false);
});

for (const [name, current] of [
  ['clock-rabi-audit-2026-10-30', clockReproduction()],
  ['offer-clock-conditional-2026-10-30', conditional],
  ['offer-saturation-cg-2026-10-30', normalization],
]) {
  test(`${name} reproduces the frozen scientific result without depending on local-original availability`, () => {
    const historical = read(`data/literature/${name}/results.json`);
    assert.equal(compareReproductionSnapshot(current, historical).scientificSnapshotMatches, true);
    const absent = structuredClone(current), field = absent.sourceHashes ? 'sourceHashes' : 'sourceBytes';
    absent[field] = absent[field].map(item => ({...item, status: 'unavailable', verified: false,
      sha256: null, unchanged: null, reason: 'Original absent from this fixture.'}));
    const summary = compareReproductionSnapshot(absent, historical);
    assert.equal(summary.originalsVerified, 0);
    assert.equal(summary.originalsUnavailable, absent[field].length);
  });
}

test('scientific drift, source-identity drift and contradictory byte claims fail snapshot checking', () => {
  const historical = read('data/literature/offer-clock-conditional-2026-10-30/results.json');
  const changedNumber = structuredClone(conditional);
  changedNumber.powerCases[0].rabi_Hz *= 1.01;
  assert.throws(() => compareReproductionSnapshot(changedNumber, historical), /differs/);
  const changedSource = structuredClone(conditional);
  changedSource.sourceBytes[0].expectedSha256 = '0'.repeat(64);
  assert.throws(() => compareReproductionSnapshot(changedSource, historical), /fingerprint|identity/);
  const falseClaim = structuredClone(conditional);
  falseClaim.sourceBytes[0] = {...falseClaim.sourceBytes[0], status: 'unavailable', verified: false,
    sha256: falseClaim.sourceBytes[0].expectedSha256, unchanged: true};
  assert.throws(() => compareReproductionSnapshot(falseClaim, historical), /cannot retain/);
});

test('all reproduction CLIs default to checks and preserve historical bytes', () => {
  for (const definition of auditPackages.filter(item => item.name !== 'clock-rabi-crosscheck-search-2026-10-30')) {
    const resultFile = new URL(`${definition.directory}/results.json`, root);
    const before = fs.readFileSync(resultFile);
    const result = spawnSync(process.execPath, [fileURLToPath(new URL(`${definition.directory}/reproduce.mjs`, root))],
      {cwd: fileURLToPath(root), encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).mode, '--check');
    assert.deepEqual(fs.readFileSync(resultFile), before);
  }
});

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'yb-audit-archive-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  fs.mkdirSync(path.join(directory, 'bundle'));
  const bytes = Buffer.from('%PDF-small original fixture\n'), hash = value => createHash('sha256').update(value).digest('hex');
  const current = structuredClone(conditional);
  current.sourceBytes = [{sourceId: 'fixture-source', localPath: 'original.pdf', expectedSha256: hash(bytes),
    status: 'verified', verified: true, sha256: hash(bytes), unchanged: true}];
  fs.writeFileSync(path.join(directory, 'original.pdf'), bytes);
  fs.writeFileSync(path.join(directory, 'bundle', 'results.json'), JSON.stringify(current));
  fs.copyFileSync(new URL('data/literature/offer-clock-conditional-2026-10-30/comparison.csv', root), path.join(directory, 'bundle', 'comparison.csv'));
  const frozenHistoricalFiles = ['results.json', 'comparison.csv'].map(filename => ({path: `bundle/${filename}`,
    sha256: hash(fs.readFileSync(path.join(directory, 'bundle', filename)))}));
  fs.writeFileSync(path.join(directory, 'bundle', 'archive-metadata.json'), JSON.stringify({
    baseCommit: '8203da5ceb9bd0117c091578fb3c070b4281ea03', originalAuditDate: '2026-10-30', frozenHistoricalFiles,
  }));
  fs.writeFileSync(path.join(directory, 'bundle', 'README.md'), 'Fixture evidence boundary.\n');
  fs.writeFileSync(path.join(directory, 'report.md'), 'Fixture audit report.\n');
  return {directory, current, base: pathToFileURL(directory + path.sep), definition: {
    name: 'offer-clock-conditional-2026-10-30', directory: 'bundle', report: 'report.md', companions: [],
  }};
}

test('explicit writes create separate current outputs, include them in the manifest and preserve history', t => {
  const {directory, base, definition, current} = fixture(t), historical = fs.readFileSync(path.join(directory, 'bundle', 'results.json'));
  writeCurrentOutputs(definition, current, base);
  assert.deepEqual(fs.readFileSync(path.join(directory, 'bundle', 'results.json')), historical);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, 'bundle', 'current-results.json'))), current);
  assert.ok(fs.readFileSync(path.join(directory, 'bundle', 'current-comparison.csv'), 'utf8').includes('1070,'));
  const checked = verifyManifest(definition, base);
  assert.equal(checked.status, 'verified');
});

for (const corruption of ['frozen snapshot', 'source bytes', 'scientific result', 'CSV', 'backlog']) {
  test(`manifest and current-output writes validate ${corruption} before changing any output`, async t => {
    const {directory, base, definition, current} = fixture(t);
    const manifestPath = path.join(directory, 'bundle', 'manifest.json'), before = Buffer.from('{"stale":"manifest must remain byte-identical"}\n');
    fs.writeFileSync(manifestPath, before);
    if (corruption === 'frozen snapshot') fs.appendFileSync(path.join(directory, 'bundle', 'results.json'), '\n');
    if (corruption === 'source bytes') fs.writeFileSync(path.join(directory, 'original.pdf'), '%PDF-changed fixture\n');
    if (corruption === 'scientific result') current.powerCases[0].rabi_Hz *= 1.05;
    if (corruption === 'CSV') {
      const csvPath = path.join(directory, 'bundle', 'comparison.csv');
      fs.writeFileSync(csvPath, fs.readFileSync(csvPath, 'utf8').replace('1070,', '1071,'));
      const metadataPath = path.join(directory, 'bundle', 'archive-metadata.json'), metadata = JSON.parse(fs.readFileSync(metadataPath));
      metadata.frozenHistoricalFiles.find(item => item.path.endsWith('/comparison.csv')).sha256 = createHash('sha256').update(fs.readFileSync(csvPath)).digest('hex');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    }
    if (corruption === 'backlog') {
      fs.mkdirSync(path.join(directory, 'references', 'audits'), {recursive: true});
      fs.writeFileSync(path.join(directory, 'references', 'audits', 'literature-backlog-20261031.json'), JSON.stringify({
        items: [{id: 'unproved', category: 'author-parameters', status: 'closed', closureCriteria: ['Get source.'], closingEvidence: []}],
      }));
    }
    const expected = /Frozen historical snapshot|SHA-256 mismatch|Reproduction differs|CSV value differs|lacks evidence/;
    await assert.rejects(() => refreshManifests({base, definitions: [definition], loadReproduction: async () => current}), expected);
    assert.deepEqual(fs.readFileSync(manifestPath), before);
    assert.throws(() => writeCurrentOutputs(definition, current, base), expected);
    assert.deepEqual(fs.readFileSync(manifestPath), before);
    assert.equal(fs.existsSync(path.join(directory, 'bundle', 'current-results.json')), false);
    assert.equal(fs.existsSync(path.join(directory, 'bundle', 'current-comparison.csv')), false);
  });
}

test('a later invalid package cannot refresh an earlier package manifest', async t => {
  const {directory, base, definition, current} = fixture(t);
  fs.cpSync(path.join(directory, 'bundle'), path.join(directory, 'second'), {recursive: true});
  const metadataPath = path.join(directory, 'second', 'archive-metadata.json'), metadata = JSON.parse(fs.readFileSync(metadataPath));
  metadata.frozenHistoricalFiles = metadata.frozenHistoricalFiles.map(item => ({...item, path: item.path.replace(/^bundle\//, 'second/')}));
  fs.writeFileSync(metadataPath, JSON.stringify(metadata));
  const before = Buffer.from('{"stale":"both outputs must be preserved"}\n');
  for (const folder of ['bundle', 'second']) fs.writeFileSync(path.join(directory, folder, 'manifest.json'), before);
  fs.appendFileSync(path.join(directory, 'second', 'results.json'), '\n');
  await assert.rejects(() => refreshManifests({base, definitions: [definition, {...definition, directory: 'second'}],
    loadReproduction: async () => current}), /Frozen historical snapshot/);
  for (const folder of ['bundle', 'second']) assert.deepEqual(fs.readFileSync(path.join(directory, folder, 'manifest.json')), before);
});

test('a stale manifest is refreshed only after all content passes preflight', async t => {
  const {directory, base, definition, current} = fixture(t);
  fs.writeFileSync(path.join(directory, 'bundle', 'manifest.json'), '{"stale":true}\n');
  const checked = await refreshManifests({base, definitions: [definition], loadReproduction: async () => current});
  assert.equal(checked.packages[0].status, 'verified');
  assert.equal(checked.sourceByteChecks.verified, 1);
  assert.equal(verifyManifest(definition, base).status, 'verified');
});

test('manifest checking rejects missing coverage, modified reports and self-hash recursion', t => {
  const {directory, base, definition} = fixture(t), manifest = buildManifest(definition, base);
  assert.ok(!manifest.files.some(item => item.path.endsWith('/manifest.json')));
  fs.writeFileSync(path.join(directory, 'bundle', 'manifest.json'), JSON.stringify(manifest));
  assert.equal(verifyManifest(definition, base).status, 'verified');
  fs.writeFileSync(path.join(directory, 'bundle', 'forgotten.json'), '{}\n');
  assert.throws(() => verifyManifest(definition, base), /incomplete or stale/);
  fs.rmSync(path.join(directory, 'bundle', 'forgotten.json'));
  fs.writeFileSync(path.join(directory, 'report.md'), 'changed\n');
  assert.throws(() => verifyManifest(definition, base), /incomplete or stale/);
});

test('backlog records cannot be closed without evidence or duplicate an existing identity', t => {
  const {base} = fixture(t), item = {id: 'source', category: 'author-parameters', status: 'open',
    closureCriteria: ['Obtain original parameters.'], evidencePaths: ['report.md'], closingEvidence: []};
  assert.deepEqual(checkBacklog({items: [item]}, base), {items: 1, open: 1});
  assert.throws(() => checkBacklog({items: [item, item]}, base), /Duplicate/);
  assert.throws(() => checkBacklog({items: [{...item, status: 'closed'}]}, base), /lacks evidence/);
});
