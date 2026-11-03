import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const problems=new WeakMap();
const coreRows=page=>page.locator('table[data-table="core"] tbody tr[data-row-id]');
const card=(page,id)=>page.locator(`#dataComparison [data-comparison-id="${id}"]`);
const compare=(page,id)=>page.locator(`[data-data-compare="${id}"]`);
const unit=field=>`.rp-calc-unit[data-field="${field}"]`;
const ids=page=>coreRows(page).evaluateAll(rows=>rows.map(row=>row.dataset.rowId));
const goData=page=>page.locator('#sectionNav a[href="#secData"]').click();
const goRabi=page=>page.locator('#sectionNav a[href="#secRabi"]').click();

async function choose(page,id,channel){
  await page.locator(`#levelDiagram .transition-line[data-id="${id}"]`).press('Enter');
  if(channel)await page.locator(`#hfCGTableBody [data-channel-key="${channel}"]`).click();
  await goRabi(page);
}
async function config(page){
  await goRabi(page);
  const pending=page.waitForEvent('download');
  await page.locator('#configExport').click();
  const download=await pending;
  const value=JSON.parse(await readFile(await download.path(),'utf8'));
  delete value.exportedAt;
  return value;
}
async function record(page){
  await goRabi(page);
  const menu=page.locator('#calculationRecordExport');
  if(await menu.getAttribute('open')===null)await menu.locator(':scope > summary').click();
  const pending=page.waitForEvent('download');
  await page.locator('#recordExportJSON').click();
  const download=await pending;
  return JSON.parse(await readFile(await download.path(),'utf8'));
}
async function definitions(page){
  await goRabi(page);
  const details=page.locator('#beamDefinitionSettings');
  if(await details.getAttribute('open')===null)await details.locator(':scope > summary').click();
}
async function filters(page){
  const details=page.locator('.data-browser-filters');
  if(await details.getAttribute('open')===null)await details.locator(':scope > summary').click();
}
async function selectFilter(page,id,value){
  await filters(page);
  await page.locator(`#${id}`).selectOption(value);
}
async function add(page,...selected){
  await goData(page);
  for(const id of selected)await compare(page,id).click();
}
async function expectFrequency(page,id,hz){
  await expect(card(page,id)).toHaveAttribute('data-status','ok');
  await expect.poll(async()=>Number(await card(page,id).getAttribute('data-rabi-hz'))).toBeCloseTo(hz,7);
}

test.beforeEach(async ({page})=>{
  const errors=[];problems.set(page,errors);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{
    if(response.status()>=400&&/\.(?:js|json|css|csv)(?:\?|$)/.test(response.url()))errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('index.html');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  await goData(page);
  await expect(page.locator('#dataResultCount')).toHaveText('8 / 8 条');
});
test.afterEach(async ({page})=>{
  expect(problems.get(page),'No production exceptions or missing resources').toEqual([]);
});

test('search accepts wavelength aliases, term typography and evidence text without selecting a transition',async ({page})=>{
  const before=await config(page);
  await goData(page);
  for(const query of ['556','3P1 556','³P₁ 556','５５６','556 文献','556 literature-reported']){
    await page.locator('#dataSearch').fill(query);
    await expect(coreRows(page)).toHaveCount(1);
    expect(await ids(page)).toEqual(['T2']);
    await expect(page.locator('#dataResultCount')).toHaveText('1 / 8 条');
  }
  await page.locator('#dataSearch').fill('重泵 649');
  expect(await ids(page)).toEqual(['T6']);
  await page.locator('#dataSearch').fill('unmatched-quantum-state');
  await expect(coreRows(page)).toHaveCount(0);
  await expect(page.locator('#dataSearchEmpty')).toBeVisible();
  await page.locator('#dataSearchReset').click();
  await expect(coreRows(page)).toHaveCount(8);
  await expect(page.locator('#dataSearch')).toBeFocused();
  expect(await config(page)).toEqual(before);
});

test('filters compose with numeric sorting and the original five or fourteen table fields',async ({page})=>{
  const table=page.locator('table[data-table="core"]');
  await expect(table.locator('thead th:visible')).toHaveCount(5);
  await selectFilter(page,'dataRegion','visible');
  await selectFilter(page,'dataStrength','forbidden');
  expect(await ids(page)).toEqual(['T3','T4']);
  await selectFilter(page,'dataEvidence','missing');
  expect(await ids(page)).toEqual(['T4']);
  await page.locator('#dataSearchReset').click();
  await table.locator('th[data-sort="wavelength_vac_nm"] button').click();
  expect(await ids(page)).toEqual(['R2','T1','T4','T2','T3','T6','T7','T5']);
  await page.locator('#dataSearch').fill('重泵');
  const sorted=await ids(page);
  expect(sorted).toEqual(['T6','T7','T5']);
  await page.locator('.table-columns-toggle').click();
  await expect(table.locator('thead th:visible')).toHaveCount(14);
  expect(await ids(page)).toEqual(sorted);
  await page.locator('.table-columns-toggle').click();
  await expect(table.locator('thead th:visible')).toHaveCount(5);
  await page.locator('#tableTabs [data-tab="states"]').click();
  await expect(page.locator('#dataBrowser')).toBeHidden();
  await expect(page.locator('table[data-table="states"] tbody tr')).toHaveCount(21);
  await page.locator('#tableTabs [data-tab="core"]').click();
  expect(await ids(page)).toEqual(sorted);
});

test('comparison is capped at three, survives filtering and leaves calculator and main diagram unchanged',async ({page})=>{
  const before=await config(page);
  const diagram=await page.locator('#levelDiagram').innerHTML();
  await add(page,'T1','T2','T3');
  await compare(page,'T4').click();
  await expect(page.locator('#dataBrowserFeedback')).toContainText('最多比较 3 条');
  await expect(page.locator('.data-comparison-card')).toHaveCount(3);
  await page.locator('#dataSearch').fill('770');
  expect(await ids(page)).toEqual(['T7']);
  await expect(page.locator('.data-comparison-card')).toHaveCount(3);
  await page.locator('#dataSearchReset').click();
  for(const id of ['T1','T2','T3'])await expect(compare(page,id)).toHaveAttribute('aria-pressed','true');
  await expect(compare(page,'T4')).toHaveAttribute('aria-pressed','false');
  expect(await config(page)).toEqual(before);
  expect(await page.locator('#levelDiagram').innerHTML()).toBe(diagram);
  await expect(page.locator('#transitionPicker,#transitionComparison,#explorerToolbar,.explorer-card')).toHaveCount(0);
});

test('comparison uses M1 normalized component power and radius and updates with the actual work point',async ({page})=>{
  await definitions(page);
  await page.locator('#beamPowerPlane').selectOption('upstream');
  await page.locator('#beamTransmission').fill('80');
  await page.locator('#beamPowerBasis').selectOption('linear-total');
  await page.locator('#beamLinearOrientation').selectOption('manual');
  await page.locator('#beamManualFraction').fill('50');
  await page.locator('#beamSizeKind').selectOption('diameter');
  await page.locator(unit('power')).selectOption('mW');
  await page.locator(unit('waist')).selectOption('µm');
  await page.locator('#rpCalcP').fill('1');
  await page.locator('#rpCalcW').fill('100');
  const reference=await config(page);
  expect(reference.parameters.power_W).toBeCloseTo(.0004,12);
  expect(reference.parameters.waist_m).toBeCloseTo(50e-6,12);
  await add(page,'T1','T2');
  await expect(page.locator('#dataComparisonContext')).toContainText('Pq = 0.4 mW');
  await expect(page.locator('#dataComparisonContext')).toContainText('w₀ = 50 µm');
  await expectFrequency(page,'T2',reference.result.frequency_Hz);
  await goRabi(page);
  await page.locator('#rpCalcP').fill('4');
  await goData(page);
  await expectFrequency(page,'T2',2*reference.result.frequency_Hz);
  await expect(page.locator('#dataComparisonContext')).toContainText('Pq = 1.6 mW');
});

test('same-channel comparison rejects incompatible clock and D channels rather than choosing a strongest fallback',async ({page})=>{
  await choose(page,'T2','0.5|0.5|1.5|1.5|1');
  const reference=await config(page);
  await add(page,'T2','T3','T7');
  await expectFrequency(page,'T2',reference.result.frequency_Hz);
  for(const id of ['T3','T7']){
    await expect(card(page,id)).toHaveAttribute('data-status','no-channel');
    await expect(card(page,id)).not.toHaveAttribute('data-rabi-hz',/.+/);
    await expect(card(page,id).locator('[data-comparison-load]')).toBeDisabled();
    await expect(card(page,id).locator('.data-comparison-result strong')).toHaveText('—');
  }
  await card(page,'T2').locator('[data-comparison-remove]').click();
  await compare(page,'T4').click();
  await expect(card(page,'T4')).toHaveAttribute('data-status','unsupported');
  await expect(card(page,'T4').locator('.data-comparison-result strong')).toHaveText('—');
  await expect(card(page,'T4').locator('[data-comparison-load]')).toBeDisabled();
  await expect(page.locator('#dataComparisonContext')).toContainText('F′=3/2');
  expect(await config(page)).toEqual(reference);
});

test('J and effective F conventions retain their own sources and do not claim independent validation',async ({page})=>{
  await choose(page,'T3','0.5|0.5|0.5|0.5|0');
  await add(page,'T2','T3');
  for(const id of ['T2','T3']){
    await expect(card(page,id)).toHaveAttribute('data-status','ok');
    await expect(card(page,id).locator('.data-comparison-evidence')).toContainText(/未独立|未闭合/);
    await card(page,id).locator('.data-comparison-source > summary').click();
    await expect(card(page,id).locator('[data-source-field="d_num"]')).toBeVisible();
    await expect(card(page,id).locator('header .diagram-source-marks a')).toHaveCount(1);
  }
  await expect(card(page,'T2').locator('[data-source-field="d_num"]')).toContainText('J 级约化');
  await expect(card(page,'T3').locator('[data-source-field="d_num"]')).toContainText('有效 F 级约化');
  await expect(card(page,'T3').locator('header .diagram-source-marks a')).toHaveAttribute('href','#diagram-source-ref-01');
  await expect(card(page,'T3').locator('.data-comparison-channel .diagram-source-marks a')).toHaveAttribute('href','#diagram-source-internal-t3-20260908');
  await expect(card(page,'T2')).not.toContainText('Offer');
  await expect(page.locator('#dataComparison')).toContainText('不是独立实验验证');
});

test('invalid M1 context clears comparison values while valid zero power remains a zero result',async ({page})=>{
  await add(page,'T2','T3');
  await expect(card(page,'T2')).toHaveAttribute('data-status','ok');
  await definitions(page);
  await page.locator('#beamPowerPlane').selectOption('upstream');
  await page.locator('#beamTransmission').fill('');
  await goData(page);
  await expect(page.locator('#dataComparisonContext')).toHaveAttribute('data-status','invalid');
  for(const id of ['T2','T3']){
    await expect(card(page,id)).toHaveAttribute('data-status','invalid-context');
    await expect(card(page,id)).not.toHaveAttribute('data-rabi-hz',/.+/);
    await expect(card(page,id).locator('[data-comparison-load]')).toBeDisabled();
  }
  await goRabi(page);
  await page.locator('#beamTransmission').fill('80');
  await page.locator('#rpCalcP').fill('0');
  await goData(page);
  await expectFrequency(page,'T2',0);
  await expectFrequency(page,'T3',0);
  await expect(card(page,'T2').locator('.data-comparison-result strong')).toHaveText('0');
  const saved=await record(page);
  expect(saved.configuration.result.frequency_Hz).toBe(0);
  expect(saved.configuration.result.piTime_s).toBeNull();
});

test('loading a comparison explicitly restores its shared work point and makes M5 export that object only',async ({page})=>{
  await choose(page,'T3','0.5|0.5|0.5|0.5|0');
  const before=await record(page);
  await add(page,'T2','T3');
  const expectedHz=Number(await card(page,'T2').getAttribute('data-rabi-hz'));
  expect((await record(page)).transition.id).toBe('T3');
  await goData(page);
  await card(page,'T2').locator('[data-comparison-load]').click();
  await expect(page).toHaveURL(/#secRabi$/);
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition','T2');
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-mode','explicit');
  await expect(page.locator('#secRabi h2')).toBeFocused();
  const after=await record(page);
  expect(after.transition.id).toBe('T2');
  expect(after.configuration.parameters.power_W).toBe(before.configuration.parameters.power_W);
  expect(after.configuration.parameters.waist_m).toBe(before.configuration.parameters.waist_m);
  expect(after.configuration.inputDefinition).toEqual(before.configuration.inputDefinition);
  expect(after.configuration.selection.channel).toEqual(before.configuration.selection.channel);
  expect(after.configuration.result.frequency_Hz).toBeCloseTo(expectedHz,7);
  expect(after.evidence.sources.some(source=>/offer|xu-2014/.test(source.id))).toBe(false);
  expect(after.evidence.rows.find(row=>row.key==='experiment').status).toBe('not-closed');
});

test('keyboard filters and row navigation preserve focus and clear filtered-out comparisons safely',async ({page})=>{
  const summary=page.locator('.data-browser-filters > summary');
  await summary.focus();await summary.press('Enter');
  await expect(page.locator('.data-browser-filters')).toHaveAttribute('open','');
  await page.locator('#dataRegion').focus();await page.locator('#dataRegion').press('Escape');
  await expect(page.locator('.data-browser-filters')).not.toHaveAttribute('open','');
  await expect(summary).toBeFocused();
  await page.locator('[data-data-open="T1"]').press('Enter');
  await expect(page).toHaveURL(/#secCalc$/);
  await expect(page.locator('#secCalc h2')).toBeFocused();
  await expect(page.locator('#levelDiagram .transition-line[data-id="T1"]')).toHaveAttribute('aria-pressed','true');
  await goData(page);
  await compare(page,'T1').press('Enter');
  await page.locator('#dataSearch').fill('556');
  await card(page,'T1').locator('[data-comparison-remove]').press('Enter');
  await expect(page.locator('#dataComparison')).toBeHidden();
  await expect(page.locator('#dataSearch')).toBeFocused();
});

test('three comparison cards and open source or filter details fit the viewport',async ({page})=>{
  await add(page,'T1','T2','T3');
  await card(page,'T3').locator('.data-comparison-source > summary').click();
  await card(page,'T3').locator('[data-source-field="d_num"] .source-audit > summary').click();
  await filters(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
  const viewport=page.viewportSize();
  for(const id of ['T1','T2','T3']){
    const box=await card(page,id).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);
  }
  await page.locator('#dataComparisonClear').click();
  await expect(page.locator('#dataComparison')).toBeHidden();
  await expect(page.locator('#dataSearch')).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
});
