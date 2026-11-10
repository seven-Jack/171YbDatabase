import {RECORD_KIND,RECORD_SCHEMA_VERSION} from './calculation-record.js';
import {getBeamFactors} from '../physics/beam-conventions.js';

function requireRecord(record) {
  if(record?.kind!==RECORD_KIND||record.schemaVersion!==RECORD_SCHEMA_VERSION||record.configuration?.result?.status!=='ok')throw Error('需要有效的当前研究记录。');
}

export function canExportCurrentResult(state) {
  return state?.inputStatus==='valid'&&!!state.transition&&String(state.transition.multipole||'').startsWith('E1')
    &&Number.isFinite(state.P_mW)&&state.P_mW>=0&&Number.isFinite(state.w_um)&&state.w_um>0
    &&Number.isFinite(state.fR_MHz)&&state.fR_MHz>=0&&Number.isFinite(state.dEff)&&state.dEff>0;
}

/** RFC 4180 cells; typed numbers stay numeric while untrusted text cannot become a spreadsheet formula. */
export function csvCell(value) {
  if(typeof value==='number') {
    if(!Number.isFinite(value))throw Error('CSV 数值必须有限；无限时间须使用状态字段。');
    return String(value);
  }
  if(typeof value==='boolean')return String(value);
  let text=value==null?'unknown':String(value);
  if(/^[\s\u0000-\u0020]*[=+\-@]/u.test(text)||/^[\t\r\n]/u.test(text))text="'"+text;
  return '"'+text.replace(/"/g,'""')+'"';
}

export function serializeCSV(columns,rows) {
  return '\uFEFF'+[columns.map(csvCell).join(','),...rows.map(row=>columns.map(key=>csvCell(row[key])).join(','))].join('\r\n')+'\r\n';
}

export function resultCSVRow(record) {
  requireRecord(record);
  const c=record.configuration,t=record.transition,ch=record.resolvedChannel,d=record.primaryQuantity,def=c.inputDefinition;
  return {
    exported_at:record.exportedAt,transition_id:t.id,lower_state:t.lower,upper_state:t.upper,multipole:t.multipole,
    wavelength_vac_nm:t.wavelength.value,wavelength_evidence:t.wavelength.evidenceKind,wavelength_source_id:t.wavelength.sourceId,
    F:ch.F,mF:ch.m,F_prime:ch.Fp,mF_prime:ch.mp,q:ch.q,selection_origin:ch.selectionOrigin,
    solve_for:c.display.solveFor,power_plane:def.powerPlane,power_basis:def.powerBasis,transmission:def.transmission,
    transmission_status:def.powerPlane==='atoms'?'not-used':'supplied',
    linear_orientation:def.linearOrientation,manual_component_fraction:def.manualFraction,size_definition:def.sizeKind,
    entered_power_W:c.enteredParameters.power_W,entered_size_m:c.enteredParameters.size_m,
    atom_component_power_W:c.parameters.power_W,intensity_radius_m:c.parameters.waist_m,
    reduced_dipole_ea0:d.value,dipole_convention:d.convention,effective_dipole_ea0:ch.dEff_ea0,
    ...(Number.isFinite(ch.matrixElement_ea0)?{magnetic_sublevel_dipole_ea0:ch.matrixElement_ea0}:{}),
    frequency_Hz:c.result.frequency_Hz,omega_rad_s:c.result.omega_rad_s,pi_time_s:c.result.frequency_Hz===0?'infinity':c.result.piTime_s,
    pi_time_status:c.result.frequency_Hz===0?'infinite-zero-coupling':'finite',
    dipole_uncertainty_ea0:d.uncertainty,dipole_uncertainty_status:d.uncertainty===null?'unknown':'reported',
    total_rabi_uncertainty_status:'not-established',source_id:d.sourceId,source_locator:d.sourceLocator,
    source_doi:d.source?.doi??null,source_url:d.source?.url??null,evidence_kind:d.evidenceKind,
    evidence_summary:record.evidence.summary,evidence_states:JSON.stringify(record.evidence.rows.map(row=>({kind:row.key,status:row.status}))),
    software_version:record.build.softwareVersion,app_commit:record.build.appCommit,worktree_dirty:record.build.worktreeDirty,
    dataset_version:c.datasetVersion,dataset_sha256:c.datasetHash,formula_version:c.formulaVersion,evidence_version:record.evidence.evidenceVersion,
    boundary:record.boundary,
  };
}

export function serializeResultCSV(record) {
  const row=resultCSVRow(record);return serializeCSV(Object.keys(row),[row]);
}

const fraction=value=>Number.isInteger(value)?String(value):`${value*2}/2`;
const signed=value=>(value>0?'+':'')+fraction(value);
const pol=q=>({'-1':'σ⁻',0:'π',1:'σ⁺'})[q];
// Human-readable summaries only; CSV, JSON and SVG metadata retain the stored doubles.
const display=value=>Number.isFinite(value)?String(Number(value.toPrecision(8))):'未知';
export function formatCalculationSummary(record) {
  requireRecord(record);
  const c=record.configuration,t=record.transition,ch=record.resolvedChannel,d=record.primaryQuantity,def=c.inputDefinition;
  const factors=getBeamFactors(def,c.selection.pol);
  const allocation=def.powerBasis==='component'?'已为指定分量':def.linearOrientation==='manual'?`手动 ${display(def.manualFraction*100)}%`:def.linearOrientation==='parallel'?'平行 B':'垂直 B';
  return [
    `¹⁷¹Yb ${t.id} · ${t.lower} → ${t.upper} · ${display(t.wavelength.value)} nm (${t.wavelength.evidenceKind}; λ来源=${t.wavelength.sourceId})`,
    `F=${fraction(ch.F)}, mF=${signed(ch.m)} → F′=${fraction(ch.Fp)}, mF′=${signed(ch.mp)} · ${pol(ch.q)} · ${ch.selectionOrigin==='auto'?'自动解析的实际通道':'手选通道'}`,
    `录入：P=${display(c.enteredParameters.power_W)} W（${def.powerPlane==='upstream'?'上游':'原子处'}，${def.powerBasis==='linear-total'?'线偏振总功率':'指定偏振分量功率'}）；尺寸=${display(c.enteredParameters.size_m)} m（1/e²强度${def.sizeKind==='diameter'?'直径':'半径'}）；η=${def.transmission===null?'未使用':display(def.transmission*100)+'%'}；分量分配：${allocation}（f_q=${display(factors.componentFraction)}）`,
    `进入公式：Pq=${display(c.parameters.power_W)} W；w₀=${display(c.parameters.waist_m)} m（1/e²强度半径）；d_eff=${display(ch.dEff_ea0)} ea₀`,
    `Ω/2π=${display(c.result.frequency_Hz)} Hz；Ω=${display(c.result.omega_rad_s)} rad/s；tπ=${c.result.frequency_Hz===0?'∞（零耦合）':display(c.result.piTime_s)+' s'}`,
    `采用 d=${display(d.value)} ea₀ (${d.convention})${Number.isFinite(ch.matrixElement_ea0)?`；M_fi=${display(ch.matrixElement_ea0)} ea₀`:''}；不确定度=${d.uncertainty===null?'未知／未建立':display(d.uncertainty)+' ea₀'}；来源=${d.sourceId}；${d.source?.doi?'DOI: '+d.source.doi:d.sourceLocator||'原文定位待补'}`,
    `软件=${record.build.softwareVersion}；代码基线=${record.build.appCommit??'未知'}${record.build.worktreeDirty===true?'（含本地修改）':record.build.worktreeDirty===false?'（无未提交改动）':'（工作区状态未知）'}；数据=${c.datasetVersion}；公式=${c.formulaVersion}；证据=${record.evidence.evidenceVersion}`,
    `核查：${record.evidence.summary}`,
    '固定模型换算，非独立实验验证；完整 Rabi 不确定度未建立。摘要数值按8位有效数字作可读性格式化，不代表不确定度评定。',
  ].join('\n')+'\n';
}
