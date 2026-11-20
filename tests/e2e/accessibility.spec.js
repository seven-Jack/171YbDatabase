import { test, expect } from '@playwright/test';

test('formula dialog closes with Escape and returns focus', async ({page})=>{
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  const trigger=page.locator('#rabiFormulaOpen');
  await trigger.click();
  await expect(page.locator('#rabiFormulaDialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#rabiFormulaDialog')).toBeHidden();
  await expect(trigger).toBeFocused();
});

for(const [id,key,rows] of [['T3','Enter',4],['NS-65-F32','Space',10]]){
  test(`${key} activates the ${id} diagram line and focuses the polarization diagram heading`,async ({page})=>{
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
    await expect(page.locator('#transitionPicker')).toHaveCount(0);
    const target=page.locator(`#levelDiagram .transition-line[data-id="${id}"]`);
    await expect(target).toHaveAttribute('role','button');
    await expect(target).toHaveAttribute('tabindex','0');
    await expect(target).toHaveAttribute('aria-controls','polarizationDiagram');
    await expect(target).toHaveAccessibleName(new RegExp(id));
    await target.focus();
    await page.keyboard.press(key);
    await expect(page).toHaveURL(/#polarizationDiagram$/);
    await expect(target).toHaveAttribute('aria-pressed','true');
    await expect(page.getByTestId('current-context').locator('strong')).toContainText(`${id} ·`);
    await expect(page.locator('#hfCGTableBody tr')).toHaveCount(rows);
    await expect(page.locator('#polarizationDiagram')).toBeFocused();
  });
}

test('navigation search restores the core tab and keeps keyboard focus below the sticky bar', async ({page})=>{
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  await page.locator('#data-tab-states').click();
  const link=page.locator('#sectionNav [data-open-search]');
  await link.press('Enter');
  const search=page.locator('#dataSearch');
  await expect(search).toBeFocused();
  await expect(page.locator('#data-tab-core')).toHaveAttribute('aria-selected','true');
  const [inputBox,navBox]=await Promise.all([search.boundingBox(),page.locator('#sectionNav').boundingBox()]);
  expect(inputBox.y).toBeGreaterThanOrEqual(navBox.y+navBox.height);
  await expect(page.locator('#hfCGTableBody .channel-select').first()).toHaveAccessibleName(/F=.*mF=.*F′=.*mF′=.*[πσ]/);
});
