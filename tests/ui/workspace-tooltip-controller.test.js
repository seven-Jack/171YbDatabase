import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS} from '../../src/data/catalog.js';
import {renderCompactTooltip} from '../../src/ui/compact-tooltip.js';
import {createTooltips} from '../../src/ui/tooltips.js';

const bounds=(left,right,top,bottom)=>({left,right,top,bottom,width:right-left,height:bottom-top});
function card() {
  const classes=new Set(),handlers=new Map(),children=new Set();
  return {innerHTML:'',style:{},offsetWidth:260,offsetHeight:180,handlers,children,
    classList:{add:(...values)=>values.forEach(value=>classes.add(value)),remove:(...values)=>values.forEach(value=>classes.delete(value)),contains:value=>classes.has(value),toggle:(value,force)=>{const active=force??!classes.has(value);if(active)classes.add(value);else classes.delete(value);return active;}},
    addEventListener:(type,callback)=>handlers.set(type,callback),contains:node=>children.has(node)};
}

function withController(run,{includeInfo=true}={}) {
  const previous={document:globalThis.document,window:globalThis.window,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
  const tooltip=card(),info=includeInfo?card():null,pending=new Map(),windowHandlers=new Map();
  let timerId=0;
  globalThis.document={getElementById:id=>id==='tooltip'?tooltip:id==='infoTooltip'?info:null};
  globalThis.window={innerWidth:1000,innerHeight:800,addEventListener:(type,callback)=>windowHandlers.set(type,[...(windowHandlers.get(type)||[]),callback])};
  globalThis.setTimeout=callback=>{const id=++timerId;pending.set(id,callback);return id;};
  globalThis.clearTimeout=id=>pending.delete(id);
  const flush=()=>{const callbacks=[...pending.values()];pending.clear();callbacks.forEach(callback=>callback());};
  try {run({api:createTooltips(),tooltip,info,flush,resize:()=>windowHandlers.get('resize').forEach(callback=>callback())});}
  finally {for(const [key,value] of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
}
const plotBounds=bounds(200,800,200,600);
const canvas={tagName:'CANVAS',getBoundingClientRect:()=>plotBounds};
const point=(target,x=500,y=400)=>({currentTarget:target,clientX:x,clientY:y});
const model=value=>({id:'T2',title:'Rabi 频率',rows:[{label:'Ω/2π',value,sourceIds:['internal-t2-calibration']}],footnote:'模型换算'});
const t2=CORE_TRANSITIONS.find(row=>row.id==='T2');

test('same-canvas updates change values while the workspace card position remains stable',()=>withController(({api,tooltip})=>{
  api.showCompactTooltip(point(canvas),model('32.08 MHz'),{target:canvas,plot:canvas});
  const position={...tooltip.style};
  api.showCompactTooltip(point(canvas,710,570),model('64.16 MHz'),{target:canvas,plot:canvas});
  assert.match(tooltip.innerHTML,/64\.16 MHz/);
  assert.doesNotMatch(tooltip.innerHTML,/32\.08 MHz/);
  assert.equal(tooltip.classList.contains('workspace-tooltip'),true);
  assert.equal(tooltip.classList.contains('diagram-transition-tooltip'),false);
  assert.deepEqual(tooltip.style,position);
}));

test('entering the workspace card cancels pending dismissal and allows source activation',()=>withController(({api,tooltip,flush})=>{
  api.showCompactTooltip(point(canvas),model('32.08 MHz'),{target:canvas,plot:canvas});
  api.scheduleTooltipHide();
  tooltip.handlers.get('mouseenter')();
  flush();
  assert.equal(tooltip.classList.contains('show'),true);
  assert.match(tooltip.innerHTML,/<sup class="diagram-source-marks"><a href="#diagram-source-internal-t2-calibration"/);
  tooltip.handlers.get('click')({target:{closest:selector=>selector==='a'?{}:null}});
  assert.equal(tooltip.classList.contains('show'),false);
  assert.equal(tooltip.classList.contains('workspace-tooltip'),false);
}));

test('switching workspace and main diagram cards resets presentation state instead of mixing styles',()=>withController(({api,tooltip})=>{
  api.showCompactTooltip(point(canvas),model('32.08 MHz'),{target:canvas,plot:canvas});
  api.showTooltip(point({},120,180),t2,true);
  assert.equal(tooltip.classList.contains('diagram-transition-tooltip'),true);
  assert.equal(tooltip.classList.contains('workspace-tooltip'),false);
  assert.match(tooltip.innerHTML,/diagram-transition-head/);
  assert.doesNotMatch(tooltip.innerHTML,/data-compact-tooltip/);
  assert.equal(tooltip.style.left,'134px');
  assert.equal(tooltip.style.top,'194px');
  api.showCompactTooltip(point(canvas),model('64.16 MHz'),{target:canvas,plot:canvas});
  assert.equal(tooltip.classList.contains('workspace-tooltip'),true);
  assert.equal(tooltip.classList.contains('diagram-transition-tooltip'),false);
}));

test('compact table information stays open through hover/focus transfer and closes on a source click',()=>withController(({api,tooltip,info,flush})=>{
  const table={tagName:'div',getBoundingClientRect:()=>bounds(100,900,200,700)};
  const cell={tagName:'button',getBoundingClientRect:()=>bounds(400,500,400,420),closest:()=>table};
  const child={};info.children.add(child);
  api.showCompactTooltip(point(canvas),model('32.08 MHz'),{target:canvas,plot:canvas});
  api.showInfoTooltip(cell,renderCompactTooltip(model('0.543 ea₀')));
  assert.equal(tooltip.classList.contains('show'),false);
  assert.equal(info.classList.contains('workspace-tooltip'),true);
  api.scheduleInfoTooltipHide();
  info.handlers.get('mouseenter')();
  flush();
  assert.equal(info.classList.contains('show'),true);
  info.handlers.get('focusin')();
  info.handlers.get('focusout')({relatedTarget:child});
  flush();
  assert.equal(info.classList.contains('show'),true);
  info.handlers.get('click')({target:{closest:selector=>selector==='a'?child:null}});
  assert.equal(info.classList.contains('show'),false);
}));

test('workspace cards still operate when the optional info tooltip element is absent',()=>withController(({api,tooltip,info,resize})=>{
  assert.equal(info,null);
  api.showCompactTooltip(point(canvas),model('32.08 MHz'),{target:canvas,plot:canvas});
  window.innerWidth=320;window.innerHeight=600;
  resize();
  const left=Number.parseFloat(tooltip.style.left),top=Number.parseFloat(tooltip.style.top);
  assert.ok(left>=0&&left+tooltip.offsetWidth<=320);
  assert.ok(top>=72&&top+tooltip.offsetHeight<=600);
  assert.equal(tooltip.classList.contains('show'),true);
  api.hideTooltip();
  assert.equal(tooltip.classList.contains('show'),false);
},{includeInfo:false}));
