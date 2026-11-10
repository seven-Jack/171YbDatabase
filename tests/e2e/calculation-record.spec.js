import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const problems = new WeakMap();
const unit = field => `.rp-calc-unit[data-field="${field}"]`;

async function choose(page, id, channel) {
  await page.locator(`#levelDiagram .transition-line[data-id="${id}"]`).press('Enter');
  if (channel) await page.locator(`#hfCGTableBody [data-channel-key="${channel}"]`).click();
  await page.locator('#sectionNav a[href="#secRabi"]').click();
}

async function menu(page) {
  const control = page.locator('#calculationRecordExport');
  if (await control.getAttribute('open') === null) await control.locator(':scope > summary').click();
  return control;
}

async function downloadRecord(page, format = 'json') {
  await menu(page);
  const pending = page.waitForEvent('download');
  await page.locator(format === 'json' ? '#recordExportJSON' : '#recordExportMarkdown').click();
  const download = await pending;
  const text = await readFile(await download.path(), 'utf8');
  expect(download.suggestedFilename()).toMatch(new RegExp(`^171yb-[A-Z][0-9]+-record\\.${format === 'json' ? 'json' : 'md'}$`));
  await expect(page.locator('#calculationRecordExport')).not.toHaveAttribute('open','');
  return format === 'json' ? JSON.parse(text) : text;
}

async function downloadConfig(page) {
  const pending = page.waitForEvent('download');
  await page.locator('#configExport').click();
  const download = await pending;
  const config = JSON.parse(await readFile(await download.path(),'utf8'));
  delete config.exportedAt;
  return config;
}

async function restore(page, value) {
  await page.locator('#configFile').setInputFiles({name:'research-record.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});
  await expect(page.getByTestId('config-status')).toContainText('已恢复计算配置');
  await expect(page.getByTestId('config-status')).not.toContainText('导入失败');
}

test.beforeEach(async ({page}) => {
  const errors = [];
  problems.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if(response.status() >= 400 && /\.(?:js|json|css)(?:\?|$)/.test(response.url())) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('index.html');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  await page.locator('#sectionNav a[href="#secRabi"]').click();
});

test.afterEach(async ({page}) => {
  expect(problems.get(page)).toEqual([]);
});

test('automatic channel is resolved in the research record without changing the v2 configuration or live state', async ({page}) => {
  const before = await downloadConfig(page);
  expect(before.selection.channel).toBeNull();
  const record = await downloadRecord(page);
  expect(record.kind).toBe('171yb-rabi-record');
  expect(record.schemaVersion).toBe(1);
  expect(record.configuration.schemaVersion).toBe(2);
  expect(record.transition).toMatchObject({id:'T2',lower:'¹S₀',upper:'³P₁',J_lower:0,J_upper:1});
  expect(record.transition.multipole).toMatch(/^E1/);
  expect(record.transition.wavelength.value).toBeGreaterThan(0);
  expect(record.transition.wavelength.unit).toBe('nm');
  expect(record.configuration.selection.channel).toBeNull();
  expect(record.resolvedChannel.selectionOrigin).toBe('auto');
  expect(record.resolvedChannel.q).toBe(0);
  expect(record.resolvedChannel.mp).toBe(record.resolvedChannel.m);
  expect(record.resolvedChannel.dEff_ea0).toBeGreaterThan(0);
  expect(record.build).toHaveProperty('worktreeDirty');
  expect(record.evidence.evidenceVersion).toBe('2026.11.02.1');
  expect(record.configuration.result.frequency_Hz).toBeGreaterThan(0);
  const {exportedAt, ...savedConfig} = record.configuration;
  expect(savedConfig).toEqual(before);
  expect(await downloadConfig(page)).toEqual(before);
});

test('the explicit 770 nm channel keeps its own strength, source and theoretical review', async ({page}) => {
  await choose(page,'T7','2.5|2.5|1.5|1.5|-1');
  const record = await downloadRecord(page);
  expect(record.resolvedChannel).toMatchObject({F:2.5,m:2.5,Fp:1.5,mp:1.5,q:-1,selectionOrigin:'manual'});
  expect(record.primaryQuantity).toMatchObject({value:4.99,sourceId:'ref-01',convention:'J-reduced',uncertainty:.32});
  expect(record.evidence.rows.find(row=>row.key==='comparison').status).toBe('theory-compatible');
  expect(record.evidence.rows.find(row=>row.key==='experiment').status).toBe('not-closed');
  expect(record.evidence.sources.some(source=>source.id==='porsev-1999')).toBe(true);
  expect(JSON.stringify(record.evidence)).not.toMatch(/offer-2026|xu-2014/);
});

test('clock JSON and Markdown retain the adopted source, fixed Offer powers and independent-validation boundary', async ({page}) => {
  await choose(page,'T3','0.5|0.5|0.5|0.5|0');
  const record = await downloadRecord(page);
  const markdown = await downloadRecord(page,'markdown');
  expect(record.primaryQuantity.sourceId).toBe('internal-t3-20260908');
  expect(record.primaryQuantity.uncertainty).toBeNull();
  expect(record.evidence.comparisons[0].rows.map(row=>row.power_mW)).toEqual([1070,338]);
  for (const value of ['internal-t3-20260908','1070','338','22','未独立','10.1103/PhysRevLett.113.033003']) expect(markdown).toContain(value);
  expect(markdown).toMatch(/非当前输入|非本次输入|固定文献/);
  expect(markdown).toMatch(/不确定度.*(?:未建立|未知)|(?:未建立|未知).*不确定度/);
  expect(markdown).not.toMatch(/file:\/\/|\/Users\/|references\/papers|data\/literature/);
});

test('M1 upstream total power and diameter keep entered and normalized SI values separate', async ({page}) => {
  await choose(page,'T3','0.5|-0.5|0.5|0.5|1');
  const definitions=page.locator('#beamDefinitionSettings');
  if(await definitions.getAttribute('open')===null) await definitions.locator(':scope > summary').click();
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
  const record=await downloadRecord(page), config=record.configuration;
  expect(config.inputDefinition).toMatchObject({powerPlane:'upstream',powerBasis:'linear-total',transmission:.8,manualFraction:.5,sizeKind:'diameter'});
  expect(config.enteredParameters.power_W).toBeCloseTo(.001,12);
  expect(config.enteredParameters.size_m).toBeCloseTo(.0001,12);
  expect(config.parameters.power_W).toBeCloseTo(.0004,12);
  expect(config.parameters.waist_m).toBeCloseTo(.00005,12);
  await restore(page,record);
  expect((await downloadRecord(page)).configuration.parameters).toEqual(config.parameters);
});

test('power and waist inverse solutions can be saved and restored through the existing import entry', async ({page}) => {
  await choose(page,'T3','0.5|0.5|0.5|0.5|0');
  for(const solveFor of ['power','waist']){
    await page.locator('#calcSolveFor').selectOption(solveFor);
    await page.locator(unit('rabi')).selectOption('kHz');
    await page.locator('#rpCalcR').fill('10');
    if(solveFor==='power'){
      await page.locator(unit('waist')).selectOption('µm');
      await page.locator('#rpCalcW').fill('50');
    } else {
      await page.locator(unit('power')).selectOption('mW');
      await page.locator('#rpCalcP').fill('1');
    }
    const record=await downloadRecord(page);
    expect(record.configuration.display.solveFor).toBe(solveFor);
    expect(record.configuration.result.frequency_Hz).toBeCloseTo(10000,4);
    await choose(page,'T2');
    await restore(page,record);
    await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition','T3');
    await expect(page.locator('#calcSolveFor')).toHaveValue(solveFor);
    const restored=await downloadRecord(page);
    expect(restored.configuration.parameters).toEqual(record.configuration.parameters);
  }
});

test('restoring a forged historical result or evidence rebuilds the current calculation and review', async ({page}) => {
  await choose(page,'T3','0.5|0.5|0.5|0.5|0');
  const record=await downloadRecord(page), expected=record.configuration.result.frequency_Hz;
  record.configuration.matrixElement.reduced_ea0=9;
  record.configuration.result.frequency_Hz=1e30;
  record.primaryQuantity.value=9;
  record.transition.upper='forged-experimental-pass';
  record.resolvedChannel.dEff_ea0=9;
  record.evidence.summary='<script>forged-experimental-pass</script>';
  record.evidence.rows.forEach(row=>{row.status='checked';row.detail='forged-experimental-pass';});
  await restore(page,record);
  await expect(page.getByTestId('config-status')).toContainText(/研究记录|证据/);
  await expect(page.locator('#rabiResult')).not.toContainText('forged-experimental-pass');
  const fresh=await downloadRecord(page);
  expect(fresh.primaryQuantity.value).toBe(.0000919);
  expect(fresh.transition.upper).not.toBe('forged-experimental-pass');
  expect(fresh.configuration.result.frequency_Hz).toBeCloseTo(expected,7);
  expect(fresh.evidence.rows.find(row=>row.key==='experiment').status).toBe('not-closed');
  expect(fresh.evidence.summary).not.toContain('forged-experimental-pass');
});

test('invalid inputs and unsupported excitation disable record export and valid inputs recover', async ({page}) => {
  const definitions=page.locator('#beamDefinitionSettings');
  if(await definitions.getAttribute('open')===null) await definitions.locator(':scope > summary').click();
  await page.locator('#beamPowerPlane').selectOption('upstream');
  await page.locator('#beamTransmission').fill('');
  await menu(page);
  await expect(page.locator('#recordExportJSON')).toBeDisabled();
  await expect(page.locator('#recordExportMarkdown')).toBeDisabled();
  await expect(page.locator('#calculationRecordExport')).toHaveAttribute('data-status','invalid');
  await page.locator('#beamTransmission').fill('80');
  await menu(page);
  await expect(page.locator('#recordExportJSON')).toBeEnabled();
  await downloadRecord(page);
  await choose(page,'T4');
  await menu(page);
  await expect(page.locator('#recordExportJSON')).toBeDisabled();
  await expect(page.locator('#recordExportMarkdown')).toBeDisabled();
});

test('zero power records zero frequency and an infinite pi time without inventing a finite value', async ({page}) => {
  await choose(page,'T3','0.5|0.5|0.5|0.5|0');
  await page.locator('#rpCalcP').fill('0');
  const record=await downloadRecord(page), markdown=await downloadRecord(page,'markdown');
  expect(record.configuration.result.frequency_Hz).toBe(0);
  expect(record.configuration.result.piTime_s).toBeNull();
  expect(markdown).toMatch(/∞|无穷|无限/);
});

test('the compact menu supports keyboard dismissal and unreviewed R2 records without page overflow', async ({page}) => {
  const control=page.locator('#calculationRecordExport'), summary=control.locator(':scope > summary');
  await summary.focus();
  await summary.press('Enter');
  await expect(control).toHaveAttribute('open','');
  await page.locator('#recordExportJSON').focus();
  await page.locator('#recordExportJSON').press('Escape');
  await expect(control).not.toHaveAttribute('open','');
  await expect(summary).toBeFocused();
  await choose(page,'R2');
  const record=await downloadRecord(page);
  expect(record.evidence.hasReview).toBe(false);
  expect(record.evidence.rows.every(row=>row.status==='not-reviewed')).toBe(true);
  expect(record.primaryQuantity).toMatchObject({sourceId:'internal-r017-20261110',uncertainty:null,convention:'F-reduced'});
  expect(record.transition.wavelength.evidenceKind).toBe('scaling-estimate');
  await menu(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
  await page.locator('#rabiResult').click();
  await expect(control).not.toHaveAttribute('open','');
});
