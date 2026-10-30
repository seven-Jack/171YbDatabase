"""Build the local-only literature index without touching original paper files."""
from pathlib import Path
import csv
import hashlib
import json
import re
import shutil
import subprocess
from datetime import datetime
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / 'references'
def read(path): return json.loads(path.read_text())
def write(path, data): path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
bib = read(REF/'bibliography-audit.json')
downloads = read(REF/'download-validation.json')
inventory = read(REF/'local-library-inventory.json')
catalog = read(ROOT/'data/sources.json')
manifest = read(ROOT/'data/literature/rydberg-audit/source-manifest.json')
received_file=REF/'received-downloads-20261030.json'
received=read(received_file)['documents'] if received_file.exists() else []
documents = {}

def add_document(path, source_id=None, origin=None, version=None, expected=None, url=None):
    path = Path(path)
    if not path.is_absolute(): path = ROOT/path
    checksum=digest(path)
    if expected and checksum!=expected: raise ValueError(f'Original/source hash changed: {path}')
    if checksum in documents:
        doc=documents[checksum]
        if source_id and source_id not in doc['sourceIds']: doc['sourceIds'].append(source_id)
        if origin and origin not in doc['originalPaths']: doc['originalPaths'].append(origin)
        if url and url not in doc['urls']: doc['urls'].append(url)
        return
    if path.parent != REF/'papers':
        preferred='2024_Peper_171Yb_Spectroscopy-modeling_local-supplement.pdf' if 'resubmission_supp' in path.name else {
            'ref-02':'2025_Peper_171Yb_Spectroscopy-modeling_published.pdf',
            'ref-07':'2022_Wilson_174Yb_Trapping-Rydberg-atoms_published.pdf'
        }.get(source_id,path.name)
        target=REF/'papers'/preferred
        if target.exists() and digest(target)!=checksum:
            target=target.with_name(target.stem+'_'+checksum[:8]+target.suffix)
        if not target.exists(): shutil.copy2(path,target)
    else: target=path
    if not target.read_bytes().startswith(b'%PDF-'): raise ValueError(f'not PDF: {target}')
    info=subprocess.check_output(['pdfinfo',str(target)],text=True)
    pages=int(re.search(r'^Pages:\s+(\d+)',info,re.M)[1])
    header=subprocess.check_output(['pdftotext','-f','1','-l','1',str(target),'-'],text=True)
    documents[checksum]={'sha256':checksum,'path':str(target.relative_to(ROOT)),'bytes':target.stat().st_size,
        'pages':pages,'sourceIds':[source_id] if source_id else [],'originalPaths':[origin] if origin else [],
        'urls':[url] if url else [],'versionNote':version,'validation':'PDF header,parse,pagecount,first-page identity and SHA256 checked',
        'rights':'local research evidence only; no redistribution permission inferred'}

for source in bib['records']+bib['supplementalOriginalReferences']:
    source_id=source.get('oldSourceId') or source['candidateId']
    for item in source.get('localArtifacts',[]):
        add_document(item['path'],source_id,origin=item['path'],version=source.get('arxivVersion') or source.get('publication'),expected=item['sha256'])
for item in downloads:
    if item['status']=='downloaded':
        path=item['path']
        source_id=next((s.get('oldSourceId') or s.get('candidateId') for s in bib['records']+bib['supplementalOriginalReferences']
            if s.get('oaPdfUrl')==item['url']),None)
        if not source_id:
            source_id=next((key for marker,key in [('Halter','ref-10'),('1999_Porsev','porsev-1999-pra'),('2003_Porsev','porsev-2004-pra'),
                ('Beloy','beloy-2012-pra'),('Bowers','bowers-1996-pra'),('Okuno','ref-06'),('Burgers','ref-09'),('Lehec','ref-11')]
                if marker in path),None)
        add_document(path,source_id,version=item.get('versionNote'),expected=item['sha256'],url=item['url'])
for item in manifest:
    source_id={'peper-2025':'ref-02','peper-supplement':'ref-02','kuroda-2025':'ref-03','kuroda-2025-arxiv-v1':'ref-03',
               'chen-2022':'ref-15','wilson-2022':'ref-07','muniz-2025':'ref-04','halter-2022-v2':'ref-10',
               'lehec-2018-arxiv-v2':'ref-11','okuno-2022-arxiv-v1':'ref-06','burgers-2021-arxiv-v1':'ref-09',
               'halter-2023-arxiv-v2':'ref-10','kroeze-2026-v2':'ref-01'}.get(item['id'],item['id'])
    add_document(item['originalPath'],source_id,origin=item['originalPath'],version=item.get('version'),expected=item['sha256'],url=item.get('url'))
for item in received:
    add_document(item['path'],item['sourceId'],origin=item['path'],version=item['version'],expected=item['sha256'],url=item.get('url'))

indexed=[]
for source in catalog['references']+catalog['sources']:
    indexed.append({**source,'documents':[d['path'] for d in documents.values() if source['id'] in d['sourceIds']],
                    'documentHashes':[d['sha256'] for d in documents.values() if source['id'] in d['sourceIds']]})
indexed.append({'id':'fang-2001','title':'D.-W. Fang et al.','detail':'Radiative lifetimes of Rydberg state of ytterbium',
    'authors':['Da-wei Fang','Wei-jun Xie','Yi Zhang','Xiao Hu','Yu-yan Liu'],'publication':'JQSRT69,469-473(2001)',
    'doi':'10.1016/S0022-4073(00)00096-0','url':'https://doi.org/10.1016/S0022-4073(00)00096-0',
    'identityStatus':'local-original-pdf-located','referenceRole':'supplemental lifetime evidence; isotope not resolved; not a canonical171Yb default',
    'reviewStatus':'original-source-located','rightsStatus':'local-research-copy; redistribution-not-assumed',
    'documents':[d['path'] for d in documents.values() if 'fang-2001' in d['sourceIds']],
    'documentHashes':[d['sha256'] for d in documents.values() if 'fang-2001' in d['sourceIds']]})
checked=datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(timespec='seconds')
result={'schemaVersion':1,'checkedAt':checked,'policy':'local-only source archive; original paper library unmodified; bibliography identity and numeric verification are separate',
        'counts':{'sourceRecords':len(indexed),'canonicalSourceRecords':len(catalog['references'])+len(catalog['sources']),'supplementalOnlySources':1,'pdfFiles':len(documents),'newPublicDownloads':sum(d['status']=='downloaded' for d in downloads),'userReceivedDownloads':len(received)},
        'sources':indexed,'documents':list(documents.values())}
write(REF/'index.json',result)

integrity=[]
for item in inventory:
    path=Path(item['path'])
    now=digest(path) if path.exists() else None
    integrity.append({'path':str(path),'beforeSha256':item['sha256'],'afterSha256':now,'unchanged':now==item['sha256']})
if not all(x['unchanged'] for x in integrity): raise ValueError('Original library changed during audit; inspect integrity report')
write(REF/'original-library-integrity.json',{'checkedAt':checked,'files':integrity,'allUnchanged':True})

missing=[]
priority_file=REF/'missing-downloads-prioritized-20261030.json'
priorities={item['sourceId']:item for item in read(priority_file)['items']} if priority_file.exists() else {}
for source in indexed:
    if source['id'] in {'legacy-levels','legacy-hfs','legacy-scaling','internal-t2-calibration','internal-t3-20260908','this-work-hyperfine-65s','ref-17','ref-14'}: continue
    if not source['documents'] or source.get('identityStatus','').startswith('unresolved'):
        missing.append({'sourceId':source['id'],'title':source['detail'],'publication':source.get('publication'),'doi':source.get('doi'),
            'url':source.get('url') or priorities.get(source['id'],{}).get('downloadUrl'),'reason':'identity-unresolved' if source['id']=='ref-13' else 'no-validated-fulltext-in-this-audit',
            'originalPriorityNumber':priorities.get(source['id'],{}).get('priorityRank'),
            'neededFor':priorities.get(source['id'],{}).get('checkData') or next((s['referenceRole'] for s in bib['records']+bib['supplementalOriginalReferences'] if (s.get('oldSourceId') or s.get('candidateId'))==source['id']),'source-chain completion')})
write(REF/'missing-downloads.json',{'checkedAt':checked,'meaning':'Not obtained in this audit; not a claim that no lawful OA version exists. No paywall or access-control bypass attempted.','items':missing})
lines=['# 待补充原文清单','',f'核查截止：{checked}。优先从 DOI / 出版社 / 作者机构获取。列入清单表示本次未取得可核验全文，并不表示一定收费。已取得预印本或正式版的文章不重复列入。',
    '', '已收到的用户下载原件按编号、题名、DOI和SHA256登记；未取得的项目继续保留。当前清单针对前一批已定位缺口，其他原始及方法来源仍见依赖队列。',
    '', '| 来源 ID | 文献 | 用途 | 链接 / 状态 |','|---|---|---|---|']
for item in missing:
    url=('https://doi.org/'+item['doi']) if item['doi'] else item['url']
    link=f"[原文入口]({url})" if url else '标识符仍待核对'
    lines.append(f"| {item['sourceId']} | {item['title']}；{item.get('publication') or ''} | {item['neededFor']} | {link}；{item['reason']} |")
lines+=['','内部待补材料：T3 有效 F 约化矩阵元、R2 d=0.0376 ea₀ 的 Notebook/Run/版本与分支证据；65S 保存 CSV 对应的原始输入哈希及模型误差。文献不能替代这些内部证据。','',
        '完整汇编依赖队列另见 `primary-source-queue.json`；它还包含未逐一获取的早期频率、寿命和 HFS 原始文献。该队列与本表的已核对书目清单用途不同。']
(REF/'missing-downloads.md').write_text('\n'.join(lines)+'\n')
with (REF/'index.csv').open('w',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=['id','referenceNumber','title','doi','publication','documents','identityStatus'])
    writer.writeheader()
    for source in indexed: writer.writerow({key:('; '.join(source['documents']) if key=='documents' else source.get(key)) for key in writer.fieldnames})
bibtex=[]
for source in indexed:
    if source.get('referenceNumber') and source.get('doi'):
        bibtex.append('@misc{'+source['id']+',\n  title = {'+source['detail']+'},\n  author = {'+' and '.join(source.get('authors',[]))+'},\n  year = {'+str(source.get('year') or '')+'},\n  doi = {'+source['doi']+'},\n  howpublished = {'+(source.get('publication') or '')+'}\n}')
(REF/'references.bib').write_text('\n\n'.join(bibtex)+'\n')
print(json.dumps(result['counts'],ensure_ascii=False))
