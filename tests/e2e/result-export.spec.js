import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {rabiHz} from '../../src/physics/rabi.js';

const problems=new WeakMap();
const goRabi=page=>page.locator('#sectionNav a[href="#secRabi"]').click();
async function menu(page,id){const details=page.locator('#'+id);if(await details.getAttribute('open')===null)await details.locator(':scope > summary').click();return details;}
async function download(page,id){const pending=page.waitForEvent('download');await page.locator('#'+id).click();const value=await pending;return{filename:value.suggestedFilename(),bytes:await readFile(await value.path())};}
async function record(page){await menu(page,'calculationRecordExport');return JSON.parse((await download(page,'recordExportJSON')).bytes.toString('utf8'));}
async function config(page){const value=JSON.parse((await download(page,'configExport')).bytes.toString('utf8'));delete value.exportedAt;return value;}
async function chart(page,kind,format){await menu(page,kind+'ChartExport');return download(page,kind+'Export'+format.toUpperCase());}
async function svgDocument(page,bytes){return page.evaluate(text=>{const doc=new DOMParser().parseFromString(text,'image/svg+xml');if(doc.querySelector('parsererror'))throw Error('Invalid SVG XML');return{width:Number(doc.documentElement.getAttribute('width')),height:Number(doc.documentElement.getAttribute('height')),metadata:JSON.parse(doc.querySelector('metadata').textContent),images:doc.querySelectorAll('image').length,polylines:doc.querySelectorAll('polyline').length,legend:doc.querySelectorAll('.export-legend-item').length,text:doc.documentElement.textContent};},bytes.toString('utf8'));}
function parseCSV(input){
  const text=input.replace(/^\uFEFF/,''),rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}
  return rows.slice(1).map(values=>Object.fromEntries(rows[0].map((key,index)=>[key,values[index]])));
}
function close(actual,expected){expect(Math.abs(actual-expected)/Math.max(1e-30,Math.abs(expected))).toBeLessThan(1e-9);}
async function choose(page,id,key){await page.locator(`#levelDiagram .transition-line[data-id="${id}"]`).press('Enter');if(key)await page.locator(`#hfCGTableBody [data-channel-key="${key}"]`).click();await goRabi(page);}

test.beforeEach(async({page})=>{
  const errors=[];problems.set(page,errors);page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400&&/\.(?:js|json|css|csv)(?:\?|$)/.test(response.url()))errors.push(`${response.status()} ${response.url()}`);});
  await page.goto('./');await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');await goRabi(page);
});
test.afterEach(async({page})=>{expect(problems.get(page),'No production exception or missing export resource').toEqual([]);});

test('current-point CSV preserves the actual canonical channel and leaves M5 configuration unchanged',async({page})=>{
  const before=await config(page),reference=await record(page);
  await menu(page,'calculationRecordExport');const saved=await download(page,'recordExportCSV'),rows=parseCSV(saved.bytes.toString('utf8'));
  expect(saved.filename).toMatch(/T2.*\.csv$/);expect(rows).toHaveLength(1);
  close(Number(rows[0].frequency_Hz),reference.configuration.result.frequency_Hz);
  close(Number(rows[0].atom_component_power_W),reference.configuration.parameters.power_W);
  expect(Number(rows[0].mF)).toBe(reference.resolvedChannel.m);expect(Number(rows[0].q)).toBe(reference.resolvedChannel.q);
  expect(rows[0].source_id).toBe(reference.primaryQuantity.sourceId);expect(rows[0].dipole_convention).toBe('J-reduced');
  expect(rows[0].total_rabi_uncertainty_status).toBe('not-established');expect(await config(page)).toEqual(before);
  expect(saved.bytes.toString('utf8')).not.toMatch(/\/Users\/|file:\/\/|references\/papers\//);
});

test('all solve directions export M1 upstream total power and diameter as separate raw and normalized values',async({page})=>{
  await choose(page,'T3','0.5|-0.5|0.5|0.5|1');
  await menu(page,'beamDefinitionSettings');
  await page.locator('#beamPowerPlane').selectOption('upstream');await page.locator('#beamTransmission').fill('80');
  await page.locator('#beamPowerBasis').selectOption('linear-total');await page.locator('#beamLinearOrientation').selectOption('perpendicular');
  await page.locator('#beamSizeKind').selectOption('diameter');
  await page.locator('.rp-calc-unit[data-field="power"]').selectOption('mW');await page.locator('.rp-calc-unit[data-field="waist"]').selectOption('µm');
  await page.locator('#rpCalcP').fill('1');await page.locator('#rpCalcW').fill('100');
  for(const direction of ['rabi','power','waist']){
    await page.locator('#calcSolveFor').selectOption(direction);const reference=await record(page);
    await menu(page,'calculationRecordExport');const row=parseCSV((await download(page,'recordExportCSV')).bytes.toString('utf8'))[0];
    const expected=reference.configuration;
    expect(row.solve_for).toBe(direction);
    // In inverse modes the six-significant-digit UI target is the actual input.
    // CSV must preserve that direction's current solved state, not the earlier forward point.
    expect(Number(row.entered_power_W)).toBe(expected.enteredParameters.power_W);
    expect(Number(row.entered_size_m)).toBe(expected.enteredParameters.size_m);
    expect(Number(row.atom_component_power_W)).toBe(expected.parameters.power_W);
    expect(Number(row.intensity_radius_m)).toBe(expected.parameters.waist_m);
    expect(row.power_plane).toBe('upstream');expect(row.power_basis).toBe('linear-total');
    expect(row.linear_orientation).toBe('perpendicular');expect(row.size_definition).toBe('diameter');expect(Number(row.q)).toBe(1);
    expect(Number(row.transmission)).toBe(.8);
    close(Number(row.atom_component_power_W),Number(row.entered_power_W)*.8*.5);
    close(Number(row.intensity_radius_m),Number(row.entered_size_m)/2);
    if(direction==='rabi'){
      close(Number(row.entered_power_W),.001);close(Number(row.entered_size_m),100e-6);
      close(Number(row.atom_component_power_W),.0004);close(Number(row.intensity_radius_m),50e-6);
    }
    close(Number(row.frequency_Hz),reference.configuration.result.frequency_Hz);expect(row.source_id).toBe('internal-t3-20260908');
  }
});

test('copying summary reports clipboard success honestly and provides a selected fallback when blocked',async({page})=>{
  const before=await config(page),reference=await record(page);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedResult=text;}}}));
  await menu(page,'calculationRecordExport');await page.locator('#recordCopySummary').click();
  await expect(page.getByTestId('config-status')).toContainText('已复制 T2');
  const text=await page.evaluate(()=>window.__copiedResult);expect(text).toContain(`mF=${reference.resolvedChannel.m<0?'-':''}1/2`);expect(text).toContain('非独立实验验证');expect(text).toContain('f_q=1');
  expect(await config(page)).toEqual(before);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('blocked');}}}));
  await menu(page,'calculationRecordExport');await page.locator('#recordCopySummary').click();
  await expect(page.locator('#recordCopyFallback')).toBeVisible();await expect(page.locator('#recordCopyFallback')).toBeFocused();
  await expect(page.getByTestId('config-status')).toContainText('手动复制');
  expect(await page.locator('#recordCopyFallback').inputValue()).toContain('来源=');
  await page.locator('#rpCalcP').fill('-1');await menu(page,'calculationRecordExport');
  await expect(page.locator('#recordCopyFallback')).toBeHidden();await expect(page.locator('#recordCopySummary')).toBeDisabled();
});

test('curve SVG reflects log axes, shared units, hidden series and a pinned model reading with a coloured legend',async({page})=>{
  await page.locator('#rpCurveXUnit').selectOption('W');await page.locator('#rpCurveYUnit').selectOption('kHz');await page.locator('#rpScaleLog').click();
  await page.locator('#rpLegend .lg-unit[data-idx="0"]').click();await page.locator('#rpFocusWorkpoint').click();
  const reference=await record(page),canvas=page.locator('#rpCurveCanvas'),box=await canvas.boundingBox();
  const g=await canvas.evaluate(el=>({...el.dataset}));
  const P=reference.configuration.parameters.power_W*1000*Number(g.xFactor),x=Number(g.plotLeft)+(Math.log10(P)-Math.log10(Number(g.xMin)))/(Math.log10(Number(g.xMax))-Math.log10(Number(g.xMin)))*Number(g.plotWidth);
  const y=Number(g.plotTop)+Number(g.plotHeight)-reference.configuration.result.frequency_Hz/1e6*Number(g.yFactor)/Number(g.yMax)*Number(g.plotHeight);
  await page.mouse.move(box.x+x,box.y+y);await canvas.click({position:{x,y}});await expect(page.locator('#rpCurveReadout')).toHaveAttribute('data-mode','pinned');
  const before=await config(page),saved=await chart(page,'curve','svg'),parsed=await svgDocument(page,saved.bytes);
  expect(parsed.polylines).toBe(5);expect(parsed.legend).toBe(5);expect(parsed.images).toBe(0);
  expect(parsed.metadata.view.geometry.scale).toBe('log');expect(parsed.metadata.view.geometry.pUnit).toBe('W');expect(parsed.metadata.view.geometry.rUnit).toBe('kHz');
  expect(parsed.metadata.view.visibleWaists_um).not.toContain(25);expect(parsed.metadata.view.visibleSeries.every(item=>item.color)).toBe(true);
  expect(parsed.metadata.view.pinned).toBeTruthy();close(parsed.metadata.record.configuration.result.frequency_Hz,reference.configuration.result.frequency_Hz);
  expect(await config(page)).toEqual(before);
});

test('heat SVG and 2x PNG include axes and quantile bounds while grid CSV preserves unsaturated values',async({page})=>{
  const reference=await record(page),svg=await chart(page,'heat','svg'),parsed=await svgDocument(page,svg.bytes);
  expect(parsed.images).toBe(2);expect(parsed.text).toContain('2%–98%');expect(parsed.text).toContain('≤');expect(parsed.text).toContain('≥');expect(parsed.text).toContain('采样位图');
  const png=await chart(page,'heat','png');expect([...png.bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  expect(png.bytes.readUInt32BE(16)).toBe(parsed.width*2);expect(png.bytes.readUInt32BE(20)).toBe(parsed.height*2);
  const csv=await chart(page,'heat','csv'),rows=parseCSV(csv.bytes.toString('utf8'));expect(rows).toHaveLength(15000);
  const last=rows.at(-1),g=parsed.metadata.view.geometry;
  close(Number(last.frequency_Hz),rabiHz(reference.resolvedChannel.dEff_ea0,g.Pmax/g.pf,g.Wmax/g.wf));
  expect(rows.some(row=>Number(row.frequency_Hz)>Number(row.color_high_Hz)&&row.color_saturated==='true')).toBe(true);
  expect(JSON.parse(rows[0].context_json).primaryQuantity.sourceId).toBe(reference.primaryQuantity.sourceId);
});

test('invalid and unsupported inputs disable every new export while zero power remains exportable',async({page})=>{
  await page.locator('#rpCalcP').fill('');await menu(page,'calculationRecordExport');await expect(page.locator('#recordExportCSV')).toBeDisabled();await expect(page.locator('#recordCopySummary')).toBeDisabled();
  await menu(page,'curveChartExport');await expect(page.locator('#curveExportPNG')).toBeDisabled();await expect(page.locator('#curveExportSVG')).toBeDisabled();
  await page.locator('#rpCalcP').fill('0');await menu(page,'calculationRecordExport');
  const zero=parseCSV((await download(page,'recordExportCSV')).bytes.toString('utf8'))[0];expect(zero.frequency_Hz).toBe('0');expect(zero.pi_time_s).toBe('infinity');
  const svg=await chart(page,'curve','svg'),parsed=await svgDocument(page,svg.bytes);expect(parsed.metadata.record.configuration.result.frequency_Hz).toBe(0);expect(parsed.text).toContain('零耦合');
  await choose(page,'T4');await menu(page,'heatChartExport');await expect(page.locator('#heatExportPNG')).toBeDisabled();await expect(page.locator('#heatExportCSV')).toBeDisabled();
});

test('the lazy renderer keeps the click-time chart and record together if inputs change while it loads',async({page})=>{
  const before=await record(page);let release;
  const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/src/ui/chart-export.js',async route=>{await gate;await route.continue();});
  const requested=page.waitForRequest('**/src/ui/chart-export.js'),pending=page.waitForEvent('download');
  await menu(page,'curveChartExport');await page.locator('#curveExportSVG').click();await requested;
  await page.locator('#rpCalcP').fill('4');release();
  const downloaded=await pending,bytes=await readFile(await downloaded.path()),parsed=await svgDocument(page,bytes);
  close(parsed.metadata.record.configuration.parameters.power_W,before.configuration.parameters.power_W);
  close(parsed.metadata.record.configuration.result.frequency_Hz,before.configuration.result.frequency_Hz);
  const current=await record(page);close(current.configuration.parameters.power_W,4e-3);
});

test('both export menus stay keyboard accessible and preserve matched plots without page overflow',async({page})=>{
  for(const kind of ['curve','heat']){
    const details=await menu(page,kind+'ChartExport');const panel=details.locator('.chart-result-export-panel');await expect(panel).toBeVisible();
    const box=await panel.boundingBox(),width=page.viewportSize().width;expect(box.x).toBeGreaterThanOrEqual(-1);expect(box.x+box.width).toBeLessThanOrEqual(width+1);
    await page.locator('#'+kind+'ExportSVG').focus();await page.keyboard.press('Escape');await expect(details).not.toHaveAttribute('open');await expect(details.locator(':scope > summary')).toBeFocused();
  }
  const sizes=await page.locator('#rpCurveCanvas,#rpHeatCanvas').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return{width:r.width,height:r.height};}));
  expect(Math.abs(sizes[0].width-sizes[1].width)).toBeLessThanOrEqual(1);expect(Math.abs(sizes[0].height-sizes[1].height)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(page.viewportSize().width);
});
