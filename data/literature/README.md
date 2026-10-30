# 文献提取数据与字段审计

本目录保存原文提取与来源证据；网站运行时采用的canonical文件仍为`data/levels.json`、`transitions.json`、`hyperfine.json`、`sources.json`和`estimates.json`。完整文件索引、记录数量与哈希见[index.json](index.json)，本轮结论见[最新核对报告](../../references/audits/source-followup-20261030.md)。本地数据已订正，尚未发布。

公开仓库保存结构化事实数据、索引、来源指纹、脚本和报告；原PDF、全文`.txt`、论文页图、整页文本JSON及Notebook原件仅保留本地，不随Git上传。文中指向这些本地原件的链接在新检出中可能不存在，下载入口和SHA-256仍可用。网页自身的核查截图可随报告保留。缺失PDF的字节检查明确返回`unavailable`，不会跳过数值核查或把缺失原件写成验证成功。

## 数据集入口

| 目录 | 表格覆盖 | 记录数 | 主要内容 |
|---|---|---:|---|
| [kroeze-2026](kroeze-2026/README.md) | Table1–14，PDF/印刷页20–26 | 333 | 常数、同位素、散射长度、HFS/Zeeman、同位素位移、magic/tune-out、T1–T7完整跃迁属性 |
| [low-state-originals](low-state-originals/manifest.json) | 四篇原始全文共14张表 | 181 | Porsev1999的E1/寿命/极化率、Porsev2003/2004的F分辨HFS诱导率、Beloy2012寿命/误差预算/d、Bowers1996全部21态寿命及比较 |
| [rydberg-audit](rydberg-audit/README.md) | 7张主表/表组 | 443 | Halter42行、Fang15行、Peper S25–S27的171+69+42行、Lehec6行、Okuno98行；另存正文条件值和版本摘录 |
| [audit-2026-10-29](audit-2026-10-29/coverage.json) | 全部canonical物理量与HFS/model处置 | 144条审计 | baseline、字段旧/新值、理由、证据和可复现订正脚本；与表格记录数分开计数 |

| [source-followup-2026-10-30](source-followup-2026-10-30/README.md) | 新增9篇原件全部36张编号表 | 688 | 649/770/1389nm分量与误差/HFS、Mishra理论率、Baumann/Rambow寿命、Aymar174谱线、Fisk离子芯频率；另有48条工作数据/来源处置 |

累计**71张表、1645条记录（333+181+443+688）**。计数单位因原表结构而异，含参数项、数据行、理论/实验比较、重复引用及显式缺项，不能解释成1645个独立测量。正文条件摘录另存，不为扩大记录数与主表混算。

## 常用机器可读文件

- Kroeze： [all-tables.json](kroeze-2026/all-tables.json)、[all-quantities.csv](kroeze-2026/all-quantities.csv)、[transition-properties.json](kroeze-2026/transition-properties.json)、[hyperfine-zeeman.json](kroeze-2026/hyperfine-zeeman.json)。14表原始文本与关键页渲染在同目录，引用[1]–[218]见[reference-map.json](kroeze-2026/reference-map.json)。
- 低态原始文章：[manifest.json](low-state-originals/manifest.json)列出四篇逐篇JSON、14份逐表CSV、原PDF哈希和表页。条件与冲突解读见[low-state-originals.md](../../references/audits/low-state-originals.md)。
- Rydberg：[audit-summary.json](rydberg-audit/audit-summary.json)、[source-manifest.json](rydberg-audit/source-manifest.json)、[field-coverage.json](rydberg-audit/field-coverage.json)和[extracted-facts.json](rydberg-audit/extracted-facts.json)。逐表JSON/CSV与原页摘录由同目录README连接。
- canonical处置：[field-audit.json](audit-2026-10-29/field-audit.json) / [CSV](audit-2026-10-29/field-audit.csv)、[coverage.json](audit-2026-10-29/coverage.json)、[reconcile.py](audit-2026-10-29/reconcile.py)。`baseline/`保留订正前快照；脚本中的`--apply`会写canonical，普通读取提取文件不会自动应用候选建议。

## 精度、定义与来源链

Kroeze等高精度值用十进制字符串保留原有效位数和括号误差，避免钟跃迁精度在JavaScript浮点或表格软件中丢失。工作用canonical数值与原文归档并存；精密复算应取原始字符串。未提供误差的条目保持未知，`~`/近似、范围、上限、类别项和`null`均按原文保留。

每个可提取值连接PDF版本/哈希、表号/页码、同位素和态定义。数字输入依赖、方法引用和源公式分开记录，频率/波长不混入寿命参考，partialΓ不混同总Γ；未建立原文未提供的输入协方差。Racah电子J约化d、F约化d、mF通道有效耦合分别说明。

必须保留以下边界：

1. Kroeze是汇编；其d通常由频率、总寿命与理论分支比推得，不能统称独立实测。Table8–14的额外2π记号、Table14真空λ与同表频率不一致、Rabi表例的π声明与Δm不一致，都保留原文并显式标记。
2. 3P2≈8.9s已核实为Mishra理论中统计加权HFI率加M1/M2后总率的倒数，不是各F分量寿命或寿命的平均；不能导出通用E1 d。
3. 3P2工作能量采用同一原文五分量的显式Ritz质心，使现工作网络残差降至23.3kHz；旧独立参考的约150.366MHz差异根因仍未知，电离质心与MQDT阈值标尺差异也保留。
4. 174Yb的QD、寿命、能量和光移不自动补入171Yb；ν与n、单重/三重分支、低/高磁场、自然/人口/阱内寿命和相干包络均分开。
5. 内部T3有效F约化d和R2 d仍需原生成工件与条件证据。保存65S的Notebook、validation和CSV已定位核对，但代码版本与独立模型误差仍未建立；工件完整性不能代替物理验证。

本轮没有运行MQDT或重新拟合物理模型。全部107个跃迁量、24个能级量已有逐字段审计处置，另覆盖11条HFS、保存65S记录及整个旧标度模型；**覆盖完整不等于全部物理验证完成**。当前78条原始及方法依赖队列与人工补文献入口见[primary-source-queue.md](../../references/primary-source-queue.md)和[missing-downloads.md](../../references/missing-downloads.md)。
