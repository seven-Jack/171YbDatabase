import {getTransitionRecord,getQuantity,getSourceRecord,DATASET_VERSION} from '../data/catalog.js';
import {formatLifetime} from './format.js';
import {R2_PROVENANCE,R2_EVIDENCE_EXTENSION} from './r2-provenance.js';
import {buildEvidenceView} from './evidence-model.js';
import {renderEvidencePanelHTML} from './evidence-panel.js';

const EVIDENCE_LABELS = Object.freeze({
  'literature-reported':'文献记录','internal-calibration':'内部校准','internal-calculation':'本工作计算',
  'scaling-estimate':'标度估算','derived':'由其他量推导','legacy-unclassified':'旧记录，证据类型待核查'
});
const REVIEW_LABELS = Object.freeze({
  'legacy-not-rechecked':'原文尚未重核','definition-needs-review':'定义待核查',
  'original-source-located':'已定位原文','conflict-unresolved':'存在未解决冲突'
});
const FIELD_LABELS = Object.freeze({
  d_num:'约化矩阵元 d',wavelength_vac_nm:'真空波长 λ',wavelength_air_nm:'空气波长',
  lifetime_ns:'寿命 τ',frequency_THz:'跃迁频率 ν',energy_eV:'能量差 ΔE',energy_cm:'能量差 / 波数',
  Gamma_per_s_num:'衰减率 Γ',oscillator_strength_f_num:'振子强度 f',
  linewidth_frequency_coefficient_Hz:'线宽频率系数'
});
const CONVENTION_LABELS = Object.freeze({
  'J-reduced':'J 级约化量','F-reduced-effective':'有效 F 级约化量','no-E1-data':'缺少适用 E1 数据',
  'ordinary-frequency-FWHM=Gamma/(2*pi); source-table-extra-2pi-conflict':'普通频率 FWHM = Γ/2π；原表多写 2π，冲突保留',
  'hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)':'超精细重心 · ν=ω/2π',
  'total upper-state radiative lifetime; not inverse partial decay rate or trap survival':'上态总辐射寿命',
  'total spontaneous decay rate Gamma=1/tau; not branch-specific Einstein A':'总自发衰减率 Γ=1/τ',
  'inverse-of-statistically-averaged-total-decay-rate; not-F-resolved':'统计平均率对应寿命',
  'statistically-averaged-total-decay-rate; not-F-resolved':'统计平均总衰减率',
  'equivalent-frequency-width-of-statistically-averaged-rate=Gamma/(2*pi); not-F-resolved':'统计平均率的等效宽度',
  'coefficient-of-legacy-2pi-expression; reconcile source before physical relabeling':'原记录 2π 表达式的频率系数；定义待核查'
});
const MISSING_LABELS = Object.freeze({
  'no-applicable-E1-matrix-element':'缺少适用的 E1 矩阵元',
  'not-provided-in-cited-source':'引用原文未提供该数值',
  'not-recomputed-for-updated-vacuum-frequency':'新真空频率对应的空气波长尚未重算',
  'not-provided-in-original-record':'原记录未提供'
});
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
export const evidenceLabel = value => EVIDENCE_LABELS[value] || '证据类型待核查';
export const reviewLabel = value => REVIEW_LABELS[value] || '核查状态未记录';
export const conventionLabel = value => CONVENTION_LABELS[value] || value || '约定待核查';
const fLabel = value => Number.isFinite(value) ? ({0.5:'1/2',1.5:'3/2',2.5:'5/2',3.5:'7/2'}[value] || String(value)) : '未选择';
const mLabel = value => Number.isFinite(value) ? (value>0?'+':'')+fLabel(value<0?-value:value).replace(/^/,value<0?'−':'') : '未选择';
const polLabel = value => ({pi:'π',sigmap:'σ⁺',sigmam:'σ⁻'}[value] || '未选择');
const presentNumber = value => Number.isFinite(value) ? Number(value.toPrecision(8)).toString() : '缺失';
const safeHTTPS = value => { try {const url=new URL(value);return url.protocol==='https:'?url.href:null;} catch {return null;} };

export function formatFrequency(hertz) {
  if (!Number.isFinite(hertz)) return '缺失';
  const magnitude=Math.abs(hertz);
  const [factor,unit]=magnitude>=1e9?[1e9,'GHz']:magnitude>=1e6?[1e6,'MHz']:magnitude>=1e3?[1e3,'kHz']:magnitude>0&&magnitude<1?[1e-3,'mHz']:[1,'Hz'];
  return `${presentNumber(hertz/factor)} ${unit}`;
}

export function createFieldView(transitionId,field) {
  const quantity=getQuantity(transitionId,field);
  if (!quantity) return null;
  const source=getSourceRecord(quantity.sourceId);
  const sourceEvidence=quantity.conditions?.sourceEvidenceType||'';
  const kind=quantity.evidenceKind==='derived'&&quantity.modelId==='legacy-rydberg-scaling-v1'?'由标度估算推导':
    quantity.evidenceKind==='literature-reported'&&sourceEvidence.includes('theory')?'理论采用值':
    quantity.evidenceKind==='literature-reported'&&sourceEvidence.startsWith('compilation-derived')?'文献推导值':
    quantity.evidenceKind==='literature-reported'&&sourceEvidence.startsWith('compilation')?'文献汇编值':evidenceLabel(quantity.evidenceKind);
  let valueText;
  if (quantity.value===null) valueText=MISSING_LABELS[quantity.missingReason] || '缺失：原因待补充';
  else if (field==='linewidth_frequency_coefficient_Hz') valueText=formatFrequency(quantity.value);
  else if (field==='lifetime_ns') valueText=formatLifetime(quantity.value);
  else valueText=`${presentNumber(quantity.value)} ${quantity.unit==='e*a0'?'ea₀':quantity.unit==='dimensionless'?'':quantity.unit==='s^-1'?'s⁻¹':quantity.unit==='cm^-1'?'cm⁻¹':quantity.unit}`.trim();
  return {
    key:field,label:FIELD_LABELS[field] || field,valueText,
    savedValue:quantity.value===null?'缺失':`${quantity.value} ${quantity.unit}`,
    kind,review:reviewLabel(quantity.reviewStatus),
    convention:quantity.convention?conventionLabel(quantity.convention):null,
    uncertainty:quantity.uncertainty===null?'总不确定度未建立':`${quantity.uncertainty} ${quantity.unit}`,
    conditions:quantity.conditions===null?'原记录未提供完整条件':Object.entries(quantity.conditions).map(([key,value])=>`${key}=${value===null?'未提供':typeof value==='object'?JSON.stringify(value):value}`).join('；'),
    lifetimeBasis:quantity.convention==='inverse-of-statistically-averaged-total-decay-rate; not-F-resolved'?'统计平均总衰减率的倒数，不是每个 F 分量的寿命，也不是寿命的平均。':sourceEvidence?'上态总辐射寿命的文献汇编 / 理论采用值；F、温度及黑体条件须按该字段记录使用，不能替代陷阱人口寿命。':'温度与包含的辐射 / 黑体 / 其他损失过程未完整建立；不能直接作为实验有效寿命。',
    locator:quantity.sourceLocator?.replace('(original page label; not rechecked)','（沿用旧页面标注，尚未重核原文）') || '原文页 / 表 / 式：待核查',
    sourceTitle:source?.title || '来源记录缺失',
    publication:source?.publication || null,
    sourceDetail:source?.detail || null,
    url:safeHTTPS(source?.url),
    artifactLocator:source?.artifactLocator || null,
    artifactSha256:source?.artifactSha256 || null,
    missingArtifact:quantity.evidenceKind==='internal-calculation'&&!source?.artifactLocator,
    legacyText:quantity.legacyText || null,
    derivedFrom:quantity.derivedFrom || [],
    modelId:quantity.modelId || null
  };
}

export function renderFieldSourceHTML(field) {
  if (!field) return '';
  const meta=[field.kind,field.convention,field.review].filter(Boolean).map(escapeHTML).join(' · ');
  const link=field.url?`<p class="source-links"><a href="${escapeHTML(field.url)}" target="_blank" rel="noopener noreferrer">原文链接</a></p>`:'';
  return `<article class="source-field" data-source-field="${escapeHTML(field.key)}">
    <div class="source-field-label">${escapeHTML(field.label)}</div><strong class="source-field-value">${escapeHTML(field.valueText)}</strong>
    <p class="source-meta">${meta}</p>
    <details class="source-audit"><summary>出处与条件</summary><dl>
      <dt>来源</dt><dd>${escapeHTML(field.sourceTitle)}</dd>
      ${field.publication?`<dt>引用记录</dt><dd>${escapeHTML(field.publication)}</dd>`:''}
      ${field.sourceDetail?`<dt>原有来源说明</dt><dd>${escapeHTML(field.sourceDetail)}</dd>`:''}
      <dt>原文定位</dt><dd>${escapeHTML(field.locator)}</dd>
      <dt>条件</dt><dd>${escapeHTML(field.conditions)}</dd>
      <dt>不确定度</dt><dd>${escapeHTML(field.uncertainty)}</dd>
      ${field.key==='lifetime_ns'?`<dt>寿命口径</dt><dd>${escapeHTML(field.lifetimeBasis)}</dd>`:''}
      <dt>保存数值</dt><dd>${escapeHTML(field.savedValue)}</dd>
      ${field.modelId?`<dt>模型</dt><dd>${escapeHTML(field.modelId)}</dd>`:''}
      ${field.derivedFrom.length?`<dt>派生自</dt><dd>${escapeHTML(field.derivedFrom.join('；'))}</dd>`:''}
      ${field.artifactLocator?`<dt>保存记录</dt><dd>${escapeHTML(field.artifactLocator)}</dd>`:''}
      ${field.artifactSha256?`<dt>原保存 CSV SHA256</dt><dd class="source-hash">${escapeHTML(field.artifactSha256)}</dd>`:''}
      ${field.missingArtifact?'<dt>计算原始证据</dt><dd>Notebook / Run 及版本定位待补充</dd>':''}
      ${field.legacyText?`<dt>原记录表达</dt><dd>${escapeHTML(field.legacyText)}</dd>`:''}
    </dl>${link}</details>
  </article>`;
}

export function buildSourceView(state) {
  const transition=state?.transition;
  if (!transition) return {transition:null,status:'unselected',statusText:'请先选择跃迁',fields:[],channel:'未选择通道'};
  const record=getTransitionRecord(transition.id);
  const selected=state.selectedChannel;
  const channel=selected?`F=${fLabel(selected.F)}, mF=${mLabel(selected.m)} → F′=${fLabel(selected.Fp)}, mF′=${mLabel(selected.mp)} · ${polLabel(selected.q===0?'pi':selected.q===1?'sigmap':'sigmam')}`:`F=${fLabel(state.F_lower)} → F′=${fLabel(state.F_upper)} · ${polLabel(state.pol)} · 默认选当前 F 对与偏振内最强允许通道`;
  const dipole=getQuantity(transition.id,'d_num');
  let status='ready',statusText=selected?'使用所选通道':'使用默认最强允许通道';
  if (String(transition.multipole).includes('M2')) {status='unsupported';statusText='M2 跃迁：当前单光子 E1 计算不适用';}
  else if (!record||!dipole||dipole.value===null) {status='missing-data';statusText='缺少适用的矩阵元数据';}
  else if (dipole.value===0&&!transition.hf_induced) {status='forbidden';statusText='当前 E1 模型下禁戒';}
  else if ((Object.hasOwn(state,'P_mW')&&(!Number.isFinite(state.P_mW)||state.P_mW<0))||(Object.hasOwn(state,'w_um')&&(!Number.isFinite(state.w_um)||state.w_um<=0))||(state.calcMode==='rabi'&&(!Number.isFinite(state.fR_MHz)||state.fR_MHz<0))) {status='invalid-input';statusText='输入无效，请检查功率、束腰与目标频率';}
  else if (!(state.dEff>0)) {status='no-channel';statusText='当前选择下没有可用通道';}
  return {transition,status,statusText,channel,convention:dipole?conventionLabel(dipole.convention):'约定待核查',dEff:Number.isFinite(state.dEff)&&status==='ready'?`${presentNumber(state.dEff)} ea₀`:'未得到有效值',fields:record?Object.keys(record.quantities).map(key=>createFieldView(transition.id,key)):[]};
}

function renderR2EvidenceExtensionHTML() {
  const extra=R2_EVIDENCE_EXTENSION,p=extra.propagation;
  return `<p>${escapeHTML(extra.status)} 核对日期：${escapeHTML(extra.reviewedAt)}</p><p>${escapeHTML(extra.searchUpdate)}</p>
    <details class="source-audit"><summary>文献能支持什么（非本数值来源）</summary><ul>${extra.sources.map(source=>`<li><strong>${escapeHTML(source.title)}</strong><p>${escapeHTML(source.locator)}</p><p>${escapeHTML(source.supports)}</p><p>${escapeHTML(source.limit)}</p><a href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer">查看指定版本原文</a></li>`).join('')}</ul></details>
    <details class="source-audit"><summary>误差传播与验证路线（待执行）</summary>
      <h4>${escapeHTML(p.title)}</h4><p>${escapeHTML(p.prerequisite)}</p><p>${escapeHTML(p.definitions)}</p><p>${escapeHTML(p.model)}</p><p>${escapeHTML(p.uncorrelated)}</p><p>${escapeHTML(p.correlated)}</p><p>${escapeHTML(p.boundary)}</p><p>${escapeHTML(p.temperature)}</p><p><a href="${escapeHTML(p.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(p.locator)}</a></p>
      <ol>${extra.validation.map(step=>`<li><strong>${escapeHTML(step.gate)} · ${escapeHTML(step.status)}</strong><p>${escapeHTML(step.action)}</p></li>`).join('')}</ol>
    </details>`;
}

function renderR2ProvenanceHTML() {
  const evidence=R2_PROVENANCE;
  return `<details class="source-extra r2-provenance" data-testid="r2-provenance"><summary>${escapeHTML(evidence.title)}</summary>
    <p>${escapeHTML(evidence.scope)}</p><p>${escapeHTML(evidence.inputStatement)}</p>
    <ol>${evidence.history.map(item=>`<li><p>${escapeHTML(item.summary)}</p><p>历史摘录：<q>${escapeHTML(item.excerpt)}</q></p><dl><dt>网站提交</dt><dd class="source-hash">${escapeHTML(item.commit)}</dd><dt>文件与行号</dt><dd>${escapeHTML(item.path)}:${escapeHTML(item.lines)}</dd><dt>该提交文件 SHA256</dt><dd class="source-hash">${escapeHTML(item.sha256)}</dd></dl></li>`).join('')}</ol>
    <dl><dt>态身份与条件</dt><dd>${escapeHTML(evidence.conditions)}</dd><dt>原始生成记录</dt><dd>${escapeHTML(evidence.artifacts)}</dd><dt>总不确定度</dt><dd>${escapeHTML(evidence.totalUncertainty)}</dd></dl>
    <table><caption>R2 矩阵元的误差证据边界</caption><thead><tr><th scope="col">类别</th><th scope="col">状态与缺口</th></tr></thead><tbody>${evidence.uncertainties.map(item=>`<tr><th scope="row">${escapeHTML(item.label)}</th><td>${escapeHTML(item.status)}</td></tr>`).join('')}</tbody></table>
    <p>${escapeHTML(evidence.validationBoundary)}</p>
    <details class="source-audit"><summary>不能串接的 Run 证据</summary><ul>${evidence.excludedRuns.map(item=>`<li><strong>${escapeHTML(item.run)}</strong>：${escapeHTML(item.summary)}<p>${escapeHTML(item.path)}:${escapeHTML(item.lines)}</p><p class="source-hash">SHA256：${escapeHTML(item.sha256)}</p></li>`).join('')}</ul></details>
    ${renderR2EvidenceExtensionHTML()}
  </details>`;
}

export function renderSourceDetailsHTML(view) {
  if (!view.transition) return '<p class="source-empty">选择跃迁后查看各物理量的来源与条件。</p>';
  const primaryKeys=['d_num','wavelength_vac_nm','lifetime_ns'];
  const primary=primaryKeys.map(key=>view.fields.find(field=>field.key===key)).filter(Boolean);
  const extra=view.fields.filter(field=>!primaryKeys.includes(field.key));
  return `<div class="source-grid">${primary.map(renderFieldSourceHTML).join('')}</div>${view.transition.id==='R2'?renderR2ProvenanceHTML():''}${extra.length?`<details class="source-extra"><summary>其余物理量与出处（${extra.length} 项）</summary><div class="source-grid">${extra.map(renderFieldSourceHTML).join('')}</div></details>`:''}`;
}

const activePanels=new WeakMap();
export function initSourcePanel(calculator,decoratedCoreTransitions=[]) {
  const panel=document.getElementById('sourcePanel');
  const context=document.getElementById('currentContext');
  if (!panel||!context) return Object.freeze({destroy(){}});
  if (activePanels.has(panel)) return activePanels.get(panel);
  const details=document.getElementById('selectedSource');
  const evidence=document.createElement('section');
  evidence.id='evidenceReview';
  evidence.dataset.testid='evidence-review';
  evidence.tabIndex=-1;
  evidence.setAttribute('aria-labelledby','evidenceReviewTitle');
  panel.before(evidence);
  let lastTransitionId=Symbol('uninitialized');
  let lastEvidenceKey;
  const render=state=>{
    const view=buildSourceView(state);
    const review=buildEvidenceView(state);
    if(lastEvidenceKey!==review.contextKey){
      const openSections=new Set([...evidence.querySelectorAll('details[open][data-evidence-section]')].map(node=>node.dataset.evidenceSection));
      evidence.innerHTML=renderEvidencePanelHTML(review);
      evidence.dataset.calculationStatus=review.calculationStatus;
      for(const section of evidence.querySelectorAll('details[data-evidence-section]'))section.open=openSections.has(section.dataset.evidenceSection);
      lastEvidenceKey=review.contextKey;
    }
    if (!view.transition) context.innerHTML='<span>当前计算对象</span><strong>请先选择跃迁</strong>';
    else {
      const transition=decoratedCoreTransitions.find(row=>row.id===view.transition.id)||view.transition;
      context.dataset.status=view.status;
      context.innerHTML=`<strong>${escapeHTML(transition.id)} · ${escapeHTML(transition.lower)} → ${escapeHTML(transition.upper)}</strong><span>${escapeHTML(transition.wavelength_vac_nm)} nm</span><span>${escapeHTML(view.channel)}</span><span>${escapeHTML(view.convention)} · d_eff=${escapeHTML(view.dEff)}</span><span class="context-status">${escapeHTML(view.statusText)}</span>`;
    }
    if (lastTransitionId!==view.transition?.id) {
      panel.innerHTML=renderSourceDetailsHTML(view);
      const summary=details?.querySelector(':scope > summary');
      if (summary) summary.textContent=view.transition?`${view.transition.id} · 数值与来源`:'当前跃迁 · 数值与来源';
      lastTransitionId=view.transition?.id;
    }
    context.dataset.datasetVersion=DATASET_VERSION;
  };
  const unsubscribe=calculator.onChange(render);
  const openEvidence=()=>{
    if(details)details.open=true;
    evidence.focus({preventScroll:true});
    evidence.scrollIntoView({block:'start',behavior:'auto'});
  };
  const onEvidenceLink=event=>{
    const link=event.target.closest?.('a[data-evidence-open]');
    if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    openEvidence();
  };
  document.addEventListener('click',onEvidenceLink);
  const api=Object.freeze({openEvidence,destroy(){unsubscribe?.();document.removeEventListener('click',onEvidenceLink);evidence.remove();activePanels.delete(panel);}});
  activePanels.set(panel,api);
  return api;
}
