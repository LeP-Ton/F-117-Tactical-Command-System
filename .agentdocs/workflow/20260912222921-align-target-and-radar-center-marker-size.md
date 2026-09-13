# 统一目标与雷达中心标记尺寸

## 背景与目标
- 地图中的目标中心方块为 `20×20`，而雷达中心标记为 `12×12`，目标标记视觉权重明显偏大。
- 将目标中心方块缩小为与雷达相同的 `12×12`，不改变目标攻击半径、判定逻辑或雷达范围。
- 用同一常量约束目标、有限情报雷达与真实雷达的中心标记，避免后续尺寸再次分离。

## 历史核对
- `git blame` 与 `git log -S` 显示目标中心的 `20×20` 尺寸从初始原型提交 `b3a5063` 起就已存在，并非近期扩大。
- 本次只调整视觉标记；会话-19设置的 `50 u` 目标攻击半径圆保持不变。

## 实现结果
- 目标中心、有限情报雷达中心和真实雷达中心统一使用 `mapCenterMarkerSize = 12`。
- 目标标签的水平起点由 `+16` 同步为 `+12`，与缩小后的标记间距及雷达标签规则一致。

## 代码变更

### `src/ui/TacticalMap.tsx`
```diff
@@
 const radarContactColors: Record<RadarType, { stroke: string; fill: string }> = {
@@
 };
+
+/** 目标与雷达的中心标记共用尺寸，确保地图视觉语义一致。 */
+const mapCenterMarkerSize = 12;
@@
-      context.fillRect(mission.target.position.x - 10, mission.target.position.y - 10, 20, 20);
+      context.fillRect(
+        mission.target.position.x - mapCenterMarkerSize / 2,
+        mission.target.position.y - mapCenterMarkerSize / 2,
+        mapCenterMarkerSize,
+        mapCenterMarkerSize,
+      );
       context.font = "12px monospace";
-      context.fillText(mission.target.destroyed ? copy.canvas.destroyed : copy.canvas.target, mission.target.position.x + 16, mission.target.position.y + 4);
+      context.fillText(
+        mission.target.destroyed ? copy.canvas.destroyed : copy.canvas.target,
+        mission.target.position.x + mapCenterMarkerSize,
+        mission.target.position.y + 4,
+      );
@@
-        context.fillRect(-6, -6, 12, 12);
+        context.fillRect(
+          -mapCenterMarkerSize / 2,
+          -mapCenterMarkerSize / 2,
+          mapCenterMarkerSize,
+          mapCenterMarkerSize,
+        );
@@
-          position.x + 12,
+          position.x + mapCenterMarkerSize,
@@
-        context.fillRect(radar.position.x - 6, radar.position.y - 6, 12, 12);
+        context.fillRect(
+          radar.position.x - mapCenterMarkerSize / 2,
+          radar.position.y - mapCenterMarkerSize / 2,
+          mapCenterMarkerSize,
+          mapCenterMarkerSize,
+        );
         context.font = "12px monospace";
-        context.fillText(`${radar.id} ${copy.enums.radarType[radar.type]} ${copy.enums.operatorMode[radar.operator.mode]}`, radar.position.x + 12, radar.position.y + 4);
+        context.fillText(
+          `${radar.id} ${copy.enums.radarType[radar.type]} ${copy.enums.operatorMode[radar.operator.mode]}`,
+          radar.position.x + mapCenterMarkerSize,
+          radar.position.y + 4,
+        );
```

## 测试用例

### TC-001 中心标记尺寸一致
- 类型：代码审查。
- 优先级：高。
- 操作：核对目标、有限情报雷达和真实雷达的 `fillRect` 参数。
- 预期：三者均由 `mapCenterMarkerSize = 12` 生成中心标记。
- 是否通过：通过。

### TC-002 攻击范围保持不变
- 类型：回归测试。
- 优先级：高。
- 操作：执行领域测试并核对目标攻击范围绘制仍读取 `mission.target.attackRadius`。
- 预期：攻击半径仍为 `50 u`，仅中心方块缩小。
- 是否通过：通过。

### TC-003 工程验证
- `npm run typecheck`：通过。
- `npm run test -- --run`：32 个测试文件、152 项测试全部通过。
- `npm run build`：通过，Vite 完成 81 个模块的生产构建。
