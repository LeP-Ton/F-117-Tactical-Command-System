# 地图元素选中框精细化与四角闪烁

## 背景与目标
- `MAP ELEMENTS` 定位目标后，原有 `3px` 高亮虚线与强光晕过重，遮挡地图细节。
- 将主体轮廓改为细虚线，并在轮廓包围盒外增加四组实线角标，通过平滑明暗变化强化选中反馈。
- 点状元素继续使用圆形主体轮廓，区域元素继续使用矩形主体轮廓；两类元素共享一致的四角识别语言。

## 约束与原则
- 不改变地图元素选择、定位、情报权限或任务状态。
- 仅在存在选中元素时启动逐帧动画，取消选择后停止持续重绘。
- 响应系统“减少动态效果”偏好：关闭角标动画并保留静态选中反馈。

## 阶段与 TODO
- [x] 将选中主体轮廓从 `3px` 收敛为 `1.25px`，同步降低阴影强度。
- [x] 为点状和区域元素计算统一包围盒。
- [x] 在包围盒外围绘制四组实线直角标记。
- [x] 增加约 `1.1s` 的平滑闪烁周期，并限制动画运行边界。
- [x] 增加角标几何和透明度纯函数测试。
- [x] 在实际任务规划地图中分别验证地形区域与任务目标选中效果。

## 关键风险
- Canvas 动画会重绘整张地图，因此必须只在选中状态运行，并避免每帧重复重置相同尺寸的画布缓冲区。
- 点状元素没有天然矩形边界，需要用圆形主体轮廓的外接矩形定位角标，保证四角不会压住目标本体。

## 当前进展
- 细虚线、外围实线角标和平滑闪烁已完成。
- 地形、天气、撤离区、飞机、目标、航点和雷达统一支持新效果。
- 类型检查、专项测试和本地浏览器视觉验证通过。

## 代码变更

### `src/ui/mapSelectionHighlight.ts`
```diff
--- /dev/null
+++ b/src/ui/mapSelectionHighlight.ts
@@ -0,0 +1,46 @@
+export interface SelectionHighlightBounds {
+  x: number;
+  y: number;
+  width: number;
+  height: number;
+}
+
+export interface SelectionHighlightSegment {
+  from: { x: number; y: number };
+  to: { x: number; y: number };
+}
+
+/**
+ * 生成位于选中轮廓外侧的四组直角标记，每组由一条横线和一条竖线组成。
+ */
+export function getSelectionCornerSegments(
+  bounds: SelectionHighlightBounds,
+  offset: number,
+  armLength: number,
+): SelectionHighlightSegment[] {
+  const left = bounds.x - offset;
+  const right = bounds.x + bounds.width + offset;
+  const top = bounds.y - offset;
+  const bottom = bounds.y + bounds.height + offset;
+
+  return [
+    { from: { x: left, y: top }, to: { x: left + armLength, y: top } },
+    { from: { x: left, y: top }, to: { x: left, y: top + armLength } },
+    { from: { x: right - armLength, y: top }, to: { x: right, y: top } },
+    { from: { x: right, y: top }, to: { x: right, y: top + armLength } },
+    { from: { x: left, y: bottom }, to: { x: left + armLength, y: bottom } },
+    { from: { x: left, y: bottom - armLength }, to: { x: left, y: bottom } },
+    { from: { x: right - armLength, y: bottom }, to: { x: right, y: bottom } },
+    { from: { x: right, y: bottom - armLength }, to: { x: right, y: bottom } },
+  ];
+}
+
+/**
+ * 使用平滑周期控制角标明暗，避免硬切闪烁干扰地图判读。
+ */
+export function getSelectionPulseOpacity(timestampMs: number): number {
+  const cycleMs = 1100;
+  const phase = (timestampMs / cycleMs) * Math.PI * 2;
+  const normalized = (Math.sin(phase) + 1) / 2;
+  return 0.38 + normalized * 0.62;
+}
```

### `src/ui/mapSelectionHighlight.test.ts`
```diff
--- /dev/null
+++ b/src/ui/mapSelectionHighlight.test.ts
@@ -0,0 +1,27 @@
+import { describe, expect, it } from "vitest";
+import { getSelectionCornerSegments, getSelectionPulseOpacity } from "./mapSelectionHighlight";
+
+describe("地图元素选中效果", () => {
+  it("在选中范围外生成四组实线角标", () => {
+    const bounds = { x: 100, y: 200, width: 80, height: 60 };
+    const segments = getSelectionCornerSegments(bounds, 6, 14);
+
+    expect(segments).toHaveLength(8);
+    expect(segments[0]).toEqual({
+      from: { x: 94, y: 194 },
+      to: { x: 108, y: 194 },
+    });
+    expect(segments[7]).toEqual({
+      from: { x: 186, y: 252 },
+      to: { x: 186, y: 266 },
+    });
+  });
+
+  it("将呼吸闪烁透明度限制在清晰但不过亮的范围内", () => {
+    const quarterCycle = 1100 / 4;
+    const threeQuarterCycle = (1100 * 3) / 4;
+
+    expect(getSelectionPulseOpacity(quarterCycle)).toBeCloseTo(1);
+    expect(getSelectionPulseOpacity(threeQuarterCycle)).toBeCloseTo(0.38);
+  });
+});
```

### `src/ui/TacticalMap.tsx`
```diff
diff --git a/src/ui/TacticalMap.tsx b/src/ui/TacticalMap.tsx
index bffcb5d..88aaf8f 100644
--- a/src/ui/TacticalMap.tsx
+++ b/src/ui/TacticalMap.tsx
@@ -7,6 +7,11 @@ import type { GameAction } from "../game/gameReducer";
 import f117TopSilhouette from "../assets/f117-top-silhouette.png";
 import type { MapElementSelection } from "./mapSelection";
 import { useI18n } from "../i18n/I18n";
+import {
+  getSelectionCornerSegments,
+  getSelectionPulseOpacity,
+  type SelectionHighlightBounds,
+} from "./mapSelectionHighlight";
 
 interface TacticalMapProps {
   mission: MissionSession;
@@ -26,6 +31,16 @@ interface CanvasMetrics {
   offsetY: number;
 }
 
+type SelectionHighlight =
+  | (SelectionHighlightBounds & {
+      shape: "CIRCLE";
+      center: Vector2;
+      radius: number;
+    })
+  | (SelectionHighlightBounds & {
+      shape: "RECTANGLE";
+    });
+
 const radarContactColors: Record<RadarType, { stroke: string; fill: string }> = {
   EARLY_WARNING: { stroke: "rgba(224, 176, 72, 0.36)", fill: "rgba(224, 176, 72, 0.035)" },
   ACQUISITION: { stroke: "rgba(224, 112, 78, 0.36)", fill: "rgba(224, 112, 78, 0.035)" },
@@ -77,6 +92,74 @@ function drawAircraft(
   context.restore();
 }
 
+function createCircleHighlight(center: Vector2, radius: number): SelectionHighlight {
+  return {
+    shape: "CIRCLE",
+    center,
+    radius,
+    x: center.x - radius,
+    y: center.y - radius,
+    width: radius * 2,
+    height: radius * 2,
+  };
+}
+
+function resolveSelectionHighlight(
+  mission: MissionSession,
+  selection: MapElementSelection,
+  showBelief: boolean,
+): SelectionHighlight | undefined {
+  if (selection.kind === "AIRCRAFT") {
+    return createCircleHighlight(mission.aircraft.position, 34);
+  }
+  if (selection.kind === "TARGET") {
+    return createCircleHighlight(mission.target.position, mission.target.attackRadius + 12);
+  }
+  if (selection.kind === "EXTRACTION") {
+    const area = mission.extractionArea;
+    return {
+      shape: "RECTANGLE",
+      x: area.x - 8,
+      y: area.y - 8,
+      width: area.width + 16,
+      height: area.height + 16,
+    };
+  }
+  if (selection.kind === "WAYPOINT") {
+    const waypoint = mission.route.waypoints.find((item) => item.id === selection.id);
+    return waypoint ? createCircleHighlight(waypoint.position, 22) : undefined;
+  }
+  if (selection.kind === "TERRAIN") {
+    const terrain = mission.terrain.find((item) => item.id === selection.id);
+    return terrain
+      ? {
+          shape: "RECTANGLE",
+          x: terrain.x - 8,
+          y: terrain.y - 8,
+          width: terrain.width + 16,
+          height: terrain.height + 16,
+        }
+      : undefined;
+  }
+  if (selection.kind === "WEATHER") {
+    const weather = mission.weather.find((item) => item.id === selection.id);
+    return weather
+      ? {
+          shape: "RECTANGLE",
+          x: weather.x - 8,
+          y: weather.y - 8,
+          width: weather.width + 16,
+          height: weather.height + 16,
+        }
+      : undefined;
+  }
+
+  const radarPosition = showBelief
+    ? mission.radars.find((radar) => radar.id === selection.id)?.position
+    : mission.radarIntel.find((radar) => radar.radarId === selection.id)?.estimatedPosition;
+  return radarPosition ? createCircleHighlight(radarPosition, 24) : undefined;
+}
+
 export function TacticalMap({ mission, showBelief, selectedIndex, onSelect, dispatch, mapSelection, readOnly = false }: TacticalMapProps) {
   const { copy } = useI18n();
   const canvasRef = useRef<HTMLCanvasElement>(null);
@@ -91,12 +174,19 @@ export function TacticalMap({ mission, showBelief, selectedIndex, onSelect, disp
     if (!context) return;
     const aircraftImage = new Image();
     aircraftImage.src = f117TopSilhouette;
+    let animationFrameId: number | undefined;
+    let disposed = false;
+    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
 
-    const render = () => {
+    const render = (timestampMs = performance.now()) => {
       const pixelRatio = window.devicePixelRatio || 1;
       const metrics = getMetrics(canvas);
-      canvas.width = Math.round(metrics.width * pixelRatio);
-      canvas.height = Math.round(metrics.height * pixelRatio);
+      const pixelWidth = Math.round(metrics.width * pixelRatio);
+      const pixelHeight = Math.round(metrics.height * pixelRatio);
+      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
+        canvas.width = pixelWidth;
+        canvas.height = pixelHeight;
+      }
       context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
       context.clearRect(0, 0, metrics.width, metrics.height);
       context.fillStyle = "#07100e";
@@ -331,48 +421,80 @@ export function TacticalMap({ mission, showBelief, selectedIndex, onSelect, disp
 
       drawAircraft(context, aircraftImage, mission.aircraft.position, mission.aircraft.headingDegrees);
 
-      if (mapSelection) {
+      const selectionHighlight = mapSelection
+        ? resolveSelectionHighlight(mission, mapSelection, showBelief)
+        : undefined;
+      if (selectionHighlight) {
         context.save();
-        context.strokeStyle = "rgba(255, 214, 104, 0.95)";
-        context.lineWidth = 3 / metrics.scale;
-        context.setLineDash([8 / metrics.scale, 5 / metrics.scale]);
-        context.shadowColor = "rgba(255, 196, 64, 0.75)";
-        context.shadowBlur = 14 / metrics.scale;
+        context.strokeStyle = "rgba(255, 214, 104, 0.72)";
+        context.lineWidth = 1.25 / metrics.scale;
+        context.setLineDash([6 / metrics.scale, 5 / metrics.scale]);
+        context.shadowColor = "rgba(255, 196, 64, 0.4)";
+        context.shadowBlur = 5 / metrics.scale;
         context.beginPath();
-        if (mapSelection.kind === "AIRCRAFT") {
-          context.arc(mission.aircraft.position.x, mission.aircraft.position.y, 34, 0, Math.PI * 2);
-        } else if (mapSelection.kind === "TARGET") {
-          context.arc(mission.target.position.x, mission.target.position.y, mission.target.attackRadius + 12, 0, Math.PI * 2);
-        } else if (mapSelection.kind === "EXTRACTION") {
-          const area = mission.extractionArea;
-          context.rect(area.x - 8, area.y - 8, area.width + 16, area.height + 16);
-        } else if (mapSelection.kind === "WAYPOINT") {
-          const waypoint = mission.route.waypoints.find((item) => item.id === mapSelection.id);
-          if (waypoint) context.arc(waypoint.position.x, waypoint.position.y, 22, 0, Math.PI * 2);
-        } else if (mapSelection.kind === "TERRAIN") {
-          const terrain = mission.terrain.find((item) => item.id === mapSelection.id);
-          if (terrain) context.rect(terrain.x - 8, terrain.y - 8, terrain.width + 16, terrain.height + 16);
-        } else if (mapSelection.kind === "WEATHER") {
-          const weather = mission.weather.find((item) => item.id === mapSelection.id);
-          if (weather) context.rect(weather.x - 8, weather.y - 8, weather.width + 16, weather.height + 16);
+        if (selectionHighlight.shape === "CIRCLE") {
+          context.arc(
+            selectionHighlight.center.x,
+            selectionHighlight.center.y,
+            selectionHighlight.radius,
+            0,
+            Math.PI * 2,
+          );
         } else {
-          const radarPosition = showBelief
-            ? mission.radars.find((radar) => radar.id === mapSelection.id)?.position
-            : mission.radarIntel.find((radar) => radar.radarId === mapSelection.id)?.estimatedPosition;
-          if (radarPosition) context.arc(radarPosition.x, radarPosition.y, 24, 0, Math.PI * 2);
+          context.rect(
+            selectionHighlight.x,
+            selectionHighlight.y,
+            selectionHighlight.width,
+            selectionHighlight.height,
+          );
         }
         context.stroke();
+
+        const pulseOpacity = reduceMotion ? 0.78 : getSelectionPulseOpacity(timestampMs);
+        const cornerSegments = getSelectionCornerSegments(
+          selectionHighlight,
+          7 / metrics.scale,
+          15 / metrics.scale,
+        );
+        context.setLineDash([]);
+        context.strokeStyle = `rgba(255, 220, 112, ${pulseOpacity})`;
+        context.lineWidth = 2 / metrics.scale;
+        context.lineCap = "square";
+        context.shadowColor = `rgba(255, 196, 64, ${pulseOpacity * 0.72})`;
+        context.shadowBlur = (4 + pulseOpacity * 5) / metrics.scale;
+        context.beginPath();
+        cornerSegments.forEach((segment) => {
+          context.moveTo(segment.from.x, segment.from.y);
+          context.lineTo(segment.to.x, segment.to.y);
+        });
+        context.stroke();
         context.restore();
       }
       context.restore();
     };
 
-    aircraftImage.addEventListener("load", render);
-    render();
-    const observer = new ResizeObserver(render);
+    const renderAnimatedFrame = (timestampMs: number) => {
+      render(timestampMs);
+      if (!disposed) {
+        animationFrameId = window.requestAnimationFrame(renderAnimatedFrame);
+      }
+    };
+    const handleImageLoad = () => render(performance.now());
+
+    aircraftImage.addEventListener("load", handleImageLoad);
+    if (mapSelection && !reduceMotion) {
+      animationFrameId = window.requestAnimationFrame(renderAnimatedFrame);
+    } else {
+      render();
+    }
+    const observer = new ResizeObserver(() => render(performance.now()));
     observer.observe(canvas);
     return () => {
-      aircraftImage.removeEventListener("load", render);
+      disposed = true;
+      if (animationFrameId !== undefined) {
+        window.cancelAnimationFrame(animationFrameId);
+      }
+      aircraftImage.removeEventListener("load", handleImageLoad);
       observer.disconnect();
     };
   }, [copy, mission, selectedIndex, showBelief, mapSelection]);
```

## 测试用例

### TC-001 区域元素选中框
- 类型：视觉与功能测试
- 优先级：高
- 操作步骤：展开 `MAP ELEMENTS / ENVIRONMENT` 并选择一个地形区域。
- 预期结果：区域外围显示细虚线矩形，四角外侧显示明暗变化的实线角标。
- 是否通过：通过。

### TC-002 点状元素选中框
- 类型：视觉与功能测试
- 优先级：高
- 操作步骤：展开 `MAP ELEMENTS / MISSION OBJECTIVES` 并选择任务目标。
- 预期结果：目标外围保留细虚线圆形，外接矩形四角显示闪烁实线角标。
- 是否通过：通过。

### TC-003 动画降级与资源清理
- 类型：自动化与代码检查
- 优先级：中
- 预期结果：减少动态效果模式使用静态角标；取消选择或卸载组件时取消动画帧。
- 是否通过：通过。

### TC-004 工程验证
- 类型：自动化测试
- 优先级：高
- 执行命令：`npm run typecheck`、`npm run test`、`npm run build`。
- 预期结果：全部通过。
- 是否通过：通过；31 个测试文件、146 个测试全部通过，生产构建完成。
