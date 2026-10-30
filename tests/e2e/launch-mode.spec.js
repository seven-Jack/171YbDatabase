import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {readdirSync} from 'node:fs';

const {createPreviewServer}=createRequire(import.meta.url)('../../scripts/preview.cjs');

test('file launch explains the browser restriction and opens HTTP without importing modules',async({page})=>{
  const modules=[];
  const errors=[];
  page.on('request',request=>{if(new URL(request.url()).pathname.endsWith('.js'))modules.push(request.url());});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(new URL('../../dist/index.html',import.meta.url).href);
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','local-preview-required');
  await expect(page.locator('#appError')).toContainText('当前通过 file:// 打开');
  await expect(page.locator('#appLoading')).toBeHidden();
  await expect(page.locator('#appWorkspace')).toHaveAttribute('inert','');
  const preview=page.locator('#filePreviewNotice a');
  await expect(preview).toBeVisible();
  const destination=await preview.getAttribute('href');
  expect(new URL(destination).origin).toBe('http://localhost:8766');
  expect(modules).toEqual([]);
  expect(errors).toEqual([]);
  // Intercept only the destination so this navigation check needs no second server.
  await page.route('http://localhost:8766/**',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:'<p>本地预览入口已打开</p>'}));
  await page.getByRole('button',{name:'打开本地预览',exact:true}).click();
  await expect(page).toHaveURL(destination);
  await expect(page.getByText('本地预览入口已打开')).toBeVisible();
});

test('local preview survives concurrent module requests and renders the eight transitions',async({page},testInfo)=>{
  const server=createPreviewServer();
  await new Promise((resolve,reject)=>{
    server.once('error',reject);
    server.listen({host:'127.0.0.1',port:0,backlog:511},resolve);
  });
  const origin=`http://127.0.0.1:${server.address().port}`;
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try {
    const modules=readdirSync(new URL('../../dist/src/ui/',import.meta.url)).filter(name=>name.endsWith('.js'));
    // Exercise the burst of module imports that previously reset preview connections.
    await Promise.all(modules.flatMap(name=>[name,name]).map(async name=>{
      const response=await fetch(`${origin}/src/ui/${name}`,{signal:AbortSignal.timeout(5000)});
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/javascript');
      expect(response.headers.get('cache-control')).toContain('no-store');
      expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
    }));
    await page.goto(`${origin}/index.html`);
    await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
    await expect(page.locator('#levelDiagram .transition-line')).toHaveCount(8);
    await expect(page.locator('#appWorkspace')).not.toHaveAttribute('inert');
    await expect(page.locator('#appWorkspace')).toHaveAttribute('aria-busy','false');
    await expect(page.locator('#filePreviewNotice')).toBeHidden();
    await expect(page.locator('#appError')).toBeHidden();
    expect(errors).toEqual([]);
    expect((await fetch(`${origin}/references/papers/1.pdf`)).status).toBe(404);
    const head=await fetch(`${origin}/src/ui/diagram-placement.js`,{method:'HEAD'});
    expect(head.status).toBe(200);
    expect(Number(head.headers.get('content-length'))).toBeGreaterThan(0);
    expect(await head.text()).toBe('');
    await page.locator('#secLevel').scrollIntoViewIfNeeded();
    await page.screenshot({path:testInfo.outputPath('preview-loaded.png')});
  } finally {
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
  }
});
