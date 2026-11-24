import {buildCalculationRecord, serializeCalculationRecord} from './calculation-record.js';
import {recordCitation} from './record-adoption.js';
import {canExportCurrentResult,serializeResultCSV,formatCalculationSummary} from './result-export.js';

const activeExports = new WeakMap();
const unavailable = '当前输入未形成有效计算，请先修正输入或选择适用通道。';

const canExport=canExportCurrentResult;

/** Download a current, read-only research record without changing configuration controls. */
export function initCalculationRecordExport({
  calculator, versions = {},
  toolbar = globalThis.document?.querySelector('#secRabi .calculation-toolbar'),
  status = globalThis.document?.getElementById('configStatus'),
} = {}) {
  if (!toolbar || !calculator?.getState || !calculator?.onChange) return Object.freeze({destroy(){}});
  if (activeExports.has(toolbar)) return activeExports.get(toolbar);
  const doc = toolbar.ownerDocument, view = doc.defaultView;
  const control = doc.createElement('details');
  control.id = 'calculationRecordExport';
  control.className = 'calculation-record-export';
  const summary = doc.createElement('summary');
  summary.textContent = '复制与导出';
  const panel = doc.createElement('div');
  panel.className = 'calculation-record-export-panel';
  const help = doc.createElement('p');
  help.className = 'calculation-record-export-help';
  help.textContent = '所选跃迁、实际通道及当前工作点';
  const hint = doc.createElement('p');
  hint.id = 'calculationRecordExportHint';
  hint.dataset.testid = 'record-export-hint';
  hint.className = 'calculation-record-export-hint';
  hint.setAttribute('role', 'note');
  const actions = [
    ['复制', [['summary','recordCopySummary','复制结果与条件'], ['citation','recordCopyCitation','复制数据引用']]],
    ['导出数据', [['csv','recordExportCSV','CSV · 当前工作点']]],
    ['保存研究记录', [['json','recordExportJSON','JSON · 快照与重算配置'], ['markdown','recordExportMarkdown','Markdown · 研究笔记']]],
  ];
  const buttons = [];
  panel.append(help);
  for (const [label,items] of actions) {
    const group = doc.createElement('fieldset');
    const legend = doc.createElement('legend');
    legend.textContent = label;
    group.append(legend);
    for (const [format,id,text] of items) {
      const button = doc.createElement('button');
      button.type = 'button';
      button.id = id;
      button.dataset.recordFormat = format;
      button.setAttribute('aria-describedby', hint.id);
      button.textContent = text;
      group.append(button);
      buttons.push(button);
    }
    panel.append(group);
  }
  const copyFallback=doc.createElement('textarea');copyFallback.id='recordCopyFallback';copyFallback.className='result-copy-fallback';copyFallback.readOnly=true;copyFallback.hidden=true;
  copyFallback.setAttribute('aria-label','待手动复制的内容');
  panel.append(hint,copyFallback);
  control.append(summary, panel);
  toolbar.append(control);

  const close = () => { control.open = false; };
  const render = state => {
    copyFallback.hidden=true;copyFallback.value='';
    const ready = canExport(state);
    control.dataset.status = ready ? 'valid' : 'invalid';
    for (const button of buttons) button.disabled = !ready;
    hint.textContent = ready ? '仅记录当前模型换算，不构成独立实验验证。' : unavailable;
  };
  const writeStatus = message => { if (status) status.textContent = message; };
  const download = async event => {
    const button = event.target.closest?.('button[data-record-format]');
    if (!button || !control.contains(button)) return;
    try {
      const state = calculator.getState();
      render(state);
      if (!canExport(state)) throw Error(unavailable);
      const format = button.dataset.recordFormat;
      const record = buildCalculationRecord(state, versions);
      if(format==='summary'||format==='citation'){
        const label=format==='summary'?'当次计算摘要':'数据引用';
        const text=format==='summary'?formatCalculationSummary(record):recordCitation(record.transition.id,record.resolvedChannel.Fp,versions);
        const fingerprint=JSON.stringify(state);copyFallback.hidden=true;
        try{
          if(!view.navigator.clipboard?.writeText)throw Error('剪贴板不可用');
          await view.navigator.clipboard.writeText(text);
          const focusInside=control.contains(doc.activeElement);close();if(focusInside)summary.focus({preventScroll:true});writeStatus(`已复制 ${record.transition.id} ${label}。`);
        }catch{
          if(fingerprint!==JSON.stringify(calculator.getState())){writeStatus('剪贴板不可用，当前工作点已变化，请重新复制。');return;}
          copyFallback.value=text;copyFallback.hidden=false;copyFallback.focus();copyFallback.select();
          writeStatus(`剪贴板不可用，${label}已选中，请按 ⌘C / Ctrl+C 手动复制。`);
        }
        return;
      }
      copyFallback.hidden=true;
      const content = format==='csv'?serializeResultCSV(record):serializeCalculationRecord(record, format);
      const extension = {json:'json',markdown:'md',csv:'csv'}[format];
      const blob = new view.Blob([content], {type:{json:'application/json;charset=utf-8',markdown:'text/markdown;charset=utf-8',csv:'text/csv;charset=utf-8'}[format]});
      const url = view.URL.createObjectURL(blob);
      try {
        const anchor = doc.createElement('a');
        anchor.href = url;
        anchor.download = `171yb-${record.configuration.transitionId}-record.${extension}`;
        anchor.click();
      } finally { view.setTimeout(() => view.URL.revokeObjectURL(url), 1000); }
      close();
      summary.focus({preventScroll:true});
      writeStatus(`已导出 ${record.configuration.transitionId} 研究记录（${format === 'json' ? 'JSON' : format==='csv'?'CSV':'Markdown'}）：包含输入、实际通道、结果及证据状态；不构成实验验证。`);
    } catch (error) { writeStatus(`研究记录导出失败：${error.message}`); }
  };
  const dismiss = event => { if (!control.contains(event.target)) close(); };
  const escape = event => {
    if (event.key !== 'Escape' || !control.open) return;
    event.preventDefault();
    close();
    summary.focus({preventScroll:true});
  };
  control.addEventListener('click', download);
  doc.addEventListener('pointerdown', dismiss);
  control.addEventListener('keydown', escape);
  render(calculator.getState());
  const unsubscribe = calculator.onChange(render);
  const api = Object.freeze({destroy(){
    unsubscribe?.();
    control.removeEventListener('click', download);
    doc.removeEventListener('pointerdown', dismiss);
    control.removeEventListener('keydown', escape);
    control.remove();
    activeExports.delete(toolbar);
  }});
  activeExports.set(toolbar, api);
  return api;
}
