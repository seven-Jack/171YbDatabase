import {CORE_TRANSITIONS, getTransitionRecord, getLevelRecord, getQuantity} from '../data/catalog.js';
import {channelKey, computeCGChannels, computeDEff, polarizationQ} from '../physics/angular.js';
import {calculateRabi} from '../physics/rabi.js';
import {DEFAULT_BEAM_DEFINITION, validateBeamDefinition, getBeamFactors, normalizeBeamInput, denormalizeSolvedInput} from '../physics/beam-conventions.js';
import {buildEvidenceView} from './evidence-model.js';

const transitionsById = new Map(CORE_TRANSITIONS.map(transition => [transition.id, transition]));
const channelFields = ['F', 'm', 'Fp', 'mp', 'q'];
const polarizations = ['pi', 'sigmap', 'sigmam'];
const close = (a, b) => Number.isFinite(a) && Number.isFinite(b)
  && Math.abs(a - b) <= 1e-10 * Math.max(Math.abs(a), Math.abs(b), 1e-30);
const copyChannel = channel => channel ? Object.fromEntries(channelFields.map(key => [key, channel[key]])) : null;

/** Only an id selects scientific fields; caller-provided adapters are not data authority. */
function canonicalIdentity(id) {
  const transition = transitionsById.get(id), record = getTransitionRecord(id);
  if (!transition || !record) return null;
  const lower = getLevelRecord(record.lowerLevelId), upper = getLevelRecord(record.upperLevelId);
  return {transition, record, quantity:getQuantity(id, 'd_num'),
    J_lower:lower?.attributes.J, J_upper:upper?.attributes.J};
}

function canonicalState(identity, selection) {
  return {
    transition:identity.transition,
    J_lower:identity.J_lower,
    J_upper:identity.J_upper,
    dReduced:identity.quantity?.value,
    convention:identity.quantity?.convention ?? null,
    wavelength_nm:getQuantity(identity.transition.id, 'wavelength_vac_nm')?.value ?? null,
    ...selection,
  };
}

function unitsFor(state) {
  const choices = {power:['W', 'mW', 'µW', 'nW'], rabi:['GHz', 'MHz', 'kHz', 'Hz'], waist:['mm', 'µm', 'nm']};
  const fallback = {power:choices.power.includes(state.powerUnit) ? state.powerUnit : 'mW',
    rabi:choices.rabi.includes(state.rabiUnit) ? state.rabiUnit : 'MHz', waist:'µm'};
  return Object.fromEntries(Object.entries(choices).map(([key, values]) =>
    [key, values.includes(state.calculatorUnits?.[key]) ? state.calculatorUnits[key] : fallback[key]]));
}

function sourceContext(state) {
  const base = {status:'invalid', message:'请先完成有效的当前计算，再比较同条件耦合。',
    P_mW:null, w_um:null, pol:null, channel:null, selectionOrigin:null};
  const fail = (status, message) => ({context:{...base, status, message}, source:null});
  const identity = canonicalIdentity(state?.transition?.id);
  if (!identity) return fail('unsupported', '当前跃迁不在已接入的核心目录中。');
  if (!String(identity.transition.multipole || '').startsWith('E1')) {
    return fail('unsupported', '当前跃迁没有适用的单光子 E1 模型，不能作为同条件比较基准。');
  }
  if (!(Number.isFinite(identity.quantity?.value) && identity.quantity.value > 0)) {
    return fail('unsupported', '当前跃迁缺少适用的约化矩阵元。');
  }
  if (state.inputStatus !== 'valid' || !Number.isFinite(state.P_mW) || state.P_mW < 0
      || !Number.isFinite(state.w_um) || !(state.w_um > 0)) return fail('invalid', base.message);
  if (!polarizations.includes(state.pol)) return fail('invalid', '当前偏振定义无效。');
  let beamDefinition, beamInput;
  try {
    beamDefinition = validateBeamDefinition(state.beamDefinition ?? DEFAULT_BEAM_DEFINITION);
    getBeamFactors(beamDefinition, state.pol);
    // Old snapshots may lack raw metadata; only use the existing inverse conversion.
    beamInput = state.beamInput == null
      ? denormalizeSolvedInput({P_mW:state.P_mW, w_um:state.w_um}, beamDefinition, state.pol)
      : {...state.beamInput};
    const normalized = normalizeBeamInput(beamInput, beamDefinition, state.pol);
    if (!close(normalized.P_mW, state.P_mW) || !close(normalized.w_um, state.w_um)) {
      return fail('invalid', '当前录入定义与规范化功率或束腰不一致，请先修正输入。');
    }
  } catch (error) {
    return fail('invalid', `当前输入定义待补正：${error.message}`);
  }
  const q = polarizationQ(state.pol);
  const source = canonicalState(identity, {
    F_lower:state.F_lower, F_upper:state.F_upper, pol:state.pol, selectedChannel:null,
    P_mW:state.P_mW, w_um:state.w_um, inputStatus:'valid', beamDefinition, beamInput,
  });
  const channels = computeCGChannels(source);
  const matchingPair = channel => channel.F === state.F_lower && channel.Fp === state.F_upper && channel.q === q;
  let channel, selectionOrigin;
  if (state.selectedChannel != null) {
    selectionOrigin = 'manual';
    const desired = state.selectedChannel;
    if (!channelFields.every(key => typeof desired[key] === 'number' && Number.isFinite(desired[key]))) {
      return fail('no-channel', '当前所选通道无效；比较不会自动改选最强通道。');
    }
    channel = channels.find(item => matchingPair(item) && channelKey(item) === channelKey(desired));
  } else {
    selectionOrigin = 'auto';
    const effective = computeDEff(source);
    channel = channels.find(item => matchingPair(item) && item.m === effective.mF && item.mp === effective.mFp);
  }
  if (!channel) return fail('no-channel', '当前 F、mF 或偏振通道不存在；比较不会自动改选其他通道。');
  source.selectedChannel = {...channel};
  source.dEff = Math.abs(channel.matEl);
  return {context:{status:'ready', message:'统一采用当前原子处分量功率、1/e² 强度半径和明确通道。',
    P_mW:source.P_mW, w_um:source.w_um, pol:source.pol, channel:copyChannel(channel), selectionOrigin}, source};
}

/** Compare one explicit physical channel without changing calculator or catalog state. */
export function buildEqualConditionComparison(transitions = [], state, versions = {}) {
  const {context, source} = sourceContext(state);
  const rows = transitions.map(requested => {
    const id = requested?.id ?? null, identity = canonicalIdentity(id);
    const row = {id, transition:identity?.transition ?? null, status:'invalid-context', message:context.message,
      channel:null, dEff_ea0:null, result:null, evidence:null, state:null};
    if (!source) return row;
    if (!identity) return {...row, status:'missing-data', message:'该跃迁不在已接入的核心目录中。'};
    if (!String(identity.transition.multipole || '').startsWith('E1')) {
      return {...row, status:'unsupported', message:'当前单光子 E1 比较模型不适用于该跃迁。'};
    }
    if (!(Number.isFinite(identity.quantity?.value) && identity.quantity.value > 0)) {
      return {...row, status:'missing-data', message:'缺少适用的约化矩阵元，未输出耦合数值。'};
    }
    const rowState = canonicalState(identity, {
      F_lower:context.channel.F, F_upper:context.channel.Fp, pol:source.pol, selectedChannel:null,
      P_mW:source.P_mW, w_um:source.w_um,
      beamDefinition:{...source.beamDefinition}, beamInput:{...source.beamInput},
      diagF_lower:'all', diagF_upper:'all', mode:'sp', calcMode:'power', solveFor:'rabi',
      calculatorUnits:unitsFor(state), inputStatus:'valid',
    });
    rowState.powerUnit = rowState.calculatorUnits.power;
    rowState.rabiUnit = rowState.calculatorUnits.rabi;
    const channel = computeCGChannels(rowState).find(item => channelKey(item) === channelKey(context.channel));
    if (!channel) return {...row, status:'no-channel', message:'该跃迁不存在相同的 F、mF、F′、mF′ 与偏振通道。'};
    const dEff = Math.abs(channel.matEl);
    const result = calculateRabi({dEff_ea0:dEff, multipole:identity.transition.multipole,
      P_mW:source.P_mW, w_um:source.w_um});
    if (result.status !== 'ok') {
      return {...row, status:'invalid-context', message:result.message || '该工作点无法得到有效耦合数值。'};
    }
    rowState.selectedChannel = {...channel};
    rowState.dEff = dEff;
    rowState.fR_MHz = result.fR / 1e6;
    return {...row, status:'ok', message:'同条件固定模型换算；不是文献实测 Rabi。',
      channel:{...channel}, dEff_ea0:dEff, result,
      evidence:buildEvidenceView(rowState, versions), state:rowState};
  });
  return {context, rows};
}
