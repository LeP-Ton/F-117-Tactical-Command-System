# 地图使用 F-117 俯视轮廓图

## 背景与目标
- 用户新增 `src/assets/f117-top-silhouette.png` 金色 F-117 俯视轮廓图。
- 使用该图片替换战术地图中代码绘制的简化三角飞机符号。

## 约束与原则
- 直接通过 Canvas `drawImage` 绘制图片，不添加 SVG、滤镜或颜色处理。
- 保持飞机位置和航向继续由任务状态驱动。
- 图片机头朝上，与现有航向 0° 的地图绘制基准一致。

## 阶段与 TODO
- [x] 检查俯视图尺寸、透明度与朝向。
- [x] 接入图片加载与 Canvas 重绘。
- [x] 使用俯视图替换简化三角符号。
- [x] 完成类型检查、自动化测试与生产构建。

## 关键风险
- 图片首次异步加载完成前不会绘制飞机；加载事件会主动触发一次 Canvas 重绘。
- 当前显示尺寸为 32×48 个地图单位，兼顾轮廓辨识度与航线可读性。

## 代码变更
- `src/ui/TacticalMap.tsx`
```diff
+import f117TopSilhouette from "../assets/f117-top-silhouette.png";

-function drawAircraft(context: CanvasRenderingContext2D, position: Vector2, heading: number): void {
+function drawAircraft(
+  context: CanvasRenderingContext2D,
+  image: HTMLImageElement,
+  position: Vector2,
+  heading: number,
+): void {
+  if (!image.complete || image.naturalWidth === 0) return;
+
   context.save();
   context.translate(position.x, position.y);
   context.rotate((heading * Math.PI) / 180);
-  context.beginPath();
-  context.moveTo(0, -15);
-  context.lineTo(11, 11);
-  context.lineTo(0, 6);
-  context.lineTo(-11, 11);
-  context.closePath();
-  context.fillStyle = "#f2bd4a";
-  context.shadowColor = "#f2bd4a";
-  context.shadowBlur = 12;
-  context.fill();
+  // 图片机头朝上，与航向 0° 的地图坐标基准一致，无需额外角度修正。
+  context.drawImage(image, -16, -24, 32, 48);
   context.restore();
 }

+    const aircraftImage = new Image();
+    aircraftImage.src = f117TopSilhouette;

-      drawAircraft(context, mission.aircraft.position, mission.aircraft.headingDegrees);
+      drawAircraft(context, aircraftImage, mission.aircraft.position, mission.aircraft.headingDegrees);

+    aircraftImage.addEventListener("load", render);
     render();
     const observer = new ResizeObserver(render);
     observer.observe(canvas);
-    return () => observer.disconnect();
+    return () => {
+      aircraftImage.removeEventListener("load", render);
+      observer.disconnect();
+    };
```
- `.agentdocs/index.md`
```diff
+`workflow/20260819153738-use-top-silhouette-on-map.md` - 会话-6：使用 `f117-top-silhouette.png` 替换地图中的简化三角飞机符号，并按实时航向旋转；核对地图飞机图标加载、尺寸或方向时读取。
```

## 测试用例
### TC-001 图片加载后重绘
- 类型：功能测试
- 优先级：高
- 操作步骤：打开战术地图并等待图片加载。
- 预期结果：地图显示 F-117 俯视轮廓，不再显示三角符号。
- 是否通过：待人工验证。

### TC-002 航向旋转
- 类型：功能测试
- 优先级：高
- 操作步骤：执行包含转向航点的任务。
- 预期结果：俯视轮廓随飞机航向旋转，机头指向实际飞行方向。
- 是否通过：待人工验证。

### TC-003 工程回归
- 类型：自动化测试
- 优先级：高
- 操作步骤：执行 `npm run typecheck`、`npm run test` 和 `npm run build`。
- 预期结果：所有命令成功完成。
- 是否通过：通过；类型检查成功，18 个测试文件共 79 项测试通过，生产构建成功并输出俯视图资源。
