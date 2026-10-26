import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {CATALOG,HYPERFINE_DATA} from '../../src/data/catalog.js';
const require=createRequire(import.meta.url);
const {renderCsv,sha256}=require('../../scripts/export-data.cjs');
const baseline=JSON.parse(fs.readFileSync(new URL('../fixtures/catalog-baseline.json',import.meta.url),'utf8'));

test('65S CSV is generated from the same saved rows as the production page object and preserves its original bytes',()=>{
  const csv=renderCsv(CATALOG.hyperfine.saved65S);
  assert.equal(sha256(csv),baseline.csvSha256);
  assert.equal(csv,fs.readFileSync(new URL('../../assets/05.21_yb171_65s_hyperfine.csv',import.meta.url),'utf8'));
  for (const row of CATALOG.hyperfine.saved65S.csv.rows) {
    const level=HYPERFINE_DATA['65³S₁'].levels.find(level=>level.F===Number(row.F));
    assert.equal(level.nu,Number(row.nu_upper));
    assert.equal(level.energyGHz,Number(row.energy_over_h_Hz_relative_ionic_hfs_centroid)/1e9);
    assert.equal(level.shift,Number(row.shift_over_h_MHz));
  }
});

test('saved 65S frequencies satisfy the published internal difference, 2:4 centroid and effective-A relations',()=>{
  const hfs=HYPERFINE_DATA['65³S₁'];
  const [lower,upper]=hfs.levels;
  assert.ok(Math.abs((upper.energyGHz-lower.energyGHz)*1000-hfs.splitting)<1e-9);
  assert.ok(Math.abs((2*lower.energyGHz+4*upper.energyGHz)/6-hfs.centroidGHz)<1e-10);
  assert.ok(Math.abs(2*lower.shift+4*upper.shift)<1e-8);
  assert.ok(Math.abs((2/3)*hfs.splitting-hfs.A)<1e-10);
  assert.equal(CATALOG.hyperfine.saved65S.conditions.magneticField_G,0);
  assert.equal(CATALOG.hyperfine.saved65S.physicalValidation,'independent-experimental-validation-and-total-model-uncertainty-not-established');
});
