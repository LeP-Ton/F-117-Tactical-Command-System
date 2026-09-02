# 任务网络收益与敌方适应平衡优化

## 背景与目标
- 修复 STRIKE 无独立长期收益、SEAD 同时承担过多收益、COMMAND STRIKE 相对偏弱的问题。
- 删除任务网络顶部容易与权限混淆的 `INTEL QUALITY`，但保持 INTEL 内部奖励与权限完全不变。
- 让 Enemy Adaptation 根据实际形成的战术特征工作，避免正常流程仅因任务次数必定生成最终战适应增援。

## 约束与原则
- 不修改任务网络拓扑、任务成功条件、Seed、雷达 Sensor 算法和 INTEL 权限。
- 不新增持久化字段或存档版本；`missionSamples` 兼容旧存档整数值，并允许保存半权重。
- STRIKE 只影响 Final Strike；目标区最低 Fire Control 覆盖约束保持有效。

## 阶段与 TODO
- [x] 集中任务收益参数与任务说明。
- [x] 平衡 STRIKE、SEAD、COMMAND STRIKE 与 Enemy Alert。
- [x] 将 Enemy Adaptation 改为特征驱动并加入失败半权重。
- [x] 更新任务网络、任务面板、操作说明与开发文档。
- [x] 补充领域、reducer 与 UI 测试。
- [x] 运行 typecheck、test 和 build。

## 关键决策
- 所有成功任务统一 `Enemy Alert +2`，失败维持 `+10`。
- 每次 STRIKE 使 Final Strike 雷达初始范围乘以 `0.92`。
- SEAD 将后续雷达覆盖乘以 `0.90` 并阻止最终火控增援，不再降低 Alert。
- COMMAND STRIKE 将 Commander 协调乘以 `0.65`。
- 画像特征数 0/1/2/3 对应反制强度 0%/22%/32%/42%；至少两项特征且累计观察权重达到 2 才生成 `ADAPT-GUARD`。
- 成功与失败航迹分别按 1.0 和 0.5 权重更新画像。

## 代码变更

### 集中式任务收益
`src/domain/campaignBalance.ts` 新增：

```diff
+export const campaignBalance = {
+  successAlertDelta: 2,
+  failureAlertDelta: 10,
+  intelAccuracyGain: 0.1,
+  intelAccuracyBonusCap: 0.24,
+  seadRadarCoverageMultiplier: 0.9,
+  radarCoverageFloor: 0.55,
+  commandCoordinationMultiplier: 0.65,
+  commanderCoordinationFloor: 0.45,
+  strikeFinalRadarRangeMultiplier: 0.92,
+  failedMissionAdaptationWeight: 0.5,
+  successfulMissionAdaptationWeight: 1,
+} as const;
+
+export const missionEffectDescriptions = {
+  INTEL: "获取敌防空网电子情报，提升后续目标识别质量",
+  STRIKE: "打击敌纵深防御节点，削弱最终目标雷达覆盖",
+  SEAD: "压制敌防空节点，削弱后续雷达覆盖并阻止最终火控增援",
+  COMMAND_STRIKE: "打击敌指挥链，削弱后续协同搜索与联合跟踪能力",
+  FINAL_STRIKE: "对最终目标实施纵深精确打击",
+};
+
+export function getMissionAlertDelta(succeeded: boolean): number {
+  return succeeded ? campaignBalance.successAlertDelta : campaignBalance.failureAlertDelta;
+}
+
+export function getFinalStrikeRangeMultiplier(completedNodeTypes): number {
+  const strikeCount = completedNodeTypes.filter((type) => type === "STRIKE").length;
+  return campaignBalance.strikeFinalRadarRangeMultiplier ** strikeCount;
+}
```

`src/procedural/campaignGenerator.ts` 与 `src/ui/CampaignMap.tsx` 改用共享说明：

```diff
-const effects = { ... };
+import { missionEffectDescriptions } from "../domain/campaignBalance";
 effect: missionEffectDescriptions[type]

-<p>{missionBriefings[selected.type]}</p>
+<p>{missionEffectDescriptions[selected.type]}。</p>
```

### 任务结算与最终战
`src/game/gameReducer.ts`：

```diff
-const alertDelta = succeeded && currentNode.type === "SEAD" ? -8 : succeeded ? 2 : 10;
-const tacticalProfile = analyzeCompletedMission(profile, mission);
+const alertDelta = getMissionAlertDelta(succeeded);
+const tacticalProfile = analyzeCompletedMission(
+  profile,
+  mission,
+  succeeded ? 1 : 0.5,
+);

-Math.max(0.55, radarCoverageModifier * 0.85)
+Math.max(campaignBalance.radarCoverageFloor,
+  radarCoverageModifier * campaignBalance.seadRadarCoverageMultiplier)

-Math.max(0.45, commanderCoordinationModifier * 0.75)
+Math.max(campaignBalance.commanderCoordinationFloor,
+  commanderCoordinationModifier * campaignBalance.commandCoordinationMultiplier)
```

`src/domain/finalStrike.ts`：

```diff
-if (context.tacticalProfile.missionSamples >= 2) {
+const adaptation = getAdaptationAssessment(context.tacticalProfile);
+if (context.tacticalProfile.missionSamples >= 2 && adaptation.signalCount >= 2) {
   // 部署 ADAPT-GUARD
+} else {
+  notes.push("历史航迹未形成高可信反制画像");
 }

+const rangeMultiplier = getFinalStrikeRangeMultiplier(context.completedNodeTypes);
+if (rangeMultiplier < 1) {
+  notes.push(`${strikeCount} 次纵深打击使最终雷达覆盖降至 ...`);
+}
-radars,
+radars: radars.map((radar) => ({ ...radar, range: radar.range * rangeMultiplier })),
```

### Enemy Adaptation
`src/domain/enemyAdaptation.ts`：

```diff
-export function getAdaptationLevel(profile) {
-  return Math.min(5, profile.missionSamples);
-}
+export function getAdaptationAssessment(profile) {
+  const terrainMasking = profile.terrainMaskingPreference >= 0.35;
+  const routeBias = Math.abs(profile.southernRouteBias - 0.5) >= 0.08;
+  const aggressiveRouting = profile.aggressiveRouting >= 0.72;
+  const signalCount = [terrainMasking, routeBias, aggressiveRouting].filter(Boolean).length;
+  return {
+    terrainMasking,
+    routeBias,
+    aggressiveRouting,
+    signalCount,
+    status: signalCount === 0 ? "LOW" : signalCount === 1 ? "ACTIVE" : "HIGH",
+    deploymentStrength: signalCount === 0 ? 0 : signalCount === 1 ? 0.22 : signalCount === 2 ? 0.32 : 0.42,
+  };
+}

-function blend(previous, observed, previousSamples) {
-  return (previous * previousSamples + observed) / (previousSamples + 1);
+function blend(previous, observed, previousWeight, observationWeight) {
+  return (previous * previousWeight + observed * observationWeight)
+    / (previousWeight + observationWeight);
 }

-analyzeCompletedMission(profile, mission)
+analyzeCompletedMission(profile, mission, observationWeight = 1)

-const strength = Math.min(0.42, 0.12 + getAdaptationLevel(profile) * 0.06);
+const assessment = getAdaptationAssessment(profile);
+const strength = assessment.deploymentStrength;
```

`src/domain/types.ts`：

```diff
 export interface PlayerTacticalProfile {
+  /** 已分析航迹的累计观察权重；成功为 1，失败为 0.5，旧存档整数值保持兼容。 */
   missionSamples: number;
```

### 玩家界面
`src/ui/CampaignMap.tsx`：

```diff
 <span>ENEMY ALERT ...</span>
-<span>INTEL QUALITY ...</span>
 <span>INTEL ACCESS ...</span>
-<span>RADAR NET ...</span>
+<span>RADAR COVERAGE ...</span>
 <span>CMD LINK ...</span>
-<span>ADAPT INDEX <strong>{adaptationLevel}</strong></span>
+<span>ENEMY ADAPTATION <strong>{adaptation.status}</strong></span>
```

`src/ui/App.tsx` 与 `src/ui/workspaces/MissionWorkspace.tsx`：

```diff
-adaptationLevel={getAdaptationLevel(profile)}
+adaptationStatus={getAdaptationAssessment(profile).status}

-<dt>敌方反制指数</dt><dd>{adaptationLevel}</dd>
+<dt>敌方适应状态</dt><dd>{adaptationStatus}</dd>
```

`src/ui/GameplayGuide.tsx`：

```diff
-STRIKE 完成当前打击；SEAD 削弱后续雷达覆盖；COMMAND STRIKE 破坏敌方协同
+STRIKE 削弱最终目标雷达覆盖；SEAD 压制后续雷达并阻止最终火控增援；COMMAND STRIKE 破坏协同搜索与联合跟踪
```

### 文档与测试
- `README.md`、`docs/game-mechanics.md`、`AGENTS.md` 已同步 92% STRIKE、90% SEAD、65% COMMAND STRIKE、统一 Alert 和特征驱动适应规则。
- `enemyAdaptation.test.ts` 新增 0/1/2/3 特征状态与 0/22/32/42% 强度、半权重和旧整数权重兼容测试。
- `finalStrike.test.ts` 新增特征门槛以及一次/两次 STRIKE 92%/84.64% 累计测试。
- `gameReducer.test.ts` 更新 SEAD、COMMAND STRIKE 断言，并新增失败半权重、STRIKE 最终战火控覆盖测试。
- `CampaignMap.copy.test.tsx` 验证删除 `INTEL QUALITY` 并显示新状态；`GameplayGuide.test.tsx` 更新任务收益文案断言。

## 测试用例

### TC-001 STRIKE 累计收益
1. 分别准备完成一次与两次 STRIKE 的 Final Strike。
2. 对比同 Seed 基准雷达范围。
- 预期：范围分别为 92% 和 84.64%，普通任务不受影响。
- 是否通过：是。

### TC-002 最低火控覆盖
1. 完成两次 STRIKE 后准备 Final Strike。
2. 检查目标区 Fire Control。
- 预期：至少一部 Fire Control 完整覆盖攻击区并保留 20 u 余量。
- 是否通过：是。

### TC-003 SEAD 与 COMMAND STRIKE
1. 分别结算两类成功任务。
- 预期：SEAD 后 Alert 为 2、雷达结构系数为 90%；COMMAND STRIKE 后协调效率为 65%。
- 是否通过：是。

### TC-004 特征驱动适应
1. 构造 0、1、2、3 项显著画像。
- 预期：状态分别为 LOW、ACTIVE、HIGH、HIGH，强度为 0%、22%、32%、42%。
- 是否通过：是。

### TC-005 失败半权重
1. 结算包含有效航迹的失败任务。
- 预期：Enemy Alert +10，累计观察权重 +0.5，并按权重更新画像。
- 是否通过：是。

### TC-006 自动化验证
- `npm run typecheck`：通过。
- `npm run test -- --run`：28 个测试文件、129 项测试全部通过。
- `npm run build`：通过，Vite 成功生成生产构建。
