import {fromSI} from '../physics/units.js';
import {DEFAULT_BEAM_DEFINITION} from '../physics/beam-conventions.js';

const finiteSI = (value, scale) => Number.isFinite(value) ? value * scale : null;

export function frequencyUnit(hz) {
  if (hz >= 1e9) return 'GHz';
  if (hz >= 1e6) return 'MHz';
  if (hz >= 1e3) return 'kHz';
  return 'Hz';
}

// Inputs are the solver's outputs in the user's beam definition. No beam factor is applied here.
function describe(key, definition, units, power_W, size_m, frequency_Hz) {
  let label, valueSI, kind, siUnit, unit;
  if (key === 'power') {
    const plane = definition.powerPlane === 'upstream' ? '上游' : '原子处';
    const basis = definition.powerBasis === 'linear-total' ? '总功率' : '分量功率';
    label = '所需' + plane + basis;
    kind = 'power'; valueSI = power_W; siUnit = 'W'; unit = units?.power ?? 'mW';
  } else if (key === 'waist') {
    label = definition.sizeKind === 'diameter' ? '所需光束直径 D（1/e² 强度）' : '所需束腰半径 w₀（1/e² 强度）';
    kind = 'length'; valueSI = size_m; siUnit = 'm'; unit = units?.waist ?? 'µm';
  } else {
    key = 'rabi'; label = 'Rabi 频率 Ω/2π';
    kind = 'frequency'; valueSI = frequency_Hz; siUnit = 'Hz'; unit = units?.rabi ?? frequencyUnit(frequency_Hz);
  }
  const value = Number.isFinite(valueSI) ? fromSI(valueSI, kind, unit) : null;
  return {key, label, valueSI, siUnit, value, unit};
}

export function currentSolvedQuantity(state) {
  const raw = state.beamInput;
  return describe(state.solveFor ?? 'rabi', state.beamDefinition ?? DEFAULT_BEAM_DEFINITION, state.calculatorUnits,
    finiteSI(raw?.power_mW, 1e-3), finiteSI(raw?.size_um, 1e-6), finiteSI(state.fR_MHz, 1e6));
}

export function savedSolvedQuantity(config) {
  const key = config.display.solveFor ?? (config.display.calcMode === 'rabi' ? 'power' : 'rabi');
  const raw = config.enteredParameters;
  const ok = config.result.status === 'ok';
  const units = config.display.units ?? {power:config.display.powerUnit,waist:'µm'};
  return describe(key, config.inputDefinition ?? DEFAULT_BEAM_DEFINITION, units,
    ok ? raw?.power_W ?? config.result.power_W : null,
    ok ? raw?.size_m ?? config.parameters.waist_m : null,
    ok ? config.result.frequency_Hz : null);
}

export function displayQuantityNumber(quantity, digits = 6) {
  return quantity.value === null ? '—' : String(Number(quantity.value.toPrecision(digits)));
}

export function displayQuantity(quantity, digits = 6) {
  return quantity.value === null ? '—' : `${displayQuantityNumber(quantity, digits)} ${quantity.unit}`;
}
