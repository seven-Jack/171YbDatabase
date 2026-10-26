import { CIE_1931 } from './spectrum-data.js';

/** Display convention, not a sharp physiological limit. */
export const VISIBLE_RANGE_NM = Object.freeze([380, 780]);
export function wavelengthAppearance(wavelengthNm) {
  if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) {
    return { color: '#aab4c8', region: 'unknown', label: '波长待核查', dash: '3 4' };
  }
  if (wavelengthNm < VISIBLE_RANGE_NM[0]) {
    return { color: '#b8c4da', region: 'UV', label: 'UV · 紫外（不可见）', dash: '3 4' };
  }
  if (wavelengthNm > VISIBLE_RANGE_NM[1]) {
    return { color: '#d1beb2', region: 'IR', label: 'IR · 红外（不可见）', dash: '8 4' };
  }
  const base = Math.floor(wavelengthNm), t = wavelengthNm - base;
  const a = CIE_1931[base - 360], b = CIE_1931[Math.min(base + 1, 830) - 360];
  const xyz = [1, 2, 3].map(i => a[i] + (b[i] - a[i]) * t);
  const [x, y, z] = xyz;
  let rgb = [3.2406255*x - 1.537208*y - .4986286*z,
    -.9689307*x + 1.8757561*y + .0415175*z,
    .0557101*x - .2040211*y + 1.0569959*z].map(v => Math.max(0, v));
  const peak = Math.max(...rgb);
  rgb = rgb.map(v => v / peak);
  const encode = v => v <= .0031308 ? 12.92*v : 1.055*Math.pow(v, 1/2.4)-.055;
  const color = '#'+rgb.map(v => Math.round(encode(v)*255).toString(16).padStart(2,'0')).join('');
  return { color, region: 'visible', label: '可见光 · 波长近似色', dash: '' };
}
export function decorateTransition(transition) {
  const spectrum = wavelengthAppearance(transition.wavelength_vac_nm);
  return { ...transition, color: spectrum.color, spectrum };
}
