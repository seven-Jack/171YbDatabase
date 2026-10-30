import {getTransitionRecord,getLevelRecord,getQuantity,getSourceRecord} from '../data/catalog.js';
import {createFieldView,escapeHTML} from './source-panel.js';

const endpointLabel=Object.freeze({lower:'下能级',upper:'上能级'});
const parityLabel=Object.freeze({even:'偶宇称',odd:'奇宇称'});
const safeHTTPS=value=>{
  if (typeof value!=='string') return null;
  try {const url=new URL(value);return url.protocol==='https:'?url.href:null;} catch {return null;}
};
const formatWavelength=value=>Number.isFinite(value)?`${Number(value.toPrecision(7))} nm`:'波长未记录';

function levelView(id) {
  const level=getLevelRecord(id);
  const attributes=level?.attributes || {};
  return {
    id,term:attributes.term || '能级记录缺失',config:attributes.config || '',
    J:Number.isFinite(attributes.J)?String(attributes.J):'待补充',
    parity:parityLabel[attributes.parity] || '宇称待补充',missing:!level
  };
}

function transitionView(record,decorated) {
  const presentation=record.views?.core?.presentation || {};
  return {
    id:record.id,label:decorated?.label || presentation.label || record.id,
    lower:levelView(record.lowerLevelId),upper:levelView(record.upperLevelId),
    wavelength:formatWavelength(getQuantity(record.id,'wavelength_vac_nm')?.value)
  };
}

/** A catalog index: endpoint identity establishes relations, never a recommended excitation path. */
export function buildKnowledgeView(transitionId,transitions=[]) {
  const record=getTransitionRecord(transitionId);
  const empty={transition:null,related:[],sources:[],status:transitionId?'unknown':'unselected'};
  if (!record) return empty;
  const available=Array.isArray(transitions)?transitions:[];
  const selected=available.find(item=>item?.id===transitionId);
  const transition=transitionView(record,selected);
  const endpoints=[['lower',record.lowerLevelId],['upper',record.upperLevelId]];
  const seen=new Set([transitionId]);
  const related=[];
  for (const item of available) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    const candidate=getTransitionRecord(item.id);
    if (!candidate) continue;
    const candidateEndpoints=[['lower',candidate.lowerLevelId],['upper',candidate.upperLevelId]];
    const sharedLevels=[];
    for (const [selectedEndpoint,levelId] of endpoints) {
      for (const [relatedEndpoint,candidateLevelId] of candidateEndpoints) {
        if (levelId===candidateLevelId) sharedLevels.push({
          id:levelId,term:levelView(levelId).term,selectedEndpoint,relatedEndpoint
        });
      }
    }
    if (sharedLevels.length) related.push({...transitionView(candidate,item),sharedLevels});
  }

  const sourceGroups=new Map();
  for (const key of Object.keys(record.quantities)) {
    const quantity=getQuantity(transitionId,key);
    if (!quantity) continue;
    const field=createFieldView(transitionId,key);
    const sourceId=quantity.sourceId || null;
    if (!sourceGroups.has(sourceId)) {
      const source=getSourceRecord(sourceId);
      sourceGroups.set(sourceId,{
        id:sourceId,title:source?.title || '来源记录缺失',url:safeHTTPS(source?.url),
        missingRecord:!source,fields:[]
      });
    }
    sourceGroups.get(sourceId).fields.push({
      key,label:field.label,kind:field.kind,review:field.review,
      evidenceKind:quantity.evidenceKind,reviewStatus:quantity.reviewStatus,
      missing:quantity.value===null,missingText:quantity.value===null?field.valueText:null,
      missingArtifact:field.missingArtifact,artifactLocator:field.artifactLocator,
      convention:field.convention
    });
  }
  return {transition,related,sources:[...sourceGroups.values()],status:'ready'};
}

function renderRelated(item) {
  const shared=item.sharedLevels.map(level=>`${level.term}（当前${endpointLabel[level.selectedEndpoint]} / 该项${endpointLabel[level.relatedEndpoint]}）`).join('；');
  return `<li><button class="knowledge-related-button" type="button" data-knowledge-transition="${escapeHTML(item.id)}">
    <span class="knowledge-related-main"><span class="knowledge-id">${escapeHTML(item.id)}</span><strong>${escapeHTML(item.lower.term)} → ${escapeHTML(item.upper.term)}</strong><span class="knowledge-related-arrow" aria-hidden="true">↗</span></span>
    <span class="knowledge-related-meta">${escapeHTML(item.wavelength)} · ${escapeHTML(item.label)}</span>
    <span class="knowledge-related-reason">共享 ${escapeHTML(shared)}</span>
  </button></li>`;
}

function renderSource(source) {
  const kinds=[...new Set(source.fields.map(field=>field.kind))].join(' / ');
  const reviews=[...new Set(source.fields.map(field=>field.review))].join(' / ');
  const url=safeHTTPS(source.url);
  return `<details class="knowledge-source" data-knowledge-source="${escapeHTML(source.id || '')}">
    <summary><span class="knowledge-source-heading"><strong>${escapeHTML(source.title)}</strong><span>${source.fields.length} 个字段</span></span><span class="knowledge-source-fields">${source.fields.map(field=>escapeHTML(field.label)).join(' · ')}</span></summary>
    <p class="knowledge-source-status">${escapeHTML(kinds)} · ${escapeHTML(reviews)}</p>
    <dl class="knowledge-field-map">${source.fields.map(field=>`<div data-knowledge-field="${escapeHTML(field.key)}"><dt>${escapeHTML(field.label)}</dt><dd>${escapeHTML(field.kind)} · ${escapeHTML(field.review)}${field.convention?` · ${escapeHTML(field.convention)}`:''}${field.missing?`<span class="knowledge-missing">${escapeHTML(field.missingText)}</span>`:''}${field.missingArtifact?'<span class="knowledge-missing">Notebook / Run 及版本定位待补充</span>':''}${field.artifactLocator?'<span class="knowledge-artifact">已登记保存工件；详见数值与来源</span>':''}</dd></div>`).join('')}</dl>
    ${source.missingRecord?'<p class="knowledge-missing">来源记录缺失</p>':''}
    ${url?`<a class="knowledge-source-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">查看来源原文 <span aria-hidden="true">↗</span></a>`:''}
  </details>`;
}

export function renderKnowledgeHTML(view) {
  if (!view.transition) return `<p class="knowledge-empty">${view.status==='unknown'?'当前跃迁没有对应的目录记录。':'选择一条跃迁，浏览能级关联与字段来源。'}</p>`;
  const {transition,related,sources}=view;
  const endpoint=(level,position)=>`<div class="knowledge-level"><span class="knowledge-level-caption">${endpointLabel[position]}</span><strong>${escapeHTML(level.term)}</strong><span>${escapeHTML(level.config)} · J = ${escapeHTML(level.J)} · ${escapeHTML(level.parity)}</span></div>`;
  return `<header class="knowledge-header"><p class="knowledge-eyebrow">对象 · 关系 · 来源</p><h3><span>${escapeHTML(transition.id)}</span> ${escapeHTML(transition.lower.term)} → ${escapeHTML(transition.upper.term)}</h3><p>${escapeHTML(transition.label)} <span aria-hidden="true">·</span> ${escapeHTML(transition.wavelength)}</p></header>
    <div class="knowledge-levels" aria-label="当前跃迁两端能级">${endpoint(transition.lower,'lower')}<span class="knowledge-level-connector" aria-hidden="true">→</span>${endpoint(transition.upper,'upper')}</div>
    <section class="knowledge-section" aria-label="共享能级的跃迁"><div class="knowledge-section-heading"><h4>能级关联</h4><span>${related.length} 条</span></div><p class="knowledge-hint">按目录中的共同能级关联。</p>
      ${related.length?`<ul class="knowledge-related-list">${related.slice(0,3).map(renderRelated).join('')}</ul>${related.length>3?`<details class="knowledge-more"><summary>展开其余 ${related.length-3} 条关联</summary><ul class="knowledge-related-list">${related.slice(3).map(renderRelated).join('')}</ul></details>`:''}`:'<p class="knowledge-empty">当前目录中没有共享能级的其他跃迁。</p>'}
    </section>
    <section class="knowledge-section" aria-label="字段来源索引"><div class="knowledge-section-heading"><h4>字段与出处</h4><span>${sources.length} 项来源</span></div><p class="knowledge-hint">保留现有证据分类与核查状态；完整条件见数值与来源。</p><div class="knowledge-sources">${sources.map(renderSource).join('')}</div></section>`;
}

const activePanels=new WeakMap();
export function initTransitionKnowledge({transitions=[],calculator,host=globalThis.document?.getElementById('transitionKnowledge')}={}) {
  if (!host || !calculator?.onChange) return Object.freeze({destroy(){}});
  if (activePanels.has(host)) return activePanels.get(host);
  host.classList.add('transition-knowledge');
  const available=new Map(transitions.filter(item=>item?.id).map(item=>[item.id,item]));
  let lastId=Symbol('uninitialized');
  const render=state=>{
    const id=state?.transition?.id;
    if (lastId===id) return;
    host.innerHTML=renderKnowledgeHTML(buildKnowledgeView(id,transitions));
    lastId=id;
  };
  const activate=event=>{
    const button=event.target.closest?.('button[data-knowledge-transition]');
    if (!button || !host.contains(button)) return;
    const transition=available.get(button.dataset.knowledgeTransition);
    if (transition) calculator.loadTransition(transition);
  };
  host.addEventListener('click',activate);
  const unsubscribe=calculator.onChange(render);
  const api=Object.freeze({destroy(){
    unsubscribe?.();host.removeEventListener('click',activate);activePanels.delete(host);
  }});
  activePanels.set(host,api);
  return api;
}
