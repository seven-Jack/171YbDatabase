# ¹⁷¹Yb 跃迁数据图谱

这是一个静态科研数据与浏览器计算工具。主页保留完整能级图、T1–T7 / R2 共 8 条跃迁，并按“能级图 → 超精细分量 / CG 表 → Rabi 参数、结果与图表”使用。入口是根目录 `index.html`，正式代码在 `src/`，科学记录在 `data/`。`source_package/` 是早期导出记录。项目继续通过公开 GitHub Pages 展示。

- 网页：https://seven-Jack.github.io/171YbDatabase/
- 源码：https://github.com/seven-Jack/171YbDatabase

## 本地预览与检查

需要 Node.js 22 或更新的受支持版本。开发依赖只用于检查，网站运行无需前端框架或服务器计算。

```sh
npm ci
npm run check
python3 -m http.server 8765
```

打开 `http://127.0.0.1:8765/` 预览源站，或 `http://127.0.0.1:8765/dist/` 预览构建产物；ES Modules / JSON 需通过 HTTP，不能双击 `file://`。浏览器回归检查见 `docs/testing.md`：先 `npx playwright install chromium`，再 `npm run test:e2e`，测试会在 Pages 仓库子路径访问实际 `dist/`。

`npm run check` 执行数据校验、预检、Node 测试、干净构建及产物检查。构建仅清理本仓库 `dist/`，复制 `index.html`、`src/`、`data/` 和 `assets/`，生成版本与文件 hash 清单。GitHub Pages 仅发布 `dist/`。`wrangler.jsonc` 是旧 Cloudflare 配置，不参与当前发布。

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

只有推送 main 且工作流成功才会更新公开站。本地保存、创建工作分支和生成 `dist/` 不会发布。当前本地工作版本为 0.2.0，是否已经发布以 Actions、线上 commit 和数据版本核对为准。

## 65S 文献核查（2026-10-08）

网页参考文献及 `#ryd65HyperfineData` 给出保存数据与适用条件。2026-10-08 的历史核查记录指出：Muniz 等 PRX Quantum 6, 020334 (2025) 作者预印本 v2 的 IV、附录 D / Fig. 7，报告 65³S₁、F=3/2、mF=−3/2、301.9 nm 激发及典型光镊条件下的 65(3) μs 人口寿命。现有估算未据此校准；不能将该实验条件或其他 n/F 的结果自动移入当前条目。Peper 的 ν≈54.28 门实验及 Ma 的 6s59s 数据同样不能直接移入 65S。d=0.0376 ea₀ 为保存的本工作计算记录，按电子态 J 级约化量使用。此次工程迁移不等于重新完成原文或实验核查。

## 数据使用范围

核心能级图包含 6s65s ³S₁；点击 ³P₀→65³S₁ 激发线会自动填写参数并跳转到通用超精细计算器，可选择 F/mF 和偏振。独立里德堡图谱已移除，R1–R7 数据表保留。65S 波长和寿命沿用现有估算；矩阵元标为 This work；d=0.0376 ea₀ 明确按电子态 J 级约化量使用，尚未独立验证。65S 的 F 分组位置仅为示意，不使用标度估算的超精细常数表示真实劈裂。

`npm test` 预检 HTML / 正式模块并运行 Node 数据、计算、状态和构建测试；`npm run test:e2e` 另查实际页面。检查内容和实际通过范围分别记录，不能用旧的独立模块测试代表正式入口。项目没有独立 lint 或 typecheck 命令。

- 核心跃迁表、里德堡示例路径和参考文献混合了文献数据、内部参数与简化估算。逐行查看“来源”列，不要把整张表视为同一精度的数据集。
- 里德堡态参数表使用单通道量子亏损和幂律标度；寿命、C₆ 与阻塞半径是示意估算，不适合作为实验设定或逐态预测。它没有包含完整 MQDT、态追踪和不确定度传播。
- R5（³P₀→65³D₂）在当前模型中是 E1 禁戒路径；页面没有为其他多极通道提供经核查的矩阵元。
- Rabi 图根据当前所选矩阵元和光束参数计算。运行成功只说明页面计算链路正常，不等于模型得到实验验证。

磁四极 M2 的宇称选择定则与页面的 ¹S₀→³P₂ 示例一致。关于多极跃迁与选择定则，可参见 [NIST Atomic Spectroscopy](https://physics.nist.gov/Pubs/AtSpec/node17.html) 和 [NIST ASD 帮助](https://physics.nist.gov/PhysRefData/ASD/Html/lineshelp.html)。

## 维护与版本

软件版本唯一来源是 `package.json`。预检和构建会生成被 Git 忽略的 `src/version.js`，供源预览和发布页面共享；新检出先运行 `npm run check`。数据源、公式与显示版本分别追溯；构建的 `build-info.json` 和 `artifact-manifest.json` 记录实际文件、提交及 hash。配置 JSON 用于保存跃迁、通道、输入、单位和版本，跨版本恢复应检查差异。

参阅 `CONTRIBUTING.md`、`CHANGELOG.md`、`docs/architecture.md`、`docs/data-policy.md` 和 `docs/licensing-review.md`。原科学数据库许可仍待维护者确认；新增第三方光谱色匹配数据单独保留原元数据和署名，不扩大其许可到整库。
