import {RECORD_KIND,RECORD_SCHEMA_VERSION} from './calculation-record.js';
import {savedSolvedQuantity} from './solved-quantity.js';
import {getBeamFactors} from '../physics/beam-conventions.js';
import {formatZeroFieldOffset,wavelengthLabel} from './transition-wavelength.js';

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
  const series=Number.isFinite(d.conditions?.n)&&d.conditions.nuReference?d.conditions:null;
  const source=record.evidence.calculationSource;
  const solved=savedSolvedQuantity(c), adoption=t.adoption;
  return {
    exported_at:record.exportedAt,transition_id:t.id,lower_state:t.lower,upper_state:t.upper,multipole:t.multipole,
    wavelength_vac_nm:t.wavelength.value,wavelength_evidence:t.wavelength.evidenceKind,wavelength_source_id:t.wavelength.sourceId,
    F:ch.F,mF:ch.m,F_prime:ch.Fp,mF_prime:ch.mp,q:ch.q,selection_origin:ch.selectionOrigin,
    adoption_status:adoption?.status??null,adoption_label:adoption?.label??null,adoption_scope:adoption?.scope??null,
    adoption_batch_id:adoption?.batchId??null,related_record_ids:adoption?.relatedIds?.join('|')??null,
    solved_quantity:solved.label,solved_value:solved.value,solved_unit:solved.unit,solved_value_SI:solved.valueSI,solved_unit_SI:solved.siUnit,
    solve_for:solved.key,power_plane:def.powerPlane,power_basis:def.powerBasis,transmission:def.transmission,
    transmission_status:def.powerPlane==='atoms'?'not-used':'supplied',
    linear_orientation:def.linearOrientation,manual_component_fraction:def.manualFraction,size_definition:def.sizeKind,
    entered_power_W:c.enteredParameters.power_W,entered_size_m:c.enteredParameters.size_m,
    atom_component_power_W:c.parameters.power_W,intensity_radius_m:c.parameters.waist_m,
    reduced_dipole_ea0:d.value,dipole_convention:d.convention,effective_dipole_ea0:ch.dEff_ea0,
    ...(Number.isFinite(ch.matrixElement_ea0)?{magnetic_sublevel_dipole_ea0:ch.matrixElement_ea0}:{}),
    target_rabi_Hz:solved.key==='rabi'?null:c.parameters.targetRabi_Hz,
    frequency_Hz:c.result.frequency_Hz,omega_rad_s:c.result.omega_rad_s,pi_time_s:c.result.frequency_Hz===0?'infinity':c.result.piTime_s,
    pi_time_status:c.result.frequency_Hz===0?'infinite-zero-coupling':'finite',
    dipole_uncertainty_ea0:d.uncertainty,dipole_uncertainty_status:d.uncertainty===null?'unknown':'reported',
    total_rabi_uncertainty_status:'not-established',source_id:d.sourceId,source_locator:d.sourceLocator,
    source_doi:d.source?.doi??null,source_url:d.source?.url??null,evidence_kind:d.evidenceKind,
    evidence_summary:record.evidence.summary,evidence_states:JSON.stringify(record.evidence.rows.map(row=>({kind:row.key,status:row.status}))),
    software_version:record.build.softwareVersion,app_commit:record.build.appCommit,worktree_dirty:record.build.worktreeDirty,
    dataset_version:c.datasetVersion,dataset_sha256:c.datasetHash,formula_version:c.formulaVersion,evidence_version:record.evidence.evidenceVersion,
    boundary:record.boundary,
    wavelength_reference:t.wavelength.reference??null,wavelength_convention:t.wavelength.convention??null,
    wavelength_source_locator:t.wavelength.sourceLocator??null,wavelength_review_status:t.wavelength.reviewStatus??null,
    wavelength_uncertainty_nm:t.wavelength.uncertainty??null,wavelength_uncertainty_note:t.wavelength.uncertaintyNote??null,
    wavelength_source_conflict:t.wavelength.sourceConflict??null,
    zero_field_offset_from_centroid_MHz:t.wavelength.zeroFieldOffset?.value??null,
    zero_field_offset_uncertainty_MHz:t.wavelength.zeroFieldOffset?.uncertainty??null,
    zero_field_offset_uncertainty_note:t.wavelength.zeroFieldOffset?.uncertaintyNote??null,
    zero_field_offset_source_id:t.wavelength.zeroFieldOffset?.sourceId??null,
    zero_field_offset_source_locator:t.wavelength.zeroFieldOffset?.sourceLocator??null,
    zero_field_offset_convention:t.wavelength.zeroFieldOffset?.convention??null,
    rydberg_n:series?.n??null,rydberg_nu_effective:series?.nu??null,rydberg_nu_reference:series?.nuReference??null,
    rydberg_B_T:series?.B_T??null,rydberg_E_V_m:series?.E_V_m??null,rydberg_branch:series?.branch??null,
    ...(source ? {r017_batch_id:source.batchId,rydcalc_revision:source.codeRevision,
      r017_dataset_sha256:source.datasetSha256,r017_channel_csv_line:source.channelLine,
      r017_channel_csv_url:source.channelUrl,r017_channel_csv_sha256:source.channelTableSha256} : {}),
  };
}

export function serializeResultCSV(record) {
  const row=resultCSVRow(record);return serializeCSV(Object.keys(row),[row]);
}

const fraction=value=>Number.isInteger(value)?String(value):`${value*2}/2`;
const signed=value=>(value>0?'+':'')+fraction(value);
const pol=q=>({'-1':'σ⁻',0:'π',1:'σ⁺'})[q];
const display=value=>Number.isFinite(value)?String(value):'未知';
export function formatWorkingPointLines(record) {
  requireRecord(record);
  const c=record.configuration,ch=record.resolvedChannel,def=c.inputDefinition;
  const solved=savedSolvedQuantity(c);
  const inverse=solved.key!=='rabi';
  const factors=getBeamFactors(def,c.selection.pol);
  const allocation=def.powerBasis==='component'?'已为指定分量':def.linearOrientation==='manual'?`手动 ${display(def.manualFraction*100)}%`:def.linearOrientation==='parallel'?'平行 B':'垂直 B';
  return [
    `主结果 · ${solved.label} = ${display(solved.value)} ${solved.unit}`,
    `F=${fraction(ch.F)}, mF=${signed(ch.m)} → F′=${fraction(ch.Fp)}, mF′=${signed(ch.mp)} · ${pol(ch.q)} · ${ch.selectionOrigin==='auto'?'自动解析的实际通道':'手选通道'}`,
    `录入：P=${display(c.enteredParameters.power_W)} W（${def.powerPlane==='upstream'?'上游':'原子处'}，${def.powerBasis==='linear-total'?'线偏振总功率':'指定偏振分量功率'}）；尺寸=${display(c.enteredParameters.size_m)} m（1/e²强度${def.sizeKind==='diameter'?'直径':'半径'}）；η=${def.transmission===null?'未使用':display(def.transmission*100)+'%'}；分量分配：${allocation}（f_q=${display(factors.componentFraction)}）`,
    `进入公式：Pq=${display(c.parameters.power_W)} W；w₀=${display(c.parameters.waist_m)} m（1/e²强度半径）；d_eff=${display(ch.dEff_ea0)} ea₀`,
    ...(inverse?[`反算目标 Ω/2π=${display(c.parameters.targetRabi_Hz)} Hz`]:[]),
    `${inverse?'重算 ':''}Ω/2π=${display(c.result.frequency_Hz)} Hz；Ω=${display(c.result.omega_rad_s)} rad/s；tπ=${c.result.frequency_Hz===0?'∞（零耦合）':display(c.result.piTime_s)+' s'}`,
  ];
}

export function formatCalculationSummary(record) {
  const workPoint=formatWorkingPointLines(record);
  const c=record.configuration,t=record.transition,ch=record.resolvedChannel,d=record.primaryQuantity;
  const offset=t.wavelength.zeroFieldOffset;
  const wavelengthText=[`${wavelengthLabel(t.wavelength)} ${display(t.wavelength.value)} nm (${t.wavelength.evidenceKind}; λ来源=${t.wavelength.sourceId})`,
    offset?`零场频移（相对重心） ${formatZeroFieldOffset(offset)}`:null,
    offset?.uncertaintyNote,
    t.wavelength.sourceConflict?`原表波长冲突 ${t.wavelength.sourceConflict}`:null].filter(Boolean).join(' · ');
  return [
    `¹⁷¹Yb ${t.id} · ${t.lower} → ${t.upper} · ${wavelengthText}`,
    ...workPoint,
    `记录状态：${t.adoption?.label ?? '保存时未登记'} · ${t.adoption?.scope ?? '未知'}${t.adoption?.batchId ? ' · '+t.adoption.batchId : ''}`,
    `采用 d=${display(d.value)} ea₀ (${d.convention})${Number.isFinite(ch.matrixElement_ea0)?`；M_fi=${display(ch.matrixElement_ea0)} ea₀`:''}；不确定度=${d.uncertainty===null?'未知／未建立':display(d.uncertainty)+' ea₀'}；来源=${d.sourceId}；${d.source?.doi?'DOI: '+d.source.doi:d.sourceLocator||'原文定位待补'}`,
    `软件=${record.build.softwareVersion}；代码基线=${record.build.appCommit??'未知'}${record.build.worktreeDirty===true?'（含本地修改）':record.build.worktreeDirty===false?'（无未提交改动）':'（工作区状态未知）'}；数据=${c.datasetVersion}；SHA-256=${c.datasetHash}；公式=${c.formulaVersion}；证据=${record.evidence.evidenceVersion}`,
    `核查：${record.evidence.summary}`,
    '固定模型换算，非独立实验验证；完整 Rabi 不确定度未建立。',
  ].join('\n')+'\n';
}
