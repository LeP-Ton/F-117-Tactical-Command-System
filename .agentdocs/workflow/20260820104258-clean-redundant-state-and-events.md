# 第一批：清理冗余状态、无界事件与信息泄露

## 背景与目标
- 删除没有消费方或可从唯一事实来源派生的状态。
- 限制长任务事件增长，并确保音频在事件截断后不重复播放。
- 正常玩家视图不再展示敌方内部事件或架构开发说明。

## 约束与原则
- 保持 Contact、Belief、Commander、Operator 与 Engagement 行为不变。
- 保留会话-60的“重置当前任务”语义和会话-61的折叠面板。
- AI DEBUG 继续提供完整调试信息。

## 阶段与 TODO
- [x] 删除无消费方和可派生状态。
- [x] 删除高频 `BELIEF_UPDATED` 事件。
- [x] 事件历史限制为 200 条并按事件 ID 消费音频。
- [x] 正常视图隐藏结构化事件并删除架构说明。
- [x] 更新测试与核心文档。

## 代码变更
- `src/domain/types.ts`
```diff
-  completedNodeIds: string[];
-  adaptationLevel: number;
-export interface MissionResult {
-  missionId: string;
-  outcome: "SUCCESS" | "FAILED" | "ABORTED";
-}
-  modeChangedAt: number;
-  lastContactAt?: number;
-  launches: number;
-  lastDecisionAt: number;
-  | "BELIEF_UPDATED"
-  generationInfo: {
-    terrainCount: number;
-    radarCount: number;
-    weatherCount: number;
-  };
-  missionHistory: MissionResult[];
```
- `src/game/gameReducer.ts`
```diff
+const MAX_STORED_EVENTS = 200;
+
+function appendEvents(mission: MissionSession, events: MissionSession["events"]): MissionSession["events"] {
+  if (events.length === 0) return mission.events;
+  return [...mission.events, ...events].slice(-MAX_STORED_EVENTS);
+}
-      const beliefEvents = radarResult.contacts.length > 0
-        ? [{
-          ...createGameEvent(
-            mission,
-            "BELIEF_UPDATED",
-            { contactCount: radarResult.contacts.length, peak: getBeliefPeak(beliefMap) },
-            "BELIEF_SYSTEM",
-          ),
-          timestamp: nextTimestamp,
-        }]
-        : [];
-        missionHistory: [...state.missionHistory, ...missionResult],
+          events: appendEvents(mission, tickEvents),
```
- `src/audio/useGameAudio.ts`
```diff
-  const processedEventCount = useRef(mission?.events.length ?? 0);
+  const lastProcessedEventId = useRef(mission?.events.at(-1)?.id);
-    mission.events.slice(processedEventCount.current).forEach((event) => gameAudio.playEvent(event));
-    processedEventCount.current = mission.events.length;
+    const previousIndex = lastProcessedEventId.current
+      ? mission.events.findIndex((event) => event.id === lastProcessedEventId.current)
+      : -1;
+    const unprocessedEvents = previousIndex >= 0
+      ? mission.events.slice(previousIndex + 1)
+      : mission.events.slice(-1);
+    unprocessedEvents.forEach((event) => gameAudio.playEvent(event));
+    lastProcessedEventId.current = mission.events.at(-1)?.id;
```
- `src/ui/App.tsx`
```diff
-          <CollapsibleSection className="event-section" title="结构化事件" meta={mission.events.length}>
+          {showBelief && <CollapsibleSection className="event-section" title="结构化事件" meta={mission.events.length}>
-          </CollapsibleSection>
-          <section className="architecture-note">
-            <span>ARCHITECTURE STATUS</span>
-            <strong>RUN ≠ MISSION</strong>
-            <p>单任务闭环：规划 → 渗透 → 打击 → 高警戒撤离。</p>
-          </section>
+          </CollapsibleSection>}
```
- `src/ui/styles.css`
```diff
-.architecture-note { margin: 20px; padding: 15px; border: 1px solid #274c40; background: rgba(23, 56, 46, 0.22); }
-.architecture-note span { display: block; color: #52776b; font-size: 9px; }
-.architecture-note strong { display: block; margin: 7px 0; color: #d1aa55; font-size: 13px; }
-.architecture-note p { margin: 0; color: #64877c; font-size: 9px; line-height: 1.5; }
```
- `src/domain/engagementSystem.ts`、`src/domain/radarOperatorAI.ts`、`src/domain/airDefenseCommander.ts`
```diff
-  return { stage: "UNDETECTED", trackProgress: 0, launches: 0 };
+  return { stage: "UNDETECTED", trackProgress: 0 };
-    modeChangedAt: 0,
-        lastContactAt: contact?.timestamp ?? radar.operator.lastContactAt,
-    lastDecisionAt: 0,
```
- 测试同步删除旧字段断言，并新增事件上限用例。
```diff
+  it("任务事件历史最多保留 200 条", () => {
+    let state = createRun("BOUNDED-EVENTS");
+    for (let index = 0; index < 230; index += 1) {
+      state = gameReducer(state, { type: "ADD_WAYPOINT", position: { x: 100 + index, y: 700 } });
+    }
+    expect(state.currentMission?.events).toHaveLength(200);
+  });
```

## 测试结果
- `npm run typecheck`：通过。
- `npm run test`：18 个测试文件、81 项测试通过。
- `npm run build`：通过。
- `git diff --check`：通过。
