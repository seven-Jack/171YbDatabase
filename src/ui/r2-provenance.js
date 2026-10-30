// Display-only provenance metadata; never used as a calculation input.
export const R2_PROVENANCE=Object.freeze({
  title:'R2来源追溯与误差边界',
  scope:'以下两段记录只证明网站归属历史，不是原始生成证据；本地追溯未定位该矩阵元的原始计算工件。',
  inputStatement:'0.0376 ea₀ 仍为原输入；网站声明按电子态 J 级约化量使用，该约化层级与数值尚未独立验证。',
  history:Object.freeze([
    Object.freeze({
      commit:'ea024f99421a2a5e7756b2dcc310c5f1891962b5',
      path:'index.html',lines:'2458–2463',
      sha256:'35e18ed90b5df53dabc82642e97227a78ec7807ffe5294b10ff2175fb5806e3e',
      excerpt:'理论估算 (n*⁻³/² 标度, Peper 2025)',
      summary:'最早可见网站记录已有 R2、³P₀→65³S₁ 及 0.0376；当时标为标度估算，未附生成工件。'
    }),
    Object.freeze({
      commit:'f10576c649ffbf17d9c13e4d91f374eb130e0df9',
      path:'README.md',lines:'24',
      sha256:'d70fc709233029391137b45f06f97cb629414d7014de0f907e18b4785d9dc279',
      excerpt:'d=0.0376 ea₀ 由用户确认来自本工作计算，标注 This work',
      summary:'后续网站说明记录用户确认并改标 This work；此归属说明没有附原始 Notebook / Run。'
    })
  ]),
  conditions:'终态的实际混合态根 / branch、F / mF、B 及辐射温度 T 均未知；不能用页面的态标签或交互所选 F / mF 替代原计算条件。',
  artifacts:'原始 Notebook / Run、计算代码版本、输入输出工件及哈希未定位；网站历史文件哈希不能替代计算工件哈希。',
  totalUncertainty:'未知；总不确定度未建立，未赋予数值误差。',
  uncertainties:Object.freeze([
    Object.freeze({label:'实验输入误差',status:'未知；未找到该矩阵元所用实验输入与校准误差记录。'}),
    Object.freeze({label:'数值收敛',status:'未知；未找到绑定该矩阵元的步长、边界或收敛记录。'}),
    Object.freeze({label:'模型截断',status:'未知；未找到绑定该矩阵元的基组、通道覆盖及截断误差记录。'}),
    Object.freeze({label:'未知系统误差',status:'未知；尚无足够证据约束模型、条件或其他系统误差。'})
  ]),
  validationBoundary:'来源文字与哈希核对属于证据身份检查，不能验证 R2 矩阵元；寿命条件拟合、其他 Run 的数值检查均不能作为该矩阵元的独立理论验证。',
  excludedRuns:Object.freeze([
    Object.freeze({
      run:'R007',
      path:'Calculation/runs/R007_yb171_lifetime_decay_literature/results/goal/20261024T103010Z/m0_target_acceptance.json',
      lines:'22–82',sha256:'8f69b01172956c45150227ff912a4ef321b29206c2f73cf28c67e8cf5e45e0c8',
      summary:'目标实际 ν=53.2997195814，合同明确不是 65S；不能移用其寿命拟合、分支或数值验收。'
    }),
    Object.freeze({
      run:'R008',
      path:'Calculation/runs/R008_yb171_65s_lifetime_reproduction/protocol.md',
      lines:'5–10',sha256:'c73b5f3a36db5ca3d227f5f609c25ca204133976f986f461d42ab08bfef91e01',
      summary:'合同为 65S、F=3/2、mF=−3/2 的有限集合寿命模型；未找到其到 0.0376 的来源链接，不能借用其 B / T 假设、模型或验收。'
    })
  ])
});


// Reviewed context and a proposed validation contract; not calculation inputs.
export const R2_EVIDENCE_EXTENSION=Object.freeze({
  reviewedAt:'2026-10-27',
  status:'原始计算来源仍未定位；以下原文只支持各自声明的范围。',
  searchUpdate:'本轮增量只读检索83个文件、15条本地历史，未找到生成链；旧导出引用的 knowledge_base.md 未定位。此结论不覆盖未检索的私人目录、二进制库或压缩档。',
  sources:Object.freeze([
    Object.freeze({
      title:'Muniz et al. · arXiv:2411.11708v2',
      url:'https://arxiv.org/html/2411.11708v2',
      locator:'Fig.1(a)、§IV.2、附录D / Fig.7',
      supports:'论文实验标签为65³S₁、F=3/2、mF=−3/2，B=518 G，激光301.9 nm；典型陷阱在位时人口返回拟合寿命为65(3) µs。',
      limit:'相关实验条件，不是本页矩阵元的原始计算来源；人口寿命不等于相干时间，也不是本页寿命输入。不能只因65S标签或波长相近而转移分支、磁场、温度或误差。'
    }),
    Object.freeze({
      title:'Peper et al. · arXiv:2406.01482v2',
      url:'https://arxiv.org/html/2406.01482v2',
      locator:'§III.1、V；附录A.5–A.6',
      supports:'原文按ν、F、L识别态；门演示选择ν≈54.28、L=0、F=1/2。附录描述多通道径向/角向矩阵元与数值处理方法。',
      limit:'方法和态身份对照，不是本页65S矩阵元的生成记录或数值验证；不能把该门态结果直接移用到本页未绑定根与条件的输入。'
    }),
    Object.freeze({
      title:'Kroeze et al. · arXiv:2509.04416v2',
      url:'https://arxiv.org/html/2509.04416v2#S6.SS3',
      locator:'§6.3，式(78)–(81)',
      supports:'给出E1 / 旋波近似下的通道矩阵元、Gaussian光束中心场强及Rabi换算约定。',
      limit:'仅为固定模型换算方法依据，不为本页R2矩阵元提供原始Run或独立标定。总功率与偏振分量功率必须统一，不能重复计入偏振投影。'
    })
  ]),
  propagation:Object.freeze({
    title:'参数传播方法（有条件适用，未给本页误差赋值）',
    prerequisite:'仅用于固定态与固定通道的E1 / 旋波模型、圆Gaussian光束；原子位于束腰中心，波包尺度远小于束腰。要求 |d_eff|>0、P_q>0、w₀>0，且相对标准不确定度足够小。',
    definitions:'f_R=Ω/(2π)；w₀为1/e²强度半径；P_q为原子处所选偏振分量功率，d_eff为该固定通道矩阵元，不再包含同一个偏振振幅权重。固定单位约定下C为有量纲常数。',
    model:'f_R = C |d_eff| √P_q / w₀',
    uncorrelated:'输入互不相关时，一阶近似：u_par²(f_R)/f_R² ≈ u²(d_eff)/|d_eff|² + u²(P_q)/(4P_q²) + u²(w₀)/w₀²。',
    correlated:'相关输入：令x=(|d_eff|, P_q, w₀)，g=(1, 1/2, −1)ᵀ，Σ_rel,ij=cov(x_i,x_j)/(x_i x_j)，则 u_par²(f_R)/f_R² ≈ gᵀΣ_rel g。',
    boundary:'u_par只表示本模型内参数传播的合成标准不确定度。输入误差/协方差缺失时不填零、不输出总误差；零功率或零矩阵元不能使用相对形式。角因子混合、模型截断、实验条件差异另列，不自动作为独立随机量平方和。',
    temperature:'本页固定态Rabi换算没有温度输入。原子运动温度、辐射环境温度与有效寿命条件应分别记录，不能据未知T对矩阵元臆造修正或误差。',
    url:'https://www.nist.gov/pml/nist-technical-note-1297/nist-tn-1297-appendix-law-propagation-uncertainty',
    locator:'NIST TN1297 附录A，式(A-3)：含协方差的一阶传播'
  }),
  validation:Object.freeze([
    Object.freeze({gate:'生成证据门',status:'未完成',action:'需要原始Notebook/Run或脚本、代码版本、输入输出哈希；记录初末态、离子芯阈值、实际ν、branch及态重叠、B（单位）、F/mF适用性、q和J/F/完整通道约化约定。不得用页面当前选择代替原条件。'}),
    Object.freeze({gate:'数值门',status:'待原始工件齐备后另行授权执行',action:'固定同一态身份，分别改变步长、径向边界、公共积分域、归一化与基组/通道截断；保留原结果和坏点，记录Δd。验收阈值须在Run合同预先设定，不事后放宽。当前没有完成这些检查。'}),
    Object.freeze({gate:'模型门',status:'未验证',action:'核对有限场混合与遗漏通道，区分同模型收敛、不同模型差异与模型准确度；n*标度或寿命条件拟合不构成独立理论验证。'}),
    Object.freeze({gate:'外部对照门',status:'未验证',action:'需要匹配的态、B、偏振、原子处P_q/w₀标定、空间/运动条件及测得Rabi数据。若d由同一组Rabi数据反演，不能再以该组吻合自称独立验证；也不能用总有效寿命反推出一条光学支路的d。'})
  ])
});
