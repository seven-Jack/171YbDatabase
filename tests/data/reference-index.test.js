import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const script=fileURLToPath(new URL('../../references/build-index.py',import.meta.url));
const exports=['index.json','index.csv','references.bib','original-library-integrity.json','missing-downloads.json','missing-downloads.md'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const writeJSON=(root,file,data)=>{const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(data,null,2)+'\n');};
const readJSON=(root,file)=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const source=(id,title,doi)=>({id,title,detail:title,doi,authors:['Fixture Author'],year:2026,publication:'Fixture journal',referenceNumber:1,identityStatus:'fixture-metadata',supplementalIndex:'fixture'});

function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'yb-reference-index-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const sources=['a','b','c'].map(x=>source('source-'+x,'Paper '+x,'10.1234/'+x));
  const docs=['a','b','c'].map((x,i)=>{
    const bytes=Buffer.from('%PDF-fixture '+x+'\n');
    const rel='references/papers/'+x+'.pdf';
    fs.mkdirSync(path.join(root,'references/papers'),{recursive:true});fs.writeFileSync(path.join(root,rel),bytes);
    return {path:rel,sha256:hash(bytes),bytes:bytes.length,pages:i+1,sourceIds:['source-'+x],urls:['https://example.test/'+x],versionNote:'registered version '+x};
  });
  const original=path.join(root,'originals','a.pdf');fs.mkdirSync(path.dirname(original),{recursive:true});fs.copyFileSync(path.join(root,docs[0].path),original);
  const attachment='references/local-only/source.tex';fs.mkdirSync(path.dirname(path.join(root,attachment)),{recursive:true});fs.writeFileSync(path.join(root,attachment),'fixture attachment');
  const attachmentDoc={path:attachment,sha256:hash('fixture attachment'),bytes:Buffer.byteLength('fixture attachment')};
  writeJSON(root,'data/sources.json',{references:[sources[0]],sources:[]});
  writeJSON(root,'references/bibliography-audit.json',{records:[{oldSourceId:'source-a',localArtifacts:[{path:docs[0].path,sha256:docs[0].sha256}]}],supplementalOriginalReferences:[]});
  writeJSON(root,'references/download-validation.json',[]);
  writeJSON(root,'references/local-library-inventory.json',[{path:original,sha256:docs[0].sha256}]);
  writeJSON(root,'data/literature/rydberg-audit/source-manifest.json',[]);
  writeJSON(root,'references/document-metadata-20261031.json',{checkedOn:'2026-10-31',documents:[docs[0]]});
  writeJSON(root,'references/clock-rabi-sources-20261030.json',{checkedOn:'2026-10-30',sources:[sources[1]],documents:[docs[1]]});
  writeJSON(root,'references/rabi-crosscheck-sources-20261031.json',{checkedOn:'2026-10-31',sources:[sources[2]],documents:[{...docs[2],identityReview:{status:'fixture-manual-review'}}],attachments:[attachmentDoc]});
  const row={kroezeReferenceNumber:1,resolvedSourceId:'source-a',doi:'10.1234/a',status:'local-fulltext-indexed;field-specific-validation-still-required',citationAsExtracted:'[1] Paper a',affectedFields:['T3.d_num'],localDocuments:[docs[0].path]};
  writeJSON(root,'references/primary-source-queue.json',{count:1,items:[row]});
  fs.writeFileSync(path.join(root,'references/primary-source-queue.csv'),'kroezeReferenceNumber,resolvedSourceId,doi,status,citationAsExtracted,affectedFields,localDocuments\n1,source-a,10.1234/a,local-fulltext-indexed;field-specific-validation-still-required,[1] Paper a,T3.d_num,'+docs[0].path+'\n');
  fs.writeFileSync(path.join(root,'references/primary-source-queue.md'),'| Kroeze编号 | 文献 | 全文状态 |\n|---|---|---|\n| [1] | Paper a | 已索引 |\n');
  return {root,docs,original,attachment};
}

function run(root,...args){return spawnSync('python3',['-B',script,'--root',root,...args],{encoding:'utf8'});}
function success(result){assert.equal(result.status,0,result.stderr||result.stdout);return JSON.parse(result.stdout);}
function snapshot(root){return Object.fromEntries(exports.map(file=>{const p=path.join(root,'references',file);return [file,fs.existsSync(p)?{hash:hash(fs.readFileSync(p)),mtime:fs.statSync(p).mtimeMs}:null];}));}

test('reference exports require explicit writing, include both supplemental registries, and preserve version/identity boundaries',t=>{
  const {root}=fixture(t);const before=snapshot(root);
  const check=run(root);assert.equal(check.status,1);assert.equal(JSON.parse(check.stdout).mode,'check');assert.deepEqual(snapshot(root),before);
  const written=success(run(root,'--write'));assert.equal(written.counts.sourceRecords,4);assert.equal(written.counts.pdfFiles,3);assert.equal(written.localPdfs.verified,3);assert.equal(written.attachments.verified,1);
  const index=readJSON(root,'references/index.json');assert.equal(index.checkedAt,'2026-10-31');assert.equal(index.sources.length,4);
  assert.match(index.documents[0].versionNoteBoundary,/Historical source-level note/);
  assert.equal(index.documents[0].versionNote,'registered version a');
  assert.equal(index.documents[2].identityReview.status,'fixture-manual-review');
  assert.match(written.verificationBoundary,/do not establish title\/DOI identity/);
  assert.doesNotMatch(index.documents[0].validation,/first-page identity.*checked/);
});

test('repeated checks and writes keep registered exports byte- and mtime-stable without using the current clock',t=>{
  const {root}=fixture(t);success(run(root,'--write'));const before=snapshot(root);
  for(const args of [[],['--check'],['--write']]){const report=success(run(root,...args));assert.deepEqual(report.changedOutputs,[]);assert.equal(report.checkedAt,'2026-10-31');assert.deepEqual(snapshot(root),before);}
});

test('impossible audit dates and times fail without changing any export in either mode',t=>{
  const {root}=fixture(t);success(run(root,'--write'));const before=snapshot(root);
  for(const invalid of ['2026-13-99','2026-02-29','2026-10-31T99:99:99+99:99','2026-10-31T12:00:00+24:00','2026-10-31T12:00:00+00:99']){
    for(const mode of ['--check','--write']){
      const result=run(root,mode,'--checked-at',invalid);
      assert.equal(result.status,1);assert.match(result.stderr,/Invalid audit date\/time/);
      assert.deepEqual(snapshot(root),before);
    }
  }
});

test('a clean checkout without papers, external originals or attachments checks metadata while reporting all bytes unavailable',t=>{
  const {root,original}=fixture(t);success(run(root,'--write'));const before=snapshot(root);
  fs.rmSync(path.join(root,'references/papers'),{recursive:true});fs.rmSync(path.join(root,'references/local-only'),{recursive:true});fs.unlinkSync(original);
  const report=success(run(root,'--check'));assert.deepEqual(report.localPdfs,{verified:0,unavailable:3});assert.deepEqual(report.originalLibrary,{verified:0,unavailable:1});assert.deepEqual(report.attachments,{verified:0,unavailable:1});assert.deepEqual(snapshot(root),before);
  assert.equal(readJSON(root,'references/original-library-integrity.json').recordType,'registered-original-library-fingerprints');
  assert.equal(readJSON(root,'references/original-library-integrity.json').allUnchanged,undefined);
});

for(const kind of ['paper','external original','attachment']){
  test(`a changed ${kind} fails before any export is updated`,t=>{
    const {root,docs,original,attachment}=fixture(t);success(run(root,'--write'));const before=snapshot(root);
    const registry=readJSON(root,'references/rabi-crosscheck-sources-20261031.json');registry.sources[0].title='Changed title';writeJSON(root,'references/rabi-crosscheck-sources-20261031.json',registry);
    fs.writeFileSync(kind==='paper'?path.join(root,docs[1].path):kind==='external original'?original:path.join(root,attachment),'modified evidence');
    const result=run(root,'--write');assert.equal(result.status,1);assert.match(result.stderr,/SHA-256 mismatch/);assert.deepEqual(snapshot(root),before);
  });
}

for(const file of ['index.json','index.csv','references.bib']){
  test(`read-only checking detects ${file} drift without replacing it`,t=>{
    const {root}=fixture(t);success(run(root,'--write'));fs.appendFileSync(path.join(root,'references',file),'drift');const before=snapshot(root);
    const result=run(root,'--check');assert.equal(result.status,1);assert.ok(JSON.parse(result.stdout).changedOutputs.includes(file));assert.deepEqual(snapshot(root),before);
  });
}

for(const file of ['primary-source-queue.csv','primary-source-queue.md']){
  test(`queue consistency checking rejects a divergent ${file} and writes no exports`,t=>{
    const {root}=fixture(t);success(run(root,'--write'));const before=snapshot(root);const p=path.join(root,'references',file);
    fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(file.endsWith('.csv')?'10.1234/a':'已索引',file.endsWith('.csv')?'10.1234/wrong':'未核对'));
    const result=run(root,'--write');assert.equal(result.status,1);assert.match(result.stderr,/queue.*mismatch/);assert.deepEqual(snapshot(root),before);
  });
}

test('an injected replacement failure rolls back all outputs instead of leaving a partial generated set',t=>{
  const {root}=fixture(t);success(run(root,'--write'));const before=snapshot(root);
  const code=`import importlib.util, pathlib, os, sys
spec=importlib.util.spec_from_file_location('reference_index',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
calls=0
def fail_second(src,dst):
 global calls
 calls+=1
 if calls==2: raise OSError('injected replacement failure')
 os.replace(src,dst)
try: m.write_transaction(pathlib.Path(sys.argv[2])/'references',{'index.json':b'changed index','index.csv':b'changed csv'},replace=fail_second)
except OSError as error:
 assert 'injected' in str(error)
else: raise AssertionError('fault was not injected')
`;
  const result=spawnSync('python3',['-B','-c',code,script,root],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
  assert.deepEqual(snapshot(root),before);assert.equal(fs.existsSync(path.join(root,'references/local-only/reference-index-transaction')),false);
});

test('an interrupted transaction is detected read-only and recovered only by explicit writing',t=>{
  const {root}=fixture(t);success(run(root,'--write'));const before=snapshot(root);
  const transaction=path.join(root,'references/local-only/reference-index-transaction');fs.mkdirSync(transaction,{recursive:true});
  const entries=['index.json','index.csv'].map(name=>{const target=path.join(root,'references',name);fs.copyFileSync(target,path.join(transaction,'backup-'+name));return {name,existed:true,beforeSha256:hash(fs.readFileSync(target))};});
  fs.writeFileSync(path.join(transaction,'journal.json'),JSON.stringify({files:entries}));fs.writeFileSync(path.join(root,'references/index.json'),'partial generation');
  const partial=snapshot(root);const detected=run(root,'--check');assert.equal(detected.status,1);assert.match(detected.stderr,/Incomplete.*transaction/);assert.deepEqual(snapshot(root),partial);
  success(run(root,'--write'));assert.equal(fs.existsSync(transaction),false);
  for(const name of exports)assert.equal(snapshot(root)[name].hash,before[name].hash);
  success(run(root,'--check'));
});

test('an unregistered PDF is not silently omitted from the local inventory',t=>{
  const {root}=fixture(t);success(run(root,'--write'));const before=snapshot(root);fs.writeFileSync(path.join(root,'references/papers/new.pdf'),'%PDF-new evidence');
  const result=run(root,'--write');assert.equal(result.status,1);assert.match(result.stderr,/Unregistered local PDF/);assert.deepEqual(snapshot(root),before);
});

function aliasDocument(root,doc,overrides={}){
  const row={oldPath:doc.path,path:doc.path.replace('.pdf','_published-print.pdf'),sha256:doc.sha256,bytes:doc.bytes,pages:doc.pages,
    documentType:'published-print',versionNote:'Reviewed Safari print of published pages',identityReview:{status:'title-and-producer-reviewed'},...overrides};
  writeJSON(root,'references/paper-path-aliases.json',{schemaVersion:1,checkedOn:'2026-11-04',aliases:[row]});
  return row;
}

test('an empty rename registry leaves prior exports and their audit date unchanged',t=>{
  const {root}=fixture(t);success(run(root,'--write'));const before=snapshot(root);
  writeJSON(root,'references/paper-path-aliases.json',{schemaVersion:1,checkedOn:'2026-11-04',aliases:[]});
  assert.deepEqual(success(run(root,'--check')).changedOutputs,[]);assert.deepEqual(snapshot(root),before);
});

test('a real rename exports the current path and corrected version while preserving historical queue and evidence bytes',t=>{
  const {root,docs}=fixture(t);const alias=aliasDocument(root,docs[0]);
  const history=['references/document-metadata-20261031.json','references/bibliography-audit.json','references/primary-source-queue.json','references/primary-source-queue.csv'].map(p=>[p,hash(fs.readFileSync(path.join(root,p)))]);
  const oldFile=path.join(root,alias.oldPath),newFile=path.join(root,alias.path),inode=fs.statSync(oldFile).ino;
  fs.renameSync(oldFile,newFile);
  const report=success(run(root,'--write'));assert.deepEqual(report.localPdfs,{verified:3,unavailable:0});
  const index=readJSON(root,'references/index.json'),doc=index.documents.find(d=>d.sha256===alias.sha256);
  assert.equal(doc.path,alias.path);assert.deepEqual(doc.aliases,[alias.oldPath]);assert.equal(doc.historicalVersionNote,'registered version a');
  assert.equal(doc.versionNote,alias.versionNote);assert.equal(doc.documentType,'published-print');assert.deepEqual(doc.identityReview,alias.identityReview);
  assert.deepEqual(index.sources.find(s=>s.id==='source-a').documents,[alias.path]);
  assert.equal(hash(fs.readFileSync(newFile)),docs[0].sha256);assert.equal(fs.statSync(newFile).ino,inode);
  for(const [p,h] of history)assert.equal(hash(fs.readFileSync(path.join(root,p))),h);
  const before=snapshot(root);success(run(root,'--check'));assert.deepEqual(snapshot(root),before);
});

test('aliases also attach to a newly registered current pathname and allow an extensionless historical name',t=>{
  const {root,docs}=fixture(t);const alias=aliasDocument(root,docs[1],{oldPath:docs[1].path.replace('.pdf',''),path:docs[1].path});
  const registry=readJSON(root,'references/clock-rabi-sources-20261030.json');
  assert.equal(registry.documents[0].path,alias.path);
  success(run(root,'--write'));const doc=readJSON(root,'references/index.json').documents.find(d=>d.sha256===alias.sha256);
  assert.deepEqual(doc.aliases,[alias.oldPath]);assert.equal(doc.path,docs[1].path);
});

test('renaming corrects current identity fields without discarding the independent numerical review',t=>{
  const {root,docs}=fixture(t);
  const registryPath='references/clock-rabi-sources-20261030.json',registry=readJSON(root,registryPath);
  const numericalReview={path:'data/literature/review/facts.json',records:2,canonicalAdopted:false};
  registry.documents[0].identityReview={status:'previous-identity-note',evidence:'previous version label',numericalReview};
  writeJSON(root,registryPath,registry);
  const sourceRegistryHash=hash(fs.readFileSync(path.join(root,registryPath)));
  const alias=aliasDocument(root,docs[1],{identityReview:{status:'title-and-producer-reviewed',evidence:'current Safari print identity'}});
  fs.renameSync(path.join(root,alias.oldPath),path.join(root,alias.path));
  success(run(root,'--write'));
  const doc=readJSON(root,'references/index.json').documents.find(d=>d.sha256===alias.sha256);
  assert.equal(doc.path,alias.path);assert.equal(doc.documentType,'published-print');
  assert.equal(doc.identityReview.status,alias.identityReview.status);
  assert.equal(doc.identityReview.evidence,alias.identityReview.evidence);
  assert.deepEqual(doc.identityReview.numericalReview,numericalReview);
  assert.equal(hash(fs.readFileSync(path.join(root,registryPath))),sourceRegistryHash);
  const before=snapshot(root);success(run(root,'--check'));assert.deepEqual(snapshot(root),before);
});

test('a relocated checkout without any PDFs reports unavailable originals without changing exports or fabricating verification',t=>{
  const {root,docs,original}=fixture(t);const alias=aliasDocument(root,docs[0]);fs.renameSync(path.join(root,alias.oldPath),path.join(root,alias.path));
  success(run(root,'--write'));const before=snapshot(root);
  fs.rmSync(path.join(root,'references/papers'),{recursive:true});fs.unlinkSync(original);
  const report=success(run(root,'--check'));assert.deepEqual(report.localPdfs,{verified:0,unavailable:3});assert.deepEqual(report.originalLibrary,{verified:0,unavailable:1});assert.deepEqual(snapshot(root),before);
});

for(const attack of ['changed-target','wrong-manifest-hash','tampered-old-name']){
  test(`relocation rejects ${attack} before changing any export`,t=>{
    const {root,docs}=fixture(t);const alias=aliasDocument(root,docs[0]);fs.renameSync(path.join(root,alias.oldPath),path.join(root,alias.path));
    success(run(root,'--write'));const before=snapshot(root);
    if(attack==='changed-target')fs.appendFileSync(path.join(root,alias.path),'tampered');
    if(attack==='tampered-old-name')fs.writeFileSync(path.join(root,alias.oldPath),'%PDF-wrong same name');
    if(attack==='wrong-manifest-hash')aliasDocument(root,docs[0],{sha256:'0'.repeat(64)});
    const result=run(root,'--write');assert.equal(result.status,1);assert.match(result.stderr,/SHA-256/);assert.deepEqual(snapshot(root),before);
  });
}

test('duplicate, unsafe and chained aliases fail before any export transaction',t=>{
  const {root,docs}=fixture(t);success(run(root,'--write'));const before=snapshot(root);
  const first={oldPath:docs[0].path,path:'references/papers/renamed-a.pdf',sha256:docs[0].sha256,bytes:docs[0].bytes,pages:docs[0].pages};
  const second={oldPath:docs[1].path,path:'references/papers/renamed-b.pdf',sha256:docs[1].sha256,bytes:docs[1].bytes,pages:docs[1].pages};
  const cases=[
    [first,first],
    [first,{...second,path:first.path}],
    [first,{...second,oldPath:first.path}],
    [first,{...second,oldPath:first.path,path:first.oldPath}],
    [{...first,path:'/tmp/outside.pdf'}],
    [{...first,path:'references/papers/../outside.pdf'}],
    [{...first,path:'references/papers/https://example.test/a.pdf'}],
    [{...first,oldPath:'references/papers/..\\outside.pdf'}],
    [{...first,path:'references/papers/not-a-pdf'}],
    [{...first,bytes:0}],
    [{...first,pages:1.5}]
  ];
  for(const aliases of cases){
    writeJSON(root,'references/paper-path-aliases.json',{schemaVersion:1,aliases});
    const result=run(root,'--write');assert.equal(result.status,1,JSON.stringify(aliases));assert.match(result.stderr,/alias/);assert.deepEqual(snapshot(root),before);
  }
});

test('an alias cannot claim another registered document hash for an existing historical path',t=>{
  const {root,docs}=fixture(t);success(run(root,'--write'));const before=snapshot(root);
  aliasDocument(root,docs[0],{sha256:docs[1].sha256,bytes:docs[1].bytes,pages:docs[1].pages});
  const result=run(root,'--write');assert.equal(result.status,1);assert.match(result.stderr,/alias does not match registered document path/);assert.deepEqual(snapshot(root),before);
});

test('a relocated document does not allow an unrelated unregistered PDF to disappear from inventory',t=>{
  const {root,docs}=fixture(t);const alias=aliasDocument(root,docs[0]);fs.renameSync(path.join(root,alias.oldPath),path.join(root,alias.path));
  success(run(root,'--write'));const before=snapshot(root);fs.writeFileSync(path.join(root,'references/papers/unregistered.pdf'),'%PDF-new');
  const result=run(root,'--write');assert.equal(result.status,1);assert.match(result.stderr,/Unregistered local PDF/);assert.deepEqual(snapshot(root),before);
});
