# 降低飞行速度并自动投弹

## 背景与目标
- 将飞机飞行速度降低为当前值的十分之一，延长观察和动态重规划窗口。
- 移除手动投弹操作，飞机进入目标攻击范围后自动完成攻击。

## 约束与原则
- 自动攻击只在任务运行状态触发。
- 必须同时满足目标未摧毁、仍有武器和进入攻击半径。
- 自动攻击继续产生结构化 ATTACK 事件并显著提升 Awareness。
- 攻击后飞机不暂停，继续沿既定路线前往撤离区。

## 阶段与 TODO
- [x] 基础速度由 72 降至 7.2 u/s。
- [x] 将攻击判定接入 TICK 飞行循环。
- [x] 移除手动攻击 Action 和按钮。
- [x] 更新自动化测试与机制文档。
- [x] 完成类型检查、测试和构建。

## 代码变更
- `src/config/gameConfig.ts`
```diff
   aircraft: {
-    speed: 72,
+    speed: 7.2,
```
- `src/game/gameReducer.ts`
```diff
-  | { type: "ATTACK_TARGET" }
   | { type: "TICK"; deltaSeconds: number }
@@
-    case "ATTACK_TARGET": {
-      if (!canAttackTarget(mission)) return state;
-      // 手动摧毁目标、扣除武器并增加 Awareness。
-    }
     case "TICK": {
@@
+      const autoAttack = canAttackTarget({ ...mission, aircraft: result.aircraft });
+      const target = autoAttack ? { ...mission.target, destroyed: true } : mission.target;
+      const weaponsRemaining = autoAttack ? mission.weaponsRemaining - 1 : mission.weaponsRemaining;
@@
-      const awareness = advanceAwareness(mission.awareness, radarResult.contacts, action.deltaSeconds);
+      const sensorAwareness = advanceAwareness(mission.awareness, radarResult.contacts, action.deltaSeconds);
+      const awarenessValue = autoAttack
+        ? Math.min(100, sensorAwareness.value + gameConfig.mission.attackAwarenessGain)
+        : sensorAwareness.value;
+      const awareness = { value: awarenessValue, stage: awarenessStage(awarenessValue) };
@@
+      const attackEvents = autoAttack
+        ? [{
+          ...createGameEvent(mission, "ATTACK", {
+            targetId: mission.target.id,
+            position: mission.target.position,
+            automatic: true,
+          }, "F-117"),
+          timestamp: nextTimestamp,
+        }]
+        : [];
-      const extracted = mission.target.destroyed
+      const extracted = target.destroyed
@@
+          target,
+          weaponsRemaining,
+          events: [...mission.events, ...attackEvents],
```
- `src/ui/ControlPanel.tsx`
```diff
-import { canAttackTarget, distanceBetween } from "../domain/missionRules";
+import { distanceBetween } from "../domain/missionRules";
@@
-  const attackAvailable = canAttackTarget(mission);
@@
-          {mission.target.destroyed ? "目标已摧毁 // 前往撤离区" : "目标仍有效 // 等待攻击窗口"}
+          {mission.target.destroyed ? "目标已摧毁 // 前往撤离区" : "目标仍有效 // 自动攻击待命"}
@@
-        <button className="attack-button" disabled={!attackAvailable}>投放精确制导武器</button>
-        <p className="hint">进入目标半径 {mission.target.attackRadius} u 后可攻击；攻击会显著提高敌方警戒。</p>
+        <p className="hint">进入目标半径 {mission.target.attackRadius} u 后自动投弹；攻击会显著提高敌方警戒。</p>
```
- `src/game/gameReducer.test.ts`
```diff
-  it("攻击目标会消耗武器并显著提高警戒", () => {
+  it("进入攻击范围会自动投弹、消耗武器并显著提高警戒", () => {
-    state = gameReducer(state, { type: "ATTACK_TARGET" });
+    state = gameReducer(state, { type: "TICK", deltaSeconds: 0.01 });
+    expect(state.currentMission?.events.some((event) => event.type === "ATTACK" && event.data.automatic === true)).toBe(true);
+  });
+  it("新任务基础飞行速度为原值十分之一", () => {
+    expect(createRun("SLOW-FLIGHT").currentMission?.aircraft.speed).toBe(7.2);
   });
```
- `README.md`、`docs/game-mechanics.md`
```diff
-6. 飞抵目标攻击半径后暂停并点击“投放精确制导武器”。
+6. 飞抵目标攻击半径后自动投放精确制导武器。
+飞机基础飞行速度为 `7.2 u/s`，进入目标攻击半径后自动投放武器。
```
- `AGENTS.md`、`.agentdocs/index.md`
```diff
-- 单任务规则为进入攻击半径后手动投放武器……
+- 飞机基础速度为 `7.2 u/s`；运行中进入攻击半径后自动投弹……
+`workflow/20260818200200-slower-flight-auto-strike.md` - 会话-88：将飞行速度降至十分之一并改为进入攻击范围自动投弹。
```

## 测试用例
### TC-001 基础速度
- 操作：创建新 Run 并读取飞机速度。
- 预期：速度为 7.2 u/s。
- 是否通过：是。

### TC-002 自动攻击
- 操作：让运行中的飞机进入目标攻击半径并推进一帧。
- 预期：目标摧毁、武器减至 0、Awareness 显著上升，并生成 automatic ATTACK 事件。
- 是否通过：是。

### TC-003 工程回归
- 操作：执行 `npm run typecheck && npm run test && npm run build`。
- 预期：类型检查通过，72 项测试通过，生产构建成功。
- 是否通过：是。
