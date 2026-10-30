import test from 'node:test';
import assert from 'node:assert/strict';
import {preventNumberInputWheelChanges} from '../../src/ui/number-input-wheel.js';

function fixture() {
  let listener,options,blurs=0;
  const input={readOnly:false,blur(){blurs++;root.ownerDocument.activeElement=null;}};
  const root={ownerDocument:{activeElement:input},contains:node=>node===input,
    addEventListener:(type,fn,config)=>{assert.equal(type,'wheel');listener=fn;options=config;},
    removeEventListener:(type,fn,capture)=>{assert.equal(type,'wheel');assert.equal(fn,listener);assert.equal(capture,true);listener=null;}};
  const api=preventNumberInputWheelChanges(root);
  return {root,input,api,get blurs(){return blurs;},get options(){return options;},get listener(){return listener;},
    wheel(target=input){listener({target:{closest:selector=>{assert.equal(selector,'input[type="number"]');return target;}},preventDefault(){throw Error('Page scrolling must remain native');}});}};
}

test('scrolling a focused numeric field ends editing before native number stepping, without canceling page scrolling',()=>{
  const f=fixture();f.wheel();assert.equal(f.blurs,1);
  assert.deepEqual(f.options,{capture:true,passive:true});assert.equal(f.root.ownerDocument.activeElement,null);
});
test('hovered, read-only and unrelated fields keep their focus and state',()=>{
  const f=fixture();f.input.readOnly=true;f.wheel();assert.equal(f.blurs,0);
  f.input.readOnly=false;f.root.ownerDocument.activeElement=null;f.wheel();f.wheel({});f.wheel(null);
  assert.equal(f.blurs,0);
});
test('initialization is idempotent and teardown removes the wheel guard',()=>{
  const f=fixture();assert.equal(preventNumberInputWheelChanges(f.root),f.api);
  f.api.destroy();assert.equal(f.listener,null);assert.doesNotThrow(()=>preventNumberInputWheelChanges(null).destroy());
});
