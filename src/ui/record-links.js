import { CORE_TRANSITIONS, RYDBERG_QC_TRANSITIONS, RYDBERG_SERIES_TRANSITIONS, getLevelRecord, getTransitionRecord } from '../data/catalog.js';
import { recordCitation } from './record-adoption.js';
import { getFs } from '../physics/angular.js';
import { exportCalculationConfig, parseCalculationConfig } from '../state/config.js';

const recordTransitions = new Map([...RYDBERG_QC_TRANSITIONS, ...CORE_TRANSITIONS, ...RYDBERG_SERIES_TRANSITIONS]
  .map(transition => [transition.id, transition]));
const linkFields = ['record', 'fp', 'v', 'data', 'sha256', 'formula', 'local', 'workpoint'];
const maxFragmentLength = 4096;
const shortVersion = /^[\w.-]{1,64}$/;
const validVersion = value => typeof value === 'string' && shortVersion.test(value);
const sha256 = /^[0-9a-f]{64}$/;
const publicSite = 'https://seven-jack.github.io/171YbDatabase/';
const publicRepository = 'https://github.com/seven-Jack/171YbDatabase';
const publishedCatalogs = [
  {
    datasetVersion: '2026.11.11.1',
    datasetHash: '4b5df2bd0e5679ce5576f6bcfa5fa99b0b4cd586c371766de6aab2f9ea193068',
    commit: 'ad20cd78cb65fc245a29e7f35ffb373e7b416238',
  },
  {
    datasetVersion: '2026.11.18.2',
    datasetHash: 'f8f8bf3789d69eda79ab2e183378b7d6ad7f0543aae51f13aca0a03980147ba2',
    commit: '07dc3f5b2c2fdc032b8ed5a30ec6e49715814fd0',
  },
];

function selection(recordId, fp) {
  const transition = recordTransitions.get(recordId);
  if (!transition) throw Error('当前数据中没有该跃迁记录。');
  const upper = getLevelRecord(getTransitionRecord(recordId).upperLevelId);
  const branches = transition.Fp === undefined ? getFs(upper.attributes.J) : [transition.Fp];
  if (!branches.some(branch => String(branch) === fp)) throw Error('末态 F′ 与该跃迁记录不匹配。');
  return { transition, F_upper: Number(fp) };
}

export function createRecordLink(pageHref, state, versions, includeWorkpoint = false) {
  const recordId = state.transition?.id;
  const fp = String(state.F_upper);
  selection(recordId, fp);
  if (!validVersion(versions.datasetVersion) || !sha256.test(versions.datasetHash) || !validVersion(versions.formulaVersion)) {
    throw Error('当前版本或数据摘要不可用。');
  }
  const url = new URL(pageHref);
  if (!['http:', 'https:'].includes(url.protocol)) throw Error('请通过网站或本地预览打开图谱。');
  url.search = '';
  const fields = new URLSearchParams({
    record: recordId, fp, v: '1', data: versions.datasetVersion, sha256: versions.datasetHash,
    formula: versions.formulaVersion, local: versions.worktreeDirty ? '1' : '0',
  });
  if (includeWorkpoint) {
    if (state.inputStatus !== 'valid') throw Error('当前工作点无有效计算。');
    fields.set('workpoint', JSON.stringify(exportCalculationConfig(state, versions)));
  }
  url.hash = fields.toString();
  if (url.hash.length > maxFragmentLength) throw Error('工作点链接过长，请导出计算配置。');
  return url.href;
}

/** Resolve a site fragment against the current catalog before changing any controls. */
export function readRecordLink(fragment, versions) {
  if (!/^#record(?:=|&|$)/.test(fragment)) return null;
  if (fragment.length > maxFragmentLength) throw Error('记录链接过长。');
  const fields = new URLSearchParams(fragment.slice(1));
  if ([...fields.keys()].some(key => !linkFields.includes(key) || fields.getAll(key).length !== 1)) {
    throw Error('记录链接包含未知或重复字段。');
  }
  const version = fields.get('v');
  const dataVersion = fields.get('data') ?? '';
  const dataHash = fields.get('sha256') ?? '';
  const formula = fields.get('formula') ?? '';
  const local = fields.get('local');
  if (version !== '1' || !validVersion(dataVersion) || !sha256.test(dataHash) || !validVersion(formula) || !['0', '1'].includes(local)) {
    throw Error('记录链接的格式、版本或数据摘要无效。');
  }
  const record = selection(fields.get('record'), fields.get('fp'));
  const workpoint = fields.get('workpoint');
  const warnings = [];
  if (dataVersion !== versions.datasetVersion || dataHash !== versions.datasetHash) {
    warnings.push(`链接数据版本 ${dataVersion}（${dataHash.slice(0, 12)}）与当前 ${versions.datasetVersion}（${versions.datasetHash.slice(0, 12)}）不同，已使用当前数据。`);
  }
  if (formula !== versions.formulaVersion) warnings.push(`链接公式版本 ${formula} 与当前 ${versions.formulaVersion} 不同，已使用当前公式。`);
  if (local === '1') warnings.push('链接来自含未提交改动的预览。');
  if (workpoint === null) return { ...record, state: null, warnings };

  const restored = parseCalculationConfig(workpoint, versions);
  const { config } = restored;
  if (config.transitionId !== record.transition.id || config.selection.F_upper !== record.F_upper ||
      config.datasetVersion !== dataVersion || config.datasetHash !== dataHash || config.formulaVersion !== formula) {
    throw Error('链接中的工作点与跃迁、末态 F′ 或版本不匹配。');
  }
  if (restored.result.status !== 'ok') throw Error('链接中的工作点无法在当前数据上计算。');
  const separateWarnings = restored.warnings.filter(warning => !/^(数据版本|数据摘要|公式版本)不同/.test(warning));
  return { ...record, state: restored.state, warnings: [...warnings, ...separateWarnings] };
}

export function datasetReference(pageHref, recordId, versions) {
  const deployment = new URL(pageHref);
  deployment.search = '';
  deployment.hash = '';
  const isPublic = [publicSite, publicSite + 'index.html'].includes(deployment.href);
  const published = publishedCatalogs.find(catalog => catalog.datasetVersion === versions.datasetVersion
    && catalog.datasetHash === versions.datasetHash);
  const publicBuildCommit = isPublic && versions.worktreeDirty === false && /^[0-9a-f]{40}$/.test(versions.appCommit)
    ? versions.appCommit : null;
  const commit = published?.commit ?? publicBuildCommit;
  const relativeManifest = 'data/dataset.json';
  const relativeRecord = recordId?.startsWith('NS-') ? 'data/rydberg-series.json' : 'data/transitions.json';
  const localUrl = relative => new URL(relative, deployment).href;
  return {
    manifestUrl: localUrl(relativeManifest),
    recordUrl: localUrl(relativeRecord),
    publicManifestUrl: commit ? `${publicRepository}/blob/${commit}/${relativeManifest}` : null,
  };
}

export function initRecordLinks({ host, calculator, charts, versions }) {
  const view = host.ownerDocument.defaultView;
  const status = host.querySelector('[data-record-link-status]');
  const fallback = host.querySelector('textarea');
  const workpointButton = host.querySelector('[data-copy-record="workpoint"]');
  const manifestLink = host.querySelector('[data-dataset-manifest]');
  const recordFile = host.querySelector('[data-dataset-record]');
  const publishedLink = host.querySelector('[data-dataset-public]');
  const isPreview = new URL('.', view.location.href).href !== publicSite || versions.worktreeDirty;

  function restore() {
    try {
      const restored = readRecordLink(view.location.hash, versions);
      if (!restored) return;
      host.open = true;
      if (restored.state) {
        charts.applyConfiguration(restored.state, { solveFor: restored.state.solveFor, units: restored.state.calculatorUnits });
      } else {
        calculator.restore({ transition: restored.transition, F_upper: restored.F_upper });
      }
      status.textContent = [restored.state ? '已恢复工作点并重算。' : '已定位跃迁记录。', ...restored.warnings].join(' ');
    } catch (error) {
      host.open = true;
      status.textContent = `记录链接无法恢复。 ${error.message}`;
    }
    host.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }

  calculator.onChange(state => {
    workpointButton.disabled = state.inputStatus !== 'valid';
    const reference = datasetReference(view.location.href, state.transition?.id, versions);
    manifestLink.href = reference.manifestUrl;
    recordFile.href = reference.recordUrl;
    publishedLink.hidden = !reference.publicManifestUrl;
    if (reference.publicManifestUrl) publishedLink.href = reference.publicManifestUrl;
    else publishedLink.removeAttribute('href');
    fallback.hidden = true;
  });
  host.addEventListener('click', async event => {
    const button = event.target.closest('button[data-copy-record]');
    if (!button || !host.contains(button)) return;
    const state = calculator.getState();
    try {
      const isCitation = button.dataset.copyRecord === 'citation';
      const reference = datasetReference(view.location.href, state.transition?.id, versions);
      const label = isCitation ? '数据引用' : '记录链接';
      const citationScope = reference.publicManifestUrl ? '版本清单' : '当前站点数据清单';
      const content = isCitation
        ? `${recordCitation(state.transition.id,state.F_upper,versions)}，整库内容 SHA-256 ${versions.datasetHash}，公式版本 ${versions.formulaVersion}。 ${citationScope} ${reference.publicManifestUrl ?? reference.manifestUrl}`
        : createRecordLink(view.location.href, state, versions, button.dataset.copyRecord === 'workpoint');
      const previewNote = isPreview && (!isCitation || !reference.publicManifestUrl) ? ' 此地址属于当前预览。' : '';
      fallback.hidden = true;
      try {
        await view.navigator.clipboard.writeText(content);
        status.textContent = `已复制${label}。${previewNote}`;
      } catch {
        if (state.revision !== calculator.getState().revision) {
          status.textContent = '选择已变化，请重新复制。';
          return;
        }
        fallback.value = content;
        fallback.hidden = false;
        fallback.focus();
        fallback.select();
        status.textContent = `请手动复制已选中的${label}。${previewNote}`;
      }
    } catch (error) {
      status.textContent = `无法复制。 ${error.message}`;
    }
  });
  host.querySelector('[data-dataset-version]').textContent = `数据 ${versions.datasetVersion} · 整库 SHA-256 ${versions.datasetHash.slice(0, 12)}`;
  view.addEventListener('hashchange', restore);
  restore();
}
