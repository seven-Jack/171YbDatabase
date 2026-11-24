import { test, expect } from '@playwright/test';

const expectedTransitions = ['NS-65-F32', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const lineFor = (page, id) => page.locator(`#levelDiagram .transition-line[data-id="${id}"]`);
async function selectTransition(page, id) {
  const line = lineFor(page, id), label = line.locator('text').first();
  await label.scrollIntoViewIfNeeded();
  const groupBox = await line.boundingBox(), labelBox = await label.boundingBox();
  if (!groupBox || !labelBox) throw new Error(`Transition ${id} has no visible wavelength label`);
  // The transparent hit region is a sibling of the text, so target the group
  // at the visible label's center rather than a zero-width SVG line.
  await line.click({position:{x:labelBox.x+labelBox.width/2-groupBox.x,y:labelBox.y+labelBox.height/2-groupBox.y}});
  await expect(page).toHaveURL(/#polarizationDiagram$/);
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
  await expect(page.locator('#levelDiagram')).toContainText('6s65s · F′=1/2, 3/2');
  await expect(page.locator('#levelDiagram')).toContainText('6s7s');
  // Whole-page overflow is a layout failure; a locally scrollable scientific figure is permitted.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('mobile atlas zoom and touch selection lead from the 556 nm line to its channel and Rabi reading', async ({ page, hasTouch }) => {
  test.skip(!hasTouch, 'Tests the touch viewport and its native pan gesture.');
  const zoom = page.locator('#atlasZoom');
  const viewport = page.locator('#atlasViewport');
  const atlas = viewport.locator('#levelDiagram');
  const pageOverflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const overviewWidth = (await atlas.boundingBox()).width;
  await expect(zoom).toHaveAttribute('aria-pressed', 'false');
  await zoom.tap();
  await expect(zoom).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await atlas.boundingBox()).width).toBeGreaterThan(1.5 * overviewWidth);
  expect(await pageOverflow()).toBeLessThanOrEqual(1);

  await viewport.evaluate(el => el.scrollIntoView({block: 'center', behavior: 'instant'}));
  const {left, room, y, x} = await viewport.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const left = el.scrollLeft;
    const notePanEnd = () => {
      if (Math.abs(el.scrollLeft - left) <= 20) return;
      el.dataset.testPanFinished = 'true';
      el.removeEventListener('scrollend', notePanEnd);
    };
    el.addEventListener('scrollend', notePanEnd);
    return {left, room: el.scrollWidth - el.clientWidth,
      y: rect.top + rect.height / 2, x: rect.left + rect.width / 2};
  });
  const direction = left < room / 2 ? -1 : 1;
  const touch = await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
  for (const distance of [20, 50, 80, 110]) {
    await touch.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: x + direction * distance, y}]});
  }
  await touch.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  await touch.detach();
  await expect.poll(() => viewport.evaluate((el, before) => Math.abs(el.scrollLeft - before), left)).toBeGreaterThan(20);
  await expect(page).not.toHaveURL(/#polarizationDiagram$/);
  // During native momentum scrolling Chromium can consume a tap to stop the fling.
  await expect(viewport).toHaveAttribute('data-test-pan-finished', 'true');
  await zoom.tap();
  await expect(zoom).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => (await atlas.boundingBox()).width).toBeCloseTo(overviewWidth, 0);
  await expect(atlas.locator('.transition-line')).toHaveCount(8);

  await zoom.tap();
  const segment = lineFor(page, 'T2').locator('.trans-main-line').first();
  await segment.evaluate(el => el.scrollIntoView({block: 'center', inline: 'center', behavior: 'instant'}));
  // Touch just beside the visible stroke in the middle of the actual line segment.
  const point = await segment.evaluate(el => {
    const mid = el.getPointAtLength(el.getTotalLength() / 2).matrixTransform(el.getScreenCTM());
    return {x: mid.x + 3, y: mid.y};
  });
  await page.touchscreen.tap(point.x, point.y);
  await expect(page).toHaveURL(/#polarizationDiagram$/);
  await expect(lineFor(page, 'T2')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#hfTransPolSeg [data-pol="sigmap"]').tap();
  const line = page.locator('#hfTransLines [role="button"][data-channel-key="0.5|0.5|1.5|1.5|1"]');
  await line.scrollIntoViewIfNeeded();
  const bounds = await line.boundingBox();
  // A fingertip can land beside the tight vertical stroke on this 390 px diagram.
  await page.touchscreen.tap(bounds.x + bounds.width / 2 + 9, bounds.y + bounds.height / 2);
  const result = page.locator('#rabiResult');
  const channel = result.locator('.result-channel');
  await expect(page).toHaveURL(/#rabiResult$/);
  await expect(result).toBeFocused();
  await expect(result.locator('strong')).toHaveText('55.2367 MHz');
  await expect(result.locator('.result-unit')).toHaveText('MHz');
  await expect(channel).toContainText('F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2 · σ⁺');
  await expect(channel).toBeInViewport({ratio: 1});
  await expect(result.locator('strong')).toBeInViewport({ratio: 1});
  await expect(result.locator('.result-conditions')).toContainText('原子处 Pq=1 mW');
  await expect(result.locator('.result-conditions')).toContainText('w₀=50 µm');
  expect(await pageOverflow()).toBeLessThanOrEqual(1);
});

for (const [id, expectedTitle, rows] of [['T2', '³P₁', 10], ['T3', '³P₀', 4], ['NS-65-F32', '65S · F′=3/2', 10]]) {
  test(`${id}: the real diagram updates hyperfine channels and Rabi context`, async ({ page }) => {
    await selectTransition(page, id);
    await expect(page.locator('#hfTransPolSeg [data-pol="pi"]')).toBeInViewport({ratio:1});
    await expect(page.locator('#hfTransLines svg')).toBeInViewport();
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
  const colours = { T1:'#34d399', T2:'#facc15', T3:'#f87171', T4:'#f87171', T5:'#34d399', T6:'#34d399', T7:'#34d399', 'NS-65-F32':'#a78bfa' };
  for (const [id, colour] of Object.entries(colours)) {
    await expect(page.locator(`#levelDiagram .transition-line[data-id="${id}"] .trans-main-line`).first()).toHaveAttribute('stroke', colour);
  }
  await expect(page.locator('[data-canvas-tone], [data-diagram-ink]')).toHaveCount(0);
});

test('wavelength labels select all eight transitions and jump to the polarization diagram', async ({ page }) => {
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
  await selectTransition(page, 'NS-65-F32');
  await expect(page.getByTestId('current-context').locator('strong')).toContainText('NS-65-F32 ·');
  await page.locator('#polarizationDiagram').hover();
  await expect.poll(snapshot).toEqual(before);
  await expect(page.locator('.original-diagram-wrap')).toHaveCSS('background-color', 'rgb(15, 21, 36)');
});

test('invalid beam input has an error, and valid input recovers', async ({ page }) => {
  const result = page.locator('#rabiResult');
  await expect(result.locator('.result-channel-mode')).toContainText('自动');
  await expect(page.locator('#calcSolveFor')).toHaveValue('rabi');
  await expect(page.locator('#rpCalcR')).toHaveAttribute('readonly', '');
  await page.locator('#rpCalcW').fill('50');
  await page.locator('#rpCalcP').fill('-1');
  await expect(page.getByTestId('input-error')).toBeVisible();
  await expect(result.locator('strong')).toHaveText('—');
  await expect(result.locator('.result-conditions')).toBeHidden();
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

test('choosing a CG-table row or its keyboard button focuses the selected channel’s Rabi result', async ({ page, hasTouch }) => {
  await selectTransition(page, 'T2');
  const pi = page.locator('#hfCGTableBody tr[data-key="0.5|0.5|1.5|0.5|0"]');
  const sigma = page.locator('#hfCGTableBody tr[data-key="0.5|0.5|1.5|1.5|1"] button');
  const result = page.locator('#rabiResult');
  const reading = result.locator('strong');
  const finalStateCell = pi.getByRole('cell').nth(1);
  if (hasTouch) await finalStateCell.tap();
  else await finalStateCell.click();
  await expect(page).toHaveURL(/#rabiResult$/);
  await expect(result).toBeFocused();
  await expect(reading).toBeInViewport({ ratio: 1 });
  const [readout, sticky] = await Promise.all([reading.boundingBox(), page.locator('#selectionContext').boundingBox()]);
  expect(readout.y).toBeGreaterThanOrEqual(sticky.y + sticky.height);
  await expect(pi.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition', 'T2');
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-mode', 'explicit');
  await expect(result.locator('small').first()).toContainText('F=1/2, mF=+1/2 → F′=3/2, mF′=+1/2 · π');
  await expect(reading).toHaveText(/\d.*Hz$/);
  const piReading = await reading.innerText();

  await page.goBack();
  await expect(page).toHaveURL(/#polarizationDiagram$/);
  await sigma.press('Space');
  await expect(page).toHaveURL(/#rabiResult$/);
  await expect(result).toBeFocused();
  await expect(reading).toBeInViewport({ ratio: 1 });
  await expect(sigma).toHaveAttribute('aria-pressed', 'true');
  await expect(result.locator('small').first()).toContainText('F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2 · σ⁺');
  await expect(reading).toHaveText(/\d.*Hz$/);
  await expect(reading).not.toHaveText(piReading);
});

test('dragging to copy a CG-table matrix element keeps the current channel and view', async ({ page, context, hasTouch }) => {
  test.skip(hasTouch, 'This regression exercises desktop mouse text selection.');
  await selectTransition(page, 'T2');
  const row = page.locator('#hfCGTableBody tr[data-key="0.5|0.5|1.5|0.5|0"]');
  const matrix = row.getByRole('cell').last().locator('span').first();
  const value = await matrix.innerText();
  await expect(row.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  await matrix.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'center' }));
  const box = await matrix.boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 0.5, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 0.5, y, { steps: 10 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.getSelection().toString())).toBe(value);
  await expect(page).toHaveURL(/#polarizationDiagram$/);
  await expect(row.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  await expect(matrix).toBeInViewport({ ratio: 1 });
  await context.grantPermissions(['clipboard-read'], { origin: new URL(page.url()).origin });
  await page.keyboard.press('ControlOrMeta+c');
  await expect.poll(() => page.evaluate(async expected => (await navigator.clipboard.readText()) === expected, value)).toBe(true);
});

test('choosing a clock-line mF component focuses its Rabi result and updates the reading on reselection', async ({ page, hasTouch }) => {
  await selectTransition(page, 'T3');
  const result = page.locator('#rabiResult');
  const reading = result.locator('strong');
  const piKey = '0.5|0.5|0.5|0.5|0';
  const sigmaKey = '0.5|-0.5|0.5|0.5|1';
  const diagramLine = key => page.locator(`#hfTransLines [role="button"][data-channel-key="${key}"]`);
  const selectedKey = key => page.locator(`#hfCGTableBody [data-channel-key="${key}"]`);
  const hit = diagramLine(piKey);
  await hit.scrollIntoViewIfNeeded();
  const box = await hit.boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  if (hasTouch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
  await expect(page).toHaveURL(/#rabiResult$/);
  await expect(result).toBeFocused();
  await expect(reading).toBeInViewport({ratio:1});
  const [readout, sticky] = await Promise.all([reading.boundingBox(), page.locator('#selectionContext').boundingBox()]);
  expect(readout.y).toBeGreaterThanOrEqual(sticky.y + sticky.height);
  await expect(selectedKey(piKey)).toHaveAttribute('aria-pressed', 'true');
  await expect(result.locator('small').first()).toContainText('F=1/2, mF=+1/2 → F′=1/2, mF′=+1/2 · π');
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition','T3');
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-mode','explicit');
  await expect(reading).toHaveText(/\d.*Hz$/);
  const piReading = await reading.innerText();

  await page.goBack();
  await expect(page).toHaveURL(/#polarizationDiagram$/);
  await page.locator('#hfTransPolSeg [data-pol="sigmap"]').click();
  await diagramLine(sigmaKey).press('Enter');
  await expect(page).toHaveURL(/#rabiResult$/);
  await expect(result).toBeFocused();
  await expect(reading).toBeInViewport({ratio:1});
  await expect(selectedKey(sigmaKey)).toHaveAttribute('aria-pressed', 'true');
  await expect(result.locator('small').first()).toContainText('F=1/2, mF=−1/2 → F′=1/2, mF′=+1/2 · σ⁺');
  await expect(page.locator('[data-selection-channel]')).toContainText('σ⁺');
  await expect(reading).toHaveText(/\d.*Hz$/);
  await expect(reading).not.toHaveText(piReading);
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

test('activating the plotted stroke opens its polarization channels', async ({page, hasTouch}) => {
  const stroke = lineFor(page, 'T3').locator('.hit-zone');
  await stroke.scrollIntoViewIfNeeded();
  const point = await stroke.evaluate(line => {
    const onLine = line.getPointAtLength(line.getTotalLength() * 0.35);
    const {x, y} = onLine.matrixTransform(line.getScreenCTM());
    return {x, y};
  });
  if (hasTouch) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
  await expect(page).toHaveURL(/#polarizationDiagram$/);
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition', 'T3');
  await expect(page.locator('#hfTransLines svg')).toBeInViewport();
});
