import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG,CORE_LEVELS,HYPERFINE_DATA} from '../../src/data/catalog.js';
import {renderLevelDetails} from '../../src/ui/diagram-details.js';

const level=term=>CORE_LEVELS.find(row=>row.term===term);
const render=term=>renderLevelDetails(level(term),HYPERFINE_DATA[term]);

test('J=0 levels retain one F=1/2 branch with two degenerate mF states',()=>{
  for(const term of ['¹S₀','³P₀']) {
    const html=render(term);
    assert.match(html,/data-f="0\.5" data-shift="0"/);
    assert.equal((html.match(/class="hfs-detail-branch"/g)||[]).length,1);
    assert.match(html,/2 <small>重简并/);
    assert.match(html,/mF 简并/);
    assert.match(html,/data-mf="-0\.5"/);
    assert.match(html,/data-mf="0\.5"/);
    assert.doesNotMatch(html,/Δν \/ MHz/);
  }
});

test('hover details expand every mF state of each F manifold at the unchanged zero-field energy',()=>{
  for(const term of ['¹S₀','³P₁','³P₂']) {
    const html=render(term);
    const manifolds=[...html.matchAll(/class="hfs-mf-manifold" data-mf-f="([^"]+)" data-mf-shift="([^"]+)"[\s\S]*?<div class="hfs-mf-states"[^>]*>([\s\S]*?)<\/div>/g)];
    assert.equal(manifolds.length,HYPERFINE_DATA[term].levels.length);
    for(const [,FText,shiftText,statesHTML] of manifolds) {
      const F=Number(FText),shift=Number(shiftText);
      const expected=Array.from({length:2*F+1},(_,index)=>index-F);
      const actual=[...statesHTML.matchAll(/data-mf="([^"]+)"/g)].map(match=>Number(match[1]));
      assert.deepEqual(actual,expected,`${term} F=${F}: all magnetic substates must be visible`);
      assert.equal(shift,HYPERFINE_DATA[term].levels.find(branch=>branch.F===F).shift);
      assert.equal((statesHTML.match(/<i aria-hidden="true"><\/i>/g)||[]).length,2*F+1);
    }
    assert.doesNotMatch(html,/±|…/);
  }
});

test('negative-A states place the positive F=1/2 energy above F=3/2',()=>{
  for(const term of ['¹P₁','³D₁']) {
    const html=render(term);
    const branches=[...html.matchAll(/data-f="([^"]+)" data-shift="([^"]+)"[\s\S]*?<line[^>]+y1="([^"]+)"/g)].map(match=>({F:Number(match[1]),shift:Number(match[2]),y:Number(match[3])}));
    assert.equal(branches.length,2);
    const f12=branches.find(branch=>branch.F===.5),f32=branches.find(branch=>branch.F===1.5);
    assert.ok(f12.shift>0&&f32.shift<0);
    assert.ok(f12.y<f32.y,`${term}: increasing energy must point upward`);
    assert.equal(HYPERFINE_DATA[term].A<0,true);
  }
});

test('65S shows saved zero-field shifts to six decimals relative to the selected pair centroid',()=>{
  const html=render('65³S₁'),hfs=HYPERFINE_DATA['65³S₁'];
  assert.match(html,/有效 A \/ MHz/);
  assert.ok(html.includes(hfs.A.toFixed(6)));
  assert.ok(html.includes(hfs.splitting.toFixed(6)));
  for(const branch of hfs.levels) assert.ok(html.includes(branch.shift.toFixed(6)));
  assert.match(html,/所选 F 对重心/);
  assert.match(html,/保存计算 · 原始工件已定位/);
  assert.match(html,/定义待核查/);
  assert.match(html,/href="#diagram-source-this-work-hyperfine-65s"/);
  assert.doesNotMatch(html,/href="#diagram-source-ref-17"/);
});

test('level data and HFS use real record citations and do not depict uncomputed Zeeman splitting',()=>{
  for(const row of CORE_LEVELS) {
    const html=render(row.term);
    assert.match(html,/能量 E/);
    if(row.term==='65³S₁') {
      assert.match(html,/href="#diagram-source-legacy-scaling"/);
      assert.doesNotMatch(html,/>寿命 τ<[^]*>估算</);
    } else {
      assert.match(html,/寿命 τ/);
      assert.match(html,/href="#diagram-source-ref-01"/);
      assert.doesNotMatch(html,/href="#diagram-source-legacy-levels"|href="#diagram-source-legacy-hfs"/);
    }
    assert.match(html,/B = 0/);
    assert.match(html,/同一 F 内 mF 简并/);
    assert.doesNotMatch(html,/B →|Zeeman|塞曼|由原子束\/光谱实验测量得到|λ（真空）|约化矩阵元/);
  }
});

test('rendering all level details leaves canonical energies, lifetimes and HFS values unchanged',()=>{
  const before=JSON.stringify({levels:CATALOG.levels,hyperfine:CATALOG.hyperfine});
  for(const row of CORE_LEVELS) render(row.term);
  assert.equal(JSON.stringify({levels:CATALOG.levels,hyperfine:CATALOG.hyperfine}),before);
  assert.equal(renderLevelDetails(null,null),'');
});
