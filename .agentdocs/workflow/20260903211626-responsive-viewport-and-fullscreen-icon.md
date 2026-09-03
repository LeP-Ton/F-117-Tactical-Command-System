# 全局视口自适应与全屏图标重绘

## 背景与目标
- 将原有方框式全屏图标重绘为更清晰的四角展开/收拢图标。
- 让任务网络、情报预览、任务规划、任务执行、复盘、弹窗、引导、文字与 Canvas 随页面分辨率统一等比变化。
- 保持地图点击、拖动、高清绘制与任务引导高亮在缩放后仍准确。

## 约束与原则
- 使用单一逻辑视口缩放整个应用，避免逐个重写大量固定像素尺寸后产生比例不一致。
- 以 `1280×720` 为 `1×` 基准，按视口宽高中的较小倍率缩放，范围限制为 `0.5×–2×`。
- 缩放只属于渲染层，不进入 Run、Mission、Seed、回放或本地存档。
- Canvas 的逻辑坐标、物理像素密度与 DOM 浮层坐标必须显式补偿外层缩放。

## 阶段与 TODO
- [x] 重绘全屏进入与退出图标。
- [x] 新增全局视口缩放容器与动态尺寸监听。
- [x] 移除阻止小视口适配的 `body` 最小宽度。
- [x] 补偿战术地图指针坐标与 Canvas 物理像素密度。
- [x] 补偿任务引导高亮与卡片方位计算。
- [x] 更新核心项目认知、文档索引与自动化测试。
- [x] 完成多分辨率、地图交互与引导高亮浏览器验证。

## 关键风险
- CSS `transform`（变换）会让 DOM 的物理坐标与 Canvas 的逻辑坐标产生倍率差，若不换算会导致航点点击和拖动偏移。
- 高分辨率下只放大 Canvas 的 CSS 外观会导致文字和线条发虚，因此位图尺寸必须纳入实际渲染倍率。
- `getBoundingClientRect` 返回变换后的坐标，而任务引导浮层位于变换容器内部，需要先还原到逻辑坐标系。

## 当前进展
- 所有应用页面现由 `ViewportScaler` 统一缩放，窗口、可视视口或全屏状态变化时实时重算。
- 全屏按钮使用 SVG（可缩放矢量图形）四角图标，进入和退出状态具有不同路径。
- `800×600`、`1280×720`、`1920×1080` 浏览器视口分别验证为 `0.625×`、`1×`、`1.5×`，页面无溢出。
- 在 `1.5×` 下点击战术地图物理中心，正确生成世界坐标 `X 0500 / Y 0500`；任务引导高亮与地图边界一致。

## 代码变更

### `src/ui/ViewportScaler.tsx`（新增）
```diff
--- /dev/null
+++ b/src/ui/ViewportScaler.tsx
@@ -0,0 +1,44 @@
+import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
+
+export const referenceViewport = { width: 1280, height: 720 } as const;
+const minimumScale = 0.5;
+const maximumScale = 2;
+
+export function calculateViewportScale(width: number, height: number): number {
+  if (width <= 0 || height <= 0) return 1;
+  const fittedScale = Math.min(width / referenceViewport.width, height / referenceViewport.height);
+  return Math.round(Math.min(maximumScale, Math.max(minimumScale, fittedScale)) * 10_000) / 10_000;
+}
+
+function readViewportScale(): number {
+  return calculateViewportScale(window.innerWidth, window.innerHeight);
+}
+
+interface ViewportScalerProps {
+  children: ReactNode;
+}
+
+export function ViewportScaler({ children }: ViewportScalerProps) {
+  const [scale, setScale] = useState(readViewportScale);
+
+  useEffect(() => {
+    // 窗口缩放、浏览器全屏和移动端可视区域变化都统一重算应用比例。
+    const updateScale = () => setScale(readViewportScale());
+    window.addEventListener("resize", updateScale);
+    window.visualViewport?.addEventListener("resize", updateScale);
+    document.addEventListener("fullscreenchange", updateScale);
+    return () => {
+      window.removeEventListener("resize", updateScale);
+      window.visualViewport?.removeEventListener("resize", updateScale);
+      document.removeEventListener("fullscreenchange", updateScale);
+    };
+  }, []);
+
+  const style = {
+    width: `${100 / scale}%`,
+    height: `${100 / scale}%`,
+    transform: `scale(${scale})`,
+  } as CSSProperties;
+
+  return <div className="viewport-scaler" style={style} data-ui-scale={scale}>{children}</div>;
+}
```

### `src/ui/ViewportScaler.test.tsx`（新增）
```diff
--- /dev/null
+++ b/src/ui/ViewportScaler.test.tsx
@@ -0,0 +1,45 @@
+import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
+import { afterEach, describe, expect, it } from "vitest";
+import { calculateViewportScale, ViewportScaler } from "./ViewportScaler";
+
+const originalViewport = { width: window.innerWidth, height: window.innerHeight };
+
+function setViewport(width: number, height: number): void {
+  Object.defineProperties(window, {
+    innerWidth: { configurable: true, value: width },
+    innerHeight: { configurable: true, value: height },
+  });
+}
+
+afterEach(() => {
+  cleanup();
+  setViewport(originalViewport.width, originalViewport.height);
+});
+
+describe("全局视口自适应", () => {
+  it("以 1280×720 为基准按宽高较小倍率等比缩放", () => {
+    expect(calculateViewportScale(1280, 720)).toBe(1);
+    expect(calculateViewportScale(1920, 1080)).toBe(1.5);
+    expect(calculateViewportScale(2560, 1080)).toBe(1.5);
+  });
+
+  it("限制极端分辨率的最小与最大缩放", () => {
+    expect(calculateViewportScale(320, 180)).toBe(0.5);
+    expect(calculateViewportScale(3840, 2160)).toBe(2);
+  });
+
+  it("窗口尺寸变化后同步更新全部子元素的统一缩放容器", async () => {
+    setViewport(1280, 720);
+    render(<ViewportScaler><span>战术界面</span></ViewportScaler>);
+    const scaler = screen.getByText("战术界面").parentElement;
+
+    expect(scaler).toHaveAttribute("data-ui-scale", "1");
+    expect(scaler).toHaveStyle({ width: "100%", height: "100%", transform: "scale(1)" });
+
+    setViewport(1920, 1080);
+    fireEvent(window, new Event("resize"));
+
+    await waitFor(() => expect(scaler).toHaveAttribute("data-ui-scale", "1.5"));
+    expect(scaler).toHaveStyle({ transform: "scale(1.5)" });
+  });
+});
```

### `src/main.tsx`
```diff
--- a/src/main.tsx
+++ b/src/main.tsx
@@ -2,12 +2,15 @@
 import ReactDOM from "react-dom/client";
 import { I18nProvider } from "./i18n/I18n";
 import { App } from "./ui/App";
+import { ViewportScaler } from "./ui/ViewportScaler";
 import "./ui/styles.css";
 
 ReactDOM.createRoot(document.getElementById("root")!).render(
   <React.StrictMode>
     <I18nProvider>
-      <App />
+      <ViewportScaler>
+        <App />
+      </ViewportScaler>
     </I18nProvider>
```

### `src/ui/FullscreenToggle.tsx`
```diff
--- a/src/ui/FullscreenToggle.tsx
+++ b/src/ui/FullscreenToggle.tsx
@@ -45,7 +45,12 @@
     title={supported ? label : copy.app.fullscreenUnavailable}
   >
-    <i aria-hidden="true" />
+    <svg className="fullscreen-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
+      <path d={isFullscreen
+        ? "M9 3v6H3 M15 3v6h6 M21 15h-6v6 M3 15h6v6"
+        : "M8 3H3v5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5"}
+      />
+    </svg>
     <span>{label}</span>
```

### `src/ui/FullscreenToggle.test.tsx`
```diff
--- a/src/ui/FullscreenToggle.test.tsx
+++ b/src/ui/FullscreenToggle.test.tsx
@@ -38,11 +38,15 @@
   it("进入和退出全屏时同步按钮状态", async () => {
     render(<I18nProvider initialLanguage="zh" persist={false}><FullscreenToggle /></I18nProvider>);
 
-    fireEvent.click(screen.getByRole("button", { name: "全屏显示" }));
+    const enterButton = screen.getByRole("button", { name: "全屏显示" });
+    const enterIconPath = enterButton.querySelector("svg path")?.getAttribute("d");
+    expect(enterIconPath).toBeTruthy();
+    fireEvent.click(enterButton);
 
     await waitFor(() => expect(requestFullscreen).toHaveBeenCalledOnce());
     const exitButton = screen.getByRole("button", { name: "退出全屏" });
     expect(exitButton).toHaveAttribute("aria-pressed", "true");
+    expect(exitButton.querySelector("svg path")?.getAttribute("d")).not.toBe(enterIconPath);
```

### `src/ui/TacticalMap.tsx`
```diff
--- a/src/ui/TacticalMap.tsx
+++ b/src/ui/TacticalMap.tsx
@@ -57,12 +57,21 @@
 }
 
-function screenToWorld(canvas: HTMLCanvasElement, clientX: number, clientY: number): Vector2 {
+function clientToCanvas(canvas: HTMLCanvasElement, clientX: number, clientY: number): Vector2 {
   const rect = canvas.getBoundingClientRect();
+  return {
+    // 应用外壳会整体缩放，指针坐标需还原到 Canvas 的逻辑布局坐标。
+    x: (clientX - rect.left) * (rect.width > 0 ? canvas.clientWidth / rect.width : 1),
+    y: (clientY - rect.top) * (rect.height > 0 ? canvas.clientHeight / rect.height : 1),
+  };
+}
+
+function screenToWorld(canvas: HTMLCanvasElement, clientX: number, clientY: number): Vector2 {
   const metrics = getMetrics(canvas);
+  const position = clientToCanvas(canvas, clientX, clientY);
   return {
-    x: Math.max(0, Math.min(gameConfig.world.width, (clientX - rect.left - metrics.offsetX) / metrics.scale)),
-    y: Math.max(0, Math.min(gameConfig.world.height, (clientY - rect.top - metrics.offsetY) / metrics.scale)),
+    x: Math.max(0, Math.min(gameConfig.world.width, (position.x - metrics.offsetX) / metrics.scale)),
+    y: Math.max(0, Math.min(gameConfig.world.height, (position.y - metrics.offsetY) / metrics.scale)),
   };
 }
@@ -163,8 +172,11 @@
     const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
 
     const render = (timestampMs = performance.now()) => {
-      const pixelRatio = window.devicePixelRatio || 1;
       const metrics = getMetrics(canvas);
+      const renderedWidth = canvas.getBoundingClientRect().width;
+      // 物理像素密度包含全局界面缩放，避免高分辨率放大时 Canvas 文字与线条发虚。
+      const visualScale = metrics.width > 0 && renderedWidth > 0 ? renderedWidth / metrics.width : 1;
+      const pixelRatio = (window.devicePixelRatio || 1) * visualScale;
       const pixelWidth = Math.round(metrics.width * pixelRatio);
@@ -482,8 +494,7 @@
     if (readOnly) return;
     const canvas = canvasRef.current;
     if (!canvas) return;
-    const rect = canvas.getBoundingClientRect();
-    const hitIndex = findWaypointIndex({ x: event.clientX - rect.left, y: event.clientY - rect.top });
+    const hitIndex = findWaypointIndex(clientToCanvas(canvas, event.clientX, event.clientY));
```

### `src/ui/MissionTutorial.tsx`
```diff
--- a/src/ui/MissionTutorial.tsx
+++ b/src/ui/MissionTutorial.tsx
@@ -85,12 +85,24 @@
         setFocusRect(null);
         return;
       }
+      const scaler = target.closest<HTMLElement>(".viewport-scaler");
+      const scalerRect = scaler?.getBoundingClientRect();
+      // getBoundingClientRect 返回缩放后的物理坐标，浮层定位则运行在缩放容器的逻辑坐标系中。
+      const scale = scaler && scalerRect && scaler.clientWidth > 0 ? scalerRect.width / scaler.clientWidth : 1;
+      const logicalViewportWidth = window.innerWidth / scale;
+      const logicalViewportHeight = window.innerHeight / scale;
+      const logicalRect = {
+        top: rect.top / scale,
+        left: rect.left / scale,
+        width: rect.width / scale,
+        height: rect.height / scale,
+      };
       const inset = 6;
       setFocusRect({
-        top: Math.max(8, rect.top - inset),
-        left: Math.max(8, rect.left - inset),
-        width: Math.min(window.innerWidth - Math.max(8, rect.left - inset) - 8, rect.width + inset * 2),
-        height: Math.min(window.innerHeight - Math.max(8, rect.top - inset) - 8, rect.height + inset * 2),
+        top: Math.max(8, logicalRect.top - inset),
+        left: Math.max(8, logicalRect.left - inset),
+        width: Math.min(logicalViewportWidth - Math.max(8, logicalRect.left - inset) - 8, logicalRect.width + inset * 2),
+        height: Math.min(logicalViewportHeight - Math.max(8, logicalRect.top - inset) - 8, logicalRect.height + inset * 2),
       });
@@ -156,8 +168,11 @@
   const stepCopy = copy.tutorial.steps[step.id as TutorialStepId];
   const canGoBack = resolvedStepIndex > 0 && tutorialSteps[resolvedStepIndex - 1]?.context === step.context;
-  const cardHorizontal = focusRect && focusRect.left + focusRect.width / 2 > window.innerWidth / 2 ? "left" : "right";
-  const cardVertical = focusRect && focusRect.top + focusRect.height / 2 > window.innerHeight / 2 ? "top" : "bottom";
+  const logicalViewport = document.querySelector<HTMLElement>(".viewport-scaler");
+  const logicalViewportWidth = logicalViewport?.clientWidth ?? window.innerWidth;
+  const logicalViewportHeight = logicalViewport?.clientHeight ?? window.innerHeight;
+  const cardHorizontal = focusRect && focusRect.left + focusRect.width / 2 > logicalViewportWidth / 2 ? "left" : "right";
+  const cardVertical = focusRect && focusRect.top + focusRect.height / 2 > logicalViewportHeight / 2 ? "top" : "bottom";
```

### `src/ui/styles.css`
```diff
--- a/src/ui/styles.css
+++ b/src/ui/styles.css
@@ -9,10 +9,11 @@
 html, body, #root { width: 100%; height: 100%; overflow: hidden; }
-body { margin: 0; min-width: 1080px; background: radial-gradient(circle at 50% 20%, #10201b 0%, #050a09 55%); }
+body { margin: 0; background: radial-gradient(circle at 50% 20%, #10201b 0%, #050a09 55%); }
 button { font: inherit; }
 
-.app-shell { width: 100%; height: 100vh; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
+.viewport-scaler { min-width: 0; min-height: 0; overflow: hidden; transform-origin: top left; }
+.app-shell { width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
@@ -27,10 +28,7 @@
 .fullscreen-trigger { display: flex; align-items: center; gap: 7px; color: #8eb6aa; border-color: #31584b; }
 .fullscreen-trigger.active { color: #f1c466; border-color: #b88a35; background: rgba(98, 70, 22, 0.24); }
-.fullscreen-trigger i { position: relative; width: 10px; height: 10px; border: 1px solid currentColor; }
-.fullscreen-trigger i::before { content: ""; position: absolute; inset: 2px; border: 1px solid #0b1b17; background: #0b1b17; }
-.fullscreen-trigger:hover:not(:disabled) i::before { border-color: #102a23; background: #102a23; }
-.fullscreen-trigger.active i::before { border-color: rgba(98, 70, 22, 0.24); background: rgba(98, 70, 22, 0.24); }
+.fullscreen-icon { width: 13px; height: 13px; flex: 0 0 13px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: square; stroke-linejoin: miter; }
```

### `AGENTS.md`
```diff
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -11,6 +11,7 @@
 - `RunState` 与 `MissionSession` 严格分离；Seed、Campaign 和 Enemy Adaptation 均保留独立扩展边界。
 - Canvas 只负责绘制与坐标交互，游戏状态以 reducer 和领域模型为唯一事实来源。
+- 应用界面以 `1280×720` 逻辑视口为基准，按实际视口宽高中的较小倍率对全部页面、文字、Canvas 与浮层统一等比缩放，倍率限制为 `0.5×–2×`；Canvas 指针坐标与像素密度必须补偿外层缩放。
 - 游戏内全部玩家可见文案支持简体中文与 English 即时切换；中文界面的任务类型与系统术语必须完整中文化，仅保留 `F-117`、任务/雷达/天气/航点编号、坐标轴和计量单位等必要识别符。
```

## 测试用例

### TC-001 基准与高分辨率统一缩放
- 类型：功能测试
- 优先级：高
- 关联模块：`ViewportScaler`
- 操作步骤：分别设置 `1280×720` 与 `1920×1080` 视口。
- 预期结果：缩放倍率分别为 `1×` 与 `1.5×`，全部页面元素及文字保持相同比例，页面无滚动溢出。
- 是否通过：通过（自动化测试与浏览器实测）。

### TC-002 小分辨率缩放
- 类型：兼容性测试
- 优先级：高
- 关联模块：`ViewportScaler`
- 操作步骤：设置 `800×600` 视口并检查完整任务网络。
- 预期结果：缩放倍率为 `0.625×`，页面宽高均无溢出，所有元素仍在视口内。
- 是否通过：通过（浏览器实测）。

### TC-003 缩放后的地图坐标
- 类型：交互测试
- 优先级：高
- 关联模块：`TacticalMap`
- 前置条件：`1920×1080`、`1.5×` 缩放，任务处于规划状态。
- 操作步骤：点击战术地图物理中心。
- 预期结果：新增航点的世界坐标为 `X 0500 / Y 0500`。
- 是否通过：通过（浏览器实测）。

### TC-004 缩放后的任务引导
- 类型：视觉与交互测试
- 优先级：高
- 关联模块：`MissionTutorial`
- 操作步骤：在 `1.5×` 缩放下启动任务引导并检查战术地图步骤。
- 预期结果：高亮边框与地图边界保持固定内外间距，引导卡片位于未遮挡侧。
- 是否通过：通过（浏览器实测）。

### TC-005 全屏图标状态
- 类型：组件测试
- 优先级：中
- 关联模块：`FullscreenToggle`
- 操作步骤：进入和退出全屏。
- 预期结果：按钮使用 SVG 四角图标，进入和退出状态的路径不同且文案同步。
- 是否通过：通过（自动化测试与浏览器实测）。

## 验证记录
- `npm run typecheck`：通过。
- `npm run test`：通过，34 个测试文件、160 项测试全部通过。
- `npm run build`：通过，Vite 生产构建成功。
- 浏览器分辨率验证：`800×600 → 0.625×`、`1280×720 → 1×`、`1920×1080 → 1.5×`，`scrollWidth/scrollHeight` 均未超过视口。
- 浏览器交互验证：`1.5×` 下地图中心点击生成 `X 0500 / Y 0500`；任务引导高亮与缩放后地图精确对齐。
