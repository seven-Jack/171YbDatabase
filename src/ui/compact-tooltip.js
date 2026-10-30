import { escapeHTML } from './source-panel.js';
import { renderDiagramSourceMarks } from './diagram-references.js';
import { chooseDiagramPanelPosition } from './diagram-placement.js';

/** Models contain plain display text; only the registered citation links are HTML. */
export function renderCompactTooltip({id='',title='',rows=[],footnote=''}={}) {
  return `<div class="compact-tooltip-content" data-compact-tooltip>
    <div class="compact-tooltip-head">${id?`<span class="compact-tooltip-id">${escapeHTML(id)}</span>`:''}<div class="compact-tooltip-title">${escapeHTML(title)}</div></div>
    ${rows.map(row=>`<div class="compact-tooltip-row"><span>${escapeHTML(row.label)}</span><strong>${escapeHTML(row.value)}${renderDiagramSourceMarks(row.sourceIds||[])}${row.note?`<small>${escapeHTML(row.note)}</small>`:''}</strong></div>`).join('')}
    ${footnote?`<div class="compact-tooltip-foot">${escapeHTML(footnote)}</div>`:''}</div>`;
}

/** Keep a compact card outside its active plot/table where space is available. */
export function positionWorkspaceTooltip(card,target,plotElement=target,event=null) {
  if (!card||!target) return;
  const plot=plotElement?.getBoundingClientRect?.()||target.getBoundingClientRect();
  let anchor=target.getBoundingClientRect();
  if (String(target.tagName).toLowerCase()==='canvas'&&Number.isFinite(event?.clientX)&&Number.isFinite(event?.clientY)) {
    anchor={left:event.clientX-4,right:event.clientX+4,top:event.clientY-4,bottom:event.clientY+4};
  }
  const segments=[],levels=[];
  if (String(plotElement?.tagName).toLowerCase()==='svg') {
    for (const line of plotElement.querySelectorAll('line')) {
      const m=line.getScreenCTM();
      if (!m||!line.x1) continue;
      const x1=line.x1.baseVal.value,y1=line.y1.baseVal.value,x2=line.x2.baseVal.value,y2=line.y2.baseVal.value;
      segments.push({x1:m.a*x1+m.c*y1+m.e,y1:m.b*x1+m.d*y1+m.f,x2:m.a*x2+m.c*y2+m.e,y2:m.b*x2+m.d*y2+m.f});
    }
    for (const text of plotElement.querySelectorAll('text')) {
      const b=text.getBoundingClientRect();
      if (b.width>0&&b.height>0) levels.push({left:b.left-2,right:b.right+2,top:b.top-2,bottom:b.bottom+2});
    }
  }
  const position=chooseDiagramPanelPosition({viewport:{width:window.innerWidth,height:window.innerHeight},
    panel:{width:card.offsetWidth,height:card.offsetHeight},anchor,plot,segments,levels});
  card.style.left=position.left+'px';card.style.top=position.top+'px';
}
