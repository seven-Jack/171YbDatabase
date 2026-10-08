// Layout offsets are illustrative SVG distances, never atomic energy data.
export const atomicStates = [
  { id: 'g', configuration: '6s²', multiplicity: 1, term: 'S', J: 0, I: .5 },
  { id: 'p', configuration: '6s6p', multiplicity: 3, term: 'P', J: 0, I: .5 },
  { id: 'r', configuration: '6s65s', multiplicity: 3, term: 'S', J: 1, I: .5, n: 65, L: 0, S: 1 },
];
export const hyperfineLevels = [
  { id: 'g-half', state: 'g', F: .5, baseY: 650 },
  { id: 'p-half', state: 'p', F: .5, baseY: 450 },
  { id: 'r-half', state: 'r', F: .5, baseY: 265 },
  { id: 'r-three', state: 'r', F: 1.5, baseY: 110 },
];
export const fraction = value => `${value < 0 ? '−' : '+'}${Math.abs(value) * 2}/2`;
export const magneticSublevels = hyperfineLevels.flatMap(level =>
  Array.from({ length: 2 * level.F + 1 }, (_, i) => {
    const mF = -level.F + i;
    return { id: `${level.id}-${i}`, state: level.state, level: level.id, F: level.F, mF,
      schematicOffset: -mF * 18, displayLabel: fraction(mF) };
  })
);
export const polarizations = { pi: { q: 0, label: 'π', dash: '' },
  'sigma+': { q: 1, label: 'σ⁺', dash: '9 6' },
  'sigma-': { q: -1, label: 'σ⁻', dash: '10 5 2 5' } };
export const transitions = Object.entries(polarizations).flatMap(([polarization, { q }]) =>
  magneticSublevels.flatMap(initial => magneticSublevels.filter(final =>
    ((initial.state === 'g' && final.state === 'p') || (initial.state === 'p' && final.state === 'r')) &&
    Math.abs(final.F - initial.F) <= 1 && !(final.F === 0 && initial.F === 0) &&
    final.mF - initial.mF === q
  ).map(final => ({ initial: initial.id, final: final.id, polarization, allowed: true,
    wavelength: initial.state === 'g' ? 578.42 : 302,
    approximate: true,
    type: initial.state === 'g' ? 'hyperfine-induced clock' : 'E1 Rydberg',
  })))
);

export function position(sublevel) {
  return { x: 675 + sublevel.mF * 160,
    y: hyperfineLevels.find(level => level.id === sublevel.level).baseY + sublevel.schematicOffset };
}
