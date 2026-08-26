# 实时航线调整与任务复盘

## 背景与目标
- 任务执行改为不可暂停的连续行动，执行中不能重置或退出。
- 飞行中允许调整当前目标航点之后的路径，当前目标及已飞路径必须锁定。
- 成功撤离时冻结战场状态，并在整个 Run 内提供历史复盘。

## 约束与原则
- 成功和失败仍在玩家返回任务网络时结算 Campaign，不改变节点解锁、Enemy Alert 和适应性分析时机。
- 复盘只读取冻结快照，不修改当前 Mission、Campaign 或情报权限。
- 旧版 `PAUSED` 存档必须迁移为 `RUNNING`，缺少复盘集合的旧存档补为空集合。
- 保留旧暂停事件类型的读取兼容，但不再产生暂停与继续操作。

## 阶段与 TODO
- [x] 删除暂停状态及暂停/继续 reducer 操作。
- [x] 拆分规划与执行中的航点编辑权限。
- [x] 禁止执行中重置和返回任务网络。
- [x] 成功撤离 Tick 深拷贝并持久化任务快照。
- [x] 已完成节点增加任务复盘入口。
- [x] 增加任务视角和全景敌方态势切换。
- [x] 增加旧存档迁移与自动化测试。
- [x] 更新核心认知与文档索引。

## 关键风险
- 飞行中的航点权限必须由 reducer 与 Canvas 同时校验，不能只依赖按钮置灰。
- 当前目标航点到达后可能立刻成为已完成航点，因此编辑边界始终以实时 `activeWaypointIndex` 计算。
- 复盘保存完整敌方内部状态会增加 localStorage 用量；当前 Campaign 最多四次成功任务，数据规模仍在可控范围。

## 当前进展
- `MissionStatus` 已移除 `PAUSED`，运行中刷新后继续执行。
- 航线操作引入 `PLANNING/RUNNING` 编辑模式；执行中仅 `index > activeWaypointIndex` 可编辑。
- `RunState.missionDebriefs` 按节点保存成功撤离瞬间的深拷贝。
- 已完成节点可进入只读复盘，默认任务视角，并可切换真实雷达、Contact、Belief、Commander 与 Operator Utility 全景视角。

## 代码变更
- `src/domain/types.ts`、`src/domain/factories.ts`
```diff
-export type MissionStatus = "PLANNING" | "RUNNING" | "PAUSED" | "SUCCESS" | "FAILED";
+export type MissionStatus = "PLANNING" | "RUNNING" | "SUCCESS" | "FAILED";
+export interface MissionDebrief {
+  nodeId: string;
+  completedAt: number;
+  intelAccessTier: 0 | 1 | 2;
+  mission: MissionSession;
+}
 export interface RunState {
+  missionDebriefs: Record<string, MissionDebrief>;
 }
+    missionDebriefs: {},
```

- `src/domain/route.ts`、`src/domain/missionRules.ts`
```diff
-export function canEditWaypoint(route: RouteState, index: number): boolean {
-  return Boolean(waypoint && waypoint.kind !== "INSERTION" && index >= route.activeWaypointIndex);
+export type WaypointEditMode = "PLANNING" | "RUNNING";
+export function canEditWaypoint(route: RouteState, index: number, mode: WaypointEditMode = "PLANNING"): boolean {
+  const firstEditableIndex = mode === "RUNNING" ? route.activeWaypointIndex + 1 : 1;
+  return Boolean(waypoint && waypoint.kind !== "INSERTION" && index >= firstEditableIndex);
 }
-    && (mission.status === "RUNNING" || mission.status === "PAUSED")
+    && mission.status === "RUNNING"
```

- `src/game/gameReducer.ts`、`src/game/gamePersistence.ts`
```diff
-  | { type: "PAUSE" }
-  | { type: "RESUME" }
-function isEditable(state: RunState): boolean {
-  return status === "PLANNING" || status === "PAUSED";
+function getEditMode(state: RunState): "PLANNING" | "RUNNING" | undefined {
+  return status === "PLANNING" || status === "RUNNING" ? status : undefined;
 }
-    case "PAUSE": { /* 生成暂停状态与事件 */ }
-    case "RESUME": { /* 恢复运行 */ }
+      const shouldCaptureDebrief = terminalStatus === "SUCCESS"
+        && Boolean(currentNodeId)
+        && !state.missionDebriefs[currentNodeId!];
+      missionDebriefs: shouldCaptureDebrief
+        ? { ...state.missionDebriefs, [currentNodeId!]: {
+          nodeId: currentNodeId!, completedAt: nextTimestamp,
+          intelAccessTier: getIntelAccessTier(state.campaign),
+          mission: structuredClone(nextMission),
+        } }
+        : state.missionDebriefs,
     case "RESET": {
+      if (mission.status !== "PLANNING") return state;
-    const restored = payload.state.currentMission?.status === "RUNNING"
-      ? { ...payload.state, currentMission: { ...payload.state.currentMission, status: "PAUSED" as const } }
-      : payload.state;
+    const restored: RunState = {
+      ...payload.state,
+      missionDebriefs: payload.state.missionDebriefs ?? {},
+      currentMission: legacyStatus === "PAUSED"
+        ? { ...payload.state.currentMission!, status: "RUNNING" }
+        : payload.state.currentMission,
+    };
```

- `src/ui/ControlPanel.tsx`、`src/ui/TacticalMap.tsx`
```diff
-  PAUSED: "航线修订",
-  const editable = mission.status === "PLANNING" || mission.status === "PAUSED";
+  const editable = mission.status === "PLANNING" || mission.status === "RUNNING";
+  const editMode = mission.status === "RUNNING" ? "RUNNING" : "PLANNING";
-  <button onClick={() => dispatch({ type: "PAUSE" })}>暂停 / 修订航线</button>
-  <button onClick={() => dispatch({ type: "RESUME" })}>继续执行</button>
-  <button onClick={() => dispatch({ type: "RESET" })}>重置航线</button>
+  {mission.status === "PLANNING" && <button onClick={() => dispatch({ type: "RESET" })}>重置航线</button>}
-  飞行中需先暂停才能重规划。
+  任务执行中仅可调整当前目标之后的航点。
-      if (editable && canEditWaypoint(mission.route, hitIndex)) {
+      if (editable && canEditWaypoint(mission.route, hitIndex, editMode)) {
```

- `src/ui/CampaignMap.tsx`、`src/ui/App.tsx`
```diff
+  onDebrief: (debrief: MissionDebrief) => void;
+  const selectedDebrief = selected ? state.missionDebriefs[selected.id] : undefined;
+  if (selected.status === "COMPLETED") {
+    if (selectedDebrief) onDebrief(selectedDebrief);
+    return;
+  }
+  {selected.status === "COMPLETED" ? selectedDebrief ? "任务复盘" : "任务已完成" : "执行任务"}
+function DebriefWorkspace({ debrief, mapSelection, onMapSelectionChange, onClose }: DebriefWorkspaceProps) {
+  const [panoramic, setPanoramic] = useState(false);
+  return <div className="workspace intelligence-workspace">
+    {/* 冻结地图、最终状态摘要、任务/全景视角切换与敌方内部分析 */}
+  </div>;
+}
+  if (mission.status === "SUCCESS" && state.campaign.currentNodeId === activeDebrief.nodeId) {
+    dispatch({ type: "RETURN_CAMPAIGN" });
+  }
+  if (missionStatus === "RUNNING") return false;
+  if (mission?.status === "RUNNING") setCampaignView(false);
```

- 测试文件
```diff
-  it("规划、开始、暂停、重规划并继续", () => { /* ... */ });
+  it("任务执行中锁定当前目标航点但允许调整后续航点", () => { /* ... */ });
+  it("执行中当前目标锁定且只允许编辑其后航点", () => { /* ... */ });
-  it("刷新时把运行中的任务恢复为暂停，避免自动继续飞行", () => { /* ... */ });
+  it("刷新时运行中的任务保持执行状态", () => { /* ... */ });
+  it("旧版暂停存档迁移为运行状态并补全复盘集合", () => { /* ... */ });
+  expect(state.missionDebriefs[nodeId]?.mission.status).toBe("SUCCESS");
```

## 测试用例
### TC-001 执行中航点权限
- 类型：功能与领域测试
- 优先级：高
- 操作：开始任务后尝试移动当前目标航点，再移动、删除和排序其后航点。
- 预期：当前目标与此前路径不变，后续航点操作生效。
- 是否通过：通过。

### TC-002 不可暂停与不可重置
- 类型：状态测试
- 优先级：高
- 操作：任务处于 RUNNING 时发送 Tick 和 RESET，并检查任务控件。
- 预期：任务持续推进，RESET 被 reducer 拒绝，界面不显示暂停、重置和任务网络入口。
- 是否通过：通过。

### TC-003 成功快照与复盘
- 类型：集成测试
- 优先级：高
- 操作：摧毁目标后进入撤离区，再检查节点复盘记录。
- 预期：同一 Tick 生成独立 SUCCESS 快照；任务网络已完成节点显示“任务复盘”。
- 是否通过：通过。

### TC-004 存档兼容
- 类型：兼容性测试
- 优先级：高
- 操作：恢复 RUNNING 存档及包含 PAUSED 且无 missionDebriefs 的旧存档。
- 预期：两者均恢复为 RUNNING，旧存档补全空复盘集合。
- 是否通过：通过。

## 验证结果
- `npm run typecheck`：通过。
- `npm run test`：通过，25 个测试文件、110 个测试全部通过。
- `npm run build`：通过，Vite 生产构建成功。
