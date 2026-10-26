import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cg, sixJ, reducedFFromJJ, matrixElement_F_q, computeCGChannels, computeDEff, formatCG, getFs } from '../../src/physics/angular.js';

const fixtures = JSON.parse(fs.readFileSync(new URL('../fixtures/angular.json', import.meta.url), 'utf8'));
const baseline = JSON.parse(fs.readFileSync(new URL('../fixtures/physics-baseline.json', import.meta.url), 'utf8'));
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) <= 2e-14 * Math.max(1, Math.abs(expected)), `${message}: ${actual} != ${expected}`);

test('production CG agrees with independently generated exact SymPy fixtures, including forbidden couplings', () => {
  assert.equal(fixtures.metadata.tool, 'SymPy');
  for (const row of fixtures.clebschGordan) close(cg(...row.args), row.value, row.exact + ' ' + row.args.join(','));
});

test('production 6-j and full signed J→F angular factors agree with SymPy', () => {
  for (const row of fixtures.sixJ) close(sixJ(...row.args2j), row.value, row.exact + ' ' + row.args2j.join(','));
  for (const row of fixtures.angularFactors) {
    const dF = reducedFFromJJ(row.Jp, row.J, row.Fp, row.F, 1);
    close(matrixElement_F_q(row.F, row.m, row.Fp, row.mp, row.q, dF), row.value, JSON.stringify(row));
  }
});

test('T2/T3/R2 complete channel sets and signed values preserve the original production baseline', () => {
  for (const saved of baseline.channels) {
    const p = saved.parameters;
    const state = { transition: { id: p.id, multipole: 'E1', hf_induced: Boolean(p.hf) }, J_lower: p.J, J_upper: p.Jp, dReduced: p.d, pol: 'pi', F_lower: 0.5, F_upper: 0.5 };
    const result = computeCGChannels(state);
    assert.equal(result.length, saved.rows.length, saved.transition);
    for (const old of saved.rows) {
      const now = result.find(v => ['F', 'm', 'Fp', 'mp', 'q'].every(k => v[k] === old[k]));
      assert.ok(now, `${saved.transition}: missing channel ${JSON.stringify(old)}`);
      for (const key of ['cgVal', 'matEl', 'angFactor']) close(now[key], old[key], saved.transition + ' ' + key);
    }
  }
});

test('effective F-reduced clock matrix elements do not acquire a second J→F factor', () => {
  const state = { transition: { hf_induced: true, multipole: 'E1' }, J_lower: 0, J_upper: 0, dReduced: 9.19e-5, pol: 'sigmam', F_lower: 0.5, F_upper: 0.5 };
  close(computeDEff(state).dEff, 9.19e-5 / Math.sqrt(3), 'clock sigma channel');
  state.pol = 'pi';
  close(computeDEff(state).dEff, 9.19e-5 / Math.sqrt(6), 'clock pi channel');
  assert.equal(computeCGChannels({ ...state, transition: { multipole: 'E1' } }).length, 0);
});

test('invalid angular input fails explicitly and forbidden channels return exact zero', () => {
  assert.throws(() => cg(0.25, 0, 1, 0, 0.5, 0), /整数或半整数/);
  assert.throws(() => sixJ(0.5, 1, 1, 1, 0, 2), /2j 整数/);
  assert.throws(() => cg(NaN, 0, 1, 0, 1, 0), /有限数值/);
  assert.equal(cg(0.5, 0.5, 1, 1, 0.5, 1.5), 0);
  assert.equal(cg(0.5, 0, 1, 0, 0.5, 0), 0);
  assert.equal(cg(0.5, 0.5, 1, 0, 0.5, -0.5), 0);
  assert.deepEqual(getFs(2), [1.5, 2.5]);
  assert.equal(formatCG(-1 / Math.sqrt(3)), '−√3/3');
});

test('M2 is not silently interpreted as an E1 dipole channel', () => {
  const state = { transition: { multipole: 'M2' }, J_lower: 0, J_upper: 2, dReduced: 1, pol: 'pi', F_lower: 0.5, F_upper: 1.5 };
  assert.deepEqual(computeCGChannels(state), []);
  assert.equal(computeDEff(state).dEff, 0);
});
