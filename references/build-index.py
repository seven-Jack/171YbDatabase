"""Check literature metadata without writing; use --write to update exports.

Requires Python 3.9+. Originals are optional local evidence and are never copied.
Missing bytes are unavailable; present bytes that contradict a fingerprint fail.
"""
from pathlib import Path
from datetime import date, datetime
import argparse
import csv
import hashlib
import io
import json
import os
import re
import shutil
import sys

SUPPLEMENTS = ('clock-rabi-sources-20261030.json', 'rabi-crosscheck-sources-20261031.json',
               'decay-sources-20261104.json')
OUTPUTS = ('index.json', 'index.csv', 'references.bib', 'original-library-integrity.json',
           'missing-downloads.json', 'missing-downloads.md')
CSV_FIELDS = ['id', 'referenceNumber', 'title', 'doi', 'publication', 'documents', 'identityStatus']
QUEUE_FIELDS = ['kroezeReferenceNumber', 'resolvedSourceId', 'doi', 'status',
                'citationAsExtracted', 'affectedFields', 'localDocuments']
TRANSACTION = 'local-only/reference-index-transaction'
MANIFEST_IDS = {
    'peper-2025': 'ref-02', 'peper-supplement': 'ref-02', 'kuroda-2025': 'ref-03',
    'kuroda-2025-arxiv-v1': 'ref-03', 'chen-2022': 'ref-15', 'wilson-2022': 'ref-07',
    'muniz-2025': 'ref-04', 'halter-2022-v2': 'ref-10', 'lehec-2018-arxiv-v2': 'ref-11',
    'okuno-2022-arxiv-v1': 'ref-06', 'burgers-2021-arxiv-v1': 'ref-09',
    'halter-2023-arxiv-v2': 'ref-10', 'kroeze-2026-v2': 'ref-01',
}
VERSION_BOUNDARY = ('Historical source-level note retained from the pre-archive index; '
                    'the actual PDF version identity was not re-reviewed in this archive step.')


def read(path, default=None):
    if not path.exists() and default is not None:
        return default
    return json.loads(path.read_text())


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()


def verify(path, expected, size=None, pdf=False):
    if not path.exists():
        return {'status': 'unavailable', 'verified': False, 'path': str(path)}
    if digest(path) != expected:
        raise ValueError(f'SHA-256 mismatch: {path}')
    if size is not None and path.stat().st_size != size:
        raise ValueError(f'Registered byte size mismatch: {path}')
    if pdf:
        with path.open('rb') as stream:
            if stream.read(5) != b'%PDF-':
                raise ValueError(f'Not a PDF: {path}')
    return {'status': 'verified', 'verified': True, 'path': str(path)}


def load_paper_aliases(root):
    """Resolve reviewed file renames without rewriting historical evidence."""
    manifest = read(root / 'references/paper-path-aliases.json',
                    {'schemaVersion': 1, 'aliases': []})
    if (not isinstance(manifest, dict) or manifest.get('schemaVersion') != 1
            or not isinstance(manifest.get('aliases'), list)):
        raise ValueError('Invalid paper alias manifest')
    if 'checkedOn' in manifest:
        try:
            if not isinstance(manifest['checkedOn'], str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', manifest['checkedOn']):
                raise ValueError('Expected ISO date')
            date.fromisoformat(manifest['checkedOn'])
        except ValueError as error:
            raise ValueError('Invalid paper alias audit date') from error
    aliases, targets, hashes = {}, set(), set()
    for row in manifest['aliases']:
        if not isinstance(row, dict):
            raise ValueError('Invalid paper alias record')
        for key in ('oldPath', 'path'):
            value = row.get(key)
            if (not isinstance(value, str) or not value.startswith('references/papers/')
                    or '\\' in value or ':' in value or any(ord(c) < 32 for c in value)
                    or any(part in ('', '.', '..') for part in value.split('/'))):
                raise ValueError('Unsafe paper alias path')
            try:
                (root / value).resolve().relative_to((root / 'references/papers').resolve())
            except ValueError as error:
                raise ValueError('Unsafe paper alias path escapes papers directory') from error
        if not row['path'].endswith('.pdf') or row['oldPath'] == row['path']:
            raise ValueError('Paper alias target must be a distinct PDF path')
        if (not isinstance(row.get('sha256'), str)
                or not re.fullmatch(r'[a-f0-9]{64}', row['sha256'])
                or any(type(row.get(key)) is not int or row[key] <= 0 for key in ('bytes', 'pages'))):
            raise ValueError('Invalid paper alias fingerprint or dimensions')
        if row['oldPath'] in aliases or row['path'] in targets or row['sha256'] in hashes:
            raise ValueError('Duplicate or conflicting paper alias')
        if 'identityReview' in row and not isinstance(row['identityReview'], dict):
            raise ValueError('Invalid paper alias identity review')
        for key in ('versionNote', 'documentType'):
            if key in row and (not isinstance(row[key], str) or not row[key]):
                raise ValueError('Invalid paper alias version metadata')
        aliases[row['oldPath']] = row
        targets.add(row['path'])
        hashes.add(row['sha256'])
    if targets.intersection(aliases):
        raise ValueError('Paper alias chains or cycles are not allowed')
    return manifest, aliases


def apply_paper_aliases(root, registered, aliases):
    """Bind every alias to registered content and check both old and new bytes."""
    by_path = {record['path']: digest for digest, record in registered.items()}
    for row in aliases.values():
        expected = row['sha256']
        if expected not in registered:
            raise ValueError('Paper alias SHA-256 is not registered')
        record = registered[expected]
        if record['path'] not in (row['oldPath'], row['path']):
            raise ValueError('Paper alias does not match registered document path')
        if any(by_path.get(p, expected) != expected for p in (row['oldPath'], row['path'])):
            raise ValueError('Paper alias SHA-256 conflicts with registered path')
        if any(record[key] != row[key] for key in ('bytes', 'pages')):
            raise ValueError('Paper alias dimensions conflict with registered document')
        # A clean target must never conceal a tampered file reusing its old name.
        for relative in (row['oldPath'], row['path']):
            verify(root / relative, expected, row['bytes'], pdf=True)
        record['path'] = row['path']
        record['aliases'] = list(dict.fromkeys(record.get('aliases', []) + [row['oldPath']]))
        if 'versionNote' in row:
            record['historicalVersionNote'] = record.get('versionNote')
        for key in ('documentType', 'versionNote'):
            if key in row:
                record[key] = row[key]
        if 'identityReview' in row:
            record['identityReview'] = {**record.get('identityReview', {}), **row['identityReview']}


def csv_bytes(rows, fields):
    stream = io.StringIO(newline='')
    writer = csv.DictWriter(stream, fieldnames=fields, lineterminator='\n')
    writer.writeheader()
    for row in rows:
        writer.writerow({key: '; '.join(row.get(key, [])) if isinstance(row.get(key), list)
                         else row.get(key) for key in fields})
    return stream.getvalue().encode()


def check_queue(ref, sources, aliases=None):
    """Validate the independently maintained queue; never rewrite its audit states."""
    queue = read(ref / 'primary-source-queue.json')
    rows = queue['items']
    numbers = [row['kroezeReferenceNumber'] for row in rows]
    if queue['count'] != len(rows) or len(numbers) != len(set(numbers)):
        raise ValueError('Primary-source queue count or reference identity mismatch')
    with (ref / 'primary-source-queue.csv').open(newline='') as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames != QUEUE_FIELDS:
            raise ValueError('Primary-source queue CSV columns mismatch')
        actual = list(reader)
    expected = list(csv.DictReader(io.StringIO(csv_bytes(rows, QUEUE_FIELDS).decode())))
    if actual != expected:
        raise ValueError('Primary-source queue JSON/CSV mismatch')
    markdown = re.findall(r'^\| \[(\d+)\] \| (.*?) \| (.*?) \|\s*$',
                          (ref / 'primary-source-queue.md').read_text(), re.M)
    if [int(row[0]) for row in markdown] != numbers:
        raise ValueError('Primary-source queue Markdown numbering/order mismatch')
    by_id = {source['id']: source for source in sources}
    labels = {
        'primary-fulltext-or-identity-still-needed': '仍待补原文/身份',
        'local-fulltext-indexed;field-specific-validation-still-required': '已索引',
        'original-local-PDF-read;all-numbered-tables-extracted;field-specific-applicability-audited': '本轮原文/表格已核对',
        'original-local-PDF-read;clock-rate-definition-audited': '原文已读、钟跃迁率定义已核对',
    }
    for row, (_, title, status) in zip(rows, markdown):
        source = by_id.get(row.get('resolvedSourceId'))
        expected_title = source['detail'] if source else row['citationAsExtracted']
        if expected_title not in title or labels.get(row['status'], row['status']) not in status:
            raise ValueError(f'Primary-source queue Markdown text/status mismatch: [{row["kroezeReferenceNumber"]}]')
        if row.get('resolvedSourceId') and source is None:
            raise ValueError('Primary-source queue refers to an unregistered source')
        if source and row.get('doi') and row['doi'].lower() != (source.get('doi') or '').lower():
            raise ValueError('Primary-source queue DOI mismatch')
        local_documents = {aliases.get(value, {}).get('path', value)
                           for value in row.get('localDocuments', [])} if aliases else set(row.get('localDocuments', []))
        if source and not local_documents <= set(source['documents']):
            raise ValueError('Primary-source queue document/source mapping mismatch')
    return len(rows)


def build_outputs(root, checked_at=None):
    ref = root / 'references'
    alias_manifest, aliases = load_paper_aliases(root)
    bib = read(ref / 'bibliography-audit.json')
    downloads = read(ref / 'download-validation.json')
    inventory = read(ref / 'local-library-inventory.json')
    catalog = read(root / 'data/sources.json')
    manifest = read(root / 'data/literature/rydberg-audit/source-manifest.json')
    received = read(ref / 'received-downloads-20261030.json', {'documents': []})['documents']
    metadata = read(ref / 'document-metadata-20261031.json')
    supplements = [read(ref / name, {'sources': [], 'documents': [], 'attachments': []}) for name in SUPPLEMENTS]
    checked = checked_at or max([metadata['checkedOn'], alias_manifest.get('checkedOn', '') if aliases else '']
                                + [s.get('checkedOn', '') for s in supplements])
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2}))?', checked):
        raise ValueError('Use an ISO date or timezone-qualified timestamp for --checked-at')
    try:
        if 'T' in checked:
            datetime.fromisoformat(checked.replace('Z', '+00:00'))
            if not checked.endswith('Z') and int(checked[-2:]) >= 60:
                raise ValueError('Timezone minutes must be less than 60')
        else:
            date.fromisoformat(checked)
    except ValueError as error:
        raise ValueError(f'Invalid audit date/time for --checked-at: {checked}') from error
    registered = {doc['sha256']: {**doc, 'versionNoteBoundary': VERSION_BOUNDARY} for doc in metadata['documents']}
    for supplement in supplements:
        for doc in supplement['documents']:
            prior = registered.get(doc['sha256'])
            if prior and any(prior.get(k) != doc.get(k) for k in ('path', 'bytes', 'pages')):
                raise ValueError(f'Conflicting registered document metadata: {doc["path"]}')
            registered[doc['sha256']] = {**(prior or {}), **doc}
    apply_paper_aliases(root, registered, aliases)
    documents = {}

    def add_document(path, source_id=None, origin=None, version=None, expected=None, url=None):
        if not expected or not re.fullmatch(r'[a-f0-9]{64}', expected):
            raise ValueError(f'Missing/invalid registered SHA-256: {path}')
        if expected not in registered:
            raise ValueError(f'Missing document metadata; register before generating: {path}')
        record = registered[expected]
        if not record['path'].startswith('references/papers/') or '..' in Path(record['path']).parts:
            raise ValueError('Registered paper path must stay inside references/papers')
        if record.get('bytes', 0) <= 0 or record.get('pages', 0) <= 0:
            raise ValueError('Registered byte and page counts must be positive')
        alias = aliases.get(str(path))
        if alias:
            if alias['sha256'] != expected:
                raise ValueError('Paper alias SHA-256 differs from requested source fingerprint')
            path = alias['path']
        path = Path(path)
        verify(path if path.is_absolute() else root / path, expected, pdf=True)
        if expected not in documents:
            documents[expected] = {
                'sha256': expected, 'path': record['path'], 'bytes': record['bytes'], 'pages': record['pages'],
                'sourceIds': [], 'originalPaths': [], 'urls': [], 'versionNote': record.get('versionNote') or version,
                'validation': 'Registered metadata; current local SHA-256 and PDF-header availability is reported by --check. Title/DOI identity review is separate and is not inferred automatically.',
                'rights': 'local research evidence only; no redistribution permission inferred',
            }
            for key in ('versionNoteBoundary', 'historicalVersionNote', 'aliases', 'doi', 'parentArticleDoi', 'documentType', 'identityReview'):
                if key in record:
                    documents[expected][key] = record[key]
        doc = documents[expected]
        for key, value in [('sourceIds', source_id), ('originalPaths', origin), ('urls', url)]:
            if value and value not in doc[key]:
                doc[key].append(value)

    for source in bib['records'] + bib['supplementalOriginalReferences']:
        source_id = source.get('oldSourceId') or source['candidateId']
        for item in source.get('localArtifacts', []):
            add_document(item['path'], source_id, origin=item['path'], expected=item['sha256'],
                         version=source.get('arxivVersion') or source.get('publication'))
    for item in downloads:
        if item['status'] != 'downloaded':
            continue
        source_id = next((s.get('oldSourceId') or s.get('candidateId')
                          for s in bib['records'] + bib['supplementalOriginalReferences']
                          if s.get('oaPdfUrl') == item['url']), None)
        if not source_id:
            source_id = next((key for marker, key in [('Halter', 'ref-10'), ('1999_Porsev', 'porsev-1999-pra'),
                            ('2003_Porsev', 'porsev-2004-pra'), ('Beloy', 'beloy-2012-pra'), ('Bowers', 'bowers-1996-pra'),
                            ('Okuno', 'ref-06'), ('Burgers', 'ref-09'), ('Lehec', 'ref-11')] if marker in item['path']), None)
        add_document(item['path'], source_id, expected=item['sha256'], version=item.get('versionNote'), url=item['url'])
    for item in manifest:
        add_document(item['originalPath'], MANIFEST_IDS.get(item['id'], item['id']), origin=item['originalPath'],
                     expected=item['sha256'], version=item.get('version'), url=item.get('url'))
    for item in received:
        add_document(item['path'], item['sourceId'], origin=item['path'], expected=item['sha256'],
                     version=item['version'], url=item.get('url'))
    base_hashes = set(documents)
    for supplement in supplements:
        for item in supplement['documents']:
            for source_id in item['sourceIds']:
                for url in item.get('urls') or [None]:
                    add_document(item['path'], source_id, expected=item['sha256'], version=item.get('versionNote'), url=url)
    sources = catalog['references'] + catalog['sources'] + [{
        'id': 'fang-2001', 'title': 'D.-W. Fang et al.', 'detail': 'Radiative lifetimes of Rydberg state of ytterbium',
        'authors': ['Da-wei Fang', 'Wei-jun Xie', 'Yi Zhang', 'Xiao Hu', 'Yu-yan Liu'], 'year': 2001,
        'publication': 'JQSRT69,469-473(2001)', 'doi': '10.1016/S0022-4073(00)00096-0',
        'url': 'https://doi.org/10.1016/S0022-4073(00)00096-0', 'identityStatus': 'local-original-pdf-located',
        'referenceRole': 'supplemental lifetime evidence; isotope not resolved; not a canonical171Yb default',
        'reviewStatus': 'original-source-located', 'rightsStatus': 'local-research-copy; redistribution-not-assumed',
    }] + [source for supplement in supplements for source in supplement['sources']]
    ids = [source['id'] for source in sources]
    dois = [source['doi'].lower() for source in sources if source.get('doi')]
    if len(ids) != len(set(ids)) or len(dois) != len(set(dois)):
        raise ValueError('Duplicate registered source identity or DOI')
    for doc in documents.values():
        if not doc['sourceIds'] or not set(doc['sourceIds']) <= set(ids):
            raise ValueError(f'Document source is not registered: {doc["path"]}')
    indexed = [{**source, 'documents': [d['path'] for d in documents.values() if source['id'] in d['sourceIds']],
                'documentHashes': [d['sha256'] for d in documents.values() if source['id'] in d['sourceIds']]}
               for source in sources]
    local = [verify(root / d['path'], d['sha256'], d['bytes'], pdf=True) for d in documents.values()]
    originals = [verify(Path(item['path']), item['sha256']) for item in inventory]
    attachments = [verify(root / item['path'], item['sha256'], item.get('bytes'))
                   for s in supplements for item in s.get('attachments', [])]
    known_paths = {d['path'] for d in documents.values()} | set(aliases)
    unregistered = sorted(str(p.relative_to(root)) for p in (ref / 'papers').glob('*.pdf')
                          if str(p.relative_to(root)) not in known_paths)
    if unregistered:
        raise ValueError('Unregistered local PDF files: ' + ', '.join(unregistered))
    queue_count = check_queue(ref, indexed, aliases)
    counts = {'sourceRecords': len(indexed), 'canonicalSourceRecords': len(catalog['references']) + len(catalog['sources']),
              'supplementalOnlySources': 1 + sum(len(s['sources']) for s in supplements), 'pdfFiles': len(documents),
              'historicalDownloadRecords': sum(d['status'] == 'downloaded' for d in downloads),
              'registeredSupplementalPdfFiles': len(set(documents) - base_hashes),
              'userReceivedDownloads': len(received)}
    result = {'schemaVersion': 2, 'checkedAt': checked,
              'policy': 'Registered source metadata and expected fingerprints; originals remain local. Current byte availability is reported separately by --check; identity and numerical validation are separate.',
              'counts': counts, 'sources': indexed, 'documents': list(documents.values())}
    priorities = {row['sourceId']: row for row in read(ref / 'missing-downloads-prioritized-20261030.json', {'items': []})['items']}
    missing = []
    excluded = {'legacy-levels', 'legacy-hfs', 'legacy-scaling', 'internal-t2-calibration', 'internal-t3-20260908',
                'this-work-hyperfine-65s', 'ref-17', 'ref-14'}
    for source in indexed:
        if source['id'] in excluded or (source['documents'] and not source.get('identityStatus', '').startswith('unresolved')):
            continue
        priority = priorities.get(source['id'], {})
        missing.append({'sourceId': source['id'], 'title': source['detail'], 'publication': source.get('publication'),
                        'doi': source.get('doi'), 'url': source.get('url') or priority.get('downloadUrl'),
                        'reason': 'identity-unresolved' if source.get('identityStatus', '').startswith('unresolved') else 'no-validated-fulltext-in-this-audit',
                        'originalPriorityNumber': priority.get('priorityRank'),
                        'neededFor': priority.get('checkData') or source.get('referenceRole', 'source-chain completion')})
    missing_json = {'checkedAt': checked, 'meaning': 'Not registered in this audit; not a claim that no lawful OA version or local copy exists. No paywall or access-control bypass attempted.', 'items': missing}
    lines = ['# 待补充原文清单', '', f'登记审计日期：{checked}。先匹配已有paper库，再按DOI／出版社／作者机构补充。缺原件不等于原件不存在。', '',
             '本表是已定位的书目缺口；完整依赖队列含标准、方法、书籍及内部证据，不能直接当作待下载论文数。', '',
             '| 来源 ID | 文献 | 用途 | 链接 / 状态 |', '|---|---|---|---|']
    for item in missing:
        url = 'https://doi.org/' + item['doi'] if item['doi'] else item['url']
        link = f'[原文入口]({url})' if url else '标识符仍待核对'
        lines.append(f'| {item["sourceId"]} | {item["title"]}；{item.get("publication") or ""} | {item["neededFor"]} | {link}；{item["reason"]} |')
    lines += ['', '内部待补：T3、R2矩阵元的原始Notebook/Run/版本与分支证据，以及65S原始输入哈希及模型误差。文献不能替代内部生成工件。', '',
              '原始及方法依赖的逐项状态另见 `primary-source-queue.json`；缺少本地PDF时，数值核查仍可运行，但原件字节状态必须是 unavailable。']
    bibtex = []
    for source in indexed:
        if (source.get('referenceNumber') or source.get('supplementalIndex')) and source.get('doi'):
            bibtex.append('@misc{' + source['id'] + ',\n  title = {' + source['detail'] + '},\n  author = {' +
                          ' and '.join(source.get('authors', [])) + '},\n  year = {' + str(source.get('year') or '') +
                          '},\n  doi = {' + source['doi'] + '},\n  howpublished = {' + (source.get('publication') or '') + '}\n}')
    integrity = {'schemaVersion': 2, 'checkedAt': checked, 'recordType': 'registered-original-library-fingerprints',
                 'verificationBoundary': 'Expected fingerprints only; current original-byte verification is reported by --check. Missing bytes are unavailable, never verified.',
                 'files': [{'path': row['path'], 'expectedSha256': row['sha256']} for row in inventory]}
    outputs = {'index.json': json_bytes(result), 'index.csv': csv_bytes(indexed, CSV_FIELDS),
               'references.bib': ('\n\n'.join(bibtex) + '\n').encode(),
               'original-library-integrity.json': json_bytes(integrity),
               'missing-downloads.json': json_bytes(missing_json), 'missing-downloads.md': ('\n'.join(lines) + '\n').encode()}

    def summary(rows):
        return {'verified': sum(r['verified'] for r in rows), 'unavailable': sum(not r['verified'] for r in rows)}
    report = {'counts': counts, 'checkedAt': checked, 'queueItemsChecked': queue_count,
              'localPdfs': summary(local), 'originalLibrary': summary(originals), 'attachments': summary(attachments),
              'verificationBoundary': 'Mechanical SHA-256, byte-size and PDF-header checks do not establish title/DOI identity, applicability or experimental validation. Unavailable originals have not been byte-verified.'}
    return outputs, report


def output_path(ref, name):
    if name not in OUTPUTS:
        raise ValueError(f'Unexpected reference export path: {name}')
    target = ref / name
    if target.is_symlink():
        raise ValueError(f'Cannot replace a symlink: {target}')
    return target


def recover_transaction(ref):
    """Rollback requires explicit --write; --check only detects interrupted work."""
    transaction = ref / TRANSACTION
    journal_path = transaction / 'journal.json'
    if not journal_path.exists():
        # No replacements start before the prepared journal has been installed.
        shutil.rmtree(transaction)
        return
    journal = read(journal_path)
    for item in journal['files']:
        target = output_path(ref, item['name'])
        backup = transaction / ('backup-' + item['name'])
        if item['existed']:
            if backup.exists():
                if digest(backup) != item['beforeSha256']:
                    raise ValueError('Damaged reference export transaction backup')
                os.replace(backup, target)
            elif not target.exists() or digest(target) != item['beforeSha256']:
                raise ValueError('Missing reference export transaction backup; inspect manually')
        elif target.exists():
            target.unlink()
    shutil.rmtree(transaction)


def write_transaction(ref, outputs, replace=None):
    """Stage all exports before replacing any; caught failures rollback the set.

    This is not a filesystem-wide atomic operation. Interrupted work leaves a
    journal, detected by --check and explicitly rolled back on the next --write.
    """
    replace = replace or os.replace
    transaction = ref / TRANSACTION
    for name in outputs:
        output_path(ref, name)
    transaction.mkdir(parents=True)
    entries = []
    try:
        for name, data in outputs.items():
            target = output_path(ref, name)
            entry = {'name': name, 'existed': target.exists()}
            if target.exists():
                entry['beforeSha256'] = digest(target)
                shutil.copy2(target, transaction / ('backup-' + name))
            entries.append(entry)
            with (transaction / ('new-' + name)).open('wb') as stream:
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
        with (transaction / 'journal.tmp').open('wb') as stream:
            stream.write(json_bytes({'files': entries}))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(transaction / 'journal.tmp', transaction / 'journal.json')
    except BaseException:
        shutil.rmtree(transaction)
        raise
    try:
        for item in entries:
            replace(transaction / ('new-' + item['name']), output_path(ref, item['name']))
    except BaseException:
        recover_transaction(ref)
        raise
    shutil.rmtree(transaction)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--check', action='store_true', help='Read-only metadata/export and local byte checks (default)')
    mode.add_argument('--write', action='store_true', help='Validate fully before updating registered exports')
    parser.add_argument('--checked-at', help='Fixed audit date or timezone-qualified timestamp; no implicit current clock')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    root = args.root.resolve()
    ref = root / 'references'
    try:
        if (ref / TRANSACTION).exists():
            if not args.write:
                raise ValueError('Incomplete reference-index transaction detected; inspect then run --write for explicit rollback/recovery')
            recover_transaction(ref)
        outputs, report = build_outputs(root, args.checked_at)
        changed = [name for name, data in outputs.items() if not (ref / name).exists() or (ref / name).read_bytes() != data]
        if args.write and changed:
            write_transaction(ref, outputs)
        report.update({'mode': 'write' if args.write else 'check', 'changedOutputs': changed,
                       'status': 'updated' if args.write and changed else 'out-of-date' if changed else 'current'})
        print(json.dumps(report, ensure_ascii=False))
        return 0 if args.write or not changed else 1
    except (ValueError, OSError, KeyError) as error:
        print(f'Reference index error: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
