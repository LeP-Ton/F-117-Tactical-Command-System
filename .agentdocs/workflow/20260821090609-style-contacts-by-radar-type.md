# 按雷达类型弱化 Contact 估算圈

## 背景与目标
- AI DEBUG 中所有 Radar Contact 都使用同一种高亮黄色，无法识别来源雷达。
- Fire Control Contact 若直接使用强红色，会与保持不变的 Commander `CMD` 标记争夺视觉层级。
- Contact 改用对应雷达类型的浅色，并统一降低填充透明度和线宽；CMD 颜色不修改。

## 约束与原则
- Early Warning 使用金黄、Acquisition 使用橙色、Fire Control 使用红色。
- Contact 是传感器估算证据，视觉强度必须弱于真实雷达和 CMD 融合位置。
- 未找到来源雷达时回退到 Early Warning 浅金色。

## 阶段与 TODO
- [x] 增加三类雷达的 Contact 描边与填充颜色映射。
- [x] Contact 描边从 `2px` 降为 `1px`。
- [x] Contact 描边透明度降至 `0.36–0.4`，填充降至 `0.035–0.04`。
- [x] 保持 CMD 颜色、线宽与绘制方式不变。
- [x] 执行浏览器渲染检查和完整工程验证。

## 代码变更
- `src/ui/TacticalMap.tsx`

```diff
-import type { MissionSession, Vector2 } from "../domain/types";
+import type { MissionSession, RadarType, Vector2 } from "../domain/types";
@@
+const radarContactColors: Record<RadarType, { stroke: string; fill: string }> = {
+  EARLY_WARNING: { stroke: "rgba(224, 176, 72, 0.36)", fill: "rgba(224, 176, 72, 0.035)" },
+  ACQUISITION: { stroke: "rgba(224, 112, 78, 0.36)", fill: "rgba(224, 112, 78, 0.035)" },
+  FIRE_CONTROL: { stroke: "rgba(229, 74, 62, 0.4)", fill: "rgba(229, 74, 62, 0.04)" },
+};
@@
       if (showBelief) mission.radarContacts.forEach((contact) => {
+        const radarType = mission.radars.find((radar) => radar.id === contact.radarId)?.type ?? "EARLY_WARNING";
+        const contactColor = radarContactColors[radarType];
@@
-        context.fillStyle = "rgba(242, 189, 74, 0.08)";
+        context.fillStyle = contactColor.fill;
         context.fill();
-        context.strokeStyle = "rgba(242, 189, 74, 0.65)";
-        context.lineWidth = 2 / metrics.scale;
+        context.strokeStyle = contactColor.stroke;
+        context.lineWidth = 1 / metrics.scale;
```

## 测试用例
### TC-001 Contact 类型视觉映射
- 类型：视觉检查
- 优先级：高
- 预期结果：三类 Contact 分别为浅金黄、浅橙、浅红，CMD 保持原红色和更强视觉层级。
- 是否通过：通过。

### TC-002 AI DEBUG Canvas 渲染
- 类型：浏览器检查
- 优先级：高
- 操作步骤：进入任务并开启 AI DEBUG。
- 预期结果：Canvas 正常渲染，无初始化错误。
- 是否通过：通过。

### TC-003 完整工程验证
- 类型：完整回归
- 优先级：高
- 操作步骤：执行 `npm run typecheck`、`npm run test -- --run`、`npm run build` 和 `git diff --check`。
- 预期结果：全部通过。
- 是否通过：通过。
