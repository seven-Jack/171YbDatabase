import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS,getTransitionRecord} from '../../src/data/catalog.js';
import {CORE_SUMMARY_COLUMNS,sortTableRows,formatLinewidthDisplay} from '../../src/ui/data-table.js';
import {buildSourceView,createFieldView,renderSourceDetailsHTML,renderFieldSourceHTML,escapeHTML,formatFrequency} from '../../src/ui/source-panel.js';

const selected=id=>({transition:CORE_TRANSITIONS.find(row=>row.id===id),F_lower:.5,F_upper:.5,pol:'pi',dEff:.01,P_mW:1,w_um:50,selectedChannel:null});

test('main table keeps its five required primary columns and numeric sorting ignores formatted strings',()=>{
  assert.deepEqual(CORE_SUMMARY_COLUMNS,['id','label','wavelength_vac_nm','d_num','source']);
  const before=[{nstar:'100.00',label:'100'},{nstar:'9.00',label:'9'},{nstar:'20.00',label:'20'},{nstar:'—',label:'missing'}];
  assert.deepEqual(sortTableRows(before,{col:'nstar',dir:'asc'}).map(row=>row.label),['9','20','100','missing']);
  assert.deepEqual(sortTableRows(before,{col:'nstar',dir:'desc'}).map(row=>row.label),['100','20','9','missing']);
  assert.deepEqual(before.map(row=>row.label),['100','9','20','missing']);
  const dipoles=['T1','T4','T2','T3'].map(id=>CORE_TRANSITIONS.find(row=>row.id===id));
  assert.deepEqual(sortTableRows(dipoles,{col:'d_num',dir:'asc'}).map(row=>row.id),['T3','T2','T1','T4']);
});

test('line-width main display separates the frequency coefficient from the untouched original 2pi expression',()=>{
  const t2=formatLinewidthDisplay(CORE_TRANSITIONS.find(row=>row.id==='T2'));
  assert.equal(t2.frequencyText,'182.4 kHz');
  assert.equal(t2.originalText,'2π × 182.4(4) kHz');
  assert.match(t2.decayText,/1146000 s⁻¹/);
  assert.match(t2.reviewText,/尚未重核/);
  assert.equal(formatLinewidthDisplay(CORE_TRANSITIONS.find(row=>row.id==='T3')).frequencyText,'7.6 mHz');
  assert.equal(formatFrequency(29130000),'29.13 MHz');
});

test('R2 makes dipole, wavelength and derived-lifetime evidence visibly distinct',()=>{
  const view=buildSourceView(selected('R2'));
  const html=renderSourceDetailsHTML(view);
  assert.match(html,/本工作计算/);
  assert.match(html,/标度估算/);
  assert.match(html,/由标度估算推导/);
  assert.match(html,/0\.0376 ea₀/);
  assert.match(html,/J 级约化量/);
  assert.match(html,/原文尚未重核/);
  assert.match(html,/Notebook \/ Run 及版本定位待补充/);
  assert.match(html,/原文页 \/ 表 \/ 式：待核查/);
  assert.doesNotMatch(html,/已验证|实验验证通过/);
  assert.equal(getTransitionRecord('R2').quantities.d_num.value,.0376);
});

test('T2 calibration conflict and T3 F-reduced convention remain accessible',()=>{
  const t2=renderFieldSourceHTML(createFieldView('T2','d_num'));
  assert.match(t2,/0\.5398\(6\)/);
  assert.match(t2,/0\.543 ea₀/);
  assert.match(t2,/内部校准/);
  const t3=buildSourceView(selected('T3'));
  assert.equal(t3.convention,'有效 F 级约化量');
  assert.match(t3.channel,/当前 F 对与偏振内最强允许通道/);
});

test('context distinguishes selection, unsupported model, missing data, absent channel and invalid input',()=>{
  assert.equal(buildSourceView({}).status,'unselected');
  assert.equal(buildSourceView(selected('T4')).status,'unsupported');
  assert.equal(buildSourceView({...selected('T2'),transition:{id:'unknown'}}).status,'missing-data');
  assert.equal(buildSourceView({...selected('T2'),dEff:0}).status,'no-channel');
  assert.equal(buildSourceView({...selected('T2'),P_mW:-1}).status,'invalid-input');
  assert.equal(buildSourceView({...selected('T2'),w_um:0}).status,'invalid-input');
  assert.equal(buildSourceView({...selected('T2'),calcMode:'rabi',fR_MHz:-1}).status,'invalid-input');
  const explicit=buildSourceView({...selected('T3'),selectedChannel:{F:.5,m:.5,Fp:.5,mp:-.5,q:-1}});
  assert.match(explicit.channel,/mF=\+1\/2/);
  assert.match(explicit.channel,/mF′=−1\/2/);
  assert.match(explicit.channel,/σ⁻/);
  assert.equal(explicit.statusText,'使用所选通道');
});

test('rendered evidence text escapes markup and unknown quantities remain missing',()=>{
  assert.equal(escapeHTML('<script>"x"</script>'),'&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
  const missing=createFieldView('T4','d_num');
  assert.match(missing.valueText,/缺少适用的 E1/);
  assert.doesNotMatch(renderFieldSourceHTML(missing),/>0 ea₀</);
  const malicious={...createFieldView('T2','d_num'),sourceTitle:'<img src=x onerror=alert(1)>'};
  assert.match(renderFieldSourceHTML(malicious),/&lt;img/);
  assert.doesNotMatch(renderFieldSourceHTML(malicious),/<img/);
});
