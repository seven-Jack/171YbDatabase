/** Display geometry only. Input/output coordinates use CSS pixels, not canvas backing pixels. */
const finite = Number.isFinite;
const isPoint = point => !!point && finite(point.x) && finite(point.y);

function plotBounds(rect) {
  if (!rect || !finite(rect.left) || !finite(rect.top) || !(rect.width > 0) || !(rect.height > 0)
      || !finite(rect.width) || !finite(rect.height)) return null;
  const right = rect.left + rect.width, bottom = rect.top + rect.height;
  if (!finite(right) || !finite(bottom) || right <= rect.left || bottom <= rect.top) return null;
  return {...rect, right, bottom};
}

const inside = (point, bounds) => point.x >= bounds.left && point.x <= bounds.right
  && point.y >= bounds.top && point.y <= bounds.bottom;

/** Liang-Barsky clipping excludes off-plot portions of an otherwise visible series. */
function clipSegment(a, b, bounds) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (!finite(dx) || !finite(dy)) return null;
  const p = [-dx, dx, -dy, dy];
  const q = [a.x - bounds.left, bounds.right - a.x, a.y - bounds.top, bounds.bottom - a.y];
  let from = 0, to = 1;
  for (let index = 0; index < 4; index++) {
    if (p[index] === 0) {
      if (q[index] < 0) return null;
      continue;
    }
    const ratio = q[index] / p[index];
    if (p[index] < 0) from = Math.max(from, ratio);
    else to = Math.min(to, ratio);
    if (from > to) return null;
  }
  const boundX = value => Math.max(bounds.left, Math.min(bounds.right, value));
  const boundY = value => Math.max(bounds.top, Math.min(bounds.bottom, value));
  return {
    a:{x:boundX(a.x + from * dx), y:boundY(a.y + from * dy)},
    b:{x:boundX(a.x + to * dx), y:boundY(a.y + to * dy)},
    from, to,
  };
}

/**
 * Find the nearest visible, clipped curve segment within maxDistance CSS pixels.
 * The caller converts returned x through its current linear/log axis and evaluates
 * the original model. The projected segment y is hit-test geometry, not a value.
 */
export function findNearestCurvePoint({x, y, curves, rect, maxDistance = 18} = {}) {
  const point = {x, y}, bounds = plotBounds(rect);
  if (!isPoint(point) || !bounds || !inside(point, bounds) || !Array.isArray(curves)
      || typeof maxDistance !== 'number' || Number.isNaN(maxDistance) || maxDistance < 0) return null;
  let best = null;
  curves.forEach((curve, curveIndex) => {
    if (!curve || curve.visible === false || !Array.isArray(curve.points)) return;
    const points = curve.points;
    const segmentCount = points.length === 1 ? 1 : points.length - 1;
    for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
      const a = points[segmentIndex], b = points[segmentIndex + 1] || a;
      if (!isPoint(a) || !isPoint(b)) continue;
      const clipped = clipSegment(a, b, bounds);
      if (!clipped) continue;
      const dx = clipped.b.x - clipped.a.x, dy = clipped.b.y - clipped.a.y;
      const lengthSquared = dx * dx + dy * dy;
      const segmentT = lengthSquared > 0
        ? Math.max(0, Math.min(1, ((x - clipped.a.x) * dx + (y - clipped.a.y) * dy) / lengthSquared)) : 0;
      const nearestX = clipped.a.x + segmentT * dx;
      const nearestY = clipped.a.y + segmentT * dy;
      const distance = Math.hypot(x - nearestX, y - nearestY);
      // Strict comparison makes exact ties stable in legend/series order.
      if (!finite(distance) || distance > maxDistance || best && distance >= best.distance) continue;
      best = {
        curveId:curve.id ?? curveIndex, curveIndex, segmentIndex,
        x:nearestX, y:nearestY, distance,
        segmentT:clipped.from + segmentT * (clipped.to - clipped.from),
      };
    }
  });
  return best;
}

/**
 * Display-only bounds around a positive working point in canonical mW/MHz/µm.
 * No calculator input, unit, polarization factor or physical equation is changed.
 */
export function buildFocusRanges({power, rabi, waist, scale = 'lin'} = {}) {
  if (![power, rabi, waist].every(value => finite(value) && value > 0) || !['lin','log'].includes(scale)) return null;
  const powerMin = scale === 'log' ? power / 10 : 0;
  const powerMax = power * (scale === 'log' ? 10 : 2);
  const rabiMax = rabi * 1.5;
  const waistMin = waist * .5, waistMax = waist * 1.5;
  const increasing = (minimum, maximum) => finite(minimum) && finite(maximum)
    && maximum > minimum && finite(maximum - minimum);
  if (!increasing(powerMin, powerMax) || !increasing(0, rabiMax) || !increasing(waistMin, waistMax)
      || scale === 'log' && powerMin <= 0 || waistMin <= 0) return null;
  return {powerMin, powerMax, rabiMax, waistMin, waistMax, scale};
}
