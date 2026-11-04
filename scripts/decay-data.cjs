const fs = require('node:fs');
const path = require('node:path');

const rootDirectory = path.resolve(__dirname, '..');
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}$/;
const VERSION = /^\d+\.\d+\.\d+(?:\.\d+)?$/;
const KINDS = ['theory','experiment','approximation','pending','not-applicable'];
const STATUSES = ['quantified-model','approximate','pending','not-applicable'];
const MECHANISMS = ['E1','HFI-E1','M1','M2'];

/** A public, independently versioned decay dataset; no science model is evaluated here. */
function validateDecay(data, {levels} = {}) {
  const errors = [];
  const error = (at,message) => errors.push(`${at}: ${message}`);
  const object = (value,keys,at) => {
    if (!value || typeof value!=='object' || Array.isArray(value) || Object.getPrototypeOf(value)!==Object.prototype) {
      error(at,'expected plain object');return false;
    }
    for (const key of keys) if (!Object.hasOwn(value,key)) error(`${at}.${key}`,'required field');
    for (const key of Object.keys(value)) if (!keys.includes(key)) error(`${at}.${key}`,'unknown public field');
    return true;
  };
  const string = (value,at,pattern) => {
    if (typeof value!=='string' || !value.trim() || value.length>1800) {error(at,'expected nonempty bounded text');return;}
    if (/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) || /(?:file:\/\/|\/Users\/|\/private\/|[A-Z]:\\|references\/papers|data\/literature)/i.test(value)) error(at,'unsafe public metadata');
    if (pattern && !pattern.test(value)) error(at,'invalid format');
  };
  const enumeration = (value,allowed,at) => {if (!allowed.includes(value)) error(at,'invalid classification');};
  const number = (value,at,min=0,max=Infinity) => {
    if (typeof value!=='number' || !Number.isFinite(value) || value<min || value>max) error(at,'invalid finite number');
  };
  const array = (value,at,visit,min=0,max=100) => {
    if (!Array.isArray(value) || value.length<min || value.length>max) {error(at,'invalid bounded array');return;}
    value.forEach((item,index)=>visit(item,`${at}[${index}]`));
  };
  const texts = (value,at,min=1) => array(value,at,(item,key)=>string(item,key),min);
  const unique = (items,field,at) => {
    if (!Array.isArray(items)) return;
    const values=items.map(item=>field?item?.[field]:item);
    if (new Set(values).size!==values.length) error(at,'duplicate identity');
  };
  const refs = (value,at,min=1) => {
    array(value,at,(item,key)=>{string(item,key,ID);if (!sourceIds.has(item)) error(key,'unknown source');},min);
    unique(value,null,at);
  };
  const sourceIds = new Set();
  const levelIds = new Set();
  try {
    levels ||= JSON.parse(fs.readFileSync(path.join(rootDirectory,'data/levels.json'),'utf8'));
    for (const row of levels.records) levelIds.add(row.id);
  } catch { error('levels','canonical level registry unavailable'); }

  if (!object(data,['schemaVersion','decayVersion','reviewedAt','definition','sources','records'],'decay')) return {valid:false,errors};
  if (data.schemaVersion!==1) error('schemaVersion','unsupported decay schema');
  string(data.decayVersion,'decayVersion',VERSION);
  string(data.definition,'definition');
  string(data.reviewedAt,'reviewedAt',/^\d{4}-\d{2}-\d{2}$/);
  if (typeof data.reviewedAt==='string' && (!Number.isFinite(Date.parse(`${data.reviewedAt}T00:00:00Z`)) || new Date(`${data.reviewedAt}T00:00:00Z`).toISOString().slice(0,10)!==data.reviewedAt)) error('reviewedAt','invalid calendar date');
  array(data.sources,'sources',(source,at)=>{
    if (!object(source,['id','title','doi','url','locations'],at)) return;
    string(source.id,`${at}.id`,ID);
    if (sourceIds.has(source.id)) error(`${at}.id`,'duplicate source');
    sourceIds.add(source.id);
    string(source.title,`${at}.title`);
    string(source.doi,`${at}.doi`,/^10\.\d{4,9}\/[^\s<>]+$/);
    string(source.url,`${at}.url`);
    try {const url=new URL(source.url);if (url.protocol!=='https:' || url.username || url.password || !url.hostname.includes('.')) throw Error();}
    catch {error(`${at}.url`,'expected public HTTPS URL without credentials');}
    texts(source.locations,`${at}.locations`);
  },1);
  const recordIds = new Set();
  const branchIds = new Set();
  const rateIds = new Set();
  array(data.records,'records',(record,at)=>{
    if (!object(record,['levelId','status','evidenceKind','summary','boundary','conditions','sourceIds','normalizationScope','branches','rateEvidence'],at)) return;
    string(record.levelId,`${at}.levelId`,ID);
    if (!levelIds.has(record.levelId)) error(`${at}.levelId`,'unknown canonical level');
    if (recordIds.has(record.levelId)) error(`${at}.levelId`,'duplicate level record');
    recordIds.add(record.levelId);
    enumeration(record.status,STATUSES,`${at}.status`);
    enumeration(record.evidenceKind,KINDS,`${at}.evidenceKind`);
    const expectedKind={'quantified-model':'theory',approximate:'approximation',pending:'pending','not-applicable':'not-applicable'}[record.status];
    if (record.evidenceKind!==expectedKind) error(`${at}.evidenceKind`,'record status and evidence kind disagree');
    for (const key of ['summary','boundary','normalizationScope']) string(record[key],`${at}.${key}`);
    texts(record.conditions,`${at}.conditions`);refs(record.sourceIds,`${at}.sourceIds`);
    array(record.branches,`${at}.branches`,(branch,bAt)=>{
      if (!object(branch,['id','lowerLevelId','label','mechanism','status','evidenceKind','value','uncertainty','expression','sourceIds','sourceLocator','conditions','missingReason'],bAt)) return;
      string(branch.id,`${bAt}.id`,ID);
      if (branchIds.has(branch.id)) error(`${bAt}.id`,'duplicate branch');
      branchIds.add(branch.id);
      string(branch.lowerLevelId,`${bAt}.lowerLevelId`,ID);
      if (!levelIds.has(branch.lowerLevelId) || branch.lowerLevelId===record.levelId) error(`${bAt}.lowerLevelId`,'unknown or identical lower level');
      const upperEnergy=levels?.records?.find(row=>row.id===record.levelId)?.quantities?.energy_cm?.value;
      const lowerEnergy=levels?.records?.find(row=>row.id===branch.lowerLevelId)?.quantities?.energy_cm?.value;
      if (Number.isFinite(upperEnergy) && Number.isFinite(lowerEnergy) && lowerEnergy>=upperEnergy) error(`${bAt}.lowerLevelId`,'spontaneous decay requires a lower-energy final state');
      for (const key of ['label','sourceLocator']) string(branch[key],`${bAt}.${key}`);
      enumeration(branch.mechanism,MECHANISMS,`${bAt}.mechanism`);
      enumeration(branch.status,['quantified-model','approximate','pending'],`${bAt}.status`);
      enumeration(branch.evidenceKind,KINDS,`${bAt}.evidenceKind`);
      if (branch.evidenceKind!==({'quantified-model':'theory',approximate:'approximation',pending:'pending'}[branch.status])) error(`${bAt}.evidenceKind`,'branch status and evidence kind disagree');
      if (branch.value===null) {
        if (branch.status==='quantified-model') error(`${bAt}.value`,'quantified branch needs a number');
        string(branch.missingReason,`${bAt}.missingReason`);
        if (branch.uncertainty!==null) error(`${bAt}.uncertainty`,'unknown branch cannot assign numeric uncertainty');
        string(branch.expression,`${bAt}.expression`);
      } else {
        number(branch.value,`${bAt}.value`,0,1);
        if (branch.status!=='quantified-model' || branch.evidenceKind!=='theory') error(`${bAt}.value`,'approximate or pending branch cannot be numeric');
        number(branch.uncertainty,`${bAt}.uncertainty`,0,1);
        if (branch.missingReason!==null) error(`${bAt}.missingReason`,'quantified branch must not claim missing');
      }
      if (branch.expression!==null) string(branch.expression,`${bAt}.expression`);
      refs(branch.sourceIds,`${bAt}.sourceIds`);texts(branch.conditions,`${bAt}.conditions`);
    });
    array(record.rateEvidence,`${at}.rateEvidence`,(rate,rAt)=>{
      if (!object(rate,['id','label','value','uncertainty','unit','mechanism','upperF','status','evidenceKind','sourceIds','sourceLocator','conditions','uncertaintyNote'],rAt)) return;
      string(rate.id,`${rAt}.id`,ID);
      if (rateIds.has(rate.id)) error(`${rAt}.id`,'duplicate rate evidence');
      rateIds.add(rate.id);
      for (const key of ['label','sourceLocator','uncertaintyNote']) string(rate[key],`${rAt}.${key}`);
      number(rate.value,`${rAt}.value`);
      if (rate.uncertainty!==null) number(rate.uncertainty,`${rAt}.uncertainty`);
      if (rate.unit!=='s^-1') error(`${rAt}.unit`,'rate evidence requires s^-1, never a branching fraction');
      enumeration(rate.mechanism,MECHANISMS,`${rAt}.mechanism`);
      enumeration(rate.status,['original-source-checked'],`${rAt}.status`);
      enumeration(rate.evidenceKind,['theory','experiment'],`${rAt}.evidenceKind`);
      if (rate.upperF!==null) {
        number(rate.upperF,`${rAt}.upperF`);
        const J=levels?.records?.find(row=>row.id===record.levelId)?.attributes?.J;
        if (!Number.isInteger(rate.upperF*2) || ![Math.abs(J-.5),J+.5].includes(rate.upperF)) error(`${rAt}.upperF`,'F is not available for this 171Yb level');
      }
      refs(rate.sourceIds,`${rAt}.sourceIds`);texts(rate.conditions,`${rAt}.conditions`);
    });
    if (record.status==='not-applicable' && ((record.branches?.length||0)+(record.rateEvidence?.length||0)>0)) error(at,'not-applicable state cannot have a numeric decay table');
    if (record.status==='pending' && Array.isArray(record.branches) && record.branches.some(branch=>branch?.value!==null)) error(at,'pending state cannot adopt a numeric branch');
    if (record.status==='quantified-model') {
      if (!Array.isArray(record.branches) || !record.branches.length || record.branches.some(branch=>branch?.value===null)) error(at,'quantified model needs numeric branches');
      const sum=Array.isArray(record.branches)?record.branches.reduce((total,branch)=>total+branch?.value,0):NaN;
      if (!Number.isFinite(sum) || Math.abs(sum-1)>0.00015) error(`${at}.branches`,'model branch sum outside stated source rounding tolerance; do not renormalize');
    }
  },1);
  if (Array.isArray(levels?.coreLevelIds)) {
    for (const id of levels.coreLevelIds) if (!recordIds.has(id)) error('records',`missing core-level decay status: ${id}`);
  }
  return {valid:errors.length===0,errors};
}

function prepareDecay(data,options={}) {
  const validation=validateDecay(data,options);
  if (!validation.valid) throw new Error(`Invalid public decay data:\n${validation.errors.join('\n')}`);
  return '// GENERATED from data/decay.json by scripts/decay-data.cjs. Do not edit.\n// Source audit is not independent experimental validation.\nexport const decayData = '+JSON.stringify(data,null,2)+';\n';
}

function exportDecay({root=rootDirectory,check=false}={}) {
  const input=JSON.parse(fs.readFileSync(path.join(root,'data/decay.json'),'utf8'));
  const levels=JSON.parse(fs.readFileSync(path.join(root,'data/levels.json'),'utf8'));
  const output=prepareDecay(input,{levels});
  const target=path.join(root,'src/data/generated-decay.js');
  const changed=!fs.existsSync(target) || fs.readFileSync(target,'utf8')!==output;
  if (changed && check) throw new Error('src/data/generated-decay.js is stale; run node scripts/decay-data.cjs');
  if (changed) {fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,output);}
  return {changed,version:input.decayVersion,records:input.records.length};
}

module.exports={validateDecay,prepareDecay,exportDecay};
if (require.main===module) {
  try {console.log(process.argv.includes('--check')?'Public decay data and generated module are current:':'Generated public decay module:',JSON.stringify(exportDecay({check:process.argv.includes('--check')})));}
  catch(error) {console.error(error.message);process.exitCode=1;}
}
