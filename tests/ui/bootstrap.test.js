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
