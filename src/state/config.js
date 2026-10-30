import { CORE_LEVELS, CORE_TRANSITIONS, RYDBERG_QC_TRANSITIONS, RYDBERG_QC_DATA, DATASET_MANIFEST, DATASET_VERSION, getQuantity } from '../data/catalog.js';
import { FORMULA_VERSION, PhysicsInputError } from '../physics/constants.js';
import { computeCGChannels, computeDEff, getFs, channelKey, polarizationQ } from '../physics/angular.js';
import { calculateRabi, powerFromRabiHz } from '../physics/rabi.js';

export const CONFIG_SCHEMA_VERSION = 1;
const POLARIZATIONS = ['pi', 'sigmap', 'sigmam'];
const KEYS = ['schemaVersion', 'kind', 'exportedAt', 'softwareVersion', 'appCommit', 'datasetVersion', 'datasetHash', 'formulaVersion', 'transitionId', 'matrixElement', 'selection', 'parameters', 'display', 'result'];
const transitions = new Map([...RYDBERG_QC_TRANSITIONS, ...CORE_TRANSITIONS].map(t => [t.id, t]));
const Q = ['F', 'm', 'Fp', 'mp', 'q'];

export class ConfigurationError extends Error {
  constructor(field, message) {
    super(`${field}: ${message}`);
    this.name = 'ConfigurationError';
    this.field = field;
  }
}
function object(value, field, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new ConfigurationError(field, '必须为普通对象');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new ConfigurationError(`${field}.${key}`, '未知字段');
  return value;
}
function text(value, field, nullable = false) {
  if (nullable && value === null) return value;
  if (typeof value !== 'string' || !value.trim() || value.length > 240) throw new ConfigurationError(field, '必须为非空短字符串');
  return value;
}
function number(value, field, minimum = 0, exclusive = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || (exclusive ? value <= minimum : value < minimum)) throw new ConfigurationError(field, exclusive ? `必须为大于 ${minimum} 的有限数值` : `必须为不小于 ${minimum} 的有限数值`);
  return value;
}
function option(value, field, options) {
  if (!options.includes(value)) throw new ConfigurationError(field, `必须为 ${options.join(' / ')} 之一`);
  return value;
}
function getJ(term) {
  const J = CORE_LEVELS.find(level => level.term === term)?.J ?? RYDBERG_QC_DATA.rydStates.find(level => level.label === term)?.J;
  if (J === undefined) throw new ConfigurationError('transitionId', `当前数据缺少能级 ${term} 的 J`);
  return J;
}
function currentVersions(overrides = {}) {
  return {
    softwareVersion: overrides.softwareVersion ?? 'unrecorded', appCommit: overrides.appCommit ?? null,
    datasetVersion: overrides.datasetVersion ?? DATASET_VERSION,
    datasetHash: overrides.datasetHash ?? DATASET_MANIFEST.contentHash,
    formulaVersion: overrides.formulaVersion ?? FORMULA_VERSION,
  };
}
function canonicalDipole(transition) {
  const record = getQuantity(transition.id, 'd_num');
  const raw = record ? record.value : transition.d_num;
  return {
    reduced_ea0: typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : null,
    convention: record?.convention || (transition.hf_induced ? 'F-reduced-effective' : 'J-reduced'),
    sourceId: record?.sourceId || null,
  };
}
function resultSnapshot(result, P_mW) {
  const output = { status: result.status, power_W: P_mW * 1e-3, frequency_Hz: null, omega_rad_s: null, piTime_s: null };
  if (result.status === 'ok') {
    output.frequency_Hz = result.fR;
    output.omega_rad_s = result.omega_rad_s;
    output.piTime_s = Number.isFinite(result.tPi) ? result.tPi : null;
  }
  return output;
}

function restoreAgainstCatalog(config) {
  const transition = transitions.get(config.transitionId);
  if (!transition) throw new ConfigurationError('transitionId', `当前数据没有跃迁 ${config.transitionId}`);
  const selection = config.selection, dipole = canonicalDipole(transition);
  const J_lower = getJ(transition.lower), J_upper = getJ(transition.upper);
  for (const [key, values] of [['F_lower', getFs(J_lower)], ['F_upper', getFs(J_upper)]]) {
    if (!values.includes(selection[key])) throw new ConfigurationError(`selection.${key}`, '与当前跃迁角动量不匹配');
  }
  for (const [key, values] of [['diagF_lower', getFs(J_lower)], ['diagF_upper', getFs(J_upper)]]) {
    if (selection[key] !== 'all' && !values.includes(selection[key])) throw new ConfigurationError(`selection.${key}`, '不是当前跃迁的可用 F 值');
  }
  const solveFor = config.display.solveFor ?? (config.display.calcMode === 'rabi' ? 'power' : 'rabi');
  const calculatorUnits = config.display.units ?? { power: config.display.powerUnit, rabi: config.display.rabiUnit, waist: 'µm' };
  const state = {
    transition, dReduced: dipole.reduced_ea0 ?? 0, J_lower, J_upper,
    wavelength_nm: transition.wavelength_vac_nm,
    gamma_kHz: typeof transition.Gamma_per_s_num === 'number' ? transition.Gamma_per_s_num / (2 * Math.PI) / 1e3 : null,
    F_lower: selection.F_lower, F_upper: selection.F_upper,
    diagF_lower: selection.diagF_lower, diagF_upper: selection.diagF_upper,
    pol: selection.pol, selectedChannel: null,
    mode: 'sp', calcMode: solveFor === 'power' ? 'rabi' : 'power', solveFor,
    powerUnit: config.display.powerUnit, rabiUnit: config.display.rabiUnit,
    calculatorUnits: { ...calculatorUnits },
    P_mW: config.parameters.power_W / 1e-3,
    w_um: config.parameters.waist_m / 1e-6,
    fR_MHz: config.parameters.targetRabi_Hz / 1e6,
  };
  if (selection.channel !== null) {
    const desired = selection.channel;
    if (desired.q !== polarizationQ(state.pol) || desired.F !== state.F_lower || desired.Fp !== state.F_upper) throw new ConfigurationError('selection.channel', '通道与 F 选择或偏振不一致');
    const channel = computeCGChannels(state).find(ch => channelKey(ch) === channelKey(desired));
    if (!channel) throw new ConfigurationError('selection.channel', '当前模型和数据中不存在该允许通道');
    state.selectedChannel = { ...channel }; // imported matEl is never used
  }
  const effective = computeDEff(state);
  state.dEff = effective.dEff;
  if (solveFor === 'power' && state.dEff > 0 && String(transition.multipole).startsWith('E1')) state.P_mW = powerFromRabiHz(state.dEff, config.parameters.targetRabi_Hz, state.w_um);
  const result = calculateRabi({ dEff_ea0: dipole.reduced_ea0 === null ? null : state.dEff, multipole: transition.multipole, P_mW: state.P_mW, w_um: state.w_um });
  return { state, transition, result, dipole };
}

function validateStructure(config) {
  object(config, 'config', KEYS);
  if (config.schemaVersion !== CONFIG_SCHEMA_VERSION) throw new ConfigurationError('schemaVersion', '仅支持配置版本 1');
  if (config.kind !== '171yb-rabi-config') throw new ConfigurationError('kind', '不是 171Yb 固定模型 Rabi 配置');
  text(config.exportedAt, 'exportedAt');
  if (!Number.isFinite(Date.parse(config.exportedAt))) throw new ConfigurationError('exportedAt', '不是有效时间');
  for (const key of ['softwareVersion', 'datasetVersion', 'datasetHash', 'formulaVersion', 'transitionId']) text(config[key], key);
  text(config.appCommit, 'appCommit', true);
  if (!/^[a-f0-9]{64}$/i.test(config.datasetHash)) throw new ConfigurationError('datasetHash', '必须为 SHA-256 十六进制摘要');
  object(config.matrixElement, 'matrixElement', ['reduced_ea0', 'convention', 'sourceId']);
  if (config.matrixElement.reduced_ea0 !== null) number(config.matrixElement.reduced_ea0, 'matrixElement.reduced_ea0');
  text(config.matrixElement.convention, 'matrixElement.convention'); text(config.matrixElement.sourceId, 'matrixElement.sourceId', true);
  const s = object(config.selection, 'selection', ['F_lower', 'F_upper', 'diagF_lower', 'diagF_upper', 'pol', 'channel']);
  number(s.F_lower, 'selection.F_lower'); number(s.F_upper, 'selection.F_upper');
  for (const key of ['diagF_lower', 'diagF_upper']) if (s[key] !== 'all') number(s[key], `selection.${key}`);
  option(s.pol, 'selection.pol', POLARIZATIONS);
  if (s.channel !== null) {
    object(s.channel, 'selection.channel', Q);
    for (const key of Q) {
      if (typeof s.channel[key] !== 'number' || !Number.isFinite(s.channel[key])) throw new ConfigurationError(`selection.channel.${key}`, '必须为有限数值');
    }
  }
  const p = object(config.parameters, 'parameters', ['power_W', 'waist_m', 'targetRabi_Hz']);
  number(p.power_W, 'parameters.power_W'); number(p.waist_m, 'parameters.waist_m', 0, true); number(p.targetRabi_Hz, 'parameters.targetRabi_Hz');
  const d = object(config.display, 'display', ['powerUnit', 'rabiUnit', 'calcMode', 'solveFor', 'units']);
  option(d.powerUnit, 'display.powerUnit', ['W', 'mW', 'µW', 'nW']); option(d.rabiUnit, 'display.rabiUnit', ['Hz', 'kHz', 'MHz', 'GHz']); option(d.calcMode, 'display.calcMode', ['power', 'rabi']);
  if (d.solveFor !== undefined) option(d.solveFor, 'display.solveFor', ['rabi', 'power', 'waist']);
  if (d.units !== undefined) {
    object(d.units, 'display.units', ['power', 'rabi', 'waist']);
    option(d.units.power, 'display.units.power', ['W', 'mW', 'µW', 'nW']);
    option(d.units.rabi, 'display.units.rabi', ['Hz', 'kHz', 'MHz', 'GHz']);
    option(d.units.waist, 'display.units.waist', ['mm', 'µm', 'nm']);
  }
  const r = object(config.result, 'result', ['status', 'power_W', 'frequency_Hz', 'omega_rad_s', 'piTime_s']);
  option(r.status, 'result.status', ['ok', 'missing-data', 'forbidden', 'unsupported', 'invalid-input']);
  for (const key of ['power_W', 'frequency_Hz', 'omega_rad_s', 'piTime_s']) if (r[key] !== null) number(r[key], `result.${key}`);
}

/** Parse and recompute using current catalog/formulas; never trust stored results. */
export function parseCalculationConfig(value, versions = {}) {
  let config;
  if (typeof value === 'string') {
    if (value.length > 65536) throw new ConfigurationError('config', '配置文件超过 64 KiB');
    try { config = JSON.parse(value); } catch { throw new ConfigurationError('config', 'JSON 格式无效'); }
  } else config = value;
  validateStructure(config);
  const current = currentVersions(versions), warnings = [];
  for (const [key, label] of [['softwareVersion', '软件版本'], ['appCommit', '代码提交'], ['datasetVersion', '数据版本'], ['datasetHash', '数据摘要'], ['formulaVersion', '公式版本']]) {
    if (current[key] && current[key] !== 'unrecorded' && config[key] !== current[key]) warnings.push(`${label}不同：文件 ${config[key]}；当前 ${current[key]}。恢复时使用当前数据和公式。`);
  }
  let restored;
  try { restored = restoreAgainstCatalog(config); }
  catch (error) {
    if (error instanceof PhysicsInputError) throw new ConfigurationError(error.field, error.message);
    throw error;
  }
  if (config.matrixElement.reduced_ea0 !== restored.dipole.reduced_ea0 || config.matrixElement.convention !== restored.dipole.convention || config.matrixElement.sourceId !== restored.dipole.sourceId) warnings.push('保存的矩阵元、约定或来源与当前数据不同；已使用当前数据，未采用导入值。');
  const result = resultSnapshot(restored.result, restored.state.P_mW);
  if (Object.keys(result).some(key => {
    const old = config.result[key], now = result[key];
    return typeof now === 'number' && typeof old === 'number' ? Math.abs(now - old) > 1e-12 * Math.max(1, Math.abs(now)) : now !== old;
  })) warnings.push('保存结果与当前重算结果不同；展示当前重算结果，保存值仅作为历史记录。');
  return { config: structuredClone(config), state: restored.state, transition: restored.transition, result: restored.result, warnings };
}

export function validateCalculationConfig(value, versions = {}) {
  try { return { valid: true, errors: [], ...parseCalculationConfig(value, versions) }; }
  catch (error) {
    if (!(error instanceof ConfigurationError)) throw error;
    return { valid: false, errors: [{ field: error.field, message: error.message }], warnings: [] };
  }
}

/** Export only the fixed-model context; this is not evidence of physical validity. */
export function exportCalculationConfig(state, versions = {}) {
  const transitionId = state?.transition?.id ?? state?.transitionId;
  const transition = transitions.get(transitionId);
  if (!transition) throw new ConfigurationError('transitionId', '请先选择当前数据中的跃迁');
  const solveFor = state.solveFor ?? (state.calcMode === 'rabi' ? 'power' : 'rabi');
  const config = {
    schemaVersion: CONFIG_SCHEMA_VERSION, kind: '171yb-rabi-config', exportedAt: new Date().toISOString(),
    ...currentVersions(versions), transitionId,
    matrixElement: canonicalDipole(transition),
    selection: { F_lower: state.F_lower, F_upper: state.F_upper, diagF_lower: state.diagF_lower ?? 'all', diagF_upper: state.diagF_upper ?? 'all', pol: state.pol, channel: state.selectedChannel ? Object.fromEntries(Q.map(key => [key, state.selectedChannel[key]])) : null },
    parameters: { power_W: typeof state.P_mW === 'number' ? state.P_mW * 1e-3 : state.P_mW, waist_m: typeof state.w_um === 'number' ? state.w_um * 1e-6 : state.w_um, targetRabi_Hz: typeof state.fR_MHz === 'number' ? state.fR_MHz * 1e6 : 0 },
    display: { powerUnit: state.powerUnit ?? 'mW', rabiUnit: state.rabiUnit ?? 'MHz', calcMode: solveFor === 'power' ? 'rabi' : 'power', solveFor,
      units: state.calculatorUnits ? { power: state.calculatorUnits.power, rabi: state.calculatorUnits.rabi, waist: state.calculatorUnits.waist } : { power: state.powerUnit ?? 'mW', rabi: state.rabiUnit ?? 'MHz', waist: 'µm' } },
    result: { status: 'ok', power_W: 0, frequency_Hz: null, omega_rad_s: null, piTime_s: null },
  };
  validateStructure(config);
  const restored = restoreAgainstCatalog(config);
  config.parameters.power_W = restored.state.P_mW * 1e-3;
  config.result = resultSnapshot(restored.result, restored.state.P_mW);
  return config;
}
