# 修复简报与空事件文案未占整行

## 背景与目标
- `event-list` 的两列布局同时被结构化事件和单列简报复用。
- 只有一个子元素的简报与空事件文本被放入固定 `50px` 的第一列，导致过早换行。

## 约束与原则
- 结构化事件继续保留“时间 + 内容”两列。
- 反制部署和最终防御简报改用整行单列。
- 空事件提示横跨结构化事件的全部列。

## 阶段与 TODO
- [x] 为两类简报列表增加独立 `briefing-list` 类名。
- [x] 简报条目改为块级整行布局并取消最小高度。
- [x] 空事件提示横跨所有 Grid 列。
- [x] 完成类型检查、自动化测试、生产构建与 Diff 检查。

## 关键风险
- 无领域逻辑风险；结构化事件仍使用原有两列样式。

## 代码变更
```diff
--- src/ui/App.tsx
+++ src/ui/App.tsx
-            <ol className="event-list">
+            <ol className="event-list briefing-list">
               {mission.adaptationNotes.map(...)}
-            <ol className="event-list">
+            <ol className="event-list briefing-list">
               {mission.finalStrikeNotes.map(...)}

--- src/ui/styles.css
+++ src/ui/styles.css
 .event-list time { color: #c29a48; }
-.empty-event { color: #47695e !important; }
+.briefing-list { min-height: 0; }
+.briefing-list li { display: block; }
+.empty-event { grid-column: 1 / -1; color: #47695e !important; }
```

## 测试用例

### TC-001 单条反制简报
- 预期：文案使用侧栏完整内容宽度，不再限制于 `50px` 第一列。
- 是否通过：通过（CSS 结构检查与生产构建）。

### TC-002 空结构化事件
- 预期：“等待操作事件…”横跨时间列和内容列。
- 是否通过：通过（CSS Grid 规则检查）。

### TC-003 自动化回归
- `npm run typecheck`：通过。
- `npm run test -- --run`：通过，23 个测试文件、105 项测试。
- `npm run build`：通过。
- `git diff --check`：通过。
