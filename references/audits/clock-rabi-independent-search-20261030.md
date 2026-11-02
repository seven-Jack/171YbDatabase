# 578 nm Rabi–power：第二篇独立实验基准的检索

归档说明（2026-10-31）：[归档元数据](../../data/literature/clock-rabi-crosscheck-search-2026-10-30/archive-metadata.json)以`8203da5`（软件0.3.3）为归档基线，保留2026-10-30原始输入、结果/CSV、验收文件及截图。文中测试数、原件状态和保护文件检查属于2026-10-30历史快照；当前验收须另运行只读`--check`并记录版本和当前原件可用性。归档不改变条件比较、历史来源待补及独立Rabi实验验证未闭合的结论。

日期：2026-10-30。范围：中性¹⁷¹Yb的¹S₀–³P₀直接578 nm驱动；保留主跃迁图和生产计算器。

**本轮核读的候选中，尚未找到功率、明确束腰定义和独立实测Rabi频率全部对应同一操作点的另一篇文章。不能据此宣布578 nm计算器通过了新的实验交叉验证。**这是一轮有边界的文献检索结果，不是声称全球不存在这样的文章。

## 验收条件

1. 功率属于产生被测Rabi信号的578 nm光束，并注明测量位置；光源最大输出、倍频器输出或另一条冷却光路的功率不能代替。
2. 束腰明确区分半径、直径和强度定义；生产计算器输入为高斯光束的1/e²强度半径。
3. Rabi频率来自独立测量或明确的实验数据拟合；不能把光谱FWHM、Ramsey条纹间隔、估计功率展宽或名义π时间直接记成实测Ω/2π。并不要求测量必须是时域法。
4. 三项属于同一操作点。偏振、F/mF通道、运动平均及标定误差也应足以判断实验与束心计算的差别。
5. 用独立原子强度输入正算；不能先调有效功率或矩阵元贴合实验，再把贴合结果当独立验证。

## 最接近的原文

| 文章及原文位置 | 已取得的参数 | 尚缺什么，为什么不能判通过 |
|---|---|---|
| Lis et al., *Midcircuit Operations Using the omg Architecture in Neutral Atom Arrays*, PRX13,041035(2023)，[DOI](https://doi.org/10.1103/PhysRevX.13.041035)；PDF pp.2–3 Fig.1、p.11 AppendixB.1、p.12 B.2 | 光钟实测Ω/2π≈0.11 MHz；原子处束腰半径≈20 µm | 90 mW是倍频器输出，之后还经过AOM和光纤，未报告该振荡曲线对应的原子处功率。束腰虽写radius，强度定义仍未明确。 |
| Zhang et al., *Sub-recoil clock-transition laser cooling enabling shallow optical lattice clocks*, PRL129,113202(2022)，[DOI](https://doi.org/10.1103/PhysRevLett.129.113202)、[含补充材料原文](https://arxiv.org/pdf/2206.09056v1)；PDF p.2、p.6 | 径向578 nm光≈5 mW，waist=400 µm，报告Rabi频率>3 kHz，并展示激发时序 | 400 µm没有明确半径/直径及1/e²定义；>3 kHz只是下界，没有匹配的定量拟合结果/误差。对向正交偏振光束的每束功率及通道分配也未闭合。170 µm的1/e场半径属于759 nm晶格。不能把约0.1 ms的首次最大值自行改写成原文实测5 kHz。 |
| Zaporski et al., *Quantum-amplified global-phase spectroscopy on an optical clock transition*, Nature646,309–314(2025)，[DOI](https://doi.org/10.1038/s41586-025-09578-8)、[作者原文](https://eapg.mit.edu/wp-content/uploads/2026/01/Zaporski_et_al-2025-Nature.pdf)、[含SI版本](https://arxiv.org/html/2504.01914v2)；PDF pp.5、7、10 | Extended Data Fig.2有真正钟跃迁Rabi振荡；Methods给4.2 kHz，主文另一个操作参数为4.55 kHz | 正文、Methods和附带SI没有给出匹配的钟光数值功率与束腰。两处Rabi操作参数不能自行合并。 |
| Muniz et al., *High-Fidelity Universal Gates in the 171Yb Ground-State Nuclear-Spin Qubit*, PRXQuantum6,020334(2025)，[DOI](https://doi.org/10.1103/PRXQuantum.6.020334)；PDF pp.9–10 AppendixC | 原子平面椭圆束腰400×35 µm；钟跃迁工作Rabi范围3–15 kHz | 没有给出与某个被测频率配对的数值钟光功率，也未明确该处束腰的强度定义。 |
| Bettermann, *Interorbital interactions in ytterbium-171*，博士论文(2022)，[DOI](https://doi.org/10.5282/edoc.32171)、[原文](https://edoc.ub.uni-muenchen.de/32171/1/Bettermann_Oscar.pdf)；打印pp.33、43 / PDF pp.45、55 | 原子处最大可用功率≈100 mW，w₀≈200 µm，明确I=2P/(πw₀²)；另有时域Rabi曲线 | 没有给曲线对应的实际功率。100 mW是装置上限，不能与较低功率的振荡曲线硬配。它本身也不是用户要求的期刊文章。对应PRA108,L041302(2023)，[DOI](https://doi.org/10.1103/PhysRevA.108.L041302)，正文与SM没有补齐功率。 |
| Hoyt et al., *Observation and Absolute Frequency Measurements of the 1S0-3P0 Optical Clock Transition in Neutral Ytterbium*, PRL95,083003(2005)，[DOI](https://doi.org/10.1103/PhysRevLett.95.083003)、[NIST原文](https://tf.nist.gov/general/pdf/2038.pdf)；PDF p.2 | 20 mW；明确1/e²半径约1 mm；Rabi率约2π×4 kHz | 原文明确将该Rabi率称为估计值。测得的是MOT耗尽光谱，不能用理论估计值验证同一个强度换算。 |

## 2026年原子束钟：有用的拟合，但仍不是完整三参数基准

Offer et al., *Portable laser-cooled ytterbium beam clock based on an ultra-narrow optical transition*, Optica13,677–685(2026)，[DOI](https://doi.org/10.1364/OPTICA.584095)、[作者机构原文](https://strathprints.strath.ac.uk/96758/)，[Supplement1，v2](https://doi.org/10.6084/m9.figshare.31537450.v2)。正文p.678、Supplement PDF pp.2–3 §1.2–1.3给出：

- 578 nm线偏振，作用于两个mF=±1/2基态；进入Ramsey–Bordé光学阶段可用功率1070 mW。
- 正文给光束diameter=1 mm，但没有明确将它与1/e²强度直径、束腰位置及四条相互作用光束逐一对应。
- 为匹配95 m/s处测得的Doppler对比度，模型设置P₀=338 mW；作者据此给出峰值Rabi率2π×22 kHz，并说明有效功率约为测得激光功率的1/3。

这里22 kHz来自对比度模型中有效耦合的拟合，是实验约束的模型量；338 mW不是独立功率读数。**不能把338 mW当成实测功率输入，再以22 kHz判定独立验证通过。**1070 mW也只是该光学阶段的可用功率，还缺每条相互作用光束处的透射损失/有效模式标定。原文没有完整给出具体q通道及矩阵元约定。

正文Eq.(2)所引Strathearn et al., *Wave-front curvature in optical atomic beam clocks*, PRA108,013105(2023)，[DOI](https://doi.org/10.1103/PhysRevA.108.013105)、[模型原文](https://arxiv.org/pdf/2212.00308)，用场振幅exp(−v²t²/w²)定义w，因此其模型w对应1/e²强度半径。但模型的约定不能自动证明2026年装置文字中的1 mm就是2w₀。这个联系需要明确实验说明。

7 kHz的Ramsey条纹周期和3.5 kHz的相关宽度也不是Rabi频率。约1/3的有效功率折减暂不归因于CG因子、模式损失或其他某个唯一原因；现有参数不足以区分。

## 其余候选与排除

- Wang2022，CPB31,090601，[DOI](https://doi.org/10.1088/1674-1056/ac5392)：Fig.5载波Rabi约330→310 Hz；5 mW属于侧带冷却序列，没有载波曲线对应的绝对功率。
- Shu2024，PRR6,L032049，[DOI](https://doi.org/10.1103/PhysRevResearch.6.L032049)：Fig.4(a)有钟跃迁时域振荡；正文与SM没有钟光P/w。27/130 µm属于晶格，13.7 µm属于556 nm腔模。
- Takata2019，RSI90,083002，[DOI](https://doi.org/10.1063/1.5110037)：324 Hz是频域高斯谱宽；约100 Hz为估计功率展宽，18 mW为光源输出。
- Norcia2023，PRX13,041034，[DOI](https://doi.org/10.1103/PhysRevX.13.041034)：AppendixF用钟光做Ramsey测量，但缺P/w及实测光钟Rabi；1.4 kHz属于核自旋双光子Raman。
- Darkwah Oppong2021博士论文的7.21(1) kHz曲线明确属于¹⁷³Yb，不能借作¹⁷¹Yb数据。Peper2025的20 mW、12 µm、2.5 MHz属于302 nm里德堡激发。Barber2006是¹⁷⁴Yb；Nature634,321(2024)使用⁸⁸Sr。

## 留存与当前结论

[逐项事实与缺项JSON](../../data/literature/clock-rabi-crosscheck-search-2026-10-30/candidates.json)保存已登记候选、原文位置、DOI、下载入口、原件路径和SHA-256。原PDF保留在本地`references/papers/`，不覆盖既有文件，也不随公开Git上传。候选检索记录单独索引，不改变canonical书目和原子参数。

Lis、Zhang、Zaporski、Bettermann、Norcia、Offer正文及SM的新原件均已保留；Muniz采用现有原件。**这些近匹配的缺口主要是原文没有报告所需实验标定，而不是还缺一份可下载PDF。**

现有[独立HFI率→矩阵元核查](clock-rabi-578-audit-20261030.md)仍有效，但不等于新增了独立P–w–Ω实验验证。当前不新增“通过”案例，不调整canonical矩阵元、CG因子或生产Rabi–power代码。主跃迁图的保护文件逐项SHA-256核对结果见核查包的`verification.json`。
