import {CATALOG, getSourceRecord} from '../data/catalog.js';
import {escapeHTML, reviewLabel} from './source-panel.js';

const references=CATALOG.sources.references;
const supplemental=CATALOG.sources.sources;
const firstSupplementalNumber=Math.max(0,...references.map(source=>source.referenceNumber))+1;
const numbers=new Map([
  ...references.map(source=>[source.id,source.referenceNumber]),
  ...supplemental.map((source,index)=>[source.id,firstSupplementalNumber+index])
]);
const supplementalNotes=Object.freeze({
  'legacy-levels': ['原有能级记录','沿用原页面的能量与态标记；原始文献定位尚未逐项复核。'],
  'legacy-hfs': ['原有超精细结构记录','沿用原页面 A 常数与分量数据；文献值及标度估算保持原有核查状态。'],
  'legacy-scaling': ['原有标度估算','单通道 / 标度估算，尚未独立验证到指定量子态。'],
  'internal-t2-calibration': ['T2 历史内部校准','旧值 0.543 ea₀ 已归档；默认采用 Kroeze v2 Table10 的 0.5398(6) ea₀。内部校准依据待补。'],
  'internal-t3-20260908': ['T3 内部补充矩阵元','2026-09-08 补充的有效 F 级约化量 9.19×10⁻⁵ ea₀。'],
  'this-work-hyperfine-65s': ['65S 零场保存数据','沿用已保存的零场分支与有效 A 常数；本次未重跑计算，独立实验验证与总模型不确定度尚未建立。']
});

export const DIAGRAM_SUPPLEMENTAL_SOURCE_COUNT=supplemental.length;

export function diagramSourceNumber(sourceId) {
  return numbers.get(sourceId)??null;
}

export function renderDiagramSourceMarks(sourceIds=[]) {
  const ids=[...new Set(sourceIds)].filter(id=>numbers.has(id)).sort((a,b)=>numbers.get(a)-numbers.get(b));
  if (!ids.length) return '';
  return `<sup class="diagram-source-marks">${ids.map(id=>{
    const source=getSourceRecord(id),number=numbers.get(id);
    const title=`${source.title} · ${reviewLabel(source.reviewStatus)}`;
    return `<a href="#diagram-source-${escapeHTML(id)}" title="${escapeHTML(title)}" aria-label="来源 ${number}：${escapeHTML(source.title)}">[${number}]</a>`;
  }).join('')}</sup>`;
}

export function renderDiagramProvenanceIndexHTML() {
  return `<details class="diagram-provenance-index"><summary>图内数据记录与核查状态 <span>${supplemental.length} 项</span></summary><ol class="diagram-provenance-list" start="${firstSupplementalNumber}">${supplemental.map(source=>{
    const [title,note]=supplementalNotes[source.id]||[source.title,source.detail||'出处与核查状态待补充。'];
    const savedLink=source.id==='this-work-hyperfine-65s'?'<a class="diagram-source-artifact" href="assets/05.21_yb171_65s_hyperfine.csv" download>保存的 CSV ↗</a>':'';
    return `<li id="diagram-source-${escapeHTML(source.id)}" value="${numbers.get(source.id)}"><div class="diagram-provenance-heading"><strong>${escapeHTML(title)}</strong><span>${escapeHTML(reviewLabel(source.reviewStatus))}</span></div><p>${escapeHTML(note)}</p>${savedLink}</li>`;
  }).join('')}</ol></details>`;
}
