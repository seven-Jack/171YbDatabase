import {test,expect} from '@playwright/test';
const state=(page,term)=>page.locator(`#levelDiagram .core-level-group[data-term="${term}"]`);
const panel=page=>page.locator('#hfsPanel');
async function settleScroll(page) { await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))); }
async function open(page,term) {
  await state(page,term).scrollIntoViewIfNeeded();
  await settleScroll(page);
  if (page.viewportSize().width<500) await state(page,term).locator('text').first().tap();
  else await state(page,term).focus();
  await expect(panel(page)).toBeVisible();
}
async function close(page) { await panel(page).locator('.hfs-close').click(); await expect(panel(page)).toBeHidden(); }
test.beforeEach(async({page})=>{await page.goto('./');await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');});

test('the complete SVG shows one selected Rydberg branch alongside the low-lying levels',async({page})=>{
  await expect(page.locator('#levelDiagram .transition-line')).toHaveCount(8);
  await expect(page.locator('#levelDiagram .core-level-group')).toHaveCount(8);
  await expect(page.locator('#levelDiagram .diagram-decay-detail')).toHaveCount(0);
});

test('hovering an upper level opens compact source-marked branching including the weak singlet',async({page})=>{
  await state(page,'³S₁').scrollIntoViewIfNeeded();
  await settleScroll(page);
  if (page.viewportSize().width<500) await state(page,'³S₁').locator('text').first().tap();
  else await state(page,'³S₁').hover();
  const card=panel(page).locator('.diagram-decay-detail');
  await expect(card).toBeVisible();
  await expect(card.locator('.diagram-decay-row')).toHaveCount(4);
  await expect(card.locator('[data-decay-lower="yb171-6s6p-1p1"]')).toContainText('0.21 ± 0.09%');
  await expect(card.locator('.diagram-decay-kind')).toHaveText('理论');
  await expect(card.locator('.diagram-decay-heading a').first()).toHaveAttribute('href',/^https:\/\//);
  await expect(card.locator('.diagram-decay-evidence')).not.toHaveAttribute('open','');
  const links=await card.locator('.diagram-decay-heading a').allTextContents();
  expect(links).toEqual(['[1]','[19]']);
});

test('3D1 keeps three unrenormalized model fractions, and evidence expands within the hover viewport',async({page})=>{
  await open(page,'³D₁');
  const card=panel(page).locator('.diagram-decay-detail');
  await expect(card.locator('.diagram-decay-row')).toHaveCount(3);
  await expect(card).toContainText('63.8 ± 2.7%');
  await expect(card).toContainText('35.2 ± 2.7%');
  await expect(card).toContainText('0.99 ± 0.39%');
  await card.locator('summary').click();
  await expect(card).toContainText('0.9999');
  await expect(card).toContainText('不是指定 F、mF');
  await expect(card).toContainText('Table 12');
  const b=await panel(page).boundingBox();
  expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);
  expect(b.y+b.height).toBeLessThanOrEqual(page.viewportSize().height-8);
  expect(b.width).toBeLessThanOrEqual(304.5);
});

test('pending 3P2 and 65S do not inherit other-state fractions, and measured partial rates stay separate',async({page})=>{
  await open(page,'³P₂');
  let card=panel(page).locator('.diagram-decay-detail');
  await expect(card).toContainText('β 待核查');
  await expect(card).toContainText('F=3/2 与 F=5/2');
  await card.locator('summary').click();
  await expect(card).toContainText('部分衰变率 · 不是分支比');
  await expect(card).toContainText('0.0918 s⁻¹');
  await expect(card).toContainText('ΔF=2');
  await close(page);
  await open(page,'65S · F′=3/2');
  await expect(panel(page)).toContainText('R017 零场模型');
  await expect(panel(page).locator('.diagram-decay-detail')).toHaveCount(0);
});

test('ground, clock approximation and measured HFI rate remain different statuses',async({page})=>{
  await open(page,'¹S₀');
  await expect(panel(page).locator('.diagram-decay-kind')).toHaveText('不适用');
  await close(page);
  await open(page,'³P₀');
  const card=panel(page).locator('.diagram-decay-detail');
  await expect(card.locator('.diagram-decay-kind')).toHaveText('近似');
  await expect(card).toContainText('≈1（低能模型）');
  await card.locator('summary').click();
  await expect(card).toContainText('HFI-E1 → ¹S₀ · 实验');
  await expect(card).toContainText('0.0442 ± 0.0035 s⁻¹');
  await expect(card).toContainText('固态 Ne');
});

test('all state cards keep HFS, complete mF lists and a viewport-bounded layout',async({page})=>{
  for(const term of ['¹S₀','¹P₁','³P₀','³P₁','³P₂','³D₁','³S₁']) {
    await open(page,term);
    await expect(panel(page).locator('.diagram-hfs-detail')).toBeVisible();
    await expect(panel(page).locator('.hfs-mf-state').first()).toBeVisible();
    await expect(panel(page).locator('.diagram-decay-detail')).toHaveCount(1);
    const lifetime=panel(page).locator('.diagram-level-data .diagram-detail-row').filter({hasText:'寿命 τ'});
    if(term==='³P₂') {
      await expect(lifetime.locator('a')).toHaveAttribute('href','#diagram-source-mishra-2001-jqsrt');
      await expect(panel(page).locator('.diagram-level-data .diagram-detail-row').filter({hasText:'能量 E'}).locator('a')).toHaveAttribute('href','#diagram-source-qiao-2023-rinp');
    }
    const b=await panel(page).boundingBox();
    expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(page.viewportSize().width);
    expect(b.y+b.height).toBeLessThanOrEqual(page.viewportSize().height-8);
    await close(page);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('expanding evidence, changing levels and collapsing again preserve the card viewport bounds',async({page})=>{
  await open(page,'³P₂');
  await panel(page).locator('.diagram-decay-evidence > summary').click();
  for(const term of ['¹S₀','³S₁','³P₂','³D₁']) {
    await state(page,term).scrollIntoViewIfNeeded();await settleScroll(page);
    if(page.viewportSize().width<500)await state(page,term).locator('text').first().tap();
    else await state(page,term).focus();
    await expect(panel(page)).toBeVisible();
    const card=panel(page).locator('.diagram-decay-detail');
    await expect(card).toBeVisible();
    for(const expand of [true,false]) {
      await card.locator('summary').click();
      if(expand)await expect(card.locator('details')).toHaveAttribute('open','');
      else await expect(card.locator('details')).not.toHaveAttribute('open','');
      const box=await panel(page).boundingBox();
      expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize().height-8);
    }
  }
});
