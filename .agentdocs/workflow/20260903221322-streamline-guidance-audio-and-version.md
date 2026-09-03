# 精简顶部引导、声音控制并更新 UI 版本

## 背景与目标
- 将顶部“操作说明”入口改为“任务引导”，点击后直接开始七步情境式任务引导。
- 移除独立声音开关，保留总音量滑杆，并允许玩家将音量调至 `0` 完全关闭声音。
- 根据本轮累计的全屏、自适应布局和顶部交互变更，将游戏 UI 顶部版本号由 `1.0` 更新为 `1.1`。

## 约束与原则
- 保留首次访问自动启动任务引导的既有行为。
- 玩家重复点击“任务引导”时，必须重新挂载引导并从当前页面对应步骤重新开始。
- 删除已无入口的操作说明组件、文案、样式与测试，避免保留失效代码。
- 音量仍使用 `0–1` 主增益范围，不改变现有音效事件映射与循环警报清理行为。
- 中英文顶部栏语义、版本号和测试保持一致。

## 阶段与 TODO
- [x] 将“操作说明”入口改为直接启动“任务引导”。
- [x] 删除独立操作说明弹窗及其文案、样式和测试。
- [x] 删除声音开关状态、按钮和音频引擎静音分支。
- [x] 明确音量 `0` 为完全关闭声音并增加边界测试。
- [x] 将中英文 UI 版本号更新为 `1.1`。
- [x] 更新项目核心认知与变更索引。
- [x] 完成自动化测试、生产构建和真实页面交互验证。

## 关键风险
- 仅把按钮文案改为“任务引导”但继续打开旧弹窗，会让入口语义与实际行为不一致。
- 已完成或正在进行的引导若不重新挂载，重复点击入口可能停留在旧步骤而不是重新开始。
- 只删除声音按钮而保留 `muted` 状态，会留下无调用分支并增加音量状态歧义。
- 中英文目录字段不一致会破坏目录结构测试和类型推导。

## 当前进展
- 顶部“任务引导 / MISSION GUIDANCE”按钮会直接启动或重新开始情境式引导。
- 独立操作说明弹窗及其全部代码、文案和样式已移除。
- 顶部声音区只保留“音量 / VOL”滑杆，`0` 会直接写入 Web Audio 主增益。
- 顶部中英文版本号已统一更新为 `1.1`。

## 代码变更

### `src/ui/App.tsx`
```diff
--- a/src/ui/App.tsx
+++ b/src/ui/App.tsx
@@
-import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
+import { useCallback, useEffect, useState, type CSSProperties } from "react";
@@
-import { GameplayGuide } from "./GameplayGuide";
 import { LanguageSelector } from "./LanguageSelector";
 import { FullscreenToggle } from "./FullscreenToggle";
@@
-  const [guideOpen, setGuideOpen] = useState(false);
   const [tutorialActive, setTutorialActive] = useState(shouldStartTutorial);
-  const guideTriggerRef = useRef<HTMLButtonElement>(null);
+  const [tutorialSessionId, setTutorialSessionId] = useState(0);
   const mission = state.currentMission;
-  const { muted, volume, setMuted, setVolume } = useGameAudio(mission);
+  const { volume, setVolume } = useGameAudio(mission);
@@
-  const closeGuide = useCallback(() => setGuideOpen(false), []);
+  const startTutorial = useCallback(() => {
+    // 每次点击都重新挂载引导，使已完成或正在进行的引导从当前页面对应步骤重新开始。
+    setTutorialSessionId((value) => value + 1);
+    setTutorialActive(true);
+  }, []);
@@
-        <button ref={guideTriggerRef} type="button" className="guide-trigger" onClick={() => setGuideOpen(true)}>{copy.app.instructions}</button>
+        <button type="button" className="tutorial-trigger" onClick={startTutorial}>{copy.app.missionGuidance}</button>
         <FullscreenToggle />
         <div className="audio-control">
-          <button type="button" onClick={() => setMuted(!muted)}>{muted ? copy.app.soundOff : copy.app.soundOn}</button>
           <label htmlFor="master-volume">{copy.app.volume}</label>
@@
-    <GameplayGuide
-      open={guideOpen}
-      onClose={closeGuide}
-      onStartTutorial={() => {
-        closeGuide();
-        setTutorialActive(true);
-      }}
-      triggerRef={guideTriggerRef}
-      missionRunning={mission.status === "RUNNING"}
-    />
     {tutorialActive && <MissionTutorial
+      key={tutorialSessionId}
       context={tutorialContext}
```

### `src/ui/GameplayGuide.tsx`
```diff
--- a/src/ui/GameplayGuide.tsx
+++ /dev/null
@@ -1,50 +0,0 @@
-import { useEffect, useRef, type RefObject } from "react";
-import { useI18n } from "../i18n/I18n";
-
-interface GameplayGuideProps {
-  open: boolean;
-  onClose: () => void;
-  onStartTutorial: () => void;
-  triggerRef: RefObject<HTMLButtonElement | null>;
-  missionRunning: boolean;
-}
-
-export function GameplayGuide({ open, onClose, onStartTutorial, triggerRef, missionRunning }: GameplayGuideProps) {
-  const { copy } = useI18n();
-  const closeButtonRef = useRef<HTMLButtonElement>(null);
-
-  useEffect(() => {
-    if (!open) return;
-    closeButtonRef.current?.focus();
-    const handleKeyDown = (event: KeyboardEvent) => {
-      if (event.key !== "Escape") return;
-      event.preventDefault();
-      onClose();
-      triggerRef.current?.focus();
-    };
-    window.addEventListener("keydown", handleKeyDown);
-    return () => window.removeEventListener("keydown", handleKeyDown);
-  }, [onClose, open, triggerRef]);
-
-  if (!open) return null;
-  const close = () => {
-    onClose();
-    triggerRef.current?.focus();
-  };
-
-  return <div className="guide-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
-    <section className="gameplay-guide" role="dialog" aria-modal="true" aria-labelledby="gameplay-guide-title">
-      <header className="gameplay-guide-header">
-        <div><span className="section-kicker">{copy.guide.kicker}</span><h2 id="gameplay-guide-title">{copy.guide.title}</h2></div>
-        <button ref={closeButtonRef} type="button" className="guide-close" onClick={close} aria-label={copy.guide.close}><span aria-hidden="true" /></button>
-      </header>
-      {missionRunning && <p className="guide-live-warning">{copy.guide.liveWarning}</p>}
-      <div className="gameplay-guide-content">
-        {copy.guide.sections.map(([title, content]) => <article key={title}><h3>{title}</h3><p>{content}</p></article>)}
-      </div>
-      <footer className="gameplay-guide-footer">
-        <button type="button" className="primary-button" onClick={onStartTutorial}>{copy.guide.startTutorial}</button>
-      </footer>
-    </section>
-  </div>;
-}
```

### `src/ui/GameplayGuide.test.tsx`
```diff
--- a/src/ui/GameplayGuide.test.tsx
+++ /dev/null
@@ -1,72 +0,0 @@
-import { createRef } from "react";
-import { cleanup, fireEvent, render, screen } from "@testing-library/react";
-import { afterEach, describe, expect, it, vi } from "vitest";
-import { GameplayGuide } from "./GameplayGuide";
-import { I18nProvider } from "../i18n/I18n";
-
-afterEach(cleanup);
-
-function renderGuide(onClose = vi.fn()) {
-  const triggerRef = createRef<HTMLButtonElement>();
-  const onStartTutorial = vi.fn();
-  render(<><button ref={triggerRef}>操作说明</button><GameplayGuide open onClose={onClose} onStartTutorial={onStartTutorial} triggerRef={triggerRef} missionRunning /></>);
-  return { onClose, onStartTutorial, triggerRef };
-}
-
-describe("GameplayGuide", () => {
-  it("显示操作说明与执行状态提示", () => {
-    renderGuide();
-    expect(screen.getByRole("dialog", { name: "操作说明" })).toBeInTheDocument();
-    expect(screen.getByText("任务执行中 // 作战进程未中断")).toBeInTheDocument();
-    expect(screen.getByText("实时调整")).toBeInTheDocument();
-    expect(screen.getByText("任务效果")).toBeInTheDocument();
-    expect(screen.getByText(/打击任务降低后续雷达扫描速率/)).toBeInTheDocument();
-    expect(screen.getByText(/若放弃首次情报行动/)).toBeInTheDocument();
-    expect(screen.getByText(/敌方警戒会在每次任务后上升/)).toBeInTheDocument();
-    expect(screen.getByRole("button", { name: "关闭操作说明" })).toHaveFocus();
-  });
-
-  it("非执行阶段不显示实时任务提示", () => {
-    const triggerRef = createRef<HTMLButtonElement>();
-    render(<><button ref={triggerRef}>操作说明</button><GameplayGuide open onClose={vi.fn()} onStartTutorial={vi.fn()} triggerRef={triggerRef} missionRunning={false} /></>);
-    expect(screen.queryByText("任务执行中 // 作战进程未中断")).not.toBeInTheDocument();
-  });
-
-  it("可从操作说明启动情境式任务引导", () => {
-    const { onStartTutorial } = renderGuide();
-    fireEvent.click(screen.getByRole("button", { name: "开始任务引导" }));
-    expect(onStartTutorial).toHaveBeenCalledTimes(1);
-  });
-
-  it("关闭按钮、遮罩和 Escape 都会关闭并恢复入口焦点", () => {
-    const first = renderGuide();
-    fireEvent.click(screen.getByRole("button", { name: "关闭操作说明" }));
-    expect(first.onClose).toHaveBeenCalledTimes(1);
-    expect(first.triggerRef.current).toHaveFocus();
-    cleanup();
-
-    const second = renderGuide();
-    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);
-    expect(second.onClose).toHaveBeenCalledTimes(1);
-    expect(second.triggerRef.current).toHaveFocus();
-    cleanup();
-
-    const third = renderGuide();
-    fireEvent.keyDown(window, { key: "Escape" });
-    expect(third.onClose).toHaveBeenCalledTimes(1);
-    expect(third.triggerRef.current).toHaveFocus();
-  });
-
-  it("英文模式显示完整的操作与任务效果说明", () => {
-    const triggerRef = createRef<HTMLButtonElement>();
-    render(<I18nProvider initialLanguage="en" persist={false}>
-      <button ref={triggerRef}>OPERATING INSTRUCTIONS</button>
-      <GameplayGuide open onClose={vi.fn()} onStartTutorial={vi.fn()} triggerRef={triggerRef} missionRunning />
-    </I18nProvider>);
-
-    expect(screen.getByRole("dialog", { name: "OPERATING INSTRUCTIONS" })).toBeInTheDocument();
-    expect(screen.getByText("MISSION IN PROGRESS // OPERATION CONTINUES")).toBeInTheDocument();
-    expect(screen.getByText("MISSION EFFECTS")).toBeInTheDocument();
-    expect(screen.getByText(/STRIKE reduces subsequent radar scan rate/)).toBeInTheDocument();
-  });
-});
```

### `src/audio/useGameAudio.ts`
```diff
--- a/src/audio/useGameAudio.ts
+++ b/src/audio/useGameAudio.ts
@@
-  const [muted, setMutedState] = useState(false);
   const [volume, setVolumeState] = useState(0.35);
@@
-  const setMuted = (nextMuted: boolean) => {
-    setMutedState(nextMuted);
-    gameAudio.setMuted(nextMuted);
-  };
   const setVolume = (nextVolume: number) => {
@@
-  return { muted, volume, setMuted, setVolume };
+  return { volume, setVolume };
```

### `src/audio/gameAudio.ts`
```diff
--- a/src/audio/gameAudio.ts
+++ b/src/audio/gameAudio.ts
@@
 type AlarmMode = "LOCK" | "MISSILE";
 
+/** 将音量约束在 Web Audio 主增益允许的 0–1 范围，0 即完全关闭声音。 */
+export function normalizeVolume(volume: number): number {
+  return Math.max(0, Math.min(1, volume));
+}
+
 /** 使用 Web Audio 合成座舱提示音，避免引入外部音频素材与加载状态。 */
@@
-  private muted = false;
   private volume = 0.35;
@@
-  setMuted(muted: boolean): void {
-    this.muted = muted;
-    this.applyVolume();
-  }
-
   setVolume(volume: number): void {
-    this.volume = Math.max(0, Math.min(1, volume));
+    this.volume = normalizeVolume(volume);
@@
-    this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.context.currentTime, 0.015);
+    this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.015);
```

### `src/audio/gameAudio.test.ts`
```diff
--- a/src/audio/gameAudio.test.ts
+++ b/src/audio/gameAudio.test.ts
@@
-import { cueForEvent } from "./gameAudio";
+import { cueForEvent, normalizeVolume } from "./gameAudio";
@@
+describe("游戏音量边界", () => {
+  it("允许直接把主音量调至零以完全关闭声音", () => {
+    expect(normalizeVolume(0)).toBe(0);
+    expect(normalizeVolume(-0.2)).toBe(0);
+    expect(normalizeVolume(1.2)).toBe(1);
+  });
+});
```

### `src/i18n/I18n.tsx`
```diff
--- a/src/i18n/I18n.tsx
+++ b/src/i18n/I18n.tsx
@@
-      subtitle: "源自美国空军 // 版本 1.0",
+      subtitle: "源自美国空军 // 版本 1.1",
@@
-      instructions: "操作说明",
-      soundOn: "声音开启",
-      soundOff: "声音关闭",
+      missionGuidance: "任务引导",
@@
-    guide: {
-      kicker: "操作指令",
-      title: "操作说明",
-      close: "关闭操作说明",
-      startTutorial: "开始任务引导",
-      liveWarning: "任务执行中 // 作战进程未中断",
-      sections: [
-        ["作战目标", "规划 F-117 航线，进入目标空域完成打击，并安全抵达东北撤离区。"],
-        ["任务网络", "三个阶段均需二选一，随后执行最终打击。锁定任务可以预览当前研判，但不能执行。"],
-        ["确认航线", "点击地图添加、拖动或排序航点。确认后任务不可暂停、重置或中途返回任务网络。"],
-        ["实时调整", "飞行中可继续添加航点，并调整当前目标航点之后的路线；已飞路径不可修改。"],
-        ["有限情报", "初始报告可能遗漏雷达，坐标与覆盖也存在误差。第一次完成情报行动将补齐全部雷达并核实坐标和型号；第二次授权全域情报。若放弃首次情报行动，本次行动将无法取得第二级权限。"],
-        ["任务效果", "打击任务降低后续雷达扫描速率；防空压制缩小覆盖；指挥打击削弱协同搜索和联合跟踪；情报行动改变可见信息，不强化飞机。"],
-        ["敌方响应", "敌方警戒会在每次任务后上升，失败造成的增幅更大并扩大后续雷达范围；敌方还会根据已飞航迹调整后续部署。"],
-        ["环境与航程", "地形和恶劣天气可降低探测概率，但天气也会降低飞行速度。燃油按实际飞行距离消耗，出动前预报对应任务开始后第 30、60、90 秒。"],
-        ["生存规则", "威胁告警表示当前跟踪与火控威胁。利用转向、距离、地形和天气切断新的雷达接触；导弹来袭后必须尽快脱离持续照射。"],
-        ["任务结果", "只有摧毁目标并成功撤离才算完成。失败可返回任务网络重试或改选；成功任务可用任务视角或全景视角复盘。"],
-      ],
-    },
@@
-      subtitle: "FROM USA AIR FORCE // VERSION 1.0",
+      subtitle: "FROM USA AIR FORCE // VERSION 1.1",
@@
-      instructions: "OPERATING INSTRUCTIONS",
-      soundOn: "SOUND ON",
-      soundOff: "SOUND OFF",
+      missionGuidance: "MISSION GUIDANCE",
@@
-    guide: {
-      kicker: "OPERATING INSTRUCTIONS",
-      title: "OPERATING INSTRUCTIONS",
-      close: "Close operating instructions",
-      startTutorial: "START MISSION GUIDANCE",
-      liveWarning: "MISSION IN PROGRESS // OPERATION CONTINUES",
-      sections: [
-        ["OBJECTIVE", "Plan the F-117 route, strike the designated target area, and reach the extraction zone in the northeast."],
-        ["MISSION NETWORK", "Choose one of two missions in each of three stages, then conduct the final strike. Locked missions may be previewed but not executed."],
-        ["ROUTE CONFIRMATION", "Click the map to add, drag, or reorder waypoints. Once confirmed, the mission cannot be paused, reset, or abandoned for the mission network."],
-        ["REAL-TIME ADJUSTMENT", "During flight, you may add waypoints and modify the route beyond the current target waypoint. The flown route cannot be changed."],
-        ["LIMITED INTELLIGENCE", "Initial reports may omit radars and misestimate coordinates or coverage. The first INTEL mission reveals all radars and verifies coordinates and types; the second authorizes TOTAL INTEL. Skipping the first INTEL prevents access to the second tier in this run."],
-        ["MISSION EFFECTS", "STRIKE reduces subsequent radar scan rate; SEAD reduces coverage; COMMAND STRIKE weakens coordinated search and joint tracking; INTEL changes visible information without upgrading the aircraft."],
-        ["ENEMY RESPONSE", "ENEMY ALERT rises after every mission. Failure causes a larger increase and expands subsequent radar ranges. The enemy also adapts future deployments to observed flight paths."],
-        ["ENVIRONMENT AND RANGE", "Terrain and severe weather reduce detection probability, but weather also slows the aircraft. Fuel is consumed by actual distance flown; preflight forecasts refer to fixed mission times T+30/60/90 seconds."],
-        ["SURVIVAL", "THREAT WARNING shows current tracking and fire-control danger. Use turns, distance, terrain, and weather to break new Contacts; once a missile is inbound, leave sustained illumination quickly."],
-        ["MISSION RESULT", "A mission succeeds only after the target is destroyed and the aircraft extracts. Failed missions may be retried or replaced; successful missions support mission-view and panoramic debriefs."],
-      ],
-    },
```

### `src/i18n/I18n.test.tsx`
```diff
--- a/src/i18n/I18n.test.tsx
+++ b/src/i18n/I18n.test.tsx
@@
     expect(collectKeyPaths(localeCatalogs.en)).toEqual(collectKeyPaths(localeCatalogs.zh));
+    expect(localeCatalogs.zh.app.missionGuidance).toBe("任务引导");
+    expect(localeCatalogs.en.app.missionGuidance).toBe("MISSION GUIDANCE");
+    expect(localeCatalogs.zh.app.subtitle).toContain("版本 1.1");
+    expect(localeCatalogs.en.app.subtitle).toContain("VERSION 1.1");
```

### `src/ui/styles.css`
```diff
--- a/src/ui/styles.css
+++ b/src/ui/styles.css
@@
-.topbar-controls > button, .language-selector > .language-trigger, .audio-control > button, .seed-control input, .seed-control > button { box-sizing: border-box; height: 30px; }
-.guide-trigger, .language-trigger, .fullscreen-trigger { padding: 7px 10px; color: #dcb35a; border-color: #765b2b; font-size: 9px; letter-spacing: 0.08em; white-space: nowrap; }
+.topbar-controls > button, .language-selector > .language-trigger, .seed-control input, .seed-control > button { box-sizing: border-box; height: 30px; }
+.tutorial-trigger, .language-trigger, .fullscreen-trigger { padding: 7px 10px; color: #dcb35a; border-color: #765b2b; font-size: 9px; letter-spacing: 0.08em; white-space: nowrap; }
@@
 .audio-control { display: flex; align-items: center; gap: 7px; }
-.audio-control button { padding: 7px 9px; color: #74ad9c; font-size: 9px; }
-.audio-control label { margin-left: 6px; color: #527b6e; font-size: 9px; }
+.audio-control label { color: #527b6e; font-size: 9px; }
@@
-.guide-backdrop { position: fixed; z-index: 20; inset: 0; display: grid; place-items: center; padding: 32px; background: rgba(2, 7, 6, 0.82); backdrop-filter: blur(3px); }
-.gameplay-guide { width: min(760px, calc(var(--logical-viewport-width) - 64px)); max-height: calc(var(--logical-viewport-height) - 64px); display: flex; flex-direction: column; border: 1px solid #88672f; box-shadow: 0 0 46px rgba(0, 0, 0, 0.68), inset 0 0 40px rgba(42, 77, 64, 0.08); background: #08130f; }
-.gameplay-guide-header { flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 18px 20px; border-bottom: 1px solid #29483e; }
-.gameplay-guide-header h2 { margin: 6px 0 0; color: #edc160; font-size: 19px; font-weight: 500; }
-.guide-close { position: relative; width: 32px; height: 32px; flex: 0 0 32px; padding: 0; color: #dfb85d; border-color: #80632e; }
-.guide-close span::before, .guide-close span::after { content: ""; position: absolute; top: 15px; left: 8px; width: 15px; height: 1px; background: currentColor; }
-.guide-close span::before { transform: rotate(45deg); }
-.guide-close span::after { transform: rotate(-45deg); }
-.guide-live-warning { flex: 0 0 auto; margin: 0; padding: 9px 20px; color: #d8876c; border-bottom: 1px solid #322d20; background: rgba(101, 49, 30, 0.12); font-size: 9px; letter-spacing: 0.1em; }
-.gameplay-guide-content { min-height: 0; overflow-y: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 18px 20px 22px; overscroll-behavior: contain; }
-.gameplay-guide-content article { padding: 12px 13px; border: 1px solid #1d4035; background: rgba(28, 67, 54, 0.12); }
-.gameplay-guide-content article:last-child:nth-child(odd) { grid-column: 1 / -1; }
-.gameplay-guide-content h3 { margin: 0; color: #b9d3ca; font-size: 11px; font-weight: 500; }
-.gameplay-guide-content p { margin: 7px 0 0; color: #6f998c; font-size: 10px; line-height: 1.7; }
-.gameplay-guide-footer { flex: 0 0 auto; padding: 0 20px 20px; }
-.gameplay-guide-footer .primary-button { width: 100%; min-height: 38px; }
```

### `AGENTS.md`
```diff
--- a/AGENTS.md
+++ b/AGENTS.md
@@
-- 首次访问提供运行在真实生成任务上的七步情境式任务引导，通过高亮任务网络、规划、航线与执行态势教授核心闭环；引导只观察界面与任务状态，不暂停模拟、不代替玩家操作，也不进入 Run、Seed 或复盘数据。
+- 首次访问提供运行在真实生成任务上的七步情境式任务引导，通过高亮任务网络、规划、航线与执行态势教授核心闭环；顶部“任务引导”按钮可直接启动或重新开始引导，不再提供独立操作说明弹窗；引导只观察界面与任务状态，不暂停模拟、不代替玩家操作，也不进入 Run、Seed 或复盘数据。
@@
-- 音效使用原生 Web Audio API 合成并由领域事件驱动；锁定与导弹警报属于可清理循环音，脱锁、任务结束或组件卸载时必须停止，顶部提供静音与总音量控制。
+- 音效使用原生 Web Audio API 合成并由领域事件驱动；锁定与导弹警报属于可清理循环音，脱锁、任务结束或组件卸载时必须停止；顶部只提供总音量滑杆，玩家将音量调至 `0` 即可完全关闭声音，不设独立声音开关。
```

### `.agentdocs/index.md`
```diff
--- a/.agentdocs/index.md
+++ b/.agentdocs/index.md
@@
 ## 当前变更文档
+`workflow/20260903221322-streamline-guidance-audio-and-version.md` - 会话-5：将顶部“操作说明”改为直接启动或重启七步任务引导，删除独立说明弹窗与声音开关，明确音量归零即静音，并将中英文 UI 版本更新为 1.1；核对顶部引导、声音控制或版本号时读取。
@@
 - 项目名称为 `F-117 Tactical Command System`，中文名为 `F-117 战术指挥系统`，包名为 `f117-tactical-command-system`。
+- 当前游戏 UI 版本为 `1.1`；顶部“任务引导”按钮直接启动或重新开始七步情境式引导，不再显示独立操作说明弹窗；声音仅由总音量滑杆控制，调至 `0` 即完全关闭。
```

## 测试用例

### TC-001 顶部入口直接启动任务引导
- 类型：交互测试
- 优先级：高
- 前置条件：任务网络页面已加载。
- 操作步骤：点击顶部“任务引导”。
- 预期结果：直接显示 `1 / 7` 的任务引导卡片，不经过操作说明弹窗。
- 是否通过：通过（浏览器实测）。

### TC-002 删除操作说明与声音开关
- 类型：界面回归测试
- 优先级：高
- 操作步骤：检查中英文顶部栏和页面可访问树。
- 预期结果：不存在“操作说明 / OPERATING INSTRUCTIONS”和“声音开启/关闭 / SOUND ON/OFF”按钮。
- 是否通过：通过（浏览器实测与残留符号检索）。

### TC-003 音量归零
- 类型：功能与边界测试
- 优先级：高
- 操作步骤：将顶部音量滑杆调至最左侧，并验证音频主增益归一化。
- 预期结果：滑杆允许值 `0`，音频引擎向主增益写入 `0`；负值约束为 `0`，超过 `1` 的值约束为 `1`。
- 是否通过：通过（浏览器可访问树与单元测试）。

### TC-004 中英文版本与入口文案
- 类型：国际化测试
- 优先级：中
- 操作步骤：分别切换中文与 English。
- 预期结果：显示“版本 1.1 / VERSION 1.1”和“任务引导 / MISSION GUIDANCE”，中英文目录结构一致。
- 是否通过：通过（浏览器实测与单元测试）。

### TC-005 引导入口重复点击
- 类型：状态回归测试
- 优先级：中
- 操作步骤：在已完成、已退出或正在进行引导时再次点击顶部入口。
- 预期结果：通过新的会话键重新挂载引导，并从当前页面对应步骤开始。
- 是否通过：通过（实现检查与既有 `MissionTutorial` 测试）。

## 验证记录
- `npm run typecheck`：通过。
- `npm run test`：通过，33 个测试文件、156 项测试全部通过。
- `npm run build`：通过，Vite 生产构建成功。
- 浏览器验证：中文顶部栏显示“任务引导”“版本 1.1”和单一音量滑杆；点击入口直接显示七步引导第 1 步，未发现旧操作说明或声音开关。
- 视觉检查：任务引导打开后顶部横栏保持单行，页面布局完整且无新增溢出。
