import * as catalog from './data/catalog.js';
import { SOFTWARE_VERSION, APP_COMMIT, WORKTREE_DIRTY } from './version.js';
import { FORMULA_VERSION } from './physics/constants.js';
import { generateRydbergStates, buildRydbergTransitions } from './physics/estimates.js';
import { exportCalculationConfig, parseCalculationConfig } from './state/config.js';
import { decorateTransition } from './ui/spectral-color.js';
import { createTooltips } from './ui/tooltips.js';
import { initEnergyDiagram } from './ui/energy-diagram.js';
import { initHyperfineCalculator } from './ui/hyperfine-diagram.js';
import { initRabiCharts } from './ui/rabi-chart.js';
import { initDataTables } from './ui/data-table.js';
import { initSourcePanel } from './ui/source-panel.js';
import { initPageControls } from './ui/page-controls.js';

function start() {
  const CORE_TRANSITIONS=catalog.CORE_TRANSITIONS.map(decorateTransition);
  const RYDBERG_QC_TRANSITIONS=catalog.RYDBERG_QC_TRANSITIONS.map(decorateTransition);
  const data={...catalog, CORE_TRANSITIONS, RYDBERG_QC_TRANSITIONS,
    RYDBERG_STATES:generateRydbergStates(catalog.ESTIMATE_CONFIG),
    RYDBERG_TRANSITIONS:buildRydbergTransitions(RYDBERG_QC_TRANSITIONS)};
  const tooltips=createTooltips();
  initEnergyDiagram(data,tooltips);
  const calculator=initHyperfineCalculator(data,tooltips);
  const charts=initRabiCharts(calculator);
  initDataTables(data,tooltips);
  initSourcePanel(calculator,CORE_TRANSITIONS);
  initPageControls(catalog.HYPERFINE_DATA);
  const picker=document.getElementById('transitionPicker');
  const legend=document.getElementById('spectrumLegend');
  for(const t of CORE_TRANSITIONS){
    const button=document.createElement('button');
    button.type='button';button.dataset.selectTransition=t.id;
    button.textContent=`${t.id} · ${t.wavelength_vac_nm.toFixed(t.approximate?2:1)} nm${t.spectrum.region==='visible'?'':' '+t.spectrum.region}`;
    button.setAttribute('aria-label',`${t.id} ${t.lower} → ${t.upper}，${t.wavelength_vac_nm} nm，${t.spectrum.label}`);
    button.style.setProperty('--transition-color',t.color);
    const choose=()=>calculator.loadTransition(t);
    button.addEventListener('click',choose);
    button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose();}});
    picker.append(button);
    const swatch=document.createElement('span');
    const line=document.createElement('i');line.style.borderColor=t.color;
    if(t.spectrum.dash)line.style.borderTopStyle='dashed';
    swatch.append(line,document.createTextNode(`${Math.round(t.wavelength_vac_nm)} nm${t.spectrum.region==='visible'?'':' '+t.spectrum.region}`));
    legend.append(swatch);
  }
  document.getElementById('levelDiagram').addEventListener('click',event=>{
    const element=event.target.closest('.transition-line[data-id]');
    const transition=element&&CORE_TRANSITIONS.find(t=>t.id===element.dataset.id);
    if(transition){calculator.loadTransition(transition);document.querySelector('.flow-step[data-gstep="1"]')?.classList.add('done');}
  });
  document.getElementById('hfsClose').addEventListener('click',()=>{
    document.getElementById('hfsPanel').classList.remove('active');
    document.querySelectorAll('.core-level-group').forEach(g=>g.classList.remove('selected'));
    picker.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
  });
  const versions={softwareVersion:SOFTWARE_VERSION,appCommit:APP_COMMIT,
    datasetVersion:catalog.DATASET_VERSION,datasetHash:catalog.DATASET_MANIFEST.contentHash,formulaVersion:FORMULA_VERSION};
  const configStatus=document.getElementById('configStatus');
  document.getElementById('configExport').addEventListener('click',()=>{
    try{
      const state=calculator.getState();
      if(state.inputStatus!=='valid')throw Error('请先修正输入并得到有效结果，再导出计算配置。');
      const config=exportCalculationConfig(state,versions);
      const blob=new Blob([JSON.stringify(config,null,2)+'\n'],{type:'application/json'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=`171yb-${state.transition.id}-config.json`;a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      configStatus.textContent='已导出计算配置：包含 SI 参数、通道、数据及公式版本。';
    }catch(error){configStatus.textContent=error.message;}
  });
  const configFile=document.getElementById('configFile');
  document.getElementById('configImport').addEventListener('click',()=>configFile.click());
  configFile.addEventListener('change',async()=>{
    try{
      const file=configFile.files?.[0];if(!file)return;
      if(file.size>64*1024)throw Error('配置文件过大，限 64 KiB。');
      const restored=parseCalculationConfig(await file.text(),versions);
      calculator.restore(restored.state);
      charts.applyConfiguration(restored.state,{solveFor:restored.state.solveFor,units:restored.state.calculatorUnits});
      configStatus.textContent='已恢复计算配置，并使用当前数据重新计算。'+restored.warnings.join('；');
    }catch(error){configStatus.textContent='导入失败：'+error.message;}
    finally{configFile.value='';}
  });
  calculator.onChange(state=>{
    picker.querySelectorAll('[data-select-transition]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.selectTransition===state.transition?.id)));
    document.querySelectorAll('#levelDiagram .transition-line').forEach(g=>g.classList.toggle('selected-trans',g.dataset.id===state.transition?.id));
    document.getElementById('powerConvention').textContent=document.getElementById('powerAxisConvention').value==='sigma-double'&&state.pol!=='pi'?'σ± 图横轴显示 2P；计算输入仍为偏振分量功率 P。这是换算视图，不是实验标定。':'P 为所选偏振分量功率；图横轴与计算输入一致；w₀ 为 1/e² 强度半径，计算位置为光束中心。';
    const result=document.getElementById('rabiResult');
    result.replaceChildren();
    const title=document.createElement('span');title.textContent='Ω/2π · '+(state.transition?state.transition.id+' '+state.transition.lower+' → '+state.transition.upper:'普通频率');
    const value=document.createElement('strong');
    value.textContent=state.inputStatus==='valid'&&Number.isFinite(state.fR_MHz)?formatFrequency(state.fR_MHz*1e6):'—';
    const context=document.createElement('small');
    context.textContent=state.inputStatus==='valid'
      ?`P=${Number(state.P_mW.toPrecision(6))} mW · w₀=${Number(state.w_um.toPrecision(6))} µm · d_eff=${Number(state.dEff.toPrecision(6))} ea₀ · ${state.selectedChannel?'所选通道':'当前偏振及 F 对的最强允许通道'}`
      :state.inputError||'请先选择适用跃迁与输入';
    result.append(title,value,context);
  });
  document.getElementById('versionInfo').textContent=`软件 ${SOFTWARE_VERSION} · 数据 ${catalog.DATASET_VERSION} · 公式 ${FORMULA_VERSION} · ${APP_COMMIT?APP_COMMIT.slice(0,8):'本地开发版'}${WORKTREE_DIRTY?' · 含本地未提交改动':''}`;
  document.documentElement.dataset.appReady='true';
}
function formatFrequency(hz){
  const [scale,unit]=Math.abs(hz)>=1e9?[1e9,'GHz']:Math.abs(hz)>=1e6?[1e6,'MHz']:Math.abs(hz)>=1e3?[1e3,'kHz']:[1,'Hz'];
  return `${Number((hz/scale).toPrecision(6))} ${unit}`;
}
try{start();}catch(error){
  console.error(error);
  const banner=document.getElementById('appError');
  banner.hidden=false;banner.textContent='页面初始化失败：'+error.message;
  document.documentElement.dataset.appReady='error';
}
