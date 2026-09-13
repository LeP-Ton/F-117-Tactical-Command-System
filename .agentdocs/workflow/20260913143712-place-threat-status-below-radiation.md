# 将威胁状态移到辐射威胁下方

## 背景与目标
- 会话-22仅将 `NO ANOMALY DETECTED` 从标题右侧移到标题下方，虽然解决了挤压换行，但信息层级仍然错误。
- 当前威胁阶段应作为 `RADIATION THREAT` 的补充状态，放在辐射威胁数值下方，而不是紧跟 `THREAT WARNING` 标题。
- 状态文案必须使用更小、更弱的视觉样式，与模块标题明确区分。

## 实现结果
- 威胁模块顺序调整为：标题 → 进度条 → 辐射威胁/导弹倒计时 → 当前威胁阶段。
- 常规状态使用 `9px`、低亮绿色；标题仍为 `11px`。
- 导弹来袭时，状态使用较暗红色 `#c75f49`，不再与标题和倒计时共用相同亮红色。

## 代码变更

### `src/ui/workspaces/MissionWorkspace.tsx`
```diff
@@
         <div className="section-heading"><span>{copy.mission.threatWarning}</span></div>
-        <div className="threat-stage">{copy.enums.threatStage[mission.engagement.stage]}</div>
         <div className="threat-progress"><i style={{ width: `${mission.engagement.trackProgress}%` }} /></div>
@@
           ? <p className="threat-message">{copy.mission.impactCountdown} {mission.engagement.missileTimeRemainingSeconds?.toFixed(1)} {copy.common.secondsUnit} // {copy.mission.evade}</p>
           : <p className="threat-message">{copy.mission.radiationThreat} {mission.engagement.trackProgress.toFixed(0)}%</p>}
+        <div className="threat-stage">{copy.enums.threatStage[mission.engagement.stage]}</div>
```

### `src/ui/styles.css`
```diff
@@
 .threat-section { border-bottom-color: #173329; }
-.threat-section .section-heading { margin-bottom: 6px; }
-.threat-stage { display: block; width: 100%; margin: 0 0 10px; color: #70998c; font-size: 11px; line-height: 1.4; letter-spacing: 0.08em; white-space: nowrap; }
 .threat-progress { height: 7px; margin: 10px 0; overflow: hidden; background: #10211c; border: 1px solid #27483e; }
 .threat-progress i { display: block; height: 100%; background: linear-gradient(90deg, #5fae91, #e0b64d, #e2523b); }
 .threat-message { margin: 0; color: #b69072; font-size: 10px; line-height: 1.5; }
+.threat-stage { display: block; width: 100%; margin: 6px 0 0; color: #587d72; font-size: 9px; line-height: 1.4; letter-spacing: 0.06em; white-space: nowrap; }
 .threat-missile_inbound { border-bottom-color: #173329; box-shadow: inset 0 0 24px rgba(226, 82, 59, 0.1); }
-.threat-missile_inbound .section-heading, .threat-missile_inbound .threat-stage, .threat-missile_inbound .threat-message { color: #ef7258; }
+.threat-missile_inbound .section-heading, .threat-missile_inbound .threat-message { color: #ef7258; }
+.threat-missile_inbound .threat-stage { color: #c75f49; }
```

### `src/ui/SharedTacticalPanels.test.tsx`
```diff
@@
-  it("英文威胁状态独占标题下方一行", () => {
+  it("英文威胁状态位于辐射威胁下方且使用独立样式", () => {
@@
     const heading = screen.getByText("THREAT WARNING");
+    const radiationThreat = screen.getByText("RADIATION THREAT 0%");
     const stage = screen.getByText("NO ANOMALY DETECTED");
     expect(heading.parentElement).toHaveClass("section-heading");
     expect(stage).toHaveClass("threat-stage");
-    expect(stage.parentElement).not.toBe(heading.parentElement);
+    expect(radiationThreat.nextElementSibling).toBe(stage);
```

## 测试用例

### TC-001 英文威胁信息顺序
- 类型：组件测试。
- 优先级：高。
- 前置条件：界面语言为 English，威胁阶段为 `UNDETECTED`。
- 操作：渲染任务工作区并检查状态节点顺序。
- 预期：`NO ANOMALY DETECTED` 紧跟在 `RADIATION THREAT 0%` 后方，且使用独立 `.threat-stage` 样式。
- 是否通过：通过。

### TC-002 样式层级
- 类型：代码审查。
- 优先级：高。
- 预期：状态为 `9px` 低亮绿色，标题保持 `11px`；来袭状态使用暗红色，不与亮红标题相同。
- 是否通过：通过。

### TC-003 工程验证
- `npm run typecheck`：通过。
- `npm run test -- --run src/ui/SharedTacticalPanels.test.tsx`：7 项组件测试全部通过。
- `npm run test -- --run`：32 个测试文件、153 项测试全部通过。
- `npm run build`：通过，Vite 完成 81 个模块的生产构建。
