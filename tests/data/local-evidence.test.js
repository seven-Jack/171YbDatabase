import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {verifyLocalEvidence} from '../../scripts/local-evidence.mjs';

const original=Buffer.from('%PDF-local research evidence fixture\n');
const sha256=createHash('sha256').update(original).digest('hex');
function fixture(t) {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'yb-local-evidence-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  return {directory,root:pathToFileURL(directory+path.sep),
    source:{id:'source-test',localPath:'paper.pdf',sha256}};
}

test('an absent local original is unavailable and cannot be reported as verified',t=>{
  const {root,source}=fixture(t);
  const result=verifyLocalEvidence(root,source);
  assert.equal(result.status,'unavailable');
  assert.equal(result.verified,false);
  assert.equal(result.sha256,null);
  assert.equal(result.unchanged,null);
  assert.equal(result.expectedSha256,sha256);
  assert.match(result.reason,/not been verified/);
});

test('a present original with matching bytes is verified against the recorded fingerprint',t=>{
  const {directory,root,source}=fixture(t);
  fs.writeFileSync(path.join(directory,'paper.pdf'),original);
  const result=verifyLocalEvidence(root,source);
  assert.equal(result.status,'verified');
  assert.equal(result.verified,true);
  assert.equal(result.unchanged,true);
  assert.equal(result.sha256,sha256);
  assert.equal(result.sourceId,'source-test');
});

test('a changed local original fails rather than being treated as absent or accepted',t=>{
  const {directory,root,source}=fixture(t);
  fs.writeFileSync(path.join(directory,'paper.pdf'),Buffer.from('%PDF-changed evidence\n'));
  assert.throws(()=>verifyLocalEvidence(root,source),/SHA-256 mismatch: paper\.pdf/);
});
