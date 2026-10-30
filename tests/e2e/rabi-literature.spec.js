import {test,expect} from '@playwright/test';

test('Kroeze T2 benchmark passes through channel selection and all three calculator directions',async({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('index.html');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  const channel=page.locator('#hfCGTableBody [data-channel-key="0.5|0.5|1.5|1.5|1"]');
  await channel.click();
  await expect(page).toHaveURL(/#secRabi$/);
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition','T2');
  await expect(page.locator('.selection-context-channel')).toContainText('mF′=+3/2 · σ⁺');
  await expect(page.locator('#powerAxisConvention')).toHaveValue('component');
  await page.locator('#rpCalcP').fill('1');
  await page.locator('#rpCalcW').fill('500');
  await expect(page.locator('#rpCalcR')).toHaveValue('5.52367');
  await expect(page.locator('#rabiResult strong')).toHaveText('5.52367 MHz');
  await expect(page.locator('#rabiResult small')).toContainText('d_eff=0.311654');

  await page.locator('#calcSolveFor').selectOption('power');
  await page.locator('#rpCalcR').fill('5.523');
  const powerUnit=await page.locator('.rp-calc-unit[data-field="power"]').inputValue();
  const power=Number(await page.locator('#rpCalcP').inputValue())*{W:1000,mW:1,'µW':.001,nW:1e-6}[powerUnit];
  expect(Math.abs(power-1)).toBeLessThan(2*.006/5.523);

  await page.locator('#calcSolveFor').selectOption('waist');
  await page.locator('.rp-calc-unit[data-field="power"]').selectOption('mW');
  await page.locator('#rpCalcP').fill('1');
  await page.locator('#rpCalcR').fill('5.523');
  const waistUnit=await page.locator('.rp-calc-unit[data-field="waist"]').inputValue();
  const waist=Number(await page.locator('#rpCalcW').inputValue())*{mm:1000,'µm':1,nm:.001}[waistUnit];
  expect(Math.abs(waist-500)).toBeLessThan(500*.006/5.523);

  // Leave a reproducible forward benchmark in the verification screenshot.
  await page.locator('#calcSolveFor').selectOption('rabi');
  await page.locator('#rpCalcW').fill('500');
  await expect(page.locator('#rpCalcR')).toHaveValue('5.52367');
  await expect(page.locator('#inputError')).toBeHidden();
  expect(errors).toEqual([]);
  await page.locator('#sectionNav a[href="#secRabi"]').click();
  await page.screenshot({path:testInfo.outputPath('kroeze-table10-forward.png')});
});
