import { createHash } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { CORE_TRANSITIONS } from '../../src/data/catalog.js';
import { exportCalculationConfig } from '../../src/state/config.js';

const controls = page => page.locator('#recordLinks');
const status = page => controls(page).locator('[data-record-link-status]');

async function ready(page) {
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
}

async function copy(page, action) {
  const drawer = controls(page);
  if (await drawer.getAttribute('open') === null) await drawer.locator('summary').click();
  await drawer.locator(`[data-copy-record="${action}"]`).click();
  await expect(status(page)).toContainText('已复制');
  return page.evaluate(() => window.copiedRecordText);
}

test.beforeEach(async ({ page, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        async writeText(text) {
          if (window.denyRecordClipboard) throw Error('clipboard unavailable');
          window.copiedRecordText = text;
        },
      },
    });
  });
  await page.goto('./');
  await ready(page);
});

test('clock record and optional workpoint open in a new tab with the intended inputs', async ({ page, context }) => {
  await page.locator('#levelDiagram .transition-line[data-id="T3"]').press('Enter');
  const coreLink = await copy(page, 'selection');
  expect(new URL(coreLink).pathname).toBe('/171YbDatabase/');
  expect(new URLSearchParams(new URL(coreLink).hash.slice(1)).has('workpoint')).toBe(false);
  const opened = await context.newPage();
  await opened.goto(coreLink);
  await ready(opened);
  await expect(opened.locator('#selectionContext')).toHaveAttribute('data-selection-transition', 'T3');
  await expect(status(opened)).toContainText('已定位跃迁');

  await page.locator('#hfCGTableBody button[data-channel-key="0.5|0.5|0.5|0.5|0"]').click();
  await page.locator('#rpCalcP').fill('4');
  await page.locator('#rpCalcW').fill('75');
  const point = await copy(page, 'workpoint');
  await opened.goto(point);
  await expect(status(opened)).toContainText('已恢复工作点');
  await expect(opened.locator('#selectionContext')).toHaveAttribute('data-selection-mode', 'explicit');
  await expect(opened.locator('#rpCalcP')).toHaveValue('4');
  await expect(opened.locator('#rpCalcW')).toHaveValue('75');
  await expect(opened.locator('#rabiResult')).toContainText('T3');
});

test('a Rydberg workpoint preserves a display filter for the other F′ branch', async ({ page, context }) => {
  await page.locator('#rydbergN').fill('66');
  await page.locator('#hfDiagFUpper').selectOption('0.5');
  await expect(page.locator('#rabiResult')).toContainText('NS-66-F32');

  const link = await copy(page, 'workpoint');
  const opened = await context.newPage();
  await opened.goto(link);
  await ready(opened);

  await expect(status(opened)).toContainText('已恢复工作点');
  await expect(opened.locator('#hfDiagFUpper')).toHaveValue('0.5');
  await expect(opened.locator('#rydbergFp')).toHaveValue('1.5');
  await expect(opened.locator('#rabiResult')).toContainText('NS-66-F32');
});

test('restoring the same Rydberg workpoint clears invalid n and ν drafts', async ({ page }) => {
  const n = page.locator('#rydbergN');
  const nu = page.locator('#rydbergNu');
  await n.fill('66');
  await expect(page.locator('#rabiResult')).toContainText('NS-66-F32');
  const savedNu = await nu.inputValue();
  const link = await copy(page, 'workpoint');

  await n.fill('28');
  await n.press('Enter');
  await nu.fill('0');
  await nu.press('Enter');
  await page.locator('#rpCalcP').fill('4');
  await expect(n).toHaveValue('28');
  await expect(nu).toHaveValue('0');
  await expect(n).toHaveAttribute('aria-invalid', 'true');
  await expect(nu).toHaveAttribute('aria-invalid', 'true');

  await page.evaluate(href => { location.hash = new URL(href).hash; }, link);
  await expect(status(page)).toContainText('已恢复工作点');
  await expect(n).toHaveValue('66');
  await expect(nu).toHaveValue(savedNu);
  await expect(n).not.toHaveAttribute('aria-invalid', 'true');
  await expect(nu).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#rydbergInputMessage')).toBeEmpty();
});

test('series and legacy R2 links distinguish both F′ choices and show older dataset versions', async ({ page, context }) => {
  const n = page.locator('#rydbergN');
  await n.fill('29');
  await n.press('Tab');
  await page.locator('#rydbergFp').selectOption('0.5');
  const seriesLink = new URL(await copy(page, 'selection'));
  const opened = await context.newPage();
  await opened.goto(seriesLink.href);
  await ready(opened);
  await expect(opened.locator('#selectionContext')).toHaveAttribute('data-selection-transition', 'NS-29-F12');
  await expect(opened.locator('#rydbergN')).toHaveValue('29');
  await expect(opened.locator('#rydbergFp')).toHaveValue('0.5');
  await expect(opened.locator('#rydbergLegacyContext')).toBeHidden();

  const config = exportCalculationConfig({
    transition: CORE_TRANSITIONS.find(transition => transition.id === 'R2'),
    F_lower: 0.5, F_upper: 1.5, pol: 'sigmap', P_mW: 12, w_um: 40, solveFor: 'rabi',
  });
  await page.locator('#configFile').setInputFiles({
    name: 'r2-config.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  });
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition', 'R2');
  const legacyLink = new URL(await copy(page, 'selection'));
  const fields = new URLSearchParams(legacyLink.hash.slice(1));
  expect(fields.get('record')).toBe('R2');
  expect(fields.get('fp')).toBe('1.5');
  fields.set('data', '2026.11.10.2');
  fields.set('sha256', 'f'.repeat(64));
  legacyLink.hash = fields.toString();
  await opened.goto(legacyLink.href);
  await expect(status(opened)).toContainText(/2026\.11\.10\.2.*与当前.*不同/);
  await expect(opened.locator('#selectionContext')).toHaveAttribute('data-selection-transition', 'R2');
  await expect(opened.locator('#rydbergLegacyContext')).toBeVisible();
  await expect(opened.locator('#rydbergFp')).toHaveValue('1.5');
  await expect(opened.locator('#rabiResult')).toContainText('R2');

  fields.set('record', '../../index.html');
  legacyLink.hash = fields.toString();
  await opened.goto(legacyLink.href);
  await expect(status(opened)).toContainText('记录链接无法恢复');
  await expect(opened.locator('#selectionContext')).toHaveAttribute('data-selection-transition', 'R2');
});

test('manifest and adopted data file are served with the cited hash and manual copy works', async ({ page }) => {
  const citation = await copy(page, 'citation');
  const drawer = controls(page);
  const manifestUrl = await drawer.locator('[data-dataset-manifest]').getAttribute('href');
  const fileUrl = await drawer.locator('[data-dataset-record]').getAttribute('href');
  const [manifestResponse, fileResponse] = await Promise.all([page.request.get(manifestUrl), page.request.get(fileUrl)]);
  expect(manifestResponse.ok()).toBe(true);
  expect(fileResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(citation).toContain(manifest.datasetVersion);
  expect(citation).toContain(manifest.contentHash);
  const match = manifest.files.find(file => file.path === 'data/transitions.json');
  expect(createHash('sha256').update(await fileResponse.body()).digest('hex')).toBe(match.sha256);

  await page.evaluate(() => { window.denyRecordClipboard = true; });
  await drawer.locator('[data-copy-record="selection"]').click();
  await expect(status(page)).toContainText('请手动复制');
  await expect(drawer.locator('textarea')).toHaveValue(/^http:\/\/[^/]+\/171YbDatabase\/#record=T2/);
});
