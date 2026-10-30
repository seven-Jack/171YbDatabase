import {test,expect} from '@playwright/test';

// Kroeze v2 PDF Tables8/10/12/13/14: P=1mW, D=1mm, hence w0=500um.
// Resolve polarization from the printed sublevels instead of the conflicting q=0 label.
const cases=[
  {id:'T1',channel:'0.5|0.5|1.5|1.5|1',pol:'σ⁺',paperMHz:42.44,uncertaintyMHz:.04,forward:'42.4355'},
  {id:'T2',channel:'0.5|0.5|1.5|1.5|1',pol:'σ⁺',paperMHz:5.523,uncertaintyMHz:.006,forward:'5.52367'},
  {id:'T5',channel:'0.5|0.5|1.5|1.5|1',pol:'σ⁺',paperMHz:28.3,uncertaintyMHz:.8,forward:'28.2426'},
  {id:'T6',channel:'0.5|0.5|1.5|1.5|1',pol:'σ⁺',paperMHz:20.0,uncertaintyMHz:1.6,forward:'20.0563'},
  {id:'T7',channel:'2.5|2.5|1.5|1.5|-1',pol:'σ⁻',paperMHz:39.5,uncertaintyMHz:2.6,forward:'39.5523'},
];
const unitSelector=field=>`.rp-calc-unit[data-field="${field}"]`;
const powerToMilliwatts={W:1000,mW:1,'µW':.001,nW:1e-6};
const waistToMicrometres={mm:1000,'µm':1,nm:.001};

for(const item of cases)test(`${item.id}: low-state paper channel and forward/inverse Rabi-power results`,async({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{
    if(response.status()>=400&&/\.(?:js|json|css|csv)(?:\?|$)/.test(response.url()))errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('index.html');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  const line=page.locator(`#levelDiagram .transition-line[data-id="${item.id}"]`);
  await line.press('Enter');
  await expect(page).toHaveURL(/#secCalc$/);
  await expect(line).toHaveAttribute('aria-pressed','true');
  const channel=page.locator(`#hfCGTableBody [data-channel-key="${item.channel}"]`);
  await channel.click();
  await expect(page).toHaveURL(/#secRabi$/);
  await expect(channel).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#selectionContext')).toHaveAttribute('data-selection-transition',item.id);
  await expect(page.locator('#selectionContext .selection-context-channel')).toContainText(item.id==='T7'?'F=5/2, mF=+5/2':'F=1/2, mF=+1/2');
  await expect(page.locator('#selectionContext .selection-context-channel')).toContainText(`mF′=+3/2 · ${item.pol}`);
  await expect(page.locator('[data-workflow-object="result"]')).toContainText(item.id);

  await page.locator('#calcSolveFor').selectOption('rabi');
  await page.locator('#powerAxisConvention').selectOption('component');
  await page.locator(unitSelector('power')).selectOption('mW');
  await page.locator(unitSelector('waist')).selectOption('µm');
  await page.locator('#rpCalcP').fill('1');
  await page.locator('#rpCalcW').fill('500');
  await expect(page.locator(unitSelector('rabi'))).toHaveValue('MHz');
  await expect(page.locator('#rpCalcR')).toHaveValue(item.forward);
  await expect(page.locator('#rabiResult strong')).toHaveText(`${item.forward} MHz`);
  expect(Math.abs(Number(await page.locator('#rpCalcR').inputValue())-item.paperMHz)).toBeLessThan(item.uncertaintyMHz);

  // Use the paper's printed central value in both inverse directions; this is a
  // source-consistency check, not an independent experimental validation.
  await page.locator('#calcSolveFor').selectOption('power');
  await page.locator('#rpCalcR').fill(String(item.paperMHz));
  await expect(page.locator('#rpCalcP')).toHaveAttribute('readonly','');
  const powerUnit=await page.locator(unitSelector('power')).inputValue();
  expect(Object.hasOwn(powerToMilliwatts,powerUnit)).toBe(true);
  const power=Number(await page.locator('#rpCalcP').inputValue())*powerToMilliwatts[powerUnit];
  expect(Math.abs(power-1)).toBeLessThan(2*item.uncertaintyMHz/item.paperMHz);

  await page.locator('#calcSolveFor').selectOption('waist');
  await page.locator(unitSelector('power')).selectOption('mW');
  await page.locator('#rpCalcP').fill('1');
  await page.locator('#rpCalcR').fill(String(item.paperMHz));
  await expect(page.locator('#rpCalcW')).toHaveAttribute('readonly','');
  const waistUnit=await page.locator(unitSelector('waist')).inputValue();
  expect(Object.hasOwn(waistToMicrometres,waistUnit)).toBe(true);
  const waist=Number(await page.locator('#rpCalcW').inputValue())*waistToMicrometres[waistUnit];
  expect(Math.abs(waist-500)).toBeLessThan(500*item.uncertaintyMHz/item.paperMHz);

  await page.locator('#calcSolveFor').selectOption('rabi');
  await page.locator(unitSelector('waist')).selectOption('µm');
  await page.locator('#rpCalcW').fill('500');
  await expect(page.locator('#rpCalcR')).toHaveValue(item.forward);
  await expect(page.locator('#inputError')).toBeHidden();
  await expect(page.locator('#rabiResult .result-validation')).toContainText('未独立验证');
  expect(errors).toEqual([]);
  await page.locator('#sectionNav a[href="#secRabi"]').click();
  await page.screenshot({path:testInfo.outputPath(`${item.id.toLowerCase()}-low-state-rabi.png`)});
});
