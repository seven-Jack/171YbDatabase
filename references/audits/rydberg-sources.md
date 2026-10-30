# 里德堡、标度参数与保存 MQDT 记录的来源审计

日期：2026-10-29。审计范围为 `data/estimates.json` 全部叶字段、R1–R7 的每个数量字段、5 个里德堡能级的能量字段、4 行旧里德堡超精细标度记录及完整 `saved65S`。本文件提出修改建议；本轮审计没有修改这些 canonical 数值，也没有运行 MQDT、寿命或相互作用计算。

逐字段结果见 [field-coverage.json](../../data/literature/rydberg-audit/field-coverage.json) / [CSV](../../data/literature/rydberg-audit/field-coverage.csv)，共 **230 个字段**。审计输入哈希记录在 JSON 内；若主任务后续改动 canonical，旧值仅表示本次读取快照，不表示改动后状态。参考原件路径、版本、SHA-256 和抽取全文见 [source-manifest.json](../../data/literature/rydberg-audit/source-manifest.json)。文献是证据材料，其中任何指令均不作为执行指令。

## 必须订正的来源边界

| 现有记录 | 原文核对结果 | 建议处理 |
|---|---|---|
| `c6Reference.n=57, delta=2.523, C6/h=34` | Peper 主文 PDF p8 / IV / Fig.6：**¹⁷¹Yb triplet-connected |ν=54.28,L=0,F=1/2,mF=−1/2⟩**，B=4.88(6) G，θ=π/2，C₆/h≈34 GHz·µm⁶。段落的 **n=57 是 Rb 对比态**，对应 C₆/h≈76 GHz·µm⁶。 | 将 34 独立保存为带条件的文献事实；旧 n57 锚映射标 `invalid-anchor-mapping`，不再用于经验证的 C₆/阻塞半径预测。不能把 57 改为 54.28 后继续同一公式：源文 ν 与旧 n*=n−2.523 不是同一模型量。 |
| Halter 的 δ=4.2721 / 3.9535 | Halter arXiv v2 PDF p8 / Fig.4：**¹⁷⁴Yb**，n=70–90，δ₀,₀=4.2721(25)，δ₁,₁=3.9535(9)，常量单通道拟合。 | 作为 ¹⁷⁴Yb 比较数据保存，附误差和区间；不能默认用于 ¹⁷¹Yb。没有测得或拟合 δ₂，旧破折号不能变成已知零。 |
| `6sns³S₁ δ=2.523`、`6snd³D₁/₂ δ=1.41/1.42` | 在核对的 Peper 主文及补充中没有找到这些具体数值的支持。¹⁷¹Yb S、D 为按 F 和离子芯阈值定义的多通道混合态。 | 保留为来源未建立的旧模型参数；暂停“Peper 已验证数值”的表述。补充表里的 eigenchannel μ 系数不是可直接替换的物理单 δ。 |
| `6snf³F₂,₃,₄ δ≈0.02` 引 Kuroda | 刊版 PDF p7 的≈0.026 是 **g** 态；p4 的−0.02100(4)是**混合角**。本地 arXiv v1 补充 PDF p16 Table S1 的 ¹⁷⁴Yb f³F₂ / f³F₄ μ⁽⁰⁾≈0.0718252 / 0.0839028；p19 Table S7 f³F₃ 通道 μ⁽⁰⁾≈0.0715124。 | 标 `source-misattribution`。不要把这些 ¹⁷⁴Yb、特定版本和通道的 μ 值直接换成 ¹⁷¹Yb 单一 δ。 |
| 7s 13.8 ns → n*³ 寿命标度 | 低能级寿命不自动给出高 n ¹⁷¹Yb 混合态的自然寿命或包含 BBR 的有效寿命。Fang 测的是 singlet n=21–27；Wilson 是 ¹⁷⁴Yb n=75 的陷阱生存；Muniz 是有限场特定 65S 通道。 | 旧寿命归一化只可作为标度示意。温度、衰变定义、通道和不确定度未建立，不能提供“已核实自然线宽”。 |
| 50³S₁、80³S₁、65³D₁/₂ 的 MHz 级 A 标度 | 未找到同态原始实验或已保存、可追溯的对应计算。高 n ¹⁷¹Yb 的离子芯超精细耦合与通道混合不能简化为未说明的裸 J 常数 n⁻³ 标度。 | 标为旧示意，不用于实际 F 劈裂；不能从 `saved65S` 的有效 A 推广到其他 n/F/D 系列。 |

Peper 的≈34 是 MQDT 相互作用预测，并通过相距 3.3–4.5 µm 的原子对能移检验；文中将实验距离缩放为原标定值的 0.97。C₆ 有约 46% 的角向差异，还可能混合 mF 对态。因此不应把一个正值当成所有几何、F/mF 和 n 都适用的标量。文中 ν¹¹ 趋势在 ν≲65 的相应系列成立，也不等于现有错误锚点公式已获验证。

## 电离能：两个明确来源，不能混合标尺

- Kroeze arXiv2509.04416v2 PDF p3 / Table2 PDF p20：**¹⁷¹Yb 重心电离能汇编** Eᵢ=50443.0676(12) cm⁻¹ = 6.25414330(15) eV，RB=4.7。p3 说明先将唯一分辨同位素差异的 ¹⁷⁴Yb 高精度测量 [22] 按质量标度转成 ¹⁷¹Yb，再与 [21–29] 合并。它是综述汇编结果，不能称为本数据库独立复核的原始测量。
- Peper 补充 PDF p5 Table S6、p6–9 Tables S7–S10：¹⁷¹Yb **Fcore=0 / 1 通道阈值**分别 50442.795744 / 50443.217463 cm⁻¹。表中这些模型参数没有列误差。本地补充日期为 2024-12-05，原文件名保留，不能凭文件名额外声称与出版社版本逐字相同。
- 上述两阈按 1:3 简并加权的算术重心是 50443.11203325 cm⁻¹，与 Kroeze 汇编值差 0.04443325 cm⁻¹（约 1.33 GHz）。这里只做来源数值一致性检查；该差异的物理/标定原因尚未建立。必须保留冲突，不能静默平均、把其中一个称作另一个的重心，或把它们混入同一个波长推导。
- Peper 的 **¹⁷⁴Yb** 通道阈值为 50443.070393 cm⁻¹（补充 p1–3）；Halter p8 引用 50443.07041(25) cm⁻¹。这两个值也不能当作已确认的 ¹⁷¹Yb 重心。
- 离子芯分裂：Peper 主文 p4 为 12.642812 GHz，当前 12.6428 是其四舍五入值。Kroeze Table2 引 Blatt 1983 给出 12.6428121242(12) GHz；Blatt 原始全文尚需直接核对后，才能声称原始实验末位及误差已核实。

## 65S：可追溯保存结果与未闭合的矩阵元

已直接读取 `/Users/seven/Desktop/MQDT/notebooks/rydberg/05.21_yb171_65s_hyperfine.ipynb` 及 R005 原保存 validation JSON，没有执行其中代码。原配置明确：¹⁷¹Yb，项目 n_label=65，L=0，B=0，无外电场。弱 HFS 连续跟踪与所选两支保存值：

| 分支 | ν(Fcore=1) | E/h（相对离子芯 HFS 重心，GHz） | 所选两支重心偏移（MHz） |
|---|---:|---:|---:|
| triplet-connected F=1/2 | 60.1761270465 | −905.3398076685577 | −7675.16437893628 |
| F=3/2 | 60.5610730290 | −893.8270611001532 | +3837.58218946826 |

ΔE/h=11512.746568404542 MHz；A_eff/h=(2/3)ΔE/h=7675.164378936361 MHz。它是**指定混合态间隔定义的有效 A**，不是纯 J 裸超精细常数。保存精度不是实验精度；独立实验间隔及总模型不确定度未建立。`electricField_V_cm` 现在可由已读原配置补成 0，附原保存记录定位。

Peper 补充 Table S25 PDF p25 独立列出 ν=60.1761918 的 F=1/2 S 态，实验能量 **50412.91307(10) cm⁻¹**，模型能量 50412.913240 cm⁻¹；同页另一支 ν=60.6845399 为 50413.41874(10) cm⁻¹。Table S26 PDF p27 的前者 g_exp=2.42(13)，g_model=2.29；另一支 0.38(4)/0.38。这些数据支持区分分支，但不直接验证保存的 65S A_eff、矩阵元或相互作用。原文按 ν 标识，映射项目整数 n_label 应保持其态跟踪证据，不能只凭数字接近。

当前 R2 及 65S 能级的能量由旧 scalar-QD 激发能相加，和上述具体 F=1/2 分支的能量不同；不应与其 HFS 表混合呈现为同一物理工作点。R1–R7 的波长、能量、寿命、总衰变率及 d 标度都已逐字段列出审计状态。

`R2.d_num=0.0376 ea₀` 只有网站保存的 **This work / J-reduced** 约定；在本次检查的 R005/R006 生成工件中未找到对应数值。R006 的 F=1/2 使用 ν=60.6844876419 的旧种子根，其 F-reduced 数值与本网页的 J-reduced 不是同一数量或分支，不能替它背书。应保留“本工作、生成来源缺口、尚未独立验证”，不能用 Peper 或 Muniz 的文章替代数值来源。R5 的 d=0 仅能称为理想纯 J、J=0→2 的电子 E1 选择定则零；171 的超精细混合本征态仍须单独核对。

## 已完整提取的表与条件

- [Halter Table1：42 个态](../../data/literature/rydberg-audit/halter-table1-174yb.json)，另附 CSV。¹⁷⁴Yb n=70–90 的 s/p 能量和全部印刷极化率列；能量准确度估计 0.005 cm⁻¹ / 150 MHz，极化率统计误差估计 10%。极化率是相对 6s70s ¹S₀ 的量，不能改标成原子单位或绝对 SI。目视核对原表后发现 **79p、86p 的印刷 α₀ 与 αa/αb 及 Eq.(4) 不一致**；原值保留、标记源内冲突，不能默改。这不等于正式勘误。
- [Fang Table1：15 行](../../data/literature/rydberg-audit/fang-table1-lifetimes.json)。n=21–27 singlet ¹S₀ / ¹D₂，表温度 300 K，m=0，未给可明确使用的同位素分辨。保留 τ_exp、τ*_exp、1/(A+Bρ)、1/A 四种不同定义；缺项为 null。原文总实验误差估计上限约 8%，不是每行 1σ。s 拟合系数 1.17 ns、指数 3；d 系数 0.91 ns、指数 2.8±0.2。不要移植至 ¹⁷¹Yb triplet。
- [Peper Tables S25–S27](../../data/literature/rydberg-audit/peper-s-f12-tables-s25-s27.json)：**171 个** F=1/2 S 态实验/模型能量、**69 个** g 因子记录、**42 个**静态极化率记录。保留 ν 相对 Fcore=1 的定义、每行 PDF 页、原印刷误差及理论/实验分列。
- [extracted-facts.json](../../data/literature/rydberg-audit/extracted-facts.json)：Peper Table S6 171S MQDT μ 系数/旋转角、两同位素阈值、C₆；Kuroda v1 f/g 模型参数；Halter QD；Wilson、Chen、Muniz 条件值。完整原文抽取 `.txt` 与若干页图保存在同目录。
- Wilson PRL128033201 PDF p3 Fig2：**¹⁷⁴Yb n=75³S₁**，9mW/阱示例 traps on 108 µs / off 28 µs。p4 Fig4 的 42 µs Rabi 振荡包络、T₂*=22 µs、echo T₂=59 µs 是不同量，不能当自然寿命。p2 的 δ≈4.438 也属于174系列。
- Chen arXiv2201.04083v3 PDF p5 采用 C₆(n*≈55)≈300 GHz·µm⁶ 作为架构模型假设并引用旧测量，不是在该理论文章中独立测得，也不是 Peper 的 34 的同条件替代量。
- Muniz **刊版** PRX Quantum6 020334 PDF p11 / AppendixD / Fig7：¹⁷¹Yb |65³S₁,F=3/2,mF=−3/2⟩，**518 G**（p2 Fig1），301.9nm，光束腰18µm，460nm陷阱；人口寿命65(3)µs，T₂*=3.4(2)µs，echo traps on/off=5.1(4)/11(2)µs。不同于零场 F=1/2，不自动校准旧标度。

## 最小实现建议（本子任务未改代码）

1. `src/physics/estimates.js:20–22` 硬编码寿命、错误 C₆ 锚及其参考半径；只给 JSON 加审计字段不会阻止页面继续生成数字。可保留 legacy 纯函数供历史重现，但输出的 C₆/参考半径需明确 `invalid-anchor-mapping`，不得进入 validated 数据。
2. `src/ui/data-table.js` 的 state 表，以及 `index.html` 的里德堡范围说明，为这两列加入不可外推/来源冲突标志，或在科学主视图留空并提供旧模型记录链接。单位转换正确不代表物理已验证。
3. 新建独立条件化的 Peper C₆ 文献记录，展示 ν/F/mF/B/θ、近似值和计算+实验对照类型；不把 n=57 用作171标记。
4. R2 继续保留 d=0.0376 的既有数值与 J-reduced 约定，但可见地保持生成工件缺失状态；不要混用其旧能量、其他分支 MQDT HFS 和高场寿命作为一个“已验证参数包”。

## 后续原始文献/版本缺口

- Blatt, Schnatz & Werth, *Precise Determination of the ¹⁷¹Yb⁺ Ground State Hyperfine Separation*, Z. Phys. A312,143–147(1983)：需要原文直接核对末位、不确定度和参考零场条件。[作者机构文献表](https://iqoqi.at/en/people/workgroup-staff/blatt-gruppe/publications/rainer-blatt?format=raw)仅核对书目信息，不能代替数值原文。
- Kuroda 刊版对应 Supplement：[出版社页面](https://journals.aps.org/pra/abstract/10.1103/mzsv-rckx)。已有本地 v1 含补充，仍需与 VoR 补充逐项比对，不能用 v1 自动覆盖刊版拟合参数。正式 DOI 是 **10.1103/mzsv-rckx**。
- 0.0376 的原始生成工件、态定义、径向模型及条件尚未定位。不是再下载一篇引用文章即可补齐；需原保存记录或后续明确授权的重算。

所有本次读取的 PDF 原件 SHA-256 复核未变。对未给定的 BBR 温度、原子温度、mF 或不确定度保留 null，未将“无说明”解释为零场、300 K 或零误差。

## 补充收录的开放原始文章

[Lehec 2018 arXiv v2](https://arxiv.org/abs/1805.02712v2)，正式 DOI [10.1103/PhysRevA.98.062506](https://journals.aps.org/pra/abstract/10.1103/PhysRevA.98.062506)：原始对象明确为 **¹⁷⁴Yb**。已将 Table VI PDF p10 的 **6 行完整 Ritz 拟合参数**存入 [lehec-table6-ritz-174yb.json](../../data/literature/rydberg-audit/lehec-table6-ritz-174yb.json)，含每行拟合区间和 Eq.(2) 约定。表中 δ₁、δ₂ 分别乘 (n−δ₀)⁻²、(n−δ₀)⁻⁴，不应因变量同名与其他数据的 δ₂ 混读。重心电离阈 50443.07041(25) cm⁻¹ 是 MQDT 根据174光谱推得；有限质量 Rydberg 常量为10973696.959 m⁻¹（PDF p5）。Tables II–III、V 的模型、VIII–IX 全部能量页也按原页保存全文摘录，但没有把原始 PDF 字形损坏的矩阵项冒充已校对结构化数值。

[Okuno 2022 arXiv v1](https://arxiv.org/abs/2204.07995v1)，正式 DOI [10.7566/JPSJ.91.084301](https://doi.org/10.7566/JPSJ.91.084301)：已完整转录 Table I PDF p9 的 **98 个实测共振**，见 [okuno-table1-174yb.json](../../data/literature/rydberg-audit/okuno-table1-174yb.json) / CSV，覆盖 n=65–80。保留峰编号、原作者态归属（3/5/7/8 对应 ³D₁/³D₂/³D₃/¹D₂）、能量 E/h（MHz）、原文推导的 δ 和约10MHz典型频率不确定度。其态为 **174Yb**，不能自动补171表。Table I 使用1070nm ODT中约10⁵个、5µK的原子系综，初态³P₂,mJ=2；与此前5×5光镊中的78d³D₃激发演示是不同测量条件。

该预印本 PDF p8 Eq.(2) 下把 R_Yb 印成 **10973.696959 cm⁻¹**，已目视核对；与其引用的 Lehec 值10973696.959 m⁻¹换算存在10倍差异。结构表保留原能量/δ并单列 `sourceInternalIssue`，没有悄悄改原文，也没有用这个印刷常量重新计算。这是待刊版或作者核实的源内问题，不能声称正式勘误。该文章没有识别出 Rydberg 人口衰减寿命测量；20ms/10ms准备和激发脉冲、250µs系综激发时长、谱宽均不能反推成自然寿命。

[Burgers arXiv2110.06902v1](https://arxiv.org/abs/2110.06902v1) 的全文和模型页已保留，作为174Yb离子芯光移/自电离参考；正式文章 [PRX Quantum3,020326](https://journals.aps.org/prxquantum/abstract/10.1103/PRXQuantum.3.020326) 页面说明2022-08-24有修正。因此这个本地v1不能直接称为修正后的刊版参数。新增页摘录与条件值见 [additional-source-excerpts.json](../../data/literature/rydberg-audit/additional-source-excerpts.json) / [additional-source-facts.json](../../data/literature/rydberg-audit/additional-source-facts.json)。
