const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { writeVersion, versionModuleSource } = require('./write-version.cjs');
const { exportEvidence } = require('./evidence-data.cjs');
const { exportDecay } = require('./decay-data.cjs');
const { exportData } = require('./export-data.cjs');
const { DATA_FILES } = require('./validate-data.cjs');
const { checkArtifacts } = require('./check-artifacts.cjs');
const { filesBelow, publicationFiles, relativePath, sourceFingerprint } = require('./artifact-files.cjs');

// Read static module declarations without interpreting quoted examples, comments,
// template bodies or dynamic import expressions as eager dependencies.
function staticModuleSpecifiers(source) {
  const tokens=[],parentheses=[];
  let index=0;
  const controls=['if','while','for','with','switch','catch'];
  const canStartRegexp=previous=>previous===undefined||['<control-end>','(','[','{','=',':',',',';','!','?','&','|','+','-','*','%','^','~','>','<','return','throw','case','yield','delete','void','typeof','in','instanceof','await','else'].includes(previous);
  const regexp=()=>{
    index++;let characterClass=false;
    while(index<source.length){
      if(source[index]==='\\'){index+=2;continue;}
      if(source[index]==='[')characterClass=true;
      if(source[index]===']')characterClass=false;
      if(source[index]==='/'&&!characterClass){index++;while(/[a-z]/i.test(source[index]||'')&&index<source.length)index++;return;}
      if(source[index]==='\n'||source[index]==='\r')throw new Error('Unterminated startup module regular expression');
      index++;
    }
    throw new Error('Unterminated startup module regular expression');
  };
  const quoted=quote=>{
    const start=++index;
    while(index<source.length){
      if(source[index]==='\\'){index+=2;continue;}
      if(source[index]===quote){const value=source.slice(start,index);index++;return value;}
      index++;
    }
    throw new Error('Unterminated JavaScript literal in startup module');
  };
  const comment=()=>{
    if(source.startsWith('//',index)){index=source.indexOf('\n',index+2);if(index<0)index=source.length;return true;}
    if(source.startsWith('/*',index)){const end=source.indexOf('*/',index+2);if(end<0)throw new Error('Unterminated startup module comment');index=end+2;return true;}
    return false;
  };
  const template=()=>{
    index++;
    while(index<source.length){
      if(source[index]==='\\'){index+=2;continue;}
      if(source[index]==='`'){index++;return;}
      if(source.startsWith('${',index)){
        index+=2;let depth=1,previous;const templateParentheses=[];
        while(index<source.length&&depth){
          if(/\s/.test(source[index])){index++;continue;}
          if(comment())continue;
          if(source[index]==='\''||source[index]==='"'){quoted(source[index]);previous='<string>';continue;}
          if(source[index]==='`'){template();previous='<template>';continue;}
          if(source[index]==='/'&&canStartRegexp(previous)){regexp();previous='<regexp>';continue;}
          if(/[A-Za-z_$]/.test(source[index])){const begin=index++;while(index<source.length&&/[\w$]/.test(source[index]))index++;previous=source.slice(begin,index);continue;}
          if(source[index]==='{')depth++;
          if(source[index]==='}')depth--;
          const character=source[index];
          if(character==='(')templateParentheses.push(previous);
          previous=character===')'&&controls.includes(templateParentheses.pop())?'<control-end>':character;
          index++;
        }
        continue;
      }
      index++;
    }
    throw new Error('Unterminated startup module template');
  };
  while(index<source.length){
    if(/\s/.test(source[index])){index++;continue;}
    if(comment())continue;
    if(source[index]==='`'){const start=index;template();tokens.push({kind:'template',value:'<template>',start});continue;}
    const start=index;
    if(source[index]==='/'&&canStartRegexp(tokens.at(-1)?.controlEnd?'<control-end>':tokens.at(-1)?.value)){regexp();tokens.push({kind:'regexp',value:'<regexp>',start});continue;}
    if(source[index]==='\''||source[index]==='"'){const value=quoted(source[index]);tokens.push({kind:'string',value,start});continue;}
    if(/[A-Za-z_$]/.test(source[index])){
      index++;while(index<source.length&&/[\w$]/.test(source[index]))index++;
      tokens.push({kind:'word',value:source.slice(start,index),start});continue;
    }
    const value=source[index++];
    if(value==='(')parentheses.push(tokens.at(-1)?.value);
    tokens.push({kind:'punct',value,start,controlEnd:value===')'&&controls.includes(parentheses.pop())});
  }
  const specifiers=[];
  for(let n=0;n<tokens.length;n++){
    const token=tokens[n],next=tokens[n+1];
    if(token.kind!=='word'||!['import','export'].includes(token.value)||!next)continue;
    const previous=tokens[n-1];
    const linePrefix=source.slice(source.lastIndexOf('\n',token.start-1)+1,token.start);
    if(previous&&![';','}'].includes(previous.value)&&linePrefix.trim())continue;
    if(token.value==='import'&&next.kind==='string'){specifiers.push(next.value);continue;}
    if(token.value==='import'&&['(','.'].includes(next.value))continue;
    if(token.value==='export'&&!['{','*'].includes(next.value))continue;
    for(let cursor=n+1;cursor<tokens.length&&tokens[cursor].value!==';';cursor++){
      if(tokens[cursor].value==='from'&&tokens[cursor+1]?.kind==='string'){
        specifiers.push(tokens[cursor+1].value);break;
      }
    }
  }
  return specifiers;
}

function collectStartupModules(directory, entries='src/main.js') {
  const root=fs.realpathSync(directory),seen=new Set();
  const visit=(href)=>{
    if(seen.has(href))return;
    const url=new URL(href,'https://startup.invalid/');
    const relative=path.posix.normalize(decodeURIComponent(url.pathname.slice(1)));
    if(!relative.startsWith('src/')||path.posix.extname(relative)!=='.js'||relative.includes('\\'))throw new Error(`Startup import escapes local src modules: ${href}`);
    let file=root;
    for(const part of relative.split('/')){
      file=path.join(file,part);
      if(!fs.existsSync(file))throw new Error(`Missing startup module: ${relative}`);
      if(fs.lstatSync(file).isSymbolicLink())throw new Error(`Startup module symlink is not supported: ${relative}`);
    }
    if(!fs.statSync(file).isFile())throw new Error(`Startup module is not a file: ${relative}`);
    seen.add(href);
    let specifiers;
    try{specifiers=staticModuleSpecifiers(fs.readFileSync(file,'utf8'));}
    catch(error){throw new Error(`Cannot inspect startup module ${relative}: ${error.message}`);}
    for(const specifier of specifiers){
      if(!/^\.{1,2}\//.test(specifier)||specifier.includes('\\'))throw new Error(`Startup import must be a relative local module: ${relative} → ${specifier}`);
      const resolved=new URL(specifier,url);
      if(resolved.origin!==url.origin)throw new Error(`External startup module is not supported: ${specifier}`);
      visit(resolved.pathname.slice(1)+resolved.search+resolved.hash);
    }
  };
  for(const entry of Array.isArray(entries)?entries:[entries])visit(entry);
  return [...seen].sort();
}

function injectStartupPreloads(html, modules) {
  html=html.replace(/<!-- Generated startup module preloads; source markup is unchanged\. -->[\s\S]*?<!-- End generated startup module preloads\. -->\n?/g,'');
  const existing=new Set([...html.matchAll(/<link\b(?=[^>]*\brel=["']modulepreload["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map(match=>match[1]));
  const pending=[...new Set(modules)].filter(href=>!existing.has(href));
  if(!pending.length)return html;
  // JSON script text is inert even on file://. Escaping '<' prevents a module
  // URL from closing its data script; only HTTP(S) creates actual preload links.
  const json=JSON.stringify(pending).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const block=`<!-- Generated startup module preloads; source markup is unchanged. -->\n<script type="application/json" data-startup-preloads>${json}</script>\n<script data-startup-preload-loader>\n(() => {\n  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;\n  const list = document.querySelector('script[data-startup-preloads]');\n  for (const href of JSON.parse(list.textContent)) {\n    const link = document.createElement('link');\n    link.rel = 'modulepreload';\n    link.href = href;\n    document.head.appendChild(link);\n  }\n})();\n</script>\n<!-- End generated startup module preloads. -->\n`;
  const headEnd=/<\/head\s*>/i.exec(html);
  if(headEnd){
    const beforeHeadEnd=html.slice(0,headEnd.index);
    const metadata=[...beforeHeadEnd.matchAll(/<meta\b[^>]*>|<title\b[^>]*>[\s\S]*?<\/title\s*>/gi)];
    const metadataEnd=Math.max(0,...metadata.map(match=>match.index+match[0].length));
    const stylesheet=[...beforeHeadEnd.matchAll(/<link\b(?=[^>]*\brel\s*=["']stylesheet["'])[^>]*>/gi)].find(match=>match.index>=metadataEnd);
    // A classic script after a stylesheet waits for that stylesheet. Insert
    // after encoding/title metadata but before CSS to retain parallel fetching.
    const at=stylesheet?.index??headEnd.index;
    return html.slice(0,at)+block+html.slice(at);
  }
  // Minimal build fixtures may use an implicit head; browsers accept links before scripts.
  return html.replace(/<script\b/i,block+'$&');
}

function publishDist(output, candidate, previous) {
  const lock = path.join(path.dirname(output), 'tmp', 'dist-publish.lock');
  try {
    fs.mkdirSync(lock);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    throw new Error('Another build is publishing dist. Retry after it completes.', { cause: error });
  }
  try {
    const old = fs.lstatSync(output, { throwIfNoEntry: false });
    if (old && !old.isDirectory()) {
      throw new Error('dist must be a project-owned directory, not a symlink or file');
    }
    if (old) fs.renameSync(output, previous);
    try {
      fs.renameSync(candidate, output);
    } catch (error) {
      if (old) {
        try {
          fs.renameSync(previous, output);
        } catch (restoreError) {
          throw new AggregateError([error, restoreError], 'Previous dist retained at ' + previous);
        }
      }
      throw error;
    }
  } finally {
    fs.rmdirSync(lock);
  }
}

function build(directory, options = {}) {
  const root = fs.realpathSync(directory);
  const output = path.join(root, 'dist');
  if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Missing source index.html');
  const sources = publicationFiles(root);
  const fingerprint = sourceFingerprint(root, { sourceFiles: sources });
  const version = writeVersion(root);
  const commit = options.commit || version.appCommit;
  const scratch = path.join(root, 'tmp');
  fs.mkdirSync(scratch, { recursive: true });
  if (!fs.lstatSync(scratch).isDirectory()) throw new Error('Build staging requires a project-owned tmp directory');
  const transaction = fs.mkdtempSync(path.join(scratch, 'dist-build-'));
  const candidate = path.join(transaction, 'candidate');
  const previous = path.join(transaction, 'previous');
  let published = false;
  try {
    fs.mkdirSync(candidate);
    for (const file of sources) {
      const relative = relativePath(root, file);
      if (relative === 'src/version.js') continue;
      const target = path.join(candidate, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(file, target);
    }
    if (sourceFingerprint(root, { publicationRoot: candidate }) !== fingerprint) {
      throw new Error('Build inputs changed while staging. Retry from the current source.');
    }

    // Validate the exact copies that will be published. Schemas stay in the source tree.
    const dataFile = name => path.join(candidate, 'data', name);
    // Focused build fixtures can use individual data files without a complete catalog.
    const hasCatalog = fs.existsSync(path.join(candidate, 'src/data/generated-catalog.js')) ||
      DATA_FILES.every(name => fs.existsSync(dataFile(name)));
    if (hasCatalog) exportData({ root: candidate, schemaRoot: root, check: true });
    if (fs.existsSync(dataFile('evidence.json'))) exportEvidence({ root: candidate, check: true });
    if (fs.existsSync(dataFile('decay.json'))) exportDecay({ root: candidate, check: true });

    const datasetPath = dataFile('dataset.json');
    const dataset = fs.existsSync(datasetPath) ? JSON.parse(fs.readFileSync(datasetPath, 'utf8')) : {};
    const formulaFile = path.join(candidate, 'src', 'physics', 'constants.js');
    const formulaVersion = fs.existsSync(formulaFile)
      ? fs.readFileSync(formulaFile, 'utf8').match(/export\s+const\s+FORMULA_VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1]
      : null;
    if (fs.existsSync(formulaFile) && !formulaVersion) throw new Error('The production formula module must export FORMULA_VERSION.');
    const metadata = {
      schemaVersion: 1, softwareVersion: version.softwareVersion, appCommit: commit,
      worktreeDirty: version.worktreeDirty,
      datasetVersion: dataset.datasetVersion || dataset.version || 'unversioned',
      formulaVersion: formulaVersion || dataset.formulaVersion || 'unversioned',
      sourceTimestamp: options.sourceTimestamp || (process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString() : version.sourceTimestamp),
      sourceFingerprint: fingerprint,
    };

    fs.mkdirSync(path.join(candidate, 'src'), { recursive: true });
    fs.writeFileSync(path.join(candidate, 'src/version.js'), versionModuleSource({ ...version, appCommit: commit }));
    const index = path.join(candidate, 'index.html');
    const sourceHTML = fs.readFileSync(index, 'utf8');
    const entries = ['src/main.js'];
    if (/\bimport\s*\(\s*['"]\.\/src\/bootstrap\.js['"]\s*\)/.test(sourceHTML)) entries.push('src/bootstrap.js');
    const startupModules = collectStartupModules(candidate, entries);
    fs.writeFileSync(index, injectStartupPreloads(sourceHTML, startupModules));
    fs.writeFileSync(path.join(candidate, 'build-info.json'), JSON.stringify(metadata, null, 2) + '\n');
    const manifest = {
      ...metadata,
      files: filesBelow(candidate).map(file => ({
        path: relativePath(candidate, file),
        bytes: fs.statSync(file).size,
        sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
      })),
    };
    fs.writeFileSync(path.join(candidate, 'artifact-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    checkArtifacts(candidate, { quiet: true, requireCatalogCsv: hasCatalog });
    if (sourceFingerprint(root) !== fingerprint) {
      throw new Error('Build inputs changed during assembly. Retry from the current source.');
    }
    publishDist(output, candidate, previous);
    published = true;
    if (!options.quiet) console.log('Built ' + manifest.files.length + ' files in dist/ (' + version.softwareVersion + ', ' + commit.slice(0, 8) + ').');
    return manifest;
  } finally {
    // If restoration failed, retain the last published build for recovery.
    if (published || !fs.existsSync(previous)) fs.rmSync(transaction, { recursive: true, force: true });
  }
}
module.exports = { build, filesBelow, staticModuleSpecifiers, collectStartupModules, injectStartupPreloads };
if (require.main === module) build(path.resolve(__dirname, '..'));
