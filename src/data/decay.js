import {decayData} from './generated-decay.js';

function freeze(value) {
  if (value && typeof value==='object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

/** Adopted branch metadata is independent of calculator inputs and physics formulas. */
export const DECAY=freeze(decayData);
export const DECAY_VERSION=DECAY.decayVersion;
export const getDecayRecord=levelId=>DECAY.records.find(record=>record.levelId===levelId)||null;
export const getDecaySource=sourceId=>DECAY.sources.find(source=>source.id===sourceId)||null;
