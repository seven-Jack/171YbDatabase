import { R_INF, E_I_CM, A0_UM, finiteNumber, positiveNumber, PhysicsInputError } from './constants.js';

export const ESTIMATE_MODEL = Object.freeze({
  id: 'legacy-single-channel-scaling-v1',
  evidenceKind: 'simplified-estimate',
  reference: 'Legacy index.html scaling at 2e2e9d5; a0 micrometre conversion corrected in formula 1.0.1; model validity pending independent review',
  scope: 'Illustrative quantum-defect and power-law scaling only; not state-resolved MQDT or experimental prediction',
  nValues: Object.freeze([50, 55, 60, 65, 70, 75, 80]),
});

/** Formatted scaling API; radius is a hydrogenic size-scale estimate, not an MQDT expectation. lower_cm remains unused. */
export function calcRydberg(n, delta, lower_cm, config = {}) {
  finiteNumber(n, 'n');
  finiteNumber(delta, 'delta');
  if (!Number.isInteger(n) || n < 1) throw new PhysicsInputError('n', 'n 必须为正整数');
  const nstar = positiveNumber(n - delta, 'nstar');
  const binding = (config.R_INF ?? R_INF) / Math.pow(nstar, 2);
  const energy = (config.E_I_CM ?? E_I_CM) - binding;
  const radius_um = 0.5 * nstar * nstar * 3 * (config.A0_UM ?? A0_UM);
  const lifetime_us = 13.8e-3 * Math.pow(nstar / (7 - 2.523), 3);
  const c6_ghz_um6 = 34 * Math.pow(nstar / (57 - 2.523), 11);
  const blockade_um = Math.pow(c6_ghz_um6 * 1000 / 1, 1 / 6);
  return { n, nstar: nstar.toFixed(3), energy_cm: energy.toFixed(2), binding_cm: binding.toFixed(4), radius_um: radius_um.toFixed(3), lifetime_us: lifetime_us.toFixed(1), C6_ghz_um6: c6_ghz_um6.toFixed(1), blockade_um: blockade_um.toFixed(2) };
}

/** Retains the original formatted-output rounding before D-state scaling. */
export function createRydbergStateEstimates(ns = ESTIMATE_MODEL.nValues, config = {}) {
  const rows = [];
  for (const series of [
    { series: '6sns ³S₁', term: '³S₁', delta: 2.523, J: 1, factor: 1 },
    { series: '6snd ³D₁', term: '³D₁', delta: 1.41, J: 1, factor: 0.4 },
    { series: '6snd ³D₂', term: '³D₂', delta: 1.42, J: 2, factor: 0.5 },
  ]) {
    for (const n of ns) {
      const d = calcRydberg(n, series.delta, undefined, config);
      const row = { series: series.series, term: series.term, parity: 'even', J: series.J, ...d };
      if (series.factor !== 1) {
        const c6 = Number(d.C6_ghz_um6) * series.factor;
        row.lifetime_us = (Number(d.lifetime_us) * 0.7).toFixed(1);
        row.C6_ghz_um6 = c6.toFixed(1);
        row.blockade_um = Math.pow(c6 * 1000 / 1, 1 / 6).toFixed(2);
      }
      row.source = `理论估算 (量子亏损 δ≈${series.delta === 2.523 ? '2.52' : series.delta})`;
      rows.push(row);
    }
  }
  return rows;
}

export function generateRydbergStates(config = {}) {
  const rows=createRydbergStateEstimates(config.ns_values ?? ESTIMATE_MODEL.nValues, config.constants ?? config);
  const suppressed=Object.keys(config.publicOutputPolicy||{});
  if (!suppressed.length) return rows;
  return rows.map(row=>({...row,...Object.fromEntries(suppressed.map(field=>[field,null])),
    source:'历史单通道示意；指定171Yb分支未验证；寿命/C₆/阻塞半径锚点已隔离'}));
}

/** Retained R1–R7 view-model formatting; source records are injected by the data layer. */
export function buildRydbergTransitions(qcRows) {
  if (!Array.isArray(qcRows)) throw new PhysicsInputError('qcRows', '跃迁数据必须为数组');
  return qcRows.map(r => {
    const m = String(r.upper).match(/^(\d+)³([SD])([₁₂₃])$/);
    const n = m ? parseInt(m[1], 10) : null;
    const upper_full = m ? `6s${n}${m[2].toLowerCase()} ³${m[2]}${m[3]}` : r.upper;
    return { id: r.id, lower: r.lower, upper: r.upper, upper_full, label: r.label, n,
      energy_cm: r.energy_cm, wavelength_vac_nm: r.wavelength_vac_nm, frequency_THz: r.frequency_THz,
      excitation: '单光子', rab_freq: '需指定通道、功率与束腰',
      multipole: r.multipole, classification: r.classification,
      forbidden_reason: r.forbidden_reason || r.selection_check || '—', source: r.source, color: r.color };
  });
}
