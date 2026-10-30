import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS,getTransitionRecord} from '../../src/data/catalog.js';
import {buildRabiProbeTooltip} from '../../src/ui/rabi-chart.js';

const state=id=>({transition:CORE_TRANSITIONS.find(row=>row.id===id),w_um:50});

test('curve probes preserve independent cursor coordinates without inventing a nearest waist',()=>{
  const model=buildRabiProbeTooltip({state:state('T2'),kind:'curve',powerText:'12.3 µW',rabiText:'456 kHz'});
  assert.equal(model.title,'曲线坐标');
  assert.equal(model.rows[0].value,'12.3 µW');
  assert.equal(model.rows[1].value,'456 kHz');
  assert.equal(model.rows[0].sourceIds,undefined);
  assert.equal(model.rows[1].sourceIds,undefined);
  assert.ok(model.rows[1].label.includes('坐标'));
  assert.equal(model.rows.some(row=>row.label.includes('束腰')),false);
  assert.match(model.footnote,/非曲线上取值/);
});

test('heat probes keep the evaluated power, waist and Rabi readouts with source bound to input d',()=>{
  const model=buildRabiProbeTooltip({state:state('R2'),kind:'heat',powerText:'2.34 mW',waistText:'67.8 µm',rabiText:'123 kHz'});
  assert.equal(model.title,'参数图读数');
  assert.deepEqual(model.rows.slice(0,3).map(row=>row.value),['2.34 mW','67.8 µm','123 kHz']);
  assert.ok(model.rows.slice(0,3).every(row=>!row.sourceIds));
  const basis=model.rows[3];
  assert.equal(basis.label,'模型输入 d');
  assert.deepEqual(basis.sourceIds,[getTransitionRecord('R2').quantities.d_num.sourceId]);
  assert.match(basis.note,/本工作计算/);
  assert.match(model.footnote,/未独立验证/);
});

test('matrix-input provenance remains distinct for literature-derived and effective F-reduced transitions',()=>{
  for(const id of ['T2','T3']) {
    const record=getTransitionRecord(id),before=JSON.stringify(record);
    const model=buildRabiProbeTooltip({state:state(id),kind:'curve',powerText:'1 mW',rabiText:'2 MHz'});
    const basis=model.rows[2];
    assert.deepEqual(basis.sourceIds,[record.quantities.d_num.sourceId]);
    assert.equal(JSON.stringify(record),before);
    assert.match(basis.note,id==='T2'?/文献推导值/:/有效 F 级约化量/);
  }
});

test('missing E1 matrix elements are not advertised as a numerical model input',()=>{
  const model=buildRabiProbeTooltip({state:state('T4'),kind:'curve',powerText:'1 mW',rabiText:'2 MHz'});
  assert.equal(model.rows.length,2);
  assert.equal(model.rows.some(row=>row.label.includes('依据')),false);
});
