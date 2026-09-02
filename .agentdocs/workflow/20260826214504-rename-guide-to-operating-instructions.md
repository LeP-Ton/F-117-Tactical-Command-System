# 游戏内帮助更名为操作说明

## 背景与目标
- “作战简报”通常指特定任务的敌情、目标和行动部署，不适合承载通用操作与规则说明。
- 将入口和弹窗统一为语义准确的“操作说明”。

## 代码变更
```diff
-        <button className="guide-trigger">作战简报</button>
+        <button className="guide-trigger">操作说明</button>
-        <span className="section-kicker">OPERATION BRIEFING</span><h2>作战简报</h2>
-        <button aria-label="关闭作战简报"><span aria-hidden="true" /></button>
+        <span className="section-kicker">OPERATING INSTRUCTIONS</span><h2>操作说明</h2>
+        <button aria-label="关闭操作说明"><span aria-hidden="true" /></button>
```

```diff
-    expect(screen.getByRole("dialog", { name: "作战简报" })).toBeInTheDocument();
-    expect(screen.getByRole("button", { name: "关闭作战简报" })).toHaveFocus();
+    expect(screen.getByRole("dialog", { name: "操作说明" })).toBeInTheDocument();
+    expect(screen.getByRole("button", { name: "关闭操作说明" })).toHaveFocus();
```

## 文档变更
- README 和机制手册中的游戏内入口同步改为“操作说明”。

## 验证结果
- `npm run typecheck`：通过。
- `npm run test`：通过，28 个测试文件、122 个测试全部通过。
- `npm run build`：通过。
- `git diff --check`：通过。
