import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {EVIDENCE, EVIDENCE_VERSION, getEvidenceRecord, getEvidenceSource} from '../../src/data/evidence.js';
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
  assert.equal(getEvidenceRecord('T2'), null);
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
