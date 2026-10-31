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
const STATUS = new Set(['checked','conditional','not-closed','needs-review','not-reviewed','not-applicable']);
const INVALID_CALCULATION = new Set(['invalid','invalid-input','missing-data','unsupported','no-channel','unselected']);
const EVIDENCE_KIND = {
  'medium-corrected-rate':'介质修正后的原子率',
  'reported-rate-uncertainty':'原文报告的率不确定度',
  'rate-derived-dipole':'由原子率推导',
  'model-fitted-coupling':'模型拟合耦合'
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

function renderAtomicSupport(support, sources) {
  if (!support || typeof support !== 'object') return '';
  const quantities = list(support.quantities);
  return `<details class="evidence-detail" data-evidence-section="xu" data-testid="evidence-xu">
    <summary><span>${text(support.title || 'Xu · 原子率支持')}</span><span class="evidence-detail-status">${text(support.statusText)}</span></summary>
    <div class="evidence-detail-body">
      <p>${text(support.summary)}</p>
      ${quantities.length ? `<dl class="evidence-quantities">${quantities.map(quantity => `<div><dt>${text(quantity.label)}</dt><dd><strong>${text(numberText(quantity.value,10))}${quantity.unit ? ` ${text(quantity.unit)}` : ''}</strong>${quantity.evidenceKind ? `<span>${text(evidenceKindText(quantity.evidenceKind))}</span>` : ''}</dd></div>`).join('')}</dl>` : ''}
      ${support.boundary ? `<p class="evidence-boundary">${text(support.boundary)}</p>` : ''}
      ${renderSources(support.sourceIds,sources)}
    </div>
  </details>`;
}

function renderComparison(comparison, sources) {
  if (!comparison || typeof comparison !== 'object') return '';
  const reference = comparison.reference || {};
  const rows = list(comparison.rows);
  const status = STATUS.has(comparison.status) ? comparison.status : 'not-reviewed';
  const statusText = status === 'conditional' ? '条件比较' : status === 'needs-review' ? '需按当前版本与通道重核' : '尚未核查';
  return `<details class="evidence-detail" data-evidence-section="offer" data-testid="evidence-offer" data-evidence-status="${text(status)}">
    <summary><span>${text(comparison.title || 'Offer · 条件比较')}</span><span class="evidence-detail-status">${text(statusText)}</span></summary>
    <div class="evidence-detail-body">
      <p class="evidence-fixed-context">固定文献对照，非当前输入</p>
      ${comparison.scopeText ? `<p>${text(comparison.scopeText)}</p>` : ''}
      ${reference.label || reference.value !== undefined ? `<div class="evidence-reference-value"><span>${text(reference.label)}</span><strong>${text(numberText(reference.value))}${reference.unit ? ` ${text(reference.unit)}` : ''}</strong>${reference.evidenceKind ? `<span>${text(evidenceKindText(reference.evidenceKind))}</span>` : ''}</div>` : ''}
      ${renderItems(comparison.assumptions,'evidence-assumptions')}
      ${rows.length ? `<div class="evidence-case-table-wrap"><table class="evidence-case-table"><caption>固定参数的条件计算</caption><thead><tr><th scope="col">文献功率与性质</th><th scope="col">条件计算 Ω/2π</th><th scope="col">相对文献值</th></tr></thead><tbody>${rows.map(row => `<tr><th scope="row"><strong>${text(numberText(row.power_mW))} mW</strong><span>${text(row.powerLabel || row.powerKind)}</span></th><td>${text(numberText(row.rabi_kHz))} kHz</td><td>${text(numberText(row.relativeDifferencePercent,2))}%</td></tr>`).join('')}</tbody></table></div>` : ''}
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
    ${reviewed ? renderAtomicSupport(view.atomicSupport,sources) + list(view.comparisons).map(comparison => renderComparison(comparison,sources)).join('') : ''}
    ${missing.length ? `<details class="evidence-detail" data-evidence-section="missing"><summary><span>待补证据（${missing.length} 项）</span><span class="evidence-detail-status">独立实验验证尚未闭合</span></summary><div class="evidence-detail-body">${renderItems(missing,'evidence-missing')}</div></details>` : ''}
    ${view.applicability?.applicable === false ? renderItems(view.applicability.reasons,'evidence-applicability') : ''}`;
}
