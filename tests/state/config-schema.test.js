import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CORE_TRANSITIONS} from '../../src/data/catalog.js';
import {DEFAULT_BEAM_DEFINITION} from '../../src/physics/beam-conventions.js';
import {CONFIG_SCHEMA_VERSION, exportCalculationConfig, parseCalculationConfig} from '../../src/state/config.js';

const schema = JSON.parse(readFileSync(new URL('../../schemas/calculation-config.schema.json', import.meta.url), 'utf8'));
const definitionKeys = Object.keys(DEFAULT_BEAM_DEFINITION).sort();
const conditionFor = version => schema.allOf.find(rule => rule.if?.properties?.schemaVersion?.const === version);
const stateFor = (solveFor = 'rabi') => ({
  transition:CORE_TRANSITIONS.find(item => item.id === 'T3'),
  J_lower:0, J_upper:0, F_lower:.5, F_upper:.5,
  pol:'pi', selectedChannel:null, P_mW:1, w_um:50, fR_MHz:.01,
  solveFor, calculatorUnits:{power:'mW',rabi:'kHz',waist:'µm'},
});

test('published config schema declares every field of actual v2 exports in all solve directions', () => {
  assert.deepEqual(schema.properties.schemaVersion.enum, [1, CONFIG_SCHEMA_VERSION]);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.kind.const, '171yb-rabi-config');
  for (const direction of ['rabi','power','waist']) {
    const config = exportCalculationConfig(stateFor(direction));
    assert.equal(config.schemaVersion, 2);
    assert.ok(Object.keys(config).every(key => Object.hasOwn(schema.properties, key)));
    assert.ok(schema.required.every(key => Object.hasOwn(config, key)));
    assert.equal(config.display.solveFor, direction);
    for (const key of ['selection','matrixElement','parameters','inputDefinition','enteredParameters','display','result']) {
      const definition = schema.properties[key];
      assert.equal(definition.additionalProperties, false, key);
      assert.ok(Object.keys(config[key]).every(field => Object.hasOwn(definition.properties, field)), key);
      assert.ok(definition.required.every(field => Object.hasOwn(config[key], field)), key);
    }
  }
});

test('schema v2 requires complete beam definitions and entered SI values', () => {
  const rule = conditionFor(2);
  assert.deepEqual(rule.if.required, ['schemaVersion']);
  assert.deepEqual(rule.then.required.slice().sort(), ['enteredParameters','inputDefinition']);
  assert.deepEqual(schema.properties.inputDefinition.required.slice().sort(), definitionKeys);
  assert.deepEqual(Object.keys(schema.properties.inputDefinition.properties).sort(), definitionKeys);
  assert.deepEqual(schema.properties.enteredParameters.required.slice().sort(), ['power_W','size_m']);
  assert.deepEqual(schema.properties.enteredParameters.properties.power_W, {type:'number',minimum:0});
  assert.deepEqual(schema.properties.enteredParameters.properties.size_m, {type:'number',exclusiveMinimum:0});
  const config = exportCalculationConfig(stateFor());
  for (const field of rule.then.required) {
    const incomplete = structuredClone(config);
    delete incomplete[field];
    assert.throws(() => parseCalculationConfig(incomplete));
  }
  for (const key of definitionKeys) {
    const incomplete = structuredClone(config);
    delete incomplete.inputDefinition[key];
    assert.throws(() => parseCalculationConfig(incomplete), key);
  }
});

test('schema v1 forbids v2-only fields and preserves the older optional display fields', () => {
  const rule = conditionFor(1);
  assert.deepEqual(rule.if.required, ['schemaVersion']);
  assert.deepEqual(rule.then.properties, {inputDefinition:false,enteredParameters:false});
  assert.ok(!schema.required.includes('inputDefinition'));
  assert.ok(!schema.required.includes('enteredParameters'));
  assert.ok(!schema.properties.display.required.includes('solveFor'));
  assert.ok(!schema.properties.display.required.includes('units'));
  const legacy = exportCalculationConfig(stateFor());
  legacy.schemaVersion = 1;
  delete legacy.inputDefinition;
  delete legacy.enteredParameters;
  delete legacy.display.solveFor;
  delete legacy.display.units;
  assert.equal(parseCalculationConfig(legacy).state.solveFor, 'rabi');
  for (const field of ['inputDefinition','enteredParameters']) {
    const forged = structuredClone(legacy);
    forged[field] = field === 'inputDefinition' ? {...DEFAULT_BEAM_DEFINITION} : {power_W:.001,size_m:50e-6};
    assert.throws(() => parseCalculationConfig(forged), /未知字段/);
  }
});

test('schema documents fractional input bounds while the existing parser enforces physical cross-field semantics', () => {
  const fields = schema.properties.inputDefinition.properties;
  assert.deepEqual(fields.powerPlane.enum, ['atoms','upstream']);
  assert.deepEqual(fields.powerBasis.enum, ['component','linear-total']);
  assert.deepEqual(fields.sizeKind.enum, ['radius','diameter']);
  assert.deepEqual(fields.linearOrientation.enum, [null,'parallel','perpendicular','manual']);
  assert.deepEqual(fields.transmission, {type:['number','null'],exclusiveMinimum:0,maximum:1});
  assert.deepEqual(fields.manualFraction, {type:['number','null'],minimum:0,maximum:1});
  const config = exportCalculationConfig(stateFor());
  config.inputDefinition.powerPlane = 'upstream';
  assert.throws(() => parseCalculationConfig(config), /传输效率/);
  config.inputDefinition.transmission = .5;
  assert.throws(() => parseCalculationConfig(config), /换算后的原子处分量功率不一致/);
  config.parameters.power_W = config.enteredParameters.power_W * .5;
  assert.equal(parseCalculationConfig(config).state.beamDefinition.transmission, .5);
});
