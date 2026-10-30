# Kroeze / Kristensen / Pucher ¹⁷¹Yb Reference Data — 完整表格摘录

本目录对应用户提供的 **arXiv:2509.04416v2**，40页，文稿日期2026-02-16。它是参考数据汇编，不能把其中所有推荐值标成该作者的直接实验测量。未修改网站样式、主跃迁图或canonical数据文件。

- 原始PDF：`/Users/seven/Desktop/paper/atomic data/2026_Kroeze_171Yb_Reference-data_arXiv2509.04416v2.pdf`
- SHA256：`4ffbcc4a8fade841f0f053392617abd4fa05fd501bbe5325ebaf0246d5bcd200`
- 完整表格范围：**Table 1–14，PDF物理页/印刷页20–26**，本文件这些页码一致。
- 完整结构化摘录：**333条记录**，其中318条数值，15条缺失/不适用/类别项；共218条原文参考文献映射。
- 参考文献链接：[arXiv记录](https://arxiv.org/abs/2509.04416)、[v2 PDF](https://arxiv.org/pdf/2509.04416v2)。本次逐值核验使用本地用户PDF。

## 文件入口

| 文件 | 内容 |
|---|---|
| `all-tables.json` | 全部14表的页码、表题和333条可复用记录，保留精确十进制字符串、原表括号误差、单位、原文引用号及证据类型 |
| `all-quantities.csv` | 相同完整记录的扁平CSV，嵌套条件和引用号采用JSON单元格 |
| `transition-properties.json/.csv` | Table8–14，T1/T3/T2/T4/T5/T6/T7所有量，不仅网站现有字段 |
| `hyperfine-zeeman.json/.csv` | Table5，低能态A、gJ、按F分开的Zeeman系数 |
| `isotope-shifts.json/.csv` | Table6全部42格，4个问号明确保留为缺失 |
| `magic-tuneout.json/.csv` | Table7全部13行的波长、频率、角度、1S0模型极化率，共52项 |
| `scattering-lengths.json/.csv` | Table4全部28个上三角散射长度，不重复虚构下三角测量 |
| `constants-isotopes.json/.csv` | Table1–3物理常数、171Yb性质与全部稳定同位素 |
| `reference-map.json` | 原PDF参考文献[1]–[218]的原始文本、页码和可搜索文本，表中每个引用号均有对应条目 |
| `correction-proposals.json` | 与当时canonical快照比较的80条字段建议，包含当前值、候选值、原表定位、边界；**未自动应用** |
| `arithmetic-checks.json` | 7条λ=c/ν与5条Eq54内部算术核对；不是原测量物理验证 |
| `report.json` | 各表覆盖、计数、渲染核对记录及8类冲突/边界 |
| `raw/table-01.txt`…`raw/table-14.txt` | 每张表的完整pdftotext-layout摘录，包含表头、合并单元格/脚注及不易结构化部分 |
| `raw/page-*.txt` | 表格全页与统计方法/推导/约定的上下文页 |
| `rendered/` | PDF页21、23、24、26的145dpi渲染核对图 |
| `extract_tables.py` | 可重复生成上述JSON/CSV；只写本目录，不改canonical文件 |

## 数据读取约定

`valueDecimal`、`uncertaintyDecimal`采用十进制字符串，避免JavaScript浮点或表格软件吞掉钟跃迁的小数。`sourcePrintedValue`保留原文括号误差，如 `518.29583659086363(10)` THz，标准不确定度是 `0.00000000000010` THz，即0.1Hz，不能误读成10THz或末位1Hz。

括号误差为末位标准误差；源文Section2/p2先将不相关统计/系统误差平方合并，再按Birge ratio扩大不一致数据的加权平均误差。`~`保留为`approximate=true`；无误差不等于误差为零；`?`不等于0；破折号不适用；精确定义的常数单独标`exact=true`。

`sourceReferenceNumbers`表示**该原表格行直接印出的引用号**。推导量空白Ref格保持为空，不伪装成直接测量；`derivedFrom`、`dependencyReferenceNumbers`记录其输入来源。对于相同3S1总寿命，Table13/14是同一上能级/同一实验引用集，已经标记共享数据集和重复，不能当两次独立测量加权。

依赖按源公式逐量解析：频率/能量/波长不再混入寿命测量引用；部分衰变率只依赖寿命与该支路β。`methodReferenceNumbers`另存Edlén/Buck、角动量等方法参考；`sourceEquations`保留公式号；`sourceDependencyBoundary`明确没有重建原文未给的输入协方差或新增独立性假设。常数和质量通过原表记录链接追踪。Table11理论寿命及其Γ/宽度、Table2的EI/两个阈值现均有逐字段适用边界/冲突标记。

- Table8–14频率是¹⁷¹Yb超精细**质心**，不是任意一个F→F′通道中心。
- 表中频率实际印为角频率`2π×ν`；结构化`frequency_nu`保存ν，单位THz。
- d为Racah–Wigner **电子J约化**矩阵元，Eq54，由频率/寿命/分支比推导；F约化或mF有效耦合必须另行换算。
- 所有表中分支比为理论[132]；3P2≈8.9s为理论[129]。不能一概标成实验。
- Table7 `alpha_1S0`恒指**1S0的模型极化率**；3P0 tune-out行277不是3P0在tune-out处的极化率。
- Table7带星号为¹⁷⁴Yb测量、作者在说明条件内转用于¹⁷¹Yb，已保留原测量同位素；不是¹⁷¹Yb直接测量。

## 必须保留的源文冲突

1. Table8–14的`Δν_FWHM`行印`2π×...`，但Eq47/p11定义普通频率FWHM=Γ/(2π)。数值系数符合普通频率；结构化数值按Eq47存，并保留原字面表达与警示，不能默默多乘一次2π。
2. p17称Table8–14 Rabi例子均π(q=0)，但Table8/10/12/13/14印的通道均Δm=±1。已经从PDF图像确认是源文内容，不能直接据此检验π通道。
3. Table14的ν与波数给λ=770.1602684006901nm，而打印λ=770.160284(11)nm，中心值和误差均不一致；保存原表，并在订正建议中明确给出frequency-derived候选770.1602684006901±0.0000011871nm，等待主来源澄清。
4. Table2沸点1496K与1196°C互不相容；保持原文，未选择哪个正确。
5. 3S1能量经3P0+649nm和3P2+770nm两路径相差约146.8MHz，不能宣称这套汇编已经完成全能级光谱闭环订正。
6. Table2推荐电离质心与其另列Fc=0/1阈值的1:3加权质心不一致；经验汇编和MQDT阈值须分开。
7. Table9没有钟跃迁d/f，Table11没有f；网站内部校准值和占位值不能冒充此文献报告值。
8. 本次已完整转录原表并检查表页图像，但没有因此逐篇重新验证全部218条主参考文献，也没有完成实验或物理模型验证。

复现：在项目根目录运行 `python3 data/literature/kroeze-2026/extract_tables.py`。脚本会更新本目录生成物与记录当前canonical快照，但不会应用任何订正建议。
