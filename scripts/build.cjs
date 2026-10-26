const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { writeVersion } = require('./write-version.cjs');

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Publishing symlinks is not supported: ${target}`);
    return entry.isDirectory() ? filesBelow(target) : [target];
  });
}
function build(directory, options = {}) {
  const root = fs.realpathSync(directory);
  const output = path.join(root, 'dist');
  if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Missing source index.html');
  const version = writeVersion(root);
  if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error('dist must be a project-owned directory, not a symlink');
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output);
  for (const name of ['index.html', 'src', 'data', 'assets']) {
    const source = path.join(root, name);
    if (!fs.existsSync(source)) continue;
    if (fs.lstatSync(source).isSymbolicLink()) throw new Error(`Publishing symlinks is not supported: ${name}`);
    if (fs.statSync(source).isDirectory()) filesBelow(source);
    fs.cpSync(source, path.join(output, name), { recursive: true });
  }
  const datasetPath = path.join(root, 'data', 'dataset.json');
  const dataset = fs.existsSync(datasetPath) ? JSON.parse(fs.readFileSync(datasetPath, 'utf8')) : {};
  const formulaFile = path.join(root, 'src', 'physics', 'constants.js');
  const formulaVersion = fs.existsSync(formulaFile)
    ? fs.readFileSync(formulaFile, 'utf8').match(/export\s+const\s+FORMULA_VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1]
    : null;
  if (fs.existsSync(formulaFile) && !formulaVersion) throw new Error('The production formula module must export FORMULA_VERSION.');
  const commit = options.commit || version.appCommit;
  const metadata = {
    schemaVersion: 1, softwareVersion: version.softwareVersion, appCommit: commit,
    worktreeDirty: version.worktreeDirty,
    datasetVersion: dataset.datasetVersion || dataset.version || 'unversioned',
    formulaVersion: formulaVersion || dataset.formulaVersion || 'unversioned',
    sourceTimestamp: options.sourceTimestamp || (process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString() : version.sourceTimestamp),
  };
  fs.writeFileSync(path.join(output, 'build-info.json'), JSON.stringify(metadata, null, 2) + '\n');
  const manifest = {
    schemaVersion: 1, ...metadata,
    files: filesBelow(output).map(file => ({
      path: path.relative(output, file).split(path.sep).join('/'),
      bytes: fs.statSync(file).size,
      sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    })),
  };
  fs.writeFileSync(path.join(output, 'artifact-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  if (!options.quiet) console.log(`Built ${manifest.files.length} files in dist/ (${version.softwareVersion}, ${commit.slice(0, 8)}).`);
  return manifest;
}
module.exports = { build, filesBelow };
if (require.main === module) build(path.resolve(__dirname, '..'));
