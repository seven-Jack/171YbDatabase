"""Read-only-source, deterministic transcription of Aymar1984 and Fisk1997.
All original PDFs remain unchanged. Numeric strings are source values, not refits.
"""
from pathlib import Path
from decimal import Decimal
import json,csv,hashlib,re
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
RAW=OUT/'raw';RAW.mkdir(exist_ok=True)
DOCS={7:(ROOT/'data/literature/source-followup-2026-10-30/paper-7.txt').read_text().split('\f'),10:(ROOT/'data/literature/source-followup-2026-10-30/paper-10.txt').read_text().split('\f')}
HASH={n:hashlib.sha256((ROOT/f'references/papers/{n}.pdf').read_bytes()).hexdigest() for n in DOCS}
def dump(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def save_table(name,rows):
 dump(OUT/(name+'.json'),rows)
 keys=list(dict.fromkeys(k for r in rows for k in r))
 with (OUT/(name+'.csv')).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=keys);w.writeheader()
  for r in rows:w.writerow({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(list,dict)) else v for k,v in r.items()})
 return len(rows)
def base(n,table,page):return {'sourceId':'ref-12' if n==7 else 'ref-13','sourcePdf':f'references/papers/{n}.pdf','sourceSha256':HASH[n],'table':table,'pdfPhysicalPage':page,'printedPage':page+3643 if n==7 else page+343,'isotope':174 if n==7 else 171,'species':'YbI' if n==7 else 'YbII','transcription':'Poppler text cross-checked against rendered original table'}
# Entire table-containing pages retained to preserve headings, footnotes and neighboring caveats.
for n,pages in {7:[3,5,6,7,8,9,10,15,16],10:[1,3,4,5,6,7,8,9,11]}.items():
 for page in pages:(RAW/f'paper-{n}-p{page:02}.txt').write_text(DOCS[n][page-1])
# Table1, all24cells (including forbidden/unlisted cells and qualitative perturber entries).
starts=['4f14 6s7s1S0','4f14 6s7s3S1','4f13(2F7/2)6s2 6p3/2 J=2']
cells=[('4f14 6snp J=1 +',['18-35(0.1);36-81(0.05)','19-20(0.1)','24-47(0.1)']),('4f14 6snp3P0',['forbidden','19-33(0.15)','forbidden']),('4f14 6snp J=1 -',['19-35(0.1);36-84(0.05)','19-50(0.1)','19-78(0.1)']),('4f14 6snp3P2',['forbidden','18-50(0.1);50-75(0.05);75-93(0.1)','18-21(0.1)']),('4f14 6snf J=3 -',['forbidden','forbidden','16-31(0.1)']),('4f14 6snf3F2',['forbidden',None,'20-22(0.1)']),('4f14 6snf J=3 +',['forbidden','forbidden','16-51(0.1)']),('Perturbing levels',['B perturber of6snp J=1','B perturber of6snp J=1','A3 perturber of6snf J=3'])]
t1=[]
for series,values in cells:
 for start,value in zip(starts,values):
  t1.append({**base(7,'Table1',5),'series':series,'startingLevel':start,'sourcePrintedValue':value,'unit':'n ranges; parentheses absolute transition wavenumber uncertainty cm^-1','missingReason':'blank source cell, not assumed forbidden' if value is None else None,'evidenceKind':'experimental coverage/selection-rule table'})
save_table('aymar-table1-coverage',t1)
# Table2, all15cells. Chosen-E uncertainty .02cm^-1 is stated in following paragraph.
t2=[]
energies=[('A Martin1978',['32694.692','34350.65','35196.98'],[None]*3),('B MeggersTech1978',['32694.74','34350.74','35197.00'],['0.05']*3),('C Verges1983',['32694.697','34350.672','35197.017'],['0.02']*3),('D Our measurements',[None,'34350.71','35196.97'],[None,'0.05','0.05']),('E Chosen value',['32694.70','34350.70','35197.02'],['0.02']*3)]
for source,values,errors in energies:
 for state,value,error in zip([starts[1],starts[0],starts[2]],values,errors):
  t2.append({**base(7,'Table2',6),'rowSource':source,'state':state,'valueDecimal':value,'uncertaintyDecimal':error,'unit':'cm^-1','uncertaintyScope':'chosen-E .02cm^-1 from paragraph, not printed parentheses' if source.startswith('E') else 'as printed; null means not provided','evidenceKind':'chosen energy reference' if source.startswith('E') else 'comparison literature measurement','missingReason':'source cell not supplied' if value is None else None})
save_table('aymar-table2-starting-energies',t2)
# Table3 parsable rows are arranged in three side-by-side columns.
p7=DOCS[7][6];p8=DOCS[7][7]
sections=[('a',p7.split('(a)')[1].split('(b)')[0],7,0,'6snp3P0'),('b',p7.split('(b)')[1],7,1,'6snp J=1 +/-'),('b',p8.split('(C)')[0].split('Table 3. (continued)')[1],8,1,'6snp J=1 +/-'),('c',p8.split('(C)')[1].split('(d)')[0],8,2,'6snp3P2'),('d',p8.split('(d)')[1],8,3,'6snf J=3 +/-')]
t3=[]
for part,text,page,J,series in sections:
 for line in text.splitlines():
  vals=re.split(r'\s{3,}',line.strip())
  if len(vals)<2:continue
  if len(vals)%2:raise ValueError((part,line,vals))
  for label,energy in zip(vals[::2],vals[1::2]):
   clean=re.sub(r'\s','',label)
   clean={'SIP-':'51P-','SOP+':'80P+','SOP':'80P','A,':'A3'}.get(clean,clean)
   clean=clean.replace('I','1')
   rawenergy=energy
   energy=re.sub(r'\s','',energy).replace('I','1').replace('O','0')
   if clean=='35F+' and energy=='50387.82':energy='50347.82'
   if not re.fullmatch(r'\d{5}\.\d{2}',energy):raise ValueError((part,clean,energy,line))
   nmatch=re.match(r'(\d+)[PF]',clean)
   r={**base(7,'Table3'+part,page),'series':series,'J':J,'sourceLabel':clean,'sourceLabelPoppler':label,'n':int(nmatch[1]) if nmatch else None,'valueDecimal':energy,'popplerValue':rawenergy,'unit':'cm^-1','energyReference':'neutral174Yb ground-state scale with chosen Table2 intermediate energies','uncertaintyDecimal':None,'uncertaintyNote':'Per-row uncertainty not printed. Table1 gives transition accuracy0.05-0.15cm^-1 and Table2 chosen references estimated0.02cm^-1; not combined without covariance/path.','evidenceKind':'measured energy using adopted intermediate references'}
   if J in [1,3]:r['assignmentBoundary']='sign marks energy branch; not a generally validated singlet/triplet label'
   if part=='d' and clean=='A3':r['reviewFlags']=['SOURCE_A3_ASSIGNMENT_INCONSISTENCY:Table3 labels50252.77,butSection3.2.6/Table4 assignA3 at50228.09']
   if clean=='35F+':r['ocrCorrection']='Image prints50347.82; Poppler misread4as8, source itself unchanged'
   t3.append(r)
assert len(t3)==289,(len(t3),{k:sum(r['table']==('Table3'+k) for r in t3) for k in 'abcd'})
assert len({(r['table'],r['sourceLabel']) for r in t3})==289
save_table('aymar-table3-levels-174yb',t3)
# Table4: blank coefficients remain unreported, not0.
values=[('50166.30','6s21f3F3','0.01'),('50188.12','6s22f1F3',None),('50191.85','6s22f3F3','0.02'),('50210.78','6s23f1F3','0.02'),('50213.50','6s23f3F3','0.07'),('50228.09','4f13 5d2 6s A3','0.41'),('50231.55','6s24f1F3','0.04'),('50238.28','6s24f3F3','0.29'),('50248.63','6s25f1F3',None),('50252.77','6s25f3F3','0.05'),('50263.98','6s26f1F3',None),('50267.24','6s26f3F3','0.02')]
t4=[{**base(7,'Table4',16),'energy_cmDecimal':e,'tentativeAssignment':s,'coefficientSquaredDecimal':v,'unit':'dimensionless Z_A3^2','uncertaintyDecimal':None,'evidenceKind':'MQDT model admixture, not measured probability','missingReason':'blank: source only prints coefficients above0.01; not exactzero' if v is None else None,'reviewFlags':['SOURCE_A3_ASSIGNMENT_INCONSISTENCY'] if e in ['50228.09','50252.77'] else []} for e,s,v in values]
save_table('aymar-table4-mixing',t4)
# Fisk tablesI-IV: two trap columns, all rows including explicit missing IT1 length.
fisk=[]
def fr(table,page,key,unit,vals,kind,note=''):
 for trap,value in zip(['IT-1','IT-2'],vals):
  if value is None:central=error=printed=None
  else:
   printed=value;parts=value.split('±');central=parts[0];error=parts[1] if len(parts)>1 else None
  fisk.append({**base(10,table,page),'parameter':key,'trap':trap,'sourcePrintedValue':printed,'valueDecimal':central,'uncertaintyDecimal':error,'unit':unit,'evidenceKind':kind,'conditionsNote':note,'missingReason':'not measured in source' if value is None else None})
for key,unit,vals in [
 ('RF electrode separation','mm',['20','20']),('RF electrode diameter','mm',['2.3','2.3']),('End electrode separation','mm',['60','60']),('RF frequency','kHz',['500','510']),('RF amplitude','V_peak-to-peak',['287±3','280±3']),('End electrode voltage','V',['10.0','10.0']),('He pressure','Pa',['0.00012±0.00006','0.00017±0.00006'])]:fr('TableI',3,key,unit,vals,'experimental setting','end electrode voltage stability±0.001V; He pressure error is gauge-reading variation, calibrated forHe')
for key,unit,vals in [
 ('Ion cloud length','m',[None,'0.024']),('Ion cloud temperature longitudinal','K',['357±30','371±30']),('Ion cloud temperature transverse','K',['417±30','431±30']),('Secular frequency longitudinal trap-loaded','kHz',['4.5±0.5','6.0±0.5']),('Secular frequency transverse trap-loaded','kHz',['16.6±0.5','17.7±0.5']),('Helium pressure shift','mHz',['0.38±0.15','0.58±0.15']),('Larmor frequency','Hz',['70495±5','71556±5']),('Ramsey fringe amplitude MF0to0','photon counts',['17000','37000']),('Ramsey fringe amplitude MF0to-1','photon counts',['15000','35000']),('Laser scatter background','photon counts',['1000','4000']),('Raw clock frequency','Hz',['12642812119.2529±0.0003','12642812119.2781±0.0003'])]:fr('TableII',4,key,unit,vals,'measured trap/readout parameter','raw frequency vsNML-Maser2, before shifts; average over15measurementcycles; pressure shift from prior measurement[5,6]; temperature notthermal-equilibrium scalar')
for key,unit,vals in [
 ('Trap potential well depth','eV',['1.2','1.2']),('Transverse secular frequency empty trap','kHz',['23.5','22.4']),('Ion cloud radius1/e central density','mm',['1.9','1.8']),('Ion number','count',['400000','200000']),('Second-order Doppler shift','mHz',['-9.3±0.7','-8.5±0.7']),('Stark shift','mHz',['-0.13±0.07','-0.11±0.06'])]:fr('TableIII',6,key,unit,vals,'calculated ion-cloud model parameter','radius and ion number printed approximate; shift sign is physicalshift, not TableIV applied correction')
for key,vals in [
 ('Raw clock frequency',['12642812119.2529±0.0003','12642812119.2781±0.0003']),('C field second-order Zeeman correction',['-0.7869±0.0002','-0.8108±0.0002']),('He pressure correction',['-0.00038±0.00015','-0.00058±0.00015']),('Total measured corrections',['-0.7873±0.00025','-0.8114±0.00025']),('Second-order Doppler correction',['0.0093±0.0007','0.0085±0.0007']),('Stark correction',['0.00013±0.00007','0.00011±0.00006']),('Magnetic inhomogeneity correction',['-0.0005±0.0005','-0.0005±0.0005']),('Total calculated corrections',['0.0089±0.00086','0.0081±0.00086']),('Reference maser rate vsTAI correction',['-0.0091±0.001','-0.0091±0.001']),('Corrected clock frequency vsTAI',['12642812118.4654±0.0014','12642812118.4657±0.0014'])]:fr('TableIV',8,key,'Hz',vals,'applied correction / corrected frequency','measurement or model category specified by row label; correction signs differ from physical frequencyshift')
assert len(fisk)==68
for r in fisk:
 if r['table']=='TableI' and r['parameter']=='He pressure':
  r['sourcePrintedValue']='1.2±0.6 ×10^-4' if r['trap']=='IT-1' else '1.7±0.6 ×10^-4'
  r['normalization']='multiply mantissa and uncertainty by10^-4 to give valueDecimal inPa'
 if r['table']=='TableIII' and r['parameter'] in ['Ion cloud radius1/e central density','Ion number']:
  r['approximate']=True
  r['sourcePrintedValue']='~'+r['valueDecimal'] if r['parameter'].startswith('Ion cloud radius') else ('~4×10^5' if r['trap']=='IT-1' else '~2×10^5')
save_table('fisk-all-tables',fisk)
for name in ['TableI','TableII','TableIII','TableIV']:save_table('fisk-'+name.lower(),[r for r in fisk if r['table']==name])
# Independently traceable source-level facts and arithmetic comparisons, no new atomic calculation.
facts=[
 {**base(7,'Section2',3),'parameter':'isotope-selection','value':174,'conditions':'thermal beam naturalYb, first laser locked174Yb fluorescence; excitation selection174Yb','evidenceKind':'experimentalmethod'},
 {**base(7,'Section3.2.2',10),'parameter':'ionization-limit','valueDecimal':'50443.08','uncertaintyDecimal':'0.05','unit':'cm^-1','evidenceKind':'MQDT fit under chosen intermediate references','boundary':'174Yb; not171Yb centroid or ioniccoreFthreshold'},
 {**base(7,'Section3.1/3.2.3',9),'parameter':'LS-character','value':None,'boundary':'energy-only MQDT invariant under channelrotation; no unique singlet-triplet mixing determination; gJ/HFS needed'},
 {**base(10,'V.B/VI',9),'parameter':'zero-field-hyperfine-frequency','valueDecimal':'12642812118.466','uncertaintyDecimal':'0.002','unit':'Hz','convention':'ordinary frequency,isolated171Yb+ 2S1/2 F=0,MF=0 to F=1,MF=0; zero temperature,velocity,E,B extrapolation,referencedTAI','uncertaintyComponents_Hz':{'statistical':'0.0014','modelSystematic':'0.0015'},'measurementConditions':'buffer-gas cooled clouds in linearPaultraps; original finiteB/temp/He conditions inTablesI-II, correctionsTableIV','evidenceKind':'corrected primary measurement'},
 {**base(10,'V.B',9),'parameter':'retained-dataset-mean-frequency','valueDecimal':'12642812118.4662','uncertaintyDecimal':'0.00054','unit':'Hz','uncertaintyScope':'standard deviation after discardingMJD49826,not final total uncertainty'},
]
checks=[]
for trap,raw,meas,calc,maser,printed in [('IT-1','12642812119.2529','-0.7873','0.0089','-0.0091','12642812118.4654'),('IT-2','12642812119.2781','-0.8114','0.0081','-0.0091','12642812118.4657')]:
 value=sum(map(Decimal,[raw,meas,calc,maser]));checks.append({'id':'TableIV-total-'+trap,'calculatedFromPrintedRows':str(value),'printed':printed,'exactAtPrintedPrecision':value==Decimal(printed),'unit':'Hz'})
checks.extend([{'id':'Fisk-vs-Kroeze-Blatt1983','Fisk_Hz':'12642812118.466','reviewOld_Hz':'12642812124.2','difference_Hz':'5.734','interpretation':'different originalmeasurements; not unexplained isotopeshift; no averaging performed'}, {'id':'Peper-threshold-printed-difference','value_GHz':str((Decimal('50443.217463')-Decimal('50442.795744'))*Decimal('29.9792458')),'Fisk_GHz':'12.642812118466','interpretation':'thresholds printed to1e-6cm^-1; do not demand millihertz precision or alterMQDTlimits from this arithmetic'}])
dump(OUT/'source-facts.json',{'schemaVersion':1,'facts':facts,'arithmeticChecks':checks})
manifest={'createdAt':'2026-10-30','sourceFiles':[{'path':f'references/papers/{n}.pdf','sha256':HASH[n],'pages':len([p for p in DOCS[n] if p.strip()]),'unchanged':hashlib.sha256((ROOT/f'references/papers/{n}.pdf').read_bytes()).hexdigest()==HASH[n]} for n in [7,10]],'tableCounts':{'Aymar':4,'Fisk':4},'tableRecordCounts':{'AymarTable1':len(t1),'AymarTable2':len(t2),'AymarTable3':len(t3),'AymarTable4':len(t4),'FiskTablesI-IV':len(fisk)},'totalTableRecords':len(t1)+len(t2)+len(t3)+len(t4)+len(fisk),'policy':'no source file modified; no fit/MQDTmodel run; no forced transfer between isotopes; text/OCR corrected only where source image verified'}
dump(OUT/'manifest.json',manifest)
print(json.dumps(manifest,ensure_ascii=False))
