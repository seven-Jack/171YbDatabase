import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ESTIMATE_CONFIG,QUANTUM_DEFECTS,DATASET_VERSION,DATASET_MANIFEST} from '../../src/data/catalog.js';
import {FORMULA_VERSION} from '../../src/physics/constants.js';

const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
const e1=html.slice(html.indexOf('<strong>E1 (电偶极)</strong>'),html.indexOf('<strong>M1 (磁偶极)</strong>'));

test('E1 copy separates rigorous J/parity, LS and the restricted one-electron family',()=>{
  assert.match(e1,/J 与宇称为好量子数/);
  assert.match(e1,/宇称改变；ΔJ=0,±1，禁止 J=0↔0/);
  assert.match(e1,/LS 耦合近似：ΔS=0；ΔL=0,±1，禁止 L=0↔0/);
  assert.match(e1,/单电子近似：Δl=±1/);
  assert.match(e1,/6snl 家族，L=l/);
  assert.match(e1,/不能推广为一般 LS 规则/);
  assert.match(e1,/总 F 与有效矩阵元/);
  assert.match(e1,/physics.nist.gov\/Pubs\/AtSpec\/node17.html/);
});

test('D note preserves the numeric defect while disclaiming unrelated validation',()=>{
  const d2=QUANTUM_DEFECTS.find(row=>row.series==='6snd ³D₂');
  assert.equal(d2.delta0,1.42);
  assert.match(d2.note,/零场偶宇称/);
  assert.match(d2.note,/奇宇称 6snp \/ 6snf/);
  assert.match(d2.note,/并非 D 态零场内禀 p–f 混合/);
  assert.match(d2.note,/原数值出处未独立核验/);
  assert.match(d2.source,/未找到.*171Yb.*原始证据/);
  assert.equal(d2.excludedFromValidatedPrediction,true);
  assert.equal(d2.reviewStatus,'definition-needs-review');
  assert.doesNotMatch(html,/是 ¹⁷¹Yb 特有现象/);
  assert.match(html,/¹D₂ 关联态为主/);
});

test('radius label and footer describe a size estimate after the independent unit gate',()=>{
  assert.match(html,/氢样尺度估计 \(µm\)/);
  assert.match(html,/hydrogenic size-scale estimate/);
  assert.match(html,/0\.179–0\.490 µm/);
  assert.match(html,/65S 为约 0\.310 µm/);
  assert.doesNotMatch(html,/单位问题待校核|轨道半径 0\.3–0\.9/);
  assert.match(html,/不是具体 MQDT 态的径向期望/);
});

test('versions and constant provenance identify the literature audit without a physical-validation upgrade',()=>{
  assert.equal(FORMULA_VERSION,'1.0.1');
  assert.equal(DATASET_VERSION,'2026.10.30.1');
  assert.match(DATASET_MANIFEST.physicalValidation,/not established for all records/);
  assert.match(DATASET_MANIFEST.physicalValidation,/compilation, theory, source conflicts.*internal models/);
  assert.equal(ESTIMATE_CONFIG.reviewStatus,'conflict-unresolved');
  assert.equal(ESTIMATE_CONFIG.evidenceKind,'scaling-estimate');
  assert.equal(ESTIMATE_CONFIG.constantProvenance.A0_UM.sourceVersion,'CODATA 2018');
  assert.match(ESTIMATE_CONFIG.constantProvenance.A0_UM.reviewScope,/unit conversion only/);
});
