import {DATASET_MANIFEST, getQuantity, getTransitionRecord} from '../data/catalog.js';
import {EVIDENCE_VERSION, getEvidenceRecord, getEvidenceSource, getEvidenceComparison} from '../data/evidence.js';
import {FORMULA_VERSION} from '../physics/constants.js';
import {channelKey, computeCGChannels, computeDEff, polarizationQ} from '../physics/angular.js';
import {DEFAULT_BEAM_DEFINITION, validateBeamDefinition, getBeamFactors} from '../physics/beam-conventions.js';

const labels = {source:'原文定位', formula:'公式与通道核查', comparison:'条件比较', experiment:'独立实验验证'};
const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-10 * Math.max(Math.abs(a), Math.abs(b), 1e-30);
const fraction = value => Number.isFinite(value) ? String(Number.isInteger(value) ? value : `${value * 2}/2`) : '—';
const magnetic = value => `${value > 0 ? '+' : ''}${fraction(value)}`;
const polLabel = q => ({'-1':'σ⁻', '0':'π', '1':'σ⁺'})[q] || '偏振待补';
const row = (key, status, statusText, detail) => ({key, label:labels[key], status, statusText, detail});
const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));

/** Evidence describes a reviewed context; it never changes inputs or authorizes a validation claim. */
export function buildEvidenceView(state = {}, versionsOverrides = {}) {
  const transition = state.transition;
  const transitionId = transition?.id || null;
  const canonical = getTransitionRecord(transitionId);
  const quantity = getQuantity(transitionId, 'd_num');
  const review = getEvidenceRecord(transitionId);
  const versions = {
    datasetHash:versionsOverrides.datasetHash ?? DATASET_MANIFEST.contentHash,
    formulaVersion:versionsOverrides.formulaVersion ?? FORMULA_VERSION,
  };
  const applicable = !!canonical && String(transition.multipole || '').startsWith('E1') && Number.isFinite(quantity?.value) && quantity.value > 0;
  let definition, definitionValid = true;
  try {
    definition = validateBeamDefinition(state.beamDefinition || DEFAULT_BEAM_DEFINITION);
    getBeamFactors(definition, state.pol || 'pi');
  } catch {
    definitionValid = false;
    definition = Object.fromEntries(Object.keys(DEFAULT_BEAM_DEFINITION).map(key => [key, state.beamDefinition?.[key] ?? DEFAULT_BEAM_DEFINITION[key]]));
  }
  let channel = null, q = null, channelError = false;
  try {
    q = polarizationQ(state.pol);
    if (applicable) {
      const channels = computeCGChannels(state).filter(item => item.q === q);
      const selected = state.selectedChannel && channels.find(item => channelKey(item) === channelKey(state.selectedChannel));
      const effective = computeDEff(state);
      channel = selected || channels.find(item => item.F === state.F_lower && item.Fp === state.F_upper && item.m === effective.mF && item.mp === effective.mFp) || null;
      channelError = !!state.selectedChannel && !selected;
    }
  } catch { channelError = true; }
  const inputValid = definitionValid && (state.inputStatus === undefined || state.inputStatus === 'valid')
    && Number.isFinite(state.P_mW) && state.P_mW >= 0 && Number.isFinite(state.w_um) && state.w_um > 0;
  const channelReady = !!channel && (state.dEff === undefined || close(state.dEff, Math.abs(channel.matEl)));
  const calculationStatus = !transition ? 'unselected' : !applicable || state.inputStatus === 'unsupported' ? 'unsupported' : inputValid && channelReady ? 'valid' : 'invalid';
  const primarySourceId = quantity?.sourceId || null;
  const datasetMatch = !!review && versions.datasetHash === review.appliesTo.datasetHash;
  const formulaMatch = !!review && versions.formulaVersion === review.appliesTo.formulaVersion;
  const conventionMatch = !!review && quantity?.convention === review.appliesTo.convention
    && (state.convention === undefined || state.convention === review.appliesTo.convention || state.convention === 'F-reduced')
    && close(quantity?.value, review.appliesTo.dipole_ea0) && close(state.dReduced, review.appliesTo.dipole_ea0);
  const channelMatch = !!review && !!channel && !channelError
    && state.F_lower === review.appliesTo.F && state.F_upper === review.appliesTo.Fp
    && channel.F === review.appliesTo.F && channel.Fp === review.appliesTo.Fp && review.appliesTo.q.includes(q)
    && (state.dEff === undefined || close(state.dEff, Math.abs(channel.matEl)));
  const reasons = [];
  if (review && !datasetMatch) reasons.push('数据版本已变化');
  if (review && !formulaMatch) reasons.push('公式版本已变化');
  if (review && !conventionMatch) reasons.push('矩阵元数值或约定与核查记录不匹配');
  if (review && !channelMatch) reasons.push('当前 F、mF 或偏振通道与核查范围不匹配');
  if (!inputValid && transition && applicable) reasons.push('当前计算输入待补正');
  if (!applicable && transition) reasons.push('当前单光子 E1 核查不适用');
  const applicability = {datasetMatch, formulaMatch, conventionMatch, channelMatch, inputValid, applicable, reasons};
  const contextKey = JSON.stringify({transitionId, F:state.F_lower ?? null, Fp:state.F_upper ?? null,
    channel:channel ? channelKey(channel) : null, requestedChannel:state.selectedChannel ? channelKey(state.selectedChannel) : null,
    q, d:state.dReduced ?? null,
    dEff:Number.isFinite(state.dEff) ? state.dEff : state.dEff === undefined ? 'unprovided' : String(state.dEff),
    convention:state.convention ?? quantity?.convention ?? null,
    multipole:transition?.multipole ?? null, applicable,
    beamDefinition:definition, inputStatus:calculationStatus, stateInputStatus:state.inputStatus ?? 'unreported', datasetHash:versions.datasetHash,
    formulaVersion:versions.formulaVersion, evidenceVersion:EVIDENCE_VERSION});
  const beamText = `${definition.powerPlane === 'upstream' ? '上游' : '原子处'}${definition.powerBasis === 'linear-total' ? '总线偏振功率' : '指定分量功率'} · 1/e² 强度${definition.sizeKind === 'diameter' ? '直径' : '半径'}`;
  const selectionText = channel ? `F=${fraction(channel.F)}, mF=${magnetic(channel.m)} → F′=${fraction(channel.Fp)}, mF′=${magnetic(channel.mp)} · ${polLabel(q)}` : '通道待确认';
  const contextText = transition ? `${transitionId} · ${selectionText} · ${beamText}${calculationStatus === 'invalid' ? ' · 当前计算输入待补正' : ''}` : '请选择跃迁';
  if (!review || !applicable) {
    const status = transition && !applicable ? 'not-applicable' : 'not-reviewed';
    const statusText = status === 'not-applicable' ? '不适用' : '本轮未接入';
    return {transitionId, contextKey, hasReview:false, primarySourceId,
      summary:status === 'not-applicable' ? '当前单光子 E1 模型不适用' : '模型换算 · 未独立验证 · 本轮证据面板未接入该跃迁核查',
      contextText, calculationStatus, reviewVersion:null, reviewedAt:null,
      rows:Object.keys(labels).map(key => row(key, status, statusText, status === 'not-applicable' ? '当前缺少适用的单光子 E1 矩阵元或通道；不套用 578 nm 核查。' : '本轮面板尚未接入该跃迁的分层核查状态；保留原有数值出处与审计，不套用 578 nm 结论。')),
      atomicSupport:null, comparisons:[], sources:[], missing:[], applicability};
  }
  const formulaChecked = datasetMatch && formulaMatch && conventionMatch && channelMatch;
  const comparisonCurrent = datasetMatch && formulaMatch && conventionMatch && channelMatch;
  const rows = [
    row('source', 'checked', review.sourceStatusText, review.sourceDetail),
    row('formula', formulaChecked ? 'checked' : 'needs-review', formulaChecked ? '当前约定与通道已核' : '当前上下文需重核', `${review.formulaDetail}${formulaChecked ? '' : ` ${reasons.filter(reason => reason !== '当前计算输入待补正').join('；')}。`}`),
    row('comparison', comparisonCurrent ? 'conditional' : 'needs-review', comparisonCurrent ? '仅条件比较' : '需按当前版本与通道重核', review.comparisonDetail),
    row('experiment', 'not-closed', '未闭合 · 未独立验证', review.experimentDetail),
  ];
  return {transitionId, contextKey, hasReview:true, primarySourceId,
    summary:`${review.summary}${formulaChecked ? '' : ' · 当前上下文需重核'}`,
    contextText, calculationStatus, reviewVersion:review.reviewVersion, reviewedAt:review.reviewedAt,
    rows, atomicSupport:copy(review.atomicSupport),
    comparisons:review.comparisonIds.map(getEvidenceComparison).filter(Boolean).map(item => ({...copy(item), status:comparisonCurrent ? 'conditional' : 'needs-review'})),
    sources:review.sourceIds.map(getEvidenceSource).filter(Boolean).map(copy), missing:[...review.missing], applicability};
}
