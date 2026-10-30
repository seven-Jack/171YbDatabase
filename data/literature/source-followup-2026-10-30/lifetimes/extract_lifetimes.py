"""Visual transcription of all ten numbered tables in papers2,3,8.
No PDF is changed and no atomic model is recomputed. Raw pages govern symbols.
"""
from pathlib import Path
import csv, hashlib, json, re
from decimal import Decimal

ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
DATE='2026-10-30'
SOURCES={
 'mishra-2001':{'number':2,'sourceId':'mishra-2001-jqsrt','doi':'10.1016/S0022-4073(00)00117-5','title':'Radiative lifetimes of the first excited 3Po2,0 metastable levels in Kr I, Xe I, Yb I and Hg-like atoms','evidenceKind':'theoretical-calculation','temperature_K':None,'BBR_temperature_K':None,'F_scope':'line-as-a-whole statistical average in Tables3,5; resolvedF components separately inTable4','model':'First-order hyperfine perturbation within(ns np), spin-orbit mixing; M1/M2/HFI-E1; E2 omitted; no BBR term specified for Table5. Table7 T=300K is laser-gain context only.'},
 'baumann-1985':{'number':3,'sourceId':'baumann-1985-jpb','doi':'10.1088/0022-3700/18/17/001','title':'Radiative lifetimes and gJ factors of low-lying even-parity levels in the Yb I spectrum','evidenceKind':'measurement-plus-compilation-comparison','temperature_K':None,'BBR_temperature_K':None,'isotopeScope':'174Yb for current two-step J0,1,2 measurements:556nm first step locked174Yb. Metastable J3 excitation and reproduced1981 rows not individually isotope-resolved here.','method':'Time-resolved fluorescence exponential decay least-squares fit; density varied by>=10 and extrapolated tozero for radiation trapping; quantum beats with fewmT for gJ. No precise branching ratios, therefore no oscillator strengths.'},
 'rambow-1976':{'number':8,'sourceId':'rambow-1976-pra','doi':'10.1103/PhysRevA.14.738','title':'Radiative lifetimes and alignment depolarization cross sections for YbI and II by the Hanle effect in a flowing helium system','evidenceKind':'measurement-plus-literature-comparison','temperature_K':None,'BBR_temperature_K':None,'isotopeScope':'natural mixture; neutralYbI and ionYbII separate; not171Yb-specific','method':'Hanle Lorentzian widths; double extrapolation tozeroYb density and zeroHe pressure; collisional broadening/coherence narrowing treated. TableI lifetimes do NOT include hyperfine correction. Quoted error limits maximumconfidence, not established1sigma.'}
}

def val(raw):
    if raw is None:return {'raw':None,'value':None,'uncertainty':None,'missingReason':'blank-or-unreported'}
    raw=str(raw)
    if raw in ['—','∞']:return {'raw':raw,'value':None,'uncertainty':None,'missingReason':'infinite-within-single-photon-model' if raw=='∞' else 'not-applicable-or-unreported'}
    m=re.fullmatch(r'([+-]?\d+(?:\.\d+)?)(?:\((\d+(?:\.\d+)?)\))?(?:e([+-]?\d+))?',raw)
    if not m:return {'raw':raw,'value':None,'uncertainty':None,'status':'symbolic-expression'}
    mean,u,e=m.groups();factor=Decimal(10)**int(e or 0)
    unc=None
    if u:
        unc=Decimal(u) if '.' in u else Decimal(u)*Decimal(10)**(-len(mean.split('.')[1]) if '.' in mean else 0)
    return {'raw':raw,'value':float(Decimal(mean)*factor),'uncertainty':None if unc is None else float(unc*factor),'uncertaintyConvention':'as printed; confidence not inferred'}

def table(source,number,page,printed,columns,rows,units,notes=None):
    result={'table':str(number),'pdfPhysicalPage':page,'printedPage':printed,'columns':columns,'units':units,'notes':notes or [],'rows':[]}
    for i,values in enumerate(rows):
        result['rows'].append({'rowIndex':i+1,**dict(zip(columns,values))})
    return result

M=[]
M.append(table('mishra-2001',1,5,773,['m','qz_2m','qplus_2m','qminus_2m'],[
 [-2,'0','0','-sqrt(6)*(x-i*y)'],[-1,'sqrt(3/2)*(x+i*y)','0','-sqrt(6)*z'],[0,'2*z','x-i*y','-x-i*y'],[1,'sqrt(3/2)*(x+i*y)','sqrt(6)*z','0'],[2,'0','sqrt(6)*(x+i*y)','0']],{'m':'dimensionless','orbitalOperators':'length'},['Formula strings transcribed as printed; m=-1 qz also prints(x+i*y), retained without silently repairing tensor convention.']))
M.append(table('mishra-2001',2,7,775,['atom','M2_3P2_to_1S0','M1_3P2_to_3P1','M1_3P0_to_3P1'],[
 ['Mg','2.2e-4','9.10e-7','—'],['Zn','1.2e-3','7.93e-4','—'],['Cd','1.1e-3','2.16e-2','—'],['Hg','3.5e-3','1.349','—'],['Yb','1.8e-4','6.77e-2','—'],['Kr','1.0e-2','—','2.041'],['Xe','1.0e-2','—','11.920']],{'rates':'s^-1'},['Same rates for isotopic species in this model. Dash marks radiative emission impossible when ordering excludes the finalstate; never substituted with numeric zero.']))
M.append(table('mishra-2001',3,8,776,['atom','abundance_percent','I','HFI_E1_3P2_to_1S0','HFI_E1_3P0_to_1S0'],[
 ['25Mg','10.11','5/2','3.60e-4','1.69e-3'],['naturalMg','—','—','3.64e-5','1.71e-4'],['67Zn','4.11','5/2','7.43e-3','1.80e-2'],['naturalZn','—','—','3.05e-4','7.39e-4'],['111Cd','12.75','1/2','0.030','0.056'],['113Cd','12.26','1/2','0.033','0.062'],['naturalCd','—','—','0.008','0.015'],['199Hg','16.84','1/2','0.587','0.669'],['201Hg','13.22','3/2','0.401','0.457'],['naturalHg','—','—','0.152','0.173'],['171Yb','14.34','1/2','0.044','0.062'],['173Yb','16.18','5/2','0.045','0.055'],['naturalYb','—','—','0.014','0.018'],['83Kr','11.55','9/2','0.038','1.638'],['naturalKr','—','—','0.004','0.188'],['129Xe','26.24','1/2','0.261','3.615'],['131Xe','21.24','3/2','0.119','1.571'],['naturalXe','—','—','0.093','1.270']],{'rates':'s^-1','abundance_percent':'%'},['Eq15: A(line)=sum_F[(2F+1)A(F,Fground)]/sum_F(2F+1); not an F-resolved rate. Natural species also averaged by isotopic abundance.']))
M.append(table('mishra-2001',4,9,777,['atom','F_upper','F_lower','HFI_E1_rate'],[
 ['25Mg','3/2','5/2','0.0003'],['25Mg','5/2','5/2','0.0007'],['25Mg','7/2','5/2','0.0007'],['67Zn','3/2','5/2','0.0068'],['67Zn','5/2','5/2','0.0136'],['67Zn','7/2','5/2','0.0142'],['111Cd','3/2','1/2','0.0756'],['113Cd','3/2','1/2','0.0827'],['199Hg','3/2','1/2','1.4670'],['201Hg','1/2','3/2','0.1902'],['201Hg','3/2','3/2','0.6251'],['201Hg','5/2','3/2','0.8572'],['171Yb','3/2','1/2','0.1097'],['173Yb','3/2','5/2','0.0249'],['173Yb','5/2','5/2','0.0633'],['173Yb','7/2','5/2','0.0880'],['83Kr','7/2','9/2','0.0187'],['83Kr','9/2','9/2','0.0596'],['83Kr','11/2','9/2','0.0979'],['129Xe','3/2','1/2','0.6527'],['131Xe','1/2','3/2','0.0982'],['131Xe','3/2','3/2','0.2467'],['131Xe','5/2','3/2','0.1985']],{'HFI_E1_rate':'s^-1'},['All entries3P2->1S0;171Yb F=5/2 absent because E1 to Fground1/2 fails angular condition.']))
M.append(table('mishra-2001',5,9,777,['atom','tau_3P2_s','tau_3P0_s'],[
 ['25Mg','1721','591.7'],['evenMg','4526','∞'],['naturalMg','3882','5848'],['67Zn','106.1','55.6'],['evenZn','501.8','∞'],['naturalZn','435.2','1350'],['111Cd','19.0','17.9'],['113Cd','18.0','16.1'],['evenCd','44.1','∞'],['naturalCd','32.7','67.2'],['199Hg','0.52','1.5'],['201Hg','0.57','2.2'],['evenHg','0.74','∞'],['naturalHg','0.67','5.78'],['171Yb','8.9','16.1'],['173Yb','8.7','18.0'],['evenYb','14.7','∞'],['naturalYb','12.3','55.9'],['83Kr','20.7','0.272'],['evenKr','96','0.490'],['naturalKr','67.7','0.448'],['129Xe','3.7','0.064'],['131Xe','7.8','0.074'],['evenXe','100','0.084'],['naturalXe','9.7','0.076']],{'tau_3P2_s':'s','tau_3P0_s':'s'},['Uses line-as-a-whole averaged HFI rates in Table3;8.9s is not the F=3/2 resolved lifetime. No uncertainties supplied; no BBR temperature stated. Infinity only within considered single-photon model.']))
M.append(table('mishra-2001',6,10,778,['atom','alpha','A_1P1_to_1S0'],[
 ['Mg','0.99998','4.26e8'],['Zn','0.99983','7.09e8'],['Cd','0.99899','6.02e8'],['Hg','0.98510','7.63e8'],['Yb','0.99504','2.09e8'],['Kr','0.69622','2.50e8'],['Xe','0.63873','3.16e8']],{'alpha':'dimensionless','A_1P1_to_1S0':'s^-1'},['Adopted calculation inputs, not new measurements of current paper.']))
M.append(table('mishra-2001',7,11,779,['atom','transition','wavenumber_cm','A21','k_over_N2'],[
 ['132Xe','3P0->3P1','8151.629','11.92','2.541e-21'],['84Kr','3P0->3P1','4274.853','2.04','2.407e-21'],['200Hg','3P2->3P1','4630.677','1.34','1.917e-21'],['112Cd','3P2->3P1','1170.866','0.02','1.434e-21'],['I','2P1/2->2P3/2','7603.150','7.90','2.036e-21']],{'wavenumber_cm':'cm^-1','A21':'s^-1','k_over_N2':'printed k(nu0)(m^-1)/N2(m^-3); dimensionally m^2'},['T=300K Doppler-gain calculation, N1<<N2, selected even isotopes to avoidHFS. This temperature does not label Table5 lifetimes. I A21 calculated usingEq3.']))

B=[]
B.append(table('baumann-1985',1,4,'L603',['state','excitation_nm','this_work_tau_ns','Lange1970_tau_ns','CorlissBozman1962_tau_ns','Coulomb_tau_ns','origin'],[
 ['6s6d1D2','453.0','35.2(10)','—','34','11','this-work'],['6s6d3D3','493.4','23.4(11)','20.7(30)','23','35','this-work'],['6s6d3D2','457.6','24.2(12)','20.5(30)','16','24','Baumann1981-reproduced'],['6s6d3D1','458.2','22.7(7)','20.7(18)','—','12','Baumann1981-reproduced'],['6s7d1D2','379.2','49.8(20)','—','—','38','this-work'],['6s7d3D3','405.2','43.1(12)','—','—','93','this-work'],['6s7d3D2','379.8','66.5(36)','—','—','63','this-work'],['6s7d3D1','379.8','38.4(17)','—','—','34','this-work'],['6s7s3S1','679.9','15.9(19)','12.5(15)','15','21','this-work'],['6s8s3S1','423.2','34.3(42)','—','—','85','this-work'],['6s8s1S0','417.5','37.9(42)','—','—','143','this-work']],{'excitation_nm':'nm','lifetimeColumns':'ns'},['Lange1970 comparisons are reproduced measured values; CorlissBozman1962 inferred from transition probabilities; Coulomb is theory. Do not conflate these columns as current measurements.']))
B.append(table('baumann-1985',2,4,'L603',['state','this_work_gJ','MeggersTech1978_gJ','WyartCamus1979_exp_gJ','WyartCamus1979_calc_gJ','LS_gJ','origin'],[
 ['6s6d1D2','1.020(7)','1.03','1.03','1.016','1.0','this-work'],['6s6d3D3','1.354(15)','1.33','1.33','1.333','1.334','this-work'],['6s6d3D2','1.163(7)','1.16','1.16','1.151','1.167','Baumann1981-reproduced'],['6s6d3D1','0.500(4)','0.5','0.50','0.5','0.499','Baumann1981-reproduced'],['6s7d1D2','1.111(12)','1.10','1.08','1.080','1.0','this-work'],['6s7d3D3','1.338(7)','1.32','1.32','1.333','1.334','this-work'],['6s7d3D2','1.079(36)','—','1.10','1.131','1.167','this-work'],['6s7d3D1','0.508(5)','—','0.56','0.5','0.499','this-work'],['6s7s3S1','2.01(1)','2.01','2.00','2.0','2.0','this-work'],['6s8s3S1','2.01(1)','2.02','2.02','2.0','2.0','this-work']],{'gJ':'dimensionless'},['SOURCE_INTERNAL_CONFLICT:Table2 prints6s7d3D2 gJ1.079(36), abstractpL601 prints1.079(7). Both retained, neither silently corrected.']))

R=[]
R.append(table('rambow-1976','I',4,741,['species','line_A','state','configuration','level_energy_cm','gJ','sigma_1e15cm2','tau_ns','other_lifetimes_ns'],[
 ['YbI','5556','3P1o','4f14 6s6p','17992','1.48','5.0(1.0)','820(20)','827(40)[a];760(80)[b];850(80)[c];980(70)[d]'],
 ['YbI','3988','1P1o','4f14 6s6p','25068','1.035','5.9(1.0)','5.12(0.12)','5.5(0.25)[a];12[f];5.63(0.25)[e];6.4(0.2)[d]'],
 ['YbI','3464','(3 1/2,3 1/2)1o','4f13 5d6s2','28857','1.26','5.9(1.2)','14.4(0.5)','17[b];14.3(0.9)[e];18.3[d]'],
 ['YbI','2672','(?)1o','?','37414','1.02','17.9(2.0)','77.4(6.0)','57.3(4)[e];93[d]'],
 ['YbI','2464','1P1o','4f14 6s7p','40564','1.01','28.2(3.0)','9.3(0.6)','10.4(1.5)[e];12.4[d]'],
 ['YbI','2272','1P1o','4f14 6s8p','44017','1.00','51.6(4.0)','39.1(3.5)','—'],
 ['YbII','3290','2P3/2o','4f14 6p','30392','1.333','7.2(2.5)','5.8(0.6)','7.3(0.6)[c]']],{'line_A':'angstrom','level_energy_cm':'cm^-1 (abstract for corresponding lines)','gJ':'dimensionless','sigma_1e15cm2':'10^-15cm^2','tau_ns':'ns'},['Errors maximumconfidence limits; not established1sigma. Table values exclude HFS correction; neutral lifetimes mayincrease3%, ion5%.','Other-data keys:a BaumannWandelRef5;b BudickSnirRef9;c BurshteinRef8;d KomarovskiiPenkinRef6;e LangeRef7;f BudickSnirRef10.','SOURCE_INTERNAL_CONFLICT:abstract gives14.4(0.4),9.32(0.6),sigma6s8p5.16(4.0);TableI gives14.4(0.5),9.3(0.6),sigma51.6(4.0). Keep printed table and abstract separately.','Term3464A transcribed as printed(3 1/2,3 1/2)1o; do not reinterpret jj/configuration without another source.']))

ALL={'mishra-2001':M,'baumann-1985':B,'rambow-1976':R}
manifest=[]
for key,tables in ALL.items():
    meta=SOURCES[key];pdf=ROOT/f'references/papers/{meta["number"]}.pdf';sha=hashlib.sha256(pdf.read_bytes()).hexdigest()
    pages=(ROOT/f'data/literature/source-followup-2026-10-30/paper-{meta["number"]}.txt').read_text().split('\f')
    for t in tables:
        for row in t['rows']:
            row['parsedCells']={k:val(v) for k,v in row.items() if k!='rowIndex'}
        columns=['sourceId','table','pdfPhysicalPage','printedPage']+t['columns']
        with (OUT/f'{key}-table-{t["table"]}.csv').open('w',newline='') as f:
            writer=csv.DictWriter(f,fieldnames=columns);writer.writeheader()
            for row in t['rows']:writer.writerow({'sourceId':meta['sourceId'],'table':t['table'],'pdfPhysicalPage':t['pdfPhysicalPage'],'printedPage':t['printedPage'],**{k:row[k] for k in t['columns']}})
        (OUT/f'{key}-table-{t["table"]}-raw-page.txt').write_text(pages[t['pdfPhysicalPage']-1])
    doc={'schemaVersion':1,'sourcePdf':str(pdf),'sha256':sha,'extractedAt':DATE,'metadata':meta,'nullMeaning':'missing/unreported/infinite model values are explicitly flagged, never numeric zero','tables':tables}
    (OUT/f'{key}.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
    manifest.append({'sourceId':meta['sourceId'],'numberedPdf':str(pdf.relative_to(ROOT)),'sha256':sha,'output':str((OUT/f'{key}.json').relative_to(ROOT)),'tables':len(tables),'rows':sum(len(t['rows']) for t in tables),'visuallyCheckedPhysicalPages':sorted({t['pdfPhysicalPage'] for t in tables}),'originalUnchanged':hashlib.sha256(pdf.read_bytes()).hexdigest()==sha})

facts=[
 {'id':'mishra-171-P2-line-average','sourceId':'mishra-2001-jqsrt','pdfPhysicalPage':[7,8,9],'printedPage':[775,776,777],'table':['3','4','5'],'isotope':171,'state':'6s6p3P2','reportedLifetime_s':8.9,'uncertainty':None,'convention':'line-as-a-whole statistical-hyperfine average, not F-resolved','equation':'A_line=sum(2F+1)*A(F,Fground)/sum(2F+1),Eq15','HFI_E1_line_rate_per_s':.044,'HFI_E1_F32_to_F12_per_s':.1097,'M1_to_3P1_per_s':.0677,'M2_to_1S0_per_s':.00018,'temperature_K':None,'BBRTemperature_K':None,'evidenceKind':'theory','doNot':'Do not assign8.9s or1/8.9 to bothF manifolds or reverse it to universalE1d.'},
 {'id':'mishra-derived-arithmetic-boundaries','sourceId':'mishra-2001-jqsrt','evidenceKind':'derived-audit-arithmetic-not-new-model','line_average_rate_per_s':.044+.0677+.00018,'inverse_line_average_rate_s':1/(.044+.0677+.00018),'conditional_F32_inverse_rate_s':1/(.1097+.0677+.00018),'conditional_F52_inverse_rate_s':1/(.0677+.00018),'conditions':'Illustrates printed-table model only; no uncertainty/new calculation validated;HFI E1F52=0 only by stated angular restriction. Keep separate from Porsev2004 theory.'},
 {'id':'baumann-174-3S1','sourceId':'baumann-1985-jpb','pdfPhysicalPage':[2,3,4,5],'printedPage':['L601','L602','L603','L604'],'isotope':174,'state':'6s7s3S1','lifetime_ns':15.9,'uncertainty_ns':1.9,'uncertaintyConvention':'reported parentheses; statistical confidence not specified','gJ':2.01,'gJ_uncertainty':.01,'temperature_K':None,'BBRTemperature_K':None,'evidenceKind':'direct time-resolved fluorescence measurement','noOscillatorStrength':'Explicit pL604:accurate branching ratios missing, oscillator strengths cannot be given.','doNot':'Do not replace171Yb compilation13.8(1.7) with174Yb single measurement or claim measured d/f/branching.'},
 {'id':'rambow-neutral-lifetimes','sourceId':'rambow-1976-pra','pdfPhysicalPage':[1,3,4,5],'isotope':None,'isotopeScope':'natural mixture','P1_triplet_lifetime_ns':820,'P1_triplet_error_limit_ns':20,'P1_singlet_lifetime_ns':5.12,'P1_singlet_error_limit_ns':.12,'uncertaintyConvention':'maximum confidence limits; HFS excluded','method':'zero Yb density and zero He pressure double extrapolation, correctedcollisional broadening/coherencenarrowing','HFS_note':'source leaves uncorrected; can raise neutral lifetimes as much as3%, ion5%; extra uncertainty, not appliedcorrection','temperature_K':None,'BBRTemperature_K':None,'doNot':'Do not label171Yb-specific,1sigma,or HFS-corrected.'}
]
(OUT/'key-facts.json').write_text(json.dumps({'schemaVersion':1,'facts':facts},ensure_ascii=False,indent=2)+'\n')
(OUT/'manifest.json').write_text(json.dumps({'date':DATE,'sources':manifest,'tableCount':sum(m['tables'] for m in manifest),'tableRowCount':sum(m['rows'] for m in manifest),'scientificComputation':'none; only original-table transcription and explicitly labelled scalar arithmetic'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
