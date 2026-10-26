import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import * as data from '../../src/data/catalog.js';

const require=createRequire(import.meta.url);
const {loadCatalog,validateCatalog}=require('../../scripts/validate-data.cjs');
const {exportData,sha256}=require('../../scripts/export-data.cjs');
const root=fileURLToPath(new URL('../../',import.meta.url));
const baseline=JSON.parse(fs.readFileSync(new URL('../fixtures/catalog-baseline.json',import.meta.url),'utf8'));

test('production catalog compatibility values exactly preserve the saved legacy software baseline',()=>{
  for (const key of ['HYPERFINE_DATA','RYDBERG_QC_DATA','CORE_LEVELS','CORE_TRANSITIONS','QUANTUM_DEFECTS','RYDBERG_QC_TRANSITIONS','REFERENCES','R_INF','E_I_CM','E_I_EV','A0_UM','ns_values']) assert.deepEqual(data[key],baseline.expected[key],key);
});

test('all eight homepage paths reference unique canonical levels and transitions',()=>{
  assert.deepEqual(data.CATALOG.transitions.coreTransitionIds,['T1','T2','T3','T4','T5','T6','T7','R2']);
  assert.equal(data.CORE_LEVELS.length,8);
  assert.equal(data.CATALOG.transitions.records.filter(record=>record.id==='R2').length,1);
  assert.equal(new Set(data.CATALOG.levels.records.map(record=>record.id)).size,data.CATALOG.levels.records.length);
  const levels=new Set(data.CATALOG.levels.records.map(record=>record.id));
  for (const transition of data.CATALOG.transitions.records) {
    assert.ok(levels.has(transition.lowerLevelId));assert.ok(levels.has(transition.upperLevelId));
  }
});

test('source distinctions remain field specific and unknown uncertainty does not turn into zero',()=>{
  assert.equal(data.getQuantity('R2','d_num').sourceId,'ref-17');
  assert.equal(data.getQuantity('R2','d_num').evidenceKind,'internal-calculation');
  assert.equal(data.getQuantity('R2','wavelength_vac_nm').evidenceKind,'scaling-estimate');
  assert.equal(data.getQuantity('T2','d_num').sourceId,'internal-t2-calibration');
  assert.equal(data.getQuantity('T3','d_num').convention,'F-reduced-effective');
  assert.equal(data.getQuantity('T4','d_num').value,null);
  assert.ok(data.getQuantity('T4','d_num').missingReason);
  for (const record of data.CATALOG.transitions.records) for (const quantity of Object.values(record.quantities)) {
    assert.equal(quantity.uncertainty,null);
    assert.ok(quantity.uncertaintyNote);
    assert.ok(data.getSourceRecord(quantity.sourceId));
    assert.notEqual(quantity.reviewStatus,'verified');
  }
  assert.equal(data.getQuantity('T2','linewidth_frequency_coefficient_Hz').value,182400);
  assert.equal(data.getQuantity('T2','linewidth_frequency_coefficient_Hz').reviewStatus,'definition-needs-review');
});

test('canonical data and compatibility exports cannot be modified by UI consumers',()=>{
  assert.throws(()=>{data.CORE_TRANSITIONS[0].d_num=123;},TypeError);
  assert.throws(()=>{data.getQuantity('R2','d_num').value=123;},TypeError);
});

test('schema and relational validation reject malformed production data with specific field paths',()=>{
  const checks=[
    [catalog=>catalog.transitions.records.find(row=>row.id==='T2').quantities.d_num.unit='MHz',/transition\.T2\.d_num\.unit/],
    [catalog=>catalog.transitions.records.find(row=>row.id==='T2').quantities.d_num.sourceId='missing-source',/transition\.T2\.d_num\.sourceId/],
    [catalog=>{const q=catalog.transitions.records.find(row=>row.id==='T4').quantities.d_num;delete q.missingReason;},/transition\.T4\.d_num\.missingReason/],
    [catalog=>catalog.transitions.records.push(structuredClone(catalog.transitions.records[0])),/transition\.T1: duplicate ID/],
    [catalog=>catalog.transitions.records[0].upperLevelId='missing-state',/upperLevelId/],
    [catalog=>{catalog.hyperfine.saved65S.csv.rows[0].nu_upper='';},/csv\.rows\[0\]\.nu_upper/],
    [catalog=>{catalog.transitions.records[0].quantities.d_num.evidenceKind='scaling-estimate';},/modelId/]
  ];
  for (const [mutate,message] of checks) {
    const catalog=loadCatalog(root);mutate(catalog);assert.throws(()=>validateCatalog(catalog,root),message);
  }
});

test('generated module, manifest and CSV reflect the actual canonical files',()=>{
  exportData({root,check:true});
  for (const item of data.DATASET_MANIFEST.files) assert.equal(sha256(fs.readFileSync(path.join(root,item.path))),item.sha256,item.path);
  for (const item of data.DATASET_MANIFEST.exports) assert.equal(sha256(fs.readFileSync(path.join(root,item.path))),item.sha256,item.path);
  assert.ok(data.DATASET_MANIFEST.generatedAt);
  assert.equal(data.DATASET_MANIFEST.sourceCommit,baseline.sourceCommit);
});
