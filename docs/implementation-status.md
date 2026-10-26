# 171YbDatabase 逐项实施与验收记录

日期：2026-10-26。对应 2026-10-23 的完整方案：UI-01–UI-22 与 E01–E34。两组编号分别描述用户行为和实现机制，有对应关系，不能作为 56 项独立工程重复排期。

本文记录本地工作版本 0.2.0。**已实现表示代码已经接入；已检查表示对应检查实际运行；待 CI、待人工、待原文和待维护者决定分别保留。**文件存在或测试能够枚举不等于相关功能已经验收，也不等于已发布网站。

## 当前证据与范围

| 证据 | 当前实际记录 | 限制 |
|---|---|---|
| V1 · 本地完整检查 | 根代理在最终代码检查中再次运行 `npm run check`：50/50 项 Node 测试通过，源码预检、数据校验、干净构建通过；产物检查为 37 个文件、41 条本地资源引用通过 | 是本地工程与固定模型实现检查；不替代原文核查或物理/实验验证 |
| V2 · 数值与数据基线 | `tests/fixtures/catalog-baseline.json`、`physics-baseline.json` 对照改造前提交 `2e2e9d5`；CG/6j 另有独立 SymPy fixtures | 基线记录旧软件输出；独立符号一致性不能代替模型/实验验证 |
| V3 · 真实浏览器主路径 | 根代理通过 CUA 验证 T2/T3/R2 默认计算与原页面一致，全偏振 CG 表分别为 10/4/10 行；首页保留 8 条路径 | 已检查代表性路径；不据此声称所有浏览器状态通过 |
| V4 · 配置恢复 | CUA 实际执行“导出 T3 → 切换 T2 → 导入文件 → 恢复 T3”成功 | 单次主路径通过；版本冲突、非法文件等由 Node 测试保护，其他浏览器路径仍需记录 |
| V5 · 窄屏 | 根代理修正后在 390 px 检查得到 `document.documentElement.scrollWidth = 390`；后续 V9/V10 在 1440/1024/390 px 均核对整页宽度 | 图形局部横向浏览是有意设计；不扩大为所有设备/浏览器布局均已通过 |
| V6 · 浏览器回归脚本 | `npx playwright test --list` 成功枚举 33 项，覆盖 1440/1024/390 px；脚本语法和接口已接入 | **未在本轮记录中执行这 33 项 Playwright 测试。待 CI / 浏览器运行，不能写成 33/33 通过** |
| V7 · 构建与同步保护 | 6 项隔离测试覆盖陈旧文件清除、重复构建、产物篡改、缺失 import、Pages 路径和明确提交范围 | 这些是范围与构建逻辑测试，生产 sync 的 commit/push 未执行；独立本地 Git 提交以本地分支日志为准，GitHub Actions 和线上部署尚未运行 |
| V8 · 测试敏感性 | 根代理已执行 `scripts/check-test-sensitivity.cjs`：在隔离副本将正式 Rabi 返回值乘 2，相关测试按预期失败；恢复原实现后通过 | 副本变异未留在生产源中；证明相关测试能捕获这类生产计算错误，不代表捕获所有缺陷 |
| V9 · 源站三视口 CUA | 1440/1024/390 px 均通过：8 条箭头、无整页溢出、T3 默认 6.6496 kHz、非法输入修正、功率反算 4 mW、束腰反算 25 µm、M2 不支持、键盘 CG 选 σ⁺且焦点保持、T3 全表 4 行、数据表全部 14 列切换、公式 Escape 关闭并返回触发按钮 | 实际操作证据为本任务目录的 `browser-qa-20261026.json`；是列明路径的本地验收，不泛化为多浏览器、屏幕阅读器或所有状态穷举 |
| V10 · 实际发布产物三视口 CUA | 实际 `dist/` 在 `http://127.0.0.1:4173/171YbDatabase/`：1440/1024/390 px 中 T2/T3/R2 分别为 32.08 MHz / 6.6496 kHz / 2.22138 MHz、10/4/10 行、8 箭头、scrollWidth 等于视口、无 JS error，全部通过 | 原始记录为本任务目录的 `dist-browser-qa-20261026.json`；测试的是实际产物与 Pages 子路径，不代表已推送或线上发布 |

原始浏览器基线保存在本聊天任务目录的 `baseline-20261026/index.html` 与 `baseline-20261026/main-flow.json`，不进入网站发布包。原版在 P=1 mW、w₀=50 µm、默认 π 与 F=1/2→F′=1/2 时显示：T2 为 32.08 MHz，T3 为 6.6496 kHz，R2 为 2.22138 MHz；这些是回归记录，不是新增物理测量。

源站和产物的 CUA 原始记录分别为 `browser-qa-20261026.json` 与 `dist-browser-qa-20261026.json`，由根代理保存并归档本地交付证据。工作分支为 `codex/atlas-refactor`；本地提交的确切状态与 hash 用该分支的 `git log` 核对，本文不预填尚未创建的提交 hash。未推送、未部署。

## 界面 22 项

表中路径均相对于仓库根目录。主入口为 `index.html` → `src/main.js`，表中模块已由该入口调用。

| 编号 | 实现文件与实际变化 | 已有检查证据 | 当前状态 / 剩余验收 |
|---|---|---|---|
| UI-01 | `index.html`、`src/main.js`、`src/ui/energy-diagram.js`、`src/styles/layout.css`：完整主图在主页，随后是超精细、CG、Rabi 和补充数据 | V2 数据集合；V9/V10 三视口8路径和主流程 | 已实现并完成列明的三视口本地验收；自动化浏览器/CI 仍待运行 |
| UI-02 | `index.html`、`src/ui/page-controls.js`：连续三步与页内导航，缩短重复说明；完成标记只描述操作 | 主入口初始化、V9/V10 连续主路径 | 已实现；代表流程三视口通过，未将所有导航/折叠状态穷举记为已验收 |
| UI-03 | `src/ui/source-panel.js`、`src/state/store.js`、`src/main.js`：共享当前跃迁、F/mF/偏振、约定、结果与模型状态；顶部摘要随选择更新 | source-panel/store Node 测试；V3/V9/V10 上下文与选择更新 | 已实现，相关 Node 与列明浏览器路径通过；其他组合由回归脚本继续保护 |
| UI-04 | `src/ui/energy-diagram.js`、样式：保留图谱几何和物理内容，去重 3 eV 刻度、补左边距、整理标注；保留非等比例说明 | V2 数据未改；V9/V10 三视口页面与主图检查 | 已实现，三视口代表页面已检查；不扩大为所有标签/缩放状态穷举 |
| UI-05 | `src/main.js`、`src/styles/layout.css`：当前箭头 `.selected-trans` 与按钮 `aria-pressed`；悬停与持久选中分开 | V3 切换路径；V9 键盘 CG 焦点保持和持续选中 | 已实现，代表性选中/焦点路径通过；全状态视觉穷举未开展 |
| UI-06 | `src/main.js`：8 个原生 `[data-select-transition]` 按钮，提供图形的键盘等价入口 | V9 八路径可用与 CG 键盘操作；V6 原生选择入口回归脚本 | 已实现，核心键盘路径已查；8入口的自动化键盘枚举仍待CI |
| UI-07 | `index.html`、`src/ui/source-panel.js`：图后 `selectedSource` 可保持展开，含字段详情；主图可读宽度保留 | V3 来源随选择更新；来源视图 Node 测试；V9/V10 布局 | 已实现并随主路径检查；未将全部触屏/焦点组合视为穷举通过 |
| UI-08 | `src/ui/source-panel.js`、`data/transitions.json`、`data/sources.json`：波长、寿命、矩阵元分别显示证据类型、条件、约定和核查状态 | 来源分离、冲突保留、缺失状态和 HTML 转义的 Node 测试通过 | 展示及结构已实现；部分原文/Run/revision 仍待核查和补齐，未标为实验验证 |
| UI-09 | `src/ui/hyperfine-diagram.js`：沿用完整 F/mF 分量与允许通道，统一选中线和表格按钮 | V2 符号/通道；V9 CG键盘选σ⁺后全表4行；V10 T2/T3/R2为10/4/10行 | 已实现，列明分量/全表/键盘路径通过；其他偏振筛选组合待自动回归 |
| UI-10 | `src/ui/hyperfine-diagram.js`、`src/physics/angular.js`：全偏振表保持完整，选中通道与图上筛选分开；结果说明默认最强允许通道 | 角因子/有效d Node 测试；V9选σ⁺且T3全表仍4行；V10表行数 | 已实现，计算/全表和代表性选择验收通过；不声称所有筛选组合均已操作 |
| UI-11 | `index.html`、`src/ui/rabi-chart.js`、样式：参数、单位、标签成组；明确计算方向和只读结果字段 | 单位 Node 测试；V9 三方向输入/只读结果，V10 三视口主流程 | 已实现，三视口代表性输入及输出路径通过 |
| UI-12 | `src/ui/rabi-chart.js`、`src/physics/rabi.js`：空值、负功率、非正束腰与非有限值报错，失效结果不伪装成新结果 | 有效域/错误类型 Node 测试；V9 三视口非法输入与修正恢复 | 已实现，函数层与列明页面错误恢复路径通过 |
| UI-13 | `index.html`、`src/main.js`：`rabiResult` 优先显示 Ω/2π、单位、P/w₀/d_eff 和通道说明；保留曲线、热图、公式 | Rabi Node 正反算；V9 4mW/25µm反算；V10三条默认输出 | 已实现，列明正算/反算与三视口默认结果验收通过 |
| UI-14 | `src/ui/rabi-chart.js`：共享输入/工作点，轴、单位、色条随状态更新；偏振功率轴默认与输入一致，旧 2P 视图须明确选择并说明 | Rabi性质/单位/逆运算；默认P口径说明；V9/V10图表随主流程更新 | 已实现，代表工作点与计算路径通过；全部轴范围、色条/tooltip 组合未作穷举 |
| UI-15 | `src/ui/data-table.js`：核心表默认五个主列，全字段按钮可展开；按 canonical 数值排序，出处长文可折叠 | 主列/排序 Node 测试；V9 全部14列切换及三视口布局 | 已实现，列切换和代表性窄屏路径通过；所有表格排序组合不声称穷举 |
| UI-16 | `src/ui/data-table.js`、`source-panel.js`：将原 `2π × …` 的频率系数、Γ 和原表达分开显示，保留定义待核查 | 线宽显示与原表达不覆盖的 Node 测试通过 | 显示消歧已实现；**物理定义及文献冲突仍待原文核查**，未宣称修复已证实的算法错误 |
| UI-17 | `src/styles/` 保留 Times/宋体与暗色基础，改善文字/焦点语义；`spectral-color.js` 按波长给可见近似色，UV/IR 用中性色与文字 | 光谱区/颜色 Node 测试，CIE原CSV/元数据/NOTICE；V9/V10页面检查 | 已实现并作三视口代表性查看；颜色为近似标识，全面对比度/辅助技术评测未开展 |
| UI-18 | `src/styles/layout.css`：间距尺度、标题、输入和按钮统一；减少装饰，图与结果区域优先 | V9/V10 三视口页面检查与无整页溢出 | 已实现，列明三视口布局验收通过；未穷举所有控件状态 |
| UI-19 | `src/ui/page-controls.js`、`index.html`：保留 MathML/原生 dialog；HFS 关闭改 button；Escape/焦点返回有明确实现 | V9 三视口公式Escape、焦点返回；原生关闭按钮 | 已实现，列明键盘弹窗路径通过；屏幕阅读器和多浏览器评测未开展 |
| UI-20 | `src/ui/source-panel.js`、`src/ui/rabi-chart.js`：区分未选择、缺失、无通道、不支持和非法输入；缺失不写零 | 状态/Rabi错误类型 Node 测试；V9非法输入恢复、M2明确不支持 | 已实现，函数状态和代表性页面失败/恢复通过；未穷举所有空态组合 |
| UI-21 | `src/styles/layout.css`：窄屏单列，完整能级图局部横向浏览；图表/表格限制在自己的容器 | V9 源站、V10实际dist：1440/1024/390px的scrollWidth均等于视口 | 已实现，列明三视口本地布局与核心键盘流程通过；完整多浏览器/辅助技术范围另行评测 |
| UI-22 | `src/version.js`（生成）、`main.js`、`state/config.js`、`CHANGELOG.md`、`docs/historical-changelog.md`：分离软件/数据/公式版本，配置 JSON，保留历史 | 配置正反算/版本差异/伪造输入/兼容性 Node 测试，V4真实恢复 | 已实现，真实恢复与版本逻辑检查通过；提交状态以本地分支日志核对，未推送/未发布 |

## 工程、数据、测试与维护 34 项

| 编号 | 实现文件与范围 | 已有检查证据 | 当前状态 / 剩余事项 |
|---|---|---|---|
| E01 | 任务目录 `baseline-20261026/` 保存改造前 HTML 与浏览器 main-flow；仓库 `tests/fixtures/catalog-baseline.json`、`physics-baseline.json` 保存数据/函数回归 | V2/V3原版默认输入与通道记录，V9/V10源站及实际dist三视口 | 基线保护已实现并完成列明浏览器比对；原记录及最终QA证据已保存 |
| E02 | `src/main.js` 正式导入 physics/data；`tests/physics/`、`tests/data/` 测同一模块；旧未挂载模块及旧测试已移除 | V1/V2正式模块测试；V8隔离Rabi×2失败、恢复后通过 | 已实现并验证相关测试对生产Rabi错误敏感；不将这次变异试验扩大为所有故障覆盖 |
| E03 | `data/levels.json`、`src/data/catalog.js`：稳定 ID、共享能级记录和角色适配 | 数据集合回归、引用校验、8 路径唯一引用测试通过 | 工程迁移已实现；能量零点/混合态等缺失原文条件保持待核查 |
| E04 | `data/transitions.json`、`src/data/catalog.js`：数量字段 canonical，显示/旧入口通过只读适配器使用 | 旧值精确兼容与数值排序测试通过 | 已实现；没有以派生关系覆盖独立文献值，来源冲突未批量解决 |
| E05 | `data/hyperfine.json`、`scripts/export-data.cjs`、CSV、`page-controls.js`：65S 同源显示和导出 | CSV 原字节 SHA-256 一致、页面对象同源、内部关系测试通过 | 已实现，相关检查通过；其他原文物理信息仍按原状态保留 |
| E06 | `schemas/quantity.schema.json`、`transition.schema.json`、`scripts/validate-data.cjs`：类型/单位/ID/引用/缺失原因校验 | V1；错单位、缺失 sourceId 等反例指向具体字段的测试通过 | 已实现并检查；结构校验不验证文献理解或物理模型 |
| E07 | `data/sources.json`、物理字段 sourceId、`source-panel.js`：来源集中、量分别引用，This work 显示可取得保存证据 | 来源区别、引用解析、缺失原始证据提示的 Node 测试通过 | 分源机制已实现；部分 DOI/页表和计算 Run/revision/hash 待取得，**字段可展开不代表原文已核实** |
| E08 | canonical 分开保存 Γ、寿命、原 2π 表达及频率系数；`units.js` 明确换算；表格不覆盖原义 | 线宽 API/显示、原表达保留测试通过 | 工程和显示消歧已实现；物理定义及各文献条目仍待核查 |
| E09 | quantity 字段保存 conditions/convention/uncertainty/evidenceKind/reviewStatus；前台分别展示 | null 不转零、核查状态不升级、冲突仍可访问的 Node 测试通过 | 已实现；缺失条件和总不确定度保持未知 |
| E10 | `data/dataset.json`、导出脚本、生成 catalog 和构建清单：数据版本、生成时间、源 commit、文件/hash | manifest 与 canonical 文件、CSV 同步检查通过 | 已实现，本地检查通过；未重新计算原始物理数据 |
| E11 | `index.html` → `src/main.js`，分离 `src/data/physics/state/ui/styles`；不引入生产前端框架 | V1 正式模块语法/导入，V3 真实入口可用 | 已实现并有主路径回归；进一步细粒度组件拆分可按维护需要进行 |
| E12 | `src/physics/constants.js`、`units.js` 提供正式常数与 SI/显示转换 | 单位等价、Rabi 回归测试通过 | 已实现并检查；未借常数整理擅改科学原值 |
| E13 | `src/physics/angular.js` 纯函数、通道和约定；SymPy fixture 生成脚本及版本记录 | 独立 CG、6j、带符号 J→F 角因子和非法量子数测试通过 | 已实现并检查，限于规定约定下的数值实现 |
| E14 | `src/physics/rabi.js` 共用正/反算，图/表调用共享计算；显式 J/F 约化分支 | 原输出/性质/逆运算/T3层级/有效域 Node 测试；V9三方向、V10默认值 | 已实现，列明函数回归和页面正/反算验收通过 |
| E15 | `src/physics/estimates.js` 与 `data/estimates.json`，独立模型元数据；M2 不按 E1 处理 | 旧估算数值/标签、注入模型和禁戒/不支持测试通过 | 已实现并检查；估算没有升级成测量或物理验证 |
| E16 | `src/state/store.js`，只读快照、dispatch 与内部迁移 adapter；图表消费者只读 API | 不可变状态、连贯批次、订阅顺序测试通过；V3/V4 跨模块变化 | 已实现并检查；editor 只限计算器内部，后续可继续缩小 adapter 范围 |
| E17 | main 显式初始化和订阅；去掉组件连接的定时轮询；失败经 onError/页面错误区可见 | store 错误暴露和版本连贯测试；静态模块接线检查 | 已实现；悬停延迟关闭和 Blob URL 释放计时仍保留，它们不承担初始化同步 |
| E18 | `src/ui/energy-diagram.js`、`hyperfine-diagram.js`、`data-table.js`、`rabi-chart.js`、`source-panel.js` 分职 | 语法/导入检查与 V3 真实流程通过；正式公式从 physics 导入 | 已实现并完成代表性回归；复杂图形渲染的进一步小组件化不冒充本轮已做 |
| E19 | `src/state/config.js`、`schemas/calculation-config.schema.json`、main 的导出/恢复控件 | T2/T3/R2、三方向、SI/显示单位、版本差异、伪造结果/矩阵元拒用的 Node 测试；V4 | 已实现，函数与真实恢复路径通过；其他浏览器导入失败状态待 CI/人工 |
| E20 | physics 明确错误类型；UI 保留输入并分开非法/无数据/不支持等状态 | 有效域/状态/M2 Node 测试，V9三视口非法输入修正和M2不支持 | 已实现，列明函数层与页面失败/修复路径通过 |
| E21 | `tests/fixtures/angular.json`、`scripts/generate-angular-fixtures.py`、`tests/physics/angular.test.js` | 独立 SymPy 工具、版本及相位约定已记录并与生产函数对照通过 | 已实现并检查；没有用同一 JS 公式复制互证 |
| E22 | `tests/physics/rabi.test.js`：P×4、w×2、单位等价、正/反算、非法值 | V1 相关性质测试通过 | 已实现并检查；此证据不表示实验耦合模型已经验证 |
| E23 | `tests/data/hyperfine.test.js`、catalog 测试：CSV 同源、ΔE、2:4 重心、有效 A 与引用 | V1 相关内部关系与原字节 hash 检查通过 | 已实现并检查；不能代替三重态归属或独立实验验证 |
| E24 | 首页完整图要求纳入 data/主流程 e2e；保留原核心图而非用简化预览替换 | V2集合、V9源站、V10实际dist的8路径及T2/T3/R2联动 | 已实现，代表性本地主路径验收闭合；33项Playwright自动化仍待运行 |
| E25 | 原生选择/通道按钮、dialog、焦点样式、局部横向浏览及三视口 e2e | V9三视口核心键盘/CG焦点/公式Escape，V10实际dist无溢出 | 已实现并闭合列明的本地三视口/键盘验收；多浏览器和屏幕阅读器未评测 |
| E26 | `scripts/check-artifacts.cjs` 校验清单/hash/import/CSS/CSV 和 Pages 前缀；e2e server 在 `/171YbDatabase/` 服务实际 dist | V1/V7产物静态检查，V10实际dist在Pages前缀的三视口主路径和无JS error | 已实现并闭合代表性本地产物验收；GitHub CI 与线上发布尚未运行 |
| E27 | `scripts/build.cjs`：只清理专属 dist、复制必要目录，生成版本和 artifact manifest | V7 删除资源后不残留、重复构建、产物篡改检查通过 | 已实现并检查；清理不触及源目录 |
| E28 | `.github/workflows/check.yml` 与 `pages.yml` 分离，main 复用已检查产物，仅 deploy 写 Pages | 工作流静态审阅，检查命令本地 V1 通过 | **已实现、待 GitHub CI 实跑**；本轮没有推送/触发部署 |
| E29 | `scripts/sync.cjs`：plan/check/commit/push 分开；具体文件或 reviewed staged 范围；远端祖先保护 | V7参数解析及精确文件范围测试 | 已实现，范围逻辑已查；生产sync的commit/push未执行，独立本地Git提交另见分支日志，远端未同步 |
| E30 | 删除未挂载旧 `assets/rydberg-*` 与旧测试、无容器死绘图；修正不可达能力文案；主图保留 | V1 语法/实际 import 与 V3 主图/计算路径通过 | 已清理；历史文案保存在版本记录，未以隐藏函数宣称完整 Raman 支持 |
| E31 | package 单一软件版本，生成 version.js，dataset / FORMULA_VERSION 独立；README、CHANGELOG 与历史记录分开 | V1版本/hash元数据，V4配置含版本，V9/V10页面验收 | 已实现并可追溯；本地提交以分支日志为准，未推送/未部署 |
| E32 | `CONTRIBUTING.md`、三类 Issue 模板、PR 模板 | 文件和字段已人工审阅；要求具体目标、科学变化与验收证据 | 已实现；未在 GitHub 实际创建 Issue/PR，轻量规则不冒充团队实践成果 |
| E33 | `docs/architecture.md`、`data-policy.md`、`decisions/0001-static-es-modules.md`、公式说明 | 与当前模块边界静态核对；科研计算/研究记录仍留在原工作区 | 已实现；政策约束未来变更，不能表示全库科学证据已补齐 |
| E34 | `docs/licensing-review.md`、CIE 原 CSV/元数据/`assets/spectral/NOTICE.md` | 新颜色数据归属与独立许可说明已落地；Playwright 开发依赖有锁定版本 | **许可审查记录完成；原代码/原子数据总体许可证待权利人决定。未擅加整库 LICENSE** |

## 明确保留的未完成事项

1. **CI 与自动化浏览器：**33 项 Playwright 脚本已枚举，仍未在本地或 CI 执行；GitHub Actions、远端推送、线上部署和线上 hash 核对尚未发生。本地 CUA 已完成 V9/V10 所列三视口源站和真实产物验收，不能把这两种检查相互替代。
2. **原文与物理：**T2 内部校准与文献值、6s7s ³S₁ 的 HFS/寿命冲突、Γ/线宽的来源口径等仍需具体原文证据。结构、回归和 UI 检查通过不能解决这些科研问题。
3. **来源完整性：**已建立字段级来源与待核查状态；部分原文定位、This work 的原 Notebook/Run、revision 和输入输出 hash 仍需补充。没有据此把整库标为“已核查”。
4. **许可决定：**原代码与原子数据总体许可仍由维护者结合权利来源决定；CIE 颜色数据单独保留 CC BY-SA 4.0 的署名和派生说明。
5. **未扩大的评测范围：**E02 的隔离变异与恢复试验已通过预期检查（V8）；完整屏幕阅读器、多浏览器、所有图表范围/tooltip和状态组合的穷举评测仍未完成，不以代表性本地验收代替这些范围。

这些剩余事项分别是待执行验收、待原始科研证据或待权利人决定。应按其性质继续处理，不能以软件“全部通过”合并覆盖。
