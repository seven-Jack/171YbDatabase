import {getQuantity, getSourceRecord} from '../data/catalog.js';
import {EVIDENCE_VERSION} from '../data/evidence.js';
import {computeCGChannels, computeDEff, channelKey, polarizationQ} from '../physics/angular.js';
import {exportCalculationConfig, parseCalculationConfig, ConfigurationError} from '../state/config.js';
import {buildEvidenceView} from './evidence-model.js';
import {evidenceSourceURL} from './evidence-panel.js';

export const RECORD_SCHEMA_VERSION = 1;
export const RECORD_KIND = '171yb-rabi-record';
const ROOT_KEYS = ['schemaVersion','kind','exportedAt','build','configuration','transition','resolvedChannel','primaryQuantity','evidence','boundary'];
const TUPLE = ['F','m','Fp','mp','q'];
const PRIVATE_LOCATION = /(?:file:\/\/|\/Users\/|\/private\/|[A-Z]:\\|references\/papers\/|data\/literature\/)/i;
const BOUNDARY = '这是当前固定模型的计算记录，不是独立实验验证。输出为高斯光束中心的裸相干耦合，不包含运动、空间平均、失谐或多能级动力学；完整 Rabi 不确定度未建立。固定文献对照不代表本次输入，未知误差不填为零。恢复时仅提取配置，按当前数据、公式和证据版本重建结果。';
const RESTORE_NOTICE = '已从研究记录提取配置；保存的结果、矩阵元和证据状态仅作历史记录，恢复使用当前数据与公式重算，页面按当前证据版本重新核查。';
const copy = value => value == null ? value : structuredClone(value);
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

// Source records are already public metadata. Local-original pointers are deliberately omitted.
function publicMetadata(value) {
  if (typeof value === 'string') return PRIVATE_LOCATION.test(value) ? '本地原件定位未包含；请查公开来源' : value;
  if (Array.isArray(value)) return value.map(publicMetadata);
  if (plain(value)) return Object.fromEntries(Object.entries(value).map(([key,item]) => [key,publicMetadata(item)]));
  return value;
}

function sourceProjection(source) {
  if (!source) return null;
  const candidate = publicMetadata(source);
  return {
    id:candidate.id,
    title:candidate.detail || candidate.title || candidate.id,
    doi:typeof candidate.doi === 'string' ? candidate.doi : null,
    url:evidenceSourceURL(candidate),
    citation:[candidate.title,candidate.publication].filter(Boolean).join(' · ') || null,
  };
}

/** Build from the existing canonical recomputation path, never from cached display results. */
export function buildCalculationRecord(state, versions = {}) {
  if (!state || (state.inputStatus !== undefined && state.inputStatus !== 'valid')) throw new ConfigurationError('inputStatus','请先修正输入并得到有效结果，再导出研究记录。');
  const configuration = exportCalculationConfig(state,versions);
  const restored = parseCalculationConfig(configuration,versions);
  if (restored.result.status !== 'ok') throw new ConfigurationError('result','当前模型不适用或没有有效计算结果，不能导出研究记录。');
  const current = restored.state;
  const effective = computeDEff(current);
  const q = polarizationQ(current.pol);
  const candidates = computeCGChannels(current).filter(item => item.q === q && item.F === current.F_lower && item.Fp === current.F_upper);
  const actual = current.selectedChannel
    ? candidates.find(item => channelKey(item) === channelKey(current.selectedChannel))
    : candidates.find(item => item.m === effective.mF && item.mp === effective.mFp);
  if (!actual || !(effective.dEff > 0)) throw new ConfigurationError('selection.channel','没有可记录的实际允许通道。');
  const view = buildEvidenceView(current,{datasetHash:configuration.datasetHash,formulaVersion:configuration.formulaVersion});
  const quantity = getQuantity(configuration.transitionId,'d_num');
  const wavelength = getQuantity(configuration.transitionId,'wavelength_vac_nm');
  if (!quantity) throw new ConfigurationError('matrixElement','当前数据缺少矩阵元来源记录。');
  const record = {
    schemaVersion:RECORD_SCHEMA_VERSION,kind:RECORD_KIND,exportedAt:configuration.exportedAt,
    build:{softwareVersion:configuration.softwareVersion,appCommit:configuration.appCommit,worktreeDirty:typeof versions.worktreeDirty === 'boolean' ? versions.worktreeDirty : null},
    configuration,
    transition:{id:restored.transition.id,lower:restored.transition.lower,upper:restored.transition.upper,J_lower:current.J_lower,J_upper:current.J_upper,multipole:restored.transition.multipole,
      wavelength:{value:wavelength?.value ?? null,unit:wavelength?.unit ?? null,sourceId:wavelength?.sourceId ?? null,sourceLocator:wavelength?.sourceLocator ?? null,evidenceKind:wavelength?.evidenceKind ?? null,uncertainty:wavelength?.uncertainty ?? null}},
    resolvedChannel:{...Object.fromEntries(TUPLE.map(key => [key,actual[key]])),selectionOrigin:configuration.selection.channel === null ? 'auto' : 'manual',dEff_ea0:effective.dEff},
    primaryQuantity:{quantity:'d_num',value:quantity.value,unit:quantity.unit,convention:quantity.convention,
      sourceId:quantity.sourceId,sourceLocator:quantity.sourceLocator ?? null,evidenceKind:quantity.evidenceKind,reviewStatus:quantity.reviewStatus,
      uncertainty:quantity.uncertainty ?? null,uncertaintyNote:quantity.uncertaintyNote ?? null,conditions:copy(quantity.conditions ?? {}),source:sourceProjection(getSourceRecord(quantity.sourceId))},
    evidence:{evidenceVersion:EVIDENCE_VERSION,reviewVersion:view.reviewVersion,reviewedAt:view.reviewedAt,summary:view.summary,
      hasReview:view.hasReview,calculationStatus:view.calculationStatus,applicability:copy(view.applicability),rows:copy(view.rows),
      atomicSupport:copy(view.atomicSupport),comparisons:copy(view.comparisons),sources:copy(view.sources),missing:copy(view.missing)},
    boundary:BOUNDARY,
  };
  record.primaryQuantity = publicMetadata(record.primaryQuantity);
  record.transition = publicMetadata(record.transition);
  record.evidence = publicMetadata(record.evidence);
  return record;
}

function parseValue(value) {
  if (typeof value !== 'string') return value;
  if (value.length > 65536) throw new ConfigurationError('config','配置文件超过 64 KiB');
  try {return JSON.parse(value);} catch {throw new ConfigurationError('config','JSON 格式无效');}
}

/** The report is not an evidence-import format. Only its nested configuration can be restored. */
export function parseCalculationRecordOrConfig(value, versions = {}) {
  const input = parseValue(value);
  if (input?.kind !== RECORD_KIND) return parseCalculationConfig(input,versions);
  if (!plain(input)) throw new ConfigurationError('record','研究记录必须为普通对象');
  for (const key of Object.keys(input)) if (!ROOT_KEYS.includes(key)) throw new ConfigurationError(`record.${key}`,'未知字段');
  for (const key of ROOT_KEYS) if (!Object.hasOwn(input,key)) throw new ConfigurationError(`record.${key}`,'缺少研究记录字段');
  if (input.schemaVersion !== RECORD_SCHEMA_VERSION) throw new ConfigurationError('record.schemaVersion','仅支持研究记录版本 1');
  if (typeof input.exportedAt !== 'string' || input.exportedAt.length > 240 || !Number.isFinite(Date.parse(input.exportedAt))) throw new ConfigurationError('record.exportedAt','不是有效时间');
  for (const key of ['build','configuration','transition','resolvedChannel','primaryQuantity','evidence']) if (!plain(input[key])) throw new ConfigurationError(`record.${key}`,'必须为普通对象');
  if (typeof input.boundary !== 'string' || !input.boundary.trim() || input.boundary.length > 3000) throw new ConfigurationError('record.boundary','必须为有界说明文本');
  const restored = parseCalculationConfig(input.configuration,versions);
  return {...restored,warnings:[...restored.warnings,RESTORE_NOTICE]};
}

// Escape every data cell/paragraph; source URLs use the same whitelist as the website.
function md(value) {
  return String(value ?? '未记录').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/[\\`*_{}\[\]()#!|]/g,'\\$&').replace(/[\r\n\t]+/g,' ');
}
const valueText = value => value === null || value === undefined ? '未记录' : String(value);
const fraction = value => Number.isFinite(value) ? Number.isInteger(value) ? String(value) : `${value * 2}/2` : '未记录';
const signed = value => `${value > 0 ? '+' : ''}${fraction(value)}`;
const pol = value => ({'-1':'σ⁻','0':'π','1':'σ⁺'})[value] || '未记录';
const table = rows => ['| 项目 | 记录 |','|---|---|',...rows.map(([label,value]) => `| ${md(label)} | ${md(value)} |`)].join('\n');
const lines = values => values.filter(value => value !== null && value !== undefined && value !== '').map(value => `- ${md(value)}`).join('\n');
const tupleText = channel => `F=${fraction(channel.F)}, mF=${signed(channel.m)} → F′=${fraction(channel.Fp)}, mF′=${signed(channel.mp)} · ${pol(channel.q)}`;

function sourceMarkdown(source) {
  const url = evidenceSourceURL(source);
  const title = md(source.title || source.id || '来源');
  const link = url ? `[${title}](${url.replace(/[()]/g,character => character === '(' ? '%28' : '%29')})` : title;
  return `${link}${source.id ? ` · ${md(source.id)}` : ''}${source.doi ? ` · DOI: ${md(source.doi)}` : ''}${source.citation ? ` · ${md(source.citation)}` : ''}${Array.isArray(source.locations) ? `\n${lines(source.locations)}` : ''}`;
}

export function renderCalculationRecordMarkdown(record) {
  if (record?.kind !== RECORD_KIND || record.schemaVersion !== RECORD_SCHEMA_VERSION) throw new ConfigurationError('record','不是受支持的研究记录');
  const config = record.configuration, transition = record.transition, channel = record.resolvedChannel, primary = record.primaryQuantity, evidence = record.evidence;
  const definition = config.inputDefinition;
  const solve = {rabi:'功率、尺寸 → Rabi 频率',power:'Rabi 频率、尺寸 → 录入功率',waist:'功率、Rabi 频率 → 录入尺寸'}[config.display.solveFor] || '未记录';
  const dirty = record.build.worktreeDirty === true ? '含未提交改动；此提交仅为代码基线，不能保证精确复现当前运行代码。'
    : record.build.worktreeDirty === false ? '无未提交改动' : '构建工作区状态未知；不能仅凭代码基线保证精确复现。';
  const output = [
    `# ¹⁷¹Yb Rabi 研究记录 · ${md(config.transitionId)}`,
    `导出时间：${md(record.exportedAt)}`,
    md(record.boundary),
    '## 版本与代码基线',
    table([['记录格式',`${record.kind} / schema ${record.schemaVersion}`],['软件版本',record.build.softwareVersion],['代码基线',record.build.appCommit],['工作区',dirty],['数据版本',config.datasetVersion],['数据 SHA-256',config.datasetHash],['公式版本',config.formulaVersion],['证据版本',evidence.evidenceVersion],['核查版本',evidence.reviewVersion],['核查日期',evidence.reviewedAt]]),
    '## 计算对象与实际通道',
    table([['跃迁',`${transition.id} · ${transition.lower} → ${transition.upper}`],['电子角动量',`J=${transition.J_lower} → J′=${transition.J_upper}`],['多极性',transition.multipole],['真空波长',transition.wavelength.value === null ? '未记录' : `${transition.wavelength.value} ${transition.wavelength.unit}`],['波长证据类型',transition.wavelength.evidenceKind],['波长来源',transition.wavelength.sourceId],['波长原文定位',transition.wavelength.sourceLocator],['波长不确定度',transition.wavelength.uncertainty === null ? '未知／未建立（null，不是零）' : `${transition.wavelength.uncertainty} ${transition.wavelength.unit}`],['求解方向',solve],['通道选择',channel.selectionOrigin === 'manual' ? '手动选定' : '自动：当前 F 对及偏振内最强允许通道'],['实际通道',tupleText(channel)],['d_eff',`${channel.dEff_ea0} ea₀`],['约化矩阵元',`${config.matrixElement.reduced_ea0} ea₀`],['矩阵元约定',config.matrixElement.convention]]),
    '## 输入定义、录入值与规范化参数',
    '规范化参数是进入现有物理公式的原子处分量功率 Pq 和 1/e² 强度半径 w₀；不得再次拆分偏振或再除以直径因子。',
    table([['功率位置',definition.powerPlane === 'upstream' ? '上游' : '原子处'],['功率口径',definition.powerBasis === 'linear-total' ? '线偏振总功率' : '指定偏振分量功率'],['传输效率 η',definition.transmission ?? '未使用／未填写'],['线偏振方向',definition.linearOrientation ?? '未使用／未填写'],['手动分量占比',definition.manualFraction ?? '未使用／未填写'],['强度尺寸定义',definition.sizeKind === 'diameter' ? '1/e² 强度直径' : '1/e² 强度半径'],['录入功率',`${config.enteredParameters.power_W} W`],['录入尺寸',`${config.enteredParameters.size_m} m`],['原子处分量功率 Pq',`${config.parameters.power_W} W`],['1/e² 强度半径 w₀',`${config.parameters.waist_m} m`],['反算目标 Ω/2π',config.display.solveFor === 'rabi' ? '不适用（正算）' : `${config.parameters.targetRabi_Hz} Hz`]]),
    '## 当前模型结果',
    table([['计算状态',config.result.status],['Ω/2π',`${config.result.frequency_Hz} Hz`],['Ω',`${config.result.omega_rad_s} rad/s`],['π 脉冲时间',config.result.frequency_Hz === 0 && config.result.piTime_s === null ? '∞（零耦合；JSON 以 null 记录无限时间）' : `${valueText(config.result.piTime_s)} s`]]),
    '## 原采用矩阵元与来源',
    table([['来源 ID',primary.sourceId],['原文定位',primary.sourceLocator],['采用值',`${primary.value} ${primary.unit}`],['约定',primary.convention],['证据类型',primary.evidenceKind],['来源核查状态',primary.reviewStatus],['原记录矩阵元不确定度',primary.uncertainty === null ? '未知／未建立（null，不是零）' : `${primary.uncertainty} ${primary.unit}`],['不确定度口径',primary.uncertaintyNote],['完整 Rabi 不确定度','未建立；不把矩阵元误差当成功率、束腰与模型的完整误差']]),
    primary.source ? sourceMarkdown(primary.source) : '来源元数据未记录。',
    '原始条件与适用边界：',
    lines(Object.entries(primary.conditions || {}).map(([key,value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)),
    '## 分层证据状态',
    md(evidence.summary),
    table((evidence.rows || []).map(row => [row.label,`${row.statusText}〔${row.status}〕：${row.detail}`])),
  ];
  if (evidence.atomicSupport) {
    const support = evidence.atomicSupport;
    output.push('## 原子强度支持与数据链',md(support.title),md(support.summary),table((support.quantities || []).map(item => [item.label,`${item.value} ${item.unit} · ${item.evidenceKind}`])),md(support.boundary));
  }
  if (evidence.comparisons?.length) {
    output.push('## 固定文献对照（非本次输入）','以下为保存的文献基准或条件比较，不随本次录入功率与尺寸变化，也不构成独立实验验证。');
    for (const comparison of evidence.comparisons) {
      output.push(`### ${md(comparison.title)}`,md(`状态：${comparison.status}；${comparison.scopeText}`),lines(comparison.assumptions || []));
      if (comparison.kind === 'theory-benchmark') output.push(table([['已核通道',tupleText(comparison.channel)],['固定功率',`${comparison.power_mW} mW`],['固定 1/e² 半径',`${comparison.waist_um} µm`],['理论复算 Ω/2π',`${comparison.calculatedRabi_MHz} MHz`],['文献 Ω/2π',`${comparison.publishedRabi_MHz} ± ${comparison.publishedRabiUncertainty_MHz} MHz`]]));
      else {
        if (comparison.reference) output.push(md(`${comparison.reference.label}：${comparison.reference.value} ${comparison.reference.unit}（${comparison.reference.evidenceKind}）`));
        output.push(table((comparison.rows || []).map(row => [`${row.power_mW} mW · ${row.powerLabel}`,`Ω/2π=${row.rabi_kHz} kHz；相对文献值 ${row.relativeDifferencePercent}%`])));
      }
      output.push(md(comparison.normalizationNote),md(comparison.boundary));
    }
  }
  output.push('## 证据适用性',table(Object.entries(evidence.applicability || {}).map(([key,value]) => [key,Array.isArray(value) ? value.join('；') : value])),'## 待补证据',evidence.missing?.length ? lines(evidence.missing) : '本轮没有接入该跃迁的待补清单，不表示证据已闭合。');
  if (evidence.sources?.length) output.push('## 支持文献',...evidence.sources.map(sourceMarkdown));
  output.push('## 恢复与复算','JSON 研究记录可通过页面“恢复计算配置”载入，页面仅提取嵌套 configuration，并使用当前数据、公式与证据版本重新计算和核查；不会把文件中的保存结果、矩阵元或核查结论作为当前依据。旧 v1/v2 配置恢复方式保持不变。');
  return output.filter(item => item !== '').join('\n\n')+'\n';
}

export function serializeCalculationRecord(record, format = 'json') {
  if (record?.kind !== RECORD_KIND || record.schemaVersion !== RECORD_SCHEMA_VERSION) throw new ConfigurationError('record','不是受支持的研究记录');
  if (format === 'json') return JSON.stringify(record,null,2)+'\n';
  if (format === 'markdown') return renderCalculationRecordMarkdown(record);
  throw new ConfigurationError('format','仅支持 JSON 或 Markdown 研究记录');
}
