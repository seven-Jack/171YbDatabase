// Install as scripts/sync-preview.cjs. No builds, data generation, deletion or server control.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=process.env.ATLAS_PREVIEW_ROOT || path.resolve(__dirname,'..');
const out=path.join(root,'dist');
const allowed=['index.html','src/bootstrap.js','src/main.js','src/version.js','src/ui/chart-ranges.js','src/ui/hyperfine-diagram.js','src/ui/rabi-chart.js','src/ui/tooltips.js','src/ui/source-panel.js','src/ui/r2-provenance.js','src/styles/tokens.css','src/styles/layout.css'];
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const manifestPath=path.join(out,'artifact-manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath));
const entries=new Map(manifest.files.map(entry=>[entry.path,entry]));
for(const entry of manifest.files){
 const file=path.join(out,entry.path);
 if(!fs.existsSync(file)||hash(fs.readFileSync(file))!==entry.sha256)throw Error(`Preview changed since its manifest: ${entry.path}; inspect before syncing.`);
 if(entry.path!=='build-info.json'&&!allowed.includes(entry.path)&&fs.existsSync(path.join(root,entry.path))&&hash(fs.readFileSync(path.join(root,entry.path)))!==entry.sha256)throw Error(`Outside preview allowlist: ${entry.path}`);
}
const drift=allowed.filter(name=>!entries.has(name)||hash(fs.readFileSync(path.join(root,name)))!==entries.get(name).sha256);
if(!process.argv.includes('--apply')){
 console.log(JSON.stringify({mode:'check',drift,metadataOnlyMayNeedRefresh:fs.readFileSync(path.join(root,'src/version.js'),'utf8').includes('WORKTREE_DIRTY = false')},null,2));
 process.exitCode=drift.length?1:0;
}else{
 const index=process.argv.indexOf('--backup');
 if(index<0||!process.argv[index+1])throw Error('--apply requires --backup <external-directory>');
 const backup=path.resolve(process.argv[index+1]);
 if(backup===root||backup.startsWith(root+path.sep))throw Error('Backup must be outside the repository.');
 if(fs.existsSync(backup))throw Error('Use a fresh backup directory.');
 fs.mkdirSync(backup,{recursive:true});
 require(path.join(root,'scripts/write-version.cjs')).writeVersion(root);
 const changes=allowed.filter(name=>!entries.has(name)||hash(fs.readFileSync(path.join(root,name)))!==entries.get(name).sha256);
 for(const name of [...changes,'build-info.json','artifact-manifest.json']){
  const current=path.join(out,name);
  if(fs.existsSync(current)){const save=path.join(backup,name);fs.mkdirSync(path.dirname(save),{recursive:true});fs.copyFileSync(current,save);}
 }
 for(const name of changes){
  const bytes=fs.readFileSync(path.join(root,name));
  fs.mkdirSync(path.dirname(path.join(out,name)),{recursive:true});fs.writeFileSync(path.join(out,name),bytes);
  entries.set(name,{path:name,bytes:bytes.length,sha256:hash(bytes)});
 }
 const metadata=JSON.parse(fs.readFileSync(path.join(out,'build-info.json')));
 Object.assign(metadata,require(path.join(root,'scripts/write-version.cjs')).readVersion(root));
 delete metadata.sourceTimestamp;metadata.sourceTimestamp=manifest.sourceTimestamp;
 metadata.previewRevision=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/data-ui-revision="([^"]+)"/)?.[1] || 'unmarked-local-preview';
 const info=Buffer.from(JSON.stringify(metadata,null,2)+'\n');
 fs.writeFileSync(path.join(out,'build-info.json'),info);
 entries.set('build-info.json',{path:'build-info.json',bytes:info.length,sha256:hash(info)});
 const next={...manifest,...metadata,files:[...entries.values()].sort((a,b)=>a.path.localeCompare(b.path))};
 fs.writeFileSync(manifestPath,JSON.stringify(next,null,2)+'\n');
 console.log(JSON.stringify({mode:'apply',changed:changes,backup,previewRevision:metadata.previewRevision},null,2));
}
