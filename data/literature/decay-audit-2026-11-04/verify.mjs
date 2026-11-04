import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolvePaperPath} from '../../../scripts/paper-paths.mjs';

const archiveDirectory=path.dirname(fileURLToPath(import.meta.url));
const defaultRoot=path.resolve(archiveDirectory,'../../..');
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const expect=(condition,message)=>{if(!condition)throw new Error(`Decay archive: ${message}`);};
const documents=['manifest.json','source-manifest.json','branching-fractions.json','rate-evidence.json','cascade-and-lifetime-evidence.json','conflicts.json','applicability.json','additional-reviewed-facts.json'];
const expectedBranches=[
  ['yb171-6s5d-3d1','yb171-6s6p-3p0',.638,.027],
  ['yb171-6s5d-3d1','yb171-6s6p-3p1',.352,.027],
  ['yb171-6s5d-3d1','yb171-6s6p-3p2',.0099,.0039],
  ['yb171-6s7s-3s1','yb171-6s6p-3p0',.130,.013],
  ['yb171-6s7s-3s1','yb171-6s6p-3p1',.360,.025],
  ['yb171-6s7s-3s1','yb171-6s6p-3p2',.508,.026],
  ['yb171-6s7s-3s1','yb171-6s6p-1p1',.0021,.0009]
];
const safePath=(root,relative)=>{
  expect(typeof relative==='string'&&relative.length>0&&!relative.includes('\\')&&!path.posix.isAbsolute(relative)&&!relative.split('/').includes('..'),'original locator must be a safe relative path');
  const resolved=path.resolve(root,relative);
  expect(resolved.startsWith(path.resolve(root)+path.sep),'original locator escapes its declared root');
  return resolved;
};

export function loadDecayArchive(root=defaultRoot){
  const directory=path.join(root,'data/literature/decay-audit-2026-11-04');
  return Object.fromEntries(documents.map(name=>[name,JSON.parse(fs.readFileSync(path.join(directory,name),'utf8'))]));
}

/** Read-only consistency check. Missing original PDFs remain unavailable, not fabricated. */
export function verifyDecayArchive({root=defaultRoot,archive=loadDecayArchive(root),verifyOriginals=true,paperLibraryRoot=process.env.YB_PAPER_LIBRARY_ROOT||path.resolve(root,'../paper'),verifyCanonical=true}={}){
  const manifest=archive['manifest.json'];
  const sources=archive['source-manifest.json'].sources;
  expect(manifest.schemaVersion===1&&manifest.archiveVersion==='2026.11.04.1','archive identity/version changed without review');
  expect(manifest.files.length===documents.length-1&&new Set(manifest.files).size===manifest.files.length&&documents.slice(1).every(name=>manifest.files.includes(name)),'manifest document coverage');
  const sourceMap=new Map(sources.map(source=>[source.id,source]));
  expect(sourceMap.size===sources.length&&sources.length===manifest.counts.sources,'source identities/count mismatch');
  for(const source of sources){
    expect(typeof source.title==='string'&&source.title.length>0,`${source.id}: title missing`);
    expect(/^10\.\d{4,9}\/[^\s<>]+$/.test(source.doi),`${source.id}: DOI missing or malformed`);
    const url=new URL(source.url);
    expect(url.protocol==='https:'&&!url.username&&!url.password,`${source.id}: public HTTPS URL required`);
    expect(Array.isArray(source.locations)&&source.locations.length>0&&source.locations.every(value=>typeof value==='string'&&value.length>0),`${source.id}: original locator missing`);
    expect(typeof source.accessStatus==='string'&&source.accessStatus.length>0,`${source.id}: access status missing`);
    expect(Array.isArray(source.originals),`${source.id}: original fingerprint list required`);
  }
  const visit=(value,at)=>{
    if(typeof value==='string')expect(!/(?:\/Users\/|\/private\/|file:\/\/|[A-Z]:\\)/.test(value),`${at}: private absolute path`);
    if(typeof value==='number')expect(Number.isFinite(value),`${at}: nonfinite value`);
    if(Array.isArray(value)){value.forEach((entry,index)=>visit(entry,`${at}[${index}]`));return;}
    if(value&&typeof value==='object'){
      for(const [key,entry] of Object.entries(value)){
        expect(!/^(?:pdfText|fullText|pageText|ocrText|originalText|sourceCode)$/i.test(key),`${at}.${key}: original text/code is not an archival fact`);
        if(key==='sourceIds')expect(Array.isArray(entry)&&entry.length>0&&entry.every(id=>sourceMap.has(id)),`${at}: unresolved source IDs`);
        if(key==='sourceId')expect(sourceMap.has(entry),`${at}: unresolved source ID`);
        visit(entry,`${at}.${key}`);
      }
    }
  };
  for(const [name,data] of Object.entries(archive)){
    expect(data.schemaVersion===1,`${name}: unsupported schema`);
    visit(data,name);
  }
  const branches=archive['branching-fractions.json'].records;
  expect(branches.length===7&&branches.length===manifest.counts.directTheoreticalBranches,'seven reviewed direct branches required, including weak 1P1 branch');
  expect(new Set(branches.map(row=>row.id)).size===branches.length,'duplicate direct branch identity');
  for(const [upper,lower,value,uncertainty] of expectedBranches){
    const matches=branches.filter(row=>row.upperLevelId===upper&&row.lowerLevelId===lower);
    expect(matches.length===1,`${upper}->${lower}: missing/duplicate branch`);
    const row=matches[0];
    expect(row.value===value&&row.uncertainty===uncertainty,`${row.id}: published beta/uncertainty differs`);
    expect(row.quantity==='direct-spontaneous-branching-fraction'&&row.unit==='1'&&row.mechanism==='E1',`${row.id}: direct branching definition/unit changed`);
    expect(row.evidenceKind==='theory-derived'&&row.reviewStatus==='original-source-checked',`${row.id}: theory cannot be promoted to experiment`);
    expect(row.adoptionState==='verified-candidate-for-runtime-theory-model',`${row.id}: candidate adoption state missing`);
    expect(row.sourceIds.includes('kroeze-2026')&&row.sourceIds.includes('porsev-1999'),`${row.id}: compilation-to-primary chain missing`);
    expect(typeof row.normalizationScope==='string'&&row.normalizationScope.includes('not experimentally'),`${row.id}: completeness boundary missing`);
    expect(row.conditions.F===null&&row.conditions.mF===null&&row.conditions.radiationTemperature_K===null,`${row.id}: unreported F/mF/T must remain unknown`);
  }
  const fractions=archive['branching-fractions.json'];
  expect(fractions.noSilentRenormalization===true,'reported values must not be silently normalized');
  expect(fractions.rounding.D1_sum===.9999&&fractions.rounding.S1_three_triplet_sum===.998&&fractions.rounding.S1_four_sum===1.0001,'original rounding scope changed');
  const leak=fractions.aggregateLeakage[0];
  expect(leak.value===6e-8&&leak.uncertainty===4e-8&&leak.groundExpression==='1 - 6(4)e-8'&&leak.evidenceKind==='theory-derived','1P1 aggregate leakage expression/uncertainty missing');
  const states=archive['applicability.json'].states;
  expect(states.length===8&&new Set(states.map(row=>row.levelId)).size===8,'eight diagram state boundaries required');
  expect(states.every(row=>row.branchingValue===null),'state-level placeholder cannot become invented exact branching');
  expect(states.find(row=>row.levelId==='yb171-6s65s-3s1-triplet-connected')?.status==='pending','65S must remain pending');
  expect(states.find(row=>row.levelId==='yb171-6s6p-3p2')?.status==='F-dependent-pending-branch-table','3P2 requires F-resolved boundaries');
  const rates=archive['rate-evidence.json'];
  expect(rates.records.length===manifest.counts.rateEvidenceRecords&&rates.records.every(row=>row.adoptionState==='evidence-only-not-normalized-branch'),'partial/average rates cannot become normalized beta');
  const conflicts=archive['conflicts.json'].records;
  expect(conflicts.length===manifest.counts.conflicts,'conflict count mismatch');
  for(const id of ['covey-3d1-ratios','senoo-spin-mapping','cho-effective-rate-sum'])expect(conflicts.some(row=>row.id===id),`unresolved original difference lost: ${id}`);
  const senoo=conflicts.find(row=>row.id==='senoo-spin-mapping');
  expect(senoo.originalClaims.methods_p10.m1==='2.7(5)%'&&senoo.originalClaims.extendedDataFig5b_p18.m1==='4(1)%','Senoo conflicting original mappings must both be retained');
  expect(sourceMap.get('honda-1999').accessStatus==='abstract-only'&&sourceMap.get('honda-1999-erratum').accessStatus==='metadata-only','unread Honda/erratum cannot be marked full-text reviewed');
  expect(sourceMap.get('loftus-2000').originals.length===0,'Loftus missing original PDF must remain missing in this frozen audit');
  const additional=archive['additional-reviewed-facts.json'];
  expect(additional.canonicalAdopted===false&&additional.newlyReviewed.length===manifest.counts.additionalReviewedComparisons,'additional literature must remain review-only');
  expect(additional.newlyReviewed.every(row=>row.adoptionState==='review-only-not-adopted'),'additional facts cannot automatically change canonical data');
  const li=additional.newlyReviewed.find(row=>row.sourceId==='li-2025');
  expect(li?.location==='PDFp9 AppendixA3 and p14 TableI'&&li.fractions['3D1->3P0']===.64&&li.fractions['3S1->3P1']===.367&&li.fractions['3S1->3P2']===.503,'Li fixed inputs and corrected TableI locator must stay distinct from adopted beta');
  const ishiyama=additional.newlyReviewed.find(row=>row.sourceId==='ishiyama-2026');
  expect(ishiyama?.isotope===174&&ishiyama.Gamma_e_to_g_per_s.value===.05&&ishiyama.Gamma_total_per_s.value===.169&&ishiyama.zeroScatteringExtrapolatedRate_per_s.uncertainty===.04,'Ishiyama state/rate evidence changed without review');
  expect(!Object.hasOwn(ishiyama,'beta')&&ishiyama.authorsQuotedLifetime_s===66,'environmental rate ratio is not a natural branching fraction or simple reciprocal lifetime inference');
  const canonicalPath=path.join(root,'data/decay.json');
  if(verifyCanonical){
    expect(fs.existsSync(canonicalPath),'data/decay.json missing');
    const canonical=JSON.parse(fs.readFileSync(canonicalPath,'utf8'));
    for(const row of branches){
      const adopted=canonical.records.find(record=>record.levelId===row.upperLevelId)?.branches.filter(branch=>branch.lowerLevelId===row.lowerLevelId);
      expect(adopted?.length===1&&adopted[0].value===row.value&&adopted[0].uncertainty===row.uncertainty,`${row.id}: canonical adopted beta differs from checked source`);
      expect(adopted[0].evidenceKind==='theory',`${row.id}: canonical theory status differs`);
    }
  }
  const availability=[];
  for(const source of sources)for(const item of source.originals){
    expect(['repository','paper-library'].includes(item.root),`${source.id}: original root unknown`);
    expect(/^[a-f0-9]{64}$/.test(item.sha256),`${source.id}: original SHA256 missing`);
    const relative=item.root==='repository'?resolvePaperPath(root,item.path,item.sha256):item.path;
    const file=safePath(item.root==='repository'?root:paperLibraryRoot,relative);
    const available=fs.existsSync(file);
    if(available&&verifyOriginals){
      const bytes=fs.readFileSync(file);
      expect(bytes.subarray(0,5).toString()==='%PDF-',`${source.id}: original is not a PDF`);
      expect(sha256(bytes)===item.sha256,`${source.id}: original SHA256 mismatch`);
      if(item.bytes!==null)expect(bytes.length===item.bytes,`${source.id}: original byte size mismatch`);
    }
    availability.push({sourceId:source.id,path:item.path,available,verified:available&&verifyOriginals});
  }
  const lineage=manifest.lineage.map(item=>{
    expect(/^[a-f0-9]{64}$/.test(item.sha256),'historical survey fingerprint missing');
    const file=safePath(root,item.path),available=fs.existsSync(file);
    if(available&&verifyOriginals)expect(sha256(fs.readFileSync(file))===item.sha256,`${item.path}: historical survey SHA256 mismatch`);
    return {path:item.path,available,verified:available&&verifyOriginals};
  });
  const sourcesWithoutOriginals=sources.filter(source=>source.originals.length===0).map(source=>({sourceId:source.id,accessStatus:source.accessStatus}));
  return {status:'passed',sources:sources.length,directBranches:branches.length,rateEvidence:rates.records.length,conflicts:conflicts.length,canonicalChecked:verifyCanonical,originalsChecked:availability.filter(row=>row.verified).length,registeredOriginalsUnavailable:availability.filter(row=>!row.available).length,sourcesWithoutOriginals,historicalSurveysChecked:lineage.filter(row=>row.verified).length,availability,lineage};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log(JSON.stringify(verifyDecayArchive(),null,2));}
  catch(error){console.error(error.message);process.exitCode=1;}
}
