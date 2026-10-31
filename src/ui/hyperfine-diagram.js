import { I } from '../physics/constants.js';
import { cg, reducedFFromJJ, matrixElement_F_q, getFs, formatCG, computeHfChannels as angularHfChannels, computeCGChannels as angularChannels, computeDEff as angularDEff } from '../physics/angular.js';
import { spRabi } from '../physics/rabi.js';
import { rabiToDisplay as displayRabi } from '../physics/units.js';
import { createCalculatorStore } from '../state/store.js';
import { getTransitionRecord } from '../data/catalog.js';
import { DEFAULT_BEAM_DEFINITION } from '../physics/beam-conventions.js';

// The displayed result is a channel calculation; references identify its
// retained input matrix element rather than asserting a measured Rabi result.
export function buildHyperfineTooltipModel(transition, channel, polarization, hfInduced=false) {
  const fraction=value=>({0.5:'1/2',1.5:'3/2',2.5:'5/2'}[value]??String(value));
  const magnetic=value=>`${value<0?'−':value>0?'+':''}${fraction(Math.abs(value))}`;
  const sourceId=getTransitionRecord(transition?.id)?.quantities.d_num?.sourceId;
  const sourceIds=sourceId?[sourceId]:[];
  const matrix=Number.isFinite(channel.matEl)
    ? `${channel.matEl<0?'−':'+'}${hfInduced?Math.abs(channel.matEl).toExponential(2):Math.abs(channel.matEl).toFixed(5)} ea₀`
    : '—';
  return {
    id:transition?.id||'',title:`${polarization} 超精细分量`,
    rows:[
      {label:'初态',value:`|F=${fraction(channel.F)}, mF=${magnetic(channel.m)}⟩`},
      {label:'末态',value:`|F′=${fraction(channel.Fp)}, mF′=${magnetic(channel.mp)}⟩`},
      {label:'d_eff',value:matrix,sourceIds},
      {label:'Ω/2π',value:channel.rabiStr||'—',sourceIds}
    ],
    footnote:`输入 d：${hfInduced?'有效 F':'J'} 级约化量 · 模型换算`
  };
}
export function syncPolarizationView(buttons, rule, pol) {
  const ruleMap = { pi: 'Δm<sub>F</sub> = 0', sigmap: 'Δm<sub>F</sub> = +1', sigmam: 'Δm<sub>F</sub> = −1' };
  if (!Object.hasOwn(ruleMap, pol)) throw new RangeError('未知偏振');
  buttons.forEach(button => {
    const active = button.dataset.pol === pol;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (rule) rule.innerHTML = ruleMap[pol];
}

export function initHyperfineCalculator({CORE_LEVELS,CORE_TRANSITIONS,RYDBERG_QC_DATA,HYPERFINE_DATA,RYDBERG_QC_TRANSITIONS=[]}, {showCompactTooltip,scheduleTooltipHide}, {onChannelSelected}={}) {
  // ---- State ----
  const store = createCalculatorStore({
    transition: null, // { id, lower, upper, ... }
    dReduced: 0,      // ⟨J'||d||J⟩ in ea0
    dEff: 0,          // current effective matrix element (ea0)
    gamma_kHz: null,  // Γ/2π in kHz
    wavelength_nm: 0,
    J_lower: 0, J_upper: 0,
    F_lower: 0.5,
    F_upper: 0.5,
    diagF_lower: 'all',
    diagF_upper: 'all',
    pol: 'pi', // pi, sigmap, sigmam
    mode: 'sp', // supported single-photon mode
    calcMode: 'power', // 'power' (P→Ω) or 'rabi' (Ω→P)
    powerUnit: 'mW',   // 'µW', 'mW', 'W'
    rabiUnit: 'MHz',   // 'Hz', 'kHz', 'MHz'
    P_mW: 1,
    fR_MHz: 55.3,
    w_um: 50,
    beamDefinition: { ...DEFAULT_BEAM_DEFINITION },
    beamInput: { power_mW: 1, size_um: 50 },
    delta_MHz: 180,
    selectedChannel: null // {F, m, Fp, mp, q, cgVal, matEl}
  }, error => { console.error(error); document.getElementById("appError").hidden=false; });
  const state=store.editor;

  function computeHfChannels(allPol) { return angularHfChannels(state, allPol); }
  function computeCGChannels() { return angularChannels(state); }
  function computeDEff() { return angularDEff(state); }
  // ---- Unit conversion helpers (internal: mW, MHz) ----
  function rabiToDisplay(fR_MHz) { return displayRabi(fR_MHz,state.rabiUnit); }

  // ---- DOM refs ----
  const elDiagFLower = document.getElementById('hfDiagFLower');
  const elDiagFUpper = document.getElementById('hfDiagFUpper');
  const elCGTableBody = document.getElementById('hfCGTableBody');
  const elTransPolSeg = document.getElementById('hfTransPolSeg');
  const elTransRule = document.getElementById('hfTransRule');

  // ---- Format helpers ----

  // ---- Populate F selectors based on J values ----
  function populateFSelects() {
    state.F_lower=getFs(state.J_lower)[0];
    state.F_upper=getFs(state.J_upper)[0];
    state.diagF_lower='all';state.diagF_upper='all';
    populateDiagFSelects();
  }

  function fStr(F) { return F === 0.5 ? '1/2' : F === 1.5 ? '3/2' : F === 2.5 ? '5/2' : F; }
  function mStr(m) {
    if (m === 0.5) return '+½';
    if (m === -0.5) return '−½';
    if (m === 1.5) return '+³⁄₂';
    if (m === -1.5) return '−³⁄₂';
    if (m === 2.5) return '+⁵⁄₂';
    if (m === -2.5) return '−⁵⁄₂';
    return (m > 0 ? '+' : '') + m;
  }
  function polLabel(q) { return q === 0 ? 'π' : q === 1 ? 'σ⁺' : 'σ⁻'; }





  // ---- Populate diagram F selectors (with "all" option) ----
  function populateDiagFSelects() {
    const lowerFs = getFs(state.J_lower);
    const upperFs = getFs(state.J_upper);
    function opts(Fs, prime) {
      let html = '<option value="all">全部</option>';
      for (const F of Fs) html += `<option value="${F}">F${prime ? '′' : ''} = ${fStr(F)}</option>`;
      return html;
    }
    if (elDiagFLower) elDiagFLower.innerHTML = opts(lowerFs, false);
    if (elDiagFUpper) elDiagFUpper.innerHTML = opts(upperFs, true);
  }

  // ---- Compute all allowed hyperfine channels across all F, F' and polarizations ----
  function isHfInduced() {
    return !!(state.transition && state.transition.hf_induced);
  }

  // HF-induced clock transition (J=0→0, e.g. ¹⁷¹Yb ¹S₀–³P₀): E1 forbidden in pure LS,
  // but hyperfine mixing opens an effective F=1/2→F′=1/2 channel with hyperfine
  // reduced matrix element d_reduced = 9.19×10⁻⁵ ea₀. Per-mF-sub-channel matrix
  // element goes through the SAME Wigner-Eckart chain as J-level transitions
  // (matrixElement_F_q): matEl = CG(F mF; 1 q | F′ mF′) × d_reduced / √(2F′+1).
  // Angular factor = matEl / d_reduced: ±1/√3 for the σ channels (π: ±1/√6);
  // anchor: σ⁻ +1/2→−1/2 = 9.19×10⁻⁵/√3 ≈ 5.30×10⁻⁵ ea₀.
  function hfInducedDRed() { return state.dReduced; }




  // ---- Select a specific hyperfine channel from the diagram ----
  function channelKey(ch) {
    return [ch.F, ch.m, ch.Fp, ch.mp, ch.q].join('|');
  }
  function selectHFChannel(ln) {
    const q = state.pol === 'pi' ? 0 : state.pol === 'sigmap' ? 1 : -1;
    state.selectedChannel = { F: ln.F, m: ln.m, Fp: ln.Fp, mp: ln.mp, q: q, cgVal: ln.cgVal, matEl: ln.matEl };
    state.F_lower = ln.F;
    state.F_upper = ln.Fp;
    recalc();
    notifyChanged();
    onChannelSelected?.();
  }

  // ---- Render hyperfine transition diagram (filtered by selected polarization and F display) ----
  // For the hf-induced clock transition (J=0→0 with hyperfine-mixed channel), there
  // is no J-level E1 reduced element; we draw the mF-resolved channels with per-channel
  // matrix element = d_reduced × CG (bare CG, ±1/√3). Dedicated renderer below.
  function renderHfInducedLines() {
    const elTL = document.getElementById('hfTransLines');
    if (!elTL) return;
    if (!state.transition || state.dReduced <= 0) {
      elTL.innerHTML = '<div class="trans-empty">选择跃迁后自动显示超精细跃迁图</div>';
      return;
    }
    const polInfo = {
      pi: { label: 'π', color: state.transition.color, rule: 'ΔmF = 0' },
      sigmap: { label: 'σ⁺', color: state.transition.color, rule: 'ΔmF = +1' },
      sigmam: { label: 'σ⁻', color: state.transition.color, rule: 'ΔmF = −1' }
    }[state.pol];
    // Polarization controls and rule are synchronized at the recalc boundary.

    // For J=0→0 with I=1/2, F=F'=1/2 only; enumerate the allowed channels for the selected pol.
    const q = state.pol === 'pi' ? 0 : state.pol === 'sigmap' ? 1 : -1;
    const dRed = hfInducedDRed();
    const lines = [];
    for (let m = -0.5; m <= 0.5 + 1e-9; m += 1) {
      const mp = m + q;
      if (mp < -0.5 - 1e-9 || mp > 0.5 + 1e-9) continue;
      const cgVal = cg(0.5, m, 1, q, 0.5, mp);
      if (!isFinite(cgVal) || Math.abs(cgVal) < 1e-10) continue;
      const matEl = matrixElement_F_q(0.5, m, 0.5, mp, q, dRed); // CG × d_red / √(2F'+1)
      let rabiStr = '—';
      if (state.P_mW !== null && state.P_mW >= 0 && state.w_um > 0) {
        const r = spRabi(Math.abs(matEl), state.P_mW, state.w_um);
        rabiStr = rabiToDisplay(r.fR / 1e6).toPrecision(4) + ' ' + state.rabiUnit;
      }
      lines.push({ F: 0.5, Fp: 0.5, m, mp, q, cgVal, matEl, rabiStr });
    }
    if (lines.length === 0) {
      elTL.innerHTML = `<div class="trans-empty">${polInfo.label} 偏振下无允许跃迁</div>`;
      return;
    }

    // ---- SVG layout for F=1/2 ↔ F'=1/2 ----
    const NS = 'http://www.w3.org/2000/svg';
    const W = 560;
    const subSpacing = 22;
    const labelX = 108, lineX1 = 124, lineX2 = 430, mLabelX = 437;
    const upperLevels = [{ m: 0.5, y: 50 }, { m: -0.5, y: 50 + subSpacing }];
    const lowerLevels = [{ m: 0.5, y: 180 }, { m: -0.5, y: 180 + subSpacing }];
    const H = 180 + subSpacing + 20;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'hf-trans-svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // F-labels and F-levels for upper F'=1/2
    const upColor = '#a78bfa';
    const lowColor = '#7aa2ff';
    function drawFGroup(Fval, centerY, levels, color, fLabel) {
      const g = document.createElementNS(NS, 'g');
      const fLine = document.createElementNS(NS, 'line');
      fLine.setAttribute('x1', 40); fLine.setAttribute('x2', 88);
      fLine.setAttribute('y1', centerY); fLine.setAttribute('y2', centerY);
      fLine.setAttribute('stroke', color);
      fLine.setAttribute('stroke-width', '2.5');
      fLine.setAttribute('stroke-linecap', 'round');
      g.appendChild(fLine);
      const fLab = document.createElementNS(NS, 'text');
      fLab.setAttribute('x', labelX);
      fLab.setAttribute('y', centerY + 4);
      fLab.setAttribute('text-anchor', 'end');
      fLab.setAttribute('fill', 'var(--text-0)');
      fLab.setAttribute('font-weight', '600');
      fLab.setAttribute('font-family', 'Noto Serif SC, serif');
      fLab.setAttribute('font-size', '11');
      fLab.textContent = fLabel;
      g.appendChild(fLab);
      levels.forEach(lv => {
        const conn = document.createElementNS(NS, 'line');
        conn.setAttribute('x1', 88); conn.setAttribute('x2', lineX1);
        conn.setAttribute('y1', centerY); conn.setAttribute('y2', lv.y);
        conn.setAttribute('stroke', color);
        conn.setAttribute('stroke-width', '0.6');
        conn.setAttribute('opacity', '0.3');
        g.appendChild(conn);
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', lineX1); line.setAttribute('x2', lineX2);
        line.setAttribute('y1', lv.y); line.setAttribute('y2', lv.y);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '1.4');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('opacity', '0.75');
        g.appendChild(line);
        const mLab = document.createElementNS(NS, 'text');
        mLab.setAttribute('x', mLabelX);
        mLab.setAttribute('y', lv.y + 3);
        mLab.setAttribute('fill', 'var(--text-1)');
        mLab.setAttribute('font-size', '10');
        mLab.setAttribute('font-family', "'JetBrains Mono', monospace");
        mLab.textContent = 'mF=' + mStr(lv.m);
        g.appendChild(mLab);
      });
      return g;
    }
    const upCenterY = (upperLevels[0].y + upperLevels[1].y) / 2;
    const lowCenterY = (lowerLevels[0].y + lowerLevels[1].y) / 2;
    svg.appendChild(drawFGroup(0.5, upCenterY, upperLevels, upColor, "F′=1/2"));
    svg.appendChild(drawFGroup(0.5, lowCenterY, lowerLevels, lowColor, "F=1/2"));

    const upY = {}, lowY = {};
    upperLevels.forEach(l => upY[l.m] = l.y);
    lowerLevels.forEach(l => lowY[l.m] = l.y);

    // Title
    const title = document.createElementNS(NS, 'text');
    title.setAttribute('class', 'hf-diagram-title');
    title.setAttribute('x', W / 2);
    title.setAttribute('y', 18);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', 'var(--text-0)');
    title.setAttribute('font-size', '12');
    title.setAttribute('font-weight', '600');
    title.setAttribute('font-family', 'Noto Serif SC, serif');
    title.textContent = `${polInfo.label} 偏振 · ${lines.length} 条超精细诱导允许跃迁`;
    svg.appendChild(title);

    // Subtitle: E1 forbidden, hf-mixed channel note
    const sub = document.createElementNS(NS, 'text');
    sub.setAttribute('x', W / 2);
    sub.setAttribute('y', H - 4);
    sub.setAttribute('text-anchor', 'middle');
    sub.setAttribute('fill', 'var(--text-2)');
    sub.setAttribute('font-size', '10');
    sub.setAttribute('font-family', 'Times New Roman, SimSun, Songti SC, serif');
    sub.textContent = '超精细混合开启 · 使用有效 F 级约化矩阵元';
    svg.appendChild(sub);

    // Sort lines by m ascending for stable layout
    lines.sort((a, b) => a.m - b.m);

    // Lane x positions
    const laneStart = 150, laneEnd = 410;
    const laneStep = lines.length > 1 ? (laneEnd - laneStart) / (lines.length + 1) : 0;
    lines.forEach((ln, i) => { ln._x = lines.length > 1 ? laneStart + (i + 1) * laneStep : (laneStart + laneEnd) / 2; });

    // Arrow head
    function drawVertHead(x, y, dirY, key) {
      const angle = dirY > 0 ? Math.PI / 2 : -Math.PI / 2;
      const spread = 0.45;
      const legLen = 6;
      [angle + spread, angle - spread].forEach(a => {
        const leg = document.createElementNS(NS, 'line');
        leg.setAttribute('x1', x); leg.setAttribute('y1', y);
        leg.setAttribute('x2', x + legLen * Math.cos(a));
        leg.setAttribute('y2', y + legLen * Math.sin(a));
        leg.setAttribute('stroke', polInfo.color);
        leg.setAttribute('stroke-width', '1.8');
        leg.setAttribute('stroke-linecap', 'round');
        leg.setAttribute('class', 'hf-trans-arrow');
        if (key) leg.setAttribute('data-key', key);
        arrowG.appendChild(leg);
      });
    }

    const arrowG = document.createElementNS(NS, 'g');
    lines.forEach(ln => {
      const x = ln._x;
      const y1 = lowY[ln.m];
      const y2 = upY[ln.mp];
      const midY = (y1 + y2) / 2;
      const lineLen = Math.abs(y2 - y1) || 1;
      const key = channelKey({ F: ln.F, m: ln.m, Fp: ln.Fp, mp: ln.mp, q: ln.q });

      // Line label: angular factor matEl / d_reduced = CG / √(2F′+1) — same
      // convention as the CG matrix table's angular-factor column (σ → ±√3/3,
      // π → ±√6/6); chosen via the Wigner-Eckart chain, not the bare CG.
      const textStr = formatCG(ln.matEl / dRed);
      const textW = textStr.length * 5.8;
      const gapHalf = Math.min(textW / 2 + 2, lineLen / 2 - 4);

      const seg1 = document.createElementNS(NS, 'line');
      seg1.setAttribute('x1', x); seg1.setAttribute('y1', y1);
      seg1.setAttribute('x2', x); seg1.setAttribute('y2', midY + gapHalf);
      seg1.setAttribute('stroke', polInfo.color);
      if(state.transition.spectrum?.dash)seg1.setAttribute('stroke-dasharray',state.transition.spectrum.dash);
      seg1.setAttribute('stroke-width', '2');
      seg1.setAttribute('stroke-linecap', 'round');
      seg1.setAttribute('class', 'hf-trans-arrow');
      seg1.setAttribute('data-key', key);
      arrowG.appendChild(seg1);

      const seg2 = document.createElementNS(NS, 'line');
      seg2.setAttribute('x1', x); seg2.setAttribute('y1', midY - gapHalf);
      seg2.setAttribute('x2', x); seg2.setAttribute('y2', y2);
      seg2.setAttribute('stroke', polInfo.color);
      if(state.transition.spectrum?.dash)seg2.setAttribute('stroke-dasharray',state.transition.spectrum.dash);
      seg2.setAttribute('stroke-width', '2');
      seg2.setAttribute('stroke-linecap', 'round');
      seg2.setAttribute('class', 'hf-trans-arrow');
      seg2.setAttribute('data-key', key);
      arrowG.appendChild(seg2);

      drawVertHead(x, y1, -1, key);
      drawVertHead(x, y2, 1, key);

      const text = document.createElementNS(NS, 'text');
      text.setAttribute('fill', polInfo.color);
      text.setAttribute('font-size', '9');
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', 'Times New Roman, SimSun, Songti SC, serif');
      text.setAttribute('style', 'paint-order: stroke; stroke: rgba(10,14,22,0.92); stroke-width: 2px; stroke-linejoin: round;');
      text.setAttribute('transform', `translate(${x},${midY}) rotate(-90)`);
      text.setAttribute('x', 0);
      text.setAttribute('y', 3);
      text.setAttribute('text-anchor', 'middle');
      text.textContent = textStr;
      arrowG.appendChild(text);

      // Tooltip + click → selectHFChannel
      const hit = document.createElementNS(NS, 'line');
      hit.setAttribute('x1', x); hit.setAttribute('y1', y1);
      hit.setAttribute('x2', x); hit.setAttribute('y2', y2);
      hit.setAttribute('stroke', 'transparent');
      hit.setAttribute('stroke-width', '18');
      hit.setAttribute('stroke-linecap', 'round');
      hit.style.pointerEvents = 'stroke';
      hit.style.cursor = 'pointer';
      hit.addEventListener('click', () => selectHFChannel(ln));
      hit.addEventListener('mouseenter', e => {
        showCompactTooltip(e,buildHyperfineTooltipModel(state.transition,ln,polInfo.label,true),{target:hit,plot:svg});
      });
      hit.addEventListener('mouseleave', scheduleTooltipHide);
      arrowG.appendChild(hit);
    });

    // Selection highlight / dimming
    const selKey = state.selectedChannel ? channelKey(state.selectedChannel) : null;
    arrowG.querySelectorAll('.hf-trans-arrow').forEach(el => {
      const k = el.getAttribute('data-key');
      if (selKey) {
        el.classList.toggle('selected', k === selKey);
        el.classList.toggle('dimmed', k !== selKey);
      } else {
        el.classList.remove('selected', 'dimmed');
      }
    });

    svg.appendChild(arrowG);
    svg.setAttribute('role','img');svg.setAttribute('aria-label',state.transition.lower+' → '+state.transition.upper+' '+polInfo.label+'超精细分量示意；用右侧完整表选择通道');
    svg.querySelectorAll('text').forEach(text=>text.setAttribute('font-size',Math.max(13,Number(text.getAttribute('font-size'))||13)));
    elTL.innerHTML = '';
    elTL.appendChild(svg);
  }

  function renderTransitionLines() {
    const elTL = document.getElementById('hfTransLines');
    if (!elTL) return;
    if (!state.transition || state.dReduced <= 0) {
      elTL.innerHTML = '<div class="trans-empty">选择跃迁后自动显示超精细跃迁图</div>';
      return;
    }
    if (isHfInduced()) { renderHfInducedLines(); return; }
    const J = state.J_lower, Jp = state.J_upper;
    if (J === 0 && Jp === 0) {
      elTL.innerHTML = '<div class="trans-empty">J=0 ↔ J′=0：E1 严格禁戒，无超精细跃迁线</div>';
      return;
    }

    const q = state.pol === 'pi' ? 0 : state.pol === 'sigmap' ? 1 : -1;
    const polInfo = {
      pi: { label: 'π', color: state.transition.color, rule: 'ΔmF = 0' },
      sigmap: { label: 'σ⁺', color: state.transition.color, rule: 'ΔmF = +1' },
      sigmam: { label: 'σ⁻', color: state.transition.color, rule: 'ΔmF = −1' }
    }[state.pol];

    // Polarization controls and rule are synchronized at the recalc boundary.

    const lowerFs = state.diagF_lower === 'all' ? getFs(J) : [parseFloat(state.diagF_lower)];
    // Sort upper F′ manifolds by hyperfine energy shift (descending ⇒ highest energy on top).
    // Correct for both A>0 (higher F′ on top) and A<0 (lower F′ on top, e.g. ¹P₁ A=−214 MHz ⇒ F′=1/2 上、F′=3/2 下),
    // consistent with the core-diagram hyperfine hover panel. Falls back to .reverse() if no A data.
    const _upperFsRaw = state.diagF_upper === 'all' ? getFs(Jp) : [parseFloat(state.diagF_upper)];
    const _hfsUp = HYPERFINE_DATA[state.transition.upper];
    const upperFs = _hfsUp
      ? _upperFsRaw.slice().sort((a, b) => {
          const sa = _hfsUp.levels.find(l => l.F === a);
          const sb = _hfsUp.levels.find(l => l.F === b);
          return (sb ? sb.shift : 0) - (sa ? sa.shift : 0);
        })
      : _upperFsRaw.slice().reverse();

    // Enumerate allowed transitions for selected polarization across displayed F manifolds
    const lines = [];
    for (const F of lowerFs) {
      for (const Fp of upperFs) {
        const dRed_F = reducedFFromJJ(Jp, J, Fp, F, state.dReduced);
        for (let m = -F; m <= F + 1e-9; m += 1) {
          const mp = m + q;
          if (mp < -Fp - 1e-9 || mp > Fp + 1e-9) continue;
          const cgVal = cg(F, m, 1, q, Fp, mp);
          if (Math.abs(cgVal) < 1e-10) continue;
          const matEl = matrixElement_F_q(F, m, Fp, mp, q, dRed_F);
          let rabiStr = '—';
          if (Math.abs(matEl) > 1e-12 && state.P_mW !== null && state.P_mW >= 0 && state.w_um > 0) {
            const r = spRabi(Math.abs(matEl), state.P_mW, state.w_um);
              rabiStr = rabiToDisplay(r.fR / 1e6).toPrecision(4) + ' ' + state.rabiUnit;
          }
          lines.push({ F, Fp, m, mp, cgVal, matEl, rabiStr });
        }
      }
    }

    if (lines.length === 0) {
      elTL.innerHTML = `<div class="trans-empty">${polInfo.label} 偏振下无允许跃迁</div>`;
      return;
    }

    // ---- Draw SVG hyperfine transition diagram (multiple F manifolds per side) ----
    const NS = 'http://www.w3.org/2000/svg';
    const W = 560;
    const subSpacing = 20;
    const manifoldGap = 26;
    const labelX = 108, lineX1 = 124, lineX2 = 430, mLabelX = 437;

    function sublevels(Fval, startY) {
      const n = Math.round(2 * Fval + 1);
      const arr = [];
      for (let i = 0; i < n; i++) {
        const m = Fval - i;
        arr.push({ m, y: startY + i * subSpacing });
      }
      return arr;
    }

    function layoutSide(Fs, regionTop, regionBottom) {
      const items = Fs.map(F => {
        const n = Math.round(2 * F + 1);
        const h = (n - 1) * subSpacing;
        return { F, n, h };
      });
      const totalH = items.reduce((s, it) => s + it.h, 0) + (items.length - 1) * manifoldGap;
      const regionH = regionBottom - regionTop;
      let y = regionTop + (regionH - totalH) / 2;
      for (const it of items) {
        it.centerY = y + it.h / 2;
        it.levels = sublevels(it.F, y);
        y += it.h + manifoldGap;
      }
      return { items, totalH };
    }

    const upperBaseBottom = 155, lowerBaseTop = 205;
    const upperLayout = layoutSide(upperFs, 28, upperBaseBottom);
    const lowerLayout = layoutSide(lowerFs, lowerBaseTop, 330);
    const extraUpper = Math.max(0, upperLayout.totalH - (upperBaseBottom - 28));
    const extraLower = Math.max(0, lowerLayout.totalH - (330 - lowerBaseTop));
    const H = 360 + Math.max(extraUpper, extraLower);
    const upperBottom = 28 + (upperBaseBottom - 28) + Math.max(extraUpper, extraLower) / 2;
    const lowerTop = lowerBaseTop - Math.max(extraUpper, extraLower) / 2;
    // Re-layout with expanded regions
    const upperLayout2 = layoutSide(upperFs, 28, upperBottom);
    const lowerLayout2 = layoutSide(lowerFs, lowerTop, H - 20);

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'hf-trans-svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    function drawGroup(item, fLabel, color) {
      const g = document.createElementNS(NS, 'g');
      const centerY = item.centerY;
      const fLine = document.createElementNS(NS, 'line');
      fLine.setAttribute('x1', 40); fLine.setAttribute('x2', 88);
      fLine.setAttribute('y1', centerY); fLine.setAttribute('y2', centerY);
      fLine.setAttribute('stroke', color);
      fLine.setAttribute('stroke-width', '2.5');
      fLine.setAttribute('stroke-linecap', 'round');
      g.appendChild(fLine);

      const fLab = document.createElementNS(NS, 'text');
      fLab.setAttribute('x', labelX);
      fLab.setAttribute('y', centerY + 4);
      fLab.setAttribute('text-anchor', 'end');
      fLab.setAttribute('fill', 'var(--text-0)');
      fLab.setAttribute('font-weight', '600');
      fLab.setAttribute('font-family', 'Noto Serif SC, serif');
      fLab.setAttribute('font-size', '11');
      fLab.textContent = fLabel;
      g.appendChild(fLab);

      item.levels.forEach(lv => {
        const conn = document.createElementNS(NS, 'line');
        conn.setAttribute('x1', 88); conn.setAttribute('x2', lineX1);
        conn.setAttribute('y1', centerY); conn.setAttribute('y2', lv.y);
        conn.setAttribute('stroke', color);
        conn.setAttribute('stroke-width', '0.6');
        conn.setAttribute('opacity', '0.3');
        g.appendChild(conn);

        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', lineX1); line.setAttribute('x2', lineX2);
        line.setAttribute('y1', lv.y); line.setAttribute('y2', lv.y);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '1.4');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('opacity', '0.75');
        g.appendChild(line);

        const mLab = document.createElementNS(NS, 'text');
        mLab.setAttribute('x', mLabelX);
        mLab.setAttribute('y', lv.y + 3);
        mLab.setAttribute('fill', 'var(--text-1)');
        mLab.setAttribute('font-size', '10');
        mLab.setAttribute('font-family', "'JetBrains Mono', monospace");
        mLab.textContent = 'mF=' + mStr(lv.m);
        g.appendChild(mLab);
      });
      return g;
    }

    const upColor = '#a78bfa';
    const lowColor = '#7aa2ff';
    upperLayout2.items.forEach(it => svg.appendChild(drawGroup(it, `F′=${fStr(it.F)}`, upColor)));
    lowerLayout2.items.forEach(it => svg.appendChild(drawGroup(it, `F=${fStr(it.F)}`, lowColor)));

    const upY = {}, lowY = {};
    upperLayout2.items.forEach(it => it.levels.forEach(l => upY[`${it.F},${l.m}`] = l.y));
    lowerLayout2.items.forEach(it => it.levels.forEach(l => lowY[`${it.F},${l.m}`] = l.y));

    const title = document.createElementNS(NS, 'text');
    title.setAttribute('class', 'hf-diagram-title');
    title.setAttribute('x', W / 2);
    title.setAttribute('y', 22);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', 'var(--text-0)');
    title.setAttribute('font-size', '12');
    title.setAttribute('font-weight', '600');
    title.setAttribute('font-family', 'Noto Serif SC, serif');
    title.textContent = `${polInfo.label} 偏振 · ${lines.length} 条允许跃迁 · ${polInfo.rule} · 线标 CG 系数`;
    svg.appendChild(title);

    // Sort transitions for logical left-to-right ordering: by lower F, then lower mF, then upper F', then upper mF'
    lines.sort((a, b) => a.F - b.F || a.m - b.m || a.Fp - b.Fp || a.mp - b.mp);

    // Assign each transition a unique x position — vertical lines, no crossing
    const laneStart = 140, laneEnd = 420;
    const laneStep = lines.length > 1 ? (laneEnd - laneStart) / (lines.length + 1) : 0;
    lines.forEach((ln, i) => { ln._x = lines.length > 1 ? laneStart + (i + 1) * laneStep : (laneStart + laneEnd) / 2; });

    // Chevron arrow head: tip on the level line, legs pointing inward
    function drawVertHead(x, y, dirY, key) {
      const angle = dirY > 0 ? Math.PI / 2 : -Math.PI / 2;
      const spread = 0.45;
      const legLen = 6;
      [angle + spread, angle - spread].forEach(a => {
        const leg = document.createElementNS(NS, 'line');
        leg.setAttribute('x1', x); leg.setAttribute('y1', y);
        leg.setAttribute('x2', x + legLen * Math.cos(a));
        leg.setAttribute('y2', y + legLen * Math.sin(a));
        leg.setAttribute('stroke', polInfo.color);
        leg.setAttribute('stroke-width', '1.8');
        leg.setAttribute('stroke-linecap', 'round');
        leg.setAttribute('class', 'hf-trans-arrow');
        if (key) leg.setAttribute('data-key', key);
        arrowG.appendChild(leg);
      });
    }

    const arrowG = document.createElementNS(NS, 'g');
    lines.forEach(ln => {
      const x = ln._x;
      const y1 = lowY[`${ln.F},${ln.m}`];
      const y2 = upY[`${ln.Fp},${ln.mp}`];
      const midY = (y1 + y2) / 2;
      const lineLen = Math.abs(y2 - y1) || 1;
      const q = state.pol === 'pi' ? 0 : state.pol === 'sigmap' ? 1 : -1;
      const key = channelKey({ F: ln.F, m: ln.m, Fp: ln.Fp, mp: ln.mp, q: q });

      // Label along the vertical line: CG 系数（角向因子）= ⟨F′m′|T¹q|Fm⟩/d_reduced
      // 与 CG 矩阵表「角向因子 (CG×6j)」列同源同值（含 6-j 相位与 √(2F+1) 因子，含符号），
      // 仅依赖 F/mF/偏振与 J/J′/I，与 d_reduced（随跃迁/主量子数变化）无关。
      const angFactor = (state.dReduced > 1e-12) ? ln.matEl / state.dReduced : 0;
      const textStr = formatCG(angFactor);
      const textW = textStr.length * 5.8;
      const gapHalf = Math.min(textW / 2 + 2, lineLen / 2 - 4);

      // Two vertical segments with a gap for the label
      const seg1 = document.createElementNS(NS, 'line');
      seg1.setAttribute('x1', x); seg1.setAttribute('y1', y1);
      seg1.setAttribute('x2', x); seg1.setAttribute('y2', midY + gapHalf);
      seg1.setAttribute('stroke', polInfo.color);
      if(state.transition.spectrum?.dash)seg1.setAttribute('stroke-dasharray',state.transition.spectrum.dash);
      seg1.setAttribute('stroke-width', '2');
      seg1.setAttribute('stroke-linecap', 'round');
      seg1.setAttribute('class', 'hf-trans-arrow');
      seg1.setAttribute('data-key', key);
      arrowG.appendChild(seg1);

      const seg2 = document.createElementNS(NS, 'line');
      seg2.setAttribute('x1', x); seg2.setAttribute('y1', midY - gapHalf);
      seg2.setAttribute('x2', x); seg2.setAttribute('y2', y2);
      seg2.setAttribute('stroke', polInfo.color);
      if(state.transition.spectrum?.dash)seg2.setAttribute('stroke-dasharray',state.transition.spectrum.dash);
      seg2.setAttribute('stroke-width', '2');
      seg2.setAttribute('stroke-linecap', 'round');
      seg2.setAttribute('class', 'hf-trans-arrow');
      seg2.setAttribute('data-key', key);
      arrowG.appendChild(seg2);

      // Arrow heads at both endpoints — tips exactly on level lines, legs inward
      drawVertHead(x, y1, -1, key);  // tip at lower level, legs pointing up (inward)
      drawVertHead(x, y2, 1, key);   // tip at upper level, legs pointing down (inward)

      // Label along the vertical line (rotated -90°), in the gap
      const text = document.createElementNS(NS, 'text');
      text.setAttribute('fill', polInfo.color);
      text.setAttribute('font-size', '9');
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', 'Times New Roman, SimSun, Songti SC, serif');
      text.setAttribute('style', 'paint-order: stroke; stroke: rgba(10,14,22,0.92); stroke-width: 2px; stroke-linejoin: round;');
      text.setAttribute('transform', `translate(${x},${midY}) rotate(-90)`);
      text.setAttribute('x', 0);
      text.setAttribute('y', 3);
      text.setAttribute('text-anchor', 'middle');
      text.textContent = textStr;
      arrowG.appendChild(text);

      const hit = document.createElementNS(NS, 'line');
      hit.setAttribute('x1', x); hit.setAttribute('y1', y1);
      hit.setAttribute('x2', x); hit.setAttribute('y2', y2);
      hit.setAttribute('stroke', 'transparent');
      hit.setAttribute('stroke-width', '18');
      hit.setAttribute('stroke-linecap', 'round');
      hit.style.pointerEvents = 'stroke';
      hit.style.cursor = 'pointer';
      hit.addEventListener('click', () => selectHFChannel(ln));
      hit.addEventListener('mouseenter', e => {
        showCompactTooltip(e,buildHyperfineTooltipModel(state.transition,ln,polInfo.label),{target:hit,plot:svg});
      });
      hit.addEventListener('mouseleave', scheduleTooltipHide);
      arrowG.appendChild(hit);
    })

    // Apply selection highlight / dimming
    const selKey = state.selectedChannel ? channelKey(state.selectedChannel) : null;
    arrowG.querySelectorAll('.hf-trans-arrow').forEach(el => {
      const k = el.getAttribute('data-key');
      if (selKey) {
        el.classList.toggle('selected', k === selKey);
        el.classList.toggle('dimmed', k !== selKey);
      } else {
        el.classList.remove('selected', 'dimmed');
      }
    });

    svg.appendChild(arrowG);
    svg.setAttribute('role','img');svg.setAttribute('aria-label',state.transition.lower+' → '+state.transition.upper+' '+polInfo.label+'超精细分量示意；用右侧完整表选择通道');
    svg.querySelectorAll('text').forEach(text=>text.setAttribute('font-size',Math.max(13,Number(text.getAttribute('font-size'))||13)));
    elTL.innerHTML = '';
    elTL.appendChild(svg);
  }

  // ---- Render CG table as a transition list with CG coefficient column ----
  function renderCGTable() {
    const focusedChannel=document.activeElement?.dataset?.channelKey;
    const channels = computeCGChannels();
    if (!channels.length) {
      elCGTableBody.innerHTML = '<tr><td colspan="5" style="padding:16px;color:var(--text-2)">E1 禁戒 (J=0 ↔ J′=0 或约化矩阵元为零)</td></tr>';
      return;
    }
    const selKey = state.selectedChannel ? channelKey(state.selectedChannel) : null;
    const hfMode = isHfInduced();
    let html = '';
    for (const ch of channels) {
      const key = channelKey(ch);
      const cls = key === selKey ? 'selected-cg' : '';
      // For hf-induced channels (J=0→0), the angular factor is the bare CG
      // ⟨F m; 1 q | F′ m′⟩ (±1/√3) and the matrix element = d_reduced × CG —
      // shown in exponential form because values are ~10⁻⁵ ea₀.
      const angCell = formatCG(ch.angFactor);
      const matCell = hfMode
        ? '<span style="font-family:\'JetBrains Mono\',monospace;color:var(--accent)">' + (ch.matEl >= 0 ? '+' : '−') + Math.abs(ch.matEl).toExponential(2) + '</span>'
        : '<span style="font-family:\'JetBrains Mono\',monospace">' + (ch.matEl >= 0 ? '+' : '−') + Math.abs(ch.matEl).toFixed(4) + '</span>';
      html += `<tr class="${cls}" data-key="${key}">
        <td><button type="button" class="channel-select" data-channel-key="${key}" aria-pressed="${key === selKey}" aria-controls="secRabi" title="选择此通道并进入 Rabi 计算">|F=${fStr(ch.F)}, m<sub>F</sub>=${mStr(ch.m)}⟩</button></td>
        <td>|F′=${fStr(ch.Fp)}, m<sub>F</sub>′=${mStr(ch.mp)}⟩</td>
        <td>${polLabel(ch.q)}</td>
        <td style="font-family:'JetBrains Mono',monospace">${angCell}</td>
        <td>${matCell} <span style="color:var(--text-2);font-size:12px">ea₀</span></td>
      </tr>`;
    }
    elCGTableBody.innerHTML = html;
    elCGTableBody.querySelectorAll('[data-channel-key]').forEach(button=>{
      const choose=()=>{const ch=channels.find(c=>channelKey(c)===button.dataset.channelKey);state.pol=ch.q===0?'pi':ch.q===1?'sigmap':'sigmam';selectHFChannel(ch);};
      button.addEventListener('click',choose);
      button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose();}});
      if(button.dataset.channelKey===focusedChannel)button.focus({preventScroll:true});
    });
  }
  // ---- Compute effective dipole for selected F, F', polarization ----


  // ---- Full recalc & render ----
  function recalc() {
    syncPolarizationButtons();
    // Matrix elements (effective dipole; drives Rabi-P viz via state.dEff)
    const { dEff } = computeDEff();
    state.dEff = dEff;

    // CG table
    renderCGTable();
    // Transition lines (π / σ⁺ / σ⁻)
    renderTransitionLines();
    store.publish();
  }

  // ---- Find level J (checks CORE_LEVELS then RYDBERG_QC_DATA) ----
  function findLevelJ(term) {
    var core = CORE_LEVELS.find(l => l.term === term);
    if (core) return core.J;
    var ryd = RYDBERG_QC_DATA.rydStates.find(s => s.label === term);
    if (ryd) return ryd.J;
    return null;
  }

  // ---- Load transition ----
  function loadTransition(t) {
    state.transition = t;
    document.getElementById('ryd65CalcNote').hidden = t.id !== 'R2';
    state.selectedChannel = null;
    var lowerJ = findLevelJ(t.lower);
    var upperJ = findLevelJ(t.upper);
    if (lowerJ === null || upperJ === null) return;

    state.J_lower = lowerJ;
    state.J_upper = upperJ;
    state.wavelength_nm = t.wavelength_vac_nm;

    // d_reduced — keep numeric for computation, display uses original formatted value
    const d = t.d_num || 0;
    state.dReduced = d;
    state.dReduced_display = typeof t.d_reduced_ea0 === 'string' ? t.d_reduced_ea0 : null;

    // linewidth
    if (t.Gamma_per_s_num && t.Gamma_per_s_num > 0) {
      state.gamma_kHz = t.Gamma_per_s_num / 1e3; // angular? No, Gamma is in per second (angular rate)
      // Wait: Gamma_per_s is the angular decay rate Γ. The linewidth FWHM is Γ/2π.
      // But from the data: T2 says linewidth_FWHM = 2π × 182.4 kHz, so Γ/2π = 182.4 kHz → Γ = 2π·182.4e3 rad/s
      // And Gamma_per_s_num = 1.146e6 = 2π * 182.4e3 ≈ 1.146e6. Yes! Gamma_per_s is angular rate Γ.
      // So linewidth in Hz (Γ/2π) = Gamma_per_s_num / (2π).
      // But for d_cyc formula we need angular rate Γ = Gamma_per_s_num.
      // Actually we want gamma_Hz = Γ/2π = linewidth FWHM in Hz.
      state.gamma_kHz = t.Gamma_per_s_num / (2 * Math.PI) / 1e3;
    } else {
      state.gamma_kHz = null;
    }

    // F selects
    populateFSelects();
    recalc();
  }

  // ---- Event handlers ----
  if (elDiagFLower) {
    elDiagFLower.addEventListener('change', e => {
      state.diagF_lower = e.target.value==='all'?'all':Number(e.target.value);
      renderTransitionLines();
      store.publish();
    });
  }
  if (elDiagFUpper) {
    elDiagFUpper.addEventListener('change', e => {
      state.diagF_upper = e.target.value==='all'?'all':Number(e.target.value);
      renderTransitionLines();
      store.publish();
    });
  }

  // Polarization segment (shared between input panel and diagram toolbar)
  function setPolarization(pol) {
    if (!['pi', 'sigmap', 'sigmam'].includes(pol)) throw new RangeError('未知偏振');
    state.pol = pol;
    // Changing polarization invalidates a previously selected channel
    state.selectedChannel = null;
    recalc();
    if (typeof notifyChanged === 'function') notifyChanged();
  }

  if (elTransPolSeg) {
    elTransPolSeg.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (btn) setPolarization(btn.dataset.pol);
    });
  }


  function syncPolarizationButtons() {
    syncPolarizationView(document.querySelectorAll('[data-pol]'), elTransRule, state.pol);
  }
  function notifyChanged() { store.publish(); }
  const api = Object.freeze({
    loadTransition,
    getState: store.getState,
    onChange: store.subscribe,
    patchInputs(patch) { for(const [key,value] of Object.entries(patch)) state[key]=value; recalc(); },
    restore(snapshot) {
      const t=CORE_TRANSITIONS.find(t=>t.id===snapshot.transition.id)||RYDBERG_QC_TRANSITIONS.find(t=>t.id===snapshot.transition.id);
      if(!t)throw Error('当前数据中不存在待恢复的跃迁');
      loadTransition(t);
      for(const key of ['F_lower','F_upper','diagF_lower','diagF_upper','pol','P_mW','w_um','fR_MHz','selectedChannel','calcMode','powerUnit','rabiUnit','solveFor','calculatorUnits','beamDefinition','beamInput'])if(key in snapshot)state[key]=snapshot[key];
      if(elDiagFLower)elDiagFLower.value=state.diagF_lower;
      if(elDiagFUpper)elDiagFUpper.value=state.diagF_upper;
      recalc();
    },
    channels: () => computeCGChannels(),
    setPolarization,
  });
  elCGTableBody.setAttribute('aria-label','全部允许偏振分量；每行按钮可选择计算通道');
  const defaultT=CORE_TRANSITIONS.find(t=>t.id==='T2');
  api.loadTransition(defaultT);
  return api;

}
