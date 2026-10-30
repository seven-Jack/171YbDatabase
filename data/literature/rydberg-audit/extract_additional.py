"""Transcribe additional open primary tables; no scientific solver is run."""
import csv,json,re,hashlib
from pathlib import Path
B=Path(__file__).resolve().parent
def save(n,d):(B/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
m=json.loads((B/'source-manifest.json').read_text());metadata={
'lehec-2018-arxiv-v2':{'doi':'10.1103/PhysRevA.98.062506','url':'https://arxiv.org/abs/1805.02712v2','version':'arXiv v2 dated2018-05-25; not claimed identical to publishedPRA','isotopes':[174]},
'okuno-2022-arxiv-v1':{'doi':'10.7566/JPSJ.91.084301','url':'https://arxiv.org/abs/2204.07995v1','version':'arXiv v1 dated2022-04-17','isotopes':[174]},
'burgers-2021-arxiv-v1':{'doi':'10.1103/PRXQuantum.3.020326','url':'https://arxiv.org/abs/2110.06902v1','version':'arXiv v1; published2022 with correction2022-08-24, so version comparison remains necessary','isotopes':[174]}}
for s in m:s.update(metadata.get(s['id'],{}))
save('source-manifest.json',m)
ritz=[]
values=[('6sns1S0',[23,80],[4.278337,-5.625,91.65,-156050,-49725000,11021000000]),('6sns1S0',[34,80],[4.278312,-5.4898,-320.02]),('6snd1D2',[31,80],[2.713094,-1.8646,-2145.5,3940500,-3103600000,1069000000000]),('6snd1D2',[40,80],[2.713011,-1.1047,-373.87]),('6snd3D2',[28,80],[2.748679,-.5200,-1186.01,1564600,-981340000,242600000000]),('6snd3D2',[35,80],[2.748627,-.1034,-2.10])]
for state,ran,ds in values:
 ritz.append({'sourceId':'lehec-2018-arxiv-v2','pdfPage':10,'table':'VI','isotope':174,'series':state,'nValidityInclusive':ran,'I_cm':50443.07041,'coefficients':{f'delta{i}':v for i,v in enumerate(ds)},'coefficientUncertainty':None,'formula':'delta(n)=delta0+delta1/(n-delta0)^2+delta2/(n-delta0)^4+...','formulaLocator':'Eq.(2),PDFp4','conventionNote':'Source indexes delta1,delta2,...; delta2 here multiplies inversefourthpower, not the delta2 naming of every other author. Missing higher coefficients were not fitted in restricted model; not measured zeros.','evidenceKind':'Ritz fit to174Yb spectroscopy, conditional range; not171Yb data','F':None,'mF':None,'B_G':None,'BBRTemperature_K':None,'use':'174Yb comparison only; do not transplant into171mixed-state model'})
save('lehec-table6-ritz-174yb.json',{'schemaVersion':1,'ionization':{'isotope':174,'value_cm':50443.07041,'uncertainty_cm':.00025,'sourceId':'lehec-2018-arxiv-v2','pdfPages':[1,10],'evidenceKind':'MQDT inferred from spectroscopy; not direct pure ionization measurement'},'RydbergConstant':{'value_m_inverse':10973696.959,'sourceId':'lehec-2018-arxiv-v2','pdfPage':5,'isotope':174,'kind':'finite-mass corrected'},'records':ritz})
# TableI is printed in two parallel blocks; carry n separately in each block.
t=(B/'okuno-2022-arxiv-v1.txt').read_text().split('\f')[8].split('[20]')[0]
rows=[]
for side in [0,1]:
 n=None
 for line in t.splitlines():
  frag=line[:64] if side==0 else line[64:];parts=re.split(r'\s{2,}',frag.strip())
  if len(parts)==4 and re.fullmatch(r'\d{2}',parts[0]):n=int(parts.pop(0))
  if len(parts)!=3 or n is None or not re.fullmatch(r'[1-8]',parts[0]) or not parts[1].startswith('2.'):continue
  idx=int(parts[0]);delta=float(parts[1].replace(' ',''));energy=int(parts[2].replace(' ',''))
  rows.append({'sourceId':'okuno-2022-arxiv-v1','pdfPage':9,'table':'I','isotope':174,'n':n,'peakIndex':idx,'termAssignment':{3:'3D1',5:'3D2',7:'3D3',8:'1D2'}.get(idx),'assignmentNote':'Peak7 3D3 assignment discussed in main text; peaks1,2,4,6 unassigned. Peaknumber references n80 spectrum, not energy ordering at every n.','delta_printed':delta,'energy_over_h_MHz_printed':energy,'energyReference':'neutral ground state via source Eq.(2)','uncertainty_MHz_approx':10,'uncertaintyNote':'Typical frequency accuracy from wavemeter, not rowwise1sigma','evidenceKind':{'energy':'ensemblefield-ionization spectroscopy','delta':'derived in paper using cited174ionization limit/Rydberg formula'},'initialState':'6s6p3P2,mJ=2','upper_mJ':None,'F':None,'mF':None,'B_G':None,'atomTemperature_uK':5,'trapWavelength_nm':1070,'stateDuringMeasurement':'ODT ensemble approximately1e5 atoms; do not conflate with preceding5x5tweezer demonstration','use':'174Yb comparison only; no171hyperfine values'})
rows.sort(key=lambda r:(r['n'],r['peakIndex']));assert len(rows)>80 and {r['n'] for r in rows}==set(range(65,81));assert len({(r['n'],r['peakIndex']) for r in rows})==len(rows)
save('okuno-table1-174yb.json',{'schemaVersion':1,'records':rows,'sourceInternalIssue':{'pdfPage':8,'field':'RYb','printedValue_cm_inverse':10973.696959,'citedLehecValue_m_inverse':10973696.959,'kind':'factor10unit-or-decimal inconsistency in source print; visually checked; not an erratum','action':'preserve table energy and delta as reported, but do not use printedconstant as numerical input; compare published version/author before correction'}})
with (B/'okuno-table1-174yb.csv').open('w',newline='') as f:
 keys=['isotope','n','peakIndex','termAssignment','delta_printed','energy_over_h_MHz_printed','uncertainty_MHz_approx','pdfPage','table'];w=csv.DictWriter(f,fieldnames=keys,extrasaction='ignore');w.writeheader();w.writerows(rows)
# Page-level original excerpts keep complete table/model context, not inferred values.
excerpts=[]
for sid,pages in [('lehec-2018-arxiv-v2',[4,5,7,8,9,10,11,12,13,14,15]),('okuno-2022-arxiv-v1',[5,6,7,8,9]),('burgers-2021-arxiv-v1',[2,3,7,8])]:
 text=(B/(sid+'.txt')).read_text().split('\f')
 for pg in pages:excerpts.append({'sourceId':sid,'pdfPage':pg,'text':text[pg-1],'status':'originalpdftotext-layout; equations and symbols may needPDFvisualcheck'})
save('additional-source-excerpts.json',{'schemaVersion':1,'pages':excerpts})
facts=[{'sourceId':'okuno-2022-arxiv-v1','pdfPage':6,'isotope':174,'kind':'singleatomtweezer Rydberg excitation demonstration','initialState':'3P2,mJ=0','finalState':'6s78d3D3','tweezerArray':[5,5],'metastablePreparation':{'wavelength_nm':507,'duration_ms':20,'probability':.40},'RydbergLaser':{'wavelength_nm':325,'duration_ms':10},'detection':'electricfieldionization then5ms770nmrepumpandfluorescencereturnloss','RydbergLifetime_us':None,'lifetimeNote':'No Rydberg decay lifetime measurement identified in this source; pulse duration or resonance width is not lifetime.'},
{'sourceId':'okuno-2022-arxiv-v1','pdfPage':6,'isotope':174,'kind':'separateensemble spectroscopy used forTableI','trap_nm':1070,'atomCountApprox':100000,'atomTemperature_uK':5,'initial':'3P2,mJ=2','preparation507nm_ms':18.75,'Rydberg325nm_us':250,'ionizationFieldAfterExcitation_V_cm':17,'MCP_resolution_us':2,'averages':10,'B_G':None},
{'sourceId':'okuno-2022-arxiv-v1','pdfPages':[5,6],'isotope':174,'kind':'metastable highres spectroscopy andsidebandtemperature','B_G':2.8,'Bdirection':'alongtweezerlightpolarization','tweezer_nm':532,'relativePolarizability_3P2_mJ0_to_1S0_adopted':1.016,'polarizabilityEvidence':'citedRef32, not new absolute measurement','atomTemperature_uK':1.90,'temperatureUncertainty_uK':1.02,'meanVibrationalOccupation':1.46,'occupationUncertainty':1.01,'temperatureLocator':'Fig7captionp6','notRydbergLifetime':True},
{'sourceId':'burgers-2021-arxiv-v1','kind':'version-boundary','publishedDOI':'10.1103/PRXQuantum.3.020326','publishedCorrectionDate':'2022-08-24','use':'LocalV1 is useful accessibleprimarymaterial, not presumedidenticaltolatercorrectedpublication. Source-levelrawtablespreserved, notautomaticallyusedtocorrectcanonical171records.'}]
save('additional-source-facts.json',{'schemaVersion':1,'facts':facts,'noScientificComputationRun':True})
summary=json.loads((B/'audit-summary.json').read_text());summary['extractedTables'].update({'LehecTableVI':len(ritz),'OkunoTableI':len(rows)});summary['allSourceOriginalsHashUnchanged']=all(hashlib.sha256(Path(s['originalPath']).read_bytes()).hexdigest()==s['sha256'] for s in m);save('audit-summary.json',summary);print(json.dumps({'okunoRows':len(rows),'lehecRitzRows':len(ritz),'originalsUnchanged':summary['allSourceOriginalsHashUnchanged']},indent=2))
