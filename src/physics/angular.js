import { I, finiteNumber, PhysicsInputError } from './constants.js';

const EPS = 1e-9;
function angularMomentum(value, field) {
  finiteNumber(value, field);
  if (value < 0 || Math.abs(value * 2 - Math.round(value * 2)) > EPS) {
    throw new PhysicsInputError(field, `${field} 必须为非负整数或半整数`);
  }
  return value;
}
function magneticQuantumNumber(j, m, field) {
  finiteNumber(m, field);
  return Math.abs(m) <= j + EPS && Math.abs((j - m) - Math.round(j - m)) < EPS;
}
function factorial(n) {
  if (n < 0 || Math.abs(n - Math.round(n)) > EPS) return Infinity;
  let result = 1;
  for (let k = 2; k <= Math.round(n); k++) result *= k;
  return result;
}
function triangle(a, b, c) {
  return a + b >= c && a + c >= b && b + c >= a && (a + b + c) % 2 === 0;
}

/** Wigner 6-j, all six arguments are twice the actual angular momenta. */
export function sixJ(j1, j2, j3, j4, j5, j6) {
  for (const [index, value] of [j1, j2, j3, j4, j5, j6].entries()) {
    if (!Number.isInteger(value) || value < 0) throw new PhysicsInputError(`twoJ${index + 1}`, '6-j 参数必须为非负的 2j 整数');
  }
  if (!triangle(j1, j2, j3) || !triangle(j1, j5, j6) || !triangle(j2, j4, j6) || !triangle(j3, j4, j5)) return 0;
  const [a, b, c, d, e, f] = [j1, j2, j3, j4, j5, j6].map(v => v / 2);
  const delta = (x, y, z) => Math.sqrt(factorial(x + y - z) * factorial(x - y + z) * factorial(-x + y + z) / factorial(x + y + z + 1));
  const prefactor = delta(a, b, c) * delta(a, e, f) * delta(b, d, f) * delta(c, d, e);
  const lower = [a + b + c, a + e + f, b + d + f, c + d + e];
  const upper = [a + b + d + e, a + c + d + f, b + c + e + f];
  let sum = 0;
  for (let k = Math.ceil(Math.max(...lower)); k <= Math.floor(Math.min(...upper)); k++) {
    const denom = lower.reduce((v, t) => v * factorial(k - t), 1) * upper.reduce((v, t) => v * factorial(t - k), 1);
    sum += (k % 2 === 0 ? 1 : -1) * factorial(k + 1) / denom;
  }
  return prefactor * sum;
}

/** Condon–Shortley Clebsch–Gordan coefficient <j1 m1; j2 m2 | J M>. */
export function cg(j1, m1, j2, m2, J, M) {
  angularMomentum(j1, 'j1'); angularMomentum(j2, 'j2'); angularMomentum(J, 'J');
  if (!magneticQuantumNumber(j1, m1, 'm1') || !magneticQuantumNumber(j2, m2, 'm2') || !magneticQuantumNumber(J, M, 'M')) return 0;
  if (Math.abs(m1 + m2 - M) > EPS || !triangle(Math.round(j1 * 2), Math.round(j2 * 2), Math.round(J * 2))) return 0;
  const deltaFactor = Math.sqrt((2 * J + 1) * factorial(j1 + j2 - J) * factorial(j1 - j2 + J) * factorial(-j1 + j2 + J) / factorial(j1 + j2 + J + 1));
  const sqrtFact = Math.sqrt(factorial(j1 + m1) * factorial(j1 - m1) * factorial(j2 + m2) * factorial(j2 - m2) * factorial(J + M) * factorial(J - M));
  const kMax = Math.floor(Math.min(j1 + j2 - J, j1 - m1, j2 + m2));
  const kMin = Math.ceil(Math.max(0, -(J - j2 + m1), -(J - j1 - m2)));
  let sum = 0;
  for (let k = kMin; k <= kMax; k++) {
    const denom = factorial(k) * factorial(j1 + j2 - J - k) * factorial(j1 - m1 - k) * factorial(j2 + m2 - k) * factorial(J - j2 + m1 + k) * factorial(J - j1 - m2 + k);
    sum += (k % 2 === 0 ? 1 : -1) / denom;
  }
  return deltaFactor * sqrtFact * sum;
}

/** J-reduced to F-reduced, both in the same dipole unit. */
export function reducedFFromJJ(Jp, J, Fp, F, dReduced_JJ, nuclearSpin = I) {
  for (const [field, value] of Object.entries({ Jp, J, Fp, F, nuclearSpin })) angularMomentum(value, field);
  finiteNumber(dReduced_JJ, 'dReduced_JJ');
  const sj = sixJ(Math.round(Jp * 2), Math.round(Fp * 2), Math.round(nuclearSpin * 2), Math.round(F * 2), Math.round(J * 2), 2);
  const exponent = Jp + nuclearSpin + F + 1;
  if (Math.abs(exponent - Math.round(exponent)) > EPS) return 0;
  return (Math.round(exponent) % 2 === 0 ? 1 : -1) * Math.sqrt((2 * Fp + 1) * (2 * F + 1)) * sj * dReduced_JJ;
}

/** <F' m'| d_q |F m> = CG * <F'||d||F> / sqrt(2F'+1), signed. */
export function matrixElement_F_q(F, mF, Fp, mFp, q, dReduced_F) {
  finiteNumber(dReduced_F, 'dReduced_F');
  return cg(F, mF, 1, q, Fp, mFp) * dReduced_F / Math.sqrt(2 * Fp + 1);
}

export function getFs(J, nuclearSpin = I) {
  angularMomentum(J, 'J'); angularMomentum(nuclearSpin, 'nuclearSpin');
  const values = [];
  for (let F = Math.abs(J - nuclearSpin); F <= J + nuclearSpin + EPS; F += 1) values.push(F);
  return values;
}

export function polarizationQ(pol) {
  if (pol === 'pi' || pol === 'π' || pol === 0) return 0;
  if (pol === 'sigmap' || pol === 'σ⁺' || pol === 1) return 1;
  if (pol === 'sigmam' || pol === 'σ⁻' || pol === -1) return -1;
  throw new PhysicsInputError('pol', '偏振必须为 π、σ⁺ 或 σ⁻');
}

export const channelKey = ch => [ch.F, ch.m, ch.Fp, ch.mp, ch.q].join('|');
const channelOrder = (a, b) => b.F - a.F || b.m - a.m || b.Fp - a.Fp || b.mp - a.mp || b.q - a.q;

/** Effective F-reduced transition, e.g. the hyperfine-induced 171Yb clock line. */
export function computeHfChannels(state, allPol = false) {
  if (!state || !(state.dReduced > 0)) return [];
  finiteNumber(state.dReduced, 'dReduced');
  const channels = [];
  for (const q of allPol ? [-1, 0, 1] : [polarizationQ(state.pol)]) {
    for (let m = -0.5; m <= 0.5 + EPS; m += 1) {
      const mp = m + q;
      if (Math.abs(mp) > 0.5 + EPS) continue;
      const cgVal = cg(0.5, m, 1, q, 0.5, mp);
      if (Math.abs(cgVal) < 1e-10) continue;
      const matEl = matrixElement_F_q(0.5, m, 0.5, mp, q, state.dReduced);
      channels.push({ F: 0.5, m, Fp: 0.5, mp, q, cgVal, matEl, angFactor: matEl / state.dReduced, isHf: true });
    }
  }
  return allPol ? channels.sort(channelOrder) : channels;
}

/** Full-polarization channel table. This function does not mutate UI state. */
export function computeCGChannels(state) {
  if (!state?.transition || !(state.dReduced > 0)) return [];
  if (state.transition.multipole && !String(state.transition.multipole).startsWith('E1')) return [];
  if (state.transition.hf_induced || state.convention === 'F-reduced') return computeHfChannels(state, true);
  const J = state.J_lower, Jp = state.J_upper;
  if (J === 0 && Jp === 0) return [];
  const channels = [];
  for (const F of getFs(J)) {
    for (const Fp of getFs(Jp)) {
      const dF = reducedFFromJJ(Jp, J, Fp, F, state.dReduced);
      for (let m = -F; m <= F + EPS; m += 1) {
        for (const q of [-1, 0, 1]) {
          const mp = m + q;
          if (Math.abs(mp) > Fp + EPS) continue;
          const cgVal = cg(F, m, 1, q, Fp, mp);
          if (Math.abs(cgVal) < 1e-10) continue;
          const matEl = matrixElement_F_q(F, m, Fp, mp, q, dF);
          channels.push({ F, m, Fp, mp, q, cgVal, matEl, angFactor: matEl / state.dReduced });
        }
      }
    }
  }
  return channels.sort(channelOrder);
}

/** Explicit selection or strongest allowed component of the current F pair/polarization. */
export function computeDEff(state) {
  const empty = { dEff: 0, cg: 0 };
  if (!state?.transition || !(state.dReduced > 0)) return empty;
  const isHf = state.transition.hf_induced || state.convention === 'F-reduced';
  const q = polarizationQ(state.pol);
  const channels = isHf ? computeHfChannels(state) : computeCGChannels(state).filter(ch => ch.q === q);
  if (state.selectedChannel) {
    const selected = channels.find(ch => channelKey(ch) === channelKey(state.selectedChannel));
    if (selected) return { dEff: Math.abs(selected.matEl), cg: Math.abs(selected.matEl) / state.dReduced, mF: selected.m, mFp: selected.mp };
  }
  const candidates = isHf ? channels : channels.filter(ch => ch.F === state.F_lower && ch.Fp === state.F_upper).sort((a, b) => a.m - b.m || a.mp - b.mp);
  let best;
  for (const ch of candidates) if (!best || Math.abs(ch.matEl) > Math.abs(best.matEl)) best = ch;
  return best ? { dEff: Math.abs(best.matEl), cg: Math.abs(best.matEl) / state.dReduced, mF: best.m, mFp: best.mp } : empty;
}

export function formatCG(x) {
  finiteNumber(x, 'angularFactor');
  if (Math.abs(x) < 1e-10) return '0';
  const sign = x < 0 ? '−' : '';
  let fraction;
  for (let d = 1; d <= 64; d++) {
    const n = Math.round(x * x * d);
    if (Math.abs(n / d - x * x) < 1e-12) { fraction = { n, d }; break; }
  }
  if (!fraction) return x.toFixed(4);
  let N = fraction.n * fraction.d, multiplier = 1;
  for (let k = Math.floor(Math.sqrt(N)); k >= 2; k--) while (N % (k * k) === 0) { multiplier *= k; N /= k * k; }
  let a = multiplier, b = fraction.d;
  while (b) [a, b] = [b, a % b];
  const numerator = multiplier / (a || 1), denominator = fraction.d / (a || 1);
  if (N === 1) return sign + numerator + (denominator === 1 ? '' : '/' + denominator);
  return sign + (numerator === 1 ? '' : numerator) + '√' + N + (denominator === 1 ? '' : '/' + denominator);
}
