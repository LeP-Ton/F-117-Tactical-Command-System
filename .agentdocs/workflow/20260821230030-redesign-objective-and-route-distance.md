# 重构任务目标模块并增加航线距离

## 背景与目标
- 目标模块中的目标代号层级不清，“武器待命”和“弹药待命”语义重复。
- 目标摧毁后仍显示到目标的距离，无法支持撤离决策。
- 航点规划缺少规划总航程和当前剩余航程。

## 约束与原则
- 保留目标代号，但明确标注为 `TARGET DESIGNATION`。
- 武器状态只显示一次。
- 撤离距离按飞机到撤离矩形最近边界计算，区域内为零。
- 规划总航程为全部航点折线长度；剩余航程从飞机当前位置开始，依次沿活动航点和后续航点计算。

## 阶段与 TODO
- [x] 重构目标代号、任务阶段、阶段距离与武器状态层级。
- [x] 目标摧毁后切换为撤离区距离。
- [x] 增加规划总航程与剩余航程计算函数。
- [x] 在航点序列中显示两项航程。
- [x] 增加领域测试并完成全量回归。

## 关键风险
- “剩余航程”表示当前规划路线的剩余折线长度，不等于燃油可用航程；两者分别位于航点区和燃油遥测区。
- 规划航线若未包含撤离航点，规划总航程不会自动追加撤离区距离，这是对玩家实际航点方案的忠实统计。

## 代码变更

### 撤离区距离
```diff
--- src/domain/missionRules.ts
+++ src/domain/missionRules.ts
+/** 计算到矩形撤离区最近边界的距离；进入区域后距离为零。 */
+export function distanceToExtraction(position: Vector2, area: ExtractionArea): number {
+  const deltaX = Math.max(area.x - position.x, 0, position.x - (area.x + area.width));
+  const deltaY = Math.max(area.y - position.y, 0, position.y - (area.y + area.height));
+  return Math.hypot(deltaX, deltaY);
+}

--- src/domain/missionRules.test.ts
+++ src/domain/missionRules.test.ts
+it("撤离距离按最近边界计算并在区域内归零", () => {
+  expect(distanceToExtraction({ x: 80, y: 120 }, area)).toBe(20);
+  expect(distanceToExtraction({ x: 120, y: 120 }, area)).toBe(0);
+});
```

### 航线距离
```diff
--- src/domain/route.ts
+++ src/domain/route.ts
+/** 计算完整规划航线的折线长度。 */
+export function getPlannedRouteDistance(route: RouteState): number { ... }
+/** 从飞机当前位置出发，沿尚未执行的航点计算剩余航程。 */
+export function getRemainingRouteDistance(route: RouteState, aircraftPosition: Vector2): number { ... }

--- src/domain/route.test.ts
+++ src/domain/route.test.ts
+it("分别计算规划总航程和当前位置起算的剩余航程", () => {
+  expect(getPlannedRouteDistance(route)).toBe(9);
+  expect(getRemainingRouteDistance(route, { x: 0, y: 4 })).toBe(7);
+  expect(getRemainingRouteDistance(completedRoute, { x: 3, y: 8 })).toBe(0);
+});
```

### 目标与航点界面
```diff
--- src/ui/ControlPanel.tsx
+++ src/ui/ControlPanel.tsx
+const extractionDistance = distanceToExtraction(mission.aircraft.position, mission.extractionArea);
+const plannedRouteDistance = getPlannedRouteDistance(mission.route);
+const remainingRouteDistance = getRemainingRouteDistance(mission.route, mission.aircraft.position);
-<span>MISSION OBJECTIVE</span><span>{mission.target.id}</span>
+<span>TARGET DESIGNATION</span><span>{mission.target.id}</span>
-目标有效 // 武器待命
+目标有效
-<span>距离 {targetDistance.toFixed(0)} u</span>
-<span>{mission.target.destroyed ? "弹药已投放" : "弹药待命"}</span>
+<div><span>{mission.target.destroyed ? "撤离区距离" : "目标距离"}</span><strong>{phaseDistance} u</strong></div>
+<div><span>武器状态</span><strong>{mission.target.destroyed ? "已投放" : "待命"}</strong></div>
+<div className="route-distance-summary">
+  <div><span>规划总航程</span><strong>{plannedRouteDistance} u</strong></div>
+  <div><span>剩余航程</span><strong>{remainingRouteDistance} u</strong></div>
+</div>

--- src/ui/styles.css
+++ src/ui/styles.css
-.objective-meta { display: flex; justify-content: space-between; ... }
+.objective-meta, .route-distance-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; ... }
+.objective-meta div, .route-distance-summary div { padding: 7px 8px; border: 1px solid #17372e; ... }
+.objective-meta span, .objective-meta strong, .route-distance-summary span, .route-distance-summary strong { display: block; }

--- src/ui/App.tsx
+++ src/ui/App.tsx
-<div><dt>剩余航程</dt><dd>{fuelRemaining} / {fuelCapacity} u</dd></div>
+<div><dt>剩余油料航程</dt><dd>{fuelRemaining} / {fuelCapacity} u</dd></div>
```

## 测试用例

### TC-001 目标有效阶段
- 预期：显示目标代号、目标有效、目标距离与唯一的武器待命状态。
- 是否通过：通过（类型检查与组件测试）。

### TC-002 目标摧毁阶段
- 预期：状态切换为撤离航段，距离切换为撤离区最近边界距离；进入撤离区后为 `0 u`。
- 是否通过：通过（领域测试）。

### TC-003 航线距离
- 预期：规划总航程等于完整折线长度；剩余航程从飞机当前位置沿未执行航点计算，航线完成后为零。
- 是否通过：通过（领域测试）。

### TC-004 自动化回归
- `npm run typecheck`：通过。
- `npm run test -- --run`：通过，23 个测试文件、105 项测试。
- `npm run build`：通过。
- `git diff --check`：通过。
