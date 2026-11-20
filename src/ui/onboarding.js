const storageKey = 'yb171.onboarding.556.v1';
const exampleChannel = '0.5|0.5|1.5|1.5|1';
const lineSelector = '#levelDiagram .transition-line[data-id="T2"]';
const channelHitSelector = `#hfTransLines [data-channel-key="${exampleChannel}"]`;
const channelArrowSelector = `#hfTransLines .hf-trans-arrow[data-key="${exampleChannel}"]`;

function matchesChannel(state) {
  const channel = state.selectedChannel;
  return state.transition?.id === 'T2' && channel &&
    [channel.F, channel.m, channel.Fp, channel.mp, channel.q].join('|') === exampleChannel;
}

function closeTo(value, target) {
  return Number.isFinite(value) && Math.abs(value - target) <= target * 1e-9;
}

function matchesWorkpoint(state) {
  return matchesChannel(state) && state.inputStatus === 'valid' && state.solveFor === 'rabi' &&
    closeTo(state.P_mW, 1) && closeTo(state.w_um, 500) && state.fR_MHz > 0 && Number.isFinite(state.fR_MHz);
}

function setText(element, text) {
  if (element.textContent !== text) element.textContent = text;
}

export function initOnboarding({ calculator }) {
  const find = selector => document.querySelector(selector);
  const open = find('#guideOpen');
  const invite = find('#guideInvite');
  const card = find('#guideCard');
  const progress = card.querySelector('[data-guide-progress]');
  const title = card.querySelector('[data-guide-title]');
  const instruction = card.querySelector('[data-guide-instruction]');
  const reading = card.querySelector('[data-guide-reading]');
  const finish = card.querySelector('[data-guide-finish]');
  const locateButton = find('#guideLocate');
  let step = 0;
  let feedback = '';
  let highlighted = new Set();

  const isLanding = () => !location.hash || location.hash === '#top';
  let seen = false;
  try { seen = !!localStorage.getItem(storageKey); } catch { /* Storage can be disabled. */ }
  invite.hidden = seen || !isLanding();
  open.setAttribute('aria-expanded', 'false');

  function mark(elements) {
    const next = new Set(elements.filter(Boolean));
    for (const el of highlighted) if (!next.has(el)) el.classList.remove('guide-target');
    for (const el of next) if (!highlighted.has(el)) el.classList.add('guide-target');
    highlighted = next;
  }

  function filterButtons() {
    const line = find(lineSelector);
    if (line?.style.pointerEvents !== 'none') return [];
    return ['fcat', 'fstrength'].flatMap((key, index) => {
      const current = find(`[data-${key}].active`)?.dataset[key];
      const expected = index === 0 ? line.dataset.category : line.dataset.strength;
      return current !== 'all' && current !== expected ? [find(`[data-${key}="all"]`)] : [];
    });
  }

  function workpointTarget(state) {
    if (state.solveFor !== 'rabi') return find('#calcSolveFor');
    if (!closeTo(state.P_mW, 1)) return find('#rpCalcP');
    if (!closeTo(state.w_um, 500)) return find('#rpCalcW');
    return find('#rabiResult');
  }

  function diagramStep(state) {
    if (state.pol !== 'sigmap') return {
      target: find('#hfTransPolSeg [data-pol="sigmap"]'),
      instruction: '在偏振分量图上方点 σ⁺，显示这个偏振允许的跃迁线。',
    };
    if (state.diagF_upper !== 'all' && Number(state.diagF_upper) !== 1.5) return {
      target: find('#hfDiagFUpper'),
      instruction: '将图上方的「上能级 F′」设为 3/2 或「全部」，显示示例跃迁线。',
    };
    return {
      target: find(channelHitSelector),
      instruction: '点图中最右侧的金色竖线，从 mF = +1/2 连到 mF′ = +3/2。',
    };
  }

  function render() {
    if (!step) return;
    const state = calculator.getState();
    if (step !== 1 && state.transition?.id !== 'T2') {
      step = 1;
      feedback = '当前跃迁已更换。';
    } else if ((step === 3 || step === 'complete') && !matchesChannel(state)) {
      step = 2;
      feedback = '当前通道已更换。';
    } else if (step === 'complete' && !matchesWorkpoint(state)) {
      step = 3;
      feedback = '';
    }
    card.dataset.step = String(step);
    reading.parentElement.hidden = step !== 'complete';
    setText(progress, step === 'complete' ? '3 / 3 · 已完成' : `${step} / 3`);
    finish.hidden = step !== 3 && step !== 'complete';
    finish.disabled = step === 3 && !matchesWorkpoint(state);
    setText(finish, step === 'complete' ? '完成向导' : '核对结果');
    if (locateButton) locateButton.hidden = step === 'complete';

    if (step === 1) {
      const filters = filterButtons();
      setText(title, '选择 556 nm 跃迁');
      setText(instruction, filters.length ? '先将高亮的筛选项切换到「全部」，再点能级图上的 556 nm 跃迁。' :
        feedback + '点图中标着 555.80 nm 的跃迁线，打开它的超精细通道。');
      mark(filters.length ? filters : [find(lineSelector)]);
    } else if (step === 2) {
      const {target, instruction: action} = diagramStep(state);
      setText(title, '在图中选择 σ⁺ 跃迁');
      setText(instruction, feedback + action);
      mark([target, ...document.querySelectorAll(channelArrowSelector)]);
    } else if (step === 3) {
      setText(title, '计算 Rabi 频率');
      const ready = matchesWorkpoint(state);
      const help = state.solveFor !== 'rabi' ? '将计算方向切换为「功率、束腰 → Ω/2π」。' :
        '调整功率和束腰，让「进入计算」显示 Pq = 1 mW、w₀ = 500 µm。';
      setText(instruction, ready ? '原子处分量功率为 1 mW，束腰半径为 500 µm。读出 Ω/2π 后，点击「核对结果」。' : help);
      mark([workpointTarget(state)]);
    } else {
      setText(title, '完成 556 nm 示例');
      setText(reading, find('#rabiResult strong').textContent);
      setText(instruction, 'σ⁺ 通道 · 原子处分量功率 1 mW · 束腰半径 500 µm');
      mark([find('#rabiResult')]);
    }
  }

  function locate() {
    const state = calculator.getState();
    const target = step === 1 ? filterButtons()[0] || find(lineSelector) :
      step === 2 ? diagramStep(state).target : workpointTarget(state);
    if (!target) return;
    const filters = target.closest('#atlasFilters');
    if (filters) filters.open = true;
    const anchor = target.matches(lineSelector) ? target.querySelector('text') || target : target;
    anchor.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    if (target.matches('button, input, select, [tabindex]')) target.focus({ preventScroll: true });
  }

  function start() {
    step = 1;
    feedback = '';
    invite.hidden = true;
    card.hidden = false;
    document.documentElement.dataset.guideActive = 'true';
    open.setAttribute('aria-expanded', 'true');
    render();
    locate();
  }

  function dismiss(outcome) {
    try { localStorage.setItem(storageKey, outcome); } catch { /* Dismissal still applies to this page. */ }
    step = 0;
    invite.hidden = true;
    card.hidden = true;
    delete card.dataset.step;
    delete document.documentElement.dataset.guideActive;
    open.setAttribute('aria-expanded', 'false');
    mark([]);
    open.focus({ preventScroll: true });
  }

  open.addEventListener('click', start);
  invite.querySelector('[data-guide-start]').addEventListener('click', start);
  invite.querySelector('[data-guide-skip]').addEventListener('click', () => dismiss('skipped'));
  card.querySelector('[data-guide-close]').addEventListener('click', () => dismiss('closed'));
  locateButton?.addEventListener('click', locate);
  finish.addEventListener('click', () => {
    if (step === 'complete') return dismiss('completed');
    if (step === 3 && matchesWorkpoint(calculator.getState())) {
      step = 'complete';
      render();
      locate();
    }
  });

  function activateTransition(event) {
    if (step !== 1) return;
    const line = event.target.closest?.('#levelDiagram .transition-line[data-id]');
    if (!line || line.style.pointerEvents === 'none') return;
    if (line.dataset.id === 'T2' && calculator.getState().transition?.id === 'T2') {
      step = 2;
      feedback = '';
    } else {
      feedback = '刚选了另一条跃迁。';
    }
    render();
    if (!feedback) locate();
  }

  function handleChannelSelection(origin) {
    if (step !== 2) return false;
    if (origin === 'table') {
      feedback = '已在表中选中通道。点「定位当前步骤」回到图中。';
      render();
      return false;
    }
    if (matchesChannel(calculator.getState())) {
      step = 3;
      feedback = '';
      render();
      return false;
    }
    feedback = '刚选了另一条跃迁线。';
    render();
    locate();
    return true;
  }

  function locateInDiagram() {
    feedback = '';
    render();
    locate();
  }

  document.addEventListener('click', event => {
    if (step === 1 && event.target.closest?.('[data-fcat], [data-fstrength]')) render();
    else if (step === 2 && event.target.closest?.('#hfTransPolSeg button')) locateInDiagram();
    else activateTransition(event);
  });
  document.addEventListener('change', event => {
    if (step === 2 && event.target.matches('#hfDiagFLower, #hfDiagFUpper')) locateInDiagram();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && step && !document.querySelector('dialog[open]')) {
      event.preventDefault();
      dismiss('closed');
    } else if (!event.repeat && ['Enter', ' ', 'Spacebar'].includes(event.key)) {
      activateTransition(event);
    }
  });
  window.addEventListener('hashchange', () => {
    if (!isLanding()) invite.hidden = true;
  });
  calculator.onChange(render);
  return {handleChannelSelection};
}
