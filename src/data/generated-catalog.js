// GENERATED from data/*.json by scripts/export-data.cjs. Do not edit.
// Schema and regression success are software checks, not physical validation.
export const canonicalCatalog = {
  "levels": {
    "schemaVersion": 1,
    "isotope": 171,
    "records": [
      {
        "id": "yb171-6s2-1s0",
        "isotope": 171,
        "attributes": {
          "term": "¹S₀",
          "config": "6s²",
          "parity": "even",
          "J": 0,
          "S": 0,
          "type": "singlet",
          "lifetime": "stable",
          "role": "基态 / |0⟩"
        },
        "energyReference": "neutral-atom-ground-state",
        "quantities": {
          "energy_cm": {
            "value": 0,
            "unit": "cm^-1",
            "quantity": "level_energy",
            "sourceId": "ref-01",
            "sourceLocator": "neutral171Yb ground-state energy reference definition",
            "evidenceKind": "derived",
            "reviewStatus": "original-source-located",
            "uncertainty": 0,
            "uncertaintyNote": "exact reference zero by definition, not measured zero uncertainty",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-29"
            },
            "convention": "neutral171Yb ground-state reference",
            "derivedFrom": [
              "chosen ground-state zero"
            ]
          },
          "energy_eV": {
            "value": 0,
            "unit": "eV",
            "quantity": "level_energy",
            "sourceId": "ref-01",
            "sourceLocator": "neutral171Yb ground-state energy reference definition",
            "evidenceKind": "derived",
            "reviewStatus": "original-source-located",
            "uncertainty": 0,
            "uncertaintyNote": "exact reference zero by definition, not measured zero uncertainty",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-29"
            },
            "convention": "neutral171Yb ground-state reference",
            "derivedFrom": [
              "chosen ground-state zero"
            ]
          }
        }
      },
      {
        "id": "yb171-6s6p-3p0",
        "isotope": 171,
        "attributes": {
          "term": "³P₀",
          "config": "6s6p",
          "parity": "odd",
          "J": 0,
          "S": 1,
          "type": "triplet",
          "lifetime": "21.0 s",
          "role": "亚稳态 / |1⟩"
        },
        "energyReference": "neutral-atom-ground-state",
        "quantities": {
          "energy_cm": {
            "value": 17288.48817774007,
            "unit": "cm^-1",
            "quantity": "level_energy",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 9, PDF/printed p.24, wavenumber_vac",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 3e-12,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-09:wavenumber_vac",
              "sourceDecimal": "17288.488177740069",
              "sourceUncertaintyDecimal": "3E-12",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                121
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                38
              ],
              "sourceDependencyRecordIds": [
                "table-09:frequency_nu",
                "table-01:c"
              ]
            },
            "convention": "171Yb hyperfine center-of-gravity relative to1S0",
            "legacyText": "17288.488177740069(3)"
          },
          "energy_eV": {
            "value": 2.1434993488389615,
            "unit": "eV",
            "quantity": "level_energy",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 9, PDF/printed p.24, transition_energy",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 4e-16,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-09:transition_energy",
              "sourceDecimal": "2.1434993488389615",
              "sourceUncertaintyDecimal": "4E-16",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                121
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                35,
                36
              ],
              "sourceDependencyRecordIds": [
                "table-09:frequency_nu",
                "table-01:h",
                "table-01:e"
              ]
            },
            "convention": "171Yb hyperfine center-of-gravity relative to1S0",
            "legacyText": "2.1434993488389615(4)"
          }
        }
      },
      {
        "id": "yb171-6s6p-3p1",
        "isotope": 171,
        "attributes": {
          "term": "³P₁",
          "config": "6s6p",
          "parity": "odd",
          "J": 1,
          "S": 1,
          "type": "triplet",
          "lifetime": "872.6 ns",
          "role": "窄线冷却上能级"
        },
        "energyReference": "neutral-atom-ground-state",
        "quantities": {
          "energy_cm": {
            "value": 17992.061256,
            "unit": "cm^-1",
            "quantity": "level_energy",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 10, PDF/printed p.24, wavenumber_vac",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.000004,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-10:wavenumber_vac",
              "sourceDecimal": "17992.061256",
              "sourceUncertaintyDecimal": "0.000004",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                181,
                182,
                184
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                38
              ],
              "sourceDependencyRecordIds": [
                "table-10:frequency_nu",
                "table-01:c"
              ]
            },
            "convention": "171Yb hyperfine center-of-gravity relative to1S0",
            "legacyText": "17992.061256(4)"
          },
          "energy_eV": {
            "value": 2.230731293,
            "unit": "eV",
            "quantity": "level_energy",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 10, PDF/printed p.24, transition_energy",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 5e-10,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-10:transition_energy",
              "sourceDecimal": "2.2307312930",
              "sourceUncertaintyDecimal": "5E-10",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                181,
                182,
                184
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                35,
                36
              ],
              "sourceDependencyRecordIds": [
                "table-10:frequency_nu",
                "table-01:h",
                "table-01:e"
              ]
            },
            "convention": "171Yb hyperfine center-of-gravity relative to1S0",
            "legacyText": "2.2307312930(5)"
          }
        }
      },
      {
        "id": "yb171-6s6p-3p2",
        "isotope": 171,
        "attributes": {
          "term": "³P₂",
          "config": "6s6p",
          "parity": "odd",
          "J": 2,
          "S": 1,
          "type": "triplet",
          "lifetime": "约8.9 s（理论统计平均率；非F分辨）",
          "role": "亚稳态 / 四极钟"
        },
        "energyReference": "neutral-atom-ground-state",
        "quantities": {
          "energy_cm": {
            "value": 19710.44180284872,
            "unit": "cm^-1",
            "quantity": "level_energy",
            "sourceId": "qiao-2023-rinp",
            "sourceLocator": "Qiao2023RINP Table2 PDFp5, five corrected hyperfine component frequencies + clock ref01 Table9 p24",
            "evidenceKind": "derived",
            "reviewStatus": "original-source-located",
            "uncertainty": null,
            "uncertaintyNote": "actual propagated1sigma unavailable without covariance; conservative standard-deviation bound retained separately",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-30",
              "sourceEvidenceType": "derived-five-component-F-centroid-Ritz",
              "sourceRecord": "frequency/arithmetic-and-recommendations.json",
              "originalPDF": "references/papers/1.pdf",
              "originalPDFSha256": "208431f4b46db7195a46a87d34dd6d0d73cddc2818310be95d29582d80156783",
              "formulaMHz": "clock+(nu649low+2nu649high)/3-(5nu770a+nu770b+9nu770c)/15",
              "rawComponentsMHz": [
                "461861338.03(21)",
                "461871596.07(31)",
                "389257019.71(65)",
                "389267277.10(37)",
                "389260569.95(89)"
              ],
              "derivedFrequencyDecimalTHz": "590.9041796341969633333333333333333333333",
              "conservativeStdUpperBoundMHz": 1.0520001,
              "uncertaintyBoundary": "Cross-transition covariances not supplied. Sum|weight|u bounds the propagated standard deviation given reported marginal uncertainties, including0.1Hz clock. It is not an actual reconstructed1sigma or a hard confidence interval; unreported systematics/second-order HFS are not bounded.",
              "centroidDefinition": "first-order171YbF-degeneracy endpoint centroids; no intensity weighting or new fit",
              "legacySourceCauseEstablished": false,
              "sourceDecimal": "19710.44180284872154233224017040926804547"
            },
            "convention": "171Yb hyperfine center-of-gravity relative to1S0",
            "legacyText": "19710.4467(14)",
            "derivedFrom": [
              "T4.frequency_THz",
              "exact SI c,h,e where applicable"
            ]
          },
          "energy_eV": {
            "value": 2.4437833276904413,
            "unit": "eV",
            "quantity": "level_energy",
            "sourceId": "qiao-2023-rinp",
            "sourceLocator": "Qiao2023RINP Table2 PDFp5, five corrected hyperfine component frequencies + clock ref01 Table9 p24",
            "evidenceKind": "derived",
            "reviewStatus": "original-source-located",
            "uncertainty": null,
            "uncertaintyNote": "actual propagated1sigma unavailable without covariance; conservative standard-deviation bound retained separately",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-30",
              "sourceEvidenceType": "derived-five-component-F-centroid-Ritz",
              "sourceRecord": "frequency/arithmetic-and-recommendations.json",
              "originalPDF": "references/papers/1.pdf",
              "originalPDFSha256": "208431f4b46db7195a46a87d34dd6d0d73cddc2818310be95d29582d80156783",
              "formulaMHz": "clock+(nu649low+2nu649high)/3-(5nu770a+nu770b+9nu770c)/15",
              "rawComponentsMHz": [
                "461861338.03(21)",
                "461871596.07(31)",
                "389257019.71(65)",
                "389267277.10(37)",
                "389260569.95(89)"
              ],
              "derivedFrequencyDecimalTHz": "590.9041796341969633333333333333333333333",
              "conservativeStdUpperBoundMHz": 1.0520001,
              "uncertaintyBoundary": "Cross-transition covariances not supplied. Sum|weight|u bounds the propagated standard deviation given reported marginal uncertainties, including0.1Hz clock. It is not an actual reconstructed1sigma or a hard confidence interval; unreported systematics/second-order HFS are not bounded.",
              "centroidDefinition": "first-order171YbF-degeneracy endpoint centroids; no intensity weighting or new fit",
              "legacySourceCauseEstablished": false,
              "sourceDecimal": "2.443783327690441413567416000650525028191"
            },
            "convention": "171Yb hyperfine center-of-gravity relative to1S0",
            "legacyText": "2.44378393(17)",
            "derivedFrom": [
              "T4.frequency_THz",
              "exact SI c,h,e where applicable"
            ]
          }
        }
      },
      {
        "id": "yb171-6s5d-3d1",
        "isotope": 171,
        "attributes": {
          "term": "³D₁",
          "config": "6s5d",
          "parity": "even",
          "J": 1,
          "S": 1,
          "type": "triplet",
          "lifetime": "332 ns",
          "role": "repumper 上能级"
        },
        "energyReference": "neutral-atom-ground-state",
        "quantities": {
          "energy_cm": {
            "value": 24489.14112304007,
            "unit": "cm^-1",
            "quantity": "level_energy",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv2509.04416v2 Table9 p24 + Table12 p25",
            "evidenceKind": "derived",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.000002900000000001552,
            "uncertaintyNote": "formal propagation of printed uncertainties, covariance unavailable; source calibration systematics not independently resolved",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-29",
              "referencePath": "1S0->3P0->³D₁",
              "sourceRecordIds": [
                "table-09:wavenumber_vac",
                "table-12:wavenumber_vac"
              ]
            },
            "convention": "171Yb hyperfine-center-of-gravity; ground plus transition path",
            "derivedFrom": [
              "T3.frequency_THz",
              "T5.frequency_THz"
            ]
          },
          "energy_eV": {
            "value": 3.0362665324389617,
            "unit": "eV",
            "quantity": "level_energy",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv2509.04416v2 Table9 p24 + Table12 p25",
            "evidenceKind": "derived",
            "reviewStatus": "original-source-located",
            "uncertainty": 4.0000000000020004e-10,
            "uncertaintyNote": "formal propagation of printed uncertainties, covariance unavailable; source calibration systematics not independently resolved",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-29",
              "referencePath": "1S0->3P0->³D₁",
              "sourceRecordIds": [
                "table-09:transition_energy",
                "table-12:transition_energy"
              ]
            },
            "convention": "171Yb hyperfine-center-of-gravity; ground plus transition path",
            "derivedFrom": [
              "T3.frequency_THz",
              "T5.frequency_THz"
            ]
          }
        }
      },
      {
        "id": "yb171-6s6p-1p1",
        "isotope": 171,
        "attributes": {
          "term": "¹P₁",
          "config": "6s6p",
          "parity": "odd",
          "J": 1,
          "S": 0,
          "type": "singlet",
          "lifetime": "5.46 ns",
          "role": "宽线冷却 / 成像"
        },
        "energyReference": "neutral-atom-ground-state",
        "quantities": {
          "energy_cm": {
            "value": 25068.258091,
            "unit": "cm^-1",
            "quantity": "level_energy",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 8, PDF/printed p.23, wavenumber_vac",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.000026,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-08:wavenumber_vac",
              "sourceDecimal": "25068.258091",
              "sourceUncertaintyDecimal": "0.000026",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                66,
                104,
                105,
                106
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                38
              ],
              "sourceDependencyRecordIds": [
                "table-08:frequency_nu",
                "table-01:c"
              ]
            },
            "convention": "171Yb hyperfine center-of-gravity relative to1S0",
            "legacyText": "25068.258091(26)"
          },
          "energy_eV": {
            "value": 3.1080678856,
            "unit": "eV",
            "quantity": "level_energy",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 8, PDF/printed p.23, transition_energy",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 3.2e-9,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-08:transition_energy",
              "sourceDecimal": "3.1080678856",
              "sourceUncertaintyDecimal": "3.2E-9",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                66,
                104,
                105,
                106
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                35,
                36
              ],
              "sourceDependencyRecordIds": [
                "table-08:frequency_nu",
                "table-01:h",
                "table-01:e"
              ]
            },
            "convention": "171Yb hyperfine center-of-gravity relative to1S0",
            "legacyText": "3.1080678856(32)"
          }
        }
      },
      {
        "id": "yb171-6s7s-3s1",
        "isotope": 171,
        "attributes": {
          "term": "³S₁",
          "config": "6s7s",
          "parity": "even",
          "J": 1,
          "S": 1,
          "type": "triplet",
          "lifetime": "13.8 ns",
          "role": "repumper / Rydberg 首成员"
        },
        "energyReference": "neutral-atom-ground-state",
        "quantities": {
          "energy_cm": {
            "value": 32694.75222474007,
            "unit": "cm^-1",
            "quantity": "level_energy",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv2509.04416v2 Table9 p24 + Table13 p26",
            "evidenceKind": "derived",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.000007000000000000643,
            "uncertaintyNote": "formal propagation of printed uncertainties, covariance unavailable; source calibration systematics not independently resolved",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-29",
              "referencePath": "1S0->3P0->³S₁",
              "sourceRecordIds": [
                "table-09:wavenumber_vac",
                "table-13:wavenumber_vac"
              ],
              "historicalSourceConflict": "T3+T6 and T4+T7 paths disagree by about150.389MHz (frequency) /146.816MHz (printed rounded wavenumbers); use documented3P0 path, no claim of global Ritz fit",
              "workingNetworkClosureMHz": 0.023333333333333334,
              "closureBoundary": "old150MHz discrepancy no longer present in working Ritz network; remaining23.3kHz is within component/rounding uncertainty; old independent-source discrepancy not explained"
            },
            "convention": "171Yb hyperfine-center-of-gravity; ground plus transition path",
            "derivedFrom": [
              "T3.frequency_THz",
              "T6.frequency_THz"
            ]
          },
          "energy_eV": {
            "value": 4.0536326475389615,
            "unit": "eV",
            "quantity": "level_energy",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv2509.04416v2 Table9 p24 + Table13 p26",
            "evidenceKind": "derived",
            "reviewStatus": "original-source-located",
            "uncertainty": 9.000000000000889e-10,
            "uncertaintyNote": "formal propagation of printed uncertainties, covariance unavailable; source calibration systematics not independently resolved",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-29",
              "referencePath": "1S0->3P0->³S₁",
              "sourceRecordIds": [
                "table-09:transition_energy",
                "table-13:transition_energy"
              ],
              "historicalSourceConflict": "T3+T6 and T4+T7 paths disagree by about150.389MHz (frequency) /146.816MHz (printed rounded wavenumbers); use documented3P0 path, no claim of global Ritz fit",
              "workingNetworkClosureMHz": 0.023333333333333334,
              "closureBoundary": "old150MHz discrepancy no longer present in working Ritz network; remaining23.3kHz is within component/rounding uncertainty; old independent-source discrepancy not explained"
            },
            "convention": "171Yb hyperfine-center-of-gravity; ground plus transition path",
            "derivedFrom": [
              "T3.frequency_THz",
              "T6.frequency_THz"
            ]
          }
        }
      },
      {
        "id": "yb171-6s65s-3s1-triplet-connected",
        "isotope": 171,
        "attributes": {
          "term": "65³S₁",
          "config": "6s65s",
          "J": 1,
          "S": 1,
          "parity": "even",
          "type": "triplet",
          "lifetime": "历史标度估算；非逐态实测",
          "role": "65S 里德堡态"
        },
        "energyReference": "neutral-atom-ground-state",
        "quantities": {
          "energy_cm": {
            "value": 50414.958999999995,
            "unit": "cm^-1",
            "quantity": "level_energy",
            "sourceId": "legacy-levels",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not-established-in-this-migration",
            "conditions": {
              "auditDate": "2026-10-29",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "Rydberg branch/threshold reference not established"
            },
            "convention": null,
            "derivedFrom": [
              "yb171-6s6p-3p0.energy_cm",
              "R2.energy_cm"
            ],
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "energy_eV": {
            "value": 6.250658280928287,
            "unit": "eV",
            "quantity": "level_energy",
            "sourceId": "legacy-levels",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not-established-in-this-migration",
            "conditions": {
              "auditDate": "2026-10-29",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "Rydberg branch/threshold reference not established"
            },
            "convention": null,
            "derivedFrom": [
              "yb171-6s65s-3s1-triplet-connected.energy_cm"
            ],
            "modelId": "legacy-rydberg-scaling-v1"
          }
        }
      },
      {
        "id": "yb171-6s50s-3s1",
        "isotope": 171,
        "attributes": {
          "term": "50³S₁",
          "config": "6s50s",
          "J": 1,
          "parity": "even",
          "type": "triplet"
        },
        "energyReference": "neutral-atom-ground-state",
        "quantities": {
          "energy_cm": {
            "value": null,
            "unit": "cm^-1",
            "quantity": "level_energy",
            "sourceId": "legacy-levels",
            "sourceLocator": null,
            "evidenceKind": "legacy-unclassified",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not-established-in-this-migration",
            "conditions": {
              "auditDate": "2026-10-29",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "Rydberg branch/threshold reference not established"
            },
            "convention": null,
            "missingReason": "not-published-in-original-level-record"
          },
          "energy_eV": {
            "value": null,
            "unit": "eV",
            "quantity": "level_energy",
            "sourceId": "legacy-levels",
            "sourceLocator": null,
            "evidenceKind": "legacy-unclassified",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not-established-in-this-migration",
            "conditions": {
              "auditDate": "2026-10-29",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "Rydberg branch/threshold reference not established"
            },
            "convention": null,
            "missingReason": "not-published-in-original-level-record"
          }
        }
      },
      {
        "id": "yb171-6s80s-3s1",
        "isotope": 171,
        "attributes": {
          "term": "80³S₁",
          "config": "6s80s",
          "J": 1,
          "parity": "even",
          "type": "triplet"
        },
        "energyReference": "neutral-atom-ground-state",
        "quantities": {
          "energy_cm": {
            "value": null,
            "unit": "cm^-1",
            "quantity": "level_energy",
            "sourceId": "legacy-levels",
            "sourceLocator": null,
            "evidenceKind": "legacy-unclassified",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not-established-in-this-migration",
            "conditions": {
              "auditDate": "2026-10-29",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "Rydberg branch/threshold reference not established"
            },
            "convention": null,
            "missingReason": "not-published-in-original-level-record"
          },
          "energy_eV": {
            "value": null,
            "unit": "eV",
            "quantity": "level_energy",
            "sourceId": "legacy-levels",
            "sourceLocator": null,
            "evidenceKind": "legacy-unclassified",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not-established-in-this-migration",
            "conditions": {
              "auditDate": "2026-10-29",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "Rydberg branch/threshold reference not established"
            },
            "convention": null,
            "missingReason": "not-published-in-original-level-record"
          }
        }
      },
      {
        "id": "yb171-6s65d-3d1",
        "isotope": 171,
        "attributes": {
          "term": "65³D₁",
          "config": "6s65d",
          "J": 1,
          "parity": "even",
          "type": "triplet"
        },
        "energyReference": "neutral-atom-ground-state",
        "quantities": {
          "energy_cm": {
            "value": null,
            "unit": "cm^-1",
            "quantity": "level_energy",
            "sourceId": "legacy-levels",
            "sourceLocator": null,
            "evidenceKind": "legacy-unclassified",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not-established-in-this-migration",
            "conditions": {
              "auditDate": "2026-10-29",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "Rydberg branch/threshold reference not established"
            },
            "convention": null,
            "missingReason": "not-published-in-original-level-record"
          },
          "energy_eV": {
            "value": null,
            "unit": "eV",
            "quantity": "level_energy",
            "sourceId": "legacy-levels",
            "sourceLocator": null,
            "evidenceKind": "legacy-unclassified",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not-established-in-this-migration",
            "conditions": {
              "auditDate": "2026-10-29",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "Rydberg branch/threshold reference not established"
            },
            "convention": null,
            "missingReason": "not-published-in-original-level-record"
          }
        }
      },
      {
        "id": "yb171-6s65d-3d2",
        "isotope": 171,
        "attributes": {
          "term": "65³D₂",
          "config": "6s65d",
          "J": 2,
          "parity": "even",
          "type": "triplet"
        },
        "energyReference": "neutral-atom-ground-state",
        "quantities": {
          "energy_cm": {
            "value": null,
            "unit": "cm^-1",
            "quantity": "level_energy",
            "sourceId": "legacy-levels",
            "sourceLocator": null,
            "evidenceKind": "legacy-unclassified",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not-established-in-this-migration",
            "conditions": {
              "auditDate": "2026-10-29",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "Rydberg branch/threshold reference not established"
            },
            "convention": null,
            "missingReason": "not-published-in-original-level-record"
          },
          "energy_eV": {
            "value": null,
            "unit": "eV",
            "quantity": "level_energy",
            "sourceId": "legacy-levels",
            "sourceLocator": null,
            "evidenceKind": "legacy-unclassified",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not-established-in-this-migration",
            "conditions": {
              "auditDate": "2026-10-29",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "Rydberg branch/threshold reference not established"
            },
            "convention": null,
            "missingReason": "not-published-in-original-level-record"
          }
        }
      }
    ],
    "coreLevelIds": [
      "yb171-6s2-1s0",
      "yb171-6s6p-3p0",
      "yb171-6s6p-3p1",
      "yb171-6s6p-3p2",
      "yb171-6s5d-3d1",
      "yb171-6s6p-1p1",
      "yb171-6s7s-3s1",
      "yb171-6s65s-3s1-triplet-connected"
    ],
    "lowStateRoles": [
      {
        "levelId": "yb171-6s2-1s0",
        "role": "|0⟩ 基态"
      },
      {
        "levelId": "yb171-6s6p-3p0",
        "role": "|1⟩ 亚稳态"
      },
      {
        "levelId": "yb171-6s6p-3p1",
        "role": "双光子中间态"
      },
      {
        "levelId": "yb171-6s6p-3p2",
        "role": "辅助亚稳态"
      }
    ],
    "rydbergGroups": [
      {
        "n": 50,
        "series": "³S₁",
        "label": "50³S₁",
        "color": "#c7a98c",
        "ref": "历史标度示意；指定171Yb分支未验证",
        "transitions": [
          {
            "from": "³P₀",
            "color": "#c7a98c",
            "note": "R1 · 302.1 nm"
          }
        ],
        "levelId": "yb171-6s50s-3s1",
        "quantumDefectId": "6sns ³S₁"
      },
      {
        "n": 65,
        "series": "³S₁",
        "label": "65³S₁",
        "color": "#b08f76",
        "ref": "历史标度示意；指定171Yb分支未验证",
        "transitions": [
          {
            "from": "³P₀",
            "color": "#b08f76",
            "note": "R2 · 301.9 nm · CZ 门"
          },
          {
            "from": "³P₁",
            "color": "#a8c9b8",
            "note": "R6 · 308.4 nm"
          },
          {
            "from": "³P₂",
            "color": "#8fb5c4",
            "note": "R7 · 325.7 nm"
          }
        ],
        "levelId": "yb171-6s65s-3s1-triplet-connected",
        "quantumDefectId": "6sns ³S₁"
      },
      {
        "n": 80,
        "series": "³S₁",
        "label": "80³S₁",
        "color": "#d9c3a8",
        "ref": "历史标度示意；指定171Yb分支未验证",
        "transitions": [
          {
            "from": "³P₀",
            "color": "#d9c3a8",
            "note": "R3 · 301.8 nm"
          }
        ],
        "levelId": "yb171-6s80s-3s1",
        "quantumDefectId": "6sns ³S₁"
      },
      {
        "n": 65,
        "series": "³D₁",
        "label": "65³D₁",
        "color": "#9e92b0",
        "ref": "历史标度示意；指定171Yb分支未验证",
        "transitions": [
          {
            "from": "³P₀",
            "color": "#9e92b0",
            "note": "R4 · 301.9 nm"
          }
        ],
        "levelId": "yb171-6s65d-3d1",
        "quantumDefectId": "6snd ³D₁"
      },
      {
        "n": 65,
        "series": "³D₂",
        "label": "65³D₂",
        "color": "#b8adc7",
        "ref": "历史标度示意；指定171Yb分支未验证",
        "transitions": [
          {
            "from": "³P₀",
            "color": "#b8adc7",
            "note": "R5 · 301.9 nm · ΔJ=2（弱）"
          }
        ],
        "levelId": "yb171-6s65d-3d2",
        "quantumDefectId": "6snd ³D₂"
      }
    ]
  },
  "transitions": {
    "schemaVersion": 1,
    "isotope": 171,
    "coreTransitionIds": [
      "T1",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "R2"
    ],
    "rydbergTransitionIds": [
      "R1",
      "R2",
      "R3",
      "R4",
      "R5",
      "R6",
      "R7"
    ],
    "records": [
      {
        "id": "T1",
        "lowerLevelId": "yb171-6s2-1s0",
        "upperLevelId": "yb171-6s6p-1p1",
        "category": "core",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 398.9108443,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 8, PDF/printed p.23, wavelength_vac",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 4e-7,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-08:wavelength_vac",
              "sourceDecimal": "398.9108443",
              "sourceUncertaintyDecimal": "4E-7",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                66,
                104,
                105,
                106
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                37
              ],
              "sourceDependencyRecordIds": [
                "table-08:frequency_nu",
                "table-01:c"
              ]
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "398.9108443(4)"
          },
          "wavelength_air_nm": {
            "value": 398.80207,
            "unit": "nm",
            "quantity": "wavelength_air_nm",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 8, PDF/printed p.23, wavelength_air",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.000004,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-08:wavelength_air",
              "sourceDecimal": "398.802070",
              "sourceUncertaintyDecimal": "0.000004",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                66,
                104,
                105,
                106
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [
                99,
                100,
                101,
                102
              ],
              "sourceEquations": [
                39,
                40
              ],
              "sourceDependencyRecordIds": [
                "table-08:wavelength_vac"
              ],
              "airDefinition": "101325 Pa,25 degC,50%RH; source refractive-index uncertainty1e-8; ambient variation excluded"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "398.802070(4)"
          },
          "frequency_THz": {
            "value": 751.5274711,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 8, PDF/printed p.23, frequency_nu",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 8e-7,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-weighted-recommendation",
              "sourceRecord": "table-08:frequency_nu",
              "sourceDecimal": "751.5274711",
              "sourceUncertaintyDecimal": "8E-7",
              "sourceReferenceNumbers": [
                66,
                104,
                105,
                106
              ],
              "dependencyReferenceNumbers": [],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "birgeRatio": 6.3
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "751.5274711(8)"
          },
          "energy_eV": {
            "value": 3.1080678856,
            "unit": "eV",
            "quantity": "energy_eV",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 8, PDF/printed p.23, transition_energy",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 3.2e-9,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-08:transition_energy",
              "sourceDecimal": "3.1080678856",
              "sourceUncertaintyDecimal": "3.2E-9",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                66,
                104,
                105,
                106
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                35,
                36
              ],
              "sourceDependencyRecordIds": [
                "table-08:frequency_nu",
                "table-01:h",
                "table-01:e"
              ]
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "3.1080678856(32)"
          },
          "Gamma_per_s_num": {
            "value": 183000000,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 8, PDF/printed p.23, total_decay_rate",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 400000,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-08:total_decay_rate",
              "sourceDecimal": "183000000.0",
              "sourceUncertaintyDecimal": "400000",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                133,
                135,
                136,
                139,
                210,
                211,
                212
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                46
              ],
              "sourceDependencyRecordIds": [
                "table-08:upper_state_lifetime"
              ],
              "historicalLifetimeBoundary": "RambowTableI natural-mixture errors are maximum confidence limits,excludeHFS correction; not171-resolved1sigma; other compilation inputs still not all primary-rechecked"
            },
            "convention": "total spontaneous decay rate Gamma=1/tau; not branch-specific Einstein A",
            "legacyText": "183.0(4)e6"
          },
          "lifetime_ns": {
            "value": 5.464,
            "unit": "ns",
            "quantity": "lifetime_ns",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 8, PDF/printed p.23, upper_state_lifetime",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.011,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-weighted-recommendation",
              "sourceRecord": "table-08:upper_state_lifetime",
              "sourceDecimal": "5.464",
              "sourceUncertaintyDecimal": "0.011",
              "sourceReferenceNumbers": [
                133,
                135,
                136,
                139,
                210,
                211,
                212
              ],
              "dependencyReferenceNumbers": [],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "birgeRatio": 2.3,
              "temperature_K": null,
              "BBRTemperature_K": null,
              "historicalLifetimeBoundary": "RambowTableI natural-mixture errors are maximum confidence limits,excludeHFS correction; not171-resolved1sigma; other compilation inputs still not all primary-rechecked"
            },
            "convention": "total upper-state radiative lifetime; not inverse partial decay rate or trap survival",
            "legacyText": "5.464(11)"
          },
          "oscillator_strength_f_num": {
            "value": 1.3098,
            "unit": "dimensionless",
            "quantity": "oscillator_strength_f_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 8, PDF/printed p.23, oscillator_strength",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.0027,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-08:oscillator_strength",
              "sourceDecimal": "1.3098",
              "sourceUncertaintyDecimal": "0.0027",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                66,
                104,
                105,
                106,
                133,
                135,
                136,
                139,
                210,
                211,
                212
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [
                140
              ],
              "sourceEquations": [
                50
              ],
              "sourceDependencyRecordIds": [
                "table-08:frequency_nu",
                "table-08:upper_state_lifetime",
                "table-01:epsilon0",
                "table-01:electron_mass",
                "table-01:c",
                "table-01:e"
              ]
            },
            "convention": null,
            "legacyText": "1.3098(27)"
          },
          "d_num": {
            "value": 4.147,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 8, PDF/printed p.23, dipole_reduced_J_Racah",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.004,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived-from-lifetime-frequency-theory-branching",
              "sourceRecord": "table-08:dipole_reduced_J_Racah",
              "sourceDecimal": "4.147",
              "sourceUncertaintyDecimal": "0.004",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                66,
                104,
                105,
                106,
                132,
                133,
                135,
                136,
                139,
                210,
                211,
                212
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [
                141,
                142,
                143,
                144
              ],
              "sourceEquations": [
                52,
                54
              ],
              "sourceDependencyRecordIds": [
                "table-08:frequency_nu",
                "table-08:upper_state_lifetime",
                "table-01:epsilon0",
                "table-01:hbar",
                "table-01:c",
                "table-01:e",
                "table-01:a0",
                "table-08:branching_ratio:1P1->1S0"
              ],
              "definition": "<Jg||er||Je>_R Racah-Wigner, Eq54; includes adopted theoretical branching ratios",
              "historicalLifetimeBoundary": "RambowTableI natural-mixture errors are maximum confidence limits,excludeHFS correction; not171-resolved1sigma; other compilation inputs still not all primary-rechecked"
            },
            "convention": "J-reduced",
            "legacyText": "4.147(4)"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 29130000,
            "unit": "Hz",
            "quantity": "ordinary_frequency_FWHM",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 8, PDF/printed p.23, linewidth_FWHM_nu",
            "evidenceKind": "literature-reported",
            "reviewStatus": "conflict-unresolved",
            "uncertainty": 60000,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-08:linewidth_FWHM_nu",
              "sourceDecimal": "29.13",
              "sourceUncertaintyDecimal": "0.06",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                133,
                135,
                136,
                139,
                210,
                211,
                212
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                46,
                47
              ],
              "reviewFlags": [
                "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT"
              ],
              "sourceDependencyRecordIds": [
                "table-08:upper_state_lifetime"
              ],
              "sourceConflict": "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT: Eq47 defines Delta_nu=Gamma/(2pi), tables print an extra2pi"
            },
            "convention": "ordinary-frequency-FWHM=Gamma/(2*pi); source-table-extra-2pi-conflict",
            "legacyText": "2π × 29.13(6) MHz"
          }
        },
        "views": {
          "core": {
            "presentation": {
              "id": "T1",
              "upper": "¹P₁",
              "lower": "¹S₀",
              "label": "蓝 MOT / Zeeman slower",
              "linewidth_FWHM": "29.13(6) MHz",
              "Gamma_per_s": "1.83×10⁸",
              "Isat": "59.97 mW/cm²",
              "branching": "≈1 (cycling, 漏率 ~6×10⁻⁸)（理论分支比；非完整实测）",
              "multipole": "E1",
              "classification": "强",
              "forbidden_reason": "—",
              "selection_check": "ΔS=0 ✓, ΔL=+1 ✓, ΔJ=+1 ✓, 奇偶变 ✓",
              "use": "一级冷却、Zeeman 慢化、原子成像",
              "source": "Kroeze et al.2026, arXiv2509.04416v2 Table8 p23",
              "color": "#34d399"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "wavelength_air_nm": "wavelength_air_nm",
              "frequency_THz": "frequency_THz",
              "energy_eV": "energy_eV",
              "Gamma_per_s_num": "Gamma_per_s_num",
              "lifetime_ns": "lifetime_ns",
              "oscillator_strength_f_num": "oscillator_strength_f_num",
              "d_num": "d_num"
            },
            "aliases": {
              "oscillator_strength_f": "oscillator_strength_f_num",
              "d_reduced_ea0": "d_num"
            },
            "legacyNullValues": {}
          }
        }
      },
      {
        "id": "T2",
        "lowerLevelId": "yb171-6s2-1s0",
        "upperLevelId": "yb171-6s6p-3p1",
        "category": "core",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 555.80068663,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 10, PDF/printed p.24, wavelength_vac",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 1.3e-7,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-10:wavelength_vac",
              "sourceDecimal": "555.80068663",
              "sourceUncertaintyDecimal": "1.3E-7",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                181,
                182,
                184
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                37
              ],
              "sourceDependencyRecordIds": [
                "table-10:frequency_nu",
                "table-01:c"
              ]
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "555.80068663(13)"
          },
          "wavelength_air_nm": {
            "value": 555.651877,
            "unit": "nm",
            "quantity": "wavelength_air_nm",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 10, PDF/printed p.24, wavelength_air",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.000006,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-10:wavelength_air",
              "sourceDecimal": "555.651877",
              "sourceUncertaintyDecimal": "0.000006",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                181,
                182,
                184
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [
                99,
                100,
                101,
                102
              ],
              "sourceEquations": [
                39,
                40
              ],
              "sourceDependencyRecordIds": [
                "table-10:wavelength_vac"
              ],
              "airDefinition": "101325 Pa,25 degC,50%RH; source refractive-index uncertainty1e-8; ambient variation excluded"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "555.651877(6)"
          },
          "frequency_THz": {
            "value": 539.38842684,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 10, PDF/printed p.24, frequency_nu",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 1.2e-7,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-weighted-recommendation",
              "sourceRecord": "table-10:frequency_nu",
              "sourceDecimal": "539.38842684",
              "sourceUncertaintyDecimal": "1.2E-7",
              "sourceReferenceNumbers": [
                181,
                182,
                184
              ],
              "dependencyReferenceNumbers": [],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "birgeRatio": 2.9
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "539.38842684(12)"
          },
          "energy_eV": {
            "value": 2.230731293,
            "unit": "eV",
            "quantity": "energy_eV",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 10, PDF/printed p.24, transition_energy",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 5e-10,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-10:transition_energy",
              "sourceDecimal": "2.2307312930",
              "sourceUncertaintyDecimal": "5E-10",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                181,
                182,
                184
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                35,
                36
              ],
              "sourceDependencyRecordIds": [
                "table-10:frequency_nu",
                "table-01:h",
                "table-01:e"
              ]
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "2.2307312930(5)"
          },
          "Gamma_per_s_num": {
            "value": 1146000,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 10, PDF/printed p.24, total_decay_rate",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 2500,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-10:total_decay_rate",
              "sourceDecimal": "1146000.0000",
              "sourceUncertaintyDecimal": "2500",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                133,
                134,
                136,
                137,
                139,
                195,
                212,
                215,
                216,
                217,
                218
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                46
              ],
              "sourceDependencyRecordIds": [
                "table-10:upper_state_lifetime"
              ],
              "historicalLifetimeBoundary": "RambowTableI natural-mixture errors are maximum confidence limits,excludeHFS correction; not171-resolved1sigma; other compilation inputs still not all primary-rechecked"
            },
            "convention": "total spontaneous decay rate Gamma=1/tau; not branch-specific Einstein A",
            "legacyText": "1.1460(25)e6"
          },
          "lifetime_ns": {
            "value": 872.6,
            "unit": "ns",
            "quantity": "lifetime_ns",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 10, PDF/printed p.24, upper_state_lifetime",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 1.9,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-weighted-recommendation",
              "sourceRecord": "table-10:upper_state_lifetime",
              "sourceDecimal": "872.6",
              "sourceUncertaintyDecimal": "1.9",
              "sourceReferenceNumbers": [
                133,
                134,
                136,
                137,
                139,
                195,
                212,
                215,
                216,
                217,
                218
              ],
              "dependencyReferenceNumbers": [],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "birgeRatio": 1.2,
              "temperature_K": null,
              "BBRTemperature_K": null,
              "historicalLifetimeBoundary": "RambowTableI natural-mixture errors are maximum confidence limits,excludeHFS correction; not171-resolved1sigma; other compilation inputs still not all primary-rechecked"
            },
            "convention": "total upper-state radiative lifetime; not inverse partial decay rate or trap survival",
            "legacyText": "872.6(19)"
          },
          "oscillator_strength_f_num": {
            "value": 0.015923,
            "unit": "dimensionless",
            "quantity": "oscillator_strength_f_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 10, PDF/printed p.24, oscillator_strength",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.000035,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-10:oscillator_strength",
              "sourceDecimal": "0.015923",
              "sourceUncertaintyDecimal": "0.000035",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                133,
                134,
                136,
                137,
                139,
                181,
                182,
                184,
                195,
                212,
                215,
                216,
                217,
                218
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [
                140
              ],
              "sourceEquations": [
                50
              ],
              "sourceDependencyRecordIds": [
                "table-10:frequency_nu",
                "table-10:upper_state_lifetime",
                "table-01:epsilon0",
                "table-01:electron_mass",
                "table-01:c",
                "table-01:e"
              ]
            },
            "convention": null,
            "legacyText": "0.015923(35)"
          },
          "d_num": {
            "value": 0.5398,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 10, PDF/printed p.24, dipole_reduced_J_Racah",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.0006,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived-from-lifetime-frequency-Eq54",
              "sourceRecord": "table-10:dipole_reduced_J_Racah",
              "sourceDecimal": "0.5398",
              "sourceUncertaintyDecimal": "0.0006",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                133,
                134,
                136,
                137,
                139,
                181,
                182,
                184,
                195,
                212,
                215,
                216,
                217,
                218
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction. Table10 does not quote beta separately; Eq54 uses an implicit dominant/single branch, not a newly measured beta.",
              "methodReferenceNumbers": [
                141,
                142,
                143,
                144
              ],
              "sourceEquations": [
                52,
                54
              ],
              "sourceDependencyRecordIds": [
                "table-10:frequency_nu",
                "table-10:upper_state_lifetime",
                "table-01:epsilon0",
                "table-01:hbar",
                "table-01:c",
                "table-01:e",
                "table-01:a0"
              ],
              "definition": "<Jg||er||Je>_R Racah-Wigner, Eq54; includes adopted theoretical branching ratios",
              "replacedInternalCalibration": "0.543 ea0 archived in audit baseline; rationale/artifact unavailable",
              "historicalLifetimeBoundary": "RambowTableI natural-mixture errors are maximum confidence limits,excludeHFS correction; not171-resolved1sigma; other compilation inputs still not all primary-rechecked"
            },
            "convention": "J-reduced",
            "legacyText": "0.5398(6)"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 182400,
            "unit": "Hz",
            "quantity": "ordinary_frequency_FWHM",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 10, PDF/printed p.24, linewidth_FWHM_nu",
            "evidenceKind": "literature-reported",
            "reviewStatus": "conflict-unresolved",
            "uncertainty": 400,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-10:linewidth_FWHM_nu",
              "sourceDecimal": "182.4",
              "sourceUncertaintyDecimal": "0.4",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                133,
                134,
                136,
                137,
                139,
                195,
                212,
                215,
                216,
                217,
                218
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                46,
                47
              ],
              "reviewFlags": [
                "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT"
              ],
              "sourceDependencyRecordIds": [
                "table-10:upper_state_lifetime"
              ],
              "sourceConflict": "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT: Eq47 defines Delta_nu=Gamma/(2pi), tables print an extra2pi"
            },
            "convention": "ordinary-frequency-FWHM=Gamma/(2*pi); source-table-extra-2pi-conflict",
            "legacyText": "2π × 182.4(4) kHz"
          }
        },
        "views": {
          "core": {
            "presentation": {
              "id": "T2",
              "upper": "³P₁",
              "lower": "¹S₀",
              "label": "绿 MOT (窄线冷却)",
              "linewidth_FWHM": "182.4(4) kHz",
              "Gamma_per_s": "1.146×10⁶",
              "Isat": "138.85 µW/cm²",
              "branching": "1 (至 ¹S₀)",
              "multipole": "E1 (intercombination)",
              "classification": "弱",
              "forbidden_reason": "自旋禁戒 (ΔS=1)；LS 耦合混合开启弱 E1 通道",
              "selection_check": "ΔS=1 ✗, ΔL=+1 ✓, ΔJ=+1 ✓, 奇偶变 ✓",
              "use": "二级冷却至 µK、核自旋态相干控制/成像",
              "source": "Kroeze et al.2026, arXiv2509.04416v2 Table10 p24",
              "color": "#facc15"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "wavelength_air_nm": "wavelength_air_nm",
              "frequency_THz": "frequency_THz",
              "energy_eV": "energy_eV",
              "Gamma_per_s_num": "Gamma_per_s_num",
              "lifetime_ns": "lifetime_ns",
              "oscillator_strength_f_num": "oscillator_strength_f_num",
              "d_num": "d_num"
            },
            "aliases": {
              "oscillator_strength_f": "oscillator_strength_f_num",
              "d_reduced_ea0": "d_num"
            },
            "legacyNullValues": {}
          }
        }
      },
      {
        "id": "T3",
        "lowerLevelId": "yb171-6s2-1s0",
        "upperLevelId": "yb171-6s6p-3p0",
        "category": "core",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 578.4195759161624,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 9, PDF/printed p.24, wavelength_vac",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 1.1e-13,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-09:wavelength_vac",
              "sourceDecimal": "578.41957591616250",
              "sourceUncertaintyDecimal": "1.1E-13",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                121
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                37
              ],
              "sourceDependencyRecordIds": [
                "table-09:frequency_nu",
                "table-01:c"
              ]
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "578.41957591616250(11)"
          },
          "wavelength_air_nm": {
            "value": 578.264935,
            "unit": "nm",
            "quantity": "wavelength_air_nm",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 9, PDF/printed p.24, wavelength_air",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.000006,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-09:wavelength_air",
              "sourceDecimal": "578.264935",
              "sourceUncertaintyDecimal": "0.000006",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                121
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [
                99,
                100,
                101,
                102
              ],
              "sourceEquations": [
                39,
                40
              ],
              "sourceDependencyRecordIds": [
                "table-09:wavelength_vac"
              ],
              "airDefinition": "101325 Pa,25 degC,50%RH; source refractive-index uncertainty1e-8; ambient variation excluded"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "578.264935(6)"
          },
          "frequency_THz": {
            "value": 518.2958365908636,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 9, PDF/printed p.24, frequency_nu",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 1e-13,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-adopted",
              "sourceRecord": "table-09:frequency_nu",
              "sourceDecimal": "518.29583659086363",
              "sourceUncertaintyDecimal": "1.0E-13",
              "sourceReferenceNumbers": [
                121
              ],
              "dependencyReferenceNumbers": [],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "birgeRatio": null
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "518.29583659086363(10)"
          },
          "energy_eV": {
            "value": 2.1434993488389615,
            "unit": "eV",
            "quantity": "energy_eV",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 9, PDF/printed p.24, transition_energy",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 4e-16,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-09:transition_energy",
              "sourceDecimal": "2.1434993488389615",
              "sourceUncertaintyDecimal": "4E-16",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                121
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                35,
                36
              ],
              "sourceDependencyRecordIds": [
                "table-09:frequency_nu",
                "table-01:h",
                "table-01:e"
              ]
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "2.1434993488389615(4)"
          },
          "Gamma_per_s_num": {
            "value": 0.048,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 9, PDF/printed p.24, total_decay_rate",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.004,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-09:total_decay_rate",
              "sourceDecimal": "0.048",
              "sourceUncertaintyDecimal": "0.004",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                213,
                214
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                46
              ],
              "sourceDependencyRecordIds": [
                "table-09:upper_state_lifetime"
              ]
            },
            "convention": "total spontaneous decay rate Gamma=1/tau; not branch-specific Einstein A",
            "legacyText": "0.048(4)"
          },
          "lifetime_ns": {
            "value": 21000000000,
            "unit": "ns",
            "quantity": "lifetime_ns",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 9, PDF/printed p.24, upper_state_lifetime",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 1800000000,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-weighted-recommendation",
              "sourceRecord": "table-09:upper_state_lifetime",
              "sourceDecimal": "21.0",
              "sourceUncertaintyDecimal": "1.8",
              "sourceReferenceNumbers": [
                213,
                214
              ],
              "dependencyReferenceNumbers": [],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "birgeRatio": 1.3,
              "temperature_K": null,
              "BBRTemperature_K": null
            },
            "convention": "total upper-state radiative lifetime; not inverse partial decay rate or trap survival",
            "legacyText": "21.0(18)"
          },
          "oscillator_strength_f_num": {
            "value": null,
            "unit": "dimensionless",
            "quantity": "oscillator_strength_f_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2 Table 9, p24; oscillator strength not listed",
            "evidenceKind": "literature-reported",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "no supported oscillator strength supplied; legacy1e-9 was not traceable",
            "conditions": {
              "auditDate": "2026-10-29",
              "excludedLegacyValue": 1e-9
            },
            "convention": null,
            "missingReason": "not-provided-in-cited-source"
          },
          "d_num": {
            "value": 0.0000919,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "internal-t3-20260908",
            "sourceLocator": "internal supplement2026-09-08; no original notebook/run artifact located; NOT Table9",
            "evidenceKind": "internal-calculation",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unverified-internal-record",
              "definition": "effective F-reduced171Yb F=1/2->F=1/2; not electronic J=0->J=0 E1 matrix element"
            },
            "convention": "F-reduced-effective"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 0.0076,
            "unit": "Hz",
            "quantity": "ordinary_frequency_FWHM",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 9, PDF/printed p.24, linewidth_FWHM_nu",
            "evidenceKind": "literature-reported",
            "reviewStatus": "conflict-unresolved",
            "uncertainty": 0.0006,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-09:linewidth_FWHM_nu",
              "sourceDecimal": "7.6",
              "sourceUncertaintyDecimal": "0.6",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                213,
                214
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                46,
                47
              ],
              "reviewFlags": [
                "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT"
              ],
              "sourceDependencyRecordIds": [
                "table-09:upper_state_lifetime"
              ],
              "sourceConflict": "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT: Eq47 defines Delta_nu=Gamma/(2pi), tables print an extra2pi"
            },
            "convention": "ordinary-frequency-FWHM=Gamma/(2*pi); source-table-extra-2pi-conflict",
            "legacyText": "2π × 7.6(6) mHz"
          }
        },
        "views": {
          "core": {
            "presentation": {
              "id": "T3",
              "upper": "³P₀",
              "lower": "¹S₀",
              "label": "黄钟跃迁 (optical qubit)",
              "linewidth_FWHM": "7.6(6) mHz",
              "Gamma_per_s": "0.048",
              "oscillator_strength_f": "未提供",
              "d_reduced_ea0": "9.19e-05",
              "Isat": "—",
              "branching": "1 (至 ¹S₀)",
              "multipole": "E1 (hyperfine-mixed)",
              "classification": "禁戒",
              "forbidden_reason": "双重禁戒：自旋禁戒 + J=0→J=0 禁戒；¹⁷¹Yb 超精细混合开启 F=1/2→F′=1/2 有效通道，d_reduced = 9.19×10⁻⁵ ea₀，各 mF 子通道矩阵元 = d_red × CG/√(2F′+1)（σ 通道 ≈ ±5.31×10⁻⁵、π 通道 ≈ ±3.75×10⁻⁵），校验锚点 +1/2→−1/2 = 5.30×10⁻⁵ ea₀（2026-09-08 内部补充）",
              "selection_check": "ΔS=1 ✗, J=0→0 ✗, 奇偶变 ✓",
              "use": "光钟、光量子比特 |0⟩=¹S₀, |1⟩=³P₀",
              "source": "Kroeze et al.2026, arXiv2509.04416v2 Table9 p24；d为2026-09-08内部F级有效量，原始计算待补",
              "hf_induced": true,
              "color": "#f87171"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "wavelength_air_nm": "wavelength_air_nm",
              "frequency_THz": "frequency_THz",
              "energy_eV": "energy_eV",
              "Gamma_per_s_num": "Gamma_per_s_num",
              "lifetime_ns": "lifetime_ns",
              "oscillator_strength_f_num": "oscillator_strength_f_num",
              "d_num": "d_num"
            },
            "aliases": {},
            "legacyNullValues": {}
          }
        }
      },
      {
        "id": "T4",
        "lowerLevelId": "yb171-6s2-1s0",
        "upperLevelId": "yb171-6s6p-3p2",
        "category": "core",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 507.3452995130081,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "qiao-2023-rinp",
            "sourceLocator": "Qiao2023RINP Table2 PDFp5, five corrected hyperfine component frequencies + clock ref01 Table9 p24",
            "evidenceKind": "derived",
            "reviewStatus": "original-source-located",
            "uncertainty": null,
            "uncertaintyNote": "actual propagated1sigma unavailable without covariance; conservative standard-deviation bound retained separately",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-30",
              "sourceEvidenceType": "derived-five-component-F-centroid-Ritz",
              "sourceRecord": "frequency/arithmetic-and-recommendations.json",
              "originalPDF": "references/papers/1.pdf",
              "originalPDFSha256": "208431f4b46db7195a46a87d34dd6d0d73cddc2818310be95d29582d80156783",
              "formulaMHz": "clock+(nu649low+2nu649high)/3-(5nu770a+nu770b+9nu770c)/15",
              "rawComponentsMHz": [
                "461861338.03(21)",
                "461871596.07(31)",
                "389257019.71(65)",
                "389267277.10(37)",
                "389260569.95(89)"
              ],
              "derivedFrequencyDecimalTHz": "590.9041796341969633333333333333333333333",
              "conservativeStdUpperBoundMHz": 1.0520001,
              "uncertaintyBoundary": "Cross-transition covariances not supplied. Sum|weight|u bounds the propagated standard deviation given reported marginal uncertainties, including0.1Hz clock. It is not an actual reconstructed1sigma or a hard confidence interval; unreported systematics/second-order HFS are not bounded.",
              "centroidDefinition": "first-order171YbF-degeneracy endpoint centroids; no intensity weighting or new fit",
              "legacySourceCauseEstablished": false,
              "sourceDecimal": "507.3452995130081009080319663335114400588",
              "supersededIndependentSource": {
                "sourceId": "ref-01",
                "value": 507.34517,
                "uncertainty": 0.00004,
                "locator": "arXiv:2509.04416v2, Table 11, PDF/printed p.25, wavelength_vac"
              },
              "sourceConflict": "Previous Kroeze/Yamaguchi590.90433(4)THz disagrees with this explicit Ritz centroid by150.365803MHz; cause not established. Old value and derivation alternatives preserved."
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "507.34517(4)",
            "derivedFrom": [
              "Qiao2023RINP.Table2.five-hyperfine-components",
              "T3.frequency_THz",
              "exact SI c,h,e where applicable"
            ]
          },
          "wavelength_air_nm": {
            "value": null,
            "unit": "nm",
            "quantity": "wavelength_air_nm",
            "sourceId": "ref-01",
            "sourceLocator": "KroezeTable11 old air wavelength archived; Edlen/Buck conversion not recomputed for updated Ritz frequency",
            "evidenceKind": "literature-reported",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "air wavelength unavailable for updated working frequency; refractive-index/environment uncertainty not reconstructed",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-30",
              "supersededValueNm": 507.20882,
              "updatedVacuumWavelengthNm": 507.3452995130081
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "507.20882(4)",
            "missingReason": "not-recomputed-for-updated-vacuum-frequency"
          },
          "frequency_THz": {
            "value": 590.9041796341969,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "qiao-2023-rinp",
            "sourceLocator": "Qiao2023RINP Table2 PDFp5, five corrected hyperfine component frequencies + clock ref01 Table9 p24",
            "evidenceKind": "derived",
            "reviewStatus": "original-source-located",
            "uncertainty": null,
            "uncertaintyNote": "actual propagated1sigma unavailable without covariance; conservative standard-deviation bound retained separately",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-30",
              "sourceEvidenceType": "derived-five-component-F-centroid-Ritz",
              "sourceRecord": "frequency/arithmetic-and-recommendations.json",
              "originalPDF": "references/papers/1.pdf",
              "originalPDFSha256": "208431f4b46db7195a46a87d34dd6d0d73cddc2818310be95d29582d80156783",
              "formulaMHz": "clock+(nu649low+2nu649high)/3-(5nu770a+nu770b+9nu770c)/15",
              "rawComponentsMHz": [
                "461861338.03(21)",
                "461871596.07(31)",
                "389257019.71(65)",
                "389267277.10(37)",
                "389260569.95(89)"
              ],
              "derivedFrequencyDecimalTHz": "590.9041796341969633333333333333333333333",
              "conservativeStdUpperBoundMHz": 1.0520001,
              "uncertaintyBoundary": "Cross-transition covariances not supplied. Sum|weight|u bounds the propagated standard deviation given reported marginal uncertainties, including0.1Hz clock. It is not an actual reconstructed1sigma or a hard confidence interval; unreported systematics/second-order HFS are not bounded.",
              "centroidDefinition": "first-order171YbF-degeneracy endpoint centroids; no intensity weighting or new fit",
              "legacySourceCauseEstablished": false,
              "sourceDecimal": "590.9041796341969633333333333333333333333",
              "supersededIndependentSource": {
                "sourceId": "ref-01",
                "value": 590.90433,
                "uncertainty": 0.00004,
                "locator": "arXiv:2509.04416v2, Table 11, PDF/printed p.25, frequency_nu"
              },
              "sourceConflict": "Previous Kroeze/Yamaguchi590.90433(4)THz disagrees with this explicit Ritz centroid by150.365803MHz; cause not established. Old value and derivation alternatives preserved."
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "590.90433(4)",
            "derivedFrom": [
              "Qiao2023RINP.Table2.five-hyperfine-components",
              "T3.frequency_THz",
              "exact SI c,h,e where applicable"
            ]
          },
          "energy_eV": {
            "value": 2.4437833276904413,
            "unit": "eV",
            "quantity": "energy_eV",
            "sourceId": "qiao-2023-rinp",
            "sourceLocator": "Qiao2023RINP Table2 PDFp5, five corrected hyperfine component frequencies + clock ref01 Table9 p24",
            "evidenceKind": "derived",
            "reviewStatus": "original-source-located",
            "uncertainty": null,
            "uncertaintyNote": "actual propagated1sigma unavailable without covariance; conservative standard-deviation bound retained separately",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-30",
              "sourceEvidenceType": "derived-five-component-F-centroid-Ritz",
              "sourceRecord": "frequency/arithmetic-and-recommendations.json",
              "originalPDF": "references/papers/1.pdf",
              "originalPDFSha256": "208431f4b46db7195a46a87d34dd6d0d73cddc2818310be95d29582d80156783",
              "formulaMHz": "clock+(nu649low+2nu649high)/3-(5nu770a+nu770b+9nu770c)/15",
              "rawComponentsMHz": [
                "461861338.03(21)",
                "461871596.07(31)",
                "389257019.71(65)",
                "389267277.10(37)",
                "389260569.95(89)"
              ],
              "derivedFrequencyDecimalTHz": "590.9041796341969633333333333333333333333",
              "conservativeStdUpperBoundMHz": 1.0520001,
              "uncertaintyBoundary": "Cross-transition covariances not supplied. Sum|weight|u bounds the propagated standard deviation given reported marginal uncertainties, including0.1Hz clock. It is not an actual reconstructed1sigma or a hard confidence interval; unreported systematics/second-order HFS are not bounded.",
              "centroidDefinition": "first-order171YbF-degeneracy endpoint centroids; no intensity weighting or new fit",
              "legacySourceCauseEstablished": false,
              "sourceDecimal": "2.443783327690441413567416000650525028191",
              "supersededIndependentSource": {
                "sourceId": "ref-01",
                "value": 2.44378393,
                "uncertainty": 1.7e-7,
                "locator": "arXiv:2509.04416v2, Table 11, PDF/printed p.25, transition_energy"
              },
              "sourceConflict": "Previous Kroeze/Yamaguchi590.90433(4)THz disagrees with this explicit Ritz centroid by150.365803MHz; cause not established. Old value and derivation alternatives preserved."
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "2.44378393(17)",
            "derivedFrom": [
              "Qiao2023RINP.Table2.five-hyperfine-components",
              "T3.frequency_THz",
              "exact SI c,h,e where applicable"
            ]
          },
          "Gamma_per_s_num": {
            "value": 0.112,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "mishra-2001-jqsrt",
            "sourceLocator": "Mishra2001 Table5 PDFp9 printed8.9s; inverse lifetime rounded0.112/s; original printed component sum0.11188/s separately retained",
            "evidenceKind": "derived",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "theoretical model uncertainty not supplied; rate-statistical-average convention confirmed; not F-resolved",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-30",
              "sourceEvidenceType": "theory-hyperfine-statistical-rate-average",
              "originalPDF": "references/papers/2.pdf",
              "originalPDFSha256": "1fba52d567ba7dbdc805752a50796b998fd8fba30c9acf72b2bd0c7bd0ae2d7b",
              "primaryOriginalsAllRead": true,
              "stateBoundary": "F=3/2 and F=5/2 do not share this lifetime: inverse of(2F+1)-weighted HFI rate plusM1+M2; not the average of lifetimes",
              "FWeights": [
                4,
                6
              ],
              "HFIWholeLineRatePerS": 0.044,
              "HFI_F32_to_F12_RatePerS": 0.1097,
              "M1RatePerS": 0.0677,
              "M2RatePerS": 0.00018,
              "tableRateSumPerS": 0.11188,
              "temperatureK": null,
              "BBRTemperatureK": null,
              "BBRModel": "not added as an experimental thermal environment; no temperature inferred"
            },
            "convention": "statistically-averaged-total-decay-rate; not-F-resolved",
            "legacyText": "~0.112",
            "derivedFrom": [
              "T4.lifetime_ns",
              "Gamma_average=1/tau_average_rate_inverse"
            ]
          },
          "lifetime_ns": {
            "value": 8900000000,
            "unit": "ns",
            "quantity": "lifetime_ns",
            "sourceId": "mishra-2001-jqsrt",
            "sourceLocator": "Mishra2001 Eq15 PDFp7; Tables3/4/5 PDFpp8-9, printed776-777",
            "evidenceKind": "literature-reported",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "theoretical model uncertainty not supplied; rate-statistical-average convention confirmed; not F-resolved",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-30",
              "sourceEvidenceType": "theory-hyperfine-statistical-rate-average",
              "originalPDF": "references/papers/2.pdf",
              "originalPDFSha256": "1fba52d567ba7dbdc805752a50796b998fd8fba30c9acf72b2bd0c7bd0ae2d7b",
              "primaryOriginalsAllRead": true,
              "stateBoundary": "F=3/2 and F=5/2 do not share this lifetime: inverse of(2F+1)-weighted HFI rate plusM1+M2; not the average of lifetimes",
              "FWeights": [
                4,
                6
              ],
              "HFIWholeLineRatePerS": 0.044,
              "HFI_F32_to_F12_RatePerS": 0.1097,
              "M1RatePerS": 0.0677,
              "M2RatePerS": 0.00018,
              "tableRateSumPerS": 0.11188,
              "temperatureK": null,
              "BBRTemperatureK": null,
              "BBRModel": "not added as an experimental thermal environment; no temperature inferred"
            },
            "convention": "inverse-of-statistically-averaged-total-decay-rate; not-F-resolved",
            "legacyText": "~8.9"
          },
          "oscillator_strength_f_num": {
            "value": null,
            "unit": "dimensionless",
            "quantity": "oscillator_strength_f_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2 Table 11, p25; oscillator strength not listed",
            "evidenceKind": "literature-reported",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "no supported oscillator strength supplied; legacy1e-9 was not traceable",
            "conditions": {
              "auditDate": "2026-10-29",
              "excludedLegacyValue": 1e-9
            },
            "convention": null,
            "missingReason": "not-provided-in-cited-source"
          },
          "d_num": {
            "value": null,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2 Table11 p25 has no universal E1 matrix element; F-specific HFI treatment required",
            "evidenceKind": "literature-reported",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data"
            },
            "convention": "no-E1-data",
            "missingReason": "no-applicable-E1-matrix-element"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 0.0179,
            "unit": "Hz",
            "quantity": "ordinary_frequency_FWHM",
            "sourceId": "mishra-2001-jqsrt",
            "sourceLocator": "Mishra2001 Table5 PDFp9 printed8.9s; equivalentwidth=1/(2*pi*tau), rounded17.9mHz; not a printed Mishra linewidth",
            "evidenceKind": "derived",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "theoretical model uncertainty not supplied; rate-statistical-average convention confirmed; not F-resolved",
            "conditions": {
              "isotope": 171,
              "auditDate": "2026-10-30",
              "sourceEvidenceType": "theory-hyperfine-statistical-rate-average",
              "originalPDF": "references/papers/2.pdf",
              "originalPDFSha256": "1fba52d567ba7dbdc805752a50796b998fd8fba30c9acf72b2bd0c7bd0ae2d7b",
              "primaryOriginalsAllRead": true,
              "stateBoundary": "F=3/2 and F=5/2 do not share this lifetime: inverse of(2F+1)-weighted HFI rate plusM1+M2; not the average of lifetimes",
              "FWeights": [
                4,
                6
              ],
              "HFIWholeLineRatePerS": 0.044,
              "HFI_F32_to_F12_RatePerS": 0.1097,
              "M1RatePerS": 0.0677,
              "M2RatePerS": 0.00018,
              "tableRateSumPerS": 0.11188,
              "temperatureK": null,
              "BBRTemperatureK": null,
              "BBRModel": "not added as an experimental thermal environment; no temperature inferred",
              "sourceConflict": "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT retained from old Kroeze table; displayedcoefficient usesGamma/(2*pi), and is an equivalent statistically-averaged rate width, not F-resolved line width"
            },
            "convention": "equivalent-frequency-width-of-statistically-averaged-rate=Gamma/(2*pi); not-F-resolved",
            "legacyText": "2π × ~17.9 mHz",
            "derivedFrom": [
              "T4.lifetime_ns",
              "equivalent width=1/(2*pi*tau_average_rate_inverse)"
            ]
          }
        },
        "views": {
          "core": {
            "presentation": {
              "id": "T4",
              "upper": "³P₂",
              "lower": "¹S₀",
              "label": "绿钟跃迁 (四极)",
              "linewidth_FWHM": "约17.9 mHz（统计平均率对应；非F分辨）",
              "Gamma_per_s": "~0.112",
              "oscillator_strength_f": "未提供",
              "d_reduced_ea0": "—",
              "Isat": "—",
              "branching": "F相关：HFS诱导E1与非E1衰变；分支比未提供",
              "multipole": "M2 激发 / HFS 诱导 E1 衰变",
              "classification": "禁戒",
              "forbidden_reason": "电子J=0→2的裸E1禁戒；HFS诱导E1只允许适用F通道。8.9s是统计平均HFI率加M1/M2后总率的倒数，不能用于所有F；无通用E1 d。",
              "selection_check": "ΔS=1 ✗, ΔJ=2 ✗(E1), 奇偶变 ✓ → M2 允许",
              "use": "量子模拟、辅助钟跃迁、新物理搜寻",
              "source": "频率/真空λ：Qiao2023 Table2五分量Ritz派生；τ：Mishra2001 Table5统计平均理论",
              "color": "#f87171"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "wavelength_air_nm": "wavelength_air_nm",
              "frequency_THz": "frequency_THz",
              "energy_eV": "energy_eV",
              "Gamma_per_s_num": "Gamma_per_s_num",
              "lifetime_ns": "lifetime_ns",
              "oscillator_strength_f_num": "oscillator_strength_f_num",
              "d_num": "d_num"
            },
            "aliases": {},
            "legacyNullValues": {
              "d_num": 0
            }
          }
        }
      },
      {
        "id": "T5",
        "lowerLevelId": "yb171-6s6p-3p0",
        "upperLevelId": "yb171-6s5d-3d1",
        "category": "core",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 1388.7629464,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 12, PDF/printed p.25, wavelength_vac",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 6e-7,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-12:wavelength_vac",
              "sourceDecimal": "1388.7629464",
              "sourceUncertaintyDecimal": "6E-7",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                85,
                86,
                194
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                37
              ],
              "sourceDependencyRecordIds": [
                "table-12:frequency_nu",
                "table-01:c"
              ],
              "followupPrimarySourcesRead": [
                "zhao-2024-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "1388.7629464(6)"
          },
          "wavelength_air_nm": {
            "value": 1388.396915,
            "unit": "nm",
            "quantity": "wavelength_air_nm",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 12, PDF/printed p.25, wavelength_air",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.000014,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-12:wavelength_air",
              "sourceDecimal": "1388.396915",
              "sourceUncertaintyDecimal": "0.000014",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                85,
                86,
                194
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [
                99,
                100,
                101,
                102
              ],
              "sourceEquations": [
                39,
                40
              ],
              "sourceDependencyRecordIds": [
                "table-12:wavelength_vac"
              ],
              "airDefinition": "101325 Pa,25 degC,50%RH; source refractive-index uncertainty1e-8; ambient variation excluded",
              "followupPrimarySourcesRead": [
                "zhao-2024-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "1388.396915(14)"
          },
          "frequency_THz": {
            "value": 215.87014457,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 12, PDF/printed p.25, frequency_nu",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 9e-8,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-adopted",
              "sourceRecord": "table-12:frequency_nu",
              "sourceDecimal": "215.87014457",
              "sourceUncertaintyDecimal": "9E-8",
              "sourceReferenceNumbers": [
                85,
                86,
                194
              ],
              "dependencyReferenceNumbers": [],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "birgeRatio": null,
              "followupPrimarySourcesRead": [
                "zhao-2024-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "215.87014457(9)"
          },
          "energy_eV": {
            "value": 0.8927671836,
            "unit": "eV",
            "quantity": "energy_eV",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 12, PDF/printed p.25, transition_energy",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 4e-10,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-12:transition_energy",
              "sourceDecimal": "0.8927671836",
              "sourceUncertaintyDecimal": "4E-10",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                85,
                86,
                194
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                35,
                36
              ],
              "sourceDependencyRecordIds": [
                "table-12:frequency_nu",
                "table-01:h",
                "table-01:e"
              ],
              "followupPrimarySourcesRead": [
                "zhao-2024-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "0.8927671836(4)"
          },
          "Gamma_per_s_num": {
            "value": 3010000,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 12, PDF/printed p.25, total_decay_rate",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 100000,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-12:total_decay_rate",
              "sourceDecimal": "3010000.00",
              "sourceUncertaintyDecimal": "100000",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                137,
                195
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                46
              ],
              "sourceDependencyRecordIds": [
                "table-12:upper_state_lifetime"
              ],
              "followupPrimarySourcesRead": [
                "zhao-2024-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "total spontaneous decay rate Gamma=1/tau; not branch-specific Einstein A",
            "legacyText": "3.01(10)e6"
          },
          "lifetime_ns": {
            "value": 332,
            "unit": "ns",
            "quantity": "lifetime_ns",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 12, PDF/printed p.25, upper_state_lifetime",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 11,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-weighted-recommendation",
              "sourceRecord": "table-12:upper_state_lifetime",
              "sourceDecimal": "332",
              "sourceUncertaintyDecimal": "11",
              "sourceReferenceNumbers": [
                137,
                195
              ],
              "dependencyReferenceNumbers": [],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "birgeRatio": 1.6,
              "temperature_K": null,
              "BBRTemperature_K": null,
              "followupPrimarySourcesRead": [
                "zhao-2024-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "total upper-state radiative lifetime; not inverse partial decay rate or trap survival",
            "legacyText": "332(11)"
          },
          "oscillator_strength_f_num": {
            "value": null,
            "unit": "dimensionless",
            "quantity": "oscillator_strength_f_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2 Table12 p25; oscillator strength not listed",
            "evidenceKind": "literature-reported",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "followupPrimarySourcesRead": [
                "zhao-2024-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": null,
            "missingReason": "not-provided-in-cited-source"
          },
          "d_num": {
            "value": 2.76,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 12, PDF/printed p.25, dipole_reduced_J_Racah",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.07,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived-from-lifetime-frequency-theory-branching",
              "sourceRecord": "table-12:dipole_reduced_J_Racah",
              "sourceDecimal": "2.76",
              "sourceUncertaintyDecimal": "0.07",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                85,
                86,
                132,
                137,
                194,
                195
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [
                141,
                142,
                143,
                144
              ],
              "sourceEquations": [
                52,
                54
              ],
              "sourceDependencyRecordIds": [
                "table-12:frequency_nu",
                "table-12:upper_state_lifetime",
                "table-01:epsilon0",
                "table-01:hbar",
                "table-01:c",
                "table-01:e",
                "table-01:a0",
                "table-12:branching_ratio:3D1->3P0"
              ],
              "definition": "<Jg||er||Je>_R Racah-Wigner, Eq54; includes adopted theoretical branching ratios",
              "followupPrimarySourcesRead": [
                "zhao-2024-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "J-reduced",
            "legacyText": "2.76(7)"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 479000,
            "unit": "Hz",
            "quantity": "ordinary_frequency_FWHM",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 12, PDF/printed p.25, linewidth_FWHM_nu",
            "evidenceKind": "literature-reported",
            "reviewStatus": "conflict-unresolved",
            "uncertainty": 16000,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-12:linewidth_FWHM_nu",
              "sourceDecimal": "479",
              "sourceUncertaintyDecimal": "16",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                137,
                195
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                46,
                47
              ],
              "reviewFlags": [
                "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT"
              ],
              "sourceDependencyRecordIds": [
                "table-12:upper_state_lifetime"
              ],
              "sourceConflict": "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT: Eq47 defines Delta_nu=Gamma/(2pi), tables print an extra2pi",
              "followupPrimarySourcesRead": [
                "zhao-2024-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "ordinary-frequency-FWHM=Gamma/(2*pi); source-table-extra-2pi-conflict",
            "legacyText": "2π × 479(16) kHz"
          }
        },
        "views": {
          "core": {
            "presentation": {
              "id": "T5",
              "upper": "³D₁",
              "lower": "³P₀",
              "label": "红外 repumper (黄钟)",
              "linewidth_FWHM": "479(16) kHz",
              "Gamma_per_s": "3.01×10⁶",
              "oscillator_strength_f": "—",
              "Isat": "—",
              "branching": "³P₀ 63.8%, ³P₁ 35.2%, ³P₂ 0.99%（理论分支比；非完整实测）",
              "multipole": "E1",
              "classification": "强",
              "forbidden_reason": "—",
              "selection_check": "ΔS=0 ✓, ΔL=+1 ✓, ΔJ=+1 ✓, 奇偶变 ✓",
              "use": "³P₀ 态 repump / 态制备",
              "source": "Kroeze et al.2026, arXiv2509.04416v2 Table12 p25",
              "color": "#34d399"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "wavelength_air_nm": "wavelength_air_nm",
              "frequency_THz": "frequency_THz",
              "energy_eV": "energy_eV",
              "Gamma_per_s_num": "Gamma_per_s_num",
              "lifetime_ns": "lifetime_ns",
              "oscillator_strength_f_num": "oscillator_strength_f_num",
              "d_num": "d_num"
            },
            "aliases": {
              "d_reduced_ea0": "d_num"
            },
            "legacyNullValues": {
              "oscillator_strength_f_num": 0
            }
          }
        }
      },
      {
        "id": "T6",
        "lowerLevelId": "yb171-6s6p-3p0",
        "upperLevelId": "yb171-6s7s-3s1",
        "category": "core",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 649.08662928,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 13, PDF/printed p.26, wavelength_vac",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 3.1e-7,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-13:wavelength_vac",
              "sourceDecimal": "649.08662928",
              "sourceUncertaintyDecimal": "3.1E-7",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                190,
                198
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                37
              ],
              "sourceDependencyRecordIds": [
                "table-13:frequency_nu",
                "table-01:c"
              ],
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "zhou-2020-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "649.08662928(31)"
          },
          "wavelength_air_nm": {
            "value": 648.913718,
            "unit": "nm",
            "quantity": "wavelength_air_nm",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 13, PDF/printed p.26, wavelength_air",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.000006,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-13:wavelength_air",
              "sourceDecimal": "648.913718",
              "sourceUncertaintyDecimal": "0.000006",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                190,
                198
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [
                99,
                100,
                101,
                102
              ],
              "sourceEquations": [
                39,
                40
              ],
              "sourceDependencyRecordIds": [
                "table-13:wavelength_vac"
              ],
              "airDefinition": "101325 Pa,25 degC,50%RH; source refractive-index uncertainty1e-8; ambient variation excluded",
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "zhou-2020-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "648.913718(6)"
          },
          "frequency_THz": {
            "value": 461.86817672,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 13, PDF/printed p.26, frequency_nu",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 2.2e-7,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-adopted",
              "sourceRecord": "table-13:frequency_nu",
              "sourceDecimal": "461.86817672",
              "sourceUncertaintyDecimal": "2.2E-7",
              "sourceReferenceNumbers": [
                190,
                198
              ],
              "dependencyReferenceNumbers": [],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "birgeRatio": null,
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "zhou-2020-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "461.86817672(22)"
          },
          "energy_eV": {
            "value": 1.9101332987,
            "unit": "eV",
            "quantity": "energy_eV",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 13, PDF/printed p.26, transition_energy",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 9e-10,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-13:transition_energy",
              "sourceDecimal": "1.9101332987",
              "sourceUncertaintyDecimal": "9E-10",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                190,
                198
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                35,
                36
              ],
              "sourceDependencyRecordIds": [
                "table-13:frequency_nu",
                "table-01:h",
                "table-01:e"
              ],
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "zhou-2020-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "1.9101332987(9)"
          },
          "Gamma_per_s_num": {
            "value": 72000000,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 13, PDF/printed p.26, total_decay_rate",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 9000000,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-13:total_decay_rate",
              "sourceDecimal": "72000000.0",
              "sourceUncertaintyDecimal": "9000000",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                135,
                196
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                46
              ],
              "sourceDependencyRecordIds": [
                "table-13:upper_state_lifetime"
              ],
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "zhou-2020-pra"
              ],
              "followupAuditDate": "2026-10-30",
              "lifetimeCompilationInputsVerified": "BaumannTable1:12.5(1.5)ns historical reproduced Lange1970 +174Yb15.9(1.9)ns; weighted mean13.80546ns,Birgeinflatedu1.65363ns reproduces13.8(1.7), not a171-only direct measurement",
              "sourceDefinitionConflict": "Some resonance papers callbeta*Gamma_total/(2*pi) a natural linewidth; do not substitute branch partial width for total upper-stateGamma/(2*pi)"
            },
            "convention": "total spontaneous decay rate Gamma=1/tau; not branch-specific Einstein A",
            "legacyText": "7.2(9)e7"
          },
          "lifetime_ns": {
            "value": 13.8,
            "unit": "ns",
            "quantity": "lifetime_ns",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 13, PDF/printed p.26, upper_state_lifetime",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 1.7,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-weighted-recommendation",
              "sourceRecord": "table-13:upper_state_lifetime",
              "sourceDecimal": "13.8",
              "sourceUncertaintyDecimal": "1.7",
              "sourceReferenceNumbers": [
                135,
                196
              ],
              "dependencyReferenceNumbers": [],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "birgeRatio": 1.4,
              "temperature_K": null,
              "BBRTemperature_K": null,
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "zhou-2020-pra"
              ],
              "followupAuditDate": "2026-10-30",
              "lifetimeCompilationInputsVerified": "BaumannTable1:12.5(1.5)ns historical reproduced Lange1970 +174Yb15.9(1.9)ns; weighted mean13.80546ns,Birgeinflatedu1.65363ns reproduces13.8(1.7), not a171-only direct measurement",
              "sourceDefinitionConflict": "Some resonance papers callbeta*Gamma_total/(2*pi) a natural linewidth; do not substitute branch partial width for total upper-stateGamma/(2*pi)"
            },
            "convention": "total upper-state radiative lifetime; not inverse partial decay rate or trap survival",
            "legacyText": "13.8(17)"
          },
          "oscillator_strength_f_num": {
            "value": null,
            "unit": "dimensionless",
            "quantity": "oscillator_strength_f_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2 Table13 p26; oscillator strength not listed",
            "evidenceKind": "literature-reported",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "zhou-2020-pra"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": null,
            "missingReason": "not-provided-in-cited-source"
          },
          "d_num": {
            "value": 1.96,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 13, PDF/printed p.26, dipole_reduced_J_Racah",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.15,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived-from-lifetime-frequency-theory-branching",
              "sourceRecord": "table-13:dipole_reduced_J_Racah",
              "sourceDecimal": "1.96",
              "sourceUncertaintyDecimal": "0.15",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                132,
                135,
                190,
                196,
                198
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [
                141,
                142,
                143,
                144
              ],
              "sourceEquations": [
                52,
                54
              ],
              "sourceDependencyRecordIds": [
                "table-13:frequency_nu",
                "table-13:upper_state_lifetime",
                "table-01:epsilon0",
                "table-01:hbar",
                "table-01:c",
                "table-01:e",
                "table-01:a0",
                "table-13:branching_ratio:3S1->3P0"
              ],
              "definition": "<Jg||er||Je>_R Racah-Wigner, Eq54; includes adopted theoretical branching ratios",
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "zhou-2020-pra"
              ],
              "followupAuditDate": "2026-10-30",
              "lifetimeCompilationInputsVerified": "BaumannTable1:12.5(1.5)ns historical reproduced Lange1970 +174Yb15.9(1.9)ns; weighted mean13.80546ns,Birgeinflatedu1.65363ns reproduces13.8(1.7), not a171-only direct measurement",
              "sourceDefinitionConflict": "Some resonance papers callbeta*Gamma_total/(2*pi) a natural linewidth; do not substitute branch partial width for total upper-stateGamma/(2*pi)"
            },
            "convention": "J-reduced",
            "legacyText": "1.96(15)"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 11500000,
            "unit": "Hz",
            "quantity": "ordinary_frequency_FWHM",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 13, PDF/printed p.26, linewidth_FWHM_nu",
            "evidenceKind": "literature-reported",
            "reviewStatus": "conflict-unresolved",
            "uncertainty": 1400000,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-13:linewidth_FWHM_nu",
              "sourceDecimal": "11.5",
              "sourceUncertaintyDecimal": "1.4",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                135,
                196
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                46,
                47
              ],
              "reviewFlags": [
                "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT"
              ],
              "sourceDependencyRecordIds": [
                "table-13:upper_state_lifetime"
              ],
              "sourceConflict": "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT: Eq47 defines Delta_nu=Gamma/(2pi), tables print an extra2pi",
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "zhou-2020-pra"
              ],
              "followupAuditDate": "2026-10-30",
              "lifetimeCompilationInputsVerified": "BaumannTable1:12.5(1.5)ns historical reproduced Lange1970 +174Yb15.9(1.9)ns; weighted mean13.80546ns,Birgeinflatedu1.65363ns reproduces13.8(1.7), not a171-only direct measurement",
              "sourceDefinitionConflict": "Some resonance papers callbeta*Gamma_total/(2*pi) a natural linewidth; do not substitute branch partial width for total upper-stateGamma/(2*pi)"
            },
            "convention": "ordinary-frequency-FWHM=Gamma/(2*pi); source-table-extra-2pi-conflict",
            "legacyText": "2π × 11.5(14) MHz"
          }
        },
        "views": {
          "core": {
            "presentation": {
              "id": "T6",
              "upper": "³S₁",
              "lower": "³P₀",
              "label": "红 repumper (黄钟)",
              "linewidth_FWHM": "11.5(14) MHz",
              "Gamma_per_s": "7.2×10⁷",
              "oscillator_strength_f": "—",
              "Isat": "—",
              "branching": "³P₂ 50.8%, ³P₁ 36.0%, ³P₀ 13.0%（理论分支比；非完整实测）",
              "multipole": "E1",
              "classification": "强",
              "forbidden_reason": "—",
              "selection_check": "ΔS=0 ✓, ΔL=−1 ✓, ΔJ=+1 ✓, 奇偶变 ✓",
              "use": "³P₀ 态 repump / 检测",
              "source": "Kroeze et al.2026, arXiv2509.04416v2 Table13 p26",
              "color": "#34d399"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "wavelength_air_nm": "wavelength_air_nm",
              "frequency_THz": "frequency_THz",
              "energy_eV": "energy_eV",
              "Gamma_per_s_num": "Gamma_per_s_num",
              "lifetime_ns": "lifetime_ns",
              "oscillator_strength_f_num": "oscillator_strength_f_num",
              "d_num": "d_num"
            },
            "aliases": {
              "d_reduced_ea0": "d_num"
            },
            "legacyNullValues": {
              "oscillator_strength_f_num": 0
            }
          }
        }
      },
      {
        "id": "T7",
        "lowerLevelId": "yb171-6s6p-3p2",
        "upperLevelId": "yb171-6s7s-3s1",
        "category": "core",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 770.16026840069,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table14 p26 frequency; lambda=c/nu; printed lambda fails same-row consistency",
            "evidenceKind": "derived",
            "reviewStatus": "conflict-unresolved",
            "uncertainty": 0.0000011871149320701517,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-14:wavelength_vac",
              "sourceDecimal": "770.160284",
              "sourceUncertaintyDecimal": "0.000011",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                190
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                37
              ],
              "reviewFlags": [
                "SOURCE_LAMBDA_CENTRAL_INCONSISTENT_WITH_FREQUENCY",
                "SOURCE_LAMBDA_UNCERTAINTY_INCONSISTENT_WITH_FREQUENCY"
              ],
              "sourceDependencyRecordIds": [
                "table-14:frequency_nu",
                "table-01:c"
              ],
              "sourceConflict": "Table14 prints770.160284(11)nm; frequency and wavenumber instead imply770.1602684006901nm",
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "qiao-2023-apl"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "770.160284(11)",
            "derivedFrom": [
              "T7.frequency_THz",
              "SI exact c=299792458 m/s"
            ]
          },
          "wavelength_air_nm": {
            "value": 769.955919,
            "unit": "nm",
            "quantity": "wavelength_air_nm",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 14, PDF/printed p.26, wavelength_air",
            "evidenceKind": "literature-reported",
            "reviewStatus": "conflict-unresolved",
            "uncertainty": 0.000008,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-14:wavelength_air",
              "sourceDecimal": "769.955919",
              "sourceUncertaintyDecimal": "0.000008",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                190
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [
                99,
                100,
                101,
                102
              ],
              "sourceEquations": [
                39,
                40
              ],
              "sourceDependencyRecordIds": [
                "table-14:wavelength_vac"
              ],
              "airDefinition": "101325 Pa,25 degC,50%RH; source refractive-index uncertainty1e-8; ambient variation excluded",
              "sourceConflict": "Table14 vacuum-wavelength/frequency mismatch; air value retained as reported, not independently recalculated",
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "qiao-2023-apl"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "769.955919(8)"
          },
          "frequency_THz": {
            "value": 389.2598337,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 14, PDF/printed p.26, frequency_nu",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 6e-7,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-adopted",
              "sourceRecord": "table-14:frequency_nu",
              "sourceDecimal": "389.2598337",
              "sourceUncertaintyDecimal": "6E-7",
              "sourceReferenceNumbers": [
                190
              ],
              "dependencyReferenceNumbers": [],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "birgeRatio": null,
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "qiao-2023-apl"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "389.2598337(6)"
          },
          "energy_eV": {
            "value": 1.6098493199,
            "unit": "eV",
            "quantity": "energy_eV",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 14, PDF/printed p.26, transition_energy",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 2.4e-9,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-14:transition_energy",
              "sourceDecimal": "1.6098493199",
              "sourceUncertaintyDecimal": "2.4E-9",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                190
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                35,
                36
              ],
              "sourceDependencyRecordIds": [
                "table-14:frequency_nu",
                "table-01:h",
                "table-01:e"
              ],
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "qiao-2023-apl"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": "hyperfine-center-of-gravity; ordinary frequency nu=omega/(2*pi)",
            "legacyText": "1.6098493199(24)"
          },
          "Gamma_per_s_num": {
            "value": 72000000,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 14, PDF/printed p.26, total_decay_rate",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 9000000,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-14:total_decay_rate",
              "sourceDecimal": "72000000.0",
              "sourceUncertaintyDecimal": "9000000",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                135,
                196
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                46
              ],
              "sourceDependencyRecordIds": [
                "table-14:upper_state_lifetime"
              ],
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "qiao-2023-apl"
              ],
              "followupAuditDate": "2026-10-30",
              "lifetimeCompilationInputsVerified": "BaumannTable1:12.5(1.5)ns historical reproduced Lange1970 +174Yb15.9(1.9)ns; weighted mean13.80546ns,Birgeinflatedu1.65363ns reproduces13.8(1.7), not a171-only direct measurement",
              "sourceDefinitionConflict": "Some resonance papers callbeta*Gamma_total/(2*pi) a natural linewidth; do not substitute branch partial width for total upper-stateGamma/(2*pi)"
            },
            "convention": "total spontaneous decay rate Gamma=1/tau; not branch-specific Einstein A",
            "legacyText": "7.2(9)e7"
          },
          "lifetime_ns": {
            "value": 13.8,
            "unit": "ns",
            "quantity": "lifetime_ns",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 14, PDF/printed p.26, upper_state_lifetime",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 1.7,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-weighted-recommendation",
              "sourceRecord": "table-14:upper_state_lifetime",
              "sourceDecimal": "13.8",
              "sourceUncertaintyDecimal": "1.7",
              "sourceReferenceNumbers": [
                135,
                196
              ],
              "dependencyReferenceNumbers": [],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "birgeRatio": 1.4,
              "temperature_K": null,
              "BBRTemperature_K": null,
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "qiao-2023-apl"
              ],
              "followupAuditDate": "2026-10-30",
              "lifetimeCompilationInputsVerified": "BaumannTable1:12.5(1.5)ns historical reproduced Lange1970 +174Yb15.9(1.9)ns; weighted mean13.80546ns,Birgeinflatedu1.65363ns reproduces13.8(1.7), not a171-only direct measurement",
              "sourceDefinitionConflict": "Some resonance papers callbeta*Gamma_total/(2*pi) a natural linewidth; do not substitute branch partial width for total upper-stateGamma/(2*pi)"
            },
            "convention": "total upper-state radiative lifetime; not inverse partial decay rate or trap survival",
            "legacyText": "13.8(17)"
          },
          "oscillator_strength_f_num": {
            "value": null,
            "unit": "dimensionless",
            "quantity": "oscillator_strength_f_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2 Table14 p26; oscillator strength not listed",
            "evidenceKind": "literature-reported",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "qiao-2023-apl"
              ],
              "followupAuditDate": "2026-10-30"
            },
            "convention": null,
            "missingReason": "not-provided-in-cited-source"
          },
          "d_num": {
            "value": 4.99,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 14, PDF/printed p.26, dipole_reduced_J_Racah",
            "evidenceKind": "literature-reported",
            "reviewStatus": "original-source-located",
            "uncertainty": 0.32,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived-from-lifetime-frequency-theory-branching",
              "sourceRecord": "table-14:dipole_reduced_J_Racah",
              "sourceDecimal": "4.99",
              "sourceUncertaintyDecimal": "0.32",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                15,
                132,
                135,
                190,
                196
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [
                141,
                142,
                143,
                144
              ],
              "sourceEquations": [
                52,
                54
              ],
              "sourceDependencyRecordIds": [
                "table-14:frequency_nu",
                "table-14:upper_state_lifetime",
                "table-01:epsilon0",
                "table-01:hbar",
                "table-01:c",
                "table-01:e",
                "table-01:a0",
                "table-14:branching_ratio:3S1->3P2"
              ],
              "definition": "<Jg||er||Je>_R Racah-Wigner, Eq54; includes adopted theoretical branching ratios",
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "qiao-2023-apl"
              ],
              "followupAuditDate": "2026-10-30",
              "lifetimeCompilationInputsVerified": "BaumannTable1:12.5(1.5)ns historical reproduced Lange1970 +174Yb15.9(1.9)ns; weighted mean13.80546ns,Birgeinflatedu1.65363ns reproduces13.8(1.7), not a171-only direct measurement",
              "sourceDefinitionConflict": "Some resonance papers callbeta*Gamma_total/(2*pi) a natural linewidth; do not substitute branch partial width for total upper-stateGamma/(2*pi)"
            },
            "convention": "J-reduced",
            "legacyText": "4.99(32)"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 11500000,
            "unit": "Hz",
            "quantity": "ordinary_frequency_FWHM",
            "sourceId": "ref-01",
            "sourceLocator": "arXiv:2509.04416v2, Table 14, PDF/printed p.26, linewidth_FWHM_nu",
            "evidenceKind": "literature-reported",
            "reviewStatus": "conflict-unresolved",
            "uncertainty": 1400000,
            "uncertaintyNote": "source-reported uncertainty; compilation/model systematics are not independently re-evaluated",
            "conditions": {
              "isotope": 171,
              "sourceEvidenceType": "compilation-derived",
              "sourceRecord": "table-14:linewidth_FWHM_nu",
              "sourceDecimal": "11.5",
              "sourceUncertaintyDecimal": "1.4",
              "sourceReferenceNumbers": [],
              "dependencyReferenceNumbers": [
                135,
                196
              ],
              "auditDate": "2026-10-29",
              "primaryOriginalsAllRead": false,
              "sourceDependencyBoundary": "Numeric dependency chain follows the printed equations; method citations are separate. No unreported input covariance, independence, or primary-input reanalysis is established by this extraction.",
              "methodReferenceNumbers": [],
              "sourceEquations": [
                46,
                47
              ],
              "reviewFlags": [
                "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT"
              ],
              "sourceDependencyRecordIds": [
                "table-14:upper_state_lifetime"
              ],
              "sourceConflict": "SOURCE_LINEWIDTH_2PI_NOTATION_CONFLICT: Eq47 defines Delta_nu=Gamma/(2pi), tables print an extra2pi",
              "followupPrimarySourcesRead": [
                "qiao-2023-rinp",
                "qiao-2023-apl"
              ],
              "followupAuditDate": "2026-10-30",
              "lifetimeCompilationInputsVerified": "BaumannTable1:12.5(1.5)ns historical reproduced Lange1970 +174Yb15.9(1.9)ns; weighted mean13.80546ns,Birgeinflatedu1.65363ns reproduces13.8(1.7), not a171-only direct measurement",
              "sourceDefinitionConflict": "Some resonance papers callbeta*Gamma_total/(2*pi) a natural linewidth; do not substitute branch partial width for total upper-stateGamma/(2*pi)"
            },
            "convention": "ordinary-frequency-FWHM=Gamma/(2*pi); source-table-extra-2pi-conflict",
            "legacyText": "2π × 11.5(14) MHz"
          }
        },
        "views": {
          "core": {
            "presentation": {
              "id": "T7",
              "upper": "³S₁",
              "lower": "³P₂",
              "label": "红 repumper (绿钟)",
              "linewidth_FWHM": "11.5(14) MHz",
              "Gamma_per_s": "7.2×10⁷",
              "oscillator_strength_f": "—",
              "Isat": "—",
              "branching": "至 ³P₂ 分支 50.8%（理论分支比；非完整实测）",
              "multipole": "E1",
              "classification": "强",
              "forbidden_reason": "—",
              "selection_check": "ΔS=0 ✓, ΔL=−1 ✓, ΔJ=-1 ✓, 奇偶变 ✓",
              "use": "³P₂ 态 repump / 检测",
              "source": "Kroeze et al.2026, arXiv2509.04416v2 Table14 p26",
              "color": "#34d399"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "wavelength_air_nm": "wavelength_air_nm",
              "frequency_THz": "frequency_THz",
              "energy_eV": "energy_eV",
              "Gamma_per_s_num": "Gamma_per_s_num",
              "lifetime_ns": "lifetime_ns",
              "oscillator_strength_f_num": "oscillator_strength_f_num",
              "d_num": "d_num"
            },
            "aliases": {
              "d_reduced_ea0": "d_num"
            },
            "legacyNullValues": {
              "oscillator_strength_f_num": 0
            }
          }
        }
      },
      {
        "id": "R2",
        "lowerLevelId": "yb171-6s6p-3p0",
        "upperLevelId": "yb171-6s65s-3s1-triplet-connected",
        "category": "rydberg",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 301.87,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "frequency_THz": {
            "value": 993.11,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "energy_cm": {
            "value": 33126.52,
            "unit": "cm^-1",
            "quantity": "energy_cm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "d_num": {
            "value": 0.0376,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "ref-17",
            "sourceLocator": null,
            "evidenceKind": "internal-calculation",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unverified-internal-record",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "J-reduced"
          },
          "Gamma_per_s_num": {
            "value": 26660,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "energy_eV": {
            "value": 4.107165029259203,
            "unit": "eV",
            "quantity": "energy_eV",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "derived",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1",
            "derivedFrom": [
              "R2.energy_cm"
            ]
          },
          "lifetime_ns": {
            "value": 37509.377344336084,
            "unit": "ns",
            "quantity": "lifetime_ns",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "derived",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1",
            "derivedFrom": [
              "R2.Gamma_per_s_num"
            ]
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 4240,
            "unit": "Hz",
            "quantity": "legacy_linewidth_frequency_coefficient",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "coefficient-of-legacy-2pi-expression; reconcile source before physical relabeling",
            "legacyText": "2π × 4.24 kHz",
            "modelId": "legacy-rydberg-scaling-v1"
          }
        },
        "views": {
          "core": {
            "presentation": {
              "id": "R2",
              "lower": "³P₀",
              "upper": "65³S₁",
              "label": "65S 里德堡激发",
              "d_reduced_ea0": "0.0376",
              "linewidth_FWHM": "2π × 4.24 kHz",
              "multipole": "E1",
              "classification": "强",
              "selection_check": "ΔS=0 ✓, ΔL=−1 ✓, ΔJ=+1 ✓, 奇偶变 ✓",
              "source": "历史标度示意，非逐态文献值；d为内部记录",
              "color": "#a78bfa",
              "approximate": true,
              "d_convention": "J-reduced, This work",
              "Gamma_per_s": "26660",
              "oscillator_strength_f": "待核查",
              "Isat": "待核查",
              "branching": "待核查",
              "forbidden_reason": "E1 允许；矩阵元：This work（J 级约化量）",
              "use": "65S 激发与 Rabi 示意计算"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "frequency_THz": "frequency_THz",
              "energy_cm": "energy_cm",
              "d_num": "d_num",
              "Gamma_per_s_num": "Gamma_per_s_num",
              "energy_eV": "energy_eV",
              "lifetime_ns": "lifetime_ns"
            },
            "aliases": {},
            "legacyNullValues": {}
          },
          "rydberg": {
            "presentation": {
              "id": "R2",
              "lower": "³P₀",
              "upper": "65³S₁",
              "label": "³P₀ → 65³S₁ · CZ 门",
              "d_reduced_ea0": "0.0376",
              "linewidth_FWHM": "2π × 4.24 kHz",
              "multipole": "E1",
              "classification": "强",
              "selection_check": "ΔS=0 ✓, ΔL=−1 ✓, ΔJ=+1 ✓, 奇偶变 ✓",
              "source": "历史标度示意，非逐态文献值；d为内部记录",
              "color": "#b08f76"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "frequency_THz": "frequency_THz",
              "energy_cm": "energy_cm",
              "d_num": "d_num",
              "Gamma_per_s_num": "Gamma_per_s_num"
            },
            "aliases": {},
            "legacyNullValues": {}
          }
        }
      },
      {
        "id": "R1",
        "lowerLevelId": "yb171-6s6p-3p0",
        "upperLevelId": "yb171-6s50s-3s1",
        "category": "rydberg",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 302.06,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "frequency_THz": {
            "value": 992.49,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "energy_cm": {
            "value": 33105.94,
            "unit": "cm^-1",
            "quantity": "energy_cm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "d_num": {
            "value": 0.0568,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "J-reduced",
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "Gamma_per_s_num": {
            "value": 60760,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 9670,
            "unit": "Hz",
            "quantity": "legacy_linewidth_frequency_coefficient",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "coefficient-of-legacy-2pi-expression; reconcile source before physical relabeling",
            "legacyText": "2π × 9.67 kHz",
            "modelId": "legacy-rydberg-scaling-v1"
          }
        },
        "views": {
          "rydberg": {
            "presentation": {
              "id": "R1",
              "lower": "³P₀",
              "upper": "50³S₁",
              "label": "³P₀ → 50³S₁ · CZ 门 (低 n)",
              "d_reduced_ea0": "0.0568",
              "linewidth_FWHM": "2π × 9.67 kHz",
              "multipole": "E1",
              "classification": "强",
              "selection_check": "ΔS=0 ✓, ΔL=−1 ✓, ΔJ=+1 ✓, 奇偶变 ✓",
              "source": "历史标度示意；指定态/条件未验证，不能归为Peper或Ma的逐态测量",
              "color": "#c7a98c"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "frequency_THz": "frequency_THz",
              "energy_cm": "energy_cm",
              "d_num": "d_num",
              "Gamma_per_s_num": "Gamma_per_s_num"
            },
            "aliases": {},
            "legacyNullValues": {}
          }
        }
      },
      {
        "id": "R3",
        "lowerLevelId": "yb171-6s6p-3p0",
        "upperLevelId": "yb171-6s80s-3s1",
        "category": "rydberg",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 301.78,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "frequency_THz": {
            "value": 993.4,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "energy_cm": {
            "value": 33136.35,
            "unit": "cm^-1",
            "quantity": "energy_cm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "d_num": {
            "value": 0.0272,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "J-reduced",
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "Gamma_per_s_num": {
            "value": 13980,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 2230,
            "unit": "Hz",
            "quantity": "legacy_linewidth_frequency_coefficient",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "coefficient-of-legacy-2pi-expression; reconcile source before physical relabeling",
            "legacyText": "2π × 2.23 kHz",
            "modelId": "legacy-rydberg-scaling-v1"
          }
        },
        "views": {
          "rydberg": {
            "presentation": {
              "id": "R3",
              "lower": "³P₀",
              "upper": "80³S₁",
              "label": "³P₀ → 80³S₁ · CZ 门 (高 n)",
              "d_reduced_ea0": "0.0272",
              "linewidth_FWHM": "2π × 2.23 kHz",
              "multipole": "E1",
              "classification": "强",
              "selection_check": "ΔS=0 ✓, ΔL=−1 ✓, ΔJ=+1 ✓, 奇偶变 ✓",
              "source": "历史标度示意；指定态/条件未验证，不能归为Peper或Ma的逐态测量",
              "color": "#d9c3a8"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "frequency_THz": "frequency_THz",
              "energy_cm": "energy_cm",
              "d_num": "d_num",
              "Gamma_per_s_num": "Gamma_per_s_num"
            },
            "aliases": {},
            "legacyNullValues": {}
          }
        }
      },
      {
        "id": "R4",
        "lowerLevelId": "yb171-6s6p-3p0",
        "upperLevelId": "yb171-6s65d-3d1",
        "category": "rydberg",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 301.86,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "frequency_THz": {
            "value": 993.14,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "energy_cm": {
            "value": 33127.49,
            "unit": "cm^-1",
            "quantity": "energy_cm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "d_num": {
            "value": 0.0535,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "J-reduced",
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "Gamma_per_s_num": {
            "value": 36130,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 5750,
            "unit": "Hz",
            "quantity": "legacy_linewidth_frequency_coefficient",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "coefficient-of-legacy-2pi-expression; reconcile source before physical relabeling",
            "legacyText": "2π × 5.75 kHz",
            "modelId": "legacy-rydberg-scaling-v1"
          }
        },
        "views": {
          "rydberg": {
            "presentation": {
              "id": "R4",
              "lower": "³P₀",
              "upper": "65³D₁",
              "label": "³P₀ → 65³D₁",
              "d_reduced_ea0": "0.0535",
              "linewidth_FWHM": "2π × 5.75 kHz",
              "multipole": "E1",
              "classification": "强",
              "selection_check": "ΔS=0 ✓, ΔL=+1 ✓, ΔJ=+1 ✓, 奇偶变 ✓",
              "source": "历史标度示意；指定态/条件未验证，不能归为Peper或Ma的逐态测量",
              "color": "#9e92b0"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "frequency_THz": "frequency_THz",
              "energy_cm": "energy_cm",
              "d_num": "d_num",
              "Gamma_per_s_num": "Gamma_per_s_num"
            },
            "aliases": {},
            "legacyNullValues": {}
          }
        }
      },
      {
        "id": "R5",
        "lowerLevelId": "yb171-6s6p-3p0",
        "upperLevelId": "yb171-6s65d-3d2",
        "category": "rydberg",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 301.86,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "frequency_THz": {
            "value": 993.14,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "energy_cm": {
            "value": 33127.48,
            "unit": "cm^-1",
            "quantity": "energy_cm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "d_num": {
            "value": 0,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "J-reduced",
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "Gamma_per_s_num": {
            "value": 36140,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 5750,
            "unit": "Hz",
            "quantity": "legacy_linewidth_frequency_coefficient",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "coefficient-of-legacy-2pi-expression; reconcile source before physical relabeling",
            "legacyText": "2π × 5.75 kHz",
            "modelId": "legacy-rydberg-scaling-v1"
          }
        },
        "views": {
          "rydberg": {
            "presentation": {
              "id": "R5",
              "lower": "³P₀",
              "upper": "65³D₂",
              "label": "³P₀ → 65³D₂ · ΔJ=2 (禁戒)",
              "d_reduced_ea0": "0 (E1 禁戒)",
              "linewidth_FWHM": "2π × 5.75 kHz",
              "multipole": "E1",
              "classification": "禁戒",
              "forbidden_reason": "理想纯J电子E1模型：J=0→2，约化矩阵元为零；不据此推断所有混合本征态/F通道均为零。",
              "selection_check": "ΔS=0 ✓, ΔJ=2 ✗(E1), 奇偶变 ✓",
              "source": "历史标度示意；指定态/条件未验证，不能归为Peper或Ma的逐态测量",
              "color": "#b8adc7"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "frequency_THz": "frequency_THz",
              "energy_cm": "energy_cm",
              "d_num": "d_num",
              "Gamma_per_s_num": "Gamma_per_s_num"
            },
            "aliases": {},
            "legacyNullValues": {}
          }
        }
      },
      {
        "id": "R6",
        "lowerLevelId": "yb171-6s6p-3p1",
        "upperLevelId": "yb171-6s65s-3s1-triplet-connected",
        "category": "rydberg",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 308.42,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "frequency_THz": {
            "value": 972.02,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "energy_cm": {
            "value": 32422.95,
            "unit": "cm^-1",
            "quantity": "energy_cm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "d_num": {
            "value": 0.0667,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "J-reduced",
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "Gamma_per_s_num": {
            "value": 26660,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 4240,
            "unit": "Hz",
            "quantity": "legacy_linewidth_frequency_coefficient",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "coefficient-of-legacy-2pi-expression; reconcile source before physical relabeling",
            "legacyText": "2π × 4.24 kHz",
            "modelId": "legacy-rydberg-scaling-v1"
          }
        },
        "views": {
          "rydberg": {
            "presentation": {
              "id": "R6",
              "lower": "³P₁",
              "upper": "65³S₁",
              "label": "³P₁ → 65³S₁ · 双光子中间态",
              "d_reduced_ea0": "0.0667",
              "linewidth_FWHM": "2π × 4.24 kHz",
              "multipole": "E1",
              "classification": "强",
              "selection_check": "ΔS=0 ✓, ΔL=−1 ✓, ΔJ=0 ✓, 奇偶变 ✓",
              "source": "历史标度示意；指定态/条件未验证，不能归为Peper或Ma的逐态测量",
              "color": "#a8c9b8"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "frequency_THz": "frequency_THz",
              "energy_cm": "energy_cm",
              "d_num": "d_num",
              "Gamma_per_s_num": "Gamma_per_s_num"
            },
            "aliases": {},
            "legacyNullValues": {}
          }
        }
      },
      {
        "id": "R7",
        "lowerLevelId": "yb171-6s6p-3p2",
        "upperLevelId": "yb171-6s65s-3s1-triplet-connected",
        "category": "rydberg",
        "quantities": {
          "wavelength_vac_nm": {
            "value": 325.68,
            "unit": "nm",
            "quantity": "wavelength_vac_nm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "frequency_THz": {
            "value": 920.5,
            "unit": "THz",
            "quantity": "frequency_THz",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "energy_cm": {
            "value": 30704.57,
            "unit": "cm^-1",
            "quantity": "energy_cm",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "d_num": {
            "value": 0.0957,
            "unit": "e*a0",
            "quantity": "d_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "J-reduced",
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "Gamma_per_s_num": {
            "value": 26660,
            "unit": "s^-1",
            "quantity": "Gamma_per_s_num",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": null,
            "modelId": "legacy-rydberg-scaling-v1"
          },
          "linewidth_frequency_coefficient_Hz": {
            "value": 4240,
            "unit": "Hz",
            "quantity": "legacy_linewidth_frequency_coefficient",
            "sourceId": "legacy-scaling",
            "sourceLocator": null,
            "evidenceKind": "scaling-estimate",
            "reviewStatus": "definition-needs-review",
            "uncertainty": null,
            "uncertaintyNote": "not established after source audit; retain unknown, never zero",
            "conditions": {
              "auditDate": "2026-10-29",
              "auditDisposition": "unsupported-model-or-missing-data",
              "excludedFromValidatedPrediction": true,
              "stateBoundary": "F,mF,B,triplet/singlet branch and temperature not jointly established; no substitution from other isotope or high-field experiment"
            },
            "convention": "coefficient-of-legacy-2pi-expression; reconcile source before physical relabeling",
            "legacyText": "2π × 4.24 kHz",
            "modelId": "legacy-rydberg-scaling-v1"
          }
        },
        "views": {
          "rydberg": {
            "presentation": {
              "id": "R7",
              "lower": "³P₂",
              "upper": "65³S₁",
              "label": "³P₂ → 65³S₁ · 辅助路径",
              "d_reduced_ea0": "0.0957",
              "linewidth_FWHM": "2π × 4.24 kHz",
              "multipole": "E1",
              "classification": "强",
              "selection_check": "ΔS=0 ✓, ΔL=−1 ✓, ΔJ=-1 ✓, 奇偶变 ✓",
              "source": "历史标度示意；指定态/条件未验证，不能归为Peper或Ma的逐态测量",
              "color": "#8fb5c4"
            },
            "quantityFields": {
              "wavelength_vac_nm": "wavelength_vac_nm",
              "frequency_THz": "frequency_THz",
              "energy_cm": "energy_cm",
              "d_num": "d_num",
              "Gamma_per_s_num": "Gamma_per_s_num"
            },
            "aliases": {},
            "legacyNullValues": {}
          }
        }
      }
    ]
  },
  "hyperfine": {
    "schemaVersion": 1,
    "isotope": 171,
    "states": {
      "¹S₀": {
        "levelId": "yb171-6s2-1s0",
        "legacy": {
          "A": 0,
          "levels": [
            {
              "F": 0.5,
              "shift": 0
            }
          ]
        },
        "sourceId": "ref-01",
        "evidenceKind": "literature-reported",
        "reviewStatus": "original-source-located",
        "unit": "MHz",
        "uncertainty": null,
        "uncertaintyNote": "J=0 diagonal first-order magnetic-dipole hyperfine A set0 by definition; not absence of off-diagonal HFI",
        "sourceLocator": "arXiv2509.04416v2 Table5 p21, 1S0:A_over_h",
        "conditions": {
          "isotope": 171,
          "fieldRegime": "zero-field hyperfine / weak-field F basis",
          "auditDate": "2026-10-29",
          "sourceRecord": "table-05:1S0:A_over_h",
          "sourceReferenceNumbers": [],
          "birgeRatio": null
        },
        "convention": "A/h in MHz; E_F/h=A/2*[F(F+1)-I(I+1)-J(J+1)], I=1/2; shifts derived from A"
      },
      "³P₀": {
        "levelId": "yb171-6s6p-3p0",
        "legacy": {
          "A": 0,
          "levels": [
            {
              "F": 0.5,
              "shift": 0
            }
          ]
        },
        "sourceId": "ref-01",
        "evidenceKind": "literature-reported",
        "reviewStatus": "original-source-located",
        "unit": "MHz",
        "uncertainty": null,
        "uncertaintyNote": "J=0 diagonal first-order magnetic-dipole hyperfine A set0 by definition; not absence of off-diagonal HFI",
        "sourceLocator": "arXiv2509.04416v2 Table5 p21, 3P0:A_over_h",
        "conditions": {
          "isotope": 171,
          "fieldRegime": "zero-field hyperfine / weak-field F basis",
          "auditDate": "2026-10-29",
          "sourceRecord": "table-05:3P0:A_over_h",
          "sourceReferenceNumbers": [],
          "birgeRatio": null
        },
        "convention": "A/h in MHz; E_F/h=A/2*[F(F+1)-I(I+1)-J(J+1)], I=1/2; shifts derived from A"
      },
      "³P₁": {
        "levelId": "yb171-6s6p-3p1",
        "legacy": {
          "A": 3957.85,
          "levels": [
            {
              "F": 0.5,
              "shift": -3957.85
            },
            {
              "F": 1.5,
              "shift": 1978.925
            }
          ]
        },
        "sourceId": "ref-01",
        "evidenceKind": "literature-reported",
        "reviewStatus": "original-source-located",
        "unit": "MHz",
        "uncertainty": 0.05,
        "uncertaintyNote": "printed compilation uncertainty; Birge ratio and primary measurement spread retained in extraction",
        "sourceLocator": "arXiv2509.04416v2 Table5 p21, 3P1:A_over_h",
        "conditions": {
          "isotope": 171,
          "fieldRegime": "zero-field hyperfine / weak-field F basis",
          "auditDate": "2026-10-29",
          "sourceRecord": "table-05:3P1:A_over_h",
          "sourceReferenceNumbers": [
            127,
            128,
            181,
            182,
            183,
            184,
            185,
            186,
            187,
            188,
            189
          ],
          "birgeRatio": 2.6
        },
        "convention": "A/h in MHz; E_F/h=A/2*[F(F+1)-I(I+1)-J(J+1)], I=1/2; shifts derived from A"
      },
      "³P₂": {
        "levelId": "yb171-6s6p-3p2",
        "legacy": {
          "A": 2680.9,
          "levels": [
            {
              "F": 1.5,
              "shift": -4021.35
            },
            {
              "F": 2.5,
              "shift": 2680.9
            }
          ]
        },
        "sourceId": "ref-01",
        "evidenceKind": "literature-reported",
        "reviewStatus": "original-source-located",
        "unit": "MHz",
        "uncertainty": 2,
        "uncertaintyNote": "printed compilation uncertainty; Birge ratio and primary measurement spread retained in extraction",
        "sourceLocator": "arXiv2509.04416v2 Table5 p21, 3P2:A_over_h",
        "conditions": {
          "isotope": 171,
          "fieldRegime": "zero-field hyperfine / weak-field F basis",
          "auditDate": "2026-10-29",
          "sourceRecord": "table-05:3P2:A_over_h",
          "sourceReferenceNumbers": [
            190,
            191,
            192,
            193
          ],
          "birgeRatio": 6.3,
          "followupPrimarySourcesRead": [
            "qiao-2023-rinp"
          ],
          "followupDisposition": "weighted compilation retained; original measurements and conditions transcribed separately, no new statistical fit"
        },
        "convention": "A/h in MHz; E_F/h=A/2*[F(F+1)-I(I+1)-J(J+1)], I=1/2; shifts derived from A"
      },
      "³D₁": {
        "levelId": "yb171-6s5d-3d1",
        "legacy": {
          "A": -2038.3,
          "levels": [
            {
              "F": 0.5,
              "shift": 2038.3
            },
            {
              "F": 1.5,
              "shift": -1019.15
            }
          ]
        },
        "sourceId": "ref-01",
        "evidenceKind": "literature-reported",
        "reviewStatus": "original-source-located",
        "unit": "MHz",
        "uncertainty": 0.11,
        "uncertaintyNote": "printed compilation uncertainty; Birge ratio and primary measurement spread retained in extraction",
        "sourceLocator": "arXiv2509.04416v2 Table5 p21, 3D1:A_over_h",
        "conditions": {
          "isotope": 171,
          "fieldRegime": "zero-field hyperfine / weak-field F basis",
          "auditDate": "2026-10-29",
          "sourceRecord": "table-05:3D1:A_over_h",
          "sourceReferenceNumbers": [
            69,
            85,
            86,
            194,
            195
          ],
          "birgeRatio": 1,
          "followupPrimarySourcesRead": [
            "zhao-2024-pra"
          ],
          "followupDisposition": "weighted compilation retained; original measurements and conditions transcribed separately, no new statistical fit"
        },
        "convention": "A/h in MHz; E_F/h=A/2*[F(F+1)-I(I+1)-J(J+1)], I=1/2; shifts derived from A"
      },
      "¹P₁": {
        "levelId": "yb171-6s6p-1p1",
        "legacy": {
          "A": -214.06,
          "levels": [
            {
              "F": 0.5,
              "shift": 214.06
            },
            {
              "F": 1.5,
              "shift": -107.03
            }
          ]
        },
        "sourceId": "ref-01",
        "evidenceKind": "literature-reported",
        "reviewStatus": "original-source-located",
        "unit": "MHz",
        "uncertainty": 0.17,
        "uncertaintyNote": "printed compilation uncertainty; Birge ratio and primary measurement spread retained in extraction",
        "sourceLocator": "arXiv2509.04416v2 Table5 p21, 1P1:A_over_h",
        "conditions": {
          "isotope": 171,
          "fieldRegime": "zero-field hyperfine / weak-field F basis",
          "auditDate": "2026-10-29",
          "sourceRecord": "table-05:1P1:A_over_h",
          "sourceReferenceNumbers": [
            65,
            66,
            67,
            172,
            173,
            174,
            175,
            176,
            177,
            178,
            179
          ],
          "birgeRatio": 3.3
        },
        "convention": "A/h in MHz; E_F/h=A/2*[F(F+1)-I(I+1)-J(J+1)], I=1/2; shifts derived from A"
      },
      "³S₁": {
        "levelId": "yb171-6s7s-3s1",
        "legacy": {
          "A": 6838.41,
          "levels": [
            {
              "F": 0.5,
              "shift": -6838.41
            },
            {
              "F": 1.5,
              "shift": 3419.205
            }
          ]
        },
        "sourceId": "ref-01",
        "evidenceKind": "literature-reported",
        "reviewStatus": "original-source-located",
        "unit": "MHz",
        "uncertainty": 0.26,
        "uncertaintyNote": "printed compilation uncertainty; Birge ratio and primary measurement spread retained in extraction",
        "sourceLocator": "arXiv2509.04416v2 Table5 p21, 3S1:A_over_h",
        "conditions": {
          "isotope": 171,
          "fieldRegime": "zero-field hyperfine / weak-field F basis",
          "auditDate": "2026-10-29",
          "sourceRecord": "table-05:3S1:A_over_h",
          "sourceReferenceNumbers": [
            177,
            190,
            192,
            197,
            198,
            199
          ],
          "birgeRatio": 3.1,
          "evidenceType": "weighted compilation, not Qiao single measurement",
          "followupPrimarySourcesRead": [
            "qiao-2023-rinp",
            "qiao-2023-apl",
            "zhou-2020-pra"
          ],
          "followupDisposition": "weighted compilation retained; original measurements and conditions transcribed separately, no new statistical fit"
        },
        "convention": "A/h in MHz; E_F/h=A/2*[F(F+1)-I(I+1)-J(J+1)], I=1/2; shifts derived from A"
      },
      "50³S₁": {
        "levelId": "yb171-6s50s-3s1",
        "legacy": {
          "A": 5.734,
          "levels": [
            {
              "F": 0.5,
              "shift": -5.734
            },
            {
              "F": 1.5,
              "shift": 2.867
            }
          ]
        },
        "sourceId": "legacy-hfs",
        "evidenceKind": "scaling-estimate",
        "reviewStatus": "definition-needs-review",
        "unit": "MHz",
        "uncertainty": null,
        "uncertaintyNote": "not-established-in-this-migration",
        "sourceLocator": "historical A/nstar^3 estimate; not a located171Yb state-resolved measurement",
        "conditions": {
          "auditDate": "2026-10-29",
          "excludedFromValidatedPrediction": true
        }
      },
      "80³S₁": {
        "levelId": "yb171-6s80s-3s1",
        "legacy": {
          "A": 1.32,
          "levels": [
            {
              "F": 0.5,
              "shift": -1.32
            },
            {
              "F": 1.5,
              "shift": 0.66
            }
          ]
        },
        "sourceId": "legacy-hfs",
        "evidenceKind": "scaling-estimate",
        "reviewStatus": "definition-needs-review",
        "unit": "MHz",
        "uncertainty": null,
        "uncertaintyNote": "not-established-in-this-migration",
        "sourceLocator": "historical A/nstar^3 estimate; not a located171Yb state-resolved measurement",
        "conditions": {
          "auditDate": "2026-10-29",
          "excludedFromValidatedPrediction": true
        }
      },
      "65³D₁": {
        "levelId": "yb171-6s65d-3d1",
        "legacy": {
          "A": -0.767,
          "levels": [
            {
              "F": 0.5,
              "shift": 0.767
            },
            {
              "F": 1.5,
              "shift": -0.383
            }
          ]
        },
        "sourceId": "legacy-hfs",
        "evidenceKind": "scaling-estimate",
        "reviewStatus": "definition-needs-review",
        "unit": "MHz",
        "uncertainty": null,
        "uncertaintyNote": "not-established-in-this-migration",
        "sourceLocator": "historical A/nstar^3 estimate; not a located171Yb state-resolved measurement",
        "conditions": {
          "auditDate": "2026-10-29",
          "excludedFromValidatedPrediction": true
        }
      },
      "65³D₂": {
        "levelId": "yb171-6s65d-3d2",
        "legacy": {
          "A": -0.289,
          "levels": [
            {
              "F": 1.5,
              "shift": 0.434
            },
            {
              "F": 2.5,
              "shift": -0.289
            }
          ]
        },
        "sourceId": "legacy-hfs",
        "evidenceKind": "scaling-estimate",
        "reviewStatus": "definition-needs-review",
        "unit": "MHz",
        "uncertainty": null,
        "uncertaintyNote": "not-established-in-this-migration",
        "sourceLocator": "historical A/nstar^3 estimate; not a located171Yb state-resolved measurement",
        "conditions": {
          "auditDate": "2026-10-29",
          "excludedFromValidatedPrediction": true
        }
      }
    },
    "saved65S": {
      "levelId": "yb171-6s65s-3s1-triplet-connected",
      "sourceId": "this-work-hyperfine-65s",
      "evidenceKind": "internal-calculation",
      "reviewStatus": "definition-needs-review",
      "conditions": {
        "magneticField_G": 0,
        "electricField_V_cm": 0
      },
      "conditionsNote": "Original R005 validation2026-10-08 and saved notebook were read without execution: B=0,E=0,171Yb,n65,L0; original artifact identity checked, not a new MQDT calculation or independent model validation.",
      "energyReference": "ionic-hyperfine-centroid",
      "effectiveAConvention": "frequency-defined A_eff=(2/3)*splitting; selected zero-field branches only",
      "physicalValidation": "saved CSV,notebook and validation identity/configuration checked; original code revision and independent branch/model uncertainty remain unestablished",
      "csv": {
        "columns": [
          "isotope",
          "n_label",
          "term",
          "F",
          "B_G",
          "nu_upper",
          "energy_over_h_Hz_relative_ionic_hfs_centroid",
          "selected_pair_centroid_over_h_Hz",
          "shift_over_h_MHz",
          "splitting_F32_minus_F12_MHz",
          "A_eff_over_h_MHz",
          "triplet_channel_weight_diagnostic",
          "P_S1_in_retained_6sns",
          "g_F"
        ],
        "rows": [
          {
            "isotope": "171",
            "n_label": "65",
            "term": "3S1 triplet-connected",
            "F": "0.5",
            "B_G": "0.0",
            "nu_upper": "60.1761270465",
            "energy_over_h_Hz_relative_ionic_hfs_centroid": "-905339807668.5577",
            "selected_pair_centroid_over_h_Hz": "-897664643289.6215",
            "shift_over_h_MHz": "-7675.16437893628",
            "splitting_F32_minus_F12_MHz": "11512.746568404542",
            "A_eff_over_h_MHz": "7675.164378936361",
            "triplet_channel_weight_diagnostic": "0.9082363430484395",
            "P_S1_in_retained_6sns": "0.8594064354527566",
            "g_F": "2.2944137538533558"
          },
          {
            "isotope": "171",
            "n_label": "65",
            "term": "3S1 triplet-connected",
            "F": "1.5",
            "B_G": "0.0",
            "nu_upper": "60.561073029",
            "energy_over_h_Hz_relative_ionic_hfs_centroid": "-893827061100.1532",
            "selected_pair_centroid_over_h_Hz": "-897664643289.6215",
            "shift_over_h_MHz": "3837.5821894682617",
            "splitting_F32_minus_F12_MHz": "11512.746568404542",
            "A_eff_over_h_MHz": "7675.164378936361",
            "triplet_channel_weight_diagnostic": "1.0",
            "P_S1_in_retained_6sns": "1.0",
            "g_F": "1.3347899158789458"
          }
        ],
        "lineEnding": "CRLF",
        "finalNewline": true,
        "compatibilityPath": "assets/05.21_yb171_65s_hyperfine.csv"
      }
    }
  },
  "sources": {
    "schemaVersion": 1,
    "references": [
      {
        "id": "ref-01",
        "referenceNumber": 1,
        "title": "Kroeze, Kristensen, Pucher",
        "detail": "¹⁷¹Yb Reference Data",
        "publication": "arXiv:2509.04416v2; revised 2026-02-13; PDF dated 2026-02-16",
        "url": "https://arxiv.org/abs/2509.04416v2",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "Replace the invented descriptive title with the exact title. arXiv first submission is 2025-09-04; v2 revision is 2026-02-13, not a new 2026 journal publication.",
          "Primary arXiv page and 40-page PDF accessed; local first page checked. Its adopted averages and theory-derived quantities must retain that evidence type."
        ],
        "year": 2026,
        "authors": [
          "Ronen M. Kroeze",
          "Sofus Laguna Kristensen",
          "Sebastian Pucher"
        ],
        "doi": "10.48550/arXiv.2509.04416",
        "arxivVersion": "2509.04416v2"
      },
      {
        "id": "ref-02",
        "referenceNumber": 2,
        "title": "Peper et al.",
        "detail": "Spectroscopy and Modeling of ¹⁷¹Yb Rydberg States for High-Fidelity Two-Qubit Gates",
        "publication": "Phys. Rev. X 15, 011009 (2025)",
        "url": "https://arxiv.org/abs/2406.01482",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "Publication identity confirmed, not a mismatched PRX article. Local first page and APS PDF agree; published 2025-01-17. arXiv v2 revised 2024-11-13. Versioned arXiv PDF fetch failed in web tool, but APS open PDF succeeded."
        ],
        "year": 2025,
        "authors": [
          "Michael Peper",
          "Yiyi Li",
          "Daniel Y. Knapp",
          "Mila Bileska",
          "Shuo Ma",
          "Genyue Liu",
          "Pai Peng",
          "Bichen Zhang",
          "Sebastian P. Horvath",
          "Alex P. Burgers",
          "Jeff D. Thompson"
        ],
        "doi": "10.1103/PhysRevX.15.011009",
        "arxivVersion": "2406.01482v2"
      },
      {
        "id": "ref-03",
        "referenceNumber": 3,
        "title": "Kuroda, Hughes, Poitrinal, Peper, Thompson",
        "detail": "Microwave spectroscopy and multichannel quantum defect analysis of ytterbium 6snp, 6snf, and 6sng Rydberg states",
        "publication": "Phys. Rev. A 112, 042817 (2025)",
        "url": "https://arxiv.org/abs/2507.11487",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "Canonical title was shortened; publication title differs from the arXiv v1 title. The actual DOI is 10.1103/mzsv-rckx; do not invent 10.1103/PhysRevA.112.042817. Published 2025-10-28.",
          "Local published and arXiv PDFs exist. APS displays subscription access and a CHORUS accepted-manuscript link. arXiv PDF direct web fetch failed twice; metadata accessible. No missing local download."
        ],
        "year": 2025,
        "authors": [
          "Rin Kuroda",
          "Vernon M. Hughes",
          "Martin Poitrinal",
          "Michael Peper",
          "Jeff D. Thompson"
        ],
        "doi": "10.1103/mzsv-rckx",
        "arxivVersion": "2507.11487v1"
      },
      {
        "id": "ref-04",
        "referenceNumber": 4,
        "title": "Muniz et al.",
        "detail": "High-Fidelity Universal Gates in the ¹⁷¹Yb Ground-State Nuclear-Spin Qubit",
        "publication": "PRX Quantum 6, 020334 (2025)",
        "url": "https://arxiv.org/abs/2411.11708",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "Publication identity correct. APS explicitly open access / CC BY 4.0; publication 2025-05-21. Local published and arXiv v2 PDFs checked; arXiv v2 revised 2024-12-02."
        ],
        "year": 2025,
        "authors": [
          "J. A. Muniz",
          "M. Stone",
          "D. T. Stack",
          "M. Jaffe",
          "J. M. Kindem",
          "L. Wadleigh",
          "E. Zalys-Geller",
          "X. Zhang",
          "C.-A. Chen",
          "M. A. Norcia",
          "J. Epstein",
          "E. Halperin",
          "F. Hummel",
          "T. Wilkason",
          "M. Li",
          "K. Barnes",
          "P. Battaglino",
          "T. C. Bohdanowicz",
          "G. Booth",
          "A. Brown",
          "M. O. Brown",
          "W. B. Cairncross",
          "K. Cassella",
          "R. Coxe",
          "D. Crow",
          "M. Feldkamp",
          "C. Griger",
          "A. Heinz",
          "A. M. W. Jones",
          "H. Kim",
          "J. King",
          "K. Kotru",
          "J. Lauigan",
          "J. Marjanovic",
          "E. Megidish",
          "M. Meredith",
          "M. McDonald",
          "R. Morshead",
          "S. Narayanaswami",
          "C. Nishiguchi",
          "T. Paule",
          "K. A. Pawlak",
          "K. L. Pudenz",
          "D. Rodríguez Pérez",
          "A. Ryou",
          "J. Simon",
          "A. Smull",
          "M. Urbanek",
          "R. J. M. van de Veerdonk",
          "Z. Vendeiro",
          "T.-Y. Wu",
          "X. Xie",
          "B. J. Bloom"
        ],
        "doi": "10.1103/PRXQuantum.6.020334",
        "arxivVersion": "2411.11708v2"
      },
      {
        "id": "ref-05",
        "referenceNumber": 5,
        "title": "Ma et al.",
        "detail": "Universal Gate Operations on Nuclear Spin Qubits in an Optical Tweezer Array of ¹⁷¹Yb Atoms",
        "publication": "Phys. Rev. X 12, 021028 (2022)",
        "url": "https://arxiv.org/abs/2112.06799",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "Local printed publication first page agrees with arXiv DOI/journal reference; published 2022-05-03."
        ],
        "year": 2022,
        "authors": [
          "Shuo Ma",
          "Alex P. Burgers",
          "Genyue Liu",
          "Jack Wilson",
          "Bichen Zhang",
          "Jeff D. Thompson"
        ],
        "doi": "10.1103/PhysRevX.12.021028",
        "arxivVersion": "2112.06799v1"
      },
      {
        "id": "ref-06",
        "referenceNumber": 6,
        "title": "Okuno et al.",
        "detail": "High-resolution spectroscopy and single-photon Rydberg excitation of reconfigurable ytterbium atom tweezer arrays utilizing a metastable state",
        "publication": "J. Phys. Soc. Jpn. 91, 084301 (2022)",
        "url": "https://arxiv.org/abs/2204.07995",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "Canonical paraphrase omitted the final phrase utilizing a metastable state. Journal reference and DOI verified through arXiv. PDF 10 pages accessible. Isotope/state relevance must be checked at numerical-field level."
        ],
        "year": 2022,
        "authors": [
          "Daichi Okuno",
          "Yuma Nakamura",
          "Toshi Kusano",
          "Yosuke Takasu",
          "Nobuyuki Takei",
          "Hideki Konishi",
          "Yoshiro Takahashi"
        ],
        "doi": "10.7566/JPSJ.91.084301",
        "arxivVersion": "2204.07995v1"
      },
      {
        "id": "ref-07",
        "referenceNumber": 7,
        "title": "Wilson et al.",
        "detail": "Trapping Alkaline Earth Rydberg Atoms Optical Tweezer Arrays",
        "publication": "Phys. Rev. Lett. 128, 033201 (2022)",
        "url": "https://arxiv.org/abs/1912.08754",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "The unusual published title really omits in; APS and local PDF agree. The preprint has a different title: Trapped arrays of alkaline earth Rydberg atoms in optical tweezers. Published 2022-01-20.",
          "174Yb trapping/lifetime/coherence evidence is not a direct measurement of a specified 171Yb hyperfine state."
        ],
        "year": 2022,
        "authors": [
          "J. T. Wilson",
          "S. Saskin",
          "Y. Meng",
          "S. Ma",
          "R. Dilip",
          "A. P. Burgers",
          "J. D. Thompson"
        ],
        "doi": "10.1103/PhysRevLett.128.033201",
        "arxivVersion": "1912.08754v2"
      },
      {
        "id": "ref-08",
        "referenceNumber": 8,
        "title": "Saskin et al.",
        "detail": "Narrow-Line Cooling and Imaging of Ytterbium Atoms in an Optical Tweezer Array",
        "publication": "Phys. Rev. Lett. 122, 143002 (2019)",
        "url": "https://arxiv.org/abs/1810.10517",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "Published title/citation verified against local first page; arXiv DOI agrees. Publication 2019-04-10. Not direct evidence for every 171Yb cooling/hyperfine parameter."
        ],
        "year": 2019,
        "authors": [
          "S. Saskin",
          "J. T. Wilson",
          "B. Grinkemeyer",
          "J. D. Thompson"
        ],
        "doi": "10.1103/PhysRevLett.122.143002",
        "arxivVersion": "1810.10517v1"
      },
      {
        "id": "ref-09",
        "referenceNumber": 9,
        "title": "Burgers et al.",
        "detail": "Controlling Rydberg Excitations Using Ion-Core Transitions in Alkaline-Earth Atom-Tweezer Arrays",
        "publication": "PRX Quantum 3, 020326 (2022)",
        "url": "https://arxiv.org/abs/2110.06902",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "Canonical title was a substantial paraphrase. APS explicitly open access / CC BY 4.0; published 2022-05-06."
        ],
        "year": 2022,
        "authors": [
          "Alex P. Burgers",
          "Shuo Ma",
          "Sam Saskin",
          "Jack Wilson",
          "Miguel A. Alarcón",
          "Chris H. Greene",
          "Jeff D. Thompson"
        ],
        "doi": "10.1103/PRXQuantum.3.020326",
        "arxivVersion": "2110.06902v1"
      },
      {
        "id": "ref-10",
        "referenceNumber": 10,
        "title": "Halter et al.",
        "detail": "Trap-loss spectroscopy of Rydberg states in ytterbium",
        "publication": "J. Phys. B: At. Mol. Opt. Phys. 56, 055001 (2023)",
        "url": "https://arxiv.org/abs/2211.04748",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "arXiv primary page provides title, full authors, v2 date 2022-11-21, and related journal DOI. PDF accessible. IOP direct access blocked by robots; journal volume/article metadata corroborates existing citation but was not fetched directly.",
          "Project reference copy now downloaded under preprint year 2022; formal publication year remains 2023."
        ],
        "year": 2023,
        "authors": [
          "Christian Halter",
          "Alexander Miethke",
          "Christian Sillus",
          "Apoorva Hegde",
          "Axel Goerlitz"
        ],
        "doi": "10.1088/1361-6455/acb74b",
        "arxivVersion": "2211.04748v2"
      },
      {
        "id": "ref-11",
        "referenceNumber": 11,
        "title": "Lehec et al.",
        "detail": "Laser and microwave spectroscopy of even-parity Rydberg states of neutral ytterbium and multichannel-quantum-defect-theory analysis",
        "publication": "Phys. Rev. A 98, 062506 (2018)",
        "url": "https://arxiv.org/abs/1805.02712",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "Replace abbreviated title. Published 2018-12-06; arXiv v2 revised 2018-05-25. Distinguish 174Yb ionization limit from 171Yb limits."
        ],
        "year": 2018,
        "authors": [
          "H. Lehec",
          "A. Zuliani",
          "W. Maineult",
          "E. Luc-Koenig",
          "P. Pillet",
          "P. Cheinet",
          "F. Niyaz",
          "T. F. Gallagher"
        ],
        "doi": "10.1103/PhysRevA.98.062506",
        "arxivVersion": "1805.02712v2"
      },
      {
        "id": "ref-12",
        "referenceNumber": 12,
        "title": "Aymar et al.",
        "detail": "Three-step laser spectroscopy and multichannel quantum defect analysis of odd-parity Rydberg states of neutral ytterbium",
        "publication": "J. Phys. B: Atom. Mol. Phys. 17, 3645 (1984)",
        "url": "https://doi.org/10.1088/0022-3700/17/18/006",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-30",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-local-publisher-PDF",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "all numbered tables extracted; field-specific measurement/theory/derived boundaries retained",
        "evidenceNotes": [
          "2026-10-30 original publisher PDF now located and read; earlier download/identity notes are historical and retained in audit baseline."
        ],
        "year": 1984,
        "authors": [
          "M. Aymar",
          "R. J. Champeau",
          "C. Delsart",
          "O. Robaux"
        ],
        "doi": "10.1088/0022-3700/17/18/006",
        "arxivVersion": null,
        "originalPDF": "references/papers/7.pdf",
        "originalPDFSha256": "b058a900e9aaa292d3800087a823b57de74049434ee2ee663ac05aaa4c173bf0",
        "sourceFollowupAudit": "references/audits/source-followup-20261030.md"
      },
      {
        "id": "ref-13",
        "referenceNumber": 13,
        "title": "Fisk, Sellars, Lawn, Coles",
        "detail": "Accurate Measurement of the 12.6 GHz “Clock” Transition in Trapped ¹⁷¹Yb⁺ Ions",
        "publication": "IEEE Transactions on Ultrasonics, Ferroelectrics, and Frequency Control44(2),344–354(1997)",
        "url": "https://ieeexplore.ieee.org/document/585119",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-30",
        "rightsStatus": "not-established",
        "identityStatus": "verified-local-publisher-PDF",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "all numbered tables extracted; field-specific measurement/theory/derived boundaries retained",
        "evidenceNotes": [
          "2026-10-30 original publisher PDF now located and read; earlier download/identity notes are historical and retained in audit baseline."
        ],
        "year": 1997,
        "originalPDF": "references/papers/10.pdf",
        "originalPDFSha256": "1bdc3d40c247b1e725d2541ffb03aae7d930abd653deb0df00f530539450873b",
        "doi": "10.1109/58.585119",
        "sourceFollowupAudit": "references/audits/source-followup-20261030.md",
        "authors": [
          "Peter T. H. Fisk",
          "Matthew J. Sellars",
          "Malcolm A. Lawn",
          "Colin Coles"
        ],
        "previousCitation": "IEEE Trans.Instrum.Meas.46,457(1997),unconfirmed",
        "correctionBoundary": "Replaced the unresolved legacy citation with the actual verifiedTUFFC44(2),344-354 paper for ionic hyperfine data; not a claim that the two old citations are identical"
      },
      {
        "id": "ref-14",
        "referenceNumber": 14,
        "title": "NIST Atomic Spectra Database",
        "detail": "NIST Atomic Spectra Database (version 5.12)",
        "publication": "NIST Standard Reference Database 78, version 5.12 (2024), accessed 2026-10-29",
        "url": "https://physics.nist.gov/asd",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "NIST version-history primary page gives version 5.12 / 2024 and DOI; asd short URL currently redirects to NIST landing page. No per-line/per-level export was captured by this bibliography audit. Do not call a generic database URL a verified isotope-specific field source."
        ],
        "year": 2024,
        "authors": [
          "A. Kramida",
          "Yu. Ralchenko",
          "J. Reader",
          "NIST ASD Team"
        ],
        "doi": "10.18434/T4W30F",
        "arxivVersion": null
      },
      {
        "id": "ref-15",
        "referenceNumber": 15,
        "title": "Chen et al.",
        "detail": "Analyzing the Rydberg-based optical-metastable-ground architecture for ¹⁷¹Yb nuclear spins",
        "publication": "Phys. Rev. A 105, 052438 (2022)",
        "url": "https://arxiv.org/abs/2201.04083",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-primary-metadata",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "Journal title uses optical-metastable-ground while preprint title uses omg. Published 2022-05-25; arXiv v3 revised 2022-04-18. Exact state, approximation, and Fig.2 provenance must be retained with each extracted field."
        ],
        "year": 2022,
        "authors": [
          "Neville Chen",
          "Lintao Li",
          "William Huie",
          "Mingkun Zhao",
          "Ian Vetter",
          "Chris H. Greene",
          "Jacob P. Covey"
        ],
        "doi": "10.1103/PhysRevA.105.052438",
        "arxivVersion": "2201.04083v3"
      },
      {
        "id": "ref-16",
        "referenceNumber": 16,
        "title": "Ma et al.",
        "detail": "High-fidelity gates and mid-circuit erasure conversion in an atomic qubit",
        "publication": "Nature 622, 279–284 (2023)",
        "url": "https://arxiv.org/abs/2305.05493",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "local-research-copy; redistribution-not-assumed",
        "identityStatus": "verified-local-pdf-and-primary-arxiv",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-implied-by-bibliographic-verification",
        "evidenceNotes": [
          "Local published first page confirms exact published title, DOI, and online publication 2023-10-11; the preprint has a different title. Nature direct fetch redirected to an inaccessible cookie/authorization endpoint; use existing local PDF or verified arXiv. Do not silently extrapolate 59s measurements to 65s."
        ],
        "year": 2023,
        "authors": [
          "Shuo Ma",
          "Genyue Liu",
          "Pai Peng",
          "Bichen Zhang",
          "Sven Jandura",
          "Jahan Claes",
          "Alex P. Burgers",
          "Guido Pupillo",
          "Shruti Puri",
          "Jeff D. Thompson"
        ],
        "doi": "10.1038/s41586-023-06438-1",
        "arxivVersion": "2305.05493v1"
      },
      {
        "id": "ref-17",
        "referenceNumber": 17,
        "title": "This work",
        "detail": "³P₀ → 6s65s ³S₁ 电子态约化偶极矩阵元",
        "publication": "d = 0.0376 ea₀ · 本工作计算",
        "url": null,
        "reviewStatus": "definition-needs-review",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "not-established",
        "identityStatus": "internal-not-literature",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-established",
        "evidenceNotes": [
          "³P₀ → 6s65s ³S₁ 电子态约化偶极矩阵元",
          "No peer-reviewed bibliographic identity; keep internal provenance distinct from literature. Numerical values and original run identity require a separate artifact audit."
        ],
        "year": null
      },
      {
        "id": "qiao-2023-rinp",
        "referenceNumber": 18,
        "title": "H. Qiao, C.-Y. Sun, C.-Q. Peng",
        "detail": "Frequency measurement of 6s6p ³P₀,₂−6s7s ³S₁ transitions in ultracold ¹⁷¹Yb atoms referenced to local optical clock",
        "publication": "Results in Physics 48, 106439 (2023)",
        "url": "https://www.sciencedirect.com/science/article/pii/S2211379723002322",
        "doi": "10.1016/j.rinp.2023.106439",
        "authors": [
          "H. Qiao",
          "C.-Y. Sun",
          "C.-Q. Peng",
          "Q.-C. Qi",
          "C.-C. Zhao",
          "M. Zhou",
          "X.-Y. Xu"
        ],
        "year": 2023,
        "arxivVersion": null,
        "identityStatus": "verified-local-publisher-PDF",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-30",
        "rightsStatus": "research-index-only; redistribution-not-assumed",
        "numericalValidation": "all numbered tables extracted; field-specific measurement/theory/derived boundaries retained",
        "originalPDF": "references/papers/1.pdf",
        "originalPDFSha256": "208431f4b46db7195a46a87d34dd6d0d73cddc2818310be95d29582d80156783",
        "sourceFollowupAudit": "references/audits/source-followup-20261030.md",
        "evidenceNotes": [
          "2026-10-30 original publisher PDF now located and read; earlier download/identity notes are historical and retained in audit baseline."
        ]
      },
      {
        "id": "porsev-1999-pra",
        "referenceNumber": 19,
        "title": "S. G. Porsev, Yu. G. Rakhlina, M. G. Kozlov",
        "detail": "Electric-dipole amplitudes, lifetimes, and polarizabilities of the low-lying levels of atomic ytterbium",
        "publication": "Phys. Rev. A 60, 2781 (1999)",
        "url": "https://journals.aps.org/pra/abstract/10.1103/PhysRevA.60.2781",
        "doi": "10.1103/PhysRevA.60.2781",
        "authors": [
          "S. G. Porsev",
          "Yu. G. Rakhlina",
          "M. G. Kozlov"
        ],
        "year": 1999,
        "arxivVersion": "physics/9903004v1",
        "identityStatus": "verified-primary-metadata",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "research-index-only; redistribution-not-assumed",
        "numericalValidation": "see data/literature; identity alone is not numerical validation"
      },
      {
        "id": "zhou-2020-pra",
        "referenceNumber": 20,
        "title": "Min Zhou, Sheng Zhang, Limeng Luo",
        "detail": "Characterization of ytterbium resonance lines at 649 nm with modulation-transfer spectroscopy",
        "publication": "Phys. Rev. A 101, 062506 (2020)",
        "url": "https://journals.aps.org/pra/abstract/10.1103/PhysRevA.101.062506",
        "doi": "10.1103/PhysRevA.101.062506",
        "authors": [
          "Min Zhou",
          "Sheng Zhang",
          "Limeng Luo",
          "Xinye Xu"
        ],
        "year": 2020,
        "arxivVersion": null,
        "identityStatus": "verified-local-publisher-PDF",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-30",
        "rightsStatus": "research-index-only; redistribution-not-assumed",
        "numericalValidation": "all numbered tables extracted; field-specific measurement/theory/derived boundaries retained",
        "originalPDF": "references/papers/5.pdf",
        "originalPDFSha256": "3aecb39c63b436ef56cd59bc1c38e6c09cc300c5e4d34ba7120f43e4ad1d12de",
        "sourceFollowupAudit": "references/audits/source-followup-20261030.md",
        "evidenceNotes": [
          "2026-10-30 original publisher PDF now located and read; earlier download/identity notes are historical and retained in audit baseline."
        ]
      },
      {
        "id": "zhao-2024-pra",
        "referenceNumber": 21,
        "title": "Chengcheng Zhao, Qichao Qi, Changyue Sun",
        "detail": "Absolute frequency measurements of the 6s6p ³P₀−5d6s ³D₁ transitions in ¹⁷⁰,¹⁷¹,¹⁷²,¹⁷³,¹⁷⁴,¹⁷⁶Yb by modulation transfer spectroscopy",
        "publication": "Phys. Rev. A 110, 042816 (2024)",
        "url": "https://journals.aps.org/pra/abstract/10.1103/PhysRevA.110.042816",
        "doi": "10.1103/PhysRevA.110.042816",
        "authors": [
          "Chengcheng Zhao",
          "Qichao Qi",
          "Changyue Sun",
          "Chengquan Peng",
          "Taoyun Jin",
          "Tao Zhang",
          "Shuai Lei",
          "Yan Xia",
          "Suzhen Feng",
          "Xinye Xu"
        ],
        "year": 2024,
        "arxivVersion": null,
        "identityStatus": "verified-local-publisher-PDF",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-30",
        "rightsStatus": "research-index-only; redistribution-not-assumed",
        "numericalValidation": "all numbered tables extracted; field-specific measurement/theory/derived boundaries retained",
        "originalPDF": "references/papers/6.pdf",
        "originalPDFSha256": "5c0e26a7ffb56471aff199941159da7686533620e5341f7633cfba594ab322ae",
        "sourceFollowupAudit": "references/audits/source-followup-20261030.md",
        "evidenceNotes": [
          "2026-10-30 original publisher PDF now located and read; earlier download/identity notes are historical and retained in audit baseline."
        ]
      },
      {
        "id": "beloy-2012-pra",
        "referenceNumber": 22,
        "title": "K. Beloy, J. A. Sherman, N. D. Lemke",
        "detail": "Determination of the 5d6s ³D₁ state lifetime and blackbody-radiation clock shift in Yb",
        "publication": "Phys. Rev. A 86, 051404(R) (2012)",
        "url": "https://journals.aps.org/pra/abstract/10.1103/PhysRevA.86.051404",
        "doi": "10.1103/PhysRevA.86.051404",
        "authors": [
          "K. Beloy",
          "J. A. Sherman",
          "N. D. Lemke",
          "N. Hinkley",
          "C. W. Oates",
          "A. D. Ludlow"
        ],
        "year": 2012,
        "arxivVersion": "1208.0552v1",
        "identityStatus": "verified-primary-metadata",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "research-index-only; redistribution-not-assumed",
        "numericalValidation": "see data/literature; identity alone is not numerical validation"
      },
      {
        "id": "baumann-1985-jpb",
        "referenceNumber": 23,
        "title": "M. Baumann, M. Braun, A. Gaiser",
        "detail": "Radiative lifetimes and gJ factors of low-lying even-parity levels in the Yb I spectrum",
        "publication": "J. Phys. B: Atom. Mol. Phys. 18, L601 (1985)",
        "url": "https://doi.org/10.1088/0022-3700/18/17/001",
        "doi": "10.1088/0022-3700/18/17/001",
        "authors": [
          "M. Baumann",
          "M. Braun",
          "A. Gaiser",
          "H. Liening"
        ],
        "year": 1985,
        "arxivVersion": null,
        "identityStatus": "verified-local-publisher-PDF",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-30",
        "rightsStatus": "research-index-only; redistribution-not-assumed",
        "numericalValidation": "all numbered tables extracted; field-specific measurement/theory/derived boundaries retained",
        "originalPDF": "references/papers/3.pdf",
        "originalPDFSha256": "3bdd0ddd781d41583a0530446f9247d4d38f98e816651b14c39bcf4b42f12dc0",
        "sourceFollowupAudit": "references/audits/source-followup-20261030.md",
        "evidenceNotes": [
          "2026-10-30 original publisher PDF now located and read; earlier download/identity notes are historical and retained in audit baseline."
        ]
      },
      {
        "id": "bowers-1996-pra",
        "referenceNumber": 24,
        "title": "C. J. Bowers, D. Budker, E. D. Commins",
        "detail": "Experimental investigation of excited-state lifetimes in atomic ytterbium",
        "publication": "Phys. Rev. A 53, 3103 (1996)",
        "url": "https://journals.aps.org/pra/abstract/10.1103/PhysRevA.53.3103",
        "doi": "10.1103/PhysRevA.53.3103",
        "authors": [
          "C. J. Bowers",
          "D. Budker",
          "E. D. Commins",
          "D. DeMille",
          "S. J. Freedman",
          "A.-T. Nguyen",
          "S.-Q. Shang",
          "M. Zolotorev"
        ],
        "year": 1996,
        "arxivVersion": null,
        "identityStatus": "verified-primary-metadata",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "research-index-only; redistribution-not-assumed",
        "numericalValidation": "see data/literature; identity alone is not numerical validation"
      },
      {
        "id": "rambow-1976-pra",
        "referenceNumber": 25,
        "title": "F. H. K. Rambow, L. D. Schearer",
        "detail": "Radiative lifetimes and alignment depolarization cross sections for YbI and II by the Hanle effect in a flowing helium system",
        "publication": "Physical Review A14(2),738–743(1976)",
        "url": "https://journals.aps.org/pra/issues/14/2",
        "doi": "10.1103/PhysRevA.14.738",
        "authors": [
          "F. H. K. Rambow",
          "L. D. Schearer"
        ],
        "year": 1976,
        "arxivVersion": null,
        "identityStatus": "verified-local-publisher-PDF",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-30",
        "rightsStatus": "research-index-only; redistribution-not-assumed",
        "numericalValidation": "all numbered tables extracted; field-specific measurement/theory/derived boundaries retained",
        "originalPDF": "references/papers/8.pdf",
        "originalPDFSha256": "14034e18a46ceb8b68c854d74f663ccce0a487ff40ff39d46e81f01dac14895b",
        "sourceFollowupAudit": "references/audits/source-followup-20261030.md",
        "evidenceNotes": [
          "2026-10-30 original publisher PDF now located and read; earlier download/identity notes are historical and retained in audit baseline."
        ]
      },
      {
        "id": "burshtein-1974-optspec",
        "referenceNumber": 26,
        "title": "M. L. Burshtein, Y. F. Verolainen, V. A. Komarovskii",
        "detail": "Lifetimes of the ³P₁ level of Yb I and the ²P₃/₂,₁/₂ level of Yb II",
        "publication": "Optics and Spectroscopy 37, 351 (1974)",
        "url": null,
        "doi": null,
        "authors": [
          "M. L. Burshtein",
          "Y. F. Verolainen",
          "V. A. Komarovskii",
          "A. L. Osherovich",
          "N. P. Penkin"
        ],
        "year": 1974,
        "arxivVersion": null,
        "identityStatus": "compilation-index-only",
        "reviewStatus": "definition-needs-review",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "research-index-only; redistribution-not-assumed",
        "numericalValidation": "see data/literature; identity alone is not numerical validation"
      },
      {
        "id": "qiao-2023-apl",
        "referenceNumber": 27,
        "title": "H. Qiao, L. Liu, M. Zhou",
        "detail": "Investigation of the 6s6p ³P₂−6s7s ³S₁ transition of ytterbium atoms with modulation-transfer spectroscopy",
        "publication": "Applied Physics Letters122(22),224002(2023)",
        "url": "https://pubs.aip.org/apl/article/122/22/224002/2893691/Investigation-of-the-6s6p-3P2-6s7s-3S1-transition",
        "doi": "10.1063/5.0155776",
        "authors": [
          "H. Qiao",
          "L. Liu",
          "M. Zhou",
          "L. Luo",
          "X. Xu"
        ],
        "year": 2023,
        "arxivVersion": null,
        "identityStatus": "verified-local-publisher-PDF",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-30",
        "rightsStatus": "research-index-only; redistribution-not-assumed",
        "numericalValidation": "all numbered tables extracted; field-specific measurement/theory/derived boundaries retained",
        "originalPDF": "references/papers/4.pdf",
        "originalPDFSha256": "e2d263f0b1762d45b04bdbba8c3adc4fdf4ff098427054b4f8124f624e295df4",
        "sourceFollowupAudit": "references/audits/source-followup-20261030.md",
        "evidenceNotes": [
          "2026-10-30 original publisher PDF now located and read; earlier download/identity notes are historical and retained in audit baseline."
        ]
      },
      {
        "id": "mishra-2001-jqsrt",
        "referenceNumber": 28,
        "title": "A. P. Mishra, T. Balasubramanian",
        "detail": "Radiative lifetimes of the first excited ³Pᵒ₂,₀ metastable levels in Kr I, Xe I, Yb I and Hg-like atoms",
        "publication": "Journal of Quantitative Spectroscopy and Radiative Transfer69(6),769–780(2001)",
        "url": "https://www.sciencedirect.com/science/article/abs/pii/S0022407300001175",
        "doi": "10.1016/S0022-4073(00)00117-5",
        "authors": [
          "Adya Prasad Mishra",
          "T. K. Balasubramanian"
        ],
        "year": 2001,
        "arxivVersion": null,
        "identityStatus": "verified-local-publisher-PDF",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-30",
        "rightsStatus": "research-index-only; redistribution-not-assumed",
        "numericalValidation": "all numbered tables extracted; field-specific measurement/theory/derived boundaries retained",
        "originalPDF": "references/papers/2.pdf",
        "originalPDFSha256": "1fba52d567ba7dbdc805752a50796b998fd8fba30c9acf72b2bd0c7bd0ae2d7b",
        "sourceFollowupAudit": "references/audits/source-followup-20261030.md",
        "evidenceNotes": [
          "2026-10-30 original publisher PDF now located and read; earlier download/identity notes are historical and retained in audit baseline."
        ]
      },
      {
        "id": "porsev-2004-pra",
        "referenceNumber": 29,
        "title": "S. G. Porsev, A. Derevianko",
        "detail": "Hyperfine quenching of the metastable ³P₀,₂ states in divalent atoms",
        "publication": "Phys. Rev. A 69, 042506 (2004)",
        "url": "https://arxiv.org/abs/physics/0312006v1",
        "doi": "10.1103/PhysRevA.69.042506",
        "authors": [
          "S. G. Porsev",
          "A. Derevianko"
        ],
        "year": 2004,
        "arxivVersion": "physics/0312006v1",
        "identityStatus": "verified-primary-metadata-and-local-pdf",
        "reviewStatus": "original-source-located",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "research-index-only; redistribution-not-assumed",
        "numericalValidation": "see data/literature; identity alone is not numerical validation"
      }
    ],
    "sources": [
      {
        "id": "legacy-levels",
        "title": "Existing level catalog at commit 2e2e9d5",
        "detail": "Original root index.html CORE_LEVELS and RYDBERG_QC_DATA; no independent original-source reconciliation performed in this migration.",
        "reviewStatus": "definition-needs-review",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "not-established",
        "identityStatus": "internal-not-literature",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-established",
        "evidenceNotes": [
          "Original root index.html CORE_LEVELS and RYDBERG_QC_DATA; no independent original-source reconciliation performed in this migration.",
          "No peer-reviewed bibliographic identity; keep internal provenance distinct from literature. Numerical values and original run identity require a separate artifact audit."
        ],
        "year": null
      },
      {
        "id": "legacy-hfs",
        "title": "Existing hyperfine catalog at commit 2e2e9d5",
        "detail": "Original HYPERFINE_DATA; literature A constants and scaled Rydberg estimates retain their existing values and unresolved source status.",
        "reviewStatus": "definition-needs-review",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "not-established",
        "identityStatus": "internal-not-literature",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-established",
        "evidenceNotes": [
          "Original HYPERFINE_DATA; literature A constants and scaled Rydberg estimates retain their existing values and unresolved source status.",
          "No peer-reviewed bibliographic identity; keep internal provenance distinct from literature. Numerical values and original run identity require a separate artifact audit."
        ],
        "year": null
      },
      {
        "id": "legacy-scaling",
        "title": "Existing scaling estimates",
        "detail": "Original calcRydberg and RYDBERG_QC_TRANSITIONS; approximate single-channel/scaling values, not independently validated state-specific predictions.",
        "reviewStatus": "definition-needs-review",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "not-established",
        "identityStatus": "internal-not-literature",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-established",
        "evidenceNotes": [
          "Original calcRydberg and RYDBERG_QC_TRANSITIONS; approximate single-channel/scaling values, not independently validated state-specific predictions.",
          "No peer-reviewed bibliographic identity; keep internal provenance distinct from literature. Numerical values and original run identity require a separate artifact audit."
        ],
        "year": null
      },
      {
        "id": "internal-t2-calibration",
        "title": "T2 internal calibration",
        "detail": "历史内部校准0.543 ea0已停用为默认值；默认采用Kroeze v2 Table10的0.5398(6) ea0。内部校准依据未找到。",
        "conflicts": [
          {
            "field": "dipole",
            "adoptedValue": 0.543,
            "reportedLiteratureText": "0.5398(6)",
            "unit": "e*a0",
            "resolution": "2026-10-29 default switched to source-reported0.5398(6); old internal value retained only in archive"
          }
        ],
        "reviewStatus": "definition-needs-review",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "not-established",
        "identityStatus": "internal-not-literature",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-established",
        "evidenceNotes": [
          "Original record uses 0.543 ea0 and separately states literature 0.5398(6) ea0. This migration preserves the distinction; calibration rationale and source require independent review.",
          "No peer-reviewed bibliographic identity; keep internal provenance distinct from literature. Numerical values and original run identity require a separate artifact audit.",
          "0.543 ea0 and cited 0.5398(6) ea0 are different provenance classes; source/definition reconciliation is required before a single adopted number is claimed."
        ],
        "year": null
      },
      {
        "id": "internal-t3-20260908",
        "title": "T3 internal supplement dated 2026-09-08",
        "detail": "Original record specifies an effective F-reduced matrix element 9.19e-5 ea0; not a bare J=0 to J=0 E1 reduced element.",
        "reviewStatus": "definition-needs-review",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "not-established",
        "identityStatus": "internal-not-literature",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-established",
        "evidenceNotes": [
          "Original record specifies an effective F-reduced matrix element 9.19e-5 ea0; not a bare J=0 to J=0 E1 reduced element.",
          "No peer-reviewed bibliographic identity; keep internal provenance distinct from literature. Numerical values and original run identity require a separate artifact audit.",
          "Effective F-reduced hyperfine-enabled element must not be represented as a bare J=0 to J=0 E1 matrix element."
        ],
        "year": null
      },
      {
        "id": "this-work-hyperfine-65s",
        "title": "This work: saved 65S zero-field data",
        "detail": "原R005 Notebook、validation和保存CSV已只读核对；B=0,E=0。未重算，未建立独立实验验证或总模型误差。",
        "artifactLocator": "data/literature/rydberg-audit/internal-evidence/05.21_yb171_65s_hyperfine.ipynb + 05.21_yb171_65s_hyperfine_validation.json + 05.21_yb171_65s_hyperfine.csv",
        "artifactSha256": "a52e9100090c78da0914b748a309e798838a4c9c9744c64553cf761a6330d0ec",
        "notebookRevision": null,
        "runInputHash": null,
        "physicalValidation": "saved artifact integrity and original configuration checked; no new calculation or independent physical validation",
        "reviewStatus": "definition-needs-review",
        "reviewedAt": "2026-10-29",
        "rightsStatus": "not-established",
        "identityStatus": "internal-not-literature",
        "bibliographyAudit": "references/bibliography-audit.json",
        "numericalValidation": "not-established",
        "evidenceNotes": [
          "Existing assets/05.21_yb171_65s_hyperfine.csv and original data card; no new MQDT calculation or original-run audit performed.",
          "No peer-reviewed bibliographic identity; keep internal provenance distinct from literature. Numerical values and original run identity require a separate artifact audit.",
          "Saved CSV SHA256 a52e9100090c78da0914b748a309e798838a4c9c9744c64553cf761a6330d0ec is an artifact checksum; it does not identify the generating notebook revision, inputs, branch, or physical validation."
        ],
        "year": null,
        "artifactManifest": "data/literature/rydberg-audit/internal-evidence-manifest.json",
        "savedNotebookSha256": "ab624645b2003083565484ad405f8024f09d992ac80300384ff9e52e2df14791",
        "savedValidationSha256": "b177d7ebc6fc422839d3f1025915bcb67b2fcebf367ce5557bb6cc96b4689d16"
      }
    ]
  },
  "estimates": {
    "schemaVersion": 1,
    "modelId": "legacy-rydberg-scaling-v1",
    "evidenceKind": "scaling-estimate",
    "reviewStatus": "conflict-unresolved",
    "constants": {
      "R_INF": 109737.3156816,
      "E_I_CM": 50443.0676,
      "E_I_EV": 6.2541433,
      "A0_UM": 0.0000529177210903
    },
    "ns_values": [
      50,
      55,
      60,
      65,
      70,
      75,
      80
    ],
    "quantumDefects": [
      {
        "series": "6sns ¹S₀",
        "term": "¹S₀",
        "delta0": 4.2721,
        "delta2": "—",
        "range": "n = 70–90",
        "note": "174Yb原文参数；不能移植为171Yb逐态量子亏损。单重态 S 系列",
        "source": "Halter arXiv2211.04748v2; 174Yb comparator, not171Yb default",
        "reviewStatus": "original-source-located",
        "excludedFromValidatedPrediction": true,
        "auditDate": "2026-10-29",
        "isotope": 174,
        "followupBoundary": "Aymar1984Table1-4 measured174Yb odd-parity spectra; cannot validate these171Yb scalar defaults"
      },
      {
        "series": "6snp ¹P₁",
        "term": "¹P₁",
        "delta0": 3.9535,
        "delta2": "—",
        "range": "n = 70–90",
        "note": "174Yb原文参数；不能移植为171Yb逐态量子亏损。单重态 P 系列",
        "source": "Halter arXiv2211.04748v2; 174Yb comparator, not171Yb default",
        "reviewStatus": "original-source-located",
        "excludedFromValidatedPrediction": true,
        "auditDate": "2026-10-29",
        "isotope": 174,
        "followupBoundary": "Aymar1984Table1-4 measured174Yb odd-parity spectra; cannot validate these171Yb scalar defaults"
      },
      {
        "series": "6sns ³S₁",
        "term": "³S₁",
        "delta0": 2.523,
        "delta2": "—",
        "range": "高 n",
        "note": "旧delta=2.523没有指定171Yb triplet-connected分支证据；不以Peper比较Rb的n57背书。",
        "source": "历史近似参数；未找到该数值的指定171Yb态原始证据",
        "reviewStatus": "definition-needs-review",
        "excludedFromValidatedPrediction": true,
        "auditDate": "2026-10-29",
        "followupBoundary": "Aymar1984Table1-4 measured174Yb odd-parity spectra; cannot validate these171Yb scalar defaults"
      },
      {
        "series": "6snd ³D₁",
        "term": "³D₁",
        "delta0": 1.41,
        "delta2": "—",
        "range": "低 n (近似)",
        "note": "三重态 D 系列；高 n 用 MQDT 6-channel",
        "source": "历史近似参数；未找到该数值的指定171Yb态原始证据",
        "reviewStatus": "definition-needs-review",
        "excludedFromValidatedPrediction": true,
        "auditDate": "2026-10-29",
        "followupBoundary": "Aymar1984Table1-4 measured174Yb odd-parity spectra; cannot validate these171Yb scalar defaults"
      },
      {
        "series": "6snd ³D₂",
        "term": "³D₂",
        "delta0": 1.42,
        "delta2": "—",
        "range": "低 n (近似)",
        "note": "6snd 为零场偶宇称 D 系列；p–f 混合属于奇宇称 6snp / 6snf，可影响 D 态 Stark 位移及相互作用计算，并非 D 态零场内禀 p–f 混合。δ₀=1.42 的原数值出处未独立核验。",
        "source": "历史近似参数；未找到该数值的指定171Yb态原始证据",
        "reviewStatus": "definition-needs-review",
        "excludedFromValidatedPrediction": true,
        "auditDate": "2026-10-29",
        "followupBoundary": "Aymar1984Table1-4 measured174Yb odd-parity spectra; cannot validate these171Yb scalar defaults"
      },
      {
        "series": "6snf ³F₂,₃,₄",
        "term": "³F_J",
        "delta0": 0.02,
        "delta2": "—",
        "range": "高 n",
        "note": "Kuroda的约0.026对应g态；f态需多通道/版本/同位素说明，旧0.02仅归档示意。",
        "source": "历史参数0.02未获支持；Kuroda不能支持该171Yb f态单一量子亏损",
        "reviewStatus": "definition-needs-review",
        "excludedFromValidatedPrediction": true,
        "auditDate": "2026-10-29",
        "followupBoundary": "Aymar1984Table1-4 measured174Yb odd-parity spectra; cannot validate these171Yb scalar defaults"
      }
    ],
    "ionization": {
      "E_I0": 50442.795744,
      "E_I1": 50443.217463,
      "A_ion_GHz": 12.642812118466
    },
    "lifetimeReference": {
      "tau_us": 0.0138,
      "n": 7,
      "delta": 2.523,
      "excludeFromValidated": true,
      "note": "6s7s low-state lifetime is not a verified high-n Rydberg lifetime scaling anchor; temperature/BBR/branch not established"
    },
    "c6Reference": {
      "n": 57,
      "delta": 2.523,
      "value_GHz_um6": 34,
      "blockadeReferenceRabi_MHz": 1,
      "anchorMapping": "invalid: n57 in Peper Fig6 refers to comparison Rb, not the171Yb state",
      "excludeFromValidated": true,
      "trueLiteratureState": "171Yb triplet-connected nu=54.28,L=0,F=1/2,mF=-1/2,B=4.88(6)G,theta=pi/2",
      "sourceId": "ref-02",
      "sourceLocator": "published PDF p8 Fig6"
    },
    "scope": "Historical single-channel illustration only. Unsupported quantum defects, lifetime anchors and invalid C6 n57 mapping are quarantined; no state-resolved MQDT prediction, no validated blockade radius.",
    "constantProvenance": {
      "A0_UM": {
        "sourceVersion": "CODATA 2018",
        "sourceUrl": "https://physics.nist.gov/cuu/pdf/all_2018.pdf",
        "sourceLocator": "p.1, Bohr radius row",
        "conversion": "A0 in metres times 10^6; 2018 mantissa retained",
        "reviewScope": "unit conversion only; not validation of the scaling model"
      },
      "E_I_CM": {
        "sourceId": "ref-01",
        "sourceLocator": "Kroeze v2 Table2 p20,171Yb compiled centroid; RB=4.7",
        "uncertainty": 0.0012,
        "evidenceType": "compilation with mass-scaled174Yb input; not one direct171Yb measurement",
        "thresholdConflict": "Peper Fcore-weighted centroid differs; reference/calibration reconciliation pending"
      },
      "E_I_EV": {
        "sourceId": "ref-01",
        "sourceLocator": "Kroeze v2 Table2 p20,171Yb compiled centroid; RB=4.7",
        "uncertainty": 1.5e-7,
        "evidenceType": "compilation with mass-scaled174Yb input; not one direct171Yb measurement",
        "thresholdConflict": "Peper Fcore-weighted centroid differs; reference/calibration reconciliation pending"
      },
      "R_INF": {
        "sourceVersion": "CODATA2018",
        "sourceUrl": "https://physics.nist.gov/cuu/pdf/all_2018.pdf",
        "sourceLocator": "p1 Rydberg constant10973731.568160(21)m^-1; divide100 forcm^-1",
        "uncertainty": 2.1e-7,
        "modelBoundary": "legacy scaling still usesRinf; not mass-corrected171MQDT"
      }
    },
    "auditDate": "2026-10-29",
    "publicOutputPolicy": {
      "lifetime_us": "suppressed-invalid-anchor",
      "C6_ghz_um6": "suppressed-invalid-anchor",
      "blockade_um": "suppressed-invalid-anchor"
    },
    "ionizationProvenance": {
      "sourceId": "ref-02",
      "locator": "published supplement pp5-9; fitted171Yb Fcore0/1 thresholds",
      "thresholdUncertainties": "not supplied for these last digits in extracted parameter tables",
      "centroid_cm": 50443.11203325,
      "sourceConflict": "does not equal Kroeze Table2 compilation centroid50443.0676(12); do not splice references",
      "A_ion_GHz": {
        "sourceId": "ref-13",
        "sourceFile": "references/papers/10.pdf",
        "sourceLocator": "Fisk1997 abstract PDFp1/printed344; final measurement discussion PDFp9/printed352",
        "valueHz": 12642812118.466,
        "uncertaintyHz": 0.002,
        "frequencyGHz": 12.642812118466,
        "uncertaintyGHz": 2e-12,
        "convention": "171Yb+ground-state hyperfine clock frequency extrapolated tozeroB,zeroDC/ACStark,zero velocity/temperature and vacuum; experimental ions were not at0K",
        "legacyKroezeBlattValueGHz": 12.6428121242,
        "legacyDifferenceHz": 5.734,
        "noThresholdRefit": "Peper MQDT fitted threshold values unchanged; printed threshold spacing cannot supportHz precision"
      }
    }
  }
};
export const datasetManifest = {
  "schemaVersion": 1,
  "datasetVersion": "2026.10.30.1",
  "sourceCommit": "2e2e9d5",
  "sourceDate": "2026-10-30",
  "migrationDate": "2026-10-26",
  "generatedAt": "2026-10-30T06:26:37.581Z",
  "contentHash": "3c2fd5ca0a98d1e1e3e59aa6eab7fdcd9164678c048ed736f41dced0a3c20d28",
  "files": [
    {
      "path": "data/levels.json",
      "sha256": "436e64e4b0f00ec67f7a90267ff85bc11c3600c0f360155c6f382975ec98ceaa"
    },
    {
      "path": "data/transitions.json",
      "sha256": "aa8fe6b42776e8e6045ad3cb17d487d1802f27329fa153f9139b153784fa59b0"
    },
    {
      "path": "data/hyperfine.json",
      "sha256": "2870fb871e3b578c09313c993d92ce1b40c85393acee309976eef96fad55889e"
    },
    {
      "path": "data/sources.json",
      "sha256": "4d9a8c53bbf668efb02ab9b9c3dcbc68b3bbdebfbcfe39bcdcc00ca910884e62"
    },
    {
      "path": "data/estimates.json",
      "sha256": "ffb73032f906ff73fe23b7674c05008ccb1296b292d493fd46f2b42b484c21a9"
    }
  ],
  "reviewStatus": "nine new primary PDFs checked; explicitRitzP2centroid,statistical-rate-lifetime andionic-frequency corrections; remaining boundaries retained",
  "physicalValidation": "not established for all records: compilation, theory, source conflicts, missing originals and internal models are explicitly distinguished",
  "exports": [
    {
      "path": "assets/05.21_yb171_65s_hyperfine.csv",
      "sha256": "a52e9100090c78da0914b748a309e798838a4c9c9744c64553cf761a6330d0ec"
    }
  ],
  "auditReport": "references/audits/source-followup-20261030.md"
};
