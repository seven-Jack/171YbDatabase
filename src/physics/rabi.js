import { HBAR, C, EPS0, EA0, finiteNumber, nonnegativeNumber, positiveNumber, PhysicsInputError } from './constants.js';

/** Gaussian beam centre; w0 is the 1/e² intensity radius. SI input/output. */
export function singlePhotonRabiSI(d_Cm, power_W, waist_m) {
  finiteNumber(d_Cm, 'd_Cm');
  nonnegativeNumber(power_W, 'power_W');
  positiveNumber(waist_m, 'waist_m');
  const I0 = 2 * power_W / (Math.PI * waist_m * waist_m);
  const E0 = Math.sqrt(2 * I0 / (C * EPS0));
  const omega_rad_s = d_Cm * E0 / HBAR;
  const fR = omega_rad_s / (2 * Math.PI);
  if (![I0, E0, omega_rad_s, fR].every(Number.isFinite)) throw new PhysicsInputError('parameters', '参数超出当前浮点计算的有限范围');
  return { I0, E0, omega_rad_s, fR, tPi: fR === 0 ? Infinity : 1 / (2 * Math.abs(fR)) };
}

/** Compatibility API: d in ea0, P in mW, w in µm; fR in Hz. */
export function spRabi(d_ea0, P_mW, w_um) {
  finiteNumber(d_ea0, 'd_ea0');
  return singlePhotonRabiSI(d_ea0 * EA0, nonnegativeNumber(P_mW, 'P_mW') * 1e-3, positiveNumber(w_um, 'w_um') * 1e-6);
}

export function rabiHz(d_ea0, P_mW, w_um) {
  return spRabi(d_ea0, P_mW, w_um).fR;
}

/** Inverse ordinary-frequency Rabi: result is power in mW. */
export function powerFromRabiHz(d_ea0, rabi_Hz, w_um) {
  positiveNumber(Math.abs(finiteNumber(d_ea0, 'd_ea0')), 'abs(d_ea0)');
  nonnegativeNumber(rabi_Hz, 'rabi_Hz');
  const d = d_ea0 * EA0;
  const w = positiveNumber(w_um, 'w_um') * 1e-6;
  const omega = 2 * Math.PI * rabi_Hz;
  const E0 = omega * HBAR / d;
  const I0 = E0 * E0 * EPS0 * C / 2;
  const P_mW = I0 * Math.PI * w * w / 2 / 1e-3;
  if (!Number.isFinite(P_mW)) throw new PhysicsInputError('parameters', '反算功率超出当前浮点计算的有限范围');
  return P_mW;
}

/** Inverse ordinary-frequency Rabi: result is the 1/e² intensity radius in µm. */
export function waistFromRabiHz(d_ea0, rabi_Hz, P_mW) {
  positiveNumber(Math.abs(finiteNumber(d_ea0, 'd_ea0')), 'abs(d_ea0)');
  positiveNumber(rabi_Hz, 'rabi_Hz');
  positiveNumber(P_mW, 'P_mW');
  const d = d_ea0 * EA0;
  const P = P_mW * 1e-3;
  const E0 = 2 * Math.PI * rabi_Hz * HBAR / d;
  const I0 = E0 * E0 * EPS0 * C / 2;
  const w_um = Math.sqrt(2 * P / (Math.PI * I0)) / 1e-6;
  if (!Number.isFinite(w_um) || w_um <= 0) throw new PhysicsInputError('parameters', '反算束腰超出当前浮点计算的有限范围');
  return w_um;
}

/**
 * Cycling-channel magnitude inferred from decay rate Γ [s^-1], λ [nm].
 * Applying this relation to a lifetime needs an applicable decay definition.
 */
export function dipoleFromDecayRate(decayRate_s_inv, lambda_nm) {
  nonnegativeNumber(decayRate_s_inv, 'decayRate_s_inv');
  positiveNumber(lambda_nm, 'lambda_nm');
  const omega = 2 * Math.PI * C / (lambda_nm * 1e-9);
  return Math.sqrt(3 * Math.PI * EPS0 * HBAR * C ** 3 * decayRate_s_inv / omega ** 3) / EA0;
}

/** Legacy name: gamma_Hz means ordinary-frequency FWHM, not Γ [s^-1]. */
export function dCycFromGamma(gamma_Hz, lambda_nm) {
  return dipoleFromDecayRate(nonnegativeNumber(gamma_Hz, 'linewidth_Hz') * 2 * Math.PI, lambda_nm);
}

/** Explicit-result boundary for UI; no fallback from missing data to an estimate. */
export function calculateRabi(input) {
  if (!input || typeof input !== 'object') return { status: 'invalid-input', field: 'input', message: '缺少计算参数' };
  if (input.multipole && !String(input.multipole).startsWith('E1')) {
    return { status: 'unsupported', message: '当前计算仅支持具有适用矩阵元的 E1 通道' };
  }
  if (input.dEff_ea0 === null || input.dEff_ea0 === undefined) {
    return { status: 'missing-data', field: 'dEff_ea0', message: '缺少适用通道矩阵元' };
  }
  try {
    if (input.dEff_ea0 === 0) return { status: 'forbidden', message: '当前通道矩阵元为零' };
    const value = spRabi(Math.abs(finiteNumber(input.dEff_ea0, 'dEff_ea0')), input.P_mW, input.w_um);
    return { status: 'ok', ...value, units: { fR: 'Hz', omega_rad_s: 'rad/s', I0: 'W/m²', E0: 'V/m', tPi: 's' } };
  } catch (error) {
    if (!(error instanceof PhysicsInputError)) throw error;
    return { status: error.code, field: error.field, message: error.message };
  }
}
