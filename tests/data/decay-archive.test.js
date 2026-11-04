import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {loadDecayArchive,verifyDecayArchive} from '../../data/literature/decay-audit-2026-11-04/verify.mjs';

test('checked decay archive preserves seven theoretical direct branches and matches explicit runtime adoption',()=>{
  const result=verifyDecayArchive();
  assert.equal(result.status,'passed');
  assert.equal(result.directBranches,7);
  assert.equal(result.conflicts,3);
  assert.equal(result.canonicalChecked,true);
  assert.deepEqual(result.sourcesWithoutOriginals.map(row=>row.sourceId),['honda-1999','honda-1999-erratum','loftus-2000']);
});

test('archive cannot silently drop the weak singlet branch, change source values or call theory an experiment',()=>{
  for(const mutate of [
    data=>{data['branching-fractions.json'].records.pop();},
    data=>{data['branching-fractions.json'].records[0].value=.64;},
    data=>{data['branching-fractions.json'].records[0].evidenceKind='experiment';},
    data=>{data['branching-fractions.json'].records[0].conditions.F=.5;},
    data=>{data['branching-fractions.json'].noSilentRenormalization=false;},
    data=>{data['applicability.json'].states.at(-1).branchingValue=0;},
    data=>{data['conflicts.json'].records[1].originalClaims.extendedDataFig5b_p18.m1='2.7(5)%';},
    data=>{data['source-manifest.json'].sources.find(row=>row.id==='honda-1999').accessStatus='original-pdf-reviewed';},
    data=>{data['additional-reviewed-facts.json'].canonicalAdopted=true;},
    data=>{data['additional-reviewed-facts.json'].newlyReviewed[1].beta=.05/.169;}
  ]){
    const data=structuredClone(loadDecayArchive());mutate(data);
    assert.throws(()=>verifyDecayArchive({archive:data,verifyOriginals:false}),/Decay archive:/);
  }
});

test('tracked facts reject personal absolute paths, unresolved sources and copied original text',()=>{
  for(const mutate of [
    data=>{data['source-manifest.json'].sources[0].notes.push('/Users/example/private.pdf');},
    data=>{data['branching-fractions.json'].records[0].sourceIds=['unknown-source'];},
    data=>{data['source-manifest.json'].sources[0].pdfText='unlicensed full text';},
    data=>{data['branching-fractions.json'].records[0].value=Infinity;},
    data=>{data['source-manifest.json'].sources[0].originals[0].path='../escape.pdf';}
  ]){
    const data=structuredClone(loadDecayArchive());mutate(data);
    assert.throws(()=>verifyDecayArchive({archive:data,verifyOriginals:false}),/Decay archive:/);
  }
});

test('original fingerprint check is read-only, fails on changed PDFs and distinguishes unavailable originals',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'yb-decay-archive-'));
  try{
    const data=structuredClone(loadDecayArchive());
    const original=path.join(directory,'references/papers/probe.pdf');
    fs.mkdirSync(path.dirname(original),{recursive:true});
    const bytes=Buffer.from('%PDF-1.7\nlocal fingerprint fixture\n');fs.writeFileSync(original,bytes);
    data['source-manifest.json'].sources[0].originals=[{root:'repository',path:'references/papers/probe.pdf',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length}];
    const before=fs.statSync(original).mtimeMs;
    const result=verifyDecayArchive({root:directory,archive:data,verifyCanonical:false,paperLibraryRoot:path.join(directory,'absent-library')});
    assert.equal(result.originalsChecked,1);
    assert.ok(result.registeredOriginalsUnavailable>0);
    assert.equal(fs.statSync(original).mtimeMs,before);
    fs.writeFileSync(original,'%PDF-1.7\nchanged original\n');
    assert.throws(()=>verifyDecayArchive({root:directory,archive:data,verifyCanonical:false,paperLibraryRoot:path.join(directory,'absent-library')}),/SHA256 mismatch/);
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

test('decay archive checks renamed repository originals while retaining historical locators',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'yb-decay-rename-'));
  try{
    const data=structuredClone(loadDecayArchive());
    const oldPath='references/papers/1.pdf',currentPath='references/papers/1998_Author_Lifetime_published-print.pdf';
    const bytes=Buffer.from('%PDF-1.7\nrenamed archive original\n');
    const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
    fs.mkdirSync(path.join(directory,'references/papers'),{recursive:true});
    fs.writeFileSync(path.join(directory,currentPath),bytes);
    fs.writeFileSync(path.join(directory,'references/paper-path-aliases.json'),JSON.stringify({schemaVersion:1,aliases:[{oldPath,path:currentPath,sha256,bytes:bytes.length}]}));
    data['source-manifest.json'].sources[0].originals=[{root:'repository',path:oldPath,sha256,bytes:bytes.length}];
    const verify=()=>verifyDecayArchive({root:directory,archive:data,verifyCanonical:false,paperLibraryRoot:path.join(directory,'absent-library')});
    const result=verify();
    assert.equal(result.originalsChecked,1);
    assert.equal(result.availability[0].path,oldPath);
    assert.equal(result.availability[0].verified,true);
    fs.writeFileSync(path.join(directory,currentPath),'%PDF-1.7\nchanged renamed file\n');
    assert.throws(verify,/SHA256 mismatch/);
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
