import {serializeCSV,formatCalculationSummary} from './result-export.js';
import {convert} from '../physics/units.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
const num=value=>Number.isFinite(value)?String(Number(value.toPrecision(7))):'—';
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1e-30,Math.abs(a),Math.abs(b));
const tuple=ch=>[ch.F,ch.m,ch.Fp,ch.mp,ch.q].join('|');

export function validateChartSnapshot(snapshot,record) {
  const c=record?.configuration,ch=record?.resolvedChannel,context=snapshot?.context,g=snapshot?.geometry;
  if(c?.result?.status!=='ok'||!ch||!context||!['curve','heat'].includes(snapshot.kind))throw Error('需要当前有效的图表与研究记录。');
  if(context.transitionId!==c.transitionId||!close(context.P_mW,c.parameters.power_W*1000)||!close(context.w_um,c.parameters.waist_m*1e6)
    ||!close(context.dEff_ea0,ch.dEff_ea0)||context.F!==ch.F||context.Fp!==ch.Fp||({pi:0,sigmap:1,sigmam:-1})[context.pol]!==ch.q
    ||context.selectedChannel&&tuple(context.selectedChannel)!==tuple(ch))throw Error('图表与当前通道或工作点不一致，请重新生成后导出。');
  if(!g||![snapshot.width,snapshot.height,g.left,g.top,g.plotW,g.plotH,g.Pmin,g.Pmax,g.pf,g.rf].every(Number.isFinite)
    ||!(snapshot.width>0&&snapshot.height>0&&g.plotW>0&&g.plotH>0&&g.Pmax>g.Pmin&&g.pf>0&&g.rf>0))throw Error('图表显示范围无效。');
  if(snapshot.kind==='curve'&&(!Array.isArray(g.curves)||!Number.isFinite(g.yMax)||!(g.yMax>0)))throw Error('曲线视图无效。');
  const powerFactor=snapshot.powerConvention==='2Pq'?2:snapshot.powerConvention==='Pq'?1:null;
  if(!powerFactor||powerFactor===2&&ch.q===0||!close(g.pf,convert(1,'power','mW',g.pUnit)*powerFactor)
    ||!close(g.rf,convert(1,'frequency','MHz',g.rUnit)))throw Error('图轴单位或功率口径不一致。');
  if(snapshot.kind==='curve'&&g.curves.some(curve=>!Array.isArray(curve.points)||!Array.isArray(curve.samples)
    ||curve.points.some(point=>![point.x,point.y].every(Number.isFinite))
    ||curve.samples.some(sample=>![sample.power_mW,sample.waist_um,sample.rabi_Hz,sample.power_display,sample.rabi_display].every(Number.isFinite))))throw Error('曲线采样数据无效。');
  if(snapshot.kind==='heat'){
    const grid=snapshot.grid;
    if(!grid||!Number.isInteger(grid.nx)||!Number.isInteger(grid.ny)||grid.nx<2||grid.ny<2||grid.values_MHz?.length!==grid.ny
      ||grid.values_MHz.some(row=>row.length!==grid.nx||row.some(value=>!Number.isFinite(value)))
      ||![grid.colorLo_MHz,grid.colorHi_MHz,g.Wmin,g.Wmax,g.wf].every(Number.isFinite)||!(grid.colorHi_MHz>grid.colorLo_MHz&&g.Wmax>g.Wmin&&g.wf>0)
      ||!close(g.wf,convert(1,'length','µm',g.wUnit)))throw Error('热图网格或色标无效。');
  }
  return snapshot;
}

function pointPosition(snapshot,point) {
  const g=snapshot.geometry,P=point.power_mW*g.pf;
  const x=g.left+(g.scale==='log'?(Math.log10(P)-Math.log10(g.Pmin))/(Math.log10(g.Pmax)-Math.log10(g.Pmin)):(P-g.Pmin)/(g.Pmax-g.Pmin))*g.plotW;
  const value=snapshot.kind==='curve'?point.rabi_Hz/1e6*g.rf:point.waist_um*g.wf;
  const min=snapshot.kind==='curve'?0:g.Wmin,max=snapshot.kind==='curve'?g.yMax:g.Wmax;
  const y=g.top+g.plotH-(value-min)/(max-min)*g.plotH;
  return{x,y,visible:Number.isFinite(x)&&Number.isFinite(y)&&x>=g.left&&x<=g.left+g.plotW&&y>=g.top&&y<=g.top+g.plotH};
}
function wrap(line,emWidth) {
  const rows=[];let text='',width=0;
  for(const char of Array.from(String(line))){
    const unit=/[\u0300-\u036f]/u.test(char)?0:char.codePointAt(0)>0x2ff?1:char===' '?.35:.62;
    if(text&&width+unit>emWidth){rows.push(text);text='';width=0;}
    text+=char;width+=unit;
  }
  if(text||!rows.length)rows.push(text);return rows;
}
function textLines(lines,x,y,{size=12,color='#b9cee8',width=500,lineHeight=18}={}) {
  const all=lines.flatMap(line=>wrap(line,Math.max(10,width/size)));
  return {svg:all.map((line,index)=>`<text x="${x}" y="${y+index*lineHeight}" fill="${escape(color)}" font-size="${size}">${escape(line)}</text>`).join(''),height:all.length*lineHeight};
}
function tickLabel(value){return num(value);}

/** Curves, axes and text are vector; only the sampled heat field/colour strip are embedded rasters. */
export function renderChartSVG(snapshot,record) {
  validateChartSnapshot(snapshot,record);
  const g=snapshot.geometry,width=Math.max(320,Math.ceil(snapshot.width)),offset=(width-snapshot.width)/2;
  const c=record.configuration,ch=record.resolvedChannel;
  const title=snapshot.kind==='curve'?'功率与耦合强度':'功率 × 束腰参数图';
  const summary=formatCalculationSummary(record).trim().split('\n');
  const visible=g.curves?.filter(curve=>curve.visible)||[];
  const header=[`${title} · ${record.transition.id} · ${record.transition.lower} → ${record.transition.upper}`,summary[1],summary[2],summary[3],summary[4],
    `图轴功率：${snapshot.powerConvention}；${g.scale==='log'?'对数':'线性'}横轴；Pq 为原子处所选偏振分量`,
    snapshot.kind==='curve'?`可见束腰 w₀（1/e²强度半径）${visible.length?'':'：无'}`
      :`色标 = Ω/2π (${g.rUnit})；2%–98% 分位 ${num(snapshot.grid.colorLo_MHz*g.rf)}–${num(snapshot.grid.colorHi_MHz*g.rf)}；≤/≥ 颜色饱和，网格数值不变`,
    ...(snapshot.pinned?[snapshot.pinned.text]:[])];
  const headerText=textLines(header,16,24,{width:width-32,size:12,lineHeight:18,color:snapshot.theme?.text||'#b9cee8'});
  const legendColumns=Math.max(1,Math.floor((width-32)/150));
  const legendHeight=snapshot.kind==='curve'?Math.ceil(visible.length/legendColumns)*22:0;
  const legend=snapshot.kind==='curve'?visible.map((curve,index)=>{
    const x=16+index%legendColumns*150,y=headerText.height+30+Math.floor(index/legendColumns)*22;
    return `<g class="export-legend-item"><line x1="${x}" y1="${y-4}" x2="${x+24}" y2="${y-4}" stroke="${escape(curve.color)}" stroke-width="${curve.waist_um===snapshot.context.w_um?3:1.8}"/><text x="${x+31}" y="${y}" fill="${escape(snapshot.theme?.text||'#b9cee8')}" font-size="12">${escape(num(curve.waist_um))} µm</text></g>`;
  }).join(''):'';
  const chartY=headerText.height+legendHeight+28;
  const footer=[`波长：${record.transition.wavelength.value} ${record.transition.wavelength.unit} · ${record.transition.wavelength.evidenceKind} · 来源 ${record.transition.wavelength.sourceId}`,
    `采用 d：${record.primaryQuantity.sourceId} · ${record.primaryQuantity.convention}${record.primaryQuantity.source?.doi?' · DOI '+record.primaryQuantity.source.doi:''}`,
    `软件 ${record.build.softwareVersion} · 代码 ${(record.build.appCommit||'未知').slice(0,12)}${record.build.worktreeDirty===true?'（含本地修改）':record.build.worktreeDirty===false?'':'（工作区状态未知）'} · 数据 ${c.datasetVersion} · 公式 ${c.formulaVersion} · 证据 ${record.evidence.evidenceVersion}`,
    '固定模型换算，非独立实验验证；完整 Rabi 不确定度未建立。',
    ...(snapshot.kind==='heat'?['SVG 中坐标、文字与标记为矢量；热图场和色带分别嵌入原始采样位图。']:[])];
  const footerText=textLines(footer,16,chartY+snapshot.height+18,{width:width-32,size:11,lineHeight:17,color:snapshot.theme?.text||'#b9cee8'});
  const height=Math.ceil(chartY+snapshot.height+footerText.height+26),theme=snapshot.theme||{};
  const parts=[];const line=(x1,y1,x2,y2,color=theme.grid||'#23364f')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${escape(color)}"/>`;
  if(snapshot.kind==='curve'){
    for(const tick of snapshot.ticks.y){parts.push(line(g.left,tick.position,g.left+g.plotW,tick.position));parts.push(`<text x="${g.left-8}" y="${tick.position+4}" text-anchor="end">${escape(tick.label)}</text>`);}
    for(const tick of snapshot.ticks.x){parts.push(line(tick.position,g.top,tick.position,g.top+g.plotH));parts.push(`<text x="${tick.position}" y="${g.top+g.plotH+20}" text-anchor="middle">${escape(tick.label)}</text>`);}
    parts.push(`<g clip-path="url(#plot-clip)">${visible.map(curve=>`<polyline fill="none" stroke="${escape(curve.color)}" stroke-width="${curve.waist_um===snapshot.context.w_um?3:1.8}" stroke-linejoin="round" points="${curve.points.map(point=>`${point.x},${point.y}`).join(' ')}"/>`).join('')}</g>`);
  }else{
    const png=/^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
    if(!png.test(snapshot.raster?.grid||'')||!png.test(snapshot.raster?.colorbar||''))throw Error('热图采样位图无效。');
    parts.push(`<image x="${g.left}" y="${g.top}" width="${g.plotW}" height="${g.plotH}" href="${snapshot.raster.grid}" preserveAspectRatio="none"/>`);
    const nx=Math.max(1,Math.min(5,Math.floor(g.plotW/60))),ny=Math.max(2,Math.min(4,Math.floor(g.plotH/48)));
    for(let i=0;i<nx;i++){const x=g.left+g.plotW*i/nx;parts.push(line(x,g.top,x,g.top+g.plotH));parts.push(`<text x="${x}" y="${g.top+g.plotH+20}" text-anchor="middle">${escape(tickLabel(g.Pmin+(g.Pmax-g.Pmin)*i/nx))}</text>`);}
    for(let i=0;i<ny;i++){const y=g.top+g.plotH-g.plotH*i/ny;parts.push(line(g.left,y,g.left+g.plotW,y));parts.push(`<text x="${g.left-8}" y="${y+4}" text-anchor="end">${escape(tickLabel(g.Wmin+(g.Wmax-g.Wmin)*i/ny))}</text>`);}
    const cbX=g.left+g.plotW+16;parts.push(`<image x="${cbX}" y="${g.top}" width="8" height="${g.plotH}" href="${snapshot.raster.colorbar}" preserveAspectRatio="none"/>`);
    for(const fraction of [0,.25,.5,.75,1]){const value=(snapshot.grid.colorLo_MHz+fraction*(snapshot.grid.colorHi_MHz-snapshot.grid.colorLo_MHz))*g.rf,y=g.top+g.plotH*(1-fraction);parts.push(`<text x="${cbX+14}" y="${y+4}" font-size="10">${fraction===0?'≤ ':fraction===1?'≥ ':''}${escape(num(value))} ${escape(g.rUnit)}</text>`);}
    parts.push(`<text x="${cbX+4}" y="${g.top-5}" text-anchor="middle" font-size="10">Ω/2π</text>`);
  }
  for(const [point,pinned]of [[snapshot.workPoint,false],[snapshot.pinned,true]])if(point&&(pinned||point.power_mW>0)){const p=pointPosition(snapshot,point);if(p.visible){parts.push(`<g clip-path="url(#plot-clip)">${pinned?`<line x1="${p.x}" x2="${p.x}" y1="${p.y}" y2="${g.top+g.plotH}" stroke="#e4c58c" stroke-dasharray="3 4"/>`:''}<circle cx="${p.x}" cy="${p.y}" r="${pinned?5:6}" stroke="${pinned?'#e4c58c':escape(theme.calloutBorder||'#91b9f2')}" stroke-width="2" fill="#0e1a2b"/></g>`);}}
  parts.push(`<rect x="${g.left}" y="${g.top}" width="${g.plotW}" height="${g.plotH}" fill="none" stroke="${escape(theme.axis||'#4e6684')}"/>`);
  parts.push(`<text x="${g.left+g.plotW}" y="${g.top+g.plotH+20}" text-anchor="end">${escape(num(g.Pmax))}</text>`);
  parts.push(`<text x="${g.left-8}" y="${g.top+4}" text-anchor="end">${escape(num(snapshot.kind==='curve'?g.yMax:g.Wmax))}</text>`);
  parts.push(`<text x="${g.left+g.plotW/2}" y="${snapshot.height-12}" text-anchor="middle">${escape(snapshot.xTitle)}</text>`);
  parts.push(`<text transform="translate(15 ${g.top+g.plotH/2}) rotate(-90)" text-anchor="middle">${escape(snapshot.yTitle)}</text>`);
  const metadata={kind:'171yb-chart-export',schemaVersion:1,record,view:{kind:snapshot.kind,geometry:{...g,curves:undefined},powerConvention:snapshot.powerConvention,
    visibleWaists_um:visible.map(curve=>curve.waist_um),visibleSeries:visible.map(curve=>({waist_um:curve.waist_um,color:curve.color})),colorQuantiles:snapshot.kind==='heat'?[.02,.98]:null,colorLimits_MHz:snapshot.kind==='heat'?[snapshot.grid.colorLo_MHz,snapshot.grid.colorHi_MHz]:null,pinned:snapshot.pinned??null}};
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">${escape(title+' · '+record.transition.id)}</title><desc id="chart-desc">${escape(snapshot.kind==='heat'?'坐标和文字为矢量，采样热图为嵌入位图；颜色饱和不修改模型数值。':'曲线、坐标和文字为矢量。')} 固定模型换算，非独立实验验证。</desc><metadata>${escape(JSON.stringify(metadata))}</metadata><rect width="100%" height="100%" fill="${escape(theme.background||'#0b1421')}"/><g font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">${headerText.svg}${legend}<g transform="translate(${offset} ${chartY})" fill="${escape(theme.text||'#b9cee8')}" font-size="12"><defs><clipPath id="plot-clip"><rect x="${g.left}" y="${g.top}" width="${g.plotW}" height="${g.plotH}"/></clipPath></defs>${parts.join('')}</g>${footerText.svg}</g></svg>\n`;
}

export function serializeChartCSV(snapshot,record) {
  validateChartSnapshot(snapshot,record);
  const g=snapshot.geometry,ch=record.resolvedChannel,context=JSON.stringify(record),rows=[];
  function row(P,w,Hz,pDisplay,valueDisplay,curve=null){return{sample_kind:snapshot.kind,transition_id:record.transition.id,channel:tuple(ch),series_waist_um:curve,
    atom_component_power_W:P*1e-3,intensity_radius_m:w*1e-6,frequency_Hz:Hz,power_axis_value:pDisplay,power_axis_unit:g.pUnit,power_axis_convention:snapshot.powerConvention,
    value_axis_value:valueDisplay,value_axis_unit:snapshot.kind==='curve'?g.rUnit:g.wUnit,
    color_low_Hz:snapshot.kind==='heat'?snapshot.grid.colorLo_MHz*1e6:null,color_high_Hz:snapshot.kind==='heat'?snapshot.grid.colorHi_MHz*1e6:null,
    color_saturated:snapshot.kind==='heat'?(Hz<=snapshot.grid.colorLo_MHz*1e6||Hz>=snapshot.grid.colorHi_MHz*1e6):false,
    dipole_source_id:record.primaryQuantity.sourceId,formula_version:record.configuration.formulaVersion,dataset_version:record.configuration.datasetVersion,context_json:rows.length?'':context};}
  if(snapshot.kind==='curve')for(const curve of g.curves.filter(item=>item.visible))for(const sample of curve.samples)rows.push(row(sample.power_mW,sample.waist_um,sample.rabi_Hz,sample.power_display,sample.rabi_display,curve.waist_um));
  else for(let iy=0;iy<snapshot.grid.ny;iy++)for(let ix=0;ix<snapshot.grid.nx;ix++){
    const P=g.Pmin+(g.Pmax-g.Pmin)*ix/(snapshot.grid.nx-1),w=g.Wmin+(g.Wmax-g.Wmin)*iy/(snapshot.grid.ny-1);
    rows.push(row(P/g.pf,w/g.wf,snapshot.grid.values_MHz[iy][ix]*1e6,P,w));
  }
  if(!rows.length)throw Error('当前没有可导出的可见采样数据。');
  return serializeCSV(Object.keys(rows[0]),rows);
}

export async function chartSVGToPNG(svg,{document:doc=globalThis.document,scale=2}={}) {
  if(!doc||!Number.isFinite(scale)||scale<=0||scale>4)throw Error('PNG 渲染参数无效。');
  const view=doc.defaultView,blob=new view.Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=view.URL.createObjectURL(blob);
  try{
    const image=new view.Image();
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('SVG 图表无法转换为 PNG。'));image.src=url;});
    const canvas=doc.createElement('canvas');canvas.width=Math.ceil(image.naturalWidth*scale);canvas.height=Math.ceil(image.naturalHeight*scale);
    const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.drawImage(image,0,0);
    return await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('PNG 编码失败。')),'image/png'));
  }finally{view.URL.revokeObjectURL(url);}
}
