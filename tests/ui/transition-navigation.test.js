import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS} from '../../src/data/catalog.js';
import {initDiagramNavigation} from '../../src/ui/transition-navigation.js';

function node(attrs={}) {
  const attributes=new Map(Object.entries(attrs));
  return {style:{},dataset:{},hidden:false,
    getAttribute:name=>attributes.has(name)?attributes.get(name):null,
    setAttribute:(name,value)=>attributes.set(name,String(value)),removeAttribute:name=>attributes.delete(name)};
}
function fixture() {
  const selected=[],hashes=[],scrolls=[],focused=[],effects=[],listeners=new Map();
  const transitions=['T2','T4','R2'].map(id=>CORE_TRANSITIONS.find(row=>row.id===id));
  const lines=transitions.map(transition=>Object.assign(node(),{dataset:{id:transition.id}}));
  const unknown=Object.assign(node(),{dataset:{id:'unknown'}});
  const heading=Object.assign(node(),{focus:options=>focused.push(options)});
  const destination=Object.assign(node(),{id:'secCalc',querySelector:()=>heading,scrollIntoView:options=>scrolls.push(options)});
  const svg=Object.assign(node({role:'img','aria-label':'Original diagram'}),{
    querySelectorAll:()=>[...lines,unknown],
    addEventListener:(name,handler)=>listeners.set(name,handler),
    removeEventListener:(name,handler)=>{if(listeners.get(name)===handler)listeners.delete(name);},
    ownerDocument:{defaultView:{history:{replaceState:(state,title,hash)=>hashes.push(hash)}}}
  });
  let change,unsubscribed=0;
  const calculator={loadTransition:transition=>{selected.push(transition);change?.({transition});},onChange:callback=>{change=callback;callback({transition:transitions[0]});return()=>unsubscribed++;}};
  const options={svg,transitions,calculator,destination,hideTooltip:()=>effects.push('tooltip'),closeLevelDetails:()=>effects.push('level')};
  const api=initDiagramNavigation(options);
  function dispatch(line,type='click',key) {
    const event={type,key,target:{closest:()=>line},prevented:0,preventDefault(){this.prevented++;}};
    listeners.get(type)?.(event);return event;
  }
  return {api,options,svg,heading,lines,unknown,transitions,selected,hashes,scrolls,focused,effects,listeners,dispatch,get unsubscribed(){return unsubscribed;}};
}

test('nested transition labels select the original transition object and enter its channel workspace',()=>{
  const f=fixture();
  f.dispatch(f.lines[2]);
  assert.equal(f.selected[0],f.transitions[2]);
  assert.deepEqual(f.hashes,['#secCalc']);
  assert.deepEqual(f.scrolls,[{block:'start',behavior:'auto'}]);
  assert.deepEqual(f.focused,[{preventScroll:true}]);
  assert.deepEqual(f.effects,['tooltip','level']);
  assert.equal(f.lines[2].getAttribute('aria-pressed'),'true');
  assert.equal(f.lines[0].getAttribute('aria-pressed'),'false');
});

test('plotted choices expose named keyboard buttons instead of an opaque SVG image',()=>{
  const f=fixture();
  assert.equal(f.svg.getAttribute('role'),'group');
  assert.equal(f.heading.getAttribute('tabindex'),'-1');
  for (const line of f.lines) {
    assert.equal(line.getAttribute('role'),'button');
    assert.equal(line.getAttribute('tabindex'),'0');
    assert.equal(line.getAttribute('aria-controls'),'secCalc');
    assert.match(line.getAttribute('aria-label'),/nm，选择并跳转到超精细分量/);
  }
  assert.equal(f.unknown.getAttribute('role'),null);
});

test('Enter and Space activate once with native defaults prevented, while unrelated keys do nothing',()=>{
  const f=fixture();
  for (const key of ['Enter',' ']) assert.equal(f.dispatch(f.lines[0],'keydown',key).prevented,1);
  assert.equal(f.selected.length,2);
  assert.equal(f.dispatch(f.lines[0],'keydown','ArrowDown').prevented,0);
  assert.equal(f.selected.length,2);
});

test('filtered and unknown transitions do not navigate, but missing M2 dipole data remains selectable',()=>{
  const f=fixture();
  f.lines[0].style.pointerEvents='none';
  f.dispatch(f.lines[0]);f.dispatch(f.lines[0],'keydown','Enter');f.dispatch(f.unknown);
  assert.equal(f.selected.length,0);
  f.dispatch(f.lines[1]);
  assert.equal(f.selected[0],f.transitions[1]);
  assert.match(f.selected[0].multipole,/M2/);
});

test('initialization is idempotent and cleanup restores semantic attributes and removes callbacks',()=>{
  const f=fixture();
  assert.equal(initDiagramNavigation(f.options),f.api);
  f.api.destroy();
  assert.equal(f.listeners.size,0);
  assert.equal(f.unsubscribed,1);
  assert.equal(f.svg.getAttribute('role'),'img');
  assert.equal(f.svg.getAttribute('aria-label'),'Original diagram');
  assert.equal(f.heading.getAttribute('tabindex'),null);
  assert.equal(f.lines[0].getAttribute('role'),null);
  assert.equal(f.lines[0].getAttribute('tabindex'),null);
});

test('a line jump keeps the diagram in browser history without duplicating repeated channel entries',()=>{
  const f=fixture(),view=f.svg.ownerDocument.defaultView,pushed=[];
  view.location={hash:'#secLevel'};
  view.history.pushState=(state,title,hash)=>{pushed.push(hash);view.location.hash=hash;};
  f.dispatch(f.lines[0]);
  f.dispatch(f.lines[0]);
  assert.deepEqual(pushed,['#secCalc']);
  assert.deepEqual(f.hashes,['#secCalc']);
});
