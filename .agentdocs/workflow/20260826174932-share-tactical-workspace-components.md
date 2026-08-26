# 战术工作区基础组件共享重构

## 背景与目标
- 保留任务执行、任务情报和任务复盘各自的信息结构。
- 消除三套页面在地图骨架、天气列表、部署简报和敌方分析上的重复 JSX。
- 让 `App.tsx` 只负责任务视图状态、权限和页面切换。

## 约束与原则
- 行为保持，不调整任务计算、情报权限、复盘内容、结算或存档。
- 共享组件不读取 `RunState`，不自行 dispatch reducer。
- 不建设布尔参数驱动的万能侧栏；页面继续显式组合业务模块。

## 阶段与 TODO
- [x] 抽取三栏 `TacticalWorkspace`。
- [x] 抽取三种明确变体的 `TacticalMapStage`。
- [x] 抽取天气、部署简报、敌方摘要和 Operator 列表。
- [x] 将三个 Workspace 迁出 `App.tsx`。
- [x] 复用规划与情报页天气预报。
- [x] 复用任务调试与复盘全景敌方分析。
- [x] 增加共享组件渲染测试。
- [x] 完成类型、测试和生产构建验证。

## 当前进展
- `App.tsx` 从直接渲染三套大型工作区改为编排 `MissionWorkspace`、`IntelligenceWorkspace` 与 `DebriefWorkspace`。
- 地图标题、图例与只读参数统一由 `TacticalMapStage` 生成。
- 任务和复盘仍保留各自专用左右侧栏，未增加或删除玩家可见信息。

## 代码变更
- 新增三栏和地图基础组件。
```diff
+export function TacticalWorkspace({ leftPanel, mapStage, rightPanel, className = "" }: TacticalWorkspaceProps) {
+  return <div className={`workspace ${className}`.trim()}>{leftPanel}{mapStage}{rightPanel}</div>;
+}
+export type TacticalMapVariant = "MISSION" | "INTELLIGENCE" | "DEBRIEF";
+export function TacticalMapStage({ variant, mission, showBelief, readOnly, toolbar, ...interaction }: TacticalMapStageProps) {
+  return <section className="map-stage">
+    <div className="map-label"><span>{stageTitles[variant]}</span><span>{resolvedStatus}</span></div>
+    {toolbar}
+    <TacticalMap mission={mission} showBelief={showBelief} readOnly={readOnly} {...interaction} />
+    <div className="map-legend">{/* 按明确变体生成图例 */}</div>
+  </section>;
+}
```

- 新增共享信息模块。
```diff
+export function WeatherForecastPanel({ mission, defaultExpanded = true }: WeatherForecastPanelProps) {
+  return <CollapsibleSection title="WEATHER FORECAST" meta={`${mission.weather.length} CELLS`} defaultExpanded={defaultExpanded}>
+    <ol className="weather-forecast-list">{mission.weatherForecast.map(renderForecast)}</ol>
+  </CollapsibleSection>;
+}
+export function DeploymentBriefingPanel({ title, notes, meta = notes.length, defaultExpanded = false }: DeploymentBriefingPanelProps) {
+  if (notes.length === 0) return null;
+  return <CollapsibleSection title={title} meta={meta} defaultExpanded={defaultExpanded}>...</CollapsibleSection>;
+}
+export function EnemyStateSummary({ mission, density }: EnemyStateSummaryProps) {
+  return density === "compact" ? <CompactEnemySummary /> : <DetailedEnemySummary />;
+}
+export function RadarOperatorList({ mission }: RadarOperatorListProps) {
+  return <>{mission.radars.map(renderOperatorUtility)}</>;
+}
```

- `ControlPanel` 改用共享天气组件。
```diff
-      <CollapsibleSection title="WEATHER FORECAST" meta={`${mission.weather.length} CELLS`} defaultExpanded={false}>
-        <ol className="weather-forecast-list">{/* 重复的预报列表 */}</ol>
-      </CollapsibleSection>
+      <WeatherForecastPanel mission={mission} defaultExpanded={false} />
```

- 三个页面迁入独立 Workspace。
```diff
+export function MissionWorkspace(props: MissionWorkspaceProps) {
+  return <TacticalWorkspace
+    leftPanel={<ControlPanel ... />}
+    mapStage={<TacticalMapStage variant="MISSION" ... />}
+    rightPanel={<aside className="telemetry-panel">{/* 实时任务模块 */}</aside>}
+  />;
+}
+export function IntelligenceWorkspace(props: IntelligenceWorkspaceProps) {
+  return <TacticalWorkspace
+    leftPanel={<>任务情报控制、WeatherForecastPanel</>}
+    mapStage={<TacticalMapStage variant="INTELLIGENCE" readOnly ... />}
+    rightPanel={<>MapElementPanel、DeploymentBriefingPanel</>}
+  />;
+}
+export function DebriefWorkspace(props: DebriefWorkspaceProps) {
+  const [panoramic, setPanoramic] = useState(false);
+  return <TacticalWorkspace
+    leftPanel={<>最终状态摘要、视角切换</>}
+    mapStage={<TacticalMapStage variant="DEBRIEF" readOnly showBelief={panoramic} ... />}
+    rightPanel={<>MapElementPanel、EnemyStateSummary、RadarOperatorList</>}
+  />;
+}
```

- `App.tsx` 删除页面内部实现，保留状态编排。
```diff
-function DebriefWorkspace(...) { /* 页面完整 JSX */ }
-{intelligencePreview ? <div className="workspace intelligence-workspace">{/* 页面完整 JSX */}</div> : ...}
+{activeDebrief
+  ? <DebriefWorkspace ... />
+  : intelligencePreview
+    ? <IntelligenceWorkspace ... />
+    : campaignView
+      ? <CampaignMap ... />
+      : <MissionWorkspace ... />}
```

- 新增共享组件测试。
```diff
+describe("战术工作区共享组件", () => {
+  it("地图舞台按任务情报变体生成标题和有限情报图例", ...);
+  it("天气预报沿用调用方指定的折叠状态", ...);
+  it("敌方状态摘要提供固定的精简与详细密度", ...);
+  it("Radar Operator 列表统一显示模式与三项 Utility", ...);
+});
```

## 测试用例
### TC-001 地图舞台变体
- 操作：渲染任务情报地图舞台。
- 预期：显示 `MISSION INTELLIGENCE`、`CURRENT ESTIMATE` 与有限雷达情报图例。
- 是否通过：通过。

### TC-002 天气折叠策略
- 操作：以默认收起方式渲染共享天气模块。
- 预期：标题内容正确且 `aria-expanded=false`。
- 是否通过：通过。

### TC-003 敌方分析密度
- 操作：分别渲染 compact 与 detailed 摘要。
- 预期：compact 保留复盘字段，detailed 包含指挥链效率与雷达数量。
- 是否通过：通过。

### TC-004 Operator Utility
- 操作：渲染任务全部雷达 Operator。
- 预期：每部雷达均显示类型、模式及 W/S/F 三项评分。
- 是否通过：通过。

## 验证结果
- `npm run typecheck`：通过。
- `npm run test`：通过，26 个测试文件、114 个测试全部通过。
- `npm run build`：通过，Vite 生产构建成功。
- `git diff --check`：通过。
