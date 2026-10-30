import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyLocalEvidence} from '../../scripts/local-evidence.mjs';
import {CATALOG,getQuantity,ESTIMATE_CONFIG,DATASET_VERSION} from '../../src/data/catalog.js';

const root=new URL('../../',import.meta.url);
const readJSON=relative=>JSON.parse(fs.readFileSync(new URL(relative,root),'utf8'));
const base='data/literature/source-followup-2026-10-30/';
const source=readJSON(base+'frequency/paper-1-Table2.json');
const measured=source.rows.filter(row=>row.referenceInPaper==='This work');
const labels=['171Yb 649 Fg1/2 Fe1/2','171Yb 649 Fg1/2 Fe3/2',
  '171Yb 770 Fg3/2 Fe1/2','171Yb 770 Fg3/2 Fe3/2','171Yb 770 Fg5/2 Fe3/2'];
const cells=labels.map(label=>{
  const rows=measured.filter(row=>row.label===label);
  assert.equal(rows.length,1,`one original measurement for ${label}`);
  assert.equal(rows[0].cells.frequency.unit,'MHz');
  return rows[0].cells.frequency;
});
function decimalInteger(text,scale) {
  const [whole,fraction='']=text.split('.');
  assert.ok(fraction.length<=scale);
  return BigInt(whole+fraction.padEnd(scale,'0'));
}
function rationalDecimal(numerator,denominator,places=28) {
  const whole=numerator/denominator;
  let rest=numerator%denominator,fraction='';
  for(let n=0;n<places;n++) {rest*=10n;fraction+=String(rest/denominator);rest%=denominator;}
  return `${whole}.${fraction}`;
}
const near=(a,b,tolerance,label)=>assert.ok(Math.abs(a-b)<=tolerance,`${label}: ${a} vs${b}`);

test('Ritz coefficients cancel electronic upper and first-order hyperfine shifts independently',()=>{
  // Coefficients twice each line's dependence on [ES,EP0,EP2,AS,AP2].
  // AS factors are -1,+1/2 forJ1, and AP2 factors -3/2,+1 forJ2.
  const endpointCoefficients=[[2,-2,0,-2,0],[2,-2,0,1,0],
    [2,0,-2,-2,3],[2,0,-2,1,3],[2,0,-2,1,-2]];
  const weights=[5,10,-5,-1,-9]; // common denominator15, not line intensities
  const result=endpointCoefficients[0].map((_,column)=>
    weights.reduce((sum,w,index)=>sum+w*endpointCoefficients[index][column],0));
  assert.deepEqual(result,[0,-30,30,0,0]);
  // Thus the line combination equals EP2-EP0; the clock suppliesEP0-Eground.
});

test('current P2 frequency exactly follows the original five printed components and declared Ritz convention',()=>{
  assert.equal(DATASET_VERSION,'2026.10.30.1');
  assert.deepEqual(cells.map(cell=>cell.value),['461861338.03','461871596.07','389257019.71','389267277.10','389260569.95']);
  const clock=getQuantity('T3','frequency_THz');
  assert.equal(clock.conditions.sourceDecimal,'518.29583659086363');
  //MHz*1e8 and THz*1e14 are the same exact integer unit. BigInt avoids
  // cancellation from subtracting two large ~400THz binary floating values.
  const clockScaled=decimalInteger(clock.conditions.sourceDecimal,14);
  const inputs=cells.map(cell=>decimalInteger(cell.value,8));
  const weights=[5n,10n,-5n,-1n,-9n];
  const numerator=15n*clockScaled+inputs.reduce((sum,x,index)=>sum+x*weights[index],0n);
  const expected=Number(rationalDecimal(numerator,15n*10n**14n));
  const frequency=getQuantity('T4','frequency_THz');
  assert.equal(frequency.value,expected);
  assert.equal(frequency.evidenceKind,'derived');
  assert.equal(frequency.sourceId,'qiao-2023-rinp');
  assert.equal(frequency.reviewStatus,'original-source-located');
  assert.match(frequency.conditions.sourceConflict,/150\.365803MHz/);
  assert.equal(frequency.conditions.legacySourceCauseEstablished,false);
});

test('unknown covariance stays unknown while sum-absolute-weight uncertainty bound remains explicit',()=>{
  const weights=[1/3,2/3,-1/3,-1/15,-3/5];
  const marginal=cells.map(cell=>Number(cell.uncertainty));
  assert.deepEqual(marginal,[.21,.31,.65,.37,.89]);
  const upper=weights.reduce((sum,w,index)=>sum+Math.abs(w)*marginal[index],0)+1e-7;
  const independent=Math.sqrt(weights.reduce((sum,w,index)=>sum+w*w*marginal[index]**2,0)+1e-14);
  for(const field of ['frequency_THz','wavelength_vac_nm','energy_eV']) {
    const q=getQuantity('T4',field);
    assert.equal(q.uncertainty,null);
    near(q.conditions.conservativeStdUpperBoundMHz,upper,2e-15,field);
    assert.match(q.conditions.uncertaintyBoundary,/not an actual reconstructed1sigma/);
    assert.match(q.uncertaintyNote,/covariance/);
  }
  assert.ok(independent<upper);
  // No covariance-derived exact sigma is silently filled with either number.
  assert.equal(getQuantity('T4','frequency_THz').uncertainty,null);
});

test('new Ritz energy, wavelength and network close without inventing an air conversion',()=>{
  const f=getQuantity('T4','frequency_THz').value;
  const p2=CATALOG.levels.records.find(row=>row.attributes.term==='³P₂');
  near(p2.quantities.energy_cm.value,f*1e12/(100*299792458),8*Number.EPSILON*p2.quantities.energy_cm.value,'P2cm');
  assert.equal(p2.quantities.energy_cm.uncertainty,null);
  assert.equal(p2.quantities.energy_eV.value,getQuantity('T4','energy_eV').value);
  near(getQuantity('T4','wavelength_vac_nm').value,299792.458/f,8*Number.EPSILON*600,'lambda');
  const air=getQuantity('T4','wavelength_air_nm');
  assert.equal(air.value,null);assert.equal(air.uncertainty,null);
  assert.equal(air.missingReason,'not-recomputed-for-updated-vacuum-frequency');
  assert.equal(air.conditions.supersededValueNm,507.20882);
  const residual=(f+getQuantity('T7','frequency_THz').value-getQuantity('T3','frequency_THz').value-getQuantity('T6','frequency_THz').value)*1e6;
  near(residual,.023333333333,2e-7,'working Ritz closure MHz');
  const s1=CATALOG.levels.records.find(row=>row.attributes.term==='³S₁');
  for(const q of Object.values(s1.quantities)) {
    assert.equal(q.reviewStatus,'original-source-located');
    assert.match(q.conditions.historicalSourceConflict,/150\.389MHz/);
    assert.equal(Object.hasOwn(q.conditions,'sourceConflict'),false);
    assert.ok(Math.abs(q.conditions.workingNetworkClosureMHz)<.024);
  }
});

test('Mishra inverse average-rate lifetime is not promoted to one F lifetime',()=>{
  const original=readJSON(base+'lifetimes/mishra-2001.json');
  const lifetime=original.tables.find(table=>table.table==='5').rows.find(row=>row.atom==='171Yb');
  const averaged=original.tables.find(table=>table.table==='3').rows.find(row=>row.atom==='171Yb');
  const resolved=original.tables.find(table=>table.table==='4').rows.find(row=>row.atom==='171Yb');
  assert.equal(lifetime.tau_3P2_s,'8.9');
  assert.equal(averaged.HFI_E1_3P2_to_1S0,'0.044');
  assert.equal(resolved.HFI_E1_rate,'0.1097');
  assert.equal(resolved.F_upper,'3/2');assert.equal(resolved.F_lower,'1/2');
  for(const field of ['lifetime_ns','Gamma_per_s_num','linewidth_frequency_coefficient_Hz']) {
    const q=getQuantity('T4',field);
    assert.equal(q.sourceId,'mishra-2001-jqsrt');
    assert.equal(q.uncertainty,null);
    assert.match(q.conditions.stateBoundary,/inverse of\(2F\+1\)-weighted HFI rate/);
    assert.match(q.conditions.stateBoundary,/not the average of lifetimes/);
    assert.equal(q.conditions.HFIWholeLineRatePerS,Number(averaged.HFI_E1_3P2_to_1S0));
    assert.equal(q.conditions.HFI_F32_to_F12_RatePerS,Number(resolved.HFI_E1_rate));
    assert.equal(q.conditions.temperatureK,null);assert.equal(q.conditions.BBRTemperatureK,null);
  }
  const tau=getQuantity('T4','lifetime_ns');
  assert.equal(tau.evidenceKind,'literature-reported');
  assert.equal(tau.convention,'inverse-of-statistically-averaged-total-decay-rate; not-F-resolved');
  const gamma=getQuantity('T4','Gamma_per_s_num');
  const width=getQuantity('T4','linewidth_frequency_coefficient_Hz');
  for(const q of [gamma,width]) {
    assert.equal(q.evidenceKind,'derived');
    assert.ok(q.derivedFrom.includes('T4.lifetime_ns'));
    assert.match(q.convention,/not-F-resolved/);
    assert.match(q.sourceLocator,/Mishra2001 Table5.*8\.9s/);
  }
  assert.match(width.sourceLocator,/not a printed Mishra linewidth/);
  const inverse=1/(tau.value*1e-9);
  // The displayed0.112/s and17.9mHz are rounded conversions of8.9s,
  // not extra measurements from Mishra or F-resolved natural widths.
  near(gamma.value,inverse,.0005,'rounded equivalentaverage rate');
  near(width.value,inverse/(2*Math.PI),.00005,'rounded equivalentaverage width');
});

test('ionic-core frequency follows Fisk corrected measurement without refitting MQDT thresholds',()=>{
  const fact=readJSON(base+'rydberg-core/source-facts.json').facts.find(row=>row.parameter==='zero-field-hyperfine-frequency');
  assert.equal(fact.valueDecimal,'12642812118.466');
  assert.equal(fact.uncertaintyDecimal,'0.002');
  const p=ESTIMATE_CONFIG.ionizationProvenance.A_ion_GHz;
  // Convert the original decimalHz to decimalGHz before binary conversion;
  // dividing an already rounded~1e10Hz Number introduces an avoidable extraulp.
  assert.equal(ESTIMATE_CONFIG.ionization.A_ion_GHz,
    Number(rationalDecimal(decimalInteger(fact.valueDecimal,3),10n**12n)));
  assert.equal(p.uncertaintyGHz,Number(fact.uncertaintyDecimal)/1e9);
  assert.equal(p.sourceId,fact.sourceId);
  assert.match(p.convention,/experimental ions were not at0K/);
  const baseline=readJSON(base+'baseline/estimates.json');
  assert.equal(ESTIMATE_CONFIG.ionization.E_I0,baseline.ionization.E_I0);
  assert.equal(ESTIMATE_CONFIG.ionization.E_I1,baseline.ionization.E_I1);
});

test('available original PDFs match their hashes and protected diagram and saved CSV bytes are always unchanged',t=>{
  const digest=relative=>createHash('sha256').update(fs.readFileSync(new URL(relative,root))).digest('hex');
  const original=readJSON('references/downloads-20261030-manifest.json');
  assert.equal(original.files.length,31);
  const localOriginals=original.files.map(file=>verifyLocalEvidence(root,
    {localPath:file.path,sha256:file.sha256}));
  const unavailable=localOriginals.filter(row=>row.status==='unavailable');
  if(unavailable.length)t.diagnostic(`${unavailable.length} local original PDFs unavailable; their bytes were not verified in this checkout.`);
  for(const row of localOriginals) {
    assert.equal(row.verified,row.status==='verified');
    assert.equal(row.sha256,row.verified?row.expectedSha256:null);
  }
  const received=readJSON('references/received-downloads-20261030.json').documents;
  assert.deepEqual(received.map(row=>row.number),[1,2,3,4,5,6,7,8,10]);
  for(const [file,hash] of Object.entries(readJSON(base+'protected-hashes.json'))) assert.equal(digest(file),hash,file);
});
