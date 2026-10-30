// Main diagram geometry retains the published original; details are scoped hover cards.
import { renderLevelDetails } from './diagram-details.js';
import { chooseDiagramPanelPosition } from './diagram-placement.js';
import { readDiagramGeometry } from './diagram-geometry.js';
export function initEnergyDiagram({ CORE_LEVELS, CORE_TRANSITIONS, HYPERFINE_DATA, E_I_EV }, { showTooltip, moveTooltip, hideTooltip, scheduleTooltipHide }) {
let attachHfsHover;
let hfsAnchor = null;
function closeHyperfinePanel() {
  document.getElementById('hfsPanel').classList.remove('active');
  document.querySelectorAll('.core-level-group').forEach(g=>g.classList.remove('selected'));
}
function positionHyperfinePanel() {
  const panel = document.getElementById('hfsPanel');
  if (!hfsAnchor || !panel.classList.contains('active')) return;
  const svg=document.getElementById('levelDiagram');
  const {plot,segments,levels}=readDiagramGeometry(svg);
  const position=chooseDiagramPanelPosition({
    viewport:{width:window.innerWidth,height:window.innerHeight},
    panel:{width:panel.offsetWidth,height:panel.offsetHeight},
    anchor:hfsAnchor.getBoundingClientRect(),plot,segments,levels
  });
  panel.style.left=position.left+'px';
  panel.style.top=position.top+'px';
}
window.addEventListener('resize',positionHyperfinePanel);
window.addEventListener('scroll',()=>{ closeHyperfinePanel(); hideTooltip(); },{passive:true});
(function() {
  let hfsLeaveTimer = null;
  let hfsPanelHovered = false;

  function scheduleClose(isTouch) {
    if (hfsLeaveTimer) clearTimeout(hfsLeaveTimer);
    hfsLeaveTimer = setTimeout(() => {
      if (!hfsPanelHovered) {
        const panel = document.getElementById('hfsPanel');
        if (panel) panel.classList.remove('active');
        document.querySelectorAll('.core-level-group').forEach(g => g.classList.remove('selected'));
      }
    }, isTouch ? 900 : 380);
  }

  attachHfsHover = function(el, termGetter) {
    el.addEventListener('mouseenter', (e) => {
      if (hfsLeaveTimer) clearTimeout(hfsLeaveTimer);
      const term = typeof termGetter === 'function' ? termGetter(el, e) : termGetter;
      if (term) { hfsAnchor = el; hideTooltip(); showHyperfinePanel(term); }
    });
    el.addEventListener('mouseleave', () => scheduleClose(false));
    el.addEventListener('focus', (e) => {
      if (hfsLeaveTimer) clearTimeout(hfsLeaveTimer);
      const term = typeof termGetter === 'function' ? termGetter(el,e) : termGetter;
      hfsAnchor=el; hideTooltip(); showHyperfinePanel(term);
    });
    el.addEventListener('blur', () => scheduleClose(false));
    el.addEventListener('keydown', e => { if(e.key==='Escape') closeHyperfinePanel(); });
    el.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      const term = typeof termGetter === 'function' ? termGetter(el, e) : termGetter;
      if (term) { hfsAnchor = el; hideTooltip(); showHyperfinePanel(term); }
    }, { passive: true });
    // Touch cards remain until closed or another object is selected.
  };

  const panel = document.getElementById('hfsPanel');
  if (panel) {
    panel.addEventListener('mouseenter', () => { hfsPanelHovered = true; if (hfsLeaveTimer) clearTimeout(hfsLeaveTimer); });
    panel.addEventListener('mouseleave', () => { hfsPanelHovered = false; scheduleClose(false); });
    panel.addEventListener('touchstart', (e) => { e.stopPropagation(); hfsPanelHovered = true; if (hfsLeaveTimer) clearTimeout(hfsLeaveTimer); }, { passive: true });
    panel.addEventListener('focusin', () => { hfsPanelHovered=true; if(hfsLeaveTimer) clearTimeout(hfsLeaveTimer); });
    panel.addEventListener('focusout', e => { if(!panel.contains(e.relatedTarget)) { hfsPanelHovered=false; scheduleClose(false); } });
    panel.addEventListener('keydown', e => { if(e.key==='Escape') closeHyperfinePanel(); });
    panel.addEventListener('click', e => { if(e.target.closest('a')) closeHyperfinePanel(); });
  }
})();

(function() {
  const svg = document.getElementById('levelDiagram');
  svg.replaceChildren();
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', '¹⁷¹Yb 原始能级跃迁图，八条跃迁。点击连线进入对应的超精细分量。');
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1000, H = 760;
  const padTop = 85, padBottom = 30;
  // 3-column parity-symmetric layout: odd (left) | even (middle) | odd (right)
  //   left odd column: ¹P series (singlet P, 6s6p)
  //   middle even column: 6s², 6snd, 6sns (S, D even-parity series)
  //   right odd column: ³P series (triplet P, 6s6p)
  const colOddL = 180;    // left odd column center: ¹P series
  const colEven = 500;    // middle even column center: ¹S₀, ³D₁, ³S₁
  const colOddR = 830;    // right odd column center: ³P series
  const levelW = 140;

  // asinh-style nonlinear energy scale — heavily stretched in the low-energy region
  // to resolve fine structure. Two linear segments joined smoothly:
  //   Low segment (0 – eVLow eV): occupies fracLow of the plot height (stretched)
  //   High segment (eVLow – IP): occupies 1 – fracLow of the plot height (compressed)
  const eVLow = 3.2;      // boundary between low (stretched) and high (compressed)
  const fracLow = 0.70;   // fraction of plot height dedicated to low segment
  const eVHigh = E_I_EV;  // ionization limit = top of axis

  function eVtoY(eV) {
    const plotH = H - padTop - padBottom;
    if (eV <= eVLow) {
      // Low segment: stretched, from bottom (y = H-padBottom) up to ySplit
      const frac = eV / eVLow;
      return (H - padBottom) - frac * fracLow * plotH;
    } else {
      // High segment: compressed, from ySplit up to padTop
      const frac = (eV - eVLow) / (eVHigh - eVLow);
      const ySplit = (H - padBottom) - fracLow * plotH;
      return ySplit - frac * (1 - fracLow) * plotH;
    }
  }

  // Build level map for core levels
  const levelMap = {};
  CORE_LEVELS.forEach(l => levelMap[l.term] = l);

  // Column headers (3-column parity-symmetric Grotrian)
  // Each column gets a series label (large, serif) + parity tag (small, mono)
  function addColumnHeader(x, seriesName, parityText, color) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('text-anchor', 'middle');

    // Series label (top line)
    const s = document.createElementNS(NS, 'text');
    s.setAttribute('x', x);
    s.setAttribute('y', 18);
    s.setAttribute('text-anchor', 'middle');
    s.setAttribute('fill', color);
    s.setAttribute('font-size', '13');
    s.setAttribute('font-weight', '600');
    s.setAttribute('font-family', 'Noto Serif SC, serif');
    s.setAttribute('letter-spacing', '1');
    s.textContent = seriesName;
    g.appendChild(s);

    // Parity tag (second line, smaller)
    const p = document.createElementNS(NS, 'text');
    p.setAttribute('x', x);
    p.setAttribute('y', 34);
    p.setAttribute('text-anchor', 'middle');
    p.setAttribute('fill', '#7d88a0');
    p.setAttribute('font-size', '9.5');
    p.setAttribute('font-family', 'Times New Roman, SimSun, Songti SC, serif');
    p.setAttribute('letter-spacing', '1.5');
    p.textContent = parityText;
    g.appendChild(p);

    // Thin horizontal rule under header
    const rule = document.createElementNS(NS, 'line');
    rule.setAttribute('x1', x - 55);
    rule.setAttribute('y1', 42);
    rule.setAttribute('x2', x + 55);
    rule.setAttribute('y2', 42);
    rule.setAttribute('stroke', '#26314d');
    rule.setAttribute('stroke-width', '1');
    g.appendChild(rule);

    svg.appendChild(g);
  }

  addColumnHeader(colOddL, '¹P 系列', 'odd  ·  奇宇称', '#a78bfa');
  addColumnHeader(colEven, 'even  偶宇称', 'S · D  组态', '#e8edf7');
  addColumnHeader(colOddR, '³P 系列', 'odd  ·  奇宇称', '#7aa2ff');

  // Energy axis (two-segment nonlinear: low-E stretched, high-E compressed)
  const axisX = 48;
  const axisGroup = document.createElementNS(NS, 'g');
  const axisLine = document.createElementNS(NS, 'line');
  axisLine.setAttribute('x1', axisX); axisLine.setAttribute('y1', padTop);
  axisLine.setAttribute('x2', axisX); axisLine.setAttribute('y2', H - padBottom);
  axisLine.setAttribute('stroke', '#26314d');
  axisLine.setAttribute('stroke-width', '1');
  axisGroup.appendChild(axisLine);

  // Low-segment ticks (dense, every 0.25 eV in the stretched region)
  for (let eV = 0; eV <= eVLow; eV += 0.5) {
    const y = eVtoY(eV);
    const tick = document.createElementNS(NS, 'line');
    tick.setAttribute('x1', axisX - 4); tick.setAttribute('y1', y);
    tick.setAttribute('x2', axisX + 4); tick.setAttribute('y2', y);
    tick.setAttribute('stroke', '#5a6580');
    axisGroup.appendChild(tick);
    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', axisX - 7); lab.setAttribute('y', y + 4);
    lab.setAttribute('text-anchor', 'end');
    lab.setAttribute('fill', '#7d88a0');
    lab.setAttribute('font-size', '10');
    lab.setAttribute('font-family', 'Times New Roman, SimSun, Songti SC, serif');
    lab.textContent = eV.toFixed(1) + ' eV';
    axisGroup.appendChild(lab);
  }

  // Break mark (zigzag at the low/high segment boundary)
  const breakY = eVtoY(eVLow);
  for (let i = 0; i < 5; i++) {
    const zig = document.createElementNS(NS, 'line');
    zig.setAttribute('x1', axisX - 3 + i * 1.5);
    zig.setAttribute('y1', breakY - 3 + (i % 2) * 6);
    zig.setAttribute('x2', axisX + 3 + i * 1.5);
    zig.setAttribute('y2', breakY - 3 + ((i + 1) % 2) * 6);
    zig.setAttribute('stroke', '#5a6580');
    zig.setAttribute('stroke-width', '1');
    axisGroup.appendChild(zig);
  }

  // High-segment ticks (sparse, every 1 eV in the compressed region)
  const highTicks = [3, 4, 5, 6, E_I_EV];
  highTicks.forEach(eV => {
    const y = eVtoY(eV);
    const tick = document.createElementNS(NS, 'line');
    tick.setAttribute('x1', axisX - 4); tick.setAttribute('y1', y);
    tick.setAttribute('x2', axisX + 4); tick.setAttribute('y2', y);
    tick.setAttribute('stroke', '#5a6580');
    axisGroup.appendChild(tick);
    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', axisX - 7); lab.setAttribute('y', y + 4);
    lab.setAttribute('text-anchor', 'end');
    lab.setAttribute('fill', '#7d88a0');
    lab.setAttribute('font-size', '10');
    lab.setAttribute('font-family', 'Times New Roman, SimSun, Songti SC, serif');
    lab.textContent = eV.toFixed(eV === E_I_EV ? 3 : 0) + (eV === E_I_EV ? ' IP' : ' eV');
    axisGroup.appendChild(lab);
  });

  const axisTit = document.createElementNS(NS, 'text');
  axisTit.setAttribute('x', axisX - 7);
  axisTit.setAttribute('y', padTop - 6);
  axisTit.setAttribute('text-anchor', 'end');
  axisTit.setAttribute('fill', '#5a6580');
  axisTit.setAttribute('font-size', '10');
  axisTit.setAttribute('font-family', 'Times New Roman, SimSun, Songti SC, serif');
  axisTit.textContent = 'Energy';
  axisGroup.appendChild(axisTit);

  svg.appendChild(axisGroup);

  // Vertical column separator lines (faint, to emphasize 3-column Grotrian structure)
  // Place dividers between the three columns, running the full energy scale height
  const divY1 = padTop + 48;
  const divY2 = H - padBottom;
  [
    (colOddL + colEven) / 2,
    (colEven + colOddR) / 2
  ].forEach(xd => {
    const div = document.createElementNS(NS, 'line');
    div.setAttribute('x1', xd);
    div.setAttribute('y1', divY1);
    div.setAttribute('x2', xd);
    div.setAttribute('y2', divY2);
    div.setAttribute('stroke', '#1e2740');
    div.setAttribute('stroke-width', '1');
    div.setAttribute('stroke-dasharray', '2 5');
    svg.appendChild(div);
  });

  // (Ionization limit line removed — no Rydberg levels in this diagram)

  // (Rydberg region shaded band and label removed — no Rydberg levels in this diagram)

  // ===== Draw core levels =====
  function drawCoreLevel(level, x, opts = {}) {
    const y = eVtoY(level.energy_eV);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'core-level');
    g.setAttribute('data-term', level.term);

    const lw = levelW;

    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', x - lw/2); line.setAttribute('y1', y);
    line.setAttribute('x2', x + lw/2); line.setAttribute('y2', y);
    const lineColor = level.type === 'singlet' ? '#e8edf7' : '#7aa2ff';
    line.setAttribute('stroke', lineColor);
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'butt');
    g.appendChild(line);

    const glow = document.createElementNS(NS, 'line');
    glow.setAttribute('x1', x - lw/2); glow.setAttribute('y1', y);
    glow.setAttribute('x2', x + lw/2); glow.setAttribute('y2', y);
    glow.setAttribute('stroke', lineColor);
    glow.setAttribute('stroke-width', '8');
    glow.setAttribute('stroke-linecap', 'butt');
    glow.setAttribute('opacity', '0.18');
    g.appendChild(glow);

    // Transparent thick hit zone for easy clicking
    const hitZone = document.createElementNS(NS, 'line');
    hitZone.setAttribute('x1', x - lw/2 - 20); hitZone.setAttribute('y1', y);
    hitZone.setAttribute('x2', x + lw/2 + 20); hitZone.setAttribute('y2', y);
    hitZone.setAttribute('stroke', 'transparent');
    hitZone.setAttribute('stroke-width', '20');
    hitZone.setAttribute('stroke-linecap', 'butt');
    hitZone.style.cursor = 'pointer';
    g.appendChild(hitZone);

    // Label: (config) term format, placed based on labelSide
    // For closely-spaced triplet levels on the side, show short label (term only)
    // since they share the same configuration; full label shown on middle level
    const labelSide = opts.labelSide || 'top'; // 'top' | 'right' | 'left'
    const shortLabel = opts.shortLabel; // if true, show only term
    const labelFormat = opts.labelFormat || 'paren_config'; // 'paren_config' | 'config_term'
    let displayLabel;
    if (labelFormat === 'config_term') {
      displayLabel = level.config + ' ' + level.term;
    } else if (shortLabel) {
      displayLabel = level.term;
    } else {
      displayLabel = level.term === '65³S₁' ? '6s65s ³S₁' : level.config === '6s7s' ? '6s7s ' + level.term : '(' + level.config + ') ' + level.term;
    }

    const label = document.createElementNS(NS, 'text');
    label.setAttribute('font-family', 'Noto Serif SC, Georgia, serif');
    label.setAttribute('font-style', 'italic');
    label.setAttribute('font-weight', '600');
    label.setAttribute('fill', lineColor);
    label.setAttribute('font-size', shortLabel ? '13' : '15');
    label.textContent = displayLabel;

    if (labelSide === 'top') {
      label.setAttribute('x', x);
      label.setAttribute('y', y - 10);
      label.setAttribute('text-anchor', 'middle');
    } else if (labelSide === 'right') {
      label.setAttribute('x', x + lw/2 + 10);
      label.setAttribute('y', shortLabel ? y + 4 : y + 5);
      label.setAttribute('text-anchor', 'start');
    } else if (labelSide === 'left') {
      label.setAttribute('x', x - lw/2 - 10);
      label.setAttribute('y', y + 5);
      label.setAttribute('text-anchor', 'end');
    }
    g.appendChild(label);

    // Optional: configuration text on the level line (e.g. "6s6p" right-aligned on ³P₂)
    if (opts.configOnLine) {
      const cfgLabel = document.createElementNS(NS, 'text');
      cfgLabel.setAttribute('x', x + lw/2);
      cfgLabel.setAttribute('y', y - 8);
      cfgLabel.setAttribute('text-anchor', 'end');
      cfgLabel.setAttribute('fill', '#7d88a0');
      cfgLabel.setAttribute('font-size', '10');
      cfgLabel.setAttribute('font-family', 'Times New Roman, SimSun, Songti SC, serif');
      cfgLabel.textContent = opts.configOnLine;
      g.appendChild(cfgLabel);
    }

    // Hover/touch handler for hyperfine panel
    g.classList.add('core-level-group');
    g.setAttribute('tabindex','0');
    g.setAttribute('aria-label',level.config+' '+level.term+'，能级与超精细结构');
    g.setAttribute('aria-controls','hfsPanel');
    attachHfsHover(g, () => level.term);

    svg.appendChild(g);
    return { y, x };
  }

   const levelPos = {};

  // Helper: get x position for a level based on parity and term
  function getLevelX(level) {
    if (level.parity === 'even') return colEven;
    // odd parity: ¹P₁ → left column, all ³P_J → right column (same column)
    if (level.term === '¹P₁') return colOddL;
    return colOddR;  // ³P₀, ³P₁, ³P₂ all share the same column
  }

  // Draw all core levels
  CORE_LEVELS.forEach(l => {
    const x = getLevelX(l);
    if (l.term === '³P₀') {
      // Bottom of triplet: short label (term only), same config as ³P₁
      levelPos[l.term] = drawCoreLevel(l, x, { labelSide: 'right', shortLabel: true });
    } else if (l.term === '³P₁') {
      // Middle of triplet: short label (term only), config shown on ³P₂ line
      levelPos[l.term] = drawCoreLevel(l, x, { labelSide: 'right', shortLabel: true });
    } else if (l.term === '³P₂') {
      // Top of triplet: short label (term only), "6s6p" config right-aligned on line
      levelPos[l.term] = drawCoreLevel(l, x, { labelSide: 'right', shortLabel: true, configOnLine: '6s6p' });
    } else if (l.type === 'core-excited') {
      // 4f-core-excited states: full label on J=3, short on others, staggered left/right
      if (l.term === '(7/2,3/2)°₂') {
        levelPos[l.term] = drawCoreLevel(l, x, { labelSide: 'right', shortLabel: true });
      } else if (l.term === '(7/2,3/2)°₃') {
        levelPos[l.term] = drawCoreLevel(l, x, { labelSide: 'left', shortLabel: false });
      } else if (l.term === '(7/2,3/2)°₄') {
        levelPos[l.term] = drawCoreLevel(l, x, { labelSide: 'right', shortLabel: true });
      } else if (l.term === '(7/2,3/2)°₅') {
        levelPos[l.term] = drawCoreLevel(l, x, { labelSide: 'left', shortLabel: true });
      } else {
        levelPos[l.term] = drawCoreLevel(l, x, { labelSide: 'left', shortLabel: false });
      }
    } else if (l.term === '³D₁') {
      // repumper 上能级: full config + term, above the line
      levelPos[l.term] = drawCoreLevel(l, x, { labelSide: 'top', labelFormat: 'config_term' });
    } else if (l.term === '¹P₁') {
      levelPos[l.term] = drawCoreLevel(l, x, { labelSide: 'top', labelFormat: 'config_term' });
    } else if (l.term === '¹S₀') {
      levelPos[l.term] = drawCoreLevel(l, x, { labelSide: 'left' });
    } else {
      // ³S₁ etc: top center label
      levelPos[l.term] = drawCoreLevel(l, x, { labelSide: 'top' });
    }
  });

  // ===== Core levels only — Rydberg levels removed (shown in dedicated diagram below) =====

  // ===== Draw core transitions =====
  const transitionEls = [];

  const coreLabelLayout = {
    // Left side transition (¹P₁ → ¹S₀)
    'T1': { frac: 0.5, side: -1 },
    // Right side transitions from ¹S₀ — parallel ³P family, labels staggered on alternating sides
    'T3': { frac: 0.28, side: 1 },   // 578 nm: lower-right of line
    'T2': { frac: 0.52, side: -1 },  // 556 nm: middle-left of line (opposite side)
    'T4': { frac: 0.78, side: 1 },   // 507 nm: upper-right of line
    // Repumper transitions between ³P and even levels — alternate sides & positions
    'T5': { frac: 0.5, side: -1 },
    'T6': { frac: 0.65, side: 1 },
    'T7': { frac: 0.35, side: -1 },
  };

  // Special layout for T1–T4: four transitions divide the ¹S₀ bar into 5 equal parts;
  // the three ³P_J → ¹S₀ lines (T2,T3,T4) are drawn mutually parallel.
  const sBarX = colEven;
  const sBarW = levelW;
  const sBarY = levelPos['¹S₀'].y;
  const sDivXs = [1, 2, 3, 4].map(i => sBarX - sBarW / 2 + i * sBarW / 5);
  const tripletLayout = {
    'T3': { idx: 1, term: '³P₀' },
    'T2': { idx: 2, term: '³P₁' },
    'T4': { idx: 3, term: '³P₂' }
  };
  // Common slope for the three right-side triplet lines
  let sumDx = 0, sumDy = 0, tripletCount = 0;
  Object.entries(tripletLayout).forEach(([tid, info]) => {
    const yp = levelPos[info.term].y;
    const xs = sDivXs[info.idx];
    sumDx += (colOddR - xs);
    sumDy += (yp - sBarY);
    tripletCount++;
  });
  const mTriplet = tripletCount ? sumDy / sumDx : -1;
  const tripletUpperX = {};
  Object.entries(tripletLayout).forEach(([tid, info]) => {
    const yp = levelPos[info.term].y;
    const xs = sDivXs[info.idx];
    let xp = xs + (yp - sBarY) / mTriplet;
    // Keep endpoint inside the ³P level bar
    xp = Math.max(colOddR - sBarW / 2, Math.min(colOddR + sBarW / 2, xp));
    tripletUpperX[tid] = xp;
  });
  const singletLowerX = sDivXs[0]; // T1 (¹P₁ → ¹S₀) uses the leftmost division point

  // Special layout for T5–T7: T6 (³P₀→³S₁) and T7 (³P₂→³S₁) drawn parallel,
  // connecting to ³P levels at the left 1/3 of the level bar.
  // T5 (³D₁→³P₀) also connects to ³P₀ at the left 1/3.
  const pThirdLeftX = colOddR - levelW / 2 + levelW / 3; // left 1/3 of ³P level bar
  const s1BarX = colEven;
  const s1BarW = levelW;
  const _yP0 = levelPos['³P₀'].y;
  const _yP2 = levelPos['³P₂'].y;
  const _yS1 = levelPos['³S₁'].y;
  const _yD1 = levelPos['³D₁'].y;
  // Average slope for T6 and T7 to be parallel
  const _dx67 = s1BarX - pThirdLeftX;
  const _dy6 = _yS1 - _yP0;
  const _dy7 = _yS1 - _yP2;
  const _mT67 = ((_dy6 / _dx67) + (_dy7 / _dx67)) / 2;
  // Adjusted upper x positions on ³S₁ bar for parallelism
  let t6UpperX = pThirdLeftX + _dy6 / _mT67;
  let t7UpperX = pThirdLeftX + _dy7 / _mT67;
  t6UpperX = Math.max(s1BarX - s1BarW/2, Math.min(s1BarX + s1BarW/2, t6UpperX));
  t7UpperX = Math.max(s1BarX - s1BarW/2, Math.min(s1BarX + s1BarW/2, t7UpperX));

  function drawTransition(t, isCore = true) {
    const lower = levelMap[t.lower];
    const lowerPos = levelPos[t.lower];
    if (!lowerPos) return null;
    const sameSide = lower.parity === (t.upper_parity || levelMap[t.upper]?.parity);

    let upperPos, upperParity;
    if (isCore) {
      upperPos = levelPos[t.upper];
      upperParity = levelMap[t.upper].parity;
    } else {
      // Rydberg transition - find matching rydLevel by series term and n
      const upperTerm = t.upper.replace(/^n/, ''); // e.g. "n³S₁" → "³S₁", "n³D₂" → "³D₂"
      const rl = rydLevels.find(r => r.n === t.n && r.series === 'n' + upperTerm);
      if (!rl) return null;
      const y = eVtoY(rl.energy_eV);
      const x = rl.parity === 'even' ? colEven : colOddR;
      upperPos = { x, y };
      upperParity = rl.parity;
    }

    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'transition-line');
    g.setAttribute('data-id', t.id);
    const clsKey = t.classification.startsWith('强') ? 'strong' : t.classification.startsWith('弱') ? 'weak' : 'forbidden';
    g.setAttribute('data-strength', clsKey);
    g.setAttribute('data-category', isCore ? 'core' : 'rydberg');
    g.style.cursor = 'pointer';

    const fromEven = lower.parity === 'even';
    let x1 = lowerPos.x;
    let y1 = lowerPos.y;
    let x2 = upperPos.x;
    let y2 = upperPos.y;

    // Special routing for T1–T4: divide ¹S₀ bar into 5 equal parts and make
    // the three ³P_J → ¹S₀ transitions parallel.
    if (isCore && (t.id === 'T1' || t.id === 'T2' || t.id === 'T3' || t.id === 'T4')) {
      y1 = sBarY;
      if (t.id === 'T1') {
        x1 = singletLowerX;   // leftmost division point on ¹S₀
        x2 = colOddL;         // ¹P₁ bar center
      } else {
        const info = tripletLayout[t.id];
        x1 = sDivXs[info.idx]; // division point on ¹S₀
        x2 = tripletUpperX[t.id]; // adjusted point on ³P_J bar
      }
    }

    // Special routing for T5–T7: ³P connection at left 1/3, T6/T7 parallel
    if (isCore && (t.id === 'T5' || t.id === 'T6' || t.id === 'T7')) {
      if (t.id === 'T5') {
        // ³D₁ → ³P₀: ³P₀ endpoint at left 1/3
        x1 = pThirdLeftX;
        y1 = _yP0;
        x2 = colEven;
        y2 = _yD1;
      } else if (t.id === 'T6') {
        // ³P₀ → ³S₁: lower at left 1/3 of ³P₀, upper adjusted for parallelism
        x1 = pThirdLeftX;
        y1 = _yP0;
        x2 = t6UpperX;
        y2 = _yS1;
      } else if (t.id === 'T7') {
        // ³P₂ → ³S₁: lower at left 1/3 of ³P₂, upper adjusted for parallelism
        x1 = pThirdLeftX;
        y1 = _yP2;
        x2 = t7UpperX;
        y2 = _yS1;
      }
    }

    // 65S excitation starts one fifth of the bar width inward from the right edge.
    if (isCore && t.id === 'R2') x1 = colOddR + levelW / 2 - levelW / 5;

    // Line stroke by strength classification
    const strokeW = t.classification.startsWith('强') ? (isCore ? 2.5 : 2) : t.classification.startsWith('弱') ? 2 : 1.2;
    const isDashed = t.classification.startsWith('禁戒') || t.multipole.includes('M2') || t.multipole.includes('双光子');

    // Break line at midpoint to make room for wavelength label
    const _dx = x2 - x1, _dy = y2 - y1;
    const _len = Math.sqrt(_dx*_dx + _dy*_dy) || 1;
    const _ux = _dx / _len, _uy = _dy / _len;
    const _textStr = (isCore ? t.wavelength_vac_nm.toFixed(2) : t.wavelength_vac_nm.toFixed(1)) + ' nm';
    const _textW = _textStr.length * (isCore ? 6.8 : 5.8);
    const _gapHalf = _textW / 2 + 5;
    const _midX = (x1 + x2) / 2;
    const _midY = (y1 + y2) / 2;
    const _bx1 = _midX - _ux * _gapHalf;
    const _by1 = _midY - _uy * _gapHalf;
    const _bx2 = _midX + _ux * _gapHalf;
    const _by2 = _midY + _uy * _gapHalf;

    const line1 = document.createElementNS(NS, 'line');
    line1.setAttribute('class', 'trans-main-line');
    line1.setAttribute('x1', x1); line1.setAttribute('y1', y1);
    line1.setAttribute('x2', _bx1); line1.setAttribute('y2', _by1);
    line1.setAttribute('stroke', t.color);
    line1.setAttribute('stroke-width', strokeW);
    line1.setAttribute('stroke-linecap', 'round');
    if (isDashed) line1.setAttribute('stroke-dasharray', '5 3');
    line1.style.transition = 'stroke-width 0.2s, opacity 0.2s';
    g.appendChild(line1);

    const line2 = document.createElementNS(NS, 'line');
    line2.setAttribute('class', 'trans-main-line');
    line2.setAttribute('x1', _bx2); line2.setAttribute('y1', _by2);
    line2.setAttribute('x2', x2); line2.setAttribute('y2', y2);
    line2.setAttribute('stroke', t.color);
    line2.setAttribute('stroke-width', strokeW);
    line2.setAttribute('stroke-linecap', 'round');
    if (isDashed) line2.setAttribute('stroke-dasharray', '5 3');
    line2.style.transition = 'stroke-width 0.2s, opacity 0.2s';
    g.appendChild(line2);

    // Simple two-line chevron arrows at both ends: lower tip → low level, upper tip → high level
    if (isCore) {
      function drawChevron(g, x, y, dirX, dirY, color, size) {
        const angle = Math.atan2(dirY, dirX);
        const spread = 0.45;
        const a1 = angle + spread, a2 = angle - spread;
        const legLen = size || 6;
        const makeLeg = function(a) {
          const leg = document.createElementNS(NS, 'line');
          leg.setAttribute('class', 'trans-arrow');
          // legs extend outward from endpoint along dir, so arrow tip sits at endpoint and points along dir
          leg.setAttribute('x1', x); leg.setAttribute('y1', y);
          leg.setAttribute('x2', x + legLen * Math.cos(a));
          leg.setAttribute('y2', y + legLen * Math.sin(a));
          leg.setAttribute('stroke', color);
          leg.setAttribute('stroke-width', '1.5');
          leg.setAttribute('stroke-linecap', 'round');
          return leg;
        };
        g.appendChild(makeLeg(a1));
        g.appendChild(makeLeg(a2));
      }
      // _ux,_uy is the unit vector from lower level (x1,y1) to upper level (x2,y2)
      // Lower endpoint: legs extend toward upper level → tip points down toward low level
      drawChevron(g, x1, y1, _ux, _uy, t.color, 6.5);
      // Upper endpoint: legs extend toward lower level → tip points up toward high level
      drawChevron(g, x2, y2, -_ux, -_uy, t.color, 6.5);
    }

    // Wavelength label: at midpoint of line, rotated along line direction
    // (line is broken at this position — text sits in the gap)
    let labelAngle = Math.atan2(_dy, _dx) * 180 / Math.PI;
    if (labelAngle > 90) labelAngle -= 180;
    if (labelAngle < -90) labelAngle += 180;

    const labelGroup = document.createElementNS(NS, 'g');
    labelGroup.setAttribute('transform', 'translate(' + _midX + ',' + _midY + ') rotate(' + labelAngle + ')');

    const wlLabel = document.createElementNS(NS, 'text');
    wlLabel.setAttribute('x', 0);
    wlLabel.setAttribute('y', isCore ? 4 : 3);
    wlLabel.setAttribute('text-anchor', 'middle');
    wlLabel.setAttribute('fill', t.color);
    wlLabel.setAttribute('font-size', isCore ? '11.5' : '9.5');
    wlLabel.setAttribute('font-family', 'Times New Roman, SimSun, Songti SC, serif');
    wlLabel.setAttribute('font-weight', isCore ? '600' : '400');
    if (isCore) {
      wlLabel.setAttribute('style', 'paint-order: stroke; stroke: rgba(10,14,22,0.9); stroke-width: 3px; stroke-linejoin: round;');
    } else {
      wlLabel.setAttribute('opacity', '0.85');
    }
    wlLabel.textContent = _textStr;
    labelGroup.appendChild(wlLabel);

    g.appendChild(labelGroup);

    // Transparent hit zone spanning the full transition (including label gap)
    const hitLine = document.createElementNS(NS, 'line');
    hitLine.setAttribute('class', 'hit-zone');
    hitLine.setAttribute('x1', x1); hitLine.setAttribute('y1', y1);
    hitLine.setAttribute('x2', x2); hitLine.setAttribute('y2', y2);
    hitLine.setAttribute('stroke', 'transparent');
    hitLine.setAttribute('stroke-width', '18');
    hitLine.setAttribute('stroke-linecap', 'round');
    hitLine.style.pointerEvents = 'stroke';
    g.appendChild(hitLine);

    // Hover
    g.addEventListener('mouseenter', (e) => {
      closeHyperfinePanel();
      showTooltip(e, t, isCore, g);
      g.querySelectorAll('.trans-main-line').forEach(el => {
        el.setAttribute('stroke-width', parseFloat(el.getAttribute('stroke-width')) * 1.6);
      });
    });
    g.addEventListener('mousemove', moveTooltip);
    g.addEventListener('mouseleave', () => {
      scheduleTooltipHide();
      const origW = t.classification.startsWith('强') ? (isCore ? 2.5 : 1.5) : t.classification.startsWith('弱') ? 2 : 1.2;
      g.querySelectorAll('.trans-main-line').forEach(el => {
        el.setAttribute('stroke-width', origW);
      });
    });

    svg.appendChild(g);
    return g;
  }

  // Draw all core transitions (Rydberg transitions removed from this diagram — see dedicated Rydberg QC diagram below)
  CORE_TRANSITIONS.forEach(t => {
    const el = drawTransition(t, true);
    if (el) transitionEls.push(el);
  });

  // ===== Filter controls =====
  let curCat = 'all', curStrength = 'all';

  function applyFilter() {
    transitionEls.forEach(el => {
      const cat = el.dataset.category;
      const str = el.dataset.strength;
      const catOk = curCat === 'all' || cat === curCat;
      const strOk = curStrength === 'all' || str === curStrength;
      if (catOk && strOk) {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      } else {
        el.style.opacity = '0.08';
        el.style.pointerEvents = 'none';
      }
    });
  }

  document.querySelectorAll('[data-fcat]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-fcat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      curCat = btn.dataset.fcat;
      applyFilter();
    });
  });
  document.querySelectorAll('[data-fstrength]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-fstrength]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      curStrength = btn.dataset.fstrength;
      applyFilter();
    });
  });

})();

// ============================================================
// HYPERFINE PANEL
// ============================================================
function showHyperfinePanel(term) {
  const panel=document.getElementById('hfsPanel');
  const level=CORE_LEVELS.find(l=>l.term===term), hfs=HYPERFINE_DATA[term];
  if (!level||!hfs) return;
  document.getElementById('hfsContent').innerHTML=renderLevelDetails(level,hfs);
  panel.classList.add('active');
  document.querySelectorAll('.core-level-group').forEach(g=>g.classList.toggle('selected',g.dataset.term===term));
  positionHyperfinePanel();
}

// Hover-aware close is managed by attachHfsHover; no global click close needed.


}
