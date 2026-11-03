import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS, getTransitionRecord, getLevelRecord, getQuantity, DATASET_MANIFEST} from '../../src/data/catalog.js';
import {FORMULA_VERSION} from '../../src/physics/constants.js';
import {computeCGChannels, computeDEff, channelKey} from '../../src/physics/angular.js';
import {calculateRabi} from '../../src/physics/rabi.js';
import {DEFAULT_BEAM_DEFINITION} from '../../src/physics/beam-conventions.js';
import {exportCalculationConfig, parseCalculationConfig} from '../../src/state/config.js';
import {buildEqualConditionComparison} from '../../src/ui/equal-condition-comparison.js';

const versions = {datasetHash:DATASET_MANIFEST.contentHash, formulaVersion:FORMULA_VERSION};
const transition = id => CORE_TRANSITIONS.find(item => item.id === id);
const selected = (...ids) => ids.map(id => ({id}));
const rowFor = (view, id) => view.rows.find(row => row.id === id);
const close = (a, b) => assert.ok(Math.abs(a - b) <= 1e-11 * Math.max(Math.abs(a), Math.abs(b), 1e-30), `${a} != ${b}`);

function sourceState(id = 'T2', patch = {}) {
  const current = transition(id), record = getTransitionRecord(id);
  const state = {transition:current,
    J_lower:getLevelRecord(record.lowerLevelId).attributes.J,
    J_upper:getLevelRecord(record.upperLevelId).attributes.J,
    dReduced:getQuantity(id, 'd_num').value, convention:getQuantity(id, 'd_num').convention,
    F_lower:.5, F_upper:1.5, pol:'sigmap', selectedChannel:null,
    inputStatus:'valid', P_mW:1, w_um:500,
    beamDefinition:{...DEFAULT_BEAM_DEFINITION}, beamInput:{power_mW:1, size_um:500},
    calculatorUnits:{power:'mW', rabi:'MHz', waist:'µm'}, powerUnit:'mW', rabiUnit:'MHz',
    solveFor:'rabi', ...patch};
  const effective = computeDEff(state);
  state.dEff = effective.dEff;
  state.fR_MHz = 12345; // A saved/displayed frequency must never become a comparison input.
  return state;
}

function independentResult(id, context) {
  const record = getTransitionRecord(id), state = {
    transition:transition(id),
    dReduced:getQuantity(id, 'd_num').value,
    J_lower:getLevelRecord(record.lowerLevelId).attributes.J,
    J_upper:getLevelRecord(record.upperLevelId).attributes.J,
    pol:context.pol,
  };
  const channel = computeCGChannels(state).find(item => channelKey(item) === channelKey(context.channel));
  assert.ok(channel, `Expected independent channel for ${id}`);
  return {channel, result:calculateRabi({dEff_ea0:Math.abs(channel.matEl), multipole:state.transition.multipole,
    P_mW:context.P_mW, w_um:context.w_um})};
}

test('automatic source resolves its actual mF channel and compares canonical targets at equal normalized inputs', () => {
  const source = sourceState();
  source.transition = {...source.transition, lower:'forged', d_num:999, multipole:'M2'};
  Object.assign(source, {J_lower:99, J_upper:99, dReduced:999, dEff:999, convention:'forged'});
  const targets = [{id:'T1', d_num:999, multipole:'M2'}, {id:'T2', wavelength_vac_nm:999}];
  const before = structuredClone({source, targets});
  const view = buildEqualConditionComparison(targets, source, versions);
  assert.equal(view.context.status, 'ready');
  assert.equal(view.context.selectionOrigin, 'auto');
  assert.deepEqual(view.context.channel, {F:.5, m:.5, Fp:1.5, mp:1.5, q:1});
  for (const row of view.rows) {
    const expected = independentResult(row.id, view.context);
    assert.equal(row.status, 'ok');
    assert.equal(row.transition, transition(row.id));
    assert.equal(row.state.dReduced, getQuantity(row.id, 'd_num').value);
    close(row.dEff_ea0, Math.abs(expected.channel.matEl));
    close(row.result.fR, expected.result.fR);
    assert.equal(row.result.units.fR, 'Hz');
    assert.notEqual(row.result.fR / 1e6, source.fR_MHz);
  }
  assert.deepEqual({source, targets}, before);
});

test('explicit source channel remains explicit and recomputes signed matrix elements instead of trusting saved strengths', () => {
  const source = sourceState();
  const desired = computeCGChannels(source).find(item => item.F === .5 && item.Fp === 1.5 && item.m === -.5 && item.q === 1);
  source.selectedChannel = {...desired, matEl:999, cgVal:999, angFactor:999};
  const view = buildEqualConditionComparison(selected('T1', 'T2'), source, versions);
  assert.equal(view.context.selectionOrigin, 'manual');
  assert.equal(view.context.channel.m, -.5);
  for (const row of view.rows) {
    const expected = independentResult(row.id, view.context);
    assert.equal(channelKey(row.state.selectedChannel), channelKey(desired));
    assert.equal(row.state.selectedChannel.matEl, expected.channel.matEl);
    close(row.result.fR, expected.result.fR);
  }
  const auto = buildEqualConditionComparison(selected('T2'), {...source, selectedChannel:null}, versions);
  assert.notEqual(rowFor(view, 'T2').result.fR, rowFor(auto, 'T2').result.fR);
});

test('forged, inconsistent or nonexistent source channels never fall back to the strongest channel', () => {
  const source = sourceState();
  const valid = computeCGChannels(source).find(item => item.m === .5 && item.F === .5 && item.Fp === 1.5 && item.q === 1);
  for (const desired of [{...valid, m:99}, {...valid, q:0}, {...valid, Fp:.5}, {...valid, m:'0.5'}, {}]) {
    const view = buildEqualConditionComparison(selected('T1', 'T2'), {...source, selectedChannel:desired}, versions);
    assert.equal(view.context.status, 'no-channel');
    assert.equal(view.context.channel, null);
    for (const row of view.rows) {
      assert.equal(row.status, 'invalid-context');
      assert.equal(row.state, null); assert.equal(row.result, null); assert.equal(row.dEff_ea0, null);
    }
  }
});

test('J-reduced and hyperfine-effective F-reduced inputs use their own canonical channel conventions', () => {
  const source = sourceState('T2', {F_upper:.5, pol:'pi'});
  const view = buildEqualConditionComparison(selected('T1', 'T2', 'T3', 'R2'), source, versions);
  for (const row of view.rows) {
    assert.equal(row.status, 'ok');
    const expected = independentResult(row.id, view.context);
    close(row.dEff_ea0, Math.abs(expected.channel.matEl));
    close(row.result.fR, expected.result.fR);
  }
  assert.equal(rowFor(view, 'T3').state.convention, 'F-reduced-effective');
  assert.equal(rowFor(view, 'T2').state.convention, 'J-reduced');
  assert.ok(rowFor(view, 'T3').dEff_ea0 > 0);
  const clockSource = sourceState('T3', {F_upper:.5, pol:'pi'});
  Object.assign(clockSource, {J_upper:1, dReduced:10, convention:'J-reduced'});
  const clockView = buildEqualConditionComparison(selected('T3', 'T2'), clockSource, versions);
  assert.equal(clockView.context.status, 'ready');
  close(rowFor(clockView, 'T3').result.fR, rowFor(view, 'T3').result.fR);
});

test('targets without the identical F/mF/polarization channel remain unavailable rather than selecting an alternative', () => {
  const view = buildEqualConditionComparison(selected('T2', 'T3', 'T7', 'T4'), sourceState(), versions);
  assert.equal(rowFor(view, 'T2').status, 'ok');
  for (const id of ['T3', 'T7']) {
    assert.equal(rowFor(view, id).status, 'no-channel');
    assert.equal(rowFor(view, id).state, null); assert.equal(rowFor(view, id).result, null);
  }
  assert.equal(rowFor(view, 'T4').status, 'unsupported');
  assert.equal(rowFor(view, 'T4').dEff_ea0, null);
  assert.equal(rowFor(view, 'T4').result, null);
});

test('a T7 stretched channel stays F=5/2 to F′=3/2 and is not projected onto J=0 lower states', () => {
  const source = sourceState('T7', {F_lower:2.5, F_upper:1.5, pol:'sigmam'});
  source.selectedChannel = computeCGChannels(source).find(item => item.F === 2.5 && item.m === 2.5 && item.Fp === 1.5 && item.q === -1);
  const view = buildEqualConditionComparison(selected('T7', 'T1', 'T2', 'T3'), source, versions);
  assert.deepEqual(view.context.channel, {F:2.5, m:2.5, Fp:1.5, mp:1.5, q:-1});
  assert.equal(rowFor(view, 'T7').status, 'ok');
  const expected = independentResult('T7', view.context);
  close(rowFor(view, 'T7').result.fR, expected.result.fR);
  assert.equal(rowFor(view, 'T7').evidence.rows[1].status, 'checked');
  for (const id of ['T1', 'T2', 'T3']) assert.equal(rowFor(view, id).status, 'no-channel');
});

test('M1 upstream total-power diameter definitions are preserved and never applied a second time', () => {
  const source = sourceState('T2', {
    P_mW:.4, w_um:50, solveFor:'power',
    beamDefinition:{...DEFAULT_BEAM_DEFINITION, powerPlane:'upstream', transmission:.8,
      powerBasis:'linear-total', linearOrientation:'manual', manualFraction:.5, sizeKind:'diameter'},
    beamInput:{power_mW:1, size_um:100}, calculatorUnits:{power:'µW', rabi:'kHz', waist:'mm'},
  });
  const before = structuredClone(source);
  const view = buildEqualConditionComparison(selected('T1', 'T2'), source, versions);
  assert.equal(view.context.P_mW, .4); assert.equal(view.context.w_um, 50);
  for (const row of view.rows) {
    const expected = independentResult(row.id, view.context);
    close(row.result.fR, expected.result.fR);
    assert.deepEqual(row.state.beamDefinition, source.beamDefinition);
    assert.deepEqual(row.state.beamInput, source.beamInput);
    assert.deepEqual(row.state.calculatorUnits, source.calculatorUnits);
    assert.equal(row.state.solveFor, 'rabi'); assert.equal(row.state.calcMode, 'power');
    assert.equal(row.state.inputStatus, 'valid');
    const restored = parseCalculationConfig(exportCalculationConfig(row.state));
    close(restored.state.P_mW, .4); close(restored.state.w_um, 50);
    close(restored.result.fR, row.result.fR);
    assert.deepEqual(restored.state.beamDefinition, source.beamDefinition);
    assert.equal(channelKey(restored.state.selectedChannel), channelKey(view.context.channel));
  }
  assert.deepEqual(source, before);
});

test('invalid, incomplete or inconsistent M1 inputs suppress all current comparison results', () => {
  const source = sourceState();
  const cases = [
    {inputStatus:'invalid'}, {inputStatus:'unsupported'}, {P_mW:NaN}, {P_mW:-1}, {w_um:0},
    {beamDefinition:{...DEFAULT_BEAM_DEFINITION, powerPlane:'upstream', transmission:null}},
    {beamInput:{power_mW:2, size_um:500}},
    {beamDefinition:{...DEFAULT_BEAM_DEFINITION, powerBasis:'linear-total', linearOrientation:'manual', manualFraction:.8}},
  ];
  for (const patch of cases) {
    const view = buildEqualConditionComparison(selected('T1', 'T2'), {...source, ...patch}, versions);
    assert.equal(view.context.status, 'invalid');
    assert.equal(view.context.P_mW, null); assert.equal(view.context.w_um, null);
    for (const row of view.rows) {
      assert.equal(row.result, null); assert.equal(row.state, null); assert.equal(row.evidence, null);
      assert.equal(row.dEff_ea0, null);
    }
  }
});

test('zero physical power is a valid forward comparison with zero frequency and infinite pi time', () => {
  const source = sourceState('T2', {P_mW:0, beamInput:{power_mW:0, size_um:500}});
  const view = buildEqualConditionComparison(selected('T1', 'T2'), source, versions);
  assert.equal(view.context.status, 'ready'); assert.equal(view.context.P_mW, 0);
  for (const row of view.rows) {
    assert.equal(row.status, 'ok'); assert.ok(row.dEff_ea0 > 0);
    assert.equal(row.result.fR, 0); assert.equal(row.result.tPi, Infinity);
    assert.equal(row.state.fR_MHz, 0);
  }
});

test('evidence belongs to each actual target and never promotes R2 or mismatched versions', () => {
  const source = sourceState();
  source.evidence = {summary:'forged validated experiment'};
  const view = buildEqualConditionComparison(selected('T1', 'T2', 'R2'), source, versions);
  for (const id of ['T1', 'T2']) {
    const row = rowFor(view, id);
    assert.equal(row.evidence.transitionId, id);
    assert.equal(row.evidence.primarySourceId, getQuantity(id, 'd_num').sourceId);
    assert.equal(row.evidence.rows[1].status, 'checked');
    assert.equal(row.evidence.rows[3].status, 'not-closed');
    assert.notEqual(row.evidence.summary, source.evidence.summary);
  }
  assert.notDeepEqual(rowFor(view, 'T1').evidence.comparisons, rowFor(view, 'T2').evidence.comparisons);
  const r2 = rowFor(view, 'R2');
  assert.equal(r2.status, 'ok'); assert.equal(r2.evidence.hasReview, false);
  assert.ok(r2.evidence.rows.every(row => row.status === 'not-reviewed'));
  for (const override of [{datasetHash:'0'.repeat(64)}, {formulaVersion:'9.9.9'}]) {
    const changed = buildEqualConditionComparison(selected('T1', 'T2'), source, {...versions, ...override});
    for (const row of changed.rows) {
      assert.equal(row.status, 'ok'); assert.equal(row.evidence.rows[1].status, 'needs-review');
      assert.equal(row.evidence.rows[3].status, 'not-closed');
      close(row.result.fR, rowFor(view, row.id).result.fR);
    }
  }
});

test('a different valid explicit target channel cannot inherit the reviewed stretched-channel evidence', () => {
  const source = sourceState();
  source.selectedChannel = computeCGChannels(source).find(item => item.F === .5 && item.Fp === 1.5 && item.m === -.5 && item.q === 1);
  const view = buildEqualConditionComparison(selected('T1', 'T2'), source, versions);
  for (const row of view.rows) {
    assert.equal(row.status, 'ok'); assert.equal(row.evidence.rows[1].status, 'needs-review');
    assert.equal(row.evidence.rows[2].status, 'needs-review'); assert.equal(row.evidence.rows[3].status, 'not-closed');
  }
});

test('unknown targets and unsupported source identities do not trust caller-supplied E1 or dipole fields', () => {
  const view = buildEqualConditionComparison([{id:'made-up', multipole:'E1', d_num:5}], sourceState(), versions);
  assert.equal(view.rows[0].status, 'missing-data'); assert.equal(view.rows[0].transition, null);
  assert.equal(view.rows[0].state, null); assert.equal(view.rows[0].result, null);
  for (const forged of [{id:'made-up', multipole:'E1', d_num:5}, {...transition('T4'), multipole:'E1', d_num:5}]) {
    const invalid = buildEqualConditionComparison(selected('T1', 'T2'), {...sourceState(), transition:forged}, versions);
    assert.equal(invalid.context.status, 'unsupported');
    for (const row of invalid.rows) assert.equal(row.result, null);
  }
});

test('the clock auto selector rejects invalid F values even though its effective-channel kernel has fixed F=1/2', () => {
  const source = sourceState('T3', {F_lower:1.5, F_upper:.5, pol:'pi'});
  const view = buildEqualConditionComparison(selected('T2', 'T3'), source, versions);
  assert.equal(view.context.status, 'no-channel');
  assert.ok(view.rows.every(row => row.result === null && row.state === null));
});

test('legacy default snapshots without beam metadata recover raw radius/component values without changing inputs', () => {
  const source = sourceState(); delete source.beamDefinition; delete source.beamInput;
  const before = structuredClone(source);
  const view = buildEqualConditionComparison(selected('T2'), source, versions);
  assert.equal(view.context.status, 'ready');
  assert.deepEqual(view.rows[0].state.beamDefinition, DEFAULT_BEAM_DEFINITION);
  assert.deepEqual(view.rows[0].state.beamInput, {power_mW:1, size_um:500});
  assert.deepEqual(source, before);
});

test('comparison outputs are isolated from frozen source and other target restore states', () => {
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  }
  const source = freeze(sourceState()), targets = freeze(selected('T1', 'T2'));
  const before = structuredClone({source, targets});
  const view = buildEqualConditionComparison(targets, source, versions);
  view.rows[0].state.beamInput.power_mW = 999;
  view.rows[0].state.beamDefinition.powerPlane = 'upstream';
  view.rows[0].state.calculatorUnits.rabi = 'Hz';
  view.rows[0].state.selectedChannel.matEl = 999;
  assert.deepEqual({source, targets}, before);
  assert.equal(view.rows[1].state.beamInput.power_mW, 1);
  assert.equal(view.rows[1].state.beamDefinition.powerPlane, 'atoms');
  assert.equal(view.rows[1].state.calculatorUnits.rabi, 'MHz');
  assert.notEqual(view.rows[1].state.selectedChannel.matEl, 999);
});
