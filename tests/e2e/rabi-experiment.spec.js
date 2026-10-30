import {test,expect} from '@playwright/test';

test('the auxiliary clock operating point displays the current prediction without claiming experimental agreement',async({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('index.html');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  await page.locator('#levelDiagram .transition-line[data-id="T3"]').press('Enter');
  await page.locator('#hfCGTableBody [data-channel-key="0.5|0.5|0.5|0.5|0"]').click();
  await expect(page).toHaveURL(/#secRabi$/);
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition','T3');
  await expect(page.locator('.selection-context-channel')).toContainText('mF′=+1/2 · π');
  await page.locator('.rp-calc-unit[data-field="power"]').selectOption('nW');
  await page.locator('#rpCalcP').fill('70');
  await page.locator('#rpCalcW').fill('200');
  await expect(page.locator('.rp-calc-unit[data-field="rabi"]')).toHaveValue('Hz');
  await expect(page.locator('#rpCalcR')).toHaveValue('13.9086');
  await expect(page.locator('#rabiResult strong')).toHaveText('13.9086 Hz');
  await expect(page.locator('#rabiResult .result-validation')).toContainText('未独立验证');
  await expect(page.locator('#inputError')).toBeHidden();
  expect(errors).toEqual([]);
  await page.locator('#sectionNav a[href="#secRabi"]').click();
  await page.screenshot({path:testInfo.outputPath('pizzocaro-auxiliary-operating-point.png')});
});
