/** Enlarge the existing SVG and pan within its window, keeping the plotted channels interactive. */
export function initAtlasViewport(svg, dismissDetails) {
  const viewport = svg.parentElement;
  const zoom = document.getElementById('atlasZoom');
  const hint = document.getElementById('atlasPanHint');
  const filters = document.getElementById('atlasFilters');
  const filterState = document.getElementById('atlasFilterState');
  const compact = window.matchMedia('(max-width: 768px)');

  function setZoom(enlarged) {
    viewport.toggleAttribute('data-zoomed', enlarged);
    zoom.setAttribute('aria-pressed', String(enlarged));
    zoom.textContent = enlarged ? '还原全图' : '放大图谱';
    hint.hidden = !enlarged;
    if (!enlarged) {
      viewport.removeAttribute('tabindex');
      viewport.removeAttribute('aria-describedby');
      viewport.scrollTo({left: 0, top: 0, behavior: 'instant'});
      return;
    }

    viewport.tabIndex = 0;
    viewport.setAttribute('aria-describedby', hint.id);
    const visibleLine = '.transition-line[aria-disabled="false"]';
    const label = svg.querySelector(visibleLine + '[aria-pressed="true"] text') || svg.querySelector(visibleLine + ' text');
    const target = (label || svg).getBoundingClientRect();
    const frame = viewport.getBoundingClientRect();
    viewport.scrollBy({
      left: target.left + target.width / 2 - frame.left - viewport.clientWidth / 2,
      top: target.top + target.height / 2 - frame.top - viewport.clientHeight / 2,
      behavior: 'instant'
    });
  }

  zoom.addEventListener('click', () => setZoom(!viewport.hasAttribute('data-zoomed')));
  viewport.addEventListener('scroll', dismissDetails, {passive:true});
  filters.addEventListener('click', event => {
    if (!event.target.closest('button')) return;
    const active = filters.querySelectorAll('.active:not([data-fcat="all"], [data-fstrength="all"])');
    filterState.textContent = Array.from(active, button => button.textContent).join(' · ');
  });
  function applyLayout() {
    filters.open = !compact.matches;
    setZoom(false);
  }
  compact.addEventListener('change', applyLayout);
  applyLayout();
}
