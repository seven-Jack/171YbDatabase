const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert.match(html, /<!doctype html>/i, 'index.html must be an HTML document');
assert.match(html, /<html\s+lang="zh-CN"/i, 'set the page language');

const markup = html.split(/<script\b/i, 1)[0];
const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML ids must be unique');

const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length > 0, 'the page should contain its interaction scripts');
scripts.forEach((match, index) => new vm.Script(match[1], { filename: `index.html script ${index + 1}` }));

console.log(`Preflight passed: ${ids.length} unique ids, ${scripts.length} scripts with valid syntax.`);
