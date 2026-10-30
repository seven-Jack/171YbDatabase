import test from 'node:test';
import assert from 'node:assert/strict';
import { wavelengthAppearance } from '../../src/ui/spectral-color.js';

const channels = hex => [1,3,5].map(i => parseInt(hex.slice(i,i+2),16));
test('visible transition colors follow wavelength instead of strength class', () => {
  const violet=channels(wavelengthAppearance(398.9108).color);
  const green=channels(wavelengthAppearance(555.8007).color);
  const yellow=channels(wavelengthAppearance(578.4196).color);
  const red=channels(wavelengthAppearance(649.0866).color);
  assert.ok(violet[2]>violet[1] && violet[0]>violet[1]);
  assert.ok(green[1]>green[0] && green[1]>green[2]);
  assert.ok(yellow[0]>200 && yellow[1]>170 && yellow[2]<50);
  assert.ok(red[0]>red[1] && red[0]>red[2]);
});
test('nonvisible transitions have explicit labels and non-spectral neutral colors', () => {
  assert.equal(wavelengthAppearance(301.87).region,'UV');
  assert.equal(wavelengthAppearance(1388.7629).region,'IR');
  assert.equal(wavelengthAppearance(770.1603).region,'visible');
  assert.equal(wavelengthAppearance(null).region,'unknown');
  assert.notEqual(wavelengthAppearance(301.87).dash,'');
});
