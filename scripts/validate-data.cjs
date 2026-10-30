const fs = require('node:fs');
const path = require('node:path');

const DATA_FILES = ['levels.json', 'transitions.json', 'hyperfine.json', 'sources.json', 'estimates.json'];
const PROJECT_ROOT = path.resolve(__dirname, '..');
const EXPECTED_UNITS = {wavelength_vac_nm:'nm', wavelength_air_nm:'nm', frequency_THz:'THz', energy_eV:'eV', energy_cm:'cm^-1', Gamma_per_s_num:'s^-1', lifetime_ns:'ns', oscillator_strength_f_num:'dimensionless', d_num:'e*a0', linewidth_frequency_coefficient_Hz:'Hz'};
const fail = (location, message) => { throw new Error(`${location}: ${message}`); };
const typeMatches = (value, type) => type === 'null' ? value === null : type === 'array' ? Array.isArray(value) : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : type === 'number' ? typeof value === 'number' && Number.isFinite(value) : typeof value === type;

// A dependency-free evaluator for the explicit schema keywords used in this
// repository. Unknown keywords are rejected rather than silently ignored.
function validateSchema(value, schema, location, schemas) {
  if (schema.$ref) {
    if (!schemas[schema.$ref]) fail(location, `unknown schema ${schema.$ref}`);
    return validateSchema(value, schemas[schema.$ref], location, schemas);
  }
  const supported = new Set(['$schema','$id','title','type','required','properties','additionalProperties','items','enum','minLength','minItems','minProperties','minimum','pattern']);
  for (const key of Object.keys(schema)) if (!supported.has(key)) fail(location, `unsupported schema keyword ${key}`);
  if (schema.type && ![].concat(schema.type).some(type => typeMatches(value,type))) fail(location, `expected ${[].concat(schema.type).join(' or ')}`);
  if (schema.enum && !schema.enum.some(item => Object.is(item, value))) fail(location, `must be one of ${schema.enum.join(', ')}`);
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) fail(location, 'must not be empty');
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) fail(location, `does not match ${schema.pattern}`);
  }
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) fail(location, `must be at least ${schema.minimum}`);
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) fail(location, `needs at least ${schema.minItems} entries`);
    if (schema.items) value.forEach((item, index) => validateSchema(item, schema.items, `${location}[${index}]`, schemas));
  } else if (value !== null && typeof value === 'object') {
    if (schema.minProperties !== undefined && Object.keys(value).length < schema.minProperties) fail(location, 'must not be empty');
    for (const key of schema.required || []) if (!Object.hasOwn(value,key)) fail(`${location}.${key}`, 'required field missing');
    for (const [key,item] of Object.entries(value)) {
      const itemSchema = schema.properties?.[key];
      if (itemSchema) validateSchema(item,itemSchema,`${location}.${key}`,schemas);
      else if (schema.additionalProperties === false) fail(`${location}.${key}`,'unknown field');
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') validateSchema(item,schema.additionalProperties,`${location}.${key}`,schemas);
    }
  }
}

function loadCatalog(root = PROJECT_ROOT) {
  return Object.fromEntries(DATA_FILES.map(filename => [filename.replace('.json',''),JSON.parse(fs.readFileSync(path.join(root,'data',filename),'utf8'))]));
}

function validateCatalog(catalog, root = PROJECT_ROOT) {
  const schemas = Object.fromEntries(['quantity.schema.json','transition.schema.json'].map(filename => [filename,JSON.parse(fs.readFileSync(path.join(root,'schemas',filename),'utf8'))]));
  const {levels,transitions,hyperfine,sources,estimates} = catalog;
  for (const [name,document] of Object.entries(catalog)) if (document.schemaVersion !== 1) fail(`data/${name}.json.schemaVersion`,'unsupported version');
  const allSources = [...sources.references,...sources.sources];
  const sourceIds = new Set();
  for (const source of allSources) {
    if (!source.id || sourceIds.has(source.id)) fail('data/sources.json',`duplicate or missing source ID ${source.id}`);
    sourceIds.add(source.id);
    if (!source.reviewStatus || !source.rightsStatus) fail(`source.${source.id}`,'review and rights status required');
  }
  const levelIds = new Set();
  function checkQuantity(quantity, location) {
    validateSchema(quantity,schemas['quantity.schema.json'],location,schemas);
    if (!sourceIds.has(quantity.sourceId)) fail(`${location}.sourceId`,`unresolved source ${quantity.sourceId}`);
    if (quantity.value === null && !quantity.missingReason) fail(`${location}.missingReason`,'null quantity requires a reason');
    if (quantity.uncertainty === null && !quantity.uncertaintyNote) fail(`${location}.uncertaintyNote`,'unknown uncertainty requires a note');
    if (quantity.evidenceKind === 'derived' && !quantity.derivedFrom?.length) fail(`${location}.derivedFrom`,'derived value requires its inputs');
    if (quantity.evidenceKind === 'scaling-estimate' && !quantity.modelId) fail(`${location}.modelId`,'estimate requires model ID');
  }
  for (const level of levels.records) {
    if (!level.id || levelIds.has(level.id)) fail('data/levels.json',`duplicate or missing level ID ${level.id}`);
    levelIds.add(level.id);
    if (level.isotope !== 171 || !level.energyReference || !level.attributes.term) fail(`level.${level.id}`,'isotope, term and energy reference required');
    for (const [field,quantity] of Object.entries(level.quantities)) {
      checkQuantity(quantity,`level.${level.id}.${field}`);
      if (quantity.unit !== EXPECTED_UNITS[field]) fail(`level.${level.id}.${field}.unit`,'incorrect unit for field');
    }
  }
  const transitionIds = new Set();
  for (const transition of transitions.records) {
    const location=`transition.${transition.id}`;
    validateSchema(transition,schemas['transition.schema.json'],location,schemas);
    if (transitionIds.has(transition.id)) fail(location,'duplicate ID');
    transitionIds.add(transition.id);
    for (const field of ['lowerLevelId','upperLevelId']) if (!levelIds.has(transition[field])) fail(`${location}.${field}`,'unresolved level reference');
    for (const [field,quantity] of Object.entries(transition.quantities)) {
      checkQuantity(quantity,`${location}.${field}`);
      if (quantity.unit !== EXPECTED_UNITS[field]) fail(`${location}.${field}.unit`,'incorrect unit for field');
    }
    for (const [viewName,view] of Object.entries(transition.views)) {
      for (const [field,quantityName] of Object.entries({...view.quantityFields,...view.aliases})) if (!transition.quantities[quantityName]) fail(`${location}.views.${viewName}.${field}`,'unresolved quantity alias');
    }
  }
  function checkList(ids, valid, location) {
    if (!Array.isArray(ids) || new Set(ids).size !== ids.length) fail(location,'IDs must be an array without duplicates');
    ids.forEach(id => { if (!valid.has(id)) fail(location,`unresolved reference ${id}`); });
  }
  checkList(levels.coreLevelIds,levelIds,'levels.coreLevelIds');
  checkList(transitions.coreTransitionIds,transitionIds,'transitions.coreTransitionIds');
  checkList(transitions.rydbergTransitionIds,transitionIds,'transitions.rydbergTransitionIds');
  for (const [view,ids] of [['core',transitions.coreTransitionIds],['rydberg',transitions.rydbergTransitionIds]]) {
    ids.forEach(id=>{if(!transitions.records.find(record=>record.id===id)?.views[view])fail(`transitions.${view}.${id}`,'missing presentation view');});
  }
  for (const role of levels.lowStateRoles) if (!levelIds.has(role.levelId)) fail('levels.lowStateRoles','unresolved level reference');
  for (const group of levels.rydbergGroups) {
    if (!levelIds.has(group.levelId)) fail(`levels.rydbergGroups.${group.label}.levelId`,'unresolved level reference');
    if (!estimates.quantumDefects.some(defect=>defect.series===group.quantumDefectId)) fail(`levels.rydbergGroups.${group.label}.quantumDefectId`,'unresolved quantum-defect reference');
  }
  for (const [term,entry] of Object.entries(hyperfine.states)) {
    if (!levelIds.has(entry.levelId) || !sourceIds.has(entry.sourceId)) fail(`hyperfine.${term}`,'unresolved level/source');
    if (entry.unit !== 'MHz' || !Number.isFinite(entry.legacy.A)) fail(`hyperfine.${term}`,'hyperfine frequency must be finite MHz');
  }
  const saved = hyperfine.saved65S;
  if (!sourceIds.has(saved.sourceId) || !levelIds.has(saved.levelId)) fail('hyperfine.saved65S','unresolved level/source');
  if (saved.conditions.magneticField_G !== 0) fail('hyperfine.saved65S.conditions','saved dataset is zero field');
  const {columns,rows} = saved.csv;
  if (new Set(columns).size !== columns.length || rows.length !== 2) fail('hyperfine.saved65S.csv','unique columns and exactly two branch rows required');
  const expectedFs = new Set([0.5,1.5]);
  for (const [i,row] of rows.entries()) {
    for (const column of columns) {
      if (!Object.hasOwn(row,column)) fail(`hyperfine.saved65S.csv.rows[${i}].${column}`,'missing cell');
      if (String(row[column]).trim()==='' || (column !== 'term' && !Number.isFinite(Number(row[column])))) fail(`hyperfine.saved65S.csv.rows[${i}].${column}`,'expected nonempty text or finite numeric CSV cell');
    }
    if (!expectedFs.delete(Number(row.F))) fail(`hyperfine.saved65S.csv.rows[${i}].F`,'duplicate or unexpected branch');
  }
  if (estimates.evidenceKind !== 'scaling-estimate' || !estimates.scope || !estimates.modelId) fail('estimates','explicit model boundary required');
  return {levels:levelIds.size,transitions:transitionIds.size,coreTransitions:transitions.coreTransitionIds.length,sources:sourceIds.size};
}

module.exports = {DATA_FILES,EXPECTED_UNITS,loadCatalog,validateCatalog,validateSchema};
if (require.main === module) {
  try { console.log('Data validation passed:',JSON.stringify(validateCatalog(loadCatalog()))); }
  catch (error) { console.error(error.message); process.exitCode=1; }
}
