const activeNavigations=new WeakMap();

/** Use the plotted transition itself as the selection and workspace entry. */
export function initDiagramNavigation({svg,transitions=[],calculator,destination,hideTooltip,closeLevelDetails}={}) {
  if (!svg||!destination||!calculator) return Object.freeze({destroy(){}});
  if (activeNavigations.has(svg)) return activeNavigations.get(svg);
  const records=new Map(transitions.map(transition=>[transition.id,transition]));
  const lines=[...svg.querySelectorAll('.transition-line[data-id]')].filter(line=>records.has(line.dataset.id));
  const knownLines=new Set(lines),saved=new Map();
  const attributes=['role','tabindex','aria-label','aria-controls','aria-pressed','aria-disabled'];
  const remember=element=>saved.set(element,new Map(attributes.map(name=>[name,element.getAttribute(name)])));
  remember(svg);
  svg.setAttribute('role','group');
  svg.setAttribute('aria-label','¹⁷¹Yb 能级与跃迁图；选择跃迁线进入超精细分量。');
  const unavailable=line=>line.hidden||line.style?.pointerEvents==='none'||line.getAttribute('aria-hidden')==='true';
  const syncAvailability=()=>lines.forEach(line=>{
    const disabled=unavailable(line);
    line.setAttribute('tabindex',disabled?'-1':'0');
    line.setAttribute('aria-disabled',String(disabled));
  });
  for (const line of lines) {
    remember(line);
    const transition=records.get(line.dataset.id);
    line.setAttribute('role','button');
    line.setAttribute('aria-label',`${transition.id} · ${transition.lower} → ${transition.upper} · ${transition.wavelength_vac_nm} nm，选择并跳转到超精细分量`);
    line.setAttribute('aria-controls',destination.id);
    line.setAttribute('aria-pressed','false');
  }
  syncAvailability();
  const heading=destination.querySelector('.section-title,h2')||destination;
  const headingTabIndex=heading.getAttribute('tabindex');
  if (headingTabIndex===null) heading.setAttribute('tabindex','-1');
  const view=svg.ownerDocument?.defaultView||globalThis.window;
  function activate(event) {
    const origin=event.target?.closest?event.target:event.target?.parentElement;
    const line=origin?.closest?.('.transition-line[data-id]');
    if (!knownLines.has(line)||unavailable(line)) return;
    if (event.type==='keydown') {
      if (!['Enter',' ','Spacebar'].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat) return;
    }
    calculator.loadTransition(records.get(line.dataset.id));
    hideTooltip?.();
    closeLevelDetails?.();
    const hash=`#${destination.id}`;
    if (view?.history?.pushState&&view?.location?.hash!==hash) view.history.pushState(null,'',hash);
    else if (view?.history?.replaceState) view.history.replaceState(null,'',hash);
    else if (view?.location) view.location.hash=hash;
    heading.focus({preventScroll:true});
    // Native scrolling honors the page's scroll-padding and scroll-margin.
    destination.scrollIntoView({block:'start',behavior:'auto'});
  }
  svg.addEventListener('click',activate);
  svg.addEventListener('keydown',activate);
  const unsubscribe=calculator.onChange?.(state=>{
    for (const line of lines) line.setAttribute('aria-pressed',String(line.dataset.id===state?.transition?.id));
  });
  const Observer=view?.MutationObserver||globalThis.MutationObserver;
  const observer=Observer?new Observer(syncAvailability):null;
  observer?.observe(svg,{subtree:true,attributes:true,attributeFilter:['style','hidden','aria-hidden']});
  const api=Object.freeze({destroy(){
    svg.removeEventListener('click',activate);
    svg.removeEventListener('keydown',activate);
    unsubscribe?.();observer?.disconnect();
    for (const [element,values] of saved) for (const [name,value] of values) {
      if (value===null) element.removeAttribute(name);else element.setAttribute(name,value);
    }
    if (headingTabIndex===null) heading.removeAttribute('tabindex');
    activeNavigations.delete(svg);
  }});
  activeNavigations.set(svg,api);
  return api;
}
