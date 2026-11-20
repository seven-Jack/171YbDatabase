import {parseCalculationRecordOrConfig, readSavedCalculation} from './calculation-record.js';
import {currentSolvedQuantity, displayQuantity, savedSolvedQuantity} from './solved-quantity.js';
import {getRecordAdoption} from './record-adoption.js';
import {EVIDENCE_VERSION} from '../data/evidence.js';

const versionText = (config, evidence) =>
  `软件 ${config.softwareVersion} · 数据 ${config.datasetVersion} · 公式 ${config.formulaVersion} · 证据 ${evidence ?? '未保存'}`;

export function initSavedRecordView({calculator, charts, versions, status}) {
  const fileInput = document.getElementById('configFile');
  const panel = document.getElementById('recordSnapshot');
  const content = panel.querySelector('[data-saved-content]');
  const recomputeButton = document.getElementById('recomputeSnapshot');
  let saved = null;
  let previewOnly = false;
  let sequence = 0;

  function field(list, label, value) {
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = value ?? '未记录';
    list.append(term, description);
  }

  function render(snapshot, recalculated = null) {
    const {config,record} = snapshot;
    const quantity = savedSolvedQuantity(config);
    const list = document.createElement('dl');
    field(list, '文件记录', `${config.transitionId} · ${config.exportedAt}`);
    field(list, '保存版本', versionText(config, record?.evidence.evidenceVersion));
    const adoption=record?.transition.adoption;
    field(list, '保存的采用状态', adoption ? [adoption.label,adoption.scope,adoption.batchId].filter(Boolean).join(' · ') : '文件未记录');
    field(list, '文件中的主结果', `${quantity.label} · ${displayQuantity(quantity, 12)}`);
    field(list, '规范化条件', `Pq = ${config.parameters.power_W} W · w₀ = ${config.parameters.waist_m} m · 高斯光束中心`);
    const channel = record?.resolvedChannel ?? config.selection.channel;
    field(list, '文件中的通道', channel ? `F=${channel.F}, mF=${channel.m} → F′=${channel.Fp}, mF′=${channel.mp} · q=${channel.q}`
      : `F=${config.selection.F_lower} → F′=${config.selection.F_upper} · ${config.selection.pol} · 自动选择`);
    field(list, '文件中的矩阵元', `${config.matrixElement.reduced_ea0 ?? '未知'} ea₀ · ${config.matrixElement.convention} · ${config.matrixElement.sourceId ?? '未记录来源'}`);
    if (config.result.status==='ok' && config.result.frequency_Hz===0 && config.result.piTime_s===null) {
      field(list, '文件中的 π 脉冲时间', '∞（零耦合）');
    }
    if (record?.evidence.summary) field(list, '文件中的核查说明', record.evidence.summary);
    if (recalculated) {
      const current = currentSolvedQuantity(recalculated);
      field(list, '此次重算版本', versionText(versions, EVIDENCE_VERSION));
      const currentAdoption=getRecordAdoption(recalculated.transition.id,recalculated.F_upper);
      field(list, '当前采用状态', [currentAdoption.label,currentAdoption.batchId].filter(Boolean).join(' · '));
      if (config.datasetHash!==versions.datasetHash) field(list,'数据 SHA-256',`保存 ${config.datasetHash} · 当前 ${versions.datasetHash}`);
      field(list, '此次重算主结果', `${current.label} · ${displayQuantity(current, 12)}`);
      if (current.key === quantity.key && current.valueSI !== null && quantity.valueSI !== null) {
        const difference = current.valueSI - quantity.valueSI;
        field(list, '重算减保存', `${difference > 0 ? '+' : ''}${difference} ${quantity.siUnit}`);
      }
    }
    const raw = document.createElement('details');
    const caption = document.createElement('summary');
    caption.textContent = '查看文件原始 JSON';
    const json = document.createElement('pre');
    json.textContent = JSON.stringify(record ?? config, null, 2);
    raw.append(caption, json);
    content.replaceChildren(list, raw);
    panel.hidden = false;
  }

  function recompute(snapshot) {
    const restored = parseCalculationRecordOrConfig(snapshot.record ?? snapshot.config, versions);
    charts.applyConfiguration(restored.state, {solveFor:restored.state.solveFor, units:restored.state.calculatorUnits});
    render(snapshot, calculator.getState());
    panel.open = true;
    status.textContent = '已恢复计算配置，并使用当前数据重新计算。' + restored.warnings.join(' ') + ' 保存值与此次重算的对照见下方快照。';
  }
  document.getElementById('snapshotOpen').addEventListener('click', () => {
    previewOnly = true;
    fileInput.click();
  });
  document.getElementById('configImport').addEventListener('click', () => {
    previewOnly = false;
    fileInput.click();
  });
  fileInput.addEventListener('cancel', () => { previewOnly = false; });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    const inspect = previewOnly;
    const ticket = ++sequence;
    previewOnly = false;
    fileInput.value = '';
    if (!file) return;
    try {
      if (file.size > 64 * 1024) throw Error('配置文件过大，限 64 KiB。');
      const text = await file.text();
      if (ticket !== sequence) return;
      const snapshot = readSavedCalculation(text);
      render(snapshot);
      saved = snapshot;
      if (inspect) {
        panel.open = true;
        status.textContent = '正在查看保存时的只读快照。';
        panel.querySelector('summary').focus();
      } else recompute(snapshot);
    } catch (error) {
      if (ticket === sequence) status.textContent = '导入失败：' + error.message;
    }
  });
  recomputeButton.addEventListener('click', () => {
    if (!saved) return;
    try { recompute(saved); }
    catch (error) { status.textContent = '重算失败：' + error.message; }
  });
}
