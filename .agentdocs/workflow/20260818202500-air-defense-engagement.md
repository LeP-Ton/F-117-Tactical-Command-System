# 防空交战与生存压力

## 背景与目标
- 解决“Radar、Belief 和 Commander 很复杂，但玩家总能成功”的核心问题。
- 将探测证据转化为可逆、可理解、最终可能致命的交战链。

## 约束与原则
- 不使用单次探测随机击落；必须经过持续跟踪、锁定和导弹倒计时。
- 玩家能通过切断新 Contact 使跟踪衰减并让导弹脱锁。
- 普通视图提供可行动的模糊威胁警告，不泄露 AI 内部数据。
- 命中后果跨任务保留，机体归零结束整个 Run。

## 阶段与 TODO
- [x] 实现 Threat Stage、跟踪质量和导弹制导。
- [x] 接入机体损伤、速度、可探测性和任务失败。
- [x] 增加普通玩家威胁警告。
- [x] 覆盖连续跟踪、自然衰减、脱锁、命中和跨任务损伤测试。
- [x] 更新机制手册并完成全量回归。

## 代码变更
- `src/domain/types.ts`
```diff
+export type ThreatStage = "UNDETECTED" | "SUSPECTED" | "TRACKED" | "LOCKED" | "MISSILE_INBOUND";
+export interface EngagementState {
+  stage: ThreatStage;
+  trackProgress: number;
+  missileTimeRemainingSeconds?: number;
+  launches: number;
+  hits: number;
+}
@@
+  | "THREAT_STAGE_CHANGED"
+  | "MISSILE_LAUNCHED"
+  | "MISSILE_DEFEATED"
+  | "AIRCRAFT_HIT";
@@
   awareness: AwarenessState;
+  engagement: EngagementState;
```
- `src/config/gameConfig.ts`
```diff
+  engagement: {
+    suspectedThreshold: 16,
+    trackedThreshold: 42,
+    lockedThreshold: 72,
+    launchThreshold: 100,
+    contactGain: 12,
+    decayPerSecond: 14,
+    missileGuidanceBreakThreshold: 32,
+    missileFlightSeconds: 8,
+    hitDamage: 50,
+    damagedSpeedMultiplier: 0.72,
+    damagedDetectionMultiplier: 1.18,
+  },
```
- `src/domain/engagementSystem.ts`
```diff
+export function createEngagementState(): EngagementState {
+  return { stage: "UNDETECTED", trackProgress: 0, launches: 0, hits: 0 };
+}
+export function advanceEngagement(
+  current: EngagementState,
+  newContacts: readonly RadarContact[],
+  deltaSeconds: number,
+  coordinationModifier: number,
+): EngagementResult {
+  // Contact 累积跟踪，无新证据时衰减；导弹期间低于 32 脱锁，倒计时归零则命中。
+}
```
- `src/domain/factories.ts`
```diff
+import { createEngagementState } from "./engagementSystem";
@@
     awareness: { value: 0, stage: "CALM" },
+    engagement: createEngagementState(),
```
- `src/game/gameReducer.ts`
```diff
+import { advanceEngagement } from "../domain/engagementSystem";
@@
+      const engagementResult = advanceEngagement(
+        mission.engagement,
+        radarResult.contacts,
+        action.deltaSeconds,
+        mission.commanderCoordinationModifier,
+      );
@@
+      const threatEvents = engagementResult.state.stage !== mission.engagement.stage
+        ? [createGameEvent(mission, "THREAT_STAGE_CHANGED", { from: mission.engagement.stage, to: engagementResult.state.stage })]
+        : [];
+      const engagementEvents = [/* MISSILE_LAUNCHED / MISSILE_DEFEATED / AIRCRAFT_HIT */];
+      const airframeCondition = engagementResult.aircraftHit
+        ? Math.max(0, state.resources.airframeCondition - gameConfig.engagement.hitDamage)
+        : state.resources.airframeCondition;
+      const aircraftDestroyed = airframeCondition <= 0;
+      const aircraft = engagementResult.aircraftHit
+        ? { ...result.aircraft, speed: result.aircraft.speed * gameConfig.engagement.damagedSpeedMultiplier }
+        : result.aircraft;
@@
+        status: aircraftDestroyed ? "DEFEAT" : state.status,
+        resources: { ...state.resources, airframeCondition },
+        currentMission: {
+          engagement: engagementResult.state,
+          detectionModifier: engagementResult.aircraftHit
+            ? mission.detectionModifier * gameConfig.engagement.damagedDetectionMultiplier
+            : mission.detectionModifier,
+        },
@@
+      const carriesDamage = state.resources.airframeCondition <= 50;
+      // 后续任务继续应用带伤速度与探测修正。
```
- `src/ui/App.tsx`
```diff
+  THREAT_STAGE_CHANGED: "威胁阶段变化",
+  MISSILE_LAUNCHED: "导弹发射",
+  MISSILE_DEFEATED: "导弹脱锁",
+  AIRCRAFT_HIT: "飞机受损",
@@
+const threatLabels = {
+  UNDETECTED: "未发现异常",
+  SUSPECTED: "疑似搜索活动",
+  TRACKED: "持续照射 / 正在跟踪",
+  LOCKED: "火控锁定",
+  MISSILE_INBOUND: "导弹来袭",
+};
@@
+          <section className={`panel-section threat-section threat-${mission.engagement.stage.toLowerCase()}`}>
+            <div className="section-heading"><span>THREAT WARNING</span><span>{threatLabels[mission.engagement.stage]}</span></div>
+            <div className="threat-progress"><i style={{ width: `${mission.engagement.trackProgress}%` }} /></div>
+          </section>
```
- `src/ui/CampaignMap.tsx`
```diff
-              disabled={selected.status !== "AVAILABLE" || state.status === "VICTORY"}
+              disabled={selected.status !== "AVAILABLE" || state.status !== "ACTIVE"}
-              {state.status === "VICTORY" ? "RUN 已完成" : "执行任务"}
+              {state.status === "VICTORY" ? "RUN 已完成" : state.status === "DEFEAT" ? "飞机损失 // RUN 结束" : "执行任务"}
```
- `src/ui/styles.css`
```diff
+.threat-section { border-color: rgba(216, 104, 67, 0.35); }
+.threat-progress { height: 7px; margin: 10px 0; overflow: hidden; background: #10211c; border: 1px solid #27483e; }
+.threat-progress i { display: block; height: 100%; background: linear-gradient(90deg, #5fae91, #e0b64d, #e2523b); }
+.threat-missile_inbound { border-color: #e2523b; box-shadow: inset 0 0 24px rgba(226, 82, 59, 0.1); }
```
- `src/domain/engagementSystem.test.ts`
```diff
+describe("防空交战系统", () => {
+  it("连续高质量 Contact 会逐级建立跟踪并发射导弹", () => { /* 断言 */ });
+  it("失去新证据后跟踪质量会下降", () => { /* 断言 */ });
+  it("导弹飞行中脱离制导阈值会使导弹失效", () => { /* 断言 */ });
+  it("倒计时结束且仍保持制导时命中飞机", () => { /* 断言 */ });
+});
```
- `src/game/gameReducer.test.ts`
```diff
+  it("第二次导弹命中会摧毁飞机并使任务失败", () => { /* 断言 */ });
+  it("第一次导弹命中会降低速度并扩大后续可探测性", () => { /* 断言 */ });
+  it("带伤状态会延续到后续任务", () => { /* 断言 */ });
```
- `README.md`、`docs/game-mechanics.md`
```diff
+连续高质量 Contact 会依次形成疑似搜索、持续跟踪、火控锁定和导弹来袭。
+## 6. 防空交战与生存压力
+- 记录各阶段阈值、8 秒倒计时、32 脱锁阈值、损伤和 Run DEFEAT 规则。
```
- `AGENTS.md`、`.agentdocs/index.md`
```diff
+- 防空交战采用 Contact → 跟踪质量 → 火控锁定 → 导弹来袭链路；失去新证据可脱锁，命中造成持久机体损伤，机体归零会令 Run DEFEAT。
+`workflow/20260818202500-air-defense-engagement.md` - 会话-94：实现可逆的跟踪、锁定、导弹、脱锁、持久损伤与 Run 失败链路。
```

## 测试用例
### TC-001 连续跟踪与发射
- 操作：连续输入高可信 Contact。
- 预期：跟踪质量跨越各阶段并进入 MISSILE_INBOUND。
- 是否通过：是。

### TC-002 脱锁规避
- 操作：导弹飞行期间停止提供新 Contact。
- 预期：跟踪质量低于 32 后触发 MISSILE_DEFEATED，不造成命中。
- 是否通过：是。

### TC-003 命中与持久损伤
- 操作：保持制导直至倒计时结束，再进入后续任务。
- 预期：机体降低 50、速度乘 72%、探测修正乘 118%，后续任务继续带伤。
- 是否通过：是。

### TC-004 Run 失败
- 操作：机体 50 时再次被导弹命中。
- 预期：机体归零、任务失败、Run DEFEAT，Campaign 禁止继续出击。
- 是否通过：是。

### TC-005 工程回归
- 操作：执行 `npm run typecheck && npm run test && npm run build`。
- 预期：类型检查通过，79 项测试通过，生产构建成功。
- 是否通过：是。
