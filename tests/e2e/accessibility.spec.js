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

for(const [id,key,rows] of [['T3','Enter',4],['R2','Space',10]]){
  test(`${key} activates the ${id} diagram line and focuses its channel workspace`,async ({page})=>{
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
    await expect(page.locator('#transitionPicker')).toHaveCount(0);
    const target=page.locator(`#levelDiagram .transition-line[data-id="${id}"]`);
    await expect(target).toHaveAttribute('role','button');
    await expect(target).toHaveAttribute('tabindex','0');
    await expect(target).toHaveAccessibleName(new RegExp(id));
    await target.focus();
    await page.keyboard.press(key);
    await expect(page).toHaveURL(/#secCalc$/);
    await expect(target).toHaveAttribute('aria-pressed','true');
    await expect(page.getByTestId('current-context').locator('strong')).toContainText(`${id} ·`);
    await expect(page.locator('#hfCGTableBody tr')).toHaveCount(rows);
    await expect(page.locator('#secCalc h2')).toBeFocused();
  });
}
