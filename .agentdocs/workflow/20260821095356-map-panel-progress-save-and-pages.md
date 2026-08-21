# 地图元素面板、任务存档与 GitHub Pages 发布

## 背景与目标
- 在右侧集中说明地图元素，点击条目时高亮地图对应目标。
- 修复飞行中航点排序、删除按钮仍可操作的问题。
- 保存完整 Run/Campaign/Mission 进度，并在刷新后安全恢复。
- 通过 GitHub Actions 自动发布 GitHub Pages 在线版本。

## 约束与原则
- 普通视图只展示有限雷达情报，不通过元素面板泄露真实雷达位置。
- 运行中的任务恢复为暂停状态，避免页面关闭期间继续推进。
- 存储不可用、存档损坏或版本不兼容时回退到新 Run。
- 不引入新的运行时依赖。

## 阶段与 TODO
- [x] 增加 `MAP ELEMENTS` 说明、选择状态和 Canvas 高亮。
- [x] 将航点纳入元素说明与定位。
- [x] 飞行中禁用航点序列操作按钮并增加组件测试。
- [x] 增加版本化本地存档、事件序号同步和恢复测试。
- [x] 保存 Campaign/战术视图，刷新后回到原工作区。
- [x] 增加 GitHub Pages 构建部署工作流与相对资源基址。
- [x] 完成类型检查、103 项测试、生产构建和浏览器验证。

## 关键风险
- `localStorage` 存档结构随领域模型演进时需要升级 `SAVE_VERSION` 或增加迁移。
- 已删除或重命名的雷达情报可能让旧选择失效；Canvas 会安全跳过不存在的元素。
- GitHub Pages 首次发布依赖仓库 Pages 设置和 Actions 权限。

## 代码变更

### 地图元素说明与高亮
```diff
++ src/ui/mapSelection.ts
+export type MapElementSelection =
+  | { kind: "AIRCRAFT" }
+  | { kind: "TARGET" }
+  | { kind: "EXTRACTION" }
+  | { kind: "WAYPOINT"; id: string }
+  | { kind: "TERRAIN"; id: string }
+  | { kind: "WEATHER"; id: string }
+  | { kind: "RADAR"; id: string };
+export function isSameMapSelection(...) { ... }

++ src/ui/MapElementPanel.tsx
+export function MapElementPanel(...) {
+  // 普通视图从 radarIntel 生成条目，AI DEBUG 才读取真实 radars。
+  return <CollapsibleSection title="MAP ELEMENTS" meta="点击定位">...</CollapsibleSection>;
+}

--- src/ui/App.tsx
+++ src/ui/App.tsx
+import { MapElementPanel } from "./MapElementPanel";
+const [mapSelection, setMapSelection] = useState<MapElementSelection | null>(null);
+<TacticalMap mapSelection={mapSelection} ... />
+<MapElementPanel mission={mission} showBelief={showBelief} selection={mapSelection} onSelectionChange={setMapSelection} />
+<div><dt>任务存档</dt><dd>本地自动保存</dd></div>

--- src/ui/TacticalMap.tsx
+++ src/ui/TacticalMap.tsx
+if (mapSelection) {
+  // 使用金色虚线光晕圈选飞机、目标、撤离区、航点、地形、天气或雷达情报位置。
+  context.stroke();
+}

--- src/ui/styles.css
+++ src/ui/styles.css
+.map-element-list { display: grid; gap: 6px; }
+.map-element-row { width: 100%; ... }
+.map-element-row.selected { border-color: #d6a644; ... }
```

### 航点按钮状态
```diff
--- src/ui/ControlPanel.tsx
+++ src/ui/ControlPanel.tsx
-const selectedEditable = selectedIndex !== null && canEditWaypoint(mission.route, selectedIndex);
+const selectedEditable = editable && selectedIndex !== null && canEditWaypoint(mission.route, selectedIndex);

+++ src/ui/ControlPanel.test.tsx
+it("飞机运行中禁用航点排序和删除按钮", () => { ... });
+it("暂停后允许删除选中的可编辑航点", () => { ... });
```

### 进度保存与恢复
```diff
+++ src/game/gamePersistence.ts
+export const RUN_SAVE_KEY = "f117-tactical-command-system:run:v1";
+export function saveRunProgress(state: RunState): void { ... }
+export function loadRunProgress(): RunState | undefined {
+  // 校验版本和最小结构；RUNNING 恢复为 PAUSED，并同步事件序号。
+}

--- src/domain/factories.ts
+++ src/domain/factories.ts
+export function syncEventSequenceFromRun(state: RunState): void { ... }

--- src/game/useGameController.ts
+++ src/game/useGameController.ts
-const [state, dispatch] = useReducer(gameReducer, undefined, () => createRun());
+const [state, dispatch] = useReducer(gameReducer, undefined, () => loadRunProgress() ?? createRun());
+const saveInterval = window.setInterval(() => saveRunProgress(stateRef.current), 1000);
+window.addEventListener("beforeunload", saveBeforeUnload);

--- src/ui/App.tsx
+++ src/ui/App.tsx
+const workspaceViewStorageKey = "f117-tactical-command-system:view:v1";
+const [campaignView, setCampaignView] = useState(() => loadCampaignView(state.currentMission?.status));
+useEffect(() => localStorage.setItem(workspaceViewStorageKey, campaignView ? "CAMPAIGN" : "TACTICAL"), [campaignView]);

+++ src/game/gamePersistence.test.ts
+it("保存并恢复完整 RunState", () => { ... });
+it("将飞行中的存档恢复为暂停状态", () => { ... });
+it("忽略损坏或版本不兼容的存档", () => { ... });
```

### GitHub Pages 与说明文档
```diff
+++ .github/workflows/deploy-pages.yml
+name: Deploy GitHub Pages
+on:
+  push:
+    branches: [main]
+  workflow_dispatch:
+jobs:
+  build: ...
+  deploy:
+    uses: actions/deploy-pages@v4

--- vite.config.ts
+++ vite.config.ts
+base: "./",

--- README.md
+++ README.md
+在线版本由 GitHub Pages 自动发布：https://lep-ton.github.io/F-117-Tactical-Command-System/
+右侧 `MAP ELEMENTS` 会说明并定位地图元素；任务与战役进度每秒自动保存。

--- AGENTS.md
+++ AGENTS.md
+- Run、Campaign 与当前 Mission 每秒自动保存到浏览器 `localStorage`。
+- 右侧 `MAP ELEMENTS` 遵守有限情报边界。
+- `main` 分支通过 GitHub Actions 部署到 GitHub Pages。
```

## 测试用例

### TC-001 地图元素定位
- 操作：进入任务，展开右侧 `MAP ELEMENTS`，依次点击目标、航点、天气和雷达。
- 预期：选中条目变为金色，Canvas 对应目标出现金色虚线光晕；普通视图雷达位置来自有限情报。
- 是否通过：通过（浏览器实测目标选中和完整元素列表）。

### TC-002 飞行中航点按钮置灰
- 操作：添加航点并开始执行。
- 预期：上移、下移、删除均禁用；暂停后可重新操作未执行航点。
- 是否通过：通过（组件测试与浏览器实测）。

### TC-003 刷新恢复任务
- 操作：飞行中刷新页面。
- 预期：Seed、航点、飞行位置、Campaign 进度均恢复，直接返回战术地图并显示“暂停重规划”。
- 是否通过：通过（浏览器实测恢复 `SESSION-64-UI`、2 个航点和暂停状态）。

### TC-004 自动化回归
- `npm run typecheck`：通过。
- `npm run test -- --run`：通过，23 个测试文件、103 项测试。
- `npm run build`：通过，GitHub Pages 相对资源构建成功。
