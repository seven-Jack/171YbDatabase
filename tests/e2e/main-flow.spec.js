import { test, expect } from '@playwright/test';

const expectedTransitions = ['R2', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const lineFor = (page, id) => page.locator(`#levelDiagram .transition-line[data-id="${id}"]`);
async function selectTransition(page, id) {
  const line = lineFor(page, id), label = line.locator('text').first();
  await label.scrollIntoViewIfNeeded();
  const groupBox = await line.boundingBox(), labelBox = await label.boundingBox();
  if (!groupBox || !labelBox) throw new Error(`Transition ${id} has no visible wavelength label`);
  // The transparent hit region is a sibling of the text, so target the group
  // at the visible label's center rather than a zero-width SVG line.
  await line.click({position:{x:labelBox.x+labelBox.width/2-groupBox.x,y:labelBox.y+labelBox.height/2-groupBox.y}});
  await expect(page).toHaveURL(/#secCalc$/);
  await expect(line).toHaveAttribute('aria-pressed','true');
}
const browserProblems = new WeakMap();
test.beforeEach(async ({ page }) => {
  const problems = [];
  browserProblems.set(page, problems);
  page.on('pageerror', error => problems.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && /\.(?:js|json|css|csv)(?:\?|$)/.test(response.url())) problems.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
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
    await selectTransition(page, id);
    await expect(page.locator('#hfTransTitle')).toContainText(expectedTitle);
    await expect(page.locator('#hfCGTableBody tr')).toHaveCount(rows);
    await expect(page.getByTestId('current-context')).toContainText(id);
    // The aside stores the selected ID; its child span displays the transition.
    // Select each role explicitly rather than matching both attribute owners.
    await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition',id);
    await expect(page.locator('#selectionContext .selection-context-transition')).toContainText(expectedTitle);
    await expect(page.locator('[data-workflow-object="result"]')).toContainText(id);
  });
}

test('published original retains its three-column layout and categorical line colours', async ({ page }) => {
  await expect(page.locator('#levelDiagram')).toHaveAttribute('viewBox', '0 0 1000 760');
  await expect(page.locator('#levelDiagram')).toContainText('¹P 系列');
  await expect(page.locator('#levelDiagram')).toContainText('³P 系列');
  const colours = { T1:'#34d399', T2:'#facc15', T3:'#f87171', T4:'#f87171', T5:'#34d399', T6:'#34d399', T7:'#34d399', R2:'#a78bfa' };
  for (const [id, colour] of Object.entries(colours)) {
    await expect(page.locator(`#levelDiagram .transition-line[data-id="${id}"] .trans-main-line`).first()).toHaveAttribute('stroke', colour);
  }
  await expect(page.locator('[data-canvas-tone], [data-diagram-ink]')).toHaveCount(0);
});

test('wavelength labels select all eight transitions and jump to the channel workspace', async ({ page }) => {
  for (const id of expectedTransitions) {
    await selectTransition(page, id);
    await expect(page.getByTestId('current-context').locator('strong')).toContainText(`${id} ·`);
  }
});

test('direct diagram navigation updates the workbench without restyling the original diagram', async ({ page }) => {
  const snapshot = () => page.locator('#levelDiagram .transition-line').evaluateAll(elements => elements.map(element => ({
    id: element.dataset.id,
    lines: [...element.querySelectorAll('.trans-main-line, .hit-zone')].map(line => ({
      endpoints: ['x1','y1','x2','y2'].map(name => line.getAttribute(name)),
      colour: getComputedStyle(line).stroke,
      width: getComputedStyle(line).strokeWidth,
      opacity: getComputedStyle(line).opacity,
    })),
  })));
  const before = await snapshot();
  await selectTransition(page, 'R2');
  await expect(page.getByTestId('current-context').locator('strong')).toContainText('R2 ·');
  await page.locator('#secCalc h2').hover();
  await expect.poll(snapshot).toEqual(before);
  await expect(page.locator('.original-diagram-wrap')).toHaveCSS('background-color', 'rgb(15, 21, 36)');
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
  const href = await page.locator('a[download][href$="05.21_yb171_65s_hyperfine.csv"]').first().getAttribute('href');
  const response = await request.get(href);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('60.176');
});

test('versioned configuration can restore a prior transition and inputs', async ({ page }) => {
  await selectTransition(page, 'T3');
  await page.locator('#rpCalcW').fill('50');
  await page.locator('#rpCalcP').fill('1');
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#configExport').click();
  const download = await downloadEvent;
  const configPath = await download.path();
  await selectTransition(page, 'T2');
  await page.locator('#configFile').setInputFiles(configPath);
  await expect(page.getByTestId('current-context')).toContainText('T3');
  await expect(page.getByTestId('config-status')).toContainText(/恢复|载入|导入/);
  await expect(page.locator('#rpCalcW')).toHaveValue('50');
  await expect(page.locator('#rpCalcP')).toHaveValue('1');
});

test('choosing a CG-table mF channel opens Rabi with the same persistent state marker', async ({ page }) => {
  await selectTransition(page, 'T2');
  const channel=page.locator('#hfCGTableBody .channel-select').first();
  const key=await channel.getAttribute('data-channel-key');
  await channel.click();
  await expect(page).toHaveURL(/#secRabi$/);
  await expect(page.locator('#secRabi h2')).toBeFocused();
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition','T2');
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-mode','explicit');
  await expect(page.locator(`#hfCGTableBody .channel-select[data-channel-key="${key}"]`)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-selection-channel]')).toContainText('mF=');
  await expect(page.locator('[data-selection-channel]')).toContainText('mF′=');
  await expect(page.locator('[data-workflow-object="result"]')).toContainText('T2');
  await page.goBack();
  await expect(page).toHaveURL(/#secCalc$/);
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-mode','explicit');
});

test('choosing a clock-line mF component in the hyperfine diagram opens Rabi and retains its identity', async ({ page }) => {
  await selectTransition(page, 'T3');
  const hit=page.locator('#hfTransLines line[stroke="transparent"]').first();
  await hit.scrollIntoViewIfNeeded();
  const box=await hit.boundingBox();
  if(!box)throw new Error('Clock hyperfine channel has no visible hit region');
  await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
  await expect(page).toHaveURL(/#secRabi$/);
  await expect(page.locator('#secRabi h2')).toBeFocused();
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition','T3');
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-mode','explicit');
  await expect(page.locator('[data-selection-channel]')).toContainText('mF=');
  await expect(page.locator('[data-workflow-object="result"]')).toContainText('T3');
  await expect(page.locator('#hfCGTableBody .channel-select[aria-pressed="true"]')).toHaveCount(1);
});

test('chart controls live on the axes without duplicate transition strips or separate axis modules',async ({page})=>{
  await page.locator('#sectionNav a[href="#secRabi"]').click();
  await expect(page.locator('#rpCurveLegendTop,#rpHeatLegendTop,.rabi-viz-grid .axis-ctl,.rabi-viz-grid .rp-top-row')).toHaveCount(0);
  for(const [wrap,maximum,unit,axis] of [
    ['rpCurveWrap','rpCurveXMax','rpCurveXUnit','x'],
    ['rpCurveWrap','rpCurveYMax','rpCurveYUnit','y'],
    ['rpHeatWrap','rpHeatXMax','rpHeatXUnit','x'],
    ['rpHeatWrap','rpHeatYMax','rpHeatYUnit','y']
  ]){
    const input=page.locator(`#${wrap} #${maximum}`);
    await expect(input).toHaveCount(1);
    await expect(input).toHaveAttribute('data-axis-mode','auto');
    await expect.poll(async()=>Number(await input.inputValue())).toBeGreaterThan(0);
    const unitSelect=page.locator(`#${wrap} #${unit}`);
    await expect(unitSelect).toHaveCount(1);
    const title=await unitSelect.evaluate(el=>{
      const title=el.closest('[data-axis-title]');
      return {axis:title?.dataset.axisTitle,text:title?.textContent};
    });
    expect(title.axis).toBe(axis);
    expect(title.text).toMatch(/\([^]*\)/);
  }
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition','T2');
});
