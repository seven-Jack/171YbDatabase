# 2026-11-04 手动下载接收与文件更名核查

## 完成状态

新收到5份PDF，身份、DOI、页数与版本已核对并加入当前书目登记；Burshtein1974原文仍缺。当前为59条来源、56份PDF版本文件。文件计数不代表56篇独立实验。

## 重命名明细

|旧文件名|当前文件名|版本／适用对象|
|---|---|---|
|`1.pdf`|[2023_Qiao_171Yb_3P0-3P2-to-3S1-frequencies_published-print.pdf](../papers/2023_Qiao_171Yb_3P0-3P2-to-3S1-frequencies_published-print.pdf)|published-print|
|`2.pdf`|[2001_Mishra_Yb_Metastable-3P-radiative-lifetimes_published-print.pdf](../papers/2001_Mishra_Yb_Metastable-3P-radiative-lifetimes_published-print.pdf)|published-print|
|`3.pdf`|[1985_Baumann_YbI_Even-parity-lifetimes-gJ_published-print.pdf](../papers/1985_Baumann_YbI_Even-parity-lifetimes-gJ_published-print.pdf)|published-print|
|`4.pdf`|[2023_Qiao_Yb_3P2-3S1-MTS_published-print.pdf](../papers/2023_Qiao_Yb_3P2-3S1-MTS_published-print.pdf)|published-print|
|`5.pdf`|[2020_Zhou_Yb_649nm-MTS_published-print.pdf](../papers/2020_Zhou_Yb_649nm-MTS_published-print.pdf)|published-print|
|`6.pdf`|[2024_Zhao_Yb_1389nm-absolute-frequencies_published-print.pdf](../papers/2024_Zhao_Yb_1389nm-absolute-frequencies_published-print.pdf)|published-print|
|`7.pdf`|[1984_Aymar_Yb_Odd-parity-Rydberg-MQDT_published-print.pdf](../papers/1984_Aymar_Yb_Odd-parity-Rydberg-MQDT_published-print.pdf)|published-print|
|`8.pdf`|[1976_Rambow_YbI-YbII_Hanle-lifetimes_published-print.pdf](../papers/1976_Rambow_YbI-YbII_Hanle-lifetimes_published-print.pdf)|published-print|
|`10.pdf`|[1997_Fisk_171Yb-ion_12p6GHz-clock-frequency_published-print.pdf](../papers/1997_Fisk_171Yb-ion_12p6GHz-clock-frequency_published-print.pdf)|published-print|
|`1999_Honda_Yb_1P1-branching-limit_published.pdf`|[1999_Honda_Yb_1P1-branching-limit_published-print.pdf](../papers/1999_Honda_Yb_1P1-branching-limit_published-print.pdf)|published-print|
|`1999_Honda_Yb_1P1-branching-limit_erratum.pdf`|[1999_Honda_Yb_1P1-branching-limit_erratum-published-print.pdf](../papers/1999_Honda_Yb_1P1-branching-limit_erratum-published-print.pdf)|published-print;erratum|
|`1994_Blagoev_Lanthanide-lifetimes-compilation_published`|[1994_Blagoev_Lanthanide-lifetimes-compilation_published-scan.pdf](../papers/1994_Blagoev_Lanthanide-lifetimes-compilation_published-scan.pdf)|published-scan|

12份重命名前均备份并建立固定清单；目标文件必须不存在，使用排他硬链接再移除旧目录项的方式保留同一inode。逐份复核SHA-256、字节数、mtime和inode，均未改变；其余44个文件的路径与字节也保持不变。未覆盖目标、重写PDF或丢弃注释。

## 当前路径与历史证据

`references/paper-path-aliases.json`是唯一的更名路径映射入口，绑定oldPath、当前path和原SHA-256。索引生成器输出当前规范名，并保留aliases和版本纠正说明；旧依赖队列、生产原子数据及历史科学结果保留原路径，校验时按原哈希解析新位置。旧路径若仍出现被篡改文件，校验必须失败，不能用新文件掩盖。

原子数据、物理公式、主图布局、运行时decay采用值与来源小标均未修改。本轮没有自动将新全文替换为生产采用值，也没有更新旧审计的历史结论。旧版本记录写作publisherPDF而实际为Safari/Quartz副本的差异，在当前identityReview及versionNote明确纠正，不改写历史。

## 新全文核对范围与待解决项

|文献|原文定位和结论|边界|
|---|---|---|
|[Magneto-optical trapping of Yb atoms and a limit on the branching ratio of the 1P1 state](https://doi.org/10.1103/PhysRevA.59.R934)|PDF p2/R935: All following quantitative measurements are on174Yb; natural-isotope survey does not make these171Yb data.<br>PDF p3/R936 Fig4 and text: Fluorescence ratio mean1.21e-7, standard deviation0.39e-7; authors call it a lower limit on total branching because only cascades terminating in3P1 are detected. This is not direct1P1-to-single-lower-state beta.|Original plus erratum available and identity read; no production atomic value changes. Read jointly with erratum; absolute leakage comparison to Porsev theory remains an unresolved experimental/theory issue.|
|[Erratum: Magneto-optical trapping of Yb atoms and a limit on the branching ratio of the 1P1 state [Phys. Rev. A 59, R934 (1999)]](https://doi.org/10.1103/PhysRevA.60.2603.2)|PDF p1/2603 items1–3: Correct3D1/3D2 lifetimes380ns/460ns, correct398nm to399nm and796nm to798nm.<br>PDF p1/2603 complete erratum: No correction to branching lower limit is stated. These quoted D-state lifetimes are not a new direct lifetime measurement and do not override more recent adopted lifetime sources.|Full one-page erratum inspected and rendered; no calculator/formula or canonical data changed.|
|[Power-dependent loss from an ytterbium magneto-optic trap](https://doi.org/10.1103/PhysRevA.61.051401)|PDF p2/051401-2: Remainder of experiments focuses on174Yb MOT. Excited fraction f modeled using trap-volume energy density, detuning and saturation.<br>PDF p3/051401-3 TableI: Experiment effective cascade rate a2,0=23(11)s^-1; cited previous a1=21.3(2.6)s^-1; predicted6.6(4.6) and5.2(2.6)s^-1 respectively.<br>PDF p3/051401-3 last right-column paragraphs: Authors say experimental absolute rates exceed theory by about4; ratio agrees within uncertainties; discrepancy cause unresolved. Excited-state fraction uncertainty around50% dominates inferred a2,0.|MOT model-dependent effective cascade population rates; not direct fine-structure beta and not171Yb hyperfine-resolved decay validation.|
|[Lifetimes of Rydberg levels in the perturbed 6snp 3P2 series of ytterbium I](https://doi.org/10.1103/PhysRevA.47.1551)|PDF p1 introduction;PDF p3/TableI: Measured neutralYb6snp3P2 n12–19 and two perturbers. TableI lifetimes149,172,1560,2700,3000,1160,2180,2640ns for n12–19; two perturbers328/100ns. Not65S data.<br>PDF p2/1552 discussion: Authors estimate about10% overall accuracy including statistical scatter and estimated systematic errors; LN2-cooled shield change comparable to uncertainties; room-temperature lifetimes plotted. No explicit171Yb isotope/F assignment.|All3pages text reviewed; TableI content not promoted into canonical data in file-management task. Numeric OCR remains secondary to original table image.|
|[Lifetimes of Levels of Neutral and Singly Ionized Lanthanide Atoms](https://doi.org/10.1006/adnd.1994.1001)|PDF p13 reference75: M.L.Burshtein,Ya.F.Verolainen,V.A.Komarovskii,A.L.Osherovich,N.P.Penkin,Opt.Spectrosc.(USSR)37,351(1974). Original remains missing; secondary bibliography corroborates citation only.<br>PDF p33/TableXXV,17992.01cm^-1 row3P1: Compilation lists850(80)ns,methodDC,reference75(Burshtein1974). This is a secondary-transcribed value, not a primary-source recheck. Same table lists3S1 15.9(1.9)ns fromreference78(Baumann1985).|Image-only; reviewed selected Yb-related pages and bibliography via rendering+OCR, not all lanthanide entries. No claim of40pagecomplete data extraction or originalBurshtein availability.|

上述表格为原文事实/适用性记录，并不构成新的完整分支表或独立¹⁷¹Yb实验验证。Honda/Loftus的实验与理论绝对漏出率差异仍需专门核查。Guo数值尚未接入生产数据；Blagoev只有所列相关页核查，没有完成全汇编逐表提取。

## 缺失原文

Burshtein等，*Lifetimes of the ³P₁ level of Yb I and the ²P₃/₂,₁/₂ level of Yb II*，Optics and Spectroscopy37,351(1974)，DOI尚未确认。Blagoev1994 PDFp13参考75确认卷页，p33表XXV是二级引用，原始测量方法/误差仍须原文。文件名`1974_Burshtein_YbI-3P1-YbII-lifetimes_original-scan.pdf`保持待获取。

## 可重复检查

```sh
npm run references:check
npm run literature:check
node data/literature/decay-audit-2026-11-04/verify.mjs
npm run check
```

检查结果、受保护文件指纹、全部56个原件的改名前后身份及回退清单留在本地`references/local-only/received-decay-20261104/`。原件缺失的新检出仅报告unavailable，不能继承本机验证成功状态。

最终验收：454项单元测试通过，构建及94份发布产物检查通过；56份中央PDF、47份外部原始库文件及3项附件的当前指纹全部匹配。22个受保护文件与任务开始时相同；56份PDF的SHA-256、字节数、inode和mtime均未改变。历史decay档案16份登记原件均可在更名后验证，未误报unavailable。
