# 收紧任务左侧面板按钮文字

## 背景与目标
- 任务左侧面板宽度为 `290px`，原按钮继承全局字号，英文 `RETURN TO MISSION NETWORK` 与航点操作文字容易换行。
- 缩小左侧任务控制按钮和航点操作按钮文字，让中英文文案尽可能保持单行。

## 约束与原则
- 只作用于 `.control-panel` 内的控制按钮，不影响顶部栏、任务网络和右侧面板。
- 不改变按钮功能、禁用状态、颜色和整体侧栏宽度。
- 保留合理可读性，不通过截断或隐藏文字实现单行。

## 阶段与 TODO
- [x] 将左侧控制按钮字号统一为 `11px`。
- [x] 收紧按钮横向内边距并禁止主动换行。
- [x] 允许三列航点按钮正确收缩。
- [x] 在 `290px` 左侧栏中验证中英文文案宽度。
- [x] 运行类型检查、测试和生产构建。

## 关键风险
- 三列航点操作按钮可用宽度有限，需要单独减小横向内边距并设置 `min-width: 0`。
- `white-space: nowrap` 不能掩盖溢出，因此必须同时检查元素 `scrollWidth` 与 `clientWidth`。

## 当前进展
- 任务控制区与航点操作区按钮均使用 `11px` 单行文字。
- 中文和英文模式下所有目标按钮均无横向溢出。
- 31 个测试文件、146 项测试与生产构建全部通过。

## 代码变更

### `src/ui/styles.css`
```diff
 .primary-button { flex: 1 0 100%; border-color: #b88a35; color: #f1c466; background: rgba(98, 70, 22, 0.24); }
 .return-network-button { width: 100%; flex: 1 0 100%; }
 .secondary-button { flex: 1; }
+.control-panel .button-row > button, .control-panel .route-actions > button { padding-inline: 7px; font-size: 11px; line-height: 1.2; letter-spacing: 0.02em; white-space: nowrap; }
+.control-panel .route-actions > button { min-width: 0; padding-inline: 5px; }
```

## 测试用例

### TC-001 英文任务控制按钮
- 类型：视觉与布局测试
- 优先级：高
- 操作步骤：切换 English 并进入任务规划页。
- 预期结果：`RETURN TO MISSION NETWORK`、`CONFIRM ROUTE`、`RESET ROUTE` 均为单行且不溢出。
- 是否通过：通过。

### TC-002 英文航点操作按钮
- 类型：视觉与布局测试
- 优先级：高
- 预期结果：`MOVE UP`、`MOVE DOWN`、`DELETE` 在三列布局内均为单行且不溢出。
- 是否通过：通过。

### TC-003 中文按钮
- 类型：布局测试
- 优先级：中
- 预期结果：返回任务网络、确认航线、重置航线、上移、下移、删除均保持单行。
- 是否通过：通过；浏览器测得所有按钮 `scrollWidth === clientWidth`。

### TC-004 工程验证
- 类型：自动化测试
- 优先级：高
- 执行命令：`npm run typecheck`、`npm run test`、`npm run build`。
- 预期结果：全部通过。
- 是否通过：通过；31 个测试文件、146 项测试全部通过，生产构建完成。
