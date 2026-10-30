# 检查范围与运行方式

## 命令

```sh
npm ci
npm run check
# 首次运行浏览器测试前：
npx playwright install chromium
npm run test:e2e
```

`npm run check` 顺序执行数据校验、源码/模块预检、Node 测试、干净构建和产物检查。浏览器测试对已构建的 `dist/` 运行，并通过 `/171YbDatabase/` 前缀模拟 Pages。`npm run test:all` 包含两类检查。

## 各类证据

- 数据测试：结构、单位、引用、核心迁移记录、65S 关系和 CSV 同源。结论限于记录与内部一致性。
- 计算测试：正式 production 函数与独立 CG/6j fixtures、Rabi 缩放、单位等价和有效域。fixture 的工具、版本和约定应随数据记录。
- 状态测试：换跃迁后失效通道处理、参数、错误与配置兼容性。
- 构建测试：删除源资源后不残留、清单 hash、缺失 import、Pages 子路径和显式提交范围。
- 浏览器测试：完整 8 条首页图谱、T2/T3/R2 的真实入口、全表、结果上下文、明确计算方向及功率/束腰反算、非法输入、公式弹窗、CSV、配置恢复、键盘和三种视口。

自动化浏览器检查不等于完整屏幕阅读器评测或所有视觉状态验收；仍需实际查看标签、图例、公式、错误、长来源和触屏操作。工程检查、固定模型数值一致性、原文核查和物理/实验验证分别报告。

## 结果记录

本文件描述检查机制，不宣称所有检查已经运行。每次交付应记录实际命令、版本、通过/失败、截图和未检查范围。浏览器失败时 `test-results/` 与 `playwright-report/` 保存诊断，默认不提交。

官方工具说明：[Playwright 安装与运行](https://playwright.dev/docs/intro)。本轮锁定的包版本来自 npm 官方 registry；网站产物不包含 Playwright。
