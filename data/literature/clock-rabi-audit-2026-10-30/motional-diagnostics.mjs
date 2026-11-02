import {fileURLToPath} from 'node:url';

// Isolated conditional diagnostics, not production calculator inputs or a fit.
const H=6.62607015e-34; // exact SI Planck constant, J s
const KB=1.380649e-23; // exact SI Boltzmann constant, J/K
const DEFAULTS=Object.freeze({
  rabi_Hz:13.908642710485921,waist_um:200,latticeDepth_Er:200,
  latticeWavelength_nm:759,probeWavelength_nm:578.4195759161624,
  mass_kg:2.8384645678e-25,temperatures_uK:[4,7,10],
  targetMeanAmplitudeRatio:.599,reflectivityUpperBound:.01,
  // The reported trap length is 0.5 mm, hence half-length |z|<=0.25 mm.
  radialExtent_um:45,axialExtent_mm:.25,thermalSumMaxN:256,
  latticeWaist_um:45,misalignmentAxialTemperature_uK:7,
  assumedRadialTemperatures_uK:[4,7,10],
});

function positive(value,name) {
  if(!Number.isFinite(value)||value<=0)throw RangeError(`${name} must be finite and positive`);
  return value;
}
function nonnegative(value,name) {
  if(!Number.isFinite(value)||value<0)throw RangeError(`${name} must be finite and nonnegative`);
  return value;
}

function finiteThermalCarrier(etaSquared,nbar,maxN) {
  const q=nbar/(nbar+1),ground=Math.exp(-etaSquared/2);
  let probability=1-q,previous=1,current=1,mean=0;
  for(let n=0;n<=maxN;n++) {
    mean+=probability*ground*current;
    probability*=q;
    if(n===0) {previous=1;current=1-etaSquared;}
    else {
      const next=((2*n+1-etaSquared)*current-n*previous)/(n+1);
      previous=current;current=next;
    }
  }
  // The diagonal element of exp(ikz) has magnitude <=1. Therefore the
  // omitted normalized thermal probability also bounds the omitted amplitude.
  return {maxN,meanSignedAmplitudeRatio:mean,omittedThermalProbability:q**(maxN+1)};
}

export function motionDiagnostics(options={}) {
  const p={...DEFAULTS,...options};
  for(const key of ['rabi_Hz','waist_um','latticeDepth_Er','latticeWavelength_nm',
    'probeWavelength_nm','mass_kg','latticeWaist_um','misalignmentAxialTemperature_uK'])positive(p[key],key);
  for(const key of ['radialExtent_um','axialExtent_mm'])nonnegative(p[key],key);
  if(!Array.isArray(p.temperatures_uK)||p.temperatures_uK.length===0)
    throw RangeError('temperatures_uK must be a nonempty array');
  p.temperatures_uK.forEach(t=>positive(t,'temperature_uK'));
  if(!Array.isArray(p.assumedRadialTemperatures_uK)||p.assumedRadialTemperatures_uK.length===0)
    throw RangeError('assumedRadialTemperatures_uK must be a nonempty array');
  p.assumedRadialTemperatures_uK.forEach(t=>positive(t,'assumedRadialTemperature_uK'));
  if(!Number.isInteger(p.thermalSumMaxN)||p.thermalSumMaxN<1||p.thermalSumMaxN>10000)
    throw RangeError('thermalSumMaxN must be an integer between 1 and 10000');
  if(!Number.isFinite(p.reflectivityUpperBound)||p.reflectivityUpperBound<0||p.reflectivityUpperBound>=1)
    throw RangeError('reflectivityUpperBound must be in [0,1)');
  if(!Number.isFinite(p.targetMeanAmplitudeRatio)||p.targetMeanAmplitudeRatio<=0||p.targetMeanAmplitudeRatio>1)
    throw RangeError('targetMeanAmplitudeRatio must be in (0,1]');

  const lambdaL=p.latticeWavelength_nm*1e-9,lambdaP=p.probeWavelength_nm*1e-9;
  const recoilL=H**2/(2*p.mass_kg*lambdaL**2),recoilP=H**2/(2*p.mass_kg*lambdaP**2);
  const frequencyZ=2*Math.sqrt(p.latticeDepth_Er)*recoilL/H;
  const etaSquared=recoilP/(H*frequencyZ),thetaK=H*frequencyZ/KB;
  const depthJ=p.latticeDepth_Er*recoilL,depthK=depthJ/KB;
  const firstHarmonicNAtOrAboveBarrier=Math.ceil(depthJ/(H*frequencyZ)-.5);
  const thermalCases=p.temperatures_uK.map(temperature_uK=>{
    const nbar=1/Math.expm1(thetaK/(temperature_uK*1e-6));
    const mean=Math.exp(-etaSquared*(nbar+.5));
    const finiteSum=finiteThermalCarrier(etaSquared,nbar,p.thermalSumMaxN);
    return {temperature_uK,nbar,meanSignedCarrierAmplitudeRatio:mean,
      bareCouplingTimesMeanCarrierFactor_Hz:p.rabi_Hz*mean,
      kBTOverTrapDepth:temperature_uK*1e-6/depthK,
      unboundedHarmonicProbabilityAtOrAboveNominalBarrier:
        (nbar/(nbar+1))**Math.max(0,firstHarmonicNAtOrAboveBarrier),
      finiteSum,analyticMinusFiniteSum:mean-finiteSum.meanSignedAmplitudeRatio};
  });
  const requiredNbar=-Math.log(p.targetMeanAmplitudeRatio)/etaSquared-.5;
  const requiredTemperatureK=requiredNbar>0?thetaK/Math.log1p(1/requiredNbar):requiredNbar===0?0:null;

  const w0=p.waist_um*1e-6,zRayleigh=Math.PI*w0*w0/lambdaP;
  const r=p.radialExtent_um*1e-6,z=p.axialExtent_mm*1e-3;
  const waistAtZ=w0*Math.sqrt(1+(z/zRayleigh)**2);
  const radialFactor=Math.exp(-((r/w0)**2)),axialFactor=w0/waistAtZ;
  // For this small radial box (r/w0<1/sqrt(2)), the Gaussian envelope
  // decreases towards either box edge; do not assert it for arbitrary boxes.
  const cornerFactor=axialFactor*Math.exp(-((r/waistAtZ)**2));
  const monotoneBox=r/w0<=1/Math.sqrt(2);
  const reflectedField=Math.sqrt(p.reflectivityUpperBound);

  // Missing-parameter sensitivity only. The axial temperature is supplied
  // independently of every radial example; no Tr is inferred from Tz.
  const latticeWaist=p.latticeWaist_um*1e-6;
  const frequencyR=Math.sqrt(4*depthJ/(p.mass_kg*latticeWaist**2))/(2*Math.PI);
  const radialEtaSquared=recoilP/(H*frequencyR),radialThetaK=H*frequencyR/KB;
  const axialNbarForAngle=1/Math.expm1(thetaK/(p.misalignmentAxialTemperature_uK*1e-6));
  const exponentZ=etaSquared*(axialNbarForAngle+.5),targetExponent=-Math.log(p.targetMeanAmplitudeRatio);
  const misalignmentCases=p.assumedRadialTemperatures_uK.map(assumedTr_uK=>{
    const radialNbar=1/Math.expm1(radialThetaK/(assumedTr_uK*1e-6));
    const exponentR=radialEtaSquared*(radialNbar+.5);
    const denominator=exponentR-exponentZ;
    const sinSquared=denominator===0?null:(targetExponent-exponentZ)/denominator;
    const reachable=sinSquared!==null&&sinSquared>=0&&sinSquared<=1;
    const angle=reachable?Math.asin(Math.sqrt(sinSquared)):null;
    const forward=angle===null?null:Math.exp(-exponentZ*Math.cos(angle)**2-exponentR*Math.sin(angle)**2);
    return {assumedTr_uK,TrAssumption:'assumed-not-reported',actualTr:null,actualMisalignment:null,
      radialNbar,radialExponentAr:exponentR,requiredSinSquaredTheta:sinSquared,
      isMathematicallyReachable:reachable,requiredAngle_mrad:angle===null?null:angle*1000,
      forwardMeanSignedCarrierAmplitudeRatio:forward,
      thetaZeroMeanSignedCarrierAmplitudeRatio:Math.exp(-exponentZ)};
  });

  return {
    model:'conditional-harmonic-carrier-amplitude-and-Gaussian-envelope-diagnostics',
    scope:'A numerical scale check, not an ensemble experiment fit or a correction to the production calculator.',
    constants:{h_J_s:H,kB_J_K:KB},parameters:p,
    axialOscillator:{latticeRecoil_J:recoilL,latticeRecoil_Hz:recoilL/H,
      probeRecoil_J:recoilP,probeRecoil_Hz:recoilP/H,frequency_Hz:frequencyZ,
      hNuOverKB_uK:thetaK*1e6,etaSquared,eta:Math.sqrt(etaSquared),
      nominalTrapDepthOverKB_uK:depthK*1e6,firstHarmonicNAtOrAboveBarrier,
      groundCarrierAmplitudeRatio:Math.exp(-etaSquared/2)},
    thermalCases,
    requiredMeanAmplitudeCondition:{targetRatio:p.targetMeanAmplitudeRatio,
      requiredNbar,requiredTemperature_uK:requiredTemperatureK===null?null:requiredTemperatureK*1e6,
      feasibleForNonnegativeTemperature:requiredNbar>=0,
      requiredKBTemperatureExceedsNominalTrapDepth:requiredTemperatureK===null?null:requiredTemperatureK>depthK,
      requiredMeanHarmonicEnergyOverTrapDepth:(requiredNbar+.5)*H*frequencyZ/depthJ,
      interpretation:'Temperature needed only for this harmonic thermal mean of signed amplitudes; it is not a measured or fitted temperature.'},
    reflection:{powerReflectivityUpperBound:p.reflectivityUpperBound,
      reflectedToIncidentFieldAmplitudeUpperBound:reflectedField,
      localFieldAmplitudeRatioBounds:[1-reflectedField,1+reflectedField],
      localIntensityRatioBounds:[(1-reflectedField)**2,(1+reflectedField)**2],
      requiredDestructiveReflectivityForTargetRatio:(1-p.targetMeanAmplitudeRatio)**2,
      conditional:true,
      condition:'The returned field must have the same spatial mode/waist as the incident field at the atoms, with a local amplitude ratio bounded by sqrt(R). Power reflectivity alone does not establish this condition.',
      missingExperimentInputs:['Returned probe-beam waist and mode at the atoms','Relative optical phase'],
      boundary:'No unconditional experimental exclusion follows from the mirror power reflectivity alone.'},
    beamEnvelope:{rayleighLength_m:zRayleigh,waistAtAxialExtent_um:waistAtZ*1e6,
      radialEdgeFieldFactor:radialFactor,onAxisAxialEdgeFieldFactor:axialFactor,
      radialAndAxialCornerFieldFactor:cornerFactor,
      conditionalBoxFieldFactorBounds:monotoneBox?[cornerFactor,1]:null,
      centeredRadialOffsetForTargetRatio_um:p.waist_um*Math.sqrt(-Math.log(p.targetMeanAmplitudeRatio)),
      onAxisAxialOffsetForTargetRatio_m:zRayleigh*Math.sqrt(p.targetMeanAmplitudeRatio**-2-1),
      conditional:true,
      condition:'Centered probe waist and all considered atoms inside the stated r/z box; this is only the Gaussian field envelope, with no inferred cloud distribution or radial temperature.'},
    missingParameterMisalignmentSensitivity:{
      classification:'missing-parameter-sensitivity-only',
      model:'Thermal signed carrier mean exp[-Az*cos(theta)^2-Ar*sin(theta)^2] for an axial and projected transverse harmonic mode.',
      latticeWaist_um:p.latticeWaist_um,radialFrequency_Hz:frequencyR,
      radialHNuOverKB_uK:radialThetaK*1e6,radialEtaSquared,
      axialTemperature_uK:p.misalignmentAxialTemperature_uK,axialExponentAz:exponentZ,
      targetMeanSignedAmplitudeRatio:p.targetMeanAmplitudeRatio,cases:misalignmentCases,
      actualTr:null,actualMisalignment:null,
      interpretation:'Each angle is the parameter scale needed for a conditional mathematical mean, not a measured angle or an established explanation of the experiment.',
      assumptions:['The lattice transverse confinement is harmonic and Gaussian, with the specified 1/e^2 intensity radius.',
        'The radial temperatures are independent hypothetical examples; none is reported or inferred from Tz.',
        'The projected transverse mode is thermal and separable from the axial mode. An isotropic two-axis transverse oscillator gives the same projected exponent.',
        'This plane-wave motional matrix-element diagnostic does not fit the full Gaussian optical envelope, anharmonicity, sample distribution or laser noise.'],
    },
    boundaries:[
      'The reported Tz is used only for the axial thermal harmonic mode. No radial temperature is inferred from Tz; the separate Tr examples are explicitly hypothetical.',
      'Harmonic confinement, lattice depth and collinearity are assumptions; no anharmonic, sideband-selection or full spatial average is fitted.',
      'The unbounded harmonic thermal distribution is an approximation. Its above-barrier weight is reported, not removed or refitted; a required kBT above the nominal trap depth is outside the deep-harmonic regime.',
      'The mean signed carrier matrix element is not the frequency fitted to population flopping: sum_n p_n sin^2(Omega_n t/2) is not sin^2(<Omega_n> t/2).',
      'The reported 20 Hz spectral linewidth is not a calibrated Markov laser-noise spectrum and is not used as a dephasing correction.',
      'No counterfactual parameter is adopted as a measured or calibrated input, and no population-flopping data were fitted. Inverted temperatures and angles are conditional sensitivity values only.',
    ],
  };
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]) {
  console.log(JSON.stringify(motionDiagnostics(),null,2));
}
