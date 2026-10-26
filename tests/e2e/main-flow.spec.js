import { test, expect } from '@playwright/test';

const expectedTransitions = ['R2', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const browserProblems = new WeakMap();
test.beforeEach(async ({ page }) => {
  const problems = [];
  browserProblems.set(page, problems);
  page.on('pageerror', error => problems.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && /\.(?:js|json|css|csv)(?:\?|$)/.test(response.url())) problems.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('./');
  await expect(page.locator('#levelDiagram .transition-line')).toHaveCount(8);
});
test.afterEach(async ({ page }) => {
  expect(browserProblems.get(page), 'No production script exceptions or missing JS/JSON/CSS/CSV resources').toEqual([]);
});

test('homepage keeps the complete level diagram and all eight transitions', async ({ page }) => {
  await expect(page.locator('#levelDiagram')).toBeVisible();
  const ids = await page.locator('#levelDiagram .transition-line').evaluateAll(elements => elements.map(element => element.dataset.id).sort());
  expect(ids).toEqual(expectedTransitions);
  await expect(page.locator('#levelDiagram')).toContainText('6s65s');
  await expect(page.locator('#levelDiagram')).toContainText('6s7s');
  // Whole-page overflow is a layout failure; a locally scrollable scientific figure is permitted.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

for (const [id, expectedTitle, rows] of [['T2', '³P₁', 10], ['T3', '³P₀', 4], ['R2', '65³S₁', 10]]) {
  test(`${id}: the real diagram updates hyperfine channels and Rabi context`, async ({ page }) => {
    await page.locator(`#levelDiagram .transition-line[data-id="${id}"]`).click();
    await expect(page.locator('#hfTransTitle')).toContainText(expectedTitle);
    await expect(page.locator('#hfCGTableBody tr')).toHaveCount(rows);
    await expect(page.getByTestId('current-context')).toContainText(id);
    await expect(page.locator('#rpCurveLegendTop')).toContainText(expectedTitle);
    await expect(page.locator('#rpHeatLegendTop')).toContainText(expectedTitle);
  });
}

test('wavelength colours carry a visible/UV/IR category and an explicit non-visible label', async ({ page }) => {
  for (const id of expectedTransitions) {
    const arrow = page.locator(`#levelDiagram .transition-line[data-id="${id}"]`);
    const wavelength = Number(await arrow.getAttribute('data-wavelength'));
    const spectrum = await arrow.getAttribute('data-spectrum');
    expect(Number.isFinite(wavelength)).toBe(true);
    expect(await arrow.getAttribute('data-color')).toMatch(/^(?:#|rgb|hsl)/);
    const expected = wavelength < 380 ? 'uv' : wavelength > 780 ? 'ir' : 'visible';
    expect(spectrum.toLowerCase()).toBe(expected);
    if (expected !== 'visible') await expect(arrow).toContainText(expected.toUpperCase());
  }
});

test('invalid beam input has an error, and valid input recovers', async ({ page }) => {
  await expect(page.locator('#calcSolveFor')).toHaveValue('rabi');
  await expect(page.locator('#rpCalcR')).toHaveAttribute('readonly', '');
  await page.locator('#rpCalcW').fill('50');
  await page.locator('#rpCalcP').fill('-1');
  await expect(page.getByTestId('input-error')).toBeVisible();
  await page.locator('#rpCalcP').fill('1');
  await expect(page.getByTestId('input-error')).toBeHidden();
  await expect.poll(async () => Number(await page.locator('#rpCalcR').inputValue())).toBeGreaterThan(0);
  await expect(page.locator('#rabiResult')).not.toBeEmpty();
  await page.locator('#rpCalcW').fill('0');
  await expect(page.getByTestId('input-error')).toBeVisible();
});

test('explicit solve direction supports power and waist inversion', async ({ page }) => {
  await page.locator('#rpCalcW').fill('50');
  await page.locator('#rpCalcP').fill('1');
  await expect(page.getByTestId('input-error')).toBeHidden();
  const frequency = Number(await page.locator('#rpCalcR').inputValue());
  expect(frequency).toBeGreaterThan(0);
  await page.locator('#calcSolveFor').selectOption('power');
  await expect(page.locator('#rpCalcP')).toHaveAttribute('readonly', '');
  await expect(page.locator('#rpCalcR')).not.toHaveAttribute('readonly', '');
  await page.locator('#rpCalcR').fill(String(frequency * 2));
  await expect.poll(async () => Number(await page.locator('#rpCalcP').inputValue())).toBeCloseTo(4, 3);
  await page.locator('#calcSolveFor').selectOption('waist');
  await expect(page.locator('#rpCalcW')).toHaveAttribute('readonly', '');
  await page.locator('#rpCalcP').fill('1');
  await expect.poll(async () => Number(await page.locator('#rpCalcW').inputValue())).toBeCloseTo(25, 2);
});

test('65S CSV is the published canonical download', async ({ page, request }) => {
  const href = await page.locator('a[download][href$="05.21_yb171_65s_hyperfine.csv"]').getAttribute('href');
  const response = await request.get(href);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('60.176');
});

test('versioned configuration can restore a prior transition and inputs', async ({ page }) => {
  await page.locator('#levelDiagram .transition-line[data-id="T3"]').click();
  await page.locator('#rpCalcW').fill('50');
  await page.locator('#rpCalcP').fill('1');
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#configExport').click();
  const download = await downloadEvent;
  const configPath = await download.path();
  await page.locator('#levelDiagram .transition-line[data-id="T2"]').click();
  await page.locator('#configFile').setInputFiles(configPath);
  await expect(page.getByTestId('current-context')).toContainText('T3');
  await expect(page.getByTestId('config-status')).toContainText(/恢复|载入|导入/);
  await expect(page.locator('#rpCalcW')).toHaveValue('50');
  await expect(page.locator('#rpCalcP')).toHaveValue('1');
});
