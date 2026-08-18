# 强化多雷达联合协同与指挥链效果

## 背景与目标
- 原多雷达协同主要表现为 Contact 证据直接相加和 Commander Utility 偏置，指挥链受损后的行为差异不明显。
- 将本地火控与网络协同分离：单雷达保留独立作战能力，多雷达额外证据、Contact 共享与统一搜索受指挥链效率控制。

## 约束与原则
- Radar Operator 和 Commander 仍不得读取飞机真实位置。
- 指挥链受损不能降低单雷达基础探测概率、覆盖范围或本地 Contact 能力。
- 100% 效率下保持快速协同；Command Strike 后应出现可观察的响应延迟和搜索散乱。

## 阶段与 TODO
- [x] 增加跨雷达 Contact 共享窗口。
- [x] 将本地火控证据与联合证据拆分。
- [x] 让指挥链效率影响 Commander 决策间隔。
- [x] 为受损指挥链增加确定性搜索方位误差。
- [x] 更新测试、机制手册和根项目认知。
- [x] 完成类型检查、测试和生产构建。

## 代码变更

### 配置、数据流与核心逻辑
```diff
     focusedContactMemoryMs: 4500,
     sectorContactMemoryMs: 9000,
+    sharedContactMemoryMs: 4500,

   commander: {
     decisionIntervalSeconds: 1,
+    maximumBearingErrorDegrees: 32,
   },

-  const evidence = newContacts.reduce(
-    (sum, contact) => sum + (contact.confidence * 0.72 + contact.signalStrength * 0.28),
-    0,
-  );
-  const gained = evidence * gameConfig.engagement.contactGain * coordinationModifier;
+  const contactEvidence = newContacts
+    .map((contact) => contact.confidence * 0.72 + contact.signalStrength * 0.28)
+    .sort((first, second) => second - first);
+  // 最强 Contact 代表雷达本地火控能力；其余 Contact 需要通过指挥链完成联合跟踪。
+  const localEvidence = contactEvidence[0] ?? 0;
+  const sharedEvidence = contactEvidence.slice(1).reduce((sum, evidence) => sum + evidence, 0);
+  const evidence = localEvidence + sharedEvidence * coordinationModifier;
+  const gained = evidence * gameConfig.engagement.contactGain;

+function newestNetworkContact(contacts: RadarContact[]): RadarContact | undefined {
+  return [...contacts].sort((first, second) => second.timestamp - first.timestamp)[0];
+}

 export function advanceRadarOperators(
   radars: RadarState[],
   contacts: RadarContact[],
   timestamp: number,
   deltaSeconds: number,
+  coordinationModifier = 1,
 ): RadarOperatorResult {

-    const contact = newestContact(radar.id, contacts);
+    const localContact = newestContact(radar.id, contacts);
+    const sharedContact = newestNetworkContact(contacts);
+    const sharedContactAge = sharedContact ? timestamp - sharedContact.timestamp : Number.POSITIVE_INFINITY;
+    const sharedMemoryMs = gameConfig.radar.sharedContactMemoryMs * coordinationModifier;
+    // 本地 Contact 始终可用；跨雷达 Contact 的共享窗口随指挥链受损而缩短。
+    const contact = localContact ?? (sharedContactAge <= sharedMemoryMs ? sharedContact : undefined);

   let accumulator = state.decisionAccumulatorSeconds + deltaSeconds;
-  if (accumulator < gameConfig.commander.decisionIntervalSeconds) {
+  const decisionIntervalSeconds = gameConfig.commander.decisionIntervalSeconds
+    / Math.max(0.25, coordinationModifier);
+  if (accumulator < decisionIntervalSeconds) {
     return {
       commander: { ...state, decisionAccumulatorSeconds: accumulator },
       radars,
       orderChanged: false,
     };
   }
-  accumulator %= gameConfig.commander.decisionIntervalSeconds;
+  accumulator %= decisionIntervalSeconds;

     const sectorOffset = intent === "COORDINATED_SEARCH" ? (index - (radars.length - 1) / 2) * 24 : 0;
+    const coordinationError = hasBelief
+      ? (1 - coordinationModifier)
+        * gameConfig.commander.maximumBearingErrorDegrees
+        * (index % 2 === 0 ? -1 : 1)
+        * (0.6 + (index % 3) * 0.2)
+      : 0;

-        focusBearingDegrees: baseBearing === undefined ? undefined : (baseBearing + sectorOffset + 360) % 360,
+        focusBearingDegrees: baseBearing === undefined
+          ? undefined
+          : (baseBearing + sectorOffset + coordinationError + 360) % 360,

       const operatorResult = advanceRadarOperators(
         commanderResult.radars,
         radarContacts,
         nextTimestamp,
         action.deltaSeconds,
+        mission.commanderCoordinationModifier,
       );
```

### 测试变更
```diff
-function createRadar(): RadarState {
+function createRadar(id = "R1"): RadarState {
   return {
-    id: "R1",
+    id,

-function createContact(timestamp: number, confidence: number): RadarContact {
+function createContact(timestamp: number, confidence: number, radarId = "R1"): RadarContact {
   return {
-    radarId: "R1",
+    radarId,

+  it("高效指挥链允许其他雷达使用共享 Contact，受损后共享窗口缩短", () => {
+    const networkContact = createContact(1000, 0.9, "R1");
+    const coordinated = advanceRadarOperators([createRadar("R2")], [networkContact], 4000, 0.5, 1);
+    const disrupted = advanceRadarOperators([createRadar("R2")], [networkContact], 4000, 0.5, 0.45);
+    expect(coordinated.radars[0]?.operator.mode).toBe("FOCUSED_TRACK");
+    expect(disrupted.radars[0]?.operator.mode).not.toBe("FOCUSED_TRACK");
+  });

+const supportingContact: RadarContact = {
+  ...strongContact,
+  id: "CONTACT-2",
+  radarId: "RADAR-02",
+  confidence: 0.8,
+};

+  it("指挥链只削弱多雷达联合证据，不削弱最强本地 Contact", () => {
+    const singleFull = advanceEngagement(createEngagementState(), [strongContact], 0.25, 1);
+    const singleDamaged = advanceEngagement(createEngagementState(), [strongContact], 0.25, 0.45);
+    const networkFull = advanceEngagement(createEngagementState(), [strongContact, supportingContact], 0.25, 1);
+    const networkDamaged = advanceEngagement(createEngagementState(), [strongContact, supportingContact], 0.25, 0.45);
+    expect(singleDamaged.state.trackProgress).toBeCloseTo(singleFull.state.trackProgress);
+    expect(networkDamaged.state.trackProgress).toBeGreaterThan(singleDamaged.state.trackProgress);
+    expect(networkDamaged.state.trackProgress).toBeLessThan(networkFull.state.trackProgress);
+  });

-    const full = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 1000, 1, 1);
-    const damaged = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 1000, 1, 0.5);
+    const full = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 2000, 2, 1);
+    const damaged = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 2000, 2, 0.5);

+  it("受损指挥链延长 Commander 决策间隔", () => {
+    const belief = advanceBeliefMap(createBeliefMap(), [contact], 1000, 0);
+    const full = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 1000, 1, 1);
+    const damaged = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 1000, 1, 0.5);
+    expect(full.commander.intent).toBe("CONCENTRATE_SEARCH");
+    expect(damaged.commander.intent).toBe("MONITOR");
+    expect(damaged.commander.targetPosition).toBeUndefined();
+  });
```

### 核心认知与机制文档
```diff
- Air Defense Commander 只读取 Awareness、Belief Map 与雷达状态，通过可解释 Utility 评分和 Operator 偏置协调雷达，不读取飞机真实位置。
+ Air Defense Commander 增加跨雷达 Contact 共享；指挥链受损会延迟决策、缩短共享窗口并扩大搜索方位误差。
- 防空交战中所有 Contact 统一乘以指挥链效率。
+ 最强 Contact 保留本地火控能力，额外雷达证据通过指挥链形成联合跟踪。
- 雷达 Operator 只读取属于自己的 Contact。
+ 雷达 Operator 优先读取本地 Contact，指挥链正常时可短暂使用其他雷达共享 Contact。
- Commander 固定每秒决策，指挥链仅缩放 Utility 偏置。
+ 指挥链同时影响决策间隔、共享窗口、联合证据、搜索方位误差与 Utility 偏置。
```

## 测试用例

### TC-001 跨雷达共享
- 操作：R1 产生 3 秒前的 Contact，R2 无本地 Contact。
- 预期：100% 效率下 R2 进入 Focused Track；45% 效率下共享已过期，R2 不聚焦。
- 是否通过：通过。

### TC-002 本地与联合火控分离
- 操作：分别输入单 Contact 和双雷达 Contact，对比 100% 与 45% 效率。
- 预期：单雷达增长相同；双雷达仍更强，但受损网络的联合增益低于完整网络。
- 是否通过：通过。

### TC-003 Commander 响应延迟
- 操作：同一高 Awareness、有效 Belief 推进 1 秒。
- 预期：100% 效率完成集中搜索决策；50% 效率仍等待下一决策周期。
- 是否通过：通过。

### TC-004 全量回归
- `npm run typecheck`：通过。
- `npm run test -- --run`：20 个测试文件、87 项测试全部通过。
- `npm run build`：通过。
- `git diff --check`：通过。

## 当前进展
- 多雷达协同已从数值叠加扩展为 Contact 共享、联合火控、命令延迟和搜索误差。
- 后续试玩应重点比较 Command Strike 前后多雷达同时覆盖航线时的 Threat Progress 与扫描线一致性。
