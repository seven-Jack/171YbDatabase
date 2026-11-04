import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {readPaperPathAliases,resolvePaperPath} from '../../scripts/paper-paths.mjs';
import {verifyLocalEvidence} from '../../scripts/local-evidence.mjs';

const bytes=Buffer.from('%PDF-reviewed original; bytes remain unchanged\n');
const sha256=createHash('sha256').update(bytes).digest('hex');
const original='references/papers/1.pdf';
const current='references/papers/1998_Author_Yb_Level-lifetime_published-print.pdf';
function fixture(t){
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'yb-paper-alias-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  fs.mkdirSync(path.join(directory,'references/papers'),{recursive:true});
  const write=(relative,value)=>fs.writeFileSync(path.join(directory,relative),value);
  const aliases=[{oldPath:original,path:current,sha256,bytes:bytes.length}];
  const save=(items=aliases)=>write('references/paper-path-aliases.json',JSON.stringify({schemaVersion:1,checkedOn:'2026-11-04',aliases:items}));
  return {directory,root:pathToFileURL(directory+path.sep),write,aliases,save,
    source:{id:'historical-source',localPath:original,sha256}};
}

test('a missing or empty alias registry preserves ordinary evidence resolution',t=>{
  const f=fixture(t);
  assert.deepEqual(readPaperPathAliases(f.root),[]);
  assert.equal(resolvePaperPath(f.root,original,sha256),original);
  f.save([]);
  assert.equal(resolvePaperPath(f.root,'paper.pdf',sha256),'paper.pdf');
});

test('a renamed original verifies the same bytes and preserves historical evidence identity exactly',t=>{
  const f=fixture(t);f.save();f.write(current,bytes);
  assert.equal(resolvePaperPath(f.directory,original,sha256),current);
  assert.deepEqual(verifyLocalEvidence(f.root,f.source),{
    sourceId:'historical-source',localPath:original,expectedSha256:sha256,
    status:'verified',verified:true,sha256,unchanged:true
  });
});

test('metadata alone never makes an absent renamed original available',t=>{
  const f=fixture(t);f.save();
  const result=verifyLocalEvidence(f.root,f.source);
  assert.equal(result.status,'unavailable');assert.equal(result.verified,false);
  assert.equal(result.sha256,null);assert.equal(result.localPath,original);
});

test('changed current bytes fail and a changed historical copy cannot be hidden by a good renamed copy',t=>{
  const f=fixture(t);f.save();f.write(current,'%PDF-changed copy');
  assert.throws(()=>verifyLocalEvidence(f.root,f.source),/SHA-256 mismatch/);
  f.write(current,bytes);f.write(original,'%PDF-changed historical original');
  assert.equal(resolvePaperPath(f.root,original,sha256),original);
  assert.throws(()=>verifyLocalEvidence(f.root,f.source),/SHA-256 mismatch/);
});

test('a source fingerprint conflicting with its rename cannot silently resolve',t=>{
  const f=fixture(t);f.save();f.write(current,bytes);
  assert.throws(()=>verifyLocalEvidence(f.root,{...f.source,sha256:'a'.repeat(64)}),/expected SHA-256 disagrees/);
});

test('registry rejects unsafe locators, duplicate identities, cycles and inconsistent chain fingerprints',t=>{
  const f=fixture(t);const item=f.aliases[0];
  const bad=[
    [{...item,oldPath:'../papers/1.pdf'}],
    [{...item,path:'references/papers/../outside.pdf'}],
    [{...item,path:'/private/paper.pdf'}],
    [{...item,path:'https://example.test/paper.pdf'}],
    [{...item,path:'references\\papers\\target.pdf'}],
    [{...item,path:'references/papers/..%2foutside.pdf'}],
    [{...item,path:'references/papers/target.pdf#fragment'}],
    [{...item,path:'references/papers/target.txt'}],
    [{...item,sha256:'invalid'}],
    [{...item,bytes:0}],
    [item,{...item,path:'references/papers/other.pdf'}],
    [item,{...item,oldPath:'references/papers/2.pdf'}],
    [item,{...item,oldPath:current,path:original}],
    [item,{...item,oldPath:current,path:'references/papers/final.pdf',sha256:'b'.repeat(64)}]
  ];
  for(const aliases of bad){f.save(aliases);assert.throws(()=>readPaperPathAliases(f.root),/Paper path aliases:/);}
});

test('a safe historical extensionless filename may resolve only to a PDF target',t=>{
  const f=fixture(t);const oldPath='references/papers/1994_Author_Lifetimes_published';
  f.save([{...f.aliases[0],oldPath}]);f.write(current,bytes);
  assert.equal(resolvePaperPath(f.root,oldPath,sha256),current);
  assert.equal(verifyLocalEvidence(f.root,{...f.source,localPath:oldPath}).verified,true);
});

test('a consistent rename chain resolves the current locator without mutating the registry',t=>{
  const f=fixture(t);const target='references/papers/Final_verified.pdf';
  f.save([f.aliases[0],{...f.aliases[0],oldPath:current,path:target}]);f.write(target,bytes);
  const manifest=path.join(f.directory,'references/paper-path-aliases.json');const before=fs.readFileSync(manifest);
  assert.equal(resolvePaperPath(f.root,original,sha256),target);
  assert.equal(verifyLocalEvidence(f.root,f.source).verified,true);
  assert.deepEqual(fs.readFileSync(manifest),before);
});

test('a symlink cannot substitute for a reviewed rename target',t=>{
  const f=fixture(t);f.save();f.write('references/papers/different.pdf',bytes);
  fs.symlinkSync('different.pdf',path.join(f.directory,current));
  assert.throws(()=>verifyLocalEvidence(f.root,f.source),/symlink is not a reviewed paper/);
});
