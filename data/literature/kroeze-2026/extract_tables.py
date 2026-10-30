#!/usr/bin/env python3
"""Reproducible hand-transcribed table extraction from the supplied arXiv v2 PDF.
No canonical database files are changed. Raw source plus explicit review flags are retained.
"""
import csv, hashlib, json, re, math
from collections import Counter
from decimal import Decimal, getcontext
from pathlib import Path
getcontext().prec=45
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[2]
SOURCE=Path('/Users/seven/Desktop/paper/atomic data/2026_Kroeze_171Yb_Reference-data_arXiv2509.04416v2.pdf')
TEXT=ROOT.parent/'kroeze-2026.fulltext.txt'
full=TEXT.read_text()
pages=full.split('\f')
# pdftotext begins physical page 1 before the first form feed.
assert len(pages)>=40
RAW=ROOT/'raw';RAW.mkdir(exist_ok=True)
titles={1:'Fundamental Physical Constants (2022 CODATA recommended values)',2:'Physical properties of 171Yb',3:'Stable-isotope abundance, mass and spin',4:'Scattering lengths between ytterbium isotopes',5:'Lande gJ, linear Zeeman coefficients and hyperfine constants',6:'Isotope shifts relative to 174Yb',7:'Magic and tune-out wavelengths',8:'1S0 to 1P1',9:'1S0 to 3P0',10:'1S0 to 3P1',11:'1S0 to 3P2',12:'3P0 to 3D1',13:'3P0 to 3S1',14:'3P2 to 3S1'}
tp={1:20,2:20,3:21,4:21,5:21,6:22,7:23,8:23,9:24,10:24,11:25,12:25,13:26,14:26}
for p in [2,3,9,10,11,12,15,16,17,20,21,22,23,24,25,26]:
 (RAW/f'page-{p:02}.txt').write_text(pages[p-1])
for n in range(1,15):
 page=pages[tp[n]-1]
 start=re.search(r'\bTable '+str(n)+r':',page).start()
 end=(re.search(r'\bTable '+str(n+1)+r':',page).start() if n<14 and tp[n+1]==tp[n] else len(page))
 (RAW/f'table-{n:02}.txt').write_text(page[start:end].rstrip()+'\n')

def refs(v):
 if not v:return []
 if isinstance(v,list):return sorted(set(v))
 out=[]
 for item in v.replace('–','-').split(','):
  part=item.strip()
  if '-' in part:
   a,b=map(int,part.split('-'));out+=range(a,b+1)
  else:out.append(int(part))
 return sorted(set(out))

records=[]
def add(t,key,printed,unit='',ref='',kind='compilation-reported',**meta):
 raw=printed
 approximate=printed.startswith('~')
 printed=printed.lstrip('~')
 value=uncertainty=None
 status='numeric'
 if printed in ('?','—','stable','fermionic','any-angle'):
  status={'?':'not-reported','—':'not-applicable'}.get(printed,'categorical')
 else:
  m=re.fullmatch(r'([+-]?\d+(?:\.\d+)?)(?:\((\d+)\))?(?:e([+-]?\d+))?',printed)
  if not m:raise ValueError((t,key,printed))
  mant,ud,ex=m.groups();ex=int(ex or 0)
  value=str(Decimal(mant)*(Decimal(10)**ex))
  if ud is not None:
   places=len(mant.split('.')[1]) if '.' in mant else 0
   uncertainty=str(Decimal(ud)*(Decimal(10)**(ex-places)))
 r={'id':f'table-{t:02}:{key}','table':t,'pdfPhysicalPage':tp[t],'printedPage':tp[t],'parameter':key,'sourcePrintedValue':raw,'valueDecimal':value,'uncertaintyDecimal':uncertainty,'unit':unit,'sourceReferenceNumbers':refs(ref),'evidenceType':kind,'approximate':approximate,'status':status,'isotope':171 if t in [2,5,8,9,10,11,12,13,14] else None,**meta}
 records.append(r);return r

# Table 1. Uncertainties retained in last-digit notation; hbar is rounded, not uncertain h.
for key,val,unit,exact in [
('c','2.99792458e8','m/s',True),('mu0','1.25663706127(20)e-6','N/A^2',False),('epsilon0','8.8541878188(14)e-12','F/m',False),('h','6.62607015e-34','J s',True),('hbar','~1.054571817e-34','J s',False),('e','1.602176634e-19','C',True),('muB','9.2740100657(29)e-24','J/T',False),('muN','5.0507837393(16)e-27','J/T',False),('atomic_mass_unit','1.66053906892(52)e-27','kg',False),('electron_mass','9.1093837139(28)e-31','kg',False),('a0','5.29177210544(82)e-11','m',False),('kB','1.380649e-23','J/K',True)]:
 add(1,key,val,unit,'15','CODATA-recommendation-reproduced',exact=exact,isotope=None)
# Table 2, including source's inconsistent boiling K/C pair without silent correction.
for key,val,unit,ref in [
('atomic_number','70','',''),('nucleons','171','',''),('nuclear_spin','0.5','',''),('statistics','fermionic','',''),('natural_abundance','14.239(5)','%','17'),('nuclear_lifetime','stable','',''),('mass_u','170.936331515(14)','u','16'),('mass_kg','2.8384645678(9)e-25','kg','16'),('rms_nuclear_charge_radius','5.2906(57)','fm','170'),('electron_spin_g','2.00231930436092(36)','','15'),('electron_orbital_g','~0.99999679','',''),('nuclear_magnetic_moment','0.4923(4)','muN','73'),('nuclear_spin_g','-0.0005362(4)','',''),('density_20C','6904(2)','kg/m^3','19'),('molar_volume_20C','25.066(7)','cm^3/mol','19'),('melting_K','1097','K','12'),('melting_C','824','degC','12'),('boiling_K','1496','K','12'),('boiling_C','1196','degC','12'),('specific_heat','0.155','J/(g K)','12'),('molar_heat','26.74','J/(mol K)','12'),('vapor_pressure_25C_Pa','1.69(8)e-16','Pa','20'),('vapor_pressure_25C_Torr','1.27(6)e-18','Torr','20'),('ionization_centroid_cm','50443.0676(12)','cm^-1','21-29'),('ionization_centroid_eV','6.25414330(15)','eV','21-29'),('ionization_Fc0_cm','50442.795744','cm^-1','63'),('ionization_Fc1_cm','50443.217463','cm^-1','63'),('ionic_A_over_h','12.6428121242(12)','GHz','71')]:
 r=add(2,key,val,unit,ref)
 if 'ionization_centroid' in key:r.update(birgeRatio=4.7,convention='hyperfine-center-of-gravity')
 if key.startswith('boiling'):r['reviewFlags']=['SOURCE_BOILING_TEMPERATURE_UNIT_PAIR_INCONSISTENT']
# Table 3
isotopes=[(168,'0.12648(22)','167.93389130(10)','0'),(170,'3.0280(19)','169.934767243(11)','0'),(171,'14.239(5)','170.936331515(14)','0.5'),(172,'21.789(5)','171.936386654(15)','0'),(173,'16.119(3)','172.938216212(12)','2.5'),(174,'31.881(8)','173.938867546(12)','0'),(176,'12.817(12)','175.942574706(16)','0')]
for iso,a,m,i in isotopes:
 for key,val,unit,ref in [('abundance',a,'%','17'),('mass',m,'u','16'),('I',i,'','16,17')]:add(3,f'{iso}:{key}',val,unit,ref,isotope=iso)
# Table 4 upper triangle, all cells include contribution from 36.
scatter=[(168,168,'252.86(6)','35'),(168,170,'117.268(10)','35'),(168,171,'89.2(17)',''),(168,172,'65.117(8)','35'),(168,173,'38.6(25)',''),(168,174,'2.599(24)','35'),(168,176,'-357.1(6)','35'),(170,170,'63.957(8)','35,37'),(170,171,'36.5(25)',''),(170,172,'-1.916(27)','35'),(170,173,'-81(7)',''),(170,174,'-512.7(11)','35'),(170,176,'209.69(5)','35'),(171,171,'-3(4)',''),(171,172,'-84(7)',''),(171,173,'-580(60)',''),(171,174,'429(13)',''),(171,176,'141.5(15)',''),(172,172,'-592.3(14)','35'),(172,173,'418(13)',''),(172,174,'200.82(4)','35'),(172,176,'106.310(11)','35'),(173,173,'199(5)','38'),(173,174,'138.7(15)',''),(173,176,'79.7(19)',''),(174,174,'105.037(11)','35,39,40'),(174,176,'54.573(18)','35'),(176,176,'-24.06(9)','35')]
for a,b,v,ref in scatter:
 r=add(4,f'{a}-{b}:scattering_length',v,'a0',[36]+refs(ref),'calculation-with-measurement-input',isotope=[a,b])
 if a==b==173:r['birgeRatio']=2.3
# Table 5: separate F rows; gJ and Ahfs repeated only once per state.
hfs=[
('1S0','—','73',['0.5'],['-0.7505(6)'],'0','',None),
('1P1','1.035(5)','171',['0.5','1.5'],['1932(9)','965(5)'],'-214.06(17)','65-67,172-179',3.3),
('3P0','—','49,50,83,84',['0.5'],['-1.1496(6)'],'0','',None),
('3P1','1.492820(31)','171,180',['0.5','1.5'],['2786.10(6)','1392.674(29)'],'3957.85(5)','127,128,181-189',2.6),
('3P2','1.501','',['1.5','2.5'],['~2521','~1681'],'2680.9(20)','190-193',6.3),
('3D1','0.499','',['0.5','1.5'],['~931','~465'],'-2038.30(11)','69,85,86,194,195',1.0),
('3D2','1.167','',['1.5','2.5'],['~1960','~1307'],'1313.8(33)','68,69',None),
('3S1','2.01(1)','196',['0.5','1.5'],['3751(19)','1875(9)'],'6838.41(26)','177,190,192,197-199',3.1)]
for state,gj,zref,Fs,zs,A,aref,br in hfs:
 theory=state in ['3P2','3D1','3D2']
 add(5,f'{state}:gJ',gj,'',zref,'theoretical' if theory else 'compilation-adopted',state=state,theoreticalAsterisk=theory)
 r=add(5,f'{state}:A_over_h',A,'MHz',aref,'definition-J0' if A=='0' else 'compilation-weighted-recommendation',state=state,birgeRatio=br,convention='E_F/h=(A/h)[F(F+1)-I(I+1)-J(J+1)]/2; I=1/2')
 for F,z in zip(Fs,zs):add(5,f'{state}:F={F}:zeeman_coefficient',z,'kHz/G',zref,'theoretical-derived' if theory else 'compilation-reported',state=state,F=F,convention='muB*gF/h')
# Table 6: 7 states x 6 isotopes, including explicit '?' cells.
s6={
'1P1':[
('1887.64(23)',5.0,'65,66,106,172-174,176'),('1187.8(27)',47.2,'65,66,104-106,172-176,179,200'),('940.8(9)',26.8,'65,66,104-106,172,173,175,176,179,201'),('532.95(34)',8.0,'65,66,104-106,172-175,179,200,201'),('291.51(5)',None,'65,104,172,173,179'),('-509.25(7)',1.7,'65,66,104-106,172-175,179,200,201')],
'3P0':[('3626.9710688(29)',None,'87'),('2268.4865926(19)',None,'87'),('1811.2816473(10)',None,'87,91'),('992.7145866(21)',None,'87'),('551.536050(10)',None,'203'),('-946.9217749(29)',None,'87')],
'3P1':[('3655.88(20)',3.6,'127,128,182,184-187,202'),('2286.55(5)',1.3,'67,127,128,182-187,202'),('1826.88(19)',5.8,'67,127,128,182-187,202'),('1000.73(8)',3.0,'67,127,128,182-187,202'),('556.23(16)',3.5,'67,127,128,182-187,202'),('-954.69(4)',1.9,'67,127,128,182-187,202')],
'3P2':[('3677.546251(7)',None,'163'),('2300.235712(6)',None,'163'),('?',None,''),('1006.735628(5)',None,'163'),('?',None,''),('-960.303321(7)',None,'163')],
'3D1':[('?',None,''),('2542(12)',8.1,'69,194'),('2038.9(12)',2.0,'69,194'),('1112(8)',11.5,'69,194'),('619.4(8)',1.3,'69,194'),('-1063(6)',9.5,'69,194')],
'3D2':[('?',None,''),('2531(5)',None,'69'),('2019(6)',None,'69'),('1100(4)',None,'69'),('609(6)',None,'69'),('-1059(11)',None,'69')],
'3S1':[('2100(8)',3.5,'186,192'),('1321.2(1)',4.1,'123,177,186,192,197,198'),('1057.34(15)',None,'123,177,198'),('579.0(19)',13.1,'123,177,186,192,197,198'),('320.97(12)',None,'123,177,198'),('-543.1(29)',19.2,'123,177,186,192,197,198')]}
for state,vals in s6.items():
 for iso,(v,br,ref) in zip([168,170,171,172,173,176],vals):add(6,f'{state}:{iso}:shift',v,'MHz',ref,'compilation-weighted-recommendation' if br else 'compilation-reported',state=state,isotope=iso,referenceIsotope=174,birgeRatio=br,convention='frequency(state<-1S0,isotope)-frequency(state<-1S0,174Yb); hyperfine centroid')
# Table 7: alpha is always the theoretical 1S0 polarizability, even on 3P0 tune-out row.
magic=[
('magic','1S0-1P1 F=3/2 m=+/-3/2','0','~532','~564','204','258',174,None),
('magic','1S0-3P0','any-angle','~397.634','~753.941','205','-15495',171,None),
('magic','1S0-3P0','any-angle','459.5960(5)','652.2956(7)','156,206','469',171,None),
('magic','1S0-3P0','any-angle','552.61074(19)','542.50205(19)','156','57',174,None),
('triple-magic','1S0-3P0-3P1 F=3/2 m=-1/2','~17','759.3560633(31)','394.7982672(16)','207,84,88,90,91,94,111-113,115-117,119,164-168','188',171,4.3),
('magic','1S0-3P1 F=3/2 m=+/-1/2','?','486.78(1)','615.868(13)','62','370',171,None),
('magic','1S0-3P1 F=3/2 m=+/-1/2','?','1036.13(1)','289.3387(28)','169','162',171,None),
('magic','1S0-3P1 F=3/2 m=+3/2','90','~483','~621','206','~359',171,None),
('magic','1S0-3P1 F=3/2 m=+3/2','90','~783.8','~382.5','208','~184',171,None),
('magic','1S0-3P1 F=3/2 m=+3/2','0','1036.12(3)','289.341(8)','209','162',174,None),
('magic','1S0-3P1 F=3/2 m=+3/2','90','1035.83(3)','289.422(8)','209','162',174,None),
('tune-out','1S0','any-angle','553.2936(5)','541.8325(5)','156','0',174,None),
('tune-out','3P0','any-angle','576.613(10)','519.920(9)','162','277',174,None)]
for idx,(typ,state,beta,lam,nu,ref,alpha,iso,br) in enumerate(magic,1):
 for key,v,u,kind in [('polarization_angle',beta,'deg','measurement-conditions'),('wavelength_vac',lam,'nm','compilation-of-measurements'),('frequency',nu,'THz','compilation-of-measurements'),('alpha_1S0',alpha,'a.u.','semi-empirical-model')]:
  r=add(7,f'row{idx:02}:{key}',v,u,ref,kind,state=state,isotope=iso,specialType=typ,inferredApplicableTo171Yb=iso==174,birgeRatio=br if key in ['wavelength_vac','frequency'] else None)
  if idx==5:r['conditions']='~17deg only for triple-magic including3P1; 1S0-3P0 magic is angle independent; source average mixes operational and E1 magic measurements.'
  if idx==7:r['conditions']='Operational magic wavelength; angle unretrieved, sensitive to residual broadband laser content per source p16.'
# Tables 8--14: values retain source units; frequency column is the coefficient of 2pi, i.e. nu=omega/(2pi).
trans={
8:dict(tid='T1',lo='1S0',hi='1P1',freq='751.5274711(8)',fr='66,104-106',fb=6.3,E='3.1080678856(32)',vac='398.9108443(4)',air='398.802070(4)',k='25068.258091(26)',tau='5.464(11)',tu='ns',tr='133,135,136,139,210-212',tb=2.3,gamma='183.0(4)e6',line='29.13(6)',lu='MHz',f='1.3098(27)',vr='~5.852',recoil='~7.335',ru='kHz',temp='~704',doppler='~14.670',du='kHz',TD='699.0(15)',d='4.147(4)',isat='59.97(12)',iu='mW/cm^2',sigma='~7.598e-14',rabi='42.44(4)'),
9:dict(tid='T3',lo='1S0',hi='3P0',freq='518.29583659086363(10)',fr='121',fb=None,E='2.1434993488389615(4)',vac='578.41957591616250(11)',air='578.264935(6)',k='17288.488177740069(3)',tau='21.0(18)',tu='s',tr='213,214',tb=1.3,gamma='0.048(4)',line='7.6(6)',lu='mHz',vr='~4.036',recoil='~3.489',ru='kHz',temp='~335',doppler='~6.977',du='kHz'),
10:dict(tid='T2',lo='1S0',hi='3P1',freq='539.38842684(12)',fr='181,182,184',fb=2.9,E='2.2307312930(5)',vac='555.80068663(13)',air='555.651877(6)',k='17992.061256(4)',tau='872.6(19)',tu='ns',tr='133,134,136,137,139,195,212,215-218',tb=1.2,gamma='1.1460(25)e6',line='182.4(4)',lu='kHz',f='0.015923(35)',vr='~4.200',recoil='~3.778',ru='kHz',temp='~363',doppler='~7.557',du='kHz',TD='4.377(10)',d='0.5398(6)',isat='138.85(30)',iu='uW/cm^2',sigma='~1.475e-13',rabi='5.523(6)'),
11:dict(tid='T4',lo='1S0',hi='3P2',freq='590.90433(4)',fr='123',fb=None,E='2.44378393(17)',vac='507.34517(4)',air='507.20882(4)',k='19710.4467(14)',tau='~8.9',tu='s',tr='129',tb=None,gamma='~0.112',line='~17.9',lu='mHz',vr='~4.601',recoil='~4.535',ru='kHz',temp='~435',doppler='~9.069',du='kHz'),
12:dict(tid='T5',lo='3P0',hi='3D1',freq='215.87014457(9)',fr='85,86,194',fb=None,E='0.8927671836(4)',vac='1388.7629464(6)',air='1388.396915(14)',k='7200.6529453(29)',tau='332(11)',tu='ns',tr='137,195',tb=1.6,gamma='3.01(10)e6',line='479(16)',lu='kHz',partial='1.92(10)e6',vr='~1.681',recoil='~605.2',ru='Hz',temp='~58.1',doppler='~1.210',du='kHz',TD='11.5(4)',d='2.76(7)',rabi='28.3(8)'),
13:dict(tid='T6',lo='3P0',hi='3S1',freq='461.86817672(22)',fr='190,198',fb=None,E='1.9101332987(9)',vac='649.08662928(31)',air='648.913718(6)',k='15406.264047(7)',tau='13.8(17)',tu='ns',tr='135,196',tb=1.4,gamma='7.2(9)e7',line='11.5(14)',lu='MHz',partial='9.4(15)e6',vr='~3.596',recoil='~2.770',ru='kHz',temp='~266',doppler='~5.541',du='kHz',TD='277(33)',d='1.96(15)',rabi='20.0(16)'),
14:dict(tid='T7',lo='3P2',hi='3S1',freq='389.2598337(6)',fr='190',fb=None,E='1.6098493199(24)',vac='770.160284(11)',air='769.955919(8)',k='12984.310422(19)',tau='13.8(17)',tu='ns',tr='135,196',tb=1.4,gamma='7.2(9)e7',line='11.5(14)',lu='MHz',partial='3.7(5)e7',vr='~3.031',recoil='~1.968',ru='kHz',temp='~189',doppler='~3.936',du='kHz',TD='277(33)',d='4.99(32)',rabi='39.5(26)')}
for t,d in trans.items():
 common={'transitionId':d['tid'],'lowerState':d['lo'],'upperState':d['hi']}
 if t in [13,14]:common['sharedUpperLevelDatasetId']='3S1-lifetime-refs135-196'
 def q(key,printed,u='',ref='',kind='compilation-derived',**kw):return add(t,key,printed,u,ref,kind,**common,**kw)
 q('frequency_nu',d['freq'],'THz',d['fr'],'compilation-adopted' if d['fb'] is None else 'compilation-weighted-recommendation',birgeRatio=d['fb'],convention='hyperfine center-of-gravity; nu=omega0/(2pi); source prints omega0=2pi*nu')
 q('transition_energy',d['E'],'eV',derivedFrom=['frequency_nu'])
 q('wavelength_vac',d['vac'],'nm',derivedFrom=['frequency_nu'])
 q('wavelength_air',d['air'],'nm',derivedFrom=['frequency_nu'],conditions='P=101325Pa,T=25degC,RH=50%; nair uncertainty1e-8; ambient variation excluded')
 q('wavenumber_vac',d['k'],'cm^-1',derivedFrom=['frequency_nu'])
 q('upper_state_lifetime',d['tau'],d['tu'],d['tr'],'theory-adopted' if t==11 else 'compilation-weighted-recommendation',birgeRatio=d['tb'],convention='total excited-state lifetime; not inverse partial decay rate')
 q('total_decay_rate',d['gamma'],'s^-1',derivedFrom=['upper_state_lifetime'])
 q('linewidth_FWHM_nu',d['line'],d['lu'],sourceOriginalExpression='2pi*'+d['line']+' '+d['lu'],derivedFrom=['upper_state_lifetime'],reviewFlags=['SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT'],convention='numeric coefficient interpreted as ordinary-frequency FWHM per Eq47, despite literal extra2pi in table')
 for key,k,u in [('f','oscillator_strength',''),('partial','partial_decay_rate','s^-1'),('vr','recoil_velocity','mm/s'),('recoil','recoil_omega_over_2pi',d['ru']),('temp','recoil_temperature','nK'),('doppler','doppler_angular_shift_over_2pi',d['du']),('TD','doppler_temperature','uK'),('d','dipole_reduced_J_Racah','e a0'),('isat','saturation_intensity',d.get('iu','')),('sigma','resonant_cross_section','m^2'),('rabi','rabi_omega_over_2pi','MHz')]:
  if key not in d:continue
  r=q(k,d[key],u,derivedFrom=['frequency_nu','upper_state_lifetime']+(['branching_ratio'] if key in ['d','partial'] and t in [8,12,13,14] else []))
  if key in ['recoil','doppler','rabi']:r['sourceOriginalExpression']='2pi*'+d[key]+' '+u
  if key=='d':r.update(convention='<Jg||e r||Je>_R Racah-Wigner, Eq54; electronic J-reduced; not F- or mF-effective',evidenceType='compilation-derived-from-lifetime-frequency-theory-branching')
  if key=='rabi':r.update(conditions={'power_mW':1,'gaussianDiameter_mm':1,'waist_mm':0.5,'polarizationClaimInBody':'pi(q=0)','printedChannel':'|5/2,5/2> -> |3/2,3/2>' if t==14 else '|1/2,1/2> -> |3/2,3/2>'},reviewFlags=['SOURCE_RABI_CHANNEL_POLARIZATION_CONFLICT'])
 if t==8:
  r=q('branching_ratio:1P1->1S0','0.99999994(4)','','132','theory-adopted',sourceOriginalExpression='1-6(4)*10^-8')
  # Complement uncertainty is 4e-8, not4 in last decimal place of .99999994? Parser gives4e-8, as intended.
 if t==12:
  for upper,v in [('3P2','0.0099(39)'),('3P1','0.352(27)'),('3P0','0.638(27)')]:q('branching_ratio:3D1->'+upper,v,'','132','theory-adopted')
 if t in [13,14]:
  for upper,v in [('3P2','0.508(26)'),('3P1','0.360(25)'),('3P0','0.130(13)'),('1P1','0.0021(9)')]:q('branching_ratio:3S1->'+upper,v,'','132','theory-adopted',duplicateOfTable=13 if t==14 else None)
 if t==14:
  for r in records:
   if r['table']==14 and r['parameter']=='wavelength_vac':r['reviewFlags']=['SOURCE_LAMBDA_CENTRAL_INCONSISTENT_WITH_FREQUENCY','SOURCE_LAMBDA_UNCERTAINTY_INCONSISTENT_WITH_FREQUENCY']
# Resolve ONLY genuine numeric dependencies from the source equations. Method citations
# are kept separately so that they do not masquerade as measured input values.
record_by_id={r['id']:r for r in records}
for r in records:
 if r['table']<8 or not r['evidenceType'].startswith('compilation-derived'):continue
 t=r['table'];p=r['parameter']
 def local(name):return f'table-{t:02}:{name}'
 branch={8:'branching_ratio:1P1->1S0',12:'branching_ratio:3D1->3P0',13:'branching_ratio:3S1->3P0',14:'branching_ratio:3S1->3P2'}.get(t)
 deps=[];method=[];equations=[]
 if p=='transition_energy':deps=[local('frequency_nu'),'table-01:h','table-01:e'];equations=[35,36]
 elif p=='wavelength_vac':deps=[local('frequency_nu'),'table-01:c'];equations=[37]
 elif p=='wavelength_air':deps=[local('wavelength_vac')];method=[99,100,101,102];equations=[39,40]
 elif p=='wavenumber_vac':deps=[local('frequency_nu'),'table-01:c'];equations=[38]
 elif p=='total_decay_rate':deps=[local('upper_state_lifetime')];equations=[46]
 elif p=='linewidth_FWHM_nu':deps=[local('upper_state_lifetime')];equations=[46,47]
 elif p=='oscillator_strength':deps=[local('frequency_nu'),local('upper_state_lifetime'),'table-01:epsilon0','table-01:electron_mass','table-01:c','table-01:e'];method=[140];equations=[50]
 elif p=='partial_decay_rate':deps=[local('upper_state_lifetime'),local(branch)];equations=[48,49]
 elif p=='recoil_velocity':deps=[local('frequency_nu'),'table-02:mass_kg','table-01:h','table-01:c'];equations=[55]
 elif p=='recoil_omega_over_2pi':deps=[local('frequency_nu'),'table-02:mass_kg','table-01:h','table-01:c'];equations=[56]
 elif p=='recoil_temperature':deps=[local('frequency_nu'),'table-02:mass_kg','table-01:h','table-01:c','table-01:kB'];equations=[58];method=[4];r['convention']='rms-defined Tr=hbar^2*kL^2/(m*kB), Eq58; twice the single-photon recoil-energy temperature Erec/kB in Eq59'
 elif p=='doppler_angular_shift_over_2pi':deps=[local('recoil_omega_over_2pi')];equations=[57]
 elif p=='doppler_temperature':deps=[local('upper_state_lifetime'),'table-01:hbar','table-01:kB'];equations=[60];method=[145]
 elif p=='dipole_reduced_J_Racah':
  deps=[local('frequency_nu'),local('upper_state_lifetime'),'table-01:epsilon0','table-01:hbar','table-01:c','table-01:e','table-01:a0']
  if branch:deps.append(local(branch))
  method=[141,142,143,144];equations=[52,54]
  if t==10:r['evidenceType']='compilation-derived-from-lifetime-frequency-Eq54'
 elif p=='saturation_intensity':deps=[local('frequency_nu'),local('upper_state_lifetime'),'table-01:h','table-01:c'];equations=[94]
 elif p=='resonant_cross_section':deps=[local('wavelength_vac')];method=[64];equations=[100]
 elif p=='rabi_omega_over_2pi':deps=[local('dipole_reduced_J_Racah'),'table-01:hbar','table-01:epsilon0','table-01:c'];method=[143];equations=[76,78,79,80,81]
 else:raise ValueError(('unclassified source dependency',r['id']))
 r['derivedFrom']=deps
 r['methodReferenceNumbers']=method
 r['sourceEquations']=equations
 r['sourceDependencyBoundary']='Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.'
 if p in ['dipole_reduced_J_Racah','rabi_omega_over_2pi'] and t==10:
  r['sourceDependencyBoundary']+=' Table10 does not quote beta separately; Eq54 uses an implicit dominant/single branch, not a newly measured beta.'
 if p in ['saturation_intensity','resonant_cross_section']:
  r['sourceDependencyBoundary']+=' Cycling/two-level definition as in the cited source; no new multilevel or polarization correction is inferred.'

def numeric_input_references(record_id,seen=None):
 seen=set() if seen is None else set(seen)
 if record_id in seen:raise ValueError(('dependency cycle',record_id))
 seen.add(record_id);r=record_by_id[record_id]
 out=set(r['sourceReferenceNumbers'])
 for dep in r.get('derivedFrom',[]):out.update(numeric_input_references(dep,seen))
 return out
for r in records:
 if r['table']>=8 and r.get('derivedFrom'):
  r['dependencyReferenceNumbers']=sorted(set(n for dep in r['derivedFrom'] for n in numeric_input_references(dep)))
 if r['table']==14 and r['parameter'] in ['upper_state_lifetime','total_decay_rate','linewidth_FWHM_nu','doppler_temperature']:r['duplicateOfTable']=13
 if r['table']==11 and r['parameter'] in ['upper_state_lifetime','total_decay_rate','linewidth_FWHM_nu']:
  r['reviewFlags']=list(dict.fromkeys(r.get('reviewFlags',[])+['THEORY_LIFETIME_F_SCOPE_UNRESOLVED']))
  r['stateBoundary']='Source adopts a theoretical171Yb3P2 estimate; source table does not resolve F. Do not use as a universal F-resolved lifetime or pure-M2 measurement.'
 if r['table']==2 and r['parameter'] in ['ionization_centroid_cm','ionization_centroid_eV','ionization_Fc0_cm','ionization_Fc1_cm']:
  r['reviewFlags']=list(dict.fromkeys(r.get('reviewFlags',[])+['IONIZATION_THRESHOLD_CENTROID_CONFLICT']))
  r['sourceDependencyBoundary']='Empirical compilation centroid and adopted/model Fc0/Fc1 thresholds are distinct source/reference conventions; their weighted centroids disagree; no covariance or reconciliation inferred.'
# Bibliography map, retaining raw multiline OCR. Numeric entries in source are [1]--[226].
refstart=full.index('REFERENCES',full.index('Table 14:')) if 'REFERENCES' in full[full.index('Table 14:'):] else full.index('[1]')
reftext=full[refstart:]
matches=list(re.finditer(r'^\s*\[(\d+)\]\s+',reftext,re.M))
refmap={}
for i,m in enumerate(matches):
 n=int(m.group(1));end=matches[i+1].start() if i+1<len(matches) else len(reftext)
 raw=reftext[m.start():end].strip()
 absolute=refstart+m.start();p=full[:absolute].count('\f')+1
 refmap[str(n)]={'referenceNumber':n,'pdfPhysicalPage':p,'raw':raw,'text':' '.join(raw.split())}
# Complete records and convenience exports.
counts=Counter(r['table'] for r in records)
tables=[{'number':n,'title':titles[n],'pdfPhysicalPages':[tp[n]],'printedPages':[tp[n]],'rawFile':f'raw/table-{n:02}.txt','structuredRecordCount':counts[n],'coverage':'all printed numeric/categorical cells transcribed; shared/multirow cells represented once where appropriate'} for n in range(1,15)]
source={'title':'171Yb Reference Data','authors':['Ronen M. Kroeze','Sofus Laguna Kristensen','Sebastian Pucher'],'arxiv':'2509.04416v2','versionDate':'2026-02-13','documentDate':'2026-02-16','localPath':str(SOURCE),'sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'pdfPageCount':40,'sourceRole':'reference-compilation, not original direct-measurement article','uncertaintyConvention':'parenthetical last-digit standard uncertainty; source Section2(p2) combines stat/sys in quadrature, scales inconsistent weighted means by Birge ratio; one-sigma unless source entry is approximate/unqualified'}

def save_json(name,obj):
 (ROOT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def save_csv(name,rows):
 fields=['id','table','pdfPhysicalPage','printedPage','isotope','state','transitionId','lowerState','upperState','parameter','sourcePrintedValue','valueDecimal','uncertaintyDecimal','unit','sourceReferenceNumbers','evidenceType','approximate','status','birgeRatio','convention','conditions','reviewFlags']
 fields += sorted(set().union(*(r.keys() for r in rows))-set(fields))
 with (ROOT/name).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader()
  for r in rows:w.writerow({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(dict,list)) else v for k,v in r.items()})
save_json('all-tables.json',{'schemaVersion':1,'source':source,'tables':tables,'records':records})
save_csv('all-quantities.csv',records)
for name,subset in [('transition-properties',[r for r in records if r['table']>=8]),('hyperfine-zeeman',[r for r in records if r['table']==5]),('isotope-shifts',[r for r in records if r['table']==6]),('magic-tuneout',[r for r in records if r['table']==7]),('scattering-lengths',[r for r in records if r['table']==4]),('constants-isotopes',[r for r in records if r['table']<=3])]:
 save_json(name+'.json',subset);save_csv(name+'.csv',subset)
save_json('reference-map.json',refmap)
used=sorted(set(n for r in records for n in r['sourceReferenceNumbers']+r.get('dependencyReferenceNumbers',[])+r.get('methodReferenceNumbers',[])))
missing=[n for n in used if str(n) not in refmap]
# Audit proposals, keeping original canonical snapshots and no automatic application.
proposals=[]
canon=json.loads((REPO/'data/transitions.json').read_text())
canon_records={r['id']:r for r in canon['records']}
mapq={'frequency_nu':('frequency_THz',Decimal(1)),'transition_energy':('transition_energy_eV',Decimal(1)),'wavelength_vac':('wavelength_vac_nm',Decimal(1)),'wavelength_air':('wavelength_air_nm',Decimal(1)),'total_decay_rate':('decay_rate_s',Decimal(1)),'wavenumber_vac':('energy_cm',Decimal(1)),'upper_state_lifetime':('lifetime_ns',None),'linewidth_FWHM_nu':('natural_linewidth_Hz',None),'dipole_reduced_J_Racah':('d_reduced_au',Decimal(1)),'oscillator_strength':('oscillator_strength',Decimal(1))}
# Schema names are identified from file; unmatched names remain proposals with explicit source quantities.
actual_keys=sorted(set(k for row in canon['records'] for k in row.get('quantities',{})))
aliases={'frequency_THz':['frequency_THz','frequency_thz'],'transition_energy_eV':['energy_eV','transition_energy_eV'],'decay_rate_s':['Gamma_per_s_num','gamma_s','decay_rate_s','Gamma_s'],'lifetime_ns':['tau_ns','lifetime_ns'],'natural_linewidth_Hz':['linewidth_frequency_coefficient_Hz','linewidth_hz','natural_linewidth_Hz','natural_linewidth_hz'],'d_reduced_au':['d_num','d_au','d_reduced_au'],'oscillator_strength':['oscillator_strength_f_num','f','oscillator_strength']}
for r in records:
 if r['table']<8 or r['parameter'] not in mapq:continue
 tid=r['transitionId'];target,scale=mapq[r['parameter']]
 keys=canon_records.get(tid,{}).get('quantities',{})
 target=next((k for k in aliases.get(target,[target]) if k in keys),target)
 if scale is None:
  scale={'ns':Decimal(1),'s':Decimal('1e9'),'MHz':Decimal('1e6'),'kHz':Decimal('1e3'),'mHz':Decimal('.001'),'Hz':Decimal(1)}[r['unit']]
 value=str(Decimal(r['valueDecimal'])*scale)
 unc=str(Decimal(r['uncertaintyDecimal'])*scale) if r['uncertaintyDecimal'] else None
 old=keys.get(target)
 action='update-precision-uncertainty-and-source' if old is not None else 'add-reported-wavenumber-field-if-schema-supports'
 if tid=='T2' and r['parameter']=='dipole_reduced_J_Racah':action='separate-literature-0.5398(6)-from-internal-0.543-calibration'
 if tid=='T4' and r['parameter'] in ['upper_state_lifetime','total_decay_rate','linewidth_FWHM_nu']:action='retain-approximate-theory-label-and-hfs-induced-E1-dominance'
 proposals.append({'file':'data/transitions.json','recordId':tid,'field':target,'current':old,'proposedValueDecimal':value,'proposedUncertaintyDecimal':unc,'sourceRecordId':r['id'],'sourceLocator':f'Table {r["table"]}, PDF/printed p{r["pdfPhysicalPage"]}','sourceOriginalReferenceNumbers':r['sourceReferenceNumbers'],'dependencyReferenceNumbers':r.get('dependencyReferenceNumbers',[]),'action':action,'evidenceType':r['evidenceType'],'reviewFlags':r.get('reviewFlags',[]),'applied':False})
for tid,field,reason in [('T3','oscillator_strength_f_num','Table9 does not report f; current1e-9 must be missing unless a separate valid source is provided.'),('T4','oscillator_strength_f_num','Table11 does not report f; current1e-9 must be missing unless a separate valid source is provided.'),('T3','d_num','Table9 does not report d. Effective F-reduced9.19e-5 cannot be relabeled electronic J-reduced for J=0->0; require separate HFS-induced derivation/source.')]:
 proposals.append({'file':'data/transitions.json','recordId':tid,'field':field,'action':'provenance-and-convention-correction','reason':reason,'applied':False})
levels=json.loads((REPO/'data/levels.json').read_text())
levelmap={'yb171-6s6p-1p1':8,'yb171-6s6p-3p0':9,'yb171-6s6p-3p1':10,'yb171-6s6p-3p2':11}
for row in levels['records']:
 if row['id'] in levelmap:
  t=levelmap[row['id']];r=next(r for r in records if r['table']==t and r['parameter']=='wavenumber_vac')
  proposals.append({'file':'data/levels.json','recordId':row['id'],'field':'energy_cm','current':row['quantities'].get('energy_cm'),'proposedValueDecimal':r['valueDecimal'],'proposedUncertaintyDecimal':r['uncertaintyDecimal'],'sourceRecordId':r['id'],'action':'use-isotope171-hyperfine-centroid-or-explicitly-relabel-current-energy-reference','applied':False})
for state,gj,zref,Fs,zs,A,aref,br in hfs:
 r=next(r for r in records if r['table']==5 and r['parameter']==state+':A_over_h')
 proposals.append({'file':'data/hyperfine.json','recordId':state,'field':'A_over_h','proposedValueDecimal':r['valueDecimal'],'proposedUncertaintyDecimal':r['uncertaintyDecimal'],'sourceRecordId':r['id'],'sourceOriginalReferenceNumbers':r['sourceReferenceNumbers'],'birgeRatio':br,'action':'retain-central-value-add-uncertainty-full-weighted-compilation-citations','applied':False})
# Derived energies kept as candidates, not adopted.
rlookup={r['id']:r for r in records}
k0=Decimal(rlookup['table-09:wavenumber_vac']['valueDecimal'])
k3d=k0+Decimal(rlookup['table-12:wavenumber_vac']['valueDecimal'])
k3s=k0+Decimal(rlookup['table-13:wavenumber_vac']['valueDecimal'])
k3s_alt=Decimal(rlookup['table-11:wavenumber_vac']['valueDecimal'])+Decimal(rlookup['table-14:wavenumber_vac']['valueDecimal'])
proposals += [
{'file':'data/levels.json','recordId':'yb171-6s5d-3d1','field':'energy_cm','candidateValueDecimal':str(k3d),'derivedFrom':['table-09:wavenumber_vac','table-12:wavenumber_vac'],'action':'derived-centroid-candidate-requires-covariance-check','applied':False},
{'file':'data/levels.json','recordId':'yb171-6s7s-3s1','field':'energy_cm','candidateValueDecimal':str(k3s),'alternativeValueDecimal':str(k3s_alt),'pathDifference_cmInverse':str(k3s_alt-k3s),'pathDifference_MHz':str((k3s_alt-k3s)*Decimal('29979.2458')),'derivedFrom':['table-09:wavenumber_vac','table-13:wavenumber_vac'],'alternativeFrom':['table-11:wavenumber_vac','table-14:wavenumber_vac'],'action':'unresolved-path-conflict-do-not-average-or-silently-adopt','applied':False}]
save_json('correction-proposals.json',{'scope':'local supplied Kroeze v2 compilation compared with current canonical files; proposals only','canonicalQuantityKeysObserved':actual_keys,'canonicalSnapshotHashes':{name:hashlib.sha256((REPO/'data'/name).read_bytes()).hexdigest() for name in ['transitions.json','levels.json','hyperfine.json']},'records':proposals})
issues=[
{'id':'SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT','pages':[23,24,25,26],'tables':list(range(8,15)),'detail':'Tables label Delta nu FWHM but print2pi times coefficient. Eq47(p11) defines Delta nu=Gamma/(2pi); coefficients match ordinary-frequency FWHM. Raw literal expression retained, normalization explicitly flagged.'},
{'id':'SOURCE_RABI_CHANNEL_POLARIZATION_CONFLICT','pages':[17,23,24,25,26],'tables':[8,10,12,13,14],'detail':'Body p17 claims pi(q=0), table states have Delta m=+1 or-1. Do not use these entries as pi-channel reference checks before resolving convention/erratum.'},
{'id':'SOURCE_LAMBDA_UNCERTAINTY_INCONSISTENT_WITH_FREQUENCY','pages':[26],'tables':[14],'detail':'Source frequency389.2598337(6)THz and wavenumber12984.310422(19)cm^-1 imply lambda770.1602684006901nm, but printed lambda is770.160284(11)nm. Central difference0.0000155993nm; printed uncertainty0.000011nm also differs from propagated0.0000011871nm. Preserve both and explicitly derive candidate; do not silently adopt printed vacuum wavelength.'},
{'id':'SOURCE_BOILING_TEMPERATURE_UNIT_PAIR_INCONSISTENT','pages':[20],'tables':[2],'detail':'Source says1496K(1196degC); exact temperature conversion gives1222.85degC. Neither value selected as correct without primary-source check.'},
{'id':'IONIZATION_THRESHOLD_CENTROID_CONFLICT','pages':[3,20],'tables':[2],'detail':'Compilation centroid50443.0676(12)cm^-1 differs from degeneracy-weighted(1:3) center of quoted Fc0/Fc1 thresholds50443.11203325cm^-1 by0.04443325cm^-1. Keep empirical-compilation recommendation and MQDT/adopted model thresholds separately; do not silently substitute.'},
{'id':'ENERGY_PATH_CONFLICT_3S1','pages':[24,25,26],'tables':[9,11,13,14],'detail':f'3S1 energy via3P0+649nm={k3s}cm^-1, via3P2+770nm={k3s_alt}cm^-1; difference{(k3s_alt-k3s)*Decimal("29979.2458")}MHz. Weighted compilation is not globally spectroscopic-loop reconciled.'},
{'id':'NO_ELECTRONIC_J0_J0_D_IN_TABLE9','pages':[24],'tables':[9],'detail':'No d/f/Rabi entry for clock. Internal effective F matrix element requires separate convention/source.'},
{'id':'THEORY_BRANCHING_AND_3P2_LIFETIME','pages':[11,23,25,26],'tables':[8,11,12,13,14],'detail':'All tabulated branching ratios are theory[132]. 3P2~8.9s is theory[129], with odd-isotope HFS-inducedE1dominance per p11; not measured pureM2 lifetime.'}]
save_json('report.json',{'source':source,'tables':tables,'structuredRecordCount':len(records),'numericRecordCount':sum(r['status']=='numeric' for r in records),'nullOrCategoricalRecordCount':sum(r['status']!='numeric' for r in records),'sourceReferenceCount':len(refmap),'usedOriginalReferenceNumbers':used,'missingReferenceNumbers':missing,'visualInspection':{'pdfPhysicalPages':[21,23,24,26],'method':'pdftoppm145dpi, manual inspection of source page images','confirmed':['Table5 HFS/Zeeman values and source ranges','Table7 all13row associations/isotope asterisks','Table8/10clock d absence and0.5398(6)','Table13/14 d/branching/units/Rabi symbols']},'issues':issues,'verificationScope':'complete table extraction and local numeric/source-locator cross-check; original cited articles not physically revalidated in this subtask; no canonical mutations','generatedBy':'extract_tables.py, deterministic manual transcription with Decimal'} )
# Explicit frequency-derived vacuum candidate for source Table14's conflicting lambda.
nu7=Decimal(rlookup['table-14:frequency_nu']['valueDecimal'])
un7=Decimal(rlookup['table-14:frequency_nu']['uncertaintyDecimal'])
lam7=Decimal('299792458')*Decimal('.001')/nu7
ulam7=Decimal('299792458')*Decimal('.001')*un7/nu7**2
for item in proposals:
 if item.get('recordId')=='T7' and item.get('field')=='wavelength_vac_nm':
  item['sourceReportedValueDecimal']=item['proposedValueDecimal'];item['sourceReportedUncertaintyDecimal']=item['proposedUncertaintyDecimal']
  item['proposedValueDecimal']=str(lam7);item['proposedUncertaintyDecimal']=str(ulam7)
  item['derivedFrom']=['table-14:frequency_nu','table-01:c']
  item['action']='use-explicit-frequency-derived-candidate-or-mark-unresolved-source-conflict'
  item['evidenceType']='derived-from-reported-frequency-and-exact-c'
save_json('correction-proposals.json',{'scope':'local supplied Kroeze v2 compilation compared with current canonical files; proposals only','canonicalQuantityKeysObserved':actual_keys,'canonicalSnapshotHashes':{name:hashlib.sha256((REPO/'data'/name).read_bytes()).hexdigest() for name in ['transitions.json','levels.json','hyperfine.json']},'records':proposals})
arithmetic=[]
for t in range(8,15):
 freq=rlookup[f'table-{t:02}:frequency_nu'];wave=rlookup[f'table-{t:02}:wavelength_vac']
 nu=Decimal(freq['valueDecimal']);lam=Decimal(wave['valueDecimal']);calc=Decimal('299792458')*Decimal('.001')/nu
 row={'table':t,'check':'lambda=c/nu','source_nm':wave['valueDecimal'],'calculated_nm':str(calc),'difference_nm':str(lam-calc),'scope':'internal printed-table arithmetic only'}
 arithmetic.append(row)
 if f'table-{t:02}:dipole_reduced_J_Racah' in rlookup:
  tau=rlookup[f'table-{t:02}:upper_state_lifetime'];ts=float(tau['valueDecimal'])*(1e-9 if tau['unit']=='ns' else 1)
  beta={8:.99999994,10:1,12:.638,13:.130,14:.508}[t]
  d=math.sqrt(3*3*math.pi*8.8541878188e-12*(6.62607015e-34/(2*math.pi))*299792458**3*beta/((2*math.pi*float(nu)*1e12)**3*ts))/(1.602176634e-19*5.29177210544e-11)
  arithmetic.append({'table':t,'check':'Eq54 electronic J-reduced magnitude (Je=1)','source_ea0':rlookup[f'table-{t:02}:dipole_reduced_J_Racah']['valueDecimal'],'calculated_ea0':d,'scope':'internal printed-table arithmetic only; not original-measurement validation'})
save_json('arithmetic-checks.json',arithmetic)
# Checks are extraction consistency checks, not a scientific validation claim.
assert len(tables)==14 and all(counts[n]>0 for n in range(1,15))
assert len({r['id'] for r in records})==len(records)
assert len(scatter)==28 and len([r for r in records if r['table']==6])==42
assert len([r for r in records if r['table']==7])==52
assert not missing,missing
assert rlookup['table-10:dipole_reduced_J_Racah']['valueDecimal']=='0.5398'
assert not any(r['table']==9 and r['parameter'] in ['dipole_reduced_J_Racah','oscillator_strength'] for r in records)
print(json.dumps({'tables':len(tables),'records':len(records),'perTable':dict(counts),'references':len(refmap),'missingReferences':missing,'proposalCount':len(proposals)},ensure_ascii=False))
