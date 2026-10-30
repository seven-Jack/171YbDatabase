import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS} from '../../src/data/catalog.js';
import {buildExplorerRecords,normalizeSearch,filterExplorerRecords,toggleComparison,comparisonConventions} from '../../src/ui/explorer-model.js';

const records=buildExplorerRecords(CORE_TRANSITIONS);
const ids=rows=>rows.map(record=>record.id);

test('keyword search normalizes term typography and full-width wavelength input',()=>{
  assert.equal(normalizeSearch('  ¹Ｓ₀ → ³Ｐ₁  '),'1s0 3p1');
  assert.deepEqual(ids(filterExplorerRecords(records,{query:'１Ｓ０ ３Ｐ１'})),['T2']);
  assert.deepEqual(ids(filterExplorerRecords(records,{query:'５５５．８'})),['T2']);
  assert.deepEqual(ids(filterExplorerRecords(records,{query:'65S 里德堡'})),['R2']);
  assert.deepEqual(ids(filterExplorerRecords(records,{query:'窄线 冷却'})),['T2']);
  assert.deepEqual(ids(filterExplorerRecords(records,{query:'重泵 649'})),['T6']);
});

test('independent filters combine region, class and matrix-element evidence',()=>{
  assert.deepEqual(ids(filterExplorerRecords(records,{region:'IR'})),['T5']);
  assert.deepEqual(ids(filterExplorerRecords(records,{region:'UV'})),['R2']);
  assert.deepEqual(ids(filterExplorerRecords(records,{region:'visible',strength:'forbidden'})),['T3','T4']);
  assert.deepEqual(ids(filterExplorerRecords(records,{evidence:'internal-calibration'})),[]);
  assert.deepEqual(ids(filterExplorerRecords(records,{evidence:'missing'})),['T4']);
  assert.deepEqual(ids(filterExplorerRecords(records,{evidence:'literature-reported',query:'555'})),['T2']);
  assert.deepEqual(ids(filterExplorerRecords(records,{query:'555',strength:'strong'})),[]);
});

test('wavelength ordering is numeric, stable and leaves missing values last in both directions',()=>{
  const withMissing=[...records,{...records[0],id:'missing',index:8,wavelength:null}];
  assert.deepEqual(ids(filterExplorerRecords(withMissing,{sort:'wavelength-asc'})),['R2','T1','T4','T2','T3','T6','T7','T5','missing']);
  assert.deepEqual(ids(filterExplorerRecords(withMissing,{sort:'wavelength-desc'})),['T5','T7','T6','T3','T2','T4','T1','R2','missing']);
  assert.deepEqual(ids(records),ids(buildExplorerRecords(CORE_TRANSITIONS)));
});

test('canonical missing E1 data stays missing even when the legacy adapter has a zero',()=>{
  const t4=records.find(record=>record.id==='T4');
  assert.equal(CORE_TRANSITIONS.find(transition=>transition.id==='T4').d_num,0);
  assert.equal(t4.fields.d_num.value,null);
  assert.equal(t4.fields.d_num.missing,true);
  assert.match(t4.fields.d_num.valueText,/缺失/);
  assert.match(t4.fields.d_num.conventionText,/缺少适用 E1/);
  assert.equal(t4.fields.wavelength_vac_nm.missing,false);
});

test('unknown records are not silently coerced to numeric zero or literature evidence',()=>{
  const [unknown]=buildExplorerRecords([{id:'unknown',lower:'X',upper:'Y',wavelength_vac_nm:null,d_num:0}]);
  assert.equal(unknown.wavelength,null);
  assert.equal(unknown.evidenceKind,null);
  for (const field of Object.values(unknown.fields)) {
    assert.equal(field.value,null);assert.equal(field.missing,true);assert.match(field.valueText,/缺失/);
  }
});

test('comparison is immutable, limited to three and independent of filtered results',()=>{
  const initial=['T1','T2'];
  const added=toggleComparison(initial,'T3');
  assert.deepEqual(initial,['T1','T2']);
  assert.deepEqual(added,{ids:['T1','T2','T3'],action:'added'});
  assert.deepEqual(toggleComparison(added.ids,'T4'),{ids:['T1','T2','T3'],action:'limit'});
  filterExplorerRecords(records,{query:'R2'});
  assert.deepEqual(added.ids,['T1','T2','T3']);
  assert.deepEqual(toggleComparison(added.ids,'T2'),{ids:['T1','T3'],action:'removed'});
});

test('comparison identifies J-reduced, effective F-reduced and missing E1 conventions separately',()=>{
  const t2=records.find(record=>record.id==='T2'),t3=records.find(record=>record.id==='T3');
  assert.equal(t2.convention,'J-reduced');assert.equal(t3.convention,'F-reduced-effective');
  assert.equal(t2.fields.d_num.evidenceText,'文献推导值');
  assert.match(t3.fields.d_num.conventionText,/有效 F/);
  const mixed=comparisonConventions(records,['T2','T3','T4']);
  assert.equal(mixed.mixed,true);assert.equal(mixed.hasMissing,true);
  assert.deepEqual(mixed.conventions,['J-reduced','F-reduced-effective','no-E1-data']);
  assert.match(mixed.text,/不同约定/);
  assert.equal(comparisonConventions(records,['T1','T2']).mixed,false);
});
