# ¹⁷¹Yb 跃迁数据图谱

这是一个静态网页，源码入口是仓库根目录的 `index.html`。`source_package/` 是早期导出记录，不是当前网页源码，也不会同步到仓库。项目采用公开 GitHub 仓库和 GitHub Pages 发布，无需登录即可查看。

- 网页：https://seven-Jack.github.io/171YbDatabase/
- 源码：https://github.com/seven-Jack/171YbDatabase

## 本地预览与检查

在项目目录运行 `python3 -m http.server 8765`，打开 `http://127.0.0.1:8765/`。运行 `npm test` 检查 HTML 标识符是否重复以及内联脚本语法。检查脚本不替代浏览器交互检查或科学数据核查。

运行 `npm run build` 会将唯一需要发布的 `index.html` 复制到 `dist/`。GitHub Pages 仅发布这个构建目录。`wrangler.jsonc` 是此前 Cloudflare 方案的保留配置，当前发布流程不使用它。

## 后续同步与网页发布

本地修改 `index.html` 后，运行 `npm run sync -- "本次修改说明"`。该命令先检查远端是否有尚未合入的更新，再检查网页、构建、提交并推送到 `origin/main`。需要有效的 GitHub 登录；可在终端运行 `gh auth login` 恢复登录。如果环境设置了已失效的 `GH_TOKEN`，需要先移除该覆盖设置。远端出现分歧时命令会停止，请先处理远端更新。推送失败不会删除本地提交，可在恢复连接后重试。

每次推送到 `main` 后，`.github/workflows/pages.yml` 自动执行检查、构建和网页部署。在仓库的 Actions 页面查看 `Publish website` 是否成功；成功后固定网址展示新版本。检查或部署失败时查看日志，网页不会因为本地保存文件而自动更新。

首次启用：仓库 Settings → Pages → Build and deployment → Source 选择 GitHub Actions。网站和仓库均公开，发布前应确认修改内容适合公开。已有暂存修改或远端更新未合入时，同步命令会停止，避免顺带提交其他文件。

## 65S 文献核查（2026-10-08）

网页 `#sec65Audit` 给出逐项核查与原文链接。Muniz 等 PRX Quantum 6, 020334 (2025) 的作者预印本 v2，正文 IV、附录 D / Fig. 7，直接报告 65³S₁、F=3/2、mF=−3/2，301.9 nm 激发及典型光镊条件下 65(3) μs 人口寿命。计算器仍沿用旧估算，尚未据此校准；d=0.0376 ea₀ 的文献支持与约化约定未确认。Peper 的 ν≈54.28 门实验及 Ma 的 6s59s 数据不能直接移入 65S。

## 数据使用范围

核心能级图包含 6s65s ³S₁；点击 ³P₀→65³S₁ 激发线会自动填写参数并跳转到通用超精细计算器，可选择 F/mF 和偏振。独立里德堡图谱已移除，R1–R7 数据表保留。65S 波长、矩阵元和寿命沿用现有估算；d=0.0376 ea₀ 明确按电子态 J 级约化量使用，尚未独立验证。65S 的 F 分组位置仅为示意，不使用标度估算的超精细常数表示真实劈裂。

`npm test` 同时检查原页面内联脚本语法、标识符唯一性、十态结构和三种偏振的全部允许跃迁。项目没有独立 lint 或 typecheck 命令。

- 核心跃迁表、里德堡示例路径和参考文献混合了文献数据、内部参数与简化估算。逐行查看“来源”列，不要把整张表视为同一精度的数据集。
- 里德堡态参数表使用单通道量子亏损和幂律标度；寿命、C₆ 与阻塞半径是示意估算，不适合作为实验设定或逐态预测。它没有包含完整 MQDT、态追踪和不确定度传播。
- R5（³P₀→65³D₂）在当前模型中是 E1 禁戒路径；页面没有为其他多极通道提供经核查的矩阵元。
- Rabi 图根据当前所选矩阵元和光束参数计算。运行成功只说明页面计算链路正常，不等于模型得到实验验证。

磁四极 M2 的宇称选择定则与页面的 ¹S₀→³P₂ 示例一致。关于多极跃迁与选择定则，可参见 [NIST Atomic Spectroscopy](https://physics.nist.gov/Pubs/AtSpec/node17.html) 和 [NIST ASD 帮助](https://physics.nist.gov/PhysRefData/ASD/Html/lineshelp.html)。
