# ¹⁷¹YbDatabase 文献与来源索引

本目录保存本轮来源订正的文献索引、研究用PDF副本、待补清单和审计报告。数据已订正到本地canonical文件，**尚未发布到GitHub Pages**。来源审计覆盖全部现有能级/跃迁数值字段，但不能据此宣称所有数值均完成物理验证。

Git仓库公开保存书目、DOI/下载入口、原件SHA-256、结构化提取参数和核查报告；`papers/`、全文提取、论文页图及Notebook原件只保留在本地，不随提交上传。公开索引不包含论文首页全文。新检出可以运行全部数值核查；缺少本地PDF时，字节校验明确报告`unavailable`，不声称核验过原件。若按索引放回PDF，校验会自动启用，哈希不匹配仍会失败。主图、保存65S和生产文件的保护哈希始终检查。

## 从哪里开始

| 入口 | 用途 |
|---|---|
| [最新补充核对报告](audits/source-followup-20261030.md) | 已订正内容、仍未闭合的问题、适用边界和最终检查结果 |
| [文献索引 JSON](index.json) / [CSV](index.csv) | 36个来源条目、31份PDF版本文件的路径、版本、来源ID和SHA256 |
| [BibTeX](references.bib) | 可复用书目；存在身份冲突的条目仍需按审计说明核对 |
| [待下载清单](missing-downloads.md) | 本次没有取得可核验全文、或身份仍待确认的文章，含可用入口 |
| [原始及方法依赖队列](primary-source-queue.md) / [JSON](primary-source-queue.json) | 当前数据链涉及的78条依赖，逐条连接受影响字段与获取状态；包括常数/方法文献，并非78篇原始实验 |
| [完整提取数据入口](../data/literature/README.md) | 71张表、1645条累计记录的原文、JSON、CSV、页码与提取manifest |
| [144条字段审计 JSON](../data/literature/audit-2026-10-29/field-audit.json) / [CSV](../data/literature/audit-2026-10-29/field-audit.csv) | 每个canonical字段的旧值、新值、来源证据及处置理由 |

## 收录规模与版本

截至2026-10-30，本索引包含**36个来源条目**：35个canonical来源加额外收录的Fang文章。来源条目包括外部文献、数据库以及内部记录；来源数不能等同于论文数。

`papers/` 内有**31份PDF版本文件**：14份现有库副本、8份此前取得的公开版本，以及用户新下载的9份编号原件（1–8、10）。编号原件未改名、覆盖或重存。预印本、正式版、补充材料分别计文件，不等于31篇独立论文。准确文件名、来源链接、版本与许可边界以[index.json](index.json)为准，新下载校验见[download-validation.json](download-validation.json)。

原paper库未移动或覆盖；本轮登记的47份原PDF核对前后SHA256相同，见[original-library-integrity.json](original-library-integrity.json)。归档用于本地研究，本轮未将PDF副本发布到网站。

新增原件和逐表结果见[received-downloads-20261030.json](received-downloads-20261030.json)、[补充48条字段审计](../data/literature/source-followup-2026-10-30/field-audit.json)。首轮报告仍作为历史记录保留。

## 分项审计

- [书目身份与获取状态](audits/bibliography.md)：准确题名、作者、年份、DOI、预印本/刊版区分，以及Fisk条目冲突。早期待下载状态以本文末补充和当前[待下载清单](missing-downloads.md)为准。
- [Kroeze v2完整14表](audits/kroeze-2026.md)：汇编值、原始引用号、质心/矩阵元约定及源文内部冲突。
- [低态原始文章](audits/low-state-originals.md)：Porsev1999、Porsev2003/2004、Beloy2012、Bowers1996的完整表格与条件；理论、测量、由寿命推导的d分别保留。
- [Rydberg来源与内部证据](audits/rydberg-sources.md)：同位素、F/mF/B/分支、寿命定义、电离阈值、C₆锚点和内部生成工件边界。
- [低能级Rabi–power核查](audits/low-state-rabi-validation-20261030.md)：五条E1跃迁的指定通道、理论基准、原始矩阵元交叉核对和实验验证边界。

## 阅读数据时的约定

书目身份已确认、全文已取得、表格已转录、字段已核对、模型已验证是不同状态。Kroeze的218条参考文献目前有完整映射，但没有全部逐篇取得/读完；78条当前原始及方法依赖队列也尚未闭合。1645条累计提取记录包括汇编/理论/原始测量、比较文献、重复引用、类别和空值，**不是1645次独立测量**。

缺失值保留`null`，无说明的同位素/F/磁场/温度或误差不补默认值；数学定义的基态能量零与未知值明确区分。J约化、F约化和具体mF有效耦合不能混用。原PDF自身冲突保留原字面值，并给出显式的工作值推导或待核状态，不隐藏冲突。

本批Qiao、Mishra、Baumann、Fisk等9份全文已收到并完成编号表提取；第9篇Burshtein1974仍缺。内部T3/R2矩阵元还需要Notebook/Run/版本和分支证据，不能靠下载另一篇论文替代。具体清单见[missing-downloads.md](missing-downloads.md)。
