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

function sourceFingerprint(root, sourceFiles = publicationFiles(root)) {
  // The browser jobs fetch dist and do not generate the source copy of version.js.
  const files = [
    ...sourceFiles.filter(file => relativePath(root, file) !== 'src/version.js'),
    ...buildInputs.map(name => path.join(root, name)).filter(file => fs.existsSync(file)),
  ];
  const hash = crypto.createHash('sha256');
  for (const file of files.sort()) {
    hash.update(relativePath(root, file) + '\0');
    hash.update(crypto.createHash('sha256').update(fs.readFileSync(file)).digest());
  }
  return hash.digest('hex');
}

module.exports = { filesBelow, publicationFiles, relativePath, sourceFingerprint };
