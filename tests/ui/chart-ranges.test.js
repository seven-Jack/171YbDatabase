import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAxisMaximum, hasFiniteRange } from '../../src/ui/chart-ranges.js';

test('blank axis maximum explicitly selects automatic range', () => {
  for (const raw of ['', '   ', '\t\n']) assert.equal(parseAxisMaximum(raw), null);
});

test('axis maximum accepts finite numbers strictly above the current minimum', () => {
  assert.equal(parseAxisMaximum(' 2.5 '), 2.5);
  assert.equal(parseAxisMaximum('1e3'), 1000);
  assert.equal(parseAxisMaximum('0.10000000000000002', { minimum: 0.1 }), 0.10000000000000002);
  assert.equal(parseAxisMaximum('1e-12'), 1e-12);
  assert.equal(parseAxisMaximum('1e12'), 1e12);
  assert.equal(parseAxisMaximum('20', { minimum: 12.5, maximum: 20 }), 20);
});

test('axis maximum rejects invalid text, nonfinite values, and limits outside the allowed interval', () => {
  for (const raw of ['-1', '0', '1e-320', '1e-13', 'NaN', 'Infinity', '-Infinity', '1e309', '12px', '1 2', '1.000000000001e12']) {
    assert.throws(() => parseAxisMaximum(raw), RangeError, raw);
  }
  for (const raw of ['0.1', '0.05']) {
    assert.throws(() => parseAxisMaximum(raw, { minimum: 0.1 }), RangeError, raw);
  }
  for (const options of [{ minimum: NaN }, { maximum: Infinity }, { minimum: 5, maximum: 5 }, { minimum: 6, maximum: 5 }]) {
    assert.throws(() => parseAxisMaximum('4', options), RangeError);
  }
});

test('finite range rejects equal, reversed, nonfinite, or overflowing spans', () => {
  assert.equal(hasFiniteRange(0, 1), true);
  assert.equal(hasFiniteRange(0.1, 0.10000000000000002), true);
  assert.equal(hasFiniteRange(12.5, 12.5), false);
  assert.equal(hasFiniteRange(12.5, 10), false);
  assert.equal(hasFiniteRange(0, Infinity), false);
  assert.equal(hasFiniteRange(NaN, 1), false);
  assert.equal(hasFiniteRange('0', 1), false);
  assert.equal(hasFiniteRange(-Number.MAX_VALUE, Number.MAX_VALUE), false);
});
