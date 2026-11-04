import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const componentNames=['honda-loftus.json','guo.json','blagoev-yb.json'];
export const directory=path.dirname(fileURLToPath(import.meta.url));
const preferred=['id','sourceId','species','isotope','chargeState','quantity','upperState','lowerState','value','uncertainty','unit','evidenceKind','provenance','locator'];
export function buildRecordsCSV(components){
  const records=components.flatMap(data=>data.records);
  const keys=new Set(records.flatMap(record=>Object.keys(record)));
  const fields=[...preferred.filter(key=>keys.has(key)),...[...keys].filter(key=>!preferred.includes(key)).sort()];
  const cell=value=>{
    const text=value===undefined?'':typeof value==='object'?JSON.stringify(value):String(value);
    return /[",\r\n]/.test(text)?'"'+text.replaceAll('"','""')+'"':text;
  };
  return [fields.join(','),...records.map(record=>fields.map(key=>cell(record[key])).join(','))].join('\n')+'\n';
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2);
    if(args.length>1||(args[0]&&!['--check','--write'].includes(args[0])))throw Error('Use --check or explicit --write');
    const components=componentNames.map(name=>JSON.parse(fs.readFileSync(path.join(directory,name),'utf8')));
    const expected=buildRecordsCSV(components),target=path.join(directory,'records.csv');
    if(args[0]==='--write')fs.writeFileSync(target,expected);
    else if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==expected)throw Error('records.csv is stale; review JSON then explicitly export --write');
    console.log(JSON.stringify({status:'current',records:components.reduce((n,data)=>n+data.records.length,0),mode:args[0]||'--check'}));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
