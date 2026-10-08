const fs = require('node:fs');
const path = require('node:path');

const output = path.join(__dirname, 'dist');
fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(output, 'index.html'));
fs.cpSync(path.join(__dirname, 'assets'), path.join(output, 'assets'), { recursive: true });
console.log('Built dist/index.html');
