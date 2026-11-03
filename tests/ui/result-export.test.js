import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS,getTransitionRecord,getLevelRecord,getQuantity,DATASET_VERSION,DATASET_MANIFEST} from '../../src/data/catalog.js';
import {computeCGChannels,computeDEff} from '../../src/physics/angular.js';
import {rabiHz} from '../../src/physics/rabi.js';
import {FORMULA_VERSION} from '../../src/physics/constants.js';
import {buildCalculationRecord} from '../../src/ui/calculation-record.js';
import {csvCell,serializeCSV,resultCSVRow,serializeResultCSV,formatCalculationSummary,canExportCurrentResult} from '../../src/ui/result-export.js';

const versions={softwareVersion:'0.3.3',appCommit:'9c8c6c66624336a11d7050f36a18e67e2827e342',worktreeDirty:false,datasetVersion:DATASET_VERSION,datasetHash:DATASET_MANIFEST.contentHash,formulaVersion:FORMULA_VERSION};
function stateFor(id='T2',patch={}){
  const transition=CORE_TRANSITIONS.find(t=>t.id===id),canonical=getTransitionRecord(id);
  const state={transition,J_lower:getLevelRecord(canonical.lowerLevelId).attributes.J,J_upper:getLevelRecord(canonical.upperLevelId).attributes.J,dReduced:getQuantity(id,'d_num').value??0,
    F_lower:.5,F_upper:id==='T4'?1.5:.5,pol:'pi',selectedChannel:null,P_mW:1,w_um:50,solveFor:'rabi',powerUnit:'mW',rabiUnit:'MHz',inputStatus:'valid',...patch};
  state.dEff=computeDEff(state).dEff;state.fR_MHz=state.dEff?rabiHz(state.dEff,state.P_mW,state.w_um)/1e6:0;return state;
}
function parseCSV(input){
  const text=input.replace(/^\uFEFF/,''),rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}
  return rows;
}

test('working-point CSV retains raw definitions, normalized SI values and the canonical actual channel',()=>{
  const state=stateFor('T3',{pol:'sigmap',P_mW:.4,w_um:50,
    beamDefinition:{powerPlane:'upstream',powerBasis:'linear-total',transmission:.8,linearOrientation:'perpendicular',manualFraction:null,sizeKind:'diameter'},
    beamInput:{power_mW:1,size_um:100},calculatorUnits:{power:'mW',rabi:'kHz',waist:'µm'}});
  state.selectedChannel=computeCGChannels(state).find(ch=>ch.q===1);state.dEff=computeDEff(state).dEff;state.fR_MHz=rabiHz(state.dEff,.4,50)/1e6;
  const before=structuredClone(state),record=buildCalculationRecord(state,versions),row=resultCSVRow(record);
  const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<=1e-12*Math.abs(expected));
  close(row.entered_power_W,.001);close(row.entered_size_m,100e-6);
  close(row.atom_component_power_W,.0004);close(row.intensity_radius_m,50e-6);
  assert.equal(row.power_basis,'linear-total');assert.equal(row.size_definition,'diameter');assert.equal(row.q,1);
  assert.equal(row.mF,-.5);assert.equal(row.mF_prime,.5);assert.equal(row.selection_origin,'manual');
  assert.equal(row.dipole_convention,'F-reduced-effective');assert.equal(row.source_id,'internal-t3-20260908');
  assert.equal(row.frequency_Hz,record.configuration.result.frequency_Hz);assert.equal(row.formula_version,FORMULA_VERSION);
  const csv=parseCSV(serializeResultCSV(record));assert.equal(csv.length,2);assert.equal(csv[0].length,csv[1].length);
  assert.deepEqual(state,before);assert.doesNotMatch(serializeResultCSV(record),/\/Users\/|file:\/\/|references\/papers\/|data\/literature\//);
});

test('zero drive uses explicit infinite time while missing uncertainty stays unknown, not zero',()=>{
  const record=buildCalculationRecord(stateFor('R2',{P_mW:0}),versions),row=resultCSVRow(record);
  assert.equal(row.frequency_Hz,0);assert.equal(row.omega_rad_s,0);assert.equal(row.pi_time_s,'infinity');
  assert.equal(row.pi_time_status,'infinite-zero-coupling');assert.equal(row.dipole_uncertainty_ea0,null);
  assert.equal(row.dipole_uncertainty_status,'unknown');assert.equal(row.total_rabi_uncertainty_status,'not-established');
  assert.match(serializeResultCSV(record),/"infinity"/);assert.match(serializeResultCSV(record),/"unknown"/);
  assert.match(formatCalculationSummary(record),/tπ=∞（零耦合）/);assert.match(formatCalculationSummary(record),/不确定度=未知/);
});

test('CSV text is RFC-escaped and formula-safe without coercing typed quantum numbers',()=>{
  for(const value of ['=SUM(1,2)','+x','-cmd','@value','\t=bad','  =bad'])assert.ok(parseCSV(serializeCSV(['value'],[{value}]))[1][0].startsWith("'"));
  assert.equal(csvCell(-.5),'-0.5'); // Typed mF remains a numeric CSV cell.
  const values=['comma, value','quote "value"','line\none','中文'];
  const parsed=parseCSV(serializeCSV(['value'],values.map(value=>({value}))));
  assert.deepEqual(parsed.slice(1).map(row=>row[0]),values);
});

test('summary preserves channel, adopted source and code/experiment boundaries in all solve directions',()=>{
  for(const solveFor of ['rabi','power','waist']){
    const state=stateFor('T3',{solveFor}),record=buildCalculationRecord(state,{...versions,worktreeDirty:true});
    const text=formatCalculationSummary(record);
    for(const term of ['T3','¹S₀','³P₀','mF=','Pq=','w₀=','Ω/2π=','rad/s','采用 d=','F-reduced-effective','internal-t3-20260908','含本地修改','非独立实验验证','λ来源='])assert.ok(text.includes(term),term);
    assert.equal(resultCSVRow(record).solve_for,solveFor);
    assert.doesNotMatch(text,/验证通过|\/Users\/|file:\/\//);
  }
  const text=formatCalculationSummary(buildCalculationRecord(stateFor(),{...versions,worktreeDirty:undefined}));
  assert.match(text,/工作区状态未知/);
});

test('export availability excludes invalid or non-E1 contexts while keeping zero power valid',()=>{
  assert.equal(canExportCurrentResult(stateFor()),true);
  assert.equal(canExportCurrentResult(stateFor('T2',{P_mW:0})),true);
  for(const inputStatus of ['invalid','unsupported','missing-data','no-channel'])assert.equal(canExportCurrentResult(stateFor('T2',{inputStatus})),false);
  assert.equal(canExportCurrentResult(stateFor('T4')),false);
  assert.throws(()=>serializeResultCSV({kind:'wrong'}));
});

test('readable summary suppresses binary tails while CSV and JSON keep full stored precision',()=>{
  const record=buildCalculationRecord(stateFor(),versions);
  record.configuration.enteredParameters.size_m=0.000049999999999999996;
  record.configuration.parameters.waist_m=0.000049999999999999996;
  record.resolvedChannel.dEff_ea0=0.17993333333333336;
  record.configuration.result.piTime_s=1.567842989285534e-8;
  const before=JSON.stringify(record),summary=formatCalculationSummary(record),rows=parseCSV(serializeResultCSV(record));
  assert.equal(summary.trimEnd().split('\n').length,9);
  assert.match(summary,/w₀=0\.00005 m/);assert.match(summary,/d_eff=0\.17993333 ea₀/);assert.match(summary,/tπ=1\.567843e-8 s/);
  assert.doesNotMatch(summary,/0\.000049999|0\.179933333333|1\.567842989/);
  assert.match(summary,/可读性格式化，不代表不确定度评定/);
  const values=Object.fromEntries(rows[0].map((key,index)=>[key,rows[1][index]]));
  assert.equal(Number(values.intensity_radius_m),record.configuration.parameters.waist_m);
  assert.equal(Number(values.effective_dipole_ea0),record.resolvedChannel.dEff_ea0);
  assert.equal(Number(values.pi_time_s),record.configuration.result.piTime_s);
  assert.equal(JSON.stringify(record),before);
});
