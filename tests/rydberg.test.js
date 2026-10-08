import test from 'node:test';
import assert from 'node:assert/strict';
import { atomicStates, hyperfineLevels, magneticSublevels as states, transitions, position } from '../assets/rydberg-data.js';

test('three electronic states, four F groups, ten distinct magnetic sublevels', () => {
  assert.equal(atomicStates.length, 3);
  assert.equal(hyperfineLevels.length, 4);
  assert.equal(states.length, 10);
  assert.equal(new Set(states.map(s => s.id)).size, 10);
  assert.deepEqual(hyperfineLevels.map(l => states.filter(s => s.level === l.id).map(s => s.mF)),
    [[-.5, .5], [-.5, .5], [-.5, .5], [-1.5, -.5, .5, 1.5]]);
  for (const level of hyperfineLevels) {
    const members = states.filter(s => s.level === level.id);
    assert.equal(new Set(members.map(s => position(s).y)).size, members.length);
    assert.ok(members.every((s, i) => !i || position(s).x > position(members[i - 1]).x));
  }
  assert.ok(Math.max(...states.filter(s => s.level === 'r-three').map(s => position(s).y)) <
    Math.min(...states.filter(s => s.level === 'r-half').map(s => position(s).y)));
});

const expected = {
  pi: ['g-half-0>p-half-0', 'g-half-1>p-half-1', 'p-half-0>r-half-0', 'p-half-1>r-half-1', 'p-half-0>r-three-1', 'p-half-1>r-three-2'],
  'sigma+': ['g-half-0>p-half-1', 'p-half-0>r-half-1', 'p-half-0>r-three-2', 'p-half-1>r-three-3'],
  'sigma-': ['g-half-1>p-half-0', 'p-half-1>r-half-0', 'p-half-1>r-three-1', 'p-half-0>r-three-0'],
};
for (const [pol, pairs] of Object.entries(expected)) test(`${pol}: exact allowed channels and upward direction`, () => {
  const selected = transitions.filter(t => t.polarization === pol);
  assert.deepEqual(selected.map(t => `${t.initial}>${t.final}`).sort(), pairs.sort());
  for (const t of selected) {
    const a = states.find(s => s.id === t.initial), b = states.find(s => s.id === t.final);
    assert.equal(b.mF - a.mF, { pi: 0, 'sigma+': 1, 'sigma-': -1 }[pol]);
    assert.ok(Math.abs(b.F - a.F) <= 1);
    assert.ok(position(b).y < position(a).y);
    assert.equal(t.wavelength, a.state === 'g' ? 578.42 : 302);
    assert.ok(t.allowed);
    assert.ok(!(a.state === 'g' && b.state === 'r'));
  }
});
