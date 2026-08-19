# 两侧面板折叠区与定制滚动条

## 背景与目标
- 左右侧栏此前使用浏览器默认滚动条，与战术终端视觉不一致。
- 航点、遥测、事件和 AI Debug 列表较长，会持续占用侧栏高度。
- 为长内容提供默认展开、可独立收起的通用交互。

## 约束与原则
- 折叠状态只属于 UI，不写入 `RunState` 或 `MissionSession`。
- `THREAT WARNING` 保持常驻，避免玩家隐藏关键交战警报。
- Firefox 使用标准 scrollbar 属性，Chromium/Safari 使用 `::-webkit-scrollbar`。

## 阶段与 TODO
- [x] 新增通用 `CollapsibleSection` 组件。
- [x] 接入航点序列和右侧长内容区。
- [x] 定制两侧面板及内部列表滚动条。
- [x] 完成类型、测试和构建验证。

## 代码变更

### `src/ui/CollapsibleSection.tsx`

```diff
+import { useState, type ReactNode } from "react";
+
+interface CollapsibleSectionProps {
+  title: ReactNode;
+  meta?: ReactNode;
+  className?: string;
+  defaultExpanded?: boolean;
+  children: ReactNode;
+}
+
+/** 侧栏通用折叠区，折叠只隐藏内容，不改变任何游戏领域状态。 */
+export function CollapsibleSection({
+  title,
+  meta,
+  className = "",
+  defaultExpanded = true,
+  children,
+}: CollapsibleSectionProps) {
+  const [expanded, setExpanded] = useState(defaultExpanded);
+
+  return (
+    <section className={`panel-section collapsible-section ${className}`.trim()}>
+      <button
+        type="button"
+        className="collapsible-heading"
+        aria-expanded={expanded}
+        onClick={() => setExpanded((current) => !current)}
+      >
+        <span>{title}</span>
+        <span className="collapsible-meta">
+          {meta}
+          <i aria-hidden="true" className={expanded ? "expanded" : ""} />
+        </span>
+      </button>
+      <div className="collapsible-content" hidden={!expanded}>{children}</div>
+    </section>
+  );
+}
```

### `src/ui/ControlPanel.tsx`

```diff
+import { CollapsibleSection } from "./CollapsibleSection";

-      <section className="panel-section route-section">
-        <div className="section-heading">
-          <span>航点序列</span>
-          <span>{mission.route.waypoints.length - 1} NAV</span>
-        </div>
+      <CollapsibleSection
+        className="route-section"
+        title="航点序列"
+        meta={`${mission.route.waypoints.length - 1} NAV`}
+      >
         <div className="waypoint-list">
-      </section>
+      </CollapsibleSection>
```

### `src/ui/App.tsx`

```diff
+import { CollapsibleSection } from "./CollapsibleSection";

-          <section className="panel-section">
-            <div className="section-kicker">FLIGHT TELEMETRY</div>
+          <CollapsibleSection title="FLIGHT TELEMETRY">
             <dl className="telemetry-grid">
-          </section>
+          </CollapsibleSection>

-          {mission.adaptationNotes.length > 0 && <section className="panel-section">
-            <div className="section-heading"><span>COUNTER DEPLOYMENT</span><span>{mission.adaptationNotes.length}</span></div>
+          {mission.adaptationNotes.length > 0 && <CollapsibleSection title="COUNTER DEPLOYMENT" meta={mission.adaptationNotes.length}>
             <ol className="event-list">
-          </section>}
+          </CollapsibleSection>}

-          {mission.finalStrikeNotes.length > 0 && <section className="panel-section">
-            <div className="section-heading"><span>FINAL DEFENSE BRIEFING</span><span>{mission.radars.length}</span></div>
+          {mission.finalStrikeNotes.length > 0 && <CollapsibleSection title="FINAL DEFENSE BRIEFING" meta={mission.radars.length}>
             <ol className="event-list">
-          </section>}
+          </CollapsibleSection>}

-          <section className="panel-section event-section">
-            <div className="section-heading"><span>结构化事件</span><span>{mission.events.length}</span></div>
+          <CollapsibleSection className="event-section" title="结构化事件" meta={mission.events.length}>
             <ol className="event-list">
-          </section>
+          </CollapsibleSection>

-          {showBelief && <section className="panel-section commander-section">
-            <div className="section-heading"><span>AIR DEFENSE COMMANDER</span><span>ALERT {mission.awareness.value.toFixed(0)}%</span></div>
+          {showBelief && <CollapsibleSection className="commander-section" title="AIR DEFENSE COMMANDER" meta={`ALERT ${mission.awareness.value.toFixed(0)}%`}>
             <div className="commander-intent">{intentLabels[mission.commander.intent]}</div>
-          </section>}
+          </CollapsibleSection>}

-          {showBelief && <section className="panel-section operator-section">
-            <div className="section-heading"><span>RADAR OPERATOR AI</span><span>UTILITY</span></div>
+          {showBelief && <CollapsibleSection className="operator-section" title="RADAR OPERATOR AI" meta="UTILITY">
             {mission.radars.map((radar) => (
-          </section>}
+          </CollapsibleSection>}
```

### `src/ui/styles.css`

```diff
+ .control-panel, .telemetry-panel, .waypoint-list, .operator-section .collapsible-content, .campaign-screen {
+   scrollbar-width: thin;
+   scrollbar-color: #3f7565 #091612;
+ }
+ .control-panel::-webkit-scrollbar, .telemetry-panel::-webkit-scrollbar, .waypoint-list::-webkit-scrollbar, .operator-section .collapsible-content::-webkit-scrollbar, .campaign-screen::-webkit-scrollbar { width: 8px; height: 8px; }
+ .control-panel::-webkit-scrollbar-track, .telemetry-panel::-webkit-scrollbar-track, .waypoint-list::-webkit-scrollbar-track, .operator-section .collapsible-content::-webkit-scrollbar-track, .campaign-screen::-webkit-scrollbar-track { background: #091612; border-left: 1px solid #142b24; }
+ .control-panel::-webkit-scrollbar-thumb, .telemetry-panel::-webkit-scrollbar-thumb, .waypoint-list::-webkit-scrollbar-thumb, .operator-section .collapsible-content::-webkit-scrollbar-thumb, .campaign-screen::-webkit-scrollbar-thumb { border: 2px solid #091612; border-radius: 999px; background: linear-gradient(#467d6c, #294f43); }
+ .control-panel::-webkit-scrollbar-thumb:hover, .telemetry-panel::-webkit-scrollbar-thumb:hover, .waypoint-list::-webkit-scrollbar-thumb:hover, .operator-section .collapsible-content::-webkit-scrollbar-thumb:hover, .campaign-screen::-webkit-scrollbar-thumb:hover { background: linear-gradient(#63a38f, #376b5b); }

+ .collapsible-heading { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0; border: 0; color: #70998c; background: transparent; font-size: 11px; letter-spacing: 0.08em; text-align: left; }
+ .collapsible-heading:hover:not(:disabled) { border-color: transparent; color: #a5c8bd; background: transparent; }
+ .collapsible-meta { display: flex; align-items: center; gap: 8px; color: #587d72; white-space: nowrap; }
+ .collapsible-meta i { width: 7px; height: 7px; border-right: 1px solid currentColor; border-bottom: 1px solid currentColor; transform: rotate(45deg); transition: transform 140ms ease; }
+ .collapsible-meta i.expanded { transform: rotate(225deg); }
+ .collapsible-content { margin-top: 12px; }
+ .collapsible-content[hidden] { display: none; }

- .operator-section { max-height: 270px; overflow: auto; }
+ .operator-section .collapsible-content { max-height: 270px; overflow: auto; }
```

## 测试用例

### TC-001 侧栏折叠
- 操作：依次点击航点序列、FLIGHT TELEMETRY、结构化事件与 AI Debug 长列表标题。
- 预期：内容独立收起/展开，标题、数量和箭头始终可见，游戏状态不变。
- 是否通过：代码与类型验证通过；浏览器视觉验收待手动确认。

### TC-002 滚动条
- 操作：让左右侧栏及航点/Operator 内部列表产生溢出并滚动。
- 预期：显示绿色终端风格细滚动条，悬停时提亮，不出现全局页面滚动。
- 是否通过：样式规则验证通过；浏览器视觉验收待手动确认。

### TC-003 自动化回归
- 操作：运行类型检查、测试与生产构建。
- 预期：全部通过。
- 是否通过：通过。

## 当前进展
- 功能实现完成；本地浏览器连接不可用，未完成截图式视觉验收。
