import { rabiHz, powerFromRabiHz, waistFromRabiHz } from '../physics/rabi.js';
import { convert } from '../physics/units.js';
export function initRabiCharts(calculator) {
  // ---- Display helpers: read from HFCalc state ----
  function getPFactor() {
    var s = calculator ? calculator.getState() : null;
    return document.getElementById('powerAxisConvention').value==='sigma-double' && s && (s.pol==='sigmap'||s.pol==='sigmam') ? 2 : 1;
  }
  function getPwrUnit() {
    var s = calculator ? calculator.getState() : null;
    return s ? s.powerUnit : 'mW';
  }
  function getRabiUnitLabel() {
    var s = calculator ? calculator.getState() : null;
    return s ? s.rabiUnit : 'MHz';
  }
  // mW → display power factor (e.g. µW: ×1000)
  function pwrDispFactor() { return convert(1,'power','mW',getPwrUnit()); }
  // MHz → display Rabi factor (e.g. Hz: ×1e6)
  function rabiDispFactor() { return convert(1,'frequency','MHz',getRabiUnitLabel()); }
  // Combined: single-component mW → display power

  // Turbo-like colormap (approximation) for heatmap
  function turboColor(t) {
    // t: 0..1
    t = Math.max(0, Math.min(1, t));
    // Approximation of matplotlib turbo colormap via 5 control points
    var stops = [
      [0.0,  [48, 18, 59]],
      [0.25, [64, 70, 180]],
      [0.5,  [34, 165, 138]],
      [0.75, [190, 216, 65]],
      [1.0,  [252, 230, 40]]
    ];
    for (var i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i][0] && t <= stops[i+1][0]) {
        var f = (t - stops[i][0]) / (stops[i+1][0] - stops[i][0]);
        var c0 = stops[i][1], c1 = stops[i+1][1];
        return [
          Math.round(c0[0] + f * (c1[0] - c0[0])),
          Math.round(c0[1] + f * (c1[1] - c0[1])),
          Math.round(c0[2] + f * (c1[2] - c0[2]))
        ];
      }
    }
    return [255, 255, 255];
  }

  var curveScale = 'lin'; // 'lin' or 'log'
  var waistDefaults = [25, 50, 75, 100, 150, 200]; // µm — 默认束腰，非法输入回退到此
  var waistSeries = waistDefaults.slice(); // µm — 当前生效束腰（可由图例输入控件编辑）
  var curveColors = ['#60a5fa', '#22d391', '#f59e0b', '#a78bfa', '#f87171', '#38bdf8'];
  // 每条曲线的显隐状态（点击图例 "µm" 单位切换），默认全部可见
  var curveVisible = waistSeries.map(function() { return true; });
  // 标记每条束腰线是否为默认预设（true=默认 25/50/75/100/150/200µm，false=用户修改或新增）
  var waistIsDefault = waistSeries.map(function() { return true; });

  // 上次绘制的曲线图几何（供悬停读数反算 x/y 用）
  var curveGeom = null;

  // Axis display state: unit + optional user-set max (null => auto)
  var curveAxis = {
    x: { unit: getPwrUnit(), max: 200 },
    y: { unit: getRabiUnitLabel(), max: 1000 }
  };
  // Heatmap axis ranges follow the curve chart by default; user can override
  // the upper limits via the heatmap's own axis inputs (null => follow/auto).
  var heatAxis = { xMax: null, yMax: null };
  function getHeatRange() {
    var pUnit = curveAxis.x.unit;
    var pf = getPFactor() * pwrFactor(pUnit);
    var isSigma = getPFactor() === 2;
    var defaultPmax_mW = curveScale === 'lin' ? 1000 : 5000;
    var Pmin_mW = curveScale === 'log' ? 0.1 : 0;
    var Pmax, Pmin;
    // Heatmap X: heatAxis override first, then curve chart, then default
    if (heatAxis.xMax !== null && isFinite(heatAxis.xMax) && heatAxis.xMax > 0) {
      Pmax = heatAxis.xMax;
      Pmin = Pmin_mW * pf;
    } else if (curveAxis.x.max !== null && isFinite(curveAxis.x.max) && curveAxis.x.max > 0) {
      Pmax = curveAxis.x.max;
      Pmin = Pmin_mW * pf;
    } else {
      Pmax = defaultPmax_mW * pf;
      Pmin = Pmin_mW * pf;
    }

    var wUnit = 'µm';
    var wf = waistFactor(wUnit);
    var visWaists = [];
    waistSeries.forEach(function(w, idx) {
      if (curveVisible[idx]) visWaists.push(w);
    });
    var Wmin, Wmax;
    // Heatmap Y: heatAxis override first, then auto-compute from visible waists
    if (heatAxis.yMax !== null && isFinite(heatAxis.yMax) && heatAxis.yMax > 0) {
      Wmax = heatAxis.yMax * wf;
      if (visWaists.length > 0) {
        var wMin_h = Math.min.apply(null, visWaists);
        Wmin = Math.max(1, wMin_h * 0.5) * wf;
      } else {
        Wmin = 10 * wf;
      }
    } else if (visWaists.length > 0) {
      var wMin = Math.min.apply(null, visWaists);
      var wMax = Math.max.apply(null, visWaists);
      Wmin = Math.max(1, wMin * 0.5) * wf;
      Wmax = (wMax * 1.5) * wf;
    } else {
      Wmin = 10 * wf;
      Wmax = 200 * wf;
    }

    return {
      pUnit: pUnit, wUnit: wUnit, pf: pf, wf: wf, isSigma: isSigma,
      Pmax: Pmax, Pmin: Pmin, Wmax: Wmax, Wmin: Wmin
    };
  }

  // Chart dimensions (in pixels, computed on resize)
  var pad = { left: 60, right: 60, top: 20, bottom: 40 };

  function pwrFactor(unit) { return convert(1,'power','mW',unit); }
  function rabiFactor(unit) { return convert(1,'frequency','MHz',unit); }
  function waistFactor(unit) { return convert(1,'length','µm',unit); }
  function niceCeil(x) {
    if (x <= 0 || !isFinite(x)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(x)));
    var n = x / p;
    var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * p;
  }
  // Ceil to 2 significant figures — tight rounding so the value stays within
  // ~9% of the input. Used for axis max when we want the top curve endpoint
  // close to the plot corner (diagonal effect). niceCeil can jump up to 2×
  // (e.g. 55→100), pushing the curve far below the diagonal.
  function ceil2sf(x) {
    if (x <= 0 || !isFinite(x)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(x)) - 1);
    return Math.ceil(x / p) * p;
  }

  // ===== Multi-curve chart =====
  var curveCanvas = document.getElementById('rpCurveCanvas');
  var curveCtx = curveCanvas.getContext('2d');
  var curveTip = document.getElementById('rpCurveTip');
  var curveWrap = document.getElementById('rpCurveWrap');

  function resizeCanvas(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: rect.width, h: rect.height };
  }

  function drawCurveChart(d_ea0, curP_mW, curW_um) {
    var dim = resizeCanvas(curveCanvas);
    var W = dim.w, H = dim.h;
    var ctx = curveCtx;
    ctx.clearRect(0, 0, W, H);

    var plotW = W - pad.left - pad.right;
    var plotH = H - pad.top - pad.bottom;

    // Display units selected by user; sigma experimental factor included
    var pUnit = curveAxis.x.unit;
    var rUnit = curveAxis.y.unit;
    var pf = getPFactor() * pwrFactor(pUnit);
    var rf = rabiFactor(rUnit);
    var isSigma = getPFactor() === 2;

    // Data range (display units)
    var defaultPmax_mW = curveScale === 'lin' ? 1000 : 5000;
    var Pmin_mW = curveScale === 'log' ? 0.1 : 0;
    var Pmax, Pmin;
    if (curveAxis.x.max !== null && isFinite(curveAxis.x.max) && curveAxis.x.max > 0) {
      Pmax = curveAxis.x.max;
      Pmin = Pmin_mW * pf;
    } else {
      Pmax = defaultPmax_mW * pf;
      Pmin = Pmin_mW * pf;
    }

    // Auto y max unless user set
    var maxRabi = 0;
    var Pmax_mW = Pmax / pf;
    waistSeries.forEach(function(w) {
      var fR = rabiHz(d_ea0, Pmax_mW, w) / 1e6 * rf;
      if (fR > maxRabi) maxRabi = fR;
    });
    if (maxRabi <= 0) maxRabi = 1;
    var yMax = (curveAxis.y.max !== null && isFinite(curveAxis.y.max) && curveAxis.y.max > 0)
      ? curveAxis.y.max : niceCeil(maxRabi);

    function xScale(P) {
      if (curveScale === 'log') {
        return pad.left + (Math.log10(P) - Math.log10(Pmin)) / (Math.log10(Pmax) - Math.log10(Pmin)) * plotW;
      }
      return pad.left + (P - Pmin) / (Pmax - Pmin) * plotW;
    }
    function yScale(fR_disp) {
      return pad.top + plotH - (fR_disp / yMax) * plotH;
    }

    // Background
    ctx.fillStyle = '#0a0e16';
    ctx.fillRect(pad.left, pad.top, plotW, plotH);

    // Grid lines + y axis labels
    ctx.strokeStyle = 'rgba(90, 101, 128, 0.2)';
    ctx.fillStyle = '#7d88a0';
    ctx.font = '11px Times New Roman, SimSun, Songti SC, serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;
    var ySteps = 5;
    for (var i = 0; i <= ySteps; i++) {
      var yVal = (i / ySteps) * yMax;
      var y = yScale(yVal);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.fillText(fmtRabi(yVal), pad.left - 8, y);
    }

    // X axis grid + labels (in display power)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    function fmtPwr(p) {
      if (Math.abs(p) >= 1e6) return (p/1e6).toFixed(0) + 'M';
      if (Math.abs(p) >= 1e3) return (p/1e3).toFixed(p < 1e4 ? 1 : 0) + 'k';
      if (Math.abs(p) >= 1) return p.toFixed(0);
      return p.toFixed(p < 0.1 ? 2 : 1);
    }
    function fmtRabi(v) {
      if (Math.abs(v) >= 1e6) return (v/1e6).toFixed(0) + 'M';
      if (Math.abs(v) >= 1e3) return (v/1e3).toFixed(v < 1e4 ? 1 : 0) + 'k';
      if (Math.abs(v) >= 1) return v.toFixed(0);
      return v.toFixed(v < 0.1 ? 2 : 1);
    }
    var xTicks;
    if (curveScale === 'log') {
      xTicks = [0.1, 0.3, 1, 3, 10, 30, 100, 300, 1000, 3000].map(function(t) { return t * pf; });
      // trim ticks beyond current max
      xTicks = xTicks.filter(function(t) { return t <= Pmax * 1.001; });
    } else {
      xTicks = [];
      var nTicks = 5;
      for (var ti = 0; ti <= nTicks; ti++) xTicks.push(Pmin + (Pmax - Pmin) * ti / nTicks);
    }
    xTicks.forEach(function(p) {
      if (p < Pmin || p > Pmax) return;
      var x = xScale(p);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.strokeStyle = 'rgba(90, 101, 128, 0.15)';
      ctx.stroke();
      ctx.fillText(fmtPwr(p), x, pad.top + plotH + 8);
    });

    // Axis labels
    ctx.fillStyle = '#7d88a0';
    ctx.font = '11px Times New Roman, SimSun, Songti SC, serif';
    ctx.textAlign = 'center';
    var pAxisLabel = isSigma ? '2P (σ view) (' + pUnit + ')' : 'Power (' + pUnit + ')';
    ctx.fillText(pAxisLabel, pad.left + plotW / 2, H - 14);
    ctx.save();
    ctx.translate(16, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Ω/2π (' + rUnit + ')', 0, 0);
    ctx.restore();

    if (d_ea0 <= 0) {
      ctx.fillStyle = '#5a6580';
      ctx.font = '12px Times New Roman, SimSun, Songti SC, serif';
      ctx.textAlign = 'center';
      ctx.fillText('数据待补，无法生成 Rabi-P 图', pad.left + plotW / 2, pad.top + plotH / 2);
      return;
    }

    // Draw curves
    var nPts = 200;
    waistSeries.forEach(function(w, idx) {
      if (!curveVisible[idx]) return; // 隐藏的曲线不绘制
      ctx.beginPath();
      ctx.strokeStyle = curveColors[idx % curveColors.length];
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      for (var i = 0; i <= nPts; i++) {
        var P;
        if (curveScale === 'log') {
          P = Math.pow(10, Math.log10(Pmin) + i / nPts * (Math.log10(Pmax) - Math.log10(Pmin)));
        } else {
          P = Pmin + i / nPts * (Pmax - Pmin);
        }
        var P_mW = P / pf;
        var fR = rabiHz(d_ea0, P_mW, w) / 1e6 * rf;
        var x = xScale(P);
        var y = yScale(fR);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Working point: highlight current waist curve
    var curIdx = waistSeries.indexOf(curW_um);
    if (curIdx >= 0 && curveVisible[curIdx]) {
      ctx.beginPath();
      ctx.strokeStyle = curveColors[curIdx % curveColors.length];
      ctx.lineWidth = 3;
      for (var j = 0; j <= nPts; j++) {
        var P2;
        if (curveScale === 'log') {
          P2 = Math.pow(10, Math.log10(Pmin) + j / nPts * (Math.log10(Pmax) - Math.log10(Pmin)));
        } else {
          P2 = Pmin + j / nPts * (Pmax - Pmin);
        }
        var P2_mW = P2 / pf;
        var fR2 = rabiHz(d_ea0, P2_mW, curW_um) / 1e6 * rf;
        var x2 = xScale(P2);
        var y2 = yScale(fR2);
        if (j === 0) ctx.moveTo(x2, y2);
        else ctx.lineTo(x2, y2);
      }
      ctx.stroke();
    }

    // Working point marker
    if (curP_mW > 0 && curW_um > 0) {
      var fR_cur = rabiHz(d_ea0, curP_mW, curW_um) / 1e6 * rf;
      var px = xScale(curP_mW * pf);
      var py = yScale(fR_cur);

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 14, 22, 0.9)';
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#60a5fa';
      ctx.fill();
    }

    // Axis border
    ctx.strokeStyle = 'rgba(90, 101, 128, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.left, pad.top, plotW, plotH);

    // 记录几何供悬停读数反算
    curveGeom = {
      Pmin: Pmin, Pmax: Pmax, yMax: yMax,
      pf: pf, rf: rf, scale: curveScale,
      plotW: plotW, plotH: plotH,
      pUnit: pUnit, rUnit: rUnit,
      d_ea0: d_ea0
    };
  }
  // Build legend（束腰数值可编辑 + 点击 µm 切换曲线显隐）
  function buildLegend() {
    var legend = document.getElementById('rpLegend');
    legend.innerHTML = '';
    waistSeries.forEach(function(w, i) {
      var item = document.createElement('div');
      item.className = 'lg-item' + (curveVisible[i] ? '' : ' lg-hidden');
      item.innerHTML =
        '<span class="lg-line" style="background:' + curveColors[i % curveColors.length] + '"></span>' +
        '<input class="lg-winput" type="number" min="0" step="any" value="' + w + '" data-idx="' + i + '" aria-label="束腰 w' + (i + 1) + '">' +
        '<span class="lg-unit" data-idx="' + i + '" title="点击切换该曲线显隐">µm</span>';
      legend.appendChild(item);
    });
    // 点击 "µm" 单位文本：切换该束腰曲线的显隐
    legend.querySelectorAll('.lg-unit').forEach(function(u) {
      u.addEventListener('click', function() {
        var idx = parseInt(u.getAttribute('data-idx'), 10);
        curveVisible[idx] = !curveVisible[idx];
        var item = u.closest('.lg-item');
        if (item) item.classList.toggle('lg-hidden', !curveVisible[idx]);
        autoAdjustAxes();
        redrawAll();
      });
    });
    // 绑定输入：聚焦自动清零等待输入；实时重算重绘，非法值回退默认
    var inputs = legend.querySelectorAll('.lg-winput');
    inputs.forEach(function(inp) {
      inp.addEventListener('focus', function() {
        // 聚焦时记录当前值并清空，等待新输入
        inp.dataset.prev = inp.value;
        inp.value = '';
      });
      inp.addEventListener('input', function() {
        var idx = parseInt(inp.getAttribute('data-idx'), 10);
        var v = parseFloat(inp.value);
        if (!isFinite(v) || v <= 0) {
          // 非法（非数 / 负 / 零 / 空串）：不立即抢回输入框，仅在失焦时回退，避免打字中途被覆盖
          return;
        }
        waistSeries[idx] = v;
        waistIsDefault[idx] = false; // 用户修改 → 不再是默认曲线
        // 需求1调整：只隐藏默认束腰线，保留用户修改过的曲线
        curveVisible[idx] = true;
        for (var ci = 0; ci < curveVisible.length; ci++) {
          if (ci !== idx && waistIsDefault[ci]) curveVisible[ci] = false;
        }
        updateLegendVisibility();
        autoAdjustAxes();
        redrawAll();
      });
      inp.addEventListener('blur', function() {
        var idx = parseInt(inp.getAttribute('data-idx'), 10);
        var raw = inp.value;
        var v = parseFloat(raw);
        if (raw.trim() === '') {
          // 清空后未输入任何内容：回退到聚焦前的原值，不触发重绘
          var prev = inp.dataset.prev;
          inp.value = (prev !== undefined && prev !== '') ? prev : waistSeries[idx];
          var pv = parseFloat(inp.value);
          if (isFinite(pv) && pv > 0) waistSeries[idx] = pv;
          return;
        }
        if (!isFinite(v) || v <= 0) {
          // 非法非空输入：回退默认值
          waistSeries[idx] = waistDefaults[idx];
          waistIsDefault[idx] = true; // 回退到默认值 → 恢复默认标记
          inp.value = waistDefaults[idx];
          redrawAll();
        }
      });
      // 回车提交：失焦触发重算
      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
      });
    });
  }
  buildLegend();
  // 别名：供后续动态添加束腰后重建图例
  var rebuildLegend = buildLegend;

  // 需求1辅助：根据 curveVisible 更新图例 DOM 的显隐类
  function updateLegendVisibility() {
    var legend = document.getElementById('rpLegend');
    if (!legend) return;
    var items = legend.querySelectorAll('.lg-item');
    items.forEach(function(item, i) {
      item.classList.toggle('lg-hidden', !curveVisible[i]);
    });
  }

  // 需求4：坐标轴自动调整模式
  // autoAxis=true 时根据可见曲线自动计算上限；用户手动输入后切为 false
  var autoAxis = { x: true, y: true };
  // Tracks whether the display unit should be auto-selected (user manual override → false)
  var autoUnitFlag = { x: true, y: true };

  // Pick best power display unit so value falls in [1, 1000)
  function autoPwrUnit(baseVal_mW) {
    if (baseVal_mW >= 1e3) return 'W';
    if (baseVal_mW >= 1) return 'mW';
    return 'µW';
  }
  // Pick best Rabi display unit so value falls in [1, 1000)
  function autoRabiUnit(baseVal_MHz) {
    if (baseVal_MHz >= 1e3) return 'GHz';
    if (baseVal_MHz >= 1) return 'MHz';
    if (baseVal_MHz >= 1e-3) return 'kHz';
    return 'Hz';
  }

  function autoAdjustAxes() {
    var visWaists = [];
    waistSeries.forEach(function(w, idx) {
      if (curveVisible[idx]) visWaists.push(w);
    });
    if (visWaists.length === 0) return;
    var d = getDEffForViz();
    if (d <= 0) return;

    var wMin = Math.min.apply(null, visWaists);
    var rf = rabiFactor(curveAxis.y.unit);
    var pf = pwrFactor(curveAxis.x.unit);

    // 自动 Y 上限：最上面曲线(wMin)在参考功率处的 Ω，ceil2sf 紧凑取整使右端点接近 Y 上限(对角线)
    // 当 X 也是自动模式时，用固定 200mW 参考避免反馈循环（否则每次调用用上次 Xmax 会导致值持续 creep）
    // 当 X 手动模式时，用用户设定的 X 上限
    if (autoAxis.y) {
      var testPmax_mW = autoAxis.x ? 200
        : ((curveAxis.x.max && curveAxis.x.max > 0) ? curveAxis.x.max / pf : 1000);
      var maxRabi = 0;
      visWaists.forEach(function(w) {
        var fR = rabiHz(d, testPmax_mW, w) / 1e6 * rf;
        if (fR > maxRabi) maxRabi = fR;
      });
      if (maxRabi > 0) {
        curveAxis.y.max = ceil2sf(maxRabi);
      }
    }

    // 自动 X 上限：使最小束腰曲线在 Pmax 处 Ω ≈ yMax（右端点落在右上角附近）
    if (autoAxis.x) {
      var yMaxVal = (curveAxis.y.max || 1000);
      var targetRabi = yMaxVal / rf; // display → MHz (base)
      var targetHz = targetRabi * 1e6;
      var autoPmax_mW = powerFromRabiHz(d, targetHz, wMin);
      if (autoPmax_mW > 0 && isFinite(autoPmax_mW)) {
        autoPmax_mW = ceil2sf(autoPmax_mW);
        curveAxis.x.max = autoPmax_mW * pf;
        // 设了 X 后重算 Y：最上面曲线在新 X 处的 Ω，ceil2sf 使右端点接近 Y 上限(对角线)
        if (autoAxis.y) {
          var maxRabi2 = 0;
          visWaists.forEach(function(w) {
            var fR = rabiHz(d, autoPmax_mW, w) / 1e6 * rf;
            if (fR > maxRabi2) maxRabi2 = fR;
          });
          if (maxRabi2 > 0) {
            curveAxis.y.max = ceil2sf(maxRabi2);
          }
        }
      }
    }

    // Auto-select display unit so max value falls in [1, 1000)
    // Only when autoAxis is true (full auto mode) AND autoUnitFlag is true (user hasn't manually overridden unit)
    if (autoAxis.x && autoUnitFlag.x && curveAxis.x.max && curveAxis.x.max > 0) {
      var xBase_mW = curveAxis.x.max / pf; // display → mW (base)
      var newXUnit = autoPwrUnit(xBase_mW);
      curveAxis.x.unit = newXUnit;
      curveAxis.x.max = xBase_mW * pwrFactor(newXUnit); // mW → new display
    }
    if (autoAxis.y && autoUnitFlag.y && curveAxis.y.max && curveAxis.y.max > 0) {
      var yBase_MHz = curveAxis.y.max / rf; // display → MHz (base)
      var newYUnit = autoRabiUnit(yBase_MHz);
      curveAxis.y.unit = newYUnit;
      curveAxis.y.max = yBase_MHz * rabiFactor(newYUnit); // MHz → new display
    }

    updateAxisUI();
  }

  // 曲线图悬停读数：显示鼠标位置对应的 Power(x) 与 Ω/2π(y)
  curveCanvas.addEventListener('mousemove', function(e) {
    if (!curveGeom || curveGeom.d_ea0 <= 0) { curveTip.classList.remove('show'); return; }
    var rect = curveCanvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var g = curveGeom;
    if (mx < pad.left || mx > pad.left + g.plotW || my < pad.top || my > pad.top + g.plotH) {
      curveTip.classList.remove('show'); return;
    }
    // 反算 x → Power（显示单位）
    var P_disp;
    if (g.scale === 'log') {
      var t = (mx - pad.left) / g.plotW;
      P_disp = Math.pow(10, Math.log10(g.Pmin) + t * (Math.log10(g.Pmax) - Math.log10(g.Pmin)));
    } else {
      P_disp = g.Pmin + (mx - pad.left) / g.plotW * (g.Pmax - g.Pmin);
    }
    // 反算 y → Ω/2π（显示单位）
    var fR_disp = (pad.top + g.plotH - my) / g.plotH * g.yMax;
    if (P_disp <= 0 || fR_disp < 0) { curveTip.classList.remove('show'); return; }
    curveTip.innerHTML =
      'P = ' + P_disp.toPrecision(3) + ' ' + g.pUnit +
      '<br>Ω/2π = <strong>' + fR_disp.toPrecision(3) + ' ' + g.rUnit + '</strong>';
    curveTip.classList.add('show');
    var tipRect = curveTip.getBoundingClientRect();
    var tipX = mx + 12;
    var tipY = my - 12 - tipRect.height;
    if (tipX + tipRect.width > rect.width) tipX = mx - 12 - tipRect.width;
    if (tipY < 0) tipY = my + 12;
    curveTip.style.left = tipX + 'px';
    curveTip.style.top = tipY + 'px';
  });
  curveCanvas.addEventListener('mouseleave', function() { curveTip.classList.remove('show'); });
  document.getElementById('rpScaleLin').addEventListener('click', function() {
    curveScale = 'lin';
    document.getElementById('rpScaleLin').classList.add('active');
    document.getElementById('rpScaleLog').classList.remove('active');
    redrawAll();
  });
  document.getElementById('rpScaleLog').addEventListener('click', function() {
    curveScale = 'log';
    document.getElementById('rpScaleLog').classList.add('active');
    document.getElementById('rpScaleLin').classList.remove('active');
    redrawAll();
  });

  // Axis max / unit controls
  var rpCurveXMax = document.getElementById('rpCurveXMax');
  var rpCurveXUnit = document.getElementById('rpCurveXUnit');
  var rpCurveYMax = document.getElementById('rpCurveYMax');
  var rpCurveYUnit = document.getElementById('rpCurveYUnit');
  var rpCurveLegendTop = document.getElementById('rpCurveLegendTop');
  var rpHeatLegendTop = document.getElementById('rpHeatLegendTop');
  var hfTransTitle = document.getElementById('hfTransTitle');

  function setNum(el, v) {
    if (!el) return;
    if (v === null || !isFinite(v)) { el.value = ''; return; }
    if (v >= 1000 || (v > 0 && v < 0.1)) el.value = v.toExponential(2);
    else el.value = parseFloat(v.toFixed(3));
  }
  function readNum(el) {
    if (!el) return null;
    var v = parseFloat(el.value);
    return isFinite(v) && v > 0 ? v : null;
  }
  function updateAxisUI() {
    if (rpCurveXUnit) rpCurveXUnit.value = curveAxis.x.unit;
    if (rpCurveYUnit) rpCurveYUnit.value = curveAxis.y.unit;
    setNum(rpCurveXMax, curveAxis.x.max);
    setNum(rpCurveYMax, curveAxis.y.max);
  }
  updateAxisUI();

  function bindAxisControl(elMax, elUnit, axisObj, axisKey) {
    if (elMax) {
      // 点击聚焦时自动清空，与束腰输入框交互一致
      elMax.addEventListener('focus', function() {
        elMax.dataset.prev = elMax.value;
        elMax.value = '';
      });
      elMax.addEventListener('change', function() {
        var v = readNum(elMax);
        if (v !== null) {
          // 用户手动输入了有效值 → 关闭该轴的自动模式
          autoAxis[axisKey] = false;
          axisObj.max = v;
        } else {
          // 用户清空输入 → 恢复自动模式（max + unit 都恢复自动）
          autoAxis[axisKey] = true;
          autoUnitFlag[axisKey] = true;
          autoAdjustAxes();
          return;
        }
        updateAxisUI();
        redrawAll();
      });
      elMax.addEventListener('blur', function() {
        if (elMax.value.trim() === '') {
          var prev = elMax.dataset.prev;
          elMax.value = (prev !== undefined && prev !== '') ? prev : '';
        }
      });
      elMax.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); elMax.blur(); }
      });
    }
    if (elUnit) elUnit.addEventListener('change', function() {
      // Use correct factor function per axis (pwrFactor for X, rabiFactor for Y)
      var factorFn = axisKey === 'x' ? pwrFactor : rabiFactor;
      var oldFactor = factorFn(axisObj.unit);
      var newFactor = factorFn(elUnit.value);
      // Convert stored max to new unit if set
      if (axisObj.max !== null && isFinite(axisObj.max)) axisObj.max = axisObj.max * newFactor / oldFactor;
      axisObj.unit = elUnit.value;
      // 用户手动选单位 → 关闭该轴的单位自动调节
      autoUnitFlag[axisKey] = false;
      updateAxisUI();
      redrawAll();
    });
  }
  bindAxisControl(rpCurveXMax, rpCurveXUnit, curveAxis.x, 'x');
  bindAxisControl(rpCurveYMax, rpCurveYUnit, curveAxis.y, 'y');

  // --- Heatmap axis controls (independent upper-limit override) ---
  var rpHeatXMax = document.getElementById('rpHeatXMax');
  var rpHeatYMax = document.getElementById('rpHeatYMax');
  function updateHeatAxisUI() {
    setNum(rpHeatXMax, heatAxis.xMax);
    setNum(rpHeatYMax, heatAxis.yMax);
  }
  updateHeatAxisUI();
  function bindHeatAxis(elMax, key) {
    if (!elMax) return;
    elMax.addEventListener('focus', function() {
      elMax.dataset.prev = elMax.value;
      elMax.value = '';
    });
    elMax.addEventListener('change', function() {
      heatAxis[key] = readNum(elMax);
      updateHeatAxisUI();
      redrawAll();
    });
    elMax.addEventListener('blur', function() {
      if (elMax.value.trim() === '') {
        var prev = elMax.dataset.prev;
        elMax.value = (prev !== undefined && prev !== '') ? prev : '';
      }
    });
    elMax.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); elMax.blur(); }
    });
  }
  bindHeatAxis(rpHeatXMax, 'xMax');
  bindHeatAxis(rpHeatYMax, 'yMax');

  function fLegendStr(F) {
    return F === 0.5 ? '1/2' : F === 1.5 ? '3/2' : F === 2.5 ? '5/2' : String(F);
  }
  function mLegendStr(m) {
    if (m === 0.5) return '+½';
    if (m === -0.5) return '−½';
    if (m === 1.5) return '+³⁄₂';
    if (m === -1.5) return '−³⁄₂';
    if (m === 2.5) return '+⁵⁄₂';
    if (m === -2.5) return '−⁵⁄₂';
    return (m > 0 ? '+' : '') + m;
  }
  function updateTopLegends() {
    var s = calculator ? calculator.getState() : null;
    if (!s || !s.transition) {
      if (rpCurveLegendTop) rpCurveLegendTop.textContent = '选择跃迁后显示能级标注';
      if (rpHeatLegendTop) rpHeatLegendTop.textContent = '选择跃迁后显示能级标注';
      if (hfTransTitle) hfTransTitle.style.display = 'none';
      return;
    }
    var lower = s.transition.lower || '';
    var upper = s.transition.upper || '';
    var lambda = s.transition.wavelength_vac_nm ? ' · ' + s.transition.wavelength_vac_nm.toFixed(1) + ' nm' : '';
    var hf = '';
    if (s.F_lower !== undefined && s.F_upper !== undefined && s.transition.lower && s.transition.upper) {
      hf = ' · F=' + fLegendStr(s.F_lower) + ' → F′=' + fLegendStr(s.F_upper);
    }
    if (s.selectedChannel) {
      var ch = s.selectedChannel;
      hf += ' · m<sub>F</sub>=' + mLegendStr(ch.m) + ' → m<sub>F</sub>′=' + mLegendStr(ch.mp);
    }
    if (rpCurveLegendTop) rpCurveLegendTop.innerHTML = '<span class="lg-level">' + lower + '</span><span class="lg-arrow">→</span><span class="lg-level">' + upper + '</span>' + hf + lambda;
    if (rpHeatLegendTop) rpHeatLegendTop.innerHTML = '<span class="lg-level">' + lower + '</span><span class="lg-arrow">→</span><span class="lg-level">' + upper + '</span>' + hf + lambda;
    if (hfTransTitle) { hfTransTitle.style.display = ''; hfTransTitle.innerHTML = '<span class="lg-level">' + lower + '</span><span class="lg-arrow">→</span><span class="lg-level">' + upper + '</span>' + hf + lambda; }
  }
  updateTopLegends();

  // ===== Heatmap =====
  var heatCanvas = document.getElementById('rpHeatCanvas');
  var heatCtx = heatCanvas.getContext('2d');
  var heatTip = document.getElementById('rpHeatTip');

  function drawHeatmap(d_ea0, curP_mW, curW_um) {
    var dim = resizeCanvas(heatCanvas);
    var W = dim.w, H = dim.h;
    var ctx = heatCtx;
    ctx.clearRect(0, 0, W, H);

    var plotW = W - pad.left - pad.right;
    var plotH = H - pad.top - pad.bottom;

    var hr = getHeatRange();
    var pUnit = hr.pUnit;
    var wUnit = hr.wUnit;
    var pf = hr.pf;
    var wf = hr.wf;
    var rf = rabiDispFactor(); // colorbar uses global Rabi unit
    var rUnit = getRabiUnitLabel();
    var isSigma = hr.isSigma;

    var Pmax = hr.Pmax;
    var Pmin = hr.Pmin;
    var Wmax = hr.Wmax;
    var Wmin = hr.Wmin;

    function xScale(P) { return pad.left + (P - Pmin) / (Pmax - Pmin) * plotW; }
    function yScale(w) { return pad.top + plotH - (w - Wmin) / (Wmax - Wmin) * plotH; }

    ctx.fillStyle = '#0a0e16';
    ctx.fillRect(pad.left, pad.top, plotW, plotH);

    if (d_ea0 <= 0) {
      ctx.fillStyle = '#5a6580';
      ctx.font = '12px Times New Roman, SimSun, Songti SC, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('数据待补，无法生成 Rabi-P 热力图', pad.left + plotW / 2, pad.top + plotH / 2);
      drawHeatAxes(ctx, plotW, plotH, pad, xScale, yScale, Pmin, Pmax, Wmin, Wmax, W, H, pUnit, wUnit, isSigma);
      return;
    }

    var nx = 150, ny = 100;
    var grid = [];
    var maxR = 0;
    for (var iy = 0; iy < ny; iy++) {
      grid[iy] = [];
      var w_disp = Wmin + iy / (ny - 1) * (Wmax - Wmin);
      var w = w_disp / wf; // internal µm
      for (var ix = 0; ix < nx; ix++) {
        var P_disp = Pmin + ix / (nx - 1) * (Pmax - Pmin);
        var P_mW = P_disp / pf;
        var fR = P_mW > 0 ? rabiHz(d_ea0, P_mW, w) / 1e6 : 0;
        grid[iy][ix] = fR;
        if (fR > maxR) maxR = fR;
      }
    }
    var colorMax = Math.max(60, Math.ceil(maxR / 10) * 10);

    // Percentile-based robust color range: span the 2nd–98th percentile of the
    // current grid so the colorbar reflects the visible data bulk instead of
    // being stretched by outlier corners (e.g. the P=Pmax, w=Wmin spike that
    // pushed the old 0→colorMax scale to 0→5050 while the visible data sat in
    // ~200–1600 MHz). Colors and colorbar share the same [colorLo,colorHi]
    // linear mapping, so tick values stay self-consistent with what is drawn.
    var allVals = [];
    for (var av = 0; av < ny; av++) {
      for (var au = 0; au < nx; au++) allVals.push(grid[av][au]);
    }
    allVals.sort(function(a, b) { return a - b; });
    function pctOf(arr, q) {
      var idx = q * (arr.length - 1);
      var lo = Math.floor(idx), hi = Math.ceil(idx);
      if (lo === hi) return arr[lo];
      return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo);
    }
    var colorLo = pctOf(allVals, 0.02);
    var colorHi = pctOf(allVals, 0.98);
    if (!isFinite(colorHi) || colorHi <= 0) colorHi = colorMax;
    if (!isFinite(colorLo) || colorLo >= colorHi) colorLo = 0;
    var colorRange = colorHi - colorLo;

    var imgW = nx, imgH = ny;
    var imgData = ctx.createImageData(imgW, imgH);
    for (var iy2 = 0; iy2 < ny; iy2++) {
      for (var ix2 = 0; ix2 < nx; ix2++) {
        var t = colorRange > 0 ? Math.max(0, Math.min(1, (grid[iy2][ix2] - colorLo) / colorRange)) : (grid[iy2][ix2] > 0 ? 1 : 0);
        var rgb = turboColor(t);
        var idx = ((ny - 1 - iy2) * nx + ix2) * 4;
        imgData.data[idx] = rgb[0];
        imgData.data[idx + 1] = rgb[1];
        imgData.data[idx + 2] = rgb[2];
        imgData.data[idx + 3] = 255;
      }
    }
    var offCanvas = document.createElement('canvas');
    offCanvas.width = nx;
    offCanvas.height = ny;
    offCanvas.getContext('2d').putImageData(imgData, 0, 0);
    ctx.drawImage(offCanvas, pad.left, pad.top, plotW, plotH);

    var curW_disp = curW_um * wf;
    if (curP_mW > 0 && curW_um > 0 && (curP_mW * pf) <= Pmax && curW_disp >= Wmin && curW_disp <= Wmax) {
      var px = xScale(curP_mW * pf);
      var py = yScale(curW_disp);
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 14, 22, 0.9)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    drawHeatAxes(ctx, plotW, plotH, pad, xScale, yScale, Pmin, Pmax, Wmin, Wmax, W, H, pUnit, wUnit, isSigma);

    var cbX = W - 50;
    var cbW = 8;
    var cbTop = pad.top;
    var cbH = plotH;
    var cbCanvas = document.createElement('canvas');
    cbCanvas.width = 1;
    cbCanvas.height = 100;
    var cbCtx = cbCanvas.getContext('2d');
    var cbImg = cbCtx.createImageData(1, 100);
    for (var ci = 0; ci < 100; ci++) {
      var t2 = 1 - ci / 99;
      var rgb2 = turboColor(t2);
      var ci2 = ci * 4;
      cbImg.data[ci2] = rgb2[0];
      cbImg.data[ci2 + 1] = rgb2[1];
      cbImg.data[ci2 + 2] = rgb2[2];
      cbImg.data[ci2 + 3] = 255;
    }
    cbCtx.putImageData(cbImg, 0, 0);
    ctx.drawImage(cbCanvas, cbX, cbTop, cbW, cbH);

    ctx.fillStyle = '#7d88a0';
    ctx.strokeStyle = '#7d88a0';
    ctx.font = '10px Times New Roman, SimSun, Songti SC, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;
    var cbTicks = [0, 0.25, 0.5, 0.75, 1.0];
    cbTicks.forEach(function(fraction) {
      var y = cbTop + cbH * (1 - fraction);
      var v = (colorLo + fraction * colorRange) * rf;
      ctx.beginPath();
      ctx.moveTo(cbX + cbW, y);
      ctx.lineTo(cbX + cbW + 4, y);
      ctx.stroke();
      var label;
      if (v >= 1000) label = Math.round(v).toLocaleString();
      else if (v >= 1) label = v.toPrecision(3);
      else if (v >= 0.001) label = v.toPrecision(2);
      else label = v.toExponential(1);
      ctx.fillText(label + ' ' + rUnit, cbX + cbW + 6, y);
    });

    // Ω/2π label above colorbar
    ctx.fillStyle = '#9aa5be';
    ctx.font = '10px Times New Roman, SimSun, Songti SC, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Ω/2π', cbX + cbW / 2, cbTop - 3);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#7d88a0';
  }

  function drawHeatAxes(ctx, plotW, plotH, pad, xScale, yScale, Pmin, Pmax, Wmin, Wmax, W, H, pUnit, wUnit, isSigma) {
    ctx.strokeStyle = 'rgba(90, 101, 128, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.left, pad.top, plotW, plotH);

    ctx.fillStyle = '#7d88a0';
    ctx.font = '11px Times New Roman, SimSun, Songti SC, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var nXTicks = 5;
    for (var xi = 0; xi <= nXTicks; xi++) {
      var pDisp = Pmin + (Pmax - Pmin) * xi / nXTicks;
      var x = xScale(pDisp);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.strokeStyle = 'rgba(90, 101, 128, 0.12)';
      ctx.stroke();
      ctx.fillText(fmtAxisNum(pDisp), x, pad.top + plotH + 8);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    var nYTicks = 4;
    for (var yi = 0; yi <= nYTicks; yi++) {
      var wDisp = Wmin + (Wmax - Wmin) * yi / nYTicks;
      var y = yScale(wDisp);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.strokeStyle = 'rgba(90, 101, 128, 0.12)';
      ctx.stroke();
      ctx.fillText(fmtAxisNum(wDisp), pad.left - 8, y);
    }

    ctx.fillStyle = '#7d88a0';
    ctx.font = '11px Times New Roman, SimSun, Songti SC, serif';
    ctx.textAlign = 'center';
    var xLabel = isSigma ? '2P (σ view) (' + pUnit + ')' : 'Power (' + pUnit + ')';
    ctx.fillText(xLabel, pad.left + plotW / 2, H - 14);
    ctx.save();
    ctx.translate(16, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Beam waist w₀ (' + wUnit + ')', 0, 0);
    ctx.restore();
  }

  function fmtAxisNum(v) {
    if (Math.abs(v) >= 1e6) return (v/1e6).toFixed(0) + 'M';
    if (Math.abs(v) >= 1e3) return (v/1e3).toFixed(v < 1e4 ? 1 : 0) + 'k';
    if (Math.abs(v) >= 1) return v.toFixed(0);
    return v.toFixed(v < 0.1 ? 2 : 1);
  }
  // Heatmap hover
  var heatWrap = document.getElementById('rpHeatWrap');
  heatCanvas.addEventListener('mousemove', function(e) {
    var state = calculator ? calculator.getState() : null;
    if (!state || !(state.dEff > 0)) { heatTip.classList.remove('show'); return; }
    var rect = heatCanvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var plotW = rect.width - pad.left - pad.right;
    var plotH = rect.height - pad.top - pad.bottom;
    if (mx < pad.left || mx > pad.left + plotW || my < pad.top || my > pad.top + plotH) {
      heatTip.classList.remove('show'); return;
    }
    var hr = getHeatRange();
    var pUnit = hr.pUnit;
    var wUnit = hr.wUnit;
    var pf = hr.pf;
    var wf = hr.wf;
    var rf = rabiDispFactor();
    var rUnit = getRabiUnitLabel();
    var Pmax = hr.Pmax;
    var Pmin = hr.Pmin;
    var Wmax = hr.Wmax;
    var Wmin = hr.Wmin;
    var P_disp = Pmin + (mx - pad.left) / plotW * (Pmax - Pmin);
    var w_disp = Wmin + (plotH - (my - pad.top)) / plotH * (Wmax - Wmin);
    var w = w_disp / wf;
    if (P_disp <= 0 || w <= 0) { heatTip.classList.remove('show'); return; }
    var P_mW = P_disp / pf;
    var d = (state.selectedChannel && Math.abs(state.selectedChannel.matEl) > 0)
      ? Math.abs(state.selectedChannel.matEl)
      : (state.dEff > 0 ? state.dEff : 0);
    var fR_disp = rabiHz(d, P_mW, w) / 1e6 * rf;
    heatTip.innerHTML = 'P = ' + P_disp.toPrecision(3) + ' ' + pUnit + ' · w₀ = ' + w_disp.toPrecision(3) + ' ' + wUnit + '<br>Ω/2π = <strong>' + fR_disp.toPrecision(3) + ' ' + rUnit + '</strong>';
    heatTip.classList.add('show');
    var tipRect = heatTip.getBoundingClientRect();
    var tipX = mx + 12;
    var tipY = my - 12 - tipRect.height;
    if (tipX + tipRect.width > rect.width) tipX = mx - 12 - tipRect.width;
    if (tipY < 0) tipY = my + 12;
    heatTip.style.left = tipX + 'px';
    heatTip.style.top = tipY + 'px';
  });
  heatCanvas.addEventListener('mouseleave', function() { heatTip.classList.remove('show'); });

  // ===== Redraw =====
  function redrawAll() {
    var state = calculator ? calculator.getState() : null;
    if (!state) return;
    var d = 0;
    if (state.selectedChannel && Math.abs(state.selectedChannel.matEl) > 0) {
      d = Math.abs(state.selectedChannel.matEl);
    } else if (state.dEff > 0) {
      d = state.dEff;
    }
    if (!(d > 0)) {
      curveGeom=null;curveTip.classList.remove('show');heatTip.classList.remove('show');
      [curveCanvas,heatCanvas].forEach(canvas=>{const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.fillStyle='#a0adc5';ctx.font='14px Times New Roman, SimSun, serif';ctx.fillText('当前通道无适用的 E1 计算结果',20,36);ctx.restore();});
      updateTopLegends();return;
    }
    autoAdjustAxes();
    drawCurveChart(d, state.P_mW, state.w_um);
    drawHeatmap(d, state.P_mW, state.w_um);
    updateTopLegends();
    updateAxisUI();
  }

  window.addEventListener('resize', () => requestAnimationFrame(redrawAll));
  // A selected solve direction makes the two independent inputs explicit.
  const calcP=document.getElementById('rpCalcP');
  const calcR=document.getElementById('rpCalcR');
  const calcW=document.getElementById('rpCalcW');
  const calcFields={power:calcP,rabi:calcR,waist:calcW};
  const calcUnitSels={
    power:document.querySelector('.rp-calc-unit[data-field="power"]'),
    rabi:document.querySelector('.rp-calc-unit[data-field="rabi"]'),
    waist:document.querySelector('.rp-calc-unit[data-field="waist"]')
  };
  const kinds={power:'power',rabi:'frequency',waist:'length'};
  const bases={power:'mW',rabi:'MHz',waist:'µm'};
  const calcUnits={power:'mW',rabi:'MHz',waist:'µm'};
  const direction=document.getElementById('calcSolveFor');
  const errorElement=document.getElementById('inputError');
  let refreshing=false;
  function getDEffForViz(){return calculator.getState().dEff || 0;}
  function numberString(value){return value===0?'0':String(Number(value.toPrecision(6)));}
  function asBase(key,value){return convert(value,kinds[key],calcUnits[key],bases[key]);}
  function asDisplay(key,value){return convert(value,kinds[key],bases[key],calcUnits[key]);}
  function bestUnit(key,value){
    const options=key==='power'?['W','mW','µW','nW']:key==='rabi'?['GHz','MHz','kHz','Hz']:['mm','µm','nm'];
    return options.find(unit=>{const n=Math.abs(convert(value,kinds[key],bases[key],unit));return n>=1&&n<1000;})||bases[key];
  }
  function reflectDirection(){
    for(const [key,input] of Object.entries(calcFields)){
      input.readOnly=key===direction.value;
      input.setAttribute('aria-label',({power:'功率 P',rabi:'Rabi 普通频率 Ω/2π',waist:'束腰 w₀'})[key]+(input.readOnly?'（计算结果）':'（输入）'));
      input.parentElement.classList.toggle('auto',input.readOnly);
    }
  }
  function calculate(){
    if(refreshing)return;
    refreshing=true;
    const target=direction.value;
    try{
      reflectDirection();
      const s=calculator.getState(),d=getDEffForViz();
      if(!s.transition)throw Error('请先选择跃迁。');
      if(!(d>0))throw Error(s.transition.multipole?.startsWith('M2')?'该跃迁为 M2，当前单光子 E1 计算不适用。':'当前选择没有可用的 E1 矩阵元或允许通道。');
      const values={};
      for(const [key,input] of Object.entries(calcFields)){
        input.removeAttribute('aria-invalid');
        if(key===target)continue;
        const raw=input.value.trim(),n=Number(raw);
        if(raw===''||!Number.isFinite(n)||n<0||(key==='waist'&&n===0)){
          input.setAttribute('aria-invalid','true');
          throw Error(({power:'功率 P 必须为不小于零的有限数值。',rabi:'Ω/2π 必须为不小于零的有限数值。',waist:'束腰 w₀ 必须为大于零的有限数值。'})[key]);
        }
        values[key]=asBase(key,n);
      }
      let result;
      if(target==='rabi')result=rabiHz(d,values.power,values.waist)/1e6;
      if(target==='power')result=powerFromRabiHz(d,values.rabi*1e6,values.waist);
      if(target==='waist')result=waistFromRabiHz(d,values.rabi*1e6,values.power);
      if(!Number.isFinite(result)||result<0)throw Error('这组输入无法得到有限的结果，请检查计算方向和参数。');
      values[target]=result;
      const unit=bestUnit(target,result);
      calcUnits[target]=unit;calcUnitSels[target].value=unit;
      calcFields[target].value=numberString(asDisplay(target,result));
      errorElement.hidden=true;errorElement.textContent='';
      const savedUnits=calculator.getState().calculatorUnits;
      const units= savedUnits&&Object.keys(calcUnits).every(k=>savedUnits[k]===calcUnits[k]) ? savedUnits : {...calcUnits};
      calculator.patchInputs({P_mW:values.power,w_um:values.waist,fR_MHz:values.rabi,inputStatus:'valid',inputError:null,solveFor:target,calcMode:target==='power'?'rabi':'power',calculatorUnits:units});
      if(target!=='waist'&&values.waist>0&&!waistSeries.some(w=>Math.abs(w-values.waist)<.01)){
        waistSeries.push(values.waist);curveVisible.push(true);waistIsDefault.push(false);rebuildLegend();
      }
      redrawAll();
    }catch(error){
      calcFields[target].value='';
      errorElement.textContent=error.message;
      errorElement.hidden=false;
      const current=calculator.getState();
      calculator.patchInputs({P_mW:null,w_um:null,fR_MHz:null,inputStatus:current.dEff>0?'invalid':'unsupported',inputError:error.message,solveFor:target});
      // Keep the physical curves available, but remove the invalid work point.
      redrawAll();
    }finally{refreshing=false;}
  }
  for(const [key,input] of Object.entries(calcFields)){
    input.addEventListener('input',()=>{
      if(key===direction.value)return;
      calculate();
    });
    calcUnitSels[key].addEventListener('change',()=>{
      const old=calcUnits[key],unit=calcUnitSels[key].value;
      const value=Number(input.value);
      if(input.value.trim()!==''&&Number.isFinite(value))input.value=numberString(convert(value,kinds[key],old,unit));
      calcUnits[key]=unit;
      calculate();
    });
  }
  direction.addEventListener('change',calculate);
  document.getElementById('powerAxisConvention').addEventListener('change',()=>{redrawAll();document.getElementById('powerConvention').textContent=getPFactor()===2?'σ± 图横轴显示 2P；计算输入仍为偏振分量功率 P。这是换算视图，不是实验标定。':'图横轴与计算输入均为偏振分量功率 P；w₀ 为 1/e² 强度半径。';});
  calcP.value='1';calcW.value='50';
  direction.value='rabi';
  calculator.onChange(()=>{if(!refreshing)calculate();});
  return Object.freeze({
    redraw:redrawAll,
    getConfiguration:()=>({solveFor:direction.value,units:{...calcUnits}}),
    applyConfiguration(snapshot,ui={}){
      const values={power:snapshot.P_mW,rabi:snapshot.fR_MHz,waist:snapshot.w_um};
      direction.value=['power','rabi','waist'].includes(ui.solveFor)?ui.solveFor:'rabi';
      for(const key of Object.keys(calcFields)){
        const unit=ui.units?.[key];
        if(unit&&Array.from(calcUnitSels[key].options).some(o=>o.value===unit)){calcUnits[key]=unit;calcUnitSels[key].value=unit;}
        calcFields[key].value=Number.isFinite(values[key])?numberString(asDisplay(key,values[key])):'';
      }
      calculate();
    }
  });

}
