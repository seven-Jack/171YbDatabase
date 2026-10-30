import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS,getQuantity} from '../../src/data/catalog.js';
import {R2_PROVENANCE,R2_EVIDENCE_EXTENSION} from '../../src/ui/r2-provenance.js';
import {buildSourceView,createFieldView,renderSourceDetailsHTML} from '../../src/ui/source-panel.js';

const selected=id=>({transition:CORE_TRANSITIONS.find(row=>row.id===id),F_lower:.5,F_upper:.5,pol:'pi',dEff:.01,P_mW:1,w_um:50,selectedChannel:null});

test('R2 provenance retains two website-attribution records with complete fingerprint locators',()=>{
  assert.ok(Object.isFrozen(R2_PROVENANCE));
  assert.equal(R2_PROVENANCE.history.length,2);
  assert.deepEqual(R2_PROVENANCE.history.map(item=>item.commit),[
    'ea024f99421a2a5e7756b2dcc310c5f1891962b5',
    'f10576c649ffbf17d9c13e4d91f374eb130e0df9'
  ]);
  for(const item of R2_PROVENANCE.history){
    assert.ok(Object.isFrozen(item));
    assert.match(item.sha256,/^[a-f0-9]{64}$/);
    assert.ok(item.path&&item.lines&&item.excerpt);
  }
  assert.match(R2_PROVENANCE.scope,/网站归属历史，不是原始生成证据/);
});

test('only R2 gains a native details disclosure and its evidence status is unchanged',()=>{
  const before=JSON.stringify(getQuantity('R2','d_num'));
  const html=renderSourceDetailsHTML(buildSourceView(selected('R2')));
  assert.match(html,/<details[^>]*data-testid="r2-provenance"><summary>R2来源追溯与误差边界<\/summary>/);
  assert.match(html,/0\.0376 ea₀ 仍为原输入/);
  assert.match(html,/电子态 J 级约化量/);
  assert.match(html,/尚未独立验证/);
  assert.match(html,/Notebook \/ Run、计算代码版本、输入输出工件及哈希未定位/);
  assert.match(html,/实际混合态根 \/ branch、F \/ mF、B 及辐射温度 T 均未知/);
  assert.doesNotMatch(renderSourceDetailsHTML(buildSourceView(selected('T2'))),/data-testid="r2-provenance"/);
  assert.equal(createFieldView('R2','d_num').review,'定义待核查');
  assert.equal(createFieldView('R2','d_num').missingArtifact,true);
  assert.equal(JSON.stringify(getQuantity('R2','d_num')),before);
});

test('all four uncertainty categories remain unknown and Run evidence cannot transfer',()=>{
  assert.deepEqual(R2_PROVENANCE.uncertainties.map(item=>item.label),['实验输入误差','数值收敛','模型截断','未知系统误差']);
  for(const item of R2_PROVENANCE.uncertainties) assert.match(item.status,/^未知/);
  const html=renderSourceDetailsHTML(buildSourceView(selected('R2')));
  assert.match(html,/总不确定度未建立，未赋予数值误差/);
  assert.match(html,/R007/);
  assert.match(html,/合同明确不是 65S/);
  assert.match(html,/R008/);
  assert.match(html,/不能借用其 B \/ T 假设/);
  assert.match(html,/寿命条件拟合、其他 Run 的数值检查均不能作为该矩阵元的独立理论验证/);
  assert.doesNotMatch(html,/已验证|实验验证通过|\/Users\//);
});


test('public sources support bounded context and never promote the unresolved R2 input',()=>{
  assert.equal(R2_EVIDENCE_EXTENSION.reviewedAt,'2026-10-27');
  assert.equal(R2_EVIDENCE_EXTENSION.sources.length,3);
  assert.match(R2_EVIDENCE_EXTENSION.sources[0].supports,/518 G/);
  assert.match(R2_EVIDENCE_EXTENSION.sources[0].limit,/不是本页矩阵元的原始计算来源/);
  for(const source of R2_EVIDENCE_EXTENSION.sources){assert.equal(new URL(source.url).protocol,'https:');assert.ok(source.locator&&source.limit);}
  const html=renderSourceDetailsHTML(buildSourceView(selected('R2')));
  assert.match(html,/文献能支持什么（非本数值来源）/);
  assert.match(html,/原始计算来源仍未定位/);
  assert.equal(getQuantity('R2','d_num').value,0.0376);
  assert.equal(createFieldView('R2','d_num').missingArtifact,true);
});

test('conditional uncertainty method preserves missing inputs, covariance and nonzero boundaries',()=>{
  const p=R2_EVIDENCE_EXTENSION.propagation;
  assert.match(p.prerequisite,/相对标准不确定度足够小/);
  assert.match(p.prerequisite,/P_q>0、w₀>0/);
  assert.match(p.uncorrelated,/一阶近似.*≈/);
  assert.match(p.correlated,/cov\(x_i,x_j\)/);
  assert.match(p.boundary,/不填零、不输出总误差/);
  assert.match(p.boundary,/不自动作为独立随机量平方和/);
  assert.match(p.definitions,/不再包含同一个偏振振幅权重/);
  const html=renderSourceDetailsHTML(buildSourceView(selected('R2')));
  assert.match(html,/误差传播与验证路线（待执行）/);
  assert.match(html,/不能再以该组吻合自称独立验证/);
  assert.deepEqual(R2_EVIDENCE_EXTENSION.validation.map(item=>item.status),['未完成','待原始工件齐备后另行授权执行','未验证','未验证']);
});
