const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const publishEntries = ['index.html', 'src', 'data', 'assets'];
const buildInputs = [
  'package.json', 'build.cjs', 'scripts/build.cjs', 'scripts/artifact-files.cjs',
  'scripts/write-version.cjs',
];
const relativePath = (root, file) => path.relative(root, file).split(path.sep).join('/');

function filesBelow(directory, include = () => true) {
  return fs.readdirSync(directory).sort().flatMap(name => {
    const file = path.join(directory, name);
    return include(file) ? collect(file, include) : [];
  });
}

function collect(file, include) {
  const stat = fs.lstatSync(file);
  if (stat.isDirectory()) return filesBelow(file, include);
  if (!stat.isFile()) throw new Error('Publishing symlinks or non-regular files is not supported: ' + file);
  return [file];
}

function publicationFiles(root) {
  function include(file) {
    const name = path.basename(file);
    return name !== '.DS_Store' && !name.startsWith('._') &&
      !relativePath(root, file).startsWith('data/literature');
  }
  return publishEntries.flatMap(name => {
    const file = path.join(root, name);
    return fs.lstatSync(file, { throwIfNoEntry: false }) ? collect(file, include) : [];
  });
}

function sourceFingerprint(root, { publicationRoot = root, sourceFiles = publicationFiles(publicationRoot) } = {}) {
  // The browser jobs fetch dist and do not generate the source copy of version.js.
  const files = new Map(sourceFiles.map(file => [relativePath(publicationRoot, file), file]));
  files.delete('src/version.js');
  for (const name of buildInputs) {
    const file = path.join(root, name);
    if (fs.existsSync(file)) files.set(name, file);
  }
  const hash = crypto.createHash('sha256');
  for (const name of [...files.keys()].sort()) {
    hash.update(name + '\0');
    hash.update(crypto.createHash('sha256').update(fs.readFileSync(files.get(name))).digest());
  }
  return hash.digest('hex');
}

module.exports = { filesBelow, publicationFiles, relativePath, sourceFingerprint };
