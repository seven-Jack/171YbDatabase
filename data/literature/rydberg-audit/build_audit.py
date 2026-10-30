"""Build a source audit from already saved PDFs/text and saved run evidence only.
No MQDT solver or scientific simulation is imported or executed.
"""
import csv, hashlib, json, re, shutil
from decimal import Decimal
from pathlib import Path
B=Path(__file__).resolve().parent
ROOT=B.parents[2]
def save(n,d): (B/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def number(s):
 s=s.replace(' ','').replace('−','-').replace(',','.')
 m=re.fullmatch(r'([+-]?[0-9]*\.?[0-9]+)(?:\(([0-9]+)\))?',s)
 if not m:return None
 v=float(m[1]);u=None
 if m[2]:u=float(Decimal(m[2]).scaleb(-len(m[1].split('.')[1]) if '.' in m[1] else 0))
 return {'value':v,'uncertainty':u,'printed':s}
def flatten(v,p=''):
 if isinstance(v,dict):
  for k,x in v.items():yield from flatten(x,p+'.'+k if p else k)
 elif isinstance(v,list):
  for i,x in enumerate(v):yield from flatten(x,p+f'[{i}]')
 else:yield p,v
sources=json.loads((B/'source-manifest.json').read_text())
metadata={
 'peper-2025':{'doi':'10.1103/PhysRevX.15.011009','url':'https://journals.aps.org/prx/abstract/10.1103/PhysRevX.15.011009','version':'published 2025-01-17','isotopes':[171,174]},
 'peper-supplement':{'doi':'10.1103/PhysRevX.15.011009','url':'https://journals.aps.org/prx/supplemental/10.1103/PhysRevX.15.011009','version':'local supplement dated 2024-12-05; preserved original filename','isotopes':[171,174]},
 'kuroda-2025':{'doi':'10.1103/mzsv-rckx','url':'https://journals.aps.org/pra/abstract/10.1103/mzsv-rckx','version':'Phys Rev A 112 042817; published 2025-10-28','isotopes':[171,174]},
 'kuroda-2025-arxiv-v1':{'doi':'10.1103/mzsv-rckx','url':'https://arxiv.org/abs/2507.11487v1','version':'arXiv v1; includes supplement; not presumed identical to published supplemental','isotopes':[171,174]},
 'fang-2001':{'doi':'10.1016/S0022-4073(00)00096-0','url':'https://www.sciencedirect.com/science/article/abs/pii/S0022407300000960','version':'published JQSRT69 469-473','isotopes':None,'isotopeNote':'No isotope-resolved assignment stated in the examined original; do not label as 171 or 174.'},
 'wilson-2022':{'doi':'10.1103/PhysRevLett.128.033201','url':'https://link.aps.org/doi/10.1103/PhysRevLett.128.033201','version':'published 2022-01-20','isotopes':[174]},
 'chen-2022':{'doi':'10.1103/PhysRevA.105.052438','url':'https://arxiv.org/abs/2201.04083v3','version':'local arXiv v3 2022-04-18; published title is optical-metastable-ground architecture','isotopes':[171]},
 'muniz-2025':{'doi':'10.1103/PRXQuantum.6.020334','url':'https://journals.aps.org/prxquantum/abstract/10.1103/PRXQuantum.6.020334','version':'published PRX Quantum6 020334; 17 pages','isotopes':[171]},
 'halter-2023-arxiv-v2':{'doi':'10.1088/1361-6455/acb74b','url':'https://arxiv.org/abs/2211.04748v2','version':'arXiv v2; published J Phys B56 055001','isotopes':[174]}}
for s in sources:s.update(metadata.get(s['id'],{}))
save('source-manifest.json',sources)
# Exact local model/run artifacts, copied unchanged; no recomputation.
internal=B/'internal-evidence';internal.mkdir(exist_ok=True)
evidence=[]
paths=[ROOT/'assets/05.21_yb171_65s_hyperfine.csv',Path('/Users/seven/Desktop/MQDT/runs/R005_yb171-single-state-c6/outcome/05.21_yb171_65s_hyperfine_validation.json'),Path('/Users/seven/Desktop/MQDT/runs/R006_yb171-clock-65s-tdm/metadata.json'),Path('/Users/seven/Desktop/MQDT/runs/R006_yb171-clock-65s-tdm/states.csv'),Path('/Users/seven/Desktop/MQDT/runs/R006_yb171-clock-65s-tdm/reduced_tdm.csv'),Path('/Users/seven/Desktop/MQDT/notebooks/rydberg/05.21_yb171_65s_hyperfine.ipynb')]
for p in paths:
 name=('r006-'+p.name) if 'R006' in str(p) else p.name
 q=internal/name;shutil.copyfile(p,q)
 evidence.append({'originalPath':str(p),'copyPath':str(q.relative_to(B)),'sha256':sha(p),'copySha256':sha(q),'bytes':p.stat().st_size,'status':'saved-internal-evidence-only; no new model/expt validation'})
save('internal-evidence-manifest.json',evidence)
# Halter Table 1, every printed numeric column, kept as 174Yb comparison data.
halter=[]
page=(B/'halter-2023-arxiv-v2.txt').read_text().split('\f')[6]
for line in page.splitlines():
 m=re.match(r'\s*6s(\d+)s1 S0\s+(.+?)\s+6s\1p1 P1\s+(.+)',line)
 if not m:continue
 n=int(m[1]);sv=[float(x.replace(',','.')) for x in m[2].split()];pv=[float(x.replace(',','.')) for x in m[3].split()]
 assert len(sv)==2 and len(pv)==5
 common={'isotope':174,'n':n,'sourceId':'halter-2023-arxiv-v2','pdfPage':7,'table':'1','energyReference':'174Yb neutral 6s2 1S0 ground state','energyUnit':'cm^-1','energyAccuracy':{'value':.005,'unit':'cm^-1','equivalentApprox_MHz':150,'kind':'estimated accuracy; not standard uncertainty established'},'polarizabilityUnit':'relative to measured 6s70s 1S0 scalar polarizability','polarizabilityUncertainty':{'relativePercent':10,'kind':'estimated statistical error'},'F':None,'mF':None,'B_G':None,'atomTemperature_K':None,'BBRTemperature_K':None,'use':'174Yb comparison only; never substitute for 171Yb'}
 halter.append({**common,'state':f'6s{n}s 1S0','J':0,'energy_cm':sv[0],'alpha0_relative_printed':sv[1],'evidenceKind':'experiment; relative scalar polarizability','sourceInternalIssue':None})
 issue=None
 if n in [79,86]:issue={'kind':'source-internal-inconsistency','field':'alpha0_relative_printed','explanation':'Printed alpha0 does not agree with source Eq.(4) and printed alpha_a/alpha_b within rounding. Preserve printed value; requires published-version/author resolution.','notAnErratum':True}
 halter.append({**common,'state':f'6s{n}p 1P1','J':1,'energy_cm':pv[0],'alpha_a_relative_printed':pv[1],'alpha_b_relative_printed':pv[2],'alpha0_relative_printed':pv[3],'alpha2_relative_printed':pv[4],'evidenceKind':{'energy':'zero-field extrapolation from measured Stark map','alpha_a_alpha_b':'experiment','alpha0_alpha2':'derived by paper Eq.(4)'},'sourceInternalIssue':issue})
assert len(halter)==42
save('halter-table1-174yb.json',{'schemaVersion':1,'extractionStatus':'all 21 s rows and 21 p rows transcribed from PDF p7; visual table check performed','records':halter})
with (B/'halter-table1-174yb.csv').open('w',newline='') as f:
 keys=['isotope','state','n','J','energy_cm','alpha_a_relative_printed','alpha_b_relative_printed','alpha0_relative_printed','alpha2_relative_printed','pdfPage','table']
 w=csv.DictWriter(f,fieldnames=keys,extrasaction='ignore');w.writeheader();w.writerows(halter)
# Fang Table 1, all reported entries; blank experimental cells remain null.
srows=[[21,None,None,6.8,7.6],[22,6.5,4.8,8.3,9.1],[23,8.1,None,9.8,10.7],[24,9.4,6.9,11.2,12.5],[25,10.6,None,13,14.5],[26,12.1,8.2,14.9,16.7],[27,None,None,16.9,19.2]]
drows=[[21,None,None,7.8,8.6],[22,6.4,4.6,9,10.1],[23,7.7,None,10.6,11.7],[24,8.7,6.5,12.1,13.5],[25,9.8,None,13.7,15.5],[26,10.7,7,15.9,17.6],[27,None,None,18.2,20.1]]
fang=[]
for term,rows in [('1S0',srows),('1D2',drows)]:
 for n,t,ts,ab,a in rows:
  fang.append({'isotope':None,'isotopeNote':'not resolved/stated in original; do not assume 174 or 171','state':f'6s{n}'+('s' if term=='1S0' else 'd')+' '+term,'n':n,'m_as_stated':0,'F':None,'mF':None,'B_G':None,'BBRTemperature_K':300,'atomTemperature_K':None,'tau_exp_us':t,'tau_exp_star_us':ts,'theory_inverse_A_plus_Brho_us':ab,'theory_inverse_A_us':a,'sourceId':'fang-2001','pdfPage':4,'printedPage':472,'table':'1','tau_expDefinition':'DEFI aggregate signal; authors approximate as spontaneous radiative lifetime under conditions; includes downward environmental transitions','tau_exp_starDefinition':'difference of EFI signals just above/below threshold; effective initial-state lifetime including BBR redistribution','experimentalUncertainty':{'relativeUpperLimitPercent':8,'kind':'authors estimated total error limit on PDFp3; not a standard uncertainty or row-specific bar'},'use':'singlet states n21-27 only; not a 171Yb triplet65S anchor'})
fang.append({'state':'4f13 5d6s6p valence state','isotope':None,'n':None,'tau_exp_us':1.7,'tau_exp_star_us':None,'sourceId':'fang-2001','pdfPage':4,'printedPage':472,'table':'1','BBRTemperature_K':300,'use':'preserve source value; not Rydberg scaling anchor'})
save('fang-table1-lifetimes.json',{'schemaVersion':1,'records':fang,'scaling':{'sourceId':'fang-2001','pdfPage':4,'sSinglet':{'alpha_exp_ns':1.17,'exponent':3,'alpha_theory_ns':1.46},'dSinglet':{'alpha_exp_ns':.91,'exponent':2.8,'exponentUncertainty':.2,'alpha_theory_ns':1.27},'effectivePrincipalNumber':'n*; not n','scope':'n21-27 singlets; not a recommendation to extrapolate to triplet171Yb65S'}})
# Peper complete S F1/2 measured-energy, g-factor, and polarizability tables.
peper=(B/'peper-supplement.txt').read_text().split('\f');data={}
for table,start,end,cols in [('S25',24,26,4),('S26',27,28,3),('S27',28,28,3)]:
 rows=[]
 for pg in range(start,end+1):
  text=peper[pg-1]
  if table=='S26' and pg==28:text=text.split('Table S27:')[0]
  if table=='S27':text=text.split('Table S27:')[-1]
  for line in text.splitlines():
   parts=re.split(r'\s{2,}',line.strip())
   if len(parts)!=cols or not re.match(r'^\d+\.\d',parts[0]):continue
   vals=[number(x) for x in parts]
   if not all(v is not None for v in vals):continue
   row={'nu_Fcore1':vals[0]['value'],'isotope':171,'L':0,'F':.5,'mF':None,'pdfPage':pg,'table':table,'sourceId':'peper-supplement','principalNumberConvention':'nu relative to Fcore=1 ionic threshold; no integer n assignment inferred'}
   if table=='S25':row.update({'energy_exp_cm':vals[1],'energy_model_cm':vals[2],'exp_minus_model_MHz':vals[3]['value'],'energyReference':'neutral ground-state energy','evidenceKind':'atomic-beam laser spectroscopy plus MQDT model'})
   if table=='S26':row.update({'g_exp':vals[1],'g_model':vals[2],'evidenceKind':'measured magnetic response and model; supports branch identity, not lifetime/TDM/C6'})
   if table=='S27':row.update({'alpha0_exp_MHz_per_V_cm_squared':vals[1],'alpha0_model_MHz_per_V_cm_squared':vals[2],'evidenceKind':'measured DC Stark response and model'})
   rows.append(row)
 data[table]=rows
assert len(data['S25'])>100 and len(data['S26'])>10 and len(data['S27'])>5
save('peper-s-f12-tables-s25-s27.json',{'schemaVersion':1,'tables':data,'uncertaintyNote':'parenthetic errors transcribed as source notation; sigma interpretation must follow paper methods','notForAutomaticCanonicalReplacement':'Only nu/F explicitly identified; map project n_label using validated branch tracking before replacement.'})
# Selected source facts with fully specified applicability.
facts=[
 {'id':'peper-171-ion-thresholds','sourceId':'peper-supplement','pdfPage':5,'table':'S6; repeated S7-S10','isotope':171,'energyReference':'neutral-atom ground-state scale used by Peper MQDT','I_Fcore0_cm':50442.795744,'I_Fcore1_cm':50443.217463,'uncertainty':None,'uncertaintyNote':'no uncertainties printed for channel-limit parameters','evidenceKind':'adopted MQDT channel thresholds; not a new direct threshold experiment'},
 {'id':'peper-174-ion-threshold','sourceId':'peper-supplement','pdfPage':1,'table':'S1 and repeated S2-S5','isotope':174,'I_cm':50443.070393,'uncertainty':None,'evidenceKind':'MQDT channel threshold; not 171Yb centroid'},
 {'id':'peper-34-c6','sourceId':'peper-2025','pdfPage':8,'printedPage':'011009-8','section':'IV; Fig.6','isotope':171,'state':'triplet-connected |nu=54.28,L=0,F=1/2,mF=-1/2> pair','nu':54.28,'n':None,'nuNote':'two-decimal state identifier per main text p5; do not convert to integer n with legacy delta=2.523','F':.5,'mF_pair':[-.5,-.5],'B_G':4.88,'B_uncertainty_G':.06,'theta_rad':'pi/2','C6_over_h_GHz_um6':34,'C6Approximate':True,'C6_uncertainty':None,'distanceRangeMeasured_um':[3.3,4.5],'evidenceKind':'MQDT prediction benchmarked against pair-shift measurements; experiment distance scaled by factor0.97','angleAnisotropyApprox_percent':46,'comparisonNotYb':{'species':'Rb','n':57,'term':'2S1/2','C6_over_h_GHz_um6':76},'use':'specific-state literature anchor; exclude from legacy single-delta n^11 extrapolation'},
 {'id':'halter-singlet-qd','sourceId':'halter-2023-arxiv-v2','pdfPage':8,'figure':'4; Eq.(1)','isotope':174,'nRange':[70,90],'singletS_delta':4.2721,'singletS_uncertainty':.0025,'singletP_delta':3.9535,'singletP_uncertainty':.0009,'delta2':None,'model':'constant single-channel fitted defect in restricted range','I_cm':50443.07041,'I_uncertainty_cm':.00025,'RydbergConstant_m_inverse':10973696.959,'use':'174Yb comparison only'},
 {'id':'wilson-174-triplet-qd','sourceId':'wilson-2022','pdfPage':2,'isotope':174,'state':'6sns 3S1','deltaApprox':4.438,'uncertainty':None,'use':'174 triplet series comparison; not universal171 effective defect'},
 {'id':'wilson-174-n75-survival','sourceId':'wilson-2022','pdfPage':3,'figure':'2a','isotope':174,'n':75,'state':'6s75s 3S1','tau_traps_on_us':108,'tau_traps_off_us':28,'trapPower_mW':9,'BBRTemperature_K':None,'atomTemperature_K':None,'B_G':None,'evidenceKind':'trap survival/population-return; atom loss and redistribution affect definition','notNaturalLifetime':True,'use':'comparison only; not171/65S zero-field natural lifetime'},
 {'id':'wilson-coherence','sourceId':'wilson-2022','pdfPage':4,'figure':'4','isotope':174,'states':['6s75s 3S1','6s74s 3S1'],'RabiOscillationDecay_us':42,'T2star_us':22,'T2_echo_us':59,'uncertainty':None,'evidenceKind':'coherence experiment; not population lifetime'},
 {'id':'chen-2022-adopted-c6','sourceId':'chen-2022','pdfPage':5,'isotope':171,'n_star':55,'integer_n':None,'C6FrequencyCoefficient_GHz_um6':300,'approximate':True,'uncertainty':None,'evidenceKind':'assumed coefficient based on earlier measurements [19], not measured in this theory paper','use':'historical architecture model assumption; not a replacement for Peper state-resolved coefficient'},
 {'id':'kuroda-f-versus-g','sourceId':'kuroda-2025-arxiv-v1','pdfPage':16,'table':'S1','isotope':174,'parameterConvention':'single-channel mu^(0), mu^(2), mu^(4), per Eq.(1); not universal171 delta','parameters':[{'state':'6snd 3D3','mu0':.72902016,'mu2':-.705328923,'mu4':829.238844},{'state':'6snf 3F2','mu0':.0718252326,'mu2':-1.00091963,'mu4':-106.291066},{'state':'6snf 3F4','mu0':.0839027969,'mu2':-2.91009023,'mu4':None},{'state':'6sng 3G3','mu0':.0260964574,'mu2':-.14139526,'mu4':None},{'state':'6sng 3G5','mu0':.02529201,'mu2':-.11588052,'mu4':None,'isotopeFitNote':'parameters fitted to171F9/2 data then adopted for174 as source footnote'}],'versionLimit':'arXiv v1 supplement; version dependence not resolved by using published main text alone'},
 {'id':'kuroda-f3-channel','sourceId':'kuroda-2025-arxiv-v1','pdfPage':19,'table':'S7','isotope':174,'state':'6snf 3F3 LS channel in7-channel MQDT','mu0':.0715123712,'mu2':-.768462937,'uncertainty':None,'use':'cannot replace171f series by scalar delta=.02'},
 {'id':'kuroda-published-f-mixing','sourceId':'kuroda-2025','pdfPage':4,'isotopeContext':[174,171],'theta0':-.02100,'theta0_uncertainty':.00004,'theta2':.251,'theta2_uncertainty':.002,'formula':'theta(nu)=theta0+theta2/nu^2','use':'mixing angle, not a quantum defect; published fit differs from v1 TableS7'},
 {'id':'muniz-171-65s','sourceId':'muniz-2025','pdfPage':11,'section':'AppendixD; Fig7','isotope':171,'n':65,'state':'65 3S1,F=3/2,mF=-3/2','F':1.5,'mF':-1.5,'B_G':518,'B_locator':'Fig1a PDFp2','wavelength_nm':301.9,'wavelengthNote':'operating laser wavelength stated to one decimal, not a precision vacuum line list','beamWaist_um':18,'tweezerWavelength_nm':460,'tau_population_traps_on_us':65,'tau_uncertainty_us':3,'T2star_Gaussian_us':3.4,'T2star_uncertainty_us':.2,'T2echo_on_us':5.1,'T2echo_on_uncertainty_us':.4,'T2echo_off_us':11,'T2echo_off_uncertainty_us':2,'uncertaintyConvention':'Fig7 error bars1sigma confidence intervals; parentheses transcribed','BBRTemperature_K':None,'atomTemperature_K':None,'use':'explicit finite-field experimental condition only; not B0F1/2 nor natural lifetime'},
 {'id':'kroeze-171-ionization-compilation','sourceId':'kroeze-2026-v2','pdfPage':20,'section':'Table2; explanatory text PDFp3','isotope':171,'EI_center_of_gravity_cm':50443.0676,'uncertainty_cm':.0012,'EI_eV':6.25414330,'uncertainty_eV':.00000015,'RB':4.7,'evidenceKind':'review compilation of refs21-29; 174 high-precision ref22 mass-scaled to171 before combination','notOriginalMeasurement':True,'sourceConflict':'Not equal to degeneracy-weighted center of Peper channel thresholds; preserve source calibration/convention separately.'}
]
# All Peper F1/2 6sns MQDT channel model values from TableS6 p5.
facts.append({'id':'peper-s-f12-mqdt','sourceId':'peper-supplement','pdfPage':5,'table':'S6','isotope':171,'L':0,'F':.5,'convention':'eigenchannel short-range mu expansion coefficients, not scalar physical quantum defects','channels':['6sns1S0','5d_a','6pnp1S0','5d_b','6pnp3P0','5d_c','6sns3S1'],'mu0':[.357519763,.203907536,.116803536,.286731074,.248113946,.148678953,.438426851],'mu2':[.298712849,0,0,0,0,0,3.91762642],'triplet_mu4':-10612.6828,'triplet_mu6':8017432.38,'triplet_mu8':-2582622910.0,'rotationAngles':{'theta12':.131810463,'theta13':.297612147,'theta14':.055508821,'theta34':.101030515,'theta35':.102911159,'theta16':.137723736},'notCanonicalDeltaReplacement':True})
save('extracted-facts.json',{'schemaVersion':1,'scope':'explicitly transcribed audit-relevant numerical facts; source fulltext retained separately; no model rerun','facts':facts})
# Field coverage: every estimate leaf, all R1-R7 quantities, Rydberg level energies,
# all legacy Rydberg hfs leaves, and every saved65S leaf. Snapshot input hashes bind audit.
coverage=[]
def add(file,path,value,status,why,source=None,action='preserve value as legacy; exclude from validated predictions'):
 coverage.append({'file':file,'path':path,'valueAtAudit':value,'assessment':status,'reason':why,'sourceEvidence':source or [],'recommendedAction':action})
est=json.loads((ROOT/'data/estimates.json').read_text())
for path,value in flatten(est):
 status='legacy-model-metadata';why='Archival single-channel/scaling model metadata, not a measured171Yb quantity';src=[];action='retain modelId and add explicit legacy/unvalidated status'
 if path.startswith('constants.R_INF'):status='historical-physical-constant';why='CODATA2018 infinite-mass Rydberg constant; not isotope reduced-mass Rydberg constant';action='retain versioned constant; prevent use as isotope-resolved spectroscopy'
 elif path.startswith('constants.A0_UM') or path.startswith('constantProvenance'):status='constant-or-provenance-metadata';why='Versioned CODATA2018 Bohr radius conversion only; no atomic-state evidence';action='retain explicit version and unit-conversion provenance'
 elif path.startswith('constants.E_I'):status='verified-review-compilation-only';why='Kroeze v2 Table2/p20 and explanation p3 give171 centroid compilation; its scale conflicts with Peper channel-threshold centroid';src=['kroeze-171-ionization-compilation'];action='cite Kroeze review with uncertainty; keep separate calibration from Peper E_I0/E_I1; no mixed-model derivation'
 elif path.startswith('quantumDefects'):
  idx=int(re.search(r'\[(\d+)\]',path)[1]);qd=est['quantumDefects'][idx];series=qd.get('series','')
  if idx in [0,1]:status='verified-source-wrong-isotope-for171-use';why='Halter174Yb n70-90 constant-defect fit, uncertainties .0025/.0009; no171 value or delta2 was fitted';src=['halter-singlet-qd'];action='retain only as174 comparison with uncertainty and fit range; exclude171 calculations'
  elif idx==2:status='unsupported-scalar-defect';why='No2.523 found in examined Peper main/supp; Peper171S needs multiple channels/core thresholds. Model mu0=.438426851 is not a direct scalar replacement';src=['peper-s-f12-mqdt','wilson-174-triplet-qd'];action='archive2.523 as unsupported legacy; require isotope/branch-specific MQDT or independently sourced fit before numerical use'
  elif idx in [3,4]:status='unsupported-scalar-defect';why='1.41/1.42 not established by examined sources; Peper171D are6-channel mixed series and Kuroda background does not validate legacy number';src=['peper-supplement PDFpp8-9 TablesS9-S10'];action='archive legacy D defects; do not replace with fractional eigenchannel mu or unrelated isotope'
  else:status='source-misattribution';why='Kuroda f-series model mu0 near .07-.08 (174V1); main .026 concerns g states, and .02100 concerns mixing angle. No universal171f delta=.02 established';src=['kuroda-f-versus-g','kuroda-f3-channel','kuroda-published-f-mixing'];action='remove verified-source appearance; archive .02 as unsupported and use state-resolved odd-parity MQDT when available'
 elif path.startswith('ionization.E_I0') or path.startswith('ionization.E_I1'):status='verified-model-channel-threshold';why='Exact printed Peper171 thresholds, Fcore0/Fcore1; source gives no uncertainty for adopted model limits';src=['peper-171-ion-thresholds'];action='retain with explicit channel/core, energy reference, model adoption and no uncertainty claim'
 elif path.startswith('ionization.A_ion'):status='rounded-literature-value';why='Peper p4 states12.642812GHz; Kroeze Table2 cites Blatt1983 at12.6428121242(12)GHz;12.6428 is rounded';src=['peper-2025 PDFp4','kroeze-2026-v2 Table2'];action='replace display provenance with exact cited source/version; original Blatt needed before claiming independent primary verification'
 elif path.startswith('lifetimeReference'):status='unsupported-lifetime-extrapolation';why='Low7s13.8ns normalization does not establish highn171 triplet radiative/effective lifetime or BBR temperature; Fang is singlet n21-27, Wilson174n75 survival, Muniz17165F3/2 at518G';src=['fang-2001 Table1','wilson-174-n75-survival','muniz-171-65s'];action='preserve as archival illustration only; no validated lifetime or linewidth output from this anchor'
 elif path.startswith('c6Reference'):status='invalid-anchor-mapping';why='34 belongs to171 nu54.28 specific F/mF/B/theta workpoint; n57 in Peper paragraph is Rb comparison with76. delta2.523 cannot convert source nu to n';src=['peper-34-c6'];action='archive entire c6Reference as invalid mapping; separately store Peper condition-bound coefficient; exclude extrapolatedC6 and derived blockade from validated use'
 elif path.startswith('ns_values'):status='user-interface-grid';why='Chosen integer-n grid, not measured levels';action='retain grid only when legacy-model boundaries are visible'
 add('data/estimates.json',path,value,status,why,src,action)
tr=json.loads((ROOT/'data/transitions.json').read_text())
for r in tr['records']:
 if r['id'] not in tr['rydbergTransitionIds']:continue
 rid=r['id']
 for q,record in r['quantities'].items():
  v=record['value'];st='unverified-scaling-estimate';why='Saved single-channel estimate not a resolved171Yb F/mF line; no source model-input and uncertainty trace established';src=['canonical legacy-rydberg-scaling-v1'];action='retain archival value only; exclude verified spectroscopy/Rabi predictions'
  if q=='d_num' and rid=='R2':st='internal-number-without-generating-artifact';why='0.0376 is website-saved J-reduced convention; no matching generating artifact found in examined savedR005/R006. R006 F-reduced values and branch are different, cannot validate this number';src=['internal-evidence/r006-states.csv','internal-evidence/r006-reduced_tdm.csv'];action='retain This work, legacy-unverified J-reduced, provenance-gap flag; do not cite Peper/Muniz as numerical source'
  elif q=='d_num' and rid=='R5':st='conditional-pure-J-selection-rule';why='J0->J2 electronic E1 reduced matrix element is zero in pure-J basis;171hyperfine/channel-mixed eigenstates require separate F-state audit, zero is not a universal physical-rate assertion';action='label ideal pure-J E1 selection-rule zero; no full171state validation'
  elif q=='d_num':why='n*^-3/2 scaling and series/angular factors not source-validated for selected171mixed state; no uncertainty trace';src=['legacy scaling only'];action='do not call literature-measured or validated calculated TDM'
  elif q in ['Gamma_per_s_num','lifetime_ns','linewidth_frequency_coefficient_Hz']:st='unsupported-lifetime-linewidth-estimate';why='LegacyGamma from unvalidated lifetime normalization; total population loss vs partial EinsteinA vs frequencyFWHM unresolved. R5 zero optical E1 matrix element does not require zero total upper-level decay';src=['fang-2001 definitions','muniz-171-65s'];action='archive as rate/lifetime illustration with definition-needs-review; do not promote to naturalFWHM'
  elif q in ['energy_eV']:st='derived-from-unverified-input';why='Unit conversion retains unsupported legacy energy input, not new evidence';action='carry parent-input review status through derived value'
  elif q in ['wavelength_vac_nm','frequency_THz','energy_cm'] and rid in ['R2','R6','R7']:why='Upper level is labeled triplet-connected while energy comes from legacy scalarQD, not selectedF branch. PeperTableS25 has independent branch-resolved energy evidence but canonical R2 upper energy is different';src=['peper-s-f12-tables-s25-s27.json TableS25 nu60.1761918','internal-evidence/05.21_yb171_65s_hyperfine.csv'];action='keep legacy approximate label; map F/mF/B and energy-reference before any replacement or Rabi source validation'
  add('data/transitions.json',f'records.{rid}.quantities.{q}',v,st,why,src,action)
levels=json.loads((ROOT/'data/levels.json').read_text())
for r in levels['records']:
 if not any(x in r['id'] for x in ['6s50s','6s65s','6s80s','6s65d']):continue
 for q,rec in r['quantities'].items():
  if rec['value'] is None:st='honest-missing';why='Original canonical row has no measured energy, retain null; no source value inferred merely from an integern';action='retain null with missingReason'
  else:st='derived-from-unverified-excitation';why='Sum of lowP0 energy and legacyR2 excitation does not identify selectedF branch; cannot combine this total energy with saved MQDT hyperfine data';action='retain approximate archival energy; exclude state-resolved verified use'
  add('data/levels.json',f'records.{r["id"]}.quantities.{q}',rec['value'],st,why,['peper-s-f12-tables-s25-s27.json'],action)
hfs=json.loads((ROOT/'data/hyperfine.json').read_text())
for state,record in hfs['states'].items():
 if not any(x in state for x in ['50','80','65']):continue
 for path,value in flatten(record):
  add('data/hyperfine.json',f'states.{state}.{path}',value,'unverified-legacy-hyperfine-scaling','No source/state-resolved171A established for these50S/80S/65D rows; strong ionic-core hyperfine mixing prevents assuming simple bareJ n^-3 A predicts fullhighn splitting',['peper-s-f12-mqdt','peper-2025 PDFpp4-5'],'archive as illustrative schematic only; exclude physical F splitting until branch/model source is established')
for path,value in flatten(hfs['saved65S']):
 st='verified-saved-internal-record';why='Value/convention preserved in project CSV and originalR005 validation artifact; no model rerun or independent experimental splitting validation';action='retain internal-calculation and source precision, explicitly not experimental uncertainty'
 if path=='conditions.electricField_V_cm':st='configuration-can-be-completed';why='OriginalR005 validation conditions electric_field=0 and notebook condition no external E were read this audit';action='set field0V/cm with direct savedrun locator; keep internal model scope'
 if 'triplet_channel_weight' in path:why='Recoupled-channel diagnostic only; not rigorous wholewavefunction P(S=1)'
 if 'P_S1_in_retained_6sns' in path:why='Normalized spin projection within retained6sns subspace; omitted-channel/model error not totalphysical uncertainty'
 if 'g_F' in path:why='Saved modelg; PeperTableS26 measured g2.42(13) atnu60.1761918 supports branch identity, not absolute TDM/lifetime/C6 validation'
 add('data/hyperfine.json','saved65S.'+path,value,st,why,['internal-evidence/05.21_yb171_65s_hyperfine_validation.json','internal-evidence/05.21_yb171_65s_hyperfine.csv'],action)
save('field-coverage.json',{'schemaVersion':1,'auditDate':'2026-10-29','readOnlyCanonical':True,'inputSha256':{f:sha(ROOT/'data'/f) for f in ['estimates.json','hyperfine.json','levels.json','transitions.json']},'coverageScope':'all estimates leaves; everyR1-R7 quantity; allRydberg-level quantity fields; all4legacyRydbergHFS rows and fullsaved65S leaves','records':coverage})
with (B/'field-coverage.csv').open('w',newline='') as f:
 keys=['file','path','valueAtAudit','assessment','reason','sourceEvidence','recommendedAction'];w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows({**r,'sourceEvidence':'; '.join(r['sourceEvidence'])} for r in coverage)
summary={'coveredFields':len(coverage),'statusCounts':{s:sum(r['assessment']==s for r in coverage) for s in sorted({r['assessment'] for r in coverage})},'extractedTables':{'HalterTable1':len(halter),'FangTable1':len(fang),**{k:len(v) for k,v in data.items()}},'allSourceOriginalsHashUnchanged':all(sha(s['originalPath'])==s['sha256'] for s in sources),'noScientificComputationRun':True}
save('audit-summary.json',summary)
print(json.dumps(summary,ensure_ascii=False,indent=2))
