# 移除连续情报质量并保留分级 INTEL 权限

## 背景与目标

- 第一次 INTEL 已核实全部雷达坐标与型号，第二次 INTEL 又授权真实覆盖与敌方内部态势；原有连续 `intelAccuracyBonus` 在两级权限下快速失效。
- 删除任务基础情报精度、跨任务情报质量加成及对应 UI，避免同时维护百分比成长和权限成长。
- Tier 0 改用集中配置的固定有限情报基线，逐雷达结果仍由 Seed 确定并可复现。
- 保持第一次 INTEL 的“准确位置与类型、范围仍为估算或未知”和第二次 INTEL 的 `TOTAL INTEL` 权限边界。

## 约束与原则

- 不修改 INTEL 节点数量、任务网络拓扑、Seed、雷达真实探测或敌方 AI 算法。
- 不提升存档版本；恢复旧存档时直接剥离废弃字段。
- Tier 1 不用真实雷达范围覆盖旧报告的 `estimatedRange`，防止第一次 INTEL 提前泄露真实覆盖。
- 保留会话-119探索提案作为设计来源，但以本文记录的实现和验证结果为当前规则。

## 阶段与 TODO

- [x] 删除领域模型、生成器和任务结算中的连续情报质量字段。
- [x] 建立 Seed 可复现的固定 Tier 0 有限情报基线。
- [x] 保持 Tier 1/Tier 2 的既有权限边界。
- [x] 删除任务网络与任务侧栏的情报百分比。
- [x] 兼容恢复包含旧情报字段的 v1 存档。
- [x] 对齐 README、机制手册、核心认知和文档索引。
- [x] 完成类型检查、自动化测试与生产构建。

## 关键规则

| 权限 | 当前信息边界 |
|---|---|
| `0/2 LIMITED` | 每部雷达 90% 发现概率；位置误差半径 `50–70 u`；范围误差 `±8%`；置信度 60%–88%；`POSSIBLE` 无范围估计 |
| `1/2 VERIFIED` | 全部雷达位置与类型准确、位置误差为 0；覆盖继续使用原报告估算或未知 |
| `2/2 TOTAL INTEL` | 保持既有完整敌方态势权限，包括真实覆盖、扫描、Contact、Belief、Commander 与 Operator |

## 代码变更

### `src/config/gameConfig.ts`

```diff
 export const gameConfig = {
+  /** Tier 0 有限情报使用固定规则，逐雷达差异仍由 Mission Seed 确定生成。 */
+  intel: {
+    revealProbability: 0.9,
+    confidenceRange: [0.6, 0.88] as const,
+    positionErrorRadiusRange: [50, 70] as const,
+    rangeErrorRatio: 0.08,
+  },
 } as const;
```

### `src/domain/intelSystem.ts`

```diff
+import { gameConfig } from "../config/gameConfig";
 import { SeededRandom } from "../core/SeededRandom";
 import type { RadarIntelLevel, RadarIntelReport, RadarState } from "./types";

+function clamp(value: number, min: number, max: number): number {
+  return Math.max(min, Math.min(max, value));
+}

-export function generateRadarIntel(
-  missionSeed: string,
-  radars: readonly RadarState[],
-  intelAccuracy: number,
-): RadarIntelReport[] {
+/** 根据任务 Seed 和固定基线生成 Tier 0 有限情报；真实 RadarState 不会写入报告。 */
+export function generateRadarIntel(
+  missionSeed: string,
+  radars: readonly RadarState[],
+): RadarIntelReport[] {
   return radars.map((radar) => {
     const random = new SeededRandom(`${missionSeed}:INTEL:${radar.id}`);
-    const confidence = Math.min(0.98, intelAccuracy + random.range(-0.12, 0.08));
-    const revealed = random.next() < intelAccuracy;
+    const confidence = random.range(...gameConfig.intel.confidenceRange);
+    const revealed = random.next() < gameConfig.intel.revealProbability;
     if (!revealed) {
       return {
         radarId: radar.id,
         radarType: radar.type,
         level: "UNKNOWN",
         positionErrorRadius: 0,
       };
     }
-    const positionErrorRadius = Math.max(8, (1 - intelAccuracy) * random.range(120, 220));
+    const positionErrorRadius = random.range(...gameConfig.intel.positionErrorRadiusRange);
     const offsetDistance = random.range(0, positionErrorRadius);
     const offsetAngle = random.range(0, Math.PI * 2);
     const estimatedPosition = {
-      x: radar.position.x + Math.cos(offsetAngle) * offsetDistance,
-      y: radar.position.y + Math.sin(offsetAngle) * offsetDistance,
+      x: clamp(radar.position.x + Math.cos(offsetAngle) * offsetDistance, 0, gameConfig.world.width),
+      y: clamp(radar.position.y + Math.sin(offsetAngle) * offsetDistance, 0, gameConfig.world.height),
     };
     const level = getIntelLevel(confidence);
     return {
       radarId: radar.id,
       radarType: radar.type,
       level,
       estimatedPosition,
       positionErrorRadius,
       estimatedRange: level === "POSSIBLE"
         ? undefined
-        : radar.range * (1 + random.range(-(1 - intelAccuracy) * 0.28, (1 - intelAccuracy) * 0.28)),
+        : radar.range * (1 + random.range(-gameConfig.intel.rangeErrorRatio, gameConfig.intel.rangeErrorRatio)),
     };
   });
 }
```

### `src/domain/types.ts`

```diff
 export interface CampaignNode {
   preview: {
     radarDensity: number;
     weather: string;
-    intelAccuracy: number;
     effect: string;
   };
 }

 export interface RunResources {
   enemyAlert: number;
-  intelAccuracyBonus: number;
 }

 export interface MissionSession {
   target: MissionTarget;
   extractionArea: ExtractionArea;
-  intelAccuracy: number;
   radarScanRateModifier: number;
 }
```

### `src/procedural/missionGenerator.ts`

```diff
 export interface GeneratedMissionContent {
   terrain: TerrainZone[];
   weather: WeatherCell[];
   weatherForecast: ReturnType<typeof generateWeatherForecast>;
   radars: RadarState[];
   targetPosition: { x: number; y: number };
-  intelAccuracy: number;
   commander: ReturnType<typeof createCommanderState>;
 }

   return {
     terrain,
     weather,
     weatherForecast: generateWeatherForecast(seed, weather),
     radars,
     targetPosition: { x: random.range(400, 790), y: random.range(100, 390) },
-    intelAccuracy: random.range(0.68, 0.94),
     commander: createCommanderState(),
   };
```

### `src/procedural/campaignGenerator.ts`

```diff
         preview: {
           radarDensity: generated.radars.length,
           weather: generated.weather.map((cell) => cell.kind).join(" + "),
-          intelAccuracy: generated.intelAccuracy,
           effect: missionEffectDescriptions[type],
         },
```

### `src/domain/factories.ts`

```diff
-    radarIntel: generateRadarIntel(`${seed}-M01`, radars, generated.intelAccuracy),
+    radarIntel: generateRadarIntel(`${seed}-M01`, radars),
     target: { ... },
     extractionArea: { ... },
-    intelAccuracy: generated.intelAccuracy,
     radarScanRateModifier: 1,

-    resources: { enemyAlert: 0, intelAccuracyBonus: 0 },
+    resources: { enemyAlert: 0 },
```

### `src/domain/campaignBalance.ts`

```diff
 export const campaignBalance = {
   successAlertDelta: 2,
   failureAlertDelta: 10,
-  intelAccuracyGain: 0.1,
-  intelAccuracyBonusCap: 0.24,
 } as const;

 export const missionEffectDescriptions: Record<MissionNodeType, string> = {
-  INTEL: "获取敌防空网电子情报，提升后续目标识别质量",
+  INTEL: "获取敌防空网电子情报，逐级核实雷达身份并授权敌方态势",
 };
```

### `src/domain/finalStrike.ts`

```diff
-  if (completed.has("INTEL")) notes.push("情报战果提高最终目标雷达识别质量");
+  if (completed.has("INTEL")) notes.push("情报战果已核实最终目标雷达坐标与型号");
```

### `src/game/gameReducer.ts`

```diff
-  const adjustedIntelAccuracy = Math.min(0.99, selectedMission.intelAccuracy + state.resources.intelAccuracyBonus);
   const adaptedMission = applyEnemyCounterDeployment({
     ...selectedMission,
     radars: adjustedRadars,
-    intelAccuracy: adjustedIntelAccuracy,
   }, state.enemyState);

-  const generatedIntel = generateRadarIntel(selectedMission.seed, radars, adjustedIntelAccuracy);
+  const generatedIntel = generateRadarIntel(selectedMission.seed, radars);
   const radarIntel = getIntelAccessTier(state.campaign) >= 1
     ? radars.map((radar) => {
       const previous = generatedIntel.find((report) => report.radarId === radar.id);
       return {
         radarId: radar.id,
         radarType: radar.type,
         level: "CONFIRMED" as const,
         estimatedPosition: { ...radar.position },
         positionErrorRadius: 0,
         estimatedRange: previous?.estimatedRange,
       };
     })
     : generatedIntel;

   return {
     ...finalMission,
     radars,
     radarIntel,
-    intelAccuracy: adjustedIntelAccuracy,
     radarScanRateModifier: state.enemyState.radarScanRateModifier,
   };

         resources: {
-          ...state.resources,
           enemyAlert: Math.max(0, Math.min(100, state.resources.enemyAlert + alertDelta)),
-          intelAccuracyBonus: Math.min(
-            campaignBalance.intelAccuracyBonusCap,
-            state.resources.intelAccuracyBonus
-              + (succeeded && currentNode.type === "INTEL" ? campaignBalance.intelAccuracyGain : 0),
-          ),
         },
```

### `src/game/gamePersistence.ts`

```diff
-import type { RunState } from "../domain/types";
+import type { MissionDebrief, MissionSession, RunState } from "../domain/types";

+function restoreMissionCompatibility(mission: MissionSession, scanRateModifier: number): MissionSession {
+  // v1 旧存档可能仍包含已经移除的 intelAccuracy；显式剥离，避免下次保存继续携带废弃字段。
+  const { intelAccuracy: _legacyIntelAccuracy, ...currentMission } = mission as MissionSession & {
+    intelAccuracy?: number;
+  };
+  return {
+    ...currentMission,
+    radarScanRateModifier: mission.radarScanRateModifier ?? scanRateModifier,
+  };
+}

     const missionDebriefs = Object.fromEntries(
       Object.entries(payload.state.missionDebriefs ?? {}).map(([nodeId, debrief]) => [
         nodeId,
         {
           ...debrief,
-          mission: restoreMissionScanRate(debrief.mission, debrief.mission.radarScanRateModifier ?? 1),
+          mission: restoreMissionCompatibility(debrief.mission, debrief.mission.radarScanRateModifier ?? 1),
         } satisfies MissionDebrief,
       ]),
     );
     const restored: RunState = {
       ...payload.state,
+      campaign: {
+        ...payload.state.campaign,
+        nodes: payload.state.campaign.nodes.map((node) => ({
+          ...node,
+          preview: {
+            radarDensity: node.preview.radarDensity,
+            weather: node.preview.weather,
+            effect: node.preview.effect,
+          },
+        })),
+      },
+      resources: { enemyAlert: payload.state.resources.enemyAlert },
       missionDebriefs,
       currentMission: legacyStatus === "PAUSED"
-        ? { ...restoreMissionScanRate(payload.state.currentMission!, radarScanRateModifier), status: "RUNNING" }
+        ? { ...restoreMissionCompatibility(payload.state.currentMission!, radarScanRateModifier), status: "RUNNING" }
         : payload.state.currentMission
-          ? restoreMissionScanRate(payload.state.currentMission, radarScanRateModifier)
+          ? restoreMissionCompatibility(payload.state.currentMission, radarScanRateModifier)
           : undefined,
     };
```

### `src/ui/CampaignMap.tsx`

```diff
         <div className="campaign-preview-grid">
           <div><span>任务代号</span><strong>{selectedNode.id}</strong></div>
           <div><span>预估雷达数量</span><strong>{selectedNode.preview.radarDensity}</strong></div>
           <div><span>天气</span><strong>{selectedNode.preview.weather}</strong></div>
-          <div><span>情报可信度</span><strong>{Math.round(Math.min(0.99, selectedNode.preview.intelAccuracy + state.resources.intelAccuracyBonus) * 100)}%</strong></div>
         </div>
```

### `src/ui/workspaces/MissionWorkspace.tsx`

```diff
       <CollapsibleSection title="MISSION INTEL" defaultExpanded={false}><dl className="telemetry-grid">
-        <div><dt>情报精度</dt><dd>{Math.round(mission.intelAccuracy * 100)}%</dd></div>
         <div><dt>已知雷达情报</dt><dd>{visibleRadarIntel.length} 个</dd></div>
         <div><dt>未定位信号</dt><dd>{mission.radarIntel.length - visibleRadarIntel.length} 个</dd></div>
         <div><dt>敌方适应状态</dt><dd>{adaptationStatus}</dd></div>
         <div><dt>雷达扫描速率</dt><dd>{(mission.radarScanRateModifier * 100).toFixed(0)}%</dd></div>
       </dl></CollapsibleSection>
```

## 测试变更

### `src/domain/intelSystem.test.ts`

```diff
-  it("情报精度越高，位置与范围误差越小", () => {
-    const low = generateRadarIntel(mission.seed, mission.radars, 0.68);
-    const high = generateRadarIntel(mission.seed, mission.radars, 0.94);
-    // 比较连续精度效果
-  });
+  it("相同 Seed 会按固定规则生成完全一致的报告", () => {
+    const first = generateRadarIntel(mission.seed, mission.radars);
+    const second = generateRadarIntel(mission.seed, mission.radars);
+    expect(second).toEqual(first);
+  });

+  it("有限情报的位置与范围误差遵循固定基线", () => {
+    const reports = generateRadarIntel(mission.seed, mission.radars);
+    reports.forEach((report) => {
+      if (!report.estimatedPosition) return;
+      expect(report.positionErrorRadius).toBeGreaterThanOrEqual(50);
+      expect(report.positionErrorRadius).toBeLessThanOrEqual(70);
+      const radar = mission.radars.find((candidate) => candidate.id === report.radarId)!;
+      if (report.estimatedRange !== undefined) {
+        expect(report.estimatedRange).toBeGreaterThanOrEqual(radar.range * 0.92);
+        expect(report.estimatedRange).toBeLessThanOrEqual(radar.range * 1.08);
+      }
+    });
+  });

+  it("所有估计坐标均限制在战术地图内", () => {
+    const reports = generateRadarIntel(mission.seed, mission.radars);
+    reports.forEach((report) => {
+      if (!report.estimatedPosition) return;
+      expect(report.estimatedPosition.x).toBeGreaterThanOrEqual(0);
+      expect(report.estimatedPosition.x).toBeLessThanOrEqual(1000);
+      expect(report.estimatedPosition.y).toBeGreaterThanOrEqual(0);
+      expect(report.estimatedPosition.y).toBeLessThanOrEqual(1000);
+    });
+  });
```

### `src/procedural/missionGenerator.test.ts`

```diff
-    expect(generated.intelAccuracy).toBeGreaterThanOrEqual(0.68);
-    expect(generated.intelAccuracy).toBeLessThanOrEqual(0.94);
+    expect(generated).not.toHaveProperty("intelAccuracy");
```

### `src/game/gameReducer.test.ts`

```diff
-    expect(state.resources.intelAccuracyBonus).toBeCloseTo(0.1);
+    expect(getIntelAccessTier(state.campaign)).toBe(1);
+    expect(state.resources).toEqual({ enemyAlert: 2 });

-  it("INTEL 会提高后续任务情报精度", () => {
+  it("第一次 INTEL 会精确核实后续任务的全部雷达位置与类型", () => {
     let state = createRun("INTEL-EFFECT");
     state = { ...state, currentMission: { ...state.currentMission!, status: "SUCCESS" } };
     state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
-    expect(state.resources.intelAccuracyBonus).toBeCloseTo(0.1);
+    expect(getIntelAccessTier(state.campaign)).toBe(1);
     const nextNode = state.campaign.nodes.find((node) => node.status === "AVAILABLE")!;
     state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: nextNode.id });
-    expect(state.currentMission!.intelAccuracy).toBeCloseTo(Math.min(0.99, baseline + 0.1));
+    expect(state.currentMission!.radarIntel).toHaveLength(state.currentMission!.radars.length);
+    state.currentMission!.radarIntel.forEach((report) => {
+      const radar = state.currentMission!.radars.find((candidate) => candidate.id === report.radarId)!;
+      expect(report.level).toBe("CONFIRMED");
+      expect(report.radarType).toBe(radar.type);
+      expect(report.estimatedPosition).toEqual(radar.position);
+      expect(report.positionErrorRadius).toBe(0);
+    });
   });
```

### `src/game/gamePersistence.test.ts`

```diff
+  it("恢复旧存档时移除废弃的情报质量字段", () => {
+    const state = createRun("SAVE-LEGACY-INTEL-QUALITY");
+    const legacyState = {
+      ...state,
+      resources: { ...state.resources, intelAccuracyBonus: 0.2 },
+      campaign: {
+        ...state.campaign,
+        nodes: state.campaign.nodes.map((node) => ({
+          ...node,
+          preview: { ...node.preview, intelAccuracy: 0.88 },
+        })),
+      },
+      currentMission: { ...state.currentMission!, intelAccuracy: 0.98 },
+    };
+    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: legacyState }));
+    const restored = loadRunProgress();
+    expect(restored?.resources).toEqual({ enemyAlert: 0 });
+    expect(restored?.currentMission).not.toHaveProperty("intelAccuracy");
+    restored?.campaign.nodes.forEach((node) => expect(node.preview).not.toHaveProperty("intelAccuracy"));
+  });
```

### `src/ui/CampaignMap.copy.test.tsx`

```diff
     expect(screen.queryByText("INTEL QUALITY")).not.toBeInTheDocument();
+    expect(screen.queryByText("情报可信度")).not.toBeInTheDocument();
```

## 文档变更

### `README.md`

```diff
-| INTEL | 提高情报质量；一次完成核实全部雷达坐标与型号，两次完成授权 `TOTAL INTEL` |
+| INTEL | 一次完成核实全部雷达坐标与型号，两次完成授权 `TOTAL INTEL`；不再维护额外的情报质量百分比 |
-| 情报 | 基础精度为 68%–94%，再叠加本 Run 的 INTEL 加成，最高 99% |
+| 有限雷达情报 | 每部雷达按固定基线和独立子 Seed 生成遗漏、`50–70 u` 位置误差与 `±8%` 范围误差 |
-  → 地形 / 天气 / 雷达 / 目标 / 基础情报精度
+  → 地形 / 天气 / 雷达 / 目标
+  → 最终雷达部署对应的有限雷达情报
```

并补充 90% 发现概率、60%–88% 置信度、`POSSIBLE` 不提供范围及固定规则不等于固定结果的说明。

### `docs/game-mechanics.md`

```diff
-### 2.2 情报精度
-Intel 行动成功后会永久提高本次 Run 后续任务的情报精度。
+### 2.2 固定有限情报基线
+未完成 INTEL 时，玩家侧报告使用 90% 发现概率、`50–70 u` 位置误差、`±8%` 范围误差和 60%–88% 置信度；每部雷达使用独立子 Seed。

-- `INTEL`：成功后续情报质量增加 10%；第一次核实全部雷达位置和类型，第二次授权 `TOTAL INTEL`。
+- `INTEL`：第一次核实全部雷达位置和类型，第二次授权 `TOTAL INTEL`；不发放连续情报质量数值。

-Intel 行动的累计情报质量加成上限为 24%，单次任务最终情报精度最高为 99%。
+战役不再维护 `intelAccuracyBonus`、任务基础情报精度或独立 Intel 点数。

-- 位于地图中上部的目标位置，以及 68%–94% 的基础情报精度。
+- 位于地图中上部的目标位置。
```

### `AGENTS.md`

```diff
-- Mission Generator 根据 Seed 分别生成静态 Terrain、动态 Weather Cell、Radar Network、Target 与 Intel Accuracy。
+- Mission Generator 根据 Seed 生成 Terrain、Weather Cell、Radar Network 与 Target；最终部署后按固定有限情报基线生成玩家报告。
-- Intel 行动提高后续 Intel Accuracy 与情报权限。
+- Intel 行动只提升离散情报权限。
-- 正常战术视图只显示由 Intel Accuracy 决定的雷达估计。
+- Tier 0 使用 90% 发现概率、`50–70 u` 位置误差和 `±8%` 范围误差的 Seed 确定报告。
-- 战役只保留一个有效情报资源“情报质量”。
+- 战役不维护连续情报质量、任务基础情报精度或独立 Intel 点数。
```

### `.agentdocs/proposals/20260902112715-explore-remove-intel-quality.md`

```diff
-> 状态：未实施，仅作为后续设计探索备份。
+> 状态：已在会话-121采纳并实施；保留为设计来源与备选方案记录。
```

### `.agentdocs/index.md`

```diff
-`proposals/20260902112715-explore-remove-intel-quality.md` - 未实施探索方案，不能视为当前规则。
+`proposals/20260902112715-explore-remove-intel-quality.md` - 会话-119提出、会话-121采纳的设计来源，最终实现以会话-121 workflow 为准。
+`workflow/20260902113647-remove-continuous-intel-quality.md` - 会话-121：删除连续情报质量，建立固定有限情报基线并兼容旧存档。
```

## 兼容性与风险处理

- 旧 `resources.intelAccuracyBonus`、`CampaignNode.preview.intelAccuracy` 与 `MissionSession.intelAccuracy` 在载入时被显式剥离，不会在下一次自动保存时继续传播。
- 历史复盘中的 Mission 同样经过兼容恢复，保留快照本身的雷达情报与权限层级。
- Tier 1 若原有限报告没有 `estimatedRange`，继续显示范围未知，不使用真实范围补齐。
- 固定参数取消任务级随机精度，但逐雷达遗漏、位置偏移、范围偏移与置信度仍保持 Seed 差异。

## 测试用例

### TC-001 固定有限情报可复现

- 类型：领域测试
- 操作：使用同一 Mission Seed 对同一雷达集合生成两次报告。
- 预期：两份报告完全一致。
- 是否通过：是。

### TC-002 有限情报参数边界

- 类型：领域测试
- 操作：检查已定位报告的位置误差、范围误差和地图坐标。
- 预期：位置误差为 `50–70 u`、范围为真实值的 92%–108%、坐标位于 `0–1000 u`。
- 是否通过：是。

### TC-003 第一次 INTEL 权限

- 类型：Reducer 测试
- 操作：完成第一次 INTEL，进入后续任务。
- 预期：情报覆盖全部真实雷达；位置、类型准确且位置误差为 0；不依赖连续百分比。
- 是否通过：是。

### TC-004 旧存档兼容

- 类型：持久化测试
- 操作：载入同时带有三处旧情报精度字段的 v1 存档。
- 预期：Run 可恢复，三个废弃字段全部被剥离。
- 是否通过：是。

### TC-005 UI 去除百分比

- 类型：渲染测试
- 操作：渲染任务网络。
- 预期：不显示 `INTEL QUALITY` 与“情报可信度”。
- 是否通过：是。

## 验证结果

- `npm run typecheck`：通过。
- `npm run test -- --run`：通过，28 个测试文件、131 项测试全部成功。
- `npm run build`：通过，Vite 生产构建成功。
