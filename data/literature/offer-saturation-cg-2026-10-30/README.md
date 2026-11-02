# Offer2026 饱和强度与CG约定审计

[详细报告](../../../references/audits/offer-saturation-cg-audit-20261030.md)。本包只读生产物理函数和canonical数据，不修改计算器或主图。

- [source-check.json](source-check.json)：Offer正文/SM、公开TeX、Strathearn模型、Ludlow综述及Foot书目的原文核查与缺项。
- [reproduce.mjs](reproduce.mjs)：独立推导Isat与通道因子，复算不同原子率，统一两个模型的半角记号。
- [results.json](results.json)、[comparison.csv](comparison.csv)：数值与全部条件/反算诊断。
- `manifest.json`：本包文件指纹。原始作者源包保存在本地`references/local-only/offer2026-source-arXiv2603.25261v1/`，不随公开Git上传。

只读复算：`node data/literature/offer-saturation-cg-2026-10-30/reproduce.mjs --check`，不带参数也只读。核对历史JSON/CSV的科学结果并单独报告当前原件可用性；缺失明确标记`unavailable`，存在但哈希变化会失败。显式`--write`生成`current-results.json`、`current-comparison.csv`并刷新本包manifest，保留原始`results.json`及CSV字节。

固定总衰减率时，标量与π通道有Isatπ=3Isat标量、Ω标量=√3Ωπ，因此等效拟合功率可相差3倍。寿命21s配闭合标量归一化给21.975kHz，可四舍五入为22；但作者实际Isat/原子率未披露，不能据此断言漏CG或实验验证通过。

2026-10-31归档：[archive-metadata.json](archive-metadata.json)锚定基线`8203da5`（软件0.3.3），并固定历史输入、结果和验收快照指纹。历史测试数、原件可用性和截图属于2026-10-30，不能代替当前验收。`historical-manifest-20261030.json`保留旧部分清单的原字节；新manifest覆盖本包全部公开文件、报告及列出的共享校验代码，排除自身和本地全文。统一只读检查：`node scripts/literature-audit.mjs --check`；审阅后仅以显式`--write-manifests`刷新清单。
