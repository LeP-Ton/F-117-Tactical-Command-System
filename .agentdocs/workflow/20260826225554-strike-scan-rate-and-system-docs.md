# STRIKE 扫描速率奖励与系统文档补全

## 背景与目标
- 消除 STRIKE 与 SEAD 都削弱雷达覆盖范围的收益重复。
- SEAD 只保留空间覆盖削弱，不再阻止 Final Strike 火控增援。
- STRIKE 改为降低所有后续任务的真实雷达扫描速率。
- 补齐 README 与机制手册对任务、奖励、地图、雷达、天气、OPERATION CODE 和确定性生成链路的说明。

## 约束与原则
- 扫描减速必须同时影响地图波束运动和 Radar Sensor 实际扫描周期，禁止只修改动画。
- 不改变 INTEL、COMMAND STRIKE、雷达单次探测概率、Contact 精度和任务成功条件。
- 旧存档无需升级版本；缺失扫描字段时根据已完成 STRIKE 数量补算。

## 阶段与 TODO
- [x] 增加持久雷达扫描速率状态。
- [x] 将 STRIKE 奖励从最终战范围削弱改为后续扫描减速。
- [x] 移除 SEAD 阻止最终火控增援的规则。
- [x] 同步任务网络与任务状态面板。
- [x] 补齐 README 与机制手册。
- [x] 增加 Sensor、reducer、Final Strike 和旧存档测试。
- [x] 运行 typecheck、test 和 build。

## 代码变更

### 奖励参数与领域状态
`src/domain/campaignBalance.ts`

```diff
-strikeFinalRadarRangeMultiplier: 0.92,
+strikeRadarScanRateMultiplier: 0.9,
+radarScanRateFloor: 0.65,

-STRIKE: "打击敌纵深防御节点，削弱最终目标雷达覆盖",
-SEAD: "压制敌防空节点，削弱后续雷达覆盖并阻止最终火控增援",
+STRIKE: "打击敌雷达保障节点，降低后续雷达扫描速率",
+SEAD: "压制敌防空节点，缩小后续雷达覆盖范围",

-export function getFinalStrikeRangeMultiplier(...) { ... }
```

`src/domain/types.ts`

```diff
 export interface PersistentEnemyState {
   radarCoverageModifier: number;
+  radarScanRateModifier: number;
   commanderCoordinationModifier: number;
 }

 export interface MissionSession {
   intelAccuracy: number;
+  radarScanRateModifier: number;
   commanderCoordinationModifier: number;
 }
```

`src/domain/factories.ts`

```diff
+radarScanRateModifier: 1,
```

### 真实扫描速率
`src/domain/radarSensor.ts`

```diff
 export function advanceRadarSensors(
   ...,
   deltaSeconds: number,
+  scanRateModifier = 1,
 ) {
+  const effectiveScanRate = Math.max(0.01, scanRateModifier);
+  const effectiveScanInterval = profile.scanIntervalSeconds / effectiveScanRate;
-  const wideSweep = radar.sweepAngleDegrees + profile.sweepDegreesPerSecond * deltaSeconds;
+  const wideSweep = radar.sweepAngleDegrees
+    + profile.sweepDegreesPerSecond * effectiveScanRate * deltaSeconds;
-  Math.sin(timestamp / 1300) * 42
+  Math.sin(timestamp * effectiveScanRate / 1300) * 42
-  while (accumulator >= profile.scanIntervalSeconds) {
-    accumulator -= profile.scanIntervalSeconds;
+  while (accumulator >= effectiveScanInterval) {
+    accumulator -= effectiveScanInterval;
```

`src/game/gameReducer.ts`

```diff
 return {
   ...finalMission,
+  radarScanRateModifier: state.enemyState.radarScanRateModifier,
 }

 enemyState: {
+  radarScanRateModifier: succeeded && currentNode.type === "STRIKE"
+    ? Math.max(0.65, state.enemyState.radarScanRateModifier * 0.9)
+    : state.enemyState.radarScanRateModifier,
 }

 advanceRadarSensors(
   ...,
   action.deltaSeconds,
+  mission.radarScanRateModifier,
 );
```

### Final Strike 与 SEAD
`src/domain/finalStrike.ts`

```diff
-if (completed.has("SEAD")) {
-  notes.push("SEAD 战果阻止目标区后备雷达上线");
-} else {
-  radars.push(FINAL_GUARD);
-}
+radars.push(FINAL_GUARD);
+notes.push("目标区后备火控雷达上线");

-const rangeMultiplier = getFinalStrikeRangeMultiplier(...);
-radars: radars.map((radar) => ({ ...radar, range: radar.range * rangeMultiplier })),
+radars,
```

### 存档兼容
`src/game/gamePersistence.ts`

```diff
+function restoreMissionScanRate(mission, scanRateModifier) {
+  return { ...mission, radarScanRateModifier: mission.radarScanRateModifier ?? scanRateModifier };
+}
+const completedStrikeCount = campaign.nodes
+  .filter((node) => node.type === "STRIKE" && node.status === "COMPLETED").length;
+const radarScanRateModifier = enemyState.radarScanRateModifier
+  ?? Math.max(0.65, 0.9 ** completedStrikeCount);
+const restored = {
+  ...state,
+  enemyState: { ...state.enemyState, radarScanRateModifier },
+  currentMission: restoreMissionScanRate(...),
+};
```

历史复盘缺失字段时保持 100%，还原当时实际规则；当前任务缺失字段时继承根据既有 STRIKE 战果补算的 Run 扫描速率。

### 玩家界面
`src/ui/CampaignMap.tsx`

```diff
 <span>RADAR COVERAGE ...</span>
+<span>RADAR SCAN <strong>{(radarScanRateModifier * 100).toFixed(0)}%</strong></span>
```

`src/ui/workspaces/MissionWorkspace.tsx`

```diff
+<div><dt>雷达扫描速率</dt><dd>{(mission.radarScanRateModifier * 100).toFixed(0)}%</dd></div>
```

`src/ui/GameplayGuide.tsx`

```diff
-STRIKE 削弱最终目标雷达覆盖；SEAD 压制后续雷达并阻止最终火控增援
+STRIKE 降低后续雷达扫描速率；SEAD 缩小后续雷达覆盖
```

### 文档
- `README.md` 补充任务奖励分工、地图生成数值、天气与航线成本、Radar Sensor 扫描修正、OPERATION CODE 的 FNV-1a → Mulberry32 链路、节点子 Seed 和独立随机流。
- `docs/game-mechanics.md` 同步 STRIKE/SEAD 新规则，并增加完整 OPERATION CODE、地图边界、生成顺序与复现条件说明。
- `AGENTS.md` 与 `.agentdocs/index.md` 更新任务收益、Final Strike 和确定性生成核心认知。

## 测试用例

### TC-001 扫描动画与 Sensor 同步减速
1. 对相同雷达分别使用 100% 与 90% 扫描速率推进 0.25 秒。
- 预期：90% 状态的波束角度为正常值的 90%，且实际扫描次数更少。
- 是否通过：是。

### TC-002 STRIKE 累计奖励
1. 完成一次 STRIKE 后准备下一任务。
2. 再结算第二次 STRIKE。
- 预期：当前任务扫描速率依次为 90% 和 81%，覆盖范围未被 STRIKE 修改。
- 是否通过：是。

### TC-003 SEAD 与最终火控
1. 完成 SEAD 后准备 Final Strike。
- 预期：后续覆盖仍为 90%，`FINAL-GUARD` 仍然上线。
- 是否通过：是。

### TC-004 旧存档迁移
1. 构造缺少扫描字段且已完成一次 STRIKE 的 v1 存档。
- 预期：Run 和当前任务扫描速率补算为 90%，存档可正常继续。
- 是否通过：是。

### TC-005 自动化验证
- `npm run typecheck`：通过。
- `npm run test -- --run`：28 个测试文件、130 项测试全部通过。
- `npm run build`：通过。
- `git diff --check`：通过。
