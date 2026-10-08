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

## 数据使用范围

里德堡图谱新增“超精细 / mF 图”和“原有示例路径 R1–R7”两个视图。新图默认 π，可切换 σ⁺ / σ⁻；包含三电子态、四个 F 组及十个 mF 态。`assets/rydberg-data.js` 定义态与允许通道，`assets/rydberg-diagram.js` 绘制 SVG 并切换箭头，CSS 复用页面主题变量。所有布局偏移均为示意 SVG 坐标，零场同一 F 内的 mF 态简并，图中 F 排序不作为实测能量结论。302 nm 使用近似值，现有 R2 的更精确数值属于理论估算。箭头不编码矩阵元或 Rabi 频率。

`npm test` 同时检查原页面内联脚本语法、标识符唯一性、十态结构和三种偏振的全部允许跃迁。项目没有独立 lint 或 typecheck 命令。

- 核心跃迁表、里德堡示例路径和参考文献混合了文献数据、内部参数与简化估算。逐行查看“来源”列，不要把整张表视为同一精度的数据集。
- 里德堡态参数表使用单通道量子亏损和幂律标度；寿命、C₆ 与阻塞半径是示意估算，不适合作为实验设定或逐态预测。它没有包含完整 MQDT、态追踪和不确定度传播。
- R5（³P₀→65³D₂）在当前模型中是 E1 禁戒路径；页面没有为其他多极通道提供经核查的矩阵元。
- Rabi 图根据当前所选矩阵元和光束参数计算。运行成功只说明页面计算链路正常，不等于模型得到实验验证。

磁四极 M2 的宇称选择定则与页面的 ¹S₀→³P₂ 示例一致。关于多极跃迁与选择定则，可参见 [NIST Atomic Spectroscopy](https://physics.nist.gov/Pubs/AtSpec/node17.html) 和 [NIST ASD 帮助](https://physics.nist.gov/PhysRefData/ASD/Html/lineshelp.html)。
