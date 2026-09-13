# 将打击目标半径调整为 50 u

## 背景与目标
- 将任务目标的攻击判定半径从 `100 u` 缩小为 `50 u`。
- 保持目标中心生成范围、雷达部署范围和 Fire Control 的 `20 u` 额外覆盖余量不变。
- 让尚未出动的已保存规划任务刷新后同步新半径，同时保护执行中和历史任务的既有规则。

## 实现结果
- 新任务目标攻击半径统一为 `50 u`。
- Canvas 目标圈、任务引导的航点判定和地图元素面板均读取同一 `target.attackRadius`，无需额外分支即可同步。
- v2 规划存档恢复时只更新目标半径，不重建任务、不清除玩家航线；运行中、结果和复盘任务保留保存时半径。

## 代码变更

### `src/config/gameConfig.ts`
```diff
@@
   mission: {
-    attackRadius: 100,
+    attackRadius: 50,
```

### `src/domain/missionRules.test.ts`
```diff
@@
-  it("任务使用固定起点、100 u 攻击半径和合法随机撤离区", () => {
+  it("任务使用固定起点、50 u 攻击半径和合法随机撤离区", () => {
@@
-    expect(mission.target.attackRadius).toBe(100);
+    expect(mission.target.attackRadius).toBe(50);
```

### `src/game/gamePersistence.ts`
```diff
@@
+import { gameConfig } from "../config/gameConfig";
 import { syncEventSequenceFromRun } from "../domain/factories";
@@
   return {
     ...currentMission,
+    // 尚未出动的规划任务同步当前攻击区尺寸；执行中、结果与复盘继续保留当时规则。
+    target: mission.status === "PLANNING"
+      ? { ...currentMission.target, attackRadius: gameConfig.mission.attackRadius }
+      : currentMission.target,
     radarScanRateModifier: mission.radarScanRateModifier ?? scanRateModifier,
```

### `src/game/gamePersistence.test.ts`
```diff
@@
   it("刷新时运行中的任务保持执行状态", () => {
@@
     expect(loadRunProgress()?.currentMission?.status).toBe("RUNNING");
   });
+
+  it("刷新时规划任务同步当前攻击半径但保留既有航线", () => {
+    const state = createRun("SAVE-PLANNING-RADIUS");
+    const route = {
+      ...state.currentMission!.route,
+      waypoints: [
+        ...state.currentMission!.route.waypoints,
+        { id: "planned-route", kind: "NAVIGATION" as const, status: "PENDING" as const, position: { x: 500, y: 500 } },
+      ],
+    };
+    saveRunProgress({
+      ...state,
+      currentMission: {
+        ...state.currentMission!,
+        target: { ...state.currentMission!.target, attackRadius: 100 },
+        route,
+      },
+    });
+
+    const restored = loadRunProgress();
+    expect(restored?.currentMission?.target.attackRadius).toBe(50);
+    expect(restored?.currentMission?.route).toEqual(route);
+  });
```

## 文档同步
- `AGENTS.md`：核心目标攻击半径更新为 `50 u`。
- `docs/game-mechanics.md`、`docs/game-mechanics.en.md`：中英文精确规则同步为 `50 u`。
- `.agentdocs/index.md`：关键记忆中的攻击半径同步更新。

## 测试用例
### TC-001 新任务半径
- 创建任务并读取 `target.attackRadius`。
- 预期：值为 `50`。
- 是否通过：通过。

### TC-002 火控覆盖
- 批量生成任务并验证 Fire Control 覆盖。
- 预期：至少一部 Fire Control 完整覆盖 `50 u` 攻击区，并继续保留 `20 u` 余量。
- 是否通过：通过。

### TC-003 规划存档迁移
- 保存带 `100 u` 旧目标半径和既有航点的 v2 规划任务后恢复。
- 预期：目标半径变为 `50 u`，航线保持不变；运行中与历史任务不被改写。
- 是否通过：通过。

### TC-004 工程验证
- `npm run typecheck`：通过。
- `npm run test -- --run`：32 个测试文件、152 项测试全部通过。
- `npm run build`：通过，Vite 完成 81 个模块的生产构建。
