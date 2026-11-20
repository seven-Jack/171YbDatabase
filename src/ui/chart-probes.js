import {rabiHz} from '../physics/rabi.js';
import {findNearestCurvePoint} from './chart-readout.js';

const number = value => Number(value.toPrecision(5)).toString();
const inPlot = (g,x,y) => x>=g.left && x<=g.left+g.plotW && y>=g.top && y<=g.top+g.plotH;
const keyFor = state => JSON.stringify([state.transition?.id,state.F_lower,state.F_upper,state.pol,
  state.dReduced,state.dEff,state.convention,state.selectedChannel &&
  [state.selectedChannel.F,state.selectedChannel.Fp,state.selectedChannel.m,state.selectedChannel.mp,state.selectedChannel.q],state.beamDefinition]);

/** Read-only plot interactions. Pins contain canonical model values, never calculator inputs. */
export function initChartProbes({calculator,getGeometry,buildTooltip,showCompactTooltip,scheduleTooltipHide,hideTooltip,
  focusWorkpoint,restoreView,isFocused,canFocusWorkpoint}) {
  const kinds=['curve','heat'], slots={};
  let contextKey;
  const focusButton=document.getElementById('rpFocusWorkpoint');
  const restoreButton=document.getElementById('rpRestoreView');
  const notice=document.getElementById('rpReadoutNotice');
  for(const kind of kinds){
    const prefix=kind==='curve'?'rpCurve':'rpHeat';
    const canvas=document.getElementById(prefix+'Canvas');
    const overlay=document.createElement('canvas');
    overlay.className='chart-probe-overlay';overlay.setAttribute('aria-hidden','true');
    canvas.after(overlay);
    slots[kind]={canvas,overlay,output:document.getElementById(prefix+'Readout'),
      clear:document.getElementById(prefix+'ReadoutClear'),hover:null,pinned:null};
  }
  function canRead(){const s=calculator.getState();return s.inputStatus==='valid' && s.dEff>0;}
  function powerAtX(g,x){
    const t=(x-g.left)/g.plotW;
    return (g.scale==='log' ? 10**(Math.log10(g.Pmin)+t*(Math.log10(g.Pmax)-Math.log10(g.Pmin))) : g.Pmin+t*(g.Pmax-g.Pmin))/g.pf;
  }
  function coordinates(g,point,kind){
    const power=point.power_mW*g.pf;
    const x=g.left+(g.scale==='log' ? (Math.log10(power)-Math.log10(g.Pmin))/(Math.log10(g.Pmax)-Math.log10(g.Pmin)) : (power-g.Pmin)/(g.Pmax-g.Pmin))*g.plotW;
    const value=kind==='curve' ? point.rabi_Hz/1e6*g.rf : point.waist_um*g.wf;
    const minimum=kind==='curve'?0:g.Wmin, maximum=kind==='curve'?g.yMax:g.Wmax;
    const y=g.top+g.plotH-(value-minimum)/(maximum-minimum)*g.plotH;
    return {x,y,visible:Number.isFinite(x)&&Number.isFinite(y)&&inPlot(g,x,y)};
  }
  function probe(kind,event){
    if(!canRead())return null;
    const g=getGeometry(kind);if(!g)return null;
    const rect=slots[kind].canvas.getBoundingClientRect();
    const x=event.clientX-rect.left,y=event.clientY-rect.top;
    if(!inPlot(g,x,y))return null;
    let power_mW,waist_um,curveIndex;
    if(kind==='curve'){
      const hit=findNearestCurvePoint({x,y,curves:g.curves,rect:{left:g.left,top:g.top,width:g.plotW,height:g.plotH}});
      if(!hit)return null;
      curveIndex=hit.curveIndex;waist_um=g.curves[curveIndex].waist_um;power_mW=powerAtX(g,hit.x);
    }else{
      power_mW=powerAtX(g,x);waist_um=(g.Wmin+(g.top+g.plotH-y)/g.plotH*(g.Wmax-g.Wmin))/g.wf;
    }
    const rabi_Hz=rabiHz(g.d_ea0,power_mW,waist_um);
    if(![power_mW,waist_um,rabi_Hz].every(Number.isFinite))return null;
    return {power_mW,waist_um,rabi_Hz,curveIndex};
  }
  function keyboardPoint(kind,key){
    const slot=slots[kind],g=getGeometry(kind);
    if(!canRead()||!g)return null;
    const current=slot.hover||slot.pinned;
    const position=current&&coordinates(g,current,kind);
    const x=position?.visible?position.x:g.left+g.plotW/2;
    const y=position?.visible?position.y:g.top+g.plotH/2;
    const dx=key==='ArrowLeft'?-1:key==='ArrowRight'?1:0;
    const dy=key==='ArrowUp'?-1:key==='ArrowDown'?1:0;
    const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
    if(kind==='heat'){
      const rect=slot.canvas.getBoundingClientRect();
      return probe(kind,{clientX:rect.left+clamp(x+dx*g.plotW/20,g.left,g.left+g.plotW),
        clientY:rect.top+clamp(y+dy*g.plotH/20,g.top,g.top+g.plotH)});
    }
    const visible=g.curves.filter(curve=>curve.visible&&curve.points.some(point=>inPlot(g,point.x,point.y)));
    if(!visible.length)return null;
    const currentSeries=Math.max(0,visible.findIndex(curve=>curve.id===current?.curveIndex));
    const series=visible[(currentSeries+dy+visible.length)%visible.length];
    const samples=series.samples.filter((sample,i)=>inPlot(g,series.points[i].x,series.points[i].y));
    const targetPower=powerAtX(g,x);
    const nearest=samples.reduce((best,sample,i)=>Math.abs(sample.power_mW-targetPower)<Math.abs(samples[best].power_mW-targetPower)?i:best,0);
    const sample=samples[clamp(nearest+dx,0,samples.length-1)];
    return {power_mW:sample.power_mW,waist_um:sample.waist_um,rabi_Hz:sample.rabi_Hz,curveIndex:series.id};
  }
  function formatted(kind,point){
    const g=getGeometry(kind);
    return {powerText:number(point.power_mW*g.pf)+' '+g.pUnit,
      waistText:number(point.waist_um*(kind==='heat'?g.wf:1))+' '+(kind==='heat'?g.wUnit:'µm'),
      rabiText:number(point.rabi_Hz/1e6*g.rf)+' '+g.rUnit};
  }
  function drawOverlay(kind){
    const slot=slots[kind],g=getGeometry(kind),rect=slot.canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
    const width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);
    if(slot.overlay.width!==width||slot.overlay.height!==height){slot.overlay.width=width;slot.overlay.height=height;}
    slot.overlay.style.width=rect.width+'px';slot.overlay.style.height=rect.height+'px';
    const ctx=slot.overlay.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
    if(!g)return;
    ctx.save();ctx.beginPath();ctx.rect(g.left,g.top,g.plotW,g.plotH);ctx.clip();
    for(const [point,pinned] of [[slot.pinned,true],[slot.hover,false]]){
      if(!point)continue;
      const pos=coordinates(g,point,kind);if(!pos.visible)continue;
      const paper=!!slot.canvas.closest('[data-chart-theme="paper"]');
      ctx.strokeStyle=paper?(pinned?'#743b00':'#124777'):(pinned?'#e4c58c':'#add2ff');ctx.fillStyle=paper?'#fff':'#0e1a2b';ctx.lineWidth=pinned?2:1.5;
      ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(pos.x,g.top+g.plotH);ctx.lineTo(pos.x,pos.y);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.arc(pos.x,pos.y,pinned?5:4,0,Math.PI*2);ctx.fill();ctx.stroke();
    }
    ctx.restore();
  }
  function render(kind){
    const slot=slots[kind],point=slot.pinned||slot.hover,g=getGeometry(kind),out=slot.output;
    out.dataset.mode=slot.pinned?'pinned':point?'hover':'empty';
    out.setAttribute('aria-live',slot.pinned||slot.keyboard?'polite':'off');
    for(const attr of ['powerMw','waistUm','rabiHz','curveIndex'])delete out.dataset[attr];
    slot.clear.disabled=!slot.pinned;
    if(point&&g){
      const texts=formatted(kind,point),position=coordinates(g,point,kind);
      out.dataset.powerMw=point.power_mW;out.dataset.waistUm=point.waist_um;out.dataset.rabiHz=point.rabi_Hz;
      if(kind==='curve')out.dataset.curveIndex=point.curveIndex;
      out.textContent=`${slot.pinned?'已固定':kind==='curve'?'曲线读数':'热图读数'} · P${g.pf/g.unitPowerFactor===2?'（2Pq）':''}=${texts.powerText} · Ω/2π=${texts.rabiText} · w₀=${texts.waistText}${position.visible?'':' · 当前范围外'}`;
    }else out.textContent=canRead()?'点击图中位置固定读数，也可用方向键取点、回车固定、Esc 清除。':'当前输入未形成有效计算。';
    drawOverlay(kind);
  }
  function clear(kind){slots[kind].pinned=null;slots[kind].hover=null;render(kind);hideTooltip?.();}
  for(const kind of kinds){
    const slot=slots[kind];
    slot.canvas.setAttribute('aria-description',kind==='curve'?'左右键沿曲线取点，上下键切换可见束腰。回车固定，Esc 清除。':'左右键改变读数功率，上下键改变读数束腰。回车固定，Esc 清除。');
    slot.canvas.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch')return;
      slot.keyboard=false;
      slot.hover=probe(kind,event);render(kind);
      if(slot.hover){
        showCompactTooltip?.(event,buildTooltip({state:calculator.getState(),kind,...formatted(kind,slot.hover)}),{target:slot.canvas,plot:slot.canvas});
      }else scheduleTooltipHide?.();
    });
    slot.canvas.addEventListener('pointerleave',()=>{if(!slot.keyboard)slot.hover=null;render(kind);scheduleTooltipHide?.();});
    slot.canvas.addEventListener('click',event=>{
      const point=probe(kind,event);if(!point)return;
      slot.pinned=point;slot.hover=null;render(kind);hideTooltip?.();
    });
    slot.canvas.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();clear(kind);}
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
        event.preventDefault();
        const point=keyboardPoint(kind,event.key);if(!point)return;
        slot.pinned=null;slot.hover=point;slot.keyboard=true;render(kind);hideTooltip?.();
      }
      if(event.key==='Enter'){
        const point=slot.hover||slot.pinned||keyboardPoint(kind,event.key);if(!point)return;
        event.preventDefault();slot.pinned={...point};slot.hover=null;render(kind);hideTooltip?.();
      }
    });
    slot.clear.addEventListener('click',()=>clear(kind));
  }
  focusButton.addEventListener('click',()=>{focusWorkpoint();sync();});
  restoreButton.addEventListener('click',()=>{restoreView();sync();});
  function sync(){
    const state=calculator.getState(),key=keyFor(state);
    const changed=contextKey!==key || !canRead();contextKey=key;
    for(const kind of kinds){
      const slot=slots[kind],g=getGeometry(kind);
      slot.hover=null;
      if(changed||!g)slot.pinned=null;
      if(kind==='curve'&&slot.pinned){
        const curve=g?.curves[slot.pinned.curveIndex];
        if(!curve||!curve.visible||curve.waist_um!==slot.pinned.waist_um)slot.pinned=null;
      }
      render(kind);
    }
    hideTooltip?.();
    focusButton.disabled=!canRead()||!(state.P_mW>0&&state.w_um>0&&state.fR_MHz>0)||(canFocusWorkpoint&&!canFocusWorkpoint());
    const locked=document.getElementById('chartRangeMode')?.value==='fixed';
    focusButton.title=locked?'先解除坐标锁定即可聚焦':focusButton.disabled?'需有效、非零且可显示的功率、束腰与耦合强度':'仅调整两图的显示范围';
    restoreButton.disabled=!isFocused();
    notice.textContent=locked?'两图已锁定坐标范围，可直接比较不同工作点。':focusButton.disabled?'工作点不可聚焦：请提供有效、非零且可显示的功率、束腰与耦合强度。':isFocused()?'已聚焦工作点 · 仅调整图表范围，可恢复原视图。':'靠近可见曲线自动吸附 · 点击固定读数 · 图表读数为模型换算。';
  }
  return Object.freeze({sync});
}
