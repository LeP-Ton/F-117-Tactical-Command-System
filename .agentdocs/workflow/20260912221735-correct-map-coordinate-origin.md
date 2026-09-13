# 纠正玩家地图坐标原点

## 背景与目标
- 会话-17误把用户给出的任务坐标按 Canvas 左上原点解释，导致 `(100,100)` 起点显示在左上。
- 用户原意是地图左下角为 `(0,0)`，X 轴向右、Y 轴向上。
- 本次将玩家坐标与内部 Canvas 坐标明确分层，并纠正起点、撤离区方位及全部玩家可见坐标。

## 约束与原则
- 不翻转既有任务内部状态与历史复盘画面；Canvas 和任务状态继续使用左上原点。
- 用户输入、集中配置和玩家可见数据使用左下原点，在领域与显示边界集中转换。
- 距离、雷达覆盖、天气判定、自动驾驶和火控部署继续使用同一内部坐标，因此几何关系不变。
- 会话-18的坐标语义取代会话-17中关于撤离区画面方位的解释。

## 当前结果
- 玩家坐标 `(100,100)` 的飞机显示在地图左下，航点列表和飞行遥测仍显示 `100,100`。
- 撤离中心 `(100,900)`、`(900,900)`、`(900,100)` 分别显示在左上、右上、右下。
- 目标与雷达的双轴范围数值关于地图中心对称，不需改变范围配置；所有玩家可见 Y 坐标按左下原点转换。
- 天气预报矩形显示其玩家坐标系左下角，而不是内部 Canvas 左上角。
- 新保存的 v2 载荷写入 `BOTTOM_LEFT` 坐标标记；会话-17期间产生的无标记 v2 规划任务会自动重建，避免刷新后延续错误起点。

## 代码变更

### `src/domain/mapCoordinates.ts`
```diff
--- /dev/null
+++ b/src/domain/mapCoordinates.ts
@@
+import { gameConfig } from "../config/gameConfig";
+import type { Vector2 } from "./types";
+
+/**
+ * 玩家地图使用左下角原点、Y 轴向上的坐标；Canvas 与任务内部状态仍使用左上角原点。
+ * 所有玩家可见坐标和用户指定的部署坐标都必须通过这里转换，避免两套坐标含义再次混用。
+ */
+export function mapToSimulationPosition(position: Vector2): Vector2 {
+  return {
+    x: position.x,
+    y: gameConfig.world.height - position.y,
+  };
+}
+
+/** 点坐标的上下翻转是自身的逆变换。 */
+export const simulationToMapPosition = mapToSimulationPosition;
+
+/** 将内部矩形的左上角转换为玩家地图中的左下角。 */
+export function simulationAreaToMapOrigin(area: { x: number; y: number; height: number }): Vector2 {
+  return {
+    x: area.x,
+    y: gameConfig.world.height - area.y - area.height,
+  };
+}
```

### `src/domain/mapCoordinates.test.ts`
```diff
--- /dev/null
+++ b/src/domain/mapCoordinates.test.ts
@@
+import { describe, expect, it } from "vitest";
+import { mapToSimulationPosition, simulationAreaToMapOrigin, simulationToMapPosition } from "./mapCoordinates";
+
+describe("玩家地图坐标转换", () => {
+  it("以左下角为原点并保持 X 轴方向不变", () => {
+    expect(mapToSimulationPosition({ x: 100, y: 100 })).toEqual({ x: 100, y: 900 });
+    expect(mapToSimulationPosition({ x: 100, y: 900 })).toEqual({ x: 100, y: 100 });
+    expect(simulationToMapPosition({ x: 900, y: 100 })).toEqual({ x: 900, y: 900 });
+  });
+
+  it("矩形内部左上角可转换为玩家地图左下角", () => {
+    expect(simulationAreaToMapOrigin({ x: 50, y: 50, height: 100 })).toEqual({ x: 50, y: 850 });
+  });
+});
```

### `src/config/gameConfig.ts`
```diff
@@
 export const gameConfig = {
+  /** 玩家地图坐标以左下角为原点；Canvas 内部坐标在领域边界统一转换。 */
   world: {
@@
   aircraft: {
+    /** 玩家地图坐标。 */
     insertionPoint: { x: 100, y: 100 },
@@
-    /** 坐标表示撤离区中心；任务生成时根据独立子 Seed 等概率选择。 */
+    /** 玩家地图坐标，表示撤离区中心；任务生成时根据独立子 Seed 等概率选择。 */
```

### `src/domain/route.ts`
```diff
@@
 import { gameConfig } from "../config/gameConfig";
+import { mapToSimulationPosition } from "./mapCoordinates";
 import type { RouteState, Vector2, Waypoint } from "./types";
 
-export const insertionPoint: Vector2 = { ...gameConfig.aircraft.insertionPoint };
+/** 领域状态使用 Canvas 坐标，配置中的玩家地图坐标必须先翻转 Y 轴。 */
+export const insertionPoint: Vector2 = mapToSimulationPosition(gameConfig.aircraft.insertionPoint);
```

### `src/procedural/missionGenerator.ts`
```diff
@@
 import { createCommanderState } from "../domain/airDefenseCommander";
+import { mapToSimulationPosition } from "../domain/mapCoordinates";
@@
   const random = new SeededRandom(`${seed}:EXTRACTION`);
   const center = random.pick(gameConfig.mission.extractionCenters);
+  const simulationCenter = mapToSimulationPosition(center);
   const size = gameConfig.mission.extractionSize;
   return {
-    x: center.x - size / 2,
-    y: center.y - size / 2,
+    x: simulationCenter.x - size / 2,
+    y: simulationCenter.y - size / 2,
```

### `src/ui/ControlPanel.tsx`
```diff
@@
 import { canEditWaypoint, getPlannedRouteDistance, getRemainingRouteDistance } from "../domain/route";
+import { simulationToMapPosition } from "../domain/mapCoordinates";
@@
           {mission.route.waypoints.map((waypoint, index) => {
+            const mapPosition = simulationToMapPosition(waypoint.position);
             return (
@@
-                  X {Math.round(waypoint.position.x).toString().padStart(4, "0")} / Y {Math.round(waypoint.position.y).toString().padStart(4, "0")}
+                  X {Math.round(mapPosition.x).toString().padStart(4, "0")} / Y {Math.round(mapPosition.y).toString().padStart(4, "0")}
```

### `src/ui/workspaces/MissionWorkspace.tsx`
```diff
@@
 import { getWeatherSpeedFactor } from "../../domain/weatherSystem";
+import { simulationToMapPosition } from "../../domain/mapCoordinates";
@@
   const weatherSpeedFactor = getWeatherSpeedFactor(mission.aircraft.position, mission.weather);
+  const aircraftMapPosition = simulationToMapPosition(mission.aircraft.position);
@@
-        <div><dt>{copy.mission.flightTime}</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} {copy.common.secondsUnit}</dd></div><div><dt>{copy.mission.coordinates}</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
+        <div><dt>{copy.mission.flightTime}</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} {copy.common.secondsUnit}</dd></div><div><dt>{copy.mission.coordinates}</dt><dd>{aircraftMapPosition.x.toFixed(1)}, {aircraftMapPosition.y.toFixed(1)}</dd></div>
```

### `src/ui/workspaces/DebriefWorkspace.tsx`
```diff
@@
 import { useI18n } from "../../i18n/I18n";
+import { simulationToMapPosition } from "../../domain/mapCoordinates";
@@
   const mission = debrief.mission;
+  const finalMapPosition = simulationToMapPosition(mission.aircraft.position);
@@
-          <div><dt>{copy.debrief.finalCoordinates}</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
+          <div><dt>{copy.debrief.finalCoordinates}</dt><dd>{finalMapPosition.x.toFixed(1)}, {finalMapPosition.y.toFixed(1)}</dd></div>
```

### `src/ui/EnemySystemPanels.tsx`
```diff
@@
 import { getBeliefPeak } from "../domain/beliefMap";
+import { simulationToMapPosition } from "../domain/mapCoordinates";
@@
   const beliefPeak = getBeliefPeak(mission.beliefMap, mission.elapsedMs);
+  const beliefMapPosition = beliefPeak.position ? simulationToMapPosition(beliefPeak.position) : undefined;
@@
-    <div><dt>{copy.enemy.estimatedPosition}</dt><dd>{beliefPeak.position ? `${beliefPeak.position.x.toFixed(0)}, ${beliefPeak.position.y.toFixed(0)}` : copy.common.unknown}</dd></div>
+    <div><dt>{copy.enemy.estimatedPosition}</dt><dd>{beliefMapPosition ? `${beliefMapPosition.x.toFixed(0)}, ${beliefMapPosition.y.toFixed(0)}` : copy.common.unknown}</dd></div>
```

### `src/ui/WeatherForecastPanel.tsx`
```diff
@@
 import type { MissionSession } from "../domain/types";
+import { simulationAreaToMapOrigin } from "../domain/mapCoordinates";
@@
-      {activeForecasts.map((forecast) => <li key={`${forecast.weatherId}-${forecast.horizonSeconds}`}>
-        <strong>{forecast.weatherId} / {copy.common.taskTimePrefix}{forecast.horizonSeconds}{copy.common.secondsUnit}</strong>
-        <span>{copy.enums.weatherKind[forecast.kind]} · {copy.enums.weatherTrend[forecast.intensityTrend]} · {copy.forecast.confidence} {copy.enums.confidence[forecast.confidence]}</span>
-        <small>{copy.forecast.estimatedArea} {forecast.estimatedPosition.x.toFixed(0)},{forecast.estimatedPosition.y.toFixed(0)} · {forecast.estimatedSize.width.toFixed(0)}×{forecast.estimatedSize.height.toFixed(0)}</small>
-      </li>)}
+      {activeForecasts.map((forecast) => {
+        const mapOrigin = simulationAreaToMapOrigin({
+          ...forecast.estimatedPosition,
+          height: forecast.estimatedSize.height,
+        });
+        return <li key={`${forecast.weatherId}-${forecast.horizonSeconds}`}>
+          <strong>{forecast.weatherId} / {copy.common.taskTimePrefix}{forecast.horizonSeconds}{copy.common.secondsUnit}</strong>
+          <span>{copy.enums.weatherKind[forecast.kind]} · {copy.enums.weatherTrend[forecast.intensityTrend]} · {copy.forecast.confidence} {copy.enums.confidence[forecast.confidence]}</span>
+          <small>{copy.forecast.estimatedArea} {mapOrigin.x.toFixed(0)},{mapOrigin.y.toFixed(0)} · {forecast.estimatedSize.width.toFixed(0)}×{forecast.estimatedSize.height.toFixed(0)}</small>
+        </li>;
+      })}
```

### `src/game/gamePersistence.ts`
```diff
@@
 const SAVE_VERSION = 2;
 const SUPPORTED_SAVE_VERSIONS = new Set([1, SAVE_VERSION]);
+const MAP_COORDINATE_ORIGIN = "BOTTOM_LEFT";
@@
   version: number;
   savedAt: number;
+  mapCoordinateOrigin?: typeof MAP_COORDINATE_ORIGIN;
   state: RunState;
@@
-    const payload: SavedRun = { version: SAVE_VERSION, savedAt: Date.now(), state };
+    const payload: SavedRun = {
+      version: SAVE_VERSION,
+      savedAt: Date.now(),
+      mapCoordinateOrigin: MAP_COORDINATE_ORIGIN,
+      state,
+    };
@@
-    if (payload.version === 1 && legacyStatus === "PLANNING") {
+    const needsPlanningCoordinateMigration = legacyStatus === "PLANNING"
+      && (payload.version === 1 || payload.mapCoordinateOrigin !== MAP_COORDINATE_ORIGIN);
+    if (needsPlanningCoordinateMigration) {
       const currentNode = restored.campaign.nodes.find((node) => node.id === restored.campaign.currentNodeId);
-      // v1 规划任务使用旧地图范围；按相同节点 Seed 和当前长期收益完整重建，并丢弃尚未执行的旧航线。
+      // v1 或会话-17期间产生的无坐标标记 v2 规划任务按当前规则重建，并丢弃尚未执行的旧航线。
```

### 测试期望修正
```diff
--- a/src/procedural/missionGenerator.test.ts
+++ b/src/procedural/missionGenerator.test.ts
@@
-  { x: 50, y: 850, width: 100, height: 100 },
-  { x: 850, y: 850, width: 100, height: 100 },
-  { x: 850, y: 50, width: 100, height: 100 },
+  { x: 50, y: 50, width: 100, height: 100 },
+  { x: 850, y: 50, width: 100, height: 100 },
+  { x: 850, y: 850, width: 100, height: 100 },
--- a/src/domain/missionRules.test.ts
+++ b/src/domain/missionRules.test.ts
@@
 import { createMission } from "./factories";
+import { simulationToMapPosition } from "./mapCoordinates";
@@
-    expect(mission.aircraft.position).toEqual({ x: 100, y: 100 });
-    expect(mission.route.waypoints[0]?.position).toEqual({ x: 100, y: 100 });
+    expect(mission.aircraft.position).toEqual({ x: 100, y: 900 });
+    expect(mission.route.waypoints[0]?.position).toEqual({ x: 100, y: 900 });
+    expect(simulationToMapPosition(mission.aircraft.position)).toEqual({ x: 100, y: 100 });
@@
-    expect(extractionCenters).toContainEqual({
+    expect(extractionCenters).toContainEqual(simulationToMapPosition({
       x: mission.extractionArea.x + mission.extractionArea.width / 2,
       y: mission.extractionArea.y + mission.extractionArea.height / 2,
-    });
+    }));
--- a/src/game/gamePersistence.test.ts
+++ b/src/game/gamePersistence.test.ts
@@
-    expect(JSON.parse(window.localStorage.getItem(RUN_SAVE_KEY)!).version).toBe(2);
+    const payload = JSON.parse(window.localStorage.getItem(RUN_SAVE_KEY)!);
+    expect(payload.version).toBe(2);
+    expect(payload.mapCoordinateOrigin).toBe("BOTTOM_LEFT");
@@
-      { x: 50, y: 850, width: 100, height: 100 },
-      { x: 850, y: 850, width: 100, height: 100 },
-      { x: 850, y: 50, width: 100, height: 100 },
+      { x: 50, y: 50, width: 100, height: 100 },
+      { x: 850, y: 50, width: 100, height: 100 },
+      { x: 850, y: 850, width: 100, height: 100 },
@@
-      { id: "insertion", kind: "INSERTION", position: { x: 100, y: 100 }, status: "LOCKED" },
+      { id: "insertion", kind: "INSERTION", position: { x: 100, y: 900 }, status: "LOCKED" },
@@
     expect(restored?.missionDebriefs["C0-0"]?.mission.extractionArea).toEqual(legacyExtractionArea);
   });
+
+  it("无坐标标记的版本 2 规划任务会重建到左下原点规则", () => {
+    const state = createRun("SAVE-V2-COORDINATE-MIGRATION");
+    const legacyState = {
+      ...state,
+      currentMission: {
+        ...state.currentMission!,
+        aircraft: { ...state.currentMission!.aircraft, position: { x: 100, y: 100 } },
+        route: {
+          activeWaypointIndex: 1,
+          waypoints: [
+            { id: "insertion", kind: "INSERTION" as const, position: { x: 100, y: 100 }, status: "LOCKED" as const },
+            { id: "legacy-route", kind: "NAVIGATION" as const, position: { x: 500, y: 500 }, status: "PENDING" as const },
+          ],
+        },
+      },
+    };
+    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 2, savedAt: Date.now(), state: legacyState }));
+
+    const restored = loadRunProgress();
+    expect(restored?.currentMission?.aircraft.position).toEqual({ x: 100, y: 900 });
+    expect(restored?.currentMission?.route.waypoints).toEqual([
+      { id: "insertion", kind: "INSERTION", position: { x: 100, y: 900 }, status: "LOCKED" },
+    ]);
+  });
--- a/src/ui/ControlPanel.test.tsx
+++ b/src/ui/ControlPanel.test.tsx
@@
     expect(screen.getByRole("button", { name: /航点序列/ })).toHaveTextContent("0 个");
+    expect(screen.getByRole("button", { name: /INS X 0100 \/ Y 0100/ })).toBeInTheDocument();
--- a/src/ui/SharedTacticalPanels.test.tsx
+++ b/src/ui/SharedTacticalPanels.test.tsx
@@
     expect(screen.getByRole("heading", { name: "复盘任务" })).toBeInTheDocument();
+    expect(screen.getByText("100.0, 100.0")).toBeInTheDocument();
```

## 文档同步
- `AGENTS.md`：写入玩家坐标与 Canvas 内部坐标的边界，以及三个撤离区的实际画面方位。
- `docs/game-mechanics.md`、`docs/game-mechanics.en.md`：明确左下原点、轴方向、起点与撤离区方位。
- `.agentdocs/index.md`：标记会话-17坐标解释已被本次纠正，并更新关键记忆。

## 测试用例
### TC-001 点与矩形坐标转换
- 输入玩家点 `(100,100)`、`(100,900)` 与内部矩形 `(50,50,100×100)`。
- 预期：分别转换为内部点 `(100,900)`、`(100,100)` 和玩家矩形原点 `(50,850)`。
- 是否通过：通过。

### TC-002 起点位置与显示信息一致
- 创建任务并打开规划页面。
- 预期：飞机画面位于左下；航点列表和飞行状态都显示 `(100,100)`。
- 是否通过：通过。

### TC-003 撤离区候选方位
- 批量生成 100 个任务 Seed。
- 预期：内部矩形只出现 `(50,50)`、`(850,50)`、`(850,850)`，对应玩家地图左上、右上、右下，且三个候选全部出现。
- 是否通过：通过。

### TC-004 工程与页面验收
- `npm run typecheck`：通过。
- `npm run test -- --run`：32 个测试文件、151 项测试全部通过。
- `npm run build`：通过，Vite 完成 81 个模块的生产构建。
- 实际页面：飞机显示在左下，INS 与遥测均显示 `100,100`；当前 Seed 撤离区显示在右上；控制台无 warning/error。
