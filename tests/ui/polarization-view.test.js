import test from 'node:test';
import assert from 'node:assert/strict';
import { syncPolarizationView } from '../../src/ui/hyperfine-diagram.js';

function controls() {
  return ['pi', 'sigmap', 'sigmam'].map(pol => ({
    dataset: { pol }, active: false, attributes: {},
    classList: { toggle(name, value) { this.owner.active = value; } },
    setAttribute(name, value) { this.attributes[name] = value; },
  })).map(button => { button.classList.owner = button; return button; });
}
test('every polarization keeps visual selection, pressed state and ΔmF rule coherent', () => {
  const buttons = controls(), rule = {};
  for (const [pol, delta] of [['pi', '0'], ['sigmap', '+1'], ['sigmam', '−1'], ['pi', '0']]) {
    syncPolarizationView(buttons, rule, pol);
    assert.equal(buttons.filter(button => button.active).length, 1);
    for (const button of buttons) {
      assert.equal(button.active, button.dataset.pol === pol);
      assert.equal(button.attributes['aria-pressed'], String(button.dataset.pol === pol));
    }
    assert.equal(rule.innerHTML, 'Δm<sub>F</sub> = ' + delta);
  }
});
test('unknown polarization is rejected before changing the view', () => {
  const buttons = controls(), rule = { innerHTML: 'unchanged' };
  assert.throws(() => syncPolarizationView(buttons, rule, 'unknown'), RangeError);
  assert.equal(rule.innerHTML, 'unchanged');
  assert.ok(buttons.every(button => !button.active));
});
