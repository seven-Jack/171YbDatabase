# 新下载频率原文：1/4/5/6.pdf

- `manifest.json`：原PDF身份、DOI、SHA256、18表/162标准化行/255单元计数。原件只读且哈希未变。
- `all-tables.json` 与逐表 `paper-N-Table*.json/.csv`：全部编号表及对照原文。比较文献列与this-work列分别标记；符号/空格以保存的完整原页和渲染图为准。
- `paper-N-page-M.txt`、`rendered/`：9个完整相关表页的原文布局与目视核验图。覆盖全部18表。
- `arithmetic-and-recommendations.json`：T6/T7重心、共上态及全5分量Ritz推导、缺失协方差边界、源内冲突及canonical建议。全5分量T4派生工作值为根任务选定方案，common-upper-only作为相关交叉核对保留，不是独立观测。
- `extract_frequency.py`：确定性重建这些提取文件；不执行拟合或修改原PDF/canonical。

数据说明见项目 `references/audits/followup-frequency-20261030.md`。162行包括把合并单元展开为通道行、历史对照和缺失项，不等于162个独立测量。255单元包括表内比较列，亦不是255个独立新测量。
