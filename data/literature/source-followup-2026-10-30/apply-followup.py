"""Dated reconciliation from the immutable pre-followup snapshot; no PDF edits.

Run with --apply. Source tables, original strings and independent-source conflicts
are retained. This script performs only explicit scalar/Ritz arithmetic, not fits.
"""
from pathlib import Path
from decimal import Decimal, getcontext
import copy
import json
import sys

getcontext().prec=40
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
def read(p): return json.loads(p.read_text())
def write(p,v): p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
names=['levels','transitions','hyperfine','sources','estimates','dataset']
old={name:read(HERE/'baseline'/f'{name}.json') for name in names}
docs=copy.deepcopy(old)
trs={r['id']:r for r in docs['transitions']['records']}
received=read(ROOT/'references/received-downloads-20261030.json')['documents']
files={r['sourceId']:r for r in received}

# Three770nm and two649nm hyperfine components, all from Qiao Table2.
# These weights cancel endpoint hyperfine shifts with the F degeneracies;
# they are not weights inferred from measured line intensities.
clock=Decimal('518.29583659086363')
nu649low=Decimal('461861338.03')
nu649high=Decimal('461871596.07')
nu770a=Decimal('389257019.71')
nu770b=Decimal('389267277.10')
nu770c=Decimal('389260569.95')
nu6=(nu649low+2*nu649high)/3
nu7=(5*nu770a+nu770b+9*nu770c)/15
nu4=clock+(nu6-nu7)/Decimal(1000000)
c=Decimal('299792458')
h=Decimal('6.62607015e-34')
e=Decimal('1.602176634e-19')
new4={'frequency_THz':nu4,'wavelength_vac_nm':c*Decimal('0.001')/nu4,
      'energy_eV':nu4*Decimal('1e12')*h/e}
common={'isotope':171,'auditDate':'2026-10-30',
    'sourceEvidenceType':'derived-five-component-F-centroid-Ritz',
    'sourceRecord':'frequency/arithmetic-and-recommendations.json',
    'originalPDF':'references/papers/1.pdf','originalPDFSha256':files['qiao-2023-rinp']['sha256'],
    'formulaMHz':'clock+(nu649low+2nu649high)/3-(5nu770a+nu770b+9nu770c)/15',
    'rawComponentsMHz':['461861338.03(21)','461871596.07(31)','389257019.71(65)','389267277.10(37)','389260569.95(89)'],
    'derivedFrequencyDecimalTHz':str(nu4),
    'conservativeStdUpperBoundMHz':1.0520001,
    'uncertaintyBoundary':'Cross-transition covariances not supplied. Sum|weight|u bounds the propagated standard deviation given reported marginal uncertainties, including0.1Hz clock. It is not an actual reconstructed1sigma or a hard confidence interval; unreported systematics/second-order HFS are not bounded.',
    'centroidDefinition':'first-order171YbF-degeneracy endpoint centroids; no intensity weighting or new fit',
    'legacySourceCauseEstablished':False}
for field,value in new4.items():
    q=trs['T4']['quantities'][field]
    prior=copy.deepcopy(q)
    q.update(value=float(value),uncertainty=None,evidenceKind='derived',sourceId='qiao-2023-rinp',
        sourceLocator='Qiao2023RINP Table2 PDFp5, five corrected hyperfine component frequencies + clock ref01 Table9 p24',
        reviewStatus='original-source-located',derivedFrom=['Qiao2023RINP.Table2.five-hyperfine-components','T3.frequency_THz','exact SI c,h,e where applicable'],
        uncertaintyNote='actual propagated1sigma unavailable without covariance; conservative standard-deviation bound retained separately',
        convention='hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)',
        conditions={**copy.deepcopy(common),'sourceDecimal':str(value),
            'supersededIndependentSource':{'sourceId':prior['sourceId'],'value':prior['value'],'uncertainty':prior['uncertainty'],'locator':prior['sourceLocator']},
            'sourceConflict':'Previous Kroeze/Yamaguchi590.90433(4)THz disagrees with this explicit Ritz centroid by150.365803MHz; cause not established. Old value and derivation alternatives preserved.'})
    q['legacyText']=prior.get('legacyText',str(prior['value']))

# Air conversion is a separate physical convention. Do not quietly reuse the
# old air wavelength with an updated vacuum frequency or invent its error.
air=trs['T4']['quantities']['wavelength_air_nm']
air.update(value=None,uncertainty=None,reviewStatus='definition-needs-review',
    missingReason='not-recomputed-for-updated-vacuum-frequency',
    sourceLocator='KroezeTable11 old air wavelength archived; Edlen/Buck conversion not recomputed for updated Ritz frequency',
    uncertaintyNote='air wavelength unavailable for updated working frequency; refractive-index/environment uncertainty not reconstructed')
air['conditions']={'isotope':171,'auditDate':'2026-10-30','supersededValueNm':old['transitions']['records'][3]['quantities']['wavelength_air_nm']['value'],
    'updatedVacuumWavelengthNm':float(new4['wavelength_vac_nm'])}

for field in ['lifetime_ns','Gamma_per_s_num','linewidth_frequency_coefficient_Hz']:
    q=trs['T4']['quantities'][field]
    # Central rounded values remain the source compilation values; the original
    # Mishra rate sum0.11188/s and printed8.9s are retained in the extraction.
    q.update(sourceId='mishra-2001-jqsrt',sourceLocator='Mishra2001 Eq15 PDFp7; Tables3/4/5 PDFpp8-9, printed776-777',
             reviewStatus='definition-needs-review',uncertainty=None,
             uncertaintyNote='theoretical model uncertainty not supplied; rate-statistical-average convention confirmed; not F-resolved',
             conditions={'isotope':171,'auditDate':'2026-10-30','sourceEvidenceType':'theory-hyperfine-statistical-rate-average',
                 'originalPDF':'references/papers/2.pdf','originalPDFSha256':files['mishra-2001-jqsrt']['sha256'],
                 'primaryOriginalsAllRead':True,'stateBoundary':'F=3/2 and F=5/2 do not share this lifetime: inverse of(2F+1)-weighted HFI rate plusM1+M2; not the average of lifetimes',
                 'FWeights':[4,6],'HFIWholeLineRatePerS':.044,'HFI_F32_to_F12_RatePerS':.1097,
                 'M1RatePerS':.0677,'M2RatePerS':.00018,'tableRateSumPerS':.11188,
                 'temperatureK':None,'BBRTemperatureK':None,'BBRModel':'not added as an experimental thermal environment; no temperature inferred'})
    if field=='linewidth_frequency_coefficient_Hz':
        q['conditions']['sourceConflict']='SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT retained from old Kroeze table; displayedcoefficient usesGamma/(2*pi), and is an equivalent statistically-averaged rate width, not F-resolved line width'
        q.update(evidenceKind='derived',derivedFrom=['T4.lifetime_ns','equivalent width=1/(2*pi*tau_average_rate_inverse)'],
            convention='equivalent-frequency-width-of-statistically-averaged-rate=Gamma/(2*pi); not-F-resolved')
        q['sourceLocator']='Mishra2001 Table5 PDFp9 printed8.9s; equivalentwidth=1/(2*pi*tau), rounded17.9mHz; not a printed Mishra linewidth'
    elif field=='Gamma_per_s_num':
        q.update(evidenceKind='derived',derivedFrom=['T4.lifetime_ns','Gamma_average=1/tau_average_rate_inverse'],
            convention='statistically-averaged-total-decay-rate; not-F-resolved')
        q['sourceLocator']='Mishra2001 Table5 PDFp9 printed8.9s; inverse lifetime rounded0.112/s; original printed component sum0.11188/s separately retained'
    else:
        q['convention']='inverse-of-statistically-averaged-total-decay-rate; not-F-resolved'

pv=trs['T4']['views']['core']['presentation']
pv.update(source='频率/真空λ：Qiao2023 Table2五分量Ritz派生；τ：Mishra2001 Table5统计平均理论',
    linewidth_FWHM='约17.9 mHz（统计平均率对应；非F分辨）',
    forbidden_reason='电子J=0→2的裸E1禁戒；HFS诱导E1只允许适用F通道。8.9s是统计平均HFI率加M1/M2后总率的倒数，不能用于所有F；无通用E1 d。')

# Update the3P2 energy to the same explicitly declared Ritz reference.
for level in docs['levels']['records']:
    term=level['attributes']['term']
    if term=='³P₂':
        level['attributes']['lifetime']='约8.9 s（理论统计平均率；非F分辨）'
        for field,q in level['quantities'].items():
            val=nu4*Decimal('1e12')/(100*c) if field=='energy_cm' else new4['energy_eV']
            q.update(value=float(val),uncertainty=None,sourceId='qiao-2023-rinp',
                sourceLocator=trs['T4']['quantities']['frequency_THz']['sourceLocator'],
                evidenceKind='derived',derivedFrom=['T4.frequency_THz','exact SI c,h,e where applicable'],
                reviewStatus='original-source-located',uncertaintyNote=trs['T4']['quantities']['frequency_THz']['uncertaintyNote'],
                convention='171Yb hyperfine center-of-gravity relative to1S0',conditions={**copy.deepcopy(common),'sourceDecimal':str(val)})
    elif term=='³S₁':
        for q in level['quantities'].values():
            q['reviewStatus']='original-source-located'
            q['conditions']['historicalSourceConflict']=q['conditions'].pop('sourceConflict',None)
            q['conditions']['workingNetworkClosureMHz']=float((nu4+Decimal(str(trs['T7']['quantities']['frequency_THz']['value']))-clock-Decimal(str(trs['T6']['quantities']['frequency_THz']['value'])))*Decimal('1e6'))
            q['conditions']['closureBoundary']='old150MHz discrepancy no longer present in working Ritz network; remaining23.3kHz is within component/rounding uncertainty; old independent-source discrepancy not explained'

# Attach primary evidence without replacing weighted recommendations by a
# single different-isotope or differently calibrated experiment.
for tid,sids in {'T6':['qiao-2023-rinp','zhou-2020-pra'],'T7':['qiao-2023-rinp','qiao-2023-apl'],'T5':['zhao-2024-pra']}.items():
    for field,q in trs[tid]['quantities'].items():
        q['conditions']={**(q.get('conditions')or{}),'followupPrimarySourcesRead':sids,'followupAuditDate':'2026-10-30'}
        if field in ['lifetime_ns','Gamma_per_s_num','d_num','linewidth_frequency_coefficient_Hz'] and tid in ['T6','T7']:
            q['conditions']['lifetimeCompilationInputsVerified']='BaumannTable1:12.5(1.5)ns historical reproduced Lange1970 +174Yb15.9(1.9)ns; weighted mean13.80546ns,Birgeinflatedu1.65363ns reproduces13.8(1.7), not a171-only direct measurement'
            q['conditions']['sourceDefinitionConflict']='Some resonance papers callbeta*Gamma_total/(2*pi) a natural linewidth; do not substitute branch partial width for total upper-stateGamma/(2*pi)'
for tid in ['T1','T2']:
    for field in ['lifetime_ns','Gamma_per_s_num','d_num']:
        q=trs[tid]['quantities'][field]
        q['conditions']['historicalLifetimeBoundary']='RambowTableI natural-mixture errors are maximum confidence limits,excludeHFS correction; not171-resolved1sigma; other compilation inputs still not all primary-rechecked'

for term,sids in {'³P₂':['qiao-2023-rinp'],'³S₁':['qiao-2023-rinp','qiao-2023-apl','zhou-2020-pra'],'³D₁':['zhao-2024-pra']}.items():
    entry=docs['hyperfine']['states'][term]
    entry['conditions']['followupPrimarySourcesRead']=sids
    entry['conditions']['followupDisposition']='weighted compilation retained; original measurements and conditions transcribed separately, no new statistical fit'

est=docs['estimates']
est['ionization']['A_ion_GHz']=12.642812118466
est['ionizationProvenance']['A_ion_GHz']={'sourceId':'ref-13','sourceFile':'references/papers/10.pdf',
    'sourceLocator':'Fisk1997 abstract PDFp1/printed344; final measurement discussion PDFp9/printed352',
    'valueHz':12642812118.466,'uncertaintyHz':.002,'frequencyGHz':12.642812118466,'uncertaintyGHz':2e-12,
    'convention':'171Yb+ground-state hyperfine clock frequency extrapolated tozeroB,zeroDC/ACStark,zero velocity/temperature and vacuum; experimental ions were not at0K',
    'legacyKroezeBlattValueGHz':12.6428121242,'legacyDifferenceHz':5.734,
    'noThresholdRefit':'Peper MQDT fitted threshold values unchanged; printed threshold spacing cannot supportHz precision'}
for defect in est['quantumDefects']:
    defect['followupBoundary']='Aymar1984Table1-4 measured174Yb odd-parity spectra; cannot validate these171Yb scalar defaults'

latest={r['id']:r for r in docs['sources']['references']+docs['sources']['sources']}
for r in received:
    s=latest[r['sourceId']]
    s.update(reviewStatus='original-source-located',reviewedAt='2026-10-30',
        identityStatus='verified-local-publisher-PDF',originalPDF=r['path'],originalPDFSha256=r['sha256'],
        doi=r['doi'],detail=r['title'],publication=r['version'].split(';')[0],url=r['url'],
        sourceFollowupAudit='references/audits/source-followup-20261030.md',
        numericalValidation='all numbered tables extracted; field-specific measurement/theory/derived boundaries retained')
    s['evidenceNotes']=['2026-10-30 original publisher PDF now located and read; earlier download/identity notes are historical and retained in audit baseline.']
latest['ref-13'].update(title='Fisk, Sellars, Lawn, Coles',
    authors=['Peter T. H. Fisk','Matthew J. Sellars','Malcolm A. Lawn','Colin Coles'],
    previousCitation='IEEE Trans.Instrum.Meas.46,457(1997),unconfirmed',
    correctionBoundary='Replaced the unresolved legacy citation with the actual verifiedTUFFC44(2),344-354 paper for ionic hyperfine data; not a claim that the two old citations are identical')
latest['mishra-2001-jqsrt']['authors']=['Adya Prasad Mishra','T. K. Balasubramanian']

docs['dataset'].update(datasetVersion='2026.10.30.1',sourceDate='2026-10-30',
    auditReport='references/audits/source-followup-20261030.md',
    reviewStatus='nine new primary PDFs checked; explicitRitzP2centroid,statistical-rate-lifetime andionic-frequency corrections; remaining boundaries retained')

records=[]
for group in ['transitions','levels']:
    original={r['id']:r for r in old[group]['records']}
    for r in docs[group]['records']:
        for field,q in r['quantities'].items():
            prior=original[r['id']]['quantities'][field]
            if prior!=q:records.append({'path':f'{group}/{r["id"]}/{field}','old':prior,'new':q,'auditedAt':'2026-10-30','status':'primary-source-followup','reason':'original PDF tables/definitions verified; explicit derived quantities and uncertainty limits retained'})
for term,r in docs['hyperfine']['states'].items():
    if r!=old['hyperfine']['states'][term]: records.append({'path':f'hyperfine/{term}','old':old['hyperfine']['states'][term],'new':r,'auditedAt':'2026-10-30','status':'primary-comparison-confirmed','reason':'retain weighted compilation and separate individual measurement conditions'})
records.append({'path':'estimates','old':old['estimates'],'new':docs['estimates'],'auditedAt':'2026-10-30','status':'ionic-frequency-source-corrected','reason':'Fisk original frequency and error; no MQDT threshold refit or scalar-model validation'})
if '--apply' not in sys.argv:
    print('Prepared',len(records),'audited field changes; pass --apply to write')
    raise SystemExit
for name,value in docs.items():write(ROOT/'data'/f'{name}.json',value)
write(HERE/'field-audit.json',{'date':'2026-10-30','baseline':'baseline/','policy':'source PDFs and all preserved65S values unchanged; no fit/MQDT execution','records':records,
    'RitzArithmetic':{'frequencyTHz':str(nu4),'wavelengthVacuumNm':str(new4['wavelength_vac_nm']),'T6cogMHz':str(nu6),'T7cogMHz':str(nu7),'stdUpperBoundMHz':1.0520001}})
print('Applied',len(records),'primary-source field records; dataset2026.10.30.1')
