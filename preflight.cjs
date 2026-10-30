const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(html, /<!doctype html>/i, 'index.html must be an HTML document');
assert.match(html, /<html\s+lang="zh-CN"/i, 'set the page language');

const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML ids must be unique');

const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length > 0, 'the page should load its interaction scripts');
function checkModule(source, name) {
  const result = spawnSync(process.execPath, ['--check', '--input-type=module'], { input: source, encoding: 'utf8' });
  assert.equal(result.status, 0, `${name}: ${result.stderr}`);
}
for (const [index, script] of scripts.entries()) {
  const external = script[1].match(/\bsrc=["']([^"']+)["']/i);
  if (external) {
    assert(!/^https?:/.test(external[1]), 'production scripts must be local');
    assert(fs.existsSync(path.resolve(root, external[1])), `Missing script: ${external[1]}`);
  } else if (/type=["']module["']/.test(script[1])) {
    checkModule(script[2], `inline module ${index + 1}`);
  } else if (!/type=["'](?:application\/json|application\/ld\+json)["']/.test(script[1])) {
    new vm.Script(script[2], { filename: `index.html script ${index + 1}` });
  }
}
function scan(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? scan(file) : /\.js$/.test(file) ? [file] : [];
  });
}
const modules = scan(path.join(root, 'src'));
modules.forEach(file => checkModule(fs.readFileSync(file, 'utf8'), path.relative(root, file)));
console.log(`Preflight passed: ${ids.length} unique HTML ids, ${scripts.length} script entries, ${modules.length} production modules.`);
