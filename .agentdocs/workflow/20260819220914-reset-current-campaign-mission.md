# 重置当前战役任务而非整个 Run

## 背景与目标
- “重置任务”原先调用 `createRun(state.seed)`，实际会重新创建整个战役并回到默认首节点 `C0-0`。
- 将重置语义修正为：重新初始化当前节点任务，同时保留 Campaign、资源、敌方持久状态与任务历史。

## 约束与原则
- 重置后的任务回到 `PLANNING`，飞行时间、航线、Contact、Belief、警戒和交战状态全部重新初始化。
- 当前节点 ID 不变，不清除已完成节点、资源、Enemy Alert、SEAD、Command Strike 或敌方适应效果。
- 节点首次进入和任务重置共用同一准备函数，避免两条生成路径产生规则差异。

## 阶段与 TODO
- [x] 抽取战役节点任务准备函数。
- [x] 修改 `RESET`，只重建当前节点任务。
- [x] 增加 `C0-1` 重置回归测试。
- [x] 完成类型检查与自动化测试。

## 关键风险
- 如果当前战役节点不存在，重置保持原状态，不猜测或回退到其他节点。
- 重置保留 Run 的终局状态与历史，不承担“重新开始战役”的职责。

## 代码变更

### `src/game/gameReducer.ts`

```diff
-import type { RunState, Vector2 } from "../domain/types";
+import type { CampaignNode, MissionSession, RunState, Vector2 } from "../domain/types";

+/**
+ * 使用当前 Run 的持久状态准备指定节点任务。
+ * 节点选择与任务重置必须共用这条路径，避免遗漏情报、防空削弱或敌方适应效果。
+ */
+function prepareCampaignMission(state: RunState, node: CampaignNode): MissionSession {
+  const selectedMission = createMission(node.missionSeed);
+  const alertCoverageMultiplier = 1 + state.resources.enemyAlert / 250;
+  const adjustedRadars = selectedMission.radars.map((radar) => ({
+    ...radar,
+    range: radar.range * state.enemyState.radarCoverageModifier * alertCoverageMultiplier,
+  }));
+  const adjustedIntelAccuracy = Math.min(0.99, selectedMission.intelAccuracy + state.resources.intelAccuracyBonus);
+  const adaptedMission = applyEnemyCounterDeployment({
+    ...selectedMission,
+    radars: adjustedRadars,
+    intelAccuracy: adjustedIntelAccuracy,
+  }, state.enemyState);
+  const finalMission = node.type === "FINAL_STRIKE"
+    ? applyFinalStrikeDefense(adaptedMission, {
+      completedNodeTypes: state.campaign.nodes
+        .filter((candidate) => state.campaign.completedNodeIds.includes(candidate.id))
+        .map((candidate) => candidate.type),
+      enemyAlert: state.resources.enemyAlert,
+      adaptationLevel: state.enemyState.adaptationLevel,
+      tacticalProfile: state.enemyState.tacticalProfile,
+    })
+    : adaptedMission;
+
+  return {
+    ...finalMission,
+    radarIntel: generateRadarIntel(selectedMission.seed, finalMission.radars, adjustedIntelAccuracy),
+    intelAccuracy: adjustedIntelAccuracy,
+    commanderCoordinationModifier: state.enemyState.commanderCoordinationModifier,
+  };
+}

-      const selectedMission = createMission(node.missionSeed);
-      const alertCoverageMultiplier = 1 + state.resources.enemyAlert / 250;
-      const adjustedRadars = selectedMission.radars.map((radar) => ({
-        ...radar,
-        range: radar.range * state.enemyState.radarCoverageModifier * alertCoverageMultiplier,
-      }));
-      const adjustedIntelAccuracy = Math.min(0.99, selectedMission.intelAccuracy + state.resources.intelAccuracyBonus);
-      const adaptedMission = applyEnemyCounterDeployment({
-        ...selectedMission,
-        radars: adjustedRadars,
-        intelAccuracy: adjustedIntelAccuracy,
-      }, state.enemyState);
-      const finalMission = node.type === "FINAL_STRIKE"
-        ? applyFinalStrikeDefense(adaptedMission, {
-          completedNodeTypes: state.campaign.nodes
-            .filter((candidate) => state.campaign.completedNodeIds.includes(candidate.id))
-            .map((candidate) => candidate.type),
-          enemyAlert: state.resources.enemyAlert,
-          adaptationLevel: state.enemyState.adaptationLevel,
-          tacticalProfile: state.enemyState.tacticalProfile,
-        })
-        : adaptedMission;
       return {
         ...state,
         campaign: { ...state.campaign, currentNodeId: node.id },
-        currentMission: {
-          ...finalMission,
-          radarIntel: generateRadarIntel(selectedMission.seed, finalMission.radars, adjustedIntelAccuracy),
-          intelAccuracy: adjustedIntelAccuracy,
-          commanderCoordinationModifier: state.enemyState.commanderCoordinationModifier,
-        },
+        currentMission: prepareCampaignMission(state, node),
       };

     case "RESET": {
-      const resetState = createRun(state.seed);
-      const resetMission = resetState.currentMission;
-      if (!resetMission) return resetState;
+      const currentNode = state.campaign.nodes.find((node) => node.id === state.campaign.currentNodeId);
+      if (!currentNode) return state;
+      const resetMission = prepareCampaignMission(state, currentNode);
       return {
-        ...resetState,
+        ...state,
```

### `src/game/gameReducer.test.ts`

```diff
+  it("重置任务会保留当前战役节点与 Run 持久状态", () => {
+    let state = createRun("RESET-CURRENT-NODE");
+    const secondNode = state.campaign.nodes.find((node) => node.id === "C0-1")!;
+    state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: secondNode.id });
+    state = {
+      ...state,
+      resources: { ...state.resources, enemyAlert: 25, intelAccuracyBonus: 0.1 },
+      enemyState: {
+        ...state.enemyState,
+        radarCoverageModifier: 0.85,
+        commanderCoordinationModifier: 0.75,
+      },
+      missionHistory: [{ missionId: "earlier-mission", outcome: "SUCCESS" }],
+      currentMission: {
+        ...state.currentMission!,
+        status: "PAUSED",
+        elapsedMs: 12_000,
+      },
+    };
+
+    const campaignBeforeReset = state.campaign;
+    const resourcesBeforeReset = state.resources;
+    const enemyStateBeforeReset = state.enemyState;
+    const historyBeforeReset = state.missionHistory;
+    state = gameReducer(state, { type: "RESET" });
+
+    expect(state.campaign).toBe(campaignBeforeReset);
+    expect(state.campaign.currentNodeId).toBe("C0-1");
+    expect(state.resources).toBe(resourcesBeforeReset);
+    expect(state.enemyState).toBe(enemyStateBeforeReset);
+    expect(state.missionHistory).toBe(historyBeforeReset);
+    expect(state.currentMission?.id).toBe(`mission-${secondNode.missionSeed}`);
+    expect(state.currentMission?.status).toBe("PLANNING");
+    expect(state.currentMission?.elapsedMs).toBe(0);
+    expect(state.currentMission?.commanderCoordinationModifier).toBeCloseTo(0.75);
+    expect(state.currentMission?.events.map((event) => event.type)).toEqual(["MISSION_RESET"]);
+  });
```

## 测试用例

### TC-001 重置保持当前节点
- 类型：功能测试
- 优先级：高
- 操作步骤：选择 `C0-1`，修改任务运行态后触发 `RESET`。
- 预期结果：`currentNodeId` 仍为 `C0-1`，新任务回到规划状态。
- 是否通过：通过。

### TC-002 重置保留 Run 持久状态
- 类型：回归测试
- 优先级：高
- 操作步骤：设置 Enemy Alert、情报加成、雷达覆盖修正、指挥链修正与历史后重置。
- 预期结果：Campaign、资源、敌方状态与历史对象均保留，任务重新应用当前修正。
- 是否通过：通过。

### TC-003 自动化回归
- 类型：自动化测试
- 优先级：高
- 操作步骤：执行 `npm.cmd run typecheck` 与 `npm.cmd run test -- --run`。
- 预期结果：类型检查通过；18 个测试文件、80 项测试全部通过。
- 是否通过：通过。

## 当前进展
- 修改完成；“重置任务”不再创建新 Run，也不会从 `C0-1` 跳回 `C0-0`。
