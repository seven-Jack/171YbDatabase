import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function downloadJSON(page,button){
  const pending=page.waitForEvent('download');
  await button.click();
  const download=await pending;
  return JSON.parse(await readFile(await download.path(),'utf8'));
}

test('65S search distinguishes adopted and archived records, exports scopes and loads the requested branch',async({page})=>{
  test.slow(); // Three downloads, two calculator loads and catalogue selection in one session.
  await page.addInitScript(()=>localStorage.setItem('yb171.onboarding.556.v1','skipped'));
  await page.goto('./');
  await page.locator('#dataSearch').fill('65S');
  const rows=page.locator('#core-data-table > tbody > tr[data-row-id]');
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toHaveAttribute('data-row-id','NS-65-F12');
  await expect(rows.last()).toHaveAttribute('data-row-id','R2');
  await expect(rows.first()).toContainText('当前版本采用');
  await expect(rows.last()).toContainText('历史对照');
  const exported=await downloadJSON(page,page.locator('#dataExportFiltered'));
  expect(exported.scope).toBe('filtered');
  expect(exported.records.map(row=>row.id)).toEqual(['NS-65-F12','NS-65-F32','R2']);
  const row=rows.first();
  await row.locator('.table-source-details > summary').click();
  expect((await downloadJSON(page,row.locator('[data-data-export]'))).records).toHaveLength(1);
  await row.locator('.table-source-details > summary').click();
  const current=await page.locator('#selectionContext').getAttribute('data-selection-transition');
  await row.locator('[data-data-compare]').click();
  await rows.last().locator('[data-data-compare]').click();
  expect((await downloadJSON(page,page.locator('#dataExportComparison'))).comparison.rows.map(r=>r.id)).toEqual(['NS-65-F12','R2']);
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition',current);
  await row.locator('[data-data-open]').click();
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition','NS-65-F12');
  await expect(page.locator('#rydbergFp')).toHaveValue('0.5');
  await expect(page.locator('#rydbergDiagramSelection .transition-line')).toHaveAttribute('data-id','NS-65-F12');
  await expect(page.locator('#sourcePanel')).toContainText('delivery_20261111T085031Z');
  await rows.last().locator('[data-data-open]').click();
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition','R2');
  await expect(page.locator('#sourcePanel .source-record-heading')).toContainText('local_20261110T025200Z');
  await expect(page.locator('#diagram-source-ref-17')).toContainText('历史对照');
  // Changing the live branch changes which R2 matrix element the comparison actually used.
  await rows.nth(1).locator('[data-data-open]').click();
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition','NS-65-F32');
  const branchExport=await downloadJSON(page,page.locator('#dataExportComparison'));
  const historical=branchExport.records.find(record=>record.id==='R2');
  expect(branchExport.comparison.rows.find(record=>record.id==='R2').channel.Fp).toBe(1.5);
  expect(historical.adoption.conditions.Fp).toBe(1.5);
  expect(branchExport.comparison.rows.find(record=>record.id==='NS-65-F12').rabi_Hz).toBeNull();
});
