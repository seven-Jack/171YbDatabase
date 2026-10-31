# ¹⁷¹Yb 跃迁数据图谱

这是一个静态科研数据与浏览器计算工具。主页保留完整能级图、T1–T7 / R2 共 8 条跃迁，并按“能级图 → 超精细分量 / CG 表 → Rabi 参数、结果与图表”使用。入口是根目录 `index.html`，正式代码在 `src/`，科学记录在 `data/`。`source_package/` 是早期导出记录。项目继续通过公开 GitHub Pages 展示。

- 网页：https://seven-Jack.github.io/171YbDatabase/
- 源码：https://github.com/seven-Jack/171YbDatabase

## 新下载原文核对（2026-10-30）

已收到1–8及10号PDF，编号原件未改动，第9篇仍缺。新增36张完整表、688条记录，累计71表1645条；最新[审计报告](references/audits/source-followup-20261030.md)、[提取入口](data/literature/source-followup-2026-10-30/README.md)及[剩余缺文献](references/missing-downloads.md)。

当前数据版本**2026.10.30.1**：3P2质心工作值改为原文五分量Ritz派生，协方差未知而不填造精确1σ；8.9s明确为统计平均率倒数；离子芯频率采用Fisk原始测量。主图布局和保存65SCSV未改，未重算MQDT，未发布。

[低能级Rabi–power核查](references/audits/low-state-rabi-validation-20261030.md)覆盖399、556、649、770和1389nm的指定mF/偏振通道、功率/束腰正反算及原文数据链。五条均与所列理论基准相容；这不代表独立实验标定，578nm的既有差异和507nm的M2边界继续保留。


## 文献与数据来源核查（2026-10-29 至 30，本地未发布）

- [文献入口](references/README.md)：22份PDF版本文件、完整书目索引与[待补全文清单](references/missing-downloads.md)。原paper库未修改。
- [提取数据](data/literature/README.md)：35张表、957条带单位、误差、态/同位素条件和页码的记录；包含汇编、理论及比较数据，不等于957个独立测量。
- [订正报告](references/audits/data-source-audit-2026-10-29.md)：131个能级/跃迁物理量全部有审计处置，另审查HFS、保存65S和历史模型。T2默认d采用0.5398(6)ea₀；源内冲突和不明内部值明确保留待核。

首轮数据版本为2026.10.29.1。states表和生产数组已停止输出无合法锚点的寿命、C₆和阻塞半径；R2历史字段仍带未验证标签。旧值和原文保留于审计快照；保存65S CSV字节不变，未运行MQDT。文献全文与内部工件仅在本地归档，不进入网页构建包。

## 本地预览与检查

M1输入定义已接入计算区的“输入定义”折叠面板：默认沿用原子处分量功率及1/e²强度半径，可录入上游功率与η、线偏振总功率与分量分配、或强度直径。线偏振手动占比中，单个σ分量限0–50%，π限0–100%；无效值拒绝计算，不自动截断。下方始终显示规范化Pq/w₀；求功率和求尺寸的结果按当前录入定义显示。图轴仍是原子处Pq及可选2Pq参考视图，不对功率重复拆分。配置导出为v2并继续兼容v1，导入使用当前原子数据重算；输入元数据不构成实验标定。原子数据和公式版本未变。

M2证据状态首批接入578 nm（T3）：结果卡的“查看核查详情”进入数值与来源区，分别显示原文定位、公式与通道核查、条件比较、独立实验验证。Xu原子率支持、Offer固定文献对照与待补证据默认可展开；1070 mW阶段可用功率、338 mW拟合有效功率和22 kHz模型拟合耦合分别标注，不将条件接近当成验证通过。原采用值的`internal-t3-20260908`出处保持不变，历史生成记录仍待补。当前F/mF/偏振、输入定义和有效性更新证据上下文；文献对照保持其固定假设，不随当前P/w变化。其他跃迁显示本轮尚无接入记录或模型不适用，不借用T3结论。

公开证据摘要独立存于`data/evidence.json`，生成`src/data/generated-evidence.js`，拥有独立证据版本，不改变原子数据及公式版本。修改摘要后运行`npm run evidence:export`；`npm run evidence:validate`、`npm run check`及构建会校验字段、链接和生成文件一致性。原文与完整审计仍保留在本地`references/`和`data/literature/`，不进入网页产物。

M3图表读数已接入：曲线图在18 CSS像素内吸附最近的可见曲线，显示真实模型值与对应束腰；热图读取指向位置的模型值。点击或触屏可固定读数，离开后保留，点击另一点替换，清除按钮或Esc取消。曲线纵轴、热图色标和两图读数共用所选频率单位。固定读数保留原子处分量功率、1/e²强度半径及频率数值，单位/视图变化只重排显示；有效P/w变化可保留同模型对照，更换通道、矩阵元、输入定义或输入无效会清除旧读数，隐藏或修改被固定曲线也会清除该点。来源小标仍只归于矩阵元输入，不将图表读数冒充文献测量。

“聚焦当前工作点”将曲线与热图的显示范围移到规范化后的当前Pq、w₀和Ω/2π附近；“恢复原视图”返回原范围和进入聚焦前的线性／对数模式，修改图轴最大值仍可用，清空上限恢复自动范围。更改工作点或输入上下文后退出聚焦视图。聚焦不回写参数、不改变曲线可见性、三向求解或M2证据结论；零功率/零耦合及无效输入不能聚焦。主跃迁图、原子参数及物理核未改动。

需要 Node.js 22 或更新的受支持版本。开发依赖只用于检查，网站运行无需前端框架或服务器计算。

```sh
npm ci
npm run check
npm run preview
```

打开 <http://localhost:8766/index.html> 预览实际 `dist/` 构建产物。预览服务仅监听本机，使用 HTTP/1.1 并禁用缓存；文献原件不在可访问范围内。修改源码后重新运行 `npm run check` 更新构建。端口被占用时先停止对应预览，或用 `PORT=8767 npm run preview` 指定其他端口。ES Modules / JSON 需通过 HTTP，不能双击 `file://`。浏览器回归检查见 `docs/testing.md`：先 `npx playwright install chromium`，再 `npm run test:e2e`，测试会在 Pages 仓库子路径访问实际 `dist/`。

`npm run check` 执行数据校验、预检、Node 测试、干净构建及产物检查。构建仅清理本仓库 `dist/`，复制 `index.html`、`src/`、运行时 `data/` 和 `assets/`；排除本地 `data/literature/` 及 `references/`，生成版本与文件 hash 清单。GitHub Pages 仅发布 `dist/`。`wrangler.jsonc` 是旧 Cloudflare 配置，不参与当前发布。

Git公开跟踪结构化文献数据、来源索引、哈希、核查脚本和报告。原始PDF、全文文本、论文页截图及Notebook原件由`.gitignore`保留在本地。新检出缺少PDF时只将原件字节校验标为`unavailable`，其余数值和保护哈希检查照常运行；把PDF放到索引指定路径后会自动核对，原件被改动仍会失败。详见[文献归档约定](references/README.md)。

## 后续同步与网页发布

检查、提交和推送分别执行。先审阅 diff，再明确选择具体文件，避免将其他工作顺带提交。

```sh
npm run sync -- plan
npm run sync -- check
npm run sync -- commit --message "说明具体变化" --files index.html src/main.js --dry-run
# 核对精确文件清单后，去掉 --dry-run 创建本地提交；或使用已审阅的 --staged。
npm run sync -- push
```

`commit` 先运行检查，只暂存明确列出的文件，不接受整个目录；不会自动推送。`push` 推送当前已审阅分支，先检查工作区和远端祖先关系，不会创建 PR 或合并。旧式只给一句提交说明的调用会提示新用法，不再隐式提交并发布。

PR 和工作分支运行 `.github/workflows/check.yml`，覆盖实际构建产物及浏览器路径。main 的 Pages 工作流复用同一检查结果，再部署已经检查的文件；只有部署 job 获得 Pages 写权限。需要有效 GitHub 身份时可用 `gh auth login`；失效的 `GH_TOKEN` 覆盖应先处理。

只有推送 main 且工作流成功才会更新公开站。本地保存、创建工作分支和生成 `dist/` 不会发布。当前本地工作版本为 0.3.3，是否已经发布以 Actions、线上 commit 和数据版本核对为准。

## 65S 文献核查（2026-10-08）

网页参考文献及 `#ryd65HyperfineData` 给出保存数据与适用条件。2026-10-08 的历史核查记录指出：Muniz 等 PRX Quantum 6, 020334 (2025) 作者预印本 v2 的 IV、附录 D / Fig. 7，报告 65³S₁、F=3/2、mF=−3/2、301.9 nm 激发及典型光镊条件下的 65(3) μs 人口寿命。现有估算未据此校准；不能将该实验条件或其他 n/F 的结果自动移入当前条目。Peper 的 ν≈54.28 门实验及 Ma 的 6s59s 数据同样不能直接移入 65S。d=0.0376 ea₀ 为保存的本工作计算记录，按电子态 J 级约化量使用。此次工程迁移不等于重新完成原文或实验核查。

## 数据使用范围

核心能级图包含 6s65s ³S₁；点击 ³P₀→65³S₁ 激发线会自动填写参数并跳转到通用超精细计算器，可选择 F/mF 和偏振。独立里德堡图谱已移除，R1–R7 数据表保留。65S 波长和寿命沿用现有估算；矩阵元标为 This work；d=0.0376 ea₀ 明确按电子态 J 级约化量使用，尚未独立验证。65S 的 F 分组位置仅为示意，不使用标度估算的超精细常数表示真实劈裂。

`npm test` 预检 HTML / 正式模块并运行 Node 数据、计算、状态和构建测试；`npm run test:e2e` 另查实际页面。检查内容和实际通过范围分别记录，不能用旧的独立模块测试代表正式入口。项目没有独立 lint 或 typecheck 命令。

- 核心跃迁表、里德堡示例路径和参考文献混合了文献数据、内部参数与简化估算。逐行查看“来源”列，不要把整张表视为同一精度的数据集。
- 里德堡态参数表的能量/尺度仍是单通道示意；寿命、C₆与阻塞半径因锚点来源问题已停止在该表输出。历史模型没有完整MQDT、态追踪和不确定度传播。
- R5（³P₀→65³D₂）在当前模型中是 E1 禁戒路径；页面没有为其他多极通道提供经核查的矩阵元。
- Rabi 图根据当前所选矩阵元和光束参数计算。运行成功只说明页面计算链路正常，不等于模型得到实验验证。

磁四极 M2 的宇称选择定则与页面的 ¹S₀→³P₂ 示例一致。关于多极跃迁与选择定则，可参见 [NIST Atomic Spectroscopy](https://physics.nist.gov/Pubs/AtSpec/node17.html) 和 [NIST ASD 帮助](https://physics.nist.gov/PhysRefData/ASD/Html/lineshelp.html)。

## 维护与版本

软件版本唯一来源是 `package.json`。预检和构建会生成被 Git 忽略的 `src/version.js`，供源预览和发布页面共享；新检出先运行 `npm run check`。数据源、公式与显示版本分别追溯；构建的 `build-info.json` 和 `artifact-manifest.json` 记录实际文件、提交及 hash。配置 JSON 用于保存跃迁、通道、输入、单位和版本，跨版本恢复应检查差异。

参阅 `CONTRIBUTING.md`、`CHANGELOG.md`、`docs/architecture.md`、`docs/data-policy.md` 和 `docs/licensing-review.md`。原科学数据库许可仍待维护者确认；新增第三方光谱色匹配数据单独保留原元数据和署名，不扩大其许可到整库。
