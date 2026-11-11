import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { CORE_TRANSITIONS } from '../../src/data/catalog.js';
import { exportCalculationConfig } from '../../src/state/config.js';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
});

test('switches both endpoints, preserves the low-state geometry, and uses the selected R017 branch', async ({ page }) => {
  const n = page.getByLabel('主量子数 n');
  const f = page.getByLabel('末态 F′');
  const line = page.locator('#rydbergDiagramSelection .transition-line');
  const lowGeometry = () => page.locator('#levelDiagram > .transition-line .trans-main-line').evaluateAll(lines =>
    lines.map(line => ['x1', 'y1', 'x2', 'y2', 'stroke'].map(attribute => line.getAttribute(attribute))));
  const before = await lowGeometry();
  await expect(n).toHaveValue('65');
  await expect(line).toHaveAttribute('data-id', 'NS-65-F32');
  await expect(page.locator('#rydbergPairRows tr')).toHaveCount(2);

  await n.fill('29');
  await n.press('Tab');
  await expect(line).toHaveAttribute('data-id', 'NS-29-F32');
  await expect(page.locator('#hfCGTableBody tr')).toHaveCount(6);
  const frequency = Number(await page.locator('#rpCalcR').inputValue());
  await f.selectOption('0.5');
  await expect(line).toHaveAttribute('data-id', 'NS-29-F12');
  await expect(page.locator('#hfCGTableBody tr')).toHaveCount(4);
  await expect(page.locator('#rabiResult')).toContainText('NS-29-F12');
  expect(Number(await page.locator('#rpCalcR').inputValue())).not.toBeCloseTo(frequency, 6);

  await page.locator('#rydbergSeriesTable summary').click();
  await expect(page.locator('#rydbergAllRows tr')).toHaveCount(144);
  await page.getByLabel('搜索光谱').fill('100');
  await expect(page.locator('#rydbergAllRows tr')).toHaveCount(2);
  await page.locator('#rydbergAllRows button[data-rydberg-id="NS-100-F32"]').click();
  await expect(n).toHaveValue('100');
  await expect(f).toHaveValue('1.5');
  await expect(line).toHaveAttribute('data-id', 'NS-100-F32');
  await expect(line).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#sourcePanel')).toContainText('R017');
  await expect(page.locator('#levelDiagram .transition-line')).toHaveCount(8);
  expect(await lowGeometry()).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width + 1);
});

test('restores legacy R2 and round-trips the new selected branch', async ({ page }) => {
  const upload = config => page.locator('#configFile').setInputFiles({
    name: 'yb171-config.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config))
  });
  const legacy = exportCalculationConfig({
    transition: CORE_TRANSITIONS.find(transition => transition.id === 'R2'),
    F_lower: 0.5, F_upper: 0.5, pol: 'sigmam', P_mW: 12, w_um: 40, solveFor: 'rabi'
  }, { datasetVersion: '2026.11.10.2', datasetHash: '946cabc410ba50e842c5b746fa6a6c149dd514c37c8c94b6ff4350b4a8178271' });
  const line = page.locator('#rydbergDiagramSelection .transition-line');
  await upload(legacy);
  await expect(page.locator('#configStatus')).toContainText('已恢复计算配置');
  await expect(page.locator('#rabiResult')).toContainText('R2');
  await expect(page.locator('#rydbergLegacyContext')).toBeVisible();
  await expect(line).toHaveAttribute('data-id', 'NS-65-F12');
  await expect(line).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#hfCGTableBody tr')).toHaveCount(10);

  await page.getByLabel('末态 F′').selectOption('1.5');
  await expect(page.locator('#rydbergLegacyContext')).toBeHidden();
  const pending = page.waitForEvent('download');
  await page.locator('#configExport').click();
  const downloaded = await pending;
  const saved = JSON.parse(await readFile(await downloaded.path(), 'utf8'));
  expect(saved.transitionId).toBe('NS-65-F32');
  expect(saved.selection.F_upper).toBe(1.5);
  expect(saved.matrixElement.reduced_ea0).toBeCloseTo(-0.003490253670468963, 15);
  expect(saved.result.frequency_Hz).toBeGreaterThan(0);
  await page.getByLabel('末态 F′').selectOption('0.5');
  await upload(saved);
  await expect(line).toHaveAttribute('data-id', 'NS-65-F32');
  await expect(page.locator('#rabiResult')).toContainText('NS-65-F32');
});
