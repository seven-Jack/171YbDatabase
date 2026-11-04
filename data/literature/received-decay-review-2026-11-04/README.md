# 五份新文献：Yb 寿命与 decay 数据复核

核查版本 **2026.11.04.2**，日期2026-11-04。本包保存原文转录、定义、来源链、冲突和缺口，不改变运行时decay采用值2026.11.04.1、原子参数、主图布局或物理公式。

## 覆盖与计数

|文件|覆盖|数值记录|证据边界|
|---|---|---:|---|
|[honda-loftus.json](honda-loftus.json)|Honda正文4页、勘误1页、Loftus4页，正文/图示/表I及脚注|30|含实验观测、下界、模型推断、既有寿命引用和理论率；不是30次独立实验|
|[guo.json](guo.json)|Guo全文3页，表I10个寿命及波数|10|8个6snp³P₂态n=12–19与两个扰动态；同位素/F未知，逐点误差未给|
|[blagoev-yb.json](blagoev-yb.json)|汇编表XXV/XXVI全部Yb I/Yb II寿命格，PDFp33–38；相关说明/参考文献|200|183中性、17离子；56理论、144实验类型，全部为二级汇编入口；121个态行，不是200次新实验|

合计 **240条结构化数值记录**。计数包括同一测量的重述、引用/理论比较和重复文献，不能解释为独立样本。Blagoev整本40页没有全元素逐表提取；Yb表已完整转录，相关说明及引用页已核对。图上未明示的点不做伪精度数字化。

## 文件职责

- [records.csv](records.csv)：三份JSON的完整扁平导出，量子态/条件/原文定位等复杂字段保留JSON，不丢弃原始有效位数或误差说明。
- [source-manifest.json](source-manifest.json)：五份原件的当前路径、版本、DOI、页数和指纹；Burshtein原文单列待核。
- [conflicts.json](conflicts.json)：11项冲突、订正或定义比较；已明确解决和仍未解决分别标状态。
- [lineage.json](lineage.json)：汇编与原始测量、重复引用的关系；不重复计为新实验；上游原文未知可用性保留null。
- [manifest.json](manifest.json)：本包文件哈希与计数；不覆盖旧审计包。
- [verify.mjs](verify.mjs)：只读检查数值类型、证据类别、条件/页码、完整性、来源指纹、特殊单位及待核边界。

20项待核/边界条目分别保存在三份JSON的pending中；lineage另列3项上游追溯任务。这些是问题记录，不等于缺少23篇可明确下载的论文。

## 使用数据的约定

`evidenceKind`区分experiment、theory、reported-reference、derived；`provenance`区分primary-result、cited-value、compilation-entry。前者说明原值类型，后者说明本次读到的是原始结果还是转引。汇编格即使写experiment，也不表示本次重新核验过原始测量。所有记录均`canonicalAdopted:false`。

`value`和`uncertainty`使用各自明确unit。Guo的约10%是包含统计及系统效应的整体accuracy，不赋为逐点1σ；其逐点误差为null。Blagoev括号按同单位绝对误差读取，置信水平未给；不按末位数误差规则解释。`relation:greater-than`是严格下界，不可当精确寿命。未明确的同位素、F/mF、环境或测法对应关系保留未知/待核。

Honda的556/399nm级联荧光比与整体漏出下界来自同一数据，不能当两次独立测量或直接单支β；Loftus的a₁、a₂,₀是有效级联率，分母及探测终态不等于直接E1支路；阱内200–800ms人口损失时间也不是激发态自然寿命。本轮没有新增完整直接decay分支表或¹⁷¹Yb F/mF分辨独立验证。

特殊单位单列保留：Yb I ³P₂理论14.5s；Yb II²F₇/₂ >7day；²D₃/₂=(52.15±1.00)×10⁶ns。p37的1185.7ns保留原表所排6s22s¹S₀行，并注明态归属待核，不能自行移到相邻D态。

Burshtein1974原文仍缺；Blagoev第13页参考75及第33页表XXV只核实了二级引用，不能替代原始测量。详见[中文核查报告](../../../references/audits/received-decay-review-20261104.md)。

## 更新与复核

```sh
# JSON原文核对后才显式更新CSV；随后人工复核并更新manifest文件指纹。
node data/literature/received-decay-review-2026-11-04/export.mjs --write
# 默认只读，检查JSON/CSV/manifest和可用的原始PDF。
node data/literature/received-decay-review-2026-11-04/verify.mjs
npm run literature:check
npm run check
```

原始PDF、完整文本、OCR和页图继续只在本地保留。公开Git保存结构化事实和指纹；本目录与references均被Pages构建排除。原件缺失的新检出仍可检查事实，但原件字节状态明确unavailable。
