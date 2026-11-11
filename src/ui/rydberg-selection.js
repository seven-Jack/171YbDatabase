import { rydbergFLabel } from '../data/rydberg-series.js';

const display = transition => [
  transition.nu.toFixed(8), transition.frequency_THz.toFixed(6),
  transition.wavelength_vac_nm.toFixed(6), transition.d_num.toExponential(6)
];

export function initRydbergSelection({ transitions, calculator, draw, onDraw }) {
  const form = document.getElementById('rydbergSelection');
  const nInput = document.getElementById('rydbergN');
  const fInput = document.getElementById('rydbergFp');
  const title = document.getElementById('rydbergDetailsTitle');
  const pairRows = document.getElementById('rydbergPairRows');
  const allRows = document.getElementById('rydbergAllRows');
  const search = document.getElementById('rydbergSearch');
  const count = document.getElementById('rydbergSearchCount');
  const fullTable = document.getElementById('rydbergSeriesTable');
  const legacyContext = document.getElementById('rydbergLegacyContext');
  const byId = new Map(transitions.map(transition => [transition.id, transition]));
  const byN = Map.groupBy(transitions, transition => transition.n);
  const lookup = (n, Fp) => byN.get(n)?.find(row => row.Fp === Fp);
  let active;

  function row(transition, pair = false) {
    const f = rydbergFLabel(transition.Fp);
    const label = pair ? `F′=${f}` : `${transition.n}S · F′=${f}`;
    const pressed = String(active?.id === transition.id);
    return `<tr><th scope="row"><button type="button" data-rydberg-id="${transition.id}" aria-pressed="${pressed}">${label}</button></th>
      ${display(transition).map(value => `<td>${value}</td>`).join('')}</tr>`;
  }

  function renderTable() {
    const query = search.value.trim().toLowerCase();
    const n = /^\d{2,3}s?$/.test(query) ? Number.parseInt(query, 10) : NaN;
    const filtered = byN.get(n) ?? transitions.filter(transition => {
      const [, frequency, wavelength] = display(transition);
      return frequency.includes(query) || wavelength.includes(query);
    });
    allRows.innerHTML = filtered.map(transition => row(transition)).join('');
    count.textContent = `${filtered.length} 条分支`;
  }

  function show(transition) {
    if (!transition || active === transition) return;
    active = transition;
    nInput.value = transition.n;
    fInput.value = transition.Fp;
    title.textContent = `${transition.n}S 零场分支`;
    const pair = byN.get(transition.n);
    if (pairRows.dataset.n !== String(transition.n)) {
      pairRows.innerHTML = pair.map(item => row(item, true)).join('');
      pairRows.dataset.n = transition.n;
    }
    for (const button of document.querySelectorAll('button[data-rydberg-id]')) {
      button.setAttribute('aria-pressed', String(button.dataset.rydbergId === transition.id));
    }
    draw(transition);
    onDraw?.();
  }

  function choose(transition) {
    if (!transition) return;
    show(transition);
    if (calculator.getState().transition?.id !== transition.id) calculator.loadTransition(transition);
  }
  function readControls() {
    if (nInput.reportValidity()) choose(lookup(nInput.valueAsNumber, Number(fInput.value)));
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    readControls();
  });
  form.addEventListener('change', readControls);
  for (const body of [pairRows, allRows]) body.addEventListener('click', event => {
    const button = event.target.closest('button[data-rydberg-id]');
    if (button) choose(byId.get(button.dataset.rydbergId));
  });
  search.addEventListener('input', renderTable);
  fullTable.addEventListener('toggle', () => {
    if (fullTable.open && !allRows.hasChildNodes()) renderTable();
  });

  show(lookup(nInput.valueAsNumber, Number(fInput.value)));
  const selectionId = state => state.transition?.id === 'R2'
    ? lookup(65, state.F_upper)?.id : state.transition?.id;
  calculator.onChange(state => {
    legacyContext.hidden = state.transition?.id !== 'R2';
    show(byId.get(selectionId(state)));
  });
  return selectionId;
}
