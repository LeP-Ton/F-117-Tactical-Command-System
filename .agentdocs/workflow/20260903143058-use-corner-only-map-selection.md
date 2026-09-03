# 地图元素选中态改为纯四角标记

## 背景与目标
- 会话-141 增加的细虚线轮廓仍会与雷达范围估算圈、位置误差圈及地图区域边界叠加。
- 选中 `MAP ELEMENTS` 后只保留外围四角实线闪烁，以更轻量的视觉提示表达定位结果。

## 约束与原则
- 不修改雷达范围、位置误差、天气、地形等元素自身的地图图形。
- 不改变元素选择、地图定位、情报权限或任务状态。
- 保留角标动画、减少动态效果适配与动画帧清理逻辑。

## 阶段与 TODO
- [x] 删除点状元素的选中虚线圆。
- [x] 删除区域元素的选中虚线矩形。
- [x] 将选中几何数据收敛为统一包围盒。
- [x] 保留四角实线呼吸闪烁。
- [x] 在实际规划地图中验证地形选中态。
- [x] 完成类型检查、测试和生产构建。

## 关键风险
- 四角角标必须显式清空 Canvas 虚线状态，避免继承前序雷达或航线的虚线样式。
- 雷达自身已有两层情报圆，移除的只能是选择反馈，不得误删范围估算圈或位置误差圈。

## 当前进展
- 所有地图元素的选中态均只显示四角闪烁角标。
- 雷达情报圈和其他地图元素原始边界保持不变。
- 本地浏览器验证、31 个测试文件的 146 项测试及生产构建全部通过。

## 代码变更

### `src/ui/TacticalMap.tsx`
```diff
-type SelectionHighlight =
-  | (SelectionHighlightBounds & {
-      shape: "CIRCLE";
-      center: Vector2;
-      radius: number;
-    })
-  | (SelectionHighlightBounds & {
-      shape: "RECTANGLE";
-    });
-
-function createCircleHighlight(center: Vector2, radius: number): SelectionHighlight {
+function createCircleHighlight(center: Vector2, radius: number): SelectionHighlightBounds {
   return {
-    shape: "CIRCLE",
-    center,
-    radius,
     x: center.x - radius,
     y: center.y - radius,
     width: radius * 2,
     height: radius * 2,
   };
 }

 function resolveSelectionHighlight(
   mission: MissionSession,
   selection: MapElementSelection,
   showBelief: boolean,
-): SelectionHighlight | undefined {
+): SelectionHighlightBounds | undefined {
@@
   if (selection.kind === "EXTRACTION") {
     const area = mission.extractionArea;
     return {
-      shape: "RECTANGLE",
       x: area.x - 8,
       y: area.y - 8,
       width: area.width + 16,
       height: area.height + 16,
@@
   if (selection.kind === "TERRAIN") {
     const terrain = mission.terrain.find((item) => item.id === selection.id);
     return terrain
       ? {
-          shape: "RECTANGLE",
           x: terrain.x - 8,
           y: terrain.y - 8,
           width: terrain.width + 16,
           height: terrain.height + 16,
@@
   if (selection.kind === "WEATHER") {
     const weather = mission.weather.find((item) => item.id === selection.id);
     return weather
       ? {
-          shape: "RECTANGLE",
           x: weather.x - 8,
           y: weather.y - 8,
           width: weather.width + 16,
           height: weather.height + 16,
@@
       if (selectionHighlight) {
         context.save();
-        context.strokeStyle = "rgba(255, 214, 104, 0.72)";
-        context.lineWidth = 1.25 / metrics.scale;
-        context.setLineDash([6 / metrics.scale, 5 / metrics.scale]);
-        context.shadowColor = "rgba(255, 196, 64, 0.4)";
-        context.shadowBlur = 5 / metrics.scale;
-        context.beginPath();
-        if (selectionHighlight.shape === "CIRCLE") {
-          context.arc(
-            selectionHighlight.center.x,
-            selectionHighlight.center.y,
-            selectionHighlight.radius,
-            0,
-            Math.PI * 2,
-          );
-        } else {
-          context.rect(
-            selectionHighlight.x,
-            selectionHighlight.y,
-            selectionHighlight.width,
-            selectionHighlight.height,
-          );
-        }
-        context.stroke();
-
         const pulseOpacity = reduceMotion ? 0.78 : getSelectionPulseOpacity(timestampMs);
         const cornerSegments = getSelectionCornerSegments(
           selectionHighlight,
           7 / metrics.scale,
           15 / metrics.scale,
         );
         context.setLineDash([]);
```

## 测试用例

### TC-001 区域元素选中态
- 类型：视觉与功能测试
- 优先级：高
- 操作步骤：在任务规划页展开 `MAP ELEMENTS / ENVIRONMENT`，选择地形区域。
- 预期结果：地图只显示四角闪烁角标，不新增虚线矩形；地形自身边界不变。
- 是否通过：通过。

### TC-002 雷达情报图形隔离
- 类型：回归检查
- 优先级：高
- 预期结果：雷达范围估算圈和位置误差圈继续显示，Map Elements 选择态不再增加第三层虚线轮廓。
- 是否通过：通过。

### TC-003 工程验证
- 类型：自动化测试
- 优先级：高
- 执行命令：`npm run typecheck`、`npm run test`、`npm run build`。
- 预期结果：全部通过。
- 是否通过：通过；31 个测试文件、146 项测试全部通过，生产构建完成。
