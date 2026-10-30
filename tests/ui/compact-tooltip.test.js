import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG} from '../../src/data/catalog.js';
import {renderCompactTooltip,positionWorkspaceTooltip} from '../../src/ui/compact-tooltip.js';

test('compact tooltip models escape display text and render only registered source references',()=>{
  const model={id:'T<img src=x>',title:'<script>alert("title")</script>',rows:[{
    label:'<b>label</b>',value:'<img src=x onerror="alert(1)">',note:'<a href="javascript:x">note</a>',
    sourceIds:['ref-01','ref-01','unknown"><img src=x>']
  }],footnote:'<style>body{display:none}</style>'};
  const before=JSON.stringify(model),catalogBefore=JSON.stringify(CATALOG.sources);
  const html=renderCompactTooltip(model);
  assert.match(html,/data-compact-tooltip/);
  assert.match(html,/T&lt;img src=x&gt;/);
  assert.match(html,/&lt;script&gt;alert\(&quot;title&quot;\)&lt;\/script&gt;/);
  assert.match(html,/&lt;b&gt;label&lt;\/b&gt;/);
  assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html,/&lt;a href=&quot;javascript:x&quot;&gt;note&lt;\/a&gt;/);
  assert.match(html,/&lt;style&gt;body\{display:none\}&lt;\/style&gt;/);
  assert.match(html,/<sup class="diagram-source-marks"><a href="#diagram-source-ref-01"/);
  assert.equal((html.match(/href="#diagram-source-/g)||[]).length,1);
  assert.doesNotMatch(html,/<script|<img|<style|href="javascript:|diagram-source-unknown/);
  assert.equal(JSON.stringify(model),before);
  assert.equal(JSON.stringify(CATALOG.sources),catalogBefore);
});

test('empty compact content does not invent data or references',()=>{
  const html=renderCompactTooltip();
  assert.match(html,/class="compact-tooltip-content"/);
  assert.doesNotMatch(html,/compact-tooltip-row|diagram-source-marks|compact-tooltip-foot|compact-tooltip-id/);
});

function withViewport(width,height,run) {
  const previous=globalThis.window;
  globalThis.window={innerWidth:width,innerHeight:height};
  try {run();} finally {if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
}
const bounds=(left,right,top,bottom)=>({left,right,top,bottom,width:right-left,height:bottom-top});
const boxOf=card=>({left:Number.parseFloat(card.style.left),right:Number.parseFloat(card.style.left)+card.offsetWidth,top:Number.parseFloat(card.style.top),bottom:Number.parseFloat(card.style.top)+card.offsetHeight});
const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;

test('workspace cards use room outside the active plot and stay within the viewport',()=>withViewport(1450,900,()=>{
  const plot=bounds(340,1100,100,820),target={tagName:'button',getBoundingClientRect:()=>bounds(650,790,400,408)};
  const card={offsetWidth:284,offsetHeight:200,style:{}};
  positionWorkspaceTooltip(card,target,{tagName:'div',getBoundingClientRect:()=>plot});
  const chosen=boxOf(card);
  assert.equal(overlap(chosen,plot),false);
  assert.ok(chosen.left>=12&&chosen.right<=1438&&chosen.top>=72&&chosen.bottom<=888);
}));

test('SVG workspace positioning respects transformed line coordinates instead of raw local values',()=>withViewport(800,700,()=>{
  const line={...Object.fromEntries(['x1','y1','x2','y2'].map((key,i)=>[key,{baseVal:{value:[50,72,50,688][i]}}])),getScreenCTM:()=>({a:1,b:0,c:0,d:1,e:600,f:0})};
  const plot={tagName:'svg',getBoundingClientRect:()=>bounds(0,800,72,700),querySelectorAll:selector=>selector==='line'?[line]:[]};
  const target={tagName:'line',getBoundingClientRect:()=>bounds(740,760,350,370)};
  const card={offsetWidth:250,offsetHeight:200,style:{}};
  positionWorkspaceTooltip(card,target,plot);
  const chosen=boxOf(card);
  assert.ok(chosen.right<650||chosen.left>650,'the transformed full-height line at x=650 must remain visible');
  assert.equal(overlap(chosen,target.getBoundingClientRect()),false);
}));

test('workspace positioning handles missing targets without mutating the card',()=>{
  const card={style:{left:'17px',top:'19px'}};
  positionWorkspaceTooltip(card,null);
  positionWorkspaceTooltip(null,{});
  assert.deepEqual(card.style,{left:'17px',top:'19px'});
});
