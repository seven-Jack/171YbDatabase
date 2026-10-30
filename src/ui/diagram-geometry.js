// Both kinds of hover cards use the same viewport-space diagram geometry.
export function readDiagramGeometry(svg) {
  if (!svg) return {plot:null,segments:[],levels:[]};
  const plot=svg.getBoundingClientRect();
  const segments=[...svg.querySelectorAll('.transition-line .hit-zone')].flatMap(line=>{
    const m=line.getScreenCTM();
    // A detached or non-rendered SVG may not have a screen transform yet.
    if (!m) return [];
    const x1=line.x1.baseVal.value,y1=line.y1.baseVal.value,x2=line.x2.baseVal.value,y2=line.y2.baseVal.value;
    const segment={x1:m.a*x1+m.c*y1+m.e,y1:m.b*x1+m.d*y1+m.f,x2:m.a*x2+m.c*y2+m.e,y2:m.b*x2+m.d*y2+m.f};
    return Object.values(segment).every(Number.isFinite)?[segment]:[];
  });
  const levels=[...svg.querySelectorAll('.core-level-group > line:first-child')].map(line=>{
    const box=line.getBoundingClientRect();
    return {left:box.left,right:box.right,top:box.top-4,bottom:box.bottom+4};
  });
  // Term/configuration labels often extend beyond the level bar itself.
  for (const label of svg.querySelectorAll('.core-level-group text')) {
    const box=label.getBoundingClientRect();
    if (![box.left,box.right,box.top,box.bottom].every(Number.isFinite)||box.right<=box.left||box.bottom<=box.top) continue;
    levels.push({left:box.left-2,right:box.right+2,top:box.top-2,bottom:box.bottom+2});
  }
  return {plot,segments,levels};
}
