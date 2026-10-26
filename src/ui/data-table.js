import {formatLifetime} from './format.js';
import {getQuantity,getSourceRecord} from '../data/catalog.js';
import {createFieldView,renderFieldSourceHTML,escapeHTML,formatFrequency} from './source-panel.js';

export const CORE_SUMMARY_COLUMNS=Object.freeze(['id','label','wavelength_vac_nm','d_num','source']);
const NUMERIC_COLUMNS=new Set(['wavelength_vac_nm','frequency_THz','energy_eV','lifetime_ns','Gamma_per_s_num','oscillator_strength_f_num','d_num','n','nstar','energy_cm','binding_cm','radius_um','lifetime_us','C6_ghz_um6','blockade_um','delta0','delta2']);
function numericValue(row,column) {
  const quantity=getQuantity(row.id,column);
  const value=quantity?quantity.value:row[column];
  if (value===null||value===undefined||typeof value==='boolean'||String(value).trim()==='') return null;
  const parsed=typeof value==='number'?value:Number(value);
  return Number.isFinite(parsed)?parsed:null;
}
export function sortTableRows(rows,{col=null,dir=null}={}) {
  if (!col||!dir) return [...rows];
  const sign=dir==='desc'?-1:1;
  return rows.map((row,index)=>({row,index})).sort((a,b)=>{
    if (NUMERIC_COLUMNS.has(col)) {
      const left=numericValue(a.row,col),right=numericValue(b.row,col);
      if (left===null&&right===null) return a.index-b.index;
      if (left===null) return 1;
      if (right===null) return -1;
      return (left-right)*sign||a.index-b.index;
    }
    return String(a.row[col]??'').localeCompare(String(b.row[col]??''),'zh-CN',{numeric:true})*sign||a.index-b.index;
  }).map(({row})=>row);
}

export function formatLinewidthDisplay(row) {
  const coefficient=getQuantity(row.id,'linewidth_frequency_coefficient_Hz');
  return {
    frequencyText:coefficient?.value!==null&&Number.isFinite(coefficient?.value)?formatFrequency(coefficient.value):'频率系数待核查',
    originalText:coefficient?.legacyText||row.linewidth_FWHM||'原记录缺失',
    decayText:Number.isFinite(row.Gamma_per_s_num)?`${row.Gamma_per_s_num} s⁻¹`:'缺失',
    reviewText:'按当前页面线宽频率约定展示保存系数；原文定义尚未重核'
  };
}

function sourceSummaryHTML(row) {
  const wave=createFieldView(row.id,'wavelength_vac_nm'),dipole=createFieldView(row.id,'d_num');
  if (!wave&&!dipole) return `<div class="src-text">${escapeHTML(row.source||'来源待补充')}</div>`;
  return `<details class="table-source-details"><summary>${escapeHTML([wave?`λ：${wave.kind}`:'',dipole?`d：${dipole.kind}`:''].filter(Boolean).join('；'))}</summary><div class="source-grid">${[dipole,wave].filter(Boolean).map(renderFieldSourceHTML).join('')}</div></details>`;
}

const initialized=new WeakMap();
export function initDataTables({CORE_TRANSITIONS,RYDBERG_TRANSITIONS,RYDBERG_STATES,QUANTUM_DEFECTS,REFERENCES}, {showInfoTooltip,hideInfoTooltip,buildInfoHtml}={}) {
  const tabs=document.getElementById('tableTabs');
  if (tabs&&initialized.has(tabs)) return initialized.get(tabs);
  const cleanups=[];
  const bind=(target,event,listener)=>{target.addEventListener(event,listener);cleanups.push(()=>target.removeEventListener(event,listener));};
  const sortStates={core:{col:null,dir:null},rydberg:{col:'n',dir:'asc'},states:{col:null,dir:null},defects:{col:null,dir:null}};
  let fullCore=false;
  const coreCols=['id','label','wavelength_vac_nm','frequency_THz','energy_eV','lifetime_ns','Gamma_per_s_num','oscillator_strength_f_num','d_num','classification','multipole','forbidden_reason','use','source'];
  const rydCols=['id','label','n','wavelength_vac_nm','energy_cm','excitation','rab_freq','classification','multipole','forbidden_reason','source'];
  const stateCols=['series','n','nstar','energy_cm','binding_cm','radius_um','lifetime_us','C6_ghz_um6','blockade_um','source'];
  const defectCols=['series','term','delta0','delta2','range','note','source'];
  const definitions=[['core',CORE_TRANSITIONS,coreCols,false],['rydberg',RYDBERG_TRANSITIONS,rydCols,true],['states',RYDBERG_STATES,stateCols,true],['defects',QUANTUM_DEFECTS,defectCols,true]];

  function infoTip(title,source,note,content) {
    return `<button type="button" class="info-tip" aria-label="${escapeHTML(title)}，查看来源说明" data-title="${escapeHTML(title)}" data-source="${escapeHTML(source)}" data-derivation="${escapeHTML(note)}">${content}</button>`;
  }
  function attachTableInfoTooltips(table) {
    table.querySelectorAll('tbody .info-tip').forEach(element=>{
      const html=typeof buildInfoHtml==='function'?buildInfoHtml(escapeHTML(element.dataset.title),escapeHTML(element.dataset.source),escapeHTML(element.dataset.derivation)):`<strong>${escapeHTML(element.dataset.title)}</strong><p>${escapeHTML(element.dataset.source)}</p><p>${escapeHTML(element.dataset.derivation)}</p>`;
      element.addEventListener('mouseenter',()=>showInfoTooltip?.(element,html));
      element.addEventListener('mouseleave',()=>hideInfoTooltip?.());
      element.addEventListener('focus',()=>showInfoTooltip?.(element,html));
      element.addEventListener('blur',()=>hideInfoTooltip?.());
      element.addEventListener('click',()=>showInfoTooltip?.(element,html));
    });
  }
  function formatCell(row,column,tableId) {
    const source=row.source||'详见来源与条件';
    const field=createFieldView(row.id,column);
    const fieldSource=field?`${field.sourceTitle}；${field.review}`:source;
    if (tableId==='core') {
      switch(column) {
        case 'id':return `<span class="mono">${escapeHTML(row.id)}</span>`;
        case 'label':return `<div class="trans-label">${escapeHTML(row.label)}</div><div class="trans-pair">${escapeHTML(row.lower)} → ${escapeHTML(row.upper)}</div>`;
        case 'wavelength_vac_nm':return `<div class="wl-cell"><span class="wl-dot" style="background:${escapeHTML(row.color)}"></span>${infoTip('真空波长 λ',fieldSource,'保留原记录；频率、波长和能量可来自独立记录，不擅自相互覆盖。',escapeHTML(row.approximate?'≈'+row.wavelength_vac_nm.toFixed(2):row.wavelength_vac_nm.toFixed(4)))}</div><div class="wl-sub">空气：${Number.isFinite(row.wavelength_air_nm)?row.wavelength_air_nm.toFixed(4):'待补充'} nm</div>`;
        case 'frequency_THz':return infoTip('跃迁频率 ν',fieldSource,'保存的普通频率；不因界面整理重算或替换原记录。',`<span class="mono">${row.frequency_THz.toFixed(5)} THz</span>`);
        case 'energy_eV':return infoTip('能量差 ΔE',fieldSource,'保留原记录；推导来源见对应字段。',`<span class="mono">${row.energy_eV.toFixed(4)} eV</span>`);
        case 'lifetime_ns':return infoTip('寿命 τ',fieldSource,'寿命定义、条件与衰变通道需结合来源；不直接等同其他寿命定义。',`<span class="mono">${escapeHTML(formatLifetime(row.lifetime_ns))}</span>`);
        case 'Gamma_per_s_num': {
          const linewidth=formatLinewidthDisplay(row);
          return `<div class="mono">${escapeHTML(linewidth.frequencyText)}</div><details class="linewidth-original"><summary>Γ 与原记录</summary><p>衰减率 Γ = ${escapeHTML(linewidth.decayText)}</p><p>原记录：${escapeHTML(linewidth.originalText)}</p><p>${escapeHTML(linewidth.reviewText)}</p></details>`;
        }
        case 'oscillator_strength_f_num':return infoTip('振子强度 f',fieldSource,'原记录未提供的值保持缺失。',`<span class="mono">${getQuantity(row.id,column)?.value===null?'缺失':escapeHTML(row.oscillator_strength_f)}</span>`);
        case 'd_num':return `<div>${infoTip('约化矩阵元 d',fieldSource,field?.convention||'矩阵元层级约定待核查',`<span class="mono">${getQuantity(row.id,'d_num')?.value===null?'缺少适用 E1 数据':escapeHTML(row.d_reduced_ea0)+' ea₀'}</span>`)}</div><div class="wl-sub">${escapeHTML(field?.convention||'约定待核查')}</div>`;
        case 'classification':return `<span class="badge badge-${row.classification==='强'?'strong':row.classification==='弱'?'weak':'forbidden'}">${escapeHTML(row.classification)}</span>`;
        case 'multipole':return `<span class="badge badge-${row.multipole.includes('M2')?'m2':'e1'}">${escapeHTML(row.multipole)}</span>`;
        case 'forbidden_reason':return `<div class="reason-text">${escapeHTML(row.forbidden_reason)}</div><div class="wl-sub">${escapeHTML(row.selection_check)}</div>`;
        case 'use':return `<div class="use-text">${escapeHTML(row.use)}</div>`;
        case 'source':return sourceSummaryHTML(row);
      }
    }
    if (column==='id') return `<span class="mono">${escapeHTML(row.id)}</span>`;
    if (column==='source') return `<div class="src-text">${escapeHTML(source)}</div>`;
    if (column==='label') return `<div class="trans-label">${escapeHTML(row.label)}</div><div class="trans-pair">${escapeHTML(row.lower)} → ${escapeHTML(row.upper_full||row.upper)}</div>`;
    if (column==='wavelength_vac_nm') return `<div class="wl-cell"><span class="wl-dot" style="background:${escapeHTML(row.color)}"></span>${escapeHTML(row.wavelength_vac_nm)} nm</div>`;
    if (column==='forbidden_reason'||column==='note') return `<div class="reason-text">${escapeHTML(row[column]||'未提供')}</div>`;
    const units={energy_cm:'cm⁻¹',radius_um:'µm',lifetime_us:'µs',blockade_um:'µm'};
    return `<span class="${NUMERIC_COLUMNS.has(column)?'mono':''}">${escapeHTML(row[column]??'未提供')}${units[column]?' '+units[column]:''}</span>`;
  }

  function applyColumnVisibility(table,columns,tableId) {
    const summary=tableId==='core'&&!fullCore;
    table.dataset.columnMode=summary?'summary':'full';
    table.querySelectorAll('tr').forEach(row=>Array.from(row.children).forEach((cell,index)=>{cell.hidden=summary&&!CORE_SUMMARY_COLUMNS.includes(columns[index]);}));
  }
  function renderTable(tableId,data,columns,isRyd) {
    const table=document.querySelector(`table[data-table="${tableId}"]`);
    if (!table) return;
    const tbody=table.querySelector('tbody');
    tbody.innerHTML=sortTableRows(data,sortStates[tableId]).map(row=>`<tr${isRyd?' class="ryd-row"':''} data-row-id="${escapeHTML(row.id||'')}">${columns.map(column=>`<td data-column="${column}">${formatCell(row,column,tableId)}</td>`).join('')}</tr>`).join('');
    table.querySelectorAll('th[data-sort]').forEach(header=>{
      const active=sortStates[tableId].col===header.dataset.sort;
      header.classList.toggle('sort-asc',active&&sortStates[tableId].dir==='asc');header.classList.toggle('sort-desc',active&&sortStates[tableId].dir==='desc');
      header.setAttribute('aria-sort',active?(sortStates[tableId].dir==='asc'?'ascending':'descending'):'none');
      const button=header.querySelector('button');
      if (button) button.setAttribute('aria-label',`按${button.textContent}排序${active?'，当前'+(sortStates[tableId].dir==='asc'?'升序':'降序'):''}`);
    });
    applyColumnVisibility(table,columns,tableId);attachTableInfoTooltips(table);
  }

  definitions.forEach(([tableId,data,columns,isRyd])=>{
    const table=document.querySelector(`table[data-table="${tableId}"]`);if (!table) return;
    const headers=Array.from(table.querySelectorAll('thead th'));
    if (tableId==='core') {
      headers[2].textContent='波长 λ / nm';headers[6].textContent='线宽频率系数';headers[8].textContent='矩阵元 / 约定';headers[13].textContent='来源与条件';
      table.id ||= 'core-data-table';
      const tools=document.createElement('div');tools.className='table-controls';
      const button=document.createElement('button');button.type='button';button.className='table-columns-toggle';button.textContent='显示全部字段';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',table.id);
      bind(button,'click',()=>{fullCore=!fullCore;button.textContent=fullCore?'仅显示主要字段':'显示全部字段';button.setAttribute('aria-expanded',String(fullCore));applyColumnVisibility(table,columns,'core');});
      tools.append(button);table.closest('.table-wrap').prepend(tools);
      cleanups.push(()=>tools.remove());
    }
    headers.forEach((header,index)=>{
      header.scope='col';header.dataset.column=columns[index];
      if (!header.dataset.sort) return;
      const button=document.createElement('button');button.type='button';button.className='table-sort-button';button.textContent=header.textContent;header.replaceChildren(button);
      bind(button,'click',()=>{const previous=sortStates[tableId];sortStates[tableId]={col:header.dataset.sort,dir:previous.col===header.dataset.sort&&previous.dir==='asc'?'desc':'asc'};renderTable(tableId,data,columns,isRyd);});
    });
    renderTable(tableId,data,columns,isRyd);
  });

  const tabButtons=Array.from(document.querySelectorAll('#tableTabs .tab-btn'));
  if (tabs) {tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','数据类别');}
  function selectTab(button) {
    tabButtons.forEach(tab=>{const active=tab===button;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));const panel=document.getElementById('tab-'+tab.dataset.tab);if(panel){panel.classList.toggle('active',active);panel.hidden=!active;}});
  }
  tabButtons.forEach((button,index)=>{
    button.id ||= `data-tab-${button.dataset.tab}`;button.type='button';button.setAttribute('role','tab');button.setAttribute('aria-controls','tab-'+button.dataset.tab);button.setAttribute('aria-selected',String(button.classList.contains('active')));
    const panel=document.getElementById('tab-'+button.dataset.tab);if(panel){panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.hidden=!button.classList.contains('active');}
    bind(button,'click',()=>selectTab(button));
    bind(button,'keydown',event=>{let target;if(event.key==='ArrowRight')target=(index+1)%tabButtons.length;else if(event.key==='ArrowLeft')target=(index+tabButtons.length-1)%tabButtons.length;else if(event.key==='Home')target=0;else if(event.key==='End')target=tabButtons.length-1;else return;event.preventDefault();tabButtons[target].focus();selectTab(tabButtons[target]);});
  });
  const counts={core:CORE_TRANSITIONS.length,rydberg:RYDBERG_TRANSITIONS.length,states:RYDBERG_STATES.length,defects:QUANTUM_DEFECTS.length};
  tabButtons.forEach(button=>{const count=button.querySelector('.count');if(count)count.textContent=counts[button.dataset.tab];});
  const metaCore=document.getElementById('metaCoreCount');if(metaCore)metaCore.textContent=`${counts.core} 条`;
  const list=document.getElementById('refList');
  if (list) list.innerHTML=REFERENCES.map(reference=>{const source=getSourceRecord('ref-'+String(reference.num).padStart(2,'0'));const url=source?.url&&/^https:\/\//.test(source.url)?source.url:null;return `<div class="ref-item"><div class="ref-num">[${reference.num}]</div><div class="ref-text"><strong>${escapeHTML(reference.title)}</strong> — ${escapeHTML(reference.detail)}<span class="ref-doi">${escapeHTML(reference.doi)}${url?` · <a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">原文链接</a>`:''}</span></div></div>`;}).join('');
  const api=Object.freeze({destroy(){cleanups.forEach(cleanup=>cleanup());if(tabs)initialized.delete(tabs);}});
  if(tabs)initialized.set(tabs,api);
  return api;
}
