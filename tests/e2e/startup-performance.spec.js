import {test,expect} from '@playwright/test';

test('built preloads and startup metrics preserve one initialization and the complete diagram',async({page})=>{
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-app-stage','ready');
  const initial=await page.evaluate(()=>({
    imports:[...document.querySelectorAll('link[rel="modulepreload"]')].map(link=>link.getAttribute('href')),
    metrics:{...document.documentElement.dataset},
    diagram:document.getElementById('levelDiagram').innerHTML,
    starts:performance.getEntriesByName('yb171:startup-start').length,
  }));
  expect(initial.imports).toContain('src/main.js');
  expect(initial.imports).toContain('src/bootstrap.js');
  expect(initial.imports).not.toContain('src/ui/transition-explorer.js');
  expect(initial.imports).not.toContain('src/ui/chart-export.js');
  expect(new Set(initial.imports).size).toBe(initial.imports.length);
  for(const name of ['appStartupMs','appImportMs','appInitMs','appNavigationReadyMs'])expect(Number(initial.metrics[name])).toBeGreaterThanOrEqual(0);
  expect(Number(initial.metrics.appStartupMs)).toBeCloseTo(Number(initial.metrics.appImportMs)+Number(initial.metrics.appInitMs),1);
  expect(initial.starts).toBe(1);
  expect(await page.evaluate(async()=>{const module=await import(new URL('./src/bootstrap.js',location.href));return module.startApplication();})).toBe(true);
  expect(await page.locator('#levelDiagram').innerHTML()).toBe(initial.diagram);
  await expect(page.locator('#levelDiagram .transition-line')).toHaveCount(8);
  expect(await page.evaluate(()=>performance.getEntriesByName('yb171:startup-start').length)).toBe(1);
});

test('failed module loading remains unavailable until a user-triggered reload succeeds',async({page})=>{
  let fail=true;
  await page.route('**/src/main.js',async route=>{if(fail)await route.abort('failed');else await route.continue();});
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','error');
  await expect(page.locator('html')).toHaveAttribute('data-app-failed-stage','loading-main');
  await expect(page.locator('#appError')).toBeVisible();
  await expect(page.locator('#appWorkspace')).toHaveAttribute('inert','');
  fail=false;
  await page.locator('#appRetry').click();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  await expect(page.locator('#appError')).toBeHidden();
  await expect(page.locator('#appWorkspace')).not.toHaveAttribute('inert');
  await expect(page.locator('#levelDiagram .transition-line')).toHaveCount(8);
});

test('a slow pending load exposes manual recovery and clears delayed controls after readiness',async({page})=>{
  await page.clock.install();
  let release;
  const pending=new Promise(resolve=>{release=resolve;});
  await page.route('**/src/main.js',async route=>{await pending;await route.continue();});
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','loading');
  await page.clock.fastForward(5100);
  await expect(page.locator('#appLoading')).toContainText('仍在加载');
  await page.clock.fastForward(10100);
  await expect(page.locator('#appLoading .startup-reload')).toBeVisible();
  release();
  await page.clock.resume();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  await expect(page.locator('#appLoading')).toBeHidden();
  await expect(page.locator('.startup-reload')).toHaveCount(0);
  await page.clock.fastForward(30000);
  await expect(page.locator('#appLoading')).toBeHidden();
  await expect(page.locator('#appError')).toBeHidden();
});
