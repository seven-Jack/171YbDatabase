import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS, getTransitionRecord} from '../../src/data/catalog.js';
import {createFieldView} from '../../src/ui/source-panel.js';
import {renderTransitionTooltip} from '../../src/ui/diagram-details.js';

const transition=id=>CORE_TRANSITIONS.find(row=>row.id===id);

test('transition hovers keep the four optical fields and leave level properties out',()=>{
  for(const row of CORE_TRANSITIONS) {
    const before=JSON.stringify(getTransitionRecord(row.id));
    const html=renderTransitionTooltip(row);
    assert.match(html,/λ（真空）/);
    assert.match(html,/频率 ν/);
    assert.match(html,/多极性/);
    assert.equal((html.match(/class="diagram-detail-row"/g)||[]).length,4);
    assert.doesNotMatch(html,/寿命|线宽|振子强度|超精细结构|原记录表达：|寿命依据：|温度与包含过程|Notebook \/ Run/);
    assert.doesNotMatch(html,/已验证|实验验证通过/);
    assert.equal(JSON.stringify(getTransitionRecord(row.id)),before);
  }
});

test('T2 cites its adopted literature while T3 keeps a separate internal dipole record',()=>{
  const t2=renderTransitionTooltip(transition('T2'));
  assert.match(t2,/href="#diagram-source-ref-01"/);
  assert.doesNotMatch(t2,/href="#diagram-source-internal-t2-calibration"|内部校准/);
  assert.match(t2,/0\.5398 ea₀/);
  assert.doesNotMatch(t2,/0\.5398\(6\)/);
  const t3=renderTransitionTooltip(transition('T3'));
  assert.match(t3,/href="#diagram-source-ref-01"/);
  assert.match(t3,/href="#diagram-source-internal-t3-20260908"/);
  assert.doesNotMatch(t3,/internal-t2-calibration/);
});

test('T3 retains its effective F-reduced matrix element instead of relabeling it as bare J-reduced',()=>{
  const html=renderTransitionTooltip(transition('T3'));
  assert.ok(html.includes(createFieldView('T3','d_num').valueText));
  assert.match(html,/有效 F/);
  assert.doesNotMatch(html,/J 约化|J 级约化量/);
});

test('R2 cites scaling for wavelength and this-work record for dipole',()=>{
  const html=renderTransitionTooltip(transition('R2'));
  assert.match(html,/≈301\.87 nm/);
  assert.match(html,/href="#diagram-source-legacy-scaling"/);
  assert.match(html,/href="#diagram-source-ref-17"/);
  assert.match(html,/0\.0376 ea₀/);
  assert.match(html,/本工作计算/);
  assert.doesNotMatch(html,/href="#diagram-source-ref-04"|this-work-hyperfine-65s|实验验证/);
});

test('T4 keeps its missing E1 matrix element distinct from a zero',()=>{
  const html=renderTransitionTooltip(transition('T4'));
  assert.match(html,/缺少适用的 E1 矩阵元/);
  assert.doesNotMatch(html,/>0 ea₀/);
});
