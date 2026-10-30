const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const usage = `Usage:
  npm run sync -- plan
  npm run sync -- check
  npm run sync -- commit --message "Describe changes" --files file1 file2
  npm run sync -- commit --message "Describe changes" --staged
  npm run sync -- commit --message "Describe changes" --files file1 --dry-run
  npm run sync -- push
No command implicitly commits, pushes, merges or opens a pull request.`;

function parseArgs(args) {
  const result = { command: args[0] || 'plan', message: '', files: [], staged: false, dryRun: false };
  if (!['plan', 'check', 'commit', 'push'].includes(result.command)) throw new Error(usage);
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--message') { result.message = args[++i] || ''; }
    else if (args[i] === '--staged') result.staged = true;
    else if (args[i] === '--dry-run') result.dryRun = true;
    else if (args[i] === '--files') {
      while (i + 1 < args.length && !args[i + 1].startsWith('--')) result.files.push(args[++i]);
    } else throw new Error(`Unknown argument: ${args[i]}\n${usage}`);
  }
  if (result.command === 'commit') {
    if (!result.message.trim()) throw new Error('Commit requires --message.');
    if (result.staged === Boolean(result.files.length)) throw new Error('Choose exactly one scope: --files or --staged.');
  } else if (result.files.length || result.staged || result.message || result.dryRun) {
    throw new Error('Commit options are only accepted by the commit command.');
  }
  return result;
}

function validatePaths(root, files) {
  return [...new Set(files.map(file => {
    const relative = path.relative(root, path.resolve(root, file)).split(path.sep).join('/');
    if (!relative || relative.startsWith('../') || path.isAbsolute(relative) || /^(?:\.git|dist|node_modules|source_package|\.spark|skills)(?:\/|$)/.test(relative)) throw new Error(`Not a maintained file: ${file}`);
    const absolute = path.join(root, relative);
    if (fs.existsSync(absolute) && (!fs.lstatSync(absolute).isFile() || fs.lstatSync(absolute).isSymbolicLink())) throw new Error(`List exact regular files, not directories or symlinks: ${file}`);
    return relative;
  }))];
}

function main(args, directory = path.resolve(__dirname, '..')) {
  try {
    const options = parseArgs(args);
    const root = fs.realpathSync(directory);
    function run(command, commandArgs, capture = false, allowFailure = false) {
      const result = spawnSync(command, commandArgs, { cwd: root, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
      if ((result.error || result.status !== 0) && !allowFailure) throw new Error(result.stderr?.trim() || result.error?.message || `${command} failed; operation stopped.`);
      return capture ? result.stdout?.trim() || '' : result.status;
    }
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    if (options.command === 'plan') {
      run('git', ['status', '--short']);
      run('git', ['diff', '--stat']);
      console.log(usage);
      return;
    }
    if (options.command === 'check') { run(npm, ['run', 'check']); return; }
    if (options.command === 'commit') {
      let files;
      if (options.staged) {
        files = run('git', ['diff', '--cached', '--name-only', '--diff-filter=ACDMRT'], true).split('\n').filter(Boolean);
        if (!files.length) throw new Error('There are no staged files to commit.');
        validatePaths(root, files);
      } else {
        if (run('git', ['diff', '--cached', '--name-only'], true)) throw new Error('Existing staged changes: review them with --staged or unstage before selecting --files.');
        files = validatePaths(root, options.files);
        for (const file of files) {
          if (!fs.existsSync(path.join(root, file)) && run('git', ['ls-files', '--error-unmatch', '--', file], true, true) === '') throw new Error(`Unknown file: ${file}`);
        }
      }
      console.log('Exact commit scope:\n' + files.map(file => `  ${file}`).join('\n'));
      if (options.dryRun) { console.log('Dry run: nothing was staged, committed or pushed.'); return; }
      run(npm, ['run', 'check']);
      if (!options.staged) run('git', ['add', '--', ...files]);
      if (!run('git', ['diff', '--cached', '--name-only'], true)) throw new Error('Selected files have no changes.');
      run('git', ['diff', '--cached', '--stat']);
      run('git', ['commit', '-m', options.message]);
      console.log('Local commit created. Push is a separate explicit command.');
      return;
    }
    const branch = run('git', ['branch', '--show-current'], true);
    if (!branch) throw new Error('Cannot push a detached HEAD; select the reviewed branch first.');
    if (run('git', ['status', '--porcelain'], true)) throw new Error('Working tree has uncommitted changes; review and commit the intended scope before pushing.');
    run('git', ['fetch', 'origin']);
    const remoteBranch = `refs/remotes/origin/${branch}`;
    const exists = run('git', ['show-ref', '--verify', '--quiet', remoteBranch], false, true) === 0;
    run('git', ['merge-base', '--is-ancestor', exists ? remoteBranch : 'refs/remotes/origin/main', 'HEAD']);
    run('git', ['push', '--set-upstream', 'origin', `HEAD:refs/heads/${branch}`]);
    console.log(`Pushed reviewed branch ${branch}. No pull request or merge was created.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { parseArgs, validatePaths, main };
if (require.main === module) main(process.argv.slice(2));
