const { spawnSync } = require('node:child_process');

process.chdir(__dirname);
function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (result.error || result.status !== 0) {
    if (capture && result.stderr) process.stderr.write(result.stderr);
    console.error(result.error?.message || `${command} failed; sync stopped.`);
    process.exit(result.status || 1);
  }
  return result.stdout?.trim();
}

const message = process.argv.slice(2).join(' ').trim();
if (!message) {
  console.error('Usage: npm run sync -- "Describe your changes"');
  process.exit(1);
}
if (run('git', ['branch', '--show-current'], true) !== 'main') {
  console.error('Sync expects main. Switch to main or use your branch review workflow.');
  process.exit(1);
}
if (run('git', ['diff', '--cached', '--name-only'], true)) {
  console.error('There are already staged changes. Commit or unstage them before using sync.');
  process.exit(1);
}
run('git', ['fetch', 'origin']);
run('git', ['merge-base', '--is-ancestor', 'origin/main', 'HEAD']);
run(process.execPath, ['preflight.cjs']);
run(process.execPath, ['build.cjs']);
// Only stage the maintained site and publishing files, never local archives.
run('git', ['add', '--', 'index.html', 'README.md', 'package.json',
  'package-lock.json', '.gitignore', 'build.cjs', 'preflight.cjs',
  'sync.cjs', 'wrangler.jsonc', '.github/workflows/pages.yml']);
if (run('git', ['diff', '--cached', '--name-only'], true)) {
  run('git', ['commit', '-m', message]);
}
run('git', ['push', 'origin', 'main']);
console.log('GitHub sync complete. Follow the Publish website run in GitHub Actions for deployment status.');
