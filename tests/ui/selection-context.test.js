import test from 'node:test';
import assert from 'node:assert/strict';
import { CORE_LEVELS, CORE_TRANSITIONS, RYDBERG_QC_DATA, getTransitionRecord } from '../../src/data/catalog.js';
import { computeCGChannels, computeDEff, channelKey, getFs } from '../../src/physics/angular.js';
import { buildSelectionContext } from '../../src/ui/selection-context.js';

function stateFor(id='T2', patch={}) {
  const transition=CORE_TRANSITIONS.find(row=>row.id===id);
  assert.ok(transition, `unknown test transition ${id}`);
  const J=term=>CORE_LEVELS.find(row=>row.term===term)?.J ?? RYDBERG_QC_DATA.rydStates.find(row=>row.label===term)?.J;
  const state={transition,J_lower:J(transition.lower),J_upper:J(transition.upper),
    dReduced:transition.d_num||0,wavelength_nm:transition.wavelength_vac_nm,
    F_lower:getFs(J(transition.lower))[0],F_upper:getFs(J(transition.upper))[0],diagF_lower:'all',diagF_upper:'all',pol:'pi',selectedChannel:null,
    P_mW:1,w_um:50,fR_MHz:1,calcMode:'power',inputStatus:'valid',...patch};
  state.dEff=computeDEff(state).dEff;
  return state;
}

test('no transition produces no invented selection',()=>{
  assert.deepEqual(buildSelectionContext(),{transition:null});
  assert.deepEqual(buildSelectionContext({selectedChannel:{F:.5,m:.5,Fp:.5,mp:.5,q:0}}),{transition:null});
});

test('automatic context identifies the same mF channel used by the effective-dipole calculation',()=>{
  for(const id of ['T1','T2','T3','T5','T6','T7','R2']) {
    for(const pol of ['pi','sigmap','sigmam']) {
      const state=stateFor(id,{pol});
      const effective=computeDEff(state), model=buildSelectionContext(state);
      assert.equal(model.status,'ready',`${id} ${pol}`);
      assert.equal(model.mode,'自动 · 最强通道');
      assert.equal(model.channel.m,effective.mF);
      assert.equal(model.channel.mp,effective.mFp);
      assert.equal(Math.abs(model.channel.matEl),effective.dEff);
      assert.equal(model.channel.F,state.F_lower);
      assert.equal(model.channel.Fp,state.F_upper);
      assert.match(model.channelText,/mF=/);
      assert.match(model.channelText,/mF′=/);
      assert.equal(model.hiddenByFilter,false);
    }
  }
});

test('manual selection retains exact initial and final state and field-specific source references',()=>{
  const initial=stateFor();
  const selected=computeCGChannels(initial).find(row=>row.F===.5&&row.m===.5&&row.Fp===1.5&&row.mp===1.5&&row.q===1);
  assert.ok(selected);
  const state=stateFor('T2',{selectedChannel:selected,F_upper:1.5,pol:'sigmap'});
  const before=JSON.stringify(state),model=buildSelectionContext(state);
  assert.equal(model.mode,'手动选定');
  assert.equal(channelKey(model.channel),channelKey(selected));
  assert.equal(model.channelText,'F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2 · σ⁺');
  assert.equal(model.tooltip.rows.find(row=>row.label==='初态').value,'¹S₀ · F=1/2, mF=+1/2');
  assert.equal(model.tooltip.rows.find(row=>row.label==='末态').value,'³P₁ · F′=3/2, mF′=+3/2');
  const record=getTransitionRecord('T2');
  assert.deepEqual(model.tooltip.rows.find(row=>row.label==='波长').sourceIds,[record.quantities.wavelength_vac_nm.sourceId]);
  assert.deepEqual(model.tooltip.rows.find(row=>row.label==='|d_eff|').sourceIds,[record.quantities.d_num.sourceId]);
  assert.equal(JSON.stringify(state),before,'context construction must not mutate calculator state');
});

test('stale channel from a different polarization falls back to the actual current-polarization channel',()=>{
  const initial=stateFor();
  const stale=computeCGChannels(initial).find(row=>row.F===.5&&row.Fp===.5&&row.q===1);
  assert.ok(stale);
  const state=stateFor('T2',{selectedChannel:stale,pol:'pi'});
  const effective=computeDEff(state),model=buildSelectionContext(state);
  assert.equal(model.mode,'自动 · 最强通道');
  assert.equal(model.channel.q,0);
  assert.equal(model.channel.m,effective.mF);
  assert.equal(model.channel.mp,effective.mFp);
  assert.notEqual(channelKey(model.channel),channelKey(stale));
  assert.match(model.channelText,/ · π$/);
});

test('diagram F filters preserve the selected calculation identity and disclose when it is hidden',()=>{
  const initial=stateFor();
  const selected=computeCGChannels(initial).find(row=>row.F===.5&&row.Fp===1.5&&row.q===0);
  const state=stateFor('T2',{selectedChannel:selected,F_upper:1.5,diagF_upper:.5});
  const model=buildSelectionContext(state);
  assert.equal(model.mode,'手动选定');
  assert.equal(channelKey(model.channel),channelKey(selected));
  assert.equal(model.hiddenByFilter,true);
  assert.match(model.tooltip.footnote,/显示筛选未包含当前通道/);
  const visible=buildSelectionContext({...state,diagF_upper:'all'});
  assert.equal(visible.hiddenByFilter,false);
  assert.equal(visible.channelText,model.channelText);
  assert.equal(Math.abs(model.channel.matEl),state.dEff);
});

test('clock and Rydberg identities remain distinct and retain their correct effective matrix elements',()=>{
  const clock=buildSelectionContext(stateFor('T3',{pol:'sigmam'}));
  assert.equal(clock.channel.F,.5);
  assert.equal(clock.channel.Fp,.5);
  assert.equal(clock.channel.m,.5);
  assert.equal(clock.channel.mp,-.5);
  assert.equal(clock.channel.q,-1);
  assert.ok(Math.abs(Math.abs(clock.channel.matEl)-9.19e-5/Math.sqrt(3))<1e-15);
  assert.match(clock.transitionText,/T3 · ¹S₀ → ³P₀/);
  const rydberg=buildSelectionContext(stateFor('R2',{pol:'sigmap'}));
  assert.match(rydberg.transitionText,/R2 · ³P₀ → 65³S₁/);
  assert.equal(rydberg.channel.q,1);
  assert.equal(rydberg.channel.m,-.5);
  assert.equal(rydberg.channel.mp,.5);
  assert.doesNotMatch(rydberg.tooltip.footnote,/验证通过|已验证|实验/);
});

test('M2 retains transition identity while suppressing an E1 channel and dipole claim',()=>{
  const state=stateFor('T4',{F_upper:1.5});
  const model=buildSelectionContext(state);
  assert.equal(model.transition,state.transition);
  assert.equal(model.status,'unsupported');
  assert.equal(model.channel,undefined);
  assert.equal(model.mode,'通道不可用');
  assert.match(model.channelText,/M2.*E1.*不适用/);
  assert.ok(model.tooltip.rows.every(row=>row.label!=='|d_eff|'&&row.label!=='偏振'));
  assert.doesNotMatch(model.tooltip.rows.map(row=>row.value).join(' '),/mF/);
});

test('invalid optical inputs retain selected state identity without presenting a ready result',()=>{
  const initial=stateFor('T2');
  const selected=computeCGChannels(initial).find(row=>row.F===.5&&row.Fp===.5&&row.q===0);
  const state=stateFor('T2',{selectedChannel:selected,P_mW:null,w_um:null,fR_MHz:null,inputStatus:'invalid'});
  const model=buildSelectionContext(state);
  assert.equal(model.status,'invalid-input');
  assert.equal(model.mode,'手动选定');
  assert.equal(channelKey(model.channel),channelKey(selected));
  assert.match(model.tooltip.footnote,/输入无效/);
  assert.ok(!model.tooltip.rows.some(row=>row.label==='Ω/2π'));
});

test('unknown catalog identity and missing applicable data cannot masquerade as a usable channel',()=>{
  const initial=stateFor();
  const unknown=buildSelectionContext({...initial,transition:{...initial.transition,id:'unknown'}});
  assert.equal(unknown.status,'missing-data');
  assert.equal(unknown.channel,undefined);
  assert.match(unknown.channelText,/缺少适用的矩阵元/);
  assert.ok(unknown.tooltip.rows.every(row=>!row.sourceIds?.length));
  const missing=stateFor('T4',{F_upper:1.5});
  missing.transition={...missing.transition,multipole:'E1'};
  const view=buildSelectionContext(missing);
  assert.equal(view.status,'missing-data');
  assert.equal(view.channel,undefined);
  assert.ok(!view.tooltip.rows.some(row=>row.label==='|d_eff|'));
});
