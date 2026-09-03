# 增加情境式任务引导

## 背景与目标
- 游戏机制依赖任务网络、有限情报、天气、雷达、燃油和动态航线，仅靠 README、机制手册与静态“操作说明”不足以帮助首次玩家建立完整操作闭环。
- 在真实行动代码生成的任务中提供逐步引导，不另建规则简化、最终无法迁移经验的教程关卡。

## 约束与原则
- 引导只读取页面上下文与当前任务状态，不派发 reducer 动作、不替玩家操作、不暂停 Tick 或音频。
- 保持常驻任务面板的军事终端语境；教学内容放入独立、可退出的浮层。
- 引导完成与退出状态使用独立 `localStorage` 键，不进入 `RunState`、Mission、Seed 或复盘。
- 高亮层必须保持 `pointer-events: none`，不能阻挡节点、地图或按钮交互。
- 中英文界面使用完全一致的步骤和行为。

## 阶段与 TODO
- [x] 建立七步情境式任务引导状态机。
- [x] 高亮任务网络、任务评估、规划入口、战术地图、航线、确认按钮与执行态势。
- [x] 依据真实航点检查目标攻击圈与最终撤离航点。
- [x] 在 Campaign → Planning → Running 切换时自动衔接相应步骤。
- [x] 首次访问自动开启，并允许从“操作说明”重新启动。
- [x] 为只读情报与复盘上下文提供暂挂提示。
- [x] 补齐中英文文案、设计文档、机制手册与核心认知。
- [x] 增加组件测试并完成浏览器交互验证。

## 关键风险
- 引导高亮框若参与命中测试，会直接阻止 Canvas 添加航点；因此视觉层统一禁用指针事件。
- 仅按航点数量判断“完成航线”会放行无效路线；当前同时验证至少一个航点进入目标攻击圈、最后一个航点进入撤离区。
- 页面切换时原目标元素会卸载；引导根据页面上下文同步归一化步骤并重新测量目标边界。
- 在只读预览或复盘页无法完成规划动作；此时暂停步骤推进，提示返回任务网络。

## 当前进展
- 首次访问从任务网络第 `1 / 7` 步自动开始。
- 任务规划页会直接从战术地图步骤开始；正在执行的旧存档会直接进入执行态势步骤。
- 完成或退出后不再自动弹出；“操作说明”底部保留重新启动入口。
- 浏览器验证中，高亮地图仍可添加航点，两个路线条件会由 `◇` 变为 `◆`，点击确认航线后自动进入第 `7 / 7` 步。

## 代码变更

- `src/ui/MissionTutorial.tsx`：新增完整情境式引导组件。
```diff
+export type TutorialContext = "CAMPAIGN" | "PLANNING" | "RUNNING" | "RESULT" | "INTELLIGENCE" | "DEBRIEF";
+
+const tutorialSteps = [
+  { id: "network", context: "CAMPAIGN", target: "mission-network", advance: "NEXT" },
+  { id: "assessment", context: "CAMPAIGN", target: "mission-assessment", advance: "NEXT" },
+  { id: "planningEntry", context: "CAMPAIGN", target: "mission-entry", advance: "EXTERNAL" },
+  { id: "map", context: "PLANNING", target: "tactical-map", advance: "NEXT" },
+  { id: "route", context: "PLANNING", target: "tactical-map", advance: "ROUTE_READY" },
+  { id: "launch", context: "PLANNING", target: "confirm-route", advance: "EXTERNAL" },
+  { id: "execution", context: "RUNNING", target: "mission-telemetry", advance: "COMPLETE" },
+] as const;
+
+function getInitialStep(context: TutorialContext): number {
+  if (context === "PLANNING") return 3;
+  if (context === "RUNNING" || context === "RESULT") return 6;
+  return 0;
+}
+
+function normalizeStep(index: number, context: TutorialContext): number {
+  if (context === "CAMPAIGN" && index > 2) return 2;
+  if (context === "PLANNING" && (index < 3 || index > 5)) return 3;
+  if ((context === "RUNNING" || context === "RESULT") && index < 6) return 6;
+  return index;
+}
+
+export function MissionTutorial({ context, mission, onDismiss, onComplete }: MissionTutorialProps) {
+  const { copy } = useI18n();
+  const [stepIndex, setStepIndex] = useState(() => getInitialStep(context));
+  const [focusRect, setFocusRect] = useState<FocusRect | null>(null);
+  const resolvedStepIndex = normalizeStep(stepIndex, context);
+  const step = tutorialSteps[resolvedStepIndex];
+  const routeChecks = useMemo(() => {
+    const plannedWaypoints = mission.route.waypoints.slice(1);
+    const finalWaypoint = plannedWaypoints[plannedWaypoints.length - 1];
+    return {
+      target: plannedWaypoints.some((waypoint) => distanceBetween(waypoint.position, mission.target.position) <= mission.target.attackRadius),
+      extraction: finalWaypoint ? isInsideExtraction(finalWaypoint.position, mission.extractionArea) : false,
+    };
+  }, [mission.extractionArea, mission.route.waypoints, mission.target.attackRadius, mission.target.position]);
+  const routeReady = routeChecks.target && routeChecks.extraction;
+
+  useEffect(() => {
+    if (resolvedStepIndex !== stepIndex) setStepIndex(resolvedStepIndex);
+  }, [resolvedStepIndex, stepIndex]);
+
+  useEffect(() => {
+    if (context === "INTELLIGENCE" || context === "DEBRIEF") {
+      setFocusRect(null);
+      return;
+    }
+    const target = document.querySelector<HTMLElement>(`[data-tutorial="${step.target}"]`);
+    if (!target) {
+      setFocusRect(null);
+      return;
+    }
+    const updateRect = () => {
+      const rect = target.getBoundingClientRect();
+      if (rect.width <= 0 || rect.height <= 0) {
+        setFocusRect(null);
+        return;
+      }
+      const inset = 6;
+      setFocusRect({
+        top: Math.max(8, rect.top - inset),
+        left: Math.max(8, rect.left - inset),
+        width: Math.min(window.innerWidth - Math.max(8, rect.left - inset) - 8, rect.width + inset * 2),
+        height: Math.min(window.innerHeight - Math.max(8, rect.top - inset) - 8, rect.height + inset * 2),
+      });
+    };
+    updateRect();
+    window.addEventListener("resize", updateRect);
+    window.addEventListener("scroll", updateRect, true);
+    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(updateRect);
+    resizeObserver?.observe(target);
+    return () => {
+      window.removeEventListener("resize", updateRect);
+      window.removeEventListener("scroll", updateRect, true);
+      resizeObserver?.disconnect();
+    };
+  }, [context, step.target]);
+
+  useEffect(() => {
+    const handleKeyDown = (event: KeyboardEvent) => {
+      if (event.key !== "Escape") return;
+      event.preventDefault();
+      onDismiss();
+    };
+    window.addEventListener("keydown", handleKeyDown);
+    return () => window.removeEventListener("keydown", handleKeyDown);
+  }, [onDismiss]);
+
+  return <>
+    {focusStyle && <div className="tutorial-focus-frame" style={focusStyle} aria-hidden="true" />}
+    <aside className={`mission-tutorial tutorial-card-${cardHorizontal} tutorial-card-${cardVertical}`} role="complementary" aria-label={copy.tutorial.label} aria-live="polite">
+      <header className="tutorial-header">
+        <div><span>{copy.tutorial.kicker}</span><strong>{isSuspended ? copy.tutorial.suspendedTitle : stepCopy.title}</strong></div>
+        <button type="button" className="tutorial-close" onClick={onDismiss} aria-label={copy.tutorial.exit}><i aria-hidden="true" /></button>
+      </header>
+      <div className="tutorial-progress" aria-label={copy.tutorial.progressLabel}>
+        <i style={{ width: `${((resolvedStepIndex + 1) / tutorialSteps.length) * 100}%` }} />
+        <span>{resolvedStepIndex + 1} / {tutorialSteps.length}</span>
+      </div>
+      <div className="tutorial-body">
+        <p>{isSuspended ? copy.tutorial.suspendedBody : stepCopy.body}</p>
+        {!isSuspended && step.id === "route" && <ul className="tutorial-route-checks">
+          <li className={routeChecks.target ? "complete" : ""}>{routeChecks.target ? "◆" : "◇"} {copy.tutorial.routeTarget}</li>
+          <li className={routeChecks.extraction ? "complete" : ""}>{routeChecks.extraction ? "◆" : "◇"} {copy.tutorial.routeExtraction}</li>
+        </ul>}
+      </div>
+      <footer className="tutorial-actions">
+        {canGoBack && !isSuspended ? <button type="button" onClick={() => setStepIndex(resolvedStepIndex - 1)}>{copy.tutorial.back}</button> : <span />}
+        {isSuspended
+          ? <span className="tutorial-await">{copy.tutorial.suspendedAction}</span>
+          : step.advance === "EXTERNAL"
+            ? <span className="tutorial-await">{copy.tutorial.awaitAction}</span>
+            : step.advance === "COMPLETE"
+              ? <button type="button" className="tutorial-primary" onClick={onComplete}>{copy.tutorial.complete}</button>
+              : <button type="button" className="tutorial-primary" disabled={step.advance === "ROUTE_READY" && !routeReady} onClick={() => setStepIndex(resolvedStepIndex + 1)}>{copy.tutorial.next}</button>}
+      </footer>
+    </aside>
+  </>;
+}
```

- `src/ui/App.tsx`：增加首次启动、独立偏好和页面上下文编排。
```diff
+import { MissionTutorial, type TutorialContext } from "./MissionTutorial";
+const tutorialStorageKey = "f117-tactical-command-system:mission-tutorial:v1";
+
+function shouldStartTutorial(): boolean {
+  try { return localStorage.getItem(tutorialStorageKey) === null; }
+  catch { return true; }
+}
+function saveTutorialStatus(status: "COMPLETED" | "DISMISSED"): void {
+  try { localStorage.setItem(tutorialStorageKey, status); }
+  catch { /* 引导偏好保存失败不影响任务。 */ }
+}
@@
+  const [tutorialActive, setTutorialActive] = useState(shouldStartTutorial);
+  const stopTutorial = useCallback((status: "COMPLETED" | "DISMISSED") => {
+    saveTutorialStatus(status);
+    setTutorialActive(false);
+  }, []);
@@
+  const tutorialContext: TutorialContext = activeDebrief
+    ? "DEBRIEF"
+    : intelligencePreview
+      ? "INTELLIGENCE"
+      : campaignView
+        ? "CAMPAIGN"
+        : mission.status === "PLANNING" || mission.status === "RUNNING"
+          ? mission.status
+          : "RESULT";
@@
-    <GameplayGuide open={guideOpen} onClose={closeGuide} triggerRef={guideTriggerRef} missionRunning={mission.status === "RUNNING"} />
+    <GameplayGuide open={guideOpen} onClose={closeGuide} onStartTutorial={() => { closeGuide(); setTutorialActive(true); }} triggerRef={guideTriggerRef} missionRunning={mission.status === "RUNNING"} />
+    {tutorialActive && <MissionTutorial context={tutorialContext} mission={mission} onDismiss={() => stopTutorial("DISMISSED")} onComplete={() => stopTutorial("COMPLETED")} />}
```

- `src/ui/GameplayGuide.tsx` 与测试：增加重新启动入口。
```diff
 interface GameplayGuideProps {
   open: boolean;
   onClose: () => void;
+  onStartTutorial: () => void;
@@
-export function GameplayGuide({ open, onClose, triggerRef, missionRunning }: GameplayGuideProps) {
+export function GameplayGuide({ open, onClose, onStartTutorial, triggerRef, missionRunning }: GameplayGuideProps) {
@@
+      <footer className="gameplay-guide-footer">
+        <button type="button" className="primary-button" onClick={onStartTutorial}>{copy.guide.startTutorial}</button>
+      </footer>
@@
+  it("可从操作说明启动情境式任务引导", () => {
+    const { onStartTutorial } = renderGuide();
+    fireEvent.click(screen.getByRole("button", { name: "开始任务引导" }));
+    expect(onStartTutorial).toHaveBeenCalledTimes(1);
+  });
```

- 为七个高亮目标增加稳定标记。
```diff
-        <div className="campaign-graph">
+        <div className="campaign-graph" data-tutorial="mission-network">
-        <aside className="campaign-preview">
+        <aside className="campaign-preview" data-tutorial="mission-assessment">
             <button
               className="primary-button"
+              data-tutorial="mission-entry"
@@
               className="primary-button"
+              data-tutorial="confirm-route"
@@
-  return <section className="map-stage">
+  return <section className="map-stage" data-tutorial="tactical-map">
@@
-    rightPanel={<aside className="telemetry-panel">
+    rightPanel={<aside className="telemetry-panel" data-tutorial="mission-telemetry">
```

- `src/i18n/I18n.tsx`：中英文分别增加相同结构的引导入口、控制文案、七步标题与说明。
```diff
     guide: {
+      startTutorial: "开始任务引导",
     },
+    tutorial: {
+      label: "任务引导",
+      kicker: "训练链路",
+      progressLabel: "任务引导进度",
+      exit: "退出任务引导",
+      back: "上一步",
+      next: "下一步",
+      complete: "结束引导",
+      awaitAction: "在高亮区域完成操作后自动继续",
+      routeTarget: "至少一个航点位于目标攻击圈",
+      routeExtraction: "最终航点位于撤离区",
+      suspendedTitle: "引导暂挂",
+      suspendedBody: "当前为只读情报或复盘视图。返回任务网络后，引导将从任务选择继续。",
+      suspendedAction: "返回任务网络以继续",
+      steps: {
+        network: { title: "读取任务网络", body: "每层只能完成一个节点。前置任务分别改变情报权限、雷达扫描、覆盖范围或指挥协同；你的选择会重塑最终打击的战场条件。" },
+        assessment: { title: "评估任务收益", body: "选择节点后，先核对任务代号、预估雷达、天气和长期收益。锁定节点只能预览情报；可用或失败节点才能进入规划。" },
+        planningEntry: { title: "选择首项任务", body: "选中一个标记为“可用”的节点，再使用高亮按钮进入任务规划。另一条同层路线会在任务成功后失效。" },
+        map: { title: "识别战术地图", body: "先定位起始点、打击目标与东北撤离区，再读取雷达估计圈、地形和动态天气。雷达情报可能遗漏目标或存在位置与范围误差。" },
+        route: { title: "构建完整航线", body: "点击地图添加航点并拖动调整。至少让航线进入目标攻击圈，并把最后一个航点放入撤离区；同时用左侧规划距离检查燃油余量。" },
+        launch: { title: "确认出动条件", body: "确认目标、撤离航段、天气窗口和燃油后执行高亮指令。出动后任务不会暂停，也不能重置或返回任务网络。" },
+        execution: { title: "执行与动态修正", body: "持续观察威胁告警与燃油航程。遭遇持续照射时利用转向、距离、地形或天气切断接触；飞行中仍可修改当前目标之后的未来航点。摧毁目标并进入撤离区才算成功。" },
+      },
+    },
@@
     guide: {
+      startTutorial: "START MISSION GUIDANCE",
     },
+    tutorial: {
+      label: "MISSION GUIDANCE",
+      kicker: "TRAINING LINK",
+      progressLabel: "Mission guidance progress",
+      exit: "Exit mission guidance",
+      back: "BACK",
+      next: "NEXT",
+      complete: "END GUIDANCE",
+      awaitAction: "COMPLETE THE ACTION IN THE HIGHLIGHTED AREA",
+      routeTarget: "At least one waypoint is inside the target attack radius",
+      routeExtraction: "Final waypoint is inside extraction",
+      suspendedTitle: "GUIDANCE ON HOLD",
+      suspendedBody: "This is a read-only intelligence or debrief view. Return to the mission network to continue guidance from mission selection.",
+      suspendedAction: "RETURN TO MISSION NETWORK",
+      steps: {
+        network: { title: "READ THE MISSION NETWORK", body: "Only one node may be completed per layer. Precursor missions change intelligence access, radar scanning, coverage, or command coordination; your choices reshape the Final Strike battlefield." },
+        assessment: { title: "ASSESS MISSION EFFECTS", body: "After selecting a node, review its code, estimated radars, weather, and persistent effect. Locked nodes allow intelligence preview only; available or failed nodes may enter planning." },
+        planningEntry: { title: "SELECT THE FIRST MISSION", body: "Select a node marked AVAILABLE, then use the highlighted control to enter mission planning. The alternative at that layer expires after a successful mission." },
+        map: { title: "READ THE TACTICAL MAP", body: "Locate insertion, the strike target, and the northeast extraction zone. Then inspect estimated radar circles, terrain, and dynamic weather. Radar reports may contain omissions and position or range error." },
+        route: { title: "BUILD A COMPLETE ROUTE", body: "Click the map to add waypoints and drag to reposition them. Route through the target attack radius and place the final waypoint inside extraction, while checking planned distance against fuel." },
+        launch: { title: "CONFIRM LAUNCH CONDITIONS", body: "Verify the target leg, extraction leg, weather window, and fuel before using the highlighted command. After launch, the mission cannot pause, reset, or return to the mission network." },
+        execution: { title: "EXECUTE AND REVISE", body: "Monitor THREAT WARNING and FUEL RANGE. Break sustained illumination with turns, distance, terrain, or weather. Future waypoints beyond the current target remain editable. Success requires both target destruction and extraction." },
+      },
+    },
```

- `src/ui/styles.css`：增加操作说明入口、非阻塞高亮框、引导卡片、进度、路线检查和减少动态效果样式。
```diff
+.gameplay-guide-footer { flex: 0 0 auto; padding: 0 20px 20px; }
+.gameplay-guide-footer .primary-button { width: 100%; min-height: 38px; }
+.tutorial-focus-frame {
+  position: fixed;
+  z-index: 11;
+  border: 1px solid rgba(232, 181, 74, 0.9);
+  box-shadow: 0 0 0 9999px rgba(2, 7, 6, 0.34), 0 0 18px rgba(224, 167, 57, 0.34), inset 0 0 18px rgba(224, 167, 57, 0.1);
+  pointer-events: none;
+  animation: tutorial-focus-pulse 1.6s ease-in-out infinite;
+}
+.mission-tutorial { position: fixed; z-index: 12; width: min(380px, calc(100vw - 48px)); border: 1px solid #8e6a2e; background: rgba(5, 15, 12, 0.97); box-shadow: 0 14px 40px rgba(0, 0, 0, 0.66), inset 0 0 30px rgba(39, 79, 64, 0.1); }
+.tutorial-card-left { left: 24px; }
+.tutorial-card-right { right: 24px; }
+.tutorial-card-top { top: 96px; }
+.tutorial-card-bottom { bottom: 24px; }
+.tutorial-header { min-height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 13px 15px; border-bottom: 1px solid #27463c; }
+.tutorial-header span { color: #5c8478; font-size: 8px; letter-spacing: 0.14em; }
+.tutorial-header strong { margin-top: 5px; color: #e9bd5e; font-size: 13px; font-weight: 500; letter-spacing: 0.04em; }
+.tutorial-close { position: relative; width: 28px; height: 28px; flex: 0 0 28px; padding: 0; color: #b58a3c; border-color: #5f4c28; background: transparent; }
+.tutorial-progress { position: relative; height: 18px; border-bottom: 1px solid #19352d; background: #07110e; overflow: hidden; }
+.tutorial-progress i { display: block; height: 100%; background: rgba(185, 137, 49, 0.2); transition: width 180ms ease; }
+.tutorial-body { padding: 15px; }
+.tutorial-body p { margin: 0; color: #91aea5; font-size: 10px; line-height: 1.75; }
+.tutorial-route-checks { display: grid; gap: 7px; margin: 13px 0 0; padding: 11px; list-style: none; border: 1px solid #1e3d34; background: rgba(21, 53, 43, 0.18); }
+.tutorial-route-checks li { color: #65877d; font-size: 9px; }
+.tutorial-route-checks li.complete { color: #70c4a8; }
+.tutorial-actions { min-height: 50px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 15px; border-top: 1px solid #1c3b32; }
+.tutorial-actions .tutorial-primary { color: #efc363; border-color: #96702e; background: rgba(114, 79, 20, 0.24); }
+.tutorial-await { margin-left: auto; color: #8c7440; font-size: 8px; letter-spacing: 0.06em; text-align: right; }
+@keyframes tutorial-focus-pulse {
+  0%, 100% { border-color: rgba(232, 181, 74, 0.58); }
+  50% { border-color: rgba(247, 202, 105, 1); }
+}
+@media (prefers-reduced-motion: reduce) {
+  .tutorial-focus-frame { animation: none; }
+  .tutorial-progress i { transition: none; }
+}
```

- `src/ui/MissionTutorial.test.tsx`：新增五个渲染与状态衔接测试。
```diff
+describe("MissionTutorial", () => {
+  it("在任务网络中逐步解释网络、收益与规划入口", () => { /* 校验 1–3 步 */ });
+  it("进入规划页后跳转到地图与完整航线引导", () => { /* 校验上下文归一化与未满足路线时禁用 */ });
+  it("目标航点与最终撤离航点齐备后允许进入确认步骤", () => { /* 校验真实几何条件 */ });
+  it("在执行阶段完成或退出引导均不派发游戏动作", () => { /* 校验回调边界 */ });
+  it("只读情报与复盘页暂挂引导", () => { /* 校验只读上下文 */ });
+});
```

- `README.md`、`README.en.md`、机制手册与 `AGENTS.md`：记录真实任务上的情境式引导、七步范围、独立存储和非侵入边界。
```diff
-顶部“操作说明”提供玩家完成决策所需的简明提示；精确规则集中在机制手册；本 README 则记录设计意图、系统关系和开发边界。
+顶部“操作说明”提供玩家完成决策所需的简明提示；精确规则集中在机制手册；本 README 则记录设计意图、系统关系和开发边界。
+首次进入还会启动情境式“任务引导”。它直接运行在当前行动代码生成的真实任务上，只观察页面与任务状态，不暂停模拟、不代替玩家操作，也不派发 reducer 动作。
@@
-没有正式难度档位、教程关卡或严格的程序生成可通关证明。
+没有正式难度档位、规则简化的教程关卡或严格的程序生成可通关证明；当前任务引导直接运行在真实生成任务上。
@@
+首次访问自动开启七步情境式“任务引导”，依次覆盖任务网络、收益研判、规划入口、战术地图、完整航线、出动确认和执行态势。
@@
-玩家界面应模拟作战指挥终端，只呈现态势、情报、告警和指令，游戏机制说明、操作教程及程序生成元信息统一放入说明文档，不在任务界面中直接解释。
+玩家常驻任务面板应模拟作战指挥终端，只呈现态势、情报、告警和指令；完整机制统一放入说明文档，首次操作路径可由独立、可退出的情境式引导覆盖。
+首次访问提供运行在真实生成任务上的七步情境式任务引导；引导只观察界面与任务状态，不暂停模拟、不代替玩家操作，也不进入 Run、Seed 或复盘数据。
```

## 新增文件完整留痕

以下保留两个新增文件的完整逐行差异，作为上方设计摘要的精确补充。

```diff
diff --git a/src/ui/MissionTutorial.tsx b/src/ui/MissionTutorial.tsx
new file mode 100644
index 0000000..6c4a2fb
--- /dev/null
+++ b/src/ui/MissionTutorial.tsx
@@ -0,0 +1,176 @@
+import { useEffect, useMemo, useState, type CSSProperties } from "react";
+import { distanceBetween, isInsideExtraction } from "../domain/missionRules";
+import type { MissionSession } from "../domain/types";
+import { useI18n } from "../i18n/I18n";
+
+export type TutorialContext = "CAMPAIGN" | "PLANNING" | "RUNNING" | "RESULT" | "INTELLIGENCE" | "DEBRIEF";
+
+interface MissionTutorialProps {
+  context: TutorialContext;
+  mission: MissionSession;
+  onDismiss: () => void;
+  onComplete: () => void;
+}
+
+interface FocusRect {
+  top: number;
+  left: number;
+  width: number;
+  height: number;
+}
+
+const tutorialSteps = [
+  { id: "network", context: "CAMPAIGN", target: "mission-network", advance: "NEXT" },
+  { id: "assessment", context: "CAMPAIGN", target: "mission-assessment", advance: "NEXT" },
+  { id: "planningEntry", context: "CAMPAIGN", target: "mission-entry", advance: "EXTERNAL" },
+  { id: "map", context: "PLANNING", target: "tactical-map", advance: "NEXT" },
+  { id: "route", context: "PLANNING", target: "tactical-map", advance: "ROUTE_READY" },
+  { id: "launch", context: "PLANNING", target: "confirm-route", advance: "EXTERNAL" },
+  { id: "execution", context: "RUNNING", target: "mission-telemetry", advance: "COMPLETE" },
+] as const;
+
+type TutorialStepId = (typeof tutorialSteps)[number]["id"];
+
+function getInitialStep(context: TutorialContext): number {
+  if (context === "PLANNING") return 3;
+  if (context === "RUNNING" || context === "RESULT") return 6;
+  return 0;
+}
+
+function normalizeStep(index: number, context: TutorialContext): number {
+  if (context === "CAMPAIGN" && index > 2) return 2;
+  if (context === "PLANNING" && (index < 3 || index > 5)) return 3;
+  if ((context === "RUNNING" || context === "RESULT") && index < 6) return 6;
+  return index;
+}
+
+/**
+ * 在真实任务界面上运行的情境式引导。组件只观察页面与任务状态，不派发任何游戏动作，
+ * 高亮区域仍保持可点击，因此玩家始终是在正式任务规则下完成教学步骤。
+ */
+export function MissionTutorial({ context, mission, onDismiss, onComplete }: MissionTutorialProps) {
+  const { copy } = useI18n();
+  const [stepIndex, setStepIndex] = useState(() => getInitialStep(context));
+  const [focusRect, setFocusRect] = useState<FocusRect | null>(null);
+  const resolvedStepIndex = normalizeStep(stepIndex, context);
+  const step = tutorialSteps[resolvedStepIndex];
+  const routeChecks = useMemo(() => {
+    const plannedWaypoints = mission.route.waypoints.slice(1);
+    const finalWaypoint = plannedWaypoints[plannedWaypoints.length - 1];
+    return {
+      target: plannedWaypoints.some((waypoint) => distanceBetween(waypoint.position, mission.target.position) <= mission.target.attackRadius),
+      extraction: finalWaypoint ? isInsideExtraction(finalWaypoint.position, mission.extractionArea) : false,
+    };
+  }, [mission.extractionArea, mission.route.waypoints, mission.target.attackRadius, mission.target.position]);
+  const routeReady = routeChecks.target && routeChecks.extraction;
+
+  useEffect(() => {
+    if (resolvedStepIndex !== stepIndex) setStepIndex(resolvedStepIndex);
+  }, [resolvedStepIndex, stepIndex]);
+
+  useEffect(() => {
+    if (context === "INTELLIGENCE" || context === "DEBRIEF") {
+      setFocusRect(null);
+      return;
+    }
+    const target = document.querySelector<HTMLElement>(`[data-tutorial="${step.target}"]`);
+    if (!target) {
+      setFocusRect(null);
+      return;
+    }
+
+    const updateRect = () => {
+      const rect = target.getBoundingClientRect();
+      if (rect.width <= 0 || rect.height <= 0) {
+        setFocusRect(null);
+        return;
+      }
+      const inset = 6;
+      setFocusRect({
+        top: Math.max(8, rect.top - inset),
+        left: Math.max(8, rect.left - inset),
+        width: Math.min(window.innerWidth - Math.max(8, rect.left - inset) - 8, rect.width + inset * 2),
+        height: Math.min(window.innerHeight - Math.max(8, rect.top - inset) - 8, rect.height + inset * 2),
+      });
+    };
+
+    updateRect();
+    window.addEventListener("resize", updateRect);
+    window.addEventListener("scroll", updateRect, true);
+    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(updateRect);
+    resizeObserver?.observe(target);
+    return () => {
+      window.removeEventListener("resize", updateRect);
+      window.removeEventListener("scroll", updateRect, true);
+      resizeObserver?.disconnect();
+    };
+  }, [context, step.target]);
+
+  useEffect(() => {
+    const handleKeyDown = (event: KeyboardEvent) => {
+      if (event.key !== "Escape") return;
+      event.preventDefault();
+      onDismiss();
+    };
+    window.addEventListener("keydown", handleKeyDown);
+    return () => window.removeEventListener("keydown", handleKeyDown);
+  }, [onDismiss]);
+
+  const isSuspended = context === "INTELLIGENCE" || context === "DEBRIEF";
+  const stepCopy = copy.tutorial.steps[step.id as TutorialStepId];
+  const canGoBack = resolvedStepIndex > 0 && tutorialSteps[resolvedStepIndex - 1]?.context === step.context;
+  const cardHorizontal = focusRect && focusRect.left + focusRect.width / 2 > window.innerWidth / 2 ? "left" : "right";
+  const cardVertical = focusRect && focusRect.top + focusRect.height / 2 > window.innerHeight / 2 ? "top" : "bottom";
+  const focusStyle = focusRect ? {
+    top: focusRect.top,
+    left: focusRect.left,
+    width: focusRect.width,
+    height: focusRect.height,
+  } as CSSProperties : undefined;
+
+  return <>
+    {focusStyle && <div className="tutorial-focus-frame" style={focusStyle} aria-hidden="true" />}
+    <aside
+      className={`mission-tutorial tutorial-card-${cardHorizontal} tutorial-card-${cardVertical}`}
+      role="complementary"
+      aria-label={copy.tutorial.label}
+      aria-live="polite"
+    >
+      <header className="tutorial-header">
+        <div>
+          <span>{copy.tutorial.kicker}</span>
+          <strong>{isSuspended ? copy.tutorial.suspendedTitle : stepCopy.title}</strong>
+        </div>
+        <button type="button" className="tutorial-close" onClick={onDismiss} aria-label={copy.tutorial.exit}><i aria-hidden="true" /></button>
+      </header>
+      <div className="tutorial-progress" aria-label={copy.tutorial.progressLabel}>
+        <i style={{ width: `${((resolvedStepIndex + 1) / tutorialSteps.length) * 100}%` }} />
+        <span>{resolvedStepIndex + 1} / {tutorialSteps.length}</span>
+      </div>
+      <div className="tutorial-body">
+        <p>{isSuspended ? copy.tutorial.suspendedBody : stepCopy.body}</p>
+        {!isSuspended && step.id === "route" && <ul className="tutorial-route-checks">
+          <li className={routeChecks.target ? "complete" : ""}>{routeChecks.target ? "◆" : "◇"} {copy.tutorial.routeTarget}</li>
+          <li className={routeChecks.extraction ? "complete" : ""}>{routeChecks.extraction ? "◆" : "◇"} {copy.tutorial.routeExtraction}</li>
+        </ul>}
+      </div>
+      <footer className="tutorial-actions">
+        {canGoBack && !isSuspended
+          ? <button type="button" onClick={() => setStepIndex(resolvedStepIndex - 1)}>{copy.tutorial.back}</button>
+          : <span />}
+        {isSuspended
+          ? <span className="tutorial-await">{copy.tutorial.suspendedAction}</span>
+          : step.advance === "EXTERNAL"
+            ? <span className="tutorial-await">{copy.tutorial.awaitAction}</span>
+            : step.advance === "COMPLETE"
+              ? <button type="button" className="tutorial-primary" onClick={onComplete}>{copy.tutorial.complete}</button>
+              : <button
+                type="button"
+                className="tutorial-primary"
+                disabled={step.advance === "ROUTE_READY" && !routeReady}
+                onClick={() => setStepIndex(resolvedStepIndex + 1)}
+              >{copy.tutorial.next}</button>}
+      </footer>
+    </aside>
+  </>;
+}
diff --git a/src/ui/MissionTutorial.test.tsx b/src/ui/MissionTutorial.test.tsx
new file mode 100644
index 0000000..d18dda5
--- /dev/null
+++ b/src/ui/MissionTutorial.test.tsx
@@ -0,0 +1,96 @@
+import { cleanup, fireEvent, render, screen } from "@testing-library/react";
+import { afterEach, describe, expect, it, vi } from "vitest";
+import { createMission } from "../domain/factories";
+import { I18nProvider } from "../i18n/I18n";
+import { MissionTutorial, type TutorialContext } from "./MissionTutorial";
+
+afterEach(cleanup);
+
+function renderTutorial(context: TutorialContext = "CAMPAIGN", mission = createMission("MISSION-TUTORIAL")) {
+  const onDismiss = vi.fn();
+  const onComplete = vi.fn();
+  const result = render(<I18nProvider initialLanguage="zh" persist={false}>
+    <div data-tutorial="mission-network" />
+    <div data-tutorial="mission-assessment" />
+    <button data-tutorial="mission-entry">规划任务</button>
+    <div data-tutorial="tactical-map" />
+    <button data-tutorial="confirm-route">确认航线</button>
+    <aside data-tutorial="mission-telemetry" />
+    <MissionTutorial context={context} mission={mission} onDismiss={onDismiss} onComplete={onComplete} />
+  </I18nProvider>);
+  return { ...result, mission, onDismiss, onComplete };
+}
+
+describe("MissionTutorial", () => {
+  it("在任务网络中逐步解释网络、收益与规划入口", () => {
+    renderTutorial();
+    expect(screen.getByRole("complementary", { name: "任务引导" })).toBeInTheDocument();
+    expect(screen.getByText("读取任务网络")).toBeInTheDocument();
+
+    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
+    expect(screen.getByText("评估任务收益")).toBeInTheDocument();
+    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
+    expect(screen.getByText("选择首项任务")).toBeInTheDocument();
+    expect(screen.getByText("在高亮区域完成操作后自动继续")).toBeInTheDocument();
+  });
+
+  it("进入规划页后跳转到地图与完整航线引导", () => {
+    const { rerender, mission, onDismiss, onComplete } = renderTutorial();
+    rerender(<I18nProvider initialLanguage="zh" persist={false}>
+      <div data-tutorial="tactical-map" />
+      <button data-tutorial="confirm-route">确认航线</button>
+      <MissionTutorial context="PLANNING" mission={mission} onDismiss={onDismiss} onComplete={onComplete} />
+    </I18nProvider>);
+
+    expect(screen.getByText("识别战术地图")).toBeInTheDocument();
+    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
+    expect(screen.getByText("构建完整航线")).toBeInTheDocument();
+    expect(screen.getByRole("button", { name: "下一步" })).toBeDisabled();
+    expect(screen.getByText(/至少一个航点位于目标攻击圈/)).toBeInTheDocument();
+    expect(screen.getByText(/最终航点位于撤离区/)).toBeInTheDocument();
+  });
+
+  it("目标航点与最终撤离航点齐备后允许进入确认步骤", () => {
+    const mission = createMission("MISSION-TUTORIAL-ROUTE");
+    mission.route.waypoints.push({
+      id: "tutorial-target",
+      kind: "NAVIGATION",
+      position: { ...mission.target.position },
+      status: "PENDING",
+    });
+    mission.route.waypoints.push({
+      id: "tutorial-extraction",
+      kind: "NAVIGATION",
+      position: {
+        x: mission.extractionArea.x + mission.extractionArea.width / 2,
+        y: mission.extractionArea.y + mission.extractionArea.height / 2,
+      },
+      status: "PENDING",
+    });
+    renderTutorial("PLANNING", mission);
+
+    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
+    expect(screen.getByText("构建完整航线")).toBeInTheDocument();
+    expect(screen.getByRole("button", { name: "下一步" })).toBeEnabled();
+    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
+    expect(screen.getByText("确认出动条件")).toBeInTheDocument();
+  });
+
+  it("在执行阶段完成或退出引导均不派发游戏动作", () => {
+    const first = renderTutorial("RUNNING");
+    expect(screen.getByText("执行与动态修正")).toBeInTheDocument();
+    fireEvent.click(screen.getByRole("button", { name: "结束引导" }));
+    expect(first.onComplete).toHaveBeenCalledTimes(1);
+    cleanup();
+
+    const second = renderTutorial();
+    fireEvent.click(screen.getByRole("button", { name: "退出任务引导" }));
+    expect(second.onDismiss).toHaveBeenCalledTimes(1);
+  });
+
+  it("只读情报与复盘页暂挂引导", () => {
+    renderTutorial("INTELLIGENCE");
+    expect(screen.getByText("引导暂挂")).toBeInTheDocument();
+    expect(screen.getByText("返回任务网络以继续")).toBeInTheDocument();
+  });
+});
```

## 测试用例

### TC-001 首次任务网络引导
- 类型：浏览器交互测试
- 优先级：高
- 前置条件：当前来源没有引导完成/退出偏好。
- 操作步骤：打开游戏。
- 预期结果：显示第 `1 / 7` 步并高亮任务网络；节点保持可点击。
- 是否通过：通过。

### TC-002 路线有效性检查
- 类型：组件与浏览器交互测试
- 优先级：高
- 操作步骤：进入规划页并到达“构建完整航线”步骤，依次在目标圈和撤离区添加航点。
- 预期结果：条件不足时“下一步”禁用；目标与撤离条件满足后两个标记变为 `◆` 并解锁按钮。
- 是否通过：通过。

### TC-003 页面状态自动衔接
- 类型：组件与浏览器交互测试
- 优先级：高
- 操作步骤：从任务网络进入规划，再确认航线。
- 预期结果：引导自动切换到规划步骤，再自动切换到第 `7 / 7` 执行步骤。
- 是否通过：通过。

### TC-004 非侵入交互
- 类型：浏览器交互测试
- 优先级：高
- 操作步骤：在地图高亮期间添加航点并执行任务。
- 预期结果：高亮框不拦截鼠标；引导不暂停任务，不生成游戏事件。
- 是否通过：通过。

### TC-005 引导重启与双语
- 类型：组件与浏览器交互测试
- 优先级：中
- 操作步骤：完成引导，打开“操作说明”，重新启动任务引导并切换语言。
- 预期结果：完成后浮层消失；入口可重新启动；步骤文案随语言即时切换。
- 是否通过：通过。

### TC-006 工程验证
- 类型：自动化测试
- 优先级：高
- 操作步骤：运行类型检查、完整测试与生产构建。
- 预期结果：全部通过。
- 是否通过：通过，`npm run typecheck`、`npm run test`（32 个测试文件、153 个用例）与 `npm run build` 均成功。
