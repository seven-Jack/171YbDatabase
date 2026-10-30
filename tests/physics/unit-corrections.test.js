import test from 'node:test';
import assert from 'node:assert/strict';
import {A0,A0_UM} from '../../src/physics/constants.js';
import {ESTIMATE_CONFIG} from '../../src/data/catalog.js';
import {calcRydberg,generateRydbergStates} from '../../src/physics/estimates.js';

// Independent reference: NIST, 2018 CODATA, Extensive Listing p.1, a0 row.
// https://physics.nist.gov/cuu/pdf/all_2018.pdf
// Deliberately do not derive this expected value from production constants.
const referenceMicrometres=0.0000529177210903;
const close=(actual,expected,tolerance=1e-18)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);

test('Bohr radius retains the 2018 SI mantissa and converts metres to micrometres',()=>{
  assert.equal(A0,5.29177210903e-11);
  close(A0_UM,referenceMicrometres);
  close(A0_UM/0.00000529177210903,10,1e-13);
});

test('injected canonical estimate constant agrees with the independent SI conversion',()=>{
  close(ESTIMATE_CONFIG.constants.A0_UM,referenceMicrometres);
  close(ESTIMATE_CONFIG.constants.A0_UM,A0_UM);
  assert.equal(ESTIMATE_CONFIG.evidenceKind,'scaling-estimate');
  assert.equal(ESTIMATE_CONFIG.reviewStatus,'conflict-unresolved');
});

test('all 21 displayed sizes agree with separately evaluated decimal arithmetic',()=>{
  // Evaluated using Python Decimal at 28 digits from NIST a0 in metres,
  // 1m=10^6um and 3/2*a0*(n-delta)^2; historical fixtures stay unchanged.
  const expected=[
    '0.179','0.219','0.262','0.310','0.361','0.417','0.476',
    '0.187','0.228','0.272','0.321','0.373','0.430','0.490',
    '0.187','0.228','0.272','0.321','0.373','0.430','0.490'
  ];
  for(const config of [{},ESTIMATE_CONFIG]){
    assert.deepEqual(generateRydbergStates(config).map(row=>row.radius_um),expected);
  }
});

test('65S size-scale example is 0.3098366063314863um before display rounding',()=>{
  const size=1.5*A0_UM*62.477**2;
  close(size,0.3098366063314863,1e-15);
  assert.equal(calcRydberg(65,2.523).radius_um,'0.310');
  assert.equal(calcRydberg(65,2.523,undefined,ESTIMATE_CONFIG.constants).radius_um,'0.310');
});
