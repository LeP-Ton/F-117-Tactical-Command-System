# 游戏界面中英文支持

## 背景与目标
- 为 F-117 战术指挥系统的全部玩家可见文案提供简体中文与 English 两套界面。
- 语言切换覆盖任务网络、规划/执行/预览/复盘工作区、Canvas 地图、天气、操作说明、事件与敌方内部状态。
- 语言只属于显示层，不能改变任务存档、Seed、Tick、音频或任何模拟结果。

## 约束与原则
- 保留会话-128尚未提交的游戏设计文档校准，不回退或覆盖。
- 默认使用简体中文，顶部按钮可即时切换 English，选择使用独立 localStorage 键持久化。
- React 与 Canvas 共用同一文案目录；领域枚举、RunState、MissionSession 与复盘快照不保存当前语言。
- 既有复盘快照中的中文部署记录在英文界面渲染时兼容翻译。
- TOTAL INTEL、Contact、Belief、Commander、SEAD 等系统代号保留，周边说明随语言切换。

## 阶段与 TODO
- [x] 盘点 React、Canvas、ARIA、动态状态和领域生成简报文案。
- [x] 新增中英文文案目录、语言上下文与独立偏好持久化。
- [x] 接入任务网络、控制面板、三类工作区、地图、天气和操作说明。
- [x] 为任务收益增加稳定语义键，避免 Campaign 在 UI 中重复判断奖励逻辑。
- [x] 增加旧部署简报英文兼容映射。
- [x] 更新 README、机制手册、AGENTS.md 与文档索引。
- [x] 完成自动化测试、构建和真实浏览器冒烟检查。

## 关键风险
- Canvas 文案不在 DOM 中，遗漏时普通组件测试无法发现。
- 领域层历史快照保存的是既有中文部署记录，直接切换语言会出现混排。
- English 文案更长，顶部控制区和窄侧栏可能出现溢出。
- 语言偏好若进入 RunState，会破坏存档职责并制造无意义的模拟差异。

## 当前进展
- 顶部增加紧凑语言切换入口，默认中文，刷新后保持选择。
- 全部玩家可见枚举、按钮、说明、图例、画布标签和调试面板已接入统一目录。
- 英文目录加入结构一致性和中文残留检查；部署简报覆盖当前所有静态与动态格式。
- 1280px 真实页面验证无横向溢出，中文、英文、操作说明、任务网络和刷新持久化均正常。

## 测试用例
### TC-001 中英文目录完整
- 类型：单元测试
- 优先级：高
- 操作步骤：
  1. 递归收集中英文目录键路径。
  2. 对比完整结构，并扫描英文值。
- 预期结果：
  - 两套目录结构完全一致。
  - 除语言切换按钮显示“中文”外，英文目录无中文残留。
- 是否通过：是。

### TC-002 语言即时切换与持久化
- 类型：组件测试
- 优先级：高
- 操作步骤：
  1. 以中文挂载语言 Provider。
  2. 点击 EN。
  3. 检查界面、html lang 与独立 localStorage。
- 预期结果：
  - 文案立即切换为英文。
  - 根语言标记为 en，偏好保存为 en。
  - 不接触游戏 reducer 或 RunState。
- 是否通过：是。

### TC-003 动态文案与旧复盘兼容
- 类型：单元测试
- 优先级：高
- 操作步骤：
  1. 输入当前 Enemy Adaptation 与 Final Strike 可生成的全部部署记录。
  2. 覆盖带 Enemy Alert 数值和南北航路的动态格式。
- 预期结果：
  - 英文输出不残留中文。
  - 动态数值与南北方向保持原始语义。
- 是否通过：是。

### TC-004 关键工作区英文渲染
- 类型：组件测试
- 优先级：高
- 操作步骤：
  1. 分别渲染任务网络、操作说明和地图元素。
  2. 检查任务类型、奖励、天气、状态和入口。
- 预期结果：
  - 动态数据与静态标题都使用 English。
  - 中文默认测试继续通过。
- 是否通过：是。

### TC-005 真实页面与布局
- 类型：浏览器冒烟测试
- 优先级：高
- 操作步骤：
  1. 在 1280px 页面打开规划任务。
  2. 切换 English，打开操作说明，再返回任务网络。
  3. 刷新页面并检查控制台。
- 预期结果：
  - 顶部控制区不横向溢出。
  - 操作说明无中文残留。
  - 刷新保持 English，控制台无错误。
- 是否通过：是。

### TC-006 全量回归
- 类型：自动化
- 优先级：高
- 验证命令：
  - npm run typecheck
  - npm run test
  - npm run build
  - git diff --check
- 预期结果：
  - TypeScript 检查通过。
  - 29 个测试文件、141 项测试全部通过。
  - Vite 生产构建通过。
  - Diff 无空白错误。
- 是否通过：是。

## 代码变更

```diff
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/.agentdocs/index.md ./.agentdocs/index.md
--- /private/tmp/f117-session129-baseline.Iq0Lf1/.agentdocs/index.md	2026-09-02 23:02:33
+++ ./.agentdocs/index.md	2026-09-02 23:23:08
@@ -5,6 +5,7 @@
 `proposals/20260825225610-rejected-sigint-overlay.md` - 会话-80/81：已废弃的“有限情报动态 SIGINT Overlay”方案；重新讨论 AI DEBUG、直播观赏性或有限情报动态反馈时读取，不能视为已实施功能。
 
 ## 当前变更文档
+`workflow/20260902232256-add-bilingual-game-interface.md` - 会话-129：为任务网络、三类战术工作区、Canvas 地图、天气、事件、操作说明与敌方内部状态建立完整中英文文案层，增加即时切换和独立偏好持久化，并兼容翻译旧复盘部署记录；排查界面文案、语言切换或本地化状态边界时读取。
 `workflow/20260902230204-realign-game-design-documentation.md` - 会话-128：将 README 重构为完整游戏设计文档，校准机制手册与游戏内操作说明，补齐 Enemy Alert、天气预报时基和系统设计哲学，并修正 INTEL 动态奖励及核实雷达标识；理解当前完整设计、玩家说明和文档事实来源时优先读取。
 `workflow/20260902170448-enforce-two-intel-mission-limit.md` - 会话-124：将“任务网络最多两个 INTEL 行动”设为集中式硬约束，生成器拒绝第三个 INTEL，权限派生复用同一上限，并明确错过首次行动将无法取得 `TOTAL INTEL`；扩展任务网络或核对情报上限时读取。
 `workflow/20260902114838-distinguish-intel-reward-copy.md` - 会话-122：将第一次 INTEL 明确为核实全部雷达坐标与型号、第二次明确为授权 `TOTAL INTEL` 完整敌方态势，并通过动态派生兼容旧存档文案；核对任务网络 INTEL 奖励说明时读取。
@@ -89,6 +90,7 @@
 - 项目名称为 `F-117 Tactical Command System`，中文名为 `F-117 战术指挥系统`，包名为 `f117-tactical-command-system`。
 - 产品定位是解谜与动态规划导向的军事模拟；任务界面只呈现态势、情报、告警和指令，不直接解释幕后游戏机制、操作教程或程序生成信息。
 - 当前完成 Phase 0–12，采用 React、TypeScript、Vite 与 HTML Canvas。
+- 游戏界面全部玩家可见文案支持简体中文与 English 即时切换；语言偏好独立于 Run 存档，React 与 Canvas 共用同一文案目录，切换不影响 Seed、Tick 或任何模拟状态。
 - `RunState` 与 `MissionSession` 分离，Canvas 不持有领域状态。
 - 只有 Radar Sensor 可读取飞机真实状态，后续 AI 只能消费带误差 Radar Contact。
 - 雷达网络由 Early Warning、Acquisition、Fire Control 三类组成，类型分别影响覆盖、扫描周期、波束、探测概率、Contact 精度和火控贡献。
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/AGENTS.md ./AGENTS.md
--- /private/tmp/f117-session129-baseline.Iq0Lf1/AGENTS.md	2026-09-02 23:01:29
+++ ./AGENTS.md	2026-09-02 23:20:11
@@ -7,9 +7,10 @@
 
 ## 技术选型与核心架构
 - 客户端采用 React 18、TypeScript、Vite 与 HTML Canvas；测试采用 Vitest。
-- 核心分层为 `core`（基础设施）、`domain`（纯领域逻辑）、`game`（状态与循环）、`ui`（交互与渲染）、`config`（参数配置）。
+- 核心分层为 `core`（基础设施）、`domain`（纯领域逻辑）、`game`（状态与循环）、`ui`（交互与渲染）、`i18n`（中英文文案与渲染期本地化）、`config`（参数配置）。
 - `RunState` 与 `MissionSession` 严格分离；Seed、Campaign 和 Enemy Adaptation 均保留独立扩展边界。
 - Canvas 只负责绘制与坐标交互，游戏状态以 reducer 和领域模型为唯一事实来源。
+- 游戏内全部玩家可见文案支持简体中文与 English 即时切换；语言偏好独立保存，不进入 `RunState`、`MissionSession`、Seed 或复盘快照，Canvas 与 React 必须消费同一语言目录且切换不得改变模拟状态。
 - 雷达架构遵循 Reality → Radar Sensor → Imperfect Contact；只有 Sensor 层可读取飞机真实状态，后续 AI 只能消费带误差 Contact。
 - 雷达网络由 Early Warning（远程宽波束、低火控质量）、Acquisition（中程均衡）与 Fire Control（近程窄波束、高精度高火控质量）三类组成；类型差异统一影响覆盖、扫描周期、波束、探测率、Contact 误差与锁定贡献。
 - 每场任务最终准备完成后，至少一部 Fire Control 必须完整覆盖目标攻击区并保留 `20 u` 余量；唯一承担目标防御的火控雷达不参与 Enemy Adaptation 移位。
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/README.md ./README.md
--- /private/tmp/f117-session129-baseline.Iq0Lf1/README.md	2026-09-02 22:40:07
+++ ./README.md	2026-09-02 23:20:00
@@ -5,6 +5,7 @@
 - 在线版本：<https://lep-ton.github.io/F-117-Tactical-Command-System/>
 - 精确规则与数值参考：[游戏机制手册](docs/game-mechanics.md)
 - 技术栈：React 18、TypeScript、Vite、HTML Canvas、Vitest
+- 界面语言：简体中文 / English，可在任何页面即时切换
 
 本文既是项目入口，也是当前版本的游戏设计文档。它解释各系统为什么存在、玩家需要做出什么判断，以及代码实现必须维护哪些边界。精确阈值以机制手册和领域配置为准。
 
@@ -56,6 +57,12 @@
 
 任务界面模拟战术终端，只显示任务状态、情报、告警、航点和传感器读数。精确公式、生成规则和实现边界集中在本文与机制手册；游戏内“操作说明”只保留完成决策所需的简要信息。
 
+### 1.6 中英文使用同一套模拟状态
+
+顶部语言按钮可在简体中文与 English 之间即时切换。任务网络、三类战术工作区、Canvas 地图、操作说明、状态枚举、事件、天气与敌方内部面板都从同一文案目录渲染；切换语言只改变表达层，不会 dispatch 游戏 Action，也不会重置任务、暂停 Tick、改变 Seed 或修改探测结果。
+
+语言偏好使用独立的 `localStorage` 键保存，不进入 `RunState`、`MissionSession` 或复盘快照。旧存档中已经冻结的中文部署记录会在英文界面显示时经过兼容映射，因此复盘历史任务不会残留中文动态简报。
+
 ## 2. 核心任务循环
 
 一次任务依次经历以下过程：
@@ -475,6 +482,8 @@
 - 旧版连续情报质量字段会在恢复时剥离。
 - 当前只有单 Run 本地存档，没有多存档槽或云同步。
 
+界面语言属于单独的浏览器偏好，不计入上述任务存档。切换语言不会改变当前工作区、航线编辑权限或任务进度。
+
 ## 16. 音效与事件
 
 音效由领域事件驱动，通过原生 Web Audio API 合成：
@@ -493,6 +502,7 @@
 src/domain      航线、雷达、Contact、Belief、Commander、天气、任务网络等纯逻辑
 src/procedural  Seed 驱动的任务与任务网络生成
 src/game        RunState、reducer、帧循环、任务准备与持久化
+src/i18n        中英文文案目录、语言上下文与旧简报兼容翻译
 src/ui          React 战术终端、三类 Workspace 与 Canvas 地图
 src/audio       领域事件驱动的 Web Audio 音效
 ```
@@ -505,6 +515,7 @@
 - Canvas 只绘制和上报坐标交互，不持有第二套游戏状态。
 - reducer 是任务状态变化的唯一事实来源。
 - 共享 UI 组件只接收只读数据与回调，不直接读取或修改 `RunState`。
+- 本地化只发生在渲染边界；领域枚举、Seed 和持久状态不得保存当前语言的展示文本。
 
 ### 17.2 必须保持的不变量
 
@@ -515,6 +526,7 @@
 - Seed 驱动的结果不得依赖帧率。
 - 飞行中航点权限必须由 UI 和 reducer 共用规则保护，不能只依靠按钮置灰。
 - 任务只有“摧毁目标并撤离”一种成功口径。
+- 语言切换只能改变文案与 Canvas 标签，不能 dispatch Action 或改变模拟时序。
 
 新增机制时应优先把纯计算放入 `domain`，由 reducer 编排状态演进，再由 React 与 Canvas 消费结果；不要在 UI 中实现第二套雷达、任务或权限规则。
 
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/docs/game-mechanics.md ./docs/game-mechanics.md
--- /private/tmp/f117-session129-baseline.Iq0Lf1/docs/game-mechanics.md	2026-09-02 23:02:33
+++ ./docs/game-mechanics.md	2026-09-02 23:20:11
@@ -64,6 +64,16 @@
 
 该开关只改变显示，不写入存档，也不会改变雷达探测、Commander、交战或任务结算。未获得第二级权限时，正式版本不会显示入口。
 
+### 2.4 界面语言
+
+所有玩家可见文案支持简体中文与 English，包括任务网络、规划/执行/预览/复盘工作区、操作说明、Canvas 地图标签、天气预报、状态枚举、结构化事件和敌方系统面板。
+
+- 顶部语言按钮可在任何任务阶段即时切换。
+- 语言是独立界面偏好，保存到单独的浏览器 `localStorage` 键。
+- 语言不进入 `RunState`、`MissionSession`、Seed 或成功复盘，不影响 Tick、音频、雷达探测和任务结算。
+- 领域层生成的部署记录保留稳定存档值，渲染英文界面时兼容翻译已有中文记录。
+- `TOTAL INTEL`、Contact、Belief、Commander、SEAD 等系统代号在两种语言中保留，周边状态和解释文字随语言切换。
+
 ## 3. 雷达如何探测飞机
 
 雷达不是覆盖圈内必定发现飞机。每次扫描只有当扫描波束经过飞机方向时，才根据多项因素计算探测概率：
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/domain/campaignBalance.ts ./src/domain/campaignBalance.ts
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/domain/campaignBalance.ts	2026-09-02 22:35:23
+++ ./src/domain/campaignBalance.ts	2026-09-02 23:20:57
@@ -24,15 +24,26 @@
   FINAL_STRIKE: "对最终目标实施纵深精确打击",
 };
 
+export type MissionEffectKey = Exclude<MissionNodeType, "INTEL"> | "INTEL_GENERIC" | "INTEL_1" | "INTEL_2";
+
+/** 将任务类型与当前 INTEL 奖励层级转换为稳定语义键，供任意语言的界面共同消费。 */
+export function getMissionEffectKey(type: MissionNodeType, rewardLevel?: 1 | 2): MissionEffectKey {
+  if (type !== "INTEL") return type;
+  if (rewardLevel === 1) return "INTEL_1";
+  if (rewardLevel === 2) return "INTEL_2";
+  return "INTEL_GENERIC";
+}
+
 /**
  * INTEL 奖励取决于此前实际完成次数，而不是节点位于任务网络中的顺序。
  * 不传 rewardLevel 时返回适合静态节点元数据的通用说明。
  */
 export function getMissionEffectDescription(type: MissionNodeType, rewardLevel?: 1 | 2): string {
-  if (type !== "INTEL") return missionEffectDescriptions[type];
-  if (rewardLevel === 1) return "补齐后续任务全部雷达，并精确核实坐标与型号";
-  if (rewardLevel === 2) return "授权 TOTAL INTEL，开放真实雷达覆盖与完整敌方态势";
-  return missionEffectDescriptions.INTEL;
+  const key = getMissionEffectKey(type, rewardLevel);
+  if (key === "INTEL_1") return "补齐后续任务全部雷达，并精确核实坐标与型号";
+  if (key === "INTEL_2") return "授权 TOTAL INTEL，开放真实雷达覆盖与完整敌方态势";
+  if (key === "INTEL_GENERIC") return missionEffectDescriptions.INTEL;
+  return missionEffectDescriptions[key];
 }
 
 export function getMissionAlertDelta(succeeded: boolean): number {
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/i18n/I18n.test.tsx ./src/i18n/I18n.test.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/i18n/I18n.test.tsx	1970-01-01 08:00:00
+++ ./src/i18n/I18n.test.tsx	2026-09-02 23:21:24
@@ -0,0 +1,84 @@
+import { cleanup, fireEvent, render, screen } from "@testing-library/react";
+import { afterEach, describe, expect, it } from "vitest";
+import {
+  I18nProvider,
+  localeCatalogs,
+  localizeBriefingNote,
+  useI18n,
+} from "./I18n";
+
+afterEach(() => {
+  cleanup();
+  localStorage.clear();
+});
+
+function LanguageProbe() {
+  const { language, setLanguage, copy } = useI18n();
+  return <>
+    <span>{copy.campaign.title}</span>
+    <button onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>{copy.app.languageButton}</button>
+  </>;
+}
+
+function collectKeyPaths(value: unknown, prefix = ""): string[] {
+  if (Array.isArray(value)) return value.flatMap((item, index) => collectKeyPaths(item, `${prefix}.${index}`));
+  if (value && typeof value === "object") {
+    return Object.entries(value).flatMap(([key, nested]) => collectKeyPaths(nested, prefix ? `${prefix}.${key}` : key));
+  }
+  return [prefix];
+}
+
+function collectStrings(value: unknown, prefix = ""): Array<[string, string]> {
+  if (Array.isArray(value)) return value.flatMap((item, index) => collectStrings(item, `${prefix}.${index}`));
+  if (value && typeof value === "object") {
+    return Object.entries(value).flatMap(([key, nested]) => collectStrings(nested, prefix ? `${prefix}.${key}` : key));
+  }
+  return typeof value === "string" ? [[prefix, value]] : [];
+}
+
+describe("游戏界面国际化", () => {
+  it("中英文目录结构完全一致", () => {
+    expect(collectKeyPaths(localeCatalogs.en)).toEqual(collectKeyPaths(localeCatalogs.zh));
+    const untranslatedEnglish = collectStrings(localeCatalogs.en)
+      .filter(([path, value]) => path !== "app.languageButton" && /[\u3400-\u9fff]/u.test(value));
+    expect(untranslatedEnglish).toEqual([]);
+  });
+
+  it("切换语言会立即更新界面、根语言标记和独立偏好", () => {
+    render(<I18nProvider initialLanguage="zh"><LanguageProbe /></I18nProvider>);
+    expect(screen.getByText("任务网络")).toBeInTheDocument();
+    fireEvent.click(screen.getByRole("button", { name: "EN" }));
+    expect(screen.getByText("MISSION NETWORK")).toBeInTheDocument();
+    expect(document.documentElement.lang).toBe("en");
+    expect(localStorage.getItem("f117-tactical-command-system:language:v1")).toBe("en");
+  });
+
+  it("既有存档中的静态与动态部署记录均可翻译", () => {
+    expect(localizeBriefingNote("山地出口增设搜索覆盖", "en")).toBe(
+      "Additional search coverage positioned at the mountain exit",
+    );
+    expect(localizeBriefingNote("Enemy Alert 22：增援警戒雷达部署", "en")).toBe(
+      "ENEMY ALERT 22: reinforcement surveillance radar deployed",
+    );
+    expect(localizeBriefingNote("南部历史航路部署自适应截击雷达", "en")).toBe(
+      "Adaptive interceptor radar deployed along the historical southern route",
+    );
+    const currentBriefingNotes = [
+      "最终目标启用分层防空戒备",
+      "目标区后备火控雷达上线",
+      "低 Enemy Alert：未触发警戒增援",
+      "历史航迹未形成高可信反制画像",
+      "Command Strike 战果削弱最终指挥链",
+      "情报战果已核实最终目标雷达坐标与型号",
+      "山地出口增设搜索覆盖",
+      "南部航路搜索加强",
+      "北部航路搜索加强",
+      "直达目标轴线增加拦截覆盖",
+      "Enemy Alert 22：增援警戒雷达部署",
+      "北部历史航路部署自适应截击雷达",
+    ];
+    currentBriefingNotes.forEach((note) => {
+      expect(localizeBriefingNote(note, "en")).not.toMatch(/[\u3400-\u9fff]/u);
+    });
+  });
+});
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/i18n/I18n.tsx ./src/i18n/I18n.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/i18n/I18n.tsx	1970-01-01 08:00:00
+++ ./src/i18n/I18n.tsx	2026-09-02 23:14:27
@@ -0,0 +1,676 @@
+import {
+  createContext,
+  useContext,
+  useEffect,
+  useMemo,
+  useState,
+  type ReactNode,
+} from "react";
+
+export type Language = "zh" | "en";
+
+const languageStorageKey = "f117-tactical-command-system:language:v1";
+
+/**
+ * 玩家界面的唯一文案目录。领域层继续保存稳定枚举和值，渲染层在最后一步完成本地化，
+ * 避免语言选择进入任务存档、Seed 或模拟计算。
+ */
+export const localeCatalogs = {
+  zh: {
+    common: {
+      none: "无",
+      unknown: "未知",
+      valid: "有效",
+      lost: "失联",
+      countUnit: "个",
+      taskTimePrefix: "任务 T+",
+      sentencePeriod: "。",
+    },
+    app: {
+      fatalState: "任务会话初始化失败",
+      aircraftSilhouette: "F-117 侧面剪影",
+      instructions: "操作说明",
+      soundOn: "声音开启",
+      soundOff: "声音关闭",
+      volume: "音量",
+      volumeLabel: "游戏音效音量",
+      operationCode: "行动代码",
+      initializeNetwork: "初始化任务网络",
+      switchLanguage: "切换为英文",
+      languageButton: "EN",
+    },
+    campaign: {
+      kicker: "任务网络控制",
+      title: "任务网络",
+      enemyAlert: "敌方警戒",
+      intelAccess: "情报权限",
+      radarCoverage: "雷达覆盖",
+      radarScan: "雷达扫描",
+      commandLink: "指挥链路",
+      enemyAdaptation: "敌方适应",
+      graphLabel: "任务节点连线",
+      previewKicker: "任务预览",
+      missionCode: "任务代号",
+      estimatedRadars: "预估雷达数量",
+      weather: "天气",
+      limitedIntelligence: "有限情报",
+      radarIdentificationVerified: "雷达识别已核实",
+      totalIntelligenceAccess: "全域情报已授权",
+      finalStrikeWarning: "最终目标防空序列持续重构，部署态势将在出击时确认。",
+      historicalAnalysis: "敌方历史分析",
+      terrainUse: "地形利用",
+      southern: "南部",
+      northern: "北部",
+      routePreference: "航路偏好",
+      directRouting: "直达倾向",
+      debriefMission: "复盘任务",
+      missionCompleted: "任务已完成",
+      networkCompleted: "任务网络完成",
+      networkTerminated: "任务网络终止 // 飞机损失",
+      previewMission: "预览任务",
+      planMission: "规划任务",
+      effect: {
+        INTEL_GENERIC: "根据当前情报权限补齐雷达识别或授权完整敌方态势",
+        INTEL_1: "补齐后续任务全部雷达，并精确核实坐标与型号",
+        INTEL_2: "授权 TOTAL INTEL，开放真实雷达覆盖与完整敌方态势",
+        STRIKE: "打击敌雷达保障节点，降低后续雷达扫描速率",
+        SEAD: "压制敌防空节点，缩小后续雷达覆盖范围",
+        COMMAND_STRIKE: "打击敌指挥链，削弱后续协同搜索与联合跟踪能力",
+        FINAL_STRIKE: "对最终目标实施纵深精确打击",
+      },
+    },
+    control: {
+      kicker: "任务控制",
+      status: {
+        PLANNING: "规划任务",
+        RUNNING: "任务执行",
+        SUCCESS: "任务成功",
+        FAILED: "任务失败",
+      },
+      statusMessage: {
+        PLANNING: "等待航线确认",
+        RUNNING: "航电系统在线",
+        SUCCESS: "任务目标达成",
+        FAILED: "任务终止",
+      },
+      returnNetwork: "返回任务网络",
+      confirmRoute: "确认航线",
+      resetRoute: "重置航线",
+      debriefMission: "复盘任务",
+      targetDesignation: "目标标定",
+      targetDestroyed: "目标摧毁 // 转入撤离航段",
+      targetValid: "目标有效",
+      extractionDistance: "撤离区距离",
+      targetDistance: "目标距离",
+      weaponStatus: "武器状态",
+      weaponReleased: "已投放",
+      weaponReady: "待命",
+      waypointSequence: "航点序列",
+      plannedDistance: "规划总航程",
+      remainingDistance: "剩余航程",
+      moveUp: "上移",
+      moveDown: "下移",
+      remove: "删除",
+      routeHint: "点击地图添加航点，拖动航点调整位置。任务执行中仅可调整当前目标之后的航点。",
+    },
+    guide: {
+      kicker: "操作指令",
+      title: "操作说明",
+      close: "关闭操作说明",
+      liveWarning: "任务执行中 // 作战进程未中断",
+      sections: [
+        ["作战目标", "规划 F-117 航线，进入目标空域完成打击，并安全抵达东北撤离区。"],
+        ["任务网络", "三个阶段均需二选一，随后执行最终打击。锁定任务可以预览当前研判，但不能执行。"],
+        ["确认航线", "点击地图添加、拖动或排序航点。确认后任务不可暂停、重置或中途返回任务网络。"],
+        ["实时调整", "飞行中可继续添加航点，并调整当前目标航点之后的路线；已飞路径不可修改。"],
+        ["有限情报", "初始报告可能遗漏雷达，坐标与覆盖也存在误差。第一次完成 INTEL 将补齐全部雷达并核实坐标和型号；第二次授权 TOTAL INTEL。若放弃首次 INTEL，本次行动将无法取得第二级权限。"],
+        ["任务效果", "STRIKE 降低后续雷达扫描速率；SEAD 缩小覆盖；COMMAND STRIKE 削弱协同搜索和联合跟踪；INTEL 改变可见信息，不强化飞机。"],
+        ["敌方响应", "ENEMY ALERT 会在每次任务后上升，失败造成的增幅更大并扩大后续雷达范围；敌方还会根据已飞航迹调整后续部署。"],
+        ["环境与航程", "地形和恶劣天气可降低探测概率，但天气也会降低飞行速度。燃油按实际飞行距离消耗，出动前预报以任务 T+30/60/90 秒为固定时刻。"],
+        ["生存规则", "THREAT WARNING 表示当前跟踪与火控威胁。利用转向、距离、地形和天气切断新 Contact；导弹来袭后必须尽快脱离持续照射。"],
+        ["任务结果", "只有摧毁目标并成功撤离才算完成。失败可返回任务网络重试或改选；成功任务可用任务视角或全景视角复盘。"],
+      ],
+    },
+    mapElements: {
+      title: "地图元素",
+      missionObjectives: "任务目标",
+      route: "航线",
+      environment: "环境",
+      radar: "雷达",
+      aircraftDetail: "己方机位 · 航向与位置实时更新",
+      targetDetail: "指定目标 · 武器释放圈",
+      extraction: "撤离区",
+      extractionDetail: "指定撤离空域",
+      waypoint: "航点",
+      navigationPoint: "导航控制点",
+      mountain: "山地",
+      radarMasking: "雷达遮蔽",
+      terrainCover: "地形掩护区",
+      signalAttenuation: "信号衰减",
+      dynamicWeatherCell: "动态气象单元",
+      realPosition: "真实位置",
+      range: "范围",
+      verified: "坐标与型号已核实",
+      positionError: "位置误差",
+    },
+    forecast: {
+      title: "天气预报",
+      cells: "气象单元",
+      expired: "出动前预报时效已结束",
+      confidence: "可信度",
+      estimatedArea: "预计区域",
+    },
+    mission: {
+      threatWarning: "威胁告警",
+      impactCountdown: "撞击倒计时",
+      evade: "规避机动 · 脱离照射",
+      radiationThreat: "辐射威胁",
+      fuelRange: "燃油航程",
+      availableRange: "可用航程",
+      flightStatus: "飞行状态",
+      flightTime: "飞行时间",
+      coordinates: "坐标",
+      heading: "航向",
+      speed: "速度",
+      weatherSpeedLoss: "气象速度损失",
+      currentWaypoint: "当前航点",
+      missionIntel: "任务情报",
+      knownRadarIntel: "已知雷达情报",
+      unlocatedSignals: "未定位信号",
+      adaptationStatus: "敌方适应状态",
+      radarScanRate: "雷达扫描速率",
+      counterDeployment: "反制部署",
+      finalDefenseBriefing: "最终防御简报",
+      enemySystemState: "敌方系统状态",
+      internal: "内部",
+      structuredEvents: "结构化事件",
+      waitingEvents: "等待操作事件…",
+      airDefenseCommander: "防空指挥官",
+      alert: "警戒",
+      radarOperatorAi: "雷达操作员 AI",
+      utility: "效用值",
+      totalIntelOn: "TOTAL INTEL 开启",
+      totalIntelOff: "TOTAL INTEL 关闭",
+    },
+    intelligence: {
+      kicker: "当前研判",
+      title: "预览任务",
+      hint: "只读情报研判 // 任务尚未授权执行",
+      status: "当前研判",
+    },
+    debrief: {
+      kicker: "任务复盘",
+      title: "复盘任务",
+      snapshot: "成功撤离快照",
+      missionTime: "任务时间",
+      finalCoordinates: "最终坐标",
+      remainingFuel: "剩余燃油",
+      intelAccess: "情报权限",
+      missionView: "切换任务视角",
+      panoramicView: "切换全景复盘",
+      missionViewStatus: "任务视角",
+      panoramicViewStatus: "全景复盘",
+      enemySystemAnalysis: "敌方系统分析",
+      frozen: "冻结",
+    },
+    stage: {
+      title: {
+        MISSION: "战术区域 // 1000 × 1000",
+        INTELLIGENCE: "任务情报",
+        DEBRIEF: "任务复盘",
+      },
+      enemyInternal: "敌方内部状态",
+      limitedPlanning: "有限情报任务规划",
+      aircraftFinalPosition: "F-117 最终位置",
+      waypoint: "航点",
+      extraction: "撤离区",
+      realRadarContact: "真实雷达 / 敌方 Contact",
+      missionRadarIntel: "任务雷达情报",
+      radarIntelError: "雷达情报 / 误差区",
+    },
+    enemy: {
+      enemyAlert: "敌方警戒",
+      activeContact: "有效 Contact",
+      beliefPeak: "Belief 峰值",
+      commander: "指挥官",
+      commandEfficiency: "指挥链效率",
+      radarCount: "雷达数量",
+      estimatedPosition: "推测位置",
+    },
+    canvas: {
+      mapLabel: "战术航线地图",
+      extraction: "撤离区",
+      target: "目标",
+      destroyed: "已摧毁",
+      terrainMasking: "地形遮蔽",
+    },
+    enums: {
+      missionType: {
+        INTEL: "情报行动",
+        STRIKE: "打击",
+        SEAD: "防空压制",
+        COMMAND_STRIKE: "指挥打击",
+        FINAL_STRIKE: "最终打击",
+      },
+      campaignStatus: {
+        AVAILABLE: "可执行",
+        LOCKED: "未解锁",
+        COMPLETED: "已完成",
+        FAILED: "失败",
+        EXPIRED: "已失效",
+      },
+      waypointStatus: { LOCKED: "锁定", PENDING: "待飞", COMPLETED: "完成" },
+      weatherKind: { CLOUD: "云层", RAIN: "降雨", STORM: "风暴", FOG: "雾区" },
+      weatherTrend: { 增强: "增强", 稳定: "稳定", 减弱: "减弱" },
+      confidence: { 高: "高", 中: "中", 低: "低" },
+      radarType: { EARLY_WARNING: "预警", ACQUISITION: "搜索", FIRE_CONTROL: "火控" },
+      radarIntelLevel: { CONFIRMED: "已确认", PROBABLE: "很可能", POSSIBLE: "可能", UNKNOWN: "未知" },
+      operatorMode: { WIDE_SEARCH: "广域搜索", SECTOR_SEARCH: "扇区搜索", FOCUSED_TRACK: "聚焦跟踪" },
+      awarenessStage: { CALM: "平静", SUSPICIOUS: "怀疑", SEARCHING: "搜索", HUNTING: "猎杀" },
+      commanderIntent: { MONITOR: "持续监视", COORDINATED_SEARCH: "协同搜索", CONCENTRATE_SEARCH: "集中搜索" },
+      threatStage: {
+        UNDETECTED: "未发现异常",
+        SUSPECTED: "疑似搜索活动",
+        TRACKED: "持续照射 / 正在跟踪",
+        LOCKED: "火控锁定",
+        MISSILE_INBOUND: "导弹来袭",
+      },
+      adaptationStatus: { LOW: "低", ACTIVE: "活跃", HIGH: "高" },
+      eventType: {
+        WAYPOINT_ADDED: "新增航点",
+        WAYPOINT_MOVED: "调整航点",
+        WAYPOINT_REMOVED: "删除航点",
+        WAYPOINT_REORDERED: "航点排序",
+        MISSION_STARTED: "开始执行",
+        MISSION_PAUSED: "任务暂停",
+        MISSION_RESUMED: "继续执行",
+        MISSION_RESET: "任务重置",
+        WAYPOINT_REACHED: "抵达航点",
+        ROUTE_COMPLETED: "航线完成",
+        RADAR_CONTACT: "雷达接触",
+        RADAR_MODE_CHANGED: "雷达模式切换",
+        AWARENESS_STAGE_CHANGED: "警戒阶段变化",
+        COMMANDER_ORDER: "指挥官命令",
+        ATTACK: "武器投放",
+        EXTRACTION: "进入撤离区",
+        MISSION_SUCCESS: "任务成功",
+        MISSION_FAILED: "任务失败",
+        THREAT_STAGE_CHANGED: "威胁阶段变化",
+        MISSILE_LAUNCHED: "导弹发射",
+        MISSILE_DEFEATED: "导弹脱锁",
+        AIRCRAFT_DESTROYED: "飞机损毁",
+        FUEL_EXHAUSTED: "燃油耗尽",
+      },
+    },
+  },
+  en: {
+    common: {
+      none: "NONE",
+      unknown: "UNKNOWN",
+      valid: "VALID",
+      lost: "LOST",
+      countUnit: "",
+      taskTimePrefix: "MISSION T+",
+      sentencePeriod: ".",
+    },
+    app: {
+      fatalState: "MISSION SESSION INITIALIZATION FAILED",
+      aircraftSilhouette: "F-117 SIDE SILHOUETTE",
+      instructions: "OPERATING INSTRUCTIONS",
+      soundOn: "SOUND ON",
+      soundOff: "SOUND OFF",
+      volume: "VOL",
+      volumeLabel: "Game audio volume",
+      operationCode: "OPERATION CODE",
+      initializeNetwork: "INITIALIZE MISSION NETWORK",
+      switchLanguage: "Switch to Chinese",
+      languageButton: "中文",
+    },
+    campaign: {
+      kicker: "MISSION NETWORK CONTROL",
+      title: "MISSION NETWORK",
+      enemyAlert: "ENEMY ALERT",
+      intelAccess: "INTEL ACCESS",
+      radarCoverage: "RADAR COVERAGE",
+      radarScan: "RADAR SCAN",
+      commandLink: "CMD LINK",
+      enemyAdaptation: "ENEMY ADAPTATION",
+      graphLabel: "Mission node connections",
+      previewKicker: "MISSION PREVIEW",
+      missionCode: "MISSION CODE",
+      estimatedRadars: "ESTIMATED RADARS",
+      weather: "WEATHER",
+      limitedIntelligence: "LIMITED INTELLIGENCE",
+      radarIdentificationVerified: "RADAR IDENTIFICATION VERIFIED",
+      totalIntelligenceAccess: "TOTAL INTELLIGENCE ACCESS",
+      finalStrikeWarning: "Final-target air defenses continue to reorganize. Deployment will be confirmed at launch.",
+      historicalAnalysis: "ENEMY HISTORICAL ANALYSIS",
+      terrainUse: "TERRAIN USE",
+      southern: "SOUTHERN",
+      northern: "NORTHERN",
+      routePreference: "ROUTE PREFERENCE",
+      directRouting: "DIRECT ROUTING",
+      debriefMission: "DEBRIEF MISSION",
+      missionCompleted: "MISSION COMPLETED",
+      networkCompleted: "MISSION NETWORK COMPLETED",
+      networkTerminated: "MISSION NETWORK TERMINATED // AIRCRAFT LOST",
+      previewMission: "PREVIEW MISSION",
+      planMission: "PLAN MISSION",
+      effect: {
+        INTEL_GENERIC: "Complete radar identification or authorize full enemy-system access at the current intelligence tier",
+        INTEL_1: "Reveal every radar in subsequent missions and verify its coordinates and type",
+        INTEL_2: "Authorize TOTAL INTEL with true radar coverage and complete enemy-system state",
+        STRIKE: "Strike radar-support infrastructure to reduce subsequent radar scan rate",
+        SEAD: "Suppress air-defense nodes to reduce subsequent radar coverage",
+        COMMAND_STRIKE: "Disrupt the command chain to weaken coordinated search and joint tracking",
+        FINAL_STRIKE: "Conduct a deep precision strike against the final objective",
+      },
+    },
+    control: {
+      kicker: "MISSION CONTROL",
+      status: {
+        PLANNING: "PLAN MISSION",
+        RUNNING: "MISSION EXECUTION",
+        SUCCESS: "MISSION SUCCESS",
+        FAILED: "MISSION FAILED",
+      },
+      statusMessage: {
+        PLANNING: "AWAITING ROUTE CONFIRMATION",
+        RUNNING: "AVIONICS ONLINE",
+        SUCCESS: "MISSION OBJECTIVE ACHIEVED",
+        FAILED: "MISSION TERMINATED",
+      },
+      returnNetwork: "RETURN TO MISSION NETWORK",
+      confirmRoute: "CONFIRM ROUTE",
+      resetRoute: "RESET ROUTE",
+      debriefMission: "DEBRIEF MISSION",
+      targetDesignation: "TARGET DESIGNATION",
+      targetDestroyed: "TARGET DESTROYED // PROCEED TO EXTRACTION",
+      targetValid: "TARGET VALID",
+      extractionDistance: "DISTANCE TO EXTRACTION",
+      targetDistance: "DISTANCE TO TARGET",
+      weaponStatus: "WEAPON STATUS",
+      weaponReleased: "RELEASED",
+      weaponReady: "READY",
+      waypointSequence: "WAYPOINT SEQUENCE",
+      plannedDistance: "PLANNED DISTANCE",
+      remainingDistance: "REMAINING DISTANCE",
+      moveUp: "MOVE UP",
+      moveDown: "MOVE DOWN",
+      remove: "DELETE",
+      routeHint: "Click the map to add waypoints and drag to reposition them. During execution, only waypoints beyond the current target may be changed.",
+    },
+    guide: {
+      kicker: "OPERATING INSTRUCTIONS",
+      title: "OPERATING INSTRUCTIONS",
+      close: "Close operating instructions",
+      liveWarning: "MISSION IN PROGRESS // OPERATION CONTINUES",
+      sections: [
+        ["OBJECTIVE", "Plan the F-117 route, strike the designated target area, and reach the extraction zone in the northeast."],
+        ["MISSION NETWORK", "Choose one of two missions in each of three stages, then conduct the final strike. Locked missions may be previewed but not executed."],
+        ["ROUTE CONFIRMATION", "Click the map to add, drag, or reorder waypoints. Once confirmed, the mission cannot be paused, reset, or abandoned for the mission network."],
+        ["REAL-TIME ADJUSTMENT", "During flight, you may add waypoints and modify the route beyond the current target waypoint. The flown route cannot be changed."],
+        ["LIMITED INTELLIGENCE", "Initial reports may omit radars and misestimate coordinates or coverage. The first INTEL mission reveals all radars and verifies coordinates and types; the second authorizes TOTAL INTEL. Skipping the first INTEL prevents access to the second tier in this run."],
+        ["MISSION EFFECTS", "STRIKE reduces subsequent radar scan rate; SEAD reduces coverage; COMMAND STRIKE weakens coordinated search and joint tracking; INTEL changes visible information without upgrading the aircraft."],
+        ["ENEMY RESPONSE", "ENEMY ALERT rises after every mission. Failure causes a larger increase and expands subsequent radar ranges. The enemy also adapts future deployments to observed flight paths."],
+        ["ENVIRONMENT AND RANGE", "Terrain and severe weather reduce detection probability, but weather also slows the aircraft. Fuel is consumed by actual distance flown; preflight forecasts refer to fixed mission times T+30/60/90 seconds."],
+        ["SURVIVAL", "THREAT WARNING shows current tracking and fire-control danger. Use turns, distance, terrain, and weather to break new Contacts; once a missile is inbound, leave sustained illumination quickly."],
+        ["MISSION RESULT", "A mission succeeds only after the target is destroyed and the aircraft extracts. Failed missions may be retried or replaced; successful missions support mission-view and panoramic debriefs."],
+      ],
+    },
+    mapElements: {
+      title: "MAP ELEMENTS",
+      missionObjectives: "MISSION OBJECTIVES",
+      route: "ROUTE",
+      environment: "ENVIRONMENT",
+      radar: "RADAR",
+      aircraftDetail: "Friendly aircraft · heading and position update in real time",
+      targetDetail: "Designated target · weapon release radius",
+      extraction: "EXTRACTION",
+      extractionDetail: "Designated extraction airspace",
+      waypoint: "WAYPOINT",
+      navigationPoint: "Navigation control point",
+      mountain: "MOUNTAIN",
+      radarMasking: "RADAR MASKING",
+      terrainCover: "Terrain cover zone",
+      signalAttenuation: "SIGNAL ATTENUATION",
+      dynamicWeatherCell: "Dynamic weather cell",
+      realPosition: "TRUE POSITION",
+      range: "RANGE",
+      verified: "Coordinates and type verified",
+      positionError: "POSITION ERROR",
+    },
+    forecast: {
+      title: "WEATHER FORECAST",
+      cells: "CELLS",
+      expired: "PREFLIGHT FORECAST WINDOW EXPIRED",
+      confidence: "CONFIDENCE",
+      estimatedArea: "ESTIMATED AREA",
+    },
+    mission: {
+      threatWarning: "THREAT WARNING",
+      impactCountdown: "IMPACT COUNTDOWN",
+      evade: "EVADE · BREAK ILLUMINATION",
+      radiationThreat: "RADIATION THREAT",
+      fuelRange: "FUEL RANGE",
+      availableRange: "AVAILABLE RANGE",
+      flightStatus: "FLIGHT STATUS",
+      flightTime: "FLIGHT TIME",
+      coordinates: "COORDINATES",
+      heading: "HEADING",
+      speed: "SPEED",
+      weatherSpeedLoss: "WEATHER SPEED LOSS",
+      currentWaypoint: "CURRENT WAYPOINT",
+      missionIntel: "MISSION INTEL",
+      knownRadarIntel: "KNOWN RADAR INTEL",
+      unlocatedSignals: "UNLOCATED SIGNALS",
+      adaptationStatus: "ENEMY ADAPTATION",
+      radarScanRate: "RADAR SCAN RATE",
+      counterDeployment: "COUNTER DEPLOYMENT",
+      finalDefenseBriefing: "FINAL DEFENSE BRIEFING",
+      enemySystemState: "ENEMY SYSTEM STATE",
+      internal: "INTERNAL",
+      structuredEvents: "STRUCTURED EVENTS",
+      waitingEvents: "AWAITING OPERATION EVENTS…",
+      airDefenseCommander: "AIR DEFENSE COMMANDER",
+      alert: "ALERT",
+      radarOperatorAi: "RADAR OPERATOR AI",
+      utility: "UTILITY",
+      totalIntelOn: "TOTAL INTEL ON",
+      totalIntelOff: "TOTAL INTEL OFF",
+    },
+    intelligence: {
+      kicker: "CURRENT ESTIMATE",
+      title: "PREVIEW MISSION",
+      hint: "READ-ONLY INTELLIGENCE ASSESSMENT // EXECUTION NOT AUTHORIZED",
+      status: "CURRENT ESTIMATE",
+    },
+    debrief: {
+      kicker: "MISSION DEBRIEF",
+      title: "DEBRIEF MISSION",
+      snapshot: "SUCCESSFUL EXTRACTION SNAPSHOT",
+      missionTime: "MISSION TIME",
+      finalCoordinates: "FINAL COORDINATES",
+      remainingFuel: "REMAINING FUEL",
+      intelAccess: "INTEL ACCESS",
+      missionView: "SWITCH TO MISSION VIEW",
+      panoramicView: "SWITCH TO PANORAMIC DEBRIEF",
+      missionViewStatus: "MISSION VIEW",
+      panoramicViewStatus: "PANORAMIC DEBRIEF",
+      enemySystemAnalysis: "ENEMY SYSTEM ANALYSIS",
+      frozen: "FROZEN",
+    },
+    stage: {
+      title: {
+        MISSION: "TACTICAL AREA // 1000 × 1000",
+        INTELLIGENCE: "MISSION INTELLIGENCE",
+        DEBRIEF: "MISSION DEBRIEF",
+      },
+      enemyInternal: "ENEMY INTERNAL STATE",
+      limitedPlanning: "LIMITED-INTELLIGENCE MISSION PLANNING",
+      aircraftFinalPosition: "F-117 FINAL POSITION",
+      waypoint: "WAYPOINT",
+      extraction: "EXTRACTION",
+      realRadarContact: "TRUE RADAR / ENEMY CONTACT",
+      missionRadarIntel: "MISSION RADAR INTEL",
+      radarIntelError: "RADAR INTEL / ERROR ZONE",
+    },
+    enemy: {
+      enemyAlert: "ENEMY ALERT",
+      activeContact: "ACTIVE CONTACTS",
+      beliefPeak: "BELIEF PEAK",
+      commander: "COMMANDER",
+      commandEfficiency: "COMMAND-LINK EFFICIENCY",
+      radarCount: "RADAR COUNT",
+      estimatedPosition: "ESTIMATED POSITION",
+    },
+    canvas: {
+      mapLabel: "Tactical route map",
+      extraction: "EXTRACTION",
+      target: "TARGET",
+      destroyed: "DESTROYED",
+      terrainMasking: "TERRAIN MASKING",
+    },
+    enums: {
+      missionType: {
+        INTEL: "INTEL",
+        STRIKE: "STRIKE",
+        SEAD: "SEAD",
+        COMMAND_STRIKE: "COMMAND STRIKE",
+        FINAL_STRIKE: "FINAL STRIKE",
+      },
+      campaignStatus: {
+        AVAILABLE: "AVAILABLE",
+        LOCKED: "LOCKED",
+        COMPLETED: "COMPLETED",
+        FAILED: "FAILED",
+        EXPIRED: "EXPIRED",
+      },
+      waypointStatus: { LOCKED: "LOCKED", PENDING: "PENDING", COMPLETED: "COMPLETED" },
+      weatherKind: { CLOUD: "CLOUD", RAIN: "RAIN", STORM: "STORM", FOG: "FOG" },
+      weatherTrend: { 增强: "INTENSIFYING", 稳定: "STABLE", 减弱: "WEAKENING" },
+      confidence: { 高: "HIGH", 中: "MEDIUM", 低: "LOW" },
+      radarType: { EARLY_WARNING: "EARLY WARNING", ACQUISITION: "ACQUISITION", FIRE_CONTROL: "FIRE CONTROL" },
+      radarIntelLevel: { CONFIRMED: "CONFIRMED", PROBABLE: "PROBABLE", POSSIBLE: "POSSIBLE", UNKNOWN: "UNKNOWN" },
+      operatorMode: { WIDE_SEARCH: "WIDE SEARCH", SECTOR_SEARCH: "SECTOR SEARCH", FOCUSED_TRACK: "FOCUSED TRACK" },
+      awarenessStage: { CALM: "CALM", SUSPICIOUS: "SUSPICIOUS", SEARCHING: "SEARCHING", HUNTING: "HUNTING" },
+      commanderIntent: { MONITOR: "MONITOR", COORDINATED_SEARCH: "COORDINATED SEARCH", CONCENTRATE_SEARCH: "CONCENTRATE SEARCH" },
+      threatStage: {
+        UNDETECTED: "NO ANOMALY DETECTED",
+        SUSPECTED: "POSSIBLE SEARCH ACTIVITY",
+        TRACKED: "SUSTAINED ILLUMINATION / TRACKING",
+        LOCKED: "FIRE-CONTROL LOCK",
+        MISSILE_INBOUND: "MISSILE INBOUND",
+      },
+      adaptationStatus: { LOW: "LOW", ACTIVE: "ACTIVE", HIGH: "HIGH" },
+      eventType: {
+        WAYPOINT_ADDED: "WAYPOINT ADDED",
+        WAYPOINT_MOVED: "WAYPOINT MOVED",
+        WAYPOINT_REMOVED: "WAYPOINT REMOVED",
+        WAYPOINT_REORDERED: "WAYPOINT REORDERED",
+        MISSION_STARTED: "MISSION STARTED",
+        MISSION_PAUSED: "MISSION PAUSED",
+        MISSION_RESUMED: "MISSION RESUMED",
+        MISSION_RESET: "MISSION RESET",
+        WAYPOINT_REACHED: "WAYPOINT REACHED",
+        ROUTE_COMPLETED: "ROUTE COMPLETED",
+        RADAR_CONTACT: "RADAR CONTACT",
+        RADAR_MODE_CHANGED: "RADAR MODE CHANGED",
+        AWARENESS_STAGE_CHANGED: "ALERT STAGE CHANGED",
+        COMMANDER_ORDER: "COMMANDER ORDER",
+        ATTACK: "WEAPON RELEASE",
+        EXTRACTION: "ENTERED EXTRACTION ZONE",
+        MISSION_SUCCESS: "MISSION SUCCESS",
+        MISSION_FAILED: "MISSION FAILED",
+        THREAT_STAGE_CHANGED: "THREAT STAGE CHANGED",
+        MISSILE_LAUNCHED: "MISSILE LAUNCHED",
+        MISSILE_DEFEATED: "MISSILE LOCK BROKEN",
+        AIRCRAFT_DESTROYED: "AIRCRAFT DESTROYED",
+        FUEL_EXHAUSTED: "FUEL EXHAUSTED",
+      },
+    },
+  },
+} as const;
+
+export type LocaleCatalog = (typeof localeCatalogs)[Language];
+
+interface I18nContextValue {
+  language: Language;
+  setLanguage: (language: Language) => void;
+  copy: LocaleCatalog;
+}
+
+const defaultContext: I18nContextValue = {
+  language: "zh",
+  setLanguage: () => undefined,
+  copy: localeCatalogs.zh,
+};
+
+const I18nContext = createContext<I18nContextValue>(defaultContext);
+
+function loadLanguage(): Language {
+  try {
+    return localStorage.getItem(languageStorageKey) === "en" ? "en" : "zh";
+  } catch {
+    return "zh";
+  }
+}
+
+interface I18nProviderProps {
+  children: ReactNode;
+  initialLanguage?: Language;
+  persist?: boolean;
+}
+
+export function I18nProvider({ children, initialLanguage, persist = true }: I18nProviderProps) {
+  const [language, setLanguage] = useState<Language>(() => initialLanguage ?? loadLanguage());
+
+  useEffect(() => {
+    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
+    if (!persist) return;
+    try {
+      localStorage.setItem(languageStorageKey, language);
+    } catch {
+      // 语言切换不依赖浏览器存储；写入失败时仅在本次页面会话生效。
+    }
+  }, [language, persist]);
+
+  const value = useMemo<I18nContextValue>(() => ({
+    language,
+    setLanguage,
+    copy: localeCatalogs[language],
+  }), [language]);
+
+  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
+}
+
+export function useI18n(): I18nContextValue {
+  return useContext(I18nContext);
+}
+
+/** 兼容既有复盘存档中的中文部署记录，并将所有当前可生成记录映射为英文。 */
+export function localizeBriefingNote(note: string, language: Language): string {
+  if (language === "zh") return note;
+  const exactNotes: Record<string, string> = {
+    "最终目标启用分层防空戒备": "Layered air-defense readiness activated for the final objective",
+    "目标区后备火控雷达上线": "Reserve fire-control radar activated in the target area",
+    "低 Enemy Alert：未触发警戒增援": "Low ENEMY ALERT: no surveillance reinforcement deployed",
+    "历史航迹未形成高可信反制画像": "Historical flight paths have not formed a high-confidence countermeasure profile",
+    "Command Strike 战果削弱最终指挥链": "COMMAND STRIKE effects have degraded the final command chain",
+    "情报战果已核实最终目标雷达坐标与型号": "INTEL results have verified final-objective radar coordinates and types",
+    "山地出口增设搜索覆盖": "Additional search coverage positioned at the mountain exit",
+    "南部航路搜索加强": "Search coverage reinforced along the southern route",
+    "北部航路搜索加强": "Search coverage reinforced along the northern route",
+    "直达目标轴线增加拦截覆盖": "Interception coverage added along the direct target axis",
+  };
+  if (exactNotes[note]) return exactNotes[note];
+
+  const alertMatch = note.match(/^Enemy Alert (\d+)：增援警戒雷达部署$/);
+  if (alertMatch) return `ENEMY ALERT ${alertMatch[1]}: reinforcement surveillance radar deployed`;
+  const routeMatch = note.match(/^(南部|北部)历史航路部署自适应截击雷达$/);
+  if (routeMatch) {
+    const direction = routeMatch[1] === "南部" ? "southern" : "northern";
+    return `Adaptive interceptor radar deployed along the historical ${direction} route`;
+  }
+  return note;
+}
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/main.tsx ./src/main.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/main.tsx	2026-08-19 10:52:07
+++ ./src/main.tsx	2026-09-02 23:13:49
@@ -1,10 +1,13 @@
 import React from "react";
 import ReactDOM from "react-dom/client";
+import { I18nProvider } from "./i18n/I18n";
 import { App } from "./ui/App";
 import "./ui/styles.css";
 
 ReactDOM.createRoot(document.getElementById("root")!).render(
   <React.StrictMode>
-    <App />
+    <I18nProvider>
+      <App />
+    </I18nProvider>
   </React.StrictMode>,
 );
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/App.tsx ./src/ui/App.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/App.tsx	2026-09-02 23:00:53
+++ ./src/ui/App.tsx	2026-09-02 23:20:15
@@ -11,6 +11,7 @@
 import { IntelligenceWorkspace } from "./workspaces/IntelligenceWorkspace";
 import { MissionWorkspace } from "./workspaces/MissionWorkspace";
 import { GameplayGuide } from "./GameplayGuide";
+import { useI18n } from "../i18n/I18n";
 
 const workspaceViewStorageKey = "f117-tactical-command-system:view:v1";
 
@@ -27,6 +28,7 @@
 }
 
 export function App() {
+  const { language, setLanguage, copy } = useI18n();
   const { state, dispatch } = useGameController();
   const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
   const [showBelief, setShowBelief] = useState(false);
@@ -59,7 +61,7 @@
     }
   }, [campaignView]);
 
-  if (!mission) return <main className="fatal-state">任务会话初始化失败</main>;
+  if (!mission) return <main className="fatal-state">{copy.app.fatalState}</main>;
 
   const closeDebrief = () => {
     if (activeDebrief && mission.status === "SUCCESS" && state.campaign.currentNodeId === activeDebrief.nodeId) {
@@ -72,15 +74,24 @@
   return <main className="app-shell">
     <header className="topbar">
       <div className="brand-block">
-        <div className="brand-mark" aria-label="F-117 侧面剪影"><img className="brand-aircraft-silhouette" src={f117SideSilhouette} alt="" /></div>
+        <div className="brand-mark" aria-label={copy.app.aircraftSilhouette}><img className="brand-aircraft-silhouette" src={f117SideSilhouette} alt="" /></div>
         <div><h1>F-117 TACTICAL COMMAND SYSTEM</h1><p>FROM USA AIR FORCE // VERSION 1.0</p></div>
       </div>
       <div className="topbar-controls">
-        <button ref={guideTriggerRef} type="button" className="guide-trigger" onClick={() => setGuideOpen(true)}>操作说明</button>
+        <button
+          type="button"
+          className="language-trigger"
+          aria-label={copy.app.switchLanguage}
+          title={copy.app.switchLanguage}
+          onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
+        >
+          {copy.app.languageButton}
+        </button>
+        <button ref={guideTriggerRef} type="button" className="guide-trigger" onClick={() => setGuideOpen(true)}>{copy.app.instructions}</button>
         <div className="audio-control">
-          <button type="button" onClick={() => setMuted(!muted)}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
-          <label htmlFor="master-volume">VOL</label>
-          <input id="master-volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="游戏音效音量" />
+          <button type="button" onClick={() => setMuted(!muted)}>{muted ? copy.app.soundOff : copy.app.soundOn}</button>
+          <label htmlFor="master-volume">{copy.app.volume}</label>
+          <input id="master-volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label={copy.app.volumeLabel} />
         </div>
         <form className="seed-control" onSubmit={(event) => {
           event.preventDefault();
@@ -89,9 +100,9 @@
           setActiveDebrief(undefined);
           setCampaignView(true);
         }}>
-          <label htmlFor="run-seed">OPERATION CODE</label>
+          <label htmlFor="run-seed">{copy.app.operationCode}</label>
           <input id="run-seed" value={seedInput} onChange={(event) => setSeedInput(event.target.value)} />
-          <button type="submit">初始化任务网络</button>
+          <button type="submit">{copy.app.initializeNetwork}</button>
         </form>
       </div>
     </header>
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/CampaignMap.copy.test.tsx ./src/ui/CampaignMap.copy.test.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/CampaignMap.copy.test.tsx	2026-09-02 22:35:23
+++ ./src/ui/CampaignMap.copy.test.tsx	2026-09-02 23:19:13
@@ -2,6 +2,7 @@
 import { afterEach, describe, expect, it, vi } from "vitest";
 import { createRun } from "../domain/factories";
 import { CampaignMap } from "./CampaignMap";
+import { I18nProvider } from "../i18n/I18n";
 
 afterEach(cleanup);
 
@@ -11,10 +12,10 @@
     render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
     expect(screen.queryByText("INTEL QUALITY")).not.toBeInTheDocument();
     expect(screen.queryByText("情报可信度")).not.toBeInTheDocument();
-    expect(screen.getByText("RADAR COVERAGE")).toBeInTheDocument();
-    expect(screen.getByText("RADAR SCAN")).toBeInTheDocument();
-    expect(screen.getByText("ENEMY ADAPTATION")).toBeInTheDocument();
-    expect(screen.getByText("LOW")).toBeInTheDocument();
+    expect(screen.getByText("雷达覆盖")).toBeInTheDocument();
+    expect(screen.getByText("雷达扫描")).toBeInTheDocument();
+    expect(screen.getByText("敌方适应")).toBeInTheDocument();
+    expect(screen.getByText("低")).toBeInTheDocument();
   });
 
   it("可执行节点使用规划任务", () => {
@@ -59,5 +60,18 @@
     state.missionDebriefs[nodeId] = { nodeId, completedAt: 0, intelAccessTier: 0, mission };
     render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
     expect(screen.getByRole("button", { name: "复盘任务" })).toBeInTheDocument();
+  });
+
+  it("英文模式覆盖任务状态、奖励和操作入口", () => {
+    const state = createRun("CAMPAIGN-ENGLISH-COPY");
+    render(<I18nProvider initialLanguage="en" persist={false}>
+      <CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />
+    </I18nProvider>);
+
+    expect(screen.getByRole("heading", { name: "MISSION NETWORK" })).toBeInTheDocument();
+    expect(screen.getByText("RADAR COVERAGE")).toBeInTheDocument();
+    expect(screen.getAllByText("INTEL").length).toBeGreaterThan(0);
+    expect(screen.getByText(/Reveal every radar in subsequent missions/)).toBeInTheDocument();
+    expect(screen.getByRole("button", { name: "PLAN MISSION" })).toBeInTheDocument();
   });
 });
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/CampaignMap.tsx ./src/ui/CampaignMap.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/CampaignMap.tsx	2026-09-02 22:35:23
+++ ./src/ui/CampaignMap.tsx	2026-09-02 23:20:57
@@ -4,7 +4,8 @@
 import { getAdaptationAssessment } from "../domain/enemyAdaptation";
 import { getIntelAccessTier } from "../domain/intelAccess";
 import { prepareCampaignMission } from "../game/gameReducer";
-import { getMissionEffectDescription } from "../domain/campaignBalance";
+import { useI18n } from "../i18n/I18n";
+import { getMissionEffectKey } from "../domain/campaignBalance";
 
 interface CampaignMapProps {
   state: RunState;
@@ -14,15 +15,8 @@
   onDebrief: (debrief: MissionDebrief) => void;
 }
 
-const typeLabels = {
-  INTEL: "情报行动",
-  STRIKE: "打击",
-  SEAD: "防空压制",
-  COMMAND_STRIKE: "指挥打击",
-  FINAL_STRIKE: "最终打击",
-} as const;
-
 export function CampaignMap({ state, dispatch, onLaunch, onPreview, onDebrief }: CampaignMapProps) {
+  const { copy } = useI18n();
   const firstAvailable = state.campaign.nodes.find((node) => node.status === "AVAILABLE");
   const [selectedId, setSelectedId] = useState(
     state.campaign.currentNodeId ?? firstAvailable?.id ?? state.campaign.nodes[0]?.id ?? "",
@@ -46,18 +40,23 @@
   const canRetryFailedNode = selected?.status === "FAILED" && state.status !== "VICTORY";
   // FAILED 表示上次执行结果，同时也是合法重试入口；AVAILABLE 节点仍可改选。
   const canContinueRun = state.status === "ACTIVE" || hasAvailableNode || canRetryFailedNode;
+  const selectedEffect = selected
+    ? copy.campaign.effect[getMissionEffectKey(selected.type, selectedIntelRewardLevel)]
+    : "";
+  const selectedWeather = selected?.preview.weather.split(" + ").map((kind) =>
+    copy.enums.weatherKind[kind as keyof typeof copy.enums.weatherKind] ?? kind).join(" + ");
 
   return (
     <section className="campaign-screen">
       <div className="campaign-header">
-        <div><span className="section-kicker">MISSION NETWORK</span><h2>任务网络</h2></div>
+        <div><span className="section-kicker">{copy.campaign.kicker}</span><h2>{copy.campaign.title}</h2></div>
         <div className="campaign-resources">
-          <span>ENEMY ALERT <strong>{state.resources.enemyAlert}</strong></span>
-          <span>INTEL ACCESS <strong>{intelAccessTier}/2</strong></span>
-          <span>RADAR COVERAGE <strong>{(state.enemyState.radarCoverageModifier * 100).toFixed(0)}%</strong></span>
-          <span>RADAR SCAN <strong>{(state.enemyState.radarScanRateModifier * 100).toFixed(0)}%</strong></span>
-          <span>CMD LINK <strong>{(state.enemyState.commanderCoordinationModifier * 100).toFixed(0)}%</strong></span>
-          <span>ENEMY ADAPTATION <strong>{adaptation.status}</strong></span>
+          <span>{copy.campaign.enemyAlert} <strong>{state.resources.enemyAlert}</strong></span>
+          <span>{copy.campaign.intelAccess} <strong>{intelAccessTier}/2</strong></span>
+          <span>{copy.campaign.radarCoverage} <strong>{(state.enemyState.radarCoverageModifier * 100).toFixed(0)}%</strong></span>
+          <span>{copy.campaign.radarScan} <strong>{(state.enemyState.radarScanRateModifier * 100).toFixed(0)}%</strong></span>
+          <span>{copy.campaign.commandLink} <strong>{(state.enemyState.commanderCoordinationModifier * 100).toFixed(0)}%</strong></span>
+          <span>{copy.campaign.enemyAdaptation} <strong>{copy.enums.adaptationStatus[adaptation.status]}</strong></span>
         </div>
       </div>
       <div className="campaign-content">
@@ -65,7 +64,7 @@
           <svg
             viewBox="0 0 1000 600"
             preserveAspectRatio="none"
-            aria-label="任务节点连线"
+            aria-label={copy.campaign.graphLabel}
           >
             {state.campaign.edges.map((edge) => {
               const from = state.campaign.nodes.find((node) => node.id === edge.from)!;
@@ -81,28 +80,28 @@
               onClick={() => setSelectedId(node.id)}
             >
               <span>{node.id}</span>
-              <strong>{typeLabels[node.type]}</strong>
-              <small>{node.status}</small>
+              <strong>{copy.enums.missionType[node.type]}</strong>
+              <small>{copy.enums.campaignStatus[node.status]}</small>
             </button>
           ))}
         </div>
         <aside className="campaign-preview">
           {selected && <>
-            <span className="section-kicker">MISSION PREVIEW</span>
-            <h3>{typeLabels[selected.type]}</h3>
+            <span className="section-kicker">{copy.campaign.previewKicker}</span>
+            <h3>{copy.enums.missionType[selected.type]}</h3>
             <dl>
-              <div><dt>任务代号</dt><dd>{selected.id}</dd></div>
-              <div><dt>预估雷达数量</dt><dd>{selected.preview.radarDensity}</dd></div>
-              <div><dt>天气</dt><dd>{selected.preview.weather}</dd></div>
+              <div><dt>{copy.campaign.missionCode}</dt><dd>{selected.id}</dd></div>
+              <div><dt>{copy.campaign.estimatedRadars}</dt><dd>{selected.preview.radarDensity}</dd></div>
+              <div><dt>{copy.campaign.weather}</dt><dd>{selectedWeather}</dd></div>
             </dl>
-            <p>{getMissionEffectDescription(selected.type, selectedIntelRewardLevel)}。</p>
-            <p>{intelAccessTier === 0 ? "LIMITED INTELLIGENCE" : intelAccessTier === 1 ? "RADAR IDENTIFICATION VERIFIED" : "TOTAL INTELLIGENCE ACCESS"}</p>
-            {selected.type === "FINAL_STRIKE" && <p>最终目标防空序列持续重构，部署态势将在出击时确认。</p>}
+            <p>{selectedEffect}{copy.common.sentencePeriod}</p>
+            <p>{intelAccessTier === 0 ? copy.campaign.limitedIntelligence : intelAccessTier === 1 ? copy.campaign.radarIdentificationVerified : copy.campaign.totalIntelligenceAccess}</p>
+            {selected.type === "FINAL_STRIKE" && <p>{copy.campaign.finalStrikeWarning}</p>}
             {state.enemyState.tacticalProfile.missionSamples > 0 && <div className="campaign-build">
-              <span className="section-kicker">ENEMY HISTORICAL ANALYSIS</span>
-              <div>地形利用 {(state.enemyState.tacticalProfile.terrainMaskingPreference * 100).toFixed(0)}%</div>
-              <div>{state.enemyState.tacticalProfile.southernRouteBias > 0.5 ? "南部" : "北部"}航路偏好 {(Math.abs(state.enemyState.tacticalProfile.southernRouteBias - 0.5) * 200).toFixed(0)}%</div>
-              <div>直达倾向 {(state.enemyState.tacticalProfile.aggressiveRouting * 100).toFixed(0)}%</div>
+              <span className="section-kicker">{copy.campaign.historicalAnalysis}</span>
+              <div>{copy.campaign.terrainUse} {(state.enemyState.tacticalProfile.terrainMaskingPreference * 100).toFixed(0)}%</div>
+              <div>{state.enemyState.tacticalProfile.southernRouteBias > 0.5 ? copy.campaign.southern : copy.campaign.northern} {copy.campaign.routePreference} {(Math.abs(state.enemyState.tacticalProfile.southernRouteBias - 0.5) * 200).toFixed(0)}%</div>
+              <div>{copy.campaign.directRouting} {(state.enemyState.tacticalProfile.aggressiveRouting * 100).toFixed(0)}%</div>
             </div>}
             <button
               className="primary-button"
@@ -117,12 +116,12 @@
               }}
             >
               {selected.status === "COMPLETED"
-                ? selectedDebrief ? "复盘任务" : "任务已完成"
+                ? selectedDebrief ? copy.campaign.debriefMission : copy.campaign.missionCompleted
                 : state.status === "VICTORY"
-                ? "任务网络完成"
+                ? copy.campaign.networkCompleted
                 : state.status === "DEFEAT" && !canContinueRun
-                  ? "任务网络终止 // 飞机损失"
-                  : selected.status === "LOCKED" ? "预览任务" : "规划任务"}
+                  ? copy.campaign.networkTerminated
+                  : selected.status === "LOCKED" ? copy.campaign.previewMission : copy.campaign.planMission}
             </button>
           </>}
         </aside>
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/ControlPanel.test.tsx ./src/ui/ControlPanel.test.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/ControlPanel.test.tsx	2026-08-26 18:34:35
+++ ./src/ui/ControlPanel.test.tsx	2026-09-02 23:18:28
@@ -47,7 +47,7 @@
     expect(screen.getByRole("button", { name: "下移" })).toBeDisabled();
     expect(screen.getByRole("button", { name: "删除" })).toBeDisabled();
     expect(screen.queryByText("◆")).not.toBeInTheDocument();
-    expect(screen.getByRole("button", { name: /WEATHER FORECAST/ })).toHaveAttribute("aria-expanded", "false");
+    expect(screen.getByRole("button", { name: /天气预报/ })).toHaveAttribute("aria-expanded", "false");
   });
 
   it("执行中允许删除当前目标之后的航点", () => {
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/ControlPanel.tsx ./src/ui/ControlPanel.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/ControlPanel.tsx	2026-08-26 18:34:35
+++ ./src/ui/ControlPanel.tsx	2026-09-02 23:14:46
@@ -4,6 +4,7 @@
 import type { GameAction } from "../game/gameReducer";
 import { CollapsibleSection } from "./CollapsibleSection";
 import { WeatherForecastPanel } from "./WeatherForecastPanel";
+import { useI18n } from "../i18n/I18n";
 
 interface ControlPanelProps {
   mission: MissionSession;
@@ -15,21 +16,8 @@
   onOpenDebrief?: () => void;
 }
 
-const statusLabels = {
-  PLANNING: "规划任务",
-  RUNNING: "任务执行",
-  SUCCESS: "任务成功",
-  FAILED: "任务失败",
-} as const;
-
-const statusMessages = {
-  PLANNING: "等待航线确认",
-  RUNNING: "航电系统在线",
-  SUCCESS: "任务目标达成",
-  FAILED: "任务终止",
-} as const;
-
 export function ControlPanel({ mission, selectedIndex, onSelect, dispatch, onOpenCampaign, onReturnCampaign, onOpenDebrief }: ControlPanelProps) {
+  const { copy } = useI18n();
   const editable = mission.status === "PLANNING" || mission.status === "RUNNING";
   const editMode = mission.status === "RUNNING" ? "RUNNING" : "PLANNING";
   const selectedEditable = editable && selectedIndex !== null && canEditWaypoint(mission.route, selectedIndex, editMode);
@@ -41,15 +29,15 @@
   return (
     <aside className="control-panel">
       <section className="panel-section mission-status">
-        <div className="section-kicker">MISSION CONTROL</div>
-        <h2>{statusLabels[mission.status]}</h2>
+        <div className="section-kicker">{copy.control.kicker}</div>
+        <h2>{copy.control.status[mission.status]}</h2>
         <div className="status-line">
           <span className={`status-dot status-${mission.status.toLowerCase()}`} />
-          {statusMessages[mission.status]}
+          {copy.control.statusMessage[mission.status]}
         </div>
         <div className="button-row">
           {mission.status === "PLANNING" && (
-            <button className="primary-button return-network-button" onClick={onOpenCampaign}>返回任务网络</button>
+            <button className="primary-button return-network-button" onClick={onOpenCampaign}>{copy.control.returnNetwork}</button>
           )}
           {mission.status === "PLANNING" && (
             <button
@@ -57,43 +45,43 @@
               disabled={mission.route.waypoints.length < 2}
               onClick={() => dispatch({ type: "START" })}
             >
-              确认航线
+              {copy.control.confirmRoute}
             </button>
           )}
           {mission.status === "PLANNING" && <button className="secondary-button" onClick={() => dispatch({ type: "RESET" })}>
-            重置航线
+            {copy.control.resetRoute}
           </button>}
           {(mission.status === "SUCCESS" || mission.status === "FAILED") && (
-            mission.status === "SUCCESS" && onOpenDebrief ? <button className="secondary-button" onClick={onOpenDebrief}>复盘任务</button> : null
+            mission.status === "SUCCESS" && onOpenDebrief ? <button className="secondary-button" onClick={onOpenDebrief}>{copy.control.debriefMission}</button> : null
           )}
           {(mission.status === "SUCCESS" || mission.status === "FAILED") && (
             <button className="primary-button return-network-button" onClick={() => {
               dispatch({ type: "RETURN_CAMPAIGN" });
               onReturnCampaign();
-            }}>返回任务网络</button>
+            }}>{copy.control.returnNetwork}</button>
           )}
         </div>
       </section>
 
       <section className="panel-section objective-section">
-        <div className="section-heading"><span>TARGET DESIGNATION</span><span>{mission.target.id}</span></div>
+        <div className="section-heading"><span>{copy.control.targetDesignation}</span><span>{mission.target.id}</span></div>
         <div className={`objective-state ${mission.target.destroyed ? "destroyed" : ""}`}>
-          {mission.target.destroyed ? "目标摧毁 // 转入撤离航段" : "目标有效"}
+          {mission.target.destroyed ? copy.control.targetDestroyed : copy.control.targetValid}
         </div>
         <div className="objective-meta">
-          <div><span>{mission.target.destroyed ? "撤离区距离" : "目标距离"}</span><strong>{(mission.target.destroyed ? extractionDistance : targetDistance).toFixed(0)} u</strong></div>
-          <div><span>武器状态</span><strong>{mission.target.destroyed ? "已投放" : "待命"}</strong></div>
+          <div><span>{mission.target.destroyed ? copy.control.extractionDistance : copy.control.targetDistance}</span><strong>{(mission.target.destroyed ? extractionDistance : targetDistance).toFixed(0)} u</strong></div>
+          <div><span>{copy.control.weaponStatus}</span><strong>{mission.target.destroyed ? copy.control.weaponReleased : copy.control.weaponReady}</strong></div>
         </div>
       </section>
 
       <CollapsibleSection
         className="route-section"
-        title="航点序列"
+        title={copy.control.waypointSequence}
         meta={`${mission.route.waypoints.length - 1} NAV`}
       >
         <div className="route-distance-summary">
-          <div><span>规划总航程</span><strong>{plannedRouteDistance.toFixed(0)} u</strong></div>
-          <div><span>剩余航程</span><strong>{remainingRouteDistance.toFixed(0)} u</strong></div>
+          <div><span>{copy.control.plannedDistance}</span><strong>{plannedRouteDistance.toFixed(0)} u</strong></div>
+          <div><span>{copy.control.remainingDistance}</span><strong>{remainingRouteDistance.toFixed(0)} u</strong></div>
         </div>
         <div className="waypoint-list">
           {mission.route.waypoints.map((waypoint, index) => {
@@ -109,7 +97,7 @@
                   X {Math.round(waypoint.position.x).toString().padStart(4, "0")} / Y {Math.round(waypoint.position.y).toString().padStart(4, "0")}
                 </span>
                 <span className={`waypoint-state state-${waypoint.status.toLowerCase()}`}>
-                  {waypoint.status === "COMPLETED" ? "完成" : waypoint.status === "LOCKED" ? "锁定" : "待飞"}
+                  {copy.enums.waypointStatus[waypoint.status]}
                 </span>
               </button>
             );
@@ -120,13 +108,13 @@
             disabled={!selectedEditable || selectedIndex === 1 || (selectedIndex !== null && !canEditWaypoint(mission.route, selectedIndex - 1, editMode))}
             onClick={() => selectedIndex !== null && dispatch({ type: "REORDER_WAYPOINT", fromIndex: selectedIndex, toIndex: selectedIndex - 1 })}
           >
-            上移
+            {copy.control.moveUp}
           </button>
           <button
             disabled={!selectedEditable || selectedIndex === mission.route.waypoints.length - 1}
             onClick={() => selectedIndex !== null && dispatch({ type: "REORDER_WAYPOINT", fromIndex: selectedIndex, toIndex: selectedIndex + 1 })}
           >
-            下移
+            {copy.control.moveDown}
           </button>
           <button
             className="danger-button"
@@ -136,10 +124,10 @@
               onSelect(null);
             }}
           >
-            删除
+            {copy.control.remove}
           </button>
         </div>
-        <p className="hint">点击地图添加航点，拖动航点调整位置。任务执行中仅可调整当前目标之后的航点。</p>
+        <p className="hint">{copy.control.routeHint}</p>
       </CollapsibleSection>
 
       <WeatherForecastPanel mission={mission} defaultExpanded={false} />
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/DeploymentBriefingPanel.tsx ./src/ui/DeploymentBriefingPanel.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/DeploymentBriefingPanel.tsx	2026-08-26 17:44:47
+++ ./src/ui/DeploymentBriefingPanel.tsx	2026-09-02 23:15:37
@@ -1,4 +1,5 @@
 import { CollapsibleSection } from "./CollapsibleSection";
+import { localizeBriefingNote, useI18n } from "../i18n/I18n";
 
 interface DeploymentBriefingPanelProps {
   title: string;
@@ -8,8 +9,9 @@
 }
 
 export function DeploymentBriefingPanel({ title, notes, meta = notes.length, defaultExpanded = false }: DeploymentBriefingPanelProps) {
+  const { language } = useI18n();
   if (notes.length === 0) return null;
   return <CollapsibleSection title={title} meta={meta} defaultExpanded={defaultExpanded}>
-    <ol className="event-list briefing-list">{notes.map((note) => <li key={note}><span>{note}</span></li>)}</ol>
+    <ol className="event-list briefing-list">{notes.map((note) => <li key={note}><span>{localizeBriefingNote(note, language)}</span></li>)}</ol>
   </CollapsibleSection>;
 }
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/EnemySystemPanels.tsx ./src/ui/EnemySystemPanels.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/EnemySystemPanels.tsx	2026-08-26 17:48:35
+++ ./src/ui/EnemySystemPanels.tsx	2026-09-02 23:15:56
@@ -1,41 +1,28 @@
 import { getBeliefPeak } from "../domain/beliefMap";
-import { radarTypeProfiles } from "../domain/radarTypes";
 import type { MissionSession } from "../domain/types";
+import { useI18n } from "../i18n/I18n";
 
-const modeLabels = {
-  WIDE_SEARCH: "广域搜索",
-  SECTOR_SEARCH: "扇区搜索",
-  FOCUSED_TRACK: "聚焦跟踪",
-} as const;
-
-const awarenessLabels = { CALM: "平静", SUSPICIOUS: "怀疑", SEARCHING: "搜索", HUNTING: "猎杀" } as const;
-
-const intentLabels = {
-  MONITOR: "持续监视",
-  COORDINATED_SEARCH: "协同搜索",
-  CONCENTRATE_SEARCH: "集中搜索",
-} as const;
-
 interface EnemyStateSummaryProps {
   mission: MissionSession;
   density: "compact" | "detailed";
 }
 
 export function EnemyStateSummary({ mission, density }: EnemyStateSummaryProps) {
+  const { copy } = useI18n();
   const beliefPeak = getBeliefPeak(mission.beliefMap, mission.elapsedMs);
   if (density === "compact") return <dl className="telemetry-grid debug-telemetry-grid">
-    <div><dt>敌方警戒</dt><dd>{mission.awareness.value.toFixed(1)}%</dd></div>
-    <div><dt>有效 Contact</dt><dd>{mission.radarContacts.length}</dd></div>
-    <div><dt>Belief 峰值</dt><dd>{(beliefPeak.probability * 100).toFixed(1)}%</dd></div>
-    <div><dt>Commander</dt><dd>{intentLabels[mission.commander.intent]}</dd></div>
+    <div><dt>{copy.enemy.enemyAlert}</dt><dd>{mission.awareness.value.toFixed(1)}%</dd></div>
+    <div><dt>{copy.enemy.activeContact}</dt><dd>{mission.radarContacts.length}</dd></div>
+    <div><dt>{copy.enemy.beliefPeak}</dt><dd>{(beliefPeak.probability * 100).toFixed(1)}%</dd></div>
+    <div><dt>{copy.enemy.commander}</dt><dd>{copy.enums.commanderIntent[mission.commander.intent]}</dd></div>
   </dl>;
   return <dl className="telemetry-grid debug-telemetry-grid">
-    <div><dt>指挥链效率</dt><dd>{(mission.commanderCoordinationModifier * 100).toFixed(0)}%</dd></div>
-    <div><dt>雷达数量</dt><dd>{mission.radars.length}</dd></div>
-    <div><dt>有效 Contact</dt><dd>{mission.radarContacts.length}</dd></div>
-    <div><dt>Belief 峰值</dt><dd>{(beliefPeak.probability * 100).toFixed(1)}% / {beliefPeak.isValid ? "有效" : "失联"}</dd></div>
-    <div><dt>推测位置</dt><dd>{beliefPeak.position ? `${beliefPeak.position.x.toFixed(0)}, ${beliefPeak.position.y.toFixed(0)}` : "未知"}</dd></div>
-    <div><dt>敌方警戒</dt><dd>{mission.awareness.value.toFixed(1)} / {awarenessLabels[mission.awareness.stage]}</dd></div>
+    <div><dt>{copy.enemy.commandEfficiency}</dt><dd>{(mission.commanderCoordinationModifier * 100).toFixed(0)}%</dd></div>
+    <div><dt>{copy.enemy.radarCount}</dt><dd>{mission.radars.length}</dd></div>
+    <div><dt>{copy.enemy.activeContact}</dt><dd>{mission.radarContacts.length}</dd></div>
+    <div><dt>{copy.enemy.beliefPeak}</dt><dd>{(beliefPeak.probability * 100).toFixed(1)}% / {beliefPeak.isValid ? copy.common.valid : copy.common.lost}</dd></div>
+    <div><dt>{copy.enemy.estimatedPosition}</dt><dd>{beliefPeak.position ? `${beliefPeak.position.x.toFixed(0)}, ${beliefPeak.position.y.toFixed(0)}` : copy.common.unknown}</dd></div>
+    <div><dt>{copy.enemy.enemyAlert}</dt><dd>{mission.awareness.value.toFixed(1)} / {copy.enums.awarenessStage[mission.awareness.stage]}</dd></div>
   </dl>;
 }
 
@@ -44,10 +31,11 @@
 }
 
 export function RadarOperatorList({ mission }: RadarOperatorListProps) {
+  const { copy } = useI18n();
   return <>{mission.radars.map((radar) => <div className="operator-card" key={radar.id}>
     <div className="operator-title">
       <strong>{radar.id}</strong>
-      <span className={`mode-${radar.operator.mode.toLowerCase()}`}>{radarTypeProfiles[radar.type].label} / {modeLabels[radar.operator.mode]}</span>
+      <span className={`mode-${radar.operator.mode.toLowerCase()}`}>{copy.enums.radarType[radar.type]} / {copy.enums.operatorMode[radar.operator.mode]}</span>
     </div>
     <div className="score-grid">
       <span>W {radar.operator.utilityScores.WIDE_SEARCH.toFixed(0)}</span>
@@ -56,5 +44,3 @@
     </div>
   </div>)}</>;
 }
-
-export { intentLabels };
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/GameplayGuide.test.tsx ./src/ui/GameplayGuide.test.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/GameplayGuide.test.tsx	2026-09-02 22:36:00
+++ ./src/ui/GameplayGuide.test.tsx	2026-09-02 23:19:14
@@ -2,6 +2,7 @@
 import { cleanup, fireEvent, render, screen } from "@testing-library/react";
 import { afterEach, describe, expect, it, vi } from "vitest";
 import { GameplayGuide } from "./GameplayGuide";
+import { I18nProvider } from "../i18n/I18n";
 
 afterEach(cleanup);
 
@@ -47,5 +48,18 @@
     fireEvent.keyDown(window, { key: "Escape" });
     expect(third.onClose).toHaveBeenCalledTimes(1);
     expect(third.triggerRef.current).toHaveFocus();
+  });
+
+  it("英文模式显示完整的操作与任务效果说明", () => {
+    const triggerRef = createRef<HTMLButtonElement>();
+    render(<I18nProvider initialLanguage="en" persist={false}>
+      <button ref={triggerRef}>OPERATING INSTRUCTIONS</button>
+      <GameplayGuide open onClose={vi.fn()} triggerRef={triggerRef} missionRunning />
+    </I18nProvider>);
+
+    expect(screen.getByRole("dialog", { name: "OPERATING INSTRUCTIONS" })).toBeInTheDocument();
+    expect(screen.getByText("MISSION IN PROGRESS // OPERATION CONTINUES")).toBeInTheDocument();
+    expect(screen.getByText("MISSION EFFECTS")).toBeInTheDocument();
+    expect(screen.getByText(/STRIKE reduces subsequent radar scan rate/)).toBeInTheDocument();
   });
 });
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/GameplayGuide.tsx ./src/ui/GameplayGuide.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/GameplayGuide.tsx	2026-09-02 22:36:00
+++ ./src/ui/GameplayGuide.tsx	2026-09-02 23:15:02
@@ -1,4 +1,5 @@
 import { useEffect, useRef, type RefObject } from "react";
+import { useI18n } from "../i18n/I18n";
 
 interface GameplayGuideProps {
   open: boolean;
@@ -7,20 +8,8 @@
   missionRunning: boolean;
 }
 
-const guideSections = [
-  ["作战目标", "规划 F-117 航线，进入目标空域完成打击，并安全抵达东北撤离区。"],
-  ["任务网络", "三个阶段均需二选一，随后执行最终打击。锁定任务可以预览当前研判，但不能执行。"],
-  ["确认航线", "点击地图添加、拖动或排序航点。确认后任务不可暂停、重置或中途返回任务网络。"],
-  ["实时调整", "飞行中可继续添加航点，并调整当前目标航点之后的路线；已飞路径不可修改。"],
-  ["有限情报", "初始报告可能遗漏雷达，坐标与覆盖也存在误差。第一次完成 INTEL 将补齐全部雷达并核实坐标和型号；第二次授权 TOTAL INTEL。若放弃首次 INTEL，本次行动将无法取得第二级权限。"],
-  ["任务效果", "STRIKE 降低后续雷达扫描速率；SEAD 缩小覆盖；COMMAND STRIKE 削弱协同搜索和联合跟踪；INTEL 改变可见信息，不强化飞机。"],
-  ["敌方响应", "ENEMY ALERT 会在每次任务后上升，失败造成的增幅更大并扩大后续雷达范围；敌方还会根据已飞航迹调整后续部署。"],
-  ["环境与航程", "地形和恶劣天气可降低探测概率，但天气也会降低飞行速度。燃油按实际飞行距离消耗，出动前预报以任务 T+30/60/90 秒为固定时刻。"],
-  ["生存规则", "THREAT WARNING 表示当前跟踪与火控威胁。利用转向、距离、地形和天气切断新 Contact；导弹来袭后必须尽快脱离持续照射。"],
-  ["任务结果", "只有摧毁目标并成功撤离才算完成。失败可返回任务网络重试或改选；成功任务可用任务视角或全景视角复盘。"],
-] as const;
-
 export function GameplayGuide({ open, onClose, triggerRef, missionRunning }: GameplayGuideProps) {
+  const { copy } = useI18n();
   const closeButtonRef = useRef<HTMLButtonElement>(null);
 
   useEffect(() => {
@@ -45,12 +34,12 @@
   return <div className="guide-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
     <section className="gameplay-guide" role="dialog" aria-modal="true" aria-labelledby="gameplay-guide-title">
       <header className="gameplay-guide-header">
-        <div><span className="section-kicker">OPERATING INSTRUCTIONS</span><h2 id="gameplay-guide-title">操作说明</h2></div>
-        <button ref={closeButtonRef} type="button" className="guide-close" onClick={close} aria-label="关闭操作说明"><span aria-hidden="true" /></button>
+        <div><span className="section-kicker">{copy.guide.kicker}</span><h2 id="gameplay-guide-title">{copy.guide.title}</h2></div>
+        <button ref={closeButtonRef} type="button" className="guide-close" onClick={close} aria-label={copy.guide.close}><span aria-hidden="true" /></button>
       </header>
-      {missionRunning && <p className="guide-live-warning">任务执行中 // 作战进程未中断</p>}
+      {missionRunning && <p className="guide-live-warning">{copy.guide.liveWarning}</p>}
       <div className="gameplay-guide-content">
-        {guideSections.map(([title, content]) => <article key={title}><h3>{title}</h3><p>{content}</p></article>)}
+        {copy.guide.sections.map(([title, content]) => <article key={title}><h3>{title}</h3><p>{content}</p></article>)}
       </div>
     </section>
   </div>;
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/MapElementPanel.test.tsx ./src/ui/MapElementPanel.test.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/MapElementPanel.test.tsx	2026-09-02 22:36:00
+++ ./src/ui/MapElementPanel.test.tsx	2026-09-02 23:19:14
@@ -2,6 +2,7 @@
 import { afterEach, describe, expect, it, vi } from "vitest";
 import { createMission } from "../domain/factories";
 import { MapElementPanel } from "./MapElementPanel";
+import { I18nProvider } from "../i18n/I18n";
 
 afterEach(cleanup);
 
@@ -48,6 +49,24 @@
 
     expect(screen.getByText(new RegExp(`^${report.radarId} ·`))).toBeInTheDocument();
     expect(screen.queryByText(new RegExp(`^${report.radarId}\\?`))).not.toBeInTheDocument();
-    expect(screen.getByText("CONFIRMED · 坐标与型号已核实")).toBeInTheDocument();
+    expect(screen.getByText("已确认 · 坐标与型号已核实")).toBeInTheDocument();
+  });
+
+  it("英文模式翻译环境、航点和雷达动态状态", () => {
+    const mission = createMission("MAP-ELEMENTS-ENGLISH");
+    const report = mission.radarIntel[0]!;
+    mission.radarIntel = [{
+      ...report,
+      level: "CONFIRMED",
+      estimatedPosition: { x: 320, y: 320 },
+      positionErrorRadius: 0,
+    }];
+    render(<I18nProvider initialLanguage="en" persist={false}>
+      <MapElementPanel mission={mission} showBelief={false} selection={null} onSelectionChange={vi.fn()} defaultExpandedGroups />
+    </I18nProvider>);
+
+    expect(screen.getByRole("button", { name: /^ENVIRONMENT/ })).toBeInTheDocument();
+    expect(screen.getByText(/Coordinates and type verified/)).toBeInTheDocument();
+    expect(screen.getAllByText(/Navigation control point/).length).toBeGreaterThan(0);
   });
 });
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/MapElementPanel.tsx ./src/ui/MapElementPanel.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/MapElementPanel.tsx	2026-09-02 22:36:00
+++ ./src/ui/MapElementPanel.tsx	2026-09-02 23:15:24
@@ -1,5 +1,5 @@
 import type { MissionSession } from "../domain/types";
-import { radarTypeProfiles } from "../domain/radarTypes";
+import { useI18n } from "../i18n/I18n";
 import { CollapsibleSection } from "./CollapsibleSection";
 import { isSameMapSelection, type MapElementSelection } from "./mapSelection";
 
@@ -11,14 +11,8 @@
   defaultExpandedGroups?: boolean;
 }
 
-const weatherLabels = {
-  CLOUD: "云层",
-  RAIN: "降雨",
-  STORM: "风暴",
-  FOG: "雾区",
-} as const;
-
 export function MapElementPanel({ mission, showBelief, selection, onSelectionChange, defaultExpandedGroups = false }: MapElementPanelProps) {
+  const { copy } = useI18n();
   const select = (next: MapElementSelection) => {
     onSelectionChange(isSameMapSelection(selection, next) ? null : next);
   };
@@ -27,8 +21,8 @@
   const radarItems = showBelief
     ? mission.radars.map((radar) => ({
       id: radar.id,
-      title: `${radar.id} · ${radarTypeProfiles[radar.type].label}`,
-      detail: `真实位置 · 范围 ${radar.range.toFixed(0)} u · ${radar.operator.mode}`,
+      title: `${radar.id} · ${copy.enums.radarType[radar.type]}`,
+      detail: `${copy.mapElements.realPosition} · ${copy.mapElements.range} ${radar.range.toFixed(0)} u · ${copy.enums.operatorMode[radar.operator.mode]}`,
     }))
     : mission.radarIntel
       .filter((report) => report.estimatedPosition)
@@ -36,58 +30,58 @@
         const identificationMark = report.level === "CONFIRMED" && report.positionErrorRadius === 0 ? "" : "?";
         return {
           id: report.radarId,
-          title: `${report.radarId}${identificationMark} · ${radarTypeProfiles[report.radarType].label}`,
+          title: `${report.radarId}${identificationMark} · ${copy.enums.radarType[report.radarType]}`,
           detail: report.positionErrorRadius === 0
-            ? `${report.level} · 坐标与型号已核实`
-            : `${report.level} · 位置误差 ±${report.positionErrorRadius.toFixed(0)} u`,
+            ? `${copy.enums.radarIntelLevel[report.level]} · ${copy.mapElements.verified}`
+            : `${copy.enums.radarIntelLevel[report.level]} · ${copy.mapElements.positionError} ±${report.positionErrorRadius.toFixed(0)} u`,
         };
       });
 
   return (
-    <CollapsibleSection className="map-elements-section" title="MAP ELEMENTS">
-      <CollapsibleSection className="map-element-group" title="任务目标" meta="3" defaultExpanded={defaultExpandedGroups}>
+    <CollapsibleSection className="map-elements-section" title={copy.mapElements.title}>
+      <CollapsibleSection className="map-element-group" title={copy.mapElements.missionObjectives} meta="3" defaultExpanded={defaultExpandedGroups}>
         <div className="map-element-list">
           <button className={buttonClass({ kind: "AIRCRAFT" })} onClick={() => select({ kind: "AIRCRAFT" })}>
-            <strong>F-117</strong><span>己方机位 · 航向与位置实时更新</span>
+            <strong>F-117</strong><span>{copy.mapElements.aircraftDetail}</span>
           </button>
           <button className={buttonClass({ kind: "TARGET" })} onClick={() => select({ kind: "TARGET" })}>
-            <strong>{mission.target.id}</strong><span>指定目标 · 武器释放圈 {mission.target.attackRadius} u</span>
+            <strong>{mission.target.id}</strong><span>{copy.mapElements.targetDetail} {mission.target.attackRadius} u</span>
           </button>
           <button className={buttonClass({ kind: "EXTRACTION" })} onClick={() => select({ kind: "EXTRACTION" })}>
-            <strong>EXTRACTION</strong><span>指定撤离空域</span>
+            <strong>{copy.mapElements.extraction}</strong><span>{copy.mapElements.extractionDetail}</span>
           </button>
         </div>
       </CollapsibleSection>
 
-      <CollapsibleSection className="map-element-group" title="航线" meta={mission.route.waypoints.length} defaultExpanded={defaultExpandedGroups}>
+      <CollapsibleSection className="map-element-group" title={copy.mapElements.route} meta={mission.route.waypoints.length} defaultExpanded={defaultExpandedGroups}>
         <div className="map-element-list">
           {mission.route.waypoints.map((waypoint, index) => (
             <button key={waypoint.id} className={buttonClass({ kind: "WAYPOINT", id: waypoint.id })} onClick={() => select({ kind: "WAYPOINT", id: waypoint.id })}>
-              <strong>{index === 0 ? "INS" : `WP-${String(index).padStart(2, "0")}`} · 航点</strong>
-              <span>{waypoint.status} · 导航控制点</span>
+              <strong>{index === 0 ? "INS" : `WP-${String(index).padStart(2, "0")}`} · {copy.mapElements.waypoint}</strong>
+              <span>{copy.enums.waypointStatus[waypoint.status]} · {copy.mapElements.navigationPoint}</span>
             </button>
           ))}
         </div>
       </CollapsibleSection>
 
-      <CollapsibleSection className="map-element-group" title="环境" meta={mission.terrain.length + mission.weather.length} defaultExpanded={defaultExpandedGroups}>
+      <CollapsibleSection className="map-element-group" title={copy.mapElements.environment} meta={mission.terrain.length + mission.weather.length} defaultExpanded={defaultExpandedGroups}>
         <div className="map-element-list">
           {mission.terrain.map((terrain) => (
             <button key={terrain.id} className={buttonClass({ kind: "TERRAIN", id: terrain.id })} onClick={() => select({ kind: "TERRAIN", id: terrain.id })}>
-              <strong>{terrain.id} · 山地</strong>
-              <span>雷达遮蔽 {((1 - terrain.detectionFactor) * 100).toFixed(0)}% · 地形掩护区</span>
+              <strong>{terrain.id} · {copy.mapElements.mountain}</strong>
+              <span>{copy.mapElements.radarMasking} {((1 - terrain.detectionFactor) * 100).toFixed(0)}% · {copy.mapElements.terrainCover}</span>
             </button>
           ))}
           {mission.weather.map((weather) => (
             <button key={weather.id} className={buttonClass({ kind: "WEATHER", id: weather.id })} onClick={() => select({ kind: "WEATHER", id: weather.id })}>
-              <strong>{weather.id} · {weatherLabels[weather.kind]}</strong>
-              <span>信号衰减 {((1 - weather.detectionFactor) * 100).toFixed(0)}% · 动态气象单元</span>
+              <strong>{weather.id} · {copy.enums.weatherKind[weather.kind]}</strong>
+              <span>{copy.mapElements.signalAttenuation} {((1 - weather.detectionFactor) * 100).toFixed(0)}% · {copy.mapElements.dynamicWeatherCell}</span>
             </button>
           ))}
         </div>
       </CollapsibleSection>
 
-      <CollapsibleSection className="map-element-group" title="雷达" meta={radarItems.length} defaultExpanded={defaultExpandedGroups}>
+      <CollapsibleSection className="map-element-group" title={copy.mapElements.radar} meta={radarItems.length} defaultExpanded={defaultExpandedGroups}>
         <div className="map-element-list">
           {radarItems.map((radar) => (
             <button key={radar.id} className={buttonClass({ kind: "RADAR", id: radar.id })} onClick={() => select({ kind: "RADAR", id: radar.id })}>
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/SharedTacticalPanels.test.tsx ./src/ui/SharedTacticalPanels.test.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/SharedTacticalPanels.test.tsx	2026-09-02 23:00:53
+++ ./src/ui/SharedTacticalPanels.test.tsx	2026-09-02 23:18:28
@@ -27,7 +27,7 @@
       statusText="CURRENT ESTIMATE"
     />);
 
-    expect(screen.getByText("MISSION INTELLIGENCE")).toBeInTheDocument();
+    expect(screen.getByText("任务情报")).toBeInTheDocument();
     expect(screen.getByText("CURRENT ESTIMATE")).toBeInTheDocument();
     expect(screen.getByText("雷达情报 / 误差区")).toBeInTheDocument();
   });
@@ -35,7 +35,7 @@
   it("天气预报沿用调用方指定的折叠状态", () => {
     const mission = createMission("SHARED-WEATHER");
     render(<WeatherForecastPanel mission={mission} defaultExpanded={false} />);
-    expect(screen.getByRole("button", { name: /WEATHER FORECAST/ })).toHaveAttribute("aria-expanded", "false");
+    expect(screen.getByRole("button", { name: /天气预报/ })).toHaveAttribute("aria-expanded", "false");
   });
 
   it("天气预报使用任务绝对时刻并隐藏已经过期的条目", () => {
@@ -49,7 +49,7 @@
   it("敌方状态摘要提供固定的精简与详细密度", () => {
     const mission = createMission("SHARED-ENEMY-SUMMARY");
     const { rerender } = render(<EnemyStateSummary mission={mission} density="compact" />);
-    expect(screen.getByText("Commander")).toBeInTheDocument();
+    expect(screen.getByText("指挥官")).toBeInTheDocument();
     expect(screen.queryByText("指挥链效率")).not.toBeInTheDocument();
     rerender(<EnemyStateSummary mission={mission} density="detailed" />);
     expect(screen.getByText("指挥链效率")).toBeInTheDocument();
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/TacticalMap.tsx ./src/ui/TacticalMap.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/TacticalMap.tsx	2026-09-02 22:36:00
+++ ./src/ui/TacticalMap.tsx	2026-09-02 23:17:16
@@ -5,8 +5,8 @@
 import type { MissionSession, RadarType, Vector2 } from "../domain/types";
 import type { GameAction } from "../game/gameReducer";
 import f117TopSilhouette from "../assets/f117-top-silhouette.png";
-import { radarTypeProfiles } from "../domain/radarTypes";
 import type { MapElementSelection } from "./mapSelection";
+import { useI18n } from "../i18n/I18n";
 
 interface TacticalMapProps {
   mission: MissionSession;
@@ -78,6 +78,7 @@
 }
 
 export function TacticalMap({ mission, showBelief, selectedIndex, onSelect, dispatch, mapSelection, readOnly = false }: TacticalMapProps) {
+  const { copy } = useI18n();
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
   const editable = mission.status === "PLANNING" || mission.status === "RUNNING";
@@ -154,7 +155,7 @@
         context.setLineDash([]);
         context.fillStyle = "#819a9c";
         context.font = "12px monospace";
-        context.fillText(weather.kind, weather.x + 9, weather.y + 19);
+        context.fillText(copy.enums.weatherKind[weather.kind], weather.x + 9, weather.y + 19);
       });
 
       // 出动前预报使用任务绝对时刻；执行中仅保留尚未到达的预测轮廓。
@@ -175,7 +176,7 @@
         );
         context.fillStyle = "rgba(117, 177, 181, 0.65)";
         context.font = "9px monospace";
-        context.fillText(`任务 T+${forecast.horizonSeconds} ${forecast.kind}`, forecast.estimatedPosition.x + 5, forecast.estimatedPosition.y + 12);
+        context.fillText(`${copy.common.taskTimePrefix}${forecast.horizonSeconds} ${copy.enums.weatherKind[forecast.kind]}`, forecast.estimatedPosition.x + 5, forecast.estimatedPosition.y + 12);
         context.restore();
       });
 
@@ -186,7 +187,7 @@
       context.strokeRect(mission.extractionArea.x, mission.extractionArea.y, mission.extractionArea.width, mission.extractionArea.height);
       context.fillStyle = "#60c8a6";
       context.font = "15px monospace";
-      context.fillText("撤离区", 881, 98);
+      context.fillText(copy.canvas.extraction, 881, 98);
 
       context.beginPath();
       context.arc(mission.target.position.x, mission.target.position.y, mission.target.attackRadius, 0, Math.PI * 2);
@@ -198,7 +199,7 @@
       context.fillStyle = mission.target.destroyed ? "#65736e" : "#ea7658";
       context.fillRect(mission.target.position.x - 10, mission.target.position.y - 10, 20, 20);
       context.font = "12px monospace";
-      context.fillText(mission.target.destroyed ? "DESTROYED" : "TARGET", mission.target.position.x + 16, mission.target.position.y + 4);
+      context.fillText(mission.target.destroyed ? copy.canvas.destroyed : copy.canvas.target, mission.target.position.x + 16, mission.target.position.y + 4);
 
       mission.terrain.forEach((terrain) => {
         context.fillStyle = "rgba(73, 102, 84, 0.3)";
@@ -208,7 +209,7 @@
         context.strokeRect(terrain.x, terrain.y, terrain.width, terrain.height);
         context.fillStyle = "#718f7e";
         context.font = "13px monospace";
-        context.fillText("地形遮蔽", terrain.x + 10, terrain.y + 22);
+        context.fillText(copy.canvas.terrainMasking, terrain.x + 10, terrain.y + 22);
       });
 
       if (!showBelief) mission.radarIntel.forEach((report) => {
@@ -239,7 +240,7 @@
         context.font = "12px monospace";
         const identificationMark = report.level === "CONFIRMED" && report.positionErrorRadius === 0 ? "" : "?";
         context.fillText(
-          `${report.radarId}${identificationMark} ${radarTypeProfiles[report.radarType].label} ${report.level}`,
+          `${report.radarId}${identificationMark} ${copy.enums.radarType[report.radarType]} ${copy.enums.radarIntelLevel[report.level]}`,
           position.x + 12,
           position.y + 4,
         );
@@ -266,7 +267,7 @@
         context.fillStyle = radarColor;
         context.fillRect(radar.position.x - 6, radar.position.y - 6, 12, 12);
         context.font = "12px monospace";
-        context.fillText(`${radar.id} ${radarTypeProfiles[radar.type].label} ${radar.operator.mode}`, radar.position.x + 12, radar.position.y + 4);
+        context.fillText(`${radar.id} ${copy.enums.radarType[radar.type]} ${copy.enums.operatorMode[radar.operator.mode]}`, radar.position.x + 12, radar.position.y + 4);
       });
 
       if (showBelief) mission.radarContacts.forEach((contact) => {
@@ -374,7 +375,7 @@
       aircraftImage.removeEventListener("load", render);
       observer.disconnect();
     };
-  }, [mission, selectedIndex, showBelief, mapSelection]);
+  }, [copy, mission, selectedIndex, showBelief, mapSelection]);
 
   const findWaypointIndex = (position: Vector2): number => {
     const canvas = canvasRef.current;
@@ -418,7 +419,7 @@
     <canvas
       ref={canvasRef}
       className="tactical-map"
-      aria-label="战术航线地图"
+      aria-label={copy.canvas.mapLabel}
       onPointerDown={handlePointerDown}
       onPointerMove={handlePointerMove}
       onPointerUp={() => setDraggingIndex(null)}
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/TacticalMapStage.tsx ./src/ui/TacticalMapStage.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/TacticalMapStage.tsx	2026-08-26 17:44:47
+++ ./src/ui/TacticalMapStage.tsx	2026-09-02 23:16:07
@@ -3,6 +3,7 @@
 import type { GameAction } from "../game/gameReducer";
 import { TacticalMap } from "./TacticalMap";
 import type { MapElementSelection } from "./mapSelection";
+import { useI18n } from "../i18n/I18n";
 
 export type TacticalMapVariant = "MISSION" | "INTELLIGENCE" | "DEBRIEF";
 
@@ -19,12 +20,6 @@
   statusText?: string;
 }
 
-const stageTitles: Record<TacticalMapVariant, string> = {
-  MISSION: "TACTICAL AREA // 1000 × 1000",
-  INTELLIGENCE: "MISSION INTELLIGENCE",
-  DEBRIEF: "MISSION DEBRIEF",
-};
-
 export function TacticalMapStage({
   variant,
   mission,
@@ -37,14 +32,15 @@
   toolbar,
   statusText,
 }: TacticalMapStageProps) {
-  const resolvedStatus = statusText ?? (showBelief ? "敌方内部状态" : "有限情报任务规划");
-  const aircraftLabel = variant === "DEBRIEF" ? "F-117 最终位置" : "F-117";
+  const { copy } = useI18n();
+  const resolvedStatus = statusText ?? (showBelief ? copy.stage.enemyInternal : copy.stage.limitedPlanning);
+  const aircraftLabel = variant === "DEBRIEF" ? copy.stage.aircraftFinalPosition : "F-117";
   const radarLabel = showBelief
-    ? "真实雷达 / 敌方 Contact"
-    : variant === "DEBRIEF" ? "任务雷达情报" : "雷达情报 / 误差区";
+    ? copy.stage.realRadarContact
+    : variant === "DEBRIEF" ? copy.stage.missionRadarIntel : copy.stage.radarIntelError;
 
   return <section className="map-stage">
-    <div className="map-label"><span>{stageTitles[variant]}</span><span>{resolvedStatus}</span></div>
+    <div className="map-label"><span>{copy.stage.title[variant]}</span><span>{resolvedStatus}</span></div>
     {toolbar}
     <TacticalMap
       mission={mission}
@@ -57,8 +53,8 @@
     />
     <div className="map-legend">
       <span><i className="legend-aircraft" />{aircraftLabel}</span>
-      {variant === "MISSION" && <span><i className="legend-waypoint" />航点</span>}
-      <span><i className="legend-extraction" />撤离区</span>
+      {variant === "MISSION" && <span><i className="legend-waypoint" />{copy.stage.waypoint}</span>}
+      <span><i className="legend-extraction" />{copy.stage.extraction}</span>
       <span><i className="legend-radar" />{radarLabel}</span>
     </div>
   </section>;
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/WeatherForecastPanel.tsx ./src/ui/WeatherForecastPanel.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/WeatherForecastPanel.tsx	2026-09-02 23:01:53
+++ ./src/ui/WeatherForecastPanel.tsx	2026-09-02 23:15:37
@@ -1,4 +1,5 @@
 import type { MissionSession } from "../domain/types";
+import { useI18n } from "../i18n/I18n";
 import { CollapsibleSection } from "./CollapsibleSection";
 
 interface WeatherForecastPanelProps {
@@ -7,17 +8,18 @@
 }
 
 export function WeatherForecastPanel({ mission, defaultExpanded = true }: WeatherForecastPanelProps) {
+  const { copy } = useI18n();
   // 预报是出动前生成的任务绝对时刻快照，不把已经过去的时刻继续伪装成“未来”。
   const activeForecasts = mission.weatherForecast.filter(
     (forecast) => forecast.horizonSeconds * 1000 > mission.elapsedMs,
   );
-  return <CollapsibleSection title="WEATHER FORECAST" meta={`${mission.weather.length} CELLS`} defaultExpanded={defaultExpanded}>
+  return <CollapsibleSection title={copy.forecast.title} meta={`${mission.weather.length} ${copy.forecast.cells}`} defaultExpanded={defaultExpanded}>
     <ol className="weather-forecast-list">
-      {activeForecasts.length === 0 && <li><span>出动前预报时效已结束</span></li>}
+      {activeForecasts.length === 0 && <li><span>{copy.forecast.expired}</span></li>}
       {activeForecasts.map((forecast) => <li key={`${forecast.weatherId}-${forecast.horizonSeconds}`}>
-        <strong>{forecast.weatherId} / 任务 T+{forecast.horizonSeconds}s</strong>
-        <span>{forecast.kind} · {forecast.intensityTrend} · 可信度{forecast.confidence}</span>
-        <small>预计区域 {forecast.estimatedPosition.x.toFixed(0)},{forecast.estimatedPosition.y.toFixed(0)} · {forecast.estimatedSize.width.toFixed(0)}×{forecast.estimatedSize.height.toFixed(0)}</small>
+        <strong>{forecast.weatherId} / {copy.common.taskTimePrefix}{forecast.horizonSeconds}s</strong>
+        <span>{copy.enums.weatherKind[forecast.kind]} · {copy.enums.weatherTrend[forecast.intensityTrend]} · {copy.forecast.confidence} {copy.enums.confidence[forecast.confidence]}</span>
+        <small>{copy.forecast.estimatedArea} {forecast.estimatedPosition.x.toFixed(0)},{forecast.estimatedPosition.y.toFixed(0)} · {forecast.estimatedSize.width.toFixed(0)}×{forecast.estimatedSize.height.toFixed(0)}</small>
       </li>)}
     </ol>
   </CollapsibleSection>;
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/styles.css ./src/ui/styles.css
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/styles.css	2026-09-02 22:05:57
+++ ./src/ui/styles.css	2026-09-02 23:13:49
@@ -21,7 +21,8 @@
 .brand-block p { margin: 5px 0 0; color: #638f80; font-size: 10px; letter-spacing: 0.1em; }
 .section-kicker { color: #527b6e; font-size: 10px; letter-spacing: 0.14em; }
 .topbar-controls { display: flex; align-items: center; gap: 16px; }
-.guide-trigger { padding: 7px 10px; color: #dcb35a; border-color: #765b2b; font-size: 9px; letter-spacing: 0.08em; }
+.guide-trigger, .language-trigger { padding: 7px 10px; color: #dcb35a; border-color: #765b2b; font-size: 9px; letter-spacing: 0.08em; white-space: nowrap; }
+.language-trigger { min-width: 38px; color: #8eb6aa; border-color: #31584b; }
 .audio-control { display: flex; align-items: center; gap: 7px; }
 .audio-control button { padding: 7px 9px; color: #74ad9c; font-size: 9px; }
 .audio-control label { color: #527b6e; font-size: 9px; }
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/workspaces/DebriefWorkspace.tsx ./src/ui/workspaces/DebriefWorkspace.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/workspaces/DebriefWorkspace.tsx	2026-08-26 18:25:11
+++ ./src/ui/workspaces/DebriefWorkspace.tsx	2026-09-02 23:17:03
@@ -6,6 +6,7 @@
 import type { MapElementSelection } from "../mapSelection";
 import { TacticalMapStage } from "../TacticalMapStage";
 import { TacticalWorkspace } from "../TacticalWorkspace";
+import { useI18n } from "../../i18n/I18n";
 
 interface DebriefWorkspaceProps {
   debrief: MissionDebrief;
@@ -16,24 +17,25 @@
 
 /** 历史复盘只读取冻结快照；全景切换不会接触或修改当前任务状态。 */
 export function DebriefWorkspace({ debrief, mapSelection, onMapSelectionChange, onClose }: DebriefWorkspaceProps) {
+  const { copy } = useI18n();
   const [panoramic, setPanoramic] = useState(false);
   const mission = debrief.mission;
   return <TacticalWorkspace
     className="intelligence-workspace"
     leftPanel={<aside className="control-panel">
       <section className="panel-section">
-        <div className="section-kicker">MISSION DEBRIEF</div>
-        <h2>复盘任务</h2>
-        <p className="hint">成功撤离快照 // {debrief.nodeId}</p>
+        <div className="section-kicker">{copy.debrief.kicker}</div>
+        <h2>{copy.debrief.title}</h2>
+        <p className="hint">{copy.debrief.snapshot} // {debrief.nodeId}</p>
         <dl className="telemetry-grid">
-          <div><dt>任务时间</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} s</dd></div>
-          <div><dt>最终坐标</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
-          <div><dt>剩余燃油</dt><dd>{mission.aircraft.fuelRemaining.toFixed(0)} u</dd></div>
-          <div><dt>情报权限</dt><dd>{debrief.intelAccessTier}/2</dd></div>
+          <div><dt>{copy.debrief.missionTime}</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} s</dd></div>
+          <div><dt>{copy.debrief.finalCoordinates}</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
+          <div><dt>{copy.debrief.remainingFuel}</dt><dd>{mission.aircraft.fuelRemaining.toFixed(0)} u</dd></div>
+          <div><dt>{copy.debrief.intelAccess}</dt><dd>{debrief.intelAccessTier}/2</dd></div>
         </dl>
         <div className="button-row">
-          <button className="secondary-button" onClick={() => setPanoramic((value) => !value)}>{panoramic ? "切换任务视角" : "切换全景复盘"}</button>
-          <button className="primary-button return-network-button" onClick={onClose}>返回任务网络</button>
+          <button className="secondary-button" onClick={() => setPanoramic((value) => !value)}>{panoramic ? copy.debrief.missionView : copy.debrief.panoramicView}</button>
+          <button className="primary-button return-network-button" onClick={onClose}>{copy.control.returnNetwork}</button>
         </div>
       </section>
     </aside>}
@@ -46,11 +48,11 @@
       dispatch={() => undefined}
       mapSelection={mapSelection}
       readOnly
-      statusText={panoramic ? "全景复盘" : "任务视角"}
+      statusText={panoramic ? copy.debrief.panoramicViewStatus : copy.debrief.missionViewStatus}
     />}
     rightPanel={<aside className="telemetry-panel">
       <MapElementPanel mission={mission} showBelief={panoramic} selection={mapSelection} onSelectionChange={onMapSelectionChange} defaultExpandedGroups />
-      {panoramic && <CollapsibleSection className="debug-group" title="ENEMY SYSTEM ANALYSIS" meta="FROZEN">
+      {panoramic && <CollapsibleSection className="debug-group" title={copy.debrief.enemySystemAnalysis} meta={copy.debrief.frozen}>
         <EnemyStateSummary mission={mission} density="compact" />
         <RadarOperatorList mission={mission} />
       </CollapsibleSection>}
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/workspaces/IntelligenceWorkspace.tsx ./src/ui/workspaces/IntelligenceWorkspace.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/workspaces/IntelligenceWorkspace.tsx	2026-08-26 18:25:12
+++ ./src/ui/workspaces/IntelligenceWorkspace.tsx	2026-09-02 23:17:03
@@ -5,6 +5,7 @@
 import { TacticalMapStage } from "../TacticalMapStage";
 import { TacticalWorkspace } from "../TacticalWorkspace";
 import { WeatherForecastPanel } from "../WeatherForecastPanel";
+import { useI18n } from "../../i18n/I18n";
 
 interface IntelligenceWorkspaceProps {
   mission: MissionSession;
@@ -15,14 +16,15 @@
 }
 
 export function IntelligenceWorkspace({ mission, showBelief, mapSelection, onMapSelectionChange, onClose }: IntelligenceWorkspaceProps) {
+  const { copy } = useI18n();
   return <TacticalWorkspace
     className="intelligence-workspace"
     leftPanel={<aside className="control-panel">
       <section className="panel-section">
-        <div className="section-kicker">CURRENT ESTIMATE</div>
-        <h2>预览任务</h2>
-        <p className="hint">只读情报研判 // 任务尚未授权执行</p>
-        <button className="primary-button return-network-button" onClick={onClose}>返回任务网络</button>
+        <div className="section-kicker">{copy.intelligence.kicker}</div>
+        <h2>{copy.intelligence.title}</h2>
+        <p className="hint">{copy.intelligence.hint}</p>
+        <button className="primary-button return-network-button" onClick={onClose}>{copy.control.returnNetwork}</button>
       </section>
       <WeatherForecastPanel mission={mission} />
     </aside>}
@@ -35,11 +37,11 @@
       dispatch={() => undefined}
       mapSelection={mapSelection}
       readOnly
-      statusText="CURRENT ESTIMATE"
+      statusText={copy.intelligence.status}
     />}
     rightPanel={<aside className="telemetry-panel">
       <MapElementPanel mission={mission} showBelief={showBelief} selection={mapSelection} onSelectionChange={onMapSelectionChange} defaultExpandedGroups />
-      <DeploymentBriefingPanel title="COUNTER DEPLOYMENT" notes={mission.adaptationNotes} defaultExpanded />
+      <DeploymentBriefingPanel title={copy.mission.counterDeployment} notes={mission.adaptationNotes} defaultExpanded />
     </aside>}
   />;
 }
diff -ruN --exclude .git --exclude node_modules --exclude dist --exclude coverage --exclude tsconfig.tsbuildinfo /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/workspaces/MissionWorkspace.tsx ./src/ui/workspaces/MissionWorkspace.tsx
--- /private/tmp/f117-session129-baseline.Iq0Lf1/src/ui/workspaces/MissionWorkspace.tsx	2026-09-02 11:33:00
+++ ./src/ui/workspaces/MissionWorkspace.tsx	2026-09-02 23:16:45
@@ -4,26 +4,13 @@
 import { CollapsibleSection } from "../CollapsibleSection";
 import { ControlPanel } from "../ControlPanel";
 import { DeploymentBriefingPanel } from "../DeploymentBriefingPanel";
-import { EnemyStateSummary, RadarOperatorList, intentLabels } from "../EnemySystemPanels";
+import { EnemyStateSummary, RadarOperatorList } from "../EnemySystemPanels";
 import { MapElementPanel } from "../MapElementPanel";
 import type { MapElementSelection } from "../mapSelection";
 import { TacticalMapStage } from "../TacticalMapStage";
 import { TacticalWorkspace } from "../TacticalWorkspace";
+import { useI18n } from "../../i18n/I18n";
 
-const eventLabels: Record<string, string> = {
-  WAYPOINT_ADDED: "新增航点", WAYPOINT_MOVED: "调整航点", WAYPOINT_REMOVED: "删除航点", WAYPOINT_REORDERED: "航点排序",
-  MISSION_STARTED: "开始执行", MISSION_PAUSED: "任务暂停", MISSION_RESUMED: "继续执行", MISSION_RESET: "任务重置",
-  WAYPOINT_REACHED: "抵达航点", ROUTE_COMPLETED: "航线完成", RADAR_CONTACT: "雷达接触", RADAR_MODE_CHANGED: "雷达模式切换",
-  AWARENESS_STAGE_CHANGED: "警戒阶段变化", COMMANDER_ORDER: "Commander 命令", ATTACK: "武器投放", EXTRACTION: "进入撤离区",
-  MISSION_SUCCESS: "任务成功", MISSION_FAILED: "任务失败", THREAT_STAGE_CHANGED: "威胁阶段变化", MISSILE_LAUNCHED: "导弹发射",
-  MISSILE_DEFEATED: "导弹脱锁", AIRCRAFT_DESTROYED: "飞机损毁", FUEL_EXHAUSTED: "燃油耗尽",
-};
-
-const threatLabels = {
-  UNDETECTED: "未发现异常", SUSPECTED: "疑似搜索活动", TRACKED: "持续照射 / 正在跟踪",
-  LOCKED: "火控锁定", MISSILE_INBOUND: "导弹来袭",
-} as const;
-
 interface MissionWorkspaceProps {
   mission: MissionSession;
   selectedIndex: number | null;
@@ -41,6 +28,7 @@
 }
 
 export function MissionWorkspace(props: MissionWorkspaceProps) {
+  const { copy } = useI18n();
   const { mission, selectedIndex, onSelect, dispatch, showBelief, canUseAiDebug, onToggleBelief, adaptationStatus, mapSelection, onMapSelectionChange } = props;
   const activeWaypoint = mission.route.waypoints[mission.route.activeWaypointIndex];
   const recentEvents = mission.events.slice(-5).reverse();
@@ -57,47 +45,51 @@
       onSelect={onSelect}
       dispatch={dispatch}
       mapSelection={mapSelection}
-      toolbar={canUseAiDebug ? <button className={`belief-toggle ${showBelief ? "active" : ""}`} onClick={onToggleBelief}>TOTAL INTEL {showBelief ? "ON" : "OFF"}</button> : undefined}
+      toolbar={canUseAiDebug ? <button className={`belief-toggle ${showBelief ? "active" : ""}`} onClick={onToggleBelief}>{showBelief ? copy.mission.totalIntelOn : copy.mission.totalIntelOff}</button> : undefined}
     />}
     rightPanel={<aside className="telemetry-panel">
       <section className={`panel-section threat-section threat-${mission.engagement.stage.toLowerCase()}`}>
-        <div className="section-heading"><span>THREAT WARNING</span><span>{threatLabels[mission.engagement.stage]}</span></div>
+        <div className="section-heading"><span>{copy.mission.threatWarning}</span><span>{copy.enums.threatStage[mission.engagement.stage]}</span></div>
         <div className="threat-progress"><i style={{ width: `${mission.engagement.trackProgress}%` }} /></div>
         {mission.engagement.stage === "MISSILE_INBOUND"
-          ? <p className="threat-message">撞击倒计时 {mission.engagement.missileTimeRemainingSeconds?.toFixed(1)} s // 规避机动 · 脱离照射</p>
-          : <p className="threat-message">辐射威胁 {mission.engagement.trackProgress.toFixed(0)}%</p>}
+          ? <p className="threat-message">{copy.mission.impactCountdown} {mission.engagement.missileTimeRemainingSeconds?.toFixed(1)} s // {copy.mission.evade}</p>
+          : <p className="threat-message">{copy.mission.radiationThreat} {mission.engagement.trackProgress.toFixed(0)}%</p>}
       </section>
       <section className={`panel-section fuel-section ${mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity <= 0.2 ? "fuel-critical" : ""}`}>
-        <div className="section-heading"><span>FUEL RANGE</span><span>{(mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity * 100).toFixed(0)}%</span></div>
+        <div className="section-heading"><span>{copy.mission.fuelRange}</span><span>{(mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity * 100).toFixed(0)}%</span></div>
         <div className="fuel-meter"><i style={{ width: `${mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity * 100}%` }} /></div>
-        <p className="threat-message">可用航程 {mission.aircraft.fuelRemaining.toFixed(0)} u</p>
+        <p className="threat-message">{copy.mission.availableRange} {mission.aircraft.fuelRemaining.toFixed(0)} u</p>
       </section>
-      <CollapsibleSection title="FLIGHT STATUS"><dl className="telemetry-grid">
-        <div><dt>飞行时间</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} s</dd></div><div><dt>坐标</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
-        <div><dt>航向</dt><dd>{mission.aircraft.headingDegrees.toFixed(0)}°</dd></div><div><dt>速度</dt><dd>{mission.aircraft.speed.toFixed(2)} u/s</dd></div>
-        <div><dt>气象速度损失</dt><dd>{weatherSpeedFactor < 1 ? `${((1 - weatherSpeedFactor) * 100).toFixed(0)}%` : "无"}</dd></div><div><dt>当前航点</dt><dd>{activeWaypoint ? `WP-${mission.route.activeWaypointIndex}` : "—"}</dd></div>
+      <CollapsibleSection title={copy.mission.flightStatus}><dl className="telemetry-grid">
+        <div><dt>{copy.mission.flightTime}</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} s</dd></div><div><dt>{copy.mission.coordinates}</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
+        <div><dt>{copy.mission.heading}</dt><dd>{mission.aircraft.headingDegrees.toFixed(0)}°</dd></div><div><dt>{copy.mission.speed}</dt><dd>{mission.aircraft.speed.toFixed(2)} u/s</dd></div>
+        <div><dt>{copy.mission.weatherSpeedLoss}</dt><dd>{weatherSpeedFactor < 1 ? `${((1 - weatherSpeedFactor) * 100).toFixed(0)}%` : copy.common.none}</dd></div><div><dt>{copy.mission.currentWaypoint}</dt><dd>{activeWaypoint ? `WP-${mission.route.activeWaypointIndex}` : "—"}</dd></div>
       </dl></CollapsibleSection>
-      <CollapsibleSection title="MISSION INTEL" defaultExpanded={false}><dl className="telemetry-grid">
-        <div><dt>已知雷达情报</dt><dd>{visibleRadarIntel.length} 个</dd></div>
-        <div><dt>未定位信号</dt><dd>{mission.radarIntel.length - visibleRadarIntel.length} 个</dd></div><div><dt>敌方适应状态</dt><dd>{adaptationStatus}</dd></div>
-        <div><dt>雷达扫描速率</dt><dd>{(mission.radarScanRateModifier * 100).toFixed(0)}%</dd></div>
+      <CollapsibleSection title={copy.mission.missionIntel} defaultExpanded={false}><dl className="telemetry-grid">
+        <div><dt>{copy.mission.knownRadarIntel}</dt><dd>{formatCount(visibleRadarIntel.length, copy.common.countUnit)}</dd></div>
+        <div><dt>{copy.mission.unlocatedSignals}</dt><dd>{formatCount(mission.radarIntel.length - visibleRadarIntel.length, copy.common.countUnit)}</dd></div><div><dt>{copy.mission.adaptationStatus}</dt><dd>{copy.enums.adaptationStatus[adaptationStatus]}</dd></div>
+        <div><dt>{copy.mission.radarScanRate}</dt><dd>{(mission.radarScanRateModifier * 100).toFixed(0)}%</dd></div>
       </dl></CollapsibleSection>
       <MapElementPanel mission={mission} showBelief={showBelief} selection={mapSelection} onSelectionChange={onMapSelectionChange} />
-      <DeploymentBriefingPanel title="COUNTER DEPLOYMENT" notes={mission.adaptationNotes} />
-      <DeploymentBriefingPanel title="FINAL DEFENSE BRIEFING" notes={mission.finalStrikeNotes} meta={mission.radars.length} />
-      {showBelief && <CollapsibleSection className="debug-group" title="ENEMY SYSTEM STATE" meta="INTERNAL" defaultExpanded={false}>
-        <CollapsibleSection className="event-section" title="结构化事件" meta={mission.events.length}><ol className="event-list">
-          {recentEvents.length === 0 && <li className="empty-event">等待操作事件…</li>}
-          {recentEvents.map((event) => <li key={event.id}><time>{(event.timestamp / 1000).toFixed(1).padStart(5, "0")}</time><span>{eventLabels[event.type] ?? event.type}</span></li>)}
+      <DeploymentBriefingPanel title={copy.mission.counterDeployment} notes={mission.adaptationNotes} />
+      <DeploymentBriefingPanel title={copy.mission.finalDefenseBriefing} notes={mission.finalStrikeNotes} meta={mission.radars.length} />
+      {showBelief && <CollapsibleSection className="debug-group" title={copy.mission.enemySystemState} meta={copy.mission.internal} defaultExpanded={false}>
+        <CollapsibleSection className="event-section" title={copy.mission.structuredEvents} meta={mission.events.length}><ol className="event-list">
+          {recentEvents.length === 0 && <li className="empty-event">{copy.mission.waitingEvents}</li>}
+          {recentEvents.map((event) => <li key={event.id}><time>{(event.timestamp / 1000).toFixed(1).padStart(5, "0")}</time><span>{copy.enums.eventType[event.type]}</span></li>)}
         </ol></CollapsibleSection>
-        <CollapsibleSection className="commander-section" title="AIR DEFENSE COMMANDER" meta={`ALERT ${mission.awareness.value.toFixed(0)}%`}>
+        <CollapsibleSection className="commander-section" title={copy.mission.airDefenseCommander} meta={`${copy.mission.alert} ${mission.awareness.value.toFixed(0)}%`}>
           <EnemyStateSummary mission={mission} density="detailed" />
-          <div className="commander-intent">{intentLabels[mission.commander.intent]}</div>
+          <div className="commander-intent">{copy.enums.commanderIntent[mission.commander.intent]}</div>
           <div className="score-grid commander-scores"><span>M {mission.commander.utilityScores.MONITOR.toFixed(0)}</span><span>C {mission.commander.utilityScores.COORDINATED_SEARCH.toFixed(0)}</span><span>F {mission.commander.utilityScores.CONCENTRATE_SEARCH.toFixed(0)}</span></div>
           <div className="awareness-meter"><i style={{ width: `${mission.awareness.value}%` }} /></div>
         </CollapsibleSection>
-        <CollapsibleSection className="operator-section" title="RADAR OPERATOR AI" meta="UTILITY"><RadarOperatorList mission={mission} /></CollapsibleSection>
+        <CollapsibleSection className="operator-section" title={copy.mission.radarOperatorAi} meta={copy.mission.utility}><RadarOperatorList mission={mission} /></CollapsibleSection>
       </CollapsibleSection>}
     </aside>}
   />;
+}
+
+function formatCount(value: number, unit: string): string {
+  return unit ? `${value} ${unit}` : String(value);
 }
```

