import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifyLocalEvidence} from '../../scripts/local-evidence.mjs';
import {CORE_TRANSITIONS,getQuantity} from '../../src/data/catalog.js';
import {computeDEff,reducedFFromJJ,matrixElement_F_q} from '../../src/physics/angular.js';
import {spRabi,powerFromRabiHz,waistFromRabiHz} from '../../src/physics/rabi.js';

const root=new URL('../../',import.meta.url);
const evidence=JSON.parse(fs.readFileSync(new URL('data/literature/rabi-power-validation-2026-10-30/kroeze-table10.json',root),'utf8'));
const source=evidence.originalData,input=evidence.adoptedInputs;
const transition=CORE_TRANSITIONS.find(row=>row.id===source.transitionId);
const state={transition,J_lower:input.J_lower,J_upper:input.J_upper,F_lower:input.F_lower,F_upper:input.F_upper,
  dReduced:transition.d_num,pol:input.pol,selectedChannel:{...source.channel,q:input.q}};
const near=(a,b,tolerance)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} differs from ${b} by more than ${tolerance}`);

test('Kroeze Table10 retains its original PDF fingerprint, dipole and correctly resolved stretched-state polarization',t=>{
  const localOriginal=verifyLocalEvidence(root,evidence.source);
  if(!localOriginal.verified)t.diagnostic('Local Kroeze PDF unavailable; original bytes were not verified in this checkout.');
  assert.equal(localOriginal.sha256,localOriginal.verified?evidence.source.sha256:null);
  assert.equal(getQuantity('T2','d_num').sourceId,'ref-01');
  assert.equal(transition.d_num,source.dJ_ea0);
  assert.equal(getQuantity('T2','d_num').uncertainty,source.dJ_uncertainty_ea0);
  assert.equal(source.channel.mp-source.channel.m,input.q);
  const effective=computeDEff(state);
  near(effective.dEff,source.dJ_ea0/Math.sqrt(3),1e-15);
  const dF=reducedFFromJJ(1,0,1.5,.5,source.dJ_ea0);
  assert.equal(matrixElement_F_q(.5,.5,1.5,1.5,0,dF),0);
});

test('T2 Gaussian forward calculation reproduces the published 5.523(6) MHz theory value without fitting',()=>{
  assert.equal(input.waist_um,source.beamDiameter_mm*1000/2);
  const result=spRabi(computeDEff(state).dEff,input.power_mW,input.waist_um);
  near(result.fR/1e6,source.rabiOrdinary_MHz,source.rabiOrdinary_uncertainty_MHz);
  near(result.fR/1e6,evidence.referenceCalculation.rabiOrdinary_MHz,1e-12);
  near(result.I0,8*source.power_mW*1e-3/(Math.PI*(source.beamDiameter_mm*1e-3)**2),1e-10);
  near(result.omega_rad_s/(2*Math.PI),result.fR,1e-8);
});

test('inverse power and waist agree with the separately printed paper inputs within reference precision',()=>{
  const d=computeDEff(state).dEff;
  const f=source.rabiOrdinary_MHz*1e6;
  const sigma=source.rabiOrdinary_uncertainty_MHz*1e6;
  const p=powerFromRabiHz(d,f,input.waist_um);
  const w=waistFromRabiHz(d,f,input.power_mW);
  // Compare to the original P and D, not the forward function's own output.
  near(p,source.power_mW,2*source.power_mW*sigma/f);
  near(w,source.beamDiameter_mm*1000/2,input.waist_um*sigma/f);
});
