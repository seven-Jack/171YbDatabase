// Deliberately damage an isolated copy, never the production working tree.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'yb171-test-sensitivity-'));
try{
  fs.writeFileSync(path.join(temporary,'package.json'),'{"type":"module"}\n');
  for(const name of ['src/physics','tests/physics/rabi.test.js','tests/fixtures/physics-baseline.json']){
    const target=path.join(temporary,name);fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.cpSync(path.join(root,name),target,{recursive:true});
  }
  const target=path.join(temporary,'src/physics/rabi.js');
  const original=fs.readFileSync(target,'utf8');
  const needle='return spRabi(d_ea0, P_mW, w_um).fR;';
  if(!original.includes(needle))throw Error('The mutation target changed; review this check.');
  fs.writeFileSync(target,original.replace(needle,'return 2 * spRabi(d_ea0, P_mW, w_um).fR;'));
  const damaged=spawnSync(process.execPath,['--test','tests/physics/rabi.test.js'],{cwd:temporary,encoding:'utf8'});
  if(damaged.error)throw damaged.error;
  if(damaged.status===0)throw Error('The tests did not detect a doubled production Rabi output.');
  fs.writeFileSync(target,original);
  const repaired=spawnSync(process.execPath,['--test','tests/physics/rabi.test.js'],{cwd:temporary,encoding:'utf8'});
  if(repaired.error)throw repaired.error;
  if(repaired.status!==0)throw Error(repaired.stdout+repaired.stderr);
  console.log('Test sensitivity passed: isolated production Rabi ×2 fails; restored production implementation passes.');
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
