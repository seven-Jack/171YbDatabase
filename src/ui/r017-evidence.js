import {CATALOG, DATASET_MANIFEST, getLevelRecord, getSourceRecord} from '../data/catalog.js';
import {EVIDENCE} from '../data/evidence.js';
import {channelKey} from '../physics/angular.js';
import {signedScientific} from './format.js';

/** Attribute saved state quantities and resolve the live angular projection to its archived CSV row. */
export function buildR017Evidence({record, state, channel, versions, inputValid, applicable}) {
  const audit = EVIDENCE.r017Series;
  const series = CATALOG['rydberg-series'];
  const dipole = record.quantities.d_num;
  const {n, Fp, nu, branch, B_T, E_V_m, numericalReview} = dipole.conditions;
  const source = getSourceRecord(dipole.sourceId);
  const sourceMatch = source?.artifactSha256 === audit.datasetSha256 && series.sourceSha256 === audit.datasetSha256
    && source.batchId === series.sourceBatch && Number.isInteger(n) && n >= audit.firstN && n <= audit.lastN;
  const datasetMatch = versions.datasetHash === DATASET_MANIFEST.contentHash;
  const formulaMatch = versions.formulaVersion === audit.formulaVersion;
  const levelMatch = state.J_lower === getLevelRecord(record.lowerLevelId).attributes.J
    && state.J_upper === record.views.rydberg.presentation.upperJ;
  const conventionMatch = dipole.convention === 'F-reduced' && (state.convention ?? dipole.convention) === dipole.convention
    && state.dReduced === dipole.value && state.transition.fReducedDipoles?.[Fp] === dipole.value;
  const offset = channel ? audit.csvChannelOrder.findIndex(row => channelKey(row) === channelKey(channel)) : -1;
  const channelMatch = offset >= 0 && state.F_lower === channel.F && state.F_upper === Fp && channel.Fp === Fp;
  const projectionReady = applicable && sourceMatch && datasetMatch && formulaMatch && levelMatch && conventionMatch && channelMatch;
  // The pinned CSV has a header followed by these ten channel tuples for each n in ascending order.
  const channelLine = projectionReady ? 2 + (n - audit.firstN) * audit.csvChannelOrder.length + offset : null;
  const gridChecked = sourceMatch && numericalReview === 'passed_declared_89c4_nonshortened_grid';
  const reasons = [];
  if (!sourceMatch || !datasetMatch) reasons.push('当前数据与 R017 交付记录需重核');
  if (!formulaMatch || !conventionMatch || !levelMatch) reasons.push('当前矩阵元或公式约定需重核');
  if (!channelMatch || !applicable) reasons.push('请选择该分支的有效磁子态通道');
  const sourceRows = [
    {key:'source', label:'本工作计算值', status:'internal-calculation',
      statusText:`D_F = ${signedScientific(dipole.value, 6)} ea₀`,
      detail:`有效主量子数 ν = ${nu}（相对离子芯 F_c=1）。F 约化矩阵元采用 RydCalc 态相位。`},
    {key:'spectrum', label:'由模型推导的光谱', status:'model-derived',
      statusText:`λ = ${record.quantities.wavelength_vac_nm.value.toFixed(6)} nm`,
      detail:'由该分支的 ν、离子芯阈值、质量修正里德堡常数和 ³P₀ 能量基准换算真空波长。'},
    {key:'formula', label:'当前磁子态通道', status:projectionReady ? 'channel-projection' : 'needs-review',
      statusText:projectionReady ? `M_fi = ${signedScientific(channel.matEl, 6)} ea₀` : '当前通道待核',
      detail:projectionReady ? 'M_fi = CG × D_F / √(2F′+1)。Rabi 频率取决于 |M_fi|、原子处分量功率和束腰。' : reasons.join('。')},
    {key:'experiment', label:'数值检查与实验状态', status:'not-closed',
      statusText:gridChecked ? '已通过指定径向网格检查' : '径向网格检查待核',
      detail:`${gridChecked ? '检查范围为 R017 测试过的未缩短径向边界网格。' : ''}总物理不确定度尚未量化，当前通道尚无独立实验标定记录。`},
  ];
  return {
    hasReview:true, primarySourceId:dipole.sourceId, summary:'This work · R017 零场计算',
    reviewVersion:EVIDENCE.evidenceVersion, reviewedAt:source.artifactCheckedOn,
    calculationSource:{
      conditions:`¹⁷¹Yb ³P₀ → ${n}S · ${branch} · RydCalc · B = ${B_T} T · 静电场 E = ${E_V_m} V/m`,
      batchId:source.batchId, stateId:dipole.sourceLocator, codeRevision:source.codeRevision,
      datasetUrl:source.artifactLocator, datasetSha256:source.artifactSha256,
      channelLine, channelTableSha256:audit.channelTableSha256,
      channelUrl:channelLine === null ? null : new URL(`channel_matrix_elements.csv?plain=1#L${channelLine}`, source.artifactLocator).href,
    },
    rows:sourceRows, atomicSupport:null, comparisons:[], sources:[], missing:[],
    applicability:{datasetMatch, formulaMatch, sourceMatch, levelMatch, conventionMatch, channelMatch, inputValid, applicable, reasons},
  };
}
