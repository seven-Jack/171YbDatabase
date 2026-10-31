import test from 'node:test';
import assert from 'node:assert/strict';
import { CORE_TRANSITIONS, DATASET_VERSION, DATASET_MANIFEST } from '../../src/data/catalog.js';
import { computeCGChannels, computeDEff } from '../../src/physics/angular.js';
import { rabiHz, powerFromRabiHz, waistFromRabiHz } from '../../src/physics/rabi.js';
import { DEFAULT_BEAM_DEFINITION } from '../../src/physics/beam-conventions.js';
import { exportCalculationConfig, parseCalculationConfig, validateCalculationConfig, ConfigurationError } from '../../src/state/config.js';

const versions = { softwareVersion: '0.2.0', appCommit: '8ded1e1', datasetVersion: DATASET_VERSION, datasetHash: DATASET_MANIFEST.contentHash, formulaVersion: '1.0.1' };
const close = (a, b) => assert.ok(Math.abs(a - b) <= 1e-11 * Math.max(1e-30, Math.abs(a), Math.abs(b)), `${a} != ${b}`);

function upstreamState(solveFor = 'rabi') {
  const state = {
    transition: CORE_TRANSITIONS.find(t => t.id === 'T3'), J_lower: 0, J_upper: 0,
    F_lower: .5, F_upper: .5, diagF_lower: 'all', diagF_upper: 'all', pol: 'sigmap',
    P_mW: .4, w_um: 50, powerUnit: 'mW', rabiUnit: 'kHz', solveFor,
    calcMode: solveFor === 'power' ? 'rabi' : 'power',
    calculatorUnits: { power: 'µW', rabi: 'kHz', waist: 'mm' },
    beamDefinition: { ...DEFAULT_BEAM_DEFINITION, powerPlane: 'upstream', powerBasis: 'linear-total', transmission: .8, linearOrientation: 'perpendicular', sizeKind: 'diameter' },
    beamInput: { power_mW: 1, size_um: 100 },
  };
  state.dReduced = state.transition.d_num;
  state.selectedChannel = computeCGChannels(state).find(ch => ch.F === .5 && ch.Fp === .5 && ch.q === 1);
  state.fR_MHz = rabiHz(computeDEff(state).dEff, .4, 50) / 1e6;
  return state;
}

// Captured from the actual pre-M1 HEAD exporter, not generated through the v2 code.
const legacyFixture = {
  schemaVersion: 1, kind: '171yb-rabi-config', exportedAt: '2026-10-30T00:00:00.000Z',
  softwareVersion: '0.2.0', appCommit: '8ded1e1', datasetVersion: '2026.10.30.1',
  datasetHash: '3c2fd5ca0a98d1e1e3e59aa6eab7fdcd9164678c048ed736f41dced0a3c20d28',
  formulaVersion: '1.0.1', transitionId: 'T3',
  matrixElement: { reduced_ea0: .0000919, convention: 'F-reduced-effective', sourceId: 'internal-t3-20260908' },
  selection: { F_lower: .5, F_upper: .5, diagF_lower: 'all', diagF_upper: 'all', pol: 'pi', channel: null },
  parameters: { power_W: .001, waist_m: .000049999999999999996, targetRabi_Hz: 1000 },
  display: { powerUnit: 'mW', rabiUnit: 'kHz', calcMode: 'power', solveFor: 'rabi', units: { power: 'mW', rabi: 'kHz', waist: 'µm' } },
  result: { status: 'ok', power_W: .001, frequency_Hz: 6649.603073833216, omega_rad_s: 41780.688332085076, piTime_s: .00007519245802317808 },
};

test('actual version-1 fixture restores its original physical work point with explicit default definitions', () => {
  const parsed = parseCalculationConfig(structuredClone(legacyFixture), versions);
  assert.equal(parsed.warnings.length, 0);
  assert.deepEqual(parsed.state.beamDefinition, DEFAULT_BEAM_DEFINITION);
  close(parsed.state.beamInput.power_mW, 1);
  close(parsed.state.beamInput.size_um, 50);
  close(parsed.result.fR, legacyFixture.result.frequency_Hz);
  close(parsed.state.fR_MHz * 1e6, parsed.result.fR);
  const next = exportCalculationConfig(parsed.state, versions);
  assert.equal(next.schemaVersion, 2);
  close(next.parameters.power_W, legacyFixture.parameters.power_W);
  close(next.parameters.waist_m, legacyFixture.parameters.waist_m);
  assert.equal(next.matrixElement.sourceId, legacyFixture.matrixElement.sourceId);
});

test('version-2 round trips raw upstream total power and diameter while preserving canonical q power/radius', () => {
  for (const solveFor of ['rabi', 'power', 'waist']) {
    const original = upstreamState(solveFor), before = structuredClone(original);
    const config = exportCalculationConfig(original, versions);
    assert.equal(config.schemaVersion, 2);
    close(config.enteredParameters.power_W, .001);
    close(config.enteredParameters.size_m, 100e-6);
    close(config.parameters.power_W, .0004);
    close(config.parameters.waist_m, 50e-6);
    const parsed = parseCalculationConfig(JSON.stringify(config), versions);
    assert.equal(parsed.warnings.length, 0);
    assert.deepEqual(parsed.state.beamDefinition, original.beamDefinition);
    close(parsed.state.beamInput.power_mW, 1);
    close(parsed.state.beamInput.size_um, 100);
    close(parsed.state.P_mW, .4);
    close(parsed.state.w_um, 50);
    close(parsed.result.fR, original.fR_MHz * 1e6);
    assert.deepEqual(original, before);
  }
});

test('version-2 rejects impossible manual sigma fractions while preserving legal 50% configurations', () => {
  for (const pol of ['sigmap', 'sigmam']) {
    for (const solveFor of ['rabi', 'power', 'waist']) {
      const state = upstreamState(solveFor);
      state.pol = pol;
      state.selectedChannel = computeCGChannels(state).find(channel => channel.F === .5 && channel.Fp === .5 && channel.q === (pol === 'sigmap' ? 1 : -1));
      state.beamDefinition = { ...state.beamDefinition, linearOrientation: 'manual', manualFraction: .5 };
      const config = exportCalculationConfig(state, versions);
      assert.equal(parseCalculationConfig(config, versions).state.beamDefinition.manualFraction, .5);
      const invalid = structuredClone(config);
      invalid.inputDefinition.manualFraction = .500001;
      // Keep canonical/raw power self-consistent: the definition itself must fail.
      invalid.parameters.power_W = invalid.enteredParameters.power_W * invalid.inputDefinition.transmission * invalid.inputDefinition.manualFraction;
      const before = structuredClone(invalid);
      assert.throws(() => parseCalculationConfig(invalid, versions), error => error instanceof ConfigurationError && error.field === 'manualFraction' && /50%/.test(error.message));
      assert.deepEqual(invalid, before);
    }
  }
  const pi = upstreamState();
  pi.pol = 'pi';
  pi.selectedChannel = computeCGChannels(pi).find(channel => channel.F === .5 && channel.Fp === .5 && channel.q === 0);
  pi.beamDefinition = { ...pi.beamDefinition, linearOrientation: 'manual', manualFraction: .9 };
  pi.P_mW = .72;
  pi.fR_MHz = rabiHz(computeDEff(pi).dEff, pi.P_mW, pi.w_um) / 1e6;
  const legalPi = parseCalculationConfig(exportCalculationConfig(pi, versions), versions);
  assert.equal(legalPi.state.beamDefinition.manualFraction, .9);
  close(legalPi.state.P_mW, .72);
});

test('inverse power recomputation updates the entered upstream total power, not only the canonical value', () => {
  const config = exportCalculationConfig(upstreamState('power'), versions);
  config.parameters.targetRabi_Hz *= 2;
  config.matrixElement.reduced_ea0 = 100;
  const parsed = parseCalculationConfig(config, versions);
  const required = powerFromRabiHz(parsed.state.dEff, config.parameters.targetRabi_Hz, 50);
  close(parsed.state.P_mW, required);
  close(parsed.state.beamInput.power_mW, required / (.8 * .5));
  close(parsed.state.beamInput.power_mW, 4);
  close(parsed.result.fR, config.parameters.targetRabi_Hz);
  assert.ok(parsed.warnings.some(w => w.includes('矩阵元')));
  const next = exportCalculationConfig(parsed.state, versions);
  close(next.enteredParameters.power_W, .004);
  assert.equal(parseCalculationConfig(next, versions).warnings.length, 0);
});

test('inverse waist recomputation updates the entered diameter while preserving upstream power', () => {
  const config = exportCalculationConfig(upstreamState('waist'), versions);
  config.parameters.targetRabi_Hz *= 2;
  const parsed = parseCalculationConfig(config, versions);
  const radius = waistFromRabiHz(parsed.state.dEff, config.parameters.targetRabi_Hz, .4);
  close(parsed.state.w_um, radius);
  close(parsed.state.beamInput.size_um, 2 * radius);
  close(parsed.state.beamInput.size_um, 50);
  close(parsed.state.beamInput.power_mW, 1);
  close(parsed.result.fR, config.parameters.targetRabi_Hz);
  const next = exportCalculationConfig(parsed.state, versions);
  close(next.parameters.waist_m, 25e-6);
  close(next.enteredParameters.size_m, 50e-6);
});

test('rejects missing, unknown and contradictory version-2 beam definitions instead of guessing factors', () => {
  const edits = [
    c => { delete c.inputDefinition; },
    c => { delete c.enteredParameters; },
    c => { delete c.inputDefinition.transmission; },
    c => { c.inputDefinition.transmission = null; },
    c => { c.inputDefinition.transmission = 0; },
    c => { c.inputDefinition.transmission = 1.1; },
    c => { c.inputDefinition.linearOrientation = null; },
    c => { c.inputDefinition.linearOrientation = 'manual'; c.inputDefinition.manualFraction = null; },
    c => { c.inputDefinition.manualFraction = 2; },
    c => { c.inputDefinition.CG = .5; },
    c => { c.enteredParameters.power_W *= 2; },
    c => { c.enteredParameters.size_m *= 2; },
    c => { c.parameters.power_W *= 2; },
    c => { c.parameters.waist_m *= 2; },
    c => { c.enteredParameters.localPath = '/Users/private'; },
  ];
  for (const edit of edits) {
    const config = exportCalculationConfig(upstreamState(), versions); edit(config);
    const result = validateCalculationConfig(config, versions);
    assert.equal(result.valid, false, JSON.stringify(config));
    assert.ok(result.errors[0].field);
  }
});

test('zero selected component is a valid forward no-drive case, but inverse power/waist has no unique solution', () => {
  const state = upstreamState();
  state.pol = 'pi'; state.selectedChannel = null; state.P_mW = 0; state.fR_MHz = 0;
  const config = exportCalculationConfig(state, versions);
  const parsed = parseCalculationConfig(config, versions);
  assert.equal(parsed.result.fR, 0);
  assert.equal(parsed.result.tPi, Infinity);
  assert.equal(config.result.piTime_s, null);
  close(parsed.state.beamInput.power_mW, 1);
  for (const solveFor of ['power', 'waist']) {
    const impossible = structuredClone(config); impossible.display.solveFor = solveFor;
    assert.throws(() => parseCalculationConfig(impossible, versions), ConfigurationError);
  }
});

test('legacy schema cannot smuggle a new definition into an old file', () => {
  const config = structuredClone(legacyFixture);
  config.inputDefinition = { ...DEFAULT_BEAM_DEFINITION, sizeKind: 'diameter' };
  assert.equal(validateCalculationConfig(config, versions).valid, false);
});
