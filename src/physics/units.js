import { finiteNumber, PhysicsInputError } from './constants.js';

const SCALES = Object.freeze({
  power: Object.freeze({ W: 1, mW: 1e-3, 'µW': 1e-6, 'μW': 1e-6, uW: 1e-6, nW: 1e-9 }),
  frequency: Object.freeze({ Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9 }),
  length: Object.freeze({ m: 1, mm: 1e-3, 'µm': 1e-6, 'μm': 1e-6, um: 1e-6, nm: 1e-9 }),
});

function scale(kind, unit) {
  const factor = SCALES[kind]?.[unit];
  if (factor === undefined) throw new PhysicsInputError('unit', `不支持的 ${kind} 单位：${unit}`, 'unsupported-unit');
  return factor;
}

export function toSI(value, kind, unit) {
  return finiteNumber(value, kind) * scale(kind, unit);
}

export function fromSI(value, kind, unit) {
  return finiteNumber(value, kind) / scale(kind, unit);
}

export function convert(value, kind, fromUnit, toUnit) {
  return fromSI(toSI(value, kind, fromUnit), kind, toUnit);
}

// Compatibility for the calculator's retained base units: mW, MHz and µm.
export const powerToDisplay = (value_mW, unit) => convert(value_mW, 'power', 'mW', unit);
export const powerFromDisplay = (value, unit) => convert(value, 'power', unit, 'mW');
export const rabiToDisplay = (value_MHz, unit) => convert(value_MHz, 'frequency', 'MHz', unit);
export const rabiFromDisplay = (value, unit) => convert(value, 'frequency', unit, 'MHz');
export const waistToDisplay = (value_um, unit) => convert(value_um, 'length', 'µm', unit);
export const waistFromDisplay = (value, unit) => convert(value, 'length', unit, 'µm');

/** Decay rate Γ [s^-1] versus ordinary-frequency FWHM Δν=Γ/(2π) [Hz]. */
export const decayRateToLinewidthHz = rate_s_inv => finiteNumber(rate_s_inv, 'decayRate_s_inv') / (2 * Math.PI);
export const linewidthHzToDecayRate = linewidth_Hz => finiteNumber(linewidth_Hz, 'linewidth_Hz') * (2 * Math.PI);
