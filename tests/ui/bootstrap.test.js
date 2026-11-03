import test from 'node:test';
import assert from 'node:assert/strict';
import {startApplication} from '../../src/bootstrap.js';

function documentFixture(){
  const nodes=Object.fromEntries(['appLoading','appError','appErrorMessage','appWorkspace'].map(id=>[id,{hidden:false,inert:false,textContent:'',attrs:{},setAttribute(k,v){this.attrs[k]=v;}}]));
  return {documentElement:{dataset:{}},getElementById:id=>nodes[id],nodes};
}
for(const dependency of ['main.js','version.js','generated-catalog.js'])test(`rejected ${dependency} module graph exposes recoverable failure`,async()=>{
  const document=documentFixture();let called=0;
  assert.equal(await startApplication({document,loadMain:async()=>{throw new TypeError(`Failed to fetch ${dependency}`);},reportError:()=>called++}),false);
  assert.equal(called,1);assert.equal(document.documentElement.dataset.appReady,'error');
  assert.equal(document.nodes.appWorkspace.inert,true);assert.equal(document.nodes.appError.hidden,false);
  assert.match(document.nodes.appErrorMessage.textContent,/当前结果不可用/);
  assert.equal(document.nodes.appLoading.hidden,true);
  // A fresh start after recovery unlocks the workspace only after initialization.
  let started=0;
  assert.equal(await startApplication({document,loadMain:async()=>({start(){started++;assert.equal(document.nodes.appWorkspace.inert,true);}})}),true);
  assert.equal(started,1);assert.equal(document.documentElement.dataset.appReady,'true');
  assert.equal(document.nodes.appWorkspace.inert,false);assert.equal(document.nodes.appError.hidden,true);
});
test('synchronous initialization failure also keeps the workspace unavailable',async()=>{
  const document=documentFixture();
  assert.equal(await startApplication({document,loadMain:async()=>({start(){throw Error('partial initialization');}}),reportError(){}}),false);
  assert.equal(document.nodes.appWorkspace.inert,true);assert.equal(document.nodes.appError.hidden,false);
});

function controlledEnvironment(){
  const document=documentFixture(),timers=new Map(),marks=[];let time=100,id=0;
  const callbacks=new Map();
  const loading=document.nodes.appLoading;
  loading.children=[];loading.append=(...children)=>loading.children.push(...children);
  document.createElement=()=>({addEventListener(type,fn){callbacks.set(this,fn);},remove(){this.removed=true;}});
  const options={document,now:()=>time,setTimer(callback,delay){const key=++id;timers.set(key,{callback,delay});return key;},clearTimer:key=>timers.delete(key),
    performance:{mark:name=>marks.push(name),measure:name=>marks.push(name)}};
  return {document,loading,timers,marks,callbacks,options,setTime:value=>time=value,
    runTimer(delay){const timer=[...timers.values()].find(timer=>timer.delay===delay);assert.ok(timer);timer.callback();}};
}

test('concurrent and repeated starts share one initialization and expose measured phases',async()=>{
  const env=controlledEnvironment();let resolveImport,loads=0,starts=0;
  const loadMain=()=>{loads++;return new Promise(resolve=>{resolveImport=resolve;});};
  const first=startApplication({...env.options,loadMain}),second=startApplication({...env.options,loadMain});
  assert.equal(first,second);await Promise.resolve();
  assert.equal(loads,1);assert.equal(env.document.documentElement.dataset.appStage,'loading-main');
  env.setTime(140);resolveImport({start(){starts++;assert.equal(env.document.documentElement.dataset.appStage,'initializing');env.setTime(155);}});
  assert.equal(await first,true);assert.equal(starts,1);
  const data=env.document.documentElement.dataset;
  assert.equal(data.appStage,'ready');assert.equal(data.appImportMs,'40');assert.equal(data.appInitMs,'15');assert.equal(data.appStartupMs,'55');
  assert.equal(env.timers.size,0);assert.ok(env.marks.includes('yb171:ready'));
  assert.equal(await startApplication({...env.options,loadMain}),true);assert.equal(loads,1);assert.equal(starts,1);
});

test('slow startup offers only a manual reload and clears recovery controls after readiness',async()=>{
  const env=controlledEnvironment();let resolveImport,reloads=0,starts=0;
  const task=startApplication({...env.options,reload:()=>reloads++,loadMain:()=>new Promise(resolve=>{resolveImport=resolve;})});
  await Promise.resolve();env.runTimer(5000);
  assert.match(env.loading.textContent,/仍在加载/);assert.equal(starts,0);
  env.runTimer(15000);const button=env.loading.children.find(value=>typeof value==='object');
  assert.equal(button.textContent,'重新加载');assert.equal(reloads,0);
  env.callbacks.get(button)();assert.equal(reloads,1);assert.equal(starts,0);
  resolveImport({start(){starts++;}});assert.equal(await task,true);
  assert.equal(button.removed,true);assert.equal(env.timers.size,0);assert.equal(starts,1);
});

test('failure records import versus initialization stage without publishing exception text',async()=>{
  const env=controlledEnvironment();let reported;
  assert.equal(await startApplication({...env.options,loadMain:()=>{throw Error('/Users/private/secret');},reportError:error=>reported=error}),false);
  assert.equal(reported.message,'/Users/private/secret');
  assert.equal(env.document.documentElement.dataset.appFailedStage,'loading-main');
  assert.doesNotMatch(env.document.nodes.appErrorMessage.textContent,/Users|secret/);
  assert.equal(env.timers.size,0);
  assert.equal(await startApplication({...env.options,loadMain:async()=>({start(){throw Error('bad initialization');}}),reportError(){}}),false);
  assert.equal(env.document.documentElement.dataset.appFailedStage,'initializing');
  assert.equal(env.timers.size,0);
  assert.equal(await startApplication({...env.options,loadMain:async()=>({start(){}})}),true);
});

test('optional timing support cannot turn a successful initialization into a failure',async()=>{
  const document=documentFixture();let started=0;
  assert.equal(await startApplication({document,loadMain:async()=>({start(){started++;}}),performance:{mark(){throw Error('not supported');},measure(){throw Error('not supported');}}}),true);
  assert.equal(started,1);assert.equal(document.documentElement.dataset.appReady,'true');
});
