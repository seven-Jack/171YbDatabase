import {evidenceData} from './generated-evidence.js';

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

/** Public audit metadata is separate from canonical adopted atomic quantities. */
export const EVIDENCE = freeze(evidenceData);
export const EVIDENCE_VERSION = EVIDENCE.evidenceVersion;
export const getEvidenceRecord = transitionId => EVIDENCE.records.find(record => record.transitionId === transitionId) || null;
export const getEvidenceSource = sourceId => EVIDENCE.sources.find(source => source.id === sourceId) || null;
export const getEvidenceComparison = id => EVIDENCE.comparisons.find(comparison => comparison.id === id) || null;
