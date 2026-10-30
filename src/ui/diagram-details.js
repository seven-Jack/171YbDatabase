import { CATALOG, getTransitionRecord } from '../data/catalog.js';
import { createFieldView, escapeHTML } from './source-panel.js';
import { renderDiagramSourceMarks } from './diagram-references.js';

const esc = escapeHTML;
const number = (value, digits=3) => Number.isFinite(value) ? value.toFixed(digits).replace(/\.?0+$/, '') : '待补充';
const signed = (value,digits=3) => (value>0?'+':'')+number(value,digits);
const fraction = value => Number.isInteger(value) ? String(value) : `${Math.round(value*2)}/2`;
const magnetic = value => `${value<0?'−':value>0?'+':''}${fraction(Math.abs(value))}`;
const row = (label,value,sourceIds=[],note='') => `<div class="diagram-detail-row"><span>${label}</span><strong>${value}${renderDiagramSourceMarks(sourceIds)}${note?`<small>${esc(note)}</small>`:''}</strong></div>`;

export function renderTransitionTooltip(t,isCore=true) {
  const record=getTransitionRecord(t.id);
  const source=field=>record?.quantities[field]?.sourceId;
  const dipole=createFieldView(t.id,'d_num');
  const review=t.id==='T3'?'波长：文献汇编 · d：内部待核':t.id==='T4'?'λ：Ritz 派生 · τ：统计平均理论':t.id==='T7'?'λ 由 ν 推导 · 原表存在冲突':t.id.startsWith('R')?'历史估算 / 内部矩阵元 · 待核':'文献汇编 · 定义见来源';
  const matrixLabel=record?.quantities.d_num?.value===null?'矩阵元（E1）':dipole?.convention==='有效 F 级约化量'?'d（有效 F）':'d（J 约化）';
  const matrixNote=dipole?.kind==='内部校准'?'内部校准':dipole?.kind==='本工作计算'?'本工作计算':'';
  const wavelength=isCore?`${t.approximate?'≈':''}${t.wavelength_vac_nm.toFixed(t.approximate?2:4)} nm`:`${t.wavelength_vac_nm} nm`;
  return `<div class="diagram-transition-head"><span class="diagram-transition-id">${esc(t.id)}</span>
    <div class="tt-title">${esc(t.lower&&t.upper?`${t.lower} → ${t.upper}`:t.label)}</div></div>
    ${row('λ（真空）',esc(wavelength),[source('wavelength_vac_nm')])}
    ${Number.isFinite(t.frequency_THz)?row('频率 ν',`${t.approximate?'≈':''}${number(t.frequency_THz,5)} THz`,[source('frequency_THz')]):''}
    ${dipole?row(matrixLabel,esc(dipole.valueText),[source('d_num')],matrixNote):''}
    ${row('多极性',esc(t.multipole||'—'))}
    <div class="diagram-detail-foot">${esc(review)}</div>`;
}

export function renderLevelDetails(level,hfs) {
  if (!level||!hfs) return '';
  const saved=level.term==='65³S₁';
  const canonical=CATALOG.levels.records.find(record=>record.attributes.term===level.term&&record.attributes.config===level.config);
  const energy=canonical?.quantities.energy_cm;
  const levelSource=energy?.sourceId;
  const energySources=saved?[levelSource,'legacy-scaling']:[levelSource];
  const hfsSource=saved?CATALOG.hyperfine.saved65S.sourceId:CATALOG.hyperfine.states[level.term]?.sourceId;
  const levels=[...hfs.levels].sort((a,b)=>b.shift-a.shift);
  const splitting=Math.max(...levels.map(l=>l.shift))-Math.min(...levels.map(l=>l.shift));
  const max=Math.max(...levels.map(l=>Math.abs(l.shift)));
  const base=50,scale=max>0?24/max:0;
  const colors=['#e1c48c','#91b9f2'];
  const graphic=levels.map((l,i)=>{
    const y=base-l.shift*scale;
    return `<g class="hfs-detail-branch" data-f="${l.F}" data-shift="${l.shift}">
      <text x="6" y="${y+4}" class="hfs-f-label" fill="${colors[i%2]}">F = ${fraction(l.F)}</text>
      <line x1="70" y1="${y}" x2="150" y2="${y}" stroke="${colors[i%2]}" stroke-width="2.5"/>
      <text x="274" y="${y+4}" text-anchor="end" class="hfs-shift-label">${signed(l.shift,saved?6:3)}</text>
      <text x="70" y="${y+16}" class="hfs-m-label">${Math.round(2*l.F+1)} 态 · m<tspan baseline-shift="sub" font-size="8">F</tspan> 简并</text>
    </g>`;
  }).join('');
  const magneticStates=levels.map((l,i)=>`<div class="hfs-mf-manifold" data-mf-f="${l.F}" data-mf-shift="${l.shift}" style="--hfs-branch-color:${colors[i%2]}">
    <span class="hfs-mf-f">F = ${fraction(l.F)}<small>m<sub>F</sub></small></span>
    <div class="hfs-mf-states" style="--hfs-mf-count:${Math.round(2*l.F+1)}">${Array.from({length:Math.round(2*l.F+1)},(_,index)=>index-l.F).map(m=>`<span class="hfs-mf-state" data-mf="${m}" aria-label="F=${fraction(l.F)}, mF=${magnetic(m)}"><i aria-hidden="true"></i><span>${magnetic(m)}</span></span>`).join('')}</div>
  </div>`).join('');
  return `<header class="diagram-level-head"><h3>${esc(level.config)} <span>${esc(level.term==='65³S₁'?'³S₁':level.term)}</span></h3><p>J = ${level.J} <span>·</span> I = 1/2 <span>·</span> ${level.parity==='even'?'偶宇称':'奇宇称'}</p></header>
    <div class="diagram-level-data">
      ${row('能量 E',Number.isFinite(energy?.value)?`${saved?'≈':''}${esc(number(energy.value,3))} cm⁻¹`:Number.isFinite(level.energy_cm)?`≈${number(level.energy_cm,3)} cm⁻¹`:'未收录',energySources)}
      ${level.lifetime&&level.lifetime!=='估算'?row('寿命 τ',esc(level.lifetime==='stable'?'稳定':level.lifetime),[levelSource]):''}
    </div>
    <section class="diagram-hfs-detail" aria-label="零场超精细结构">
      <div class="diagram-hfs-heading"><h4>超精细结构</h4><span>B = 0</span></div>
      <div class="hfs-detail-metrics">
        <div><span>${saved?'有效 A / MHz':'A / MHz'}</span><strong>${signed(hfs.A,saved?6:3)}${renderDiagramSourceMarks([hfsSource])}</strong></div>
        ${levels.length>1?`<div><span>Δν / MHz</span><strong>${number(splitting,saved?6:3)}${renderDiagramSourceMarks([hfsSource])}</strong></div>`:`<div><span>F = 1/2</span><strong>2 <small>重简并</small></strong></div>`}
      </div>
      <div class="hfs-detail-graphic"><svg viewBox="0 0 280 94" role="img" aria-label="${esc(level.term)} 零场 F 能级，δE/h 单位 MHz，同一 F 内 mF 简并">
        <text x="274" y="14" text-anchor="end" class="hfs-axis-label">δE/h · MHz</text>
        ${max>0?`<line x1="70" y1="${base}" x2="150" y2="${base}" class="hfs-centroid"/><text x="6" y="${base+3}" class="hfs-axis-label">重心</text>`:''}
        ${graphic}</svg></div>
      <div class="hfs-mf-manifolds" aria-label="展开全部 mF 子能级">${magneticStates}</div>
      <div class="diagram-detail-foot"><span>${saved?'所选 F 对重心':'能级重心'}为零点 · mF 简并</span></div>
    </section><div class="diagram-level-review">${saved?'保存计算 · 原始工件已定位':energy?.reviewStatus==='conflict-unresolved'?'能量路径存在冲突 · A 采用汇编':energy?.reviewStatus==='original-source-located'?'¹⁷¹Yb 质心 · 文献汇编':'历史估算 · 指定分支待核'}</div>`;
}
