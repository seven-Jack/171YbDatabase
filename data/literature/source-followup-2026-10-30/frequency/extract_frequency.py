from pathlib import Path
from decimal import Decimal
import re,json,csv,hashlib,math
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
meta={1:dict(sourceId='qiao-2023-rinp',doi='10.1016/j.rinp.2023.106439',context='171Yb ultracold optical lattice; comb referenced to local578nm clock; reported shifts corrected; no cross-line covariance matrix supplied',tables=3),4:dict(sourceId='qiao-2023-apl',doi='10.1063/5.0155776',context='Yb isotope MTS in Ne hollow-cathode lamp; absolute pressure correction estimated; reference-isotope174; natural width not inferred from broadened MTS',tables=7),5:dict(sourceId='zhou-2020-pra',doi='10.1103/PhysRevA.101.062506',context='Yb isotope649nm MTS in Ne hollow-cathode lamp; absolute common uncertainty3.2MHz; relative shifts separately measured; HCL22degC pressure-rate reference is not complete BBR temperature',tables=4),6:dict(sourceId='zhao-2024-pra',doi='10.1103/PhysRevA.110.042816',context='Yb isotope1389nm MTS in Ne hollow-cathode lamp; absolute systematic uncertainty dominated by pressure estimate; magnetic field280mG; spectrum linewidth not natural lifetime',tables=4)}
for n,m in meta.items():m['pdf']=f'references/papers/{n}.pdf';m['sha256']=hashlib.sha256((ROOT/m['pdf']).read_bytes()).hexdigest()
tables=[]
def val(s,unit='MHz'):
 s=s.strip();r={'printed':s,'unit':unit,'value':None,'uncertainty':None}
 if s in ['/','—','']:r['missingReason']='not reported';return r
 t=s.replace(',','').replace('−','-').replace('–','-').replace(' ','')
 if t.startswith('<'):r['bound']='less-than';t=t[1:].strip()
 match=re.fullmatch(r'([+-]?\d+(?:\.\d+)?)(?:\(([^)]+)\))?',t)
 if match:
  r['value']=str(Decimal(match[1]));u=match[2]
  if u:
   if u.startswith('<'):r['uncertaintyBound']='less-than';u=u[1:]
   r['uncertainty']=str(Decimal(u) if '.' in u else Decimal(u)*Decimal(10)**Decimal(-len(match[1].split('.')[1]) if '.' in match[1] else 0))
 return r

def add(n,table,page,printed,cols,rows,note=''):
 records=[]
 for data in rows:
  label,ref,*numbers=data
  records.append({'label':label,'referenceInPaper':ref,'evidenceKind':'this-paper-reported' if ref in ['This work','this work'] else 'comparison-quoted-from-reference','cells':{col:val(number) for col,number in zip(cols,numbers)}})
 tables.append({'paperNumber':n,**meta[n],'table':table,'pdfPage':page,'printedPage':printed,'columns':cols,'note':note,'rows':records,'rawPageText':f'paper-{n}-page-{page}.txt','renderedVerified':f'rendered/paper-{n}-p{page}.png'})

# Qiao RINP, all three tables. Expand merged Zeeman cells explicitly.
channels=['649nm Fg1/2 Fe1/2','649nm Fg1/2 Fe3/2','770nm Fg3/2 Fe1/2','770nm Fg3/2 Fe3/2','770nm Fg5/2 Fe3/2']
effects={'Lattice light':['-5.20(.15)','-6.09(.12)','7.80(.58)','9.12(.01)','6.75(.75)'],'Probe':['-.01(.01)','.10(.02)','-.02(.05)','-.26(.02)','-.22(.05)'],'Collision':['.44(.09)','.39(.16)','.03(.17)','-.07(.18)','.04(.20)'],'Zeeman':['<.01 (<.01)']*5,'Statistical':['0(.11)','0(.24)','0(.24)','0(.32)','0(.44)'],'Total':['-4.77(.21)','-5.60(.31)','7.81(.65)','8.79(.37)','6.57(.89)']}
# Leading zero normalization in human transcription, exact source spelling stored on raw page.
for effect,values in effects.items():
 for i,s in enumerate(values):
  s=re.sub(r'(?<!\d)([+-]?)\.',r'\g<1>0.',s)
  values[i]=s
add(1,'Table1',4,'4',['shift_with_uncertainty'],[(f'171Yb {channel}; {effect}','This work',values[i]) for effect,values in effects.items() for i,channel in enumerate(channels)],'Zeeman rows were merged in original separately for649 and770 groups; expanded cells are not independent experiments. Values transcribed from rendered table; minus glyph corrupt in Poppler text.')
add(1,'Table2',5,'5',['frequency'],[
('171Yb 649 Fg1/2 Fe1/2','[34]','461861338.1(3.2)'),('171Yb 649 Fg1/2 Fe3/2','[34]','461871594.9(3.2)'),('171Yb 649 Fg1/2 Fe1/2','This work','461861338.03(0.21)'),('171Yb 649 Fg1/2 Fe3/2','This work','461871596.07(0.31)'),('171Yb 770 Fg3/2 Fe1/2','This work','389257019.71(0.65)'),('171Yb 770 Fg3/2 Fe3/2','This work','389267277.10(0.37)'),('171Yb 770 Fg5/2 Fe3/2','This work','389260569.95(0.89)')])
add(1,'Table3',5,'5',['splitting'],[
('6s7s3S1','This work','10258.04(0.37)'),('6s7s3S1','[34]','10256.75(0.29)'),('6s7s3S1','[36]','10,290'),('6s7s3S1','[37]','10285.8'),('6s7s3S1','[38]','10256(14)'),('6s7s3S1','[39]','10215(15)'),('6s7s3S1','[40]','10271.6(2.6)'),('6s6p3P2','[41]','6705(18)'),('6s6p3P2','[40]','6680.7(2.4)'),('6s6p3P2','This work','6707.15(0.96)')])
# APL TableI-VII
add(4,'TableI',4,'224002-3',['shift','uncertainty'],[(a,'This work',b,c) for a,b,c in [('Pressure','-14.0','3.2'),('Probe power','-5.26','0.2'),('Lamp current','5.46','0.05'),('RAM','-1.33','0.09'),('Locking offset','-0.088','0.003'),('Total','-15.2','3.2')]],'Table locking offset-0.088 differs from body PDFp5 -0.880(3); retain both, not formally corrected.')
apl_labels=['173Yb Fg5/2 Fe7/2','173Yb Fg7/2 Fe7/2','171Yb Fg3/2 Fe1/2','173Yb Fg3/2 Fe5/2','173Yb Fg9/2 Fe7/2','170Yb','172Yb','173Yb Fg5/2 Fe5/2','174Yb','173Yb Fg1/2 Fe3/2','176Yb','173Yb Fg3/2 Fe3/2','173Yb Fg7/2 Fe5/2','173Yb Fg5/2 Fe3/2','171Yb Fg3/2 Fe3/2']
apl_freq=['389253764.4(34)','389256586.7(33)','389257023.7(32)','389257855.9(32)','389259023.2(32)','389259634.0(35)','389260184.2(32)','389260382.2(33)','389260605.8(32)','389260850.6(32)','389261029.9(32)','389262580.5(33)','389263212.9(32)','389265110.6(33)','389267281.4(32)']
add(4,'TableII',5,'224002-4',['frequency'],[(l,'This work',f) for l,f in zip(apl_labels,apl_freq)])
add(4,'TableIII',5,'224002-4',['this_work_frequency','reference11_frequency','difference'],[(l,'This work and[11]',*v) for l,v in zip(['170Yb','172Yb','174Yb','176Yb'],[['389259634.0(35)','389259442(33)','192(33)'],['389260184.2(32)','389259973(24)','211(24)'],['389260605.8(32)','389260412(24)','194(24)'],['389261029.9(32)','389260849(23)','181(23)']])])
apl_shifts=['-6841.4(12)','-4019.1(9)','-3582.1(4)','-2749.9(3)','-1582.6(3)','-971.8(13)','-421.6(3)','-223.6(7)','0.0','244.8(5)','424.1(4)','1974.7(7)','2607.1(4)','4504.8(9)','6675.6(4)']
add(4,'TableIV',6,'224002-5',['relative_shift'],[(l,'This work',v) for l,v in zip(apl_labels,apl_shifts)],'relative to174Yb; errors are smaller than common absolute calibration error')
add(4,'TableV',6,'224002-5',['reference11_shift','reference12_shift','this_work_shift'],[(l,'comparison',*v) for l,v in zip(['176Yb-174Yb','174Yb-172Yb','172Yb-170Yb'],[['437(33)','425.7(3)','424.1(4)'],['439(34)','425.3(3)','421.6(3)'],['531(41)','543.0(15)','550.2(13)']])])
hfs_old=[('33','6860','-1900','<10'),('34','6857.2','-1892.2','0'),('13','6837(9)','-1894(8)','/'),('35','6810(10)','-1879(10)','<-3(18)'),('12','6847.7(17)','-1892.78(42)','-0.2(10)'),('20','6837.83(19)','-1891.46(7)','-0.62(16)'),('This work','6838.5(1)','-1891.0(3)','0.62(62)')]
add(4,'TableVI',6,'224002-5',['A_171','A_173','B_173'],[('6s7s3S1',*r) for r in hfs_old])
add(4,'TableVII',6,'224002-5',['A_173','B_173'],[('6s6p3P2',*r) for r in [('14','-742(5)','1342(38)'),('12','-742.71(29)','1342.3(19)'),('15','-742.11(2)','1339.2(2)'),('This work','-742.5(1)','1340.2(9)')]])
# Zhou2020 TableI-IV
add(5,'TableI',4,'062506-4',['shift','uncertainty'],[(a,'This work',b,c) for a,b,c in [('Pressure','-14.0','3.2'),('Laser power','0.13','0.04'),('Lamp current','3.59','0.09'),('RAM','-0.12','0.08'),('Locking offset','0','0.08'),('Total','-10.4','3.2')]])
zlabels=['171Yb Fg1/2 Fe1/2','173Yb Fg5/2 Fe7/2','170Yb','172Yb','174Yb','176Yb','173Yb Fg5/2 Fe5/2','171Yb Fg1/2 Fe3/2','173Yb Fg5/2 Fe3/2']
zfreq=['461861338.1','461863970.9','461867981.9','461868512.3','461868929.9','461869328.3','461870590.3','461871594.9','461875319.7']
add(5,'TableII',5,'062506-5',['frequency'],[(l,'This work',v) for l,v in zip(zlabels,zfreq)],'All rows have common absolute uncertainty3.2MHz; not missing or zero uncertainty. Per-row values print no parentheses. Relative-shift uncertainties inTableIII cannot be reconstructed as independent3.2MHz errors.')
for row in tables[-1]['rows']:row['cells']['frequency']['uncertainty']='3.2';row['cells']['frequency']['uncertaintyScope']='common absolute uncertainty per table caption'
zsh_old=['-7568(33)','-4926(50)','-937(29)','-413(20)','0','+392(26)','+1651(59)','+2647(32)','+6349(55)'];zsh_new=['-7591.77(21)','-4959.02(20)','-947.85(24)','-417.56(20)','0','+398.37(20)','+1660.45(21)','+2664.97(20)','+6389.80(22)']
add(5,'TableIII',5,'062506-5',['reference15_shift','this_work_shift'],[(l,'This work and[15]',a,b) for l,a,b in zip(zlabels,zsh_old,zsh_new)])
add(5,'TableIV',5,'062506-5',['A_171','A_173','B_173'],[('6s7s3S1',*r) for r in [('60','6860','-1900','<10'),('61','6857.2','-1892.2','0'),('17','6837(9)','-1894(8)','/'),('15','6810(10)','-1879(10)','<-3(18)'),('18','6847.7(17)','-1892.78(42)','-0.2(10)'),('This work','6837.83(19)','-1891.46(7)','-0.62(16)')]])
# Zhao2024 TableI-IV
add(6,'TableI',5,'042816-5',['shift','uncertainty'],[(a,'This work',b,c) for a,b,c in [('Pressure','-1.1','3.2'),('Probe power','0.438','0.046'),('Pump power','-0.133','0.047'),('HCL current','-0.478','0.130'),('RAM','0.425','0.008'),('Locking offset','0.009','0.01'),('Total','-0.8','3.2')]])
xlabels=['173Yb Fg5/2 Fe3/2','171Yb Fg1/2 Fe3/2','173Yb Fg5/2 Fe5/2','176Yb','174Yb','172Yb','170Yb','173Yb Fg5/2 Fe7/2','171Yb Fg1/2 Fe1/2']
xfreq=['215868248.2(35)','215869124.9(32)','215869151.9(32)','215869802.1(32)','215869916.7(32)','215870038.2(32)','215870201.2(37)','215871477.9(33)','215872184.1(32)']
add(6,'TableII',5,'042816-5',['reference14_frequency','this_work_frequency'],[(l,'This work and[14]',('215869125.43(12)' if i==1 else '215872182.84(10)' if i==8 else '/'),v) for i,(l,v) in enumerate(zip(xlabels,xfreq))])
xshift=['-1668.5(16)','-791.8(8)','-764.9(8)','-114.6(6)','0','121.5(7)','284.5(20)','1561.2(11)','2267.4(8)']
add(6,'TableIII',5,'042816-5',['relative_shift'],[(l,'This work',v) for l,v in zip(xlabels,xshift)],'relative to174Yb; common absolute pressure error does not enter as independent per-line3.2MHz')
add(6,'TableIV',6,'042816-6',['A_171','A_173','B_173'],[(label,ref,*cells) for label,ref,cells in [('Theory','(2019)[3]',['-2349','648','249']),('Theory','(1999)[25]',['/','596','290']),('Experiment','(1999)[4]',['-2040(2)','562.8(5)','337(2)']),('Experiment','(2012)[24]',['-2047(47)','/','/']),('Experiment','(2023)[14]',['-2038.27(11)','/','/']),('Experiment','This work',['-2039.4(7)','563.5(2)','336.8(3)'])]])

# Derivations are transparent linear transformations, not fits or new measurements.
D=Decimal
f6a=D('461861338.03');f6b=D('461871596.07');f7a=D('389257019.71');f7b=D('389267277.10');f7c=D('389260569.95')
clock=D('518295836.59086363')
cog6=(f6a+2*f6b)/3
# Use same upperF=3/2 to eliminate3S1 without anyA constants or unknownfit.
delta_p2_p0=f6b-(D('.4')*f7b+D('.6')*f7c)
ground_p2=clock+delta_p2_p0
checks={'schemaVersion':1,'policy':'source readings retained; all following arithmetic is labelled derived, not measured or newly fitted',
 'qiaoRINP':{'T6cog_MHz':str(cog6),'T6formula':'(nu649_F1/2+2nu649_F3/2)/3','S1splitting649_MHz':str(f6b-f6a),'S1splitting770_MHz':str(f7b-f7a),'differenceSplittings_MHz':str((f7b-f7a)-(f6b-f6a)),
 'differenceSplittingsCombinedStd_ifIndependent_MHz':math.sqrt(.31**2+.21**2+.37**2+.65**2),'P2splitting_MHz':str(f7b-f7c),'A_S1_from649_MHz':str((f6b-f6a)/D('1.5')),'A_P2_from770_MHz':str((f7b-f7c)/D('2.5')),
 'derivedGroundP2cog':{'value_THz':str(ground_p2/D(1000000)),'formula_MHz':'nu_clock+nu649(Fg1/2->Fe3/2)-0.4nu770(Fg3/2->Fe3/2)-0.6nu770(Fg5/2->Fe3/2)',
 'sourceRows':'1.pdf Table2 PDFp5; clock adopted KroezeTable9','uncertainty':None,'stdIfIndependent_MHz':math.sqrt(.31**2+(.4*.37)**2+(.6*.89)**2),'conservativeStdUpperBound_MHz':.31+.4*.37+.6*.89,
 'uncertaintyBoundary':'No cross-transition covariance supplied. Triangle inequality bounds propagated standard deviation for any correlations given stated marginal standard uncertainties. This is not an actual reconstructed1sigma and not a deterministic probability interval. Additional unreported systematics and second-order HFS not independently resolved.',
 'valueMeaning':'first-order F-degeneracy-weighted171YbP2 Ritz centroid via common-upperF3/2; no new fit','legacyDifference_MHz':str(D('590904330')-ground_p2),'sourceCauseEstablished':False}},
 'sourceConflicts':[{'paper':4,'id':'APL_LOCKING_OFFSET_FACTOR10','locations':['PDFp4 TableI','PDFp5 text'],'tableShift_MHz':'-0.088','textShift_MHz':'-0.880','uncertainty_MHz':'0.003','action':'preserve both; cannot silently correct source; systematic correction reconstruction remains pending'},
 {'paper':4,'id':'APL_171_P2_SPLITTING_FROM_BORROWED_S1A','locations':['PDFp5 TableII','PDFp6 TableVI'],'description':'Only171Fg3/2 lower component observed inAPLTableII. ItsTableVI A171 uses upper splitting10257.7MHz fromtwo same-lower lines; it supplies no new171P2splitting. Do not claim independent171A(3P2) fromAPL.'}],
 'recommendations':[{'target':'T6.frequency_THz','action':'confirm-existing-compilation-value','reason':'same-paper cold171 centroid461.868176723333THz agrees withKroeze461.86817672; preserve compilation precision/uncertainty rather than overwrite with unfitted rawderive'},
 {'target':'T7.frequency_THz and wavelength','action':'retain-existing-frequency and frequency-derivedlambda; originalprintedlambda remainsconflict','reason':'cold171components support~389.2598337THz. No originalpaper supportsKroeze printed770.160284nm; cannot claim authorerratum.'},
 {'target':'T4.frequency_THz and3P2levelenergy','action':'derive-explicit-common-upper-Ritz-workvalue if a coherent working network is desired','reason':'samearticleTable2 yields590.90417985086363THz via commonFe3/2; u unknown unless explicitly label correlation upper bound. Keep legacy590.90433(4)THz asconflicting independent-source value; source cause notclosed.'},
 {'target':'A3S1,A3P2,A3D1','action':'retain weightedcompilation default and store each original separately','reason':'originals have distinctconditions/uncertainties, including thiswork versus historicalcomparison; no new statisticalcombination requested'}]}
# All-three-line T7 centroid cancels first-order upper and lower hyperfine shifts.
cog7=(5*f7a+f7b+9*f7c)/15
all5_p2=clock+cog6-cog7
checks['qiaoRINP']['T7cog_MHz']=str(cog7)
checks['qiaoRINP']['T7formula']='(5nu770(Fg3/2->Fe1/2)+nu770(Fg3/2->Fe3/2)+9nu770(Fg5/2->Fe3/2))/15'
checks['qiaoRINP']['T7cog_std_ifIndependent_MHz']=math.sqrt((.65/3)**2+(.37/15)**2+(.6*.89)**2)
checks['qiaoRINP']['T7cog_std_upper_bound_MHz']=.65/3+.37/15+.6*.89
checks['qiaoRINP']['alternativeAllFiveCentroids']={'value_THz':str(all5_p2/D(1000000)),'value_MHz':str(all5_p2),'formula':'nuclock+(nu649low+2nu649high)/3-(5nu770a+nu770b+9nu770c)/15','uncertainty':None,'stdIfIndependent_MHz':math.sqrt((.21/3)**2+(2*.31/3)**2+(.65/3)**2+(.37/15)**2+(.6*.89)**2),'conservativeStdUpperBound_MHz':.21/3+2*.31/3+.65/3+.37/15+.6*.89+.0000001,'clockStandardUncertainty_MHz':.0000001,'chosenForCanonicalWorkingValue':True,'correlationBoundary':'No supplied covariance matrix; bound is not reconstructed exact1sigma. FirstorderF-centroid definition only.','differenceVersusCommonUpperOnly_MHz':str(all5_p2-ground_p2),'usePolicy':'Prefer if reconciling the existing T6/T7 centroid working network; common-upper-only is an explicitly different statistically correlated linear estimator. Do not average these as independent observations.'}
checks['qiaoRINP']['sourceArithmeticNote']='The649 and770 upper-splitting estimates differ0.65MHz, below independentcombined0.8364MHz. No deterministic inconsistency follows from these noisy measuredcentralvalues.'
checks['sourceConflicts'].append({'id':'BRANCH_PARTIAL_WIDTH_AS_NATURAL_WIDTH','papers':[1,4,5],'locations':['1.pdf abstract andPDFp2/3','4.pdf PDFp2 introduction','5.pdf PDFp1/2 introduction'],'printed649_MHz':'1.5','printed770_MHz':'5.9','boundary':'These quoted branchspecific natural-widthlabels must not replace the totalupperstateGamma/(2pi) FWHM near11.5MHz derived fromtotal3S1lifetime. They approximately match beta*Gamma/(2pi); fullcoherence-linewidthdefinition not established in these papers.'})
checks['recommendations'].append({'chosen':'all-five-centroid-network','target':'T4.coherent-working-centroid','action':'choose and label one source-linked linear-estimator convention','allFiveCentroids_THz':str(all5_p2/D(1000000)),'commonUpperOnly_THz':str(ground_p2/D(1000000)),'choiceBoundary':'Both use samecold171source and differ0.2167MHz withinmeasurementerror; allfivecentroidscheme closesT6/T7compilednetworknaturally. Preserve bothasderivedcandidates and legacyYamaguchiconflict; not a newly measuredgroundP2frequency.'})
for table in tables:
 for row in table['rows']:
  for column,cell in row['cells'].items():
   cell['evidenceKind']='this-paper-reported' if column.startswith('this_work') or row['referenceInPaper'] in ['This work','this work'] else 'comparison-quoted-from-reference'
   cell['referenceInPaper']='This work' if column.startswith('this_work') else row['referenceInPaper']
 name=f'paper-{table["paperNumber"]}-{table["table"]}'
 (OUT/(name+'.json')).write_text(json.dumps(table,ensure_ascii=False,indent=2)+'\n')
 with (OUT/(name+'.csv')).open('w',newline='') as f:
  cols=['paperNumber','sourceId','table','pdfPage','printedPage','label','referenceInPaper','column','printed','value','uncertainty','unit','bound','uncertaintyBound'];writer=csv.DictWriter(f,fieldnames=cols);writer.writeheader()
  for row in table['rows']:
   for col,cell in row['cells'].items():writer.writerow({**{k:table[k] for k in ['paperNumber','sourceId','table','pdfPage','printedPage']},'label':row['label'],'referenceInPaper':row['referenceInPaper'],'column':col,**{k:cell.get(k) for k in ['printed','value','uncertainty','unit','bound','uncertaintyBound']}})
(OUT/'all-tables.json').write_text(json.dumps({'tableCount':len(tables),'rowCount':sum(len(t['rows']) for t in tables),'tables':tables},ensure_ascii=False,indent=2)+'\n')
(OUT/'arithmetic-and-recommendations.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n')
(OUT/'manifest.json').write_text(json.dumps({'sourcePDFs':meta,'tableCount':len(tables),'rowCount':sum(len(t['rows']) for t in tables),'allNumberedTablesCovered':True,'numberedOriginalsUnchanged':all(hashlib.sha256((ROOT/m['pdf']).read_bytes()).hexdigest()==m['sha256'] for m in meta.values()),'printedNotationPolicy':'raw page text and rendered PNG are authoritative for glyph/spacing; table cells transcribed visually, signed numeric spelling normalized only where Poppler corrupts minus sign; comparison entries never upgraded to thispapermeasurement'},ensure_ascii=False,indent=2)+'\n')
print(len(tables),'tables',sum(len(t['rows']) for t in tables),'rows')
