import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {build,staticModuleSpecifiers,collectStartupModules,injectStartupPreloads}=require('../../scripts/build.cjs');
const {checkArtifacts}=require('../../scripts/check-artifacts.cjs');
const generatedBlock=/<!-- Generated startup module preloads; source markup is unchanged\. -->[\s\S]*?<!-- End generated startup module preloads\. -->\n?/;
const preloadData=html=>JSON.parse(html.match(/<script type="application\/json" data-startup-preloads>([\s\S]*?)<\/script>/)[1]);
const preloadLoader=html=>html.match(/<script data-startup-preload-loader>([\s\S]*?)<\/script>/)[1];

function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'yb171-preload-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'src'),{recursive:true});
  fs.mkdirSync(path.join(root,'assets'),{recursive:true});
  fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({version:'test'}));
  fs.writeFileSync(path.join(root,'index.html'),'<!doctype html><html><head><title>before</title></head><body><svg id="levelDiagram"><path d="M0 0L1 1"/></svg><a href="assets/05.21_yb171_65s_hyperfine.csv">CSV</a><script>import(\'./src/bootstrap.js\')</script></body></html>');
  fs.writeFileSync(path.join(root,'assets/05.21_yb171_65s_hyperfine.csv'),'F,energy\n');
  fs.writeFileSync(path.join(root,'src/main.js'),"import {value} from './value.js';\nexport {value};\n");
  fs.writeFileSync(path.join(root,'src/value.js'),'export const value=1;\n');
  fs.writeFileSync(path.join(root,'src/bootstrap.js'),"export const load=()=>import('./main.js');\n");
  return root;
}

test('only actual eager declarations become startup dependencies',()=>{
  const code=[
    '// import "./line-comment.js";',
    '/* export * from "./block-comment.js"; */',
    'const quoted="import \'./quoted.js\'";',
    'const template=`import \'./template.js\'; ${`export * from \'./nested.js\';`} ${value.replace(/[{}"\'`]/g, "")}`;',
    String.raw`const pattern=/import\s+["']\.\/regex\.js["']/;`,
    String.raw`if (ready) /["'{}\x60]/.test(value);`,
    'const ratio=(a+b) / (c+d);',
    'const templateRatio=`text` / read("./not-an-import") / 2;',
    'import {value as renamed} from "./eager.js";',
    'import "./side-effect.js";',
    'export {value} from "./re-export.js";',
    'export * as namespace from "./namespace.js";',
    'const lazy=()=>import("./lazy.js");',
    'const here=import.meta.url;'
  ].join('\n');
  assert.deepEqual(staticModuleSpecifiers(code),['./eager.js','./side-effect.js','./re-export.js','./namespace.js']);
});

test('graph traversal deduplicates cycles, follows re-exports and excludes unrelated or lazy modules',t=>{
  const root=fixture(t);
  fs.writeFileSync(path.join(root,'src/main.js'),"import './value.js'; export * from './other.js'; const lazy=()=>import('./lazy.js');\n");
  fs.writeFileSync(path.join(root,'src/value.js'),"import './main.js';export const value=1;\n");
  fs.writeFileSync(path.join(root,'src/other.js'),'export const other=1;\n');
  fs.writeFileSync(path.join(root,'src/lazy.js'),'export {};\n');
  fs.writeFileSync(path.join(root,'src/unused.js'),'export {};\n');
  assert.deepEqual(collectStartupModules(root),['src/main.js','src/other.js','src/value.js']);
});

test('module URL query and hash identities retain Pages-relative hrefs',t=>{
  const root=fixture(t);
  fs.writeFileSync(path.join(root,'src/main.js'),"import './value.js?v=1&mode=a#part';\n");
  const modules=collectStartupModules(root);
  assert.deepEqual(modules,['src/main.js','src/value.js?v=1&mode=a#part']);
  const html=injectStartupPreloads('<head></head>',modules);
  assert.deepEqual(preloadData(html),modules);
  for(const href of modules)assert.ok(new URL(href,'https://example.invalid/171YbDatabase/').pathname.startsWith('/171YbDatabase/'));
});

test('unsafe, external and missing startup modules fail before replacing a previous artifact',t=>{
  const root=fixture(t);build(root,{quiet:true});
  const artifact=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
  for(const [specifier,pattern] of [
    ['./missing.js',/Missing startup module/],
    ['../../outside.js',/escapes local src/],
    ['./%2e%2e/%2e%2e/outside.js',/escapes local src/],
    ['https://example.invalid/external.js',/relative local module/],
    ['/src/value.js',/relative local module/],
    ['node:fs',/relative local module/]
  ]){
    fs.writeFileSync(path.join(root,'src/main.js'),`import '${specifier}';\n`);
    assert.throws(()=>build(root,{quiet:true}),pattern,specifier);
    assert.equal(fs.readFileSync(path.join(root,'dist/index.html'),'utf8'),artifact);
  }
});

test('startup graph refuses both file and directory symlinks',t=>{
  const root=fixture(t);
  const external=fs.mkdtempSync(path.join(os.tmpdir(),'yb171-preload-outside-'));
  t.after(()=>fs.rmSync(external,{recursive:true,force:true}));
  fs.writeFileSync(path.join(external,'secret.js'),'export const secret=1;');
  fs.symlinkSync(path.join(external,'secret.js'),path.join(root,'src/link.js'));
  fs.writeFileSync(path.join(root,'src/main.js'),"import './link.js';");
  assert.throws(()=>collectStartupModules(root),/symlink/);
  fs.symlinkSync(external,path.join(root,'src/linked-directory'));
  fs.writeFileSync(path.join(root,'src/main.js'),"import './linked-directory/secret.js';");
  assert.throws(()=>collectStartupModules(root),/symlink/);
});

test('build changes only artifact head and packages existing module bytes unchanged',t=>{
  const root=fixture(t),original=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const sourceBytes=fs.readFileSync(path.join(root,'src/value.js'));
  fs.writeFileSync(path.join(root,'src/unrelated.js'),'export {};');
  const manifest=build(root,{quiet:true});
  const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
  assert.equal(fs.readFileSync(path.join(root,'index.html'),'utf8'),original);
  assert.equal(html.replace(generatedBlock,''),original);
  assert.deepEqual(preloadData(html),['src/bootstrap.js','src/main.js','src/value.js']);
  assert.doesNotMatch(html,/<link\b[^>]*rel="modulepreload"/);
  assert.equal(preloadData(html).includes('src/unrelated.js'),false);
  assert.equal(html.match(/<svg[\s\S]*?<\/svg>/)[0],original.match(/<svg[\s\S]*?<\/svg>/)[0]);
  assert.deepEqual(fs.readFileSync(path.join(root,'dist/src/value.js')),sourceBytes);
  assert.ok(manifest.files.some(file=>file.path==='src/value.js'));
  assert.doesNotThrow(()=>checkArtifacts(path.join(root,'dist'),{quiet:true}));
});

test('preload insertion is deterministic, de-duplicates existing links and preserves minimal fixtures',()=>{
  const first=injectStartupPreloads('<head><link rel="modulepreload" href="src/main.js"></head>',['src/main.js','src/value.js']);
  assert.equal((first.match(/href="src\/main\.js"/g)||[]).length,1);
  assert.deepEqual(preloadData(first),['src/value.js']);
  assert.equal(injectStartupPreloads(first,['src/main.js','src/value.js']),first);
  assert.match(injectStartupPreloads('<script type="module" src="src/main.js"></script>',['src/main.js']),/modulepreload[\s\S]*<script/);
});

test('generated loader adds links only on HTTP(S), while file launches never inspect or request modules',()=>{
  const modules=['src/main.js','src/value.js?v=1&mode=a#part'],html=injectStartupPreloads('<head></head>',modules);
  const loader=preloadLoader(html);new vm.Script(loader);
  for(const protocol of ['http:','https:']){
    const links=[];
    vm.runInNewContext(loader,{location:{protocol},document:{querySelector:()=>({textContent:JSON.stringify(modules)}),createElement:()=>({}),head:{appendChild:link=>links.push(link)}}});
    assert.deepEqual(links.map(link=>link.href),modules);assert.ok(links.every(link=>link.rel==='modulepreload'));
  }
  for(const protocol of ['file:','data:','about:']){
    let touches=0;
    vm.runInNewContext(loader,{location:{protocol},document:{querySelector(){touches++;throw Error('must not access module list');},createElement(){touches++;throw Error('must not create links');}}});
    assert.equal(touches,0);
  }
});

test('inert preload JSON escapes script terminators and unicode separators without changing URLs',()=>{
  const modules=['src/value.js?text=</script><script>alert(1)</script>\u2028\u2029'];
  const html=injectStartupPreloads('<head></head>',modules);
  assert.deepEqual(preloadData(html),modules);
  assert.equal((html.match(/<script\b/g)||[]).length,2);
  assert.doesNotMatch(html,/<script>alert/);
  assert.match(html,/\\u003c\/script>/);assert.match(html,/\\u2028/);assert.match(html,/\\u2029/);
});

test('HTTP preload loader follows encoding/title metadata and precedes the first stylesheet',()=>{
  const original='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>¹⁷¹Yb 数据</title>\n<link rel="stylesheet" href="src/first.css"><link rel="stylesheet" href="src/second.css"></head><body></body></html>';
  const modules=Array.from({length:80},(_,index)=>`src/module-${index}.js`);
  const html=injectStartupPreloads(original,modules),start=html.indexOf('<!-- Generated startup module preloads;'),end=html.indexOf('<!-- End generated startup module preloads. -->');
  assert.ok(html.indexOf('<meta charset="UTF-8">')<1024);
  assert.ok(html.indexOf('</title>')<start);
  assert.ok(end<html.indexOf('<link rel="stylesheet" href="src/first.css">'));
  assert.equal(html.replace(generatedBlock,''),original);
});

test('artifact checks validate every inert preload URL rather than skipping its JSON',t=>{
  const root=fixture(t);build(root,{quiet:true});
  const file=path.join(root,'dist/index.html'),manifestFile=path.join(root,'dist/artifact-manifest.json');
  const original=fs.readFileSync(file,'utf8');
  const update=payload=>{
    const html=original.replace(/(<script type="application\/json" data-startup-preloads>)[\s\S]*?(<\/script>)/,(_,open,close)=>open+payload+close);
    fs.writeFileSync(file,html);
    const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8')),entry=manifest.files.find(item=>item.path==='index.html');
    entry.bytes=Buffer.byteLength(html);entry.sha256=require('node:crypto').createHash('sha256').update(html).digest('hex');
    fs.writeFileSync(manifestFile,JSON.stringify(manifest));
  };
  for(const [payload,pattern]of [
    ['not json',/Invalid startup preload JSON/],
    [JSON.stringify({url:'src/main.js'}),/module URL array/],
    [JSON.stringify([42]),/module URL array/],
    [JSON.stringify(['https://example.invalid/x.js']),/relative src module/],
    [JSON.stringify(['/src/main.js']),/relative src module/],
    [JSON.stringify(['src/../../outside.js']),/escapes local src/],
    [JSON.stringify(['src/../assets/x.js']),/escapes local src/],
    [JSON.stringify(['src/%2e%2e/%2e%2e/outside.js']),/escapes local src/],
    [JSON.stringify(['src/missing.js']),/Missing built resource/],
    [JSON.stringify(['src/main.js','src/main.js']),/Duplicate startup preload/]
  ]){update(payload);assert.throws(()=>checkArtifacts(path.join(root,'dist'),{quiet:true}),pattern);}
});
