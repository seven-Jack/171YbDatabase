# 启动加载与恢复

本轮继续使用原生 ES Modules 和轻量构建，不增加运行或开发依赖。主 `index.html`、主跃迁图、科学数据和正式物理公式不变。构建产物的 head 增加惰性 JSON 依赖清单和一个协议检查入口：只有 HTTP／HTTPS 才创建 `modulepreload` 提示，提前请求实际启动依赖；file:// 不创建预加载链接、不请求模块。此机制不是打包合并，不以减少请求数作为成果。

## 构建依赖预加载

`scripts/build.cjs` 从 `src/main.js` 的静态 import／re-export 递归收集本地 `.js` 模块，去重并稳定排序；动态 import 不展开，未挂载的模块不因为存在于 `src/` 就被预加载。原 HTML 实际通过动态 import 加载 `src/bootstrap.js` 时，将该启动入口也加入预加载。

路径必须是留在 `src/` 内的相对模块路径；缺文件、外部／根相对／内建模块以及文件或目录 symlink 均拒绝。构建先核对启动依赖，再替换旧的 `dist/`。清单保留相对 Pages 路径、查询及片段标识；JSON 中的 `<` 与 Unicode 行分隔符转义，防止 URL 关闭数据 script。注释、字符串、模板文字和正则表达式中的示例不作为静态导入。

只有 `dist/index.html` 的 head 注入带明确起止注释的生成块，位置在 charset／meta／title 元数据之后、首个 stylesheet 之前，使经典条件入口不必先等待前置样式表；最小构建fixture没有stylesheet时退回head末尾或首script前。去除该块后应逐字节恢复源 HTML，图内标记不变，模块内容继续按原字节复制。manifest 对实际新增 head 内容计算哈希；产物检查显式解析惰性 JSON 清单，逐项校验文件、类型、去重和 Pages 路径，不把数据 script 中的资源当作未引用内容忽略。预加载清单随实际主入口 import 图变化，新增导出功能的依赖不需要维护第二份硬编码清单。

## 运行状态与恢复

`startApplication()` 对同一 document 的并发和已成功重复调用共享一个启动 Promise，避免重复运行 `main.start()`。失败后保留原错误状态、原始 console 错误与手动恢复入口；不自动重试，也不继续提供不完整的计算结果。

5 秒仍未完成时显示简短等待提示；15 秒仍在加载时显示“重新加载”，按钮执行真正的页面 reload，不在部分初始化的 document 上再运行一遍主模块。成功或失败都会清理两个计时器并移除慢加载按钮。原 HTML 的失败按钮 `appRetry` 和 file:// 提示保持原处理方式。技术异常的本机路径或堆栈不写入产品提示。

## 技术观测接口

这些接口用于诊断与自动验收，不改变物理输入、公式或证据状态：

| HTML dataset | 定义 |
|---|---|
| `appStage` | `loading-main`、`initializing`、`ready` 或 `error` |
| `appFailedStage` | 失败发生于主模块加载或初始化阶段，仅错误时提供 |
| `appStartupMs` | 本次 `startApplication` 内部从开始至结束的耗时 |
| `appImportMs` | 从启动函数开始到主模块 import 完成；预加载可在此之前已启动 |
| `appInitMs` | 主模块 import 完成到初始化结束的耗时 |
| `appNavigationReadyMs` | 默认浏览器时钟下，从本次导航起点到就绪的耗时；只在成功就绪后提供 |

同时提供 `yb171:startup-start`、`yb171:main-imported`、`yb171:ready`／`yb171:startup-error` Performance marks，成功时记录 `yb171:startup` measure。可选 Performance API 失败不应改变应用启动成败。

`appStartupMs` 只覆盖启动函数内部，不能当作整页加载耗时；性能比较应优先采用一致方法测量导航到就绪，同时记录资源请求失败、HTTP 状态与浏览器异常。对比应使用相同设备、视口、缓存与网络条件，保存各次原始观测，不从一次快加载推断普遍提升。

## 验收及结论边界

单元／构建测试覆盖：只收集实际静态依赖、循环去重、动态及无关模块排除、Pages 前缀、缺文件／路径逃逸／symlink 拒绝、JSON/script 结束符防护、仅 HTTP(S) 创建链接、file 协议提前返回、生成确定性、源 HTML 与图形不变；启动覆盖一次初始化、阶段计时、慢加载手动恢复、成功后计时器清理与错误恢复。

中间版本曾直接生成静态 `modulepreload` 链接，导致 file:// 协议分支运行前就发起模块请求，原有 file 启动保护在三个视口失败。该回归的原因已定位，最终改为上述协议条件清单入口，保留原 file 启动测试。这个本轮构建回归与此前公网 10 秒就绪断言超时是两件独立的事，不能用前者的订正解释后者。

浏览器及受控网络对比由本轮完整验收统一运行，结果以保存报告为准，不在执行前填入性能提升数值。此前公网有两个在 10 秒页面就绪断言处超时的观察，其根因仍未确认。本次依赖预加载及诊断机制不能单独证明已查清或彻底消除该问题，也不增加物理／独立实验验证结论。
