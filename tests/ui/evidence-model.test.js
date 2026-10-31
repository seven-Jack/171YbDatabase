import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS, getQuantity} from '../../src/data/catalog.js';
import {computeCGChannels, computeDEff} from '../../src/physics/angular.js';
import {buildEvidenceView} from '../../src/ui/evidence-model.js';

function stateFor(id = 'T3', patch = {}) {
  const transition = CORE_TRANSITIONS.find(row => row.id === id);
  const state = {transition, dReduced:transition?.d_num || 0, J_lower:0, J_upper:id === 'T2' ? 1 : 0,
    F_lower:.5, F_upper:.5, pol:'pi', selectedChannel:null, P_mW:1, w_um:500, inputStatus:'valid', ...patch};
  state.dEff = computeDEff(state).dEff;
  return state;
}
const statuses = view => Object.fromEntries(view.rows.map(row => [row.key, row.status]));

test('578 nm review keeps four evidence levels and the true adopted source separate', () => {
  const state = stateFor(), before = JSON.stringify(state);
  const view = buildEvidenceView(state);
  assert.deepEqual(statuses(view), {source:'checked',formula:'checked',comparison:'conditional',experiment:'not-closed'});
  assert.match(view.rows[0].statusText, /支持原文已核；原采用值历史生成记录待补/);
  assert.match(view.summary, /未独立验证/);
  assert.equal(view.primarySourceId, 'internal-t3-20260908');
  assert.equal(view.primarySourceId, getQuantity('T3', 'd_num').sourceId);
  assert.ok(!view.sources.some(source => source.id === view.primarySourceId));
  assert.match(view.comparisons[0].scopeText, /固定文献.*非当前/);
  assert.equal(view.calculationStatus, 'valid');
  assert.equal(JSON.stringify(state), before);
});

test('all valid clock polarization components and explicit magnetic channels match reviewed conventions', () => {
  for (const pol of ['pi','sigmap','sigmam']) {
    const state = stateFor('T3', {pol});
    const q = {pi:0,sigmap:1,sigmam:-1}[pol];
    const channels = computeCGChannels(state).filter(channel => channel.q === q);
    for (const selectedChannel of channels) {
      const selectedState = stateFor('T3', {pol,selectedChannel});
      const view = buildEvidenceView(selectedState);
      assert.equal(view.rows[1].status, 'checked');
      assert.equal(view.rows[3].status, 'not-closed');
      assert.equal(view.applicability.channelMatch, true);
    }
  }
});

test('dataset and formula drift require new formula/comparison checks but preserve located original facts', () => {
  for (const overrides of [{datasetHash:'0'.repeat(64)}, {formulaVersion:'2.0.0'}]) {
    const view = buildEvidenceView(stateFor(), overrides);
    assert.deepEqual(statuses(view), {source:'checked',formula:'needs-review',comparison:'needs-review',experiment:'not-closed'});
    assert.equal(view.sources.length, 4);
    assert.equal(view.atomicSupport.quantities[0].value, 0.0442);
    assert.equal(view.comparisons[0].status, 'needs-review');
    assert.match(view.summary, /未独立验证.*需重核/);
  }
});

test('changed matrix element, convention, F or stale explicit channel never inherits a checked current formula', () => {
  const invalidContexts = [
    stateFor('T3', {dReduced:1e-4}),
    stateFor('T3', {convention:'J-reduced'}),
    stateFor('T3', {F_upper:1.5}),
    stateFor('T3', {selectedChannel:{F:.5,Fp:.5,m:-.5,mp:.5,q:1},pol:'pi'}),
    {...stateFor(), dEff:1},
    {...stateFor(), dEff:0},
    stateFor('T3', {dReduced:0}),
  ];
  for (const state of invalidContexts) {
    const view = buildEvidenceView(state);
    assert.equal(view.rows[1].status, 'needs-review');
    assert.equal(view.rows[2].status, 'needs-review');
    assert.equal(view.rows[3].status, 'not-closed');
  }
});

test('incomplete M1 input preserves historical evidence and marks this calculation invalid', () => {
  const state = stateFor('T3', {inputStatus:'invalid',beamDefinition:{powerPlane:'upstream',transmission:null}});
  const view = buildEvidenceView(state);
  assert.equal(view.calculationStatus, 'invalid');
  assert.equal(view.applicability.inputValid, false);
  assert.equal(view.rows[0].status, 'checked');
  assert.equal(view.rows[1].status, 'checked');
  assert.equal(view.rows[3].status, 'not-closed');
  assert.match(view.contextText, /当前计算输入待补正/);
  assert.equal(view.atomicSupport.quantities[0].value, 0.0442);
});

test('context identity follows channel, definitions, validity and versions without stale numeric power or waist', () => {
  const initial = stateFor(), view = buildEvidenceView(initial);
  const changedValues = buildEvidenceView({...initial,P_mW:1070,w_um:4321});
  assert.equal(changedValues.contextKey, view.contextKey);
  assert.equal(changedValues.contextText, view.contextText);
  assert.doesNotMatch(changedValues.contextText, /1070|4321/);
  for (const state of [stateFor('T3',{pol:'sigmap'}), {...initial,inputStatus:'invalid'},
    {...initial,beamDefinition:{sizeKind:'diameter'}}, {...initial,beamDefinition:{powerPlane:'upstream',transmission:.5}}]) {
    assert.notEqual(buildEvidenceView(state).contextKey, view.contextKey);
  }
  assert.notEqual(buildEvidenceView(initial,{formulaVersion:'2.0.0'}).contextKey, view.contextKey);
  assert.notEqual(buildEvidenceView({...initial,dEff:0}).contextKey, view.contextKey);
  assert.notEqual(buildEvidenceView({...initial,dEff:NaN}).contextKey, buildEvidenceView({...initial,dEff:undefined}).contextKey);
  assert.notEqual(buildEvidenceView({...initial,transition:{...initial.transition,multipole:'M2'}}).contextKey, view.contextKey);
  const invalidQ = buildEvidenceView({...initial,pol:'invalid'});
  assert.equal(invalidQ.rows[1].status, 'needs-review');
  assert.equal(invalidQ.calculationStatus, 'invalid');
  assert.equal(buildEvidenceView({...initial,inputStatus:'unrecognized'}).calculationStatus, 'invalid');
  assert.equal(buildEvidenceView({...initial,dEff:0}).calculationStatus, 'invalid');
});

test('unreviewed E1, unsupported multipole and no selection cannot borrow clock validation', () => {
  const t2 = buildEvidenceView(stateFor('T2'));
  assert.equal(t2.hasReview, false);
  assert.ok(t2.rows.every(row => row.status === 'not-reviewed'));
  assert.match(t2.rows[0].detail, /本轮面板尚未接入.*保留原有数值出处与审计/);
  assert.equal(t2.atomicSupport, null); assert.deepEqual(t2.comparisons, []);
  const t4 = buildEvidenceView(stateFor('T4'));
  assert.equal(t4.calculationStatus, 'unsupported');
  assert.ok(t4.rows.every(row => row.status === 'not-applicable'));
  const empty = buildEvidenceView();
  assert.equal(empty.transitionId, null); assert.equal(empty.calculationStatus, 'unselected');
  assert.equal(empty.hasReview, false);
});

test('UI projections are detached from the immutable metadata and never mutate adopted values', () => {
  const before = JSON.stringify(getQuantity('T3','d_num'));
  const view = buildEvidenceView(stateFor());
  view.atomicSupport.quantities[0].value = 999;
  view.comparisons[0].rows[0].rabi_kHz = 999;
  view.sources[0].url = 'https://example.com';
  const fresh = buildEvidenceView(stateFor());
  assert.equal(fresh.atomicSupport.quantities[0].value, .0442);
  assert.equal(fresh.comparisons[0].rows[0].rabi_kHz, 21.75141984154124);
  assert.equal(fresh.sources[0].doi, '10.1103/PhysRevLett.113.033003');
  assert.equal(JSON.stringify(getQuantity('T3','d_num')), before);
  assert.doesNotMatch(JSON.stringify(fresh), /file:\/\/|\/Users\/|references\/papers|data\/literature/);
});
