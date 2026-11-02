import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {verifyLocalEvidence} from './local-evidence.mjs';

const root = new URL('../', import.meta.url);
const common = ['scripts/literature-audit.mjs', 'scripts/local-evidence.mjs'];
export const auditPackages = [
  {name: 'clock-rabi-audit-2026-10-30', report: 'clock-rabi-578-audit-20261030.md',
    tests: ['tests/physics/clock-rabi-audit.test.js', 'tests/physics/clock-motion.test.js']},
  {name: 'clock-rabi-crosscheck-search-2026-10-30', report: 'clock-rabi-independent-search-20261030.md', tests: []},
  {name: 'offer-clock-conditional-2026-10-30', report: 'offer-clock-conditional-20261030.md', tests: ['tests/physics/offer-audit.test.js']},
  {name: 'offer-saturation-cg-2026-10-30', report: 'offer-saturation-cg-audit-20261030.md', tests: ['tests/physics/offer-audit.test.js']},
].map(item => ({...item, directory: `data/literature/${item.name}`, report: `references/audits/${item.report}`,
  companions: [...common, ...item.tests]}));

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function location(base, relative) {
  const directory = path.resolve(fileURLToPath(base)), resolved = path.resolve(directory, relative);
  if (!resolved.startsWith(directory + path.sep)) throw Error(`Path escapes literature archive: ${relative}`);
  return resolved;
}
const readJSON = (base, relative) => JSON.parse(fs.readFileSync(location(base, relative), 'utf8'));

function packageFiles(definition, base = root) {
  const walk = relative => fs.readdirSync(location(base, relative), {withFileTypes: true}).flatMap(entry => {
    const target = `${relative}/${entry.name}`;
    if (entry.isSymbolicLink()) throw Error(`Archive symlinks are not supported: ${target}`);
    if (entry.isDirectory()) return walk(target);
    // Originals, full text and paper page images stay local. The one browser
    // screenshot is an explicitly dated historical website screenshot.
    if (/\.(pdf|txt|tex|tar|ipynb)$/i.test(entry.name) ||
        (/\.png$/i.test(entry.name) && !entry.name.startsWith('browser'))) return [];
    return entry.name === 'manifest.json' ? [] : [target];
  });
  return [...walk(definition.directory), definition.report, ...(definition.companions || [])].sort();
}

export function buildManifest(definition, base = root, overrides = new Map()) {
  const files = [...new Set([...packageFiles(definition, base), ...overrides.keys()])].sort().map(relative => {
    const bytes = overrides.get(relative) ?? fs.readFileSync(location(base, relative));
    return {path: relative, bytes: bytes.length, sha256: digest(bytes)};
  });
  return {schemaVersion: 2, originalAuditDate: '2026-10-30', archivedOn: '2026-10-31',
    baseCommit: '8203da5ceb9bd0117c091578fb3c070b4281ea03',
    scope: {
      includes: 'All public package files except manifest.json itself, the linked audit report, and listed shared verification code/tests.',
      excludes: 'Self hash; local original PDFs/full text/TeX/source archives/notebooks/paper page images. These have separate source fingerprints.',
      boundary: 'File integrity and reproducibility only; not independent experimental validation.',
    }, files};
}

export function verifyManifest(definition, base = root) {
  const saved = readJSON(base, `${definition.directory}/manifest.json`);
  const actual = buildManifest(definition, base);
  if (!isDeepStrictEqual(saved, actual)) throw Error(`Archive manifest is incomplete or stale: ${definition.name || definition.directory}`);
  return {package: definition.name, files: saved.files.length, status: 'verified'};
}

function scientificProjection(result) {
  const copy = structuredClone(result);
  for (const field of ['sourceHashes', 'sourceBytes']) {
    if (!copy[field]) continue;
    copy[field] = copy[field].map(source => {
      if (!['verified', 'unavailable'].includes(source.status)) throw Error(`Invalid current source-byte status: ${source.status}`);
      if ((source.status === 'verified') !== source.verified) throw Error('Contradictory source-byte status');
      if (source.verified && (source.sha256 !== source.expectedSha256 || source.unchanged !== true)) throw Error('Verified source bytes do not match the recorded fingerprint');
      if (!source.verified && (source.sha256 !== null || source.unchanged !== null)) throw Error('Unavailable source bytes cannot retain a current verification claim');
      return {sourceId: source.sourceId, localPath: source.localPath, expectedSha256: source.expectedSha256};
    });
  }
  return copy;
}

function snapshotDifference(actual, expected, at = '$', roundoff = []) {
  if (isDeepStrictEqual(actual, expected)) return null;
  // Node 22 and 24 can round this derived q**n probability one ULP apart.
  // No absolute floor: tiny physical quantities, inputs and all other outputs
  // remain exact, as do source identities, frozen bytes and manifest hashes.
  const probabilityPath = /^\$\.conditionalMotion\.thermalCases\[\d+\]\.unboundedHarmonicProbabilityAtOrAboveNominalBarrier$/;
  if (probabilityPath.test(at) && typeof actual === 'number' && typeof expected === 'number' &&
      Number.isFinite(actual) && Number.isFinite(expected)) {
    const tolerance = 8 * Number.EPSILON * Math.max(Math.abs(actual), Math.abs(expected));
    if (Math.abs(actual - expected) <= tolerance) {
      roundoff.push({path: at, actual, historical: expected, tolerance});
      return null;
    }
  }
  if (Array.isArray(actual) && Array.isArray(expected) && actual.length === expected.length &&
      isDeepStrictEqual(Object.keys(actual), Object.keys(expected))) {
    for (let index = 0; index < actual.length; index++) {
      const difference = snapshotDifference(actual[index], expected[index], `${at}[${index}]`, roundoff);
      if (difference) return difference;
    }
    return null;
  }
  if (actual && expected && typeof actual === 'object' && typeof expected === 'object' &&
      !Array.isArray(actual) && !Array.isArray(expected) &&
      isDeepStrictEqual(Object.keys(actual).sort(), Object.keys(expected).sort())) {
    for (const key of Object.keys(actual)) {
      const difference = snapshotDifference(actual[key], expected[key], `${at}.${key}`, roundoff);
      if (difference) return difference;
    }
    return null;
  }
  return {path: at, actual, historical: expected};
}

export function compareReproductionSnapshot(current, historical) {
  const roundoff = [], difference = snapshotDifference(scientificProjection(current), scientificProjection(historical), '$', roundoff);
  if (difference) {
    throw Error(`Reproduction differs from the historical scientific result or source identity: ${JSON.stringify(difference)}`);
  }
  const records = current.sourceHashes || current.sourceBytes || [];
  return {scientificSnapshotMatches: true, originalsVerified: records.filter(item => item.verified).length,
    originalsUnavailable: records.filter(item => !item.verified).length,
    derivedProbabilityRoundoffMatches: roundoff,
    boundary: 'Historical source-byte availability is not a claim that originals are present in this checkout.'};
}

function csvRows(text) {
  const rows = [], row = []; let value = '', quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {value += '"'; index++;} else quoted = !quoted;
    } else if (!quoted && (character === ',' || character === '\n')) {
      row.push(value.replace(/\r$/, '')); value = '';
      if (character === '\n') {rows.push([...row]); row.length = 0;}
    } else value += character;
  }
  if (quoted) throw Error('Unclosed quoted CSV cell');
  if (value || row.length) {row.push(value.replace(/\r$/, '')); rows.push([...row]);}
  return rows;
}

function csvFor(name, result) {
  if (name === 'clock-rabi-audit-2026-10-30') {
    const columns = ['id', 'workingRate_s_inv', 'dF_ea0', 'dPi_ea0', 'beamCentreRabi_Hz', 'rabiDipoleOnlyUncertainty_Hz'];
    return {filename: 'strength-comparison.csv', rows: [columns, ...result.independentStrengthComparisons.map(item => columns.map(key => item[key] ?? ''))]};
  }
  if (name === 'offer-clock-conditional-2026-10-30') return {filename: 'comparison.csv', rows: [
    ['power_mW', 'power_evidence_kind', 'assumed_1_e2_radius_um', 'current_pi_rabi_kHz', 'reference_kHz', 'difference_kHz', 'relative_difference_percent', 'xu_rate_pi_rabi_kHz', 'xu_rate_only_uncertainty_kHz'],
    ...result.powerCases.map(item => [item.power_mW, item.powerEvidenceKind, result.radius_um, item.rabi_kHz,
      result.targetRabi_Hz / 1000, item.differenceFrom22000_Hz / 1000, item.relativeDifference_percent,
      item.xuRateDerived.rabi_Hz / 1000, item.xuRateDerived.rabiRateInputOnlyUncertainty_Hz / 1000]),
  ]};
  return {filename: 'comparison.csv', rows: [
    ['case', 'evidence_kind', 'population_decay_rate_s_inv', 'natural_FWHM_mHz', 'lifetime_s', 'Isat_scalar_W_m2', 'Isat_pi_W_m2', 'Rabi_scalar_kHz', 'Rabi_pi_kHz', 'scalar_difference_from_22k_percent'],
    ...result.comparisons.map(item => [item.id, item.evidenceKind, item.populationDecayRate_s_inv,
      item.naturalLinewidth_Hz * 1000, item.lifetime_s, item.isatScalar_W_m2, item.isatPi_W_m2,
      item.scalarRabi_Hz / 1000, item.piRabi_Hz / 1000, item.scalarDifferenceFrom22k_percent]),
  ]};
}

function verifyCSV(definition, result, base = root) {
  const expected = csvFor(definition.name, result), rows = csvRows(fs.readFileSync(location(base, `${definition.directory}/${expected.filename}`), 'utf8'));
  if (rows.length !== expected.rows.length) throw Error(`CSV row count differs: ${definition.name}`);
  rows.forEach((row, rowIndex) => {
    const other = expected.rows[rowIndex];
    if (row.length !== other.length) throw Error(`CSV column count differs: ${definition.name}`);
    row.forEach((cell, columnIndex) => {
      const value = other[columnIndex];
      const matches = typeof value === 'number' ? cell.trim() !== '' && Number.isFinite(Number(cell)) &&
        Math.abs(Number(cell) - value) <= 1e-12 * Math.max(1e-30, Math.abs(value)) : cell === String(value);
      if (!matches) throw Error(`CSV value differs: ${definition.name}, row ${rowIndex + 1}, column ${columnIndex + 1}`);
    });
  });
}

function atomicOutputs(outputs, base = root) {
  const backups = new Map(), staged = [], replaced = [];
  try {
    for (const [relative, bytes] of outputs) {
      const target = location(base, relative);
      if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) throw Error(`Refusing output symlink: ${relative}`);
      backups.set(target, fs.existsSync(target) ? fs.readFileSync(target) : null);
      const temporary = `${target}.archive-${process.pid}.tmp`;
      staged.push({target, temporary}); fs.writeFileSync(temporary, bytes, {flag: 'wx'});
    }
    for (const item of staged) {fs.renameSync(item.temporary, item.target); replaced.push(item.target);}
  } catch (error) {
    for (const target of replaced.reverse()) {
      const bytes = backups.get(target);
      if (bytes === null) fs.rmSync(target); else fs.writeFileSync(target, bytes);
    }
    throw error;
  } finally {
    for (const {temporary} of staged) fs.rmSync(temporary, {force: true});
  }
}

function verifyReproduction(definition, result, base = root) {
  const current = structuredClone(result);
  // Recheck actual bytes at the write/check boundary. Never persist a supplied
  // or historical "verified" flag when the original is absent or has changed.
  for (const field of ['sourceHashes', 'sourceBytes']) {
    if (current[field]) current[field] = current[field].map(source => verifyLocalEvidence(base, {
      sourceId: source.sourceId, localPath: source.localPath, sha256: source.expectedSha256,
    }));
  }
  const summary = compareReproductionSnapshot(current, readJSON(base, `${definition.directory}/results.json`));
  verifyCSV(definition, current, base);
  return {current, summary};
}

function verifyBacklogIfPresent(base = root) {
  const relative = 'references/audits/literature-backlog-20261031.json';
  return fs.existsSync(location(base, relative)) ? checkBacklog(readJSON(base, relative), base) : {status: 'not-present'};
}

export function writeCurrentOutputs(definition, result, base = root) {
  // Every precondition is read-only and precedes even staging output files.
  verifyFrozenFiles(definition, base);
  const {current} = verifyReproduction(definition, result, base);
  verifyBacklogIfPresent(base);
  const csv = csvFor(definition.name, current);
  const escape = value => /[,"\r\n]/.test(String(value)) ? `"${String(value).replaceAll('"', '""')}"` : String(value);
  const outputs = new Map([
    [`${definition.directory}/current-results.json`, Buffer.from(JSON.stringify(current, null, 2) + '\n')],
    [`${definition.directory}/current-${csv.filename}`, Buffer.from(csv.rows.map(row => row.map(escape).join(',')).join('\n') + '\n')],
  ]);
  outputs.set(`${definition.directory}/manifest.json`, Buffer.from(JSON.stringify(buildManifest(definition, base, outputs), null, 2) + '\n'));
  atomicOutputs(outputs, base);
}

export function runReproductionCLI(moduleURL, reproduce, args = process.argv.slice(2)) {
  const filename = fileURLToPath(moduleURL);
  if (!process.argv[1] || path.resolve(process.argv[1]) !== filename) return;
  if (args.length > 1 || (args[0] && !['--check', '--write'].includes(args[0]))) throw Error('Usage: node reproduce.mjs [--check|--write]');
  const definition = auditPackages.find(item => filename === location(root, `${item.directory}/reproduce.mjs`));
  if (!definition) throw Error('Unknown literature reproduction package');
  verifyFrozenFiles(definition);
  const {current, summary} = verifyReproduction(definition, reproduce());
  verifyBacklogIfPresent();
  if (args[0] === '--write') {
    // Frozen results.json/CSV retain their original 2026-10-30 bytes. Explicit
    // writes create separate current outputs with actual source availability.
    writeCurrentOutputs(definition, current);
  }
  console.log(JSON.stringify({package: definition.name, mode: args[0] || '--check', ...summary,
    engineeringChecks: Object.keys(current.engineeringChecks || {}).length, historicalSnapshotsUnchanged: true}));
}

function verifyFrozenFiles(definition, base = root) {
  const metadata = readJSON(base, `${definition.directory}/archive-metadata.json`);
  if (metadata.baseCommit !== '8203da5ceb9bd0117c091578fb3c070b4281ea03' || metadata.originalAuditDate !== '2026-10-30') throw Error(`Archive version anchor differs: ${definition.name}`);
  for (const file of metadata.frozenHistoricalFiles) {
    if (digest(fs.readFileSync(location(base, file.path))) !== file.sha256) throw Error(`Frozen historical snapshot changed: ${file.path}`);
  }
  return metadata.frozenHistoricalFiles.length;
}

export function checkBacklog(backlog, base = root) {
  const ids = new Set(), categories = new Set(['download-original', 'author-parameters', 'internal-artifact', 'local-inventory', 'independent-benchmark']);
  for (const item of backlog.items) {
    if (!item.id || ids.has(item.id)) throw Error('Duplicate or missing literature backlog ID');
    ids.add(item.id);
    if (!categories.has(item.category) || !['open', 'closed'].includes(item.status)) throw Error(`Invalid backlog classification: ${item.id}`);
    if (!item.closureCriteria || (Array.isArray(item.closureCriteria) && !item.closureCriteria.length)) throw Error(`Missing closure criteria: ${item.id}`);
    if (item.status === 'closed' && (!item.closingEvidence || !item.closingEvidence.length)) throw Error(`Closed backlog item lacks evidence: ${item.id}`);
    for (const evidence of item.evidencePaths || []) {
      if (!fs.existsSync(location(base, evidence.split(':')[0]))) throw Error(`Backlog evidence file missing: ${evidence}`);
    }
  }
  return {items: ids.size, open: backlog.items.filter(item => item.status === 'open').length};
}

export async function validateAuditPackages({base = root, definitions = auditPackages, verifyManifests = true,
  loadReproduction = async definition => (await import(new URL(`${definition.directory}/reproduce.mjs`, base))).reproduce(),
} = {}) {
  const packages = [], sources = [];
  for (const definition of definitions) {
    const frozenFiles = verifyFrozenFiles(definition, base);
    const manifest = verifyManifests ? verifyManifest(definition, base) : {
      package: definition.name, files: buildManifest(definition, base).files.length, status: 'ready-for-manifest-refresh',
    };
    if (definition.name === 'clock-rabi-crosscheck-search-2026-10-30') {
      const candidates = readJSON(base, `${definition.directory}/candidates.json`);
      if (candidates.acceptedCases.length !== 0 || candidates.independentExperimentalValidation !== 'not-performed-because-no-eligible-operating-point') throw Error('Candidate search evidence status changed');
      const verification = readJSON(base, `${definition.directory}/verification.json`);
      for (const source of verification.sourceDocuments) sources.push(verifyLocalEvidence(base, {localPath: source.path, sha256: source.sha256}));
      packages.push({...manifest, frozenFiles, eligibleCases: 0});
    } else {
      const {current: result, summary} = verifyReproduction(definition, await loadReproduction(definition), base);
      sources.push(...(result.sourceHashes || result.sourceBytes));
      packages.push({...manifest, frozenFiles, ...summary, engineeringChecks: Object.keys(result.engineeringChecks || {}).length});
    }
  }
  const backlog = verifyBacklogIfPresent(base);
  return {packages, sourceByteChecks: {
    records: sources.length, verified: sources.filter(item => item.verified).length,
    unavailable: sources.filter(item => !item.verified).length,
  }, backlog, independentExperimentalValidationPassed: false};
}

export async function refreshManifests(options = {}) {
  const {base = root, definitions = auditPackages} = options;
  // A stale manifest is the only tolerated preflight discrepancy. Frozen
  // snapshots, source bytes, reproduction, CSV and backlog must all pass first.
  const checked = await validateAuditPackages({...options, base, definitions, verifyManifests: false});
  const outputs = new Map(definitions.map(item => [`${item.directory}/manifest.json`,
    Buffer.from(JSON.stringify(buildManifest(item, base), null, 2) + '\n')]));
  atomicOutputs(outputs, base);
  checked.packages = checked.packages.map((item, index) => ({...item, ...verifyManifest(definitions[index], base)}));
  return checked;
}

async function main(args) {
  if (args.length > 1 || (args[0] && !['--check', '--write-manifests'].includes(args[0]))) throw Error('Usage: node scripts/literature-audit.mjs [--check|--write-manifests]');
  const checked = args[0] === '--write-manifests' ? await refreshManifests() : await validateAuditPackages();
  console.log(JSON.stringify({mode: args[0] || '--check', ...checked}, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => {console.error(error.message); process.exitCode = 1;});
}
