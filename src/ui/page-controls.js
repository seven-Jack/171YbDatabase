export function initPageControls(HYPERFINE_DATA) {
  document.querySelectorAll("[data-hfs-a]").forEach(el=>{el.textContent=String(HYPERFINE_DATA[el.dataset.hfsA].A);});
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



// ===== Step-by-step guide: jump + progress (v5.3, merged to 3 steps in v5.4) =====
(function() {
  var targets = { 1: '#secLevel', 2: '#secCalc', 3: '#secRabi' };

  // Step cards jump to their section
  document.querySelectorAll('.flow-step').forEach(function(el) {
    function jumpToSection() {
      var t = document.querySelector(targets[el.dataset.gstep]);
      if (t) t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth', block: 'start' });
    }
    el.addEventListener('click', jumpToSection);
    el.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        jumpToSection();
      }
    });
  });

  var done = {};
  function markDone(n) {
    if (done[n]) return;
    done[n] = true;
    var card = document.querySelector('.flow-step[data-gstep="' + n + '"]');
    if (card) {
      card.classList.add('done');
      var num = card.querySelector('.fs-num');
      if (num) num.textContent = '✓';
    }
    // Step 1 has two section chips (core level diagram + rydberg diagram) — light all
    document.querySelectorAll('.guide-sub[data-gstep="' + n + '"]').forEach(function(chip) {
      chip.classList.add('done');
    });
  }

  // Clicking a transition in either diagram = chose a transition (step 1),
  // auto-filled params (step 2) and refreshed Rabi-P charts (step 3)
  document.addEventListener('click', function(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('.transition-line')) { markDone(1); markDone(2); markDone(3); }
    if (t.closest('.ryd-transition-line')) { markDone(1); markDone(2); markDone(3); }
  }, true);

  // Interacting with calc / rabi-viz controls also counts as progress
  function inSection(e, sel) {
    var t = e.target;
    return t && t.closest && t.closest(sel + ' select, ' + sel + ' input, ' + sel + ' button, ' + sel + ' canvas, ' + sel + ' .cg-table tbody tr, ' + sel + ' .trans-lines-wrap');
  }
  ['change', 'input'].forEach(function(ev) {
    document.addEventListener(ev, function(e) {
      if (inSection(e, '.hf-calc-section')) markDone(2);
      if (inSection(e, '.rabi-viz-section')) markDone(3);
    });
  });
  document.addEventListener('click', function(e) {
    if (inSection(e, '.hf-calc-section')) markDone(2);
    if (inSection(e, '.rabi-viz-section')) markDone(3);
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
