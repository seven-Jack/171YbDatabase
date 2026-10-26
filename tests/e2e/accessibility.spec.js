import { test, expect } from '@playwright/test';

test('formula dialog closes with Escape and returns focus', async ({ page }) => {
  await page.goto('./');
  const trigger = page.locator('#rabiFormulaOpen');
  await trigger.click();
  await expect(page.locator('#rabiFormulaDialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#rabiFormulaDialog')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('native transition buttons provide a keyboard equivalent to the diagram', async ({ page }) => {
  await page.goto('./');
  const target = page.locator('[data-select-transition="T3"]');
  await expect(target).toBeVisible();
  await target.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('current-context')).toContainText('T3');
  await expect(page.locator('#hfCGTableBody tr')).toHaveCount(4);
});
