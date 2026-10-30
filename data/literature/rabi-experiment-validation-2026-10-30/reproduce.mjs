import fs from 'node:fs';
import {verifyLocalEvidence} from '../../../scripts/local-evidence.mjs';
import {CATALOG,CORE_TRANSITIONS,DATASET_VERSION,getQuantity} from '../../../src/data/catalog.js';
import {FORMULA_VERSION} from '../../../src/physics/constants.js';
import {computeDEff} from '../../../src/physics/angular.js';
import {spRabi,calculateRabi} from '../../../src/physics/rabi.js';

export function reproduce() {
  const evidence=JSON.parse(fs.readFileSync(new URL('./cases.json',import.meta.url),'utf8'));
  const root=new URL('../../../',import.meta.url);
  const sourceHashes=[evidence.primaryCase,evidence.auxiliaryCase].map(item=>
    verifyLocalEvidence(root,{...item.source,id:item.id}));
  const p=evidence.primaryCase;
  const missing=calculateRabi({multipole:'E1',dEff_ea0:p.independentDipole.dEff_ea0,
    P_mW:p.reportedExperiment.componentPower_mW,w_um:p.reportedExperiment.waist_um});
  const a=evidence.auxiliaryCase,ex=a.reportedExperiment;
  const t=CORE_TRANSITIONS.find(row=>row.id===ex.transitionId);
  const d=computeDEff({transition:t,J_lower:0,J_upper:0,F_lower:.5,F_upper:.5,
    convention:'F-reduced',dReduced:t.d_num,pol:ex.pol,selectedChannel:ex.channel}).dEff;
  const result=spRabi(d,ex.power_nW*1e-6,ex.waist_um);
  const nominal=1/(2*ex.piPulseTime_ms*1e-3);
  return {
    schemaVersion:1,datasetVersion:DATASET_VERSION,formulaVersion:FORMULA_VERSION,sourceHashes,
    overallVerdict:'independent-experimental-validation-not-established',
    primaryCase:{id:p.id,calculationStatus:missing.status,computedRabi_Hz:null,
      measuredRabi_Hz:p.reportedExperiment.rabiOrdinary_MHz*1e6,residual_Hz:null,
      reason:'Missing independently established dipole for the same experimental state; no substitution of saved n=65 R2 and no dipole fitted to the target.'},
    auxiliaryCase:{id:a.id,frequencyEvidence:ex.frequencyEvidence,nominalPiDerived_Hz:nominal,
      dF_ea0:t.d_num,dEff_ea0:d,dipoleEvidence:getQuantity('T3','d_num'),
      power_nW:ex.power_nW,waist_um:ex.waist_um,computedRabi_Hz:result.fR,
      predictedPiTime_ms:result.tPi*1000,differenceFromNominal_Hz:result.fR-nominal,
      relativeDifference_percent:(result.fR/nominal-1)*100,
      verdict:'nominal-operating-point-values-disagree-cause-not-established',
      isDirectMeasuredRabiBenchmark:false},
    canonicalTransitionCount:CATALOG.transitions.records.length
  };
}

if(process.argv[1]&&new URL(process.argv[1],'file:').href===import.meta.url) {
  const result=reproduce();
  fs.writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}
