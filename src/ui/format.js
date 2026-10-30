export function formatLifetime(ns) {
  const val = parseFloat(ns);
  if (isNaN(val)) return String(ns);
  if (val >= 1e12) return (val / 1e12).toFixed(1) + ' s';
  if (val >= 1e9) return (val / 1e9).toFixed(1) + ' s';
  if (val >= 1e6) return (val / 1e6).toFixed(2) + ' ms';
  if (val >= 1e3) return (val / 1e3).toFixed(2) + ' µs';
  return val.toFixed(2) + ' ns';
}
