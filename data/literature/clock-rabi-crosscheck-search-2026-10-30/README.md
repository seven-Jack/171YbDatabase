# 578 nm 第二篇独立实验基准检索

[详细报告](../../../references/audits/clock-rabi-independent-search-20261030.md)；[候选与逐项缺口](candidates.json)。

本轮核读的候选尚无可接受的同操作点P、明确定义w及独立实测Ω组合。`acceptedCases`为空，`independentExperimentalValidation`明确为未执行，不能把该包计作实验验证通过。

允许由实验数据拟合Rabi频率，但须保留模型条件；不将谱宽、Ramsey条纹间距或名义π时间直接当成实测Rabi。Offer2026的338 mW为对比度拟合的有效功率，不能回填成独立测得的输入。

文件：`candidates.json`保存结构化事实、来源位置、DOI和原件指纹；`manifest.json`索引本包事实/报告；`verification.json`记录原件及生产文件字节核对。PDF原件仅保留本地`references/papers/`，不随公开仓库上传。缺失原件必须标记unavailable，不能记为原件验证成功。

2026-10-31归档：[archive-metadata.json](archive-metadata.json)锚定基线`8203da5`（软件0.3.3），并固定历史输入、结果和验收快照指纹。历史测试数、原件可用性和截图属于2026-10-30，不能代替当前验收。`historical-manifest-20261030.json`保留旧部分清单的原字节；新manifest覆盖本包全部公开文件、报告及列出的共享校验代码，排除自身和本地全文。统一只读检查：`node scripts/literature-audit.mjs --check`；审阅后仅以显式`--write-manifests`刷新清单。
