import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS} from '../../src/data/catalog.js';
import {createTooltips} from '../../src/ui/tooltips.js';

function withTooltip(run) {
  const previous={document:globalThis.document,window:globalThis.window,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
  const classes=new Set(),handlers=new Map(),windowHandlers=new Map(),pending=new Map();
  let nextTimer=0;
  const tooltip={innerHTML:'',style:{},classList:{add:(...names)=>names.forEach(name=>classes.add(name)),remove:(...names)=>names.forEach(name=>classes.delete(name)),contains:name=>classes.has(name)},
    offsetWidth:260,offsetHeight:180,
    addEventListener:(type,handler)=>handlers.set(type,handler),contains:()=>false};
  const line={x1:{baseVal:{value:420}},y1:{baseVal:{value:90}},x2:{baseVal:{value:420}},y2:{baseVal:{value:700}},getScreenCTM:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
  const obstacles={'.transition-line .hit-zone':[line],'.core-level-group > line:first-child':[{getBoundingClientRect:()=>({left:400,right:550,top:400,bottom:400})}],'.core-level-group text':[{getBoundingClientRect:()=>({left:555,right:600,top:388,bottom:406})}]};
  const svg={getBoundingClientRect:()=>({left:0,right:1000,top:72,bottom:800}),querySelectorAll:selector=>obstacles[selector]||[]};
  const target={ownerSVGElement:svg,querySelector:()=>({getBoundingClientRect:()=>({left:410,right:430,top:350,bottom:400})})};
  globalThis.document={getElementById:id=>id==='tooltip'?tooltip:null};
  globalThis.window={innerWidth:1000,innerHeight:800,addEventListener:(type,handler)=>windowHandlers.set(type,[...(windowHandlers.get(type)||[]),handler])};
  globalThis.setTimeout=fn=>{const id=++nextTimer;pending.set(id,fn);return id;};
  globalThis.clearTimeout=id=>pending.delete(id);
  try {
    run({api:createTooltips(),tooltip,target,handlers,resize:()=>windowHandlers.get('resize').forEach(fn=>fn()),flushTimers:()=>{const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn());}});
  } finally {
    for(const [key,value] of Object.entries(previous)) {if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
  }
}
const t=CORE_TRANSITIONS.find(row=>row.id==='T2');
const point=(target,x=420,y=380)=>({currentTarget:target,clientX:x,clientY:y});

test('main transition cards avoid an actual line and stay stationary while moving on the same transition',()=>withTooltip(({api,tooltip,target})=>{
  api.showTooltip(point(target),t,true,target);
  assert.equal(tooltip.classList.contains('show'),true);
  assert.equal(tooltip.classList.contains('diagram-transition-tooltip'),true);
  const left=Number.parseFloat(tooltip.style.left),top=Number.parseFloat(tooltip.style.top);
  assert.ok(left+tooltip.offsetWidth<420||left>420,'the chosen card must leave the full-height transition visible');
  assert.ok(top>=72&&top+tooltip.offsetHeight<=788);
  api.moveTooltip(point(target,700,650));
  assert.equal(tooltip.style.left,left+'px');
  assert.equal(tooltip.style.top,top+'px');
}));

test('shared secondary diagrams restore cursor-follow mode and cancel a pending main-card dismissal',()=>withTooltip(({api,tooltip,target,flushTimers})=>{
  api.showTooltip(point(target),t,true,target);
  api.scheduleTooltipHide();
  api.moveTooltip(point({},100,200));
  assert.equal(tooltip.classList.contains('diagram-transition-tooltip'),false);
  assert.equal(tooltip.style.left,'114px');
  assert.equal(tooltip.style.top,'214px');
  flushTimers();
  assert.equal(tooltip.classList.contains('show'),true);
  api.moveTooltip(point({},140,240));
  assert.equal(tooltip.style.left,'154px');
  assert.equal(tooltip.style.top,'254px');
}));

test('hiding a main card clears its target and timer before later shared-tooltip use',()=>withTooltip(({api,tooltip,target,flushTimers})=>{
  api.showTooltip(point(target),t,true,target);
  api.scheduleTooltipHide();
  api.hideTooltip();
  assert.equal(tooltip.classList.contains('show'),false);
  assert.equal(tooltip.classList.contains('diagram-transition-tooltip'),false);
  tooltip.classList.add('show');
  api.moveTooltip(point(target,120,180));
  assert.equal(tooltip.style.left,'134px');
  assert.equal(tooltip.style.top,'194px');
  flushTimers();
  assert.equal(tooltip.classList.contains('show'),true);
}));

test('a visible main card recomputes its placement within the resized viewport',()=>withTooltip(({api,tooltip,target,resize})=>{
  api.showTooltip(point(target),t,true,target);
  window.innerWidth=320;window.innerHeight=600;
  resize();
  const left=Number.parseFloat(tooltip.style.left),top=Number.parseFloat(tooltip.style.top);
  assert.ok(left>=0&&left+tooltip.offsetWidth<=320);
  assert.ok(top>=72&&top+tooltip.offsetHeight<=600);
}));
