import {buildCalculationRecord} from './calculation-record.js';
import {canExportCurrentResult} from './result-export.js';

const activeControls=new WeakMap();

/** Optional figure exports read the latest state and plotted geometry only on activation. */
export function initResultExportControls({calculator,charts,versions={},document:doc=globalThis.document,
  status=doc?.getElementById('configStatus')}={}) {
  const workspace=doc?.getElementById('secRabi');
  if(!workspace||!calculator?.getState||!charts?.getExportSnapshot)return Object.freeze({destroy(){}});
  if(activeControls.has(workspace))return activeControls.get(workspace);
  const view=doc.defaultView,controls=[],cleanups=[];
  const bind=(node,event,listener)=>{node.addEventListener(event,listener);cleanups.push(()=>node.removeEventListener(event,listener));};
  const write=message=>{if(status)status.textContent=message;};
  for(const kind of ['curve','heat']){
    const prefix=kind==='curve'?'curve':'heat',canvas=doc.getElementById(kind==='curve'?'rpCurveCanvas':'rpHeatCanvas');
    const heading=canvas?.closest('.rabi-chart-card')?.querySelector('.rabi-chart-heading');
    if(!heading)continue;
    const control=doc.createElement('details');control.className='chart-result-export';control.id=prefix+'ChartExport';
    const summary=doc.createElement('summary');summary.textContent='导出图表';
    const panel=doc.createElement('div');panel.className='chart-result-export-panel';
    const hint=doc.createElement('p');hint.id=prefix+'ChartExportHint';hint.textContent=kind==='heat'?'按当前视图导出；SVG 坐标可编辑，热网格嵌入位图。模型值不是实验测量。':'按当前显示范围、单位与通道导出；模型值不是实验测量。';
    const buttons=['png','svg','csv'].map(format=>{
      const button=doc.createElement('button');button.type='button';button.id=prefix+'Export'+format.toUpperCase();button.dataset.chartFormat=format;button.setAttribute('aria-describedby',hint.id);
      button.textContent={png:'PNG · 2× 清晰图像',svg:kind==='curve'?'SVG · 矢量坐标与曲线':'SVG · 矢量坐标与热图',csv:kind==='curve'?'CSV · 可见曲线采样':'CSV · 完整网格数值'}[format];return button;
    });
    panel.append(...buttons,hint);control.append(summary,panel);heading.append(control);controls.push({control,summary,buttons,kind});
    bind(control,'keydown',event=>{if(event.key==='Escape'){event.preventDefault();control.open=false;summary.focus({preventScroll:true});}});
    bind(control,'click',async event=>{
      const button=event.target.closest?.('button[data-chart-format]');if(!button||!control.contains(button))return;
      try{
        const state=calculator.getState();
        if(!canExportCurrentResult(state))throw Error('请先修正输入或选择适用的有效通道。');
        const record=buildCalculationRecord(state,versions),snapshot=charts.getExportSnapshot(kind),format=button.dataset.chartFormat;
        // Freeze the click's context before loading the optional renderer.
        const {renderChartSVG,serializeChartCSV,chartSVGToPNG}=await import('./chart-export.js');
        const content=format==='csv'?serializeChartCSV(snapshot,record):renderChartSVG(snapshot,record);
        const blob=format==='png'?await chartSVGToPNG(content,{document:doc,scale:2}):new view.Blob([content],{type:format==='svg'?'image/svg+xml;charset=utf-8':'text/csv;charset=utf-8'});
        const url=view.URL.createObjectURL(blob);
        try{const anchor=doc.createElement('a');anchor.href=url;anchor.download=`171yb-${record.transition.id}-${kind}.${format}`;anchor.click();}
        finally{view.setTimeout(()=>view.URL.revokeObjectURL(url),1000);}
        const focusInside=control.contains(doc.activeElement);control.open=false;if(focusInside)summary.focus({preventScroll:true});
        write(`已导出 ${record.transition.id} ${kind==='curve'?'功率曲线':'参数热图'}（${format.toUpperCase()}）：当前视图、实际通道与来源版本；非独立实验验证。`);
      }catch(error){write(`图表导出失败：${error.message}`);}
    });
  }
  bind(doc,'pointerdown',event=>{for(const {control}of controls)if(!control.contains(event.target))control.open=false;});
  const render=state=>{const ready=canExportCurrentResult(state);for(const {control,buttons}of controls){control.dataset.status=ready?'valid':'invalid';for(const button of buttons)button.disabled=!ready;}};
  render(calculator.getState());const unsubscribe=calculator.onChange(render);
  const api=Object.freeze({destroy(){unsubscribe?.();cleanups.forEach(cleanup=>cleanup());for(const {control}of controls)control.remove();activeControls.delete(workspace);}});
  activeControls.set(workspace,api);return api;
}
