// Generated from data/evidence.json by scripts/evidence-data.cjs. Do not edit.
export const evidenceData = {
  "schemaVersion": 1,
  "evidenceVersion": "2026.10.31.1",
  "reviewedAt": "2026-10-30",
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
    }
  ],
  "records": [
    {
      "transitionId": "T3",
      "primarySourceId": "internal-t3-20260908",
      "reviewVersion": "2026.10.30.2",
      "reviewedAt": "2026-10-30",
      "appliesTo": {
        "datasetHash": "3c2fd5ca0a98d1e1e3e59aa6eab7fdcd9164678c048ed736f41dced0a3c20d28",
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
      "boundary": "1070 mW 的数值接近和 21 s 标量候选重建都不构成独立验证。338 mW 来自拟合，22 kHz 也不是独立时域 Rabi 实测值；绝对标定仍未闭合。"
    }
  ]
};
