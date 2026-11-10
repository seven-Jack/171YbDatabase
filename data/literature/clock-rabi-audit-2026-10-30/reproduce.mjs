import fs from 'node:fs';
import {verifyLocalEvidence} from '../../../scripts/local-evidence.mjs';
import {runReproductionCLI,verifyProtectedAuditInputs} from '../../../scripts/literature-audit.mjs';
import {CORE_TRANSITIONS,DATASET_VERSION,getQuantity} from '../../../src/data/catalog.js';
import {HBAR,C,EPS0,EA0,FORMULA_VERSION} from '../../../src/physics/constants.js';
import {computeDEff,computeCGChannels} from '../../../src/physics/angular.js';
import {spRabi,powerFromRabiHz,waistFromRabiHz,dipoleFromDecayRate} from '../../../src/physics/rabi.js';
import {motionDiagnostics} from './motional-diagnostics.mjs';

const root=new URL('../../../',import.meta.url);
export const evidence=JSON.parse(fs.readFileSync(new URL('./cases.json',import.meta.url),'utf8'));
const sourceCheck=JSON.parse(fs.readFileSync(new URL('./pizzocaro-source-check.json',import.meta.url),'utf8'));
const supplemental=JSON.parse(fs.readFileSync(new URL('references/clock-rabi-sources-20261030.json',root),'utf8'));

export function clockRateFromDF(dF_ea0,lambda_nm) {
  const omega=2*Math.PI*C/(lambda_nm*1e-9);
  // Sum over final m and photon q at fixed upper m': sum |d|^2=dF^2/(2F'+1).
  return omega**3*(dF_ea0*EA0)**2/(3*Math.PI*EPS0*HBAR*C**3*2);
}

export function reproduce() {
  const t=CORE_TRANSITIONS.find(t=>t.id==='T3'),dF=getQuantity('T3','d_num').value;
  const lambda=t.wavelength_vac_nm,ex=evidence.experiment;
  const state={transition:t,J_lower:0,J_upper:0,F_lower:.5,F_upper:.5,
    convention:'F-reduced',dReduced:dF,pol:'pi',selectedChannel:evidence.currentCalculator.channel};
  const d=computeDEff(state).dEff;
  const beam=spRabi(d,ex.power_nW*1e-6,ex.waistRadius_um);
  const nominal=1/(2*ex.piPulse_ms*1e-3),ratio=nominal/beam.fR;
  const sources=[sourceCheck.source,...evidence.strengthSources];
  const blatt=supplemental.documents.find(doc=>doc.sourceIds.includes('blatt-2009-pra'));
  if(!blatt)throw Error('Missing Blatt method-source record');
  sources.push({id:'blatt-2009-pra',localPath:blatt.path,sha256:blatt.sha256});
  const sourceHashes=sources.map(source=>verifyLocalEvidence(root,source));
  const comparisons=evidence.strengthSources.map(source=>{
    const rate=source.rate_s_inv??1/source.lifetime_s;
    const sigmaRate=source.rateUncertainty_s_inv??
      (source.lifetimeUncertainty_s===undefined?null:source.lifetimeUncertainty_s/source.lifetime_s**2);
    const lifetimeNorm=dipoleFromDecayRate(rate,lambda);
    const dFSource=Math.sqrt(2)*lifetimeNorm,dPi=dFSource/Math.sqrt(6);
    const predicted=spRabi(dPi,ex.power_nW*1e-6,ex.waistRadius_um);
    const relSigma=sigmaRate===null?null:sigmaRate/(2*rate);
    return {id:source.id,sourceId:source.sourceId,evidenceKind:source.evidenceKind,
      reportedRate_s_inv:source.rate_s_inv??null,reportedLifetime_s:source.lifetime_s??null,
      workingRate_s_inv:rate,rateUncertainty_s_inv:sigmaRate,
      lifetimeNormalizedDipole_ea0:lifetimeNorm,dF_ea0:dFSource,dPi_ea0:dPi,dSigma_ea0:dFSource/Math.sqrt(3),
      dFUncertainty_ea0:relSigma===null?null:dFSource*relSigma,
      beamCentreRabi_Hz:predicted.fR,rabiDipoleOnlyUncertainty_Hz:relSigma===null?null:predicted.fR*relSigma,
      currentDipoleRelativeDifference_percent:100*(dF/dFSource-1),
      currentDipoleWithinRateDerivedUncertainty:relSigma===null?null:Math.abs(dF-dFSource)<=dFSource*relSigma,
      uncertaintyBoundary:'First-order rate/lifetime-derived dipole uncertainty only. Power/waist/motion/noise uncertainties and input covariance remain unknown; not a total Rabi calibration uncertainty.',
      isIndependentMeasuredRabi:false};
  });
  const upperSums=new Map();
  const channels=computeCGChannels(state);
  for(const ch of channels){const key=[ch.Fp,ch.mp].join('|');upperSums.set(key,(upperSums.get(key)||0)+ch.matEl**2);}
  verifyProtectedAuditInputs(DATASET_VERSION);
  return {schemaVersion:1,checkedOn:evidence.checkedOn,datasetVersion:DATASET_VERSION,formulaVersion:FORMULA_VERSION,
    conclusion:evidence.conclusion,sourceHashes,
    current:{dF_ea0:dF,dPi_ea0:d,dSigma_ea0:dF/Math.sqrt(3),power_nW:ex.power_nW,
      waistRadius_um:ex.waistRadius_um,I0_W_m2:beam.I0,E0_V_m:beam.E0,
      rabi_Hz:beam.fR,piTime_ms:beam.tPi*1000,impliedFreeAtomRate_s_inv:clockRateFromDF(dF,lambda),
      impliedFreeAtomLifetime_s:1/clockRateFromDF(dF,lambda),dipoleProvenance:getQuantity('T3','d_num'),
      fixedUpperSublevelDipoleSums_ea0_2:[...upperSums].map(([upper,value])=>({upper,value})),
      expectedFixedUpperSublevelSum_ea0_2:dF**2/2,allChannelCount:channels.length},
    experiment:{sourceId:ex.sourceId,piPulse_ms:ex.piPulse_ms,nominalPiDerivedRabi_Hz:nominal,
      directlyFittedRabi_Hz:ex.directFittedRabi_Hz,
      nominalOverBareAmplitudeRatio:ratio,difference_Hz:beam.fR-nominal,
      relativeDifference_percent:100*(beam.fR/nominal-1),
      comparisonBoundary:ex.precisionBoundary},
    independentStrengthComparisons:comparisons,
    requiredSingleParameterChanges:{adopted:false,classification:'counterfactual-sensitivity-not-measured-or-fitted-inputs',
      requiredPower_nW:powerFromRabiHz(d,nominal,ex.waistRadius_um)*1e6,
      requiredWaistRadius_um:waistFromRabiHz(d,nominal,ex.power_nW*1e-6),
      requiredDF_ea0:dF*ratio,requiredFreeAtomRate_s_inv:clockRateFromDF(dF*ratio,lambda),
      requiredFreeAtomLifetime_s:1/clockRateFromDF(dF*ratio,lambda),
      consequence:'These are changes that would algebraically close the nominal point if everything else were exact. They have no independent experimental support and do not replace the source values.'},
    conditionalMotion:motionDiagnostics({rabi_Hz:beam.fR,waist_um:ex.waistRadius_um,
      probeWavelength_nm:lambda,targetMeanAmplitudeRatio:ratio,axialExtent_mm:ex.lattice.trapLength_mm/2}),
    preserved:{canonicalAtomicData:true,productionPhysics:true,mainDiagram:true,saved65S:true},
    missingForClosure:evidence.missingForClosure};
}

runReproductionCLI(import.meta.url, reproduce);
