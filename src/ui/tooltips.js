import { formatLifetime } from './format.js';
export function createTooltips() {
const tooltip = document.getElementById('tooltip');

function showTooltip(e, t, isCore) {
  const clsLabel = t.classification.startsWith('强') ? '强 E1' : t.classification.startsWith('弱') ? '弱 intercombination' : t.classification;
  let rows = '';
  if (isCore) {
    rows = `
      <div class="tt-row"><span class="tt-key">跃迁</span><span class="tt-val">${t.lower} → ${t.upper}</span></div>
      <div class="tt-row"><span class="tt-key">波长 (真空)</span><span class="tt-val">${t.approximate ? '≈' + t.wavelength_vac_nm.toFixed(2) : t.wavelength_vac_nm.toFixed(4)} nm</span></div>
      <div class="tt-row"><span class="tt-key">频率</span><span class="tt-val">${t.frequency_THz.toFixed(5)} THz</span></div>
      <div class="tt-row"><span class="tt-key">线宽</span><span class="tt-val">${t.linewidth_FWHM}</span></div>
      <div class="tt-row"><span class="tt-key">寿命</span><span class="tt-val">${formatLifetime(t.lifetime_ns)}</span></div>
      <div class="tt-row"><span class="tt-key">振子强度</span><span class="tt-val">${t.oscillator_strength_f}</span></div>
      <div class="tt-row"><span class="tt-key">矩阵元</span><span class="tt-val">${t.d_reduced_ea0} ea₀${t.approximate ? "（This work，J 级约化量）" : ""}</span></div>
      <div class="tt-row"><span class="tt-key">多极性</span><span class="tt-val">${t.multipole}</span></div>
      <div class="tt-row"><span class="tt-key">强度</span><span class="tt-val">${clsLabel}</span></div>
    `;
  } else {
    rows = `
      <div class="tt-row"><span class="tt-key">跃迁</span><span class="tt-val">${t.label}</span></div>
      <div class="tt-row"><span class="tt-key">波长</span><span class="tt-val">${t.wavelength_vac_nm} nm</span></div>
      <div class="tt-row"><span class="tt-key">ΔE</span><span class="tt-val">${t.energy_cm} cm⁻¹</span></div>
      <div class="tt-row"><span class="tt-key">n</span><span class="tt-val">${t.n}</span></div>
      <div class="tt-row"><span class="tt-key">激发方式</span><span class="tt-val">${t.excitation}</span></div>
      <div class="tt-row"><span class="tt-key">强度</span><span class="tt-val">${clsLabel}</span></div>
    `;
  }
  tooltip.innerHTML = `
    <div class="tt-title" style="color:${t.color}">${t.id} · ${t.label}</div>
    ${rows}
  `;
  tooltip.classList.add('show');
  moveTooltip(e);
}

function moveTooltip(e) {
  const x = e.clientX + 14;
  const y = e.clientY + 14;
  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;
  const px = Math.min(x, window.innerWidth - tw - 8);
  const py = Math.min(y, window.innerHeight - th - 8);
  tooltip.style.left = px + 'px';
  tooltip.style.top = py + 'px';
}

function hideTooltip() {
  tooltip.classList.remove('show');
}

// ============================================================
// INFO TOOLTIP (source + derivation for fixed values)
// ============================================================
const infoTooltip = document.getElementById('infoTooltip');
let infoTooltipTarget = null;

function buildInfoHtml(title, source, derivation) {
  return `<div class="tt-title">${title}</div>
    <div class="tt-source"><strong>来源：</strong>${source}</div>
    <div class="tt-derivation"><strong>推导：</strong>${derivation}</div>`;
}
function showInfoTooltip(el, html) {
  if (!infoTooltip) return;
  infoTooltipTarget = el;
  infoTooltip.innerHTML = html;
  infoTooltip.classList.add('show');
  positionInfoTooltip(el);
}
function positionInfoTooltip(el) {
  if (!infoTooltip || !el) return;
  const rect = el.getBoundingClientRect();
  const tw = infoTooltip.offsetWidth;
  const th = infoTooltip.offsetHeight;
  let px = rect.left + rect.width / 2 - tw / 2;
  let py = rect.top - th - 10;
  if (px < 8) px = 8;
  if (px + tw > window.innerWidth - 8) px = window.innerWidth - tw - 8;
  if (py < 8) py = rect.bottom + 10;
  infoTooltip.style.left = px + 'px';
  infoTooltip.style.top = py + 'px';
}
function hideInfoTooltip() {
  if (infoTooltip) infoTooltip.classList.remove('show');
  infoTooltipTarget = null;
}
function attachInfoTooltip(el, title, source, derivation) {
  if (!el) return;
  el.classList.add('info-tooltip-trigger');
  el.addEventListener('mouseenter', () => showInfoTooltip(el, buildInfoHtml(title, source, derivation)));
  el.addEventListener('mouseleave', hideInfoTooltip);
  el.addEventListener('focus', () => showInfoTooltip(el, buildInfoHtml(title, source, derivation)));
  el.addEventListener('blur', hideInfoTooltip);
}
window.addEventListener('scroll', () => { if (infoTooltipTarget) positionInfoTooltip(infoTooltipTarget); }, true);
window.addEventListener('resize', () => { if (infoTooltipTarget) positionInfoTooltip(infoTooltipTarget); });

// Header meta card tooltips
(function() {
  attachInfoTooltip(document.getElementById('metaIonEnergy'), '¹⁷¹Yb 电离能', 'NIST ASD / 原子数据', 'E_i = 6.2541 eV，用于计算里德堡束缚能 E_b = E_i − E_n。');
  attachInfoTooltip(document.getElementById('metaNuclearSpin'), '核自旋 I', '¹⁷¹Yb 稳定同位素', 'I = 1/2 → I(I+1) = 3/4；超精细总量子数 F = |J−I|, …, J+I。');
  attachInfoTooltip(document.getElementById('metaCoreCount'), '核心跃迁数', '本页面数据表', '包含 ¹S₀↔¹P₁、¹S₀↔³P_J、³D₁↔³P_J 及65S激发，共8条核心跃迁。');
})();


return { tooltip, showTooltip, moveTooltip, hideTooltip, attachInfoTooltip, buildInfoHtml, showInfoTooltip, hideInfoTooltip };
}
