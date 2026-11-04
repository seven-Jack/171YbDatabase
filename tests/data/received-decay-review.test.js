import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadReceivedDecayReview,verifyReceivedDecayReview} from '../../data/literature/received-decay-review-2026-11-04/verify.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const relative='data/literature/received-decay-review-2026-11-04';

test('five received papers have traced records, original locators and explicitly separate primary/secondary evidence',()=>{
  const result=verifyReceivedDecayReview();
  assert.equal(result.status,'passed');
  assert.equal(result.sources,5);
  assert.equal(result.canonicalAdopted,false);
  const data=loadReceivedDecayReview();
  assert.equal(data.components.find(row=>row.sourceIds.includes('guo-1993-pra')).records.length,10);
  assert.ok(result.conflicts>=4);
  assert.ok(result.pending>0);
});

test('unreported isotope/sigma, secondary provenance and missing primary originals cannot silently become verified inputs',()=>{
  const mutations=[
    data=>{data.components.find(row=>row.sourceIds.includes('guo-1993-pra')).records[0].isotope=171;},
    data=>{data.components.find(row=>row.sourceIds.includes('guo-1993-pra')).records[0].uncertainty=14.9;},
    data=>{data.components.find(row=>row.sourceIds.includes('blagoev-1994-adndt')).records[0].provenance='primary-result';},
    data=>{data.components.find(row=>row.sourceIds.includes('honda-1999-pra')).records.find(row=>row.provenance==='primary-result').isotope=171;},
    data=>{data.sources.missingOriginals[0].originalVerified=true;},
    data=>{data.components[0].records[0].canonicalAdopted=true;},
    data=>{data.conflicts.records[0].status='resolved-by-averaging';},
    data=>{data.components[0].records[0].value=Infinity;},
    data=>{data.components[0].records[0].value=-1;},
    data=>{data.components[0].records.find(row=>row.quantity==='effective-cascade-transfer-rate').unit='ns';},
    data=>{data.sources.documents[0].doi='10.1234/invented';},
    data=>{data.components[0].records[0].locator.pdfPages=[99];},
    data=>{data.components[0].records[0].sourceId='invented-primary-source';},
    data=>{data.components[0].records[0].pdfText='copied full text';},
    data=>{data.components[0].records[0].privateFile='/Users/example/private.pdf';},
    data=>{data.components.find(row=>row.sourceIds.includes('blagoev-1994-adndt')).records.find(row=>row.method==='T').evidenceKind='experiment';},
    data=>{data.components.find(row=>row.sourceIds.includes('blagoev-1994-adndt')).records.find(row=>row.id==='b94-yb2-p38-state001-cell1').relation='equal';},
    data=>{data.components.find(row=>row.sourceIds.includes('blagoev-1994-adndt')).records.find(row=>row.id==='b94-yb2-p38-state002-cell1').value=52.15;},
    data=>{data.components.find(row=>row.sourceIds.includes('blagoev-1994-adndt')).records.find(row=>row.id==='b94-yb1-p37-state084-cell2').status='verified';}
  ];
  for(const mutate of mutations){
    const review=structuredClone(loadReceivedDecayReview());mutate(review);
    assert.throws(()=>verifyReceivedDecayReview({review,checkFiles:false,verifyOriginals:false}),/Received decay review:/);
  }
});

test('missing PDFs remain unavailable in a clean checkout while facts still validate; changed present bytes fail',t=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'yb-received-decay-'));
  t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  fs.mkdirSync(path.dirname(path.join(temp,relative)),{recursive:true});
  fs.cpSync(path.join(root,relative),path.join(temp,relative),{recursive:true});
  fs.mkdirSync(path.join(temp,'references'),{recursive:true});
  fs.copyFileSync(path.join(root,'references/index.json'),path.join(temp,'references/index.json'));
  const result=verifyReceivedDecayReview({root:temp});
  assert.equal(result.originalsVerified,0);
  assert.equal(result.originalsUnavailable,5);
  const source=loadReceivedDecayReview(temp).sources.documents[0];
  const file=path.join(temp,source.path);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,'%PDF-1.7\nchanged original\n');
  assert.throws(()=>verifyReceivedDecayReview({root:temp}),/original PDF mismatch/);
});

test('public record exports and manifest cannot hide stale or omitted fact files',()=>{
  const review=structuredClone(loadReceivedDecayReview());
  review.manifest.files.pop();
  assert.throws(()=>verifyReceivedDecayReview({review}),/manifest file coverage/);
  const changed=structuredClone(loadReceivedDecayReview());
  changed.manifest.files.find(row=>row.name==='records.csv').sha256='0'.repeat(64);
  assert.throws(()=>verifyReceivedDecayReview({review:changed}),/records.csv: manifest differs/);
});
