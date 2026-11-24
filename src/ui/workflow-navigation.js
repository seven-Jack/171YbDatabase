import { buildSourceView } from './source-panel.js';

// Location describes navigation, not completion or scientific validation.
export function initWorkflowNavigation(calculator) {
  const navigation = document.getElementById('sectionNav');
  const links = [...navigation.querySelectorAll('a[href^="#"]')];
  function focusSearch(event) {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const search = document.getElementById('dataSearch');
    if (!search) return;
    const core = document.getElementById('data-tab-core');
    if (core?.getAttribute('aria-selected') === 'false') core.click();
    requestAnimationFrame(() => {
      search.focus({preventScroll:true});
      search.scrollIntoView({block:'nearest', behavior:'instant'});
    });
  }
  const searchLinks = [...document.querySelectorAll('[data-open-search]')];
  searchLinks.forEach(link => link.addEventListener('click', focusSearch));
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  let frame = null;
  const updateLocation = () => {
    frame = null;
    const anchorInset = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const threshold = Math.max(navigation.getBoundingClientRect().height + 32, anchorInset + 24);
    const active = sections.filter(section => section.getBoundingClientRect().top <= threshold).at(-1) || sections[0];
    for (const link of links) {
      if (link.getAttribute('href') === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  const schedule = () => { if (frame === null) frame = requestAnimationFrame(updateLocation); };
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  sections.forEach(section => resizeObserver?.observe(section));
  updateLocation();

  const unsubscribe = calculator.onChange(state => {
    const view = buildSourceView(state);
    const object = view.transition ? `${view.transition.id} · ${view.transition.lower} → ${view.transition.upper}` : '请先选择跃迁';
    document.querySelector('[data-workflow-object="channels"]').textContent = object;
    document.querySelector('[data-workflow-object="result"]').textContent = view.transition
      ? `${view.transition.id} · ${view.channel}` : '请先选择跃迁与通道';
  });
  return Object.freeze({destroy() {
    searchLinks.forEach(link => link.removeEventListener('click', focusSearch));
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    resizeObserver?.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
    unsubscribe?.();
  }});
}
