import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
test('the 325nm experimental example has an isotope and a directly supported citation',()=>{
  const line=html.split('\n').find(line=>line.includes('325 nm 单光子'));
  assert.match(line,/¹⁷⁴Yb 实验示例/);assert.match(line,/2204\.07995v1#S5/);assert.match(line,/Okuno 2022 §V/);
  assert.match(line,/不据此指定 ¹⁷¹Yb/);assert.doesNotMatch(line,/实验上主要|Wilson/);
});
test('75s trapping evidence does not silently promote an unresolved C6 measurement',()=>{
  const line=html.split('\n').find(line=>line.includes('C₆ 测量出处待核查'));
  assert.match(line,/¹⁷⁴Yb 6s75s/);assert.match(line,/1912\.08754/);assert.match(line,/俘获与寿命/);
  assert.doesNotMatch(line,/已实验测量|阻塞半径 ~|Wilson 2021/);
});
