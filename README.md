# ¹⁷¹Yb 跃迁数据图谱

这是一个静态网页，源码入口是仓库根目录的 `index.html`。`source_package/` 是早期导出记录，不是当前网页源码，也不会同步到仓库。仓库保存在个人 GitHub 私有库中；计划使用 Cloudflare Workers 和 Access 让 TaiyiQ 成员登录后访问网页。

## 本地预览与检查

在项目目录运行 `python3 -m http.server 8765`，打开 `http://127.0.0.1:8765/`。运行 `npm test` 检查 HTML 标识符是否重复以及内联脚本语法。检查脚本不替代浏览器交互检查或科学数据核查。

运行 `npm run build` 会将唯一需要发布的 `index.html` 复制到 `dist/`。`wrangler.jsonc` 已关闭公开的 `workers.dev` 路由和预览 URL；在 Cloudflare Access 完成 GitHub 身份提供方及 TaiyiQ 组织成员策略之前，不应开启公开路由。访问策略由 Cloudflare 账号管理，不能只靠仓库配置文件声明。

## 数据使用范围

- 核心跃迁表、里德堡示例路径和参考文献混合了文献数据、内部参数与简化估算。逐行查看“来源”列，不要把整张表视为同一精度的数据集。
- 里德堡态参数表使用单通道量子亏损和幂律标度；寿命、C₆ 与阻塞半径是示意估算，不适合作为实验设定或逐态预测。它没有包含完整 MQDT、态追踪和不确定度传播。
- R5（³P₀→65³D₂）在当前模型中是 E1 禁戒路径；页面没有为其他多极通道提供经核查的矩阵元。
- Rabi 图根据当前所选矩阵元和光束参数计算。运行成功只说明页面计算链路正常，不等于模型得到实验验证。

磁四极 M2 的宇称选择定则与页面的 ¹S₀→³P₂ 示例一致。关于多极跃迁与选择定则，可参见 [NIST Atomic Spectroscopy](https://physics.nist.gov/Pubs/AtSpec/node17.html) 和 [NIST ASD 帮助](https://physics.nist.gov/PhysRefData/ASD/Html/lineshelp.html)。
