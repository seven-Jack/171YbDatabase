import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const evidence = read('../../data/evidence.json');
const original = read('../../data/literature/low-state-rabi-validation-2026-10-30/cases.json');
const archived = read('../../data/literature/low-state-rabi-validation-2026-10-30/results.json');
const canonical = read('../../data/transitions.json');
const ids = ['T1', 'T2', 'T5', 'T6', 'T7'];
const sourceIds = {
  T1:['kroeze-2026'], T2:['kroeze-2026','beloy-2012'],
  T5:['kroeze-2026','beloy-2012','porsev-1999'],
  T6:['kroeze-2026','porsev-1999'], T7:['kroeze-2026','porsev-1999'],
};
const stable = value => Array.isArray(value) ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key,stable(value[key])])) : value;
const fingerprint = value => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');

test('M4 preserves the reviewed main T3 record and Offer comparison facts', () => {
  // Semantic fingerprints taken from main 95131cc; no .git access is needed to test a source archive.
  const t3 = evidence.records.find(record => record.transitionId === 'T3');
  const {kind, ...offer} = evidence.comparisons.find(comparison => comparison.id === 'offer-578-conditional');
  assert.equal(kind, 'conditional-power');
  assert.equal(fingerprint(t3), 'fb5dc856c3dbec0d3fd9f16c6895ed4ec5e242edaaf7bc658e63e1f034475ba1');
  assert.equal(fingerprint(offer), 'bb56b421b4a0d30db7887aed1b6a40b93b777d49807f58d7e3fc6ce9f4e3b1f9');
});

for (const id of ids) {
  test(`${id} public evidence reproduces its own archived inputs, exact channel and theoretical result`, () => {
    const record = evidence.records.find(item => item.transitionId === id);
    const sourceCase = original.cases.find(item => item.transitionId === id);
    const result = archived.cases.find(item => item.transitionId === id);
    const dipole = canonical.records.find(item => item.id === id).quantities.d_num;
    assert.ok(record);
    assert.equal(record.reviewedAt, original.verifiedOn);
    assert.match(record.sourceDetail, /2026-11-02.*2026-10-30/);
    assert.equal(record.primarySourceId, result.canonicalDipoleSourceId);
    assert.equal(record.primarySourceId, dipole.sourceId);
    assert.equal(record.appliesTo.dipole_ea0, sourceCase.dJ_ea0);
    assert.equal(record.appliesTo.dipole_ea0, result.canonicalDipole_ea0);
    assert.equal(record.appliesTo.dipole_ea0, dipole.value);
    assert.equal(record.appliesTo.convention, dipole.convention);
    assert.equal(record.appliesTo.formulaVersion, archived.formulaVersion);
    assert.deepEqual(record.appliesTo.channels, [sourceCase.channel]);
    assert.deepEqual(record.appliesTo.channels, [result.channel]);
    assert.equal(record.appliesTo.F, sourceCase.channel.F);
    assert.equal(record.appliesTo.Fp, sourceCase.channel.Fp);
    assert.deepEqual(record.appliesTo.q, [sourceCase.channel.q]);
    assert.deepEqual(record.sourceIds, sourceIds[id]);
    assert.deepEqual(record.atomicSupport.sourceIds, sourceIds[id]);
    assert.equal(record.atomicSupport.quantities.find(item => item.evidenceKind === 'compiled-dipole').value, sourceCase.dJ_ea0);
    assert.equal(record.atomicSupport.quantities.find(item => item.label === '汇编寿命及分支重建 dJ').value, result.lifetimeBranchRoute.reconstructedDipole_ea0);
    assert.equal(record.comparisonIds.length, 1);

    const comparison = evidence.comparisons.find(item => item.id === record.comparisonIds[0]);
    assert.equal(comparison.id, `kroeze-${id.toLowerCase()}-theory`);
    assert.equal(comparison.kind, 'theory-benchmark');
    assert.equal(comparison.status, 'theory-compatible');
    assert.deepEqual(comparison.sourceIds, ['kroeze-2026']);
    assert.deepEqual(comparison.channel, sourceCase.channel);
    for (const key of ['power_mW','waist_um','calculatedRabi_MHz','publishedRabi_MHz','publishedRabiUncertainty_MHz']) {
      assert.equal(comparison[key], result[key], key);
    }
    assert.equal(comparison.power_mW, original.conventions.power_mW);
    assert.equal(comparison.waist_um, original.conventions.waist_um);
    assert.equal(comparison.publishedRabi_MHz, sourceCase.rabiOrdinary_MHz);
    assert.equal(comparison.publishedRabiUncertainty_MHz, sourceCase.rabiOrdinary_uncertainty_MHz);
    assert.match(comparison.scopeText, /固定文献基准，非当前输入/);
    assert.match(comparison.normalizationNote, /π\/q=0.*明确态对.*ΔmF/);
    assert.match(comparison.boundary, /不能作为.*独立验证/);
    assert.match(record.summary, /未独立实验验证/);
  });
}

test('low-state support retains original-source identities and theory/lifetime evidence types', () => {
  for (const source of original.sources) {
    const publicSource = evidence.sources.find(item => item.id === source.id);
    assert.equal(publicSource.doi, source.doi);
    assert.ok(publicSource.locations.length > 0);
  }
  for (const item of original.strengthCrossChecks) {
    const record = evidence.records.find(record => record.transitionId === item.transitionId);
    const support = record.atomicSupport.quantities.find(quantity => quantity.value === item.dJ_ea0
      && quantity.label.includes(item.sourceId === 'beloy-2012' ? 'Beloy' : 'Porsev'));
    assert.ok(support, `${item.transitionId} ${item.sourceId}`);
    assert.equal(support.evidenceKind, item.sourceId === 'beloy-2012' ? 'lifetime-derived-dipole' : 'theory-dipole');
    assert.equal(item.isDirectMeasuredRabiBenchmark, false);
  }
});

test('T7 keeps its distinct angular channel, source wavelength conflict and partial-branch boundary', () => {
  const record = evidence.records.find(item => item.transitionId === 'T7');
  const comparison = evidence.comparisons.find(item => item.id === record.comparisonIds[0]);
  assert.deepEqual(comparison.channel, {F:2.5,m:2.5,Fp:1.5,mp:1.5,q:-1});
  assert.match(record.formulaDetail, /\|d_eff\|=\|dJ\|\/√5/);
  assert.match(record.atomicSupport.summary, /770\.160284.*770\.16026840069.*冲突/);
  assert.match(comparison.normalizationNote, /A=β\/τ.*2J′\+1=3/);
  assert.match(comparison.normalizationNote, /不覆盖采用值/);
  assert.equal(evidence.records.some(item => item.transitionId === 'T4'), false);
  assert.equal(evidence.records.some(item => item.transitionId === 'R2'), false);
});
