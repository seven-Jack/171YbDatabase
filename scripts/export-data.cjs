const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {DATA_FILES,loadCatalog,validateCatalog} = require('./validate-data.cjs');
const PROJECT_ROOT = path.resolve(__dirname,'..');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

function renderCsv(saved) {
  const {columns,rows,lineEnding,finalNewline}=saved.csv;
  const newline=lineEnding==='CRLF'?'\r\n':'\n';
  const escape = value => /[",\r\n]/.test(String(value)) ? '"'+String(value).replaceAll('"','""')+'"' : String(value);
  return [columns.join(','),...rows.map(row=>columns.map(column=>escape(row[column])).join(','))].join(newline)+(finalNewline?newline:'');
}

function prepareOutputs(root=PROJECT_ROOT) {
  const catalog=loadCatalog(root);
  validateCatalog(catalog,root);
  const manifestPath=path.join(root,'data','dataset.json');
  const previous=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const files=DATA_FILES.map(name=>({path:`data/${name}`,sha256:sha256(fs.readFileSync(path.join(root,'data',name)))}));
  const csv=renderCsv(catalog.hyperfine.saved65S);
  const exports=[{path:catalog.hyperfine.saved65S.csv.compatibilityPath,sha256:sha256(csv)}];
  const contentHash=sha256(JSON.stringify([...files,...exports]));
  const manifest={...previous,generatedAt:previous.contentHash===contentHash&&previous.generatedAt?previous.generatedAt:new Date().toISOString(),contentHash,files,exports};
  const generated='// GENERATED from data/*.json by scripts/export-data.cjs. Do not edit.\n// Schema and regression success are software checks, not physical validation.\nexport const canonicalCatalog = '+JSON.stringify(catalog,null,2)+';\nexport const datasetManifest = '+JSON.stringify(manifest,null,2)+';\n';
  return new Map([
    [manifestPath,JSON.stringify(manifest,null,2)+'\n'],
    [path.join(root,'src/data/generated-catalog.js'),generated],
    [path.join(root,catalog.hyperfine.saved65S.csv.compatibilityPath),csv]
  ]);
}

function exportData({root=PROJECT_ROOT,check=false}={}) {
  const outputs=prepareOutputs(root);
  for (const [filename,content] of outputs) {
    if (check) {
      if (!fs.existsSync(filename)||fs.readFileSync(filename,'utf8')!==content) throw new Error(`${path.relative(root,filename)} is stale; run node scripts/export-data.cjs`);
    } else {
      fs.mkdirSync(path.dirname(filename),{recursive:true});
      if (!fs.existsSync(filename)||fs.readFileSync(filename,'utf8')!==content) fs.writeFileSync(filename,content);
    }
  }
  return outputs;
}
module.exports={exportData,prepareOutputs,renderCsv,sha256};
if (require.main===module) {
  try { exportData({check:process.argv.includes('--check')});console.log(process.argv.includes('--check')?'Generated data and CSV are current.':'Generated catalog, manifest and compatible 65S CSV.'); }
  catch(error) { console.error(error.message);process.exitCode=1; }
}
