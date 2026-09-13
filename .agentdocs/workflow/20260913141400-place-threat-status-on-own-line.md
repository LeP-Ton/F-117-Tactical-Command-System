# 威胁状态独占一行显示

## 背景与目标
- 右侧任务态势面板复用了左右分布的 `.section-heading`，英文标题 `THREAT WARNING` 与状态 `NO ANOMALY DETECTED` 在同一行互相挤压，导致两段文字同时换行。
- 将威胁状态放到标题下方的独立行，保证英文状态获得完整侧栏宽度。
- 保持威胁进度条、辐射威胁数值及不同威胁阶段的颜色逻辑不变。

## 实现结果
- `.section-heading` 只保留威胁模块标题。
- 当前威胁状态改用独立块级元素 `.threat-stage`，占满一行并禁止内部换行。
- 导弹来袭阶段继续同步把标题、状态和告警信息切换为红色。

## 代码变更

### `src/ui/workspaces/MissionWorkspace.tsx`
```diff
@@
-        <div className="section-heading"><span>{copy.mission.threatWarning}</span><span>{copy.enums.threatStage[mission.engagement.stage]}</span></div>
+        <div className="section-heading"><span>{copy.mission.threatWarning}</span></div>
+        <div className="threat-stage">{copy.enums.threatStage[mission.engagement.stage]}</div>
```

### `src/ui/styles.css`
```diff
@@
 .threat-section { border-bottom-color: #173329; }
+.threat-section .section-heading { margin-bottom: 6px; }
+.threat-stage { display: block; width: 100%; margin: 0 0 10px; color: #70998c; font-size: 11px; line-height: 1.4; letter-spacing: 0.08em; white-space: nowrap; }
@@
-.threat-missile_inbound .section-heading, .threat-missile_inbound .threat-message { color: #ef7258; }
+.threat-missile_inbound .section-heading, .threat-missile_inbound .threat-stage, .threat-missile_inbound .threat-message { color: #ef7258; }
```

### `src/ui/SharedTacticalPanels.test.tsx`
```diff
@@
+import { MissionWorkspace } from "./workspaces/MissionWorkspace";
+import { I18nProvider } from "../i18n/I18n";
@@
+  it("英文威胁状态独占标题下方一行", () => {
+    const mission = createMission("THREAT-STATUS-LAYOUT");
+    render(<I18nProvider initialLanguage="en" persist={false}>
+      <MissionWorkspace
+        mission={mission}
+        selectedIndex={null}
+        onSelect={vi.fn()}
+        dispatch={vi.fn()}
+        showBelief={false}
+        canUseAiDebug={false}
+        onToggleBelief={vi.fn()}
+        mapSelection={null}
+        onMapSelectionChange={vi.fn()}
+        onOpenCampaign={vi.fn()}
+        onReturnCampaign={vi.fn()}
+      />
+    </I18nProvider>);
+
+    const heading = screen.getByText("THREAT WARNING");
+    const stage = screen.getByText("NO ANOMALY DETECTED");
+    expect(heading.parentElement).toHaveClass("section-heading");
+    expect(stage).toHaveClass("threat-stage");
+    expect(stage.parentElement).not.toBe(heading.parentElement);
+  });
```

## 测试用例

### TC-001 英文状态布局
- 类型：组件测试。
- 优先级：高。
- 前置条件：界面语言为 English，威胁阶段为 `UNDETECTED`。
- 操作：渲染任务工作区并检查标题与状态节点。
- 预期：`THREAT WARNING` 位于标题容器；`NO ANOMALY DETECTED` 位于独立的 `.threat-stage` 块级节点，二者不共享同一个父容器。
- 是否通过：通过。

### TC-002 工程验证
- `npm run typecheck`：通过。
- `npm run test -- --run src/ui/SharedTacticalPanels.test.tsx`：7 项组件测试全部通过。
- `npm run test -- --run`：32 个测试文件、153 项测试全部通过。
- `npm run build`：通过，Vite 完成 81 个模块的生产构建。
