import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {DECAY,DECAY_VERSION,getDecayRecord,getDecaySource} from '../../src/data/decay.js';
import {CATALOG,DATASET_VERSION,getQuantity} from '../../src/data/catalog.js';

const require=createRequire(import.meta.url);
const {validateDecay,prepareDecay,exportDecay}=require('../../scripts/decay-data.cjs');
const {build}=require('../../scripts/build.cjs');
const input=JSON.parse(fs.readFileSync(new URL('../../data/decay.json',import.meta.url),'utf8'));
const clone=()=>structuredClone(input);
const level={ground:'yb171-6s2-1s0',p0:'yb171-6s6p-3p0',p1:'yb171-6s6p-3p1',p2:'yb171-6s6p-3p2',d:'yb171-6s5d-3d1',q:'yb171-6s6p-1p1',s:'yb171-6s7s-3s1',rydberg:'yb171-6s65s-3s1-triplet-connected'};

test('decay is independently versioned, immutable and deterministically generated for every core level',()=>{
  assert.deepEqual(validateDecay(input),{valid:true,errors:[]});
  assert.equal(DECAY_VERSION,'2026.11.04.1');
  assert.notEqual(DECAY_VERSION,DATASET_VERSION);
  assert.deepEqual(DECAY,input);
  assert.deepEqual(new Set(DECAY.records.map(r=>r.levelId)),new Set(CATALOG.levels.coreLevelIds));
  assert.throws(()=>{getDecayRecord(level.s).branches[3].value=0;},TypeError);
  assert.throws(()=>{getDecaySource('porsev-1999-pra').title='changed';},TypeError);
  assert.equal(getDecayRecord('missing'),null);
  assert.equal(getDecaySource('missing'),null);
  assert.equal(prepareDecay(input),fs.readFileSync(new URL('../../src/data/generated-decay.js',import.meta.url),'utf8'));
  assert.equal(exportDecay({check:true}).changed,false);
});

test('seven adopted low-state theory branches preserve source values including the weak singlet destination',()=>{
  const d=getDecayRecord(level.d),s=getDecayRecord(level.s);
  assert.deepEqual(d.branches.map(b=>[b.lowerLevelId,b.value,b.uncertainty]),[[level.p0,.638,.027],[level.p1,.352,.027],[level.p2,.0099,.0039]]);
  assert.deepEqual(s.branches.map(b=>[b.lowerLevelId,b.value,b.uncertainty]),[[level.p0,.130,.013],[level.p1,.360,.025],[level.p2,.508,.026],[level.q,.0021,.0009]]);
  for (const r of [d,s]) {
    assert.equal(r.evidenceKind,'theory');
    assert.match(r.boundary,/不证明.*完备/);
    for(const branch of r.branches) {
      assert.equal(branch.mechanism,'E1');assert.equal(branch.evidenceKind,'theory');
      assert.deepEqual(branch.sourceIds,['kroeze-2026-arxiv','porsev-1999-pra']);
      assert.match(branch.sourceLocator,/Table.*PDF p/);
    }
  }
  assert.ok(Math.abs(d.branches.reduce((a,b)=>a+b.value,0)-.9999)<1e-12);
  assert.ok(Math.abs(s.branches.reduce((a,b)=>a+b.value,0)-1.0001)<1e-12);
  assert.notEqual(d.branches.reduce((a,b)=>a+b.value,0),1);
  assert.notEqual(s.branches.reduce((a,b)=>a+b.value,0),1);
  assert.match(s.summary,/0\.21\(9\)%/);
});

test('near-closed states and unknown 65S channels are not encoded as measured perfect branches or zero',()=>{
  for (const id of [level.p0,level.p1]) {
    const record=getDecayRecord(id);
    assert.equal(record.status,'approximate');
    assert.equal(record.branches[0].value,null);
    assert.equal(record.branches[0].uncertainty,null);
    assert.match(record.branches[0].expression,/≈1/);
    assert.ok(record.branches[0].missingReason);
  }
  const p1=getDecayRecord(level.p1);
  assert.equal(p1.branches[1].mechanism,'M1');
  assert.equal(p1.branches[1].value,null);
  assert.equal(p1.branches[1].status,'pending');
  const rydberg=getDecayRecord(level.rydberg);
  assert.equal(rydberg.status,'pending');assert.deepEqual(rydberg.branches,[]);
  assert.match(rydberg.conditions.join(' '),/n、F、mF.*B.*温度/);
  assert.match(rydberg.boundary,/triplet-connected/);
  assert.equal(getDecayRecord(level.ground).status,'not-applicable');
  assert.deepEqual(getDecayRecord(level.ground).branches,[]);
});

test('1P1 keeps its complementary leakage expression and absolute uncertainty instead of rounding to one',()=>{
  const branch=getDecayRecord(level.q).branches[0];
  assert.equal(branch.value,.99999994);assert.equal(branch.uncertainty,4e-8);
  assert.equal(branch.expression,'1 − 6(4) × 10⁻⁸');
  assert.match(getDecayRecord(level.q).summary,/总漏出为 6\(4\) × 10⁻⁸/);
  assert.match(getDecayRecord(level.q).boundary,/先到 ³D₁、³D₂/);
});

test('F-resolved partial rates and environmental conditions cannot masquerade as normalized P2 branches',()=>{
  const p2=getDecayRecord(level.p2);
  assert.equal(p2.status,'pending');assert.deepEqual(p2.branches,[]);
  assert.match(p2.conditions.join(' '),/F=5\/2.*ΔF=2.*M1\/M2/);
  assert.match(p2.boundary,/不同文献模型.*不能拼/);
  assert.equal(p2.rateEvidence[0].upperF,1.5);assert.equal(p2.rateEvidence[0].value,.0918);
  assert.deepEqual(p2.rateEvidence[0].sourceIds,['porsev-2004-pra']);
  assert.equal(p2.rateEvidence[1].value,.1097);
  assert.deepEqual(p2.rateEvidence[1].sourceIds,['mishra-2001-jqsrt']);
  assert.ok(p2.rateEvidence.every(r=>r.unit==='s^-1'&&r.evidenceKind==='theory'));
  const experiment=getDecayRecord(level.p0).rateEvidence[0];
  assert.equal(experiment.value,.0442);assert.equal(experiment.uncertainty,.0035);
  assert.equal(experiment.evidenceKind,'experiment');
  assert.match(experiment.conditions.join(' '),/固态 Ne.*修正.*不是完整分支/);
  assert.match(getDecayRecord(level.p0).summary,/模型近似/);
});

test('all references resolve publicly and decay metadata does not mutate the existing atomic catalog',()=>{
  const before=JSON.stringify(CATALOG),d=getQuantity('T6','d_num').value;
  for (const record of DECAY.records) {
    for (const sourceId of [...record.sourceIds,...record.branches.flatMap(b=>b.sourceIds),...record.rateEvidence.flatMap(r=>r.sourceIds)]) {
      const source=getDecaySource(sourceId);assert.ok(source);
      assert.ok(source.url.startsWith('https://'));assert.ok(source.doi.startsWith('10.'));
      assert.ok(source.locations.length);
    }
  }
  assert.equal(JSON.stringify(CATALOG),before);
  assert.equal(getQuantity('T6','d_num').value,d);
});

test('public whitelist rejects source text, local paths, unsafe links and false experimental branch claims',()=>{
  const mutations=[
    d=>{d.originalPDF='/Users/seven/paper.pdf';},
    d=>{d.sources[0].url='file:///Users/seven/paper.pdf';},
    d=>{d.sources[0].url='https://user:secret@doi.org/test';},
    d=>{d.sources[0].url='http://doi.org/test';},
    d=>{d.sources[0].locations[0]='references/papers/raw.pdf';},
    d=>{d.records[0].conditions[0]='data/literature/raw.txt';},
    d=>{d.records[0].boundary='<script>alert(1)</script>';},
    d=>{d.records[4].branches[0].evidenceKind='experiment';},
    d=>{d.records[4].independentExperimentalValidationPassed=true;},
  ];
  for (const mutate of mutations) {const d=clone();mutate(d);assert.equal(validateDecay(d).valid,false);assert.throws(()=>prepareDecay(d),/Invalid public decay data/);}
});

test('validation rejects invalid probabilities, missing weak branch, duplicates and unresolved or upward final levels',()=>{
  const mutations=[
    d=>{d.records[4].branches[0].value=NaN;},
    d=>{d.records[4].branches[0].value=Infinity;},
    d=>{d.records[4].branches[0].value=-.1;},
    d=>{d.records[4].branches[0].value=1.01;},
    d=>{d.records[4].branches[0].uncertainty=-.1;},
    d=>{d.records[6].branches.pop();},
    d=>{d.records[4].branches[0].lowerLevelId=level.s;},
    d=>{d.records[4].branches[0].lowerLevelId='missing-level';},
    d=>{d.records[4].branches[0].sourceIds=['missing-source'];},
    d=>{d.records[4].branches[1].id=d.records[4].branches[0].id;},
    d=>{d.sources.push({...d.sources[0]});},
    d=>{d.records.push(structuredClone(d.records[0]));},
    d=>{d.records.pop();},
  ];
  for(const mutate of mutations){const d=clone();mutate(d);assert.equal(validateDecay(d).valid,false);}
});

test('validation preserves unknowns, rate units, available F and calendar/version integrity',()=>{
  const mutations=[
    d=>{d.records[1].branches[0].value=1;},
    d=>{d.records[1].branches[0].missingReason=null;},
    d=>{d.records[1].branches[0].uncertainty=0;},
    d=>{d.records[7].status='validated';},
    d=>{d.records[3].rateEvidence[0].unit='1';},
    d=>{d.records[3].rateEvidence[0].upperF=.5;},
    d=>{d.records[3].rateEvidence[0].uncertaintyNote='';},
    d=>{d.decayVersion='latest';},
    d=>{d.reviewedAt='2026-02-31';},
    d=>{d.records[4].branches={};},
    d=>{d.records[4].branches=[null];},
  ];
  for(const mutate of mutations){const d=clone();mutate(d);assert.equal(validateDecay(d).valid,false);}
});

test('build publishes validated decay metadata and refuses stale generated data before clearing the artifact',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'yb171-decay-build-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'data'),{recursive:true});
  fs.mkdirSync(path.join(root,'src/data'),{recursive:true});
  fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({version:'fixture'}));
  fs.writeFileSync(path.join(root,'index.html'),'<html><script type="module" src="src/main.js"></script></html>');
  fs.writeFileSync(path.join(root,'src/main.js'),"export {};\n");
  fs.copyFileSync(new URL('../../data/levels.json',import.meta.url),path.join(root,'data/levels.json'));
  const local=clone();
  fs.writeFileSync(path.join(root,'data/decay.json'),JSON.stringify(local));
  exportDecay({root});
  const first=build(root,{quiet:true});
  assert.ok(first.files.some(f=>f.path==='data/decay.json'));
  assert.ok(first.files.some(f=>f.path==='src/data/generated-decay.js'));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'dist/data/decay.json'),'utf8')),input);
  const manifestBefore=fs.readFileSync(path.join(root,'dist/artifact-manifest.json'),'utf8');
  local.decayVersion='2026.11.04.2';
  fs.writeFileSync(path.join(root,'data/decay.json'),JSON.stringify(local));
  assert.throws(()=>build(root,{quiet:true}),/stale/);
  assert.equal(fs.readFileSync(path.join(root,'dist/artifact-manifest.json'),'utf8'),manifestBefore);
  local.sources[0].localPath='/Users/seven/private.pdf';
  fs.writeFileSync(path.join(root,'data/decay.json'),JSON.stringify(local));
  assert.throws(()=>build(root,{quiet:true}),/Invalid public decay data/);
});
