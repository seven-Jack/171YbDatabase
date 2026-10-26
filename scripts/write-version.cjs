const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function gitValue(root, args, fallback) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : fallback;
}
function readVersion(root) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  return {
    softwareVersion: pkg.version,
    appCommit: gitValue(root, ['rev-parse', 'HEAD'], 'unversioned'),
    worktreeDirty: Boolean(gitValue(root, ['status', '--porcelain'], '')),
    sourceTimestamp: gitValue(root, ['show', '-s', '--format=%cI', 'HEAD'], null),
  };
}
function writeVersion(root) {
  const version = readVersion(root);
  const output = path.join(root, 'src', 'version.js');
  const source = '// Generated from package.json and local Git metadata; do not edit.\n'
    + `export const SOFTWARE_VERSION = ${JSON.stringify(version.softwareVersion)};\n`
    + `export const APP_COMMIT = ${JSON.stringify(version.appCommit)};\n`
    + `export const WORKTREE_DIRTY = ${JSON.stringify(version.worktreeDirty)};\n`;
  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== source) fs.writeFileSync(output, source);
  return version;
}
module.exports = { readVersion, writeVersion };
if (require.main === module) {
  const version = writeVersion(path.resolve(__dirname, '..'));
  console.log(`Generated src/version.js from package ${version.softwareVersion}, ${version.appCommit.slice(0, 8)}${version.worktreeDirty ? ' + local changes' : ''}.`);
}
