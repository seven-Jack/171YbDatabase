import {escapeHTML} from './source-panel.js';
import {buildExplorerRecords,filterExplorerRecords,toggleComparison,comparisonConventions,COMPARISON_FIELDS,COMPARISON_LIMIT} from './explorer-model.js';

const activeExplorers=new WeakMap();
let instanceCount=0;
const e=escapeHTML;
const option=(value,label)=>`<option value="${e(value)}">${e(label)}</option>`;

export function initTransitionExplorer({transitions=[],calculator,
  picker=document.getElementById('transitionPicker'),
  toolbar=document.getElementById('explorerToolbar'),
  comparison=document.getElementById('transitionComparison')}={}) {
  if (!picker||!toolbar||!comparison) return Object.freeze({destroy(){}});
  if (activeExplorers.has(picker)) return activeExplorers.get(picker);
  const records=buildExplorerRecords(transitions),cards=new Map(),listeners=[];
  const originalButtons=new Map([...picker.querySelectorAll('button[data-select-transition]')]
    .map(button=>[button.dataset.selectTransition,button]));
  const prefix=`transition-explorer-${++instanceCount}`;
  let comparisonIds=[],lastSelection=null;
  const listen=(node,type,callback)=>{node.addEventListener(type,callback);listeners.push(()=>node.removeEventListener(type,callback));};
  toolbar.classList.add('transition-explorer-toolbar');
  toolbar.innerHTML=`<div class="explorer-search" role="search" aria-label="检索跃迁目录">
    <label class="explorer-sr-only" for="${prefix}-search">搜索态名、波长或用途</label>
    <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m12.7 12.7 4 4"/></svg>
    <input id="${prefix}-search" type="search" placeholder="搜索态名、波长或用途" autocomplete="off" spellcheck="false" aria-controls="${e(picker.id)}">
  </div>
  <details class="explorer-filters"><summary>筛选<span class="explorer-filter-count" hidden></span></summary><div class="explorer-filter-panel">
    <label>波段<select name="region">${option('all','全部波段')}${option('visible','可见光')}${option('UV','UV · 紫外')}${option('IR','IR · 红外')}</select></label>
    <label>跃迁类别<select name="strength">${option('all','全部类别')}${option('strong','强')}${option('weak','弱')}${option('forbidden','禁戒 / 诱导')}</select></label>
    <label>矩阵元证据<select name="evidence">${option('all','全部证据类型')}${option('literature-reported','文献记录')}${option('internal-calibration','内部校准')}${option('internal-calculation','本工作计算')}${option('scaling-estimate','标度估算')}${option('derived','由其他量推导')}${option('missing','矩阵元缺失')}</select></label>
    <p>筛选作用于下方目录，主图保留全部跃迁。</p>
  </div></details>
  <label class="explorer-sort"><span class="explorer-sr-only">目录排序</span><select name="sort" aria-label="目录排序">${option('default','默认顺序')}${option('wavelength-asc','波长 · 从短到长')}${option('wavelength-desc','波长 · 从长到短')}</select></label>
  <span class="explorer-result-count" role="status" aria-live="polite" aria-atomic="true"></span>
  <a class="explorer-catalog-link" href="#${e(picker.id)}">查看目录 <span aria-hidden="true">↓</span></a>
  <button type="button" class="explorer-reset" hidden>重置</button>`;
  picker.classList.add('explorer-catalog');
  picker.setAttribute('aria-label','跃迁目录；选择跃迁进入工作区');
  const empty=document.createElement('div');
  empty.className='explorer-empty';empty.hidden=true;
  empty.innerHTML='<strong>没有匹配的跃迁</strong><p>试试态名、波长数值或冷却、重泵等用途。</p><button type="button">重置检索</button>';
  picker.append(empty);
  const feedback=document.createElement('p');
  feedback.className='explorer-feedback';feedback.setAttribute('role','status');
  feedback.setAttribute('aria-live','polite');feedback.setAttribute('aria-atomic','true');
  picker.after(feedback);

  for (const record of records) {
    const button=originalButtons.get(record.id);
    if (!button) continue;
    const {transition,fields}=record;
    const card=document.createElement('article');card.className='explorer-card';
    card.dataset.explorerTransition=record.id;
    if (transition.color) card.style.setProperty('--transition-color',transition.color);
    button.classList.add('explorer-open');
    const title=document.createElement('span');title.className='explorer-entry-title';
    title.textContent=button.textContent;button.replaceChildren(title);
    // Move, rather than recreate, the existing selection button and its listeners.
    card.append(button);
    const summary=document.createElement('span');summary.className='explorer-card-summary';
    summary.innerHTML=`<span class="explorer-state-pair">${e(transition.lower)} <span aria-hidden="true">→</span> ${e(transition.upper)}</span>
      <span class="explorer-purpose">${e(transition.label)}</span>
      <span class="explorer-dipole">${fields.d_num.missing?'矩阵元缺失':`d ${e(fields.d_num.valueText)}`}<span>${e(fields.d_num.conventionText || '约定待核查')}</span></span>`;
    button.append(summary);
    const compare=document.createElement('button');compare.type='button';compare.className='explorer-compare';
    compare.dataset.compareTransition=record.id;compare.setAttribute('aria-pressed','false');
    compare.setAttribute('aria-label',`将 ${record.id} 加入参数对比`);compare.textContent='加入对比 +';
    listen(compare,'click',()=>{
      const next=toggleComparison(comparisonIds,record.id);
      comparisonIds=next.ids;
      feedback.textContent=next.action==='limit'?`最多比较 ${COMPARISON_LIMIT} 条跃迁，请先移除一项。`
        :next.action==='added'?`已加入 ${record.id}，共 ${comparisonIds.length} / ${COMPARISON_LIMIT} 条。`
        :`已移除 ${record.id}，共 ${comparisonIds.length} / ${COMPARISON_LIMIT} 条。`;
      renderComparison();
    });
    card.append(compare);picker.insertBefore(card,empty);cards.set(record.id,{card,compare});
  }

  const search=toolbar.querySelector('input[type="search"]');
  const controls=Object.fromEntries(['region','strength','evidence','sort'].map(name=>[name,toolbar.querySelector(`[name="${name}"]`)]));
  const resultCount=toolbar.querySelector('.explorer-result-count'),reset=toolbar.querySelector('.explorer-reset');
  const filterCount=toolbar.querySelector('.explorer-filter-count');
  function renderResults() {
    const options={query:search.value,...Object.fromEntries(Object.entries(controls).map(([key,node])=>[key,node.value]))};
    const matching=filterExplorerRecords(records,options),shown=new Set(matching.map(record=>record.id));
    for (const [id,{card}] of cards) card.hidden=!shown.has(id);
    for (const record of matching) if (cards.has(record.id)) picker.insertBefore(cards.get(record.id).card,empty);
    empty.hidden=matching.length>0;
    resultCount.textContent=`${matching.length} / ${records.length} 条`;
    const count=['region','strength','evidence'].filter(key=>controls[key].value!=='all').length;
    filterCount.hidden=count===0;filterCount.textContent=String(count);
    reset.hidden=!search.value&&!count&&controls.sort.value==='default';
    toolbar.dataset.filtered=String(matching.length!==records.length);
  }
  function resetFilters() {
    search.value='';
    for (const key of ['region','strength','evidence']) controls[key].value='all';
    controls.sort.value='default';renderResults();
  }
  function renderComparison() {
    for (const [id,{compare}] of cards) {
      const selected=comparisonIds.includes(id);
      compare.setAttribute('aria-pressed',String(selected));
      compare.setAttribute('aria-label',`${selected?'从参数对比移除':'将'} ${id}${selected?'':' 加入参数对比'}`);
      compare.textContent=selected?'已加入对比 ✓':'加入对比 +';
    }
    comparison.classList.add('transition-comparison');comparison.hidden=comparisonIds.length===0;
    if (!comparisonIds.length) {comparison.replaceChildren();return;}
    const selected=comparisonIds.map(id=>records.find(record=>record.id===id)).filter(Boolean);
    const convention=comparisonConventions(records,comparisonIds);
    comparison.innerHTML=`<div class="explorer-comparison-header"><div><h3>比较原记录参数 <span>${selected.length} / ${COMPARISON_LIMIT}</span></h3><p>${e(convention.text)}</p></div><button type="button" data-clear-comparison>清空对比</button></div>
      <div class="explorer-table-scroll" role="region" aria-label="所选跃迁的原记录参数对比" tabindex="0"><table>
      <caption class="explorer-sr-only">原记录参数；矩阵元约定和证据状态逐项列出</caption>
      <thead><tr><th scope="col">参数</th>${selected.map(record=>`<th scope="col"><span class="explorer-comparison-id">${e(record.id)} <button type="button" data-remove-comparison="${e(record.id)}" aria-label="从对比移除 ${e(record.id)}">移除</button></span><span>${e(record.transition.lower)} → ${e(record.transition.upper)}</span><small>${e(record.transition.label)}</small></th>`).join('')}</tr></thead>
      <tbody>${COMPARISON_FIELDS.map(({key,label})=>`<tr><th scope="row">${e(label)}</th>${selected.map(record=>{
        const field=record.fields[key];
        return `<td${field.missing?' class="explorer-missing"':''}><strong>${e(field.valueText)}</strong>${field.conventionText?`<span class="explorer-convention">${e(field.conventionText)}</span>`:''}<small>${e(field.evidenceText)} · ${e(field.reviewText)}</small></td>`;
      }).join('')}</tr>`).join('')}
      <tr><th scope="row">矩阵元证据</th>${selected.map(record=>`<td><span>${e(record.fields.d_num.evidenceText)}</span><small>${e(record.fields.d_num.reviewText)}${record.fields.d_num.missingArtifact?' · Notebook / Run 定位待补充':''}</small></td>`).join('')}</tr></tbody></table></div>
      <p class="explorer-comparison-note">寿命沿用原记录；对应态、温度及损失过程以各来源为准。通道和 Rabi 计算可在工作区查看。</p>`;
  }
  listen(search,'input',renderResults);
  const filters=toolbar.querySelector('.explorer-filters');
  listen(document,'click',event=>{if (filters.open&&!filters.contains(event.target)) filters.open=false;});
  listen(filters,'keydown',event=>{if (event.key==='Escape') {filters.open=false;filters.querySelector('summary').focus();}});
  for (const node of Object.values(controls)) listen(node,'change',renderResults);
  listen(reset,'click',resetFilters);listen(empty.querySelector('button'),'click',()=>{resetFilters();search.focus();});
  listen(comparison,'click',event=>{
    const clear=event.target.closest('button[data-clear-comparison]');
    const remove=event.target.closest('button[data-remove-comparison]');
    if (!clear&&!remove) return;
    const focusReturnId=remove?.dataset.removeComparison || comparisonIds[0];
    comparisonIds=clear?[]:comparisonIds.filter(id=>id!==remove.dataset.removeComparison);
    feedback.textContent=clear?'已清空对比。':`已移除 ${remove.dataset.removeComparison}，共 ${comparisonIds.length} / ${COMPARISON_LIMIT} 条。`;
    renderComparison();
    if (comparisonIds.length) comparison.querySelector('button[data-clear-comparison]')?.focus();
    else {
      const previous=cards.get(focusReturnId);
      (previous&&!previous.card.hidden?previous.compare:search).focus();
    }
  });
  const unsubscribe=calculator?.onChange?.(state=>{
    if (lastSelection===state?.transition?.id) return;
    lastSelection=state?.transition?.id;
    for (const [id,{card}] of cards) card.classList.toggle('is-current',id===lastSelection);
  });
  renderResults();renderComparison();
  const api=Object.freeze({
    reset:resetFilters,
    getComparisonIds:()=>[...comparisonIds],
    destroy(){unsubscribe?.();for (const remove of listeners) remove();activeExplorers.delete(picker);}
  });
  activeExplorers.set(picker,api);return api;
}
