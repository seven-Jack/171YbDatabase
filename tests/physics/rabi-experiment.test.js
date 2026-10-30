import test from 'node:test';
import assert from 'node:assert/strict';
import {reproduce} from '../../data/literature/rabi-experiment-validation-2026-10-30/reproduce.mjs';

test('the full experimental beam record cannot produce a fabricated Rabi prediction without its own dipole',()=>{
  const result=reproduce();
  assert.equal(result.primaryCase.calculationStatus,'missing-data');
  assert.equal(result.primaryCase.computedRabi_Hz,null);
  assert.equal(result.primaryCase.residual_Hz,null);
  assert.equal(result.primaryCase.measuredRabi_Hz,2.5e6);
  assert.equal(result.overallVerdict,'independent-experimental-validation-not-established');
});

test('the clock operating-point comparison preserves the mismatch and distinguishes a pi-time inference',()=>{
  const actual=reproduce().auxiliaryCase;
  assert.equal(actual.isDirectMeasuredRabiBenchmark,false);
  assert.equal(actual.dipoleEvidence.sourceId,'internal-t3-20260908');
  assert.equal(actual.dipoleEvidence.uncertainty,null);
  assert.ok(Math.abs(actual.nominalPiDerived_Hz-8.333333333333334)<1e-12);
  assert.ok(Math.abs(actual.computedRabi_Hz-13.908642710485921)<1e-11);
  assert.ok(Math.abs(actual.relativeDifference_percent-66.90371252583105)<1e-10);
  assert.equal(actual.verdict,'nominal-operating-point-values-disagree-cause-not-established');
});
