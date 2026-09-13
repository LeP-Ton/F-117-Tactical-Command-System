# 重构任务区域与部署范围

## 背景与目标
- 将飞机起点、目标区、雷达部署范围和撤离区候选位置集中配置。
- 让每个任务通过独立 Seed 稳定选择撤离区，不扰动其他程序生成随机序列。
- 删除撤离区雷达净空规则，同时保持目标区最低火控覆盖与 20 u 余量。
- 将存档载荷升级到版本 2，并为版本 1 按任务状态提供明确迁移策略。

## 约束与原则
- 坐标 `(100,900)`、`(900,900)`、`(900,100)` 均表示撤离区中心。
- 雷达 `200–800` 限制中心坐标，不限制探测半径。
- 版本 1 仅重建尚未执行的 `PLANNING` 任务；运行中、结果和复盘地图作为历史保留。
- 保持浏览器存储键不变，版本 2 直接恢复已保存的随机撤离区。
- 不调整雷达数量、雷达类型参数或目标区火控覆盖余量。

## 阶段与 TODO
- [x] 集中配置任务几何范围与撤离区候选中心。
- [x] 使用独立 `:EXTRACTION` 子 Seed 生成撤离区并接入任务工厂。
- [x] 将普通雷达、火控重部署及 Final Strike 雷达约束到双轴 `200–800`。
- [x] 删除撤离区净空模块、配置、调用链及旧测试。
- [x] 实现版本 2 存档与版本 1 分状态迁移。
- [x] 更新中英文任务引导、README、机制手册和核心认知。
- [x] 补齐批量边界、确定性、火控覆盖和存档兼容测试。
- [x] 完成类型检查、自动化测试、生产构建与实际页面验收。

## 关键实现
- 飞机起点为 `(100,100)`。
- 目标中心双轴范围为 `300–700`，攻击半径为 `100 u`。
- 雷达中心双轴范围为 `200–800`。
- 撤离区尺寸为 `100×100`，独立子 Seed 从三个合法中心等概率选择。
- 火控覆盖不足时沿原相对方位靠近目标，并在部署范围内钳制；目标位于部署范围内部，因此钳制只会缩短目标距离，不会破坏覆盖。
- v1 规划任务通过当前节点 Seed 和已恢复的长期任务效果重新调用统一任务准备流程，旧航点随旧规划清除。

## 测试用例
### TC-001 程序生成确定性与范围
1. 相同 Seed 重复生成任务。
2. 批量生成 100 个 Seed。
- 预期：同 Seed 完全一致；目标双轴在 300–700；雷达双轴在 200–800；撤离区仅出现三个合法区域且样本覆盖全部候选。
- 是否通过：通过。

### TC-002 起点、目标与撤离判定
1. 创建新任务并读取飞机、初始航点、目标和撤离区。
2. 校验撤离区边界包含规则。
- 预期：飞机及 INS 均为 (100,100)，攻击半径 100 u，撤离区为合法 100×100 候选。
- 是否通过：通过。

### TC-003 火控覆盖与雷达部署
1. 批量将火控雷达移出范围后重新部署。
2. 批量生成 Final Strike 后备火控。
3. 放置一部合法雷达在东南撤离区附近。
- 预期：所有重新部署及最终战雷达中心在 200–800；至少一部火控完整覆盖目标区并保留 20 u；非火控雷达不会因撤离区被移动。
- 是否通过：通过。

### TC-004 任务生命周期与存档迁移
1. 验证同一节点的预览、出击准备和重置。
2. 保存并读取版本 2 规划任务。
3. 构造版本 1 规划、运行中和历史复盘任务。
- 预期：预览、出击和重置使用相同撤离区；存储键不变；v2 保留撤离区与航线；v1 规划任务重建并清除旧航线；v1 运行中与复盘保留原地图。
- 是否通过：通过。

### TC-005 工程与页面验收
- `npm run typecheck`：通过。
- `npm run test -- --run`：31 个测试文件、148 项测试全部通过。
- `npm run build`：通过，Vite 完成 80 个模块的生产构建。
- 实际页面：INS 显示 X0100/Y0100，随机撤离区、目标圈和雷达布局显示正常；中英文引导均使用任务撤离区措辞；控制台无 warning/error。

## 代码变更
```diff
diff --git a/AGENTS.md b/AGENTS.md
index f99c911..619a23f 100644
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -25,8 +25,8 @@
 - 普通玩家视图通过 THREAT WARNING 显示可行动的模糊威胁阶段和导弹倒计时；真实 Contact、Belief 与 AI 评分只在 `TOTAL INTEL`、全景复盘或开发调试视图中显示。
 - 音效使用原生 Web Audio API 合成并由领域事件驱动；锁定与导弹警报属于可清理循环音，脱锁、任务结束或组件卸载时必须停止；顶部只提供总音量滑杆，玩家将音量调至 `0` 即可完全关闭声音，不设独立声音开关。
 - Mission Generator 根据 Seed 分别生成静态 Terrain、动态 Weather Cell、Radar Network 与 Target；天气的位置、范围、强度与类型由任务绝对时间确定性演化，相同 Seed 与时间必须完整复现。最终部署完成后再按固定有限情报基线生成玩家侧雷达报告。
-- OPERATION CODE 是 Run 根 Seed：字符串使用 FNV-1a 映射为 32 位状态并由 Mulberry32 生成确定性随机流；节点、任务内容、雷达情报、天气预报、最终战增援和逐次雷达探测使用带命名后缀的独立子 Seed，完整复现还要求相同 Run 历史、航线操作与任务时间。
-- 撤离区固定为东北侧 `(860, 50, 100×100)` 正方形；所有初始和 Final Strike 雷达部署最终统一执行撤离区净空约束：雷达中心不得进入撤离区周围 80 u，探测范围仍可覆盖撤离区。
+- OPERATION CODE 是 Run 根 Seed：字符串使用 FNV-1a 映射为 32 位状态并由 Mulberry32 生成确定性随机流；节点、任务内容、撤离区、雷达情报、天气预报、最终战增援和逐次雷达探测使用带命名后缀的独立子 Seed，完整复现还要求相同 Run 历史、航线操作与任务时间。
+- 地图任务几何集中配置：飞机起点固定为 `(100,100)`；目标中心双轴范围为 `300–700`、攻击半径 `100 u`；雷达中心双轴范围为 `200–800`。每个任务通过独立 Mission Seed 子流从 `(100,900)`、`(900,900)`、`(900,100)` 三个中心等概率选择 `100×100` 撤离区；雷达无需对起点或撤离区净空，探测范围允许覆盖两者。
 - 玩家在规划阶段获得带位置与尺度误差的任务绝对时刻 `T+30/60/90s` 出动前天气预报；它不是滚动预报，执行到对应时刻后过期条目与轮廓隐藏。
 - Weather Cell 会降低飞机有效速度：Cloud 10%、Fog 15%、Rain 20%、Storm 30%；重叠时取最强减速，不进行连乘，燃油仍按实际飞行距离消耗。
 - 任务网络固定为三个顺序二选一阶段与 Final Strike；只有摧毁目标并成功撤离才完成节点、关闭同层选择并解锁下一阶段；包括飞机损失在内的所有失败都会把当前节点标记为可重试的 `FAILED`，并保留同层备选供改选，但不会强化后续防空。
@@ -39,9 +39,9 @@
 - 情报权限由已完成 INTEL 节点派生：任务网络最多包含两个 INTEL 节点，一次完成后精确识别后续任务全部雷达位置与类型，两次后正式解锁默认开启且可关闭的 `TOTAL INTEL` 完整敌方态势；锁定节点可只读预览当前研判地图但不可执行。
 - 任务网络不维护连续情报质量资源、任务基础情报精度或独立 Intel 点数；INTEL 的长期收益完全由已完成节点派生的离散权限表示。
 - 任务事件最多保留最近 200 条并按事件 ID 驱动音频；结构化事件与敌方内部评分只在 `TOTAL INTEL`、全景复盘或开发调试视图中显示。
-- Run、Campaign、当前 Mission 与成功任务复盘每秒自动保存到浏览器 `localStorage`；刷新时恢复完整状态，飞行中的 Mission 保持执行并强制返回战术视图。
+- Run、Campaign、当前 Mission 与成功任务复盘每秒自动保存到浏览器 `localStorage`；当前载荷版本为 2 并兼容版本 1。v1 规划任务按节点 Seed 与既有任务收益重建并清除旧航线，运行中、结果与历史复盘保留原地图；v2 原样恢复已保存的随机撤离区。刷新时飞行中的 Mission 保持执行并强制返回战术视图。
 - 右侧 `MAP ELEMENTS` 解释并定位飞机、目标、撤离区、航点、地形、动态天气和玩家已知雷达；普通视图不得借此泄露真实雷达位置。
-- Mission Generator 当前没有严格的路径可达性或数学可通关证明；只保证撤离区雷达净空与目标区最低 Fire Control 覆盖等局部约束。
+- Mission Generator 当前没有严格的路径可达性或数学可通关证明；只保证部署坐标边界与目标区最低 Fire Control 覆盖等局部约束。
 - `main` 分支通过 GitHub Actions 构建并部署到 GitHub Pages，Vite 使用相对资源基址兼容仓库子路径。
 
 ## 运行方式
diff --git a/README.en.md b/README.en.md
index a41b6a7..0f70079 100644
--- a/README.en.md
+++ b/README.en.md
@@ -115,7 +115,7 @@ The exact reward multipliers, node states, and final-defense rules are canonical
 
 The tactical map presents the target, extraction zone, waypoints, terrain, dynamic weather, and radar intelligence. Canvas handles rendering and coordinate interaction; domain models and the reducer remain the sole owners of mission rules and state.
 
-Generation enforces local constraints such as extraction clearance and minimum target-area fire-control coverage. It does not yet prove mathematical reachability for every Seed. A generated battlefield is structurally valid, but not guaranteed to expose an obvious safe route.
+Generation enforces local constraints such as minimum target-area fire-control coverage. It does not yet prove mathematical reachability for every Seed. A generated battlefield is structurally valid, but not guaranteed to expose an obvious safe route; radar coverage over insertion or extraction is an allowed layout.
 
 ### 5.2 Terrain Provides Static Concealment
 
diff --git a/README.md b/README.md
index 75333ed..6e9e507 100644
--- a/README.md
+++ b/README.md
@@ -115,7 +115,7 @@
 
 战术地图同时承载目标、撤离区、航点、地形、动态天气和雷达情报。Canvas 负责绘制与坐标交互，任务状态和规则计算始终由领域模型与 reducer 管理。
 
-任务生成器会维护撤离区净空和目标区最低火控覆盖等局部约束，但当前没有对每个 Seed 做完整的数学可通关证明。生成算法保证战场结构成立，不承诺所有组合都存在显而易见的安全路径。
+任务生成器会维护目标区最低火控覆盖等局部约束，但当前没有对每个 Seed 做完整的数学可通关证明。生成算法保证战场结构成立，不承诺所有组合都存在显而易见的安全路径；雷达覆盖起点或撤离区属于允许的战场布局。
 
 ### 5.2 地形提供静态隐蔽
 
diff --git a/docs/game-mechanics.en.md b/docs/game-mechanics.en.md
index b996adb..b302c86 100644
--- a/docs/game-mechanics.en.md
+++ b/docs/game-mechanics.en.md
@@ -14,13 +14,13 @@ A mission follows this sequence:
 2. After confirmation, the aircraft follows the route continuously. A running mission cannot be paused, reset, or abandoned for the mission network.
 3. New waypoints may be added during flight, and legs beyond the current target waypoint may be changed. The current target and flown route cannot be edited.
 4. Entering the target's attack radius releases the weapon automatically without another confirmation.
-5. After destroying the target, reach the extraction zone in the northeast.
+5. After destroying the target, reach the extraction zone assigned to the mission.
 
 Base aircraft speed is `3.6 u/s`. Full fuel provides `2000 u` of travel, equal to two sides of the current `1000×1000` map. Fuel consumption uses actual accumulated movement, so turns and multi-waypoint paths are not undercounted as a straight line between frame endpoints. If remaining fuel cannot cover a complete Tick, the aircraft moves only to the end of its remaining range. Fuel exhaustion outside extraction fails the mission.
 
 The Operating Instructions can be opened at any time. They are an overlay above the terminal and do not pause a live mission. When opened during flight, “MISSION IN PROGRESS // OPERATION CONTINUES” means aircraft, radar, and engagement simulation continue to advance.
 
-First visits automatically start seven-step contextual Mission Guidance covering the mission network, effect assessment, planning entry, tactical map, complete route, launch confirmation, and live telemetry. The complete-route step advances only after at least one waypoint enters the target attack radius and the final waypoint enters extraction. The highlight layer does not intercept pointer input. Guidance dispatches no game actions and pauses neither Tick nor audio. Completion or dismissal uses a dedicated browser `localStorage` key outside `RunState`, Seeds, and debriefs. It can be restarted from Operating Instructions at any time. If started from a read-only intelligence or debrief view, it stays on hold until the player returns to the mission network.
+First visits automatically start seven-step contextual Mission Guidance covering the mission network, effect assessment, planning entry, tactical map, complete route, launch confirmation, and live telemetry. The complete-route step advances only after at least one waypoint enters the target attack radius and the final waypoint enters extraction. The highlight layer does not intercept pointer input. Guidance dispatches no game actions and pauses neither Tick nor audio. Completion or dismissal uses a dedicated browser `localStorage` key outside `RunState`, Seeds, and debriefs. It can be restarted from the Mission Guidance button at any time. If started from a read-only intelligence or debrief view, it stays on hold until the player returns to the mission network.
 
 Success requires both a destroyed target and entry into the extraction zone. A route that ends with the target intact, a destroyed target without extraction, mid-route fuel exhaustion, or aircraft loss is a failure. `FUEL RANGE` shows the remaining percentage and available distance; below 20% it enters the red warning state.
 
@@ -306,17 +306,19 @@ Each base mission generates:
 - 2–4 static mountain terrain zones with Seed-driven position, size, and detection multiplier.
 - 1–2 dynamic weather cells with Seed-driven type, position, size, velocity, intensity, phase, and period.
 - 3–5 radars cycling through Early Warning, Acquisition, and Fire Control, with Seed-driven position, range, and initial heading.
-- One target in the upper-middle portion of the map.
+- One target in the central mission area.
+- One mission extraction zone selected by an independent extraction sub-Seed.
 
 SEAD, STRIKE, COMMAND STRIKE, and the Final Strike target-area guard are applied before limited intelligence is regenerated against the final radar deployment.
 
-The map is `1000×1000 u` with a `100 u` grid. F-117 insertion is fixed at `(90, 850)`, extraction at `(860, 50, 100×100)`, and target generation at `x=400–790, y=100–390`. Radar centers keep `80 u` clearance from the extraction rectangle, though real coverage may extend into extraction. Final preparation also guarantees one Fire Control radar fully covers the target's `58 u` attack zone with `20 u` margin.
+The map is `1000×1000 u` with a `100 u` grid, and F-117 insertion is fixed at `(100, 100)`. Each mission uses an independent `<Node Seed>:EXTRACTION` random stream to choose one `100×100 u` extraction zone with equal probability from centers `(100,900)`, `(900,900)`, and `(900,100)`, yielding top-left corners `(50,850)`, `(850,850)`, and `(850,50)`. Both target-center axes are generated within `300–700`, with a `100 u` attack radius. Every initial, Final Strike, and redeployed radar center is constrained to `200–800` on both axes. Radars require no clearance from insertion or extraction, and their coverage may extend into either area. Final preparation guarantees one Fire Control radar fully covers the target attack zone with `20 u` margin.
 
 Named sub-Seeds isolate systems:
 
 ```text
 Limited radar intel  <Node Seed>-M01:INTEL:<Radar ID>
 Forecast error       <Node Seed>:FORECAST:<Weather ID>:<Horizon>
+Extraction choice    <Node Seed>:EXTRACTION
 Final reinforcement  <Node Seed>-M01:FINAL-DEFENSE
 Detection roll       <Node Seed>-M01:<Radar ID>:<Scan Count>
 ```
@@ -359,6 +361,6 @@ Final Strike assembles air defense from the direct effects of completed missions
 - Emission exposure, live ELINT direction finding, and live player-side intelligence updates.
 - Variable fuel load, external tanks, and independent weapon loadout. The fixed `2000 u` full-fuel range is implemented.
 - Formal difficulty settings, tutorial missions, multiple save slots, and cloud synchronization. One local browser Run is already persisted.
-- Strict route reachability and mathematical solvability proofs for generated missions. Current generation enforces only local constraints such as extraction clearance and target-area Fire Control coverage.
+- Strict route reachability and mathematical solvability proofs for generated missions. Current generation enforces only deployment-coordinate bounds and target-area Fire Control coverage.
 
 These absent systems must not be simulated through `TOTAL INTEL` or development debug visuals. Full visibility observes only enemy systems that actually exist.
diff --git a/docs/game-mechanics.md b/docs/game-mechanics.md
index f5c510d..d8e53bf 100644
--- a/docs/game-mechanics.md
+++ b/docs/game-mechanics.md
@@ -14,13 +14,13 @@
 2. 确认航线后，飞机自动沿航线持续飞行；任务执行中不能暂停、重置或返回任务网络。
 3. 飞行途中可以新增航点，并调整当前目标航点之后的路径；当前目标和已飞路径不可修改。
 4. 进入目标攻击半径后自动投放武器，无需手动确认。
-5. 摧毁目标后进入东北方向的撤离区。
+5. 摧毁目标后进入本次任务指定的撤离区。
 
 飞机基础飞行速度为 `3.6 u/s`，满油航程为 `2000 u`，等于当前 `1000×1000` 地图两条边的总长度。燃油按真实累计飞行距离消耗，跨越多个航点和转弯不会按帧首尾直线距离少计。燃油不足以完成当前 Tick 时，飞机最多移动至剩余航程终点；未进入撤离区便耗尽燃油会令当前任务失败。
 
 顶部“操作说明”可随时查看简明玩法。它只是覆盖在终端上方的说明层，不会暂停实时任务；执行中打开时，“任务执行中 // 作战进程未中断”表示飞机、雷达和交战系统仍在继续运行。
 
-首次访问自动开启七步情境式“任务引导”，依次覆盖任务网络、收益研判、规划入口、战术地图、完整航线、出动确认和执行态势。完整航线步骤只有在至少一个航点进入目标攻击圈、且最终航点进入撤离区后才能继续。高亮层不拦截鼠标操作，引导不派发游戏动作，也不暂停 Tick 或音频；完成或退出偏好使用独立的浏览器 `localStorage` 键保存，不进入 `RunState`、Seed 或复盘。顶部“操作说明”中的入口可以随时重新启动引导；在只读情报或复盘页面启动时，引导暂挂，返回任务网络后继续。
+首次访问自动开启七步情境式“任务引导”，依次覆盖任务网络、收益研判、规划入口、战术地图、完整航线、出动确认和执行态势。完整航线步骤只有在至少一个航点进入目标攻击圈、且最终航点进入撤离区后才能继续。高亮层不拦截鼠标操作，引导不派发游戏动作，也不暂停 Tick 或音频；完成或退出偏好使用独立的浏览器 `localStorage` 键保存，不进入 `RunState`、Seed 或复盘。顶部“任务引导”按钮可以随时重新启动引导；在只读情报或复盘页面启动时，引导暂挂，返回任务网络后继续。
 
 只有“目标已摧毁且飞机进入撤离区”才算成功。航线走完时目标仍存活、已经摧毁目标但没有进入撤离区，或中途耗尽燃油，都会判定任务失败。右侧 `FUEL RANGE` 显示剩余百分比与可用航程，低于 20% 时进入红色告警状态。
 
@@ -306,17 +306,19 @@ Command Strike 成功后，后续任务的指挥链效率乘以 65%。配置保
 - 2–4 个静态山地区域，包括位置、尺寸和探测遮蔽系数。
 - 1–2 个动态天气单元，包括初始类型、位置、尺寸、速度、强度、相位和周期。
 - 3–5 部雷达，类型按 Early Warning、Acquisition、Fire Control 循环，位置、范围和初始朝向由 Seed 决定。
-- 位于地图中上部的目标位置。
+- 位于地图中央任务区的目标位置。
+- 由独立撤离区子 Seed 等概率选出的任务撤离区。
 
 SEAD、STRIKE、COMMAND STRIKE 与 Final Strike 目标区守卫全部应用完毕后，系统才针对最终雷达部署生成玩家侧有限情报，避免战前报告引用应用收益前的基础雷达。
 
-地图固定为 `1000×1000 u`，网格间隔 `100 u`；F-117 插入点固定为 `(90, 850)`，撤离区固定为 `(860, 50, 100×100)`，目标生成范围为 `x=400–790、y=100–390`。雷达中心必须与撤离区边界保持 `80 u` 净空，但真实覆盖允许延伸进入撤离区。任务最终准备时还会保证至少一部 Fire Control 完整覆盖目标 `58 u` 攻击区并保留 `20 u` 余量。
+地图固定为 `1000×1000 u`，网格间隔 `100 u`；F-117 插入点固定为 `(100, 100)`。每个任务使用独立的 `<节点 Seed>:EXTRACTION` 随机流，从中心点 `(100,900)`、`(900,900)`、`(900,100)` 中等概率选择一个 `100×100 u` 撤离区，对应左上角分别为 `(50,850)`、`(850,850)`、`(850,50)`。目标中心的 X、Y 坐标均生成于 `300–700`，攻击半径为 `100 u`；所有初始、最终战增援及火控重部署雷达的中心坐标均限制在双轴 `200–800`。雷达无需对插入点或撤离区净空，真实覆盖可以进入这些区域。任务最终准备时还会保证至少一部 Fire Control 完整覆盖目标攻击区并保留 `20 u` 余量。
 
 为避免不同系统互相扰乱随机序列，以下内容使用独立的命名 Seed：
 
 ```text
 有限雷达情报  <节点 Seed>-M01:INTEL:<Radar ID>
 天气预报误差  <节点 Seed>:FORECAST:<Weather ID>:<Horizon>
+撤离区选择    <节点 Seed>:EXTRACTION
 最终战增援    <节点 Seed>-M01:FINAL-DEFENSE
 探测概率判定  <节点 Seed>-M01:<Radar ID>:<Scan Count>
 ```
@@ -359,6 +361,6 @@ SEAD、STRIKE、COMMAND STRIKE 与 Final Strike 目标区守卫全部应用完
 - 雷达开机辐射暴露、实时 ELINT 测向与玩家侧实时更新情报。
 - 可变燃油载荷、外挂油箱与独立弹药载荷（固定 `2000 u` 满油限制已实现）。
 - 正式难度设置、教程关卡、多存档槽和云端存档同步（当前已有单 Run 浏览器本地自动保存）。
-- 程序生成任务的严格路径可达性与数学可通关证明；当前只有撤离区净空和目标区火控覆盖等局部约束。
+- 程序生成任务的严格路径可达性与数学可通关证明；当前只有部署坐标边界和目标区火控覆盖等局部约束。
 
 这些未实现能力不应通过 `TOTAL INTEL` 或开发调试视图模拟；完整视图只负责观察已经存在的敌方内部状态。
diff --git a/src/config/gameConfig.ts b/src/config/gameConfig.ts
index 731fb7f..51198fa 100644
--- a/src/config/gameConfig.ts
+++ b/src/config/gameConfig.ts
@@ -5,6 +5,7 @@ export const gameConfig = {
     gridStep: 100,
   },
   aircraft: {
+    insertionPoint: { x: 100, y: 100 },
     speed: 3.6,
     /** 满油航程等于 1000×1000 地图两条边的总长度。 */
     fuelCapacityDistance: 2000,
@@ -17,6 +18,8 @@ export const gameConfig = {
     waypointHitRadius: 18,
   },
   radar: {
+    /** 所有新生成及重新部署雷达的中心坐标范围。 */
+    deploymentCoordinateRange: [200, 800] as const,
     baseDetectionProbability: 0.46,
     contactLifetimeMs: 8000,
     minErrorRadius: 16,
@@ -78,12 +81,16 @@ export const gameConfig = {
     missileFlightSeconds: 8,
   },
   mission: {
-    attackRadius: 58,
+    attackRadius: 100,
     attackAwarenessGain: 34,
-    /** 固定东北撤离空域，缩为正方形并下移上边界，为地图顶部状态文字留出间距。 */
-    extractionArea: { x: 860, y: 50, width: 100, height: 100 },
-    /** 雷达中心与撤离区边界的最小部署间距；探测范围仍可覆盖撤离区。 */
-    extractionRadarClearance: 80,
+    targetCoordinateRange: [300, 700] as const,
+    extractionSize: 100,
+    /** 坐标表示撤离区中心；任务生成时根据独立子 Seed 等概率选择。 */
+    extractionCenters: [
+      { x: 100, y: 900 },
+      { x: 900, y: 900 },
+      { x: 900, y: 100 },
+    ] as const,
   },
   initialSeed: "ZERO-RETURN-001",
 } as const;
diff --git a/src/domain/factories.ts b/src/domain/factories.ts
index 8987819..76fb938 100644
--- a/src/domain/factories.ts
+++ b/src/domain/factories.ts
@@ -7,7 +7,6 @@ import { generateRadarIntel } from "./intelSystem";
 import { createEngagementState } from "./engagementSystem";
 import { advanceWeather } from "./weatherSystem";
 import { ensureTargetFireControlCoverage } from "./targetDefense";
-import { enforceExtractionRadarClearance } from "./radarDeployment";
 import type { GameEvent, GameEventType, MissionSession, RunState } from "./types";
 
 export function createMission(seed: string): MissionSession {
@@ -18,11 +17,7 @@ export function createMission(seed: string): MissionSession {
     attackRadius: gameConfig.mission.attackRadius,
     destroyed: false,
   };
-  const radars = ensureTargetFireControlCoverage(
-    enforceExtractionRadarClearance(generated.radars, gameConfig.mission.extractionArea),
-    target,
-    gameConfig.mission.extractionArea,
-  );
+  const radars = ensureTargetFireControlCoverage(generated.radars, target);
   return {
     id: `mission-${seed}`,
     seed: `${seed}-M01`,
@@ -47,7 +42,7 @@ export function createMission(seed: string): MissionSession {
     engagement: createEngagementState(),
     commander: generated.commander,
     target,
-    extractionArea: { ...gameConfig.mission.extractionArea },
+    extractionArea: { ...generated.extractionArea },
     radarScanRateModifier: 1,
     commanderCoordinationModifier: 1,
     finalStrikeNotes: [],
diff --git a/src/domain/finalStrike.test.ts b/src/domain/finalStrike.test.ts
index 618cc2d..34cad39 100644
--- a/src/domain/finalStrike.test.ts
+++ b/src/domain/finalStrike.test.ts
@@ -17,6 +17,12 @@ describe("Final Strike 动态防空体系", () => {
     expect(finalMission.radars.length).toBe(mission.radars.length + 1);
     expect(finalMission.radars.some((radar) => radar.id === "FINAL-GUARD")).toBe(true);
     expect(finalMission.finalStrikeNotes).toContain("目标区后备火控雷达上线");
+    finalMission.radars.forEach((radar) => {
+      expect(radar.position.x).toBeGreaterThanOrEqual(200);
+      expect(radar.position.x).toBeLessThanOrEqual(800);
+      expect(radar.position.y).toBeGreaterThanOrEqual(200);
+      expect(radar.position.y).toBeLessThanOrEqual(800);
+    });
   });
 
   it("SEAD 不再阻止最终战后备火控雷达上线", () => {
@@ -46,4 +52,16 @@ describe("Final Strike 动态防空体系", () => {
 
     expect(applyFinalStrikeDefense(mission, history)).toEqual(applyFinalStrikeDefense(mission, history));
   });
+
+  it("批量最终战增援均保持在雷达部署范围内", () => {
+    for (let index = 0; index < 100; index += 1) {
+      const finalMission = applyFinalStrikeDefense(createMission(`FINAL-BOUNDS-${index}`), context());
+      finalMission.radars.forEach((radar) => {
+        expect(radar.position.x).toBeGreaterThanOrEqual(200);
+        expect(radar.position.x).toBeLessThanOrEqual(800);
+        expect(radar.position.y).toBeGreaterThanOrEqual(200);
+        expect(radar.position.y).toBeLessThanOrEqual(800);
+      });
+    }
+  });
 });
diff --git a/src/domain/finalStrike.ts b/src/domain/finalStrike.ts
index 1ac6492..c8e3116 100644
--- a/src/domain/finalStrike.ts
+++ b/src/domain/finalStrike.ts
@@ -19,12 +19,13 @@ function createGuardRadar(
   sweepAngleDegrees: number,
   type: RadarType,
 ): RadarState {
+  const [minimum, maximum] = gameConfig.radar.deploymentCoordinateRange;
   return {
     id,
     type,
     position: {
-      x: clamp(x, 90, gameConfig.world.width - 90),
-      y: clamp(y, 90, gameConfig.world.height - 90),
+      x: clamp(x, minimum, maximum),
+      y: clamp(y, minimum, maximum),
     },
     range,
     sweepAngleDegrees,
diff --git a/src/domain/missionRules.test.ts b/src/domain/missionRules.test.ts
index 80ab43e..d209af8 100644
--- a/src/domain/missionRules.test.ts
+++ b/src/domain/missionRules.test.ts
@@ -3,6 +3,23 @@ import { createMission } from "./factories";
 import { canAttackTarget, distanceToExtraction, isInsideExtraction } from "./missionRules";
 
 describe("Mission Rules", () => {
+  it("任务使用固定起点、100 u 攻击半径和合法随机撤离区", () => {
+    const mission = createMission("MISSION-GEOMETRY");
+    const extractionCenters = [
+      { x: 100, y: 900 },
+      { x: 900, y: 900 },
+      { x: 900, y: 100 },
+    ];
+    expect(mission.aircraft.position).toEqual({ x: 100, y: 100 });
+    expect(mission.route.waypoints[0]?.position).toEqual({ x: 100, y: 100 });
+    expect(mission.target.attackRadius).toBe(100);
+    expect(mission.extractionArea).toMatchObject({ width: 100, height: 100 });
+    expect(extractionCenters).toContainEqual({
+      x: mission.extractionArea.x + mission.extractionArea.width / 2,
+      y: mission.extractionArea.y + mission.extractionArea.height / 2,
+    });
+  });
+
   it("只有进入攻击半径且目标仍有效时才能攻击", () => {
     const mission = createMission("ATTACK");
     mission.status = "PLANNING";
@@ -16,10 +33,10 @@ describe("Mission Rules", () => {
 
   it("撤离区边界包含边缘位置", () => {
     const mission = createMission("EXTRACT");
-    expect(mission.extractionArea).toEqual({ x: 860, y: 50, width: 100, height: 100 });
-    expect(isInsideExtraction({ x: 860, y: 50 }, mission.extractionArea)).toBe(true);
-    expect(isInsideExtraction({ x: 960, y: 150 }, mission.extractionArea)).toBe(true);
-    expect(isInsideExtraction({ x: 859, y: 50 }, mission.extractionArea)).toBe(false);
+    const area = mission.extractionArea;
+    expect(isInsideExtraction({ x: area.x, y: area.y }, area)).toBe(true);
+    expect(isInsideExtraction({ x: area.x + area.width, y: area.y + area.height }, area)).toBe(true);
+    expect(isInsideExtraction({ x: area.x - 1, y: area.y }, area)).toBe(false);
   });
 
   it("撤离距离按最近边界计算并在区域内归零", () => {
diff --git a/src/domain/radarDeployment.test.ts b/src/domain/radarDeployment.test.ts
deleted file mode 100644
index 8f68587..0000000
--- a/src/domain/radarDeployment.test.ts
+++ /dev/null
@@ -1,55 +0,0 @@
-import { describe, expect, it } from "vitest";
-import { gameConfig } from "../config/gameConfig";
-import { createMission } from "./factories";
-import { createRadarOperatorState } from "./radarOperatorAI";
-import { enforceExtractionRadarClearance } from "./radarDeployment";
-import type { RadarState } from "./types";
-
-function radarAt(x: number, y: number): RadarState {
-  return {
-    id: "TEST-RADAR",
-    type: "ACQUISITION",
-    position: { x, y },
-    range: 300,
-    sweepAngleDegrees: 0,
-    scanAccumulatorSeconds: 0,
-    scanCount: 0,
-    operator: createRadarOperatorState(),
-  };
-}
-
-describe("撤离区雷达部署净空", () => {
-  it("把撤离区内及净空范围内的雷达移动到最近可行边界", () => {
-    const area = gameConfig.mission.extractionArea;
-    const [inside, nearby, safe] = enforceExtractionRadarClearance([
-      radarAt(880, 120),
-      { ...radarAt(830, 180), id: "NEARBY" },
-      { ...radarAt(700, 300), id: "SAFE" },
-    ], area);
-
-    expect(inside?.position).toEqual({ x: 780, y: 120 });
-    expect(nearby?.position).toEqual({ x: 780, y: 180 });
-    expect(safe?.position).toEqual({ x: 700, y: 300 });
-  });
-
-  it("程序生成任务中的所有雷达均遵守 80u 撤离净空", () => {
-    for (let index = 0; index < 100; index += 1) {
-      const mission = createMission(`CLEARANCE-${index}`);
-      for (const radar of mission.radars) {
-        const area = mission.extractionArea;
-        const clearance = gameConfig.mission.extractionRadarClearance;
-        const violates = radar.position.x > area.x - clearance
-          && radar.position.x < area.x + area.width + clearance
-          && radar.position.y > area.y - clearance
-          && radar.position.y < area.y + area.height + clearance;
-        expect(violates).toBe(false);
-      }
-      const targetFireControl = mission.radars.some((radar) => radar.type === "FIRE_CONTROL"
-        && Math.hypot(
-          radar.position.x - mission.target.position.x,
-          radar.position.y - mission.target.position.y,
-        ) + mission.target.attackRadius <= radar.range - 20 + 1e-6);
-      expect(targetFireControl, mission.seed).toBe(true);
-    }
-  });
-});
diff --git a/src/domain/radarDeployment.ts b/src/domain/radarDeployment.ts
deleted file mode 100644
index 9ce716a..0000000
--- a/src/domain/radarDeployment.ts
+++ /dev/null
@@ -1,39 +0,0 @@
-import { gameConfig } from "../config/gameConfig";
-import type { ExtractionArea, RadarState, Vector2 } from "./types";
-
-const RADAR_MAP_MARGIN = 80;
-
-function isInsideExpandedArea(position: Vector2, area: ExtractionArea, clearance: number): boolean {
-  return position.x > area.x - clearance
-    && position.x < area.x + area.width + clearance
-    && position.y > area.y - clearance
-    && position.y < area.y + area.height + clearance;
-}
-
-/**
- * 将雷达中心移出撤离区的固定净空范围。只调整违反约束的雷达，且选择地图内
- * 位移最短的可行边界；这不会限制雷达搜索半径覆盖撤离区。
- */
-export function enforceExtractionRadarClearance(
-  radars: RadarState[],
-  extractionArea: ExtractionArea,
-  clearance = gameConfig.mission.extractionRadarClearance,
-): RadarState[] {
-  const candidates = (position: Vector2): Vector2[] => [
-    { x: extractionArea.x - clearance, y: position.y },
-    { x: extractionArea.x + extractionArea.width + clearance, y: position.y },
-    { x: position.x, y: extractionArea.y - clearance },
-    { x: position.x, y: extractionArea.y + extractionArea.height + clearance },
-  ].filter((candidate) => candidate.x >= RADAR_MAP_MARGIN
-    && candidate.x <= gameConfig.world.width - RADAR_MAP_MARGIN
-    && candidate.y >= RADAR_MAP_MARGIN
-    && candidate.y <= gameConfig.world.height - RADAR_MAP_MARGIN);
-
-  return radars.map((radar) => {
-    if (!isInsideExpandedArea(radar.position, extractionArea, clearance)) return radar;
-    const position = candidates(radar.position)
-      .sort((first, second) => Math.hypot(first.x - radar.position.x, first.y - radar.position.y)
-        - Math.hypot(second.x - radar.position.x, second.y - radar.position.y))[0];
-    return position ? { ...radar, position } : radar;
-  });
-}
diff --git a/src/domain/route.ts b/src/domain/route.ts
index 722b71e..ee22871 100644
--- a/src/domain/route.ts
+++ b/src/domain/route.ts
@@ -1,7 +1,7 @@
 import { gameConfig } from "../config/gameConfig";
 import type { RouteState, Vector2, Waypoint } from "./types";
 
-export const insertionPoint: Vector2 = { x: 90, y: 850 };
+export const insertionPoint: Vector2 = { ...gameConfig.aircraft.insertionPoint };
 
 export function createInitialRoute(): RouteState {
   return {
diff --git a/src/domain/targetDefense.test.ts b/src/domain/targetDefense.test.ts
index aaa251e..6eb220a 100644
--- a/src/domain/targetDefense.test.ts
+++ b/src/domain/targetDefense.test.ts
@@ -12,20 +12,40 @@ function isCovered(mission: ReturnType<typeof createMission>): boolean {
 
 describe("目标区火控覆盖", () => {
   it("不同 Seed 的初始任务始终由 Fire Control 完整覆盖攻击区", () => {
-    for (let index = 0; index < 30; index += 1) {
-      expect(isCovered(createMission(`TARGET-COVERAGE-${index}`))).toBe(true);
+    for (let index = 0; index < 100; index += 1) {
+      const mission = createMission(`TARGET-COVERAGE-${index}`);
+      expect(isCovered(mission)).toBe(true);
+      const displaced = mission.radars.map((radar) => radar.type === "FIRE_CONTROL"
+        ? { ...radar, position: { x: 900, y: 900 } }
+        : radar);
+      const redeployed = ensureTargetFireControlCoverage(displaced, mission.target);
+      expect(isCovered({ ...mission, radars: redeployed })).toBe(true);
+      redeployed.forEach((radar) => {
+        expect(radar.position.x).toBeGreaterThanOrEqual(200);
+        expect(radar.position.x).toBeLessThanOrEqual(800);
+        expect(radar.position.y).toBeGreaterThanOrEqual(200);
+        expect(radar.position.y).toBeLessThanOrEqual(800);
+      });
     }
   });
 
-  it("覆盖不足时移动最近火控雷达并保持其他雷达不变", () => {
+  it("覆盖不足时在部署范围内移动最近火控雷达并保持其他雷达不变", () => {
     const mission = createMission("TARGET-REDEPLOY");
     const fireControl = mission.radars.find((radar) => radar.type === "FIRE_CONTROL")!;
     const displaced = mission.radars.map((radar) => radar.id === fireControl.id
-      ? { ...radar, position: { x: 80, y: 900 } }
-      : radar);
+      ? { ...radar, position: { x: 900, y: 900 } }
+      // 位于东南撤离区附近的雷达是合法部署，不得再因撤离区净空规则而移动。
+      : radar.type === "ACQUISITION"
+        ? { ...radar, position: { x: 800, y: 800 } }
+        : radar);
     const result = ensureTargetFireControlCoverage(displaced, mission.target);
     const restored = result.find((radar) => radar.id === fireControl.id)!;
-    expect(restored.position).not.toEqual({ x: 80, y: 900 });
+    expect(restored.position).not.toEqual({ x: 900, y: 900 });
+    expect(restored.position.x).toBeGreaterThanOrEqual(200);
+    expect(restored.position.x).toBeLessThanOrEqual(800);
+    expect(restored.position.y).toBeGreaterThanOrEqual(200);
+    expect(restored.position.y).toBeLessThanOrEqual(800);
+    expect(isCovered({ ...mission, radars: result })).toBe(true);
     expect(result.filter((radar) => radar.id !== fireControl.id)).toEqual(
       displaced.filter((radar) => radar.id !== fireControl.id),
     );
diff --git a/src/domain/targetDefense.ts b/src/domain/targetDefense.ts
index bc722e8..6ad71de 100644
--- a/src/domain/targetDefense.ts
+++ b/src/domain/targetDefense.ts
@@ -1,5 +1,5 @@
 import { gameConfig } from "../config/gameConfig";
-import type { ExtractionArea, MissionTarget, RadarState, Vector2 } from "./types";
+import type { MissionTarget, RadarState, Vector2 } from "./types";
 
 export const TARGET_FIRE_CONTROL_MARGIN = 20;
 
@@ -8,21 +8,13 @@ function distance(first: Vector2, second: Vector2): number {
 }
 
 function clampPosition(position: Vector2): Vector2 {
+  const [minimum, maximum] = gameConfig.radar.deploymentCoordinateRange;
   return {
-    x: Math.max(80, Math.min(gameConfig.world.width - 80, position.x)),
-    y: Math.max(80, Math.min(gameConfig.world.height - 80, position.y)),
+    x: Math.max(minimum, Math.min(maximum, position.x)),
+    y: Math.max(minimum, Math.min(maximum, position.y)),
   };
 }
 
-function respectsExtractionClearance(position: Vector2, extractionArea?: ExtractionArea): boolean {
-  if (!extractionArea) return true;
-  const clearance = gameConfig.mission.extractionRadarClearance;
-  return position.x <= extractionArea.x - clearance
-    || position.x >= extractionArea.x + extractionArea.width + clearance
-    || position.y <= extractionArea.y - clearance
-    || position.y >= extractionArea.y + extractionArea.height + clearance;
-}
-
 /**
  * 保证至少一部火控雷达完整覆盖目标攻击区。只在覆盖不足时移动最近的火控雷达，
  * 保留 Seed 生成的相对方位，并在范围内预留固定余量。
@@ -30,13 +22,11 @@ function respectsExtractionClearance(position: Vector2, extractionArea?: Extract
 export function ensureTargetFireControlCoverage(
   radars: RadarState[],
   target: MissionTarget,
-  extractionArea?: ExtractionArea,
 ): RadarState[] {
   const fireControls = radars.filter((radar) => radar.type === "FIRE_CONTROL");
   if (fireControls.length === 0) return radars;
   if (fireControls.some((radar) => distance(radar.position, target.position) + target.attackRadius
-    <= radar.range - TARGET_FIRE_CONTROL_MARGIN
-    && respectsExtractionClearance(radar.position, extractionArea))) return radars;
+    <= radar.range - TARGET_FIRE_CONTROL_MARGIN)) return radars;
 
   const selected = fireControls
     .sort((first, second) => distance(first.position, target.position) - distance(second.position, target.position))[0]!;
@@ -45,14 +35,11 @@ export function ensureTargetFireControlCoverage(
   const currentDistance = Math.hypot(dx, dy);
   const angle = currentDistance > 0 ? Math.atan2(dy, dx) : 0;
   const deploymentDistance = Math.max(0, selected.range - target.attackRadius - TARGET_FIRE_CONTROL_MARGIN);
-  // 从原始相对方位开始环绕目标寻找位置，避免目标覆盖与撤离净空互相覆盖。
-  const position = Array.from({ length: 360 }, (_, offset) => angle + offset * Math.PI / 180)
-    .map((candidateAngle) => clampPosition({
-      x: target.position.x + Math.cos(candidateAngle) * deploymentDistance,
-      y: target.position.y + Math.sin(candidateAngle) * deploymentDistance,
-    }))
-    .find((candidate) => respectsExtractionClearance(candidate, extractionArea))
-    ?? clampPosition(target.position);
+  // 目标本身位于雷达部署范围内部；钳制只会让边缘方向上的雷达更靠近目标，不会破坏完整覆盖。
+  const position = clampPosition({
+    x: target.position.x + Math.cos(angle) * deploymentDistance,
+    y: target.position.y + Math.sin(angle) * deploymentDistance,
+  });
 
   return radars.map((radar) => radar.id === selected.id ? { ...radar, position } : radar);
 }
diff --git a/src/game/gamePersistence.test.ts b/src/game/gamePersistence.test.ts
index 5ceecb1..43405f6 100644
--- a/src/game/gamePersistence.test.ts
+++ b/src/game/gamePersistence.test.ts
@@ -7,21 +7,33 @@ describe("任务进度保存", () => {
 
   it("保存并恢复完整 Run 状态", () => {
     const state = createRun("SAVE-RESTORE");
+    const savedExtractionArea = { x: 850, y: 850, width: 100, height: 100 };
     const changed = {
       ...state,
       currentMission: {
         ...state.currentMission!,
         elapsedMs: 12_500,
         aircraft: { ...state.currentMission!.aircraft, fuelRemaining: 1450 },
+        extractionArea: savedExtractionArea,
+        route: {
+          ...state.currentMission!.route,
+          waypoints: [
+            ...state.currentMission!.route.waypoints,
+            { id: "saved-route", kind: "NAVIGATION" as const, status: "PENDING" as const, position: { x: 450, y: 550 } },
+          ],
+        },
       },
     };
 
     saveRunProgress(changed);
 
+    expect(JSON.parse(window.localStorage.getItem(RUN_SAVE_KEY)!).version).toBe(2);
     const restored = loadRunProgress();
     expect(restored?.seed).toBe("SAVE-RESTORE");
     expect(restored?.currentMission?.elapsedMs).toBe(12_500);
     expect(restored?.currentMission?.aircraft.fuelRemaining).toBe(1450);
+    expect(restored?.currentMission?.extractionArea).toEqual(savedExtractionArea);
+    expect(restored?.currentMission?.route).toEqual(changed.currentMission.route);
   });
 
   it("刷新时运行中的任务保持执行状态", () => {
@@ -72,18 +84,69 @@ describe("任务进度保存", () => {
     expect(restored?.currentMission?.radarScanRateModifier).toBeCloseTo(0.9);
   });
 
-  it("恢复旧存档时将撤离区迁移到当前固定区域", () => {
+  it("版本 1 的规划任务按节点 Seed 重建并清除旧航线", () => {
     const state = createRun("SAVE-LEGACY-EXTRACTION");
     const legacyState = {
       ...state,
       currentMission: {
         ...state.currentMission!,
         extractionArea: { x: 850, y: 30, width: 120, height: 120 },
+        route: {
+          ...state.currentMission!.route,
+          waypoints: [
+            ...state.currentMission!.route.waypoints,
+            { id: "legacy-route", kind: "NAVIGATION" as const, status: "PENDING" as const, position: { x: 500, y: 500 } },
+          ],
+        },
+      },
+    };
+    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: legacyState }));
+
+    const restored = loadRunProgress();
+    expect([
+      { x: 50, y: 850, width: 100, height: 100 },
+      { x: 850, y: 850, width: 100, height: 100 },
+      { x: 850, y: 50, width: 100, height: 100 },
+    ]).toContainEqual(restored?.currentMission?.extractionArea);
+    expect(restored?.currentMission?.route.waypoints).toEqual([
+      { id: "insertion", kind: "INSERTION", position: { x: 100, y: 100 }, status: "LOCKED" },
+    ]);
+    expect(restored?.currentMission?.radarScanRateModifier).toBe(state.enemyState.radarScanRateModifier);
+  });
+
+  it("版本 1 的运行中任务与历史复盘保留旧地图", () => {
+    const state = createRun("SAVE-LEGACY-HISTORY");
+    const legacyExtractionArea = { x: 860, y: 50, width: 100, height: 100 };
+    const legacyMission = {
+      ...state.currentMission!,
+      status: "RUNNING" as const,
+      extractionArea: legacyExtractionArea,
+      route: {
+        ...state.currentMission!.route,
+        waypoints: [
+          ...state.currentMission!.route.waypoints,
+          { id: "active-route", kind: "NAVIGATION" as const, status: "PENDING" as const, position: { x: 600, y: 600 } },
+        ],
+      },
+    };
+    const legacyState = {
+      ...state,
+      currentMission: legacyMission,
+      missionDebriefs: {
+        "C0-0": {
+          nodeId: "C0-0",
+          completedAt: 5000,
+          intelAccessTier: 0 as const,
+          mission: { ...legacyMission, status: "SUCCESS" as const },
+        },
       },
     };
     window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: legacyState }));
 
-    expect(loadRunProgress()?.currentMission?.extractionArea).toEqual({ x: 860, y: 50, width: 100, height: 100 });
+    const restored = loadRunProgress();
+    expect(restored?.currentMission?.extractionArea).toEqual(legacyExtractionArea);
+    expect(restored?.currentMission?.route).toEqual(legacyMission.route);
+    expect(restored?.missionDebriefs["C0-0"]?.mission.extractionArea).toEqual(legacyExtractionArea);
   });
 
   it("恢复旧存档时移除废弃的情报质量与敌方升级字段", () => {
@@ -110,6 +173,7 @@ describe("任务进度保存", () => {
       },
       currentMission: {
         ...state.currentMission!,
+        status: "RUNNING" as const,
         intelAccuracy: 0.98,
         flightPath: [{ x: 90, y: 900 }, { x: 400, y: 800 }],
         adaptationNotes: ["南部航路搜索加强"],
diff --git a/src/game/gamePersistence.ts b/src/game/gamePersistence.ts
index cf29184..60a5ad8 100644
--- a/src/game/gamePersistence.ts
+++ b/src/game/gamePersistence.ts
@@ -1,10 +1,12 @@
 import { syncEventSequenceFromRun } from "../domain/factories";
 import { campaignBalance } from "../domain/campaignBalance";
 import type { MissionDebrief, MissionSession, RunState } from "../domain/types";
-import { gameConfig } from "../config/gameConfig";
+import { generateExtractionArea } from "../procedural/missionGenerator";
+import { prepareCampaignMission } from "./gameReducer";
 
 export const RUN_SAVE_KEY = "f117-tactical-command-system:run:v1";
-const SAVE_VERSION = 1;
+const SAVE_VERSION = 2;
+const SUPPORTED_SAVE_VERSIONS = new Set([1, SAVE_VERSION]);
 
 interface SavedRun {
   version: number;
@@ -47,11 +49,19 @@ function restoreMissionCompatibility(mission: MissionSession, scanRateModifier:
     ...currentMission,
     radarScanRateModifier: mission.radarScanRateModifier ?? scanRateModifier,
     finalStrikeNotes: (currentMission.finalStrikeNotes ?? []).filter((note) => !isRemovedEnemyEscalationNote(note)),
-    // 固定任务区域属于当前规则配置，恢复旧存档时同步迁移，避免画面与撤离判定继续使用旧尺寸。
-    extractionArea: { ...gameConfig.mission.extractionArea },
+    // 已执行任务与复盘必须保留当时的撤离区；极旧存档缺失该字段时才使用 Seed 确定的当前规则补全。
+    extractionArea: currentMission.extractionArea ?? generateExtractionArea(getMissionContentSeed(mission)),
   };
 }
 
+/** MissionSession 的运行 Seed 带有 `-M01` 后缀，地图内容仍由工厂输入的节点 Seed 生成。 */
+function getMissionContentSeed(mission: MissionSession): string {
+  const missionIdPrefix = "mission-";
+  return mission.id.startsWith(missionIdPrefix)
+    ? mission.id.slice(missionIdPrefix.length)
+    : mission.seed.replace(/-M01$/, "");
+}
+
 /** 旧存档中的警戒与航迹适应简报不再属于当前规则，恢复时统一清理。 */
 function isRemovedEnemyEscalationNote(note: string): boolean {
   return /^(?:低 Enemy Alert|敌方警戒较低|Enemy Alert \d+|敌方警戒 \d+)：/.test(note)
@@ -64,7 +74,7 @@ export function loadRunProgress(): RunState | undefined {
     const raw = window.localStorage.getItem(RUN_SAVE_KEY);
     if (!raw) return undefined;
     const payload = JSON.parse(raw) as Partial<SavedRun>;
-    if (payload.version !== SAVE_VERSION || !isRunState(payload.state)) return undefined;
+    if (!payload.version || !SUPPORTED_SAVE_VERSIONS.has(payload.version) || !isRunState(payload.state)) return undefined;
     const legacyState = payload.state as RunState & {
       resources?: unknown;
       enemyState: RunState["enemyState"] & { adaptationLevel?: number; tacticalProfile?: unknown };
@@ -114,6 +124,11 @@ export function loadRunProgress(): RunState | undefined {
           ? restoreMissionCompatibility(legacyState.currentMission, radarScanRateModifier)
           : undefined,
     };
+    if (payload.version === 1 && legacyStatus === "PLANNING") {
+      const currentNode = restored.campaign.nodes.find((node) => node.id === restored.campaign.currentNodeId);
+      // v1 规划任务使用旧地图范围；按相同节点 Seed 和当前长期收益完整重建，并丢弃尚未执行的旧航线。
+      if (currentNode) restored.currentMission = prepareCampaignMission(restored, currentNode);
+    }
     syncEventSequenceFromRun(restored);
     return restored;
   } catch {
diff --git a/src/game/gameReducer.test.ts b/src/game/gameReducer.test.ts
index 20bf267..fec378a 100644
--- a/src/game/gameReducer.test.ts
+++ b/src/game/gameReducer.test.ts
@@ -1,9 +1,20 @@
 import { describe, expect, it } from "vitest";
 import { createMission, createRun } from "../domain/factories";
 import { getIntelAccessTier } from "../domain/intelAccess";
-import { gameReducer } from "./gameReducer";
+import { gameReducer, prepareCampaignMission } from "./gameReducer";
 
 describe("gameReducer", () => {
+  it("同一节点的预览、出击准备和重置使用相同撤离区", () => {
+    const state = createRun("EXTRACTION-LIFECYCLE");
+    const node = state.campaign.nodes.find((candidate) => candidate.id === "C0-1")!;
+    const preview = prepareCampaignMission(state, node);
+    const selected = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: node.id });
+    const reset = gameReducer(selected, { type: "RESET" });
+
+    expect(selected.currentMission?.extractionArea).toEqual(preview.extractionArea);
+    expect(reset.currentMission?.extractionArea).toEqual(preview.extractionArea);
+  });
+
   it("重置任务会保留当前战役节点与 Run 持久状态", () => {
     let state = createRun("RESET-CURRENT-NODE");
     const secondNode = state.campaign.nodes.find((node) => node.id === "C0-1")!;
@@ -177,7 +188,10 @@ describe("gameReducer", () => {
   it("摧毁目标并进入撤离区后记录成功", () => {
     let state = createRun("SUCCESS");
     const mission = state.currentMission!;
-    const extractionPoint = { x: 900, y: 80 };
+    const extractionPoint = {
+      x: mission.extractionArea.x + mission.extractionArea.width / 2,
+      y: mission.extractionArea.y + mission.extractionArea.height / 2,
+    };
     state = {
       ...state,
       currentMission: {
diff --git a/src/game/gameReducer.ts b/src/game/gameReducer.ts
index 4e001d4..346affd 100644
--- a/src/game/gameReducer.ts
+++ b/src/game/gameReducer.ts
@@ -13,7 +13,6 @@ import { applyFinalStrikeDefense } from "../domain/finalStrike";
 import { advanceEngagement } from "../domain/engagementSystem";
 import { advanceWeather, getWeatherSpeedFactor } from "../domain/weatherSystem";
 import { ensureTargetFireControlCoverage } from "../domain/targetDefense";
-import { enforceExtractionRadarClearance } from "../domain/radarDeployment";
 import { campaignBalance } from "../domain/campaignBalance";
 import {
   addWaypoint,
@@ -68,11 +67,7 @@ export function prepareCampaignMission(state: RunState, node: CampaignNode): Mis
         .map((candidate) => candidate.type),
     })
     : adjustedMission;
-  const radars = ensureTargetFireControlCoverage(
-    enforceExtractionRadarClearance(finalMission.radars, finalMission.extractionArea),
-    finalMission.target,
-    finalMission.extractionArea,
-  );
+  const radars = ensureTargetFireControlCoverage(finalMission.radars, finalMission.target);
 
   const generatedIntel = generateRadarIntel(selectedMission.seed, radars);
   const radarIntel = getIntelAccessTier(state.campaign) >= 1
diff --git a/src/i18n/I18n.tsx b/src/i18n/I18n.tsx
index 3b4c354..f48fa0a 100644
--- a/src/i18n/I18n.tsx
+++ b/src/i18n/I18n.tsx
@@ -143,7 +143,7 @@ export const localeCatalogs = {
         },
         map: {
           title: "识别战术地图",
-          body: "先定位起始点、打击目标与东北撤离区，再读取雷达估计圈、地形和动态天气。雷达情报可能遗漏目标或存在位置与范围误差。",
+          body: "先定位起始点、打击目标与本次任务的撤离区，再读取雷达估计圈、地形和动态天气。雷达情报可能遗漏目标或存在位置与范围误差。",
         },
         route: {
           title: "构建完整航线",
@@ -458,7 +458,7 @@ export const localeCatalogs = {
         },
         map: {
           title: "READ THE TACTICAL MAP",
-          body: "Locate insertion, the strike target, and the northeast extraction zone. Then inspect estimated radar circles, terrain, and dynamic weather. Radar reports may contain omissions and position or range error.",
+          body: "Locate insertion, the strike target, and this mission's extraction zone. Then inspect estimated radar circles, terrain, and dynamic weather. Radar reports may contain omissions and position or range error.",
         },
         route: {
           title: "BUILD A COMPLETE ROUTE",
diff --git a/src/procedural/missionGenerator.test.ts b/src/procedural/missionGenerator.test.ts
index 0b9606a..9ec4bef 100644
--- a/src/procedural/missionGenerator.test.ts
+++ b/src/procedural/missionGenerator.test.ts
@@ -1,10 +1,17 @@
 import { describe, expect, it } from "vitest";
 import { createMission } from "../domain/factories";
-import { generateMissionContent } from "./missionGenerator";
+import { generateExtractionArea, generateMissionContent } from "./missionGenerator";
+
+const extractionAreas = [
+  { x: 50, y: 850, width: 100, height: 100 },
+  { x: 850, y: 850, width: 100, height: 100 },
+  { x: 850, y: 50, width: 100, height: 100 },
+];
 
 describe("Mission Generator", () => {
   it("相同 Seed 完整复现任务内容", () => {
     expect(generateMissionContent("DAILY-117")).toEqual(generateMissionContent("DAILY-117"));
+    expect(generateExtractionArea("DAILY-117")).toEqual(generateExtractionArea("DAILY-117"));
     expect(createMission("DAILY-117")).toEqual(createMission("DAILY-117"));
   });
 
@@ -15,9 +22,10 @@ describe("Mission Generator", () => {
     expect(first.targetPosition).not.toEqual(second.targetPosition);
   });
 
-  it("连续生成十个任务均满足数量和地图边界", () => {
+  it("批量任务均满足目标、雷达和撤离区边界", () => {
     const signatures = new Set<string>();
-    for (let index = 0; index < 10; index += 1) {
+    const observedExtractionAreas = new Set<string>();
+    for (let index = 0; index < 100; index += 1) {
       const generated = generateMissionContent(`BATCH-${index}`);
       const terrain = generated.terrain;
       const weather = generated.weather;
@@ -31,14 +39,24 @@ describe("Mission Generator", () => {
       expect(weather.length).toBeGreaterThanOrEqual(1);
       expect(generated).not.toHaveProperty("intelAccuracy");
       generated.radars.forEach((radar) => {
-        expect(radar.position.x).toBeGreaterThanOrEqual(0);
-        expect(radar.position.x).toBeLessThanOrEqual(1000);
-        expect(radar.position.y).toBeGreaterThanOrEqual(0);
-        expect(radar.position.y).toBeLessThanOrEqual(1000);
+        expect(radar.position.x).toBeGreaterThanOrEqual(200);
+        expect(radar.position.x).toBeLessThanOrEqual(800);
+        expect(radar.position.y).toBeGreaterThanOrEqual(200);
+        expect(radar.position.y).toBeLessThanOrEqual(800);
       });
-      signatures.add(JSON.stringify({ radars: generated.radars, target: generated.targetPosition }));
+      expect(generated.targetPosition.x).toBeGreaterThanOrEqual(300);
+      expect(generated.targetPosition.x).toBeLessThanOrEqual(700);
+      expect(generated.targetPosition.y).toBeGreaterThanOrEqual(300);
+      expect(generated.targetPosition.y).toBeLessThanOrEqual(700);
+      expect(extractionAreas).toContainEqual(generated.extractionArea);
+      observedExtractionAreas.add(JSON.stringify(generated.extractionArea));
+      signatures.add(JSON.stringify({
+        radars: generated.radars,
+        target: generated.targetPosition,
+        extractionArea: generated.extractionArea,
+      }));
     }
-    expect(signatures.size).toBe(10);
+    expect(signatures.size).toBe(100);
+    expect(observedExtractionAreas.size).toBe(3);
   });
-
 });
diff --git a/src/procedural/missionGenerator.ts b/src/procedural/missionGenerator.ts
index 4fb9d41..9154980 100644
--- a/src/procedural/missionGenerator.ts
+++ b/src/procedural/missionGenerator.ts
@@ -1,9 +1,10 @@
+import { gameConfig } from "../config/gameConfig";
 import { SeededRandom } from "../core/SeededRandom";
 import { createCommanderState } from "../domain/airDefenseCommander";
 import { createRadarOperatorState } from "../domain/radarOperatorAI";
 import { generateWeatherForecast } from "../domain/weatherSystem";
 import { radarTypeProfiles } from "../domain/radarTypes";
-import type { RadarState, RadarType, TerrainZone, WeatherCell } from "../domain/types";
+import type { ExtractionArea, RadarState, RadarType, TerrainZone, WeatherCell } from "../domain/types";
 
 export interface GeneratedMissionContent {
   terrain: TerrainZone[];
@@ -11,11 +12,27 @@ export interface GeneratedMissionContent {
   weatherForecast: ReturnType<typeof generateWeatherForecast>;
   radars: RadarState[];
   targetPosition: { x: number; y: number };
+  extractionArea: ExtractionArea;
   commander: ReturnType<typeof createCommanderState>;
 }
 
+/** 撤离区使用独立随机流，新增或调整其他任务内容时不会改变已生成的撤离位置。 */
+export function generateExtractionArea(seed: string): ExtractionArea {
+  const random = new SeededRandom(`${seed}:EXTRACTION`);
+  const center = random.pick(gameConfig.mission.extractionCenters);
+  const size = gameConfig.mission.extractionSize;
+  return {
+    x: center.x - size / 2,
+    y: center.y - size / 2,
+    width: size,
+    height: size,
+  };
+}
+
 export function generateMissionContent(seed: string): GeneratedMissionContent {
   const random = new SeededRandom(`${seed}:MISSION-CONTENT`);
+  const radarCoordinateRange = gameConfig.radar.deploymentCoordinateRange;
+  const targetCoordinateRange = gameConfig.mission.targetCoordinateRange;
   const terrainCount = random.integer(2, 4);
   const radarCount = random.integer(3, 5);
   const weatherCount = random.integer(1, 2);
@@ -56,7 +73,10 @@ export function generateMissionContent(seed: string): GeneratedMissionContent {
     return {
       id: `${type === "EARLY_WARNING" ? "EW" : type === "ACQUISITION" ? "ACQ" : "FC"}-${String(index + 1).padStart(2, "0")}`,
       type,
-      position: { x: random.range(230, 900), y: random.range(140, 800) },
+      position: {
+        x: random.range(...radarCoordinateRange),
+        y: random.range(...radarCoordinateRange),
+      },
       range: random.range(...profile.range),
       sweepAngleDegrees: random.range(0, 360),
       scanAccumulatorSeconds: 0,
@@ -69,7 +89,11 @@ export function generateMissionContent(seed: string): GeneratedMissionContent {
     weather,
     weatherForecast: generateWeatherForecast(seed, weather),
     radars,
-    targetPosition: { x: random.range(400, 790), y: random.range(100, 390) },
+    targetPosition: {
+      x: random.range(...targetCoordinateRange),
+      y: random.range(...targetCoordinateRange),
+    },
+    extractionArea: generateExtractionArea(seed),
     commander: createCommanderState(),
   };
 }
```

