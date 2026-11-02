import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evidence,reproduce,clockRateFromDF} from '../../data/literature/clock-rabi-audit-2026-10-30/reproduce.mjs';
import {dipoleFromDecayRate} from '../../src/physics/rabi.js';
import {getQuantity} from '../../src/data/catalog.js';

const actual=reproduce();
const near=(a,b,t)=>assert.ok(Math.abs(a-b)<=t,`${a} vs ${b}, tolerance ${t}`);
const root=new URL('../../',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));

test('the rechecked source fixes the clock beam radius, pi polarization and pulse-time meaning',()=>{
  const source=read('data/literature/clock-rabi-audit-2026-10-30/pizzocaro-source-check.json');
  const field=name=>source.parameterRecords.find(row=>row.field===name);
  assert.equal(field('probe_waist_radius').value,200);
  assert.equal(field('probe_incident_power').value,70);
  assert.equal(field('nominal_pi_pulse_duration').value,60);
  assert.equal(field('selected_channel_q').value,0);
  assert.equal(field('nominal_pi_power_fraction').value,1);
  assert.equal(field('figure5_sideband_pulse_duration').value,80);
  assert.equal(field('figure5_lattice_depth').value,284);
  assert.equal(evidence.experiment.lattice.radialTemperature_uK,null);
  assert.equal(evidence.experiment.directFittedRabi_Hz,null);
});

test('the F-reduced clock channel factors and fixed-upper-state emission sums have no extra J or CG factor',()=>{
  near(actual.current.dPi_ea0,9.19e-5/Math.sqrt(6),2e-20);
  near(actual.current.dSigma_ea0,9.19e-5/Math.sqrt(3),2e-20);
  assert.equal(actual.current.allChannelCount,4);
  assert.equal(actual.current.fixedUpperSublevelDipoleSums_ea0_2.length,2);
  for(const row of actual.current.fixedUpperSublevelDipoleSums_ea0_2)
    near(row.value,9.19e-5**2/2,2e-24);
  near(actual.current.dPi_ea0**2+actual.current.dSigma_ea0**2,9.19e-5**2/2,2e-24);
});

test('Xu2014 free-atom HFQ rate independently supports the unchanged rounded clock dipole',()=>{
  const xu=actual.independentStrengthComparisons.find(c=>c.id==='xu2014');
  assert.equal(xu.workingRate_s_inv,.0442);
  assert.equal(xu.rateUncertainty_s_inv,.0035);
  // Printed diagnostic digits, not extra physical precision for the measured rate.
  near(xu.dF_ea0,9.188768e-5,5e-12);
  near(clockRateFromDF(xu.dF_ea0,578.4195759161624),.0442,1e-16);
  assert.equal(xu.currentDipoleWithinRateDerivedUncertainty,true);
  assert.ok(Math.abs(xu.currentDipoleRelativeDifference_percent)<.014);
  near(xu.rabiDipoleOnlyUncertainty_Hz/xu.beamCentreRabi_Hz,.0035/(2*.0442),2e-16);
  assert.equal(xu.isIndependentMeasuredRabi,false);
});

test('decay-normalized dipole is neither the F-reduced nor the fixed pi matrix element',()=>{
  const norm=dipoleFromDecayRate(.0442,578.4195759161624);
  const xu=actual.independentStrengthComparisons.find(c=>c.id==='xu2014');
  near(xu.dF_ea0,Math.sqrt(2)*norm,1e-20);
  near(xu.dPi_ea0,norm/Math.sqrt(3),1e-20);
  near(actual.current.impliedFreeAtomRate_s_inv,.0442118532,5e-11);
});

test('the bare beam-centre prediction and nominal pi-time discrepancy stay explicit',()=>{
  near(actual.current.I0_W_m2,2*70e-9/(Math.PI*(200e-6)**2),1e-14);
  near(actual.current.rabi_Hz,13.908642710485921,1e-12);
  near(actual.current.piTime_ms,35.94887081419116,1e-11);
  near(actual.experiment.nominalPiDerivedRabi_Hz,1/.120,1e-14);
  near(actual.experiment.relativeDifference_percent,66.90371252583105,1e-11);
  assert.equal(actual.experiment.directlyFittedRabi_Hz,null);
});

test('counterfactual power, waist and dipole are diagnostics and are never adopted as source data',()=>{
  const c=actual.requiredSingleParameterChanges;
  assert.equal(c.adopted,false);
  near(c.requiredPower_nW,25.128469971410656,1e-10);
  near(c.requiredWaistRadius_um,333.8074250516621,1e-10);
  near(c.requiredFreeAtomLifetime_s,63.00764894147271,1e-10);
  assert.equal(evidence.experiment.power_nW,70);
  assert.equal(evidence.experiment.waistRadius_um,200);
  assert.equal(getQuantity('T3','d_num').value,9.19e-5);
  assert.equal(getQuantity('T3','d_num').sourceId,'internal-t3-20260908');
});

test('conditional axial and missing-radial diagnostics cannot be promoted to an observed Rabi frequency',()=>{
  const d=actual.conditionalMotion;
  assert.equal(d.parameters.axialExtent_mm,.25);
  near(d.requiredMeanAmplitudeCondition.targetRatio,actual.experiment.nominalOverBareAmplitudeRatio,1e-16);
  assert.ok(d.thermalCases.every(c=>c.bareCouplingTimesMeanCarrierFactor_Hz>11));
  assert.equal(d.requiredMeanAmplitudeCondition.requiredKBTemperatureExceedsNominalTrapDepth,true);
  assert.equal(d.missingParameterMisalignmentSensitivity.actualTr,null);
  assert.equal(d.missingParameterMisalignmentSensitivity.actualMisalignment,null);
  assert.equal(d.reflection.conditional,true);
  assert.equal(evidence.conclusion.uniquePhysicalCauseEstablished,false);
  assert.equal(evidence.conclusion.uniquePhysicalCause,null);
  assert.equal(evidence.conclusion.independentAbsoluteRabiValidationPassed,false);
});

test('new original sources are indexed while original-byte availability remains explicit in clean checkouts',()=>{
  const index=read('references/index.json');
  const expected=['pizzocaro-2017-metrologia','xu-2014-prl','siegel-2024-prl','blatt-2009-pra'];
  for(const id of expected)assert.ok(index.sources.some(s=>s.id===id),id);
  assert.equal(actual.sourceHashes.length,6);
  for(const source of actual.sourceHashes) {
    assert.match(source.expectedSha256,/^[a-f0-9]{64}$/);
    assert.ok(['verified','unavailable'].includes(source.status));
    assert.equal(source.verified,source.status==='verified');
    if(source.status==='unavailable')assert.equal(source.sha256,null);
  }
  assert.equal(actual.preserved.mainDiagram,true);
  assert.equal(actual.preserved.canonicalAtomicData,true);
});
