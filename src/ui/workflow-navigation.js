import { buildSourceView } from './source-panel.js';

// Location describes navigation, not completion or scientific validation.
export function initWorkflowNavigation(calculator) {
  const navigation = document.getElementById('sectionNav');
  const links = [...navigation.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const steps = [...document.querySelectorAll('.flow-step[data-gstep]')];
  const location = document.getElementById('workflowLocation');
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
    for (const step of steps) {
      const link = step.querySelector('a');
      const current = link.getAttribute('href') === `#${active.id}`;
      step.classList.toggle('is-current', current);
      if (current) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    }
    const currentLink = links.find(link => link.getAttribute('href') === `#${active.id}`);
    location.textContent = `当前 · ${currentLink.textContent}`;
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
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    resizeObserver?.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
    unsubscribe?.();
  }});
}
