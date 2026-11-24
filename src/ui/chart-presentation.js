// These palettes style an existing numeric snapshot. The heat field is unsigned.
// Five Wong colours, plus a darker orange with >3:1 contrast against white.
export const PAPER_SERIES = ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#000000', '#B27B00'];
export const PAPER_DASHES = [[], [7,3], [2,3], [9,3,2,3], [6,2,2,2], [12,4]];
export const PAPER_THEME = {
  text: '#25313a', background: '#ffffff', axis: '#596671', grid: '#d8dee2',
  calloutBackground: '#ffffff', calloutBorder: '#17242b', calloutText: '#17242b',
};
export const FIGURE_FONTS = {
  sans: 'Arial, Helvetica, sans-serif', serif: 'Georgia, Times New Roman, serif',
  mono: 'Menlo, Consolas, monospace',
};

/** All controls belong to the view, and never write calculation inputs. */
export function createChartPresentation() {
  const host = document.querySelector('#secRabi .chart-readout-tools');
  const panel = document.createElement('details');
  panel.className = 'chart-presentation';
  panel.innerHTML = `<summary>图表显示与导出设置</summary>
    <div class="chart-presentation-fields">
      <label>显示主题<select id="chartTheme"><option value="dark">交互深色</option><option value="paper">论文白底</option></select></label>
      <label>坐标范围<select id="chartRangeMode"><option value="auto">使用当前轴设置</option><option value="fixed">锁定当前两图范围</option></select></label>
      <label>热图色标<select id="heatColorMode"><option value="auto">自动 · 2%–98% 分位</option><option value="fixed">固定 · 跨工作点比较</option></select></label>
      <div class="chart-fixed-color" id="chartColorLimits" hidden>
        <label>色标下限 / MHz<input id="heatColorLow" type="number" min="0" step="any"></label>
        <label>色标上限 / MHz<input id="heatColorHigh" type="number" min="0" step="any"></label>
        <button type="button" id="heatColorApply">应用色限</button><span role="status" id="heatColorStatus"></span>
      </div>
      <fieldset><legend>图像导出</legend>
        <label>SVG 宽 / px<input id="chartExportWidth" type="number" min="240" max="4096" step="1" placeholder="随视图"></label>
        <label>SVG 高 / px<input id="chartExportHeight" type="number" min="240" max="4096" step="1" placeholder="等比"></label>
        <label>字体<select id="chartExportFont"><option value="sans">无衬线</option><option value="serif">衬线</option><option value="mono">等宽</option></select></label>
        <label>背景<select id="chartExportBackground"><option value="view">与显示主题一致</option><option value="paper">论文白底</option><option value="dark">交互深色</option></select></label>
        <span>PNG 使用上列尺寸的 2 倍像素，留空按当前视图排版。</span>
      </fieldset>
    </div>`;
  host.after(panel);
  const get = id => panel.querySelector('#' + id);
  const dimension = input => {
    if (input.validity.badInput || !input.checkValidity()) throw Error('图像宽、高须为 240–4096 的整数像素，或留空。');
    return input.value === '' ? null : input.valueAsNumber;
  };
  return {
    panel, theme: get('chartTheme'), range: get('chartRangeMode'), colorMode: get('heatColorMode'),
    colorLimits: get('chartColorLimits'), low: get('heatColorLow'), high: get('heatColorHigh'),
    apply: get('heatColorApply'), status: get('heatColorStatus'),
    exportOptions() {
      return {width: dimension(get('chartExportWidth')), height: dimension(get('chartExportHeight')),
        font: get('chartExportFont').value, background: get('chartExportBackground').value};
    },
  };
}
