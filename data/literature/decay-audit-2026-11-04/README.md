# Decay 分支与寿命证据归档

本包把2026-11-04主能级图调查中已经核对的数值、定义、来源和缺口保存为结构化事实。当前主图的8个能级由 `data/levels.json` 的 `coreLevelIds` 指定，含65S/R2。归档不会自动更改原子能量、矩阵元、寿命、物理公式或主图布局。

运行时的显式采用值在 [`data/decay.json`](../../decay.json)，独立版本为2026.11.04.1。这里的7条原文低态理论分支与运行时采用值逐项校验。部分率、实验级联人口、有限时间恢复、不同n或磁场下的寿命及未解决冲突只作为证据保存，不变成目标65S的衰变分支。

## 文件及含义

| 文件 | 内容 |
|---|---|
| [manifest.json](manifest.json) | 日期、范围、文件清单、计数、上轮本地调查工件指纹与采用规则 |
| [source-manifest.json](source-manifest.json) | 18个来源的题名、DOI、原文位置、获取状态及本地原PDF相对路径/SHA-256 |
| [branching-fractions.json](branching-fractions.json) | ³D₁三支、³S₁四支的β和误差、原矩阵元、电子J约定、条件及低态E1分母；¹P₁总漏出表达式另存 |
| [rate-evidence.json](rate-evidence.json) | HFI-E1/M1/M2/聚合non-E1部分率、统计平均率和独立寿命；不同模型不拼成统一β |
| [cascade-and-lifetime-evidence.json](cascade-and-lifetime-evidence.json) | Cho的¹⁷⁴Yb有效级联率，Senoo/Ma末态人口，Muniz高场65S总人口寿命与Wu近似BBR模型 |
| [conflicts.json](conflicts.json) | Covey不一致比例、Senoo m₀/m₁映射矛盾、Cho表值不闭合，逐项保留原值和处置状态 |
| [applicability.json](applicability.json) | 8个图内态的适用范围；基态不适用、P态近闭合近似、³P₂的F依赖、65S待核 |
| [additional-reviewed-facts.json](additional-reviewed-facts.json) | 新核Li v2的固定SPAM分支输入、Ishiyama¹⁷⁴Yb图外态环境率/外推寿命；均为review-only，不替换采用值 |
| [verify.mjs](verify.mjs) | 只读核对来源引用、数值类型/误差、7条采用值、保留缺口与原件指纹 |

本包没有把历史71表/1645记录重新计数，也不将多个采用同一理论输入的文献当成独立分支实验。

## 证据边界

β的分母是声明模型中上态的全部直接自发离态率。³D₁的原文三支相加0.9999；³S₁三条triplet支相加0.998，保留¹P₁弱支0.0021(9)后为1.0001。保留原文舍入，不二次归一，不由各误差条编造未给出的协方差。数值来自Porsev电子J-reduced E1矩阵元，Kroeze将其导为分支；不是每个¹⁷¹Yb F/mF通道的独立实验测量，也不证明全部原子末态和所有多极阶已完备。

³P₂ F=3/2可经HFI-E1到ground F=1/2；F=5/2的该E1通道关闭，其他衰变机制仍在。Mishra的统计平均率与Porsev的F分辨率属于不同模型，不能拼合后称统一实测β。³P₀/³P₁的“近1”保持近似，不赋精确实验100%。当前65S分支保持待核。

Senoo Methods与ED Fig.5b对m₀/m₁的2.7(5)%和4(1)%对应相反；两套原值均保留，单独映射未采用。96(1)%/93(1)%的分母为已衰变事件的读出检出比例，不是原子直接支路。Cho的6.38与6.48差异小于所报误差，原因未核实，不用“独立拟合”猜测原因。Covey的60:3:1与常用约64:35:1不能平均。

Li v2的定位已根据新取得的PDF更正为PDF p14 / AppendixF TableI（SPAM model parameters）；上轮调查误写TableII的字面信息在来源notes中保留，TableII实际上是error budget。源文定位订正没有改变任何物理数值。

## 检查和原件管理

本包JSON的获取状态冻结于五份新原件接收前。后续已取得Honda正文/勘误及Loftus，并完成[独立数值复核包](../received-decay-review-2026-11-04/README.md)；当前获取与提取状态见该包及中央登记。下方`sourcesWithoutOriginals`是本包当时的历史状态，不是当前目录仍缺这三份原件。

在仓库根目录运行：

```sh
node data/literature/decay-audit-2026-11-04/verify.mjs
node --test tests/data/decay-archive.test.js
```

检查不写原件或生成数据。已登记指纹的原PDF存在时核对PDF文件头、SHA和字节数；不存在时逐项返回`available:false`。尚未取得原件的Honda正文、勘误及Loftus则另列`sourcesWithoutOriginals`及实际访问状态，不能因16份已登记原件全在本机就称18个来源全文均已核。中央原件统一指向被Git忽略的`references/papers/`，从本地paper库或上轮local-only复制登记时保留原副本。本包支持可选`YB_PAPER_LIBRARY_ROOT`解析旧的library-relative定位，不记录个人绝对路径。

本包可追溯到上轮 `references/local-only/decay-branching-20261104/` 的4份调查工件及本轮扩展检索事实，原工件不移动、不覆盖。那些旧工件记录当时已知事实，之后的定位订正写在当前归档，不能倒改历史使错误看似未发生。

公开Git只保存书目、结构化事实、数值和指纹。原PDF、全文提取、论文页图及个人绝对路径不放入本包；整个`data/literature/`和`references/`仍被网页构建排除。更多原文获取状态见[本轮审计说明](../../../references/audits/decay-branching-20261104.md)和[中央补充登记](../../../references/decay-sources-20261104.json)。
