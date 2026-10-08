import { atomicStates, hyperfineLevels, magneticSublevels, transitions, polarizations, position } from './rydberg-data.js';

const svg = document.getElementById('rydbergResolvedDiagram');
const ns = 'http://www.w3.org/2000/svg';
function el(tag, attributes = {}, parent = svg, text) {
  const node = document.createElementNS(ns, tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  if (text !== undefined) node.textContent = text;
  parent.append(node);
  return node;
}
function label(x, y, text, className, parent = svg) {
  return el('text', { x, y, class: className }, parent, text);
}
function subscript(parent, content) { el('tspan', { 'baseline-shift': 'sub', 'font-size': '70%' }, parent, content); }
el('title', { id: 'rdSvgTitle' }, svg, '¹⁷¹Yb hyperfine- and mF-resolved Rydberg transitions');
el('desc', { id: 'rdSvgDesc' }, svg, 'Ten magnetic sublevels, four hyperfine groups. Schematic positions, not calculated energies. At zero external field, mF states within each F multiplet are degenerate. F=3/2 is placed above F=1/2 for illustration. Arrows show allowed channels, not relative strengths.');
const defs = el('defs');
for (const [id, color] of [...Object.entries(polarizations).map(([key, pol]) => [key, pol.color]), ['energy', '#7d88a0']]) {
  const marker = el('marker', { id: `rd-${id}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, defs);
  el('path', { d: 'M 0 0 L 10 5 L 0 10 Z', fill: color }, marker);
}
el('path', { d: 'M 65 677 V 55', stroke: '#5a6580', 'stroke-width': 1.5, 'marker-end': 'url(#rd-energy)', fill: 'none' });
el('text', { transform: 'translate(42 390) rotate(-90)', fill: '#7d88a0', 'font-size': 16 }, svg, 'Energy');
for (const y of [345, 550]) el('path', { d: `M 58 ${y + 6} l 14 -8 m -14 15 l 14 -8`, stroke: '#7d88a0', 'stroke-width': 1.5 });

// Draw every arrow once; polarization changes visibility only, never layout.
const arrowNodes = [];
for (const transition of transitions) {
  const initial = magneticSublevels.find(s => s.id === transition.initial);
  const final = magneticSublevels.find(s => s.id === transition.final);
  const a = position(initial), b = position(final);
  const upper = final.level === 'r-three';
  const side = transition.polarization === 'pi' ? -1 : 1;
  const offset = (upper ? side : -side) * 39;
  const d = `M ${a.x} ${a.y - 5} L ${b.x + offset} ${b.y + 5}`;
  const pol = polarizations[transition.polarization];
  const group = el('g', { 'data-polarization': transition.polarization, 'data-initial': initial.id, 'data-final': final.id });
  el('title', {}, group, `${transition.type}: F=${initial.F}, mF=${initial.mF} → F=${final.F}, mF=${final.mF}; ≈${transition.wavelength} nm; ${polarizations[transition.polarization].label}`);
  el('path', { d, class: 'rd-arrow', stroke: pol.color, 'stroke-dasharray': pol.dash, 'marker-end': `url(#rd-${transition.polarization})` }, group);
  arrowNodes.push({ group, transition });
}
for (const state of atomicStates) {
  const y = state.id === 'r' ? 175 : state.id === 'p' ? 455 : 655;
  const text = label(108, y, `${state.configuration} `, 'rd-state');
  el('tspan', { 'baseline-shift': 'super', 'font-size': '70%' }, text, state.multiplicity);
  el('tspan', {}, text, state.term); subscript(text, state.J);
}
for (const level of hyperfineLevels) {
  const members = magneticSublevels.filter(s => s.level === level.id);
  const ys = members.map(s => position(s).y);
  const top = Math.min(...ys) - 12, bottom = Math.max(...ys) + 12;
  el('path', { d: `M 395 ${top} h -10 V ${bottom} h 10`, fill: 'none', stroke: '#5a6580' });
  label(290, level.baseY + 6, `F = ${level.F * 2}/2`, 'rd-group');
  for (const member of members) {
    const { x, y } = position(member);
    const group = el('g', { 'data-sublevel': member.id });
    el('line', { x1: x - 43, x2: x + 43, y1: y, y2: y, class: 'rd-level' }, group);
    const text = el('text', { x, y: y + 29, 'text-anchor': 'middle', class: 'rd-mf' }, group, 'm');
    el('tspan', { 'baseline-shift': 'sub', 'font-size': '70%' }, text, 'F');
    el('tspan', {}, text, ` = ${member.displayLabel}`);
  }
}
label(980, 345, '≈302 nm', 'rd-group');
label(980, 365, 'E1', 'rd-note');
label(900, 560, '≈578.42 nm', 'rd-group');
label(900, 580, 'Hyperfine-induced clock', 'rd-note');
label(108, 715, 'Schematic mF splitting · not to scale', 'rd-note');
label(108, 738, '零外磁场下，同一 F 内的 mF 态简并；图示分离与 F 排序仅用于布局。箭头不表示相同强度。', 'rd-note');

function selectPolarization(key) {
  arrowNodes.forEach(({ group, transition }) => { group.style.display = transition.polarization === key ? '' : 'none'; });
  document.querySelectorAll('[data-rd-pol]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.rdPol === key)));
  document.getElementById('rdStatus').textContent = `${polarizations[key].label}: ${transitions.filter(t => t.polarization === key).length} allowed transitions`;
}
document.querySelectorAll('[data-rd-pol]').forEach(button => button.addEventListener('click', () => selectPolarization(button.dataset.rdPol)));
selectPolarization('pi');

const tabs = [document.getElementById('rdTabResolved'), document.getElementById('rdTabOverview')];
function selectView(selected) {
  tabs.forEach(tab => {
    const active = tab === selected;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectView(tab));
  tab.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[1] : tabs[1 - index];
      selectView(next); next.focus();
    }
  });
});
