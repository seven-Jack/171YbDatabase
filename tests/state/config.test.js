import test from 'node:test';
import assert from 'node:assert/strict';
import { CORE_TRANSITIONS, CORE_LEVELS, DATASET_VERSION, DATASET_MANIFEST } from '../../src/data/catalog.js';
import { computeCGChannels, computeDEff } from '../../src/physics/angular.js';
import { rabiHz, waistFromRabiHz } from '../../src/physics/rabi.js';
import { exportCalculationConfig, parseCalculationConfig, validateCalculationConfig, ConfigurationError, CONFIG_SCHEMA_VERSION } from '../../src/state/config.js';

const versions = { softwareVersion: '0.2.0', appCommit: '2e2e9d5', datasetVersion: DATASET_VERSION, datasetHash: DATASET_MANIFEST.contentHash, formulaVersion: '1.0.0' };
function stateFor(id = 'T2', pol = 'pi') {
  const transition = CORE_TRANSITIONS.find(t => t.id === id);
  return { transition, J_lower: CORE_LEVELS.find(l => l.term === transition.lower).J, J_upper: CORE_LEVELS.find(l => l.term === transition.upper).J, dReduced: transition.d_num ?? 0,
    F_lower: 0.5, F_upper: id === 'T4' ? 1.5 : 0.5, diagF_lower: 'all', diagF_upper: 'all', pol, P_mW: 1, w_um: 50, fR_MHz: 1.2, powerUnit: 'mW', rabiUnit: 'MHz', calcMode: 'power', selectedChannel: null };
}
const close = (a, b) => assert.ok(Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(b)), `${a} != ${b}`);

test('T2/T3/R2 configuration JSON round trips selection, SI values and current-model result', () => {
  for (const id of ['T2', 'T3', 'R2']) {
    const state = stateFor(id, 'sigmam');
    state.selectedChannel = computeCGChannels(state).find(ch => ch.F === state.F_lower && ch.Fp === state.F_upper && ch.q === -1);
    const config = exportCalculationConfig(state, versions);
    assert.equal(config.schemaVersion, CONFIG_SCHEMA_VERSION);
    close(config.parameters.power_W, .001);
    close(config.parameters.waist_m, 50e-6);
    assert.deepEqual(Object.keys(config.selection.channel).sort(), ['F', 'Fp', 'm', 'mp', 'q']);
    const parsed = parseCalculationConfig(JSON.stringify(config), versions);
    assert.equal(parsed.warnings.length, 0);
    assert.equal(parsed.transition.id, id);
    assert.equal(parsed.state.pol, state.pol);
    close(parsed.state.P_mW, state.P_mW);
    close(parsed.state.w_um, state.w_um);
    close(parsed.state.dEff, computeDEff(state).dEff);
    close(parsed.result.fR, rabiHz(parsed.state.dEff, 1, 50));
  }
});

test('imports do not trust a forged stored result or atomic matrix element', () => {
  const config = exportCalculationConfig(stateFor('T3', 'sigmam'), versions);
  config.matrixElement.reduced_ea0 = 9;
  config.result.frequency_Hz = 1e30;
  const parsed = parseCalculationConfig(config, versions);
  close(parsed.state.dReduced, 9.19e-5);
  close(parsed.result.fR, rabiHz(9.19e-5 / Math.sqrt(3), 1, 50));
  assert.ok(parsed.warnings.some(w => w.includes('矩阵元')));
  assert.ok(parsed.warnings.some(w => w.includes('保存结果')));
});

test('version/hash mismatches return visible warnings while recomputing the current model', () => {
  const config = exportCalculationConfig(stateFor(), versions);
  config.datasetVersion = 'old-data'; config.datasetHash = '0'.repeat(64); config.formulaVersion = 'old-formula';
  const parsed = parseCalculationConfig(config, versions);
  assert.equal(parsed.warnings.length, 3);
  assert.ok(parsed.warnings.some(w => w.includes('数据摘要不同')));
  assert.equal(parsed.result.status, 'ok');
});

test('rejects malformed, out-of-domain, unknown and inconsistent imported selections', () => {
  const edits = [
    c => { c.schemaVersion = 3; }, c => { c.transitionId = 'UNKNOWN'; },
    c => { c.parameters.power_W = -1; }, c => { c.parameters.waist_m = 0; },
    c => { c.parameters.power_W = NaN; }, c => { c.parameters.targetRabi_Hz = Infinity; },
    c => { c.parameters.power_W = '0.001'; }, c => { c.selection.F_upper = 99; },
    c => { c.selection.channel = { F: .5, m: .5, Fp: .5, mp: 1.5, q: 0 }; },
    c => { c.selection.channel = { F: .5, m: .5, Fp: .5, mp: .5, q: 0, matEl: 100 }; },
    c => { c.selection.pol = 'sigma'; }, c => { c.datasetHash = 'bad'; },
  ];
  for (const edit of edits) {
    const config = exportCalculationConfig(stateFor(), versions); edit(config);
    const result = validateCalculationConfig(config, versions);
    assert.equal(result.valid, false, JSON.stringify(config));
    assert.ok(result.errors[0].field);
  }
  assert.throws(() => parseCalculationConfig('{'), ConfigurationError);
  assert.throws(() => parseCalculationConfig(' '.repeat(65537)), /64 KiB/);
});

test('inverse mode restores target ordinary frequency and recomputes required power', () => {
  const state = stateFor('T3', 'sigmam'); state.calcMode = 'rabi'; state.fR_MHz = .01;
  const config = exportCalculationConfig(state, versions);
  const parsed = parseCalculationConfig(config, versions);
  close(parsed.result.fR, 1e4);
  assert.equal(parsed.state.calcMode, 'rabi');
  assert.notEqual(parsed.state.P_mW, 1);
});

test('zero-power configuration stays valid, M2 stays unsupported, exported state is not mutated', () => {
  const state = stateFor(); state.P_mW = 0;
  const before = structuredClone(state);
  const config = exportCalculationConfig(state, versions);
  assert.equal(config.result.frequency_Hz, 0);
  assert.equal(config.result.piTime_s, null);
  assert.deepEqual(state, before);
  const m2 = parseCalculationConfig(exportCalculationConfig(stateFor('T4'), versions), versions);
  assert.equal(m2.result.status, 'unsupported');
  assert.equal(m2.state.selectedChannel, null);
});

test('all three solve directions and calculator display units survive JSON round trips', () => {
  for (const solveFor of ['rabi', 'power', 'waist']) {
    const state = stateFor('T3', 'sigmam');
    state.solveFor = solveFor;
    state.calculatorUnits = { power: 'µW', rabi: 'kHz', waist: 'mm' };
    state.fR_MHz = rabiHz(computeDEff(state).dEff, state.P_mW, state.w_um) / 1e6;
    const config = exportCalculationConfig(state, versions);
    assert.equal(config.display.solveFor, solveFor);
    assert.deepEqual(config.display.units, state.calculatorUnits);
    const parsed = parseCalculationConfig(JSON.stringify(config), versions);
    assert.equal(parsed.state.solveFor, solveFor);
    assert.deepEqual(parsed.state.calculatorUnits, state.calculatorUnits);
    close(parsed.state.P_mW, state.P_mW);
    close(parsed.state.w_um, state.w_um);
    assert.equal(parsed.warnings.length, 0);
  }
});

test('waist solve direction recomputes its output from the current model and independent power/frequency inputs', () => {
  const config = exportCalculationConfig({ ...stateFor('T3', 'sigmam'), solveFor: 'waist' }, versions);
  config.parameters.power_W = 0.003;
  config.enteredParameters.power_W = 0.003;
  config.parameters.targetRabi_Hz = 123;
  const parsed = parseCalculationConfig(config, versions);
  assert.equal(parsed.state.solveFor, 'waist');
  assert.equal(parsed.state.calcMode, 'power');
  close(parsed.state.P_mW, 3);
  close(parsed.state.w_um, waistFromRabiHz(parsed.state.dEff, 123, 3));
  close(parsed.result.fR, 123);
});

test('older version-1 files without the new UI fields retain the original calcMode mapping', () => {
  for (const calcMode of ['power', 'rabi']) {
    const config = exportCalculationConfig({ ...stateFor(), calcMode }, versions);
    config.schemaVersion = 1;
    delete config.inputDefinition;
    delete config.enteredParameters;
    delete config.display.solveFor;
    delete config.display.units;
    config.display.powerUnit = 'W'; config.display.rabiUnit = 'GHz';
    const parsed = parseCalculationConfig(config, versions);
    assert.equal(parsed.state.solveFor, calcMode === 'rabi' ? 'power' : 'rabi');
    assert.deepEqual(parsed.state.calculatorUnits, { power: 'W', rabi: 'GHz', waist: 'µm' });
  }
});

test('rejects unknown solve directions and incomplete or incompatible calculator units', () => {
  for (const edit of [
    c => { c.display.solveFor = 'invalid'; },
    c => { c.display.units.waist = 'mW'; },
    c => { delete c.display.units.rabi; },
    c => { c.display.units.power = 'unknown'; },
  ]) {
    const config = exportCalculationConfig(stateFor(), versions); edit(config);
    assert.equal(validateCalculationConfig(config, versions).valid, false);
  }
});
