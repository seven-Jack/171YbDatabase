export function initPageControls(HYPERFINE_DATA) {
  document.querySelectorAll("[data-hfs-a]").forEach(el=>{el.textContent=String(HYPERFINE_DATA[el.dataset.hfsA].A);});
  // Background changes are independent of the selected line palette and physics.
  const opticalStage = document.querySelector('.diagram-wrap[data-canvas-theme]');
  document.querySelectorAll('[data-canvas-tone]').forEach(button => {
    button.addEventListener('click', () => {
      if (!opticalStage || !['silver', 'deep'].includes(button.dataset.canvasTone)) return;
      opticalStage.dataset.canvasTheme = button.dataset.canvasTone;
      document.querySelectorAll('[data-canvas-tone]').forEach(option => {
        option.setAttribute('aria-pressed', String(option === button));
      });
      opticalStage.dispatchEvent(new CustomEvent('canvas-theme-change'));
    });
  });
// ===== Changelog toggle =====
(function() {
  const panel = document.getElementById('changelogPanel');
  const header = panel && panel.querySelector('.changelog-header');
  if (!header) return;
  function togglePanel() {
    const open = panel.classList.toggle('open');
    header.setAttribute('aria-expanded', String(open));
    const icon = header.querySelector('.changelog-icon');
    if (icon) icon.textContent = open ? '▼' : '▶';
  }
  header.addEventListener('click', togglePanel);
  header.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      togglePanel();
    }
  });
})();

// ===== Calc-note toggle (计算口径折叠) =====
(function() {
  const panel = document.getElementById('calcNotePanel');
  const header = panel && panel.querySelector('.calc-note-header');
  if (!header) return;
  function togglePanel() {
    const open = panel.classList.toggle('open');
    header.setAttribute('aria-expanded', String(open));
    const icon = header.querySelector('.calc-note-icon');
    if (icon) icon.textContent = open ? '▼' : '▶';
  }
  header.addEventListener('click', togglePanel);
  header.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      togglePanel();
    }
  });
})();



(function() {
  const dialog = document.getElementById('rabiFormulaDialog');
  const trigger = document.getElementById('rabiFormulaOpen');
  let savedOverflow = '';
  trigger.addEventListener('click', function() {
    savedOverflow = document.body.style.overflow;
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('rabiFormulaClose').addEventListener('click', function() { dialog.close(); });
  dialog.addEventListener('click', function(event) {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', function() {
    document.body.style.overflow = savedOverflow;
    trigger.focus({ preventScroll: true });
  });
})();
(function() {
  const hfs = HYPERFINE_DATA['65³S₁'];
  document.getElementById('ryd65HyperfineRows').innerHTML = hfs.levels.map(l => `<tr><td>³S₁${l.F === .5 ? '关联' : ''}，F=${l.F === .5 ? '1/2' : '3/2'}</td><td>${l.nu.toFixed(10)}</td><td>${l.energyGHz.toFixed(9)}</td><td>${l.shift > 0 ? '+' : '−'}${Math.abs(l.shift).toFixed(6)}</td></tr>`).join('');
  document.getElementById('ryd65HyperfineSummary').innerHTML = `两支间隔 ΔE/h = +${hfs.splitting.toFixed(6)} MHz；A<sub>hfs</sub><sup>eff</sup> = +${hfs.A.toFixed(6)} MHz；所选两支重心 ē = ${hfs.centroidGHz.toFixed(9)} GHz。`;
})();

}
