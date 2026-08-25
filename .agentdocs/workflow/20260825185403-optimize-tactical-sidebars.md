# 战术界面侧栏信息架构优化

## 背景与目标
- 移除航线执行期间重复且语义不明的航点菱形锁定标记。
- 按“左侧规划、右侧态势”的职责重新组织侧栏，降低右侧首屏信息密度。
- 保持地图为视觉中心，不调整三栏宽度。

## 约束与原则
- 不修改任务规则、雷达情报边界或地图元素选择协议。
- 普通模式仍只能查看有限雷达情报，真实雷达和 AI 内部数据仅在 AI DEBUG 中出现。
- 天气预报仅迁移显示位置，预报数据及计算方式不变。

## 阶段与 TODO
- [x] 删除航点 `lock-mark`，保留状态文字、禁用按钮与暂停重规划提示。
- [x] 将天气预报迁移至左侧规划面板并默认折叠。
- [x] 将右侧遥测拆分为飞行状态与任务情报。
- [x] 将地图元素按任务目标、航线、环境、雷达分类折叠。
- [x] 将简报和 AI 调试内容降级为默认折叠信息。
- [x] 补充 UI 回归测试并完成类型检查、测试和构建。

## 代码变更

### `src/ui/ControlPanel.tsx`
```diff
- {!canEdit && index !== 0 && <span className="lock-mark">◆</span>}
+ <CollapsibleSection
+   className="weather-planning-section"
+   title="WEATHER FORECAST"
+   meta={`${mission.weather.length} CELLS`}
+   defaultExpanded={false}
+ >
+   <ol className="weather-forecast-list">...</ol>
+ </CollapsibleSection>
```

### `src/ui/App.tsx`
```diff
- <MapElementPanel ... />
- <CollapsibleSection title="FLIGHT TELEMETRY">...</CollapsibleSection>
+ <section className="... threat-section ...">...</section>
+ <section className="... fuel-section ...">...</section>
+ <CollapsibleSection title="FLIGHT STATUS">...</CollapsibleSection>
+ <CollapsibleSection title="MISSION INTEL" defaultExpanded={false}>...</CollapsibleSection>
+ <MapElementPanel ... />

- <CollapsibleSection title="WEATHER FORECAST">...</CollapsibleSection>
- <CollapsibleSection title="COUNTER DEPLOYMENT" ...>
- <CollapsibleSection title="FINAL DEFENSE BRIEFING" ...>
+ <CollapsibleSection title="COUNTER DEPLOYMENT" ... defaultExpanded={false}>
+ <CollapsibleSection title="FINAL DEFENSE BRIEFING" ... defaultExpanded={false}>

- {showBelief && <CollapsibleSection title="结构化事件">...</CollapsibleSection>}
- {showBelief && <CollapsibleSection title="AIR DEFENSE COMMANDER">...</CollapsibleSection>}
- {showBelief && <CollapsibleSection title="RADAR OPERATOR AI">...</CollapsibleSection>}
+ {showBelief && (
+   <CollapsibleSection className="debug-group" title="AI DEBUG" meta="INTERNAL" defaultExpanded={false}>
+     <CollapsibleSection title="结构化事件">...</CollapsibleSection>
+     <CollapsibleSection title="AIR DEFENSE COMMANDER">...</CollapsibleSection>
+     <CollapsibleSection title="RADAR OPERATOR AI">...</CollapsibleSection>
+   </CollapsibleSection>
+ )}
```

### `src/ui/MapElementPanel.tsx`
```diff
- <div className="map-element-list">
-   {/* 所有地图元素平铺 */}
- </div>
+ <CollapsibleSection title="任务目标" meta="3" defaultExpanded={false}>...</CollapsibleSection>
+ <CollapsibleSection title="航线" meta={mission.route.waypoints.length} defaultExpanded={false}>...</CollapsibleSection>
+ <CollapsibleSection title="环境" meta={mission.terrain.length + mission.weather.length} defaultExpanded={false}>...</CollapsibleSection>
+ <CollapsibleSection title="雷达" meta={radarItems.length} defaultExpanded={false}>...</CollapsibleSection>
```

### `src/ui/styles.css`
```diff
- .lock-mark { grid-column: 3; color: #665b3a; font-size: 7px; }
+ .map-element-group.panel-section { padding: 10px 0; border-bottom-color: #142f27; }
+ .map-element-group:last-child { padding-bottom: 0; border-bottom: 0; }
+ .map-element-group .collapsible-heading { font-size: 10px; }
+ .map-element-group .collapsible-content { margin-top: 8px; }
+ .debug-group > .collapsible-content > .panel-section { padding: 14px 0; }
+ .debug-group > .collapsible-content > .panel-section:last-child { padding-bottom: 0; border-bottom: 0; }
```

### `src/ui/ControlPanel.test.tsx`
```diff
+ expect(screen.queryByText("◆")).not.toBeInTheDocument();
+ expect(screen.getByRole("button", { name: /WEATHER FORECAST/ })).toHaveAttribute("aria-expanded", "false");
```

### `src/ui/MapElementPanel.test.tsx`
```diff
+ describe("MapElementPanel 地图元素分类", () => {
+   it("默认折叠四类元素，并保留元素选择回调", () => {
+     // 验证四个分类默认折叠，展开任务目标后仍能选择 F-117。
+   });
+ });
```

## 测试用例

### TC-001 执行中航点状态
- 前置条件：任务状态为 `RUNNING`，存在待飞航点。
- 预期结果：排序和删除按钮禁用，页面不显示 `◆`。
- 是否通过：是。

### TC-002 天气规划情报
- 预期结果：`WEATHER FORECAST` 位于左侧且默认折叠。
- 是否通过：是。

### TC-003 地图元素分类与选择
- 预期结果：四类元素默认折叠；展开分类并选择元素后仍触发既有地图选择协议。
- 是否通过：是。

### TC-004 工程回归
- `npm run typecheck`：通过。
- `npm run test`：24 个测试文件、106 个测试全部通过。
- `npm run build`：通过。

## 当前结果
- 左侧集中任务操作、目标、航线和天气预报。
- 右侧优先显示威胁、燃油和飞行状态，任务情报、地图元素、战役简报及调试信息按层级折叠。
- 三栏宽度及所有领域逻辑保持不变。
