// Presentation only: the catalog keeps its physical wavelengths and state data.
const BLUE_GOLD_INK = Object.freeze({
  deep: { base: '#78AAFF', selected: '#E2BE78' },
  silver: { base: '#285DA6', selected: '#95651C' },
});

export function orbitalSeries(level) {
  // Yb has two valence electrons. Ground 6s² belongs to the ns orbital series;
  // the diagram may give it a separate visual column.
  if (level.config === '6s²' || /^6s\d+s$/.test(level.config)) return 'ns';
  if (/^6s\d+p$/.test(level.config)) return 'np';
  if (/^6s\d+d$/.test(level.config)) return 'nd';
  throw new Error(`No orbital column for ${level.config} ${level.term}`);
}

// Keep the wavelength-derived hue; tune only saturation and lightness for
// restrained, paper-style ink. UV/IR remain explicitly non-visible categories.
function wavelengthInk(transition, theme) {
  const lightCanvas = theme === 'silver';
  if (transition.spectrum.region !== 'visible') {
    return transition.spectrum.region === 'UV'
      ? (lightCanvas ? '#51738b' : '#89a9c0')
      : (lightCanvas ? '#87705b' : '#bfaa91');
  }
  const rgb = transition.color.slice(1).match(/.{2}/g).map(value => parseInt(value, 16) / 255);
  const max = Math.max(...rgb), min = Math.min(...rgb), delta = max - min;
  let hue = 0;
  if (delta) {
    hue = max === rgb[0] ? ((rgb[1] - rgb[2]) / delta) % 6
      : max === rgb[1] ? (rgb[2] - rgb[0]) / delta + 2
      : (rgb[0] - rgb[1]) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return `hsl(${hue.toFixed(1)} ${lightCanvas ? 70 : 48}% ${lightCanvas ? 36 : 58}%)`;
}

export function diagramInk(transition, mode, selectedId, theme = 'deep') {
  if (mode === 'wavelength') return wavelengthInk(transition, theme);
  const palette = BLUE_GOLD_INK[theme] || BLUE_GOLD_INK.deep;
  return transition.id === selectedId ? palette.selected : palette.base;
}

export function initDiagramPresentation(transitions, calculator) {
  const stage = document.querySelector('.diagram-wrap');
  const note = stage.querySelector('.diagram-reading-note');
  let selectedId = calculator.getState().transition?.id;
  function apply(mode = stage.dataset.inkMode) {
    stage.dataset.inkMode = mode;
    stage.dataset.selectedTransition = selectedId || '';
    document.querySelectorAll('[data-diagram-ink]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.diagramInk === mode));
    });
    for (const transition of transitions) {
      const forbidden = transition.classification.startsWith('禁戒') || /M2|双光子/.test(transition.multipole);
      const dash = mode === 'wavelength' && transition.spectrum.dash || (forbidden ? '5 4' : 'none');
      const targets = document.querySelectorAll(`#levelDiagram [data-id="${transition.id}"], #transitionPicker [data-select-transition="${transition.id}"], #transitionPicker [data-explorer-transition="${transition.id}"], #spectrumLegend [data-id="${transition.id}"]`);
      targets.forEach(element => {
        // The directory follows the dark page, independently of the optional white canvas.
        const theme = element.closest('#transitionPicker') ? 'deep' : stage.dataset.canvasTheme;
        const color = diagramInk(transition, mode, selectedId, theme);
        element.style.setProperty('--transition-ink', color);
        element.style.setProperty('--transition-color', color);
        element.style.setProperty('--transition-dash', dash);
        element.dataset.displayColor = color;
        element.classList.toggle('selected-trans', transition.id === selectedId);
        if (element.matches('#spectrumLegend button')) {
          element.setAttribute('aria-pressed', String(transition.id === selectedId));
        }
        const swatch = element.querySelector('i');
        if (swatch) swatch.style.borderTopStyle = dash === 'none' ? 'solid' : 'dashed';
        if (element.hasAttribute('aria-label')) {
          const band = transition.spectrum.region === 'visible' ? '可见光波段' : transition.spectrum.label;
          element.setAttribute('aria-label', `${transition.id} ${transition.lower} → ${transition.upper}，${transition.wavelength_vac_nm} nm，${band}，${mode === 'blue-gold' ? '蓝金配色' : '波长配色'}`);
        }
      });
    }
    note.textContent = mode === 'blue-gold'
      ? '蓝金配色：蓝色为普通路径，金色为当前选择，颜色不代表波长；UV / IR 保留标识。点击波长选跃迁，悬停能级看超精细结构。'
      : '波长配色：可见光保留波长近似色相，明度与饱和度作图示调整；UV / IR 使用示意色。点击连线、编号或下方波长选择跃迁。';
  }
  document.querySelectorAll('[data-diagram-ink]').forEach(button => {
    button.addEventListener('click', () => apply(button.dataset.diagramInk));
  });
  stage.addEventListener('canvas-theme-change', () => apply());
  stage.addEventListener('diagram-layout-change', () => apply());
  calculator.onChange(state => {
    if (selectedId === state.transition?.id) return;
    selectedId = state.transition?.id;
    apply();
  });
  apply(stage.dataset.inkMode || 'wavelength');
}
