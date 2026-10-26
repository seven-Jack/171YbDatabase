# 计算接口、约定与独立基准

本轮提取自 `index.html`，基线提交 `2e2e9d5`。常数取值、合法输入下的既有计算结果与估算表格的舍入保持原样。这里的测试验证工程实现和给定约定下的数值关系，不确认原子数据、态归属、模型精度或实验工作点。

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

## 配置记录

`src/state/config.js` 仅保存和恢复上述固定模型的计算上下文。导出包括软件/代码、数据版本及 SHA-256、公式版本、跃迁 ID、F/mF/q 通道、矩阵元约定、SI 输入及保存输出；完整结构见 `schemas/calculation-config.schema.json`。

`parseCalculationConfig` 会检查跃迁是否存在、F 是否匹配当前能级、通道是否由当前角动量枚举允许、偏振是否一致和输入是否在有效域内。文件中的 `matEl` 不被接受为通道输入；F/mF/q 只作标识，实际矩阵元从当前数据重新计算。保存结果也只作历史比较。

软件、代码、数据、数据摘要或公式版本不同时返回明确的 `warnings`；恢复使用当前模型，不声称能够重建一个已经不可取得的旧模型。矩阵元或保存结果不同会另有提示。调用方应展示这些提示，并在完全解析成功后一次性应用恢复状态；解析失败不能部分覆盖当前输入。配置恢复成功不意味着原子数据或物理模型正确。
