import fs from 'node:fs';
import {verifyLocalEvidence} from '../../../scripts/local-evidence.mjs';
import {fileURLToPath} from 'node:url';
import {CORE_TRANSITIONS,DATASET_VERSION,getQuantity,getTransitionRecord,getLevelRecord} from '../../../src/data/catalog.js';
import {FORMULA_VERSION} from '../../../src/physics/constants.js';
import {computeDEff,computeCGChannels} from '../../../src/physics/angular.js';
import {spRabi,powerFromRabiHz,waistFromRabiHz,dipoleFromDecayRate,calculateRabi} from '../../../src/physics/rabi.js';

const root=new URL('../../../',import.meta.url);
export const evidence=JSON.parse(fs.readFileSync(new URL('./cases.json',import.meta.url),'utf8'));

export function stateFor(c) {
  const transition=CORE_TRANSITIONS.find(t=>t.id===c.transitionId);
  const record=getTransitionRecord(c.transitionId);
  return {transition,J_lower:getLevelRecord(record.lowerLevelId).attributes.J,
    J_upper:getLevelRecord(record.upperLevelId).attributes.J,
    F_lower:c.channel.F,F_upper:c.channel.Fp,dReduced:transition.d_num,
    pol:c.pol,selectedChannel:c.channel};
}

export function reproduce() {
  const sourceHashes=evidence.sources.map(source=>verifyLocalEvidence(root,source));
  const beam=evidence.conventions;
  const cases=evidence.cases.map(c=>{
    const state=stateFor(c),d=computeDEff(state).dEff;
    const calculated=spRabi(d,beam.power_mW,beam.waist_um);
    const fMHz=calculated.fR/1e6;
    const frequencyBounds=[c.rabiOrdinary_MHz-c.rabiOrdinary_uncertainty_MHz,
      c.rabiOrdinary_MHz+c.rabiOrdinary_uncertainty_MHz];
    const powerBounds=frequencyBounds.map(f=>powerFromRabiHz(d,f*1e6,beam.waist_um));
    const waistBounds=frequencyBounds.map(f=>waistFromRabiHz(d,f*1e6,beam.power_mW)).sort((a,b)=>a-b);

    // Einstein A is the PARTIAL branch rate beta/tau, not the total 1/tau.
    // Its degeneracy is 2*J_upper+1=3 even for T7 with J_lower=2.
    const partialRate=c.branching/(c.lifetime_ns*1e-9);
    const fromLifetime=Math.sqrt(2*state.J_upper+1)*dipoleFromDecayRate(partialRate,c.wavelengthVac_nm);
    const upperSums=new Map();
    for(const ch of computeCGChannels(state)) {
      const key=[ch.Fp,ch.mp].join('|');
      upperSums.set(key,(upperSums.get(key)||0)+ch.matEl**2);
    }
    const expectedSum=state.dReduced**2/(2*state.J_upper+1);
    const angularSumRule={expectedDipoleSquared_ea0_2:expectedSum,
      upperSublevelCount:upperSums.size,
      maxRelativeError:Math.max(...[...upperSums.values()].map(sum=>Math.abs(sum/expectedSum-1)))};
    // This two-level Isat relation is used only for T1/T2 cycling channels.
    const fromIsat=c.saturationIntensity_W_m2===undefined?null:
      (1/(c.lifetime_ns*1e-9))/(2*Math.PI)*Math.sqrt(calculated.I0/(2*c.saturationIntensity_W_m2))/1e6;
    return {transitionId:c.transitionId,sourceId:'kroeze-2026',table:c.table,printedPage:c.printedPage,
      J_lower:state.J_lower,J_upper:state.J_upper,channel:c.channel,pol:c.pol,
      sourceDipole_ea0:c.dJ_ea0,canonicalDipole_ea0:state.dReduced,
      canonicalDipoleSourceId:getQuantity(c.transitionId,'d_num').sourceId,
      canonicalDipoleUncertainty_ea0:getQuantity(c.transitionId,'d_num').uncertainty,
      dEff_ea0:d,angularFactorMagnitude:d/state.dReduced,angularFactorSquared:(d/state.dReduced)**2,
      power_mW:beam.power_mW,waist_um:beam.waist_um,I0_W_m2:calculated.I0,E0_V_m:calculated.E0,
      calculatedRabi_MHz:fMHz,publishedRabi_MHz:c.rabiOrdinary_MHz,
      publishedRabiUncertainty_MHz:c.rabiOrdinary_uncertainty_MHz,
      difference_MHz:fMHz-c.rabiOrdinary_MHz,relativeDifference_percent:100*(fMHz/c.rabiOrdinary_MHz-1),
      withinPublishedUncertainty:fMHz>=frequencyBounds[0]&&fMHz<=frequencyBounds[1],
      inversePowerAtPublishedRabi_mW:powerFromRabiHz(d,c.rabiOrdinary_MHz*1e6,beam.waist_um),
      inverseWaistAtPublishedRabi_um:waistFromRabiHz(d,c.rabiOrdinary_MHz*1e6,beam.power_mW),
      publishedFrequencyBounds_MHz:frequencyBounds,compatiblePowerBounds_mW:powerBounds,
      compatibleWaistBounds_um:waistBounds,
      lifetimeBranchRoute:{partialRate_s_inv:partialRate,sourceWavelength_nm:c.wavelengthVac_nm,
        reconstructedDipole_ea0:fromLifetime,differenceFromAdopted_ea0:fromLifetime-c.dJ_ea0,
        withinPrintedDipoleUncertainty:Math.abs(fromLifetime-c.dJ_ea0)<=c.dJ_uncertainty_ea0,
        boundary:'Algebraic consistency of shared source inputs; no independent lifetime/branching experiment is claimed.'},
      cyclingIsatRoute:fromIsat===null?null:{calculatedRabi_MHz:fromIsat,
        withinPublishedRabiUncertainty:Math.abs(fromIsat-c.rabiOrdinary_MHz)<=c.rabiOrdinary_uncertainty_MHz,
        boundary:'Two-level cycling-channel algebraic cross-check of compiled source inputs.'},
      angularSumRule,verdict:fMHz>=frequencyBounds[0]&&fMHz<=frequencyBounds[1]?'published-theory-compatible':'reference-mismatch'};
  });
  const strengthCrossChecks=evidence.strengthCrossChecks.map(check=>{
    const c=cases.find(row=>row.transitionId===check.transitionId);
    const alternativeRabi=spRabi(check.dJ_ea0*c.angularFactorMagnitude,beam.power_mW,beam.waist_um).fR/1e6;
    return {...check,adoptedDipole_ea0:c.canonicalDipole_ea0,
      alternativeRabi_MHz:alternativeRabi,
      dipoleRelativeDifference_percent:100*(check.dJ_ea0/c.canonicalDipole_ea0-1),
      printedDipoleIntervalsOverlap:Math.abs(check.dJ_ea0-c.canonicalDipole_ea0)<=
        check.dJ_uncertainty_ea0+c.canonicalDipoleUncertainty_ea0,
      comparisonBoundary:'Source-strength cross-check only; intervals are not independent statistical samples and this is not a directly measured Rabi benchmark.'};
  });
  const t4=getTransitionRecord('T4'),multipole=CORE_TRANSITIONS.find(t=>t.id==='T4').multipole;
  const unsupported=calculateRabi({multipole,dEff_ea0:t4.quantities.d_num.value,
    P_mW:beam.power_mW,w_um:beam.waist_um});
  return {schemaVersion:1,verifiedOn:evidence.verifiedOn,datasetVersion:DATASET_VERSION,formulaVersion:FORMULA_VERSION,
    theoryVerdict:cases.every(c=>c.withinPublishedUncertainty)?'all-five-published-theory-compatible':'reference-mismatch',
    independentExperimentalVerdict:'no-new-complete-matched-P-waist-measured-Rabi-case-established-in-this-review',
    sourceHashes,cases,strengthCrossChecks,
    unsupportedCase:{transitionId:'T4',multipole,canonicalDipole_ea0:t4.quantities.d_num.value,
      calculatorStatus:unsupported.status,calculatedRabi_MHz:null},
    interpretation:'Bare coherent coupling at the beam centre. A lossy/open transition requires optical Bloch dynamics to predict observed flopping, pumping or linewidth; ideal pi time alone is not experimental fidelity.'};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]) {
  const results=reproduce();
  fs.writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
  const columns=['transitionId','calculatedRabi_MHz','publishedRabi_MHz','publishedRabiUncertainty_MHz','dEff_ea0','angularFactorMagnitude','inversePowerAtPublishedRabi_mW','inverseWaistAtPublishedRabi_um','verdict'];
  fs.writeFileSync(new URL('./summary.csv',import.meta.url),columns.join(',')+'\n'+results.cases.map(c=>columns.map(k=>c[k]).join(',')).join('\n')+'\n');
  console.log(results.theoryVerdict);
  for(const c of results.cases)console.log(`${c.transitionId}: ${c.calculatedRabi_MHz.toFixed(9)} MHz vs ${c.publishedRabi_MHz} ± ${c.publishedRabiUncertainty_MHz} MHz`);
}
