import { CATALOG } from '../data/catalog.js';
import { DECAY, DECAY_VERSION, getDecayRecord, getDecaySource } from '../data/decay.js';
import { escapeHTML } from './source-panel.js';

const esc = escapeHTML;
const existing = new Map(CATALOG.sources.references.filter(source=>source.doi).map(source=>[source.doi.toLowerCase(),source.referenceNumber]));
let next = Math.max(...CATALOG.sources.references.map(source=>source.referenceNumber)) + CATALOG.sources.sources.length + 1;
const sourceNumbers = new Map(DECAY.sources.map(source=>[source.id, existing.get(source.doi.toLowerCase()) ?? next++]));
const publicURL = value => { try { const url=new URL(value); return url.protocol==='https:'&&!url.username&&!url.password?url.href:null; } catch { return null; } };

export function decayEvidenceLabel(kind='',status='') {
  if (/not-applicable|stable/.test(status)) return '不适用';
  if (/pending|missing|unverified/.test(status)) return '待核查';
  if (/experiment|measurement/.test(kind)) return '实验';
  if (/approx/.test(kind) || /approx/.test(status)) return '近似';
  if (/theory|theoretical|selection/.test(kind)) return '理论';
  return '待核查';
}

export function formatDecayBranch(branch) {
  if (branch.expression) return branch.expression;
  if (!Number.isFinite(branch.value)) return '待核查';
  const value=branch.value*100, uncertainty=Number.isFinite(branch.uncertainty)?branch.uncertainty*100:null;
  if (uncertainty===null) return `${Number(value.toPrecision(6))}% · 误差未给出`;
  const decimals=Math.min(8,(uncertainty.toFixed(10).replace(/0+$/,'').split('.')[1]||'').length);
  return `${value.toFixed(decimals)} ± ${uncertainty.toFixed(decimals)}%`;
}

export function renderDecaySourceMarks(ids=[]) {
  const sources=[...new Set(ids)].map(getDecaySource).filter(source=>source&&publicURL(source.url));
  if (!sources.length) return '';
  return `<sup class="diagram-source-marks diagram-decay-sources">${sources.map(source=>`<a data-decay-source="${esc(source.id)}" href="${esc(publicURL(source.url))}" target="_blank" rel="noopener noreferrer" title="${esc(`${source.title} · DOI ${source.doi} · ${source.locations.join('；')}`)}" aria-label="衰变来源 ${sourceNumbers.get(source.id)}：${esc(source.title)}">[${sourceNumbers.get(source.id)}]</a>`).join('')}</sup>`;
}

function compactScope(record) {
  if (record.status==='not-applicable') return '电子基态 · 分支不适用';
  if (record.evidenceKind==='theory') return '电子 J 级 · 自由空间低能模型';
  if (/approx/.test(record.evidenceKind)) return '主通道近似 · 精确分支未实测';
  return record.rateEvidence.length?'按 F 分量区分 · β 待核查':'指定态及完整分母待核查';
}

/** State-owned decay metadata never enters the calculator or diagram geometry. */
export function renderDecayDetails(levelId) {
  const record=getDecayRecord(levelId);
  if (!record) return '';
  const sources=[...new Set([...record.sourceIds,...record.branches.flatMap(branch=>branch.sourceIds),...record.rateEvidence.flatMap(rate=>rate.sourceIds)])];
  const rows=record.branches.map(branch=>{
    const weak=Number.isFinite(branch.value)&&branch.value>0&&branch.value<.01;
    const pending=branch.status==='pending';
    return `<div class="diagram-decay-row${weak?' is-weak':''}${pending?' is-pending':''}" data-decay-lower="${esc(branch.lowerLevelId)}" data-decay-value="${Number.isFinite(branch.value)?branch.value:''}" data-decay-evidence="${esc(branch.evidenceKind)}"><span>→ ${esc(branch.label)}</span><strong>${esc(formatDecayBranch(branch))}</strong></div>`;
  }).join('');
  const rateRows=record.rateEvidence.map(rate=>`<div class="diagram-decay-rate"><span>${esc(rate.label)} · ${esc(decayEvidenceLabel(rate.evidenceKind,rate.status))}</span><strong>${Number.isFinite(rate.value)?`${esc(Number(rate.value.toPrecision(6)))}${Number.isFinite(rate.uncertainty)?` ± ${esc(Number(rate.uncertainty.toPrecision(6)))}`:''} s⁻¹`:'待核查'}${renderDecaySourceMarks(rate.sourceIds)}</strong><small>${esc(rate.sourceLocator)}${rate.conditions.length?' · '+esc(rate.conditions.join('；')):''}${rate.uncertaintyNote?' · '+esc(rate.uncertaintyNote):''}</small></div>`).join('');
  const bibliography=sources.map(getDecaySource).filter(Boolean).map(source=>`<li><a href="${esc(publicURL(source.url)||'#')}" target="_blank" rel="noopener noreferrer">[${sourceNumbers.get(source.id)}] ${esc(source.title)}</a><small>DOI ${esc(source.doi)} · ${esc(source.locations.join('；'))}</small></li>`).join('');
  return `<section class="diagram-decay-detail" data-decay-level="${esc(levelId)}" data-decay-status="${esc(record.status)}" aria-label="自发衰变分支">
    <div class="diagram-decay-heading"><h4>自发衰变 <span>β</span></h4><span class="diagram-decay-kind">${esc(decayEvidenceLabel(record.evidenceKind,record.status))}</span>${renderDecaySourceMarks(record.sourceIds)}</div>
    ${rows||`<p class="diagram-decay-summary">${esc(record.summary)}</p>`}
    <p class="diagram-decay-scope">${esc(compactScope(record))}</p>
    <details class="diagram-decay-evidence"><summary>适用条件与来源</summary><div class="diagram-decay-evidence-body">
      ${rows?`<p>${esc(record.summary)}</p>`:''}<p>${esc(record.normalizationScope)}</p><ul>${record.conditions.map(condition=>`<li>${esc(condition)}</li>`).join('')}</ul>
      <p>${esc(record.boundary)}</p>
      ${rateRows?`<div class="diagram-decay-rate-heading">部分衰变率 · 不是分支比</div>${rateRows}`:''}
      ${record.branches.map(branch=>`<p class="diagram-decay-branch-note">→ ${esc(branch.label)} · ${esc(decayEvidenceLabel(branch.evidenceKind,branch.status))}${renderDecaySourceMarks(branch.sourceIds)}<small>${esc(branch.sourceLocator)}${branch.missingReason?' · '+esc(branch.missingReason):''}${branch.conditions.length?' · '+esc(branch.conditions.join('；')):''}</small></p>`).join('')}
      <ol class="diagram-decay-bibliography">${bibliography}</ol><p class="diagram-decay-version">Decay ${esc(DECAY_VERSION)}</p>
    </div></details>
  </section>`;
}

/** Expanding evidence scrolls within the existing hover card without moving it. */
export function initDecayHoverDetails() {
  const panel=document.getElementById('hfsPanel');
  if (!panel || panel.dataset.decayResizeBound==='true') return;
  panel.dataset.decayResizeBound='true';
  const fit=()=>{
    if (!panel.classList.contains('active')) return;
    const top=panel.getBoundingClientRect().top;
    panel.style.maxHeight=Math.max(0,Math.min(window.innerHeight-84,window.innerHeight-top-12))+'px';
  };
  panel.addEventListener('toggle',event=>{
    if (!event.target.matches?.('.diagram-decay-evidence')) return;
    fit();
  },true);
  new MutationObserver(fit).observe(document.getElementById('hfsContent'),{childList:true});
  window.addEventListener('resize',fit);
}
