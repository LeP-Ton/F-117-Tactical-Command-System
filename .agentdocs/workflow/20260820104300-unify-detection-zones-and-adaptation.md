# 第三批：统一探测修正区并修正 Enemy Adaptation

## 背景与目标
- Terrain 与 Weather 使用同构矩形和倍率，却维护两套类型、生成、检测和绘制路径。
- 旧 Enemy Adaptation 按航点密度计算画像，并固定修改雷达数组下标。

## 约束与原则
- 保留山地、Cloud、Storm 的视觉和倍率差异。
- 画像只能读取已经实际飞过的轨迹。
- 反制雷达按空间关系选择，不依赖数组顺序。

## 阶段与 TODO
- [x] 合并环境区数据结构与检测入口。
- [x] 添加按 20 单位位移采样的真实飞行轨迹。
- [x] 画像改为消费真实轨迹。
- [x] 反制部署选择最近且未使用雷达。
- [x] 雷达情报移除重复可信度百分比。

## 代码变更
- `src/domain/types.ts`
```diff
-export interface TerrainZone {
-  kind: "MOUNTAIN";
-  maskingFactor: number;
-}
-export interface WeatherZone {
-  kind: "CLOUD" | "STORM";
+export interface DetectionModifierZone {
+  kind: "MOUNTAIN" | "CLOUD" | "STORM";
   detectionFactor: number;
 }
+  flightPath: Vector2[];
-  terrain: TerrainZone[];
-  weather: WeatherZone[];
+  detectionZones: DetectionModifierZone[];
```
- `src/procedural/missionGenerator.ts`
```diff
-  terrain: TerrainZone[];
-  weather: WeatherZone[];
+  detectionZones: DetectionModifierZone[];
-    maskingFactor: random.range(0.35, 0.58),
+    detectionFactor: random.range(0.35, 0.58),
-    terrain,
-    weather,
+    detectionZones: [...terrain, ...weather],
```
- `src/domain/detectionModel.ts`、`src/domain/radarSensor.ts`
```diff
-  terrainZones: TerrainZone[],
-  weatherZones: WeatherZone[] = [],
+  detectionZones: DetectionModifierZone[],
-  const terrainFactor = terrainZones
-    .filter((terrain) => isInsideTerrain(aircraft, terrain))
-    .reduce((factor, terrain) => factor * terrain.maskingFactor, 1);
-  const weatherFactor = weatherZones
-    .filter((weather) => aircraft.position.x >= weather.x
-      && aircraft.position.x <= weather.x + weather.width
-      && aircraft.position.y >= weather.y
-      && aircraft.position.y <= weather.y + weather.height)
-    .reduce((factor, weather) => factor * weather.detectionFactor, 1);
+  const terrainFactor = detectionZones
+    .filter((zone) => zone.kind === "MOUNTAIN" && isInsideDetectionZone(aircraft, zone))
+    .reduce((factor, zone) => factor * zone.detectionFactor, 1);
+  const weatherFactor = detectionZones
+    .filter((zone) => zone.kind !== "MOUNTAIN" && isInsideDetectionZone(aircraft, zone))
+    .reduce((factor, zone) => factor * zone.detectionFactor, 1);
```
- `src/game/gameReducer.ts`
```diff
+const FLIGHT_PATH_SAMPLE_DISTANCE = 20;
+function sampleFlightPath(mission: MissionSession, position: Vector2): Vector2[] {
+  const last = mission.flightPath.at(-1);
+  if (last && Math.hypot(position.x - last.x, position.y - last.y) < FLIGHT_PATH_SAMPLE_DISTANCE) {
+    return mission.flightPath;
+  }
+  return [...mission.flightPath, { ...position }];
+}
+          flightPath: sampleFlightPath(mission, aircraft.position),
```
- `src/domain/enemyAdaptation.ts`
```diff
-  const flownPoints = mission.route.waypoints
-    .filter((waypoint) => waypoint.status === "COMPLETED")
-    .map((waypoint) => waypoint.position);
+  const flownPoints = mission.flightPath;
+export function getAdaptationLevel(profile: PlayerTacticalProfile): number {
+  return Math.min(5, profile.missionSamples);
+}
-    radars[0] = moveRadar(radars[0]!, exit, strength);
+    moveNearestRadar(radars, exit, strength, usedRadarIds);
```
- `src/ui/TacticalMap.tsx`
```diff
-      mission.weather.forEach((weather) => {
+      mission.detectionZones.filter((zone) => zone.kind !== "MOUNTAIN").forEach((weather) => {
-      mission.terrain.forEach((terrain) => {
+      mission.detectionZones.filter((zone) => zone.kind === "MOUNTAIN").forEach((terrain) => {
-          `${report.radarId}? ${report.level} ${(report.confidence * 100).toFixed(0)}%`,
+          `${report.radarId}? ${report.level}`,
```

## 测试结果
- `npm run typecheck`：通过。
- `npm run test`：18 个测试文件、81 项测试通过。
- `npm run build`：通过。
- `git diff --check`：通过。
