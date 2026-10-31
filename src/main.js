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
import { initSourcePanel, createFieldView } from './ui/source-panel.js';
import { initPageControls } from './ui/page-controls.js';
import { initWorkflowNavigation } from './ui/workflow-navigation.js';
import { initDiagramNavigation } from './ui/transition-navigation.js';
import { initTransitionKnowledge } from './ui/transition-knowledge.js';
import { initSelectionContext } from './ui/selection-context.js';
import { createChannelNavigation } from './ui/channel-navigation.js';
import { preventNumberInputWheelChanges } from './ui/number-input-wheel.js';
import {buildEvidenceView} from './ui/evidence-model.js';

export function start() {
  const CORE_TRANSITIONS=catalog.CORE_TRANSITIONS.map(decorateTransition);
  const RYDBERG_QC_TRANSITIONS=catalog.RYDBERG_QC_TRANSITIONS.map(decorateTransition);
  const data={...catalog, CORE_TRANSITIONS, RYDBERG_QC_TRANSITIONS,
    RYDBERG_STATES:generateRydbergStates(catalog.ESTIMATE_CONFIG),
    RYDBERG_TRANSITIONS:buildRydbergTransitions(RYDBERG_QC_TRANSITIONS)};
  const tooltips=createTooltips();
  initEnergyDiagram({...data,CORE_TRANSITIONS:catalog.CORE_TRANSITIONS},tooltips);
  const calculator=initHyperfineCalculator(data,tooltips,{onChannelSelected:createChannelNavigation({
    destination:document.getElementById('secRabi'),hideTooltip:tooltips.hideTooltip
  })});
  const charts=initRabiCharts(calculator,tooltips);
  preventNumberInputWheelChanges(document.getElementById('secRabi'));
  initDataTables(data,tooltips);
  initSourcePanel(calculator,CORE_TRANSITIONS);
  initPageControls(catalog.HYPERFINE_DATA);
  initTransitionKnowledge({transitions:CORE_TRANSITIONS,calculator});
  initWorkflowNavigation(calculator);
  initSelectionContext({calculator});
  const closeLevelDetails=()=>{
    document.getElementById('hfsPanel').classList.remove('active');
    document.querySelectorAll('.core-level-group').forEach(g=>g.classList.remove('selected'));
  };
  const levelDiagram=document.getElementById('levelDiagram');
  levelDiagram.setAttribute('tabindex','-1');
  initDiagramNavigation({svg:levelDiagram,transitions:CORE_TRANSITIONS,calculator,
    destination:document.getElementById('secCalc'),hideTooltip:tooltips.hideTooltip,closeLevelDetails});
  document.getElementById('hfsClose').addEventListener('click',()=>{
    closeLevelDetails();
    const lines=[...levelDiagram.querySelectorAll('.transition-line[role="button"]')];
    const available=lines.filter(line=>line.getAttribute('aria-disabled')!=='true');
    (available.find(line=>line.getAttribute('aria-pressed')==='true')||available[0]||levelDiagram).focus({preventScroll:true});
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
      charts.applyConfiguration(restored.state,{solveFor:restored.state.solveFor,units:restored.state.calculatorUnits});
      configStatus.textContent='已恢复计算配置，并使用当前数据重新计算。'+restored.warnings.join('；');
    }catch(error){configStatus.textContent='导入失败：'+error.message;}
    finally{configFile.value='';}
  });
  calculator.onChange(state=>{
    document.querySelectorAll('#levelDiagram .transition-line').forEach(g=>g.classList.toggle('selected-trans',g.dataset.id===state.transition?.id));
    const result=document.getElementById('rabiResult');
    result.replaceChildren();
    const title=document.createElement('span');title.textContent='Ω/2π · '+(state.transition?state.transition.id+' '+state.transition.lower+' → '+state.transition.upper:'普通频率');
    const value=document.createElement('strong');
    value.textContent=state.inputStatus==='valid'&&Number.isFinite(state.fR_MHz)?formatFrequency(state.fR_MHz*1e6):'—';
    const context=document.createElement('small');
    context.textContent=state.inputStatus==='valid'
      ?`原子处 Pq=${Number(state.P_mW.toPrecision(6))} mW · w₀=${Number(state.w_um.toPrecision(6))} µm · d_eff=${Number(state.dEff.toPrecision(6))} ea₀ · ${state.selectedChannel?'所选通道':'当前偏振及 F 对的最强允许通道'}`
      :state.inputError||'请先选择适用跃迁与输入';
    result.append(title,value,context);
    if(state.transition){
      const dipole=createFieldView(state.transition.id,'d_num');
      const lifetime=createFieldView(state.transition.id,'lifetime_ns');
      const evidence=document.createElement('div');evidence.className='result-evidence';
      const validation=document.createElement('p');validation.className='result-validation';
      validation.textContent=buildEvidenceView(state).summary;
      const basis=document.createElement('p');basis.className='result-basis';
      basis.textContent=dipole?`矩阵元：${dipole.kind} · ${dipole.convention||'约定待核查'} · ${dipole.review}`:'矩阵元：当前记录缺失';
      evidence.append(validation,basis);
      if(dipole?.missingArtifact){const artifact=document.createElement('p');artifact.className='evidence-missing';artifact.textContent='计算原始证据：Notebook / Run 及版本定位待补充。';evidence.append(artifact);}
      if(lifetime){const scope=document.createElement('p');scope.textContent='寿命条件：温度与包含过程未知';evidence.append(scope);}
      const detail=document.createElement('details');
      const summary=document.createElement('summary');summary.textContent='证据详情与适用条件';detail.append(summary);
      const explanation=document.createElement('p');explanation.textContent='此卡只按当前模型换算；来源定位或内部检查不构成独立物理 / 实验验证。';detail.append(explanation);
      if(dipole){const uncertainty=document.createElement('p');uncertainty.textContent=`矩阵元不确定度：${dipole.uncertainty}`;detail.append(uncertainty);}
      if(lifetime){const life=document.createElement('p');life.textContent=`寿命依据：${lifetime.kind} · ${lifetime.review} · ${lifetime.uncertainty}；温度与包含过程未在当前结构化记录中明确，请查来源详情。`;detail.append(life);}
      evidence.append(detail);
      const sourceLink=document.createElement('a');sourceLink.href='#selectedSource';sourceLink.textContent='查看数值与原始来源';evidence.append(sourceLink);
      const reviewLink=document.createElement('a');reviewLink.href='#evidenceReview';reviewLink.dataset.evidenceOpen='';reviewLink.textContent='查看核查详情';evidence.append(reviewLink);
      result.append(evidence);
    }
  });
  const versionInfo=document.getElementById('versionInfo');
  const versionEntries=[['软件',SOFTWARE_VERSION],['数据',catalog.DATASET_VERSION],['公式',FORMULA_VERSION],['代码基线',APP_COMMIT?APP_COMMIT.slice(0,8):'本地开发版'],['界面修订',document.documentElement.dataset.uiRevision||'未标记']];
  versionInfo.replaceChildren();
  for(const [label,value] of versionEntries){
    const entry=document.createElement('div');entry.className='version-entry';
    const term=document.createElement('dt');term.textContent=label;
    const description=document.createElement('dd');description.textContent=value;
    entry.append(term,description);versionInfo.append(entry);
  }
  const versionState=document.getElementById('versionState');
  versionState.textContent=WORKTREE_DIRTY?'含本地未提交改动':'工作区无未提交改动';
  versionState.dataset.dirty=String(WORKTREE_DIRTY);
  document.documentElement.dataset.appReady='true';
}
function formatFrequency(hz){
  const [scale,unit]=Math.abs(hz)>=1e9?[1e9,'GHz']:Math.abs(hz)>=1e6?[1e6,'MHz']:Math.abs(hz)>=1e3?[1e3,'kHz']:[1,'Hz'];
  return `${Number((hz/scale).toPrecision(6))} ${unit}`;
}
