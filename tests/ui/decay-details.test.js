import test from 'node:test';
import assert from 'node:assert/strict';
import {DECAY,getDecayRecord} from '../../src/data/decay.js';
import {CATALOG} from '../../src/data/catalog.js';
import {renderDecayDetails,formatDecayBranch,renderDecaySourceMarks,decayEvidenceLabel} from '../../src/ui/decay-details.js';

test('the state card includes all four 3S1 model branches and preserves the weak singlet uncertainty',()=>{
  const html=renderDecayDetails('yb171-6s7s-3s1');
  assert.equal((html.match(/class="diagram-decay-row/g)||[]).length,4);
  for(const value of ['13.0 ± 1.3%','36.0 ± 2.5%','50.8 ± 2.6%','0.21 ± 0.09%']) assert.ok(html.includes(value));
  assert.match(html,/data-decay-lower="yb171-6s6p-1p1" data-decay-value="0.0021"/);
  assert.match(html,/理论/);
  assert.match(html,/电子 J 级/);
  assert.match(html,/完整性|完备/);
  assert.match(html,/1\.0001/);
  assert.match(html,/适用条件与来源/);
  assert.doesNotMatch(html,/<details[^>]+ open|完整实验已验证|独立实验验证通过/);
});

test('unknown branching stays unknown and HFI rates retain units, F, source and independent models',()=>{
  const html=renderDecayDetails('yb171-6s6p-3p2');
  assert.match(html,/F=3\/2 与 F=5\/2/);
  assert.match(html,/data-decay-status="pending"/);
  assert.match(html,/部分衰变率 · 不是分支比/);
  assert.match(html,/0\.0918 s⁻¹/);
  assert.match(html,/0\.1097 s⁻¹/);
  assert.match(html,/Porsev2004 模型/);
  assert.match(html,/Mishra2001 模型/);
  assert.match(html,/F=5\/2.*ΔF=2/);
  assert.doesNotMatch(html,/class="diagram-decay-row/);
  const rydberg=renderDecayDetails('yb171-6s65s-3s1-triplet-connected');
  assert.match(rydberg,/待核查/);
  assert.doesNotMatch(rydberg,/13\.0|36\.0|50\.8|42\(2\)|20\(2\)|data-decay-value=/);
});

test('near-closed estimates, complement expression, measured rate and stable ground are distinct',()=>{
  const p0=renderDecayDetails('yb171-6s6p-3p0');
  assert.match(p0,/≈1（低能模型）/);
  assert.match(p0,/HFI-E1 → ¹S₀ · 实验/);
  assert.match(p0,/0\.0442 ± 0\.0035 s⁻¹/);
  assert.match(p0,/固态 Ne.*修正/);
  assert.match(renderDecayDetails('yb171-6s6p-1p1'),/1 − 6\(4\) × 10⁻⁸/);
  const p1=renderDecayDetails('yb171-6s6p-3p1');
  assert.match(p1,/≈1（主 E1）/);
  assert.match(p1,/待核查/);
  assert.match(p1,/diagram-decay-row is-pending/);
  assert.doesNotMatch(p1,/100\.0|100%/);
  const ground=renderDecayDetails('yb171-6s2-1s0');
  assert.match(ground,/不适用/);
  assert.doesNotMatch(ground,/data-decay-value=/);
  assert.equal(renderDecayDetails('not-a-level'),'');
});

test('decay citations reuse real publication numbers and open public originals',()=>{
  const html=renderDecaySourceMarks(['kroeze-2026-arxiv','porsev-1999-pra','unknown']);
  assert.match(html,/>\[1\]<\/a>/);
  assert.match(html,/>\[19\]<\/a>/);
  assert.match(html,/https:\/\/arxiv\.org/);
  assert.match(html,/10\.1103\/PhysRevA\.60\.2781/);
  assert.equal((html.match(/data-decay-source=/g)||[]).length,2);
  assert.doesNotMatch(html,/unknown|file:\/\/|\/Users\//);
  assert.equal(decayEvidenceLabel('theory','quantified-model'),'理论');
  assert.equal(decayEvidenceLabel('experiment','original-source-checked'),'实验');
  assert.equal(decayEvidenceLabel('pending','pending'),'待核查');
});

test('formatting and rendering do not renormalize adopted values or change existing calculator inputs',()=>{
  const before=JSON.stringify({catalog:CATALOG,decay:DECAY});
  for(const record of DECAY.records) renderDecayDetails(record.levelId);
  assert.equal(formatDecayBranch({value:.0099,uncertainty:.0039,expression:null}),'0.99 ± 0.39%');
  assert.equal(formatDecayBranch({value:null,uncertainty:null,expression:null}),'待核查');
  assert.equal(getDecayRecord('yb171-6s7s-3s1').branches.reduce((sum,b)=>sum+b.value,0),1.0001);
  assert.equal(JSON.stringify({catalog:CATALOG,decay:DECAY}),before);
});
