# Offer2026 条件 Rabi–power 核查

[详细报告](../../../references/audits/offer-clock-conditional-20261030.md)。用户指定假设：1mm是1/e²强度直径，所以计算半径为500µm。

- [inputs.json](inputs.json)：功率的实测可用/拟合有效定义、通道条件、假设和原件SHA-256。
- [results.json](results.json)：1070/338mW的完整计算值、相对22kHz差异及Xu独立原子率输入结果。
- [reproduce.mjs](reproduce.mjs)：调用生产CG/Rabi函数复算，并验证线偏振功率分配、平方根缩放、反算、独立Python数值和保护文件。
- [comparison.csv](comparison.csv)：方便查阅的数值对照。
- `manifest.json`：本包及报告的字节指纹。

只读复算：`node data/literature/offer-clock-conditional-2026-10-30/reproduce.mjs --check`，不带参数也只读。核对历史JSON/CSV的科学结果并单独报告当前原件可用性；缺失明确标记`unavailable`，存在但哈希变化会失败。显式`--write`生成`current-results.json`、`current-comparison.csv`并刷新本包manifest，保留原始`results.json`及CSV字节。

1070mW给21.751kHz，338mW给12.225kHz；两者均为指定束径与π/线偏振通道条件下的束心结果。与22kHz接近不等于独立实验验证通过，338mW也不能改标为实测功率。

2026-10-31归档：[archive-metadata.json](archive-metadata.json)锚定基线`8203da5`（软件0.3.3），并固定历史输入、结果和验收快照指纹。历史测试数、原件可用性和截图属于2026-10-30，不能代替当前验收。`historical-manifest-20261030.json`保留旧部分清单的原字节；新manifest覆盖本包全部公开文件、报告及列出的共享校验代码，排除自身和本地全文。统一只读检查：`node scripts/literature-audit.mjs --check`；审阅后仅以显式`--write-manifests`刷新清单。
