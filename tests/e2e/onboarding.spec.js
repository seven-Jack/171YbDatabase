import { expect, test } from '@playwright/test';
import { CORE_TRANSITIONS, DATASET_MANIFEST, DATASET_VERSION } from '../../src/data/catalog.js';
import { FORMULA_VERSION } from '../../src/physics/constants.js';
import { createRecordLink } from '../../src/ui/record-links.js';

const transition = (page, id) => page.locator(`#levelDiagram .transition-line[data-id="${id}"]`);
const channel = (page, key) => page.locator(`#hfCGTableBody [data-channel-key="${key}"]`);
const diagramChannel = (page, key) => page.locator(`#hfTransLines [role="button"][data-channel-key="${key}"]`);
const sigmaPlus = '0.5|0.5|1.5|1.5|1';
const otherSigmaPlus = '0.5|-0.5|1.5|0.5|1';

async function ready(page) {
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
}

async function expectStep(page, step) {
  const card = page.locator('#guideCard');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('data-step', String(step));
}

async function expectTargetInView(page, target) {
  const [bounds, nav, card] = await Promise.all([
    target.boundingBox(), page.locator('#selectionContext').boundingBox(), page.locator('#guideCard').boundingBox(),
  ]);
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  expect(x).toBeGreaterThan(0);
  expect(x).toBeLessThan(page.viewportSize().width);
  expect(y).toBeGreaterThan(nav.y + nav.height);
  expect(y).toBeLessThan(page.viewportSize().height);
  expect(x < card.x || x > card.x + card.width || y < card.y || y > card.y + card.height).toBe(true);
}

test('a first visitor can skip, then reopen or close the guide without losing a workpoint', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  const invite = page.locator('#guideInvite');
  const card = page.locator('#guideCard');
  const open = page.locator('#sectionNav #guideOpen');
  await expect(invite).toBeVisible();
  await expect(card).toBeHidden();
  await invite.locator('[data-guide-skip]').click();
  await expect(invite).toBeHidden();
  await page.reload();
  await ready(page);
  await expect(invite).toBeHidden();

  await transition(page, 'T3').press('Enter');
  await channel(page, '0.5|0.5|0.5|0.5|0').click();
  await page.locator('#rpCalcP').fill('4');
  await page.locator('#rpCalcW').fill('75');
  const result = await page.locator('#rabiResult strong').innerText();
  await open.click();
  await expectStep(page, 1);
  await card.locator('[data-guide-close]').click();
  await expect(card).toBeHidden();
  await open.click();
  await expectStep(page, 1);
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition', 'T3');
  await expect(channel(page, '0.5|0.5|0.5|0.5|0')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#rpCalcP')).toHaveValue('4');
  await expect(page.locator('#rpCalcW')).toHaveValue('75');
  await expect(page.locator('#rabiResult strong')).toHaveText(result);
});

test('the 556 nm guide advances through both diagrams to the real Rabi result', async ({ page, hasTouch }) => {
  await page.goto('./');
  await ready(page);
  await page.locator('#guideInvite [data-guide-start]').click();
  await expect(page.locator('#guideInvite')).toBeHidden();
  await expectStep(page, 1);
  await expectTargetInView(page, transition(page, 'T2').locator('text').first());
  await transition(page, 'T3').press('Enter');
  await expectStep(page, 1);

  const line = transition(page, 'T2');
  const label = line.locator('text').first();
  await label.scrollIntoViewIfNeeded();
  const groupBox = await line.boundingBox();
  const labelBox = await label.boundingBox();
  await line.click({ position: {
    x: labelBox.x + labelBox.width / 2 - groupBox.x,
    y: labelBox.y + labelBox.height / 2 - groupBox.y,
  } });
  await expectStep(page, 2);
  const polarization = page.locator('#hfTransPolSeg [data-pol="sigmap"]');
  await expectTargetInView(page, polarization);
  await expect(line).toHaveAttribute('aria-pressed', 'true');
  await polarization.click();
  await expectStep(page, 2);
  await expect(polarization).toHaveAttribute('aria-pressed', 'true');
  const target = diagramChannel(page, sigmaPlus);
  await expectTargetInView(page, target);
  await diagramChannel(page, otherSigmaPlus).press('Enter');
  await expectStep(page, 2);
  await expectTargetInView(page, target);
  await channel(page, sigmaPlus).click();
  await expectStep(page, 2);
  await expect(page).toHaveURL(/#rabiResult$/);
  await expect(page.locator('#rabiResult')).toBeFocused();
  await expectTargetInView(page, page.locator('#rabiResult strong'));
  await page.locator('#guideLocate').click();
  await expectTargetInView(page, target);

  // A vertical SVG line can have a zero-width bounding box despite its wide stroke hit area.
  const bounds = await target.boundingBox();
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  if (hasTouch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
  await expectStep(page, 3);
  await expect(page).toHaveURL(/#rabiResult$/);
  await expect(page.locator('#rabiResult')).toBeFocused();
  await expectTargetInView(page, page.locator('#rabiResult strong'));
  await page.locator('#guideLocate').click();
  await expectTargetInView(page, page.locator('#rpCalcW'));
  await expect(page.locator('[data-guide-reading]')).toBeHidden();
  await expect(channel(page, sigmaPlus)).toHaveAttribute('aria-pressed', 'true');

  const finish = page.locator('#guideCard [data-guide-finish]');
  await page.locator('#rpCalcP').fill('4');
  await page.locator('#rpCalcW').fill('500');
  await expectStep(page, 3);
  await expect(finish).toBeDisabled();
  await page.locator('#rpCalcP').fill('1');
  await expect(page.locator('#rabiResult strong')).toHaveText('5.52367 MHz');
  await expect(finish).toHaveAccessibleName('核对结果');
  await finish.click();
  await expectStep(page, 'complete');
  await expect(page.locator('[data-guide-reading]')).toHaveText(await page.locator('#rabiResult strong').innerText());
  await expect(finish).toHaveAccessibleName('完成向导');
  await finish.click();
  await expect(page.locator('#guideCard')).toBeHidden();
  await page.goto('./');
  await ready(page);
  await expect(page.locator('#guideInvite')).toBeHidden();
  await expect(page.locator('#guideCard')).toBeHidden();
});

test('the highlighted hyperfine line can be chosen with the keyboard', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  await page.locator('#guideOpen').press('Enter');
  await transition(page, 'T2').press('Enter');
  await expectStep(page, 2);
  await page.locator('#hfTransPolSeg [data-pol="sigmap"]').press('Space');
  const target = diagramChannel(page, sigmaPlus);
  await expect(target).toHaveAccessibleName(/σ⁺/);
  await target.press('Enter');
  await expectStep(page, 3);
  await expect(page.locator('#rabiResult')).toBeFocused();
  await expect(channel(page, sigmaPlus)).toHaveAttribute('aria-pressed', 'true');
});

test('a first visit directly to the Rabi section keeps the requested view', async ({ page }) => {
  await page.goto('./#secRabi');
  await ready(page);
  await expect(page.locator('#guideInvite')).toBeHidden();
  await expect(page.locator('#guideCard')).toBeHidden();
  await expect(page).toHaveURL(/#secRabi$/);
});

test('a first visit to a shared workpoint restores its inputs without opening the guide', async ({ page, baseURL }) => {
  const link = createRecordLink(baseURL, {
    transition: CORE_TRANSITIONS.find(item => item.id === 'T3'),
    F_lower: 0.5, F_upper: 0.5, pol: 'pi', P_mW: 4, w_um: 75, solveFor: 'rabi', inputStatus: 'valid',
  }, { datasetVersion: DATASET_VERSION, datasetHash: DATASET_MANIFEST.contentHash, formulaVersion: FORMULA_VERSION }, true);
  await page.goto(link);
  await ready(page);
  await expect(page.locator('#guideInvite')).toBeHidden();
  await expect(page.locator('#guideCard')).toBeHidden();
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition', 'T3');
  await expect(page.locator('#rpCalcP')).toHaveValue('4');
  await expect(page.locator('#rpCalcW')).toHaveValue('75');
});
