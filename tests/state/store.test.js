import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalculatorStore } from '../../src/state/store.js';

test('published state cannot be changed by a chart consumer', () => {
  const store = createCalculatorStore({ selectedChannel: { matEl: 1 }, P_mW: 1 });
  const snapshot = store.getState();
  assert.throws(() => { snapshot.P_mW = 2; }, TypeError);
  assert.throws(() => { snapshot.selectedChannel.matEl = 3; }, TypeError);
  store.editor.P_mW = 4;
  assert.equal(snapshot.P_mW, 1);
  assert.equal(store.getState().P_mW, 4);
});
test('batched editing publishes one coherent snapshot and exposes listener failures', () => {
  const errors = [], seen = [];
  const store = createCalculatorStore({ P_mW: 1, w_um: 50 }, e => errors.push(e.message));
  const stop = store.subscribe(s => seen.push([s.P_mW, s.w_um]));
  store.subscribe(() => { if (store.getState().P_mW === 4) throw Error('broken subscriber'); });
  store.editor.P_mW = 4; store.editor.w_um = 75;
  store.publish(); store.publish();
  assert.deepEqual(seen, [[1, 50], [4, 75]]);
  assert.deepEqual(errors, ['broken subscriber']);
  stop(); store.dispatch({ type: 'patch', patch: { P_mW: 8 } });
  assert.equal(seen.length, 2);
});
test('a derived result never lets later views regress to an older revision', () => {
  const store=createCalculatorStore({power:1,result:1});
  store.subscribe(s=>{if(s.result!==s.power*2)store.dispatch({type:'patch',patch:{result:s.power*2}});});
  const snapshots=[];
  store.subscribe(s=>snapshots.push([s.revision,s.power,s.result]));
  store.dispatch({type:'patch',patch:{power:4}});
  assert.equal(snapshots.at(-1)[2],8);
  assert.ok(snapshots.every((s,i)=>i===0||s[0]>=snapshots[i-1][0]));
  assert.ok(snapshots.every(([,power,result])=>result===power*2));
});
