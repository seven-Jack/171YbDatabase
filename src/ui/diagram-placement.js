const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));
const area=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
const expand=(box,gap)=>({left:box.left-gap,right:box.right+gap,top:box.top-gap,bottom:box.bottom+gap});

// Liang–Barsky clipping measures the actual part of a transition under a card.
// A diagonal's bounding box would greatly overstate its occupied space.
function coveredLength(segment,box) {
  const dx=segment.x2-segment.x1,dy=segment.y2-segment.y1;
  let start=0,end=1;
  const p=[-dx,dx,-dy,dy];
  const q=[segment.x1-box.left,box.right-segment.x1,segment.y1-box.top,box.bottom-segment.y1];
  for(let i=0;i<4;i++) {
    if(p[i]===0) { if(q[i]<0)return 0; continue; }
    const ratio=q[i]/p[i];
    if(p[i]<0)start=Math.max(start,ratio);else end=Math.min(end,ratio);
    if(start>end)return 0;
  }
  return Math.hypot(dx,dy)*Math.max(0,end-start);
}

const earlierScore=(a,b)=>{
  for(let i=0;i<a.length;i++) {
    if(Math.abs(a[i]-b[i])>1e-7)return a[i]<b[i];
  }
  return false;
};

/** Return viewport coordinates; the caller constrains card dimensions with CSS. */
export function chooseDiagramPanelPosition({viewport,panel,anchor,plot,segments=[],levels=[]}) {
  const inset=12,gap=12,width=panel.width,height=panel.height;
  const minLeft=Math.min(inset,Math.max(0,(viewport.width-width)/2));
  const maxLeft=Math.max(minLeft,viewport.width-width-inset);
  // Keep the sticky navigation visible when the card fits below it.
  const navBottom=72;
  const minTop=height+navBottom+inset<=viewport.height?navBottom:Math.min(inset,Math.max(0,(viewport.height-height)/2));
  const maxTop=Math.max(minTop,viewport.height-height-inset);
  const cx=(anchor.left+anchor.right)/2,cy=(anchor.top+anchor.bottom)/2;
  const xs=new Set([minLeft,maxLeft]);
  const ys=new Set([minTop,maxTop]);
  const addX=x=>xs.add(clamp(x,minLeft,maxLeft));
  const addY=y=>ys.add(clamp(y,minTop,maxTop));
  for(let x=minLeft;x<maxLeft;x+=40)addX(x);
  for(let y=minTop;y<maxTop;y+=40)addY(y);
  [anchor.left-width-gap,anchor.right+gap,cx-width/2,plot.left-width-gap,plot.right+gap].forEach(addX);
  [anchor.top-height-gap,anchor.bottom+gap,cy-height/2,plot.top-height-gap,plot.bottom+gap].forEach(addY);
  // Align a card edge with level bars so that a narrow clear lane is not missed.
  for(const level of levels) {
    addX(level.left-width-gap);addX(level.right+gap);
    addY(level.top-height-gap);addY(level.bottom+gap);
  }
  const candidates=[];
  for(const left of xs)for(const top of ys) {
    const box={left,top,right:left+width,bottom:top+height};
    candidates.push({box,anchorArea:area(box,expand(anchor,6)),outside:area(box,expand(plot,4))===0});
  }
  const hasOutside=candidates.some(candidate=>candidate.outside&&candidate.anchorArea===0);
  const validSegments=segments.filter(segment=>[segment.x1,segment.y1,segment.x2,segment.y2].every(Number.isFinite));
  let best,bestScore;
  for(const {box,anchorArea,outside} of candidates) {
    const safetyBox=expand(box,8);
    const transitionInk=validSegments.reduce((sum,line)=>sum+coveredLength(line,safetyBox),0);
    const levelInk=levels.reduce((sum,level)=>sum+area(safetyBox,level),0)/12;
    const distance=Math.hypot(cx-(box.left+width/2),cy-(box.top+height/2));
    const score=[anchorArea,hasOutside&&!outside?1:0,transitionInk*8+levelInk,distance,box.top,box.left];
    if(!bestScore||earlierScore(score,bestScore)) {best=box;bestScore=score;}
  }
  return {left:best.left,top:best.top};
}
