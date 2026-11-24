import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG, CORE_TRANSITIONS, DATASET_MANIFEST, RYDBERG_SERIES_TRANSITIONS, getDipoleQuantity, getSourceRecord} from '../../src/data/catalog.js';
import {getRecordAdoption, isZeroField, recordCitation} from '../../src/ui/record-adoption.js';
import {catalogExport} from '../../src/ui/catalog-export.js';
import {buildExplorerRecords,filterExplorerRecords} from '../../src/ui/explorer-model.js';
import {buildEqualConditionComparison} from '../../src/ui/equal-condition-comparison.js';

const versions={datasetVersion:DATASET_MANIFEST.datasetVersion,datasetHash:DATASET_MANIFEST.contentHash};
const catalog=[...CORE_TRANSITIONS,...RYDBERG_SERIES_TRANSITIONS];

test('65S catalogue identities, quantities and citations follow the shipped manifest and field sources',()=>{
  const records=buildExplorerRecords(catalog);
  const matching=filterExplorerRecords(records,{query:'65S'});
  assert.deepEqual(new Set(matching.map(row=>row.id)),new Set(['R2','NS-65-F12','NS-65-F32']));
  assert.deepEqual(filterExplorerRecords(records,{query:'556'}).map(row=>row.id),['T2']);
  assert.match(DATASET_MANIFEST.reviewStatus,/historical R2 retained/);
  for(const Fp of [0.5,1.5]){
    const id='NS-65-F'+Fp*2+'2';
    const current=getRecordAdoption(id,Fp),old=getRecordAdoption('R2',Fp);
    assert.equal(current.status,'current');
    assert.equal(current.batchId,CATALOG['rydberg-series'].sourceBatch);
    assert.equal(old.status,'historical');
    assert.notEqual(old.batchId,current.batchId);
    assert.deepEqual([current.conditions.B_T,current.conditions.E_V_m],[0,0]);
    const citation=recordCitation(id,Fp,versions);
    for(const text of [id,versions.datasetVersion,current.label,current.batchId,getSourceRecord(current.sourceId).artifactLocator,'B=E=0'])assert.ok(citation.includes(text));
    assert.ok(current.relatedIds.includes('ref-17'));
    assert.equal(getRecordAdoption('NS-29-F12',0.5).relatedIds.length,0);
    assert.equal(getRecordAdoption('ref-17').status,'historical');
  }
  assert.equal(getRecordAdoption('R1').status,'historical');
  assert.equal(getRecordAdoption('R1').relatedIds.length,0);
  assert.equal(getRecordAdoption('T4').status,'pending');
  assert.equal(getRecordAdoption('T3').status,'current');
  assert.match(recordCitation('T3',.5),/internal-t3-20260908/);
});

test('catalogue exports keep both 65S branch precisions and the original missing uncertainty',()=>{
  const ids=['NS-65-F12','NS-65-F32','R2'];
  const payload=JSON.parse(JSON.stringify(catalogExport(ids,'filtered',versions,{filters:{query:'65S'}})));
  assert.deepEqual(payload.records.map(item=>item.id),ids);
  assert.deepEqual(payload.filters,{query:'65S'});
  for(const [id,record] of ids.map((id,i)=>[id,payload.records[i]])){
    for(const [fp,field] of Object.entries(record.fReducedDipoles)){
      const quantity=getDipoleQuantity(id,Number(fp));
      assert.equal(record.quantities[field].value,quantity.value);
      assert.equal(record.quantities[field].uncertainty,null);
      assert.ok(record.sources.some(source=>source.id===quantity.sourceId && source.artifactSha256));
    }
  }
});

test('an entire historical R2 record cites both fields and attributes only their shared conditions to the record',()=>{
  for(const scope of ['record','filtered']){
    const [record]=catalogExport(['R2'],scope,versions).records;
    const {conditions,conditionsBasis}=record.adoption;
    assert.ok(isZeroField(conditions));
    assert.equal(conditionsBasis.scope,'shared-across-branches');
    assert.deepEqual(conditionsBasis.fields,[{Fp:.5,field:'d_num'},{Fp:1.5,field:'d_F32'}]);
    for(const {Fp,field} of conditionsBasis.fields){
      const original=getDipoleQuantity('R2',Fp).conditions;
      assert.deepEqual(record.quantities[field].conditions,original);
      for(const [key,value] of Object.entries(conditions))assert.deepEqual(value,original[key]);
    }
    for(const key of ['Fp','nu','q','branch','matrixElement_ea0'])assert.ok(!Object.hasOwn(conditions,key));
  }
  const citation=recordCitation('R2',undefined,versions);
  assert.match(citation,/矩阵元 F′=1\/2/);
  assert.match(citation,/矩阵元 F′=3\/2/);
});

test('series comparison respects immutable branch identity and uses only matching fields',()=>{
  const transition=catalog.find(t=>t.id==='NS-65-F32');
  const state={transition,F_lower:.5,F_upper:1.5,pol:'sigmap',P_mW:1,w_um:500,inputStatus:'valid'};
  const before=structuredClone(state);
  const compared=buildEqualConditionComparison(['NS-65-F32','NS-65-F12','R2'].map(id=>({id})),state,versions);
  assert.deepEqual(compared.rows.map(r=>r.status),['ok','no-channel','ok']);
  assert.equal(compared.rows[1].result,null);
  assert.notEqual(compared.rows[0].dEff_ea0,compared.rows[2].dEff_ea0);
  assert.deepEqual(state,before);
  const payload=catalogExport(compared.rows.map(r=>r.id),'comparison',versions,{comparison:compared});
  assert.equal(payload.comparison.rows[0].rabi_Hz,compared.rows[0].result.fR);
  assert.equal(payload.comparison.rows[1].rabi_Hz,null);
  const historical=payload.records.find(record=>record.id==='R2').adoption;
  assert.deepEqual(historical.conditionsBasis,{scope:'quantity',fields:[{Fp:1.5,field:'d_F32'}]});
  assert.deepEqual(historical.conditions,getDipoleQuantity('R2',1.5).conditions);
  const unmatched=payload.records.find(record=>record.id==='NS-65-F12').adoption;
  assert.equal(unmatched.status,'current');
  assert.equal(unmatched.conditions.Fp,.5);
  assert.deepEqual(unmatched.conditionsBasis,{scope:'quantity',fields:[{Fp:.5,field:'d_num'}]});
  assert.equal(payload.comparison.rows[1].channel,null);
});
