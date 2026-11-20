import * as catalog from './data/catalog.js';
import { SOFTWARE_VERSION, APP_COMMIT, WORKTREE_DIRTY } from './version.js';
import { FORMULA_VERSION } from './physics/constants.js';
import { rabiToDisplay } from './physics/units.js';
import { generateRydbergStates, buildRydbergTransitions } from './physics/estimates.js';
import { exportCalculationConfig } from './state/config.js';
import { initSavedRecordView } from './ui/saved-record-view.js';
import { currentSolvedQuantity, displayQuantity, displayQuantityNumber } from './ui/solved-quantity.js';
import { getRecordAdoption, isZeroField } from './ui/record-adoption.js';
import { initCalculationRecordExport } from './ui/calculation-record-controls.js';
import { initResultExportControls } from './ui/result-export-controls.js';
import { decorateTransition } from './ui/spectral-color.js';
import { createTooltips } from './ui/tooltips.js';
import { initEnergyDiagram } from './ui/energy-diagram.js';
import { initAtlasViewport } from './ui/atlas-viewport.js';
import { initDecayHoverDetails } from './ui/decay-details.js';
import { initHyperfineCalculator } from './ui/hyperfine-diagram.js';
import { initRabiCharts } from './ui/rabi-chart.js';
import { initDataTables } from './ui/data-table.js';
import { initDataBrowser } from './ui/data-browser.js';
import { initSourcePanel, createDipoleFieldView, createFieldView } from './ui/source-panel.js';
import { initPageControls } from './ui/page-controls.js';
import { initWorkflowNavigation } from './ui/workflow-navigation.js';
import { initDiagramNavigation } from './ui/transition-navigation.js';
import { initRydbergSelection } from './ui/rydberg-selection.js';
import { initTransitionKnowledge } from './ui/transition-knowledge.js';
import { buildSelectionContext, initSelectionContext } from './ui/selection-context.js';
import { createChannelNavigation } from './ui/channel-navigation.js';
import { preventNumberInputWheelChanges } from './ui/number-input-wheel.js';
import {buildEvidenceView} from './ui/evidence-model.js';
import { initRecordLinks } from './ui/record-links.js';
import { initOnboarding } from './ui/onboarding.js';

export function start() {
  const CORE_TRANSITIONS=catalog.CORE_TRANSITIONS.map(decorateTransition);
  const RYDBERG_QC_TRANSITIONS=catalog.RYDBERG_QC_TRANSITIONS.map(decorateTransition);
  const data={...catalog, CORE_TRANSITIONS, RYDBERG_QC_TRANSITIONS,
    RYDBERG_STATES:generateRydbergStates(catalog.ESTIMATE_CONFIG),
    RYDBERG_TRANSITIONS:buildRydbergTransitions(RYDBERG_QC_TRANSITIONS)};
  const tooltips=createTooltips();
  const drawRydbergSelection=initEnergyDiagram({...data,CORE_TRANSITIONS:catalog.CORE_TRANSITIONS},tooltips);
  initDecayHoverDetails();
  const result=document.getElementById('rabiResult');
  const enterRabiResult=createChannelNavigation({destination:result});
  let onboarding;
  const calculator=initHyperfineCalculator(data,tooltips,{onChannelSelected(origin){
    tooltips.hideTooltip();
    if (!onboarding?.handleChannelSelection(origin)) enterRabiResult();
  }});
  const charts=initRabiCharts(calculator,tooltips);
  preventNumberInputWheelChanges(document.getElementById('secRabi'));
  const tables=initDataTables(data,tooltips);
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
  initAtlasViewport(levelDiagram, () => {
    closeLevelDetails();
    tooltips.hideTooltip();
  });
  levelDiagram.setAttribute('tabindex','-1');
  const polarizationDiagram=document.getElementById('polarizationDiagram');
  const enterChannels=createChannelNavigation({destination:document.getElementById('secCalc'),hideTooltip:tooltips.hideTooltip});
  let diagramNavigation;
  const selectionId=initRydbergSelection({transitions:catalog.RYDBERG_SERIES_TRANSITIONS,calculator,
    draw:drawRydbergSelection,onDraw:()=>diagramNavigation?.refresh(),
    enterPolarizationDiagram:createChannelNavigation({destination:polarizationDiagram,hideTooltip:tooltips.hideTooltip})});
  diagramNavigation=initDiagramNavigation({svg:levelDiagram,transitions:[...CORE_TRANSITIONS,...catalog.RYDBERG_SERIES_TRANSITIONS],calculator,selectionId,
    destination:polarizationDiagram,hideTooltip:tooltips.hideTooltip,closeLevelDetails});
  document.getElementById('hfsClose').addEventListener('click',()=>{
    closeLevelDetails();
    const lines=[...levelDiagram.querySelectorAll('.transition-line[role="button"]')];
    const available=lines.filter(line=>line.getAttribute('aria-disabled')!=='true');
    (available.find(line=>line.getAttribute('aria-pressed')==='true')||available[0]||levelDiagram).focus({preventScroll:true});
  });
  const versions={softwareVersion:SOFTWARE_VERSION,appCommit:APP_COMMIT,
    datasetVersion:catalog.DATASET_VERSION,datasetHash:catalog.DATASET_MANIFEST.contentHash,formulaVersion:FORMULA_VERSION,
    worktreeDirty:WORKTREE_DIRTY};
  initDataBrowser({transitions:CORE_TRANSITIONS,calculator,tables,versions,
    onOpenTransition(transition){
      calculator.loadTransition(transition);
      enterChannels();
    },
    onLoadComparison(state){
      charts.applyConfiguration(state,{solveFor:'rabi',units:state.calculatorUnits});tooltips.hideTooltip();
      createChannelNavigation({destination:document.getElementById('secRabi')})();
    }
  });
  const configStatus=document.getElementById('configStatus');
  initResultExportControls({calculator,charts,versions,status:configStatus});
  initCalculationRecordExport({calculator,versions,status:configStatus});
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
  initSavedRecordView({calculator,charts,versions,status:configStatus});
  const title=result.querySelector('.result-title'), number=result.querySelector('.result-number'), unit=result.querySelector('.result-unit');
  const channel=result.querySelector('.result-channel'), mode=result.querySelector('.result-channel-mode');
  const conditions=result.querySelector('.result-conditions'), error=result.querySelector('.result-error');
  const power=result.querySelector('[data-result-power]'), waist=result.querySelector('[data-result-waist]');
  const dipoleValue=result.querySelector('[data-result-dipole]'), target=result.querySelector('[data-result-target]');
  const evidence=result.querySelector('.result-evidence');
  let evidenceKey;
  calculator.onChange(state=>{
    document.querySelectorAll('#levelDiagram .transition-line').forEach(g=>g.classList.toggle('selected-trans',g.dataset.id===selectionId(state)));
    const solved=currentSolvedQuantity(state);
    result.setAttribute('aria-label','当前工作点的'+solved.label);
    title.textContent=[solved.label,state.transition?.id].filter(Boolean).join(' · ');
    const valid=state.inputStatus==='valid' && solved.value!==null;
    number.textContent=valid?displayQuantityNumber(solved):'—';
    unit.textContent=valid?' '+solved.unit:'';
    const selection=buildSelectionContext(state);
    mode.textContent=selection.channel?selection.mode:'';
    channel.textContent=selection.channel?selection.channelText:'';
    channel.hidden=!selection.channel;
    error.hidden=valid;
    error.textContent=valid?'':state.inputError||'请选择适用跃迁与输入';
    conditions.hidden=!valid;
    const hasTarget=valid && solved.key!=='rabi';
    target.parentElement.hidden=!hasTarget;
    const frequencyUnit=state.calculatorUnits?.rabi ?? 'MHz';
    target.textContent=hasTarget?displayQuantity({value:rabiToDisplay(state.fR_MHz,frequencyUnit),unit:frequencyUnit}):'';
    power.textContent=valid?`${Number(state.P_mW.toPrecision(6))} mW`:'';
    waist.textContent=valid?`${Number(state.w_um.toPrecision(6))} µm`:'';
    dipoleValue.textContent=valid?`${Number(state.dEff.toPrecision(6))} ea₀`:'';
    const review=buildEvidenceView(state);
    if(evidenceKey===review.contextKey)return;
    evidenceKey=review.contextKey;
    const previousOpen=evidence.querySelector('details')?.open;
    evidence.replaceChildren();
    if(state.transition){
      const dipole=createDipoleFieldView(state.transition.id,state.selectedChannel?.Fp ?? state.F_upper);
      const lifetime=createFieldView(state.transition.id,'lifetime_ns');
      const validation=document.createElement('p');validation.className='result-validation';
      validation.textContent=review.summary;
      const basis=document.createElement('p');basis.className='result-basis';
      const adoption=getRecordAdoption(state.transition.id,state.F_upper);
      basis.textContent=dipole?`矩阵元 ${dipole.valueText} · ${adoption.label} · ${dipole.kind} · ${dipole.convention||'约定待核查'}`:'矩阵元：当前记录缺失';
      evidence.append(validation,basis);
      if(dipole?.missingArtifact){const artifact=document.createElement('p');artifact.className='evidence-missing';artifact.textContent='计算原始证据：Notebook / Run 及版本定位待补充。';evidence.append(artifact);}
      if(isZeroField(adoption.conditions)){
        const limit=document.createElement('p');limit.textContent='B=E=0 · 模型不确定度未建立，独立实验标定待补。';evidence.append(limit);
      }
      const detail=document.createElement('details');detail.open=Boolean(previousOpen);
      const summary=document.createElement('summary');summary.textContent='证据详情与适用条件';detail.append(summary);
      const explanation=document.createElement('p');explanation.textContent='工作点取高斯光束中心。完整 Rabi 不确定度和独立实验标定待补。';detail.append(explanation);
      if(dipole){const uncertainty=document.createElement('p');uncertainty.textContent=`矩阵元不确定度：${dipole.uncertainty} · ${dipole.review}`;detail.append(uncertainty);}
      if(lifetime){const life=document.createElement('p');life.textContent=`寿命依据：${lifetime.kind} · ${lifetime.review} · ${lifetime.uncertainty}；温度与包含过程未在当前结构化记录中明确，请查来源详情。`;detail.append(life);}
      evidence.append(detail);
      if(!review.calculationSource){
        const sourceLink=document.createElement('a');sourceLink.href='#selectedSource';sourceLink.textContent='查看数值与原始来源';evidence.append(sourceLink);
      }
      const reviewLink=document.createElement('a');reviewLink.href='#evidenceReview';reviewLink.dataset.evidenceOpen=review.calculationSource?'calculation':'';
      reviewLink.textContent=review.calculationSource?'查看计算记录':'查看核查详情';evidence.append(reviewLink);
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
  initRecordLinks({host:document.getElementById('recordLinks'),calculator,charts,versions});
  onboarding=initOnboarding({calculator});
  document.documentElement.dataset.appReady='true';
}
