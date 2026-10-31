import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// All assertions use physical units, including when the solved field picks an
// automatic display unit. No test treats an upstream or total power as Pq.
const unitScales = {
  power: { W: 1000, mW: 1, 'µW': .001, nW: .000001 },
  rabi: { GHz: 1e9, MHz: 1e6, kHz: 1000, Hz: 1 },
  waist: { mm: 1000, 'µm': 1, nm: .001 },
};
const fieldIds = { power: 'rpCalcP', rabi: 'rpCalcR', waist: 'rpCalcW' };
const browserProblems = new WeakMap();

async function physicalField(page, key) {
  const value = Number(await page.locator(`#${fieldIds[key]}`).inputValue());
  const unit = await page.locator(`.rp-calc-unit[data-field="${key}"]`).inputValue();
  return value * unitScales[key][unit];
}

async function expectPhysical(page, key, expected, relativeTolerance = 3e-5) {
  await expect.poll(async () => {
    const value = await physicalField(page, key);
    return Math.abs(value - expected) / Math.max(Math.abs(expected), 1e-9);
  }, { message: `${key} must preserve the expected physical value ${expected}` }).toBeLessThanOrEqual(relativeTolerance);
}

async function openDefinitions(page) {
  const details = page.locator('#beamDefinitionSettings');
  if (await details.getAttribute('open') === null) await details.locator('summary').click();
  await expect(details).toHaveAttribute('open', '');
}

async function selectTransition(page, id) {
  const line = page.locator(`#levelDiagram .transition-line[data-id="${id}"]`);
  const label = line.locator('text').first();
  await label.scrollIntoViewIfNeeded();
  const groupBox = await line.boundingBox(), labelBox = await label.boundingBox();
  if (!groupBox || !labelBox) throw new Error(`Transition ${id} has no visible wavelength label`);
  await line.click({ position: {
    x: labelBox.x + labelBox.width / 2 - groupBox.x,
    y: labelBox.y + labelBox.height / 2 - groupBox.y,
  } });
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition', id);
  await page.locator('#sectionNav a[href="#secRabi"]').click();
}

async function exportConfig(page) {
  const pending = page.waitForEvent('download');
  await page.locator('#configExport').click();
  const download = await pending;
  return JSON.parse(await readFile(await download.path(), 'utf8'));
}

async function importConfig(page, value, filename = 'beam-config.json') {
  await page.locator('#configFile').setInputFiles({
    name: filename,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(value)),
  });
  await expect(page.getByTestId('config-status')).toContainText(/恢复|载入|导入/);
  await expect(page.getByTestId('config-status')).not.toContainText('导入失败');
  await expect(page.getByTestId('input-error')).toBeHidden();
}

async function setAdvancedBeam(page) {
  await openDefinitions(page);
  await page.locator('#rpCalcP').fill('1');
  await page.locator('#rpCalcW').fill('50');
  await page.locator('#beamPowerPlane').selectOption('upstream');
  await page.locator('#beamTransmission').fill('80');
  await page.locator('#beamPowerBasis').selectOption('linear-total');
  await page.locator('#beamLinearOrientation').selectOption('manual');
  await page.locator('#beamManualFraction').fill('50');
  await page.locator('#beamSizeKind').selectOption('diameter');
  await expect(page.getByTestId('input-error')).toBeHidden();
  await expectPhysical(page, 'power', 1);
  await expectPhysical(page, 'waist', 100);
}

test.beforeEach(async ({ page }) => {
  const errors = [];
  browserProblems.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && /\.(?:js|json|css|csv)(?:\?|$)/.test(response.url())) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await page.locator('#sectionNav a[href="#secRabi"]').click();
  await expect(page.locator('#calcSolveFor')).toHaveValue('rabi');
});

test.afterEach(async ({ page }) => {
  expect(browserProblems.get(page), 'No production script exceptions or missing resources').toEqual([]);
});

test('default definitions retain the existing work point and size representations preserve the physical beam', async ({ page }) => {
  await expect(page.locator('#beamPowerPlane')).toHaveValue('atoms');
  await expect(page.locator('#beamPowerBasis')).toHaveValue('component');
  await expect(page.locator('#beamSizeKind')).toHaveValue('radius');
  await expectPhysical(page, 'power', 1);
  await expectPhysical(page, 'waist', 50);
  const referenceHz = await physicalField(page, 'rabi');
  expect(referenceHz).toBeGreaterThan(0);
  const original = await exportConfig(page);
  expect(original.parameters.power_W).toBeCloseTo(.001, 12);
  expect(original.parameters.waist_m).toBeCloseTo(50e-6, 12);

  await openDefinitions(page);
  await page.locator('#beamSizeKind').selectOption('diameter');
  await expectPhysical(page, 'waist', 100);
  await expectPhysical(page, 'rabi', referenceHz);
  await page.locator('.rp-calc-unit[data-field="waist"]').selectOption('mm');
  await expect(page.locator('#rpCalcW')).toHaveValue('0.1');
  await expectPhysical(page, 'rabi', referenceHz);
  await page.locator('#beamSizeKind').selectOption('radius');
  await expectPhysical(page, 'waist', 50);
  await expectPhysical(page, 'rabi', referenceHz);
  const restored = await exportConfig(page);
  expect(restored.parameters.power_W).toBeCloseTo(original.parameters.power_W, 12);
  expect(restored.parameters.waist_m).toBeCloseTo(original.parameters.waist_m, 12);
});

test('upstream total power normalizes once, with explicit missing-factor states and sqrt-power response', async ({ page }) => {
  const referenceHz = await physicalField(page, 'rabi');
  await openDefinitions(page);
  await page.locator('#beamPowerPlane').selectOption('upstream');
  await expect(page.getByTestId('input-error')).toBeVisible();
  await expect(page.locator('#rpCalcR')).toHaveValue('');
  await page.locator('#beamTransmission').fill('101');
  await expect(page.getByTestId('input-error')).toBeVisible();
  await page.locator('#beamTransmission').fill('80');
  await expectPhysical(page, 'rabi', referenceHz * Math.sqrt(.8));

  await page.locator('#beamPowerBasis').selectOption('linear-total');
  await expect(page.getByTestId('input-error')).toBeVisible();
  await expect(page.locator('#rpCalcR')).toHaveValue('');
  await page.locator('#beamLinearOrientation').selectOption('manual');
  await page.locator('#beamManualFraction').fill('50');
  await expect(page.getByTestId('input-error')).toBeHidden();
  await expectPhysical(page, 'power', 1);
  await expectPhysical(page, 'rabi', referenceHz * Math.sqrt(.4));
  await expect(page.locator('#beamDefinitionNotice')).toBeVisible();
  await expect(page.locator('#beamNormalizedSummary')).toContainText(/0\.4\d*\s*mW/);
  const config = await exportConfig(page);
  expect(config.parameters.power_W).toBeCloseTo(.0004, 12);
  expect(config.enteredParameters.power_W).toBeCloseTo(.001, 12);
});

test('all three solve directions close in raw upstream-power and intensity-diameter coordinates', async ({ page }) => {
  await setAdvancedBeam(page);
  const referenceHz = await physicalField(page, 'rabi');
  await page.locator('#calcSolveFor').selectOption('power');
  await expect(page.locator('#rpCalcP')).toHaveAttribute('readonly', '');
  const frequencyUnit = await page.locator('.rp-calc-unit[data-field="rabi"]').inputValue();
  await page.locator('#rpCalcR').fill(String(2 * referenceHz / unitScales.rabi[frequencyUnit]));
  await expectPhysical(page, 'power', 4);
  const powerConfig = await exportConfig(page);
  expect(powerConfig.parameters.power_W).toBeCloseTo(.0016, 7);
  expect(powerConfig.enteredParameters.power_W).toBeCloseTo(.004, 7);

  await page.locator('#calcSolveFor').selectOption('waist');
  await expect(page.locator('#rpCalcW')).toHaveAttribute('readonly', '');
  await page.locator('.rp-calc-unit[data-field="power"]').selectOption('mW');
  await page.locator('#rpCalcP').fill('1');
  await expectPhysical(page, 'waist', 50);
  const waistConfig = await exportConfig(page);
  expect(waistConfig.parameters.waist_m).toBeCloseTo(25e-6, 9);
  expect(waistConfig.enteredParameters.size_m).toBeCloseTo(50e-6, 9);

  await page.locator('#calcSolveFor').selectOption('rabi');
  await expectPhysical(page, 'rabi', 2 * referenceHz);
  await expect(page.getByTestId('input-error')).toBeHidden();
});

test('v2 configuration restores input definitions and recomputes instead of adopting saved results or dipoles', async ({ page }) => {
  await setAdvancedBeam(page);
  const referenceHz = await physicalField(page, 'rabi');
  const config = await exportConfig(page);
  expect(config.schemaVersion).toBe(2);
  expect(config.inputDefinition).toMatchObject({ powerPlane: 'upstream', powerBasis: 'linear-total', transmission: .8, linearOrientation: 'manual', manualFraction: .5, sizeKind: 'diameter' });
  expect(config.parameters.power_W).toBeCloseTo(.0004, 12);
  expect(config.parameters.waist_m).toBeCloseTo(50e-6, 12);
  expect(config.enteredParameters.power_W).toBeCloseTo(.001, 12);
  expect(config.enteredParameters.size_m).toBeCloseTo(100e-6, 12);

  await page.locator('#beamPowerPlane').selectOption('atoms');
  await page.locator('#beamPowerBasis').selectOption('component');
  await page.locator('#beamSizeKind').selectOption('radius');
  await page.locator('#rpCalcP').fill('2');
  await page.locator('#rpCalcW').fill('70');
  config.result.frequency_Hz = 1e30;
  config.matrixElement.reduced_ea0 = 9;
  await importConfig(page, config);
  await openDefinitions(page);
  await expect(page.locator('#beamPowerPlane')).toHaveValue('upstream');
  await expect(page.locator('#beamPowerBasis')).toHaveValue('linear-total');
  await expect(page.locator('#beamTransmission')).toHaveValue('80');
  await expect(page.locator('#beamManualFraction')).toHaveValue('50');
  await expect(page.locator('#beamSizeKind')).toHaveValue('diameter');
  await expectPhysical(page, 'power', 1);
  await expectPhysical(page, 'waist', 100);
  await expectPhysical(page, 'rabi', referenceHz);
  const roundTrip = await exportConfig(page);
  expect(roundTrip.inputDefinition).toEqual(config.inputDefinition);
  expect(roundTrip.enteredParameters.power_W).toBeCloseTo(config.enteredParameters.power_W, 12);
  expect(roundTrip.enteredParameters.size_m).toBeCloseTo(config.enteredParameters.size_m, 12);
  expect(roundTrip.matrixElement.reduced_ea0).not.toBe(9);
  expect(roundTrip.result.frequency_Hz).toBeCloseTo(referenceHz, -2);
});

test('version-1 files without beam metadata migrate to the original atom/component/radius meaning', async ({ page }) => {
  await setAdvancedBeam(page);
  const referenceHz = await physicalField(page, 'rabi');
  const legacy = await exportConfig(page);
  legacy.schemaVersion = 1;
  legacy.softwareVersion = '0.2.0';
  delete legacy.inputDefinition;
  delete legacy.enteredParameters;
  delete legacy.display.solveFor;
  delete legacy.display.units;
  legacy.display.calcMode = 'power';
  legacy.display.powerUnit = 'mW';
  legacy.display.rabiUnit = 'MHz';
  await importConfig(page, legacy, 'legacy-v1-config.json');
  await openDefinitions(page);
  await expect(page.locator('#beamPowerPlane')).toHaveValue('atoms');
  await expect(page.locator('#beamPowerBasis')).toHaveValue('component');
  await expect(page.locator('#beamSizeKind')).toHaveValue('radius');
  await expect(page.locator('#calcSolveFor')).toHaveValue('rabi');
  await expectPhysical(page, 'power', .4);
  await expectPhysical(page, 'waist', 50);
  await expectPhysical(page, 'rabi', referenceHz);
  const migrated = await exportConfig(page);
  expect(migrated.schemaVersion).toBe(2);
  expect(migrated.parameters.power_W).toBeCloseTo(.0004, 12);
  expect(migrated.parameters.waist_m).toBeCloseTo(50e-6, 12);
});

test('a zero selected field component gives zero forward drive and no finite inverse-power solution', async ({ page }) => {
  await openDefinitions(page);
  await page.locator('#beamPowerBasis').selectOption('linear-total');
  await page.locator('#beamLinearOrientation').selectOption('perpendicular');
  // The initial selected polarization is pi, so perpendicular linear light
  // contains no selected q=0 field. This is not a forbidden atomic matrix element.
  await expect(page.getByTestId('input-error')).toBeHidden();
  await expectPhysical(page, 'rabi', 0);
  const zero = await exportConfig(page);
  expect(zero.parameters.power_W).toBe(0);
  expect(zero.result.frequency_Hz).toBe(0);

  await page.locator('#calcSolveFor').selectOption('power');
  await page.locator('#rpCalcR').fill('1');
  await expect(page.getByTestId('input-error')).toBeVisible();
  await expect(page.locator('#rpCalcP')).toHaveValue('');
  await expect(page.locator('#rabiResult')).not.toContainText('Infinity');
});

test('changing the selected q invalidates a manual fraction until its new value is supplied', async ({ page }) => {
  await setAdvancedBeam(page);
  await page.locator('#hfTransPolSeg [data-pol="sigmap"]').click();
  await expect(page.locator('#hfTransPolSeg [data-pol="sigmap"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#beamManualFraction')).toHaveValue('');
  await expect(page.getByTestId('input-error')).toBeVisible();
  await expect(page.locator('#rpCalcR')).toHaveValue('');

  await page.locator('#beamManualFraction').fill('50');
  await expect(page.getByTestId('input-error')).toBeHidden();
  await expectPhysical(page, 'power', 1);
  await expectPhysical(page, 'waist', 100);
  expect(await physicalField(page, 'rabi')).toBeGreaterThan(0);
  const restored = await exportConfig(page);
  expect(restored.selection.pol).toBe('sigmap');
  expect(restored.inputDefinition.manualFraction).toBe(.5);
  expect(restored.enteredParameters.power_W).toBeCloseTo(.001, 12);
  expect(restored.parameters.power_W).toBeCloseTo(.0004, 12);
});

test('manual linear-power input enforces each sigma 50% limit while pi allows 90%, without promoting M2 evidence', async ({ page }) => {
  await selectTransition(page, 'T3');
  await openDefinitions(page);
  await page.locator('#rpCalcP').fill('1');
  await page.locator('#beamPowerBasis').selectOption('linear-total');
  await page.locator('#beamLinearOrientation').selectOption('manual');
  const fraction = page.locator('#beamManualFraction');
  await expect(fraction).toHaveAttribute('max', '100');
  await fraction.fill('90');
  await expect(page.getByTestId('input-error')).toBeHidden();
  await expect(page.locator('#beamNormalizedSummary')).toHaveAttribute('data-power-mw', '0.9');
  const initialPi = await exportConfig(page);
  expect(initialPi.matrixElement.sourceId).toBe('internal-t3-20260908');
  expect(initialPi.parameters.power_W).toBeCloseTo(.0009, 12);

  for (const pol of ['sigmap', 'sigmam']) {
    await page.locator(`#hfTransPolSeg [data-pol="${pol}"]`).click();
    await expect(fraction).toHaveAttribute('max', '50');
    await expect(fraction).toHaveValue('');
    await expect(page.getByTestId('input-error')).toBeVisible();
    await fraction.fill('60');
    await expect(fraction).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByTestId('input-error')).toContainText('50%');
    await expect(page.locator('#beamNormalizedSummary')).toHaveAttribute('data-status', 'invalid');
    await expect(page.getByTestId('evidence-context')).toHaveAttribute('data-calculation-status', 'invalid');
    await expect(page.getByTestId('evidence-row-source')).toHaveAttribute('data-evidence-status', 'checked');
    await expect(page.getByTestId('evidence-row-experiment')).toHaveAttribute('data-evidence-status', 'not-closed');

    await fraction.fill('50');
    await expect(page.getByTestId('input-error')).toBeHidden();
    await expect(page.locator('#beamNormalizedSummary')).toHaveAttribute('data-power-mw', '0.5');
    const sigma = await exportConfig(page);
    expect(sigma.selection.pol).toBe(pol);
    expect(sigma.inputDefinition.manualFraction).toBe(.5);
    expect(sigma.enteredParameters.power_W).toBeCloseTo(.001, 12);
    expect(sigma.parameters.power_W).toBeCloseTo(.0005, 12);
    expect(sigma.matrixElement).toEqual(initialPi.matrixElement);
    await expect(page.getByTestId('evidence-row-formula')).toHaveAttribute('data-evidence-status', 'checked');
    await expect(page.getByTestId('evidence-row-experiment')).toHaveAttribute('data-evidence-status', 'not-closed');
  }
  await page.locator('#hfTransPolSeg [data-pol="pi"]').click();
  await expect(fraction).toHaveAttribute('max', '100');
  await expect(fraction).toHaveValue('');
  await fraction.fill('90');
  await expect(page.getByTestId('input-error')).toBeHidden();
  const restoredPi = await exportConfig(page);
  expect(restoredPi.matrixElement).toEqual(initialPi.matrixElement);
  expect(restoredPi.parameters).toEqual(initialPi.parameters);
  await expect(page.getByTestId('evidence-row-experiment')).toHaveAttribute('data-evidence-status', 'not-closed');
});

test('T3 linear polarization and the sigma-double axis do not repeat the channel or power factor', async ({ page }) => {
  await selectTransition(page, 'T3');
  await page.locator('#rpCalcP').fill('1');
  await page.locator('#rpCalcW').fill('50');
  const piFrequencyHz = await physicalField(page, 'rabi');
  expect(piFrequencyHz).toBeGreaterThan(0);
  await openDefinitions(page);
  await page.locator('#beamPowerBasis').selectOption('linear-total');
  await page.locator('#beamLinearOrientation').selectOption('parallel');
  await expectPhysical(page, 'rabi', piFrequencyHz);

  await page.locator('#hfTransPolSeg [data-pol="sigmap"]').click();
  await expect(page.getByTestId('input-error')).toBeHidden();
  await expectPhysical(page, 'rabi', 0);
  await page.locator('#beamLinearOrientation').selectOption('perpendicular');
  await expectPhysical(page, 'rabi', piFrequencyHz);
  const componentView = await exportConfig(page);
  expect(componentView.selection.pol).toBe('sigmap');
  expect(componentView.enteredParameters.power_W).toBeCloseTo(.001, 12);
  expect(componentView.parameters.power_W).toBeCloseTo(.0005, 12);

  await page.locator('#powerAxisConvention').selectOption('sigma-double');
  await expectPhysical(page, 'rabi', piFrequencyHz);
  await expectPhysical(page, 'power', 1);
  const doubledAxisView = await exportConfig(page);
  expect(doubledAxisView.parameters).toEqual(componentView.parameters);
  expect(doubledAxisView.selection).toEqual(componentView.selection);
  expect(doubledAxisView.inputDefinition).toEqual(componentView.inputDefinition);
  expect(doubledAxisView.result.frequency_Hz).toBe(componentView.result.frequency_Hz);
});
