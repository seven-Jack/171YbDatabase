import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {evidence,reproduce,stateFor} from '../../data/literature/low-state-rabi-validation-2026-10-30/reproduce.mjs';
import {reducedFFromJJ,matrixElement_F_q} from '../../src/physics/angular.js';
import {getQuantity} from '../../src/data/catalog.js';

const result=reproduce();
const near=(a,b,tolerance)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} differs from ${b} by more than ${tolerance}`);
const encloses=(bounds,value)=>assert.ok(bounds[0]<=value&&value<=bounds[1],`${bounds} does not contain ${value}`);

for(const c of evidence.cases) {
  const actual=result.cases.find(row=>row.transitionId===c.transitionId);
  test(`${c.transitionId}: source dipole, explicit polarization and analytical angular factor reproduce the printed Rabi value`,()=>{
    assert.equal(actual.canonicalDipole_ea0,c.dJ_ea0);
    assert.equal(actual.canonicalDipoleUncertainty_ea0,c.dJ_uncertainty_ea0);
    assert.equal(actual.canonicalDipoleSourceId,'ref-01');
    assert.equal(actual.J_lower,c.J_lower);
    assert.equal(actual.J_upper,c.J_upper);
    assert.equal(c.channel.mp-c.channel.m,c.channel.q);
    near(actual.angularFactorSquared,c.angularFactorSquared,1e-15);
    const state=stateFor(c),ch=c.channel;
    const dF=reducedFFromJJ(state.J_upper,state.J_lower,ch.Fp,ch.F,state.dReduced);
    // Source q=0 label conflicts with every explicitly printed stretched pair.
    assert.equal(matrixElement_F_q(ch.F,ch.m,ch.Fp,ch.mp,0,dF),0);
    near(actual.calculatedRabi_MHz,c.rabiOrdinary_MHz,c.rabiOrdinary_uncertainty_MHz);
    assert.equal(actual.withinPublishedUncertainty,true);
    near(actual.I0_W_m2,8e-3/(Math.PI*1e-6),1e-10);
  });
  test(`${c.transitionId}: inverse solutions contain the separately printed source beam within its Rabi precision`,()=>{
    assert.equal(evidence.conventions.waist_um,evidence.conventions.beamDiameter_mm*1000/2);
    encloses(actual.compatiblePowerBounds_mW,evidence.conventions.power_mW);
    encloses(actual.compatibleWaistBounds_um,evidence.conventions.waist_um);
  });
  test(`${c.transitionId}: lifetime/partial-branch and all upper-sublevel angular sums retain the correct degeneracy`,()=>{
    near(actual.lifetimeBranchRoute.partialRate_s_inv,c.branching/(c.lifetime_ns*1e-9),1e-8);
    assert.equal(actual.lifetimeBranchRoute.withinPrintedDipoleUncertainty,true);
    assert.equal(actual.angularSumRule.upperSublevelCount,6);
    near(actual.angularSumRule.expectedDipoleSquared_ea0_2,c.dJ_ea0**2/3,1e-14);
    assert.ok(actual.angularSumRule.maxRelativeError<3e-14);
    if(actual.cyclingIsatRoute)assert.equal(actual.cyclingIsatRoute.withinPublishedRabiUncertainty,true);
    else assert.ok(['T5','T6','T7'].includes(c.transitionId));
  });
}

test('original-source strength checks remain separate from independent experimental Rabi validation',t=>{
  assert.equal(result.sourceHashes.length,3);
  for(const source of result.sourceHashes) {
    assert.equal(source.verified,source.status==='verified');
    assert.equal(source.sha256,source.verified?source.expectedSha256:null);
    assert.equal(source.unchanged,source.verified?true:null);
  }
  const missing=result.sourceHashes.filter(source=>!source.verified);
  if(missing.length)t.diagnostic(`${missing.length} local source PDFs unavailable; original bytes were not verified in this checkout.`);
  assert.equal(result.theoryVerdict,'all-five-published-theory-compatible');
  assert.equal(result.independentExperimentalVerdict,'no-new-complete-matched-P-waist-measured-Rabi-case-established-in-this-review');
  for(const c of result.strengthCrossChecks) {
    assert.equal(c.isDirectMeasuredRabiBenchmark,false);
    assert.equal(c.printedDipoleIntervalsOverlap,true);
  }
  assert.equal(evidence.sources.find(s=>s.id==='beloy-2012').isotope,171);
});

test('507 nm stays unsupported with an unknown E1 dipole, rather than becoming a zero Rabi result',()=>{
  assert.equal(getQuantity('T4','d_num').value,null);
  assert.equal(result.unsupportedCase.canonicalDipole_ea0,null);
  assert.equal(result.unsupportedCase.calculatorStatus,'unsupported');
  assert.equal(result.unsupportedCase.calculatedRabi_MHz,null);
});

test('this audit preserves the main diagram, canonical atomic data, production physics and saved 65S inputs',()=>{
  const root=new URL('../../',import.meta.url);
  const baseline=JSON.parse(fs.readFileSync(new URL('data/literature/low-state-rabi-validation-2026-10-30/protected-hashes.json',root)));
  for(const [path,expected] of Object.entries(baseline)) {
    const hash=createHash('sha256').update(fs.readFileSync(new URL(path,root))).digest('hex');
    assert.equal(hash,expected,path);
  }
});
