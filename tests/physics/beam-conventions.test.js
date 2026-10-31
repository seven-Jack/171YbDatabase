import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_BEAM_DEFINITION,
  validateBeamDefinition,
  getSizeFactor,
  getBeamFactors,
  normalizeBeamInput,
  denormalizeSolvedInput,
} from '../../src/physics/beam-conventions.js';
import { PhysicsInputError } from '../../src/physics/constants.js';
import { rabiHz, powerFromRabiHz, waistFromRabiHz } from '../../src/physics/rabi.js';
import { matrixElement_F_q } from '../../src/physics/angular.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-12 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
const upstreamLinear = Object.freeze({
  powerPlane: 'upstream', transmission: 0.8, powerBasis: 'linear-total',
  linearOrientation: 'perpendicular', sizeKind: 'diameter',
});

test('legacy defaults retain atom-plane component power and intensity radius without mutating inputs', () => {
  assert.ok(Object.isFrozen(DEFAULT_BEAM_DEFINITION));
  const definition = validateBeamDefinition();
  assert.deepEqual(definition, DEFAULT_BEAM_DEFINITION);
  assert.notEqual(definition, DEFAULT_BEAM_DEFINITION);
  const raw = Object.freeze({ power_mW: 1, size_um: 50 });
  assert.deepEqual(normalizeBeamInput(raw), {
    P_mW: 1, w_um: 50,
    factors: { transmission: 1, componentFraction: 1, powerFactor: 1, sizeFactor: 1 },
  });
  assert.deepEqual(raw, { power_mW: 1, size_um: 50 });
});

test('100 µm intensity diameter equals 50 µm radius in the existing Rabi kernel', () => {
  const radius = normalizeBeamInput({ power_mW: 1, size_um: 50 });
  const diameter = normalizeBeamInput({ power_mW: 1, size_um: 100 }, { sizeKind: 'diameter' });
  assert.equal(getSizeFactor({ sizeKind: 'diameter' }), 0.5);
  assert.equal(diameter.w_um, radius.w_um);
  assert.equal(rabiHz(0.1, radius.P_mW, radius.w_um), rabiHz(0.1, diameter.P_mW, diameter.w_um));
  assert.deepEqual(denormalizeSolvedInput({ w_um: 50 }, { sizeKind: 'diameter' }), { size_um: 100 });
});

test('upstream total linear power is converted exactly once into the selected optical component', () => {
  const value = normalizeBeamInput({ power_mW: 1, size_um: 100 }, upstreamLinear, 'sigmap');
  assert.equal(value.P_mW, 0.4);
  assert.equal(value.w_um, 50);
  assert.deepEqual(value.factors, { transmission: 0.8, componentFraction: 0.5, powerFactor: 0.4, sizeFactor: 0.5 });
  assert.deepEqual(denormalizeSolvedInput({ P_mW: 0.4, w_um: 50 }, upstreamLinear, 'sigmap'), { power_mW: 1, size_um: 100 });
  // Once already labelled atom-plane component power, no polarization split applies.
  assert.equal(normalizeBeamInput({ power_mW: 0.4 }, {}, 'sigmap').P_mW, 0.4);
});

test('parallel/perpendicular linear fractions follow the selected q, not mF population', () => {
  const parallel = { powerBasis: 'linear-total', linearOrientation: 'parallel' };
  const perpendicular = { powerBasis: 'linear-total', linearOrientation: 'perpendicular' };
  assert.equal(getBeamFactors(parallel, 'pi').componentFraction, 1);
  assert.equal(getBeamFactors(parallel, 'sigmap').componentFraction, 0);
  assert.equal(getBeamFactors(parallel, 'sigmam').componentFraction, 0);
  assert.equal(getBeamFactors(perpendicular, 'pi').componentFraction, 0);
  assert.equal(getBeamFactors(perpendicular, 'sigmap').componentFraction, 0.5);
  assert.equal(getBeamFactors(perpendicular, 'sigmam').componentFraction, 0.5);
  assert.equal(getBeamFactors({ powerBasis: 'linear-total', linearOrientation: 'manual', manualFraction: 0.3 }, 'sigmam').componentFraction, 0.3);
});

test('manual linear-total fractions enforce the single-sigma 50% boundary without limiting pi to 50%', () => {
  const manual = { powerBasis: 'linear-total', linearOrientation: 'manual', manualFraction: 0.5 };
  for (const pol of ['sigmap', 'sigmam']) {
    assert.equal(getBeamFactors(manual, pol).componentFraction, 0.5);
    assert.equal(normalizeBeamInput({ power_mW: 1 }, manual, pol).P_mW, 0.5);
    assert.equal(denormalizeSolvedInput({ P_mW: 0.5 }, manual, pol).power_mW, 1);
    for (const manualFraction of [0.500001, 0.9, 1]) {
      const invalid = { ...manual, manualFraction };
      const expected = error => error instanceof PhysicsInputError && error.field === 'manualFraction' && /50%/.test(error.message);
      assert.throws(() => getBeamFactors(invalid, pol), expected);
      assert.throws(() => normalizeBeamInput({ power_mW: 1 }, invalid, pol), expected);
      assert.throws(() => denormalizeSolvedInput({ P_mW: 0.5 }, invalid, pol), expected);
      assert.equal(invalid.manualFraction, manualFraction, 'Invalid values are rejected, never clamped.');
    }
  }
  assert.equal(getBeamFactors({ ...manual, manualFraction: 0.9 }, 'pi').componentFraction, 0.9);
  assert.equal(getBeamFactors({ ...manual, manualFraction: 1 }, 'pi').componentFraction, 1);
  assert.equal(getBeamFactors({ ...manual, powerBasis: 'component', manualFraction: 0.9 }, 'sigmap').componentFraction, 1);
});

test('incomplete upstream efficiency and total-polarization definitions are not guessed', () => {
  const incomplete = { powerPlane: 'upstream', powerBasis: 'linear-total' };
  assert.equal(validateBeamDefinition(incomplete).transmission, null);
  assert.throws(() => normalizeBeamInput({ power_mW: 1 }, incomplete, 'pi'), error => error instanceof PhysicsInputError && error.field === 'transmission' && error.code === 'incomplete-input');
  assert.throws(() => normalizeBeamInput({ power_mW: 1 }, { powerBasis: 'linear-total' }), /请选择线偏振/);
  assert.throws(() => normalizeBeamInput({ power_mW: 1 }, { powerBasis: 'linear-total', linearOrientation: 'manual' }), /请填写.*占比/);
});

test('size-only conversions stay available while power metadata is incomplete', () => {
  const incomplete = { powerPlane: 'upstream', powerBasis: 'linear-total', sizeKind: 'diameter' };
  assert.deepEqual(normalizeBeamInput({ size_um: 100 }, incomplete), { w_um: 50, factors: { sizeFactor: 0.5 } });
  assert.deepEqual(denormalizeSolvedInput({ w_um: 50 }, incomplete), { size_um: 100 });
  assert.deepEqual(normalizeBeamInput({ power_mW: undefined, size_um: 100 }, incomplete), { w_um: 50, factors: { sizeFactor: 0.5 } });
});

test('zero forward power is physical, while a zero selected component has no unique inverse power', () => {
  assert.equal(normalizeBeamInput({ power_mW: 0 }).P_mW, 0);
  const noSigma = { powerBasis: 'linear-total', linearOrientation: 'parallel' };
  const forward = normalizeBeamInput({ power_mW: 5 }, noSigma, 'sigmap');
  assert.equal(forward.P_mW, 0);
  assert.equal(rabiHz(0.1, forward.P_mW, 50), 0);
  for (const P_mW of [0, 1]) assert.throws(() => denormalizeSolvedInput({ P_mW }, noSigma, 'sigmap'), /无法反求.*唯一/);
  assert.equal(denormalizeSolvedInput({ P_mW: 0 }, upstreamLinear, 'sigmap').power_mW, 0);
});

test('metadata rejects unsupported definitions, out-of-range fractions and non-finite numbers', () => {
  for (const definition of [null, [], { unknown: 1 }, { powerPlane: 'cell' }, { powerBasis: 'isotropic' }, { sizeKind: 'FWHM' }, { linearOrientation: 'circular' }, { transmission: 0 }, { transmission: 1.1 }, { transmission: NaN }, { transmission: '0.8' }, { manualFraction: -0.1 }, { manualFraction: 1.01 }, { manualFraction: Infinity }]) {
    assert.throws(() => validateBeamDefinition(definition), PhysicsInputError);
  }
  assert.throws(() => getBeamFactors({}, 'sigma'), PhysicsInputError);
  for (const power_mW of [null, -1, NaN, Infinity, '1']) assert.throws(() => normalizeBeamInput({ power_mW }), PhysicsInputError);
  for (const size_um of [null, 0, -1, NaN, Infinity, '50']) assert.throws(() => normalizeBeamInput({ size_um }), PhysicsInputError);
});

test('all three solve directions close after definition normalization and inverse display conversion', () => {
  const d = 0.12;
  const normalized = normalizeBeamInput({ power_mW: 1, size_um: 100 }, upstreamLinear, 'sigmap');
  const targetHz = rabiHz(d, normalized.P_mW, normalized.w_um);
  const power = powerFromRabiHz(d, targetHz, normalized.w_um);
  const waist = waistFromRabiHz(d, targetHz, normalized.P_mW);
  close(denormalizeSolvedInput({ P_mW: power }, upstreamLinear, 'sigmap').power_mW, 1);
  close(denormalizeSolvedInput({ w_um: waist }, upstreamLinear, 'sigmap').size_um, 100);
});

test('T3 linear-power splitting with existing channel matrix elements does not multiply CG again', () => {
  const dF = 9.19e-5;
  const dPi = Math.abs(matrixElement_F_q(0.5, 0.5, 0.5, 0.5, 0, dF));
  const dSigma = Math.abs(matrixElement_F_q(0.5, -0.5, 0.5, 0.5, 1, dF));
  const pi = normalizeBeamInput({ power_mW: 1, size_um: 50 }, { powerBasis: 'linear-total', linearOrientation: 'parallel' }, 'pi');
  const sigma = normalizeBeamInput({ power_mW: 1, size_um: 50 }, { powerBasis: 'linear-total', linearOrientation: 'perpendicular' }, 'sigmap');
  close(rabiHz(dPi, pi.P_mW, pi.w_um), rabiHz(dSigma, sigma.P_mW, sigma.w_um));
});

test('extreme conversions fail rather than emit Infinity or silently underflow a nonzero field', () => {
  assert.throws(() => getBeamFactors({ powerPlane: 'upstream', transmission: Number.MIN_VALUE, powerBasis: 'linear-total', linearOrientation: 'manual', manualFraction: Number.MIN_VALUE }), /数值范围/);
  assert.throws(() => normalizeBeamInput({ size_um: Number.MIN_VALUE }, { sizeKind: 'diameter' }), /数值范围/);
  assert.throws(() => normalizeBeamInput({ power_mW: Number.MIN_VALUE }, { powerPlane: 'upstream', transmission: 0.5 }), /数值范围/);
  assert.throws(() => denormalizeSolvedInput({ P_mW: 1 }, { powerPlane: 'upstream', transmission: Number.MIN_VALUE }), /数值范围/);
  assert.throws(() => denormalizeSolvedInput({ w_um: Number.MAX_VALUE }, { sizeKind: 'diameter' }), /数值范围/);
});
