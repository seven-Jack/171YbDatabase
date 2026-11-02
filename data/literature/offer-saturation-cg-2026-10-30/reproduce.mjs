import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {HBAR,C,EPS0,EA0} from '../../../src/physics/constants.js';
import {CORE_TRANSITIONS,getQuantity} from '../../../src/data/catalog.js';
import {spRabi,dipoleFromDecayRate} from '../../../src/physics/rabi.js';
import {matrixElement_F_q} from '../../../src/physics/angular.js';
import {verifyLocalEvidence} from '../../../scripts/local-evidence.mjs';
import {runReproductionCLI} from '../../../scripts/literature-audit.mjs';

const root=new URL('../../../',import.meta.url);
export const evidence=JSON.parse(fs.readFileSync(new URL('./source-check.json',import.meta.url),'utf8'));
const near=(a,b,tol=1e-10)=>Math.abs(a-b)<=tol*Math.max(1e-30,Math.abs(a),Math.abs(b));

export function reproduce() {
  const lambda=CORE_TRANSITIONS.find(t=>t.id==='T3').wavelength_vac_nm*1e-9;
  const opticalOmega=2*Math.PI*C/lambda,h=2*Math.PI*HBAR;
  const w=evidence.assumedRadius_um*1e-6,P=evidence.fitPower_mW*1e-3;
  const I0=2*P/(Math.PI*w*w),E0=Math.sqrt(2*I0/(C*EPS0));
  const adoptedDF=getQuantity('T3','d_num').value;
  if(adoptedDF!==evidence.rateCases[0].dF_ea0)throw Error('Review required: canonical dipole changed');
  const rateFromDF=dF=>opticalOmega**3*(dF*EA0)**2/(6*Math.PI*EPS0*HBAR*C**3);
  const cases=evidence.rateCases.map(input=>{
    const gamma=input.dF_ea0?rateFromDF(input.dF_ea0):input.decayRate_s_inv??
      (input.lifetime_s?1/input.lifetime_s:2*Math.PI*input.naturalLinewidth_Hz);
    const dDecay=dipoleFromDecayRate(gamma,lambda*1e9),dF=Math.sqrt(2)*dDecay;
    const dPi=Math.abs(matrixElement_F_q(.5,.5,.5,.5,0,dF));
    const dSigma=Math.abs(matrixElement_F_q(.5,-.5,.5,.5,1,dF));
    const isatScalar=Math.PI*h*C*gamma/(3*lambda**3);
    const isatPi=gamma**2*HBAR**2*C*EPS0/(4*(dPi*EA0)**2);
    const isatSigma=gamma**2*HBAR**2*C*EPS0/(4*(dSigma*EA0)**2);
    const scalar=spRabi(dDecay,evidence.fitPower_mW,evidence.assumedRadius_um);
    const pi=spRabi(dPi,evidence.fitPower_mW,evidence.assumedRadius_um);
    const target=evidence.targetRabi_Hz;
    return {id:input.id,evidenceKind:input.kind,populationDecayRate_s_inv:gamma,
      naturalLinewidth_Hz:gamma/(2*Math.PI),lifetime_s:1/gamma,
      dF_ea0:dF,dDecayNormalized_ea0:dDecay,dPi_ea0:dPi,dSigma_ea0:dSigma,
      isatScalar_W_m2:isatScalar,isatPi_W_m2:isatPi,isatSigma_W_m2:isatSigma,
      scalarRabi_Hz:scalar.fR,piRabi_Hz:pi.fR,
      scalarDifferenceFrom22k_percent:100*(scalar.fR/target-1),
      piDifferenceFrom22k_percent:100*(pi.fR/target-1),
      scalarRabiViaSaturation_Hz:gamma*Math.sqrt(I0/(2*isatScalar))/(2*Math.PI),
      sigmaHalfLinearPowerRabi_Hz:spRabi(dSigma,evidence.fitPower_mW/2,evidence.assumedRadius_um).fR,
      fixedUpperSum_ea0_2:dPi**2+dSigma**2};
  });
  const current=cases[0],gammaFor22=current.populationDecayRate_s_inv*(evidence.targetRabi_Hz/current.scalarRabi_Hz)**2;
  const ten=cases.find(x=>x.id==='figure10mHz-as-exact');
  const requiredIsatWithFigureGamma=ten.populationDecayRate_s_inv**2*I0/(2*(2*Math.PI*evidence.targetRabi_Hz)**2);
  const scalarEquivalentPower=evidence.stageAvailablePower_mW/3;
  const physicalPiEquivalentToFit=3*evidence.fitPower_mW;
  const scalarAtEquivalentPower=spRabi(current.dDecayNormalized_ea0,scalarEquivalentPower,evidence.assumedRadius_um).fR;
  const piAtAvailablePower=spRabi(current.dPi_ea0,evidence.stageAvailablePower_mW,evidence.assumedRadius_um).fR;
  const piAtThreeFitPower=spRabi(current.dPi_ea0,physicalPiEquivalentToFit,evidence.assumedRadius_um).fR;
  const v=95,physicalOmega=2*Math.PI*current.scalarRabi_Hz;
  const thetaGaussian=physicalOmega*Math.sqrt(Math.PI)*w/v;
  const thetaOffer=current.populationDecayRate_s_inv/v*Math.sqrt(P/current.isatScalar_W_m2);
  const halfPhiStrathearn=thetaGaussian/2;
  const omegaStrathearnPeak=v*thetaGaussian/(2*Math.sqrt(Math.PI)*w);
  const checks={
    scalarSaturationEqualsDipole:cases.every(x=>near(x.scalarRabi_Hz,x.scalarRabiViaSaturation_Hz)),
    piSaturationFactorThree:cases.every(x=>near(x.isatPi_W_m2,3*x.isatScalar_W_m2)),
    sigmaSaturationFactorThreeHalves:cases.every(x=>near(x.isatSigma_W_m2,1.5*x.isatScalar_W_m2)),
    fixedUpperDipoleSum:cases.every(x=>near(x.fixedUpperSum_ea0_2,x.dF_ea0**2/2)),
    scalarPiRabiFactorSqrtThree:cases.every(x=>near(x.scalarRabi_Hz,Math.sqrt(3)*x.piRabi_Hz)),
    linearSigmaHalfPowerEqualsPi:cases.every(x=>near(x.piRabi_Hz,x.sigmaHalfLinearPowerRabi_Hz)),
    equivalentPowerMapping:near(scalarAtEquivalentPower,piAtAvailablePower)&&near(piAtThreeFitPower,current.scalarRabi_Hz),
    offerGaussianPulseArea:near(thetaOffer,thetaGaussian),
    strathHalfAngleMapping:near(2*halfPhiStrathearn,thetaOffer)&&near(2*omegaStrathearnPeak,physicalOmega),
    independentPythonCurrentScalar:near(current.scalarRabi_Hz,21174.574879,1e-8),
    independentPythonLifetime21:near(cases.find(x=>x.id==='lifetime21s-hypothesis').scalarRabi_Hz,21975.3445,1e-8),
    independentPythonFigure10mHz:near(ten.scalarRabi_Hz,25242.6691,1e-8)
  };
  if(Object.values(checks).some(x=>!x))throw Error('Normalization audit check failed: '+JSON.stringify(checks));
  const protectedHashes=JSON.parse(fs.readFileSync(new URL('../clock-rabi-audit-2026-10-30/protected-hashes.json',import.meta.url),'utf8'));
  for(const [p,expected] of Object.entries(protectedHashes)) {
    if(createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex')!==expected)throw Error('Protected file changed: '+p);
  }
  return {schemaVersion:1,checkedOn:evidence.checkedOn,status:evidence.status,
    exactAuthorNormalizationEstablished:false,authorCGOmissionEstablished:false,
    independentExperimentalValidationPassed:false,productionChanged:false,
    inputs:{power_mW:evidence.fitPower_mW,assumedRadius_um:evidence.assumedRadius_um,lambda_nm:lambda*1e9,I0_W_m2:I0},
    comparisons:cases,
    powerMapping:{availablePower_mW:evidence.stageAvailablePower_mW,
      scalarEquivalentPiPower_mW:scalarEquivalentPower,fittedPower_mW:evidence.fitPower_mW,
      fitDifferenceFromOneThird_percent:100*(evidence.fitPower_mW/scalarEquivalentPower-1),
      fitCouplingDifference_percent:100*(Math.sqrt(evidence.fitPower_mW/scalarEquivalentPower)-1),
      piPowerEquivalentToScalarFit_mW:physicalPiEquivalentToFit,
      piPowerEquivalentFractionOfAvailable:physicalPiEquivalentToFit/evidence.stageAvailablePower_mW,
      boundary:'Equivalent parameterization at fixed total decay rate; not a measured transmission or a proved author convention.'},
    inverseDiagnostics:{scalarDecayRateForExactly22k_s_inv:gammaFor22,
      scalarLifetimeForExactly22k_s:1/gammaFor22,
      scalarNaturalLinewidthForExactly22k_Hz:gammaFor22/(2*Math.PI),
      requiredChannelDipole_ea0:HBAR*2*Math.PI*evidence.targetRabi_Hz/(E0*EA0),
      isatFor22kAtFigureGamma_W_m2:requiredIsatWithFigureGamma,
      isatRatioToScalarAtFigureGamma:requiredIsatWithFigureGamma/ten.isatScalar_W_m2,
      intensityDiameterAtFigureScalarGamma_mm:2*w*1e3*ten.scalarRabi_Hz/evidence.targetRabi_Hz,
      boundary:'Inverse reconstruction only; none is an original measurement or adopted author input.'},
    pulseAreaConventions:{velocity_m_s:v,physicalPeakOmega_rad_s:physicalOmega,
      strathOffDiagonalOmega_rad_s:omegaStrathearnPeak,physicalBlochArea_rad:thetaGaussian,
      offerPhi_rad:thetaOffer,strathPhi_rad:halfPhiStrathearn,
      conclusion:'Offer Phi = physical Bloch area = 2*Strathearn Phi; model Omega = physical Omega/2. No factor-two correction is justified after translating definitions.'},
    engineeringChecks:checks,protectedFileCount:Object.keys(protectedHashes).length,
    sourceBytes:evidence.sources.map(s=>verifyLocalEvidence(root,s))};
}

runReproductionCLI(import.meta.url, reproduce);
