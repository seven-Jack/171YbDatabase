import assert from 'node:assert/strict';
import test from 'node:test';
import { CORE_TRANSITIONS, DATASET_MANIFEST, RYDBERG_SERIES_TRANSITIONS } from '../../src/data/catalog.js';
import { FORMULA_VERSION } from '../../src/physics/constants.js';
import { createRecordLink, datasetReference, readRecordLink } from '../../src/ui/record-links.js';

const page = 'http://127.0.0.1:4173/171YbDatabase/index.html';
const versions = {
  datasetVersion: DATASET_MANIFEST.datasetVersion,
  datasetHash: DATASET_MANIFEST.contentHash,
  formulaVersion: FORMULA_VERSION,
  worktreeDirty: false,
};
const core = id => CORE_TRANSITIONS.find(transition => transition.id === id);
const series = id => RYDBERG_SERIES_TRANSITIONS.find(transition => transition.id === id);

function workingPoint(transition, F_upper) {
  return {
    transition, F_upper, F_lower: 0.5, pol: 'pi', P_mW: 4, w_um: 75,
    solveFor: 'rabi', inputStatus: 'valid',
    selectedChannel: { F: 0.5, m: 0.5, Fp: F_upper, mp: 0.5, q: 0 },
  };
}

test('record links preserve the site path, transition identity and selected branch without work inputs', () => {
  for (const [transition, F_upper] of [[core('T3'), 0.5], [series('NS-29-F32'), 1.5], [core('R2'), 0.5], [core('R2'), 1.5]]) {
    const url = new URL(createRecordLink(page + '?discard=1#secCalc', { transition, F_upper }, versions));
    assert.equal(url.origin + url.pathname, page);
    assert.equal(url.search, '');
    assert.equal(new URLSearchParams(url.hash.slice(1)).has('workpoint'), false);
    assert.deepEqual(readRecordLink(url.hash, versions), { transition, F_upper, state: null, warnings: [] });
  }
});

test('workpoint links recover the actual channel and recalculate from the canonical data', () => {
  const point = workingPoint(core('T3'), 0.5);
  const url = new URL(createRecordLink(page, point, versions, true));
  const fields = new URLSearchParams(url.hash.slice(1));
  const config = JSON.parse(fields.get('workpoint'));
  config.matrixElement.reduced_ea0 = 12;
  config.result.frequency_Hz = 1e25;
  fields.set('workpoint', JSON.stringify(config));
  const restored = readRecordLink('#' + fields.toString(), versions);
  assert.equal(restored.state.transition.id, 'T3');
  assert.equal(restored.state.P_mW, point.P_mW);
  assert.equal(restored.state.w_um, point.w_um);
  for (const [key, value] of Object.entries(point.selectedChannel)) assert.equal(restored.state.selectedChannel[key], value);
  assert.notEqual(restored.state.dReduced, 12);
  assert.notEqual(restored.state.fR_MHz, 1e19);
  assert.match(restored.warnings.join(' '), /当前重算结果不同/);
});

test('Rydberg workpoint links preserve display filters independently of the calculation branch', () => {
  for (const [id, selected, filter] of [['NS-65-F12', 0.5, 1.5], ['NS-65-F32', 1.5, 0.5]]) {
    const point = { ...workingPoint(series(id), selected), diagF_upper: filter };
    const { hash } = new URL(createRecordLink(page, point, versions, true));
    const restored = readRecordLink(hash, versions);

    assert.equal(restored.transition.id, id);
    assert.equal(restored.state.F_upper, selected);
    assert.equal(restored.state.selectedChannel.Fp, selected);
    assert.equal(restored.state.diagF_upper, filter);
    assert.deepEqual(restored.warnings, []);
  }
});

test('incoming version and dirty notices survive both record and workpoint links', () => {
  const historical = { ...versions, datasetVersion: '2026.01.01.1', datasetHash: '1'.repeat(64), formulaVersion: '0.0.1', worktreeDirty: true };
  for (const includeWorkpoint of [false, true]) {
    const { hash } = new URL(createRecordLink(page, workingPoint(core('T3'), 0.5), historical, includeWorkpoint));
    const restored = readRecordLink(hash, versions);
    assert.match(restored.warnings.join(' '), /2026\.01\.01\.1.*当前.*已使用当前数据/);
    assert.match(restored.warnings.join(' '), /0\.0\.1.*已使用当前公式/);
    assert.match(restored.warnings.join(' '), /含未提交改动/);
    assert.equal(restored.warnings.filter(warning => warning.includes('已使用当前数据')).length, 1);
  }
});

test('links reject conflicting records, traversal strings and oversized or duplicate fields', () => {
  assert.equal(readRecordLink('#secCalc', versions), null);
  const url = new URL(createRecordLink(page, workingPoint(core('T3'), 0.5), versions, true));
  const fields = new URLSearchParams(url.hash.slice(1));
  fields.set('record', '../../index.html');
  assert.throws(() => readRecordLink('#' + fields.toString(), versions), /没有该跃迁/);
  fields.set('record', 'R2');
  assert.throws(() => readRecordLink('#' + fields.toString(), versions), /工作点.*不匹配/);
  fields.set('record', 'NS-29-F32');
  assert.throws(() => readRecordLink('#' + fields.toString(), versions), /末态 F′/);
  assert.throws(() => readRecordLink(url.hash + '&record=T3', versions), /重复字段/);
  assert.throws(() => readRecordLink(url.hash + '&workpoint=' + 'x'.repeat(4096), versions), /链接过长/);
});

test('a dirty catalog cannot use a clean app commit as a data citation', () => {
  const dirty = { ...versions, datasetVersion: 'test-preview', appCommit: 'f'.repeat(40), worktreeDirty: true };
  const publicPage = 'https://seven-Jack.github.io/171YbDatabase/index.html';
  assert.deepEqual(datasetReference(page, 'NS-29-F32', dirty), {
    manifestUrl: 'http://127.0.0.1:4173/171YbDatabase/data/dataset.json',
    recordUrl: 'http://127.0.0.1:4173/171YbDatabase/data/rydberg-series.json',
    publicManifestUrl: null,
  });
  assert.equal(datasetReference(publicPage, 'T3', dirty).publicManifestUrl, null);
  assert.equal(datasetReference(publicPage, 'T3', { ...dirty, worktreeDirty: false }).publicManifestUrl,
    'https://github.com/seven-Jack/171YbDatabase/blob/' + dirty.appCommit + '/data/dataset.json');
  const published = {
    ...dirty,
    datasetVersion: '2026.11.11.1',
    datasetHash: '4b5df2bd0e5679ce5576f6bcfa5fa99b0b4cd586c371766de6aab2f9ea193068',
  };
  assert.match(datasetReference(page, 'T3', published).publicManifestUrl, /ad20cd78cb65fc245a29e7f35ffb373e7b416238\/data\/dataset\.json$/);
});

test('the November 18 data version pins the published data independently of the preview app commit', () => {
  const released = {
    ...versions,
    datasetVersion: '2026.11.18.2',
    datasetHash: 'f8f8bf3789d69eda79ab2e183378b7d6ad7f0543aae51f13aca0a03980147ba2',
    appCommit: 'd3aeafc1ca31dd80c6b77697469ebe3071551f33',
  };
  const releaseUrl = 'https://github.com/seven-Jack/171YbDatabase/blob/07dc3f5b2c2fdc032b8ed5a30ec6e49715814fd0/data/dataset.json';
  for (const worktreeDirty of [false, true]) {
    assert.deepEqual(datasetReference(page + '?preview=1#record=NS-65-F32', 'NS-65-F32', { ...released, worktreeDirty }), {
      manifestUrl: 'http://127.0.0.1:4173/171YbDatabase/data/dataset.json',
      recordUrl: 'http://127.0.0.1:4173/171YbDatabase/data/rydberg-series.json',
      publicManifestUrl: releaseUrl,
    });
  }
  assert.equal(datasetReference(page, 'T3', { ...released, datasetHash: 'f'.repeat(64) }).publicManifestUrl, null);
});
