import { rydbergFLabel } from '../data/rydberg-series.js';

const display = transition => [
  String(transition.nu), transition.frequency_THz.toFixed(6),
  transition.wavelength_vac_nm.toFixed(6), transition.d_num.toExponential(6)
];

export function initRydbergSelection({ transitions, calculator, draw, onDraw, enterPolarizationDiagram }) {
  const form = document.getElementById('rydbergSelection');
  const nInput = document.getElementById('rydbergN');
  const nuInput = document.getElementById('rydbergNu');
  const nuChoices = document.getElementById('rydbergNuChoices');
  const inputMessage = document.getElementById('rydbergInputMessage');
  const fInput = document.getElementById('rydbergFp');
  const activeBranch = document.getElementById('rydbergActiveBranch');
  const title = document.getElementById('rydbergDetailsTitle');
  const pairRows = document.getElementById('rydbergPairRows');
  const allRows = document.getElementById('rydbergAllRows');
  const search = document.getElementById('rydbergSearch');
  const count = document.getElementById('rydbergSearchCount');
  const fullTable = document.getElementById('rydbergSeriesTable');
  const legacyContext = document.getElementById('rydbergLegacyContext');
  const byId = new Map(transitions.map(transition => [transition.id, transition]));
  const byN = Map.groupBy(transitions, transition => transition.n);
  const byF = Map.groupBy(transitions, transition => transition.Fp);
  const lookup = (n, Fp) => byN.get(n)?.find(row => row.Fp === Fp);
  let active;
  let jumpTimer;
  const cancelJump = () => clearTimeout(jumpTimer);

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

  function syncControls(transition) {
    if (nuChoices.dataset.fp !== String(transition.Fp)) {
      const options = byF.get(transition.Fp).map(branch => new Option(`n = ${branch.n}`, String(branch.nu)));
      nuChoices.replaceChildren(...options);
      nuChoices.dataset.fp = String(transition.Fp);
    }
    nInput.value = transition.n;
    nuInput.value = transition.nu;
    fInput.value = transition.Fp;
    inputMessage.textContent = '';
    nuInput.removeAttribute('aria-invalid');
    nInput.removeAttribute('aria-invalid');
  }

  function show(transition) {
    if (!transition || active === transition) return;
    syncControls(transition);
    active = transition;
    title.textContent = `${transition.n}S 零场分支`;
    const sign = transition.d_num > 0 ? '+' : '';
    activeBranch.textContent = `选中 F′=${rydbergFLabel(transition.Fp)} · ${transition.branchLabel} · E1 允许 · D_F = ${sign}${transition.d_num.toExponential(6)} ea₀`;
    const pair = byN.get(transition.n);
    if (pairRows.dataset.n !== String(transition.n)) {
      pairRows.innerHTML = pair.map(item => row(item, true)).join('');
      pairRows.dataset.n = transition.n;
    }
    for (const button of document.querySelectorAll('button[data-rydberg-id]')) {
      button.setAttribute('aria-pressed', String(button.dataset.rydbergId === transition.id));
    }
    // Draw the common nS level at the 2:4 weighted center of the two branches.
    const centroid = pair.reduce((sum, branch) => sum + (2 * branch.Fp + 1) * branch.upperEnergy_eV, 0) / 6;
    draw({ ...transition, upper: `6s${transition.n}s · F′=1/2, 3/2`, upperEnergy_eV: centroid });
    onDraw?.();
  }

  function choose(transition) {
    if (!transition) return;
    if (active === transition) syncControls(transition);
    else show(transition);
    if (calculator.getState().transition?.id !== transition.id) calculator.loadTransition(transition);
  }

  function readControl(input, committed) {
    const fp = Number(fInput.value);
    const branch = input === nuInput
      ? byF.get(fp).find(row => row.nu === nuInput.valueAsNumber)
      : lookup(nInput.valueAsNumber, fp);
    if (branch) {
      choose(branch);
      return branch;
    }
    const message = input === nuInput
      ? `请选择 F′=${rydbergFLabel(fp)} 下已收录的 ν。当前图谱仍为 ${active.n}S。`
      : `请输入 29 到 100 的整数。当前图谱仍为 ${active.n}S。`;
    inputMessage.textContent = committed ? message : '';
    if (committed) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
  function commitInput(input) {
    cancelJump();
    if (readControl(input, true)) enterPolarizationDiagram();
  }
  for (const input of [nInput, nuInput]) {
    input.addEventListener('input', event => {
      cancelJump();
      if (event.isComposing || !readControl(input, false)) return;
      // Allow another digit or a correction before moving keyboard focus.
      jumpTimer = setTimeout(() => {
        if (document.activeElement === input) enterPolarizationDiagram();
      }, 500);
    });
    input.addEventListener('blur', cancelJump);
    input.addEventListener('change', () => readControl(input, true));
    input.addEventListener('keydown', event => {
      if (event.isComposing) return;
      if (event.key === 'Escape') {
        cancelJump();
        syncControls(active);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        commitInput(input);
      }
    });
  }
  fInput.addEventListener('change', () => choose(lookup(active.n, Number(fInput.value))));
  form.addEventListener('submit', event => {
    event.preventDefault();
    commitInput(document.activeElement === nuInput ? nuInput : nInput);
  });
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
  let calculationTransition = calculator.getState().transition;
  calculator.onChange(state => {
    const calculationChanged = state.transition !== calculationTransition;
    calculationTransition = state.transition;
    if (calculationChanged) cancelJump();
    legacyContext.hidden = calculationTransition?.id !== 'R2';
    const selected = byId.get(selectionId(state));
    if (!legacyContext.hidden && selected) {
      legacyContext.textContent = `当前 Rabi 使用旧 R2 参数，历史标度估算 λ = ${state.transition.wavelength_vac_nm} nm。本表为 R017 零场 F′=${rydbergFLabel(selected.Fp)}，λ = ${selected.wavelength_vac_nm.toFixed(6)} nm。选择表中分支可切换计算。`;
    }
    // A load or restore replaces the transition snapshot even for the same branch.
    if (calculationChanged && selected && selected === active) syncControls(selected);
    else show(selected);
  });
  return selectionId;
}
