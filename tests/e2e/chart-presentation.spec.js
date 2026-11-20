import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const axes = page=>page.locator('#rpCurveCanvas,#rpHeatCanvas').evaluateAll(nodes=>
  nodes.map(node=>['xMin','xMax','yMin','yMax'].map(key=>node.dataset[key])));

async function exportPlot(page,kind,format){
  await page.locator('#'+kind+'ChartExport > summary').click();
  const pending=page.waitForEvent('download');
  await page.locator('#'+kind+'Export'+format).click();
  return readFile(await (await pending).path());
}

test('paper figure settings and stable axes and colour limits preserve the physical working point',async({page})=>{
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  await page.locator('.chart-presentation > summary').click();
  const originalAxes=await axes(page);
  const originalP=await page.locator('#rpCalcP').inputValue();
  await page.locator('#chartRangeMode').selectOption('fixed');
  await page.locator('#heatColorMode').selectOption('fixed');
  await page.locator('#heatColorLow').fill('1');
  await page.locator('#heatColorHigh').fill('60');
  await page.locator('#heatColorApply').click();
  await page.locator('#chartTheme').selectOption('paper');
  await expect(page.locator('#heatScaleNote')).toContainText('固定色标');
  expect(await axes(page)).toEqual(originalAxes);
  expect(await page.locator('#rpCalcP').inputValue()).toBe(originalP);
  await page.locator('#rpCalcP').fill('2');
  await page.locator('#rpCalcW').fill('37');
  await expect(page.locator('#rpLegend button[aria-label="显示束腰 37 微米曲线"]')).toBeVisible();
  expect(await axes(page)).toEqual(originalAxes);
  await page.locator('#chartExportWidth').fill('760');
  await page.locator('#chartExportHeight').fill('620');
  await page.locator('#chartExportFont').selectOption('serif');
  const doc=await page.evaluate(svg=>{
    const root=new DOMParser().parseFromString(svg,'image/svg+xml');
    return {view:JSON.parse(root.querySelector('metadata').textContent).view,
      record:JSON.parse(root.querySelector('metadata').textContent).record,content:root.documentElement.textContent,
      width:root.documentElement.getAttribute('width'),height:root.documentElement.getAttribute('height')};
  },(await exportPlot(page,'heat','SVG')).toString('utf8'));
  expect([doc.width,doc.height]).toEqual(['760','620']);
  expect(doc.view.figure.background).toBe('#ffffff');
  expect(doc.view.figure.font).toContain('Georgia');
  expect(doc.view.axesLocked).toBe(true);
  expect(doc.view.colorQuantiles).toBeNull();
  expect(doc.view.colorLimits_MHz).toEqual([1,60]);
  expect(doc.content).toContain('采样位图');
  expect(doc.record.configuration.parameters.power_W).toBe(.002);
  expect(doc.record.configuration.parameters.waist_m).toBeCloseTo(37e-6,12);
  const curves=(await exportPlot(page,'curve','SVG')).toString('utf8');
  expect(curves).toContain('stroke="#0072B2"');
  expect(curves).toContain('stroke-dasharray="7 3"');
  const png=await exportPlot(page,'heat','PNG');
  expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([1520,1240]);
  await page.locator('#heatColorHigh').fill('0');
  await page.locator('#heatColorApply').click();
  await expect(page.locator('#heatColorStatus')).toContainText('沿用上次色限');
  await page.locator('#chartExportWidth').fill('1');
  const csv=(await exportPlot(page,'curve','CSV')).toString('utf8');
  expect(csv).toContain('atom_component_power_W');
  expect(csv).toContain('axes_locked');
});

test('model probes support keyboard-only selection on both figures',async({page})=>{
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  for(const kind of ['Curve','Heat']){
    const canvas=page.locator('#rp'+kind+'Canvas'),reading=page.locator('#rp'+kind+'Readout');
    await canvas.focus();
    await canvas.press('ArrowRight');
    const first=Number(await reading.getAttribute('data-power-mw'));
    await canvas.press('ArrowRight');
    expect(Number(await reading.getAttribute('data-power-mw'))).toBeGreaterThan(first);
    const waist=await reading.getAttribute('data-waist-um');
    await canvas.press('ArrowUp');
    expect(await reading.getAttribute('data-waist-um')).not.toBe(waist);
    await canvas.press('Enter');
    await expect(reading).toHaveAttribute('data-mode','pinned');
    await canvas.press('Escape');
    await expect(reading).toHaveAttribute('data-mode','empty');
  }
});
