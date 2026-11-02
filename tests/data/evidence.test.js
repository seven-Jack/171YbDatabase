import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {EVIDENCE, EVIDENCE_VERSION, getEvidenceRecord, getEvidenceSource, getEvidenceComparison} from '../../src/data/evidence.js';
import {getQuantity} from '../../src/data/catalog.js';

const require = createRequire(import.meta.url);
const {validateEvidence, prepareEvidence, exportEvidence} = require('../../scripts/evidence-data.cjs');
const input = JSON.parse(fs.readFileSync(new URL('../../data/evidence.json', import.meta.url), 'utf8'));
const clone = () => structuredClone(input);

test('public evidence is independently versioned, frozen and generated reproducibly', () => {
  assert.deepEqual(validateEvidence(input), {valid:true, errors:[]});
  assert.equal(EVIDENCE_VERSION, input.evidenceVersion);
  assert.notEqual(EVIDENCE_VERSION, '2026.10.30.1');
  assert.deepEqual(EVIDENCE, input);
  assert.throws(() => { EVIDENCE.records[0].primarySourceId = 'xu-2014-prl'; }, TypeError);
  assert.equal(exportEvidence({check:true}).changed, false);
  assert.equal(prepareEvidence(input), fs.readFileSync(new URL('../../src/data/generated-evidence.js', import.meta.url), 'utf8'));
});

test('source metadata distinguishes independent rate support, fitted power and model-derived frequency', () => {
  const record = getEvidenceRecord('T3');
  assert.equal(record.primarySourceId, 'internal-t3-20260908');
  assert.equal(getQuantity('T3', 'd_num').sourceId, record.primarySourceId);
  assert.equal(record.atomicSupport.quantities[0].value, 0.0442);
  assert.equal(record.atomicSupport.quantities[1].value, 0.0035);
  assert.equal(record.atomicSupport.quantities[2].value, 9.188767997673872e-5);
  assert.match(record.atomicSupport.summary, /固 Ne.*修正/);
  const comparison = EVIDENCE.comparisons[0];
  assert.equal(comparison.status, 'conditional');
  assert.deepEqual(comparison.rows.map(row => [row.power_mW, row.powerKind]), [[1070,'reported-measured-available'],[338,'fitted-effective']]);
  assert.equal(comparison.reference.evidenceKind, 'model-fitted-coupling');
  assert.equal(comparison.rows[0].rabi_kHz, 21.75141984154124);
  assert.equal(comparison.rows[1].rabi_kHz, 12.22514650683658);
  assert.match(comparison.normalizationNote, /21 s.*21.975.*候选重建/);
  assert.ok(record.sourceIds.every(id => getEvidenceSource(id)?.url.startsWith('https://')));
  assert.equal(getEvidenceRecord('R2'), null);
});

test('strict public field whitelist rejects local files, originals and false validation metadata', () => {
  const mutations = [
    data => { data.localPath = '/Users/user/paper.pdf'; },
    data => { data.records[0].pdfText = 'original'; },
    data => { data.sources[0].url = 'file:///Users/user/paper.pdf'; },
    data => { data.sources[0].url = 'http://doi.org/10.1103/test'; },
    data => { data.sources[0].url = 'https://user:password@doi.org/test'; },
    data => { data.sources[0].locations[0] = 'references/papers/original.pdf'; },
    data => { data.records[0].atomicSupport.boundary = 'data/literature/raw.json'; },
    data => { data.records[0].summary = '<script>alert(1)</script>'; },
    data => { data.comparisons[0].status = 'validated'; },
    data => { data.comparisons[0].independentExperimentalValidationPassed = true; },
    data => { data.comparisons[0].reference.evidenceKind = 'independent-measurement'; },
  ];
  for (const mutate of mutations) {
    const data = clone(); mutate(data);
    assert.equal(validateEvidence(data).valid, false);
    assert.throws(() => prepareEvidence(data), /Invalid public evidence/);
  }
});

test('public schema rejects nonfinite data, unknown sources, duplicate identities and malformed versions', () => {
  for (const mutate of [
    data => { data.records[0].appliesTo.datasetHash = 'not-a-hash'; },
    data => { data.evidenceVersion = 'latest'; },
    data => { data.reviewedAt = '2026-02-31'; },
    data => { data.comparisons[0].rows[0].rabi_kHz = Infinity; },
    data => { data.records[0].sourceIds = ['missing']; },
    data => { data.records[0].comparisonIds = ['missing']; },
    data => { data.sources.push(data.sources[0]); },
    data => { delete data.records[0].atomicSupport; },
  ]) {
    const data = clone(); mutate(data); assert.equal(validateEvidence(data).valid, false);
  }
});

test('evidence export changes only its generated module and check mode detects stale output', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yb-evidence-'));
  try {
    fs.mkdirSync(path.join(root, 'data'));
    fs.writeFileSync(path.join(root, 'data/evidence.json'), JSON.stringify(input));
    fs.writeFileSync(path.join(root, 'data/dataset.json'), 'protected manifest');
    fs.mkdirSync(path.join(root, 'src/data'), {recursive:true});
    fs.writeFileSync(path.join(root, 'src/data/generated-catalog.js'), 'protected atomic data');
    assert.throws(() => exportEvidence({root,check:true}), /stale/);
    assert.equal(exportEvidence({root}).changed, true);
    assert.equal(exportEvidence({root,check:true}).changed, false);
    fs.appendFileSync(path.join(root, 'src/data/generated-evidence.js'), '\n');
    assert.throws(() => exportEvidence({root,check:true}), /stale/);
    assert.equal(fs.readFileSync(path.join(root, 'data/dataset.json'), 'utf8'), 'protected manifest');
    assert.equal(fs.readFileSync(path.join(root, 'src/data/generated-catalog.js'), 'utf8'), 'protected atomic data');
  } finally { fs.rmSync(root, {recursive:true,force:true}); }
});


const lowStateIds = ['T1','T2','T5','T6','T7'];
const archived = JSON.parse(fs.readFileSync(new URL('../../data/literature/low-state-rabi-validation-2026-10-30/results.json', import.meta.url), 'utf8'));

test('all five public theory benchmarks preserve archived values, exact channels and adopted source identity', () => {
  assert.equal(input.schemaVersion, 2);
  for (const id of lowStateIds) {
    const record = getEvidenceRecord(id), previous = archived.cases.find(item => item.transitionId === id);
    assert.ok(record, id);
    assert.equal(record.primarySourceId, getQuantity(id, 'd_num').sourceId);
    assert.equal(record.appliesTo.dipole_ea0, getQuantity(id, 'd_num').value);
    assert.equal(record.appliesTo.convention, 'J-reduced');
    assert.deepEqual(record.appliesTo.channels, [previous.channel]);
    const comparison = getEvidenceComparison(record.comparisonIds[0]);
    assert.equal(comparison.kind, 'theory-benchmark');
    assert.equal(comparison.status, 'theory-compatible');
    assert.deepEqual(comparison.channel, previous.channel);
    for (const key of ['power_mW','waist_um','calculatedRabi_MHz','publishedRabi_MHz','publishedRabiUncertainty_MHz']) assert.equal(comparison[key], previous[key], `${id}.${key}`);
    assert.match(record.experimentDetail, /未|缺|尚/);
    assert.match(comparison.boundary, /不|未|非/);
    assert.ok(comparison.sourceIds.every(sourceId => record.sourceIds.includes(sourceId)));
  }
});

test('schema 1 clock-only evidence stays supported without inferred theory or experimental claims', () => {
  const legacy = clone();
  legacy.schemaVersion = 1;
  legacy.records = legacy.records.filter(item => item.transitionId === 'T3');
  const referencedIds = legacy.records[0].comparisonIds;
  legacy.comparisons = legacy.comparisons.filter(item => referencedIds.includes(item.id));
  delete legacy.comparisons[0].kind;
  assert.deepEqual(validateEvidence(legacy), {valid:true, errors:[]});
});

test('theory schema rejects false claims, invalid quantum channels and an inapplicable benchmark', () => {
  const mutations = [
    (record, comparison) => { comparison.status = 'validated'; },
    (record, comparison) => { comparison.kind = 'independent-experiment'; },
    (record, comparison) => { comparison.power_mW = 0; },
    (record, comparison) => { comparison.waist_um = -1; },
    (record, comparison) => { comparison.publishedRabiUncertainty_MHz = NaN; },
    (record, comparison) => { comparison.calculatedRabi_MHz = comparison.publishedRabi_MHz + 100; },
    (record, comparison) => { comparison.channel.m = .25; },
    (record, comparison) => { comparison.channel.mp = 2.5; },
    (record, comparison) => { comparison.channel.q = 0; },
    (record, comparison) => { comparison.channel.F = -.5; },
    (record, comparison) => { comparison.channel.Fp = 1.25; },
    (record, comparison) => { record.appliesTo.channels = []; },
    (record, comparison) => { delete record.appliesTo.channels; },
    (record, comparison) => { record.appliesTo.channels[0].m = -.5; },
    (record, comparison) => { record.appliesTo.dipole_ea0 = 0; },
    (record, comparison) => { record.appliesTo.q = [0]; },
    (record, comparison) => { record.appliesTo.convention = 'unreduced'; },
    (record, comparison) => { record.sourceIds = []; },
  ];
  for (const mutate of mutations) {
    const data = clone(), record = data.records.find(item => item.transitionId === 'T1');
    const comparison = data.comparisons.find(item => item.id === record.comparisonIds[0]);
    mutate(record, comparison);
    assert.equal(validateEvidence(data).valid, false, mutate.toString());
    assert.throws(() => prepareEvidence(data), /Invalid public evidence/);
  }
});
