# 统一任务引导按钮配色

## 背景与目标
- 顶部“任务引导”按钮沿用了旧操作说明入口的金色强调色，与左右相邻的语言和全屏按钮配色不一致。
- 将任务引导按钮统一为相邻工具按钮使用的青绿色视觉体系。

## 约束与原则
- 只调整普通状态的文字色和边框色，不改变尺寸、间距、点击行为或任务引导逻辑。
- 保留全屏按钮进入全屏后的金色激活态，用于表达状态变化。

## 阶段与 TODO
- [x] 核对任务引导、语言和全屏按钮的 CSS 配色。
- [x] 将三个顶部工具按钮的普通状态颜色统一。
- [x] 完成浏览器视觉检查、类型检查、自动化测试和生产构建。

## 关键风险
- 若只改文字色而遗漏边框色，按钮仍会呈现混合配色。
- 不应覆盖全屏按钮的 `.active` 激活态，否则会削弱全屏状态反馈。

## 当前进展
- 任务引导按钮已从金色文字 `#dcb35a`、金色边框 `#765b2b`，调整为与相邻按钮一致的青绿色文字 `#8eb6aa`、青绿色边框 `#31584b`。
- 语言、任务引导和全屏按钮的普通状态现共享同一条配色规则。

## 代码变更

### `src/ui/styles.css`
```diff
--- a/src/ui/styles.css
+++ b/src/ui/styles.css
@@
-.tutorial-trigger, .language-trigger, .fullscreen-trigger { padding: 7px 10px; color: #dcb35a; border-color: #765b2b; font-size: 9px; letter-spacing: 0.08em; white-space: nowrap; }
+.tutorial-trigger, .language-trigger, .fullscreen-trigger { padding: 7px 10px; color: #8eb6aa; border-color: #31584b; font-size: 9px; letter-spacing: 0.08em; white-space: nowrap; }
```

### `.agentdocs/index.md`
```diff
--- a/.agentdocs/index.md
+++ b/.agentdocs/index.md
@@
 ## 当前变更文档
+`workflow/20260903222241-align-tutorial-trigger-color.md` - 会话-6：将顶部任务引导按钮由金色调整为与相邻语言、全屏按钮一致的青绿色文字与边框，同时保留全屏激活态；核对顶部工具按钮普通状态配色时读取。
```

## 测试用例

### TC-001 顶部工具按钮普通状态配色
- 类型：视觉回归测试
- 优先级：高
- 操作步骤：在中文任务网络页面检查语言、任务引导和全屏三个相邻按钮。
- 预期结果：三个按钮普通状态均使用文字色 `#8eb6aa` 和边框色 `#31584b`。
- 是否通过：通过（CSS 规则核对与浏览器截图检查）。

### TC-002 全屏激活态不受影响
- 类型：状态样式回归测试
- 优先级：中
- 操作步骤：检查 `.fullscreen-trigger.active` 规则优先级。
- 预期结果：进入全屏后仍使用金色文字、边框及激活背景。
- 是否通过：通过（样式规则检查）。

## 验证记录
- `npm run typecheck`：通过。
- `npm run test`：通过，33 个测试文件、156 项测试全部通过。
- `npm run build`：通过，Vite 生产构建成功。
- 浏览器视觉检查：任务引导按钮已与左右相邻工具按钮保持同一青绿色视觉层级，顶部布局无变化。
