import {CATALOG, getQuantity} from '../data/catalog.js';

const CENTROID_CONVENTION = 'hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)';

function zeroFieldOffset(id, channel, reference) {
  if (id !== 'T2' || reference !== 'hyperfine-centroid' || !channel) return null;
  const lower = CATALOG.hyperfine.states['¹S₀'];
  const upper = CATALOG.hyperfine.states['³P₁'];
  const lowerShift = lower.legacy.levels.find(level => level.F === channel.F)?.shift;
  const upperShift = upper.legacy.levels.find(level => level.F === channel.Fp)?.shift;
  if (!Number.isFinite(lowerShift) || !Number.isFinite(upperShift)) return null;
  return {
    value:upperShift-lowerShift, unit:'MHz', F:channel.F, Fp:channel.Fp,
    sourceId:upper.sourceId,
    sourceLocator:[lower.sourceLocator,upper.sourceLocator].join(' · '),
    convention:'Zero-field transition frequency relative to the hyperfine centroid, upper minus lower energy shifts divided by h',
  };
}

/** Use the saved wavelength, with a separate offset only for an explicitly supported channel. */
export function getTransitionWavelength(id, channel) {
  const quantity = getQuantity(id,'wavelength_vac_nm');
  const convention = quantity?.convention ?? null;
  const conditions = quantity?.conditions ?? null;
  const reference = convention === CENTROID_CONVENTION ? 'hyperfine-centroid'
    : conditions?.nuReference && Number.isFinite(conditions.Fp) ? 'model-branch'
    : quantity?.evidenceKind === 'scaling-estimate' ? 'historical-estimate'
    : null;
  return {
    value:quantity?.value ?? null, unit:quantity?.unit ?? null,
    sourceId:quantity?.sourceId ?? null, sourceLocator:quantity?.sourceLocator ?? null,
    evidenceKind:quantity?.evidenceKind ?? null, uncertainty:quantity?.uncertainty ?? null,
    reference, convention, conditions, reviewStatus:quantity?.reviewStatus ?? null,
    uncertaintyNote:quantity?.uncertaintyNote ?? null, sourceConflict:conditions?.sourceConflict ?? null,
    zeroFieldOffset:zeroFieldOffset(id,channel,reference),
  };
}

export function wavelengthLabel(wavelength) {
  return {
    'hyperfine-centroid':'真空重心波长',
    'model-branch':'零场分支真空波长',
    'historical-estimate':'估算真空波长',
  }[wavelength?.reference] || '真空波长';
}

export function formatZeroFieldOffset(offset) {
  if (!offset) return null;
  const sign = offset.value < 0 ? '−' : offset.value > 0 ? '+' : '';
  return `${sign}${Math.abs(offset.value)} ${offset.unit}`;
}
