import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_TRANSITIONS,getQuantity,getTransitionRecord,getLevelRecord} from '../../src/data/catalog.js';
import {computeDEff} from '../../src/physics/angular.js';
import {rabiHz} from '../../src/physics/rabi.js';
import {buildCalculationRecord} from '../../src/ui/calculation-record.js';
import {validateChartSnapshot,renderChartSVG,serializeChartCSV} from '../../src/ui/chart-export.js';

const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
function fixture(kind='curve',pol='pi'){
  const transition=CORE_TRANSITIONS.find(t=>t.id==='T2'),canonical=getTransitionRecord('T2');
  const state={transition,J_lower:getLevelRecord(canonical.lowerLevelId).attributes.J,J_upper:getLevelRecord(canonical.upperLevelId).attributes.J,dReduced:getQuantity('T2','d_num').value,
    F_lower:.5,F_upper:.5,pol,selectedChannel:null,P_mW:1,w_um:50,inputStatus:'valid',solveFor:'rabi',powerUnit:'mW',rabiUnit:'MHz'};
  state.dEff=computeDEff(state).dEff;state.fR_MHz=rabiHz(state.dEff,1,50)/1e6;
  const record=buildCalculationRecord(state,{softwareVersion:'0.3.3',appCommit:'9c8c6c66624336a11d7050f36a18e67e2827e342',worktreeDirty:false});
  const factor=pol==='pi'?1:2;
  const g={left:60,top:20,plotW:300,plotH:200,Pmin:0,Pmax:10*factor,pf:factor,rf:1,scale:'lin',pUnit:'mW',rUnit:'MHz',yMax:200,unitPowerFactor:1};
  const snapshot={kind,width:500,height:300,geometry:g,theme:{background:'#0b1421',text:'#c0d3ed',grid:'#234',axis:'#789'},
    context:{transitionId:'T2',P_mW:1,w_um:50,dEff_ea0:record.resolvedChannel.dEff_ea0,pol,F:.5,Fp:.5,selectedChannel:null},
    powerConvention:factor===2?'2Pq':'Pq',xTitle:`功率 ${factor===2?'2Pq':'Pq'} (mW)`,yTitle:kind==='curve'?'Ω/2π (MHz)':'束腰 w₀ (µm)',
    workPoint:{power_mW:1,waist_um:50,rabi_Hz:record.configuration.result.frequency_Hz}};
  if(kind==='curve'){
    const samples=[0,1,10].map(power=>({power_mW:power,waist_um:50,rabi_Hz:rabiHz(record.resolvedChannel.dEff_ea0,power,50),power_display:power*factor,rabi_display:rabiHz(record.resolvedChannel.dEff_ea0,power,50)/1e6}));
    g.curves=[{waist_um:50,visible:true,color:'#4f90de',samples,points:samples.map(sample=>({x:g.left+sample.power_display/g.Pmax*g.plotW,y:g.top+g.plotH-sample.rabi_display/g.yMax*g.plotH}))},{waist_um:100,visible:false,color:'#e00',samples:[],points:[]}];
    snapshot.ticks={x:[{value:0,position:60,label:'0'},{value:5*factor,position:210,label:String(5*factor)}],y:[{value:0,position:220,label:'0'},{value:100,position:120,label:'100'}]};
  }else{
    Object.assign(g,{Wmin:10,Wmax:100,wf:1,wUnit:'µm'});snapshot.grid={nx:2,ny:2,values_MHz:[[0,1],[100,10000]],colorLo_MHz:1,colorHi_MHz:100};snapshot.raster={grid:PNG,colorbar:PNG};
  }
  return{record,snapshot};
}
function parseCSV(input){
  const text=input.replace(/^\uFEFF/,''),rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}
  return rows.slice(1).map(values=>Object.fromEntries(rows[0].map((key,i)=>[key,values[i]])));
}

test('curve SVG contains vector paths/axes and only the visible sampled series without changing the snapshot',()=>{
  const {record,snapshot}=fixture(),before=structuredClone(snapshot),svg=renderChartSVG(snapshot,record);
  assert.match(svg,/<polyline/);assert.match(svg,/<clipPath/);assert.doesNotMatch(svg,/<image\b/);
  assert.equal((svg.match(/<polyline/g)||[]).length,1);assert.match(svg,/功率 Pq \(mW\)/);assert.match(svg,/Ω\/2π \(MHz\)/);
  for(const text of ['T2','当前','软件','数据','公式','证据','非独立实验验证'])if(text!=='当前')assert.ok(svg.includes(text),text);
  assert.match(svg,/visibleWaists_um/);assert.deepEqual(snapshot,before);
  assert.match(svg,/class="export-legend-item"/);assert.match(svg,/stroke="#4f90de"/);assert.match(svg,/50 µm/);assert.match(svg,/visibleSeries/);
  const samples=parseCSV(serializeChartCSV(snapshot,record));assert.equal(samples.length,3);
  assert.equal(Number(samples[1].atom_component_power_W),.001);assert.ok(Math.abs(Number(samples[1].intensity_radius_m)-50e-6)<1e-12*50e-6);
  assert.equal(Number(samples[1].frequency_Hz),record.configuration.result.frequency_Hz);
  assert.equal(JSON.parse(samples[0].context_json).configuration.transitionId,'T2');
});

test('sigma 2P display converts neither physical sample power nor coupling a second time',()=>{
  const {record,snapshot}=fixture('curve','sigmap'),rows=parseCSV(serializeChartCSV(snapshot,record));
  assert.equal(rows[1].power_axis_convention,'2Pq');assert.equal(Number(rows[1].power_axis_value),2);
  assert.equal(Number(rows[1].atom_component_power_W),.001);
  assert.equal(Number(rows[1].frequency_Hz),record.configuration.result.frequency_Hz);
  assert.match(renderChartSVG(snapshot,record),/2Pq/);
  snapshot.geometry.pf=1;assert.throws(()=>renderChartSVG(snapshot,record),/口径/);
});

test('heat SVG embeds only the field/colour strip and CSV keeps saturated grid values intact',()=>{
  const {record,snapshot}=fixture('heat'),before=structuredClone(snapshot),svg=renderChartSVG(snapshot,record);
  assert.equal((svg.match(/<image /g)||[]).length,2);assert.match(svg,/文字为矢量/);assert.match(svg,/采样位图/);
  assert.match(svg,/≤ /);assert.match(svg,/≥ /);assert.match(svg,/2%–98%/);
  const rows=parseCSV(serializeChartCSV(snapshot,record));assert.equal(rows.length,4);
  assert.equal(Number(rows[3].frequency_Hz),1e10);assert.equal(Number(rows[3].color_high_Hz),1e8);
  assert.equal(rows[3].color_saturated,'true');assert.equal(Number(rows[0].frequency_Hz),0);
  assert.equal(Number(rows[3].atom_component_power_W),.01);assert.ok(Math.abs(Number(rows[3].intensity_radius_m)-100e-6)<1e-12*100e-6);
  assert.deepEqual(snapshot,before);
});

test('display units, log range and pinned values are exported from the supplied plotted view',()=>{
  const {record,snapshot}=fixture();snapshot.geometry.scale='log';snapshot.geometry.Pmin=.1;
  snapshot.geometry.rUnit='kHz';snapshot.geometry.rf=1000;snapshot.geometry.yMax=200000;snapshot.yTitle='Ω/2π (kHz)';
  snapshot.pinned={power_mW:1,waist_um:50,rabi_Hz:record.configuration.result.frequency_Hz,text:'已固定 · P=1 mW'};
  const svg=renderChartSVG(snapshot,record);assert.match(svg,/对数横轴/);assert.match(svg,/已固定/);assert.match(svg,/Ω\/2π \(kHz\)/);
  assert.match(svg,/stroke-dasharray="3 4"/);
});

test('stale identities and invalid sampled data cannot be labelled as the current result',()=>{
  for(const change of [s=>s.context.transitionId='T3',s=>s.context.P_mW=4,s=>s.context.w_um=60,s=>s.context.dEff_ea0=99,s=>s.context.Fp=1.5]){
    const {record,snapshot}=fixture();change(snapshot);assert.throws(()=>validateChartSnapshot(snapshot,record),/不一致/);
  }
  const {record,snapshot}=fixture();snapshot.geometry.curves[0].samples[0].rabi_Hz=Infinity;assert.throws(()=>renderChartSVG(snapshot,record),/采样数据/);
  const heat=fixture('heat');heat.snapshot.raster.grid='https://example.invalid/private.png';assert.throws(()=>renderChartSVG(heat.snapshot,heat.record),/位图无效/);
});

test('exported SVG escapes metadata and labels instead of accepting markup',()=>{
  const {record,snapshot}=fixture();record.transition.lower='<script>bad</script>';record.primaryQuantity.sourceId='"><script>bad</script>';
  snapshot.xTitle='<img onerror="bad">';const svg=renderChartSVG(snapshot,record);
  assert.doesNotMatch(svg,/<script>|<img /);assert.match(svg,/&lt;script&gt;/);assert.match(svg,/&lt;img /);
});
