import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { CORE_TRANSITIONS, RYDBERG_SERIES_TRANSITIONS } from '../../src/data/catalog.js';
import { exportCalculationConfig } from '../../src/state/config.js';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
});

test('This work follows the branch and the actual magnetic channel from the Rabi source link', async ({page}) => {
  await page.locator('#rydbergDiagramSelection .transition-line').press('Enter');
  const review = page.getByTestId('evidence-review');
  const details = page.getByTestId('evidence-calculation-record');
  const result = page.locator('#rabiResult');
  await result.getByRole('link', {name:'查看计算记录'}).click();
  await expect(details).toHaveAttribute('open','');
  await expect(review.getByRole('heading')).toHaveText('This work · R017 零场计算');
  await expect(result.locator('.result-validation')).toHaveText('This work · R017 零场计算');
  await expect(review).not.toContainText(/本轮未接入|578 nm|文献核查/);
  await expect(review).toContainText('ν = 60.561073029');
  await expect(review).toContainText('λ = 301.888533 nm');
  await expect(review).toContainText('M_fi = −1.424890 × 10⁻³');
  await expect(details.getByRole('link', {name:/第 367 行/})).toHaveAttribute('href',/channel_matrix_elements\.csv\?plain=1#L367$/);
  const publicFile = details.getByRole('link', {name:'本站分支数据（JSON）'});
  const publicData = await page.request.get(await publicFile.evaluate(link => link.href));
  expect(publicData.ok()).toBe(true);
  expect((await publicData.json()).states.find(row => row.n === 65 && row.Fp === 1.5))
    .toMatchObject({nu:60.561073029, dipole_ea0:-0.003490253670468963});
  await page.locator('#hfCGTableBody [data-channel-key="0.5|0.5|1.5|1.5|1"]').click();
  await expect(details.getByRole('link', {name:/第 371 行/})).toBeVisible();
  await expect(review).toContainText('M_fi = −1.745127 × 10⁻³');
  await page.locator('#hfCGTableBody [data-channel-key="0.5|0.5|0.5|-0.5|-1"]').click();
  await expect(review).toContainText('混合态');
  await expect(review).toContainText('D_F = +2.165173 × 10⁻³');
  await expect(review).toContainText('λ = 301.892033 nm');
  await details.locator('summary').click();
  await expect(details.getByRole('link', {name:/第 364 行/})).toBeVisible();
  await page.locator('#rydbergN').fill('29');
  await expect(review).toContainText('ν = 24.5448869845');
  await expect(review).not.toContainText('60.1761270465');
  await expect(page.locator('#sourcePanel [data-source-field="d_num"]')).toContainText('计算记录定位');
});

test('switches n in the paired matrix display and uses the chosen R017 channel for Rabi', async ({ page }) => {
  const n = page.locator('#rydbergN');
  const f = page.locator('#rydbergFp');
  const line = page.locator('#rydbergDiagramSelection .transition-line');
  const dipoles = page.locator('#ryd65BranchRows tr');
  const lowGeometry = () => page.locator('#levelDiagram > .transition-line .trans-main-line').evaluateAll(lines =>
    lines.map(line => ['x1', 'y1', 'x2', 'y2', 'stroke'].map(attribute => line.getAttribute(attribute))));
  const before = await lowGeometry();
  await expect(n).toHaveValue('65');
  await expect(line).toHaveAttribute('data-id', 'NS-65-F32');
  await expect(page.locator('#rydbergPairRows tr')).toHaveCount(2);

  await n.fill('29');
  await expect(line).toHaveAttribute('data-id', 'NS-29-F32');
  await expect(page.locator('#rydbergNu')).toHaveValue('24.56697623');
  await expect(page.locator('#hfCGTableBody tr')).toHaveCount(10);
  await expect(page.getByRole('region', {name:'29S 矩阵元表'})).toBeVisible();
  await expect(dipoles).toHaveCount(2);
  await expect(dipoles.nth(0)).toContainText('24.5448869845');
  await expect(dipoles.nth(0)).toContainText('+9.560902015 × 10⁻³');
  await expect(dipoles.nth(1)).toContainText('24.5669762300');
  await expect(dipoles.nth(1)).toContainText('−1.356739900 × 10⁻²');
  await expect(page.locator('#hfTransLines svg')).toContainText('F′=1/2');
  await expect(page.locator('#hfTransLines svg')).toContainText('F′=3/2');
  const frequency = Number(await page.locator('#rpCalcR').inputValue());
  await page.locator('#hfCGTableBody button[data-channel-key="0.5|0.5|0.5|-0.5|-1"]').click();
  await expect(line).toHaveAttribute('data-id', 'NS-29-F12');
  await expect(f).toHaveValue('0.5');
  await expect(page.locator('#rydbergNu')).toHaveValue('24.5448869845');
  await expect(page.locator('#hfCGTableBody tr')).toHaveCount(10);
  await expect(page.locator('#rabiResult')).toContainText('NS-29-F12');
  expect(Number(await page.locator('#rpCalcR').inputValue())).not.toBeCloseTo(frequency, 6);

  await page.locator('#rydbergSeriesTable summary').click();
  await expect(page.locator('#rydbergAllRows tr')).toHaveCount(144);
  await page.getByLabel('搜索光谱').fill('100');
  await expect(page.locator('#rydbergAllRows tr')).toHaveCount(2);
  await page.locator('#rydbergAllRows button[data-rydberg-id="NS-100-F32"]').click();
  await expect(n).toHaveValue('100');
  await expect(f).toHaveValue('1.5');
  await expect(page.locator('#rydbergNu')).toHaveValue('95.561161693');
  await expect(line).toHaveAttribute('data-id', 'NS-100-F32');
  await expect(page.getByRole('region', {name:'100S 矩阵元表'})).toBeVisible();
  await expect(dipoles).toHaveCount(2);
  await expect(line).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#sourcePanel')).toContainText('R017');
  await expect(page.locator('#levelDiagram .transition-line')).toHaveCount(8);
  expect(await lowGeometry()).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width + 1);
});

test('n and ν synchronize immediately, using only entries in the current F′', async ({ page }) => {
  const n = page.locator('#rydbergN');
  const nu = page.locator('#rydbergNu');
  const f = page.locator('#rydbergFp');
  const options = page.locator('#rydbergNuChoices option');
  const line = page.locator('#rydbergDiagramSelection .transition-line');
  const message = page.locator('#rydbergInputMessage');
  const savedOptions = fp => RYDBERG_SERIES_TRANSITIONS
    .filter(branch => branch.Fp === fp)
    .map(branch => String(branch.nu));
  const checkOptions = async fp => {
    await expect(options).toHaveCount(72);
    expect(await options.evaluateAll(items => items.map(item => item.value))).toEqual(savedOptions(fp));
  };

  await expect(nu).toHaveAttribute('type', 'number');
  await expect(nu).toHaveAttribute('list', 'rydbergNuChoices');
  await expect(page.locator('#rydbergSelection')).toContainText('B = E = 0');
  await checkOptions(1.5);
  const candidate = await page.locator('#rydbergNuChoices option[value="80.561101041"]').getAttribute('value');
  await nu.fill(candidate);
  await expect(n).toHaveValue('85');
  await expect(line).toHaveAttribute('data-id', 'NS-85-F32');
  await expect(page.locator('#rabiResult')).toContainText('NS-85-F32');

  await f.selectOption('0.5');
  await expect(n).toHaveValue('85');
  await expect(nu).toHaveValue('79.7246383569');
  await expect(line).toHaveAttribute('data-id', 'NS-85-F12');
  await checkOptions(0.5);

  await nu.fill('80.561101041');
  await expect(nu).not.toHaveAttribute('aria-invalid', 'true');
  await nu.press('Enter');
  await expect(nu).toHaveAttribute('aria-invalid', 'true');
  await expect(message).toContainText('已收录的 ν');
  await expect(n).toHaveValue('85');
  await expect(line).toHaveAttribute('data-id', 'NS-85-F12');
  await expect(page.locator('#rabiResult')).toContainText('NS-85-F12');
  await nu.press('Escape');
  await expect(nu).toHaveValue('79.7246383569');
  await expect(message).toHaveText('');

  for (const invalid of ['28', '85.5', '101']) {
    await n.fill(invalid);
    await n.press('Enter');
    await expect(n).toHaveAttribute('aria-invalid', 'true');
    await expect(message).toContainText('29 到 100 的整数');
    await expect(nu).toHaveValue('79.7246383569');
    await expect(line).toHaveAttribute('data-id', 'NS-85-F12');
  }
  await n.fill('100');
  await expect(n).not.toHaveAttribute('aria-invalid', 'true');
  await expect(message).toHaveText('');
  await expect(nu).toHaveValue('94.6698383275');
  await expect(line).toHaveAttribute('data-id', 'NS-100-F12');

  await nu.fill('24.5448869845');
  await expect(n).toHaveValue('29');
  await expect(line).toHaveAttribute('data-id', 'NS-29-F12');
});

test('R017 lines stay in the ungraded E1 class when selecting and filtering', async ({ page }) => {
  const line = page.locator('#rydbergDiagramSelection .transition-line');
  await expect(line).toHaveAttribute('data-strength', 'ungraded');
  const filters = page.locator('#atlasFilters');
  if (!(await filters.evaluate(el => el.open))) await filters.locator('summary').click();
  await page.locator('[data-fstrength="strong"]').click();
  await expect(line).toHaveCSS('pointer-events', 'none');
  await page.locator('#rydbergN').fill('85');
  await expect(line).toHaveAttribute('data-id', 'NS-85-F32');
  await expect(line).toHaveAttribute('data-strength', 'ungraded');
  await expect(line).toHaveCSS('pointer-events', 'none');
  await page.locator('[data-fstrength="ungraded"]').click();
  await expect(line).toHaveCSS('pointer-events', 'auto');
});

test('typing a complete n or ν lands on the polarization diagram for the chosen branch', async ({page}) => {
  const openBranches = page.locator('a[href="#rydbergSelection"]');
  const n = page.locator('#rydbergN');
  const nu = page.locator('#rydbergNu');
  const fp = page.locator('#rydbergFp');
  const heading = page.getByRole('heading', {name:'偏振分量图', exact:true});
  const pi = page.locator('#hfTransPolSeg [data-pol="pi"]');
  const context = page.locator('#selectionContext');
  const target = RYDBERG_SERIES_TRANSITIONS.find(branch => branch.n === 85 && branch.Fp === 0.5);
  async function expectDiagramInView() {
    await expect(page).toHaveURL(/#polarizationDiagram$/);
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport({ratio:1});
    await expect.poll(async () => {
      const [title, sticky] = await Promise.all([heading.boundingBox(), context.boundingBox()]);
      return title.y >= sticky.y + sticky.height;
    }).toBe(true);
    await expect(pi).toBeInViewport({ratio:1});
    await expect(page.locator('#hfTransLines svg')).toBeInViewport();
  }

  await openBranches.click();
  await fp.selectOption('0.5');
  await n.fill('');
  await n.pressSequentially('10');
  await expect(n).toBeFocused();
  await expect(page).toHaveURL(/#rydbergSelection$/);
  await n.press('0');
  await expectDiagramInView();
  await expect(context).toHaveAttribute('data-selection-transition', 'NS-100-F12');

  await openBranches.click();
  await nu.fill('');
  const digits = String(target.nu);
  const prefix = digits.slice(0, -3);
  await nu.pressSequentially(prefix);
  await expect(nu).toBeFocused();
  await expect(page).toHaveURL(/#rydbergSelection$/);
  await nu.pressSequentially(digits.slice(prefix.length));
  await expectDiagramInView();
  await expect(n).toHaveValue('85');
  await expect(fp).toHaveValue('0.5');
  await expect(context).toHaveAttribute('data-selection-transition', target.id);

  await openBranches.click();
  await nu.press('Enter');
  await expectDiagramInView();
  await pi.click();
  const line = page.locator('#hfTransLines [role="button"][data-channel-key="0.5|0.5|0.5|0.5|0"]');
  // The stroked SVG line can have zero geometric width; click its center on screen.
  const bounds = await line.boundingBox();
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(page).toHaveURL(/#rabiResult$/);
  await expect(page.locator('#rabiResult')).toBeFocused();
  await expect(context).toHaveAttribute('data-selection-transition', target.id);
});

test('superseded, invalid and cancelled inputs keep the editor in place', async ({page}) => {
  await page.locator('a[href="#rydbergSelection"]').click();
  await page.clock.install();
  const n = page.locator('#rydbergN');
  const nu = page.locator('#rydbergNu');
  await n.fill('85');
  await n.fill('851');
  await n.press('Enter');
  await page.clock.fastForward(2000);
  await expect(n).toHaveAttribute('aria-invalid', 'true');
  await expect(n).toBeFocused();
  await expect(page).toHaveURL(/#rydbergSelection$/);

  const saved = await nu.inputValue();
  await nu.fill('24.5');
  await nu.press('Escape');
  await page.clock.fastForward(2000);
  await expect(nu).toHaveValue(saved);
  await expect(nu).toBeFocused();
  await expect(page).toHaveURL(/#rydbergSelection$/);
});

test('restores legacy R2 and round-trips the new selected branch', async ({ page }) => {
  const upload = config => page.locator('#configFile').setInputFiles({
    name: 'yb171-config.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config))
  });
  const legacy = Fp => exportCalculationConfig({
    transition: CORE_TRANSITIONS.find(transition => transition.id === 'R2'),
    F_lower: 0.5, F_upper: Fp, pol: 'sigmam', P_mW: 12, w_um: 40, solveFor: 'rabi'
  }, { datasetVersion: '2026.11.10.2', datasetHash: '946cabc410ba50e842c5b746fa6a6c149dd514c37c8c94b6ff4350b4a8178271' });
  const line = page.locator('#rydbergDiagramSelection .transition-line');
  await upload(legacy(0.5));
  await expect(page.locator('#configStatus')).toContainText('已恢复计算配置');
  await expect(page.locator('#rabiResult')).toContainText('R2');
  await expect(page.locator('#rydbergLegacyContext')).toBeVisible();
  await expect(line).toHaveAttribute('data-id', 'NS-65-F12');
  await expect(page.locator('#rydbergN')).toHaveValue('65');
  await expect(page.locator('#rydbergNu')).toHaveValue('60.1761270465');
  await expect(line).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#hfCGTableBody tr')).toHaveCount(10);

  await page.locator('#rydbergFp').selectOption('1.5');
  await expect(page.locator('#rydbergN')).toHaveValue('65');
  await expect(page.locator('#rydbergNu')).toHaveValue('60.561073029');
  await expect(page.locator('#rydbergLegacyContext')).toBeHidden();
  const pending = page.waitForEvent('download');
  await page.locator('#configExport').click();
  const downloaded = await pending;
  const saved = JSON.parse(await readFile(await downloaded.path(), 'utf8'));
  expect(saved.transitionId).toBe('NS-65-F32');
  expect(saved.selection.F_upper).toBe(1.5);
  expect(saved.matrixElement.reduced_ea0).toBeCloseTo(-0.003490253670468963, 15);
  expect(saved.result.frequency_Hz).toBeGreaterThan(0);
  await page.locator('#rydbergFp').selectOption('0.5');
  await upload(saved);
  await expect(line).toHaveAttribute('data-id', 'NS-65-F32');
  const result = page.locator('#rabiResult');
  await expect(result).toContainText('NS-65-F32');

  const nu = page.locator('#rydbergNu');
  await nu.fill('0');
  await nu.press('Enter');
  await expect(nu).toHaveAttribute('aria-invalid', 'true');
  const beforePowerChange = await result.innerText();
  await page.locator('#rpCalcP').fill('5');
  await expect(result).not.toHaveText(beforePowerChange);
  await expect(nu).toHaveValue('0');
  await expect(nu).toHaveAttribute('aria-invalid', 'true');

  await upload(legacy(1.5));
  await expect(result).toContainText('R2');
  await expect(line).toHaveAttribute('data-id', 'NS-65-F32');
  await expect(nu).toHaveValue('60.561073029');
  await expect(nu).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#rydbergInputMessage')).toHaveText('');
});
