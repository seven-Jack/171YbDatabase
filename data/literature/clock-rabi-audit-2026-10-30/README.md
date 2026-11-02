# 578 nm 钟跃迁 Rabi–power 复核

入口：[详细报告](../../../references/audits/clock-rabi-578-audit-20261030.md)。结论是定义与角因子核查通过，当前矩阵元获Xu2014率数据独立支持；70nW/200µm/60ms名义点的唯一物理差异原因仍缺充分标定和动力学数据。

| 文件 | 内容 |
|---|---|
| `pizzocaro-source-check.json` | 24条逐字段原文位置、定义和版本核对 |
| `cases.json` | 功率/束腰/π时间、四组原始或汇编强度、Xu修正表、历史追溯和假设判定 |
| `reproduce.mjs` | 调用生产CG/Rabi函数，独立HFI率推导dF、正算与反事实灵敏度 |
| `motional-diagnostics.mjs` | 秒级条件解析诊断；不修改生产计算器，不当作实验拟合 |
| `results.json` | 完整输入/结果、原件可用性、运动与缺失参数边界 |
| `strength-comparison.csv` | 原子率、F/π矩阵元及同束心条件Rabi对照 |
| `protected-hashes.json` | 主图、生产物理代码、canonical数据与65S字节保护 |

只读复算：`node data/literature/clock-rabi-audit-2026-10-30/reproduce.mjs --check`，不带参数也执行只读检查。它核对历史JSON/CSV的科学结果，原件缺失时单独报告`unavailable`，不会覆盖历史验证记录。PDF按[补充索引](../../../references/clock-rabi-sources-20261030.json)放在本地`references/papers/`；已有原件的哈希不匹配仍会失败。

显式`--write`只生成`current-results.json`和`current-strength-comparison.csv`，并刷新本包manifest；不会覆盖2026-10-30的`results.json`、CSV、`verification.json`或截图。当前输出不构成新增独立实验验证。

没有将反推的25.128nW、333.807µm或5.506×10⁻⁵ea₀当成测量输入，没有给网页添加0.599经验系数，没有改变主跃迁图或canonical矩阵元。

2026-10-31归档：[archive-metadata.json](archive-metadata.json)锚定基线`8203da5`（软件0.3.3），并固定历史输入、结果和验收快照指纹。历史测试数、原件可用性和截图属于2026-10-30，不能代替当前验收。`historical-manifest-20261030.json`保留旧部分清单的原字节；新manifest覆盖本包全部公开文件、报告及列出的共享校验代码，排除自身和本地全文。统一只读检查：`node scripts/literature-audit.mjs --check`；审阅后仅以显式`--write-manifests`刷新清单。
