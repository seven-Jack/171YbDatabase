import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const prefix='references/papers/';
const rootPath=root=>root instanceof URL?fileURLToPath(root):path.resolve(root);
const fail=message=>{throw Error(`Paper path aliases: ${message}`);};
const safePaperPath=(value,{target=false}={})=>{
  if(typeof value!=='string'||!value.startsWith(prefix)||value.includes('\\')||
      /[\u0000-\u001f\u007f%]/.test(value)||value.includes(':')||value.includes('?')||value.includes('#'))return false;
  const basename=value.slice(prefix.length);
  return basename.length>0&&!basename.includes('/')&&!['.','..'].includes(basename)&&
    (!target||basename.endsWith('.pdf'));
};

/** Current locators only. Historical evidence records keep their original paths. */
export function readPaperPathAliases(root){
  const manifest=path.join(rootPath(root),'references/paper-path-aliases.json');
  let data;
  try{data=JSON.parse(fs.readFileSync(manifest,'utf8'));}
  catch(error){if(error.code==='ENOENT')return [];throw error;}
  if(data.schemaVersion!==1||!Array.isArray(data.aliases))fail('unsupported manifest schema');
  const oldPaths=new Set(),targets=new Set();
  for(const item of data.aliases){
    if(!safePaperPath(item.oldPath)||!safePaperPath(item.path,{target:true}))fail('unsafe paper locator');
    if(item.oldPath===item.path)fail('self-referencing locator');
    if(!/^[a-f0-9]{64}$/.test(item.sha256))fail('invalid SHA-256');
    if(!Number.isSafeInteger(item.bytes)||item.bytes<=0)fail('invalid byte size');
    if(oldPaths.has(item.oldPath))fail(`duplicate original locator: ${item.oldPath}`);
    if(targets.has(item.path))fail(`duplicate target locator: ${item.path}`);
    oldPaths.add(item.oldPath);targets.add(item.path);
  }
  const byOld=new Map(data.aliases.map(item=>[item.oldPath,item]));
  for(const start of data.aliases){
    const seen=new Set();let item=start;
    while(item){
      if(seen.has(item.oldPath))fail('cyclic locator chain');
      seen.add(item.oldPath);
      if(item.sha256!==start.sha256||item.bytes!==start.bytes)fail('locator chain changes document fingerprint');
      item=byOld.get(item.path);
    }
  }
  return data.aliases;
}

/**
 * Resolve only a reviewed, fingerprint-bound rename. Prefer any still-present
 * historical file so changed old bytes cannot be hidden by a valid new copy.
 * This function does not assert availability or scientific validity.
 */
export function resolvePaperPath(root,relative,expectedSha256){
  const aliases=readPaperPathAliases(root);
  const byOld=new Map(aliases.map(item=>[item.oldPath,item]));
  let current=relative,item=byOld.get(current);
  while(item){
    if(item.sha256!==expectedSha256)fail(`expected SHA-256 disagrees with rename: ${relative}`);
    const file=path.join(rootPath(root),current);
    try{
      const stat=fs.lstatSync(file);
      if(stat.isSymbolicLink())fail(`symlink is not a reviewed paper: ${current}`);
      return current;
    }catch(error){if(error.code!=='ENOENT')throw error;}
    current=item.path;item=byOld.get(current);
  }
  if(current!==relative){
    try{
      if(fs.lstatSync(path.join(rootPath(root),current)).isSymbolicLink())fail(`symlink is not a reviewed paper: ${current}`);
    }catch(error){if(error.code!=='ENOENT')throw error;}
  }
  return current;
}
