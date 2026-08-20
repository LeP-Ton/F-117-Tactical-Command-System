# 拆分动态天气并加入战术预报

## 背景与目标
- 撤销 Terrain 与 Weather 统一为 `DetectionModifierZone` 的领域设计。
- Terrain 保持静态遮蔽；Weather 成为可移动、变尺度、变强度和变类型的独立时空系统。
- 为规划阶段增加带误差的天气预报，使玩家能够围绕未来天气窗口规划航线。

## 约束与原则
- 相同 Mission Seed 与相同任务时间必须生成完全相同的真实天气和预报。
- 天气演化不依赖 Tick 次数或帧率，暂停不推进，任务重置回到初始状态。
- 预报只提供有限情报，不直接显示未来真实天气。
- 地形与天气仍可共同影响探测概率，命中多个区域时使用乘法叠加。

## 阶段与 TODO
- [x] 恢复 `TerrainZone`，新增独立 `WeatherCell` 与 `WeatherForecast`。
- [x] 增加 Cloud、Rain、Storm、Fog 四种天气。
- [x] 根据任务绝对时间推导位置、范围、强度与类型。
- [x] 将动态天气接入任务 Tick 和雷达 Sensor。
- [x] 增加 `T+30/60/90s` 有误差预报、可信度和地图预测轮廓。
- [x] 更新 Campaign 预览、右侧预报面板、项目认知与机制文档。

## 关键风险
- 若演化依赖上一帧类型，会使不同帧率产生不同结果；因此 `initialKind` 必须保持不变。
- 天气区域可循环进出地图，边界附近只显示区域落入地图内的部分。
- 多个天气与地形重叠仍会乘法降低探测率，极端重叠可能形成强隐蔽窗口。

## 代码变更

- `src/domain/types.ts`
```diff
-export interface DetectionModifierZone {
+export interface TerrainZone {
   id: string;
-  kind: "MOUNTAIN" | "CLOUD" | "STORM";
+  kind: "MOUNTAIN";
   x: number;
   y: number;
   width: number;
   height: number;
   detectionFactor: number;
 }
+export type WeatherKind = "CLOUD" | "RAIN" | "STORM" | "FOG";
+export interface WeatherCell {
+  id: string;
+  kind: WeatherKind;
+  initialKind: WeatherKind;
+  x: number;
+  y: number;
+  width: number;
+  height: number;
+  detectionFactor: number;
+  origin: Vector2;
+  baseSize: { width: number; height: number };
+  velocity: Vector2;
+  baseIntensity: number;
+  phaseSeconds: number;
+  evolutionPeriodSeconds: number;
+}
+export interface WeatherForecast {
+  weatherId: string;
+  horizonSeconds: number;
+  kind: WeatherKind;
+  estimatedPosition: Vector2;
+  estimatedSize: { width: number; height: number };
+  intensityTrend: "增强" | "稳定" | "减弱";
+  confidence: "高" | "中" | "低";
+}
-  detectionZones: DetectionModifierZone[];
+  terrain: TerrainZone[];
+  weather: WeatherCell[];
+  weatherForecast: WeatherForecast[];
```

- `src/domain/weatherSystem.ts`
```diff
+const weatherCycle = ["CLOUD", "RAIN", "STORM", "RAIN", "FOG"];
+export function projectWeatherCell(cell, elapsedSeconds) {
+  const evolutionTime = elapsedSeconds + cell.phaseSeconds;
+  const evolutionIndex = Math.floor(evolutionTime / cell.evolutionPeriodSeconds);
+  const initialKindIndex = weatherCycle.indexOf(cell.initialKind);
+  const kind = weatherCycle[(initialKindIndex + evolutionIndex) % weatherCycle.length];
+  const wave = Math.sin((evolutionTime / cell.evolutionPeriodSeconds) * Math.PI * 2);
+  const intensity = clamp(cell.baseIntensity + wave * 0.22);
+  return { ...cell, kind, x: wrap(...), y: wrap(...), width, height, detectionFactor: kindFactor(kind, intensity) };
+}
+export function advanceWeather(cells, elapsedMs) {
+  return cells.map((cell) => projectWeatherCell(cell, elapsedMs / 1000));
+}
+export function generateWeatherForecast(missionSeed, cells, horizons = [30, 60, 90]) {
+  return cells.flatMap((cell) => horizons.map((horizonSeconds) => ({
+    weatherId: cell.id,
+    horizonSeconds,
+    kind: projected.kind,
+    estimatedPosition: seedBasedPositionWithError,
+    estimatedSize: seedBasedSizeWithError,
+    intensityTrend,
+    confidence: horizonSeconds <= 30 ? "高" : horizonSeconds <= 60 ? "中" : "低",
+  })));
+}
```

- `src/procedural/missionGenerator.ts`
```diff
-  detectionZones: DetectionModifierZone[];
+  terrain: TerrainZone[];
+  weather: WeatherCell[];
+  weatherForecast: WeatherForecast[];
-    const kind = random.pick(["CLOUD", "STORM"] as const);
+    const kind = random.pick(["CLOUD", "RAIN", "STORM", "FOG"] as const);
+    const baseIntensity = random.range(0.35, 0.85);
+    const velocity = { x: random.range(-1.8, 1.8), y: random.range(-1.8, 1.8) };
+    const phaseSeconds = random.range(0, 35);
+    const evolutionPeriodSeconds = random.range(55, 95);
-    detectionZones: [...terrain, ...weather],
+    terrain,
+    weather,
+    weatherForecast: generateWeatherForecast(seed, weather),
```

- `src/domain/detectionModel.ts`、`src/domain/radarSensor.ts`
```diff
-  detectionZones: DetectionModifierZone[],
+  terrain: TerrainZone[],
+  weather: WeatherCell[],
-  const terrainFactor = detectionZones.filter(...)
+  const terrainFactor = terrain.filter(...)
-  const weatherFactor = detectionZones.filter(...)
+  const weatherFactor = weather.filter(...)
-      calculateDetectionFactors(nextRadar, aircraft, detectionZones);
+      calculateDetectionFactors(nextRadar, aircraft, terrain, weather);
```

- `src/game/gameReducer.ts`、`src/domain/factories.ts`
```diff
+import { advanceWeather } from "../domain/weatherSystem";
-    detectionZones: generated.detectionZones,
+    terrain: generated.terrain,
+    weather: advanceWeather(generated.weather, 0),
+    weatherForecast: generated.weatherForecast,
+      const weather = advanceWeather(mission.weather, nextTimestamp);
+        mission.terrain,
+        weather,
+          weather,
```

- `src/ui/TacticalMap.tsx`、`src/ui/App.tsx`、`src/ui/styles.css`
```diff
-      mission.detectionZones.filter((zone) => zone.kind !== "MOUNTAIN").forEach(...)
+      mission.weather.forEach((weather) => { /* 按四种天气分别绘制 */ });
+      if (editable) mission.weatherForecast.forEach((forecast) => { /* 绘制预测虚线轮廓 */ });
-      mission.detectionZones.filter((zone) => zone.kind === "MOUNTAIN").forEach(...)
+      mission.terrain.forEach(...)
+          <CollapsibleSection title="WEATHER FORECAST" meta={`${mission.weather.length} CELLS`}>
+            {/* 显示 T+30/60/90、类型、趋势、可信度、预计位置与范围 */}
+          </CollapsibleSection>
++.weather-forecast-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
```

- `src/domain/weatherSystem.test.ts` 与既有测试
```diff
+it("相同 Seed 与时间完整复现天气和预报", ...);
+it("天气位置、范围或类型会随任务时间变化", ...);
+it("远期预报比近期预报可信度更低", ...);
-calculateDetectionFactors(radar, aircraft, detectionZones)
+calculateDetectionFactors(radar, aircraft, terrain, weather)
```

- `AGENTS.md`、`README.md`、`docs/game-mechanics.md`、`TODO.md`
```diff
-Mission Generator 根据 Seed 生成统一的 Detection Modifier Zone。
+Mission Generator 分别生成静态 Terrain、动态 Weather Cell 和有限天气预报。
+天气位置、范围、强度与类型按任务绝对时间确定性演化。
+规划阶段提供带误差的 T+30/60/90s 天气预报。
```

## 测试用例

### TC-001 Seed 与时间复现
- 类型：领域测试
- 优先级：高
- 操作：使用相同 Seed 生成两组天气，并投影至同一任务时间。
- 预期：天气与预报完全一致；分步 Tick 与直接投影结果一致。
- 是否通过：是。

### TC-002 动态天气演化
- 类型：领域测试
- 优先级：高
- 操作：比较同一任务 `T+0` 与 `T+120s` 天气。
- 预期：至少一个天气单元的位置、范围或类型发生变化。
- 是否通过：是。

### TC-003 预报可信度
- 类型：领域测试
- 优先级：中
- 操作：比较 `T+30s` 与 `T+90s` 预报。
- 预期：近期为高可信度，远期为低可信度。
- 是否通过：是。

## 测试结果
- `npm run typecheck`：通过。
- `npm run test -- --run`：19 个测试文件、84 项测试通过。
- `npm run build`：通过。
- `git diff --check`：通过。
