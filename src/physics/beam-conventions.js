import { PhysicsInputError, finiteNumber, nonnegativeNumber, positiveNumber } from './constants.js';

/** Input metadata only. The Rabi/CG kernels still receive atom-plane Pq and w0. */
export const DEFAULT_BEAM_DEFINITION = Object.freeze({
  powerPlane: 'atoms',
  powerBasis: 'component',
  transmission: null,
  linearOrientation: null,
  manualFraction: null,
  sizeKind: 'radius',
});

const DEFINITION_KEYS = Object.keys(DEFAULT_BEAM_DEFINITION);
const POLARIZATIONS = ['pi', 'sigmap', 'sigmam'];

function plainObject(value, field, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new PhysicsInputError(field, `${field} 必须为普通对象`);
  }
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) throw new PhysicsInputError(`${field}.${key}`, `未知输入定义字段：${key}`);
  }
  return value;
}

function choice(value, field, choices) {
  if (!choices.includes(value)) throw new PhysicsInputError(field, `${field} 的选项无效`);
  return value;
}

/** Validate metadata without filling missing experimental transmission/polarization. */
export function validateBeamDefinition(value = {}) {
  plainObject(value, 'beamDefinition', DEFINITION_KEYS);
  const definition = { ...DEFAULT_BEAM_DEFINITION, ...value };
  choice(definition.powerPlane, 'powerPlane', ['atoms', 'upstream']);
  choice(definition.powerBasis, 'powerBasis', ['component', 'linear-total']);
  choice(definition.sizeKind, 'sizeKind', ['radius', 'diameter']);
  if (definition.linearOrientation !== null) {
    choice(definition.linearOrientation, 'linearOrientation', ['parallel', 'perpendicular', 'manual']);
  }
  if (definition.transmission !== null) {
    finiteNumber(definition.transmission, 'transmission');
    if (!(definition.transmission > 0 && definition.transmission <= 1)) {
      throw new PhysicsInputError('transmission', '传输效率 η 必须大于 0 且不大于 100%');
    }
  }
  if (definition.manualFraction !== null) {
    finiteNumber(definition.manualFraction, 'manualFraction');
    if (definition.manualFraction < 0 || definition.manualFraction > 1) {
      throw new PhysicsInputError('manualFraction', '所选偏振分量占比必须在 0%–100% 之间');
    }
  }
  return definition;
}

export function getSizeFactor(definition = {}) {
  return validateBeamDefinition(definition).sizeKind === 'diameter' ? 0.5 : 1;
}

/** fq is optical power fraction, never a Clebsch–Gordan/matrix-element factor. */
export function getBeamFactors(definition = {}, pol = 'pi') {
  const def = validateBeamDefinition(definition);
  choice(pol, 'pol', POLARIZATIONS);
  let transmission = 1;
  if (def.powerPlane === 'upstream') {
    if (def.transmission === null) {
      throw new PhysicsInputError('transmission', '请填写上游位置到原子处的传输效率 η', 'incomplete-input');
    }
    transmission = def.transmission;
  }
  let componentFraction = 1;
  if (def.powerBasis === 'linear-total') {
    if (def.linearOrientation === null) {
      throw new PhysicsInputError('linearOrientation', '请选择线偏振相对量子化轴的方向或填写分量占比', 'incomplete-input');
    }
    if (def.linearOrientation === 'parallel') componentFraction = pol === 'pi' ? 1 : 0;
    if (def.linearOrientation === 'perpendicular') componentFraction = pol === 'pi' ? 0 : 0.5;
    if (def.linearOrientation === 'manual') {
      if (def.manualFraction === null) {
        throw new PhysicsInputError('manualFraction', '请填写当前所选偏振分量的功率占比', 'incomplete-input');
      }
      if (pol !== 'pi' && def.manualFraction > 0.5) {
        throw new PhysicsInputError('manualFraction', '线偏振总功率下，σ⁺ 与 σ⁻ 各自的功率占比不能超过 50%');
      }
      componentFraction = def.manualFraction;
    }
  }
  const powerFactor = transmission * componentFraction;
  if (componentFraction > 0 && powerFactor === 0) {
    throw new PhysicsInputError('powerFactor', '功率换算因子过小，超出当前数值范围');
  }
  return { transmission, componentFraction, powerFactor, sizeFactor: def.sizeKind === 'diameter' ? 0.5 : 1 };
}

function finiteConverted(value, field, { positive = false, nonzeroInput = false } = {}) {
  if (!Number.isFinite(value) || (positive && !(value > 0)) || (nonzeroInput && value === 0)) {
    throw new PhysicsInputError(field, '输入定义换算超出当前有限数值范围');
  }
  return value;
}

/**
 * Raw values use mW and µm, regardless of their UI display units.
 * Size-only conversion is independent of an incomplete power definition.
 */
export function normalizeBeamInput(raw = {}, definition = {}, pol = 'pi') {
  plainObject(raw, 'beamInput', ['power_mW', 'size_um']);
  const def = validateBeamDefinition(definition);
  let factors = { sizeFactor: def.sizeKind === 'diameter' ? 0.5 : 1 };
  const normalized = {};
  if (raw.power_mW !== undefined) {
    const power = nonnegativeNumber(raw.power_mW, 'power_mW');
    factors = getBeamFactors(def, pol);
    normalized.P_mW = finiteConverted(power * factors.powerFactor, 'P_mW', {
      nonzeroInput: power > 0 && factors.powerFactor > 0,
    });
  }
  if (raw.size_um !== undefined) {
    const size = positiveNumber(raw.size_um, 'size_um');
    normalized.w_um = finiteConverted(size * factors.sizeFactor, 'w_um', { positive: true });
  }
  return { ...normalized, factors };
}

/** Convert solved atom-plane Pq / 1/e² radius into the selected input definitions. */
export function denormalizeSolvedInput(canonical = {}, definition = {}, pol = 'pi') {
  plainObject(canonical, 'canonicalBeamInput', ['P_mW', 'w_um']);
  const def = validateBeamDefinition(definition);
  const result = {};
  if (canonical.P_mW !== undefined) {
    const power = nonnegativeNumber(canonical.P_mW, 'P_mW');
    const { powerFactor } = getBeamFactors(def, pol);
    if (!(powerFactor > 0)) {
      throw new PhysicsInputError('powerFactor', '当前所选偏振分量占比为 0，无法反求有限且唯一的输入功率');
    }
    result.power_mW = finiteConverted(power / powerFactor, 'power_mW', { nonzeroInput: power > 0 });
  }
  if (canonical.w_um !== undefined) {
    const radius = positiveNumber(canonical.w_um, 'w_um');
    result.size_um = finiteConverted(radius / (def.sizeKind === 'diameter' ? 0.5 : 1), 'size_um', { positive: true });
  }
  return result;
}
