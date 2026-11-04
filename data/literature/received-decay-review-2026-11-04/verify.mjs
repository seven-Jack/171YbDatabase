import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolvePaperPath} from '../../../scripts/paper-paths.mjs';
import {buildRecordsCSV,componentNames} from './export.mjs';

const defaultRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const relativeDirectory='data/literature/received-decay-review-2026-11-04';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const expect=(condition,message)=>{if(!condition)throw Error(`Received decay review: ${message}`);};
const read=(root,name)=>JSON.parse(fs.readFileSync(path.join(root,relativeDirectory,name),'utf8'));
export function loadReceivedDecayReview(root=defaultRoot){
  return {manifest:read(root,'manifest.json'),sources:read(root,'source-manifest.json'),components:componentNames.map(name=>read(root,name)),conflicts:read(root,'conflicts.json'),lineage:read(root,'lineage.json')};
}

/** Transcription/provenance checks only. Original PDFs are optional, never fabricated. */
export function verifyReceivedDecayReview({root=defaultRoot,review=loadReceivedDecayReview(root),checkFiles=true,verifyOriginals=true}={}){
  const {manifest,sources,components,conflicts}=review;
  expect(manifest.schemaVersion===1&&manifest.reviewVersion==='2026.11.04.2','review identity/version');
  expect(manifest.canonicalAdopted===false,'review must not silently adopt atomic values');
  const sourceMap=new Map(sources.documents.map(row=>[row.sourceId,row]));
  expect(sourceMap.size===5&&sourceMap.size===sources.documents.length,'five distinct source documents required');
  const indexed=JSON.parse(fs.readFileSync(path.join(root,'references/index.json'),'utf8'));
  const registeredSourceIds=new Set(indexed.sources.map(source=>source.id));
  const indexedSources=new Map(indexed.sources.map(source=>[source.id,source]));
  for(const source of sourceMap.values()){
    expect(/^10\.\d{4,9}\/[^\s<>]+$/.test(source.doi),`${source.sourceId}: DOI`);
    expect(indexedSources.get(source.sourceId)?.doi?.toLowerCase()===source.doi.toLowerCase(),`${source.sourceId}: DOI differs from central identity`);
    expect(/^references\/papers\/[^/\\]+\.pdf$/.test(source.path)&&!source.path.includes('..'),`${source.sourceId}: original path`);
    expect(/^[a-f0-9]{64}$/.test(source.sha256)&&Number.isSafeInteger(source.bytes)&&source.bytes>0&&Number.isSafeInteger(source.pages)&&source.pages>0,`${source.sourceId}: fingerprint/pages`);
    const document=indexed.documents.find(doc=>doc.path===source.path);
    expect(document?.sha256===source.sha256&&document.bytes===source.bytes&&document.pages===source.pages&&document.sourceIds.includes(source.sourceId),`${source.sourceId}: current source index mismatch`);
  }
  const visit=(value,at)=>{
    if(typeof value==='number')expect(Number.isFinite(value),`${at}: nonfinite value`);
    if(typeof value==='string')expect(!/(?:\/Users\/|\/private\/|file:\/\/|[A-Z]:\\)/.test(value),`${at}: private absolute path`);
    if(Array.isArray(value)){value.forEach((entry,i)=>visit(entry,`${at}[${i}]`));return;}
    if(value&&typeof value==='object')for(const [key,entry] of Object.entries(value)){
      expect(!/^(?:pdfText|fullText|pageText|ocrText|sourceCode)$/i.test(key),`${at}: original full text is not structured evidence`);
      if(key==='sourceId')expect(registeredSourceIds.has(entry),`${at}: unknown source`);
      if(key==='sourceIds')expect(Array.isArray(entry)&&entry.every(id=>registeredSourceIds.has(id)),`${at}: unknown source IDs`);
      if(key==='canonicalAdopted')expect(entry===false,`${at}: evidence cannot auto-adopt`);
      visit(entry,`${at}.${key}`);
    }
  };
  visit(review,'review');
  const records=components.flatMap(data=>data.records);
  expect(records.length===manifest.counts.records&&new Set(records.map(row=>row.id)).size===records.length,'record count or duplicate identity');
  const coverage=components.flatMap(data=>data.coverage);
  expect(new Set(coverage.map(row=>row.sourceId)).size===5,'source coverage incomplete');
  for(const row of coverage){
    const source=sourceMap.get(row.sourceId);
    expect(source&&row.totalPages===source.pages&&Array.isArray(row.pages)&&row.pages.length>0&&row.pages.every(p=>Number.isInteger(p)&&p>=1&&p<=source.pages),`${row.sourceId}: coverage pages`);
  }
  const unitsByQuantity={
    lifetime:['ns','us','ms','s','day'],
    'trap-population-decay-time':['ms'],
    'trap-population-loading-time':['ms'],
    'cascade-fluorescence-ratio':['1'],
    'branching-lower-bound':['1'],
    'illumination-dependent-cascade-event-time':['ms'],
    'reported-theory-branching-range-endpoint':['1'],
    'natural-linewidth-frequency':['kHz','MHz'],
    'einstein-decay-rate':['s^-1'],
    'effective-cascade-transfer-rate':['s^-1'],
    'effective-cascade-rate-ratio':['1'],
    'trap-population-lifetime-range-endpoint':['ms']
  };
  for(const row of records){
    expect(typeof row.id==='string'&&row.id.length>0&&typeof row.quantity==='string'&&row.quantity.length>0,`${row.id}: quantity/identity`);
    expect(sourceMap.has(row.sourceId),`${row.id}: source`);
    expect(['experiment','theory','reported-reference','derived'].includes(row.evidenceKind),`${row.id}: evidence type`);
    expect(['primary-result','cited-value','compilation-entry'].includes(row.provenance),`${row.id}: primary/secondary provenance`);
    expect(row.value===null||typeof row.value==='number'&&Number.isFinite(row.value),`${row.id}: value must be finite or explicitly pending`);
    expect(row.value===null||row.value>0,`${row.id}: lifetime/rate/fraction must be positive`);
    expect(row.uncertainty===null||typeof row.uncertainty==='number'&&Number.isFinite(row.uncertainty)&&row.uncertainty>=0,`${row.id}: uncertainty`);
    expect(typeof row.unit==='string'&&row.unit.length>0,`${row.id}: unit`);
    expect(unitsByQuantity[row.quantity]?.includes(row.unit),`${row.id}: quantity/unit mismatch`);
    if(['branching-lower-bound','reported-theory-branching-range-endpoint'].includes(row.quantity))expect(row.value<=1,`${row.id}: branching bound outside [0,1]`);
    expect(row.canonicalAdopted===false,`${row.id}: automatic adoption`);
    expect(typeof row.conditions==='object'&&row.conditions!==null,`${row.id}: applicability conditions`);
    expect(Array.isArray(row.locator?.pdfPages)&&row.locator.pdfPages.length>0&&row.locator.pdfPages.every(p=>Number.isInteger(p)&&p>=1&&p<=sourceMap.get(row.sourceId).pages),`${row.id}: original page locator`);
    expect([0,1].includes(row.chargeState),`${row.id}: neutral/ion separation`);
    if(row.sourceId==='blagoev-1994-adndt')expect(row.provenance==='compilation-entry',`${row.id}: secondary compilation cannot become primary experiment`);
    if(row.sourceId==='blagoev-1994-adndt'&&row.method==='T')expect(row.evidenceKind==='theory',`${row.id}: theory column cannot become experiment`);
    if(row.sourceId==='blagoev-1994-adndt')expect(row.species===(row.chargeState===0?'Yb I':'Yb II'),`${row.id}: charge-state assignment`);
    if(row.sourceId==='blagoev-1994-adndt'&&!['b94-yb1-p33-state002-cell1','b94-yb2-p38-state001-cell1'].includes(row.id))expect(row.unit==='ns',`${row.id}: compilation table default unit is ns`);
    if(row.sourceId==='guo-1993-pra')expect(row.isotope===null&&row.uncertainty===null,`${row.id}: unspecified isotope or per-row sigma invented`);
    if(['honda-1999-pra','loftus-2000-pra'].includes(row.sourceId)&&row.provenance==='primary-result')expect(row.isotope===174,`${row.id}: measured isotope is not 171Yb`);
    if(row.sourceId==='honda-1999-erratum')expect(row.provenance==='cited-value',`${row.id}: erratum input is not a new lifetime measurement`);
  }
  expect(conflicts.records.length===manifest.counts.conflicts&&new Set(conflicts.records.map(row=>row.id)).size===conflicts.records.length,'conflict inventory');
  expect(conflicts.records.every(row=>row.status!=='resolved-by-averaging'),'conflicts must not be silently averaged');
  const recordIds=new Set(records.map(row=>row.id));
  for(const item of conflicts.records)expect(!item.recordIds||item.recordIds.every(id=>recordIds.has(id)),`${item.id}: unresolved conflict record identity`);
  const pending=components.flatMap(data=>data.pending||[]);
  expect(pending.length===manifest.counts.pending,'pending inventory');
  expect(sources.missingOriginals.some(row=>row.sourceId==='burshtein-1974-optspec'&&row.status==='pending'&&row.originalVerified===false),'missing Burshtein original cannot be promoted by secondary citation');
  const compiled=records.filter(row=>row.sourceId==='blagoev-1994-adndt');
  expect(compiled.length===200&&compiled.filter(row=>row.chargeState===0).length===183&&compiled.filter(row=>row.chargeState===1).length===17,'complete Yb table cell coverage');
  const longBound=compiled.find(row=>row.id==='b94-yb2-p38-state001-cell1');
  expect(longBound?.relation==='greater-than'&&longBound.value===7&&longBound.unit==='day','ion lifetime lower bound/unit');
  const longMetastable=compiled.find(row=>row.id==='b94-yb2-p38-state002-cell1');
  expect(longMetastable?.value===52150000&&longMetastable.uncertainty===1000000&&longMetastable.unit==='ns','ion lifetime exponent/unit');
  const ambiguous=compiled.find(row=>row.id==='b94-yb1-p37-state084-cell2');
  expect(ambiguous?.status?.includes('state-assignment-pending'),'unresolved state assignment must remain pending');
  const neutralMetastable=compiled.find(row=>row.id==='b94-yb1-p33-state002-cell1');
  expect(neutralMetastable?.value===14.5&&neutralMetastable.unit==='s'&&neutralMetastable.evidenceKind==='theory','neutral metastable lifetime unit/theory boundary');
  if(checkFiles){
    const required=['source-manifest.json','conflicts.json','lineage.json',...componentNames,'records.csv','export.mjs','verify.mjs','README.md'];
    expect(manifest.files.length===required.length&&new Set(manifest.files.map(row=>row.name)).size===required.length&&required.every(name=>manifest.files.some(row=>row.name===name)),'manifest file coverage');
    for(const row of manifest.files){
      expect(typeof row.name==='string'&&path.basename(row.name)===row.name&&row.name!=='manifest.json','manifest path');
      const bytes=fs.readFileSync(path.join(root,relativeDirectory,row.name));
      expect(bytes.length===row.bytes&&digest(bytes)===row.sha256,`${row.name}: manifest differs`);
    }
    expect(fs.readFileSync(path.join(root,relativeDirectory,'records.csv'),'utf8')===buildRecordsCSV(components),'CSV differs from source JSON');
  }
  const availability=[];
  for(const source of sourceMap.values()){
    const relative=resolvePaperPath(root,source.path,source.sha256),file=path.join(root,relative);
    let bytes;
    try{bytes=fs.readFileSync(file);}catch(error){if(error.code!=='ENOENT')throw error;}
    if(bytes&&verifyOriginals)expect(bytes.subarray(0,5).toString()==='%PDF-'&&bytes.length===source.bytes&&digest(bytes)===source.sha256,`${source.sourceId}: original PDF mismatch`);
    availability.push({sourceId:source.sourceId,path:relative,status:bytes?'available':'unavailable',verified:Boolean(bytes&&verifyOriginals)});
  }
  return {status:'passed',sources:sourceMap.size,records:records.length,conflicts:conflicts.records.length,pending:pending.length,originalsVerified:availability.filter(row=>row.verified).length,originalsUnavailable:availability.filter(row=>row.status==='unavailable').length,canonicalAdopted:false,boundary:'Transcription and source provenance checks, not independent validation or complete decay coverage.',availability};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log(JSON.stringify(verifyReceivedDecayReview(),null,2));}
  catch(error){console.error(error.message);process.exitCode=1;}
}
