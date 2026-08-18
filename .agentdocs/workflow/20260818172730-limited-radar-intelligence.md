# 雷达有限情报与 AI DEBUG 信息边界

## 背景与目标
- 让 `intelAccuracy` 从面板数值变成实际影响航线规划的信息质量。
- 默认采用玩家有限情报视角，避免泄露敌方传感器与 AI 内部状态。

## 约束与原则
- 敌方探测和决策仍使用真实 `RadarState`；玩家报告只保存估计值。
- 情报按任务 Seed 确定生成，确保同一任务可复现。
- SEAD、Alert 修改雷达覆盖后，基于最终参数重新生成任务情报。

## 阶段与 TODO
- [x] 增加有限雷达情报模型与生成器。
- [x] 接入 Recon/ELINT 的持久情报加成。
- [x] 拆分默认玩家视图与 AI DEBUG。
- [x] 完成自动化测试、类型检查和构建。

## 当前进展
- 精度越高，雷达发现率越高，位置与覆盖估计误差越小。
- 未定位信号只显示数量，不生成虚假精确坐标。
- AI DEBUG 开启后才显示真实扫描、敌方 Contact、Belief、Awareness 与 Utility。

## 代码变更
- `src/domain/types.ts`
```diff
+export type RadarIntelLevel = "CONFIRMED" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
+export interface RadarIntelReport {
+  radarId: string;
+  level: RadarIntelLevel;
+  confidence: number;
+  estimatedPosition?: Vector2;
+  positionErrorRadius: number;
+  estimatedRange?: number;
+}
@@
   radars: RadarState[];
+  radarIntel: RadarIntelReport[];
```
- `src/domain/intelSystem.ts`
```diff
+export function generateRadarIntel(
+  missionSeed: string,
+  radars: readonly RadarState[],
+  intelAccuracy: number,
+): RadarIntelReport[] {
+  const accuracy = clamp(intelAccuracy, 0, 1);
+  return radars.map((radar) => {
+    const random = new SeededRandom(`${missionSeed}:INTEL:${radar.id}`);
+    const revealed = random.next() < clamp(0.18 + accuracy * 0.92, 0, 1);
+    // 仅输出由精度决定的估计数据，不复制实时雷达状态。
+  });
+}
```
- `src/domain/factories.ts`
```diff
+import { generateRadarIntel } from "./intelSystem";
@@
     radars: generated.radars,
+    radarIntel: generateRadarIntel(`${seed}-M01`, generated.radars, generated.intelAccuracy),
```
- `src/game/gameReducer.ts`
```diff
+import { generateRadarIntel } from "../domain/intelSystem";
@@
+      const adjustedRadars = selectedMission.radars.map((radar) => ({
+        ...radar,
+        range: radar.range * state.enemyState.radarCoverageModifier * alertCoverageMultiplier,
+      }));
+      const adjustedIntelAccuracy = Math.min(0.99, selectedMission.intelAccuracy + state.resources.intelAccuracyBonus);
@@
-          radars: selectedMission.radars.map((radar) => ({
-            ...radar,
-            range: radar.range * state.enemyState.radarCoverageModifier * alertCoverageMultiplier,
-          })),
-          intelAccuracy: Math.min(0.99, selectedMission.intelAccuracy + state.resources.intelAccuracyBonus),
+          radars: adjustedRadars,
+          radarIntel: generateRadarIntel(selectedMission.seed, adjustedRadars, adjustedIntelAccuracy),
+          intelAccuracy: adjustedIntelAccuracy,
```
- `src/ui/TacticalMap.tsx`
```diff
-      mission.radars.forEach((radar) => {
+      if (!showBelief) mission.radarIntel.forEach((report) => {
+        // 绘制估计覆盖、位置误差区、情报标记和可信度。
+      });
+      if (showBelief) mission.radars.forEach((radar) => {
@@
-      mission.radarContacts.forEach((contact) => {
+      if (showBelief) mission.radarContacts.forEach((contact) => {
@@
-      if ((showBelief || mission.threatPredictionEnabled) && mission.commander.targetPosition) {
+      if (showBelief && mission.commander.targetPosition) {
```
- `src/ui/App.tsx`
```diff
-  const [showBelief, setShowBelief] = useState(true);
+  const [showBelief, setShowBelief] = useState(false);
@@
-            BELIEF DEBUG {showBelief ? "ON" : "OFF"}
+            AI DEBUG {showBelief ? "ON" : "OFF"}
@@
+              <div><dt>已知雷达情报</dt><dd>{visibleRadarIntel.length} 个</dd></div>
+              <div><dt>未定位信号</dt><dd>{mission.radarIntel.length - visibleRadarIntel.length} 个</dd></div>
-          <section className="panel-section commander-section">
+          {showBelief && <section className="panel-section commander-section">
```
- `src/domain/intelSystem.test.ts`
```diff
+describe("雷达有限情报系统", () => {
+  it("相同 Seed 与精度会生成完全一致的报告", () => { /* 断言 */ });
+  it("提高情报精度不会减少已定位雷达，并会缩小位置误差", () => { /* 断言 */ });
+  it("所有估计坐标均限制在战术地图内", () => { /* 断言 */ });
+  it("玩家报告不泄露雷达实时开关、扫描角度和操作员状态", () => { /* 断言 */ });
+});
```
- `AGENTS.md`
```diff
+- 正常战术视图只显示由 Intel Accuracy 决定的雷达估计位置、误差区与估计覆盖；真实雷达、敌方 Contact、Belief 和 AI 决策仅在 AI DEBUG 中显示。
+- Recon/ELINT 的情报加成会提高后续任务的雷达发现率，并缩小位置与覆盖估计误差。
```
- `.agentdocs/index.md`
```diff
+`workflow/20260818172730-limited-radar-intelligence.md` - 会话-68：让情报精度实际控制雷达发现率与估计误差，并拆分玩家视图和 AI DEBUG；需要理解有限情报边界与地图显示规则时读取。
+- 默认战术地图只呈现带误差的玩家雷达情报；敌方真实雷达、Contact、Belief、警戒和 Utility 仅在 AI DEBUG 中呈现。
```

## 测试用例
### TC-001 情报生成可复现
- 操作：以相同 Seed、雷达和精度生成两次报告。
- 预期：两份报告完全相同。
- 是否通过：是。

### TC-002 情报精度改善质量
- 操作：比较 35% 与 95% 情报精度。
- 预期：高精度已定位雷达数不减少，平均位置误差更小。
- 是否通过：是。

### TC-003 信息边界
- 操作：检查玩家报告字段。
- 预期：不含雷达开关、扫描角、Operator、真实位置和真实范围。
- 是否通过：是。

### TC-004 工程回归
- 操作：运行 `npm run typecheck && npm run test && npm run build`。
- 预期：类型检查通过、61 项测试通过、生产构建成功。
- 是否通过：是。
