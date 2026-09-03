# 约束页面高度并保持顶部栏单行

## 背景与目标
- 除允许内部滚动的任务左右侧面板外，任何页面元素都不能超过页面高度。
- 当页面宽高比低于约 `1700:823` 时，顶部横栏仍需保持单行，不能因自适应放大的文字发生换行。

## 约束与原则
- 全局缩放必须同时满足顶部栏最小逻辑宽度与非滚动界面最小逻辑高度。
- 任务网络不再依靠页面级滚动容纳固定高度内容，而是让主区域占用剩余高度。
- 变换容器内的 `vh/vw` 与百分比最大高度不能作为浮层边界依据，改用显式逻辑视口变量。
- 极小视口继续缩小，不设置可能破坏页面高度保证的最小倍率；最大倍率仍限制为 `2×`。

## 阶段与 TODO
- [x] 将最小逻辑视口从 `1280×720` 调整为 `1500×720`。
- [x] 强制顶部栏品牌、控制组和全部文字保持单行。
- [x] 移除任务网络 `620px` 强制最小高度及页面级滚动。
- [x] 用逻辑视口变量约束操作说明、任务引导和航点列表。
- [x] 增加临界比例与逻辑视口变量测试。
- [x] 完成中英文临界比例、任务网络、战术视图和弹窗边界浏览器验证。

## 关键风险
- 只按高度缩放时，宽高比较窄的页面会获得过大的字体和控件，最终压缩顶部栏并触发换行。
- `position: fixed` 浮层位于已变换的应用容器中，百分比 `max-height` 可能按变换前的浏览器高度解析，导致二次放大后越界。
- 设置最小缩放倍率会令极小视口无法继续收缩，从而违背页面高度硬约束。

## 当前进展
- 全局缩放现按 `min(页面宽度 / 1500, 页面高度 / 720)` 计算，最大限制为 `2×`，不设最小倍率。
- 顶部栏继承 `white-space: nowrap`，品牌区和控制区禁止压缩。
- 任务网络主区域改为剩余高度弹性布局，页面本身不再滚动。
- 缩放容器公开逻辑宽高变量，操作说明在 `1700×823` 下实际边界为 `36–787px`，完整落在页面内。

## 代码变更

### `src/ui/ViewportScaler.tsx`
```diff
--- a/src/ui/ViewportScaler.tsx
+++ b/src/ui/ViewportScaler.tsx
@@ -1,8 +1,8 @@
 import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
 
-export const referenceViewport = { width: 1280, height: 720 } as const;
-const minimumScale = 0.5;
+// 1500px 的最小逻辑宽度可容纳完整双语顶部栏；720px 则是所有非滚动主视图的高度基线。
+export const referenceViewport = { width: 1500, height: 720 } as const;
 const maximumScale = 2;
 
 export function calculateViewportScale(width: number, height: number): number {
@@ -8,7 +8,7 @@
   if (width <= 0 || height <= 0) return 1;
   const fittedScale = Math.min(width / referenceViewport.width, height / referenceViewport.height);
-  return Math.round(Math.min(maximumScale, Math.max(minimumScale, fittedScale)) * 10_000) / 10_000;
+  return Math.round(Math.min(maximumScale, fittedScale) * 10_000) / 10_000;
 }
@@ -18,6 +18,11 @@
   children: ReactNode;
 }
 
+type ViewportScalerStyle = CSSProperties & {
+  "--logical-viewport-width": string;
+  "--logical-viewport-height": string;
+};
+
 export function ViewportScaler({ children }: ViewportScalerProps) {
@@ -36,7 +41,9 @@
     width: `${100 / scale}%`,
     height: `${100 / scale}%`,
     transform: `scale(${scale})`,
-  } as CSSProperties;
+    "--logical-viewport-width": `${window.innerWidth / scale}px`,
+    "--logical-viewport-height": `${window.innerHeight / scale}px`,
+  } as ViewportScalerStyle;
```

### `src/ui/ViewportScaler.test.tsx`
```diff
--- a/src/ui/ViewportScaler.test.tsx
+++ b/src/ui/ViewportScaler.test.tsx
@@ -17,16 +17,17 @@
 describe("全局视口自适应", () => {
-  it("以 1280×720 为基准按宽高较小倍率等比缩放", () => {
-    expect(calculateViewportScale(1280, 720)).toBe(1);
-    expect(calculateViewportScale(1920, 1080)).toBe(1.5);
+  it("以 1500×720 为基准按宽高较小倍率等比缩放", () => {
+    expect(calculateViewportScale(1500, 720)).toBe(1);
+    expect(calculateViewportScale(1920, 1080)).toBe(1.28);
     expect(calculateViewportScale(2560, 1080)).toBe(1.5);
+    expect(calculateViewportScale(1700, 823)).toBe(1.1333);
   });
 
-  it("限制极端分辨率的最小与最大缩放", () => {
-    expect(calculateViewportScale(320, 180)).toBe(0.5);
+  it("极小视口继续缩小以保证高度边界，并限制最大缩放", () => {
+    expect(calculateViewportScale(320, 180)).toBe(0.2133);
     expect(calculateViewportScale(3840, 2160)).toBe(2);
   });
@@ -33,14 +34,16 @@
   it("窗口尺寸变化后同步更新全部子元素的统一缩放容器", async () => {
-    setViewport(1280, 720);
+    setViewport(1500, 720);
     render(<ViewportScaler><span>战术界面</span></ViewportScaler>);
     const scaler = screen.getByText("战术界面").parentElement;
 
     expect(scaler).toHaveAttribute("data-ui-scale", "1");
     expect(scaler).toHaveStyle({ width: "100%", height: "100%", transform: "scale(1)" });
+    expect(scaler?.style.getPropertyValue("--logical-viewport-width")).toBe("1500px");
+    expect(scaler?.style.getPropertyValue("--logical-viewport-height")).toBe("720px");
 
-    setViewport(1920, 1080);
+    setViewport(2250, 1080);
     fireEvent(window, new Event("resize"));
```

### `src/ui/styles.css`
```diff
--- a/src/ui/styles.css
+++ b/src/ui/styles.css
@@ -14,12 +14,12 @@
 .viewport-scaler { min-width: 0; min-height: 0; overflow: hidden; transform-origin: top left; }
 .app-shell { width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
-.topbar { flex: 0 0 76px; height: 76px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #24463c; background: rgba(5, 12, 10, 0.92); }
-.brand-block { display: flex; align-items: center; gap: 14px; }
+.topbar { flex: 0 0 76px; height: 76px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #24463c; background: rgba(5, 12, 10, 0.92); white-space: nowrap; }
+.brand-block { flex: 0 0 auto; display: flex; align-items: center; gap: 14px; }
@@ -22,7 +22,7 @@
-.topbar-controls { display: flex; align-items: center; gap: 16px; }
+.topbar-controls { flex: 0 0 auto; display: flex; align-items: center; gap: 16px; }
@@ -130,7 +130,7 @@
-.waypoint-list { display: flex; flex-direction: column; max-height: calc(100vh - 405px); overflow: auto; }
+.waypoint-list { display: flex; flex-direction: column; max-height: calc(var(--logical-viewport-height) - 405px); overflow: auto; }
@@ -214,7 +214,7 @@
-.gameplay-guide { width: min(760px, calc(100% - 64px)); max-height: calc(100% - 64px); display: flex; flex-direction: column; border: 1px solid #88672f; box-shadow: 0 0 46px rgba(0, 0, 0, 0.68), inset 0 0 40px rgba(42, 77, 64, 0.08); background: #08130f; }
+.gameplay-guide { width: min(760px, calc(var(--logical-viewport-width) - 64px)); max-height: calc(var(--logical-viewport-height) - 64px); display: flex; flex-direction: column; border: 1px solid #88672f; box-shadow: 0 0 46px rgba(0, 0, 0, 0.68), inset 0 0 40px rgba(42, 77, 64, 0.08); background: #08130f; }
@@ -239,7 +239,7 @@
-  width: min(380px, calc(100% - 48px));
+  width: min(380px, calc(var(--logical-viewport-width) - 48px));
@@ -278,12 +278,12 @@
-.campaign-screen { flex: 1 1 auto; height: auto; min-height: 0; padding: 24px; overflow: auto; overscroll-behavior: contain; background: radial-gradient(circle at 45% 45%, #10231d, #050b09 70%); }
-.campaign-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
+.campaign-screen { flex: 1 1 auto; height: auto; min-height: 0; padding: 24px; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(circle at 45% 45%, #10231d, #050b09 70%); }
+.campaign-header { flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
@@ -283,8 +283,8 @@
-.campaign-content { display: grid; grid-template-columns: minmax(700px, 1fr) 280px; min-height: 620px; border: 1px solid #1d3e34; background: rgba(4, 11, 9, 0.65); }
-.campaign-graph { position: relative; min-height: 620px; overflow: hidden; }
+.campaign-content { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(700px, 1fr) 280px; border: 1px solid #1d3e34; background: rgba(4, 11, 9, 0.65); }
+.campaign-graph { position: relative; min-height: 0; overflow: hidden; }
@@ -296,7 +296,7 @@
-.campaign-preview { padding: 22px; border-left: 1px solid #1d3e34; background: rgba(7, 17, 14, 0.88); }
+.campaign-preview { min-height: 0; padding: 22px; overflow: hidden; border-left: 1px solid #1d3e34; background: rgba(7, 17, 14, 0.88); }
```

### `AGENTS.md`
```diff
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -13,7 +13,7 @@
-- 应用界面以 `1280×720` 逻辑视口为基准，按实际视口宽高中的较小倍率对全部页面、文字、Canvas 与浮层统一等比缩放，倍率限制为 `0.5×–2×`；Canvas 指针坐标与像素密度必须补偿外层缩放。
+- 应用界面以 `1500×720` 最小逻辑视口为基准，按实际视口宽高中的较小倍率对全部页面、文字、Canvas 与浮层统一等比缩放，最大倍率为 `2×` 且极小视口继续缩小；1500px 逻辑宽度保证双语顶部栏始终单行，720px 逻辑高度保证除任务左右侧面板内部滚动外的界面元素不超过视口；Canvas 指针坐标与像素密度必须补偿外层缩放。
```

## 测试用例

### TC-001 临界宽高比中文顶部栏
- 类型：布局测试
- 优先级：高
- 前置条件：中文界面，视口为 `1700×823`。
- 操作步骤：检查顶部栏全部品牌、按钮、声音和行动代码控件。
- 预期结果：无文字换行，顶部栏 `scrollWidth` 不超过可用宽度。
- 是否通过：通过（浏览器实测）。

### TC-002 更窄比例英文顶部栏
- 类型：布局测试
- 优先级：高
- 前置条件：英文界面，视口为 `1500×823`。
- 操作步骤：检查顶部栏所有英文文案和控件。
- 预期结果：无文字换行，顶部栏逻辑宽度与 `scrollWidth` 均为 `1500px`。
- 是否通过：通过（浏览器实测）。

### TC-003 非侧栏元素高度边界
- 类型：视觉边界测试
- 优先级：高
- 操作步骤：分别检查任务网络、战术视图与操作说明弹窗中全部可见元素，排除左右任务侧面板内部元素。
- 预期结果：所有元素的顶部、底部和自身高度均位于页面高度范围内。
- 是否通过：通过（浏览器全页边界扫描，无越界元素）。

### TC-004 操作说明弹窗缩放边界
- 类型：回归测试
- 优先级：高
- 前置条件：`1700×823`，全局缩放为 `1.1333×`。
- 操作步骤：打开操作说明并读取弹窗物理边界。
- 预期结果：弹窗边界约为 `36–787px`，不超过 `823px` 页面高度，内容区可内部滚动。
- 是否通过：通过（浏览器实测）。

### TC-005 极小视口缩放
- 类型：单元测试
- 优先级：中
- 操作步骤：计算 `320×180` 视口倍率。
- 预期结果：继续缩小为 `0.2133×`，不受旧 `0.5×` 下限阻挡。
- 是否通过：通过（自动化测试）。

## 验证记录
- `npm run typecheck`：通过。
- `npm run test`：通过，34 个测试文件、160 项测试全部通过。
- `npm run build`：通过，Vite 生产构建成功。
- 浏览器验证：`1700×823` 中文和 `1500×823` 英文顶部栏均无换行、无横向溢出。
- 浏览器高度扫描：任务网络、战术工作区、说明弹窗均未发现非侧栏元素超过视口高度。
