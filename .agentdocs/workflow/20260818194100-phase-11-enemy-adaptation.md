# Phase 11：Enemy Adaptation

## 背景与目标
- 让敌方在整个 Run 中根据玩家已经发生的战术历史形成画像并调整后续雷达部署。
- 保持不作弊原则：只分析已完成航点和历史 Contact，不读取未来规划。

## 约束与原则
- 没有至少两个已完成航点时不产生学习样本。
- 画像是跨任务均值，避免一次任务完全覆盖已有判断。
- 反制部署由任务内容、画像和适应等级确定，不引入不可复现随机数。
- 反制原因必须在界面可观察、可解释。

## 阶段与 TODO
- [x] 建立 PlayerTacticalProfile 与历史分析。
- [x] 实现山地出口、南北走廊和直达轴线反制。
- [x] 接入 Campaign 任务结束与后续任务生成流程。
- [x] 展示敌方画像、适应等级与本场反制。
- [x] 更新机制手册并完成全量验证。

## 代码变更
- `src/domain/types.ts`
```diff
 export interface PersistentEnemyState {
   adaptationLevel: number;
   radarCoverageModifier: number;
   commanderCoordinationModifier: number;
+  tacticalProfile: PlayerTacticalProfile;
 }
+export interface PlayerTacticalProfile {
+  missionSamples: number;
+  terrainMaskingPreference: number;
+  southernRouteBias: number;
+  aggressiveRouting: number;
+  contactTolerance: number;
+}
@@
   commanderCoordinationModifier: number;
+  adaptationNotes: string[];
```
- `src/domain/enemyAdaptation.ts`
```diff
+export function createPlayerTacticalProfile(): PlayerTacticalProfile { /* 初始画像 */ }
+export function analyzeCompletedMission(
+  profile: PlayerTacticalProfile,
+  mission: MissionSession,
+): PlayerTacticalProfile {
+  const flownPoints = mission.route.waypoints
+    .filter((waypoint) => waypoint.status === "COMPLETED")
+    .map((waypoint) => waypoint.position);
+  if (flownPoints.length < 2) return profile;
+  // 汇总地形利用、南北位置、路线直接度和历史 Contact。
+}
+export function applyEnemyCounterDeployment(
+  mission: MissionSession,
+  enemyState: PersistentEnemyState,
+): MissionSession {
+  // 按历史画像移动雷达至山地出口、偏好走廊或直达轴线。
+}
```
- `src/domain/factories.ts`
```diff
+import { createPlayerTacticalProfile } from "./enemyAdaptation";
@@
+    adaptationNotes: [],
@@
-    enemyState: { adaptationLevel: 0, radarCoverageModifier: 1, commanderCoordinationModifier: 1 },
+    enemyState: {
+      adaptationLevel: 0,
+      radarCoverageModifier: 1,
+      commanderCoordinationModifier: 1,
+      tacticalProfile: createPlayerTacticalProfile(),
+    },
```
- `src/game/gameReducer.ts`
```diff
+import { analyzeCompletedMission, applyEnemyCounterDeployment } from "../domain/enemyAdaptation";
@@
+      const adaptedMission = applyEnemyCounterDeployment({
+        ...selectedMission,
+        radars: adjustedRadars,
+        intelAccuracy: adjustedIntelAccuracy,
+      }, state.enemyState);
@@
-          ...selectedMission,
-          radars: adjustedRadars,
+          ...adaptedMission,
+          radarIntel: generateRadarIntel(selectedMission.seed, adaptedMission.radars, adjustedIntelAccuracy),
@@
+      const tacticalProfile = analyzeCompletedMission(state.enemyState.tacticalProfile, mission);
+      const learnedFromMission = tacticalProfile.missionSamples > state.enemyState.tacticalProfile.missionSamples;
@@
+          tacticalProfile,
+          adaptationLevel: learnedFromMission
+            ? Math.min(5, state.enemyState.adaptationLevel + 1)
+            : state.enemyState.adaptationLevel,
```
- `src/ui/CampaignMap.tsx`
```diff
+          <span>ADAPT <strong>LV.{state.enemyState.adaptationLevel}</strong></span>
@@
+            {state.enemyState.tacticalProfile.missionSamples > 0 && <div className="campaign-build">
+              <span className="section-kicker">ENEMY HISTORICAL ANALYSIS</span>
+              <div>地形利用 ...</div>
+              <div>南部/北部航路偏好 ...</div>
+              <div>直达倾向 ...</div>
+              <div>接触容忍 ...</div>
+            </div>}
```
- `src/ui/App.tsx`
```diff
-            <p>F-117 战术航线规划系统 // PHASE 10</p>
+            <p>F-117 战术航线规划系统 // PHASE 11</p>
@@
+              <div><dt>敌方适应</dt><dd>LV.{state.enemyState.adaptationLevel}</dd></div>
@@
+          {mission.adaptationNotes.length > 0 && <section className="panel-section">
+            <div className="section-heading"><span>COUNTER DEPLOYMENT</span><span>{mission.adaptationNotes.length}</span></div>
+          </section>}
```
- `src/domain/enemyAdaptation.test.ts`
```diff
+describe("Enemy Adaptation", () => {
+  it("只分析已经完成的航点，不读取未来规划", () => { /* 断言 */ });
+  it("没有足够飞行历史时不更新画像", () => { /* 断言 */ });
+  it("相同画像会生成可复现的反制部署", () => { /* 断言 */ });
+  it("没有历史样本时不改变雷达部署", () => { /* 断言 */ });
+});
```
- `src/game/gameReducer.test.ts`
```diff
+  it("完成任务后学习已飞航线并反制后续部署", () => {
+    // 返回 Campaign 后确认画像增长，再进入后续任务确认南部航路反制。
+  });
```
- `README.md`
```diff
-当前仅适配桌面浏览器和鼠标操作。更多持久效果、Enemy Adaptation 与 Final Strike 深化将在后续 Phase 实现。
+任务结束后，敌方会分析已经实际飞过的航点与 Contact 历史，形成地形利用、南北航路、直达倾向和接触容忍画像；后续任务可能针对山地出口、偏好航路或直达轴线调整雷达部署。
+当前仅适配桌面浏览器和鼠标操作。Final Strike 深化将在后续 Phase 实现。
```
- `docs/game-mechanics.md`
```diff
+## 10. Enemy Adaptation
+- 只分析已经发生的历史，不读取下一任务尚未执行的航线。
+- 有效样本提高 ADAPT LV，最高为 5。
+- 画像驱动山地出口、南北走廊和直达轴线反制。
-## 10. 航线规划建议
+## 11. 航线规划建议
-## 11. 当前尚未实现
+## 12. 当前尚未实现
```
- `AGENTS.md`、`.agentdocs/index.md`
```diff
-- 当前状态：已完成 Phase 0–10；
+- 当前状态：已完成 Phase 0–11；
+- Enemy Adaptation 只分析已完成航点与历史 Contact，并据此调整后续雷达部署；禁止读取未来计划航点。
```

## 测试用例
### TC-001 历史信息边界
- 操作：提供两个已完成航点和一个方向相反的待执行航点。
- 预期：画像只反映已完成航点，不受待执行航点影响。
- 是否通过：是。

### TC-002 无历史不适应
- 操作：对默认任务进行分析并应用反制。
- 预期：画像不增加样本，雷达部署不变化。
- 是否通过：是。

### TC-003 反制可复现
- 操作：用相同任务与画像应用两次反制。
- 预期：雷达部署一致，且产生山地、南部和直达轴线说明。
- 是否通过：是。

### TC-004 Run 闭环
- 操作：完成一条明显偏南的路线，返回 Campaign 并进入后续任务。
- 预期：适应等级与样本增加，后续任务显示南部航路搜索加强。
- 是否通过：是。

### TC-005 工程回归
- 操作：执行 `npm run typecheck && npm run test && npm run build`。
- 预期：类型检查通过，66 项测试通过，生产构建成功。
- 是否通过：是。
