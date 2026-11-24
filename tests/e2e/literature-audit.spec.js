import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.goto('index.html');
  await expect(page.locator('#levelDiagram .transition-line')).toHaveCount(8);
});

test('each indexed literature entry keeps its stable source anchor and verified original link',async({page})=>{
  const results=await page.evaluate(async()=>{
    const {CATALOG}=await import('./src/data/catalog.js');
    return CATALOG.sources.references.map(({id,url})=>{
      const matches=[...document.querySelectorAll('[id]')].filter(element=>element.id===`diagram-source-${id}`);
      return {id,url,count:matches.length,actualURL:matches[0]?.querySelector('a.ref-original')?.getAttribute('href')||null};
    });
  });
  for(const result of results) {
    expect(result.count,result.id).toBe(1);
    if(result.url?.startsWith('https://')) expect(result.actualURL,result.id).toBe(result.url);
  }
});

test('the methods title opens and closes its contents independently of the bibliography', async ({page}) => {
  const methods = page.locator('#secReference > details');
  const summary = methods.locator(':scope > summary');
  const rules = methods.getByText('选择定则', {exact: true});
  await page.locator('#sectionNav').getByRole('link', {name: '方法与约定'}).click();
  await expect(summary).toBeInViewport();
  await expect(methods).toHaveJSProperty('open', false);
  await expect(rules).toBeHidden();
  await summary.getByText('方法与约定', {exact: true}).click();
  await expect(rules).toBeVisible();
  await expect(page.locator('#bibliographyDisclosure')).toHaveJSProperty('open', false);
  await summary.click();
  await expect(rules).toBeHidden();
  await summary.press('Enter');
  await expect(rules).toBeVisible();
  await summary.press('Space');
  await expect(rules).toBeHidden();
  await expect(summary).toBeFocused();
});

test('the bibliography starts collapsed, supports keyboard toggling and reveals a cited paper', async ({page}) => {
  const disclosure = page.locator('#bibliographyDisclosure');
  const summary = disclosure.locator(':scope > summary');
  const paper = page.locator('#diagram-source-ref-04');
  await page.locator('#secReference > details > summary').click();
  await page.locator('#secReference a[href="#secBibliography"]').click();
  await expect(summary).toBeInViewport();
  await expect(disclosure).toHaveJSProperty('open', false);
  await expect(paper).toBeHidden();
  await summary.press('Enter');
  await expect(paper.locator('.ref-original')).toBeVisible();
  await summary.press('Space');
  await expect(paper).toBeHidden();
  await expect(summary).toBeFocused();

  await page.locator('#secReference .state-conventions > summary').click();
  await page.getByRole('link', {name: '核自旋编码文献'}).click();
  await expect(page).toHaveURL(/#diagram-source-ref-04$/);
  await expect(disclosure).toHaveJSProperty('open', true);
  await expect(paper.locator('.ref-author')).toBeInViewport();
});

test('a direct source link reveals the nested provenance record on first load', async ({page}) => {
  const id = 'diagram-source-internal-t2-calibration';
  await page.goto(`./#${id}`);
  const record = page.locator(`#${id}`);
  await expect(page.locator('#bibliographyDisclosure')).toHaveJSProperty('open', true);
  await expect(record.locator('strong')).toBeInViewport();
});

test('browser adopts T2 literature dipole while retaining clock and wavelength source conflicts',async({page})=>{
  const data=await page.evaluate(async()=>{
    const {getQuantity}=await import('./src/data/catalog.js');
    return {t2:getQuantity('T2','d_num'),t3:getQuantity('T3','oscillator_strength_f_num'),t7:getQuantity('T7','wavelength_vac_nm')};
  });
  expect(data.t2.value).toBe(.5398);
  expect(data.t2.uncertainty).toBe(.0006);
  expect(data.t2.sourceId).toBe('ref-01');
  expect(data.t3.value).toBeNull();
  expect(data.t7.evidenceKind).toBe('derived');
  expect(data.t7.reviewStatus).toBe('conflict-unresolved');
});

test('state table and production array omit unsupported lifetime and interaction predictions',async({page})=>{
  await page.locator('#data-tab-states').click();
  const table=page.locator('table[data-table="states"]');
  await expect(table.locator('tbody tr')).toHaveCount(21);
  for(const column of ['lifetime_us','C6_ghz_um6','blockade_um']) {
    const cells=table.locator(`tbody td[data-column="${column}"]`);
    await expect(cells).toHaveCount(21);
    expect(await cells.allTextContents()).toEqual(Array(21).fill('—'));
  }
  const rows=await page.evaluate(async()=>{
    const {ESTIMATE_CONFIG}=await import('./src/data/catalog.js');
    const {generateRydbergStates}=await import('./src/physics/estimates.js');
    return generateRydbergStates(ESTIMATE_CONFIG);
  });
  expect(rows.every(row=>row.lifetime_us===null&&row.C6_ghz_um6===null&&row.blockade_um===null)).toBe(true);
});
