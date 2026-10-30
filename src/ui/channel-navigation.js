/** Enter the result workspace only after an explicit channel activation. */
export function createChannelNavigation({destination,hideTooltip,view=destination?.ownerDocument?.defaultView||globalThis.window}={}) {
  if (!destination) return ()=>{};
  const heading=destination.querySelector('.section-title,h2')||destination;
  if (heading.getAttribute('tabindex')===null) heading.setAttribute('tabindex','-1');
  return ()=>{
    hideTooltip?.();
    const hash=`#${destination.id}`;
    if (view?.location?.hash!==hash) {
      if (view?.history?.pushState) view.history.pushState(null,'',hash);
      else if (view?.location) view.location.hash=hash;
    }
    heading.focus({preventScroll:true});
    // The existing sticky navigation and state marker set scroll-padding.
    destination.scrollIntoView({block:'start',behavior:'auto'});
  };
}
