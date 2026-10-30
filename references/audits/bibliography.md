# 文献身份、版本与获取状态审计

审计日期：2026-10-29。覆盖 `data/sources.json` 的 17 个参考文献条目及 6 个内部来源；另列 12 篇低态原始文献候选。本文仅核对文献身份和获取状态；文献身份核对成功不等于其每个数值、同位素、态归属或模型已验证。

已核对 15 个外部来源身份（含 NIST；部分为出版社索引元数据），1 个 Fisk 条目仍有身份冲突。7 条内部/遗留来源保留内部属性。未改动原始 paper 库，未下载受限出版社文献。

## 现有条目逐项结果

| ID | 准确题名或状态 | 年份 / 标识符 | 审计要点 |
|---|---|---|---|
| ref-01 | ¹⁷¹Yb Reference Data | 2026 / 10.48550/arXiv.2509.04416 | Replace the invented descriptive title with the exact title. arXiv first submission is 2025-09-04; v2 revision is 2026-02-13, not a new 2026 journal publication. |
| ref-02 | Spectroscopy and Modeling of ¹⁷¹Yb Rydberg States for High-Fidelity Two-Qubit Gates | 2025 / 10.1103/PhysRevX.15.011009 | Publication identity confirmed, not a mismatched PRX article. Local first page and APS PDF agree; published 2025-01-17. arXiv v2 revised 2024-11-13. Versioned arXiv PDF fetch failed in web tool, but APS open PDF succeeded. |
| ref-03 | Microwave spectroscopy and multichannel quantum defect analysis of ytterbium 6snp, 6snf, and 6sng Rydberg states | 2025 / 10.1103/mzsv-rckx | Canonical title was shortened; publication title differs from the arXiv v1 title. The actual DOI is 10.1103/mzsv-rckx; do not invent 10.1103/PhysRevA.112.042817. Published 2025-10-28. |
| ref-04 | High-Fidelity Universal Gates in the ¹⁷¹Yb Ground-State Nuclear-Spin Qubit | 2025 / 10.1103/PRXQuantum.6.020334 | Publication identity correct. APS explicitly open access / CC BY 4.0; publication 2025-05-21. Local published and arXiv v2 PDFs checked; arXiv v2 revised 2024-12-02. |
| ref-05 | Universal Gate Operations on Nuclear Spin Qubits in an Optical Tweezer Array of ¹⁷¹Yb Atoms | 2022 / 10.1103/PhysRevX.12.021028 | Local printed publication first page agrees with arXiv DOI/journal reference; published 2022-05-03. |
| ref-06 | High-resolution spectroscopy and single-photon Rydberg excitation of reconfigurable ytterbium atom tweezer arrays utilizing a metastable state | 2022 / 10.7566/JPSJ.91.084301 | Canonical paraphrase omitted the final phrase utilizing a metastable state. Journal reference and DOI verified through arXiv. PDF 10 pages accessible. Isotope/state relevance must be checked at numerical-field level. |
| ref-07 | Trapping Alkaline Earth Rydberg Atoms Optical Tweezer Arrays | 2022 / 10.1103/PhysRevLett.128.033201 | The unusual published title really omits in; APS and local PDF agree. The preprint has a different title: Trapped arrays of alkaline earth Rydberg atoms in optical tweezers. Published 2022-01-20. |
| ref-08 | Narrow-Line Cooling and Imaging of Ytterbium Atoms in an Optical Tweezer Array | 2019 / 10.1103/PhysRevLett.122.143002 | Published title/citation verified against local first page; arXiv DOI agrees. Publication 2019-04-10. Not direct evidence for every 171Yb cooling/hyperfine parameter. |
| ref-09 | Controlling Rydberg Excitations Using Ion-Core Transitions in Alkaline-Earth Atom-Tweezer Arrays | 2022 / 10.1103/PRXQuantum.3.020326 | Canonical title was a substantial paraphrase. APS explicitly open access / CC BY 4.0; published 2022-05-06. |
| ref-10 | Trap-loss spectroscopy of Rydberg states in ytterbium | 2023 / 10.1088/1361-6455/acb74b | arXiv primary page provides title, full authors, v2 date 2022-11-21, and related journal DOI. PDF accessible. IOP direct access blocked by robots; journal volume/article metadata corroborates existing citation but was not fetched directly. |
| ref-11 | Laser and microwave spectroscopy of even-parity Rydberg states of neutral ytterbium and multichannel-quantum-defect-theory analysis | 2018 / 10.1103/PhysRevA.98.062506 | Replace abbreviated title. Published 2018-12-06; arXiv v2 revised 2018-05-25. Distinguish 174Yb ionization limit from 171Yb limits. |
| ref-12 | Three-step laser spectroscopy and multichannel quantum defect analysis of odd-parity Rydberg states of neutral ytterbium | 1984 / 10.1088/0022-3700/17/18/006 | IOP indexed primary metadata confirms exact title, all authors, DOI, and page. Direct IOP page blocked by robots, no legal open PDF verified. This is odd-parity, not the older 1980 even-parity article. |
| ref-13 | 未确认：原始 Fisk 引用身份待核对 | 1997 / 原 TIM 46,457(1997) 待核对 | Original IEEE Trans. Instrum. Meas. 46, 457 (1997) could not be validated against a primary record. Do not fabricate a DOI or keep the paraphrase as an exact title. |
| ref-14 | NIST Atomic Spectra Database (version 5.12) | 2024 / 10.18434/T4W30F | NIST version-history primary page gives version 5.12 / 2024 and DOI; asd short URL currently redirects to NIST landing page. No per-line/per-level export was captured by this bibliography audit. Do not call a generic database URL a verified isotope-specific field source. |
| ref-15 | Analyzing the Rydberg-based optical-metastable-ground architecture for ¹⁷¹Yb nuclear spins | 2022 / 10.1103/PhysRevA.105.052438 | Journal title uses optical-metastable-ground while preprint title uses omg. Published 2022-05-25; arXiv v3 revised 2022-04-18. Exact state, approximation, and Fig.2 provenance must be retained with each extracted field. |
| ref-16 | High-fidelity gates and mid-circuit erasure conversion in an atomic qubit | 2023 / 10.1038/s41586-023-06438-1 | Local published first page confirms exact published title, DOI, and online publication 2023-10-11; the preprint has a different title. Nature direct fetch redirected to an inaccessible cookie/authorization endpoint; use existing local PDF or verified arXiv. Do not silently extrapolate 59s measurements to 65s. |
| ref-17 | ³P₀ → 6s65s ³S₁ 电子态约化偶极矩阵元 | — / 内部记录，无 DOI | ³P₀ → 6s65s ³S₁ 电子态约化偶极矩阵元 |
| legacy-levels | Existing level catalog at commit 2e2e9d5 | — / 内部记录，无 DOI | Original root index.html CORE_LEVELS and RYDBERG_QC_DATA; no independent original-source reconciliation performed in this migration. |
| legacy-hfs | Existing hyperfine catalog at commit 2e2e9d5 | — / 内部记录，无 DOI | Original HYPERFINE_DATA; literature A constants and scaled Rydberg estimates retain their existing values and unresolved source status. |
| legacy-scaling | Existing scaling estimates | — / 内部记录，无 DOI | Original calcRydberg and RYDBERG_QC_TRANSITIONS; approximate single-channel/scaling values, not independently validated state-specific predictions. |
| internal-t2-calibration | T2 internal calibration | — / 内部记录，无 DOI | Original record uses 0.543 ea0 and separately states literature 0.5398(6) ea0. This migration preserves the distinction; calibration rationale and source require independent review. |
| internal-t3-20260908 | T3 internal supplement dated 2026-09-08 | — / 内部记录，无 DOI | Original record specifies an effective F-reduced matrix element 9.19e-5 ea0; not a bare J=0 to J=0 E1 reduced element. |
| this-work-hyperfine-65s | This work: saved 65S zero-field data | — / 内部记录，无 DOI | Existing assets/05.21_yb171_65s_hyperfine.csv and original data card; no new MQDT calculation or original-run audit performed. |

## 需要保留的身份与证据边界

- Kroeze 的准确题名是 **¹⁷¹Yb Reference Data**；v2 于 2026-02-13 修订，PDF 首页日期 2026-02-16。它是汇编，均值、推导及理论采用值必须继续连接到原始文献。
- Kuroda 正式版 DOI 为 **10.1103/mzsv-rckx**。预印本和正式版题名不同，不能根据卷号/页码拼接旧式 DOI。
- Wilson 正式题名确实没有 “in”；预印本题名又不同。引用必须绑定具体版本。
- Aymar 1984 文章是 **odd-parity**；Lehec 2018 是 **even-parity**。Wilson/Saskin 等 174Yb 实验不得直接标成 171Yb 逐态测量。
- NIST 当前已访问版本历史为 **5.12 (2024)**，DOI **10.18434/T4W30F**；泛数据库引用仍不足以证明每个 Yb I 能级/跃迁数据字段。
- 原 Fisk 引用 TIM 46,457(1997) 未能确认。另有相似的 UFFC 44(2),344–354(1997)、候选 DOI10.1109/58.585119，IEEE 页面被机器人验证阻挡；此审计没有把两条强行合并。
- `ref-17`、内部校准、缩放与保存的 65S CSV 属于内部记录；必须保留计算/校准定义，不能借正式文献标题包装为文献实测。

## 低态原始文献索引

| 索引 | 原始文献 | 用途与获取状态 |
|---|---|---|
| qiao-2023-rinp | [Frequency measurement of 6s6p ³P₀,₂−6s7s ³S₁ transitions in ultracold ¹⁷¹Yb atoms referenced to local optical clock](https://www.sciencedirect.com/science/article/pii/S2211379723002322)；Results in Physics 48, 106439 (2023)；10.1016/j.rinp.2023.106439 | primary 171Yb 649/770-nm absolute frequencies and 3P2/3S1 hyperfine constants；未核验可下载的开放 PDF |
| porsev-1999-pra | [Electric-dipole amplitudes, lifetimes, and polarizabilities of the low-lying levels of atomic ytterbium](https://journals.aps.org/pra/abstract/10.1103/PhysRevA.60.2781)；Phys. Rev. A 60, 2781 (1999)；10.1103/PhysRevA.60.2781 | primary ab initio E1 amplitudes / branching-ratio inputs; theory, not measured lifetimes；合法开放 PDF 已访问：https://arxiv.org/pdf/physics/9903004v1 |
| zhou-2020-pra | [Characterization of ytterbium resonance lines at 649 nm with modulation-transfer spectroscopy](https://journals.aps.org/pra/abstract/10.1103/PhysRevA.101.062506)；Phys. Rev. A 101, 062506 (2020)；10.1103/PhysRevA.101.062506 | primary 649-nm spectroscopy and 3S1 HFS；未核验可下载的开放 PDF |
| zhao-2024-pra | [Absolute frequency measurements of the 6s6p ³P₀−5d6s ³D₁ transitions in ¹⁷⁰,¹⁷¹,¹⁷²,¹⁷³,¹⁷⁴,¹⁷⁶Yb by modulation transfer spectroscopy](https://journals.aps.org/pra/abstract/10.1103/PhysRevA.110.042816)；Phys. Rev. A 110, 042816 (2024)；10.1103/PhysRevA.110.042816 | primary 1389-nm isotope-resolved frequencies；未核验可下载的开放 PDF |
| beloy-2012-pra | [Determination of the 5d6s ³D₁ state lifetime and blackbody-radiation clock shift in Yb](https://journals.aps.org/pra/abstract/10.1103/PhysRevA.86.051404)；Phys. Rev. A 86, 051404(R) (2012)；10.1103/PhysRevA.86.051404 | primary 3D1 lifetime; BBR shift result contains derived modeling；未核验可下载的开放 PDF |
| baumann-1985-jpb | [Radiative lifetimes and gJ factors of low-lying even-parity levels in the Yb I spectrum](https://doi.org/10.1088/0022-3700/18/17/001)；J. Phys. B: Atom. Mol. Phys. 18, L601 (1985)；10.1088/0022-3700/18/17/001 | primary even-parity low-state lifetimes / gJ; important 3S1 lifetime provenance；未核验可下载的开放 PDF |
| bowers-1996-pra | [Experimental investigation of excited-state lifetimes in atomic ytterbium](https://journals.aps.org/pra/abstract/10.1103/PhysRevA.53.3103)；Phys. Rev. A 53, 3103 (1996)；10.1103/PhysRevA.53.3103 | primary low-state lifetime experiment；未核验可下载的开放 PDF |
| rambow-1976-pra | [Radiative lifetimes and alignment depolarization cross sections for YbI and II by the Hanle effect in a flowing helium system](https://journals.aps.org/pra/issues/14/2)；Phys. Rev. A 14, 738 (1976)；10.1103/PhysRevA.14.738 | primary Hanle-effect lifetime / collisional depolarization measurement；未核验可下载的开放 PDF |
| burshtein-1974-optspec | Lifetimes of the ³P₁ level of Yb I and the ²P₃/₂,₁/₂ level of Yb II；Optics and Spectroscopy 37, 351 (1974)；DOI 待核对 | original 3P1 / YbII lifetime source candidate；未核验可下载的开放 PDF |
| qiao-2023-apl | Investigation of the 6s6p ³P₂−6s7s ³S₁ transition of ytterbium atoms with modulation-transfer spectroscopy；Applied Physics Letters 122 (2023), article number unresolved；DOI 待核对 | primary 770-nm spectroscopy source candidate；未核验可下载的开放 PDF |
| mishra-2001-jqsrt | Radiative lifetimes of the first excited ³Pᵒ₂,₀ metastable levels in Kr I, Xe I, Yb I and Hg-like atoms；J. Quant. Spectrosc. Radiat. Transfer 69, 769 (2001)；DOI 待核对 | theoretical radiative lifetime source for 171Yb 3P2；未核验可下载的开放 PDF |
| porsev-2004-pra | Hyperfine quenching of the metastable ³P₀,₂ states in divalent atoms；Phys. Rev. A 69, 042506 (2004)；DOI 待核对 | theory of hyperfine quenching；未核验可下载的开放 PDF |

## 下载与人工补全清单

以下为“本次未取得可核验开放 PDF”，不表示已证明只能付费获取。按优先级补全文献：

1. **Fisk 原始条目**：先确认 TIM46,457(1997) 是否存在；如实际目标是 UFFC44(2),344–354(1997)，请提供首页/全文后再纠正条目。
2. **Baumann et al. (1985), JPB18,L601**，DOI10.1088/0022-3700/18/17/001：用于直接核查 3S1 寿命定义与数值。
3. **Qiao et al. (2023), Applied Physics Letters122**：770nm MTS 文献，原汇编文章号不完整；需首页及全文核对 DOI/文章号。
4. **Zhou et al. (2020), PRA101,062506**，DOI10.1103/PhysRevA.101.062506：649nm/3S1 HFS 原始数据。
5. **Zhao et al. (2024), PRA110,042816**，DOI10.1103/PhysRevA.110.042816：1389nm 同位素与分量频率。
6. **Beloy et al. (2012), PRA86,051404(R)**，DOI10.1103/PhysRevA.86.051404：3D1 寿命原始测量。
7. **Burshtein et al. (1974), Opt. Spectrosc.37,351**：3P1 寿命原始扫描，DOI未确认。
8. **Rambow & Schearer (1976), PRA14,738**，DOI10.1103/PhysRevA.14.738；**Bowers et al. (1996), PRA53,3103**，DOI10.1103/PhysRevA.53.3103：低态寿命与测量条件。
9. **Aymar et al. (1984), JPB17,3645**，DOI10.1088/0022-3700/17/18/006：奇宇称 Rydberg 原始数据。
10. **Mishra & Balasubramanian (2001), JQSRT69,769**：3P2 理论寿命源；元数据仍待原文核对。

Qiao Results in Physics48,106439(2023) 的出版社索引明确标注开放许可，应优先从合法开放页面获取；Porsev1999、Okuno2022、Burgers2022、Halter2023、Lehec2018 等已经核验 arXiv PDF 可访问。Kuroda 本地正式版与预印本均已有，无需重复下载；其网络 PDF 抓取失败不等于缺失全文。

所有精确 URL、版本、已有本地路径与 SHA256 见 `references/bibliography-audit.json`。`verifiedURLs` 表示本次访问过的端点；单条 notes 会说明其返回文章元数据、搜索索引、PDF 或仅机器人拦截页，不能只凭字段名判断可读全文。

## 后续原文补充（2026-10-29）

Porsev1999、Porsev2003预印本/2004论文、Beloy2012、Bowers1996官方存档全文已存入项目并完成14张表提取。因此上方人工清单中的 Beloy 与 Bowers 项目已取得，不再是待下载。Bowers 文件名前缀2011为存档年份，正式论文仍为1996；Halter 文件前缀2022为arXiv版本年份，正式论文仍为2023。详细数值/条件/冲突结论见 [low-state-originals.md](low-state-originals.md)。
