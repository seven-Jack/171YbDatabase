import test from 'node:test';
import assert from 'node:assert/strict';
import {motionDiagnostics} from '../../data/literature/clock-rabi-audit-2026-10-30/motional-diagnostics.mjs';

const near=(actual,expected,tol)=>assert.ok(Math.abs(actual-expected)<=tol,`${actual} vs ${expected}`);

test('axial recoil and harmonic trap conventions keep lattice and probe wavelengths distinct',()=>{
  const d=motionDiagnostics(),p=d.parameters,a=d.axialOscillator;
  near(a.frequency_Hz/(a.latticeRecoil_Hz),2*Math.sqrt(200),1e-12);
  near(a.probeRecoil_Hz/a.latticeRecoil_Hz,(759/578.4195759161624)**2,1e-14);
  near(a.etaSquared,(759/578.4195759161624)**2/(2*Math.sqrt(200)),1e-15);
  assert.equal(p.mass_kg,2.8384645678e-25);
});

test('finite Laguerre sums independently reproduce the analytic thermal signed-amplitude mean',()=>{
  const d=motionDiagnostics();
  for(const c of d.thermalCases) {
    near(c.meanSignedCarrierAmplitudeRatio,c.finiteSum.meanSignedAmplitudeRatio,
      c.finiteSum.omittedThermalProbability+2e-14);
    near(c.bareCouplingTimesMeanCarrierFactor_Hz/d.parameters.rabi_Hz,
      c.meanSignedCarrierAmplitudeRatio,1e-15);
  }
  assert.deepEqual(d.thermalCases.map(c=>c.temperature_uK),[4,7,10]);
  assert.ok(d.thermalCases[0].meanSignedCarrierAmplitudeRatio>d.thermalCases[1].meanSignedCarrierAmplitudeRatio);
  assert.ok(d.thermalCases[1].meanSignedCarrierAmplitudeRatio>d.thermalCases[2].meanSignedCarrierAmplitudeRatio);
});

test('the target thermal mean is inverted as a conditional temperature, without fitting a flopping frequency',()=>{
  const d=motionDiagnostics();
  const required=d.requiredMeanAmplitudeCondition;
  assert.equal(required.feasibleForNonnegativeTemperature,true);
  const atTarget=motionDiagnostics({temperatures_uK:[required.requiredTemperature_uK]});
  near(atTarget.thermalCases[0].meanSignedCarrierAmplitudeRatio,.599,1e-14);
  assert.ok(required.requiredTemperature_uK>10);
  assert.equal(required.requiredKBTemperatureExceedsNominalTrapDepth,true);
  assert.ok(required.requiredMeanHarmonicEnergyOverTrapDepth>1);
  assert.equal(d.axialOscillator.firstHarmonicNAtOrAboveBarrier,7);
  assert.ok(d.thermalCases[1].unboundedHarmonicProbabilityAtOrAboveNominalBarrier>0);
  assert.match(d.boundaries.join(' '),/not the frequency fitted to population flopping/);
  assert.match(d.boundaries.join(' '),/No radial temperature is inferred/);
});

test('reflection and Gaussian geometry bounds retain the necessary mode and cloud conditions',()=>{
  const d=motionDiagnostics();
  assert.equal(d.parameters.axialExtent_mm,.25);
  near(d.reflection.reflectedToIncidentFieldAmplitudeUpperBound,.1,1e-15);
  assert.deepEqual(d.reflection.localFieldAmplitudeRatioBounds,[.9,1.1]);
  near(d.reflection.requiredDestructiveReflectivityForTargetRatio,.160801,1e-15);
  assert.equal(d.reflection.conditional,true);
  assert.match(d.reflection.condition,/same spatial mode\/waist/);
  assert.match(d.reflection.boundary,/No unconditional experimental exclusion/);
  near(d.beamEnvelope.radialEdgeFieldFactor,Math.exp(-(.225**2)),1e-15);
  assert.ok(d.beamEnvelope.onAxisAxialEdgeFieldFactor>.99999);
  assert.ok(d.beamEnvelope.conditionalBoxFieldFactorBounds[0]>.95);
  assert.equal(d.beamEnvelope.conditional,true);
});

test('misalignment sensitivity restores the target mean while leaving radial temperature and angle unmeasured',()=>{
  const d=motionDiagnostics(),s=d.missingParameterMisalignmentSensitivity;
  const depthJ=d.parameters.latticeDepth_Er*d.axialOscillator.latticeRecoil_J;
  const independentRadialNu=Math.sqrt(depthJ/d.parameters.mass_kg)/(Math.PI*45e-6);
  near(s.radialFrequency_Hz,independentRadialNu,1e-10);
  const axialMean=d.thermalCases.find(c=>c.temperature_uK===7).meanSignedCarrierAmplitudeRatio;
  assert.deepEqual(s.cases.map(c=>c.assumedTr_uK),[4,7,10]);
  assert.equal(s.actualTr,null);
  assert.equal(s.actualMisalignment,null);
  for(const c of s.cases) {
    assert.equal(c.TrAssumption,'assumed-not-reported');
    assert.equal(c.actualTr,null);
    assert.equal(c.actualMisalignment,null);
    assert.equal(c.isMathematicallyReachable,true);
    const theta=c.requiredAngle_mrad/1000;
    const forward=Math.exp(-s.axialExponentAz*Math.cos(theta)**2-c.radialExponentAr*Math.sin(theta)**2);
    near(forward,d.parameters.targetMeanAmplitudeRatio,1e-14);
    near(c.forwardMeanSignedCarrierAmplitudeRatio,forward,1e-15);
    near(c.thetaZeroMeanSignedCarrierAmplitudeRatio,axialMean,1e-15);
    assert.ok(c.requiredAngle_mrad>0&&c.requiredAngle_mrad<10);
  }
  // Changing an assumed Tr must not manufacture a measured Tr or change Tz.
  const alternative=motionDiagnostics({assumedRadialTemperatures_uK:[20]}).missingParameterMisalignmentSensitivity;
  assert.equal(alternative.axialTemperature_uK,7);
  assert.equal(alternative.cases[0].actualTr,null);
  assert.match(s.interpretation,/not a measured angle/);
});
