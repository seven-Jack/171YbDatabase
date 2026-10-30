import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS, getTransitionRecord} from '../../src/data/catalog.js';
import {buildHyperfineTooltipModel} from '../../src/ui/hyperfine-diagram.js';

const transition=id=>CORE_TRANSITIONS.find(row=>row.id===id);
const channel={F:.5,m:.5,Fp:1.5,mp:.5,matEl:-0.181,rabiStr:'32.08 MHz'};

test('HF hovers retain signed channel matrix elements, states and Rabi values in four compact rows',()=>{
  const model=buildHyperfineTooltipModel(transition('T2'),channel,'π');
  assert.equal(model.rows.length,4);
  assert.equal(model.rows[0].value,'|F=1/2, mF=+1/2⟩');
  assert.equal(model.rows[1].value,'|F′=3/2, mF′=+1/2⟩');
  assert.equal(model.rows[2].value,'−0.18100 ea₀');
  assert.equal(model.rows[3].value,channel.rabiStr);
  assert.deepEqual(model.rows[2].sourceIds,['ref-01']);
  assert.deepEqual(model.rows[3].sourceIds,['ref-01']);
  assert.match(model.footnote,/输入 d：J 级约化量 · 模型换算/);
  assert.doesNotMatch(JSON.stringify(model),/CG\/√|Wigner|6-j|已验证|实验值/);
});

test('clock channels retain the effective F input convention and its actual internal source',()=>{
  const clock={F:.5,m:.5,Fp:.5,mp:-.5,matEl:5.30678244e-5,rabiStr:'9.404 kHz'};
  const model=buildHyperfineTooltipModel(transition('T3'),clock,'σ⁻',true);
  assert.equal(model.rows[2].value,'+5.31e-5 ea₀');
  assert.equal(model.rows[1].value,'|F′=1/2, mF′=−1/2⟩');
  assert.deepEqual(model.rows[2].sourceIds,['internal-t3-20260908']);
  assert.match(model.footnote,/有效 F 级约化量/);
  assert.doesNotMatch(model.footnote,/J 级/);
});

test('Rydberg channel result cites the dipole calculation rather than the saved HFS data or scaling input',()=>{
  const model=buildHyperfineTooltipModel(transition('R2'),channel,'π');
  assert.deepEqual(model.rows[2].sourceIds,['ref-17']);
  assert.deepEqual(model.rows[3].sourceIds,['ref-17']);
  assert.doesNotMatch(JSON.stringify(model),/this-work-hyperfine-65s|legacy-scaling/);
});

test('hover rendering does not mutate canonical inputs and keeps absent quantities absent',()=>{
  const row=transition('T2'),before=JSON.stringify(getTransitionRecord(row.id)),channelBefore=JSON.stringify(channel);
  buildHyperfineTooltipModel(row,channel,'π');
  assert.equal(JSON.stringify(getTransitionRecord(row.id)),before);
  assert.equal(JSON.stringify(channel),channelBefore);
  const missing=buildHyperfineTooltipModel({id:'unrecorded'},{...channel,matEl:NaN,rabiStr:null},'π');
  assert.equal(missing.rows[2].value,'—');
  assert.equal(missing.rows[3].value,'—');
  assert.deepEqual(missing.rows[2].sourceIds,[]);
});
