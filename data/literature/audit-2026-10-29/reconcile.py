"""One-off, evidence-bounded 2026-10-29 reconciliation; run with --apply.

The frozen baseline is retained as evidence. This is not a general data updater.
Raw source decimals and unresolved source conflicts remain in literature/.
"""
from pathlib import Path
from decimal import Decimal
import copy
import json
import math
import sys

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
BASE = HERE / 'baseline'
DATE = '2026-10-29'

def read(path):
    return json.loads(path.read_text())

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

docs = {name: read(BASE / f'{name}.json') for name in ['levels', 'transitions', 'hyperfine', 'sources', 'estimates', 'dataset']}
old = copy.deepcopy(docs)
rows = read(ROOT / 'data/literature/kroeze-2026/transition-properties.json')
lookup = {(r['transitionId'], r['parameter']): r for r in rows}
mapping = {'wavelength_vac_nm': 'wavelength_vac', 'wavelength_air_nm': 'wavelength_air',
           'frequency_THz': 'frequency_nu', 'energy_eV': 'transition_energy',
           'Gamma_per_s_num': 'total_decay_rate', 'lifetime_ns': 'upper_state_lifetime',
           'oscillator_strength_f_num': 'oscillator_strength', 'd_num': 'dipole_reduced_J_Racah',
           'linewidth_frequency_coefficient_Hz': 'linewidth_FWHM_nu'}
audit = []

def note(path, before, after, status, reason, evidence=None):
    audit.append(dict(path=path, old=before, new=copy.deepcopy(after), status=status,
                      reason=reason, evidence=evidence, auditedAt=DATE))

def source_quantity(existing, source, field):
    q = copy.deepcopy(existing)
    factor = 1e9 if field == 'lifetime_ns' and source['unit'] == 's' else (
        {'MHz': 1e6, 'kHz': 1e3, 'mHz': 1e-3, 'Hz': 1}.get(source['unit'], 1)
        if field == 'linewidth_frequency_coefficient_Hz' else 1)
    q.update(value=float(Decimal(source['valueDecimal']) * Decimal(str(factor))),
             uncertainty=None if source['uncertaintyDecimal'] is None else float(Decimal(source['uncertaintyDecimal']) * Decimal(str(factor))),
             sourceId='ref-01', sourceLocator=f"arXiv:2509.04416v2, Table {source['table']}, PDF/printed p.{source['pdfPhysicalPage']}, {source['parameter']}",
             evidenceKind='literature-reported', reviewStatus='original-source-located',
             uncertaintyNote='source-reported uncertainty; compilation/model systematics are not independently re-evaluated',
             legacyText=source.get('sourceOriginalExpression', source['sourcePrintedValue']))
    q.pop('missingReason', None)
    q.pop('modelId', None)
    q.pop('derivedFrom', None)
    q['conditions'] = dict(isotope=171, sourceEvidenceType=source['evidenceType'], sourceRecord=source['id'],
                           sourceDecimal=source['valueDecimal'], sourceUncertaintyDecimal=source['uncertaintyDecimal'],
                           sourceReferenceNumbers=source.get('sourceReferenceNumbers', []),
                           dependencyReferenceNumbers=source.get('dependencyReferenceNumbers', []),
                           auditDate=DATE, primaryOriginalsAllRead=False)
    for key in ['sourceDependencyBoundary','methodReferenceNumbers','sourceEquations','reviewFlags']:
        if key in source: q['conditions'][key]=copy.deepcopy(source[key])
    if 'derivedFrom' in source: q['conditions']['sourceDependencyRecordIds']=copy.deepcopy(source['derivedFrom'])
    if 'birgeRatio' in source:
        q['conditions']['birgeRatio'] = source['birgeRatio']
    if source.get('approximate'):
        q['uncertaintyNote'] = 'approximate source value; no numerical uncertainty supplied; theory is not an isotope/F-resolved measurement'
    if field in ['frequency_THz', 'energy_eV', 'wavelength_vac_nm', 'wavelength_air_nm']:
        q['convention'] = 'hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)'
    if field == 'wavelength_air_nm':
        q['conditions']['airDefinition'] = '101325 Pa,25 degC,50%RH; source refractive-index uncertainty1e-8; ambient variation excluded'
    if field == 'd_num':
        q['convention'] = 'J-reduced'
        q['conditions']['definition'] = '<Jg||er||Je>_R Racah-Wigner, Eq54; includes adopted theoretical branching ratios'
        if existing.get('sourceId') == 'internal-t2-calibration':
            q['conditions']['replacedInternalCalibration'] = '0.543 ea0 archived in audit baseline; rationale/artifact unavailable'
    if field == 'lifetime_ns':
        q['convention'] = 'total upper-state radiative lifetime; not inverse partial decay rate or trap survival'
        q['conditions']['temperature_K'] = None
        q['conditions']['BBRTemperature_K'] = None
    if field == 'Gamma_per_s_num':
        q['convention'] = 'total spontaneous decay rate Gamma=1/tau; not branch-specific Einstein A'
    if field == 'linewidth_frequency_coefficient_Hz':
        q['quantity'] = 'ordinary_frequency_FWHM'
        q['convention'] = 'ordinary-frequency-FWHM=Gamma/(2*pi); source-table-extra-2pi-conflict'
        q['reviewStatus'] = 'conflict-unresolved'
        q['conditions']['sourceConflict'] = 'SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT: Eq47 defines Delta_nu=Gamma/(2pi), tables print an extra2pi'
        # Keep the exact historical typographic expression for the UI disclosure.
        q['legacyText'] = existing['legacyText']
    return q

for rec in docs['transitions']['records']:
    for field, quantity in list(rec['quantities'].items()):
        original = copy.deepcopy(quantity)
        source = lookup.get((rec['id'], mapping.get(field)))
        if source:
            quantity = source_quantity(quantity, source, field)
            status, reason = 'adopted-compilation', '原文表号、精度、误差与定义逐项订正；汇编值不冒充独立测量'
            if rec['id'] == 'T7' and field == 'wavelength_vac_nm':
                nu = lookup[('T7', 'frequency_nu')]
                frequency, uncertainty = float(nu['valueDecimal']), float(nu['uncertaintyDecimal'])
                quantity.update(value=299792.458 / frequency, uncertainty=299792.458 / frequency**2 * uncertainty,
                                evidenceKind='derived', derivedFrom=['T7.frequency_THz', 'SI exact c=299792458 m/s'],
                                reviewStatus='conflict-unresolved',
                                sourceLocator='arXiv:2509.04416v2, Table14 p26 frequency; lambda=c/nu; printed lambda fails same-row consistency')
                quantity['conditions']['sourceConflict'] = 'Table14 prints770.160284(11)nm; frequency and wavenumber instead imply770.1602684006901nm'
                status, reason = 'derived-source-conflict', '保留原表波长字面值，工作波长由同表频率及精确光速推导；不静默照搬不一致数值'
            elif rec['id'] == 'T7' and field == 'wavelength_air_nm':
                quantity['reviewStatus'] = 'conflict-unresolved'
                quantity['conditions']['sourceConflict'] = 'Table14 vacuum-wavelength/frequency mismatch; air value retained as reported, not independently recalculated'
                status = 'source-conflict-retained'
            elif rec['id'] == 'T4' and field in ['lifetime_ns', 'Gamma_per_s_num', 'linewidth_frequency_coefficient_Hz']:
                quantity['reviewStatus'] = 'definition-needs-review'
                quantity['conditions']['stateBoundary'] = 'theoretical compilation estimate; F=3/2 HFI-E1 and F=5/2 non-E1 channels differ; not a universal F-resolved171Yb lifetime'
                status, reason = 'theory-definition-pending', '原文8.9s是理论采用量，原始Mishra全文缺失且F口径不明；不能宣称纯M2寿命'
        elif rec['id'] in ['T3', 'T4'] and field == 'oscillator_strength_f_num':
            quantity.update(value=None, sourceId='ref-01', sourceLocator=f"arXiv:2509.04416v2 Table {9 if rec['id']=='T3' else 11}, p{24 if rec['id']=='T3' else 25}; oscillator strength not listed",
                            reviewStatus='definition-needs-review', missingReason='not-provided-in-cited-source',
                            uncertaintyNote='no supported oscillator strength supplied; legacy1e-9 was not traceable',
                            conditions={'auditDate': DATE, 'excludedLegacyValue': original['value']})
            status, reason = 'unsupported-value-removed', '原引用表未提供f；移除无来源的约1e-9，缺失不当作零'
        else:
            quantity['reviewStatus'] = 'definition-needs-review'
            quantity['uncertaintyNote'] = 'not established after source audit; retain unknown, never zero'
            quantity['conditions'] = {**(quantity.get('conditions') or {}), 'auditDate': DATE,
                                      'auditDisposition': 'unverified-internal-record' if quantity['evidenceKind'].startswith('internal') else 'unsupported-model-or-missing-data'}
            if rec['id'].startswith('R'):
                quantity['conditions']['excludedFromValidatedPrediction'] = True
                quantity['conditions']['stateBoundary'] = 'F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment'
            status, reason = 'pending-internal-artifact' if quantity['evidenceKind'].startswith('internal') else 'quarantined-estimate-or-missing', '已检查引用链；缺少该数值的原始记录或适用态证据，保留历史值与未验证标签'
            if rec['id'] == 'T3' and field == 'd_num':
                quantity['sourceLocator'] = 'internal supplement2026-09-08; no original notebook/run artifact located; NOT Table9'
                quantity['conditions']['definition'] = 'effective F-reduced171Yb F=1/2->F=1/2; not electronic J=0->J=0 E1 matrix element'
            if rec['id'] == 'T4' and field == 'd_num':
                quantity['sourceLocator'] = 'arXiv:2509.04416v2 Table11 p25 has no universal E1 matrix element; F-specific HFI treatment required'
            if rec['id'] in ['T5','T6','T7'] and field=='oscillator_strength_f_num':
                table,page={'T5':(12,25),'T6':(13,26),'T7':(14,26)}[rec['id']]
                quantity.update(sourceLocator=f'arXiv:2509.04416v2 Table{table} p{page}; oscillator strength not listed',missingReason='not-provided-in-cited-source')
        rec['quantities'][field] = quantity
        note(f"transitions/{rec['id']}/{field}", original, quantity, status, reason, source['id'] if source else quantity.get('sourceLocator'))
    if rec['id'].startswith('T'):
        presentation = rec['views']['core']['presentation']
        sample = next(r for r in rows if r['transitionId'] == rec['id'])
        presentation['source'] = f"Kroeze et al.2026, arXiv2509.04416v2 Table{sample['table']} p{sample['pdfPhysicalPage']}"
        presentation['linewidth_FWHM'] = {'T1':'29.13(6) MHz','T2':'182.4(4) kHz','T3':'7.6(6) mHz','T4':'约17.9 mHz（理论/F口径待核）','T5':'479(16) kHz','T6':'11.5(14) MHz','T7':'11.5(14) MHz'}[rec['id']]
        if rec['id'] == 'T3':
            presentation['source'] += '；d为2026-09-08内部F级有效量，原始计算待补'
        if rec['id'] in ['T3','T4']:
            presentation['oscillator_strength_f'] = '未提供'
        if rec['id'] == 'T4':
            presentation.update(branching='F相关：HFS诱导E1与非E1衰变；分支比未提供', multipole='M2 激发 / HFS 诱导 E1 衰变',
                                forbidden_reason='电子J=0→2的E1禁戒；171Yb超精细混合可打开F相关E1通道，缺少适用矩阵元。8.9s为汇编理论采用值，非纯M2实测寿命。')
        if rec['id'] in ['T1','T5','T6','T7']:
            presentation['branching'] += '（理论分支比；非完整实测）'
        for field in ['oscillator_strength_f_num','d_num']:
            if field in rec['quantities'] and rec['quantities'][field]['value'] is not None:
                alias = 'oscillator_strength_f' if field.startswith('oscillator') else 'd_reduced_ea0'
                if alias in presentation:
                    presentation[alias] = str(rec['quantities'][field]['value'])
    else:
        for view in rec['views'].values():
            view['presentation']['source'] = '历史标度示意，非逐态文献值；d为内部记录' if rec['id']=='R2' else '历史标度示意；指定态/条件未验证，不能归为Peper或Ma的逐态测量'
    for view in rec['views'].values():
        if rec['id'] in ['T6','T7','R1','R2','R3','R6','R7']:
            view['presentation']['selection_check']=view['presentation'].get('selection_check','').replace('ΔL=+1','ΔL=−1')
        if rec['id']=='R5':
            view['presentation']['forbidden_reason']='理想纯J电子E1模型：J=0→2，约化矩阵元为零；不据此推断所有混合本征态/F通道均为零。'

# Energies use171Yb centers of gravity, not an unidentified NIST mixed-isotope level list.
by_term = {r['attributes']['term']: r for r in docs['levels']['records']}
direct = {'¹P₁':'T1','³P₁':'T2','³P₀':'T3','³P₂':'T4'}
for term, level in by_term.items():
    for field, q in level['quantities'].items():
        original = copy.deepcopy(q)
        if term == '¹S₀':
            q.update(sourceId='ref-01', sourceLocator='neutral171Yb ground-state energy reference definition',
                     evidenceKind='derived', reviewStatus='original-source-located', derivedFrom=['chosen ground-state zero'],
                     uncertainty=0, uncertaintyNote='exact reference zero by definition, not measured zero uncertainty',
                     conditions={'isotope':171,'auditDate':DATE}, convention='neutral171Yb ground-state reference')
            status = 'reference-definition'
        elif term in direct:
            parameter = 'wavenumber_vac' if field == 'energy_cm' else 'transition_energy'
            q.update(source_quantity(q,lookup[(direct[term],parameter)],field))
            q['convention'] = '171Yb hyperfine center-of-gravity relative to1S0'
            status = 'adopted-compilation'
        elif term in ['³D₁','³S₁']:
            transition = 'T5' if term=='³D₁' else 'T6'
            parameter = 'wavenumber_vac' if field=='energy_cm' else 'transition_energy'
            ground = lookup[('T3',parameter)]
            jump = lookup[(transition,parameter)]
            q.update(sourceId='ref-01', value=float(Decimal(ground['valueDecimal'])+Decimal(jump['valueDecimal'])),
                     uncertainty=math.hypot(float(ground['uncertaintyDecimal']),float(jump['uncertaintyDecimal'])),
                     uncertaintyNote='formal propagation of printed uncertainties, covariance unavailable; source calibration systematics not independently resolved',
                     sourceLocator=f"arXiv2509.04416v2 Table9 p24 + Table{jump['table']} p{jump['pdfPhysicalPage']}",
                     evidenceKind='derived', derivedFrom=['T3.frequency_THz',f'{transition}.frequency_THz'],
                     reviewStatus='original-source-located' if term=='³D₁' else 'conflict-unresolved',
                     conditions={'isotope':171,'auditDate':DATE,'referencePath':f'1S0->3P0->{term}',
                                 'sourceRecordIds':[ground['id'],jump['id']]},
                     convention='171Yb hyperfine-center-of-gravity; ground plus transition path')
            status = 'derived-compilation' if term=='³D₁' else 'derived-source-conflict'
            if term=='³S₁':
                q['conditions']['sourceConflict'] = 'T3+T6 and T4+T7 paths disagree by about150.389MHz (frequency) /146.816MHz (printed rounded wavenumbers); use documented3P0 path, no claim of global Ritz fit'
        else:
            q['reviewStatus'] = 'definition-needs-review'
            q['conditions'] = {'auditDate':DATE,'excludedFromValidatedPrediction':True,'stateBoundary':'Rydberg branch/threshold reference not established'}
            if q['value'] is not None:
                q.update(evidenceKind='scaling-estimate',modelId='legacy-rydberg-scaling-v1')
            status = 'quarantined-estimate-or-missing'
        note(f"levels/{level['id']}/{field}",original,q,status,'能级能量采用明确的171质心/路径；不同来源阈值或里德堡分支不强行拼接')
    if term=='³P₂':
        level['attributes']['lifetime']='约8.9 s（理论；F口径待核）'
    if term=='65³S₁':
        level['attributes']['lifetime']='历史标度估算；非逐态实测'
for group in docs['levels']['rydbergGroups']:
    group['ref'] = '历史标度示意；指定171Yb分支未验证'

hfs = read(ROOT/'data/literature/kroeze-2026/hyperfine-zeeman.json')
terms={'¹S₀':'1S0','³P₀':'3P0','³P₁':'3P1','³P₂':'3P2','³D₁':'3D1','¹P₁':'1P1','³S₁':'3S1'}
for term, entry in docs['hyperfine']['states'].items():
    original=copy.deepcopy(entry)
    if term in terms:
        row=next(r for r in hfs if r['parameter']==f'{terms[term]}:A_over_h')
        entry.update(sourceId='ref-01', sourceLocator='arXiv2509.04416v2 Table5 p21, '+row['parameter'],
                     reviewStatus='original-source-located', uncertainty=None if row['uncertaintyDecimal'] is None else float(row['uncertaintyDecimal']),
                     uncertaintyNote='printed compilation uncertainty; Birge ratio and primary measurement spread retained in extraction',
                     conditions={'isotope':171,'fieldRegime':'zero-field hyperfine / weak-field F basis','auditDate':DATE,'sourceRecord':row['id'],'sourceReferenceNumbers':row.get('sourceReferenceNumbers',[])},
                     convention='A/h in MHz; E_F/h=A/2*[F(F+1)-I(I+1)-J(J+1)], I=1/2; shifts derived from A')
        if term in ['¹S₀','³P₀']:
            entry['uncertaintyNote']='J=0 diagonal first-order magnetic-dipole hyperfine A set0 by definition; not absence of off-diagonal HFI'
        if term=='³S₁':
            entry['conditions']['birgeRatio']=3.1
            entry['conditions']['evidenceType']='weighted compilation, not Qiao single measurement'
        elif 'birgeRatio' in row:
            entry['conditions']['birgeRatio']=row['birgeRatio']
        status='adopted-compilation'
    else:
        entry.update(reviewStatus='definition-needs-review',sourceLocator='historical A/nstar^3 estimate; not a located171Yb state-resolved measurement',
                     conditions={'auditDate':DATE,'excludedFromValidatedPrediction':True})
        status='quarantined-estimate'
    note(f'hyperfine/{term}',original,entry,status,'不更改已保存65S分支计算；低态A值补原表和不确定度，高n标度隔离')
saved=docs['hyperfine']['saved65S']
saved['reviewStatus']='definition-needs-review'
saved['conditions']['electricField_V_cm']=0
saved['conditionsNote']='Original R005 validation2026-10-08 and saved notebook were read without execution: B=0,E=0,171Yb,n65,L0; original artifact identity checked, not a new MQDT calculation or independent model validation.'
saved['physicalValidation']='saved CSV,notebook and validation identity/configuration checked; original code revision and independent branch/model uncertainty remain unestablished'
note('hyperfine/saved65S',old['hyperfine']['saved65S'],saved,'pending-internal-artifact','原CSV和全部数值不变；文件存在不等于branch/model已验证')

bibliography=read(ROOT/'references/bibliography-audit.json')
sources=docs['sources']
for source in sources['references']+sources['sources']:
    b=next(b for b in bibliography['records'] if b['oldSourceId']==source['id'])
    source.update(identityStatus=b['identityStatus'],reviewedAt=DATE,bibliographyAudit='references/bibliography-audit.json',
                  numericalValidation=b.get('numericalValidation'),evidenceNotes=b['evidenceNotes'],year=b.get('year'))
    if b['identityStatus'].startswith('verified'):
        source.update(detail=b['exactTitle'],authors=b['authors'],doi=b['doi'],arxivVersion=b['arxivVersion'],
                      publication=b['publication'],url=next((url for url in b['verifiedURLs'] if '/abs/' in url),b['verifiedURLs'][0]),
                      reviewStatus='original-source-located',rightsStatus='local-research-copy; redistribution-not-assumed')
    elif source['id']=='ref-13':
        source.update(detail='原Fisk条目身份未确认；TIM46,457(1997)不可作已核准书目',reviewStatus='conflict-unresolved',url=None)
    else:
        source['reviewStatus']='definition-needs-review'
    if source['id']=='internal-t2-calibration':
        source['detail']='历史内部校准0.543 ea0已停用为默认值；默认采用Kroeze v2 Table10的0.5398(6) ea0。内部校准依据未找到。'
        source['conflicts'][0]['resolution']='2026-10-29 default switched to source-reported0.5398(6); old internal value retained only in archive'
    if source['id']=='this-work-hyperfine-65s':
        source.update(detail='原R005 Notebook、validation和保存CSV已只读核对；B=0,E=0。未重算，未建立独立实验验证或总模型误差。',
            artifactLocator='data/literature/rydberg-audit/internal-evidence/05.21_yb171_65s_hyperfine.ipynb + 05.21_yb171_65s_hyperfine_validation.json + 05.21_yb171_65s_hyperfine.csv',
            artifactManifest='data/literature/rydberg-audit/internal-evidence-manifest.json',
            savedNotebookSha256='ab624645b2003083565484ad405f8024f09d992ac80300384ff9e52e2df14791',
            savedValidationSha256='b177d7ebc6fc422839d3f1025915bcb67b2fcebf367ce5557bb6cc96b4689d16',
            physicalValidation='saved artifact integrity and original configuration checked; no new calculation or independent physical validation')
for candidate in bibliography['supplementalOriginalReferences']:
    sources['references'].append(dict(id=candidate['candidateId'],referenceNumber=len(sources['references'])+1,
        title=', '.join(candidate['authors'][:3]) or candidate['candidateId'],detail=candidate['exactTitle'],
        publication=candidate['publication'],url=next(iter(candidate['verifiedURLs']),None),doi=candidate['doi'],
        authors=candidate['authors'],year=candidate['year'],arxivVersion=candidate.get('arxivVersion'),identityStatus=candidate['identityStatus'],
        reviewStatus='original-source-located' if candidate['identityStatus'].startswith('verified') else 'definition-needs-review',
        reviewedAt=DATE,rightsStatus='research-index-only; redistribution-not-assumed',
        numericalValidation='see data/literature; identity alone is not numerical validation'))

est=docs['estimates']
est.update(reviewStatus='conflict-unresolved',auditDate=DATE,
           scope='Historical single-channel illustration only. Unsupported quantum defects, lifetime anchors and invalid C6 n57 mapping are quarantined; no state-resolved MQDT prediction, no validated blockade radius.',
           publicOutputPolicy={'lifetime_us':'suppressed-invalid-anchor','C6_ghz_um6':'suppressed-invalid-anchor','blockade_um':'suppressed-invalid-anchor'})
est['c6Reference'].update(anchorMapping='invalid: n57 in Peper Fig6 refers to comparison Rb, not the171Yb state',excludeFromValidated=True,
                        trueLiteratureState='171Yb triplet-connected nu=54.28,L=0,F=1/2,mF=-1/2,B=4.88(6)G,theta=pi/2',sourceId='ref-02',sourceLocator='published PDF p8 Fig6')
est['lifetimeReference'].update(excludeFromValidated=True,note='6s7s low-state lifetime is not a verified high-n Rydberg lifetime scaling anchor; temperature/BBR/branch not established')
for defect in est['quantumDefects']:
    defect.update(reviewStatus='definition-needs-review',excludedFromValidatedPrediction=True,auditDate=DATE)
    if defect['series'] in ['6sns ¹S₀','6snp ¹P₁']:
        defect.update(isotope=174,reviewStatus='original-source-located',source='Halter arXiv2211.04748v2; 174Yb comparator, not171Yb default',
                      note='174Yb原文参数；不能移植为171Yb逐态量子亏损。'+defect['note'])
    elif defect['series']=='6snf ³F₂,₃,₄':
        defect.update(source='历史参数0.02未获支持；Kuroda不能支持该171Yb f态单一量子亏损',note='Kuroda的约0.026对应g态；f态需多通道/版本/同位素说明，旧0.02仅归档示意。')
    else:
        defect['source']='历史近似参数；未找到该数值的指定171Yb态原始证据'
        if defect['series']=='6sns ³S₁': defect['note']='旧delta=2.523没有指定171Yb triplet-connected分支证据；不以Peper比较Rb的n57背书。'
est['ionizationProvenance']={'sourceId':'ref-02','locator':'published supplement pp5-9; fitted171Yb Fcore0/1 thresholds',
    'thresholdUncertainties':'not supplied for these last digits in extracted parameter tables',
    'centroid_cm':50443.11203325,'sourceConflict':'does not equal Kroeze Table2 compilation centroid50443.0676(12); do not splice references'}
est['constantProvenance'].update({name:{'sourceId':'ref-01','sourceLocator':'Kroeze v2 Table2 p20,171Yb compiled centroid; RB=4.7',
    'uncertainty':uncertainty,'evidenceType':'compilation with mass-scaled174Yb input; not one direct171Yb measurement',
    'thresholdConflict':'Peper Fcore-weighted centroid differs; reference/calibration reconciliation pending'}
    for name,uncertainty in [('E_I_CM',.0012),('E_I_EV',.00000015)]})
est['constantProvenance']['R_INF']={'sourceVersion':'CODATA2018','sourceUrl':'https://physics.nist.gov/cuu/pdf/all_2018.pdf','sourceLocator':'p1 Rydberg constant10973731.568160(21)m^-1; divide100 forcm^-1','uncertainty':.00000021,'modelBoundary':'legacy scaling still usesRinf; not mass-corrected171MQDT'}
note('estimates',old['estimates'],est,'quarantined-model','保留全部旧标度参数供追溯，但撤回错误文献背书；停止把不合法锚点外推量作为可用寿命/C6/阻塞预测')

docs['dataset'].update(datasetVersion='2026.10.29.1',sourceDate=DATE,
    reviewStatus='field-complete-source-audit; adopted-compilation plus explicit conflicts and quarantined estimates',
    auditReport='references/audits/data-source-audit-2026-10-29.md',
    physicalValidation='not established for all records: compilation, theory, source conflicts, missing originals and internal models are explicitly distinguished')

if '--apply' not in sys.argv:
    print(f'{len(audit)} audit records prepared; run with --apply to write the explicitly dated reconciliation')
    sys.exit(0)
for name,document in docs.items():
    write(ROOT/'data'/f'{name}.json',document)
write(HERE/'field-audit.json',{'schemaVersion':1,'date':DATE,'scope':'all canonical transition/level quantities, allHFS records and entire legacy model; bibliography separately indexed',
    'statusMeaning':'adopted compilation is not all-primary-experiments verified; missing/error/model limits remain visible',
    'records':audit})
print(f'Applied dated source reconciliation; {len(audit)} evidence records written.')
