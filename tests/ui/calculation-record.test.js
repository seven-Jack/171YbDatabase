import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS,RYDBERG_SERIES_TRANSITIONS,getDipoleQuantity,getQuantity,getTransitionRecord,getLevelRecord,DATASET_VERSION,DATASET_MANIFEST} from '../../src/data/catalog.js';
import {EVIDENCE_VERSION,getEvidenceRecord} from '../../src/data/evidence.js';
import {FORMULA_VERSION} from '../../src/physics/constants.js';
import {computeCGChannels,computeDEff,channelKey} from '../../src/physics/angular.js';
import {rabiHz} from '../../src/physics/rabi.js';
import {DEFAULT_BEAM_DEFINITION} from '../../src/physics/beam-conventions.js';
import {exportCalculationConfig,parseCalculationConfig,ConfigurationError} from '../../src/state/config.js';
import {buildCalculationRecord,serializeCalculationRecord,renderCalculationRecordMarkdown,readSavedCalculation,parseCalculationRecordOrConfig} from '../../src/ui/calculation-record.js';
import {formatCalculationSummary,resultCSVRow} from '../../src/ui/result-export.js';

const versions = {softwareVersion:'0.3.3',appCommit:'33270877d433c83cb2c07243f1e741dd98d52cdb',worktreeDirty:false,datasetVersion:DATASET_VERSION,datasetHash:DATASET_MANIFEST.contentHash,formulaVersion:FORMULA_VERSION};
const close = (a,b) => assert.ok(Math.abs(a-b) <= 1e-11 * Math.max(1e-30,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
function stateFor(id='T2',patch={}) {
  const transition=[...CORE_TRANSITIONS,...RYDBERG_SERIES_TRANSITIONS].find(row=>row.id===id);
  const canonical=getTransitionRecord(id),review=getEvidenceRecord(id)?.appliesTo;
  const q=review?.channels?.[0]?.q ?? 0;
  const state={transition,J_lower:getLevelRecord(canonical.lowerLevelId).attributes.J,J_upper:transition.upperJ??getLevelRecord(canonical.upperLevelId).attributes.J,
    dReduced:getQuantity(id,'d_num').value ?? 0,F_lower:review?.F ?? .5,F_upper:transition.Fp??review?.Fp ?? (id==='T4'?1.5:.5),
    pol:({[-1]:'sigmam',0:'pi',1:'sigmap'})[q],diagF_lower:'all',diagF_upper:'all',selectedChannel:null,
    P_mW:1,w_um:500,solveFor:'rabi',powerUnit:'mW',rabiUnit:'MHz',inputStatus:'valid',...patch};
  state.dEff=computeDEff(state).dEff;
  state.fR_MHz=state.dEff>0 ? rabiHz(state.dEff,state.P_mW,state.w_um)/1e6 : 0;
  return state;
}
function reviewedState(id='T2') {
  const state=stateFor(id),target=getEvidenceRecord(id)?.appliesTo.channels?.[0];
  state.selectedChannel=target?computeCGChannels(state).find(item=>channelKey(item)===channelKey(target)):computeCGChannels(state).find(item=>item.q===0);
  return state;
}

test('record envelopes preserve configuration v2 and resolve the actual automatic mF channel without changing state',()=>{
  const state=stateFor(),before=structuredClone(state);
  const record=buildCalculationRecord(state,versions);
  assert.equal(record.kind,'171yb-rabi-record');assert.equal(record.schemaVersion,1);
  assert.equal(record.configuration.kind,'171yb-rabi-config');assert.equal(record.configuration.schemaVersion,2);
  assert.equal(record.configuration.selection.channel,null);
  assert.equal(record.resolvedChannel.selectionOrigin,'auto');
  const effective=computeDEff(state);
  assert.equal(record.resolvedChannel.m,effective.mF);assert.equal(record.resolvedChannel.mp,effective.mFp);
  close(record.resolvedChannel.dEff_ea0,effective.dEff);
  assert.equal(record.exportedAt,record.configuration.exportedAt);
  assert.deepEqual(state,before);
  const plain=JSON.parse(serializeCalculationRecord(record));
  assert.deepEqual(plain,record);
  assert.equal(parseCalculationConfig(plain.configuration,versions).transition.id,'T2');
});

test('standalone records identify both states, angular momenta and wavelength provenance without promoting R2 estimates',()=>{
  for(const id of ['T2','T3','R2']){
    const state=stateFor(id),record=buildCalculationRecord(state,versions),wavelength=getQuantity(id,'wavelength_vac_nm');
    const {wavelength:wave,adoption,...transition}=record.transition;
    assert.equal(adoption.status,id==='R2'?'historical':'current');
    assert.equal(adoption.recordId,id);
    assert.deepEqual(transition,{id,lower:state.transition.lower,upper:state.transition.upper,J_lower:state.J_lower,J_upper:state.J_upper,multipole:state.transition.multipole});
    for(const key of ['value','unit','sourceId','sourceLocator','evidenceKind','uncertainty','convention','uncertaintyNote','reviewStatus','conditions']){
      assert.deepEqual(wave[key],wavelength[key]??null,key);
    }
    const markdown=serializeCalculationRecord(record,'markdown');
    assert.ok(markdown.includes(state.transition.lower));assert.ok(markdown.includes(state.transition.upper));
    assert.ok(markdown.includes(`${wavelength.value} ${wavelength.unit}`));
    assert.ok(markdown.includes(wavelength.evidenceKind));
    if(id==='R2')assert.equal(record.transition.wavelength.evidenceKind,'scaling-estimate');
    assert.equal(parseCalculationRecordOrConfig(record,versions).transition.id,id);
  }
  const malformed=buildCalculationRecord(stateFor(),versions);malformed.transition=null;
  assert.throws(()=>parseCalculationRecordOrConfig(malformed,versions),ConfigurationError);
});

test('an archived identity stays readable without a replacement in the current catalog',()=>{
  const record=buildCalculationRecord(stateFor('R2'),versions);
  const legacy=structuredClone(record);
  delete legacy.transition.adoption;
  delete legacy.resolvedChannel.solvedQuantity;
  legacy.configuration.transitionId='archived-record-id';
  legacy.configuration.result.frequency_Hz=2;
  assert.deepEqual(readSavedCalculation(JSON.stringify(legacy)),{config:legacy.configuration,record:legacy});
  assert.throws(()=>parseCalculationRecordOrConfig(legacy,versions),/当前数据没有跃迁 archived-record-id/);
});

test('T2 and T7 research records distinguish centroid, optional zero-field offset and printed wavelength conflict',()=>{
  for(const [Fp,value,uncertainty] of [[.5,-3957.85,.05],[1.5,1978.925,.025]]){
    const record=buildCalculationRecord(stateFor('T2',{F_upper:Fp}),versions);
    const wavelength=record.transition.wavelength, csv=resultCSVRow(record);
    assert.equal(wavelength.reference,'hyperfine-centroid');
    assert.equal(wavelength.value,555.80068663);
    const offset=JSON.parse(serializeCalculationRecord(record)).transition.wavelength.zeroFieldOffset;
    assert.equal(offset.value,value);
    assert.equal(offset.Fp,Fp);
    assert.equal(offset.uncertainty,uncertainty);
    assert.match(offset.uncertaintyNote,/一阶磁偶极超精细常数 A\/h/);
    assert.equal(csv.zero_field_offset_from_centroid_MHz,value);
    assert.equal(csv.zero_field_offset_uncertainty_MHz,uncertainty);
    assert.equal(csv.zero_field_offset_uncertainty_note,offset.uncertaintyNote);
    assert.match(csv.zero_field_offset_source_locator,/Table5/i);
    const offsetText=`${value<0?'−':'+'}${Math.abs(value)} ± ${uncertainty} MHz`;
    const markdown=serializeCalculationRecord(record,'markdown');
    assert.match(markdown,/真空重心波长.*555\.80068663 nm/);
    assert.ok(markdown.includes(`零场频移（相对重心） | ${offsetText}`));
    assert.ok(markdown.includes(`频移不确定度口径 | ${offset.uncertaintyNote}`));
    assert.ok(formatCalculationSummary(record).includes(`零场频移（相对重心） ${offsetText} · ${offset.uncertaintyNote}`));
    const old=structuredClone(record);
    old.transition.wavelength=Object.fromEntries(['value','unit','sourceId','sourceLocator','evidenceKind','uncertainty'].map(key=>[key,wavelength[key]]));
    assert.equal(parseCalculationRecordOrConfig(old,versions).result.fR,record.configuration.result.frequency_Hz);
  }
  const record=buildCalculationRecord(reviewedState('T7'),versions), wave=record.transition.wavelength;
  const csv=resultCSVRow(record);
  assert.equal(wave.reference,'hyperfine-centroid');
  assert.equal(wave.reviewStatus,'conflict-unresolved');
  assert.equal(wave.evidenceKind,'derived');
  assert.equal(wave.value,770.16026840069);
  assert.match(wave.sourceConflict,/770\.160284/);
  assert.equal(wave.zeroFieldOffset,null);
  assert.equal(csv.wavelength_source_conflict,wave.sourceConflict);
  assert.equal(csv.wavelength_uncertainty_nm,wave.uncertainty);
  assert.equal(csv.wavelength_uncertainty_note,wave.uncertaintyNote);
  assert.equal(csv.zero_field_offset_from_centroid_MHz,null);
  assert.equal(csv.zero_field_offset_uncertainty_MHz,null);
  assert.equal(csv.zero_field_offset_uncertainty_note,null);
  assert.match(serializeCalculationRecord(record,'markdown'),/原表波长冲突.*770\.160284/);
});

test('older records containing a zero-field offset remain readable without an uncertainty field',()=>{
  const record=buildCalculationRecord(stateFor('T2',{F_upper:1.5}),versions);
  const offset=record.transition.wavelength.zeroFieldOffset;
  delete offset.uncertainty;
  delete offset.uncertaintyNote;
  assert.match(serializeCalculationRecord(record,'markdown'),/零场频移（相对重心） \| \+1978\.925 MHz/);
  assert.equal(resultCSVRow(record).zero_field_offset_uncertainty_MHz,null);
  assert.equal(parseCalculationRecordOrConfig(record,versions).result.fR,record.configuration.result.frequency_Hz);
});

test('all three solve directions retain upstream total power/diameter definitions and canonical SI work point',()=>{
  for(const solveFor of ['rabi','power','waist']){
    const state=reviewedState('T3');
    Object.assign(state,{solveFor,pol:'sigmap',P_mW:.4,w_um:50,
      beamDefinition:{...DEFAULT_BEAM_DEFINITION,powerPlane:'upstream',transmission:.8,powerBasis:'linear-total',linearOrientation:'perpendicular',sizeKind:'diameter'},
      beamInput:{power_mW:1,size_um:100}});
    state.selectedChannel=computeCGChannels(state).find(item=>item.q===1);
    state.dEff=computeDEff(state).dEff;state.fR_MHz=rabiHz(state.dEff,.4,50)/1e6;
    const original=structuredClone(state),record=buildCalculationRecord(state,versions),config=record.configuration;
    assert.equal(config.display.solveFor,solveFor);
    const solved = record.resolvedChannel.solvedQuantity;
    assert.equal(solved.key,solveFor);
    close(solved.valueSI,solveFor==='power'?.001:solveFor==='waist'?100e-6:config.result.frequency_Hz);
    const row = resultCSVRow(record);
    assert.equal(row.solved_quantity,solved.label);
    assert.equal(row.solved_value_SI,solved.valueSI);
    assert.equal(row.solved_unit_SI,solved.siUnit);
    assert.match(formatCalculationSummary(record),new RegExp(solved.label.replace(/[()]/g,'\\$&')));
    assert.ok(renderCalculationRecordMarkdown(record).includes('主结果 · '+solved.label));
    close(config.enteredParameters.power_W,.001);close(config.enteredParameters.size_m,100e-6);
    close(config.parameters.power_W,.0004);close(config.parameters.waist_m,50e-6);
    close(config.result.frequency_Hz,state.fR_MHz*1e6);
    const restored=parseCalculationRecordOrConfig(serializeCalculationRecord(record),versions);
    close(restored.state.P_mW,.4);close(restored.state.w_um,50);
    assert.deepEqual(restored.state.beamDefinition,state.beamDefinition);
    assert.deepEqual(state,original);
    const markdown=serializeCalculationRecord(record,'markdown');
    for(const marker of ['上游','线偏振总功率','1/e² 强度直径','录入功率','原子处分量功率 Pq','W','1/e² 强度半径 w₀','rad/s'])assert.ok(markdown.includes(marker),marker);
  }
});

for(const id of ['T1','T2','T3','T5','T6','T7'])test(`${id} records the reviewed channel, immutable adopted identity and separate evidence levels`,()=>{
  const record=buildCalculationRecord(reviewedState(id),versions);
  assert.equal(record.resolvedChannel.selectionOrigin,'manual');
  assert.equal(record.primaryQuantity.sourceId,getQuantity(id,'d_num').sourceId);
  assert.equal(record.configuration.matrixElement.sourceId,record.primaryQuantity.sourceId);
  assert.equal(record.primaryQuantity.value,getQuantity(id,'d_num').value);
  assert.equal(record.primaryQuantity.uncertainty,getQuantity(id,'d_num').uncertainty);
  assert.equal(record.evidence.evidenceVersion,EVIDENCE_VERSION);
  assert.equal(record.evidence.rows.find(row=>row.key==='formula').status,'checked');
  assert.equal(record.evidence.rows.find(row=>row.key==='experiment').status,'not-closed');
  const compare=record.evidence.comparisons[0];
  assert.equal(compare.status,id==='T3'?'conditional':'theory-compatible');
  assert.ok(Buffer.byteLength(serializeCalculationRecord(record)) <= 64*1024,'export must fit the existing import file-size limit');
  if(id==='T3'){
    assert.equal(record.primaryQuantity.sourceId,'internal-t3-20260908');
    assert.equal(record.primaryQuantity.source.url,null);assert.equal(record.primaryQuantity.source.doi,null);
    assert.deepEqual(compare.rows.map(row=>row.power_mW),[1070,338]);
    assert.equal(compare.reference.value,22);
    const markdown=serializeCalculationRecord(record,'markdown');
    for(const marker of ['1070 mW','阶段可用功率','338 mW','拟合有效功率','22 kHz','固定文献对照（非本次输入）'])assert.ok(markdown.includes(marker),marker);
  }
  assert.doesNotMatch(JSON.stringify(record),/file:\/\/|\/Users\/|references\/papers\/|data\/literature\//i);
});

test('a different allowed mF channel or declared version cannot inherit reviewed evidence',()=>{
  const state=reviewedState(),candidates=computeCGChannels(state).filter(item=>item.F===state.F_lower&&item.Fp===state.F_upper&&item.q===1);
  state.selectedChannel=candidates.find(item=>item.m!==state.selectedChannel.m);
  const wrongChannel=buildCalculationRecord(state,versions);
  assert.equal(wrongChannel.evidence.rows[1].status,'needs-review');
  assert.equal(wrongChannel.evidence.rows[2].status,'needs-review');
  for(const patch of [{formulaVersion:'9.9.9'},{datasetHash:'0'.repeat(64)}]){
    const record=buildCalculationRecord(reviewedState(),{...versions,...patch});
    assert.equal(record.evidence.rows[1].status,'needs-review');
    assert.equal(record.evidence.rows[3].status,'not-closed');
  }
  const invalid=reviewedState();invalid.selectedChannel={F:.5,m:99,Fp:1.5,mp:100,q:1};
  assert.throws(()=>buildCalculationRecord(invalid,versions),ConfigurationError);
});

test('R2 records and exports each signed dipole with its branch and unknown uncertainty',()=>{
  for(const [Fp,mp,q,pol,D,M] of [[.5,-.5,-1,'sigmam',.002165816490,.001250434734],[1.5,1.5,1,'sigmap',-.003491291695,-.001745645848]]){
    const state=stateFor('R2',{F_upper:Fp,pol,selectedChannel:{F:.5,m:.5,Fp,mp,q}});
    const record=buildCalculationRecord(state,versions), csv=resultCSVRow(record);
    assert.equal(record.evidence.hasReview,false);
    assert.ok(record.evidence.rows.every(row=>row.status==='not-reviewed'));
    assert.equal(record.primaryQuantity.uncertainty,null);
    assert.equal(record.primaryQuantity.sourceId,'internal-r017-20261110');
    assert.deepEqual(record.primaryQuantity.conditions,getDipoleQuantity('R2',Fp).conditions);
    assert.equal(record.primaryQuantity.value,D);
    assert.equal(record.primaryQuantity.convention,'F-reduced');
    assert.ok(Math.abs(record.resolvedChannel.matrixElement_ea0-M)<1e-12);
    assert.equal(csv.magnetic_sublevel_dipole_ea0,record.resolvedChannel.matrixElement_ea0);
    assert.equal(csv.effective_dipole_ea0,Math.abs(csv.magnetic_sublevel_dipole_ea0));
    const markdown=serializeCalculationRecord(record,'markdown');
    assert.match(markdown,/磁子态矩阵元 M/);
    assert.match(markdown,/未知／未建立（null，不是零）/);
    assert.match(markdown,/完整 Rabi 不确定度/);
  }
});

test('series exports preserve both branch identities, zero fields and relative dipole sign',()=>{
  for(const [id,nu,Fp,branch,dipole] of [
    ['NS-65-F12',60.1761270465,.5,/混合态/,0.002165172596919359],
    ['NS-65-F32',60.561073029,1.5,/单通道/,-0.003490253670468963],
  ]){
    const record=buildCalculationRecord(stateFor(id),versions);
    const json=JSON.parse(serializeCalculationRecord(record)),csv=resultCSVRow(record);
    const conditions=json.primaryQuantity.conditions;
    assert.equal(conditions.n,65);
    assert.equal(conditions.nu,nu);
    assert.equal(conditions.Fp,Fp);
    assert.equal(conditions.B_T,0);
    assert.equal(conditions.E_V_m,0);
    assert.match(conditions.branch,branch);
    assert.equal(json.primaryQuantity.value,dipole);
    assert.equal(json.transition.wavelength.reference,'model-branch');
    assert.equal(csv.rydberg_n,65);
    assert.equal(csv.rydberg_nu_effective,nu);
    assert.equal(csv.rydberg_nu_reference,'ionic F_c=1');
    assert.equal(csv.F_prime,Fp);
    assert.equal(csv.rydberg_B_T,0);
    assert.equal(csv.rydberg_E_V_m,0);
    assert.match(csv.rydberg_branch,branch);
    assert.equal(csv.reduced_dipole_ea0,dipole);
    assert.equal(csv.dipole_convention,'F-reduced');
    const markdown=serializeCalculationRecord(record,'markdown');
    const line=Fp===1.5?367:362;
    assert.equal(json.evidence.calculationSource.channelLine,line);
    assert.equal(csv.r017_channel_csv_line,line);
    assert.equal(csv.r017_batch_id,'delivery_20261111T085031Z');
    assert.equal(csv.evidence_summary,'This work · R017 零场计算');
    assert.ok(formatCalculationSummary(record).includes(csv.evidence_summary));
    assert.ok(markdown.includes(`原始通道表第 ${line} 行`));
    assert.ok(markdown.includes(csv.r017_channel_csv_sha256));
    assert.ok(markdown.includes(csv.r017_channel_csv_url));
    assert.doesNotMatch(markdown,/本轮未接入|本轮没有接入|波长原文定位/);
    for(const marker of ['主量子数标签 n | 65',`实际有效主量子数 ν | ${nu}`,`末态 F′ | ${2*Fp}/2`,
      '磁场 B | 0 T','静电场 E | 0 V/m',String.raw`带符号 D\_F | ${dipole} ea₀`]) assert.ok(markdown.includes(marker),marker);
    assert.match(markdown,branch);
  }
  const old=buildCalculationRecord(stateFor('R2'),versions), row=resultCSVRow(old);
  assert.equal(row.wavelength_reference,'historical-estimate');
  assert.equal(row.wavelength_source_id,'legacy-scaling');
  assert.equal(row.wavelength_vac_nm,301.87);
  assert.equal(row.rydberg_n,null);
  assert.equal(row.rydberg_nu_effective,null);
});

test('invalid/incomplete/unsupported inputs do not export a stale result; zero power remains a valid finite-frequency record',()=>{
  for(const inputStatus of ['invalid','unsupported','missing-data','no-channel'])assert.throws(()=>buildCalculationRecord(stateFor('T2',{inputStatus}),versions),ConfigurationError);
  assert.throws(()=>buildCalculationRecord(stateFor('T4'),versions),ConfigurationError);
  assert.throws(()=>buildCalculationRecord(stateFor('T2',{beamDefinition:{powerPlane:'upstream',transmission:null}}),versions),ConfigurationError);
  const record=buildCalculationRecord(stateFor('T2',{P_mW:0}),versions);
  assert.equal(record.configuration.result.frequency_Hz,0);assert.equal(record.configuration.result.piTime_s,null);
  assert.match(serializeCalculationRecord(record,'markdown'),/∞（零耦合；JSON 以 null 记录无限时间）/);
  assert.equal(parseCalculationRecordOrConfig(record,versions).result.fR,0);
});

test('dirty or unknown worktree state is distinguished from an exact release commit',()=>{
  const dirty=buildCalculationRecord(stateFor(),{...versions,worktreeDirty:true});
  assert.equal(dirty.build.worktreeDirty,true);
  assert.match(serializeCalculationRecord(dirty,'markdown'),/此提交仅为代码基线，不能保证精确复现当前运行代码/);
  const unknown=buildCalculationRecord(stateFor(),{...versions,worktreeDirty:undefined});
  assert.equal(unknown.build.worktreeDirty,null);
  assert.match(serializeCalculationRecord(unknown,'markdown'),/构建工作区状态未知/);
});

test('Markdown escapes data fields and only creates DOI/arXiv links for allowed public sources',()=>{
  const record=buildCalculationRecord(reviewedState(),versions);
  record.primaryQuantity.source.title='<script>alert(1)</script>\n# fake [click](javascript:bad)|';
  record.primaryQuantity.source.url='javascript:bad';record.primaryQuantity.source.doi=null;
  record.evidence.sources=[{id:'unsafe',title:'<img src=x>',url:'file:///Users/seven/private.pdf',doi:null,locations:['line\n## forged']}];
  const markdown=renderCalculationRecordMarkdown(record);
  assert.doesNotMatch(markdown,/<script>|<img|\]\(javascript:|file:\/\/|\/Users\//);
  assert.match(markdown,/&lt;script&gt;/);
  assert.match(markdown,/\\\|/);
  assert.doesNotMatch(markdown,/\n# fake|\n## forged/);
  const normal=serializeCalculationRecord(buildCalculationRecord(reviewedState(),versions),'markdown');
  assert.match(normal,/https:\/\/arxiv\.org\/abs\/2509\.04416v2/);
  assert.match(normal,/10\.48550\/arXiv\.2509\.04416/);
  assert.throws(()=>serializeCalculationRecord(record,'html'),ConfigurationError);
});

test('record restore trusts only nested configuration and recomputes forged matrix elements/results/evidence',()=>{
  const record=buildCalculationRecord(reviewedState('T3'),versions);
  const expected=record.configuration.result.frequency_Hz;
  record.configuration.matrixElement.reduced_ea0=9;
  record.configuration.result.frequency_Hz=1e30;
  record.resolvedChannel.dEff_ea0=999;
  record.primaryQuantity.sourceId='forged';
  record.evidence.summary='fake passed';record.evidence.rows.forEach(row=>row.status='checked');
  const before=structuredClone(record),restored=parseCalculationRecordOrConfig(JSON.stringify(record),versions);
  close(restored.result.fR,expected);
  assert.equal(restored.state.dReduced,getQuantity('T3','d_num').value);
  assert.ok(restored.warnings.some(warning=>warning.includes('保存的结果、矩阵元和证据状态仅作历史记录')));
  const fresh=buildCalculationRecord(restored.state,versions);
  assert.equal(fresh.primaryQuantity.sourceId,'internal-t3-20260908');
  assert.equal(fresh.evidence.rows[3].status,'not-closed');
  assert.deepEqual(record,before);
});

test('original v1/v2 configurations remain compatible, and malformed record envelopes are rejected',()=>{
  const config=exportCalculationConfig(stateFor(),versions);
  const legacy=structuredClone(config);legacy.schemaVersion=1;delete legacy.inputDefinition;delete legacy.enteredParameters;
  for(const fixture of [config,legacy]){
    const old=parseCalculationConfig(fixture,versions),restored=parseCalculationRecordOrConfig(JSON.stringify(fixture),versions);
    assert.deepEqual(restored,old);
  }
  const valid=buildCalculationRecord(stateFor(),versions);
  for(const change of [item=>item.schemaVersion=2,item=>delete item.configuration,item=>item.extra=true,item=>item.evidence=null,item=>item.exportedAt='bad']){
    const invalid=structuredClone(valid);change(invalid);
    assert.throws(()=>parseCalculationRecordOrConfig(invalid,versions),ConfigurationError);
  }
  assert.throws(()=>parseCalculationRecordOrConfig('x'.repeat(65537),versions),/64 KiB/);
  assert.throws(()=>parseCalculationRecordOrConfig('{',versions),ConfigurationError);
});
