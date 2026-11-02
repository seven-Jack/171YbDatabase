/** Render saved literature checks without interpreting them as the current calculation. */
export function escapeEvidenceHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

const text = escapeEvidenceHTML;
const list = value => Array.isArray(value) ? value : [];
const ROWS = [
  {key:'source',label:'原文定位'},
  {key:'formula',label:'公式与通道核查'},
  {key:'comparison',label:'条件比较'},
  {key:'experiment',label:'独立实验验证'}
];
const STATUS = new Set(['checked','conditional','theory-compatible','not-closed','needs-review','not-reviewed','not-applicable']);
const INVALID_CALCULATION = new Set(['invalid','invalid-input','missing-data','unsupported','no-channel','unselected']);
const EVIDENCE_KIND = {
  'medium-corrected-rate':'介质修正后的原子率',
  'reported-rate-uncertainty':'原文报告的率不确定度',
  'rate-derived-dipole':'由原子率推导',
  'model-fitted-coupling':'模型拟合耦合',
  'compiled-dipole':'汇编采用的约化矩阵元',
  'lifetime-derived-dipole':'由寿命与分支数据推导',
  'theory-dipole':'理论矩阵元'
};
const evidenceKindText = value => EVIDENCE_KIND[value] || '证据类型待核查';

/** Only public DOI and arXiv landing pages are usable as evidence links. */
export function evidenceSourceURL(source = {}) {
  const candidate = source.url;
  if (typeof candidate === 'string') {
    try {
      const url = new URL(candidate);
      const official = ['doi.org','dx.doi.org','arxiv.org','export.arxiv.org'].includes(url.hostname.toLowerCase());
      const localOrDownload = /(?:\/Users\/|\/references\/papers\/|\/data\/literature\/|\.(?:pdf|tex|txt|tar|gz)$)/i.test(decodeURIComponent(url.pathname));
      if (url.protocol === 'https:' && official && !url.port && !url.username && !url.password && !localOrDownload) return url.href;
    } catch { /* An unusable URL must remain plain text. */ }
  }
  const doi = typeof source.doi === 'string' ? source.doi.trim() : '';
  if (/^10\.\d{4,9}\/[^\s<>"'\\]+$/.test(doi)) return `https://doi.org/${doi}`;
  return null;
}

function renderSources(sourceIds, sources) {
  const ids = list(sourceIds);
  if (!ids.length) return '';
  return `<ul class="evidence-source-links">${ids.map(id => {
    const source = sources.find(item => item?.id === id);
    if (!source) return `<li><span class="evidence-source-id">${text(id)}</span> · 文献定位待补充</li>`;
    const href = evidenceSourceURL(source);
    const title = source.title || source.id || '来源';
    const link = href ? `<a href="${text(href)}" target="_blank" rel="noopener noreferrer">${text(title)}</a>` : `<span>${text(title)}</span>`;
    const doi = source.doi ? `<span class="evidence-source-doi">DOI: ${text(source.doi)}</span>` : '';
    const locations = list(source.locations).map(location => `<span class="evidence-source-locator">${text(location)}</span>`).join('');
    return `<li>${link}${doi}${locations}</li>`;
  }).join('')}</ul>`;
}

function renderItems(items, className) {
  const values = list(items).filter(value => value !== null && value !== undefined && value !== '');
  return values.length ? `<ul class="${className}">${values.map(item => `<li>${text(item)}</li>`).join('')}</ul>` : '';
}

function numberText(value, places = 4) {
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString('en-US',{useGrouping:false,maximumFractionDigits:places}) : '—';
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

function renderAtomicSupport(support, sources, transitionId) {
  if (!support || typeof support !== 'object') return '';
  const quantities = list(support.quantities);
  const legacyXu = transitionId === 'T3' && list(support.sourceIds).includes('xu-2014-prl');
  return `<details class="evidence-detail" data-evidence-section="${text(legacyXu ? 'xu' : `atomic-support-${transitionId}`)}" data-testid="${legacyXu ? 'evidence-xu' : 'evidence-atomic-support'}" data-evidence-kind="atomic-support" data-evidence-id="${text(transitionId)}">
    <summary><span>${text(support.title || '原子参数与数据链')}</span><span class="evidence-detail-status">${text(support.statusText)}</span></summary>
    <div class="evidence-detail-body">
      <p>${text(support.summary)}</p>
      ${quantities.length ? `<dl class="evidence-quantities">${quantities.map(quantity => `<div><dt>${text(quantity.label)}</dt><dd><strong>${text(numberText(quantity.value,10))}${quantity.unit ? ` ${text(quantity.unit)}` : ''}</strong>${quantity.evidenceKind ? `<span>${text(evidenceKindText(quantity.evidenceKind))}</span>` : ''}</dd></div>`).join('')}</dl>` : ''}
      ${support.boundary ? `<p class="evidence-boundary">${text(support.boundary)}</p>` : ''}
      ${renderSources(support.sourceIds,sources)}
    </div>
  </details>`;
}

function fractionText(value, signed = false) {
  if (!Number.isFinite(value)) return '—';
  const fraction = Number.isInteger(value) ? String(value) : `${value * 2}/2`;
  return `${signed && value > 0 ? '+' : ''}${fraction}`;
}

function renderTheoryBenchmark(comparison) {
  const channel = comparison.channel || {};
  const polarization = {'-1':'σ⁻','0':'π','1':'σ⁺'}[channel.q] || '偏振待核';
  return `<div class="evidence-benchmark-context">
      <span>固定 P = ${text(numberText(comparison.power_mW))} mW</span><span>w₀ = ${text(numberText(comparison.waist_um))} μm（1/e² 强度半径）</span>
      <span class="evidence-benchmark-channel">F=${text(fractionText(channel.F))}, mF=${text(fractionText(channel.m,true))} → F′=${text(fractionText(channel.Fp))}, mF′=${text(fractionText(channel.mp,true))} · ${text(polarization)}</span>
    </div>
    <dl class="evidence-benchmark-values" aria-label="固定参数下的文献理论基准">
      <div><dt>计算 Ω/2π</dt><dd>${text(numberText(comparison.calculatedRabi_MHz,6))} <span>MHz</span></dd></div>
      <div><dt>文献 Ω/2π</dt><dd>${text(numberText(comparison.publishedRabi_MHz,6))} ± ${text(numberText(comparison.publishedRabiUncertainty_MHz,6))} <span>MHz</span></dd></div>
    </dl>
    <p class="evidence-benchmark-boundary">文献理论复现；未独立实验验证。所列不确定度来自文献，不代表本次计算的完整误差预算。</p>`;
}

function renderComparison(comparison, sources, transitionId) {
  if (!comparison || typeof comparison !== 'object') return '';
  // Schema-1 Offer records remain readable; unknown kinds cannot inherit a checked label.
  const kind = comparison.kind || (comparison.id === 'offer-578-conditional' ? 'conditional-power' : null);
  const theory = kind === 'theory-benchmark';
  const conditional = kind === 'conditional-power';
  const reference = comparison.reference || {};
  const rows = list(comparison.rows);
  const allowedStatus = theory ? ['theory-compatible','needs-review'] : conditional ? ['conditional','needs-review'] : [];
  const status = allowedStatus.includes(comparison.status) ? comparison.status : 'not-reviewed';
  const statusText = status === 'conditional' ? '条件比较' : status === 'theory-compatible' ? '文献理论基准相容' : status === 'needs-review' ? '需按当前版本与通道重核' : '尚未核查';
  const legacyOffer = transitionId === 'T3' && comparison.id === 'offer-578-conditional' && conditional;
  return `<details class="evidence-detail" data-evidence-section="${text(legacyOffer ? 'offer' : `comparison-${comparison.id || 'unknown'}`)}" data-testid="${legacyOffer ? 'evidence-offer' : 'evidence-comparison'}" data-evidence-status="${text(status)}" data-evidence-kind="${text(kind || 'unknown')}" data-evidence-id="${text(comparison.id || 'unknown')}">
    <summary><span>${text(comparison.title || (theory ? '文献理论基准' : '文献对照'))}</span><span class="evidence-detail-status">${text(statusText)}</span></summary>
    <div class="evidence-detail-body">
      <p class="evidence-fixed-context">固定文献对照，非当前输入</p>
      ${comparison.scopeText ? `<p>${text(comparison.scopeText)}</p>` : ''}
      ${conditional && (reference.label || reference.value !== undefined) ? `<div class="evidence-reference-value"><span>${text(reference.label)}</span><strong>${text(numberText(reference.value))}${reference.unit ? ` ${text(reference.unit)}` : ''}</strong>${reference.evidenceKind ? `<span>${text(evidenceKindText(reference.evidenceKind))}</span>` : ''}</div>` : ''}
      ${renderItems(comparison.assumptions,'evidence-assumptions')}
      ${theory ? renderTheoryBenchmark(comparison) : ''}
      ${conditional && rows.length ? `<div class="evidence-case-table-wrap"><table class="evidence-case-table"><caption>固定参数的条件计算</caption><thead><tr><th scope="col">文献功率与性质</th><th scope="col">条件计算 Ω/2π</th><th scope="col">相对文献值</th></tr></thead><tbody>${rows.map(row => `<tr><th scope="row"><strong>${text(numberText(row.power_mW))} mW</strong><span>${text(row.powerLabel || row.powerKind)}</span></th><td>${text(numberText(row.rabi_kHz))} kHz</td><td>${text(numberText(row.relativeDifferencePercent,2))}%</td></tr>`).join('')}</tbody></table></div>` : ''}
      ${!theory && !conditional ? '<p class="evidence-boundary">证据类型待核查；不据此判断当前计算或独立实验验证通过。</p>' : ''}
      ${comparison.normalizationNote ? `<p class="evidence-normalization">${text(comparison.normalizationNote)}</p>` : ''}
      ${comparison.boundary ? `<p class="evidence-boundary">${text(comparison.boundary)}</p>` : ''}
      ${renderSources(comparison.sourceIds,sources)}
    </div>
  </details>`;
}

/** Returns the #evidenceReview host contents; the caller owns its visibility and lifecycle. */
export function renderEvidencePanelHTML(view = {}) {
  const sources = list(view.sources);
  const reviewed = view.hasReview === true;
  const statusRows = list(view.rows);
  const calculationStatus = view.calculationStatus || 'unselected';
  const invalidInput = view.applicability?.inputValid === false || INVALID_CALCULATION.has(calculationStatus);
  const metadata = [view.reviewVersion ? `核查版本 ${view.reviewVersion}` : '',view.reviewedAt ? `核查日期 ${view.reviewedAt}` : ''].filter(Boolean);
  const missing = list(view.missing).filter(value => value !== null && value !== undefined && value !== '');
  const rows = ROWS.map(definition => {
    const row = statusRows.find(item => item?.key === definition.key) || {};
    const requestedStatus = STATUS.has(row.status) ? row.status : 'not-reviewed';
    const staleReview = !reviewed && !['not-reviewed','not-applicable'].includes(requestedStatus);
    const status = staleReview ? 'not-reviewed' : requestedStatus;
    const statusText = staleReview ? '尚未核查' : row.statusText || (status === 'not-applicable' ? '不适用' : '尚未核查');
    const detail = staleReview ? '当前跃迁没有可适用的核查记录。' : row.detail;
    return `<div class="evidence-status-row" data-testid="evidence-row-${definition.key}" data-evidence-status="${text(status)}"><dt>${text(row.label || definition.label)}</dt><dd><strong class="evidence-status-badge">${text(statusText)}</strong>${detail ? `<p>${text(detail)}</p>` : ''}</dd></div>`;
  }).join('');
  return `<div class="evidence-review-header"><div><span class="evidence-eyebrow">EVIDENCE REVIEW</span><h3 id="evidenceReviewTitle">文献核查${view.transitionId ? ` · ${text(view.transitionId)}` : ''}</h3></div>${metadata.length ? `<p class="evidence-review-meta">${metadata.map(text).join(' · ')}</p>` : ''}</div>
    ${view.summary ? `<p class="evidence-summary">${text(view.summary)}</p>` : ''}
    <div class="evidence-context" data-testid="evidence-context" data-context-key="${text(view.contextKey)}" data-calculation-status="${text(calculationStatus)}">${text(view.contextText || '请先选择跃迁与通道。')}</div>
    ${reviewed && invalidInput ? '<p class="evidence-input-notice" role="note">当前输入未形成有效计算；以下为已保存的核查记录，不代表本次计算通过。</p>' : ''}
    <dl class="evidence-status-grid">${rows}</dl>
    ${reviewed && view.primarySourceId ? `<p class="evidence-primary-source" data-testid="evidence-primary-source">原采用数值出处 <code>${text(view.primarySourceId)}</code></p>` : ''}
    ${reviewed ? renderAtomicSupport(view.atomicSupport,sources,view.transitionId) + list(view.comparisons).map(comparison => renderComparison(comparison,sources,view.transitionId)).join('') : ''}
    ${missing.length ? `<details class="evidence-detail" data-evidence-section="missing"><summary><span>待补证据（${missing.length} 项）</span><span class="evidence-detail-status">独立实验验证尚未闭合</span></summary><div class="evidence-detail-body">${renderItems(missing,'evidence-missing')}</div></details>` : ''}
    ${view.applicability?.applicable === false ? renderItems(view.applicability.reasons,'evidence-applicability') : ''}`;
}
