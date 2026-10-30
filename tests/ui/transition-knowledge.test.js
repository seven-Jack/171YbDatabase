import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS,getTransitionRecord} from '../../src/data/catalog.js';
import {buildKnowledgeView,renderKnowledgeHTML,initTransitionKnowledge} from '../../src/ui/transition-knowledge.js';

test('knowledge relations follow canonical endpoint IDs including opposite endpoints',()=>{
  const view=buildKnowledgeView('T3',CORE_TRANSITIONS);
  const r2=view.related.find(item=>item.id==='R2');
  assert.deepEqual(r2.sharedLevels,[{id:'yb171-6s6p-3p0',term:'³P₀',selectedEndpoint:'upper',relatedEndpoint:'lower'}]);
  assert.equal(view.transition.lower.parity,'偶宇称');
  assert.equal(view.transition.upper.J,'0');
  assert.deepEqual(view.related.map(item=>item.id),['T1','T2','T4','T5','T6','R2']);
  assert.ok(!view.related.some(item=>item.id==='T7'));
  const t6=buildKnowledgeView('T6',CORE_TRANSITIONS);
  assert.ok(t6.related.find(item=>item.id==='T7').sharedLevels.some(level=>level.selectedEndpoint==='upper'&&level.relatedEndpoint==='upper'));
});

test('display names cannot create relations and duplicate or unknown rows are ignored',()=>{
  const rows=[...CORE_TRANSITIONS,{...CORE_TRANSITIONS[0]}, {id:'unknown',lower:'³P₀',upper:'³S₁'}].map(row=>({...row,lower:'fake shared name',upper:'fake shared name'}));
  const view=buildKnowledgeView('T3',rows);
  assert.equal(view.related.length,6);
  assert.ok(!view.related.some(item=>item.id==='unknown'||item.id==='T7'));
  assert.equal(view.transition.lower.term,'¹S₀');
  assert.equal(buildKnowledgeView('T3',[]).related.length,0);
});

test('source index binds every field to its own source without merging calculation and scaling',()=>{
  const view=buildKnowledgeView('R2',CORE_TRANSITIONS);
  const allFields=view.sources.flatMap(source=>source.fields.map(field=>({field,sourceId:source.id})));
  assert.equal(allFields.length,Object.keys(getTransitionRecord('R2').quantities).length);
  for (const {field,sourceId} of allFields) assert.equal(getTransitionRecord('R2').quantities[field.key].sourceId,sourceId);
  assert.deepEqual(view.sources.find(source=>source.id==='ref-17').fields.map(field=>field.key),['d_num']);
  const scaling=view.sources.find(source=>source.id==='legacy-scaling');
  assert.equal(scaling.fields.find(field=>field.key==='lifetime_ns').kind,'由标度估算推导');
  assert.equal(scaling.fields.find(field=>field.key==='wavelength_vac_nm').kind,'标度估算');
  assert.ok(view.sources.every(source=>source.fields.every(field=>field.review==='定义待核查'||field.review==='定义待核查')));
});

test('missing E1 data and absent calculation artifacts remain explicit',()=>{
  const missing=buildKnowledgeView('T4',CORE_TRANSITIONS).sources.flatMap(source=>source.fields).find(field=>field.key==='d_num');
  assert.equal(missing.missing,true);
  assert.match(missing.missingText,/缺少适用的 E1/);
  const r2=buildKnowledgeView('R2',CORE_TRANSITIONS);
  assert.equal(r2.sources.find(source=>source.id==='ref-17').fields[0].missingArtifact,true);
  const html=renderKnowledgeHTML(r2);
  assert.match(html,/Notebook \/ Run 及版本定位待补充/);
  assert.match(html,/定义待核查/);
  assert.doesNotMatch(html,/已验证|独立验证通过|推荐路径/);
});

test('no selection and unknown IDs produce an honest empty index',()=>{
  assert.equal(buildKnowledgeView(null,CORE_TRANSITIONS).status,'unselected');
  assert.equal(buildKnowledgeView('unknown',CORE_TRANSITIONS).status,'unknown');
  assert.deepEqual(buildKnowledgeView('unknown',CORE_TRANSITIONS).sources,[]);
  assert.match(renderKnowledgeHTML(buildKnowledgeView('unknown',CORE_TRANSITIONS)),/没有对应的目录记录/);
});

test('initial relation list has three entries and remaining entries use native disclosure',()=>{
  const html=renderKnowledgeHTML(buildKnowledgeView('T3',CORE_TRANSITIONS));
  const beforeDisclosure=html.slice(0,html.indexOf('<details class="knowledge-more">'));
  assert.equal((beforeDisclosure.match(/data-knowledge-transition=/g)||[]).length,3);
  assert.match(html,/<summary>展开其余 3 条关联<\/summary>/);
  assert.equal((html.match(/<button /g)||[]).length,6);
  assert.ok((html.match(/<button [^>]*type="button"/g)||[]).length===6);
});

test('rendered labels, attributes and source URLs cannot inject markup or script links',()=>{
  const view=buildKnowledgeView('T3',CORE_TRANSITIONS.map(row=>({...row,label:'<img src=x onerror="alert(1)">'})));
  view.sources[0].url='javascript:alert(1)';
  view.sources[0].title='<script>alert(1)</script>';
  view.related[0].id='T1" onclick="alert(1)';
  const html=renderKnowledgeHTML(view);
  assert.match(html,/&lt;img/);
  assert.match(html,/&lt;script/);
  assert.match(html,/data-knowledge-transition="T1&quot; onclick=&quot;alert\(1\)"/);
  assert.doesNotMatch(html,/<img|<script|href="javascript:| onclick="/);
  view.sources[0].url='https://example.org/paper?q="quoted"';
  assert.match(renderKnowledgeHTML(view),/target="_blank" rel="noopener noreferrer"/);
});

test('related buttons load the original decorated object and repeated state keeps disclosure intact',()=>{
  const listeners=new Map();
  const host={innerHTML:'',classList:{add(){}},addEventListener(name,fn){listeners.set(name,fn);},removeEventListener(name){listeners.delete(name);},contains(button){return button.inHost;}};
  const rows=CORE_TRANSITIONS.map(row=>({...row,decorated:true}));
  const loaded=[];
  let publish,unsubscribed=false;
  const calculator={onChange(fn){publish=fn;fn({transition:rows.find(row=>row.id==='T3')});return ()=>{unsubscribed=true;};},loadTransition(row){loaded.push(row);}};
  const api=initTransitionKnowledge({transitions:rows,calculator,host});
  assert.equal(initTransitionKnowledge({transitions:rows,calculator,host}),api);
  host.innerHTML='preserved disclosure';
  publish({transition:rows.find(row=>row.id==='T3'),P_mW:20});
  assert.equal(host.innerHTML,'preserved disclosure');
  const button={inHost:true,dataset:{knowledgeTransition:'R2'}};
  listeners.get('click')({target:{closest(){return button;}}});
  assert.equal(loaded[0],rows.find(row=>row.id==='R2'));
  button.dataset.knowledgeTransition='unknown';
  listeners.get('click')({target:{closest(){return button;}}});
  assert.equal(loaded.length,1);
  api.destroy();
  assert.equal(unsubscribed,true);
  assert.equal(listeners.size,0);
});
