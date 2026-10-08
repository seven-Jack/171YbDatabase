const fs = require('node:fs');
const path = require('node:path');

const output = path.join(__dirname, 'dist');
fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(output, 'index.html'));
console.log('Built dist/index.html');
