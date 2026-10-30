import test from 'node:test';
import assert from 'node:assert/strict';
import {bindAxisMaximumInput} from '../../src/ui/chart-ranges.js';

function fixture({nativeChangeOnBlur=false,value='400'}={}) {
  const listeners=new Map(),effects=[];
  const input={
    value,
    addEventListener(type,handler){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(handler);},
    removeEventListener(type,handler){listeners.get(type)?.delete(handler);},
    blur(){effects.push('blur');if(nativeChangeOnBlur)emit('change');emit('blur');}
  };
  function emit(type,properties={}){
    const event={type,target:input,defaultPrevented:false,...properties,preventDefault(){this.defaultPrevented=true;}};
    for(const handler of [...(listeners.get(type)||[])])handler(event);
    return event;
  }
  let mode='manual',commits=0,syncs=0;
  const api=bindAxisMaximumInput(input,{
    commit(){
      commits++;effects.push('commit');
      // Clearing restores automatic mode; its freshly computed visible value
      // must not be interpreted as a second manual edit by a blur-time change.
      mode=input.value.trim()===''?'auto':'manual';
      if(mode==='auto')input.value='210';
    },
    sync(){syncs++;effects.push('sync');}
  });
  return {input,emit,api,listeners,effects,get mode(){return mode;},get commits(){return commits;},get syncs(){return syncs;}};
}

test('Enter explicitly submits and synchronizes an endpoint even without a native change event',()=>{
  const f=fixture();
  const event=f.emit('keydown',{key:'Enter'});
  assert.equal(event.defaultPrevented,true);
  assert.equal(f.commits,1);
  assert.equal(f.syncs,1);
  assert.deepEqual(f.effects,['commit','blur','sync']);
});

test('a synchronous change during Enter-triggered blur does not convert a restored automatic value back to manual',()=>{
  const f=fixture({nativeChangeOnBlur:true,value:''});
  f.emit('keydown',{key:'Enter'});
  assert.equal(f.commits,1);
  assert.equal(f.syncs,1);
  assert.equal(f.mode,'auto');
  assert.equal(f.input.value,'210');
  assert.deepEqual(f.effects,['commit','blur','sync']);
});

test('ordinary native change and blur retain their independent submit and sync behavior',()=>{
  const f=fixture();
  f.emit('change');
  assert.equal(f.commits,1);assert.equal(f.syncs,0);
  f.emit('blur');
  assert.equal(f.commits,1);assert.equal(f.syncs,1);
  assert.equal(f.mode,'manual');
  assert.deepEqual(f.effects,['commit','sync']);
});

test('other editing and navigation keys are not intercepted or submitted',()=>{
  const f=fixture();
  for(const key of ['ArrowUp','ArrowDown','Tab','Escape',' ','0']){
    assert.equal(f.emit('keydown',{key}).defaultPrevented,false);
  }
  assert.equal(f.commits,0);assert.equal(f.syncs,0);
  assert.deepEqual(f.effects,[]);
});

test('destroy removes all endpoint event handlers',()=>{
  const f=fixture({nativeChangeOnBlur:true});
  f.api.destroy();
  for(const callbacks of f.listeners.values())assert.equal(callbacks.size,0);
  assert.equal(f.emit('keydown',{key:'Enter'}).defaultPrevented,false);
  f.emit('change');f.emit('blur');
  assert.equal(f.commits,0);assert.equal(f.syncs,0);
});
