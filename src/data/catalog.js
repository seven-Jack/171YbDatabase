import {canonicalCatalog, datasetManifest} from './generated-catalog.js';

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const CATALOG = deepFreeze(canonicalCatalog);
export const DATASET_MANIFEST = deepFreeze(datasetManifest);
export const DATASET_VERSION = DATASET_MANIFEST.datasetVersion;
const levelById = new Map(CATALOG.levels.records.map(level => [level.id,level]));
const transitionById = new Map(CATALOG.transitions.records.map(transition => [transition.id,transition]));
const sourceById = new Map([...CATALOG.sources.references,...CATALOG.sources.sources].map(source=>[source.id,source]));

export const getLevelRecord = id => levelById.get(id) || null;
export const getTransitionRecord = id => transitionById.get(id) || null;
export const getSourceRecord = id => sourceById.get(id) || null;
export const getQuantity = (id,field) => transitionById.get(id)?.quantities[field] || null;

function legacyLevel(id) {
  const level=levelById.get(id);
  return {...level.attributes,...Object.fromEntries(Object.entries(level.quantities).map(([name,quantity])=>[name,quantity.value]))};
}

// These adapters preserve the public site's existing calculation inputs while
// canonical quantities, missing reasons and evidence remain available above.
function legacyTransition(id,viewName) {
  const record=transitionById.get(id),view=record.views[viewName];
  const result={...view.presentation};
  for (const [field,quantityName] of Object.entries({...view.quantityFields,...view.aliases})) {
    const value=record.quantities[quantityName].value;
    result[field]=value===null&&Object.hasOwn(view.legacyNullValues,quantityName)?view.legacyNullValues[quantityName]:value;
  }
  return result;
}

export const CORE_LEVELS = deepFreeze(CATALOG.levels.coreLevelIds.map(legacyLevel));
export const CORE_TRANSITIONS = deepFreeze(CATALOG.transitions.coreTransitionIds.map(id=>legacyTransition(id,'core')));
export const RYDBERG_QC_TRANSITIONS = deepFreeze(CATALOG.transitions.rydbergTransitionIds.map(id=>legacyTransition(id,'rydberg')));
export const QUANTUM_DEFECTS = CATALOG.estimates.quantumDefects;
export const REFERENCES = deepFreeze(CATALOG.sources.references.map(reference=>({num:reference.referenceNumber,title:reference.title,detail:reference.detail,doi:reference.publication})));
export const ESTIMATE_CONFIG = CATALOG.estimates;
export const {R_INF,E_I_CM,E_I_EV,A0_UM} = ESTIMATE_CONFIG.constants;
export const ns_values = ESTIMATE_CONFIG.ns_values;

export const RYDBERG_QC_DATA = deepFreeze({
  lowStates:CATALOG.levels.lowStateRoles.map(({levelId,role})=>{
    const level=legacyLevel(levelId);
    return {term:level.term,eV:level.energy_eV,parity:level.parity,role,cm:level.energy_cm};
  }),
  rydStates:CATALOG.levels.rydbergGroups.map(({levelId,quantumDefectId,...group})=>({
    ...group,
    J:levelById.get(levelId).attributes.J,
    parity:levelById.get(levelId).attributes.parity,
    Fs:(group.label==='65³S₁'?CATALOG.hyperfine.saved65S.csv.rows:CATALOG.hyperfine.states[group.label].legacy.levels).map(level=>Number(level.F)),
    delta:QUANTUM_DEFECTS.find(defect=>defect.series===quantumDefectId).delta0
  })),
  ionization:ESTIMATE_CONFIG.ionization
});

const saved65 = CATALOG.hyperfine.saved65S.csv.rows;
const savedF12 = saved65.find(row=>Number(row.F)===0.5);
export const HYPERFINE_DATA = deepFreeze({
  ...Object.fromEntries(Object.entries(CATALOG.hyperfine.states).map(([term,entry])=>[term,{J:levelById.get(entry.levelId).attributes.J,...entry.legacy}])),
  '65³S₁':{
    J:levelById.get(CATALOG.hyperfine.saved65S.levelId).attributes.J,A:Number(savedF12.A_eff_over_h_MHz),effective:true,
    splitting:Number(savedF12.splitting_F32_minus_F12_MHz),
    centroidGHz:Number(savedF12.selected_pair_centroid_over_h_Hz)/1e9,
    levels:saved65.map(row=>({F:Number(row.F),shift:Number(row.shift_over_h_MHz),nu:Number(row.nu_upper),energyGHz:Number(row.energy_over_h_Hz_relative_ionic_hfs_centroid)/1e9}))
  }
});
