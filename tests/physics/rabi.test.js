import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { rabiHz, spRabi, singlePhotonRabiSI, powerFromRabiHz, waistFromRabiHz, dCycFromGamma, dipoleFromDecayRate, calculateRabi } from '../../src/physics/rabi.js';
import { EA0 } from '../../src/physics/constants.js';
import { toSI, fromSI, convert, powerFromDisplay, powerToDisplay, rabiFromDisplay, rabiToDisplay } from '../../src/physics/units.js';
const baseline = JSON.parse(fs.readFileSync(new URL('../fixtures/physics-baseline.json', import.meta.url), 'utf8'));
const close = (a, b) => assert.ok(Math.abs(a - b) <= 3e-14 * Math.max(1, Math.abs(b)), `${a} != ${b}`);

test('Rabi values preserve old production outputs using the shared function', () => {
  for (const { args, result } of baseline.rabi) {
    const actual = spRabi(...args);
    for (const key of ['I0', 'E0', 'fR']) close(actual[key], result[key]);
    if (result.tPi === null) assert.equal(actual.tPi, Infinity);
    else close(actual.tPi, result.tPi);
    close(rabiHz(...args), result.fR);
  }
  for (const { args, value } of baseline.linewidthDipole) close(dCycFromGamma(...args), value);
});

test('Gaussian Rabi obeys independent power/waist scaling properties', () => {
  const f = rabiHz(0.123, 1.5, 60);
  close(rabiHz(0.123, 6, 60), 2 * f);
  close(rabiHz(0.123, 1.5, 120), f / 2);
  close(rabiHz(0.246, 1.5, 60), 2 * f);
  assert.equal(rabiHz(0.123, 0, 60), 0);
});

test('Rabi inverses close over valid input domain', () => {
  for (const d of [5.31e-5, 0.0376, 0.543]) for (const p of [0.001, 1, 100]) for (const w of [5, 50, 200]) {
    const f = rabiHz(d, p, w);
    close(powerFromRabiHz(d, f, w), p);
    close(waistFromRabiHz(d, f, p), w);
  }
});

test('SI and display-unit conversions have the same physical input', () => {
  close(singlePhotonRabiSI(0.543 * EA0, toSI(1, 'power', 'mW'), toSI(50, 'length', 'µm')).fR, rabiHz(0.543, 1, 50));
  close(convert(1, 'power', 'mW', 'W'), 0.001);
  close(convert(50, 'length', 'µm', 'mm'), 0.05);
  close(powerFromDisplay(powerToDisplay(1.7, 'µW'), 'µW'), 1.7);
  close(rabiFromDisplay(rabiToDisplay(1.2, 'kHz'), 'kHz'), 1.2);
  close(fromSI(toSI(0.6, 'frequency', 'MHz'), 'frequency', 'MHz'), 0.6);
  assert.throws(() => toSI(1, 'power', 'invalid'), /不支持/);
});

test('invalid and missing inputs do not yield apparently valid new outputs', () => {
  for (const bad of [-1, NaN, Infinity, '', null]) assert.throws(() => rabiHz(.543, bad, 50));
  for (const bad of [0, -1, NaN, Infinity, '', null]) assert.throws(() => rabiHz(.543, 1, bad));
  assert.throws(() => powerFromRabiHz(0, 1e6, 50));
  assert.throws(() => waistFromRabiHz(.543, 0, 1));
  assert.throws(() => rabiHz(.543, 1e308, 50), /有限范围/);
  assert.equal(calculateRabi({ dEff_ea0: null, P_mW: 1, w_um: 50 }).status, 'missing-data');
  assert.equal(calculateRabi({ dEff_ea0: 0, P_mW: 1, w_um: 50 }).status, 'forbidden');
  assert.equal(calculateRabi({ dEff_ea0: 1, multipole: 'M2', P_mW: 1, w_um: 50 }).status, 'unsupported');
  assert.equal(calculateRabi({ dEff_ea0: .543, P_mW: -1, w_um: 50 }).status, 'invalid-input');
  assert.equal(calculateRabi({ dEff_ea0: '.543', P_mW: 1, w_um: 50 }).status, 'invalid-input');
});

test('linewidth API states its 2π convention without changing the retained inference', () => {
  close(dCycFromGamma(182400, 555.8007), dipoleFromDecayRate(182400 * 2 * Math.PI, 555.8007));
});
