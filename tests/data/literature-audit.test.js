import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {CATALOG,getQuantity} from '../../src/data/catalog.js';

const readJSON=relative=>JSON.parse(fs.readFileSync(new URL(`../../${relative}`,import.meta.url),'utf8'));
const audit=readJSON('data/literature/audit-2026-10-29/field-audit.json');
const followup=readJSON('data/literature/source-followup-2026-10-30/field-audit.json');
const lowIds=['T1','T2','T3','T4','T5','T6','T7'];
const near=(actual,expected,tolerance,message)=>assert.ok(Math.abs(actual-expected)<=tolerance,
  `${message}: ${actual} vs ${expected}; tolerance ${tolerance}`);
const binaryTolerance=value=>8*Number.EPSILON*Math.max(1,Math.abs(value));
// Half of a printed last decimal place is a rounding bound, not experimental error.
function printedHalfStep(text) {
  const match=String(text).match(/^[-+]?(\d+)(?:\.(\d+))?(?:[Ee]([-+]?\d+))?$/);
  assert.ok(match,`finite decimal expected: ${text}`);
  return .5*10**(Number(match[3]||0)-(match[2]||'').length);
}

test('low-state vacuum wavelengths obey c/nu using exact SI c and reported precision',()=>{
  // Independent dimensional check: c [m/s] / nu [THz] * 1e9 = c*1e-3/nu [nm].
  // This verifies numerical consistency, not the underlying experimental measurements.
  const c=299792458;
  for(const id of lowIds) {
    const wavelength=getQuantity(id,'wavelength_vac_nm');
    const frequency=getQuantity(id,'frequency_THz');
    const expected=c*1e-3/frequency.value;
    const nuRound=printedHalfStep(frequency.conditions.sourceDecimal);
    const propagatedNuRound=c*1e-3*nuRound/(frequency.value*(frequency.value-nuRound));
    const lambdaRound=id==='T7'?0:printedHalfStep(wavelength.conditions.sourceDecimal);
    near(wavelength.value,expected,lambdaRound+propagatedNuRound+binaryTolerance(expected),id);
    assert.equal(wavelength.conditions.isotope,171);
  }
});

test('total radiative lifetimes and rates agree within printed rounding rather than forced equality',()=>{
  // Explicit resolutions of the published rounded central values, in canonical units.
  // The Gamma decimals are scientific notation in the PDF; JSON's 183000000.0 must
  // not be mistaken for a 0.1/s precision. These are not sigma-based tolerances.
  const rounding={T1:[.0005,5e5],T2:[.05,500],T3:[5e7,.0005],
    T4:[5e7,.0005],T5:[.5,5000],T6:[.05,5e5],T7:[.05,5e5]};
  for(const id of lowIds) {
    const tau=getQuantity(id,'lifetime_ns'),gamma=getQuantity(id,'Gamma_per_s_num');
    assert.equal(tau.unit,'ns');assert.equal(gamma.unit,'s^-1');
    const [deltaTauNs,deltaGamma]=rounding[id];
    const bound=(deltaTauNs*gamma.value+tau.value*deltaGamma+deltaTauNs*deltaGamma)*1e-9;
    near(tau.value*1e-9*gamma.value,1,bound+binaryTolerance(1),id);
    if(id==='T4') assert.equal(tau.convention,'inverse-of-statistically-averaged-total-decay-rate; not-F-resolved');
    else assert.match(tau.convention,/total upper-state radiative lifetime/);
    assert.equal(tau.conditions.primaryOriginalsAllRead,id==='T4');
  }
  assert.equal(getQuantity('T4','lifetime_ns').conditions.sourceEvidenceType,'theory-hyperfine-statistical-rate-average');
  assert.match(getQuantity('T4','lifetime_ns').conditions.stateBoundary,/F=3\/2.*F=5\/2/);
});

test('T7 keeps the source wavelength discrepancy instead of making the printed source agree',()=>{
  const q=getQuantity('T7','wavelength_vac_nm');
  assert.equal(q.conditions.sourceDecimal,'770.160284');
  assert.match(q.conditions.sourceConflict,/Table14.*770\.160284/);
  assert.notEqual(q.value,Number(q.conditions.sourceDecimal));
  assert.ok(Math.abs(q.value-Number(q.conditions.sourceDecimal))>printedHalfStep(q.conditions.sourceDecimal));
  const row=audit.records.find(record=>record.path==='transitions/T7/wavelength_vac_nm');
  assert.equal(row.status,'derived-source-conflict');
  assert.match(getQuantity('T7','wavelength_air_nm').conditions.sourceConflict,/retained as reported/);
  // All seven source linewidth rows carry their separate extra-2pi notation conflict.
  for(const id of lowIds) {
    const linewidth=getQuantity(id,'linewidth_frequency_coefficient_Hz');
    // T4 also retains the unresolved F-dependent lifetime definition; the source
    // notation conflict must still be present rather than erased by that status.
    assert.equal(linewidth.reviewStatus,id==='T4'?'definition-needs-review':'conflict-unresolved');
    if(id==='T4') assert.match(linewidth.conditions.stateBoundary,/F=3\/2.*F=5\/2/);
    assert.match(linewidth.conditions.sourceConflict,/2PI_NOTATION_CONFLICT/);
    assert.match(linewidth.convention,/Gamma\/\(2\*pi\)/);
  }
});

test('unsupported oscillator strengths and unresolved internal amplitudes cannot become literature measurements',()=>{
  for(const id of ['T3','T4']) {
    const f=getQuantity(id,'oscillator_strength_f_num');
    assert.equal(f.value,null);assert.equal(f.uncertainty,null);
    assert.equal(f.missingReason,'not-provided-in-cited-source');
  }
  const t4=getQuantity('T4','d_num');
  assert.equal(t4.value,null);assert.equal(t4.convention,'no-E1-data');
  for(const id of ['T3','R2']) {
    const d=getQuantity(id,'d_num');
    assert.equal(d.evidenceKind,'internal-calculation');
    assert.equal(d.reviewStatus,'definition-needs-review');
    assert.equal(d.uncertainty,null);
  }
  assert.equal(getQuantity('T3','d_num').convention,'F-reduced-effective');
  const t2=getQuantity('T2','d_num');
  assert.equal(t2.value,.5398);assert.equal(t2.uncertainty,.0006);
  assert.match(t2.conditions.sourceEvidenceType,/^compilation-derived/);
});

test('historical and followup audits form an exact chain to every current canonical field',()=>{
  const expected=new Map();
  for(const group of ['transitions','levels']) for(const record of CATALOG[group].records)
    for(const [key,quantity] of Object.entries(record.quantities)) expected.set(`${group}/${record.id}/${key}`,quantity);
  for(const [key,state] of Object.entries(CATALOG.hyperfine.states)) expected.set(`hyperfine/${key}`,state);
  expected.set('hyperfine/saved65S',CATALOG.hyperfine.saved65S);
  expected.set('estimates',CATALOG.estimates);
  assert.equal(new Set(audit.records.map(row=>row.path)).size,audit.records.length);
  assert.deepEqual([...audit.records.map(row=>row.path)].sort(),[...expected.keys()].sort());
  const historical={};
  for(const group of ['transitions','levels','hyperfine','estimates'])
    historical[group]=readJSON(`data/literature/source-followup-2026-10-30/baseline/${group}.json`);
  const lookup=(catalog,fieldPath)=>{
    const [group,id,field]=fieldPath.split('/');
    if(group==='transitions'||group==='levels') return catalog[group].records.find(row=>row.id===id).quantities[field];
    if(group==='hyperfine') return id==='saved65S'?catalog.hyperfine.saved65S:catalog.hyperfine.states[id];
    if(group==='estimates') return catalog.estimates;
    throw new Error(`unknown audit path ${fieldPath}`);
  };
  const newest=new Map(followup.records.map(row=>[row.path,row]));
  assert.equal(newest.size,followup.records.length);
  assert.ok(followup.records.length>0);
  for(const row of audit.records) {
    assert.deepEqual(row.new,lookup(historical,row.path),`${row.path}: dated audit must equal next audit baseline`);
    const next=newest.get(row.path);
    if(next) assert.deepEqual(next.old,row.new,`${row.path}: the new record must retain the previous audited value`);
    assert.deepEqual(next?.new||row.new,expected.get(row.path),`${row.path}: composed audit must describe current canonical state`);
    assert.ok(Object.hasOwn(row,'old'),`${row.path}: original value retained`);
    assert.ok(row.reason&&row.status&&row.auditedAt,`${row.path}: missing audit disposition`);
  }
  for(const row of followup.records) assert.ok(expected.has(row.path),`unresolved followup audit path ${row.path}`);
});

test('saved 65S CSV bytes and the historical fixture remain unchanged by literature reconciliation',()=>{
  const hash=relative=>createHash('sha256').update(fs.readFileSync(new URL(`../../${relative}`,import.meta.url))).digest('hex');
  assert.equal(hash('assets/05.21_yb171_65s_hyperfine.csv'),'a52e9100090c78da0914b748a309e798838a4c9c9744c64553cf761a6330d0ec');
  assert.equal(hash('tests/fixtures/catalog-baseline.json'),'e61a7e92bbada125f819329091af149278c9afebbd6ded46b6eb0247d0e1a3d4');
  const saved=CATALOG.hyperfine.saved65S;
  assert.equal(saved.evidenceKind,'internal-calculation');
  assert.equal(saved.reviewStatus,'definition-needs-review');
  assert.equal(saved.conditions.magneticField_G,0);
  // E=0 is now supported by the copied original validation configuration;
  // locating that configuration does not establish new physical validation.
  const original=readJSON('data/literature/rydberg-audit/internal-evidence/05.21_yb171_65s_hyperfine_validation.json');
  assert.equal(original.conditions.electric_field,0);
  assert.equal(saved.conditions.electricField_V_cm,original.conditions.electric_field);
  assert.equal(saved.conditions.magneticField_G,original.conditions.B_G);
  assert.match(saved.physicalValidation,/unestablished/);
});
