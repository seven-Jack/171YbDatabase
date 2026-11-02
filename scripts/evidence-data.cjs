const fs = require('node:fs');
const path = require('node:path');

const rootDirectory = path.resolve(__dirname, '..');
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}$/;
const VERSION = /^\d+\.\d+\.\d+(?:\.\d+)?$/;

/** Validate only the explicitly public schema; audit working files are never imported. */
function validateEvidence(data) {
  const errors = [];
  const error = (at, message) => errors.push(`${at}: ${message}`);
  const object = (value, keys, at, optional = []) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
      error(at, 'expected plain object'); return false;
    }
    for (const key of Object.keys(value)) if (![...keys, ...optional].includes(key)) error(`${at}.${key}`, 'unknown public field');
    for (const key of keys) if (!Object.hasOwn(value, key)) error(`${at}.${key}`, 'required field');
    return true;
  };
  const string = (value, at, pattern) => {
    if (typeof value !== 'string' || !value.trim() || value.length > 1800) error(at, 'expected nonempty bounded text');
    else {
      if (/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) || /(?:file:\/\/|\/Users\/|\/private\/|[A-Z]:\\|references\/papers|data\/literature)/i.test(value)) error(at, 'unsafe public metadata');
      if (pattern && !pattern.test(value)) error(at, 'invalid format');
    }
  };
  const number = (value, at, min = -Infinity) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min) error(at, 'invalid finite number');
  };
  const array = (value, at, visit, min = 1) => {
    if (!Array.isArray(value) || value.length < min || value.length > 100) { error(at, 'invalid bounded array'); return; }
    value.forEach((item, index) => visit(item, `${at}[${index}]`));
  };
  const texts = (value, at) => array(value, at, (item, key) => string(item, key));
  const ids = (value, at) => array(value, at, (item, key) => string(item, key, ID));
  const date = (value, at) => {
    string(value, at, /^\d{4}-\d{2}-\d{2}$/);
    if (typeof value === 'string' && (!Number.isFinite(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value)) error(at, 'invalid calendar date');
  };
  const positive = (value, at) => {
    number(value, at, 0);
    if (value === 0) error(at, 'expected positive number');
  };
  const halfInteger = (value, at) => {
    number(value, at, 0);
    if (typeof value === 'number' && !Number.isInteger(value * 2)) error(at, 'expected integer or half-integer');
  };
  const sameChannel = (a, b) => !!a && !!b && ['F','m','Fp','mp','q'].every(key => a[key] === b[key]);
  const channel = (value, at) => {
    if (!object(value, ['F','m','Fp','mp','q'], at)) return;
    halfInteger(value.F, `${at}.F`); halfInteger(value.Fp, `${at}.Fp`);
    for (const [f, m] of [['F','m'], ['Fp','mp']]) {
      number(value[m], `${at}.${m}`);
      if (Number.isFinite(value[f]) && Number.isFinite(value[m]) && (Math.abs(value[m]) > value[f] || !Number.isInteger(value[f] - value[m]))) error(`${at}.${m}`, 'invalid magnetic quantum number');
    }
    if (![-1,0,1].includes(value.q)) error(`${at}.q`, 'invalid polarization q');
    if (value.mp - value.m !== value.q) error(at, 'channel requires mp-m=q');
    if (Math.abs(value.Fp - value.F) > 1 || value.Fp + value.F < 1 || !Number.isInteger(value.Fp - value.F)) error(at, 'invalid E1 F pair');
  };
  const quantity = (value, at) => {
    if (!object(value, ['label','value','unit','evidenceKind'], at)) return;
    for (const key of ['label','unit']) string(value[key], `${at}.${key}`);
    number(value.value, `${at}.value`, 0);
    string(value.evidenceKind, `${at}.evidenceKind`, ID);
  };
  if (!object(data, ['schemaVersion','evidenceVersion','reviewedAt','sources','records','comparisons'], 'evidence')) return {valid:false, errors};
  if (![1, 2].includes(data.schemaVersion)) error('schemaVersion', 'unsupported schema');
  string(data.evidenceVersion, 'evidenceVersion', VERSION);
  date(data.reviewedAt, 'reviewedAt');
  array(data.sources, 'sources', (source, at) => {
    if (!object(source, ['id','title','doi','url','locations'], at)) return;
    string(source.id, `${at}.id`, ID); string(source.title, `${at}.title`);
    string(source.doi, `${at}.doi`, /^10\.\d{4,9}\/[^\s<>]+$/);
    string(source.url, `${at}.url`);
    try { const url = new URL(source.url); if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.includes('.')) throw Error(); }
    catch { error(`${at}.url`, 'expected public HTTPS URL without credentials'); }
    texts(source.locations, `${at}.locations`);
  });
  array(data.comparisons, 'comparisons', (comparison, at) => {
    const theory = comparison?.kind === 'theory-benchmark';
    const common = ['id','title','status','scopeText','sourceIds','assumptions','normalizationNote','boundary'];
    const fields = theory ? [...common,'kind','channel','power_mW','waist_um','calculatedRabi_MHz','publishedRabi_MHz','publishedRabiUncertainty_MHz'] : [...common,'rows','reference',...(data.schemaVersion === 2 ? ['kind'] : [])];
    if (!object(comparison, fields, at, data.schemaVersion === 1 ? ['kind'] : [])) return;
    string(comparison.id, `${at}.id`, ID);
    for (const key of ['title','scopeText','normalizationNote','boundary']) string(comparison[key], `${at}.${key}`);
    ids(comparison.sourceIds, `${at}.sourceIds`); texts(comparison.assumptions, `${at}.assumptions`);
    if (theory) {
      if (comparison.status !== 'theory-compatible') error(`${at}.status`, 'theory comparison cannot claim experimental validation');
      channel(comparison.channel, `${at}.channel`);
      for (const key of ['power_mW','waist_um','calculatedRabi_MHz','publishedRabi_MHz','publishedRabiUncertainty_MHz']) positive(comparison[key], `${at}.${key}`);
      if (Number.isFinite(comparison.calculatedRabi_MHz) && Number.isFinite(comparison.publishedRabi_MHz) && Number.isFinite(comparison.publishedRabiUncertainty_MHz)
        && Math.abs(comparison.calculatedRabi_MHz - comparison.publishedRabi_MHz) > comparison.publishedRabiUncertainty_MHz) error(at, 'theory-compatible result outside printed uncertainty');
    } else {
      if (comparison.kind !== undefined && comparison.kind !== 'conditional-power') error(`${at}.kind`, 'unrecognized comparison kind');
      if (comparison.status !== 'conditional') error(`${at}.status`, 'comparison must remain conditional');
      array(comparison.rows, `${at}.rows`, (row, rowAt) => {
        if (!object(row, ['power_mW','powerKind','powerLabel','rabi_kHz','relativeDifferencePercent'], rowAt)) return;
        positive(row.power_mW, `${rowAt}.power_mW`); positive(row.rabi_kHz, `${rowAt}.rabi_kHz`);
        number(row.relativeDifferencePercent, `${rowAt}.relativeDifferencePercent`);
        if (!['reported-measured-available','fitted-effective'].includes(row.powerKind)) error(`${rowAt}.powerKind`, 'unrecognized power evidence');
        string(row.powerLabel, `${rowAt}.powerLabel`);
      });
      quantity(comparison.reference, `${at}.reference`);
      if (comparison.reference?.evidenceKind !== 'model-fitted-coupling') error(`${at}.reference.evidenceKind`, 'reference is model-fitted, not an independent measurement');
    }
  });
  array(data.records, 'records', (record, at) => {
    if (!object(record, ['transitionId','primarySourceId','reviewVersion','reviewedAt','appliesTo','summary','sourceStatusText','sourceDetail','formulaDetail','comparisonDetail','experimentDetail','sourceIds','atomicSupport','comparisonIds','missing'], at)) return;
    for (const key of ['transitionId','primarySourceId']) string(record[key], `${at}.${key}`, ID);
    string(record.reviewVersion, `${at}.reviewVersion`, VERSION); date(record.reviewedAt, `${at}.reviewedAt`);
    for (const key of ['summary','sourceStatusText','sourceDetail','formulaDetail','comparisonDetail','experimentDetail']) string(record[key], `${at}.${key}`);
    const applies = record.appliesTo;
    if (object(applies, ['datasetHash','formulaVersion','F','Fp','q','dipole_ea0','convention'], `${at}.appliesTo`, ['channels'])) {
      string(applies.datasetHash, `${at}.appliesTo.datasetHash`, /^[a-f0-9]{64}$/);
      string(applies.formulaVersion, `${at}.appliesTo.formulaVersion`, VERSION);
      for (const key of ['F','Fp']) halfInteger(applies[key], `${at}.appliesTo.${key}`);
      positive(applies.dipole_ea0, `${at}.appliesTo.dipole_ea0`);
      array(applies.q, `${at}.appliesTo.q`, (q, qAt) => { if (![-1,0,1].includes(q)) error(qAt, 'invalid polarization q'); });
      if (!['J-reduced','F-reduced-effective'].includes(applies.convention)) error(`${at}.appliesTo.convention`, 'unsupported reduced-dipole convention');
      if (applies.channels !== undefined) array(applies.channels, `${at}.appliesTo.channels`, (item, itemAt) => {
        channel(item, itemAt);
        if (item?.F !== applies.F || item?.Fp !== applies.Fp || !(Array.isArray(applies.q) && applies.q.includes(item?.q))) error(itemAt, 'channel outside record applicability');
      });
    }
    ids(record.sourceIds, `${at}.sourceIds`); ids(record.comparisonIds, `${at}.comparisonIds`); texts(record.missing, `${at}.missing`);
    const support = record.atomicSupport;
    if (object(support, ['title','sourceIds','statusText','summary','quantities','boundary'], `${at}.atomicSupport`)) {
      for (const key of ['title','statusText','summary','boundary']) string(support[key], `${at}.atomicSupport.${key}`);
      ids(support.sourceIds, `${at}.atomicSupport.sourceIds`);
      array(support.quantities, `${at}.atomicSupport.quantities`, quantity);
    }
  });
  const unique = (items, key, at) => {
    if (!Array.isArray(items)) return;
    const values = items.map(item => item?.[key]);
    if (new Set(values).size !== values.length) error(at, 'duplicate identity');
  };
  unique(data.sources, 'id', 'sources'); unique(data.comparisons, 'id', 'comparisons'); unique(data.records, 'transitionId', 'records');
  const sourceIds = new Set(Array.isArray(data.sources) ? data.sources.map(source => source?.id) : []);
  const comparisonIds = new Set(Array.isArray(data.comparisons) ? data.comparisons.map(comparison => comparison?.id) : []);
  const references = (ids, set, at) => { if (Array.isArray(ids)) for (const id of ids) if (!set.has(id)) error(at, `unknown reference ${id}`); };
  for (const record of Array.isArray(data.records) ? data.records : []) {
    references(record?.sourceIds, sourceIds, 'record.sourceIds'); references(record?.atomicSupport?.sourceIds, sourceIds, 'atomicSupport.sourceIds');
    references(record?.comparisonIds, comparisonIds, 'record.comparisonIds');
    for (const id of Array.isArray(record?.comparisonIds) ? record.comparisonIds : []) {
      const comparison = Array.isArray(data.comparisons) && data.comparisons.find(item => item?.id === id);
      if (comparison?.kind === 'theory-benchmark' && !(Array.isArray(record?.appliesTo?.channels) && record.appliesTo.channels.some(item => sameChannel(item, comparison.channel)))) error('record.comparisonIds', 'theory benchmark requires an exact reviewed channel');
      if (comparison && Array.isArray(comparison.sourceIds) && comparison.sourceIds.some(sourceId => !(Array.isArray(record?.sourceIds) && record.sourceIds.includes(sourceId)))) error('record.sourceIds', 'comparison source missing from record');
    }
    if (Array.isArray(record?.atomicSupport?.sourceIds) && record.atomicSupport.sourceIds.some(id => !(Array.isArray(record?.sourceIds) && record.sourceIds.includes(id)))) error('record.sourceIds', 'atomic support source missing from record');
  }
  for (const comparison of Array.isArray(data.comparisons) ? data.comparisons : []) references(comparison?.sourceIds, sourceIds, 'comparison.sourceIds');
  return {valid:errors.length === 0, errors};
}

function prepareEvidence(data) {
  const result = validateEvidence(data);
  if (!result.valid) throw new Error(`Invalid public evidence:\n${result.errors.join('\n')}`);
  return `// Generated from data/evidence.json by scripts/evidence-data.cjs. Do not edit.\nexport const evidenceData = ${JSON.stringify(data, null, 2)};\n`;
}

function exportEvidence({root = rootDirectory, check = false} = {}) {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/evidence.json'), 'utf8'));
  const output = path.join(root, 'src/data/generated-evidence.js');
  const text = prepareEvidence(data);
  const unchanged = fs.existsSync(output) && fs.readFileSync(output, 'utf8') === text;
  if (check && !unchanged) throw new Error('Generated evidence is stale; run node scripts/evidence-data.cjs');
  if (!check && !unchanged) { fs.mkdirSync(path.dirname(output), {recursive:true}); fs.writeFileSync(output, text); }
  return {valid:true, checked:check, changed:!unchanged, evidenceVersion:data.evidenceVersion};
}

module.exports = {validateEvidence, prepareEvidence, exportEvidence};
if (require.main === module) {
  try {
    if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Usage: node scripts/evidence-data.cjs [--check]');
    console.log(JSON.stringify(exportEvidence({check:process.argv.includes('--check')})));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
