import { test, expect } from '@playwright/test';

const transitionIds = ['T1','T2','T3','T4','T5','T6','T7','R2'];
const lineFor = (page,id) => page.locator(`#levelDiagram .transition-line[data-id="${id}"]`);
const problems = new WeakMap();

async function choose(page,id) {
  const line=lineFor(page,id),label=line.locator('text').first();
  await label.scrollIntoViewIfNeeded();
  const groupBox=await line.boundingBox(),labelBox=await label.boundingBox();
  if(!groupBox||!labelBox)throw new Error(`Transition ${id} has no visible wavelength label`);
  await line.click({position:{x:labelBox.x+labelBox.width/2-groupBox.x,y:labelBox.y+labelBox.height/2-groupBox.y}});
  await expect(page).toHaveURL(/#secCalc$/);
  await expect(line).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#secCalc h2')).toBeFocused();
}

test.beforeEach(async ({page})=>{
  const errors=[];
  problems.set(page,errors);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{
    if(response.status()>=400&&/\.(?:js|json|css|csv)(?:\?|$)/.test(response.url()))errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  await expect(page.locator('#levelDiagram .transition-line')).toHaveCount(8);
});

test.afterEach(async ({page})=>{
  expect(problems.get(page),'No script errors or missing production resources').toEqual([]);
});

test('the diagram is the only primary transition selector, with no obsolete catalog controls',async ({page})=>{
  await expect(page.locator('#transitionPicker,#transitionComparison,#explorerToolbar')).toHaveCount(0);
  await expect(page.locator('[data-select-transition],[data-compare-transition],.explorer-card')).toHaveCount(0);
  await expect(page.locator('#levelDiagram')).toHaveAttribute('role','group');
  expect(await page.locator('#levelDiagram .transition-line').evaluateAll(lines=>lines.map(line=>line.dataset.id))).toEqual(transitionIds);
  for(const id of transitionIds){
    const line=lineFor(page,id);
    await expect(line).toHaveAttribute('role','button');
    await expect(line).toHaveAttribute('tabindex','0');
    await expect(line).toHaveAccessibleName(new RegExp(id));
  }
});

test('each visible transition selects the same object and navigates directly to hyperfine channels',async ({page})=>{
  for(const id of transitionIds){
    await choose(page,id);
    await expect(page.getByTestId('current-context').locator('strong')).toContainText(`${id} ·`);
    await expect(page.locator('[data-workflow-object="channels"]')).toContainText(`${id} ·`);
    await expect(page.locator('[data-workflow-object="result"]')).toContainText(`${id} ·`);
    await expect(page.locator('#levelDiagram .transition-line[aria-pressed="true"]')).toHaveCount(1);
  }
});

test('effective F, unsupported M2 and calculated Rydberg evidence remain distinct after direct selection',async ({page})=>{
  await choose(page,'T3');
  await expect(page.locator('#sourcePanel [data-source-field="d_num"]')).toContainText('有效 F 级约化量');
  await expect(page.locator('#hfCGTableBody tr')).toHaveCount(4);

  await choose(page,'T4');
  await expect(page.getByTestId('current-context')).toHaveAttribute('data-status','unsupported');
  await expect(page.locator('#sourcePanel [data-source-field="d_num"]')).toContainText('缺少适用');
  await expect(page.locator('#rabiResult strong')).toHaveText('—');

  await choose(page,'R2');
  await expect(page.locator('#sourcePanel [data-source-field="d_num"]')).toContainText('本工作计算');
  await expect(page.locator('#sourcePanel [data-source-field="wavelength_vac_nm"]')).toContainText('标度估算');
  await expect(page.locator('#hfCGTableBody tr')).toHaveCount(10);
  await expect.poll(async()=>Number(await page.locator('#rpCalcR').inputValue())).toBeGreaterThan(0);
});

test('zero power is a valid zero result after a diagram jump',async ({page})=>{
  await choose(page,'T2');
  await page.locator('#rpCalcP').fill('0');
  await expect(page.getByTestId('input-error')).toBeHidden();
  await expect.poll(async()=>Number(await page.locator('#rpCalcR').inputValue())).toBe(0);
  await expect(page.locator('#rabiResult strong')).toHaveText('0 Hz');
});

test('shared-level relations still synchronize the object, channels and selected diagram line',async ({page})=>{
  await choose(page,'T3');
  const knowledge=page.locator('#transitionKnowledge');
  await expect(knowledge.locator('.knowledge-header h3')).toContainText('T3');
  const relatedR2=knowledge.locator('[data-knowledge-transition="R2"]');
  await expect(relatedR2).toBeHidden();
  await knowledge.locator('.knowledge-more > summary').click();
  await expect(relatedR2).toContainText('³P₀');
  await relatedR2.click();
  await expect(page.getByTestId('current-context').locator('strong')).toContainText('R2 ·');
  await expect(page.locator('#hfCGTableBody tr')).toHaveCount(10);
  await expect(page.locator('[data-workflow-object="channels"]')).toContainText('R2 ·');
  await expect(page.locator('[data-workflow-object="result"]')).toContainText('R2 ·');
  await expect(knowledge.locator('.knowledge-header h3')).toContainText('R2');
  await expect(lineFor(page,'R2')).toHaveAttribute('aria-pressed','true');
});

test('native workflow links reflect the current section without marking stages complete',async ({page})=>{
  const navigation=page.locator('#sectionNav');
  await expect(navigation.locator('a[href="#secLevel"]')).toHaveAttribute('aria-current','location');
  await choose(page,'T2');
  await expect(navigation.locator('a[href="#secCalc"]')).toHaveAttribute('aria-current','location');
  await expect(page.locator('.flow-step[data-gstep="2"] a')).toHaveAttribute('aria-current','step');
  await expect(page.locator('.flow-step[data-gstep="1"] a')).not.toHaveAttribute('aria-current');
  await navigation.locator('a[href="#secRabi"]').click();
  await expect(navigation.locator('a[href="#secRabi"]')).toHaveAttribute('aria-current','location');
  await expect(page.locator('.flow-step[data-gstep="3"] a')).toHaveAttribute('aria-current','step');
  await expect(page.locator('.flow-step.done')).toHaveCount(0);
  await expect(page.locator('.flow-step .fs-num')).toHaveText(['01','02','03']);
});

async function selectExplicitChannel(page){
  await choose(page,'T2');
  await page.locator('#hfCGTableBody .channel-select').first().click();
  await expect(page).toHaveURL(/#secRabi$/);
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-mode','explicit');
}
const calculationIdentity=page=>page.evaluate(()=>({
  power:document.getElementById('rpCalcP').value,
  waist:document.getElementById('rpCalcW').value,
  frequency:document.getElementById('rpCalcR').value,
  channel:document.querySelector('#hfCGTableBody .channel-select[aria-pressed="true"]')?.dataset.channelKey,
  transition:document.querySelector('#selectionContext').dataset.selectionTransition,
  selectedState:document.querySelector('[data-selection-channel]').textContent
}));
async function setAxisMaximum(page,id,value){
  const input=page.locator(`#${id}`);
  await input.fill(String(value));
  await input.press('Enter');
  await expect(input).not.toHaveAttribute('aria-invalid','true');
}
async function expectAxisNumber(page,id,value){
  await expect.poll(async()=>Number(await page.locator(`#${id}`).inputValue())).toBeCloseTo(value,6);
}

test('axis power units convert manual limits in both plots without changing the selected calculation',async ({page})=>{
  await selectExplicitChannel(page);
  const before=await calculationIdentity(page);
  await setAxisMaximum(page,'rpCurveXMax',400);
  await setAxisMaximum(page,'rpHeatXMax',600);
  await page.locator('#rpCurveXUnit').selectOption('W');
  await expectAxisNumber(page,'rpCurveXMax',.4);
  await expectAxisNumber(page,'rpHeatXMax',.6);
  expect(Number(await page.locator('#rpCurveXMax').inputValue())*1000).toBeCloseTo(400,6);
  await expect(page.locator('#rpHeatXUnit')).toHaveValue('W');

  // The unit in either power-axis title controls the same display convention.
  await page.locator('#rpHeatXUnit').selectOption('µW');
  await expectAxisNumber(page,'rpCurveXMax',400000);
  await expectAxisNumber(page,'rpHeatXMax',600000);
  await expect(page.locator('#rpCurveXUnit')).toHaveValue('µW');
  expect(await calculationIdentity(page)).toEqual(before);
});

test('heatmap waist-axis units preserve the physical range and selected mF channel',async ({page})=>{
  await selectExplicitChannel(page);
  const before=await calculationIdentity(page);
  await setAxisMaximum(page,'rpHeatYMax',300);
  await page.locator('#rpHeatYUnit').selectOption('mm');
  await expectAxisNumber(page,'rpHeatYMax',.3);
  await page.locator('#rpHeatYUnit').selectOption('nm');
  await expectAxisNumber(page,'rpHeatYMax',300000);
  await page.locator('#rpHeatYUnit').selectOption('µm');
  await expectAxisNumber(page,'rpHeatYMax',300);
  expect(await calculationIdentity(page)).toEqual(before);
});

test('invalid endpoint limits preserve the last valid display range and clearing restores a visible automatic limit',async ({page})=>{
  await selectExplicitChannel(page);
  const before=await calculationIdentity(page);
  await setAxisMaximum(page,'rpCurveXMax',400);
  const powerMaximum=page.locator('#rpCurveXMax');
  await powerMaximum.fill('0');
  await powerMaximum.press('Enter');
  await expect(powerMaximum).toHaveAttribute('aria-invalid','true');
  // A unit conversion exposes the retained range, rather than accepting zero.
  await page.locator('#rpCurveXUnit').selectOption('W');
  await expectAxisNumber(page,'rpCurveXMax',.4);
  await expect(powerMaximum).not.toHaveAttribute('aria-invalid','true');
  await powerMaximum.fill('');
  await powerMaximum.press('Enter');
  await expect(powerMaximum).toHaveAttribute('data-axis-mode','auto');
  await expect.poll(async()=>Number(await powerMaximum.inputValue())).toBeGreaterThan(0);

  const waistMaximum=page.locator('#rpHeatYMax');
  await setAxisMaximum(page,'rpHeatYMax',300);
  await waistMaximum.fill('1');
  await waistMaximum.press('Enter');
  await expect(waistMaximum).toHaveAttribute('aria-invalid','true');
  await waistMaximum.fill('');
  await waistMaximum.press('Enter');
  await expect(waistMaximum).not.toHaveAttribute('aria-invalid','true');
  await expect(waistMaximum).toHaveAttribute('data-axis-mode','auto');
  await expect.poll(async()=>Number(await waistMaximum.inputValue())).toBeGreaterThan(12.5);
  expect(await calculationIdentity(page)).toEqual(before);
});
