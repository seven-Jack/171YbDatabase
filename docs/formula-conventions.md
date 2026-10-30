# 计算接口、约定与独立基准

本轮提取自 `index.html`，基线提交 `2e2e9d5`。Rabi 与角因子保留既有常数和结果；公式 1.0.1 单独更正了 a₀ 的 µm 换算指数，估算半径按原有三位小数规则重新展示，其他估算字段不变。这里的测试验证工程实现和给定约定下的数值关系，不确认原子数据、态归属、模型精度或实验工作点。

## 单光子 Rabi

`src/physics/rabi.js` 是正式公式的唯一来源。模型为光束中心的单光子 E1 耦合，高斯光束 `w0` 是 1/e² 强度半径：

```text
I0 = 2P / (π w0²)
E0 = sqrt(2 I0 / (c ε0))
Ω = d_eff E0 / ℏ
fR = Ω / (2π)
tπ = 1 / (2 |fR|)
```

- `singlePhotonRabiSI(d_Cm, power_W, waist_m)`：输入 C·m、W、m；返回 I0（W/m²）、E0（V/m）、`omega_rad_s`（rad/s）、`fR`（Hz）、`tPi`（s）。
- `spRabi(d_ea0, P_mW, w_um)`：兼容既有页面单位，返回同一结果。
- `rabiHz(d_ea0, P_mW, w_um)`：返回普通频率 Ω/2π，单位 Hz。
- `powerFromRabiHz(d_ea0, rabi_Hz, w_um)`：反算 mW。
- `waistFromRabiHz(d_ea0, rabi_Hz, P_mW)`：反算 µm。
- 零功率返回零频率及无限 π 时间；零耦合/零频率不能用于非唯一的束腰反算。
- 负功率、非正束腰、空值、字符串、NaN/Infinity 明确失败，不自动变成零。
- 正式数值计算针对有效通道的功率；页面若显示偏振相关总功率，应在 UI 的明确约定中做转换，不改这里的 E1 公式。

该模型不增加失谐、离轴、退相干、有限场态混合或门动力学修正。原页不可达 Raman 近似未迁移成正式支持的 API；缺乏适用多通道模型时不以单光子函数代替。

## 角动量与矩阵元

`src/physics/angular.js` 使用 Condon–Shortley 相位约定：

```text
CG = <F mF; 1 q | F' mF'>
dF = (-1)^(J'+I+F+1) sqrt((2F'+1)(2F+1)) {J' F' I; F J 1} dJ
d_channel = CG * dF / sqrt(2F'+1)
```

- `sixJ(j1,j2,j3,j4,j5,j6)` 保留旧接口：六个参数都为 **2j 整数**。
- `cg(j1,m1,j2,m2,J,M)` 接收实际整数/半整数角动量。
- `reducedFFromJJ(Jp,J,Fp,F,dReduced_JJ,nuclearSpin=0.5)` 输入 J 级约化矩阵元，输出带符号的 F 级约化矩阵元。
- `matrixElement_F_q(F,mF,Fp,mFp,q,dReduced_F)` 输入已经得到的 F 级约化矩阵元；不能再次施加 J→F 因子。
- `computeCGChannels(state)` 给出所有偏振的全分量通道；`computeHfChannels(state,allPol=false)` 用于有效 F 级约化量。
- `computeDEff(state)` 使用明确选中的合法通道，否则按当前 F/F′/偏振选最强允许分量；输出耦合幅度的绝对值，表中的 `matEl` 与角因子仍保留符号。
- 所有纯函数不读取 DOM、不修改传入状态。明显非法的角动量输入失败；满足输入定义但违反选择定则的耦合返回零。
- 当前 Racah 数值实现和独立基准覆盖页面使用的低角动量范围，不声称已验证任意大 j 的数值稳定性。

T3 的 `9.19e-5 ea0` 沿用旧记录的有效 F 级约化量，使用专门分支直接进入 `matrixElement_F_q`。它不能和 T2、R2 的 J 级约化量交换使用。T2、T3、R2 的原子矩阵元本身没有在本轮重新确定。

## Γ、普通频率线宽与寿命

`dipoleFromDecayRate(decayRate_s_inv,lambda_nm)` 以 Γ（s⁻¹）为参数。兼容名 `dCycFromGamma(gamma_Hz,lambda_nm)` 中旧参数实际是普通频率 FWHM（Hz），函数先乘 2π 得 Γ，保留旧版数值。

```text
d_cyc = sqrt(3 π ε0 ℏ c³ Γ / ω0³)
ω0 = 2π c / λ
Δν = Γ/(2π)
```

这个推断需要衰减定义及循环/分支关系适用。仅仅发现表头写 Γ/2π、原始显示串写 `2π × …`，不能据此确认底层计算存在 2π 错误，也不能直接用某个人口寿命替换所有线宽。

## 独立角动量基准与旧结果快照

- `tests/fixtures/angular.json` 使用 **SymPy 1.14.0** 的 `clebsch_gordan`、`wigner_6j` 独立生成，保留精确根式、双精度值、生成器版本及约定，共 192 个 CG、25 个 6-j 和 192 个完整角因子案例。
- [SymPy 官方 Wigner Symbols 文档](https://docs.sympy.org/latest/modules/physics/wigner.html) 说明参数顺序与相位约定。
- 重生成：在自行准备的 Python 环境安装 `sympy==1.14.0`，运行 `python scripts/generate-angular-fixtures.py`；常规 Node 测试直接使用保存的 JSON，不依赖 Python 或网络。
- `tests/fixtures/physics-baseline.json` 是从原提交运行计算函数保存的回归快照，包括原始页面 SHA-256、T2/T3/R2 共 24 条带符号通道、Rabi 数值、21 个估算态及 7 条里德堡表行。
- 独立 SymPy 对照、旧版回归、Rabi 缩放/单位/反算性质分别给出不同工程证据；它们均不提供原子态分支、物理模型或独立实验验证。

## 估算模型边界

`src/physics/estimates.js` 隔离保留的 `legacy-single-channel-scaling-v1`，包括单通道量子亏损、寿命 n*³ 和 C6 n*¹¹ 标度。这些只是既有展示估算，未重新拟合，也不作为逐态 MQDT 或实验预测。

`generateRydbergStates(config)` 接受数据层注入的旧常数与 n 网格；`buildRydbergTransitions(qcRows)` 只组装已有 R1–R7 数据的显示模型。D 态继续沿用旧实现“先对 S 型中间结果舍入再缩放”的顺序，因此本轮重构没有悄然改变可见末位数值。若后续修改这一约定，应单独提交数值差异与科学理由。

## 1.0.1 单位与科学说明纠错（本地，未发布）

- [NIST CODATA 2018 常数表](https://physics.nist.gov/cuu/pdf/all_2018.pdf)第 1 页 Bohr radius 行：沿用 a₀=5.29177210903×10⁻¹¹m；`A0_UM=A0*1e6`，因此 a₀=5.29177210903×10⁻⁵µm。没有升级常数版本。canonical 估算配置保留兼容的 µm 数值，并用独立单位测试与 SI 来源交叉检查。
- 原实现的 µm 常数小 10 倍。本轮只修该指数；21 行半径及范围概述随之更正。`1.5*a0*n*²` 称 **hydrogenic size-scale estimate**，不是某个 MQDT 径向期望。n*=62.477 时未舍入值为 0.3098366063314863µm，显示 0.310µm；本表三系列 n=50–80 范围为 0.179–0.490µm。
- [NIST 选择定则](https://physics.nist.gov/Pubs/AtSpec/node17.html)区分好量子数下的严格 J/宇称条件、纯 LS 的 ΔS=0 与 ΔL=0,±1（禁 L=0↔0）、忽略组态混合的单电子 Δl=±1。6snl 中 L=l 的受限分支不能代替一般 LS 规则。未改变角因子算法或超精细有效 F 级通道。
- [Kuroda 2507.11487v1](https://arxiv.org/html/2507.11487v1)§IV、Fig.3 讨论奇宇称 6snp/6snf 混合；§VII–VIII 讨论对 D 态 Stark/相互作用计算的影响。零场 6snd 为偶宇称。Fig.10/§VII 的 ¹⁷¹Yb D 极化率实测主要为 ¹D₂ 关联态，不能据此验证本表 ³D₂ 的 δ₀=1.42；原数值出处仍待核验。
- 数据版本更新为 2026.10.26.2，公式版本更新为 1.0.1；软件仍为本地 0.2.0 工作版本。矩阵元、R2 工件缺项、寿命未知条件、65S MQDT 保存数据和物理验证状态保持原样。
- 历史 fixtures 原件不改写。回归测试继续逐字段保护所有未改结果；新单位测试用 NIST SI 值和独立 Decimal 算例检查实际修正。修单位只验证量纲和算术，不验证标度模型或门性能。

## 配置记录

### 2026-10-29 数据审计后的输入边界

数据版本为2026.10.29.1，数学公式仍为1.0.1。T2默认电子J约化矩阵元采用Kroeze v2 Table10的0.5398(6)ea₀，旧内部校准0.543归档；因此固定通道、功率和束腰时，Rabi结果会随矩阵元更新。T3的9.19×10⁻⁵ea₀仍是未找到原始工件的有效F约化内部记录，不能改称Table9文献值；R2的0.0376ea₀也没有闭合到指定生成工件。

核心线宽按原文式(47)的普通频率Δν=Γ/2π解释；源表额外的2π作为冲突保留。寿命是上态总寿命，不能在多分支情况下把Γ直接当某条跃迁的Einstein A。T4的理论采用寿命与F相关超精细诱导E1、M1/M2等通道不能用一个通用E1 d替代。

历史标度纯函数保留作追溯；生产调用`generateRydbergStates(ESTIMATE_CONFIG)`依据`publicOutputPolicy`将寿命、C₆与阻塞半径设为缺失，表格使用同一受隔离数组。源文中34GHz·µm⁶对应Peper的指定171Yb态/磁场/角度，段落的n=57属于Rb比较态；不得用作旧n*¹¹公式的171Yb锚点。原始文献及字段订正详见本地`references/audits/data-source-audit-2026-10-29.md`。

`src/state/config.js` 仅保存和恢复上述固定模型的计算上下文。导出包括软件/代码、数据版本及 SHA-256、公式版本、跃迁 ID、F/mF/q 通道、矩阵元约定、SI 输入及保存输出；完整结构见 `schemas/calculation-config.schema.json`。

`parseCalculationConfig` 会检查跃迁是否存在、F 是否匹配当前能级、通道是否由当前角动量枚举允许、偏振是否一致和输入是否在有效域内。文件中的 `matEl` 不被接受为通道输入；F/mF/q 只作标识，实际矩阵元从当前数据重新计算。保存结果也只作历史比较。

软件、代码、数据、数据摘要或公式版本不同时返回明确的 `warnings`；恢复使用当前模型，不声称能够重建一个已经不可取得的旧模型。矩阵元或保存结果不同会另有提示。调用方应展示这些提示，并在完全解析成功后一次性应用恢复状态；解析失败不能部分覆盖当前输入。配置恢复成功不意味着原子数据或物理模型正确。
