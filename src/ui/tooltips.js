import { renderTransitionTooltip } from './diagram-details.js';
import { chooseDiagramPanelPosition } from './diagram-placement.js';
import { readDiagramGeometry } from './diagram-geometry.js';
import { renderCompactTooltip, positionWorkspaceTooltip } from './compact-tooltip.js';
export function createTooltips() {
const tooltip = document.getElementById('tooltip');

let tooltipLeaveTimer;
let diagramTarget=null;
let workspaceContext=null;
function positionDiagramTooltip() {
  if (!diagramTarget||!tooltip.classList.contains('show')) return;
  const geometry=readDiagramGeometry(diagramTarget.ownerSVGElement);
  if (!geometry.plot) return;
  // The wavelength label anchors the card without treating a diagonal's whole
  // bounding box as occupied. All actual lines remain obstacles below.
  const anchor=(diagramTarget.querySelector('text')||diagramTarget).getBoundingClientRect();
  const position=chooseDiagramPanelPosition({viewport:{width:window.innerWidth,height:window.innerHeight},
    panel:{width:tooltip.offsetWidth,height:tooltip.offsetHeight},anchor,...geometry});
  tooltip.style.left=position.left+'px';
  tooltip.style.top=position.top+'px';
}
function showTooltip(e, t, isCore, target=null) {
  clearTimeout(tooltipLeaveTimer);
  hideInfoTooltip();
  workspaceContext=null;
  tooltip.classList.remove('workspace-tooltip');
  diagramTarget=target;
  tooltip.innerHTML=renderTransitionTooltip(t,isCore);
  tooltip.classList.add('diagram-transition-tooltip','show');
  if (diagramTarget) positionDiagramTooltip();
  else moveTooltip(e);
}
function showCompactTooltip(e,model,{target=e?.currentTarget,plot=target?.ownerSVGElement||target}={}) {
  if (!target) return;
  clearTimeout(tooltipLeaveTimer);
  hideInfoTooltip();
  diagramTarget=null;
  const sameTarget=workspaceContext?.target===target&&workspaceContext?.plot===plot;
  const oldWidth=tooltip.offsetWidth,oldHeight=tooltip.offsetHeight;
  tooltip.innerHTML=renderCompactTooltip(model);
  tooltip.classList.remove('diagram-transition-tooltip');
  tooltip.classList.add('workspace-tooltip','show');
  workspaceContext={target,plot};
  if (!sameTarget||oldWidth!==tooltip.offsetWidth||oldHeight!==tooltip.offsetHeight) positionWorkspaceTooltip(tooltip,target,plot,e);
}
function positionWorkspaceCard() {
  if (workspaceContext&&tooltip.classList.contains('show')) {
    const {target,plot}=workspaceContext;
    positionWorkspaceTooltip(tooltip,target,plot);
  }
}
function scheduleTooltipHide() {
  clearTimeout(tooltipLeaveTimer);
  tooltipLeaveTimer=setTimeout(hideTooltip,380);
}
tooltip.addEventListener('mouseenter',()=>clearTimeout(tooltipLeaveTimer));
tooltip.addEventListener('mouseleave',scheduleTooltipHide);
tooltip.addEventListener('focusin',()=>clearTimeout(tooltipLeaveTimer));
tooltip.addEventListener('focusout',e=>{if(!tooltip.contains(e.relatedTarget)) scheduleTooltipHide();});
tooltip.addEventListener('click',e=>{if(e.target.closest('a'))hideTooltip();});
tooltip.addEventListener('keydown',e=>{if(e.key==='Escape')hideTooltip();});

function moveTooltip(e) {
  if (workspaceContext) {
    if (e.currentTarget===workspaceContext.target) return;
    workspaceContext=null;
    clearTimeout(tooltipLeaveTimer);
    tooltip.classList.remove('workspace-tooltip');
  }
  if (diagramTarget) {
    // Keep the main card stationary while following the same transition.
    if (!e.currentTarget||e.currentTarget===diagramTarget) return;
    // Other scientific diagrams share this tooltip and keep their cursor mode.
    diagramTarget=null;
    clearTimeout(tooltipLeaveTimer);
    tooltip.classList.remove('diagram-transition-tooltip');
  }
  const x = e.clientX + 14;
  const y = e.clientY + 14;
  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;
  const px = Math.max(8, Math.min(x, window.innerWidth - tw - 8));
  const py = Math.max(8, Math.min(y, window.innerHeight - th - 8));
  tooltip.style.left = px + 'px';
  tooltip.style.top = py + 'px';
}

function hideTooltip() {
  clearTimeout(tooltipLeaveTimer);
  diagramTarget=null;
  workspaceContext=null;
  tooltip.classList.remove('show','diagram-transition-tooltip','workspace-tooltip');
}
window.addEventListener('resize',positionDiagramTooltip);
window.addEventListener('resize',positionWorkspaceCard);

// ============================================================
// INFO TOOLTIP (source + derivation for fixed values)
// ============================================================
const infoTooltip = document.getElementById('infoTooltip');
let infoTooltipTarget = null;
let infoLeaveTimer;

function buildInfoHtml(title, source, derivation) {
  return `<div class="tt-title">${title}</div>
    <div class="tt-source"><strong>来源：</strong>${source}</div>
    <div class="tt-derivation"><strong>推导：</strong>${derivation}</div>`;
}
function showInfoTooltip(el, html) {
  if (!infoTooltip) return;
  clearTimeout(infoLeaveTimer);
  hideTooltip();
  infoTooltipTarget = el;
  infoTooltip.innerHTML = html;
  infoTooltip.classList.toggle('workspace-tooltip',html.includes('data-compact-tooltip'));
  infoTooltip.classList.add('show');
  positionInfoTooltip(el);
}
function positionInfoTooltip(el) {
  if (!infoTooltip || !el) return;
  if (infoTooltip.classList.contains('workspace-tooltip')) {
    positionWorkspaceTooltip(infoTooltip,el,el.closest('.table-wrap')||el);
    return;
  }
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
  clearTimeout(infoLeaveTimer);
  if (infoTooltip) infoTooltip.classList.remove('show','workspace-tooltip');
  infoTooltipTarget = null;
}
function scheduleInfoTooltipHide() {
  clearTimeout(infoLeaveTimer);
  infoLeaveTimer=setTimeout(hideInfoTooltip,380);
}
window.addEventListener('keydown',e=>{if(e.key==='Escape'){hideTooltip();hideInfoTooltip();}});
if (infoTooltip) {
  infoTooltip.addEventListener('mouseenter',()=>clearTimeout(infoLeaveTimer));
  infoTooltip.addEventListener('mouseleave',scheduleInfoTooltipHide);
  infoTooltip.addEventListener('focusin',()=>clearTimeout(infoLeaveTimer));
  infoTooltip.addEventListener('focusout',e=>{if(!infoTooltip.contains(e.relatedTarget))scheduleInfoTooltipHide();});
  infoTooltip.addEventListener('click',e=>{if(e.target.closest('a'))hideInfoTooltip();});
  infoTooltip.addEventListener('keydown',e=>{if(e.key==='Escape')hideInfoTooltip();});
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


return { tooltip, showTooltip, showCompactTooltip, moveTooltip, hideTooltip, scheduleTooltipHide, attachInfoTooltip, buildInfoHtml, showInfoTooltip, hideInfoTooltip, scheduleInfoTooltipHide };
}
