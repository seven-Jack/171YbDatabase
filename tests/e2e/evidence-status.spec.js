import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const browserErrors = new WeakMap();
const rowKeys = ['source', 'formula', 'comparison', 'experiment'];

async function selectTransition(page, id) {
  await page.locator(`#levelDiagram .transition-line[data-id="${id}"]`).press('Enter');
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition', id);
}

async function selectClockPiChannel(page) {
  await selectTransition(page, 'T3');
  await page.locator('#hfCGTableBody [data-channel-key="0.5|0.5|0.5|0.5|0"]').click();
  await expect(page).toHaveURL(/#secRabi$/);
}

async function openEvidence(page) {
  const source = page.locator('#selectedSource');
  if (await source.getAttribute('open') === null) await source.locator(':scope > summary').click();
  await page.getByTestId('evidence-review').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('evidence-review')).toBeVisible();
}

async function openDefinitions(page) {
  const definitions = page.locator('#beamDefinitionSettings');
  if (await definitions.getAttribute('open') === null) await definitions.locator(':scope > summary').click();
}

async function exportCalculation(page) {
  const pending = page.waitForEvent('download');
  await page.locator('#configExport').click();
  const download = await pending;
  const config = JSON.parse(await readFile(await download.path(), 'utf8'));
  // Navigation into evidence may change focus and scroll, never calculation state.
  return Object.fromEntries([
    'transitionId', 'matrixElement', 'selection', 'parameters',
    'inputDefinition', 'enteredParameters', 'result',
  ].map(key => [key, config[key]]));
}

async function expectStatuses(page, statuses) {
  for (const key of rowKeys) {
    await expect(page.getByTestId(`evidence-row-${key}`)).toHaveCount(1);
    await expect(page.getByTestId(`evidence-row-${key}`)).toHaveAttribute('data-evidence-status', statuses[key]);
  }
}

async function currentRabiHz(page) {
  const value = Number(await page.locator('#rpCalcR').inputValue());
  const unit = await page.locator('.rp-calc-unit[data-field="rabi"]').inputValue();
  return value * { Hz: 1, kHz: 1000, MHz: 1e6, GHz: 1e9 }[unit];
}

test.beforeEach(async ({ page }) => {
  const errors = [];
  browserErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('index.html');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page), 'Evidence navigation must not introduce production script exceptions').toEqual([]);
});

test('clock evidence has four separate statuses and a keyboard entry that preserves calculation state', async ({ page }) => {
  await selectClockPiChannel(page);
  const before = await exportCalculation(page);
  expect(before.matrixElement.sourceId).toBe('internal-t3-20260908');

  const source = page.locator('#selectedSource');
  if (await source.getAttribute('open') !== null) await source.locator(':scope > summary').click();
  const entry = page.locator('#rabiResult [data-evidence-open]');
  await expect(entry).toHaveAttribute('href', '#evidenceReview');
  await entry.scrollIntoViewIfNeeded();
  await entry.focus();
  await page.keyboard.press('Enter');

  await expect(source).toHaveAttribute('open', '');
  await expect(page.getByTestId('evidence-review')).toBeFocused();
  await expectStatuses(page, {
    source: 'checked', formula: 'checked', comparison: 'conditional', experiment: 'not-closed',
  });
  await expect(page.getByTestId('evidence-row-source')).toContainText(/历史.*待补/);
  await expect(page.locator('#rabiResult .result-validation')).toContainText('未独立验证');
  await expect(page.getByTestId('evidence-xu')).not.toHaveAttribute('open', '');
  await expect(page.getByTestId('evidence-offer')).not.toHaveAttribute('open', '');
  expect(await exportCalculation(page)).toEqual(before);
});

test('Xu atomic-rate support and Offer conditional inputs remain distinct from independent experimental validation', async ({ page }) => {
  await selectClockPiChannel(page);
  await openEvidence(page);
  const xu = page.getByTestId('evidence-xu');
  const offer = page.getByTestId('evidence-offer');
  await xu.locator(':scope > summary').click();
  await expect(xu).toHaveAttribute('data-evidence-section', 'xu');
  await expect(xu).toContainText('0.0442');
  await expect(xu).toContainText('0.0035');
  await expect(xu).toContainText(/Ne|氖/);
  await expect(xu).toContainText(/自由原子/);
  await expect(xu).toContainText(/修正/);
  await expect(xu).toContainText('独立原子率支持');

  await offer.locator(':scope > summary').click();
  await expect(offer).toHaveAttribute('data-evidence-section', 'offer');
  await expect(offer).toContainText('固定文献对照，非当前输入');
  for (const text of [
    '1070 mW', '阶段可用功率', '338 mW', '拟合有效功率',
    '22 kHz', '模型拟合耦合', '1/e²', '纯 π',
    '21.751', '12.225',
  ]) await expect(offer).toContainText(text);
  await expect(offer).toContainText(/500\s*[µμ]m/);
  await expect(page.getByTestId('evidence-row-comparison')).toHaveAttribute('data-evidence-status', 'conditional');
  await expect(page.getByTestId('evidence-row-experiment')).toHaveAttribute('data-evidence-status', 'not-closed');
  await expect(page.locator('#rabiResult .result-validation')).toContainText('未独立验证');

  const sourceLinks = page.getByTestId('evidence-review').locator('.evidence-source-links a');
  const hrefs = await sourceLinks.evaluateAll(links => links.map(link => link.getAttribute('href')));
  expect([...new Set(hrefs)].sort()).toEqual([
    'https://doi.org/10.1103/PhysRevLett.113.033003',
    'https://doi.org/10.1364/OPTICA.584095',
    'https://doi.org/10.6084/m9.figshare.31537450.v2',
    'https://doi.org/10.1103/PhysRevA.108.013105',
  ].sort());
  for (const href of hrefs) {
    const url = new URL(href);
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('doi.org');
    expect(decodeURIComponent(href)).not.toMatch(/file:|localhost|127\.0\.0\.1|\/Users\/|references\/papers|data\/literature/i);
  }

  // Looking up Xu must not relabel the adopted matrix element's historic source.
  expect((await exportCalculation(page)).matrixElement.sourceId).toBe('internal-t3-20260908');
});

test('open literature details survive channel changes and fixed comparisons stay fixed while M1 inputs change the live result', async ({ page }) => {
  await selectClockPiChannel(page);
  await openEvidence(page);
  const xu = page.getByTestId('evidence-xu');
  const offer = page.getByTestId('evidence-offer');
  await xu.locator(':scope > summary').click();
  await offer.locator(':scope > summary').click();
  const fixedComparison = await offer.locator('tbody').textContent();
  const initialContextKey = await page.getByTestId('evidence-context').getAttribute('data-context-key');

  await page.locator('#hfCGTableBody [data-channel-key="0.5|-0.5|0.5|-0.5|0"]').click();
  await expect(page.getByTestId('evidence-context')).not.toHaveAttribute('data-context-key', initialContextKey);
  await expect(xu).toHaveAttribute('open', '');
  await expect(offer).toHaveAttribute('open', '');
  await expect(offer.locator('tbody')).toHaveText(fixedComparison);

  const baselineHz = await currentRabiHz(page);
  expect(baselineHz).toBeGreaterThan(0);
  const initialPower = Number(await page.locator('#rpCalcP').inputValue());
  const initialWaist = Number(await page.locator('#rpCalcW').inputValue());
  await page.locator('#rpCalcP').fill(String(initialPower * 4));
  await expect.poll(async () => Math.abs((await currentRabiHz(page)) / baselineHz - 2)).toBeLessThan(3e-5);
  await expect(offer.locator('tbody')).toHaveText(fixedComparison);

  await page.locator('#rpCalcW').fill(String(initialWaist * 2));
  await expect.poll(async () => Math.abs((await currentRabiHz(page)) / baselineHz - 1)).toBeLessThan(3e-5);
  await expect(page.locator('#beamNormalizedSummary')).toHaveAttribute('data-status', 'valid');
  await expect(offer.locator('tbody')).toHaveText(fixedComparison);
  await expect(offer).toContainText('固定文献对照，非当前输入');
  await expect(xu).toHaveAttribute('open', '');
  await expect(offer).toHaveAttribute('open', '');
});

test('evidence context follows explicit mF channels and polarization without turning fixed Offer assumptions into current input', async ({ page }) => {
  await selectClockPiChannel(page);
  await openEvidence(page);
  const context = page.getByTestId('evidence-context');
  const positivePiKey = await context.getAttribute('data-context-key');
  const positivePiText = await context.textContent();

  await page.locator('#hfCGTableBody [data-channel-key="0.5|-0.5|0.5|-0.5|0"]').click();
  await expect(context).not.toHaveAttribute('data-context-key', positivePiKey);
  await expect(context).not.toHaveText(positivePiText);
  await expect(page.getByTestId('evidence-row-formula')).toHaveAttribute('data-evidence-status', 'checked');
  const negativePiKey = await context.getAttribute('data-context-key');

  await page.locator('#hfTransPolSeg [data-pol="sigmap"]').click();
  await page.locator('#hfCGTableBody [data-channel-key="0.5|-0.5|0.5|0.5|1"]').click();
  await expect(context).not.toHaveAttribute('data-context-key', negativePiKey);
  await expect(context).toContainText(/σ|sigma/);
  await expect(context).toHaveAttribute('data-calculation-status', 'valid');
  await expect(page.getByTestId('evidence-row-formula')).toHaveAttribute('data-evidence-status', 'checked');

  await openEvidence(page);
  const offer = page.getByTestId('evidence-offer');
  if (await offer.getAttribute('open') === null) await offer.locator(':scope > summary').click();
  await expect(offer).toContainText('固定文献对照，非当前输入');
  await expect(offer).toContainText('纯 π');
  await expect(page.getByTestId('evidence-row-experiment')).toHaveAttribute('data-evidence-status', 'not-closed');
});

test('incomplete M1 transmission blocks the current calculation while retaining source evidence, then recovers', async ({ page }) => {
  await selectClockPiChannel(page);
  await openEvidence(page);
  const context = page.getByTestId('evidence-context');
  await expect(context).toHaveAttribute('data-calculation-status', 'valid');
  await openDefinitions(page);
  await page.locator('#beamPowerPlane').selectOption('upstream');
  await page.locator('#beamTransmission').fill('');
  await expect(page.locator('#beamNormalizedSummary')).toHaveAttribute('data-status', 'invalid');
  await expect(context).toHaveAttribute('data-calculation-status', 'invalid');
  await expect(context).toContainText('当前计算输入待补正');
  const incompleteKey = await context.getAttribute('data-context-key');
  await expect(page.getByTestId('evidence-row-source')).toHaveAttribute('data-evidence-status', 'checked');
  await expect(page.getByTestId('evidence-row-experiment')).toHaveAttribute('data-evidence-status', 'not-closed');
  await expect(page.getByTestId('evidence-xu')).toContainText('0.0442');
  await expect(page.getByTestId('evidence-offer')).toContainText('338 mW');

  await page.locator('#beamTransmission').fill('80');
  await expect(page.locator('#beamNormalizedSummary')).toHaveAttribute('data-status', 'valid');
  await expect(context).toHaveAttribute('data-calculation-status', 'valid');
  await expect(context).not.toHaveAttribute('data-context-key', incompleteKey);
  await expect(context).not.toContainText('当前计算输入待补正');
  await expect(page.locator('#inputError')).toBeHidden();
  await expect(page.locator('#rabiResult .result-validation')).toContainText('未独立验证');
});

test('changing transition clears clock-only evidence and marks unsupported multipole calculations explicitly', async ({ page }) => {
  await selectClockPiChannel(page);
  await openEvidence(page);
  await expect(page.getByTestId('evidence-xu')).toHaveCount(1);
  await selectTransition(page, 'T2');
  await openEvidence(page);
  await expectStatuses(page, {
    source: 'not-reviewed', formula: 'not-reviewed', comparison: 'not-reviewed', experiment: 'not-reviewed',
  });
  await expect(page.getByTestId('evidence-xu')).toHaveCount(0);
  await expect(page.getByTestId('evidence-offer')).toHaveCount(0);
  await expect(page.getByTestId('evidence-review')).not.toContainText('Xu');
  await expect(page.getByTestId('evidence-review')).not.toContainText('Offer');

  await selectTransition(page, 'T4');
  await openEvidence(page);
  await expect(page.getByTestId('evidence-row-formula')).toHaveAttribute('data-evidence-status', 'not-applicable');
  await expect(page.getByTestId('evidence-context')).toHaveAttribute('data-calculation-status', 'unsupported');
  await expect(page.getByTestId('evidence-xu')).toHaveCount(0);
  await expect(page.getByTestId('evidence-offer')).toHaveCount(0);
});
