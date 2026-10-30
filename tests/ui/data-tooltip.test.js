import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS,getTransitionRecord} from '../../src/data/catalog.js';
import {buildTableTooltipModel} from '../../src/ui/data-table.js';

const transition=id=>CORE_TRANSITIONS.find(row=>row.id===id);
const model=(id,field)=>buildTableTooltipModel(transition(id),field);

test('table hover citations follow each saved quantity with newly adopted literature distinct from unresolved internal elements',()=>{
  assert.deepEqual(model('T2','wavelength_vac_nm').rows[0].sourceIds,['ref-01']);
  assert.deepEqual(model('T2','d_num').rows[0].sourceIds,['ref-01']);
  assert.deepEqual(model('T3','d_num').rows[0].sourceIds,['internal-t3-20260908']);
  assert.deepEqual(model('R2','wavelength_vac_nm').rows[0].sourceIds,['legacy-scaling']);
  assert.deepEqual(model('R2','d_num').rows[0].sourceIds,['ref-17']);
  assert.match(model('R2','wavelength_vac_nm').rows[0].value,/^≈/);
});

test('compact matrix-element hovers retain effective F convention and missing E1 values',()=>{
  assert.ok(model('T3','d_num').rows.some(row=>row.value==='有效 F 级约化量'));
  const missing=model('T4','d_num');
  assert.match(missing.rows[0].value,/缺少适用的 E1/);
  assert.doesNotMatch(missing.rows[0].value,/^0 ea/);
  assert.ok(model('T2','d_num').rows.some(row=>row.value==='文献推导值'));
});

test('lifetime and linewidth hovers distinguish located source conflicts from unresolved model definitions',()=>{
  assert.match(model('R2','lifetime_ns').footnote,/寿命条件未注明/);
  assert.ok(model('R2','lifetime_ns').rows.some(row=>row.value==='由标度估算推导'));
  const linewidth=model('T2','linewidth_frequency_coefficient_Hz');
  assert.equal(linewidth.rows[0].value,'182.4 kHz');
  assert.match(linewidth.footnote,/Δν=Γ\/2π · 原表 2π 标注冲突/);
  assert.doesNotMatch(JSON.stringify(linewidth),/FWHM|已验证|实验验证|300 K/);
});

test('compact table summaries leave source data untouched and do not include long prose',()=>{
  for(const row of CORE_TRANSITIONS) {
    const before=JSON.stringify(getTransitionRecord(row.id));
    for(const field of ['wavelength_vac_nm','frequency_THz','energy_eV','lifetime_ns','d_num','oscillator_strength_f_num','linewidth_frequency_coefficient_Hz']) {
      const view=buildTableTooltipModel(row,field);
      assert.ok(view.rows.length<=3);
      assert.ok(view.rows.every(row=>row.value.length<60));
      assert.doesNotMatch(JSON.stringify(view),/保留原记录；|不擅自相互覆盖|不能直接作为实验有效寿命/);
    }
    assert.equal(JSON.stringify(getTransitionRecord(row.id)),before);
  }
});
