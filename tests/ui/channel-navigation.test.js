import test from 'node:test';
import assert from 'node:assert/strict';
import { createChannelNavigation } from '../../src/ui/channel-navigation.js';

function fixture({headingIndex=null}={}) {
  const attributes=new Map(headingIndex===null?[]:[['tabindex',headingIndex]]);
  const effects=[],positions=['#secCalc'];
  let position=0;
  const view={
    location:{hash:'#secCalc'},
    history:{
      pushState(state,title,hash){positions.splice(position+1);positions.push(hash);position++;view.location.hash=hash;},
      replaceState(state,title,hash){positions[position]=hash;view.location.hash=hash;},
      back(){position=Math.max(0,position-1);view.location.hash=positions[position];}
    }
  };
  const heading={
    getAttribute:name=>attributes.has(name)?attributes.get(name):null,
    setAttribute:(name,value)=>attributes.set(name,String(value)),
    focus:options=>effects.push(['focus',options])
  };
  const destination={id:'secRabi',querySelector:()=>heading,
    scrollIntoView:options=>effects.push(['scroll',options]),ownerDocument:{defaultView:view}};
  const navigate=createChannelNavigation({destination,view,hideTooltip:()=>effects.push(['hide'])});
  return {navigate,destination,heading,view,effects,positions};
}

test('selecting a channel enters Rabi while preserving a way back to the channel workspace',()=>{
  const f=fixture();
  f.navigate();
  assert.equal(f.view.location.hash,'#secRabi');
  assert.deepEqual(f.positions,['#secCalc','#secRabi']);
  f.view.history.back();
  assert.equal(f.view.location.hash,'#secCalc');
});

test('repeated channel activation does not accumulate duplicate Rabi history entries',()=>{
  const f=fixture();
  f.navigate();f.navigate();f.navigate();
  assert.deepEqual(f.positions,['#secCalc','#secRabi']);
  f.view.history.back();
  assert.equal(f.view.location.hash,'#secCalc');
});

test('the jump clears the channel tooltip and transfers keyboard focus without a second scroll',()=>{
  const f=fixture();
  f.navigate();
  assert.equal(f.heading.getAttribute('tabindex'),'-1');
  assert.deepEqual(f.effects.filter(effect=>effect[0]==='hide'),[['hide']]);
  assert.deepEqual(f.effects.filter(effect=>effect[0]==='focus'),[['focus',{preventScroll:true}]]);
  assert.deepEqual(f.effects.filter(effect=>effect[0]==='scroll'),[['scroll',{block:'start',behavior:'auto'}]]);
});

test('navigation preserves an existing heading tab order',()=>{
  const f=fixture({headingIndex:'0'});
  f.navigate();
  assert.equal(f.heading.getAttribute('tabindex'),'0');
});

test('a missing Rabi destination is harmless and does not clear unrelated UI',()=>{
  let hidden=0;
  const navigate=createChannelNavigation({hideTooltip:()=>hidden++});
  assert.equal(typeof navigate,'function');
  assert.doesNotThrow(()=>navigate());
  assert.equal(hidden,0);
});
