import {test, expect} from '@playwright/test';

const benchmarks = [
  {id:'T1', key:'0.5|0.5|1.5|1.5|1', calculated:'42.435492', published:'42.44 ± 0.04', table:'表 8'},
  {id:'T2', key:'0.5|0.5|1.5|1.5|1', calculated:'5.523675', published:'5.523 ± 0.006', table:'表 10'},
  {id:'T5', key:'0.5|0.5|1.5|1.5|1', calculated:'28.242575', published:'28.3 ± 0.8', table:'表 12'},
  {id:'T6', key:'0.5|0.5|1.5|1.5|1', calculated:'20.056321', published:'20 ± 1.6', table:'表 13'},
  {id:'T7', key:'2.5|2.5|1.5|1.5|-1', calculated:'39.552267', published:'39.5 ± 2.6', table:'表 14'},
];

async function choose(page, item) {
  await page.locator(`#levelDiagram .transition-line[data-id="${item.id}"]`).press('Enter');
  await page.locator(`#hfCGTableBody [data-channel-key="${item.key}"]`).click();
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition', item.id);
}

async function openEvidence(page) {
  const source = page.locator('#selectedSource');
  if (await source.getAttribute('open') === null) await source.locator(':scope > summary').click();
  const review = page.getByTestId('evidence-review');
  await review.scrollIntoViewIfNeeded();
  return review;
}

async function expectNoOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({page}) => {
  await page.goto('index.html');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
});

for (const item of benchmarks) test(`${item.id}: matching channel displays its own fixed theory evidence`, async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await choose(page, item);
  const review = await openEvidence(page);
  await expect(review.locator('#evidenceReviewTitle')).toContainText(item.id);
  await expect(page.getByTestId('evidence-row-source')).toHaveAttribute('data-evidence-status','checked');
  await expect(page.getByTestId('evidence-row-formula')).toHaveAttribute('data-evidence-status','checked');
  await expect(page.getByTestId('evidence-row-comparison')).toHaveAttribute('data-evidence-status','theory-compatible');
  await expect(page.getByTestId('evidence-row-experiment')).toHaveAttribute('data-evidence-status','not-closed');
  await expect(page.locator('#rabiResult .result-validation')).toContainText('未独立实验验证');
  await expect(review).not.toContainText('Offer');
  await expect(review).not.toContainText('Xu');
  await expect(page.getByTestId('evidence-primary-source')).toContainText('ref-01');

  const comparison = page.getByTestId('evidence-comparison');
  const support = page.getByTestId('evidence-atomic-support');
  await expect(comparison).not.toHaveAttribute('open','');
  await expect(support).not.toHaveAttribute('open','');
  await comparison.locator(':scope > summary').click();
  await support.locator(':scope > summary').click();
  await expect(comparison).toContainText('1 mW');
  await expect(comparison).toContainText(/500\s*[µμ]m/);
  await expect(comparison).toContainText(item.calculated);
  await expect(comparison).toContainText(item.published);
  await expect(comparison).toContainText('MHz');
  await expect(comparison).toContainText(item.id === 'T7' ? 'σ⁻' : 'σ⁺');
  await expect(page.getByTestId('evidence-row-source')).toContainText(item.table);
  await expect(comparison).toContainText('非当前输入');
  const hrefs = await review.locator('.evidence-source-links a').evaluateAll(links => links.map(link => link.href));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    const url = new URL(href);
    expect(url.protocol).toBe('https:');
    expect(['doi.org','arxiv.org']).toContain(url.hostname);
  }
  await expectNoOverflow(page);
  expect(errors).toEqual([]);
});

test('changing mF or polarization requires a new review and keeps the archived benchmark fixed', async ({page}) => {
  await choose(page, benchmarks[1]);
  await openEvidence(page);
  const comparison = page.getByTestId('evidence-comparison');
  await comparison.locator(':scope > summary').click();
  const fixed = await comparison.locator('.evidence-detail-body').textContent();
  await page.locator('#hfCGTableBody [data-channel-key="0.5|-0.5|1.5|0.5|1"]').click();
  await expect(page.getByTestId('evidence-row-formula')).toHaveAttribute('data-evidence-status','needs-review');
  await expect(page.getByTestId('evidence-row-comparison')).toHaveAttribute('data-evidence-status','needs-review');
  await expect(page.getByTestId('evidence-row-experiment')).toHaveAttribute('data-evidence-status','not-closed');
  await expect(comparison).toHaveAttribute('open','');
  await expect(comparison.locator('.evidence-detail-body')).toHaveText(fixed);

  await page.locator('#hfTransPolSeg [data-pol="pi"]').click();
  await page.locator('#hfCGTableBody [data-channel-key="0.5|0.5|1.5|0.5|0"]').click();
  await expect(page.getByTestId('evidence-row-formula')).toHaveAttribute('data-evidence-status','needs-review');
  await expect(comparison.locator('.evidence-detail-body')).toHaveText(fixed);
  await page.locator('#hfTransPolSeg [data-pol="sigmap"]').click();
  await page.locator(`#hfCGTableBody [data-channel-key="${benchmarks[1].key}"]`).click();
  await expect(page.getByTestId('evidence-row-comparison')).toHaveAttribute('data-evidence-status','theory-compatible');
});

test('M1 edits update the live result without changing the fixed reference or marking an experiment passed', async ({page}) => {
  await choose(page, benchmarks[3]);
  await openEvidence(page);
  const comparison = page.getByTestId('evidence-comparison');
  await comparison.locator(':scope > summary').click();
  const fixed = await comparison.locator('.evidence-detail-body').textContent();
  const initial = await page.locator('#rpCalcR').inputValue();
  const definitions = page.locator('#beamDefinitionSettings');
  if (await definitions.getAttribute('open') === null) await definitions.locator(':scope > summary').click();
  await page.locator('#beamPowerPlane').selectOption('upstream');
  await page.locator('#beamTransmission').fill('');
  await expect(page.getByTestId('evidence-context')).toHaveAttribute('data-calculation-status','invalid');
  await expect(page.getByTestId('evidence-review')).toContainText('当前输入未形成有效计算');
  await page.locator('#beamTransmission').fill('25');
  await expect(page.getByTestId('evidence-context')).toHaveAttribute('data-calculation-status','valid');
  await expect(page.locator('#rpCalcR')).not.toHaveValue(initial);
  await expect(comparison.locator('.evidence-detail-body')).toHaveText(fixed);
  await expect(page.getByTestId('evidence-row-experiment')).toHaveAttribute('data-evidence-status','not-closed');
});

test('switching transitions clears expanded records, retains T3, and keeps T4 and Rydberg states outside low-state claims', async ({page}) => {
  await choose(page, benchmarks[0]);
  await openEvidence(page);
  await page.getByTestId('evidence-comparison').locator(':scope > summary').click();
  await page.getByTestId('evidence-atomic-support').locator(':scope > summary').click();
  await choose(page, benchmarks[4]);
  await openEvidence(page);
  await expect(page.getByTestId('evidence-comparison')).not.toHaveAttribute('open','');
  await expect(page.getByTestId('evidence-atomic-support')).not.toHaveAttribute('open','');
  await expect(page.getByTestId('evidence-review')).not.toContainText('42.44');

  await page.locator('#levelDiagram .transition-line[data-id="T3"]').press('Enter');
  await page.locator('#hfCGTableBody [data-channel-key="0.5|0.5|0.5|0.5|0"]').click();
  await openEvidence(page);
  await expect(page.getByTestId('evidence-xu')).toHaveCount(1);
  await expect(page.getByTestId('evidence-offer')).toHaveCount(1);
  await expect(page.getByTestId('evidence-comparison')).toHaveCount(0);
  await expect(page.getByTestId('evidence-primary-source')).toContainText('internal-t3-20260908');

  for (const id of ['T4','NS-65-F32']) {
    await page.locator(`#levelDiagram .transition-line[data-id="${id}"]`).press('Enter');
    await openEvidence(page);
    await expect(page.getByTestId('evidence-comparison')).toHaveCount(0);
    await expect(page.getByTestId('evidence-xu')).toHaveCount(0);
    await expect(page.getByTestId('evidence-offer')).toHaveCount(0);
    await expect(page.getByTestId('evidence-row-formula')).toHaveAttribute('data-evidence-status', id === 'T4' ? 'not-applicable' : 'not-reviewed');
  }
});
