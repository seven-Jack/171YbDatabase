# ¹⁷¹YbDatabase 文献与来源索引

本目录保存文献索引、研究用PDF副本、待补清单和审计报告。生产数据2026.10.30.1已随公开版0.3.3发布（2026-10-31确认的提交8203da5）；本轮578nm补充文献归档在独立本地分支整理，尚未合并发布，没有改变canonical采用值。来源审计覆盖全部现有能级/跃迁数值字段，但不能据此宣称所有数值均完成物理验证。

Git仓库公开保存书目、DOI/下载入口、原件SHA-256、结构化提取参数和核查报告；`papers/`、全文提取、论文页图及Notebook原件只保留在本地，不随提交上传。公开索引不包含论文首页全文。新检出可以运行全部数值核查；缺少本地PDF时，字节校验明确报告`unavailable`，不声称核验过原件。若按索引放回PDF，校验会自动启用，哈希不匹配仍会失败。主图、保存65S和生产文件的保护哈希始终检查。

## 从哪里开始

| 入口 | 用途 |
|---|---|
| [最新补充核对报告](audits/source-followup-20261030.md) | 已订正内容、仍未闭合的问题、适用边界和最终检查结果 |
| [文献索引 JSON](index.json) / [CSV](index.csv) | 48个来源条目、44份PDF版本文件的路径、版本、来源ID和SHA256；另登记3项Offer本地附件 |
| [BibTeX](references.bib) | 可复用书目；存在身份冲突的条目仍需按审计说明核对 |
| [待下载清单](missing-downloads.md) | 本次没有取得可核验全文、或身份仍待确认的文章，含可用入口 |
| [原始及方法依赖队列](primary-source-queue.md) / [JSON](primary-source-queue.json) | 当前数据链涉及的78条依赖，逐条连接受影响字段与获取状态；包括常数/方法文献，并非78篇原始实验 |
| [完整提取数据入口](../data/literature/README.md) | 71张表、1645条累计记录的原文、JSON、CSV、页码与提取manifest |
| [144条字段审计 JSON](../data/literature/audit-2026-10-29/field-audit.json) / [CSV](../data/literature/audit-2026-10-29/field-audit.csv) | 每个canonical字段的旧值、新值、来源证据及处置理由 |
| [补充检索与方法来源](rabi-crosscheck-sources-20261031.json) | 将9份既有PDF和3项附件接入统一登记；补充来源不改变canonical采用身份 |
| [统一待办与关闭条件](audits/literature-backlog-20261031.md) / [JSON](audits/literature-backlog-20261031.json) | 区分需原文、作者参数、内部工件、本地库匹配及独立实验基准 |
| [归档验收](audits/literature-archive-verification-20261102.md) / [JSON](audits/literature-archive-verification-20261102.json) | 2026-11-02的327项本地/无项目原件检查、保护指纹与未闭合边界 |

## 收录规模与版本

截至2026-10-31整理，本索引包含**48个来源条目**：35个canonical来源、额外收录的Fang文章、4条钟跃迁补充来源和8条检索/条件比较/方法来源。后13条均为supplemental，新增文献没有因此成为canonical采用值。来源条目包括外部文献、数据库以及内部记录；来源数不能等同于论文数。

`papers/` 内现有的**44份PDF版本文件均已登记**：原31份、Pizzocaro/Xu/Siegel/Blatt四份，以及此前已取得但分散在审计包中的9份检索/方法PDF。本轮只补登记，没有重新下载或复制原件。原31份包括14份现有库副本、8份此前取得的公开版本，以及用户下载的9份编号原件（1–8、10）；编号原件未改名、覆盖或重存。预印本、正式版、补充材料分别计文件，**44份不等于44篇独立论文**。

补登记的9份是Lis2023、Zhang2022、Zaporski2025、Bettermann2022、Norcia2023、Offer2026正文及补充、Strathearn2023、Ludlow2015。Offer正文/补充共享来源身份，各自保留版本、指纹和旧审计别名；另有TeX、源码归档和ancillary PDF共3项附件保留在`local-only/`，不混入44份`papers/`计数。准确书目、版本、角色与哈希见[补充登记](rabi-crosscheck-sources-20261031.json)。

原批下载校验见[download-validation.json](download-validation.json)，钟跃迁四篇增量见[clock-rabi-sources-20261030.json](clock-rabi-sources-20261030.json)。[document-metadata-20261031.json](document-metadata-20261031.json)保存旧35份原件的登记元数据，以便无PDF的新检出检查导出一致性；它不是本轮已读过原件字节的证明。部分历史`versionNote`沿用来源级arXiv标签，不能直接当作对应正式刊版PDF的实际版本；文档版本身份仍需逐份复核，见统一待办。

原paper库未移动或覆盖。47份原始库PDF的登记指纹与本轮开始时的本地实测均相符；[original-library-integrity.json](original-library-integrity.json)保存登记快照，当前原件是否存在及字节是否匹配由只读检查另行报告。缺原件的新检出只能做登记元数据检查，明确报告`unavailable`，不继承旧的实测通过状态。

新增原件和逐表结果见[received-downloads-20261030.json](received-downloads-20261030.json)、[补充48条字段审计](../data/literature/source-followup-2026-10-30/field-audit.json)。首轮报告仍作为历史记录保留。

## 本轮578nm钟跃迁补充

[补充索引](clock-rabi-sources-20261030.json)独立保存四篇文章的完整书目、版本、DOI、PDF指纹和用途，`build-index.py`下次生成时会读取该文件并保留这些条目；不保存原文首页全文。

| 来源ID | 原文及用途 | 证据边界 |
|---|---|---|
| pizzocaro-2017-metrologia | Pizzocaro等，*Absolute frequency measurement of the 1S0-3P0 transition of 171Yb*；[DOI10.1088/1681-7575/aa4e62](https://doi.org/10.1088/1681-7575/aa4e62) | 原文明确70nW、200µm的1/e²强度半径、60ms名义π脉冲；功率/束腰绝对标定和同一操作点的时间域Rabi拟合仍未闭合。 |
| xu-2014-prl | Xu等，*Measurement of the Hyperfine Quenching Rate of the Clock Transition in 171Yb*；[DOI10.1103/PhysRevLett.113.033003](https://doi.org/10.1103/PhysRevLett.113.033003) | 固体Ne荧光经介质修正后推得自由原子HFI率(4.42±0.35)×10⁻²s⁻¹，可独立约束有效F约化矩阵元；不是未经修正的阱内寿命。 |
| siegel-2024-prl | Siegel等，*Excited-Band Coherent Delocalization for Improved Optical Lattice Clock Performance*；[DOI10.1103/PhysRevLett.132.133201](https://doi.org/10.1103/PhysRevLett.132.133201) | 提供¹⁷¹Yb的³P₀自然寿命19(2)s及独立的晶格光淬灭率；不得把自然寿命、光致淬灭和阱内存活率合并为一个未定义寿命。 |
| blatt-2009-pra | Blatt等，*Rabi Spectroscopy and Excitation Inhomogeneity in a 1D Optical Lattice Clock*；[DOI10.1103/PhysRevA.80.052703](https://doi.org/10.1103/PhysRevA.80.052703) | 原实验对象是⁸⁷Sr；运动载波矩阵元和激发不均匀性的模型可供条件分析，Sr的数值不是¹⁷¹Yb实验参数。 |

**数值支持与历史出处分开记录**：原始淬灭率或寿命可对现有T3强度提供独立数值约束，但即使重建结果接近旧9.19×10⁻⁵ea₀，也不能反向证明2026-09-08内部5.30×10⁻⁵或9.19×10⁻⁵记录实际出自该文。旧生成工件和历史出处仍未定位。本轮补充索引没有修改canonical矩阵元或将此前实验操作点比较改写为“已通过独立标定”。

## 分项审计

- [Offer2026饱和强度与CG约定](audits/offer-saturation-cg-audit-20261030.md)：原文与引用模型、公开TeX、总衰减/具体通道因子3及21s候选重建；没有将候选解释判成作者CG错误。
- [Offer2026条件Rabi–power核查](audits/offer-clock-conditional-20261030.md)：假设1mm为1/e²强度直径，分别代入1070/338mW；记录数值、π/线偏振约定、Xu独立原子率输入及条件证据边界，未判实验验证通过。
- [第二篇578nm独立实验基准检索](audits/clock-rabi-independent-search-20261030.md)：候选原件、实测/估计/拟合参数区分及缺项清单；尚未取得完整同操作点P–w–Ω，不改变canonical书目/原子参数。
- [书目身份与获取状态](audits/bibliography.md)：准确题名、作者、年份、DOI、预印本/刊版区分，以及Fisk条目冲突。早期待下载状态以本文末补充和当前[待下载清单](missing-downloads.md)为准。
- [Kroeze v2完整14表](audits/kroeze-2026.md)：汇编值、原始引用号、质心/矩阵元约定及源文内部冲突。
- [低态原始文章](audits/low-state-originals.md)：Porsev1999、Porsev2003/2004、Beloy2012、Bowers1996的完整表格与条件；理论、测量、由寿命推导的d分别保留。
- [Rydberg来源与内部证据](audits/rydberg-sources.md)：同位素、F/mF/B/分支、寿命定义、电离阈值、C₆锚点和内部生成工件边界。
- [低能级Rabi–power核查](audits/low-state-rabi-validation-20261030.md)：五条E1跃迁的指定通道、理论基准、原始矩阵元交叉核对和实验验证边界。
- [578nm专门复核](audits/clock-rabi-578-audit-20261030.md)：原文定义、Xu独立强度支持、运动/夹角条件诊断和剩余标定缺口。

## 阅读数据时的约定

书目身份已确认、全文已取得、表格已转录、字段已核对、模型已验证是不同状态。Kroeze的218条参考文献目前有完整映射，但没有全部逐篇取得/读完；78条当前原始及方法依赖队列也尚未闭合。1645条累计提取记录包括汇编/理论/原始测量、比较文献、重复引用、类别和空值，**不是1645次独立测量**。

缺失值保留`null`，无说明的同位素/F/磁场/温度或误差不补默认值；数学定义的基态能量零与未知值明确区分。J约化、F约化和具体mF有效耦合不能混用。原PDF自身冲突保留原字面值，并给出显式的工作值推导或待核状态，不隐藏冲突。

本批Qiao、Mishra、Baumann、Fisk等9份全文已收到并完成编号表提取；第9篇Burshtein1974仍缺。内部T3/R2矩阵元还需要Notebook/Run/版本和分支证据，不能靠下载另一篇论文替代。具体清单见[missing-downloads.md](missing-downloads.md)。

78条依赖队列中的62条“全文或身份待核”表示队列尚未关联原件，不表示整个paper库缺少62篇论文。其中还包括标准、常数、方法、书籍和数据库。先按题名/作者/DOI/版本查本地库，再形成真实下载任务；原件获取、字段适用性核查和独立实验验证分别记状态。

## 只读检查与显式更新

```sh
# 默认及 --check 均不改索引或原件；适用于缺少本地PDF的新检出。
npm run references:check
npm run literature:check

# 明确更新书目导出；先全量校验输入及现有原件，再集中写出。
npm run references:write

# 新一轮审计才显式指定审计时间；不要为重复运行刷新时间。
python3 -B references/build-index.py --write --checked-at 2026-10-31
```

文献检查需要Python 3.9+。生成器核对哈希、字节数和PDF文件头；页数采用登记值，独立重核页数可用Poppler的`pdfinfo`。无原件时保留登记元数据并报告`unavailable`；原件存在而哈希不符会失败。机械检查不代替题名、版本和科学字段的人工核对。生成器检查JSON/CSV/BibTeX及依赖队列的一致性，不重新推导原子量，也不自动补全文或改canonical来源。索引分别统计历史下载记录与补充登记的PDF，不把本轮补登记写成新下载。

四包复算默认只读；显式写出当前诊断时使用各包README中的命令，不覆盖2026-10-30的历史结果、CSV和验收。历史“222项测试、15个保护文件”等保留为当时快照，当前验收单独记录日期、基线和范围。索引生成发生异常时会回滚或提示未完成事务，不能把多文件写出误称为文件系统原子事务。

公开Git只归档书目、结构化事实、指纹、审计报告和代码。原PDF、全文、论文页图、Notebook及作者源码归档继续被忽略；网页构建仍排除整个`references/`和`data/literature/`。
