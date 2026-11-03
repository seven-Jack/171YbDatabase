import {buildExplorerRecords,filterExplorerRecords,toggleComparison,COMPARISON_LIMIT,COMPARISON_FIELDS} from './explorer-model.js';
import {buildEqualConditionComparison} from './equal-condition-comparison.js';
import {createFieldView,renderFieldSourceHTML,escapeHTML} from './source-panel.js';
import {getQuantity} from '../data/catalog.js';
import {renderDiagramSourceMarks} from './diagram-references.js';

const activeBrowsers=new WeakMap();
const e=escapeHTML;
const number=value=>Number.isFinite(value)?String(Number(value.toPrecision(6))):'—';
const fraction=value=>Number.isFinite(value)?Number.isInteger(value)?String(value):`${value*2}/2`:'—';
const magnetic=value=>`${value>0?'+':''}${fraction(value)}`;
const polarization=q=>({'-1':'σ⁻',0:'π',1:'σ⁺'})[q]||'—';
const channelText=channel=>channel?`F=${fraction(channel.F)}, mF=${magnetic(channel.m)} → F′=${fraction(channel.Fp)}, mF′=${magnetic(channel.mp)} · ${polarization(channel.q)}`:'通道待确认';
const frequencyScales={Hz:1,kHz:1e3,MHz:1e6,GHz:1e9};

/** Search the existing core table and compare without changing the live calculation. */
export function initDataBrowser({transitions=[],calculator,tables,versions={},onOpenTransition,onLoadComparison,
  host=document.getElementById('tab-core')}={}) {
  const tableWrap=host?.querySelector('.table-wrap');
  if(!host||!tableWrap||!calculator?.getState||!tables?.setCoreFilter||!tables?.onCoreRender)return Object.freeze({destroy(){}});
  if(activeBrowsers.has(host))return activeBrowsers.get(host);
  const records=buildExplorerRecords(transitions),byId=new Map(records.map(record=>[record.id,record]));
  const cleanups=[];
  let selectedIds=[],currentState=calculator.getState(),comparisonView=null;
  const browser=document.createElement('section');browser.id='dataBrowser';browser.className='data-browser';
  browser.setAttribute('aria-labelledby','dataBrowserTitle');
  browser.innerHTML=`<div class="data-browser-header"><h3 id="dataBrowserTitle">检索与比较</h3><p>检索核心跃迁；最多选择 ${COMPARISON_LIMIT} 条，在当前工作点比较。</p></div>
    <div class="data-browser-toolbar">
      <label class="data-browser-search" for="dataSearch"><span>搜索跃迁</span><input id="dataSearch" type="search" placeholder="波长、态名或用途，如 556 / 3P1" autocomplete="off" spellcheck="false" aria-controls="core-data-table"></label>
      <details class="data-browser-filters"><summary>筛选</summary><div class="data-browser-filter-panel">
        <label>波段<select id="dataRegion"><option value="all">全部波段</option><option value="visible">可见光</option><option value="UV">紫外 UV</option><option value="IR">红外 IR</option></select></label>
        <label>跃迁类别<select id="dataStrength"><option value="all">全部类别</option><option value="strong">强</option><option value="weak">弱</option><option value="forbidden">禁戒 / 诱导</option></select></label>
        <label>矩阵元证据<select id="dataEvidence"><option value="all">全部证据类型</option><option value="literature-reported">文献记录</option><option value="internal-calculation">本工作计算</option><option value="internal-calibration">内部校准</option><option value="derived">由其他量推导</option><option value="scaling-estimate">标度估算</option><option value="missing">矩阵元缺失</option></select></label>
      </div></details>
      <output class="data-browser-count" id="dataResultCount" role="status" aria-live="polite" aria-atomic="true"></output>
      <button type="button" class="data-browser-reset" id="dataSearchReset" hidden>重置检索</button>
    </div>
    <p class="data-browser-empty" id="dataSearchEmpty" hidden>没有匹配的跃迁。可尝试波长、态名或冷却、重泵等用途。</p>
    <p class="data-browser-feedback" id="dataBrowserFeedback" role="status" aria-live="polite" aria-atomic="true"></p>`;
  tableWrap.before(browser);
  const comparison=document.createElement('section');comparison.id='dataComparison';comparison.className='data-comparison';
  comparison.hidden=true;comparison.setAttribute('aria-labelledby','dataComparisonTitle');tableWrap.after(comparison);
  const search=browser.querySelector('#dataSearch'),filters=browser.querySelector('details');
  const region=browser.querySelector('#dataRegion'),strength=browser.querySelector('#dataStrength'),evidence=browser.querySelector('#dataEvidence');
  const reset=browser.querySelector('#dataSearchReset'),feedback=browser.querySelector('#dataBrowserFeedback');
  const bind=(element,type,listener)=>{element.addEventListener(type,listener);cleanups.push(()=>element.removeEventListener(type,listener));};

  function syncRowActions() {
    for(const row of host.querySelectorAll('table[data-table="core"] tbody tr[data-row-id]')){
      const record=byId.get(row.dataset.rowId);if(!record)continue;
      let actions=row.querySelector('.data-row-actions');
      if(!actions){
        actions=document.createElement('div');actions.className='data-row-actions';
        actions.innerHTML=`<button type="button" class="data-row-open" data-data-open="${e(record.id)}" aria-label="查看 ${e(record.id)} 的超精细分量">查看分量</button><button type="button" class="data-row-compare" data-data-compare="${e(record.id)}" aria-controls="dataComparison"></button>`;
        row.querySelector('[data-column="label"]').append(actions);
      }
      const chosen=selectedIds.includes(record.id),button=actions.querySelector('[data-data-compare]');
      button.setAttribute('aria-pressed',String(chosen));
      button.setAttribute('aria-label',`${chosen?'从比较移除':'加入比较'} ${record.id}`);
      button.textContent=chosen?'已加入 ✓':'加入比较 +';
      row.classList.toggle('data-row-current',record.id===currentState?.transition?.id);
    }
  }
  function renderResults() {
    const matching=filterExplorerRecords(records,{query:search.value,region:region.value,strength:strength.value,evidence:evidence.value});
    tables.setCoreFilter(matching.map(record=>record.id));
    browser.querySelector('#dataResultCount').textContent=`${matching.length} / ${records.length} 条`;
    browser.querySelector('#dataSearchEmpty').hidden=matching.length!==0;
    reset.hidden=!search.value&&[region,strength,evidence].every(select=>select.value==='all');
    const count=[region,strength,evidence].filter(select=>select.value!=='all').length;
    filters.querySelector('summary').textContent=count?`筛选 · ${count}`:'筛选';
  }
  function renderComparison() {
    const openSources=new Set([...comparison.querySelectorAll('details[open][data-comparison-source]')].map(node=>node.dataset.comparisonSource));
    comparison.hidden=selectedIds.length===0;
    if(!selectedIds.length){comparisonView=null;comparison.replaceChildren();return;}
    comparisonView=buildEqualConditionComparison(selectedIds.map(id=>byId.get(id).transition),currentState,versions);
    const context=comparisonView.context;
    const unit=Object.hasOwn(frequencyScales,currentState?.calculatorUnits?.rabi)?currentState.calculatorUnits.rabi
      :Object.hasOwn(frequencyScales,currentState?.rabiUnit)?currentState.rabiUnit:'MHz';
    const contextText=context.status==='ready'
      ?`原子处 Pq = ${number(context.P_mW)} mW · w₀ = ${number(context.w_um)} µm（1/e² 强度半径） · ${channelText(context.channel)}`
      :context.message;
    comparison.innerHTML=`<div class="data-comparison-heading"><div><h3 id="dataComparisonTitle" tabindex="-1">同条件 Rabi 比较 <span>${selectedIds.length} / ${COMPARISON_LIMIT}</span></h3><p>相同 Pq、w₀、偏振和完整 mF 通道；不匹配的跃迁不自动换通道。</p></div><button type="button" id="dataComparisonClear">清空比较</button></div>
      <output class="data-comparison-context" id="dataComparisonContext" data-status="${e(context.status)}">${e(contextText)}</output>
      <p class="data-comparison-note">${context.status==='ready'?e(context.selectionOrigin==='auto'?'沿用当前自动选择的实际通道。':'沿用当前手选通道。'):''} <a href="#secRabi">调整当前工作点与通道</a></p>
      <div class="data-comparison-grid">${comparisonView.rows.map(row=>{
        const record=byId.get(row.id),quantity=getQuantity(row.id,'d_num'),wave=getQuantity(row.id,'wavelength_vac_nm'),valid=row.status==='ok';
        const formula=row.evidence?.rows.find(item=>item.key==='formula');
        const experiment=row.evidence?.rows.find(item=>item.key==='experiment');
        return `<article class="data-comparison-card" data-comparison-id="${e(row.id)}" data-status="${e(row.status)}"${valid?` data-rabi-hz="${e(row.result.fR)}"`:''}>
          <header><h4>${e(row.id)} · ${e(record.fields.wavelength_vac_nm.valueText)}</h4>${renderDiagramSourceMarks(wave?.sourceId?[wave.sourceId]:[])}<button type="button" data-comparison-remove="${e(row.id)}" aria-label="从比较移除 ${e(row.id)}">移除</button></header>
          <p class="data-comparison-pair">${e(record.transition.lower)} → ${e(record.transition.upper)}</p>
          <div class="data-comparison-result"><strong>${valid?e(number(row.result.fR/frequencyScales[unit])):'—'}</strong><span>${valid?e(unit)+' · Ω/2π':'当前条件不可计算'}</span></div>
          <p class="data-comparison-channel">${valid?`d_eff = ${e(number(row.dEff_ea0))} ea₀ · 采用 d 的来源 ${renderDiagramSourceMarks(quantity?.sourceId?[quantity.sourceId]:[])}`:e(row.message)}</p>
          <p class="data-comparison-evidence">${valid?e(formula?.statusText||'当前通道尚未核查')+' · '+e(experiment?.statusText||'未独立验证'):''}</p>
          <details class="data-comparison-source" data-comparison-source="${e(row.id)}"><summary>原记录参数与来源</summary>${COMPARISON_FIELDS.map(({key})=>renderFieldSourceHTML(createFieldView(row.id,key))).join('')}</details>
          <button type="button" class="data-comparison-load" data-comparison-load="${e(row.id)}"${valid?'':' disabled'}>载入此工作点计算</button>
        </article>`;
      }).join('')}</div>
      <p class="data-comparison-note">比较值来自当前固定模型；原记录的 J / F 约化约定与证据分别保留。比较不改变当前计算或 M5 导出对象，只有“载入此工作点计算”会切换。不是独立实验验证。</p>`;
    for(const detail of comparison.querySelectorAll('details[data-comparison-source]'))detail.open=openSources.has(detail.dataset.comparisonSource);
  }
  const unsubscribeTable=tables.onCoreRender(syncRowActions);
  bind(search,'input',renderResults);
  for(const select of [region,strength,evidence])bind(select,'change',renderResults);
  bind(reset,'click',()=>{search.value='';for(const select of [region,strength,evidence])select.value='all';renderResults();search.focus();});
  bind(filters,'keydown',event=>{if(event.key==='Escape'){filters.open=false;filters.querySelector('summary').focus();}});
  bind(document,'click',event=>{if(filters.open&&!filters.contains(event.target))filters.open=false;});
  bind(host,'click',event=>{
    const open=event.target.closest?.('[data-data-open]');
    if(open){onOpenTransition?.(byId.get(open.dataset.dataOpen).transition);return;}
    const compare=event.target.closest?.('[data-data-compare]');
    if(compare){
      const next=toggleComparison(selectedIds,compare.dataset.dataCompare);selectedIds=next.ids;
      feedback.textContent=next.action==='limit'?`最多比较 ${COMPARISON_LIMIT} 条跃迁，请先移除一项。`:`已${next.action==='added'?'加入':'移除'} ${compare.dataset.dataCompare}，共 ${selectedIds.length} / ${COMPARISON_LIMIT} 条。`;
      syncRowActions();renderComparison();
      if(selectedIds.length){const link=document.createElement('a');link.href='#dataComparisonTitle';link.textContent='查看表格下方的比较结果 ↓';feedback.append(' ',link);}
      return;
    }
    const remove=event.target.closest?.('[data-comparison-remove]');
    if(remove||event.target.closest?.('#dataComparisonClear')){
      const removed=remove?.dataset.comparisonRemove;
      selectedIds=removed?selectedIds.filter(id=>id!==removed):[];
      feedback.textContent=removed?`已从比较移除 ${removed}。`:'已清空比较。';
      syncRowActions();renderComparison();
      (selectedIds.length?comparison.querySelector('#dataComparisonClear'):host.querySelector(`[data-data-compare="${removed||''}"]`)||search)?.focus();return;
    }
    const load=event.target.closest?.('[data-comparison-load]');
    if(load){
      const row=comparisonView?.rows.find(item=>item.id===load.dataset.comparisonLoad);
      if(row?.status==='ok'&&row.state)onLoadComparison?.(row.state);
    }
  });
  const unsubscribeCalculator=calculator.onChange(state=>{currentState=state;syncRowActions();renderComparison();});
  renderResults();renderComparison();
  const api=Object.freeze({getComparisonIds:()=>[...selectedIds],destroy(){unsubscribeTable?.();unsubscribeCalculator?.();cleanups.forEach(cleanup=>cleanup());tables.setCoreFilter(null);host.querySelectorAll('.data-row-actions').forEach(node=>node.remove());browser.remove();comparison.remove();activeBrowsers.delete(host);}});
  activeBrowsers.set(host,api);return api;
}
