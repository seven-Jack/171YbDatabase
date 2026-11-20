import {CATALOG, DATASET_MANIFEST, getQuantity, getRydbergPair, getSourceRecord, getTransitionRecord} from '../data/catalog.js';

const series = CATALOG['rydberg-series'];
const labels = {current:'当前版本采用', historical:'历史对照', pending:'暂不用于 E1 计算'};
const manifestPolicy = {path:'data/dataset.json', version:DATASET_MANIFEST.datasetVersion, reviewStatus:DATASET_MANIFEST.reviewStatus};

export function isZeroField(conditions) {
  return (conditions?.B_T === 0 && conditions?.E_V_m === 0)
    || (conditions?.magneticField_G === 0 && conditions?.electricField_V_cm === 0);
}

function dipoleFields(recordId, Fp) {
  const branches = Object.entries(getTransitionRecord(recordId)?.fReducedDipoles ?? {})
    .map(([branch, field]) => ({Fp:Number(branch), field}));
  if (!branches.length) return getQuantity(recordId,'d_num') ? [{field:'d_num'}] : [];
  const selected = branches.find(branch => branch.Fp === Fp);
  // A single-branch record always describes its own field, including an unmatched comparison row.
  return selected ? [selected] : branches;
}

/** Release membership describes this version's calculation choice. Scientific review is a separate field. */
export function getRecordAdoption(recordId, Fp) {
  const fields = dipoleFields(recordId,Fp);
  const quantities = fields.map(({field}) => getQuantity(recordId,field));
  const fieldSources = new Set(quantities.map(quantity => quantity.sourceId));
  const sourceId = fieldSources.size === 1 ? quantities[0].sourceId : recordId === 'ref-17' ? recordId : null;
  const firstConditions = quantities[0]?.conditions ?? null;
  const conditions = fields.length > 1 ? Object.fromEntries(Object.entries(firstConditions ?? {})
    .filter(([key,value]) => quantities.every(quantity => Object.is(quantity.conditions?.[key],value)))) : firstConditions;
  const source = getSourceRecord(sourceId);
  const isSeries = recordId?.startsWith('NS-') && sourceId === series.sourceId;
  const old65 = recordId === 'R2' || recordId === 'ref-17';
  const legacyEstimate = sourceId === 'legacy-scaling';
  const hasValues = quantities.length > 0 && quantities.every(quantity => Number.isFinite(quantity.value));
  const status = (old65 || legacyEstimate) ? 'historical' : hasValues ? 'current' : 'pending';
  const related65 = old65 || (isSeries && conditions?.n === 65);
  const scope = recordId === 'R2' ? '旧 R2 配置沿用此批次的 F 约化矩阵元'
    : recordId === 'ref-17' ? '旧 J 约化量的归属记录，原始工件待补'
    : legacyEstimate ? '旧标度模型的记录，适用分支和场条件待复核'
    : isSeries ? 'nS 零场系列的 F 约化矩阵元'
    : status === 'current' ? '当前跃迁记录的计算输入' : '缺少适用的 E1 计算输入';
  return {
    recordId, status, label:labels[status], scope,
    batchId:source?.batchId ?? (isSeries ? series.sourceBatch : null), sourceId,
    conditions, conditionsBasis:fields.length ? {scope:fields.length > 1 ? 'shared-across-branches' : 'quantity',fields} : null,
    policy:manifestPolicy,
    relatedIds:related65 ? [...getRydbergPair(65).map(item => item.id), 'R2', 'ref-17'].filter(id => id !== recordId) : [],
  };
}

export function recordCitation(recordId, Fp, versions = DATASET_MANIFEST) {
  const adoption = getRecordAdoption(recordId, Fp);
  const fields = [['波长', getQuantity(recordId,'wavelength_vac_nm')]];
  const dipoles = adoption.conditionsBasis?.fields ?? [];
  for (const dipole of dipoles) {
    const label = Number.isFinite(dipole.Fp) ? `矩阵元 F′=${dipole.Fp*2}/2` : '矩阵元';
    fields.push([label,getQuantity(recordId,dipole.field)]);
  }
  const citedFp = dipoles.length > 1 ? undefined : dipoles[0]?.Fp ?? Fp;
  const citations = fields.filter(([,q]) => q).map(([label,q]) => {
    const source = getSourceRecord(q.sourceId);
    return `${label} ${q.value ?? '缺失'} ${q.unit}（${q.convention ?? '约定待核查'}），来源 ${q.sourceId ?? '待补充'} · ${source?.title ?? '待定位'} · ${q.sourceLocator ?? ''}${source?.artifactLocator ? ' · '+source.artifactLocator : source?.url ? ' · '+source.url : ''}`;
  });
  if (recordId === 'ref-17') {
    const source = getSourceRecord(recordId);
    citations.push(`${source.title} · ${source.publication} · J 级约化，原始生成工件待定位，独立实验验证未完成`,
      '核查文件 references/audits/rydberg-sources.md');
  }
  const fieldScope = isZeroField(adoption.conditions) ? 'B=E=0，模型物理不确定度未建立' : '';
  return [`¹⁷¹Yb 跃迁数据图谱，${recordId}${Number.isFinite(citedFp) ? '，F′='+citedFp*2+'/2' : ''}。数据版本 ${versions.datasetVersion}`,
    `${adoption.label} · ${adoption.scope}`, adoption.batchId, fieldScope,...citations].filter(Boolean).join('。');
}
