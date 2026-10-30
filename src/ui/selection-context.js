import { channelKey, computeCGChannels, computeDEff, polarizationQ } from '../physics/angular.js';
import { getTransitionRecord } from '../data/catalog.js';
import { buildSourceView } from './source-panel.js';
import { renderCompactTooltip } from './compact-tooltip.js';

const fraction=value=>Number.isFinite(value)?String(value%1===0?value:`${value*2}/2`):'—';
const magnetic=value=>Number.isFinite(value)?`${value<0?'−':value>0?'+':''}${fraction(Math.abs(value))}`:'—';
const polarization={pi:'π',sigmap:'σ⁺',sigmam:'σ⁻'};
const number=value=>Number.isFinite(value)?String(Number(value.toPrecision(6))):'—';
const stateLabel=(channel,upper=false)=>`F${upper?'′':''}=${fraction(channel[upper?'Fp':'F'])}, mF${upper?'′':''}=${magnetic(channel[upper?'mp':'m'])}`;

/** A read-only description of the channel actually used by the calculator. */
export function buildSelectionContext(state={}) {
  const transition=state.transition;
  if (!transition) return {transition:null};
  const source=buildSourceView(state);
  const unavailable=['unsupported','missing-data','forbidden','no-channel'].includes(source.status);
  const channels=unavailable?[]:computeCGChannels(state).filter(channel=>channel.q===polarizationQ(state.pol));
  const explicit=state.selectedChannel&&channels.find(channel=>channelKey(channel)===channelKey(state.selectedChannel));
  const effective=unavailable?{}:computeDEff(state);
  const channel=explicit||channels.find(item=>item.F===state.F_lower&&item.Fp===state.F_upper&&item.m===effective.mF&&item.mp===effective.mFp);
  const mode=channel?(explicit?'手动选定':'自动 · 最强通道'):'通道不可用';
  const hiddenByFilter=!!channel&&((state.diagF_lower!==undefined&&state.diagF_lower!=='all'&&Number(state.diagF_lower)!==channel.F)||(state.diagF_upper!==undefined&&state.diagF_upper!=='all'&&Number(state.diagF_upper)!==channel.Fp));
  const record=getTransitionRecord(transition.id);
  const refs=key=>record?.quantities[key]?.sourceId?[record.quantities[key].sourceId]:[];
  const pol=polarization[state.pol]||'—';
  const wavelength=`${state.wavelength_nm||transition.wavelength_vac_nm} nm`;
  const rows=[
    {label:'波长',value:wavelength,sourceIds:refs('wavelength_vac_nm')},
    {label:'初态',value:channel?`${transition.lower} · ${stateLabel(channel)}`:transition.lower},
    {label:'末态',value:channel?`${transition.upper} · ${stateLabel(channel,true)}`:transition.upper},
    ...(channel?[{label:'偏振',value:`${pol} · ΔmF=${channel.q>0?'+':''}${channel.q}`},{label:'|d_eff|',value:`${number(state.dEff)} ea₀`,sourceIds:refs('d_num')}]:[])
  ];
  return {transition,channel,mode,status:source.status,hiddenByFilter,wavelength,
    transitionText:`${transition.id} · ${transition.lower} → ${transition.upper}`,
    channelText:channel?`${stateLabel(channel)} → ${stateLabel(channel,true)} · ${pol}`:source.statusText,
    tooltip:{id:transition.id,title:'当前计算状态',rows,footnote:[mode,source.status==='ready'?'':source.statusText,hiddenByFilter?'显示筛选未包含当前通道':''].filter(Boolean).join(' · ')}};
}

const activeContexts=new WeakMap();
export function initSelectionContext({calculator,host=globalThis.document?.getElementById('selectionContext'),navigation=globalThis.document?.getElementById('sectionNav')}={}) {
  if (!host||!calculator?.onChange) return Object.freeze({destroy(){}});
  if (activeContexts.has(host)) return activeContexts.get(host);
  const doc=host.ownerDocument,view=doc.defaultView;
  const trigger=host.querySelector('[data-selection-trigger]');
  const panel=host.querySelector('[data-selection-panel]');
  const summary=host.querySelector('[data-selection-transition]');
  const channel=host.querySelector('[data-selection-channel]');
  const mode=host.querySelector('[data-selection-mode]');
  const details=host.querySelector('[data-selection-details]');
  const announcement=host.querySelector('[data-selection-announcement]');
  let timer=null,pinned=false,ignoreFocus=false,lastAnnouncement='';
  const cancel=()=>{if(timer!==null)view.clearTimeout(timer);timer=null;};
  const setOpen=open=>{cancel();panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));};
  const close=()=>{pinned=false;setOpen(false);};
  const enter=()=>setOpen(true);
  const leave=()=>{cancel();if(!pinned)timer=view.setTimeout(()=>{if(!host.contains(doc.activeElement))setOpen(false);},140);};
  const focusIn=()=>{if(!ignoreFocus)setOpen(true);};
  const focusOut=event=>{if(!host.contains(event.relatedTarget)&&!pinned)setOpen(false);};
  const toggle=()=>{pinned=!pinned;setOpen(pinned);};
  const dismiss=event=>{if(!host.contains(event.target))close();};
  const escape=event=>{
    if(event.key!=='Escape'||panel.hidden)return;
    event.preventDefault();close();
    if(host.contains(doc.activeElement)){ignoreFocus=true;trigger.focus({preventScroll:true});ignoreFocus=false;}
  };
  const follow=event=>{if(event.target.closest?.('a'))close();};
  const resize=()=>{
    doc.documentElement.style.setProperty('--selection-nav-height',`${Math.ceil(navigation?.getBoundingClientRect().height||0)}px`);
    doc.documentElement.style.setProperty('--selection-context-height',`${Math.ceil(host.getBoundingClientRect().height)}px`);
  };
  host.addEventListener('pointerenter',enter);host.addEventListener('pointerleave',leave);
  host.addEventListener('focusin',focusIn);host.addEventListener('focusout',focusOut);
  trigger.addEventListener('click',toggle);panel.addEventListener('click',follow);
  doc.addEventListener('pointerdown',dismiss);doc.addEventListener('keydown',escape);
  view.addEventListener('resize',resize);
  const observer=view.ResizeObserver?new view.ResizeObserver(resize):null;
  if(navigation)observer?.observe(navigation);observer?.observe(host);
  const unsubscribe=calculator.onChange(state=>{
    const model=buildSelectionContext(state);
    host.hidden=!model.transition;
    if(!model.transition){close();resize();return;}
    host.dataset.selectionTransition=model.transition.id;
    host.dataset.selectionMode=model.channel?(model.mode==='手动选定'?'explicit':'automatic'):'unavailable';
    summary.textContent=model.transitionText;
    channel.textContent=model.channelText;
    mode.textContent=model.mode;
    details.innerHTML=renderCompactTooltip(model.tooltip);
    const text=`当前计算：${model.transitionText}；${model.mode}；${model.channelText}`;
    trigger.setAttribute('aria-label',`${text}。展开状态详情`);
    if(text!==lastAnnouncement){announcement.textContent=text;lastAnnouncement=text;}
    resize();
  });
  const api=Object.freeze({destroy(){
    cancel();unsubscribe?.();observer?.disconnect();
    host.removeEventListener('pointerenter',enter);host.removeEventListener('pointerleave',leave);
    host.removeEventListener('focusin',focusIn);host.removeEventListener('focusout',focusOut);
    trigger.removeEventListener('click',toggle);panel.removeEventListener('click',follow);
    doc.removeEventListener('pointerdown',dismiss);doc.removeEventListener('keydown',escape);
    view.removeEventListener('resize',resize);
    doc.documentElement.style.removeProperty('--selection-nav-height');doc.documentElement.style.removeProperty('--selection-context-height');
    activeContexts.delete(host);
  }});
  activeContexts.set(host,api);return api;
}
