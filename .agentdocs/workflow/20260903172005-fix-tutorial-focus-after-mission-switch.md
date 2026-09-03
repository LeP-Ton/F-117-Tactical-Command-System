# 修复切换任务后的引导框错位

## 背景与目标
- 会话-151：首次引导停留在“选择首项任务”时，切换任务节点会改变右侧任务预览的内容高度。
- “规划任务 / 预览任务”按钮自身尺寸没有变化，原实现只观察按钮尺寸，因此高亮框继续使用切换前的页面坐标。
- 目标是让引导框在任务说明、权限说明或按钮文案变化后重新测量位置，并始终以 `6px` 间距包围当前入口按钮。

## 约束与原则
- 不改变任务选择、节点状态、按钮权限或任务引导步骤。
- 保留窗口缩放、侧栏滚动和按钮尺寸变化时的既有定位能力。
- 内容变更后延迟到下一帧读取布局，避免在 React 尚未完成页面排版时取得旧坐标。

## 阶段与 TODO
- [x] 定位为任务预览内容变化未触发目标坐标重算。
- [x] 为任务入口步骤观察整个任务预览区的 DOM 变化。
- [x] 统一通过下一帧调度坐标重算，并在组件卸载时清理观察器与待执行帧。
- [x] 增加任务预览高度变化后的定位回归测试。
- [x] 在实际页面中切换可执行任务、锁定最终任务及另一可执行任务进行验证。

## 关键风险
- `MutationObserver` 可能在一次节点切换中收到多次变化通知，因此使用单个待执行帧合并重复测量。
- 观察范围只扩展到当前任务预览侧栏，不监听整个应用，避免无关实时状态造成持续重算。

## 当前进展
- 任务入口步骤现在同时监听按钮尺寸与任务预览内容变化。
- 实际页面验证中按钮纵坐标依次为 `459.5px → 413.5px → 359.5px`，引导框始终保持上、左、右、下各 `6px` 外扩。
- 类型检查、154 项自动化测试和生产构建全部通过。

## 代码变更
- `src/ui/MissionTutorial.tsx`：增加合帧坐标更新与任务预览内容观察。
```diff
-    updateRect();
-    window.addEventListener("resize", updateRect);
-    window.addEventListener("scroll", updateRect, true);
-    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(updateRect);
+    let pendingFrame: number | undefined;
+    const scheduleRectUpdate = () => {
+      if (pendingFrame !== undefined) {
+        if (typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(pendingFrame);
+        else window.clearTimeout(pendingFrame);
+      }
+      const commitUpdate = () => {
+        pendingFrame = undefined;
+        updateRect();
+      };
+      // 等 React 完成本轮布局再读取坐标，避免任务预览内容刚变化时仍取得旧位置。
+      pendingFrame = typeof window.requestAnimationFrame === "function"
+        ? window.requestAnimationFrame(commitUpdate)
+        : window.setTimeout(commitUpdate, 0);
+    };
+
+    updateRect();
+    window.addEventListener("resize", scheduleRectUpdate);
+    window.addEventListener("scroll", scheduleRectUpdate, true);
+    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(scheduleRectUpdate);
     resizeObserver?.observe(target);
+    // “规划任务”按钮会因任务说明行数变化而整体移动，但按钮自身尺寸可能完全不变。
+    // 因此该步骤还需观察整个任务预览区的内容变更，而不能只监听按钮 ResizeObserver。
+    const layoutRoot = step.target === "mission-entry"
+      ? target.closest<HTMLElement>('[data-tutorial="mission-assessment"]')
+      : null;
+    const mutationObserver = layoutRoot && typeof MutationObserver !== "undefined"
+      ? new MutationObserver(scheduleRectUpdate)
+      : undefined;
+    if (layoutRoot) {
+      mutationObserver?.observe(layoutRoot, {
+        subtree: true,
+        childList: true,
+        characterData: true,
+        attributes: true,
+      });
+    }
     return () => {
-      window.removeEventListener("resize", updateRect);
-      window.removeEventListener("scroll", updateRect, true);
+      window.removeEventListener("resize", scheduleRectUpdate);
+      window.removeEventListener("scroll", scheduleRectUpdate, true);
       resizeObserver?.disconnect();
+      mutationObserver?.disconnect();
+      if (pendingFrame !== undefined) {
+        if (typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(pendingFrame);
+        else window.clearTimeout(pendingFrame);
+      }
     };
```

- `src/ui/MissionTutorial.test.tsx`：让任务入口处于预览容器内部，增加按钮位移后的高亮框同步测试并恢复测试桩。
```diff
-import { cleanup, fireEvent, render, screen } from "@testing-library/react";
+import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
 import { afterEach, describe, expect, it, vi } from "vitest";
@@
-afterEach(cleanup);
+afterEach(() => {
+  cleanup();
+  vi.restoreAllMocks();
+});
@@
-    <div data-tutorial="mission-assessment" />
-    <button data-tutorial="mission-entry">规划任务</button>
+    <div data-tutorial="mission-assessment">
+      <span data-testid="assessment-copy">任务简报</span>
+      <button data-tutorial="mission-entry">规划任务</button>
+    </div>
@@
+  it("切换任务改变预览高度后重新定位规划任务引导框", async () => {
+    renderTutorial();
+    const entryButton = screen.getByRole("button", { name: "规划任务" });
+    let buttonTop = 420;
+    vi.spyOn(entryButton, "getBoundingClientRect").mockImplementation(() => ({
+      x: 920,
+      y: buttonTop,
+      top: buttonTop,
+      left: 920,
+      right: 1220,
+      bottom: buttonTop + 48,
+      width: 300,
+      height: 48,
+      toJSON: () => ({}),
+    } as DOMRect));
+
+    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
+    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
+
+    const focusFrame = document.querySelector<HTMLElement>(".tutorial-focus-frame");
+    await waitFor(() => expect(focusFrame).toHaveStyle({ top: "414px" }));
+
+    buttonTop = 510;
+    screen.getByTestId("assessment-copy").textContent = "切换节点后高度发生变化的任务简报";
+    await waitFor(() => expect(focusFrame).toHaveStyle({ top: "504px" }));
+  });
```

## 测试用例
### TC-001 任务节点切换后引导框跟随入口按钮
- 类型：组件回归测试
- 优先级：高
- 前置条件：引导位于“选择首项任务”步骤。
- 操作步骤：改变任务预览内容并令入口按钮纵坐标由 `420px` 变为 `510px`。
- 预期结果：引导框 `top` 由 `414px` 更新为 `504px`，持续保持 `6px` 外扩。
- 是否通过：是。

### TC-002 实际任务网络多节点切换
- 类型：浏览器集成验证
- 优先级：高
- 操作步骤：从首个情报行动切换至锁定的最终打击，再切换至首层打击任务。
- 预期结果：不论入口为“规划任务”还是“预览任务”，高亮框都随按钮位置变化并保持四边 `6px` 间距。
- 是否通过：是。

### TC-003 全量自动化验证
- `npm run typecheck`：通过。
- `npm run test`：通过，32 个测试文件、154 项测试。
- `npm run build`：通过。
