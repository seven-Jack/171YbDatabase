import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderEvidencePanelHTML,evidenceSourceURL,escapeEvidenceHTML} from '../../src/ui/evidence-panel.js';

const evidence = JSON.parse(readFileSync(new URL('../../data/evidence.json',import.meta.url),'utf8'));
const review = evidence.records.find(record => record.transitionId === 'T3');
const makeView = overrides => ({
  transitionId:'T3',contextKey:'T3:0.5:0.5:pi:strongest',hasReview:true,
  primarySourceId:review.primarySourceId,summary:review.summary,
  contextText:'578 nm · F=1/2 → F′=1/2 · π · 当前允许通道',
  calculationStatus:'valid',reviewVersion:review.reviewVersion,reviewedAt:review.reviewedAt,
  rows:[
    {key:'source',label:'原文定位',status:'checked',statusText:review.sourceStatusText,detail:review.sourceDetail},
    {key:'formula',label:'公式与通道核查',status:'checked',statusText:'当前约定已核查',detail:review.formulaDetail},
    {key:'comparison',label:'条件比较',status:'conditional',statusText:'仅在所列假设下比较',detail:review.comparisonDetail},
    {key:'experiment',label:'独立实验验证',status:'not-closed',statusText:'绝对标定未闭合',detail:review.experimentDetail}
  ],
  atomicSupport:review.atomicSupport,
  comparisons:evidence.comparisons.filter(row => review.comparisonIds.includes(row.id)),
  sources:evidence.sources,missing:review.missing,
  applicability:{inputValid:true,applicable:true,reasons:[]},
  ...overrides
});

const benchmarkCases = [
  {id:'T1',calculated:42.43549222721293,published:42.44,uncertainty:0.04,dipole:4.147},
  {id:'T2',calculated:5.523674633289015,published:5.523,uncertainty:0.006,dipole:0.5398},
  {id:'T5',calculated:28.242575005331016,published:28.3,uncertainty:0.8,dipole:2.76},
  {id:'T6',calculated:20.05632138059739,published:20,uncertainty:1.6,dipole:1.96},
  {id:'T7',calculated:39.55226688563824,published:39.5,uncertainty:2.6,dipole:4.99},
];
function makeBenchmarkView(item = benchmarkCases[0], overrides = {}) {
  const channel = item.id === 'T7' ? {F:2.5,m:2.5,Fp:1.5,mp:1.5,q:-1} : {F:0.5,m:0.5,Fp:1.5,mp:1.5,q:1};
  return makeView({
    transitionId:item.id,contextKey:`${item.id}:benchmark`,primarySourceId:'ref-01',
    summary:'模型换算 · 文献理论基准相容 · 未独立实验验证',
    rows:[
      {key:'source',status:'checked',statusText:'原文定位已核'},
      {key:'formula',status:'checked',statusText:'当前约定与通道已核'},
      {key:'comparison',label:'文献基准比较',status:'theory-compatible',statusText:'文献理论基准相容'},
      {key:'experiment',status:'not-closed',statusText:'未闭合 · 未独立验证'}
    ],
    atomicSupport:{title:'矩阵元与数据链',sourceIds:['kroeze-2026'],statusText:'汇编与原始输入已核',summary:'保留寿命和分支口径。',quantities:[{label:'采用 dJ',value:item.dipole,unit:'ea₀',evidenceKind:'compiled-dipole'},{label:'由寿命与分支重建',value:item.dipole,unit:'ea₀',evidenceKind:'lifetime-derived-dipole'}],boundary:'数据链支持不等于独立 Rabi 实验。'},
    comparisons:[{id:`kroeze-${item.id.toLowerCase()}-theory`,kind:'theory-benchmark',title:`Kroeze · ${item.id} 文献理论基准`,status:'theory-compatible',scopeText:'固定文献参数，非当前输入。',sourceIds:['kroeze-2026'],assumptions:['按明确态对选取偏振。'],channel,power_mW:1,waist_um:500,calculatedRabi_MHz:item.calculated,publishedRabi_MHz:item.published,publishedRabiUncertainty_MHz:item.uncertainty,normalizationNote:'保持已核 J 级约化约定。',boundary:'同一文献数据链，不是独立直接 Rabi 测量。'}],
    sources:[{id:'kroeze-2026',title:'171Yb Reference Data',doi:'10.48550/arXiv.2509.04416',url:'https://arxiv.org/abs/2509.04416v2',locations:['PDF 第 23–26 页，Tables 8、10、12–14']}],
    missing:['匹配功率、明确束腰和独立 Rabi 测量的同一实验操作点'],
    ...overrides,
  });
}

test('four evidence categories stay distinct and Xu/Offer details start collapsed',()=>{
  const html = renderEvidencePanelHTML(makeView());
  for (const [key,status] of [['source','checked'],['formula','checked'],['comparison','conditional'],['experiment','not-closed']]) {
    assert.match(html,new RegExp(`data-testid="evidence-row-${key}" data-evidence-status="${status}"`));
  }
  assert.equal((html.match(/class="evidence-status-row"/g) || []).length,4);
  for (const name of ['xu','offer']) {
    assert.match(html,new RegExp(`<details[^>]*data-evidence-section="${name}"[^>]*data-testid="evidence-${name}"`));
  }
  assert.match(html,/data-evidence-section="missing"/);
  assert.match(html,/待补证据（6 项）/);
  assert.doesNotMatch(html,/<details[^>]*\bopen(?:\s|=|>)/);
  assert.match(html,/data-testid="evidence-context" data-context-key="T3:0\.5:0\.5:pi:strongest" data-calculation-status="valid"/);
  assert.match(html,/https:\/\/doi\.org\/10\.1103\/PhysRevLett\.113\.033003/);
  assert.match(html,/PDF 第 3–4 页，式 \(2\)、表 I/);
  assert.match(html,/target="_blank" rel="noopener noreferrer"/);
});

test('Xu support retains historical source gap and is not power-waist-Rabi validation',()=>{
  const html = renderEvidencePanelHTML(makeView());
  assert.match(html,/internal-t3-20260908/);
  assert.match(html,/历史生成记录/);
  assert.match(html,/0\.0442/);
  assert.match(html,/0\.0035/);
  assert.match(html,/自由原子/);
  assert.match(html,/固 Ne/);
  assert.match(html,/介质修正后的原子率/);
  assert.match(html,/不是冷原子 P–w–Ω 实验/);
  assert.doesNotMatch(html,/>medium-corrected-rate</);
});

test('Offer clearly separates fixed conditional predictions from reported and fitted inputs',()=>{
  const html = renderEvidencePanelHTML(makeView());
  assert.match(html,/固定文献对照，非当前输入/);
  assert.match(html,/1070 mW/);
  assert.match(html,/阶段可用功率/);
  assert.match(html,/338 mW/);
  assert.match(html,/拟合有效功率/);
  assert.match(html,/22 kHz/);
  assert.match(html,/模型拟合耦合/);
  assert.match(html,/21\.7514 kHz/);
  assert.match(html,/12\.2251 kHz/);
  assert.match(html,/1\/e² 强度直径/);
  assert.match(html,/500 μm/);
  assert.match(html,/纯 π/);
  assert.match(html,/不是独立时域 Rabi 实测值/);
  assert.match(html,/不能据此认定漏乘 CG/);
});

test('invalid current inputs retain saved literature checks without suggesting this calculation passed',()=>{
  const html = renderEvidencePanelHTML(makeView({calculationStatus:'invalid',applicability:{inputValid:false,applicable:false,reasons:['当前计算输入待补正']}}));
  assert.match(html,/data-calculation-status="invalid"/);
  assert.match(html,/不代表本次计算通过/);
  assert.match(html,/当前计算输入待补正/);
  assert.match(html,/data-evidence-section="xu"/);
  assert.match(html,/data-testid="evidence-row-formula" data-evidence-status="checked"/);
});

test('a changed reviewed context keeps fixed comparisons but marks their summary for rechecking',()=>{
  const html = renderEvidencePanelHTML(makeView({comparisons:evidence.comparisons.map(comparison=>({...comparison,status:'needs-review'}))}));
  assert.match(html,/data-testid="evidence-offer" data-evidence-status="needs-review"/);
  assert.match(html,/需按当前版本与通道重核/);
  assert.match(html,/固定文献对照，非当前输入/);
  assert.match(html,/21\.7514 kHz/);
});

test('missing reviews show four unknown categories without inheriting T3 review details',()=>{
  const html = renderEvidencePanelHTML({transitionId:'T2',hasReview:false,calculationStatus:'valid',contextText:'555.8 nm'});
  assert.equal((html.match(/data-evidence-status="not-reviewed"/g) || []).length,4);
  assert.doesNotMatch(html,/evidence-xu|evidence-offer|internal-t3/);
  const stale = renderEvidencePanelHTML(makeView({transitionId:'T2',hasReview:false,summary:''}));
  assert.equal((stale.match(/data-evidence-status="not-reviewed"/g) || []).length,4);
  assert.doesNotMatch(stale,/evidence-xu|evidence-offer|evidence-primary-source/);
  const unsupported = renderEvidencePanelHTML({transitionId:'T4',hasReview:false,rows:['source','formula','comparison','experiment'].map(key=>({key,status:'not-applicable',statusText:'E1 不适用'}))});
  assert.equal((unsupported.match(/data-evidence-status="not-applicable"/g) || []).length,4);
});

test('evidence text and attributes are escaped and unsafe source paths never become links',()=>{
  const attack = '<img src=x onerror="alert(1)">';
  const html = renderEvidencePanelHTML(makeView({
    contextKey:'" onmouseover="alert(1)',contextText:attack,summary:attack,
    atomicSupport:{title:attack,statusText:attack,summary:attack,quantities:[{label:attack,value:attack,unit:attack,evidenceKind:attack}],boundary:attack,sourceIds:['unsafe']},
    comparisons:[{title:attack,scopeText:attack,assumptions:[attack],rows:[{power_mW:attack,powerLabel:attack,rabi_kHz:attack,relativeDifferencePercent:attack}],reference:{label:attack,value:attack,unit:attack,evidenceKind:attack},normalizationNote:attack,boundary:attack,sourceIds:['unsafe']}],
    sources:[{id:'unsafe',title:attack,url:'javascript:alert(1)',locations:[attack],localPath:'/Users/seven/private.tex'}],missing:[attack]
  }));
  assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(html,/<img|<script|href="javascript:|href="file:|\/Users\/seven\/private\.tex/);
  assert.doesNotMatch(html,/data-context-key="" onmouseover/);
  assert.equal(escapeEvidenceHTML('<>&"\''),'&lt;&gt;&amp;&quot;&#39;');
});

test('source links allow official HTTPS landing pages and valid DOI fallback only',()=>{
  assert.equal(evidenceSourceURL({url:'https://arxiv.org/abs/1406.2340'}),'https://arxiv.org/abs/1406.2340');
  assert.equal(evidenceSourceURL({url:'file:///Users/seven/paper.tex',doi:'10.1103/PhysRevLett.113.033003'}),'https://doi.org/10.1103/PhysRevLett.113.033003');
  for (const url of ['http://doi.org/10.1000/a','javascript:alert(1)','file:///Users/seven/paper.pdf','https://evil.example/paper','https://arxiv.org/pdf/1406.2340.pdf','https://doi.org:8443/10.1000/a','https://doi.org/%E0%A4%A']) {
    assert.equal(evidenceSourceURL({url}),null,url);
  }
  assert.equal(evidenceSourceURL({doi:'10.1000/a" onclick="x'}),null);
});

test('rendering is pure and deterministic for the same evidence view',()=>{
  const view = structuredClone(makeView());
  const before = structuredClone(view);
  const first = renderEvidencePanelHTML(view);
  assert.equal(renderEvidencePanelHTML(view),first);
  assert.deepEqual(view,before);
});

test('low-state evidence uses generic collapsed details with identities distinct from Xu and Offer',()=>{
  for (const item of benchmarkCases) {
    const html = renderEvidencePanelHTML(makeBenchmarkView(item));
    assert.match(html,new RegExp(`data-evidence-section="atomic-support-${item.id}" data-testid="evidence-atomic-support"`));
    assert.match(html,new RegExp(`data-evidence-section="comparison-kroeze-${item.id.toLowerCase()}-theory" data-testid="evidence-comparison"`));
    assert.match(html,/data-evidence-kind="theory-benchmark"/);
    assert.match(html,/data-testid="evidence-row-comparison" data-evidence-status="theory-compatible"/);
    assert.match(html,/文献基准比较/);
    assert.match(html,/汇编采用的约化矩阵元/);
    assert.match(html,/由寿命与分支数据推导/);
    assert.doesNotMatch(html,/evidence-xu|evidence-offer|Xu|Offer|internal-t3/);
    assert.doesNotMatch(html,/<details[^>]*\bopen(?:\s|=|>)/);
  }
});

test('five fixed theory comparisons show MHz values and uncertainty without reinterpreting them as measured Rabi',()=>{
  for (const item of benchmarkCases) {
    const html = renderEvidencePanelHTML(makeBenchmarkView(item));
    const rounded = item.calculated.toFixed(6).replace(/0+$/,'').replace(/\.$/,'');
    assert.ok(html.includes(`${rounded} <span>MHz</span>`),item.id);
    assert.ok(html.includes(`${item.published} ± ${item.uncertainty} <span>MHz</span>`),item.id);
    assert.match(html,/固定 P = 1 mW/);
    assert.match(html,/w₀ = 500 μm（1\/e² 强度半径）/);
    assert.match(html,/固定文献对照，非当前输入/);
    assert.match(html,/文献理论复现；未独立实验验证/);
    assert.match(html,/不代表本次计算的完整误差预算/);
    assert.match(html,/data-testid="evidence-row-experiment" data-evidence-status="not-closed"/);
    assert.doesNotMatch(html,/>独立实验验证通过</);
  }
});

test('theory benchmark channel explicitly distinguishes stretched sigma-plus and sigma-minus states',()=>{
  const first = renderEvidencePanelHTML(makeBenchmarkView());
  assert.match(first,/F=1\/2, mF=\+1\/2 → F′=3\/2, mF′=\+3\/2 · σ⁺/);
  const seventh = renderEvidencePanelHTML(makeBenchmarkView(benchmarkCases[4]));
  assert.match(seventh,/F=5\/2, mF=\+5\/2 → F′=3\/2, mF′=\+3\/2 · σ⁻/);
});

test('a theory comparison needing review keeps its fixed numbers and cannot render a compatible summary badge',()=>{
  const view = makeBenchmarkView();
  view.comparisons[0].status = 'needs-review';
  const html = renderEvidencePanelHTML(view);
  assert.match(html,/data-testid="evidence-comparison" data-evidence-status="needs-review"/);
  assert.match(html,/需按当前版本与通道重核/);
  assert.match(html,/42\.435492/);
  assert.doesNotMatch(html,/<span class="evidence-detail-status">文献理论基准相容<\/span>/);
});

test('unknown evidence kinds and inappropriate status claims are not presented as checked comparisons',()=>{
  for (const [kind,status] of [['unknown-kind','checked'],['theory-benchmark','conditional'],['conditional-power','theory-compatible']]) {
    const view = makeBenchmarkView();
    Object.assign(view.comparisons[0],{kind,status});
    const html = renderEvidencePanelHTML(view);
    assert.match(html,/data-testid="evidence-comparison" data-evidence-status="not-reviewed"/);
    assert.match(html,/<span class="evidence-detail-status">尚未核查<\/span>/);
    if (kind === 'unknown-kind') {
      assert.match(html,/证据类型待核查/);
      assert.doesNotMatch(html,/class="evidence-benchmark-values"/);
    }
  }
});

test('legacy Xu and Offer hooks are reserved to the actual clock transition and source identities',()=>{
  const html = renderEvidencePanelHTML(makeView({transitionId:'T1'}));
  assert.doesNotMatch(html,/data-testid="evidence-(?:xu|offer)"/);
  assert.match(html,/data-testid="evidence-atomic-support"/);
  assert.match(html,/data-testid="evidence-comparison"/);
});

test('new benchmark metadata is escaped in attributes and nonfinite numerical channel fields stay unreadable',()=>{
  const attack = '<svg onload="alert(1)">';
  const view = makeBenchmarkView();
  view.transitionId = attack;
  Object.assign(view.comparisons[0],{id:'" onmouseover="x',title:attack,calculatedRabi_MHz:Infinity,channel:{F:NaN,m:attack,Fp:1.5,mp:1.5,q:attack}});
  const before = structuredClone(view);
  const html = renderEvidencePanelHTML(view);
  assert.match(html,/&lt;svg onload=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(html,/<svg|data-evidence-id="" onmouseover|>Infinity|>NaN/);
  assert.match(html,/偏振待核/);
  assert.match(html,/F=—, mF=—/);
  assert.deepEqual(view,before);
});
