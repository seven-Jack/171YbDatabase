import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {CORE_TRANSITIONS} from '../../src/data/catalog.js';
import {rabiHz} from '../../src/physics/rabi.js';

const browserProblems=new WeakMap();
const t2Dipole=CORE_TRANSITIONS.find(row=>row.id==='T2').d_num/3;
const readoutFor=(page,kind='curve')=>page.getByTestId(`${kind}-readout`);
const canvasFor=(page,kind='curve')=>page.locator(kind==='curve'?'#rpCurveCanvas':'#rpHeatCanvas');

async function geometry(page,kind='curve'){
  const canvas=canvasFor(page,kind);
  await canvas.scrollIntoViewIfNeeded();
  const bounds=await canvas.boundingBox();
  if(!bounds)throw Error(`Missing ${kind} canvas geometry`);
  const values=await canvas.evaluate(element=>Object.fromEntries([
    'plotLeft','plotTop','plotWidth','plotHeight','xMin','xMax','xFactor','yMin','yMax','yFactor','scale'
  ].map(key=>[key,element.dataset[key]])));
  for(const [key,value] of Object.entries(values))if(key!=='scale')values[key]=Number(value);
  for(const key of ['plotLeft','plotTop','plotWidth','plotHeight','xMin','xMax','xFactor','yMin','yMax','yFactor'])
    expect(Number.isFinite(values[key]),`${kind} ${key} is a finite display-geometry value`).toBe(true);
  return {...values,bounds};
}

async function curvePoint(page,{waist=50,portion=.45,offset=0,dipole=t2Dipole}={}){
  const g=await geometry(page);
  const powerDisplay=g.scale==='log'
    ?10**(Math.log10(g.xMin)+portion*(Math.log10(g.xMax)-Math.log10(g.xMin)))
    :g.xMin+portion*(g.xMax-g.xMin);
  const power=powerDisplay/g.xFactor;
  const rabi=rabiHz(dipole,power,waist);
  const rabiDisplay=rabi/1e6*g.yFactor;
  const x=g.plotLeft+portion*g.plotWidth;
  const y=g.plotTop+g.plotHeight*(1-(rabiDisplay-g.yMin)/(g.yMax-g.yMin))+offset;
  expect(y).toBeGreaterThanOrEqual(g.plotTop);
  expect(y).toBeLessThanOrEqual(g.plotTop+g.plotHeight);
  return {x,y,g,power,waist,rabi};
}

async function hoverCurve(page,options){
  const point=await curvePoint(page,options);
  await page.mouse.move(point.g.bounds.x+point.x,point.g.bounds.y+point.y);
  return point;
}

async function clickPoint(page,kind,point,testInfo){
  const canvas=canvasFor(page,kind);
  if(testInfo.project.use.hasTouch)await page.touchscreen.tap(point.g.bounds.x+point.x,point.g.bounds.y+point.y);
  else await canvas.click({position:{x:point.x,y:point.y}});
}

async function pinnedCurve(page,testInfo,options){
  const point=await curvePoint(page,options);
  await clickPoint(page,'curve',point,testInfo);
  await expect(readoutFor(page)).toHaveAttribute('data-mode','pinned');
  return point;
}

async function reading(page,kind='curve'){
  return readoutFor(page,kind).evaluate(element=>({
    power:Number(element.dataset.powerMw),waist:Number(element.dataset.waistUm),
    rabi:Number(element.dataset.rabiHz),curveIndex:element.dataset.curveIndex,
  }));
}

async function moveAway(page){
  const navigation=await page.locator('#sectionNav').boundingBox();
  await page.mouse.move(navigation.x+10,navigation.y+10);
}

async function axisMaximum(page,id,value){
  const control=page.locator(`#${id}`);
  await control.fill(String(value));
  await control.press('Enter');
  await expect(control).not.toHaveAttribute('aria-invalid','true');
}

async function exportCalculation(page){
  const pending=page.waitForEvent('download');
  await page.locator('#configExport').click();
  const download=await pending;
  const config=JSON.parse(await readFile(await download.path(),'utf8'));
  return Object.fromEntries(['transitionId','matrixElement','selection','parameters','inputDefinition','enteredParameters','result']
    .map(key=>[key,config[key]]));
}

async function clockPiChannel(page){
  await page.locator('#levelDiagram .transition-line[data-id="T3"]').press('Enter');
  await page.locator('#hfCGTableBody [data-channel-key="0.5|0.5|0.5|0.5|0"]').click();
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition','T3');
}

async function definitions(page){
  const settings=page.locator('#beamDefinitionSettings');
  if(await settings.getAttribute('open')===null)await settings.locator(':scope > summary').click();
}

test.beforeEach(async({page})=>{
  const problems=[];browserProblems.set(page,problems);
  page.on('pageerror',error=>problems.push(error.message));
  page.on('response',response=>{
    if(response.status()>=400&&/\.(?:js|css|json|csv)(?:\?|$)/.test(response.url()))problems.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  await page.locator('#sectionNav a[href="#secRabi"]').click();
});

test.afterEach(async({page})=>{
  expect(browserProblems.get(page),'Chart reading introduces no production exception or missing resource').toEqual([]);
});

test('hover snaps to the nearby visible curve and reports its model value and waist, not the pointer ordinate',async({page})=>{
  const point=await hoverCurve(page,{offset:3});
  const output=readoutFor(page);
  await expect(output).toHaveAttribute('data-mode','hover');
  await expect(output).toHaveAttribute('data-curve-index','1');
  await expect(output).toContainText(/50\s*[µμ]m/);
  const value=await reading(page);
  expect(value.waist).toBe(50);
  // Pixel projection may move the snapped x slightly along the nearby segment.
  expect(Math.abs(value.power-point.power)).toBeLessThan((point.g.xMax-point.g.xMin)/point.g.xFactor*.03);
  expect(value.rabi).toBeCloseTo(rabiHz(t2Dipole,value.power,50),3);
  const cursorHz=(point.g.yMin+(point.g.plotTop+point.g.plotHeight-point.y)/point.g.plotHeight*(point.g.yMax-point.g.yMin))/point.g.yFactor*1e6;
  expect(Math.abs(value.rabi-cursorHz)).toBeGreaterThan(100);
  await moveAway(page);
  await expect(output).toHaveAttribute('data-mode','empty');

  // At low power, the upper plot region is far from every visible curve.
  const g=await geometry(page);
  await page.mouse.move(g.bounds.x+g.plotLeft+g.plotWidth*.05,g.bounds.y+g.plotTop+2);
  await expect(output).toHaveAttribute('data-mode','empty');
});

test('click or touch pins a curve readout until replaced, cleared or dismissed with Escape',async({page},testInfo)=>{
  await pinnedCurve(page,testInfo);
  const initial=await reading(page);
  await moveAway(page);
  await expect(readoutFor(page)).toHaveAttribute('data-mode','pinned');
  expect(await reading(page)).toEqual(initial);
  await pinnedCurve(page,testInfo,{waist:75,portion:.65});
  const replacement=await reading(page);
  expect(replacement.waist).toBe(75);
  expect(replacement.power).not.toBeCloseTo(initial.power,5);
  await page.locator('#rpCurveReadoutClear').click();
  await expect(readoutFor(page)).toHaveAttribute('data-mode','empty');
  await pinnedCurve(page,testInfo);
  await page.keyboard.press('Escape');
  await expect(readoutFor(page)).toHaveAttribute('data-mode','empty');
});

test('hidden or edited waist curves cannot retain or invent pinned readings',async({page},testInfo)=>{
  await pinnedCurve(page,testInfo);
  await page.locator('#rpLegend .lg-unit[data-idx="1"]').click();
  await expect(page.locator('#rpLegend .lg-item').nth(1)).toHaveClass(/lg-hidden/);
  await expect(readoutFor(page)).toHaveAttribute('data-mode','empty');
  // Remove every remaining visible curve: a canvas probe must not read hidden data.
  const visibleIndices=await page.locator('#rpLegend .lg-item:not(.lg-hidden) .lg-unit')
    .evaluateAll(toggles=>toggles.map(toggle=>toggle.dataset.idx));
  for(const index of visibleIndices)await page.locator(`#rpLegend .lg-unit[data-idx="${index}"]`).click();
  const g=await geometry(page);
  await canvasFor(page).click({position:{x:g.plotLeft+g.plotWidth*.5,y:g.plotTop+g.plotHeight*.5}});
  await expect(readoutFor(page)).toHaveAttribute('data-mode','empty');
  await page.locator('#rpLegend .lg-unit[data-idx="1"]').click();
  await pinnedCurve(page,testInfo);
  const waistInput=page.locator('#rpLegend .lg-winput[data-idx="1"]');
  await waistInput.fill('60');
  await waistInput.press('Enter');
  await expect(readoutFor(page)).toHaveAttribute('data-mode','empty');
  await pinnedCurve(page,testInfo,{waist:60});
  expect((await reading(page)).waist).toBe(60);
});

test('unit, scale and viewport changes preserve the physical pinned point and refresh display units',async({page},testInfo)=>{
  await pinnedCurve(page,testInfo);
  const before=await reading(page);
  await page.locator('#rpCurveXUnit').selectOption('W');
  await page.locator('#rpCurveYUnit').selectOption('kHz');
  await expect(readoutFor(page)).toHaveAttribute('data-mode','pinned');
  await expect(readoutFor(page)).toContainText(/\bW\b/);
  await expect(readoutFor(page)).toContainText('kHz');
  expect(await reading(page)).toEqual(before);
  await page.locator('#rpScaleLog').click();
  await expect(readoutFor(page)).toHaveAttribute('data-mode','pinned');
  expect(await reading(page)).toEqual(before);
  const size=page.viewportSize();
  await page.setViewportSize({width:Math.max(360,size.width-15),height:size.height});
  await expect(readoutFor(page)).toHaveAttribute('data-mode','pinned');
  expect(await reading(page)).toEqual(before);
  await page.setViewportSize(size);
});

test('both pinned readouts and the heat colorbar share the selected frequency unit without changing physical values',async({page},testInfo)=>{
  await clockPiChannel(page);
  const clockDipole=CORE_TRANSITIONS.find(row=>row.id==='T3').d_num/Math.sqrt(6);
  await pinnedCurve(page,testInfo,{dipole:clockDipole});
  const heatGeometry=await geometry(page,'heat');
  await clickPoint(page,'heat',{g:heatGeometry,
    x:heatGeometry.plotLeft+heatGeometry.plotWidth*.38,
    y:heatGeometry.plotTop+heatGeometry.plotHeight*.57},testInfo);
  await expect(readoutFor(page,'heat')).toHaveAttribute('data-mode','pinned');
  const before={curve:await reading(page),heat:await reading(page,'heat')};
  const evidenceKey=await page.getByTestId('evidence-context').getAttribute('data-context-key');
  for(const unit of ['kHz','Hz','MHz']){
    await page.locator('#rpCurveYUnit').selectOption(unit);
    for(const kind of ['curve','heat']){
      await expect(readoutFor(page,kind)).toHaveAttribute('data-mode','pinned');
      await expect(readoutFor(page,kind)).toContainText(new RegExp(`Ω/2π=[^·]*\\s${unit}(?:\\s|·|$)`));
      expect(await reading(page,kind)).toEqual(before[kind]);
    }
    await expect(page.locator('#heatColorQuantity')).toHaveText(`颜色 = Ω/2π (${unit})`);
    expect(await page.getByTestId('evidence-context').getAttribute('data-context-key')).toBe(evidenceKey);
  }
});

test('the heatmap pins an actual model reading, keeps it on mouse leave and clears explicitly',async({page},testInfo)=>{
  const g=await geometry(page,'heat');
  const point={g,x:g.plotLeft+g.plotWidth*.38,y:g.plotTop+g.plotHeight*.57};
  await clickPoint(page,'heat',point,testInfo);
  await expect(readoutFor(page,'heat')).toHaveAttribute('data-mode','pinned');
  const value=await reading(page,'heat');
  const expectedPower=(g.xMin+.38*(g.xMax-g.xMin))/g.xFactor;
  const expectedWaist=(g.yMin+.43*(g.yMax-g.yMin))/g.yFactor;
  // Browser pointer coordinates may quantize by a fraction of a CSS pixel.
  expect(Math.abs(value.power-expectedPower)).toBeLessThan((g.xMax-g.xMin)/g.plotWidth/g.xFactor*1.1);
  expect(Math.abs(value.waist-expectedWaist)).toBeLessThan((g.yMax-g.yMin)/g.plotHeight/g.yFactor*1.1);
  expect(value.rabi).toBeCloseTo(rabiHz(t2Dipole,value.power,value.waist),3);
  await moveAway(page);
  await expect(readoutFor(page,'heat')).toHaveAttribute('data-mode','pinned');
  expect(await reading(page,'heat')).toEqual(value);
  await page.locator('#rpHeatYUnit').selectOption('mm');
  await expect(readoutFor(page,'heat')).toContainText('mm');
  expect(await reading(page,'heat')).toEqual(value);
  await page.locator('#rpHeatReadoutClear').click();
  await expect(readoutFor(page,'heat')).toHaveAttribute('data-mode','empty');
});

test('focus and restore change display ranges only, preserving M1 definitions, M2 context and the original diagram',async({page})=>{
  await clockPiChannel(page);
  await definitions(page);
  await page.locator('#beamPowerPlane').selectOption('upstream');
  await page.locator('#beamTransmission').fill('50');
  await page.locator('#beamPowerBasis').selectOption('linear-total');
  await page.locator('#beamLinearOrientation').selectOption('manual');
  await page.locator('#beamManualFraction').fill('40');
  await page.locator('#beamSizeKind').selectOption('diameter');
  await page.locator('#rpCalcW').fill('75');
  await expect(page.locator('#beamNormalizedSummary')).toHaveAttribute('data-status','valid');
  const before=await exportCalculation(page);
  const diagram=await page.locator('#levelDiagram').innerHTML();
  const evidenceKey=await page.getByTestId('evidence-context').getAttribute('data-context-key');
  const originalSize=await canvasFor(page).boundingBox();
  await axisMaximum(page,'rpCurveXMax',.05);
  await axisMaximum(page,'rpCurveYMax',.001);
  await axisMaximum(page,'rpHeatXMax',.05);
  await axisMaximum(page,'rpHeatYMax',20);
  await page.locator('#rpFocusWorkpoint').click();
  const curve=await geometry(page),heat=await geometry(page,'heat');
  const powerMw=before.parameters.power_W*1000,waistUm=before.parameters.waist_m*1e6;
  const frequencyHz=before.result.frequency_Hz;
  expect(curve.xMin/curve.xFactor).toBeLessThan(powerMw);
  expect(curve.xMax/curve.xFactor).toBeGreaterThan(powerMw);
  expect(curve.yMax/curve.yFactor*1e6).toBeGreaterThan(frequencyHz);
  expect(heat.xMin/heat.xFactor).toBeLessThan(powerMw);
  expect(heat.xMax/heat.xFactor).toBeGreaterThan(powerMw);
  expect(heat.yMin/heat.yFactor).toBeLessThan(waistUm);
  expect(heat.yMax/heat.yFactor).toBeGreaterThan(waistUm);
  expect(await exportCalculation(page)).toEqual(before);
  expect(await page.getByTestId('evidence-context').getAttribute('data-context-key')).toBe(evidenceKey);
  await expect(page.getByTestId('evidence-row-experiment')).toHaveAttribute('data-evidence-status','not-closed');
  expect(await page.locator('#levelDiagram').innerHTML()).toBe(diagram);
  const curveSize=await canvasFor(page).boundingBox(),heatSize=await canvasFor(page,'heat').boundingBox();
  expect(curveSize.width).toBeCloseTo(heatSize.width,1);
  expect(curveSize.height).toBeCloseTo(heatSize.height,1);
  expect(curveSize.width).toBeCloseTo(originalSize.width,1);
  expect(curveSize.height).toBeCloseTo(originalSize.height,1);
  await page.locator('#rpRestoreView').click();
  await expect(page.locator('#rpCurveXMax')).toHaveValue('0.05');
  await expect(page.locator('#rpHeatXMax')).toHaveValue('0.05');
  expect(await exportCalculation(page)).toEqual(before);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});

test('focusing a nanowatt clock point survives log and linear switches below the ordinary log floor',async({page})=>{
  await clockPiChannel(page);
  await page.locator('.rp-calc-unit[data-field="power"]').selectOption('nW');
  await page.locator('#rpCalcP').fill('70');
  await page.locator('#rpCalcW').fill('200');
  await expect(page.locator('#beamNormalizedSummary')).toHaveAttribute('data-status','valid');
  await expect(page.locator('#rpFocusWorkpoint')).toBeEnabled();
  const before=await exportCalculation(page);
  expect(before.parameters.power_W).toBeCloseTo(70e-9,14);
  expect(before.parameters.waist_m).toBeCloseTo(200e-6,12);
  const evidenceKey=await page.getByTestId('evidence-context').getAttribute('data-context-key');
  const original=await geometry(page);
  await page.locator('#rpFocusWorkpoint').click();
  for(const scale of ['log','lin','log','lin']){
    await page.locator(scale==='log'?'#rpScaleLog':'#rpScaleLin').click();
    const curve=await geometry(page),heat=await geometry(page,'heat');
    expect(curve.scale).toBe(scale);
    // 70 nW = 7e-5 mW, far below the normal unfocused log floor of 0.1 mW.
    expect(curve.xMin/curve.xFactor).toBeLessThan(7e-5);
    expect(curve.xMax/curve.xFactor).toBeGreaterThan(7e-5);
    if(scale==='log')expect(curve.xMin/curve.xFactor).toBeGreaterThan(0);
    expect(curve.yMax/curve.yFactor*1e6).toBeGreaterThan(before.result.frequency_Hz);
    expect(heat.xMin/heat.xFactor).toBeLessThan(7e-5);
    expect(heat.xMax/heat.xFactor).toBeGreaterThan(7e-5);
    expect(heat.yMin/heat.yFactor).toBeLessThan(200);
    expect(heat.yMax/heat.yFactor).toBeGreaterThan(200);
  }
  await page.locator('#rpRestoreView').click();
  const restored=await geometry(page);
  expect(restored.scale).toBe(original.scale);
  expect(restored.xMin/restored.xFactor).toBeCloseTo(original.xMin/original.xFactor,9);
  expect(restored.xMax/restored.xFactor).toBeCloseTo(original.xMax/original.xFactor,9);
  expect(await exportCalculation(page)).toEqual(before);
  expect(await page.getByTestId('evidence-context').getAttribute('data-context-key')).toBe(evidenceKey);
  await expect(page.getByTestId('evidence-row-experiment')).toHaveAttribute('data-evidence-status','not-closed');
});

test('leaving a focused log view restores a valid original linear range below the normal log floor',async({page})=>{
  await axisMaximum(page,'rpCurveXMax',.05);
  await axisMaximum(page,'rpHeatXMax',.05);
  const before=await exportCalculation(page);
  const original=await geometry(page);
  expect(original.scale).toBe('lin');
  const assertOriginalRange=async()=>{
    const curve=await geometry(page),heat=await geometry(page,'heat');
    expect(curve.scale).toBe('lin');
    expect(curve.xMin).toBe(0);
    expect(curve.xMax).toBeCloseTo(.05,12);
    expect(heat.xMin).toBe(0);
    expect(heat.xMax).toBeCloseTo(.05,12);
    await expect(page.locator('#rpScaleLin')).toHaveClass(/active/);
    await expect(page.locator('#rpRestoreView')).toBeDisabled();
    await hoverCurve(page);
    await expect(readoutFor(page)).toHaveAttribute('data-mode','hover');
    expect((await reading(page)).waist).toBe(50);
  };
  await page.locator('#rpFocusWorkpoint').click();
  await page.locator('#rpScaleLog').click();
  expect((await geometry(page)).scale).toBe('log');
  await page.locator('#rpRestoreView').click();
  await assertOriginalRange();
  expect(await exportCalculation(page)).toEqual(before);

  await page.locator('#rpFocusWorkpoint').click();
  await page.locator('#rpScaleLog').click();
  expect((await geometry(page)).scale).toBe('log');
  await page.locator('#rpCalcP').fill('2');
  await expect(page.locator('#beamNormalizedSummary')).toHaveAttribute('data-status','valid');
  await assertOriginalRange();
  const changed=await exportCalculation(page);
  expect(changed.parameters.power_W).toBeCloseTo(.002,12);
  expect(changed.parameters.waist_m).toBeCloseTo(before.parameters.waist_m,12);
  expect(changed.transitionId).toBe(before.transitionId);
});

test('current power changes retain a fixed comparison while context changes or invalid inputs discard stale readings',async({page},testInfo)=>{
  await pinnedCurve(page,testInfo);
  const pinned=await reading(page);
  await page.locator('#rpCalcP').fill('4');
  await expect(readoutFor(page)).toHaveAttribute('data-mode','pinned');
  expect(await reading(page)).toEqual(pinned);
  await definitions(page);
  await page.locator('#beamPowerPlane').selectOption('upstream');
  await expect(page.locator('#beamNormalizedSummary')).toHaveAttribute('data-status','invalid');
  await expect(readoutFor(page)).toHaveAttribute('data-mode','empty');
  await expect(page.locator('#rpFocusWorkpoint')).toBeDisabled();
  await expect(page.locator('#rpReadoutNotice')).toContainText(/有效|输入|参数/);
  await page.locator('#beamTransmission').fill('80');
  await expect(page.locator('#rpFocusWorkpoint')).toBeEnabled();
  await page.locator('#rpCalcP').fill('0');
  await expect(page.locator('#rpFocusWorkpoint')).toBeDisabled();
  await expect(page.locator('#rpReadoutNotice')).toContainText(/零|正|大于/);
  await page.locator('#rpCalcP').fill('4');
  await pinnedCurve(page,testInfo);
  await page.locator('#levelDiagram .transition-line[data-id="T3"]').press('Enter');
  await expect(readoutFor(page)).toHaveAttribute('data-mode','empty');
  await expect(page.getByTestId('evidence-row-experiment')).toHaveAttribute('data-evidence-status','not-closed');
});
