import {getQuantity} from '../data/catalog.js';
import {createFieldView, conventionLabel, evidenceLabel, reviewLabel} from './source-panel.js';
import {wavelengthAppearance} from './spectral-color.js';

export const COMPARISON_LIMIT = 3;
export const COMPARISON_FIELDS = Object.freeze([
  {key:'wavelength_vac_nm', label:'真空波长 λ'},
  {key:'energy_eV', label:'能量差 ΔE'},
  {key:'d_num', label:'约化矩阵元 d'},
  {key:'lifetime_ns', label:'原记录寿命 τ'}
]);

/** Superscript/subscript term labels and full-width input share one search form. */
export function normalizeSearch(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('en')
    .replace(/[→⇄↔/|·,，;；()（）]+/g,' ').replace(/\s+/g,' ').trim();
}

function fieldSnapshot(id,key) {
  const quantity=getQuantity(id,key), view=createFieldView(id,key);
  const missing=!quantity || !Number.isFinite(quantity.value);
  const valueText=missing
    ? (!view || view.valueText.includes('缺失') ? view?.valueText || '缺失：原记录未提供' : `缺失 · ${view.valueText}`)
    : view.valueText;
  return Object.freeze({
    key, value:missing?null:quantity.value, missing, valueText,
    convention:quantity?.convention || null,
    conventionText:quantity?.convention?conventionLabel(quantity.convention):null,
    evidenceKind:quantity?.evidenceKind || null,
    evidenceText:view?.kind || evidenceLabel(null),
    reviewStatus:quantity?.reviewStatus || null,
    reviewText:view?.review || reviewLabel(null),
    missingArtifact:Boolean(view?.missingArtifact)
  });
}

export function buildExplorerRecords(transitions=[]) {
  return transitions.map((transition,index)=>{
    const fields=Object.fromEntries(COMPARISON_FIELDS.map(({key})=>[key,fieldSnapshot(transition.id,key)]));
    const wavelength=fields.wavelength_vac_nm.value;
    const spectrum=transition.spectrum || wavelengthAppearance(wavelength);
    const strength=String(transition.classification || '').startsWith('禁戒')?'forbidden'
      :String(transition.classification || '').startsWith('弱')?'weak'
      :String(transition.classification || '').startsWith('强')?'strong':'unknown';
    const dipole=fields.d_num;
    const searchText=normalizeSearch([
      transition.id,transition.lower,transition.upper,transition.label,
      transition.purpose,transition.use,transition.classification,transition.multipole,
      wavelength,Number.isFinite(wavelength)?wavelength.toFixed(1):'',
      spectrum.label,dipole.conventionText,dipole.evidenceText,
      /MOT/i.test(transition.label || '')?'冷却 磁光阱':'',
      /repumper/i.test(transition.label || '')?'重泵 回泵':'',
      /slower/i.test(transition.label || '')?'减速':'',
      /qubit/i.test(transition.label || '')?'量子比特':'',
      transition.hf_induced?'超精细诱导':''
    ].filter(value=>value!==null&&value!==undefined).join(' '));
    return Object.freeze({
      id:transition.id,index,transition,fields,wavelength,
      region:spectrum.region,strength,evidenceKind:dipole.evidenceKind,
      convention:dipole.convention,searchText
    });
  });
}

export function filterExplorerRecords(records,{query='',region='all',strength='all',evidence='all',sort='default'}={}) {
  const tokens=normalizeSearch(query).split(' ').filter(Boolean);
  const matches=records.filter(record=>tokens.every(token=>record.searchText.includes(token))
    &&(region==='all'||record.region===region)
    &&(strength==='all'||record.strength===strength)
    &&(evidence==='all'||(evidence==='missing'?record.fields.d_num.missing:record.evidenceKind===evidence)));
  if (sort==='wavelength-asc'||sort==='wavelength-desc') {
    const direction=sort==='wavelength-asc'?1:-1;
    matches.sort((a,b)=>{
      const aValid=Number.isFinite(a.wavelength),bValid=Number.isFinite(b.wavelength);
      if (aValid!==bValid) return aValid?-1:1;
      return aValid?(a.wavelength-b.wavelength)*direction||a.index-b.index:a.index-b.index;
    });
  } else matches.sort((a,b)=>a.index-b.index);
  return matches;
}

/** Selection state is independent of search results and the calculator. */
export function toggleComparison(currentIds,id,limit=COMPARISON_LIMIT) {
  const ids=[...new Set(currentIds)];
  if (ids.includes(id)) return {ids:ids.filter(value=>value!==id),action:'removed'};
  if (ids.length>=limit) return {ids,action:'limit'};
  return {ids:[...ids,id],action:'added'};
}

export function comparisonConventions(records,ids) {
  const selected=ids.map(id=>records.find(record=>record.id===id)).filter(Boolean);
  const conventions=[...new Set(selected.map(record=>record.convention || 'unknown'))];
  return {
    conventions,
    mixed:conventions.length>1,
    hasMissing:selected.some(record=>record.fields.d_num.missing),
    text:conventions.length>1
      ?'所选矩阵元含不同约定，请逐列辨认 J / F 级与缺失状态。'
      :'矩阵元约定列于各数值下；此处比较原记录参数。'
  };
}
