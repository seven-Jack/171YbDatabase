import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calcRydberg, generateRydbergStates, buildRydbergTransitions, ESTIMATE_MODEL } from '../../src/physics/estimates.js';
const baseline = JSON.parse(fs.readFileSync(new URL('../fixtures/physics-baseline.json', import.meta.url), 'utf8'));

test('legacy illustrative estimates retain the existing formatting and numbers', () => {
  for (const row of baseline.estimates) assert.deepEqual(calcRydberg(...row.args), row.result);
  const values = generateRydbergStates();
  assert.deepEqual(values, baseline.allEstimates);
  assert.equal(values.length, 21);
  assert.equal(values.filter(v => v.series === '6snd ³D₁').length, 7);
  assert.match(ESTIMATE_MODEL.scope, /not state-resolved MQDT/);
});

test('estimate generator uses injected legacy constants and never manufactures a measured-data status', () => {
  const values = generateRydbergStates({ ns_values: [65] });
  assert.equal(values.length, 3);
  assert.ok(values.every(v => v.source.startsWith('理论估算')));
  const changed = generateRydbergStates({ ns_values: [65], constants: { E_I_CM: 60000 } });
  assert.notEqual(changed[0].energy_cm, values[0].energy_cm);
  assert.throws(() => calcRydberg(2, 2.523), /大于零/);
});

test('Rydberg transition view-model preserves existing labels and multipole meaning', () => {
  assert.deepEqual(buildRydbergTransitions(baseline.rydbergTransitions.input), baseline.rydbergTransitions.output);
  const rows = buildRydbergTransitions([{ id: 'R2', lower: '³P₀', upper: '65³S₁', classification: '强', multipole: 'E1', selection_check: 'example' }, { id: 'R5', upper: '65³D₂', classification: '禁戒', multipole: 'E1 禁戒' }]);
  assert.equal(rows[0].upper_full, '6s65s ³S₁');
  assert.equal(rows[0].n, 65);
  assert.equal(rows[0].rab_freq, '2π × 1–10 MHz');
  assert.equal(rows[1].classification, '禁戒');
});
