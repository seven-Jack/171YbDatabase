export function formatLifetime(ns) {
  const val = parseFloat(ns);
  if (isNaN(val)) return String(ns);
  if (val >= 1e12) return (val / 1e12).toFixed(1) + ' s';
  if (val >= 1e9) return (val / 1e9).toFixed(1) + ' s';
  if (val >= 1e6) return (val / 1e6).toFixed(2) + ' ms';
  if (val >= 1e3) return (val / 1e3).toFixed(2) + ' µs';
  return val.toFixed(2) + ' ns';
}

export function signedScientific(value, places = 9) {
  const [mantissa, exponent] = Math.abs(value).toExponential(places).split('e');
  const superscript = exponent.replace(/[-+0-9]/g, char => ({'-':'⁻','+':'⁺'}[char] || '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(char)]));
  return `${value < 0 ? '−' : '+'}${mantissa} × 10${superscript}`;
}
