# 修复结构化事件空提示仍被限制在首列

## 背景与目标
- 会话-72 将 `.empty-event` 设置为 `grid-column: 1 / -1`，但该属性控制的是 `<li>` 在父级 `<ol>` 中的位置。
- 真正造成换行的是 `<li>` 自身继承了 `display: grid; grid-template-columns: 50px 1fr`，匿名文本仍进入 `50px` 第一列。

## 约束与原则
- 只改变无事件时的空提示布局。
- 有事件时继续保留时间与内容两列。

## 阶段与 TODO
- [x] 将空事件 `<li>` 自身改为块级整行布局。
- [x] 完成类型检查、生产构建和 Diff 检查。

## 关键风险
- 无领域逻辑风险。

## 代码变更
```diff
--- src/ui/styles.css
+++ src/ui/styles.css
-.empty-event { grid-column: 1 / -1; color: #47695e !important; }
+.event-list li.empty-event { display: block; color: #47695e !important; }
```

## 测试用例

### TC-001 空结构化事件
- 前置条件：AI DEBUG 已开启，当前任务尚无事件。
- 预期结果：“等待操作事件…”使用完整列表宽度，不再在 `50px` 内换行。
- 是否通过：通过（CSS 层级检查与生产构建）。

### TC-002 非空结构化事件
- 前置条件：任务已有事件。
- 预期结果：时间保持在第一列，事件内容保持在第二列。
- 是否通过：通过（选择器仅命中 `.empty-event`）。

### TC-003 自动化验证
- `npm run typecheck`：通过。
- `npm run build`：通过。
- `git diff --check`：通过。
