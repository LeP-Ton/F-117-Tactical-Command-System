# 缩小撤离区并居中标签

## 背景与目标
- 会话-145 的状态文案精简方案已由用户手动撤回，本次保留原始“有限情报任务规划”文案与既有位置。
- 原撤离区为 `(850, 30, 120×120)`，上边界过于靠近地图右上状态文字，且内部标签使用固定坐标而未真正居中。
- 将撤离区缩为宽高一致的正方形并下移上边界，通过区域几何调整消除重叠。

## 约束与原则
- 不缩短、不移动、不缩放右上状态文字。
- 地图视觉区域与实际撤离成功判定必须使用同一个领域范围。
- 已有存档必须迁移到新固定区域，避免刷新后继续显示旧尺寸。
- 雷达对撤离区的 `80 u` 净空规则继续有效，并按新边界重新计算。

## 阶段与 TODO
- [x] 将撤离区由 `120×120 u` 缩为 `100×100 u` 正方形。
- [x] 将固定区域调整为 `(860, 50, 100×100)`，为顶部文案保留明确间距。
- [x] 根据矩形几何中心绘制撤离区标签。
- [x] 为旧存档的当前任务与历史复盘迁移新撤离区。
- [x] 更新撤离判定、雷达净空与存档迁移测试。
- [x] 更新中英文机制手册与项目核心认知。
- [x] 完成实际地图验证、类型检查、全量测试与生产构建。

## 关键风险
- 撤离区缩小会同步收紧成功判定，不能只修改 Canvas 图形而保留旧碰撞范围。
- 固定区域改变后，雷达净空最近边界坐标会变化，但算法本身不应调整。
- Canvas 文字居中设置必须通过 `save/restore` 隔离，避免影响后续目标和雷达标签。

## 当前进展
- 原英文 `LIMITED-INTELLIGENCE MISSION PLANNING` 保持不变。
- 撤离区上边界与状态文字已分离，`EXTRACTION` 在方框内水平、垂直居中并保留左右余量。
- 旧存档加载后会统一使用新区域。
- 31 个测试文件、147 项测试与生产构建全部通过。

## 代码变更

### `src/config/gameConfig.ts`
```diff
   mission: {
     attackRadius: 58,
     attackAwarenessGain: 34,
-    extractionArea: { x: 850, y: 30, width: 120, height: 120 },
+    /** 固定东北撤离空域，缩为正方形并下移上边界，为地图顶部状态文字留出间距。 */
+    extractionArea: { x: 860, y: 50, width: 100, height: 100 },
```

### `src/ui/TacticalMap.tsx`
```diff
+      const extractionArea = mission.extractionArea;
+      context.save();
       context.fillStyle = "rgba(63, 191, 154, 0.08)";
       context.strokeStyle = "rgba(63, 191, 154, 0.55)";
       context.lineWidth = 2 / metrics.scale;
-      context.fillRect(mission.extractionArea.x, mission.extractionArea.y, mission.extractionArea.width, mission.extractionArea.height);
-      context.strokeRect(mission.extractionArea.x, mission.extractionArea.y, mission.extractionArea.width, mission.extractionArea.height);
+      context.fillRect(extractionArea.x, extractionArea.y, extractionArea.width, extractionArea.height);
+      context.strokeRect(extractionArea.x, extractionArea.y, extractionArea.width, extractionArea.height);
       context.fillStyle = "#60c8a6";
       context.font = "15px monospace";
-      context.fillText(copy.canvas.extraction, 881, 98);
+      context.textAlign = "center";
+      context.textBaseline = "middle";
+      context.fillText(
+        copy.canvas.extraction,
+        extractionArea.x + extractionArea.width / 2,
+        extractionArea.y + extractionArea.height / 2,
+      );
+      context.restore();
```

### `src/game/gamePersistence.ts`
```diff
 import { syncEventSequenceFromRun } from "../domain/factories";
 import { campaignBalance } from "../domain/campaignBalance";
 import type { MissionDebrief, MissionSession, RunState } from "../domain/types";
+import { gameConfig } from "../config/gameConfig";
@@
   return {
     ...currentMission,
     radarScanRateModifier: mission.radarScanRateModifier ?? scanRateModifier,
+    // 固定任务区域属于当前规则配置，恢复旧存档时同步迁移，避免画面与撤离判定继续使用旧尺寸。
+    extractionArea: { ...gameConfig.mission.extractionArea },
   };
```

### `src/domain/missionRules.test.ts`
```diff
   it("撤离区边界包含边缘位置", () => {
     const mission = createMission("EXTRACT");
-    expect(isInsideExtraction({ x: 850, y: 30 }, mission.extractionArea)).toBe(true);
-    expect(isInsideExtraction({ x: 970, y: 150 }, mission.extractionArea)).toBe(true);
-    expect(isInsideExtraction({ x: 849, y: 30 }, mission.extractionArea)).toBe(false);
+    expect(mission.extractionArea).toEqual({ x: 860, y: 50, width: 100, height: 100 });
+    expect(isInsideExtraction({ x: 860, y: 50 }, mission.extractionArea)).toBe(true);
+    expect(isInsideExtraction({ x: 960, y: 150 }, mission.extractionArea)).toBe(true);
+    expect(isInsideExtraction({ x: 859, y: 50 }, mission.extractionArea)).toBe(false);
```

### `src/domain/radarDeployment.test.ts`
```diff
-    expect(inside?.position).toEqual({ x: 770, y: 120 });
-    expect(nearby?.position).toEqual({ x: 830, y: 230 });
+    expect(inside?.position).toEqual({ x: 780, y: 120 });
+    expect(nearby?.position).toEqual({ x: 780, y: 180 });
```

### `src/game/gamePersistence.test.ts`
```diff
+  it("恢复旧存档时将撤离区迁移到当前固定区域", () => {
+    const state = createRun("SAVE-LEGACY-EXTRACTION");
+    const legacyState = {
+      ...state,
+      currentMission: {
+        ...state.currentMission!,
+        extractionArea: { x: 850, y: 30, width: 120, height: 120 },
+      },
+    };
+    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: legacyState }));
+
+    expect(loadRunProgress()?.currentMission?.extractionArea).toEqual({ x: 860, y: 50, width: 100, height: 100 });
+  });
```

### `docs/game-mechanics.md`
```diff
-地图固定为 `1000×1000 u`，网格间隔 `100 u`；F-117 插入点固定为 `(90, 850)`，撤离区固定为 `(850, 30, 120×120)`，目标生成范围为 `x=400–790、y=100–390`。雷达中心必须与撤离区边界保持 `80 u` 净空，但真实覆盖允许延伸进入撤离区。任务最终准备时还会保证至少一部 Fire Control 完整覆盖目标 `58 u` 攻击区并保留 `20 u` 余量。
+地图固定为 `1000×1000 u`，网格间隔 `100 u`；F-117 插入点固定为 `(90, 850)`，撤离区固定为 `(860, 50, 100×100)`，目标生成范围为 `x=400–790、y=100–390`。雷达中心必须与撤离区边界保持 `80 u` 净空，但真实覆盖允许延伸进入撤离区。任务最终准备时还会保证至少一部 Fire Control 完整覆盖目标 `58 u` 攻击区并保留 `20 u` 余量。
```

### `docs/game-mechanics.en.md`
```diff
-The map is `1000×1000 u` with a `100 u` grid. F-117 insertion is fixed at `(90, 850)`, extraction at `(850, 30, 120×120)`, and target generation at `x=400–790, y=100–390`. Radar centers keep `80 u` clearance from the extraction rectangle, though real coverage may extend into extraction. Final preparation also guarantees one Fire Control radar fully covers the target's `58 u` attack zone with `20 u` margin.
+The map is `1000×1000 u` with a `100 u` grid. F-117 insertion is fixed at `(90, 850)`, extraction at `(860, 50, 100×100)`, and target generation at `x=400–790, y=100–390`. Radar centers keep `80 u` clearance from the extraction rectangle, though real coverage may extend into extraction. Final preparation also guarantees one Fire Control radar fully covers the target's `58 u` attack zone with `20 u` margin.
```

### `AGENTS.md`
```diff
-- 所有初始、适应性和 Final Strike 雷达部署最终统一执行撤离区净空约束：雷达中心不得进入撤离区周围 80 u，探测范围仍可覆盖撤离区。
+- 撤离区固定为东北侧 `(860, 50, 100×100)` 正方形；所有初始、适应性和 Final Strike 雷达部署最终统一执行撤离区净空约束：雷达中心不得进入撤离区周围 80 u，探测范围仍可覆盖撤离区。
```

## 测试用例

### TC-001 撤离区视觉布局
- 类型：浏览器视觉测试
- 优先级：高
- 前置条件：加载包含旧 `120×120` 撤离区的本地存档。
- 操作步骤：进入任务规划地图并观察东北区域。
- 预期结果：恢复后显示 `100×100` 正方形；原状态文案不变且不与上边框重叠；标签位于矩形中心。
- 是否通过：通过。

### TC-002 撤离成功边界
- 类型：领域测试
- 优先级：高
- 预期结果：`(860, 50)` 与 `(960, 150)` 属于撤离区，左侧相邻点不属于撤离区。
- 是否通过：通过。

### TC-003 雷达撤离净空
- 类型：领域回归测试
- 优先级：高
- 预期结果：违反净空的雷达按新区域移动到最近安全边界，100 个程序生成任务均满足 `80 u` 净空和目标火控覆盖。
- 是否通过：通过。

### TC-004 旧存档迁移
- 类型：持久化测试
- 优先级：高
- 预期结果：旧 `(850, 30, 120×120)` 区域加载后迁移为 `(860, 50, 100×100)`。
- 是否通过：通过。

### TC-005 工程验证
- 类型：自动化测试
- 优先级：高
- 执行命令：`npm run typecheck`、`npm run test`、`npm run build`。
- 预期结果：全部通过。
- 是否通过：通过；31 个测试文件、147 项测试全部通过，生产构建完成。
