import {DATASET_MANIFEST, getSourceRecord, getTransitionRecord} from '../data/catalog.js';
import {getRecordAdoption} from './record-adoption.js';

export function catalogExport(ids, scope, versions, {filters, comparison, Fp} = {}) {
  const records = [...new Set(ids)].map(id => {
    const record = getTransitionRecord(id);
    if (!record) throw Error('目录中没有记录 '+id);
    const comparedRow = comparison?.rows.find(row => row.id === id);
    const branch = comparison ? comparedRow?.channel?.Fp : Fp;
    const adoption = getRecordAdoption(id, branch);
    const sourceIds = [...new Set(Object.values(record.quantities).map(q => q.sourceId).filter(Boolean))];
    return {id, lowerLevelId:record.lowerLevelId, upperLevelId:record.upperLevelId, adoption,
      quantities:record.quantities, fReducedDipoles:record.fReducedDipoles,
      sources:sourceIds.map(getSourceRecord).filter(Boolean)};
  });
  return {format:'yb171-catalog-export', scope, versions:{...versions}, policy:DATASET_MANIFEST.reviewStatus,
    filters, records, comparison:comparison ? {context:comparison.context, rows:comparison.rows.map(row => ({
      id:row.id, status:row.status, message:row.message, channel:row.channel, dEff_ea0:row.dEff_ea0,
      rabi_Hz:row.result?.fR ?? null,
    }))} : undefined};
}
