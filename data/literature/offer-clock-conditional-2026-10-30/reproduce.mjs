import fs from 'node:fs';
import {verifyLocalEvidence} from '../../../scripts/local-evidence.mjs';
import {runReproductionCLI,verifyProtectedAuditInputs} from '../../../scripts/literature-audit.mjs';
import {CORE_TRANSITIONS,getQuantity,DATASET_VERSION} from '../../../src/data/catalog.js';
import {computeDEff} from '../../../src/physics/angular.js';
import {spRabi,powerFromRabiHz,dipoleFromDecayRate} from '../../../src/physics/rabi.js';
import {FORMULA_VERSION} from '../../../src/physics/constants.js';

const root=new URL('../../../',import.meta.url);
export const inputs=JSON.parse(fs.readFileSync(new URL('./inputs.json',import.meta.url),'utf8'));
const near=(a,b,tol=1e-10)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b));

export function reproduce() {
  const t=CORE_TRANSITIONS.find(x=>x.id===inputs.transitionId);
  const dF=getQuantity(t.id,'d_num').value;
  if(dF!==inputs.adoptedCurrentDF_ea0)throw Error('Canonical dipole changed; review the frozen conditional audit input.');
  const w=inputs.beam.reportedDiameter_mm*1000/2;
  if(w!==inputs.beam.assumedRadius_um)throw Error('Diameter/radius conversion mismatch');
  const state={transition:t,J_lower:0,J_upper:0,F_lower:.5,F_upper:.5,
    convention:'F-reduced',dReduced:dF,pol:'pi',selectedChannel:inputs.channel};
  const dPi=Math.abs(computeDEff(state).dEff);
  const rate=inputs.independentAtomicStrength.freeAtomHFIrate_s_inv;
  // The decay-normalized magnitude is dF/sqrt(2), not a selected pi-channel dipole.
  const dDecay=dipoleFromDecayRate(rate,t.wavelength_vac_nm);
  const dFXu=Math.sqrt(2)*dDecay,dPiXu=dDecay/Math.sqrt(3);
  const target=inputs.comparison.reportedRabi_Hz;
  const rows=inputs.powerCases.map(p=>{
    const current=spRabi(dPi,p.power_mW,w);
    const independent=spRabi(dPiXu,p.power_mW,w);
    const delta=current.fR-target;
    return {id:p.id,power_mW:p.power_mW,powerEvidenceKind:p.evidenceKind,
      I0_W_m2:current.I0,I0_W_cm2:current.I0/1e4,E0_V_m:current.E0,
      rabi_Hz:current.fR,rabi_kHz:current.fR/1000,omega_rad_s:current.omega_rad_s,
      piTime_us:current.tPi*1e6,differenceFrom22000_Hz:delta,
      relativeDifference_percent:100*delta/target,
      xuRateDerived:{rabi_Hz:independent.fR,
        rabiRateInputOnlyUncertainty_Hz:independent.fR*inputs.independentAtomicStrength.standardUncertainty_s_inv/(2*rate),
        relativeDifference_percent:100*(independent.fR-target)/target},
      experimentalAgreementStatus:'not-assessed; conditional beam/channel mapping; incomplete experimental uncertainty'};
  });
  const sigmaState={...state,pol:'sigmap',selectedChannel:{F:.5,m:-.5,Fp:.5,mp:.5,q:1}};
  const dSigma=Math.abs(computeDEff(sigmaState).dEff);
  const branchChecks=rows.map(r=>({power_mW:r.power_mW,
    piFullPowerRabi_Hz:r.rabi_Hz,
    transverseLinearSigmaHalfPowerRabi_Hz:spRabi(dSigma,r.power_mW/2,w).fR}));
  const neededPower=powerFromRabiHz(dPi,target,w);
  const checks={
    diameterToRadius:w===500,
    selectedPiMagnitude:near(dPi,dF/Math.sqrt(6)),
    linearPolarizationPowerPartition:branchChecks.every(r=>near(r.piFullPowerRabi_Hz,r.transverseLinearSigmaHalfPowerRabi_Hz)),
    sqrtPowerScaling:near(rows[0].rabi_Hz/rows[1].rabi_Hz,Math.sqrt(rows[0].power_mW/rows[1].power_mW)),
    inverseTargetPower:near(spRabi(dPi,neededPower,w).fR,target),
    independentPython1070mW:near(rows[0].rabi_Hz,21751.4198415,1e-9),
    independentPython338mW:near(rows[1].rabi_Hz,12225.1465068,1e-9)
  };
  if(Object.values(checks).some(x=>!x))throw Error('Conditional audit numerical check failed');
  const protectedFileCount=verifyProtectedAuditInputs(DATASET_VERSION);
  return {schemaVersion:1,checkedOn:inputs.checkedOn,status:'conditional-calculation-only',
    independentExperimentalValidationPassed:false,datasetVersion:DATASET_VERSION,formulaVersion:FORMULA_VERSION,
    radius_um:w,wavelengthForRateConversion_nm:t.wavelength_vac_nm,
    currentDipole:{dF_ea0:dF,dPi_ea0:dPi,dSigma_ea0:dSigma},
    independentXuDipole:{rate_s_inv:rate,dF_ea0:dFXu,dPi_ea0:dPiXu},
    targetRabi_Hz:target,powerCases:rows,
    diagnostics:{powerRequiredFor22000Hz_mW:neededPower,
      definition:'Inverse conditional pi calculation, not a measured power and not adopted as a correction',
      powerRatio:rows[0].power_mW/rows[1].power_mW,
      rabiRatio:rows[0].rabi_Hz/rows[1].rabi_Hz,
      linearBranchChecks:branchChecks},
    uncertaintyBoundary:'Xu uncertainties include only the HFI rate input. Beam power/waist/mode and 22kHz fit uncertainties are unknown; no significance, chi-square, or validation pass is inferred.',
    sourceBytes:inputs.sources.map(s=>verifyLocalEvidence(root,s)),
    engineeringChecks:checks,protectedFileCount,
    mainTransitionDiagramChanged:false,productionPhysicsChanged:false,canonicalDataChanged:false};
}

runReproductionCLI(import.meta.url, reproduce);
