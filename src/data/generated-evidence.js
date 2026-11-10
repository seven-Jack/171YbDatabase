// Generated from data/evidence.json by scripts/evidence-data.cjs. Do not edit.
export const evidenceData = {
  "schemaVersion": 2,
  "evidenceVersion": "2026.11.02.1",
  "reviewedAt": "2026-11-02",
  "sources": [
    {
      "id": "xu-2014-prl",
      "title": "Measurement of the Hyperfine Quenching Rate of the Clock Transition in 171Yb",
      "doi": "10.1103/PhysRevLett.113.033003",
      "url": "https://doi.org/10.1103/PhysRevLett.113.033003",
      "locations": [
        "arXiv:1406.2340，PDF 第 3–4 页，式 (2)、表 I"
      ]
    },
    {
      "id": "offer-2026-main",
      "title": "Portable laser-cooled ytterbium beam clock based on an ultra-narrow optical transition",
      "doi": "10.1364/OPTICA.584095",
      "url": "https://doi.org/10.1364/OPTICA.584095",
      "locations": [
        "Optica 13, 677–685 (2026)，印刷页 678，式 (2)、图 1(a)"
      ]
    },
    {
      "id": "offer-2026-sm-v2",
      "title": "Supplementary material: Portable laser-cooled ytterbium beam clock based on an ultra-narrow optical transition (v2)",
      "doi": "10.6084/m9.figshare.31537450.v2",
      "url": "https://doi.org/10.6084/m9.figshare.31537450.v2",
      "locations": [
        "PDF 第 2 页 §1.2，行 28–38：可用功率与光束参数",
        "PDF 第 3 页 §1.3，行 56–63：有效功率与对比度拟合"
      ]
    },
    {
      "id": "strathearn-2023-model",
      "title": "Wave-front curvature in optical atomic beam clocks",
      "doi": "10.1103/PhysRevA.108.013105",
      "url": "https://doi.org/10.1103/PhysRevA.108.013105",
      "locations": [
        "PDF 第 3–4 页，式 (6)、(8)：模型耦合与脉冲面积约定"
      ]
    },
    {
      "id": "kroeze-2026",
      "title": "171Yb Reference Data (arXiv:2509.04416v2)",
      "doi": "10.48550/arXiv.2509.04416",
      "url": "https://arxiv.org/abs/2509.04416v2",
      "locations": [
        "PDF/印刷第 16–17 页 §6.3，式 (73)、(78)–(81)：光束与 Rabi 约定",
        "PDF/印刷第 23 页表 8（T1）、第 24 页表 10（T2）、第 25 页表 12（T5）、第 26 页表 13–14（T6/T7）"
      ]
    },
    {
      "id": "beloy-2012",
      "title": "Determination of the 5d6s 3D1 state lifetime and blackbody-radiation clock shift in Yb",
      "doi": "10.1103/PhysRevA.86.051404",
      "url": "https://doi.org/10.1103/PhysRevA.86.051404",
      "locations": [
        "arXiv:1208.0552v1，PDF 第 2 页 Method II、式 (8)：理论 LS 分支假设",
        "PDF 第 4 页表 III 及寿命结果：556/1389 nm 矩阵元与 171Yb 寿命"
      ]
    },
    {
      "id": "porsev-1999",
      "title": "Electric-dipole amplitudes, lifetimes, and polarizabilities of the low-lying levels of atomic ytterbium",
      "doi": "10.1103/PhysRevA.60.2781",
      "url": "https://doi.org/10.1103/PhysRevA.60.2781",
      "locations": [
        "arXiv:physics/9903004v1，PDF 第 10 页表 I：CI+MBPT 电子 J 约化 E1 矩阵元"
      ]
    }
  ],
  "records": [
    {
      "transitionId": "T3",
      "primarySourceId": "internal-t3-20260908",
      "reviewVersion": "2026.10.30.2",
      "reviewedAt": "2026-10-30",
      "appliesTo": {
        "datasetHash": "946cabc410ba50e842c5b746fa6a6c149dd514c37c8c94b6ff4350b4a8178271",
        "formulaVersion": "1.0.1",
        "F": 0.5,
        "Fp": 0.5,
        "q": [
          -1,
          0,
          1
        ],
        "dipole_ea0": 0.0000919,
        "convention": "F-reduced-effective"
      },
      "summary": "模型换算 · 未独立验证（绝对标定未闭合） · Xu 原子率支持",
      "sourceStatusText": "支持原文已核；原采用值历史生成记录待补",
      "sourceDetail": "Xu 与 Offer 原文已定位；Xu 支持当前矩阵元的大小，不补写原采用值 internal-t3-20260908 的历史来源。",
      "formulaDetail": "当前 F=F′=1/2 约定：π 分量 |d|=dF/√6；σ 分量 |d|=dF/√3。这是公式与通道核查，不等于实验验证。",
      "comparisonDetail": "固定文献输入下的条件比较；1070 mW 为阶段可用功率，338 mW 为拟合有效功率。两者均未确认为各相互作用处的实测功率。",
      "experimentDetail": "Offer 的 22 kHz 来自对比度模型拟合，缺少闭合的功率、束腰、偏振及作者数值归一化，不能判定独立实验验证通过。",
      "sourceIds": [
        "xu-2014-prl",
        "offer-2026-main",
        "offer-2026-sm-v2",
        "strathearn-2023-model"
      ],
      "atomicSupport": {
        "title": "Xu 2014 · 独立原子率支持",
        "sourceIds": [
          "xu-2014-prl"
        ],
        "statusText": "支持矩阵元大小；历史生成链待补",
        "summary": "0.0442 ± 0.0035 s⁻¹ 是固 Ne 测量经介质与频率修正得到的自由原子超精细淬灭率。",
        "quantities": [
          {
            "label": "自由原子淬灭率",
            "value": 0.0442,
            "unit": "s⁻¹",
            "evidenceKind": "medium-corrected-rate"
          },
          {
            "label": "淬灭率不确定度",
            "value": 0.0035,
            "unit": "s⁻¹",
            "evidenceKind": "reported-rate-uncertainty"
          },
          {
            "label": "由该率推得的 dF",
            "value": 0.00009188767997673872,
            "unit": "ea₀",
            "evidenceKind": "rate-derived-dipole"
          }
        ],
        "boundary": "与当前采用值 9.19×10⁻⁵ ea₀ 的大小一致；不是冷原子 P–w–Ω 实验，也不恢复该采用值的历史生成记录。率的不确定度不代表完整 Rabi 不确定度。"
      },
      "comparisonIds": [
        "offer-578-conditional"
      ],
      "missing": [
        "原采用矩阵元 internal-t3-20260908 的历史生成记录",
        "各原子–光相互作用点的功率及传输、模式修正",
        "1 mm 光束直径的明确强度定义与相互作用处束腰",
        "量子化轴、偏振分量与 mF 通道权重",
        "作者使用的数值饱和强度、精确衰减率与模型归一化",
        "独立 Rabi 频率测量及完整功率、束腰、拟合不确定度"
      ]
    },
    {
      "transitionId": "T1",
      "primarySourceId": "ref-01",
      "reviewVersion": "2026.11.02.1",
      "reviewedAt": "2026-10-30",
      "appliesTo": {
        "datasetHash": "946cabc410ba50e842c5b746fa6a6c149dd514c37c8c94b6ff4350b4a8178271",
        "formulaVersion": "1.0.1",
        "F": 0.5,
        "Fp": 1.5,
        "q": [
          1
        ],
        "dipole_ea0": 4.147,
        "convention": "J-reduced",
        "channels": [
          {
            "F": 0.5,
            "m": 0.5,
            "Fp": 1.5,
            "mp": 1.5,
            "q": 1
          }
        ]
      },
      "summary": "文献理论基准相容 · 未独立实验验证",
      "sourceStatusText": "汇编原文与数据链已核",
      "sourceDetail": "Kroeze v2 PDF/印刷第 23 页表 8，公式见第 16–17 页 §6.3；采用数值来源仍为 ref-01。2026-11-02 接入 2026-10-30 已归档核查，不新增物理验证。",
      "formulaDetail": "仅已核指定通道 F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2，σ⁺，|d_eff|=|dJ|/√3；J 约化矩阵元经超精细与磁量子数角因子换算，不重复乘 CG。原文 §6.3 与表中 Ω₀ 下标声称 π/q=0，但明确态对要求 σ 通道；按 ΔmF 取 q，同一态对的 q=0 矩阵元为零，不通过调参消除冲突。",
      "comparisonDetail": "固定 1 mW 原子处纯 σ⁺ 分量功率、w₀=500 μm，以指定通道复现 Kroeze 表 8 的理论值，在其打印不确定度范围内；该结果与矩阵元属于同一汇编数据链，不能视为独立样本。",
      "experimentDetail": "原始寿命实验可支持电子强度，但不能改标为 171Yb 直接 Rabi 测量；尚无完整匹配原子处功率、束腰定义、mF 通道和实测 Rabi 的新增独立基准。",
      "sourceIds": [
        "kroeze-2026"
      ],
      "atomicSupport": {
        "title": "399 nm · 矩阵元与寿命数据链",
        "sourceIds": [
          "kroeze-2026"
        ],
        "statusText": "强度支持；非独立 Rabi 标定",
        "summary": "汇编 dJ=4.147±0.004 ea₀。汇编寿命 τ=5.464±0.011 ns、β=0.99999994±0.00000004 可重建电子强度；这不是新增 171Yb Rabi 测量。",
        "quantities": [
          {
            "label": "汇编采用 dJ（±0.004）",
            "value": 4.147,
            "unit": "ea₀",
            "evidenceKind": "compiled-dipole"
          },
          {
            "label": "汇编寿命及分支重建 dJ",
            "value": 4.147493488059561,
            "unit": "ea₀",
            "evidenceKind": "lifetime-derived-dipole"
          }
        ],
        "boundary": "部分 Einstein A=β/τ；从寿命重建 dJ 的上态简并因子为 2J′+1=3，不能把总衰减率当每一分支的 A，也不能重复乘 β。频率均为 Ω/2π，不叠加原表线宽行存在冲突的额外 2π。 各来源与汇编存在共享输入或理论分支依赖；未知协方差和完整实验误差不补为零，不能把强度支持升级为独立 P–w–Ω 实验验证。"
      },
      "comparisonIds": [
        "kroeze-t1-theory"
      ],
      "missing": [
        "同一操作点的原子处功率与传输、模式修正及不确定度",
        "明确 1/e² 强度尺寸定义的原子处束腰与不确定度",
        "匹配的量子化轴、偏振分量、mF 通道及必要运动条件",
        "独立实测 Rabi 拟合值及完整误差预算；不以谱线宽、名义 π 时间或拟合输入代替"
      ]
    },
    {
      "transitionId": "T2",
      "primarySourceId": "ref-01",
      "reviewVersion": "2026.11.02.1",
      "reviewedAt": "2026-10-30",
      "appliesTo": {
        "datasetHash": "946cabc410ba50e842c5b746fa6a6c149dd514c37c8c94b6ff4350b4a8178271",
        "formulaVersion": "1.0.1",
        "F": 0.5,
        "Fp": 1.5,
        "q": [
          1
        ],
        "dipole_ea0": 0.5398,
        "convention": "J-reduced",
        "channels": [
          {
            "F": 0.5,
            "m": 0.5,
            "Fp": 1.5,
            "mp": 1.5,
            "q": 1
          }
        ]
      },
      "summary": "文献理论基准相容 · 未独立实验验证",
      "sourceStatusText": "汇编原文与数据链已核",
      "sourceDetail": "Kroeze v2 PDF/印刷第 24 页表 10，公式见第 16–17 页 §6.3；采用数值来源仍为 ref-01。2026-11-02 接入 2026-10-30 已归档核查，不新增物理验证。",
      "formulaDetail": "仅已核指定通道 F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2，σ⁺，|d_eff|=|dJ|/√3；J 约化矩阵元经超精细与磁量子数角因子换算，不重复乘 CG。原文 §6.3 与表中 Ω₀ 下标声称 π/q=0，但明确态对要求 σ 通道；按 ΔmF 取 q，同一态对的 q=0 矩阵元为零，不通过调参消除冲突。",
      "comparisonDetail": "固定 1 mW 原子处纯 σ⁺ 分量功率、w₀=500 μm，以指定通道复现 Kroeze 表 10 的理论值，在其打印不确定度范围内；该结果与矩阵元属于同一汇编数据链，不能视为独立样本。",
      "experimentDetail": "Beloy 寿命推得矩阵元不等于直接 Rabi 测量；候选饱和吸收资料未补齐同操作点泵浦功率、两轴半径和直接拟合，独立实验验证未闭合。",
      "sourceIds": [
        "kroeze-2026",
        "beloy-2012"
      ],
      "atomicSupport": {
        "title": "556 nm · 矩阵元与寿命数据链",
        "sourceIds": [
          "kroeze-2026",
          "beloy-2012"
        ],
        "statusText": "强度支持；非独立 Rabi 标定",
        "summary": "汇编 dJ=0.5398±0.0006 ea₀。汇编寿命 τ=872.6±1.9 ns、β≈1；Beloy 的 171Yb 寿命给出的 dJ=0.542±0.002 ea₀ 是强度交叉检查，该来源已参与汇编。",
        "quantities": [
          {
            "label": "汇编采用 dJ（±0.0006）",
            "value": 0.5398,
            "unit": "ea₀",
            "evidenceKind": "compiled-dipole"
          },
          {
            "label": "汇编寿命及分支重建 dJ",
            "value": 0.5397570472049487,
            "unit": "ea₀",
            "evidenceKind": "lifetime-derived-dipole"
          },
          {
            "label": "Beloy 寿命推得 dJ（±0.002）",
            "value": 0.542,
            "unit": "ea₀",
            "evidenceKind": "lifetime-derived-dipole"
          }
        ],
        "boundary": "部分 Einstein A=β/τ；从寿命重建 dJ 的上态简并因子为 2J′+1=3，不能把总衰减率当每一分支的 A，也不能重复乘 β。频率均为 Ω/2π，不叠加原表线宽行存在冲突的额外 2π。 各来源与汇编存在共享输入或理论分支依赖；未知协方差和完整实验误差不补为零，不能把强度支持升级为独立 P–w–Ω 实验验证。"
      },
      "comparisonIds": [
        "kroeze-t2-theory"
      ],
      "missing": [
        "同一操作点的原子处功率与传输、模式修正及不确定度",
        "明确 1/e² 强度尺寸定义的原子处束腰与不确定度",
        "匹配的量子化轴、偏振分量、mF 通道及必要运动条件",
        "独立实测 Rabi 拟合值及完整误差预算；不以谱线宽、名义 π 时间或拟合输入代替"
      ]
    },
    {
      "transitionId": "T5",
      "primarySourceId": "ref-01",
      "reviewVersion": "2026.11.02.1",
      "reviewedAt": "2026-10-30",
      "appliesTo": {
        "datasetHash": "946cabc410ba50e842c5b746fa6a6c149dd514c37c8c94b6ff4350b4a8178271",
        "formulaVersion": "1.0.1",
        "F": 0.5,
        "Fp": 1.5,
        "q": [
          1
        ],
        "dipole_ea0": 2.76,
        "convention": "J-reduced",
        "channels": [
          {
            "F": 0.5,
            "m": 0.5,
            "Fp": 1.5,
            "mp": 1.5,
            "q": 1
          }
        ]
      },
      "summary": "文献理论基准相容 · 未独立实验验证",
      "sourceStatusText": "汇编原文与数据链已核",
      "sourceDetail": "Kroeze v2 PDF/印刷第 25 页表 12，公式见第 16–17 页 §6.3；采用数值来源仍为 ref-01。2026-11-02 接入 2026-10-30 已归档核查，不新增物理验证。",
      "formulaDetail": "仅已核指定通道 F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2，σ⁺，|d_eff|=|dJ|/√3；J 约化矩阵元经超精细与磁量子数角因子换算，不重复乘 CG。原文 §6.3 与表中 Ω₀ 下标声称 π/q=0，但明确态对要求 σ 通道；按 ΔmF 取 q，同一态对的 q=0 矩阵元为零，不通过调参消除冲突。",
      "comparisonDetail": "固定 1 mW 原子处纯 σ⁺ 分量功率、w₀=500 μm，以指定通道复现 Kroeze 表 12 的理论值，在其打印不确定度范围内；该结果与矩阵元属于同一汇编数据链，不能视为独立样本。",
      "experimentDetail": "Beloy 的装置量级估计没有同一确定 mF 通道的 Rabi 拟合；其他候选未明确数值束腰，不能反拟合束腰再称验证通过。",
      "sourceIds": [
        "kroeze-2026",
        "beloy-2012",
        "porsev-1999"
      ],
      "atomicSupport": {
        "title": "1389 nm · 矩阵元与寿命数据链",
        "sourceIds": [
          "kroeze-2026",
          "beloy-2012",
          "porsev-1999"
        ],
        "statusText": "强度支持；非独立 Rabi 标定",
        "summary": "汇编 dJ=2.76±0.07 ea₀。汇编 τ=332±11 ns、β=0.638±0.027；Beloy 的 dJ=2.77±0.04 ea₀ 依赖实验寿命及理论 LS 分支。Porsev 的 2.61±0.10 ea₀ 为 CI+MBPT 理论值，不能与采用值直接平均。",
        "quantities": [
          {
            "label": "汇编采用 dJ（±0.07）",
            "value": 2.76,
            "unit": "ea₀",
            "evidenceKind": "compiled-dipole"
          },
          {
            "label": "汇编寿命及分支重建 dJ",
            "value": 2.7606464150234227,
            "unit": "ea₀",
            "evidenceKind": "lifetime-derived-dipole"
          },
          {
            "label": "Beloy 寿命及理论分支推得 dJ（±0.04）",
            "value": 2.77,
            "unit": "ea₀",
            "evidenceKind": "lifetime-derived-dipole"
          },
          {
            "label": "Porsev 理论 dJ（±0.10）",
            "value": 2.61,
            "unit": "ea₀",
            "evidenceKind": "theory-dipole"
          }
        ],
        "boundary": "部分 Einstein A=β/τ；从寿命重建 dJ 的上态简并因子为 2J′+1=3，不能把总衰减率当每一分支的 A，也不能重复乘 β。频率均为 Ω/2π，不叠加原表线宽行存在冲突的额外 2π。 各来源与汇编存在共享输入或理论分支依赖；未知协方差和完整实验误差不补为零，不能把强度支持升级为独立 P–w–Ω 实验验证。"
      },
      "comparisonIds": [
        "kroeze-t5-theory"
      ],
      "missing": [
        "同一操作点的原子处功率与传输、模式修正及不确定度",
        "明确 1/e² 强度尺寸定义的原子处束腰与不确定度",
        "匹配的量子化轴、偏振分量、mF 通道及必要运动条件",
        "独立实测 Rabi 拟合值及完整误差预算；不以谱线宽、名义 π 时间或拟合输入代替"
      ]
    },
    {
      "transitionId": "T6",
      "primarySourceId": "ref-01",
      "reviewVersion": "2026.11.02.1",
      "reviewedAt": "2026-10-30",
      "appliesTo": {
        "datasetHash": "946cabc410ba50e842c5b746fa6a6c149dd514c37c8c94b6ff4350b4a8178271",
        "formulaVersion": "1.0.1",
        "F": 0.5,
        "Fp": 1.5,
        "q": [
          1
        ],
        "dipole_ea0": 1.96,
        "convention": "J-reduced",
        "channels": [
          {
            "F": 0.5,
            "m": 0.5,
            "Fp": 1.5,
            "mp": 1.5,
            "q": 1
          }
        ]
      },
      "summary": "文献理论基准相容 · 未独立实验验证",
      "sourceStatusText": "汇编原文与数据链已核",
      "sourceDetail": "Kroeze v2 PDF/印刷第 26 页表 13，公式见第 16–17 页 §6.3；采用数值来源仍为 ref-01。2026-11-02 接入 2026-10-30 已归档核查，不新增物理验证。",
      "formulaDetail": "仅已核指定通道 F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2，σ⁺，|d_eff|=|dJ|/√3；J 约化矩阵元经超精细与磁量子数角因子换算，不重复乘 CG。原文 §6.3 与表中 Ω₀ 下标声称 π/q=0，但明确态对要求 σ 通道；按 ΔmF 取 q，同一态对的 q=0 矩阵元为零，不通过调参消除冲突。",
      "comparisonDetail": "固定 1 mW 原子处纯 σ⁺ 分量功率、w₀=500 μm，以指定通道复现 Kroeze 表 13 的理论值，在其打印不确定度范围内；该结果与矩阵元属于同一汇编数据链，不能视为独立样本。",
      "experimentDetail": "光谱探测时间和晶格束腰不能配成 repumper 的 π 时间与束腰；碰撞、功率展宽后的谱线宽不是相干 Rabi，尚无完整独立基准。",
      "sourceIds": [
        "kroeze-2026",
        "porsev-1999"
      ],
      "atomicSupport": {
        "title": "649 nm · 矩阵元与寿命数据链",
        "sourceIds": [
          "kroeze-2026",
          "porsev-1999"
        ],
        "statusText": "强度支持；非独立 Rabi 标定",
        "summary": "汇编 dJ=1.96±0.15 ea₀。汇编 τ=13.8±1.7 ns、β=0.130±0.013；Porsev 的 dJ=1.98±0.10 ea₀ 为 CI+MBPT 理论支持，不是直接 Rabi 实验。",
        "quantities": [
          {
            "label": "汇编采用 dJ（±0.15）",
            "value": 1.96,
            "unit": "ea₀",
            "evidenceKind": "compiled-dipole"
          },
          {
            "label": "汇编寿命及分支重建 dJ",
            "value": 1.95305032801505,
            "unit": "ea₀",
            "evidenceKind": "lifetime-derived-dipole"
          },
          {
            "label": "Porsev 理论 dJ（±0.10）",
            "value": 1.98,
            "unit": "ea₀",
            "evidenceKind": "theory-dipole"
          }
        ],
        "boundary": "部分 Einstein A=β/τ；从寿命重建 dJ 的上态简并因子为 2J′+1=3，不能把总衰减率当每一分支的 A，也不能重复乘 β。频率均为 Ω/2π，不叠加原表线宽行存在冲突的额外 2π。 各来源与汇编存在共享输入或理论分支依赖；未知协方差和完整实验误差不补为零，不能把强度支持升级为独立 P–w–Ω 实验验证。"
      },
      "comparisonIds": [
        "kroeze-t6-theory"
      ],
      "missing": [
        "同一操作点的原子处功率与传输、模式修正及不确定度",
        "明确 1/e² 强度尺寸定义的原子处束腰与不确定度",
        "匹配的量子化轴、偏振分量、mF 通道及必要运动条件",
        "独立实测 Rabi 拟合值及完整误差预算；不以谱线宽、名义 π 时间或拟合输入代替"
      ]
    },
    {
      "transitionId": "T7",
      "primarySourceId": "ref-01",
      "reviewVersion": "2026.11.02.1",
      "reviewedAt": "2026-10-30",
      "appliesTo": {
        "datasetHash": "946cabc410ba50e842c5b746fa6a6c149dd514c37c8c94b6ff4350b4a8178271",
        "formulaVersion": "1.0.1",
        "F": 2.5,
        "Fp": 1.5,
        "q": [
          -1
        ],
        "dipole_ea0": 4.99,
        "convention": "J-reduced",
        "channels": [
          {
            "F": 2.5,
            "m": 2.5,
            "Fp": 1.5,
            "mp": 1.5,
            "q": -1
          }
        ]
      },
      "summary": "文献理论基准相容 · 未独立实验验证",
      "sourceStatusText": "汇编原文与数据链已核",
      "sourceDetail": "Kroeze v2 PDF/印刷第 26 页表 14，公式见第 16–17 页 §6.3；采用数值来源仍为 ref-01。2026-11-02 接入 2026-10-30 已归档核查，不新增物理验证。",
      "formulaDetail": "仅已核指定通道 F=5/2, mF=+5/2 → F′=3/2, mF′=+3/2，σ⁻，|d_eff|=|dJ|/√5；J 约化矩阵元经超精细与磁量子数角因子换算，不重复乘 CG。原文 §6.3 与表中 Ω₀ 下标声称 π/q=0，但明确态对要求 σ 通道；按 ΔmF 取 q，同一态对的 q=0 矩阵元为零，不通过调参消除冲突。",
      "comparisonDetail": "固定 1 mW 原子处纯 σ⁻ 分量功率、w₀=500 μm，以指定通道复现 Kroeze 表 14 的理论值，在其打印不确定度范围内；该结果与矩阵元属于同一汇编数据链，不能视为独立样本。",
      "experimentDetail": "光谱探测时间和晶格束腰不属于同一 repumper Rabi 操作点；理论矩阵元与分支数据不代替实测 Rabi，尚无完整独立基准。",
      "sourceIds": [
        "kroeze-2026",
        "porsev-1999"
      ],
      "atomicSupport": {
        "title": "770 nm · 矩阵元与寿命数据链",
        "sourceIds": [
          "kroeze-2026",
          "porsev-1999"
        ],
        "statusText": "强度支持；非独立 Rabi 标定",
        "summary": "汇编 dJ=4.99±0.32 ea₀。汇编 τ=13.8±1.7 ns、β=0.508±0.026；Porsev 的 dJ=5.05±0.20 ea₀ 为 CI+MBPT 理论支持。源表波长 770.160284 nm 仅用于原表寿命重建；当前 770.16026840069 nm 来自另行核过的频率，保留两者冲突。",
        "quantities": [
          {
            "label": "汇编采用 dJ（±0.32）",
            "value": 4.99,
            "unit": "ea₀",
            "evidenceKind": "compiled-dipole"
          },
          {
            "label": "汇编寿命及分支重建 dJ",
            "value": 4.989893753246827,
            "unit": "ea₀",
            "evidenceKind": "lifetime-derived-dipole"
          },
          {
            "label": "Porsev 理论 dJ（±0.20）",
            "value": 5.05,
            "unit": "ea₀",
            "evidenceKind": "theory-dipole"
          }
        ],
        "boundary": "部分 Einstein A=β/τ；从寿命重建 dJ 的上态简并因子为 2J′+1=3，不能把总衰减率当每一分支的 A，也不能重复乘 β。频率均为 Ω/2π，不叠加原表线宽行存在冲突的额外 2π。 各来源与汇编存在共享输入或理论分支依赖；未知协方差和完整实验误差不补为零，不能把强度支持升级为独立 P–w–Ω 实验验证。"
      },
      "comparisonIds": [
        "kroeze-t7-theory"
      ],
      "missing": [
        "同一操作点的原子处功率与传输、模式修正及不确定度",
        "明确 1/e² 强度尺寸定义的原子处束腰与不确定度",
        "匹配的量子化轴、偏振分量、mF 通道及必要运动条件",
        "独立实测 Rabi 拟合值及完整误差预算；不以谱线宽、名义 π 时间或拟合输入代替"
      ]
    }
  ],
  "comparisons": [
    {
      "id": "offer-578-conditional",
      "title": "Offer 2026 · 两种功率的条件对照",
      "status": "conditional",
      "scopeText": "固定文献对照输入，非当前计算输入",
      "sourceIds": [
        "offer-2026-main",
        "offer-2026-sm-v2",
        "strathearn-2023-model"
      ],
      "assumptions": [
        "假设 1 mm 为 1/e² 强度直径，即 w₀=500 μm。",
        "假设所引功率等于单个相互作用处功率，无额外损耗或模式修正。",
        "按纯 π 通道、F=F′=1/2 和当前 dF=9.19×10⁻⁵ ea₀ 计算。"
      ],
      "rows": [
        {
          "power_mW": 1070,
          "powerKind": "reported-measured-available",
          "powerLabel": "阶段可用功率",
          "rabi_kHz": 21.75141984154124,
          "relativeDifferencePercent": -1.129909811176185
        },
        {
          "power_mW": 338,
          "powerKind": "fitted-effective",
          "powerLabel": "拟合有效功率",
          "rabi_kHz": 12.22514650683658,
          "relativeDifferencePercent": -44.43115224165191
        }
      ],
      "reference": {
        "label": "作者对比度模型中的 Ω/2π",
        "value": 22,
        "unit": "kHz",
        "evidenceKind": "model-fitted-coupling"
      },
      "normalizationNote": "固定总衰减率时，闭合标量模型与 π 通道相差 3 倍功率因子。若另假设寿命 21 s 并用标量归一化，338 mW 可重建 21.975 kHz；这只是候选重建，作者并未公开其精确 Γ 与饱和强度，不能据此认定漏乘 CG。Strathearn 的模型耦合为物理 Ω/2，脉冲面积换算后不支持再把 22 kHz 乘二。",
      "boundary": "1070 mW 的数值接近和 21 s 标量候选重建都不构成独立验证。338 mW 来自拟合，22 kHz 也不是独立时域 Rabi 实测值；绝对标定仍未闭合。",
      "kind": "conditional-power"
    },
    {
      "id": "kroeze-t1-theory",
      "title": "Kroeze 2026 · 399 nm 理论基准",
      "kind": "theory-benchmark",
      "status": "theory-compatible",
      "scopeText": "固定文献基准，非当前输入；¹S₀ → ¹P₁，F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2，σ⁺。原核查日期 2026-10-30，本轮仅接入展示。",
      "sourceIds": [
        "kroeze-2026"
      ],
      "assumptions": [
        "原子处所选纯球偏振分量功率 1 mW，无额外损耗或模式修正。",
        "完整 1/e² 强度直径 D=1 mm，即束腰半径 w₀=500 μm；取高斯束中心。",
        "未混合的零场角动量态：F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2，σ⁺；角向幅度因子 1/√3。",
        "输出为普通 Rabi 频率 Ω/2π（MHz）；不包含有限场混合、失谐、运动、空间平均或退相干修正。"
      ],
      "channel": {
        "F": 0.5,
        "m": 0.5,
        "Fp": 1.5,
        "mp": 1.5,
        "q": 1
      },
      "power_mW": 1,
      "waist_um": 500,
      "calculatedRabi_MHz": 42.43549222721293,
      "publishedRabi_MHz": 42.44,
      "publishedRabiUncertainty_MHz": 0.04,
      "normalizationNote": "原文 §6.3 与表中 Ω₀ 下标声称 π/q=0，但明确态对要求 σ 通道；按 ΔmF 取 q，同一态对的 q=0 矩阵元为零，不通过调参消除冲突。 部分 Einstein A=β/τ；从寿命重建 dJ 的上态简并因子为 2J′+1=3，不能把总衰减率当每一分支的 A，也不能重复乘 β。频率均为 Ω/2π，不叠加原表线宽行存在冲突的额外 2π。",
      "boundary": "复算值在原文打印不确定度范围内，表示同一文献理论基准相容；共享矩阵元与分支输入，不能作为留出的独立验证。尚无新增完整同操作点 P–w–Ω 实测基准；束心裸耦合不等同于实际振荡、转移效率或门保真度。"
    },
    {
      "id": "kroeze-t2-theory",
      "title": "Kroeze 2026 · 556 nm 理论基准",
      "kind": "theory-benchmark",
      "status": "theory-compatible",
      "scopeText": "固定文献基准，非当前输入；¹S₀ → ³P₁，F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2，σ⁺。原核查日期 2026-10-30，本轮仅接入展示。",
      "sourceIds": [
        "kroeze-2026"
      ],
      "assumptions": [
        "原子处所选纯球偏振分量功率 1 mW，无额外损耗或模式修正。",
        "完整 1/e² 强度直径 D=1 mm，即束腰半径 w₀=500 μm；取高斯束中心。",
        "未混合的零场角动量态：F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2，σ⁺；角向幅度因子 1/√3。",
        "输出为普通 Rabi 频率 Ω/2π（MHz）；不包含有限场混合、失谐、运动、空间平均或退相干修正。"
      ],
      "channel": {
        "F": 0.5,
        "m": 0.5,
        "Fp": 1.5,
        "mp": 1.5,
        "q": 1
      },
      "power_mW": 1,
      "waist_um": 500,
      "calculatedRabi_MHz": 5.523674633289015,
      "publishedRabi_MHz": 5.523,
      "publishedRabiUncertainty_MHz": 0.006,
      "normalizationNote": "原文 §6.3 与表中 Ω₀ 下标声称 π/q=0，但明确态对要求 σ 通道；按 ΔmF 取 q，同一态对的 q=0 矩阵元为零，不通过调参消除冲突。 部分 Einstein A=β/τ；从寿命重建 dJ 的上态简并因子为 2J′+1=3，不能把总衰减率当每一分支的 A，也不能重复乘 β。频率均为 Ω/2π，不叠加原表线宽行存在冲突的额外 2π。",
      "boundary": "复算值在原文打印不确定度范围内，表示同一文献理论基准相容；共享矩阵元与分支输入，不能作为留出的独立验证。尚无新增完整同操作点 P–w–Ω 实测基准；束心裸耦合不等同于实际振荡、转移效率或门保真度。"
    },
    {
      "id": "kroeze-t5-theory",
      "title": "Kroeze 2026 · 1389 nm 理论基准",
      "kind": "theory-benchmark",
      "status": "theory-compatible",
      "scopeText": "固定文献基准，非当前输入；³P₀ → ³D₁，F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2，σ⁺。原核查日期 2026-10-30，本轮仅接入展示。",
      "sourceIds": [
        "kroeze-2026"
      ],
      "assumptions": [
        "原子处所选纯球偏振分量功率 1 mW，无额外损耗或模式修正。",
        "完整 1/e² 强度直径 D=1 mm，即束腰半径 w₀=500 μm；取高斯束中心。",
        "未混合的零场角动量态：F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2，σ⁺；角向幅度因子 1/√3。",
        "输出为普通 Rabi 频率 Ω/2π（MHz）；不包含有限场混合、失谐、运动、空间平均或退相干修正。"
      ],
      "channel": {
        "F": 0.5,
        "m": 0.5,
        "Fp": 1.5,
        "mp": 1.5,
        "q": 1
      },
      "power_mW": 1,
      "waist_um": 500,
      "calculatedRabi_MHz": 28.242575005331016,
      "publishedRabi_MHz": 28.3,
      "publishedRabiUncertainty_MHz": 0.8,
      "normalizationNote": "原文 §6.3 与表中 Ω₀ 下标声称 π/q=0，但明确态对要求 σ 通道；按 ΔmF 取 q，同一态对的 q=0 矩阵元为零，不通过调参消除冲突。 部分 Einstein A=β/τ；从寿命重建 dJ 的上态简并因子为 2J′+1=3，不能把总衰减率当每一分支的 A，也不能重复乘 β。频率均为 Ω/2π，不叠加原表线宽行存在冲突的额外 2π。",
      "boundary": "复算值在原文打印不确定度范围内，表示同一文献理论基准相容；共享矩阵元与分支输入，不能作为留出的独立验证。尚无新增完整同操作点 P–w–Ω 实测基准；束心裸耦合不等同于实际振荡、转移效率或门保真度。"
    },
    {
      "id": "kroeze-t6-theory",
      "title": "Kroeze 2026 · 649 nm 理论基准",
      "kind": "theory-benchmark",
      "status": "theory-compatible",
      "scopeText": "固定文献基准，非当前输入；³P₀ → ³S₁，F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2，σ⁺。原核查日期 2026-10-30，本轮仅接入展示。",
      "sourceIds": [
        "kroeze-2026"
      ],
      "assumptions": [
        "原子处所选纯球偏振分量功率 1 mW，无额外损耗或模式修正。",
        "完整 1/e² 强度直径 D=1 mm，即束腰半径 w₀=500 μm；取高斯束中心。",
        "未混合的零场角动量态：F=1/2, mF=+1/2 → F′=3/2, mF′=+3/2，σ⁺；角向幅度因子 1/√3。",
        "输出为普通 Rabi 频率 Ω/2π（MHz）；不包含有限场混合、失谐、运动、空间平均或退相干修正。"
      ],
      "channel": {
        "F": 0.5,
        "m": 0.5,
        "Fp": 1.5,
        "mp": 1.5,
        "q": 1
      },
      "power_mW": 1,
      "waist_um": 500,
      "calculatedRabi_MHz": 20.05632138059739,
      "publishedRabi_MHz": 20,
      "publishedRabiUncertainty_MHz": 1.6,
      "normalizationNote": "原文 §6.3 与表中 Ω₀ 下标声称 π/q=0，但明确态对要求 σ 通道；按 ΔmF 取 q，同一态对的 q=0 矩阵元为零，不通过调参消除冲突。 部分 Einstein A=β/τ；从寿命重建 dJ 的上态简并因子为 2J′+1=3，不能把总衰减率当每一分支的 A，也不能重复乘 β。频率均为 Ω/2π，不叠加原表线宽行存在冲突的额外 2π。",
      "boundary": "复算值在原文打印不确定度范围内，表示同一文献理论基准相容；共享矩阵元与分支输入，不能作为留出的独立验证。尚无新增完整同操作点 P–w–Ω 实测基准；束心裸耦合不等同于实际振荡、转移效率或门保真度。"
    },
    {
      "id": "kroeze-t7-theory",
      "title": "Kroeze 2026 · 770 nm 理论基准",
      "kind": "theory-benchmark",
      "status": "theory-compatible",
      "scopeText": "固定文献基准，非当前输入；³P₂ → ³S₁，F=5/2, mF=+5/2 → F′=3/2, mF′=+3/2，σ⁻。原核查日期 2026-10-30，本轮仅接入展示。",
      "sourceIds": [
        "kroeze-2026"
      ],
      "assumptions": [
        "原子处所选纯球偏振分量功率 1 mW，无额外损耗或模式修正。",
        "完整 1/e² 强度直径 D=1 mm，即束腰半径 w₀=500 μm；取高斯束中心。",
        "未混合的零场角动量态：F=5/2, mF=+5/2 → F′=3/2, mF′=+3/2，σ⁻；角向幅度因子 1/√5。",
        "输出为普通 Rabi 频率 Ω/2π（MHz）；不包含有限场混合、失谐、运动、空间平均或退相干修正。"
      ],
      "channel": {
        "F": 2.5,
        "m": 2.5,
        "Fp": 1.5,
        "mp": 1.5,
        "q": -1
      },
      "power_mW": 1,
      "waist_um": 500,
      "calculatedRabi_MHz": 39.55226688563824,
      "publishedRabi_MHz": 39.5,
      "publishedRabiUncertainty_MHz": 2.6,
      "normalizationNote": "原文 §6.3 与表中 Ω₀ 下标声称 π/q=0，但明确态对要求 σ 通道；按 ΔmF 取 q，同一态对的 q=0 矩阵元为零，不通过调参消除冲突。 部分 Einstein A=β/τ；从寿命重建 dJ 的上态简并因子为 2J′+1=3，不能把总衰减率当每一分支的 A，也不能重复乘 β。频率均为 Ω/2π，不叠加原表线宽行存在冲突的额外 2π。 T7 的源表波长 770.160284 nm 与当前频率推得波长存在冲突，展示并保留原表重建条件，不覆盖采用值。",
      "boundary": "复算值在原文打印不确定度范围内，表示同一文献理论基准相容；共享矩阵元与分支输入，不能作为留出的独立验证。尚无新增完整同操作点 P–w–Ω 实测基准；束心裸耦合不等同于实际振荡、转移效率或门保真度。"
    }
  ]
};
