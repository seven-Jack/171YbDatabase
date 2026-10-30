import fs from 'node:fs';
import {createHash} from 'node:crypto';

/**
 * Original papers are local research evidence, not repository dependencies.
 * Missing bytes are explicitly unavailable, never a successful hash check.
 * Present but changed bytes always fail, including in a checkout without papers.
 */
export function verifyLocalEvidence(root,source) {
  const identity={sourceId:source.sourceId||source.id||null,
    localPath:source.localPath,expectedSha256:source.sha256};
  let bytes;
  try {
    bytes=fs.readFileSync(new URL(source.localPath,root));
  } catch(error) {
    if(error.code!=='ENOENT')throw error;
    return {...identity,status:'unavailable',verified:false,sha256:null,unchanged:null,
      reason:'Original file is absent from this checkout; its bytes have not been verified.'};
  }
  const actual=createHash('sha256').update(bytes).digest('hex');
  if(actual!==source.sha256)throw Error(`Local evidence SHA-256 mismatch: ${source.localPath}`);
  return {...identity,status:'verified',verified:true,sha256:actual,unchanged:true};
}
