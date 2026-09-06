# 精简任务奖励系统：移除 Enemy Alert 与 Enemy Adaptation

## 背景与目标
- 将跨任务成长收敛为玩家能够直接选择和理解的四类任务收益。
- 从正式实现中删除 Enemy Alert（敌方跨任务警戒）与 Enemy Adaptation（敌方历史航迹适应）。
- 完整保留精简前方案，作为未来探索双向升级体系时的设计提案。
- 保持单场任务内 Awareness（态势警戒）、Contact、锁定与导弹威胁链路不变。

## 约束与原则
- 保留 INTEL、STRIKE、SEAD、COMMAND STRIKE 四类直接任务收益。
- 失败节点仍可重试或改选，但不再强化后续雷达。
- Final Strike 仍固定增加目标区后备 Fire Control，并应用已完成任务的直接收益。
- 旧存档加载时清除已废弃字段和旧 Final Strike 简报，避免遗留状态重新进入当前 UI。
- 中英文 README、精确机制文档、项目核心认知与 UI 文案同步更新。

## 阶段与 TODO
- [x] 在 proposals 中归档精简前的完整奖励与敌方升级方案。
- [x] 删除领域类型、画像算法、任务结算和后续部署中的 Enemy Alert / Enemy Adaptation。
- [x] 删除任务网络、任务面板、情报面板中的旧状态和反制部署 UI。
- [x] 保留旧存档兼容清理，并更新相关自动化测试。
- [x] 同步中英文设计文档与项目核心认知。
- [x] 完成类型检查、全量测试、生产构建和真实页面验收。

## 关键决策
- 当前正式奖励只保留：
  - INTEL：一级核实全部雷达坐标与型号，二级开放全域情报。
  - STRIKE：每次使后续雷达扫描速率乘以 90%。
  - SEAD：每次使后续雷达覆盖乘以 90%。
  - COMMAND STRIKE：使后续 Commander 协调乘以 65%。
- Enemy Alert 的资源、结算增量、雷达覆盖倍率与 Final Strike 警戒增援全部删除。
- Enemy Adaptation 的航迹采样、玩家画像、雷达移位、状态展示与 Final Strike 自适应增援全部删除。
- 单场任务内的 `Awareness` 改以“态势警戒 / AWARENESS”显示，避免与已删除的跨任务系统混淆。
- 精简前方案归档于 `.agentdocs/proposals/20260903234232-explore-escalating-campaign-rewards.md`，不再代表正式实现。

## 兼容性
- 新存档不再写入 `resources.enemyAlert`、`enemyState.tacticalProfile`、`currentMission.flightPath` 或 `currentMission.adaptationNotes`。
- 旧存档仍可加载；恢复时会剥离上述字段、旧 `adaptationLevel` 以及旧警戒/画像 Final Strike 简报。
- `RunState` 校验不再要求已删除的 `resources` 字段。

## 代码与文档变更
以下差异完整记录本次涉及的实现、测试、README、机制文档与核心认知变更；提案新增内容也以 diff 形式附后。

`````diff
diff --git a/AGENTS.md b/AGENTS.md
index a481d29..f99c911 100644
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -4,38 +4,37 @@
 - 项目名称：`F-117 Tactical Command System`（中文名：`F-117 战术指挥系统`，包名：`f117-tactical-command-system`）。
 - 产品定位为解谜与动态规划导向的军事模拟游戏；玩家常驻任务面板应模拟作战指挥终端，只呈现态势、情报、告警和指令，不直接解释精确规则、概率公式或程序生成元信息；完整机制统一放入说明文档，首次操作路径可由独立、可退出的情境式引导覆盖。
 - 首次访问提供运行在真实生成任务上的七步情境式任务引导，通过高亮任务网络、规划、航线与执行态势教授核心闭环；顶部“任务引导”按钮可直接启动或重新开始引导，不再提供独立操作说明弹窗；引导只观察界面与任务状态，不暂停模拟、不代替玩家操作，也不进入 Run、Seed 或复盘数据。
-- 当前状态：已完成 Phase 0–12；当前产品聚焦有限情报下的动态航线规划，任务网络选择与玩家历史会持续改变后续任务及 Final Strike 的情报、雷达部署、Enemy Alert 与 Commander 协调。
+- 当前状态：已完成 Phase 0–12；当前产品聚焦有限情报下的动态航线规划，任务网络选择会通过情报权限、雷达覆盖、扫描速率与 Commander 协调持续改变后续任务及 Final Strike。
 
 ## 技术选型与核心架构
 - 客户端采用 React 18、TypeScript、Vite 与 HTML Canvas；测试采用 Vitest。
 - 核心分层为 `core`（基础设施）、`domain`（纯领域逻辑）、`game`（状态与循环）、`ui`（交互与渲染）、`i18n`（中英文文案与渲染期本地化）、`config`（参数配置）。
-- `RunState` 与 `MissionSession` 严格分离；Seed、Campaign 和 Enemy Adaptation 均保留独立扩展边界。
+- `RunState` 与 `MissionSession` 严格分离；Seed 与 Campaign 保留独立扩展边界。
 - Canvas 只负责绘制与坐标交互，游戏状态以 reducer 和领域模型为唯一事实来源。
 - 应用界面以 `1500×720` 最小逻辑视口为基准，按实际视口宽高中的较小倍率对全部页面、文字、Canvas 与浮层统一等比缩放，最大倍率为 `2×` 且极小视口继续缩小；1500px 逻辑宽度保证双语顶部栏始终单行，720px 逻辑高度保证除任务左右侧面板内部滚动外的界面元素不超过视口；Canvas 指针坐标与像素密度必须补偿外层缩放。
 - 游戏内全部玩家可见文案支持简体中文与 English 即时切换；中文界面的任务类型与系统术语必须完整中文化，仅保留 `F-117`、任务/雷达/天气/航点编号、坐标轴和计量单位等必要识别符。语言偏好独立保存，不进入 `RunState`、`MissionSession`、Seed 或复盘快照，Canvas 与 React 必须消费同一语言目录且切换不得改变模拟状态。
 - 雷达架构遵循 Reality → Radar Sensor → Imperfect Contact；只有 Sensor 层可读取飞机真实状态，后续 AI 只能消费带误差 Contact。
 - 雷达网络由 Early Warning（远程宽波束、低火控质量）、Acquisition（中程均衡）与 Fire Control（近程窄波束、高精度高火控质量）三类组成；类型差异统一影响覆盖、扫描周期、波束、探测率、Contact 误差与锁定贡献。
-- 每场任务最终准备完成后，至少一部 Fire Control 必须完整覆盖目标攻击区并保留 `20 u` 余量；唯一承担目标防御的火控雷达不参与 Enemy Adaptation 移位。
+- 每场任务最终准备完成后，至少一部 Fire Control 必须完整覆盖目标攻击区并保留 `20 u` 余量。
 - 每台 Radar Operator 独立保存模式、Contact 记忆和全部 Utility 评分；支持 Wide Search、Sector Search 与 Focused Track，雷达始终开机扫描。
 - Belief Map 使用 24×24 概率网格，仅融合 Radar Contact；支持误差高斯注入、运动估计、扩散与衰减，完整内部状态只在 `TOTAL INTEL`、全景复盘或开发调试视图中展示。
 - Air Defense Commander 只读取 Awareness、Belief Map 与雷达状态，通过可解释 Utility 评分、跨雷达 Contact 共享和 Operator 偏置协调雷达，不读取飞机真实位置或把目标位置作为定位回退；指挥链受损会延迟决策、缩短共享窗口并扩大搜索方位误差。
-- Awareness 是任务内敌方总体警戒值，由 Contact 累积、失联后缓慢衰减、投弹时显著提升；它只驱动 Commander 搜索强度，不取代玩家可见的跟踪、锁定与导弹进度，也不等于跨任务的 Enemy Alert。
+- Awareness 是任务内敌方总体警戒值，由 Contact 累积、失联后缓慢衰减、投弹时显著提升；它只驱动 Commander 搜索强度，不取代玩家可见的跟踪、锁定与导弹进度，也不会跨任务累计。
 - 防空交战采用 Contact → 跟踪质量 → 火控锁定 → 导弹来袭链路；最强 Contact 保留本地火控能力，额外雷达证据通过指挥链形成联合跟踪，失去新证据可脱锁；导弹命中会摧毁飞机并令当前 Mission 失败，但玩家可返回当前任务网络层重试或改选。
 - 飞机基础速度为 `3.6 u/s`，满油可飞行 `2000 u`（当前地图两条边之和）；燃油按真实累计飞行距离消耗，耗尽后停止并令当前任务失败。运行中进入攻击半径后自动投弹并提高 Awareness，随后玩家必须进入撤离区。
 - 普通玩家视图通过 THREAT WARNING 显示可行动的模糊威胁阶段和导弹倒计时；真实 Contact、Belief 与 AI 评分只在 `TOTAL INTEL`、全景复盘或开发调试视图中显示。
 - 音效使用原生 Web Audio API 合成并由领域事件驱动；锁定与导弹警报属于可清理循环音，脱锁、任务结束或组件卸载时必须停止；顶部只提供总音量滑杆，玩家将音量调至 `0` 即可完全关闭声音，不设独立声音开关。
 - Mission Generator 根据 Seed 分别生成静态 Terrain、动态 Weather Cell、Radar Network 与 Target；天气的位置、范围、强度与类型由任务绝对时间确定性演化，相同 Seed 与时间必须完整复现。最终部署完成后再按固定有限情报基线生成玩家侧雷达报告。
 - OPERATION CODE 是 Run 根 Seed：字符串使用 FNV-1a 映射为 32 位状态并由 Mulberry32 生成确定性随机流；节点、任务内容、雷达情报、天气预报、最终战增援和逐次雷达探测使用带命名后缀的独立子 Seed，完整复现还要求相同 Run 历史、航线操作与任务时间。
-- 撤离区固定为东北侧 `(860, 50, 100×100)` 正方形；所有初始、适应性和 Final Strike 雷达部署最终统一执行撤离区净空约束：雷达中心不得进入撤离区周围 80 u，探测范围仍可覆盖撤离区。
+- 撤离区固定为东北侧 `(860, 50, 100×100)` 正方形；所有初始和 Final Strike 雷达部署最终统一执行撤离区净空约束：雷达中心不得进入撤离区周围 80 u，探测范围仍可覆盖撤离区。
 - 玩家在规划阶段获得带位置与尺度误差的任务绝对时刻 `T+30/60/90s` 出动前天气预报；它不是滚动预报，执行到对应时刻后过期条目与轮廓隐藏。
 - Weather Cell 会降低飞机有效速度：Cloud 10%、Fog 15%、Rain 20%、Storm 30%；重叠时取最强减速，不进行连乘，燃油仍按实际飞行距离消耗。
-- 任务网络固定为三个顺序二选一阶段与 Final Strike；只有摧毁目标并成功撤离才完成节点、关闭同层选择并解锁下一阶段；包括飞机损失在内的所有失败都会把当前节点标记为可重试的 `FAILED`、提高 Enemy Alert，并保留同层备选供改选。
+- 任务网络固定为三个顺序二选一阶段与 Final Strike；只有摧毁目标并成功撤离才完成节点、关闭同层选择并解锁下一阶段；包括飞机损失在内的所有失败都会把当前节点标记为可重试的 `FAILED`，并保留同层备选供改选，但不会强化后续防空。
 - 任务开始后不可暂停、重置或返回任务网络；飞行中只允许实时编辑当前目标航点之后的路径。成功撤离会冻结任务地图快照，整个 Run 内可从已完成节点进行任务视角与全景敌方态势双视角复盘。
 - Tactical Reward 与 Player Build 已完整移除；当前核心玩法差异来自动态航线、程序生成雷达/地形/天气、敌方 Belief 与 Commander 行为。
-- 持久任务效果按不同维度分工：Intel 行动只提升离散情报权限；每次 STRIKE 使所有后续雷达扫描速率乘以 90%，同时作用于扫描动画和 Sensor 周期；SEAD 只使后续 Radar Coverage 乘以 90%，不阻止最终火控增援；Command Strike 使 Commander Coordination 乘以 65%；所有成功任务使 Enemy Alert 增加 2，失败增加 10。
-- Enemy Alert 是 `0–100` 的跨任务持久警戒，当前不会自然下降；后续基础雷达范围乘以 `1 + Alert / 250`，Final Strike 在 Alert ≥ 15 时追加警戒雷达。任务网络顶部 `RADAR COVERAGE` 只显示 SEAD 修正，不包含 Alert 倍率。
-- Enemy Adaptation 只分析按实际位移采样的已飞轨迹，成功与失败航迹分别按 1.0 与 0.5 权重形成地形利用、南北航路和直达倾向画像；反制强度由已识别画像特征数量决定，雷达按空间距离选择部署对象，禁止读取未来计划航点。
-- Final Strike 固定部署目标区后备 Fire Control，并根据 Enemy Alert 和玩家画像动态增加警戒与截击雷达；SEAD 只缩小覆盖，不阻止后备火控；只有累计观察权重至少为 2 且形成两项以上显著画像特征时才部署自适应截击雷达，随后统一重新生成有限情报。
+- 持久任务效果按不同维度分工：Intel 行动只提升离散情报权限；每次 STRIKE 使所有后续雷达扫描速率乘以 90%，同时作用于扫描动画和 Sensor 周期；SEAD 只使后续 Radar Coverage 乘以 90%，不阻止最终火控增援；Command Strike 使 Commander Coordination 乘以 65%。
+- Enemy Alert 与 Enemy Adaptation 已从正式实现移除；任务成败不再累积跨任务警戒，系统也不再记录历史航迹画像或据此移动、增援雷达。精简前的双向升级方案仅保存在 `.agentdocs/proposals/20260903234232-explore-escalating-campaign-rewards.md` 供未来探索。
+- Final Strike 固定部署目标区后备 Fire Control，并继续应用 STRIKE 扫描削弱、SEAD 覆盖削弱、Command Strike 指挥链削弱与 INTEL 情报权限；不会根据失败次数或历史航迹追加警戒与截击雷达，新增雷达完成后统一重新生成有限情报。
 - 未完成 INTEL 时，正常战术视图按固定基线生成有限雷达情报：每部雷达发现概率 90%、位置误差半径 `50–70 u`、范围估算误差 `±8%`，逐雷达结果由 Seed 确定；真实雷达、敌方 Contact、Belief 和 AI 决策仅在 `TOTAL INTEL` 或开发调试视图中显示。
 - 情报权限由已完成 INTEL 节点派生：任务网络最多包含两个 INTEL 节点，一次完成后精确识别后续任务全部雷达位置与类型，两次后正式解锁默认开启且可关闭的 `TOTAL INTEL` 完整敌方态势；锁定节点可只读预览当前研判地图但不可执行。
 - 任务网络不维护连续情报质量资源、任务基础情报精度或独立 Intel 点数；INTEL 的长期收益完全由已完成节点派生的离散权限表示。
diff --git a/README.en.md b/README.en.md
index 2c53ae7..a41b6a7 100644
--- a/README.en.md
+++ b/README.en.md
@@ -34,11 +34,11 @@ INTEL missions change what the player is allowed to observe. They do not improve
 
 Radar detection is probabilistic, but it does not consume an opaque global random stream. The operation code, mission node, radar identity, and scan sequence determine isolated random streams. With the same version, run history, player actions, and time progression, a result can be reproduced. This makes route comparison, failure analysis, and strategy verification possible.
 
-The operation code defines the base world only. Mission choices, failures, Enemy Alert, and historical flight paths continue to alter later deployments. The same Seed does not erase what the player has done.
+The operation code defines the base world only. Intelligence access, radar scan, coverage, and command-link modifiers earned through mission choices continue to alter later missions. Reproducing one battlefield therefore requires both the same Seed and the same mission route.
 
 ### 1.4 Long-Term Progression Changes the Battlefield
 
-There is no equipment build, aircraft stat progression, or random post-mission reward draft. Precursor missions affect separate dimensions: information, scan timing, coverage space, and network coordination. The enemy answers through persistent alert and a profile learned from flown routes.
+There is no equipment build, aircraft stat progression, or random post-mission reward draft. Precursor missions affect separate dimensions: information, scan timing, coverage space, and network coordination. These four rewards apply directly to later missions.
 
 The player is building the conditions of the final battlefield, not a stronger F-117. Every mission-network choice therefore asks whether the next route should become easier to understand or the real defense should become weaker.
 
@@ -46,13 +46,13 @@ The player is building the conditions of the final battlefield, not a stronger F
 
 The mission interface behaves like a tactical terminal. It shows mission state, intelligence, warnings, waypoints, and sensor readouts without explaining attack radii, probability formulas, or generation algorithms inside the live workspace.
 
-The in-game Operating Instructions contain only what the player needs to make decisions. The Game Mechanics Manual owns precise rules. This README owns design intent, system relationships, and development boundaries.
+The top-bar Mission Guidance provides contextual instructions needed to make decisions. The Game Mechanics Manual owns precise rules. This README owns design intent, system relationships, and development boundaries.
 
-First-time players also enter contextual Mission Guidance. It does not create a rules-lite tutorial mission. Instead, it highlights the mission network, effect assessment, planning entry, tactical map, complete-route requirements, launch confirmation, and live telemetry inside the real mission generated by the current operation code. The player still performs every node choice and route action. Guidance only observes UI and mission state: it never pauses simulation, acts on the player's behalf, or dispatches reducer actions. Completion or dismissal is stored independently, and guidance can be restarted from Operating Instructions.
+First-time players also enter contextual Mission Guidance. It does not create a rules-lite tutorial mission. Instead, it highlights the mission network, effect assessment, planning entry, tactical map, complete-route requirements, launch confirmation, and live telemetry inside the real mission generated by the current operation code. The player still performs every node choice and route action. Guidance only observes UI and mission state: it never pauses simulation, acts on the player's behalf, or dispatches reducer actions. Completion or dismissal is stored independently, and guidance can be restarted from the top-bar Mission Guidance button.
 
 ### 1.6 Language Changes Only the Presentation Layer
 
-The language button opens an extensible selection popover. The mission network, all tactical workspaces, the Canvas map, Operating Instructions, events, weather, and enemy-system panels render from the same locale catalog.
+The language button opens an extensible selection popover. The mission network, all tactical workspaces, the Canvas map, Mission Guidance, events, weather, and enemy-system panels render from the same locale catalog.
 
 The preference is stored separately from mission state, Seeds, and debrief snapshots. Changing language does not dispatch a game action, pause simulation, rebuild a mission, or alter detection. Domain models keep stable enums and persisted values; localization happens only at the rendering boundary.
 
@@ -65,9 +65,7 @@ Operation code
   └─ derives isolated random streams for scans, forecasts, and reinforcements
 
 Mission-network choices
-  ├─ change intelligence access, radar scanning, coverage, or command links
-  ├─ accumulate Enemy Alert
-  └─ provide flown routes to Enemy Adaptation
+  └─ change intelligence access, radar scanning, coverage, or command links
 
 Single mission
   ├─ route planning and live editing of future legs
@@ -105,13 +103,11 @@ Precursor missions intentionally operate on four orthogonal dimensions:
 | STRIKE | Radar scan timing | Reduce scan and detection opportunities per unit of time |
 | SEAD | Radar coverage space | Shrink the regions that must be avoided or crossed |
 | COMMAND STRIKE | Network coordination | Delay command response and weaken multi-radar tracking |
-| FINAL STRIKE | Entire Run history | Assemble the final defense from prior choices and enemy responses |
+| FINAL STRIKE | Entire Run history | Assemble the final defense from completed mission effects |
 
 Better intelligence does not mean weaker radars, and smaller coverage does not mean slower scanning. Rewards stay separate so the difference between seeing a danger and physically weakening it remains legible.
 
-Every operation also raises persistent enemy alert, with failure costing more than success. Precursor missions are therefore not free upgrades, and unlimited retries cannot erase strategic pressure.
-
-The exact reward multipliers, alert changes, node states, and final-defense triggers are canonical in the [mission-network section of the mechanics manual](docs/game-mechanics.en.md).
+The exact reward multipliers, node states, and final-defense rules are canonical in the [mission-network section of the mechanics manual](docs/game-mechanics.en.md).
 
 ## 5. Map, Terrain, and Dynamic Weather
 
@@ -123,7 +119,7 @@ Generation enforces local constraints such as extraction clearance and minimum t
 
 ### 5.2 Terrain Provides Static Concealment
 
-Terrain does not move or change type during a mission. It reduces radar detection probability without directly changing speed or fuel. This makes terrain a dependable routing reference, but repeated use can become a historical preference that Enemy Adaptation learns.
+Terrain does not move or change type during a mission. It reduces radar detection probability without directly changing speed or fuel, making it a dependable routing reference that can be reused across missions.
 
 ### 5.3 Weather Creates Moving Windows
 
@@ -176,25 +172,19 @@ Normal missions use limited radar reports with omissions, position error, and ra
 
 Full visibility is both a formal campaign reward and a development tool. The two sources share presentation capabilities, but neither may feed information back into simulation results.
 
-Locked nodes support a read-only preview of the current estimate. Preview and launch use the same mission-preparation logic, so the map reflects current rewards, alert, and adaptation without creating a Mission or modifying the Run.
-
-## 8. Persistent Enemy Response and Final Strike
-
-### 8.1 Enemy Alert Is Strategic Readiness
-
-Enemy Alert persists across missions and represents the defense network's response to repeated intrusion. It changes later defenses and may trigger additional readiness forces in the final mission. It is distinct from per-mission Awareness and aircraft-specific THREAT WARNING.
+Locked nodes support a read-only preview of the current estimate. Preview and launch use the same mission-preparation logic, so the map reflects currently earned mission effects without creating a Mission or modifying the Run.
 
-### 8.2 Enemy Adaptation Learns Flown Routes
+## 8. Mission Effects and Final Strike
 
-Adaptation reads only the path the aircraft has already flown, never future waypoints. It evaluates terrain use, north-south routing, and directness, then chooses radars to reposition through spatial relationships. Successful routes carry more learning weight than failed ones, although failed retries still reveal some behavior.
+### 8.1 Four Rewards Keep Direct Causality
 
-This creates an explainable profile that can also be deceived. Players can change habits to avoid a counter-deployment or deliberately establish a misleading historical preference.
+Cross-mission state now contains only four direct rewards: INTEL access, Radar Scan, Radar Coverage, and Command Link. A successful mission changes only its corresponding dimension. Failure changes the current node state but no longer accumulates global alert or a historical route profile.
 
-### 8.3 Final Strike Resolves the Entire Run
+### 8.2 Final Strike Resolves Completed Mission Effects
 
-The Final Strike adds target-area fire control, alert reinforcements, and adaptive interception to a base mission, then applies the scan, coverage, command-link, and intelligence outcomes created by previous choices. It is a resolution of the strategic route, not a normal node with a different name.
+The Final Strike always adds a reserve target-area Fire Control radar and continues to apply previously earned scan, coverage, command-link, and intelligence effects. It does not add extra radars from failure count or flown-route history, so every final-defense change remains traceable to a chosen mission type.
 
-Exact alert thresholds, profile features, movement strength, and reinforcement rules live in the [Game Mechanics Manual](docs/game-mechanics.en.md).
+Exact reward multipliers and target-area guard rules live in the [Game Mechanics Manual](docs/game-mechanics.en.md). The earlier bidirectional-escalation system is archived as an exploration proposal and is no longer part of the current rules.
 
 ## 9. Operation Code and Deterministic Generation
 
@@ -202,7 +192,7 @@ Exact alert thresholds, profile features, movement strength, and reinforcement r
 
 Stream isolation is an important extension rule: adding a weather parameter must not change which radar report is omitted, and opening one more UI preview must not consume detection randomness reserved for a launched mission.
 
-After generating base content, the game applies mission rewards, Enemy Alert, Enemy Adaptation, Final Strike reinforcements, and safety constraints in a fixed order. Player intelligence is generated last so it always describes the final deployment rather than a radar that later rules have moved or replaced.
+After generating base content, the game applies mission effects, the Final Strike target-area guard, and safety constraints in a fixed order. Player intelligence is generated last so it always describes the final deployment rather than the unmodified base radars.
 
 The exact hash, sub-Seed names, and preparation order are defined in the [Game Mechanics Manual](docs/game-mechanics.en.md).
 
diff --git a/README.md b/README.md
index 71a1d18..75333ed 100644
--- a/README.md
+++ b/README.md
@@ -34,11 +34,11 @@
 
 游戏包含概率探测，但不依赖不可追踪的全局随机。行动代码、任务节点、雷达身份和扫描序列共同决定随机流。相同版本、相同任务历史、相同操作和相同时间演进能够复现结果，玩家因此可以比较路线、复盘失败并验证策略。
 
-行动代码只定义基础世界。任务选择、失败次数、敌方警戒和历史航迹会继续改变后续部署，所以“相同 Seed”不等于忽略玩家行为后永远得到同一张战场。
+行动代码只定义基础世界。任务选择形成的情报权限、雷达扫描、覆盖范围和指挥链修正会继续改变后续任务，所以“相同 Seed”仍需配合相同任务路线才能复现同一张战场。
 
 ### 1.4 长期成长作用于战场
 
-项目没有装备构筑、飞机属性成长或任务后随机奖励。前置任务分别改变信息、扫描时间、覆盖空间和雷达协同；敌方则通过跨任务警戒与航迹画像回应玩家。
+项目没有装备构筑、飞机属性成长或任务后随机奖励。前置任务分别改变信息、扫描时间、覆盖空间和雷达协同，四类收益直接作用于后续任务。
 
 玩家构筑的是最终任务的战场条件，而不是一架数值更高的 F-117。这让任务网络中的选择始终回到同一个核心问题：后续航线会因这次行动变得更可知，还是让真实防空体系变得更弱？
 
@@ -46,13 +46,13 @@
 
 任务界面模拟战术终端，只呈现任务状态、情报、告警、航点和传感器读数。不会在飞行界面直接解释投弹半径、概率公式或生成算法。
 
-顶部“操作说明”提供玩家完成决策所需的简明提示；精确规则集中在机制手册；本 README 则记录设计意图、系统关系和开发边界。
+顶部“任务引导”提供玩家完成决策所需的情境式提示；精确规则集中在机制手册；本 README 则记录设计意图、系统关系和开发边界。
 
-首次进入还会启动情境式“任务引导”。它不建立规则简化的教程关卡，而是在当前行动代码生成的真实任务上依次高亮任务网络、收益研判、规划入口、战术地图、完整航线条件、出动确认与执行态势。玩家必须亲自完成节点选择与航线操作，引导只观察页面状态并给出下一项指令，不暂停模拟、不代替操作，也不向 reducer 派发游戏动作。完成或退出状态独立保存，并可随时从“操作说明”重新启动。
+首次进入还会启动情境式“任务引导”。它不建立规则简化的教程关卡，而是在当前行动代码生成的真实任务上依次高亮任务网络、收益研判、规划入口、战术地图、完整航线条件、出动确认与执行态势。玩家必须亲自完成节点选择与航线操作，引导只观察页面状态并给出下一项指令，不暂停模拟、不代替操作，也不向 reducer 派发游戏动作。完成或退出状态独立保存，并可随时从顶部“任务引导”重新启动。
 
 ### 1.6 双语只改变表达层
 
-顶部语言按钮打开可扩展的语言选择弹窗。任务网络、三类战术工作区、Canvas 地图、操作说明、事件、天气和敌方内部面板都使用同一套语言目录。
+顶部语言按钮打开可扩展的语言选择弹窗。任务网络、三类战术工作区、Canvas 地图、任务引导、事件、天气和敌方内部面板都使用同一套语言目录。
 
 语言偏好独立保存，不进入任务状态、Seed 或复盘快照。切换语言不会派发游戏动作、暂停模拟、重建任务或改变探测结果。领域层保留稳定枚举与存档值，只在渲染边界进行本地化。
 
@@ -65,9 +65,7 @@
   └─ 派生可复现的扫描、预报与增援随机流
 
 任务网络选择
-  ├─ 改变情报权限、雷达扫描、雷达覆盖或指挥链
-  ├─ 累积敌方警戒
-  └─ 向敌方适应系统提供已飞航迹
+  └─ 改变情报权限、雷达扫描、雷达覆盖或指挥链
 
 单次任务
   ├─ 航线规划与未来航段实时调整
@@ -105,13 +103,11 @@
 | STRIKE | 雷达扫描时间 | 减少单位时间内的扫描与探测机会 |
 | SEAD | 雷达覆盖空间 | 缩小需要绕行或穿越的危险区域 |
 | COMMAND STRIKE | 雷达网络协同 | 延缓指挥响应并削弱多雷达联合跟踪 |
-| FINAL STRIKE | 汇总整个 Run | 用此前的选择和敌方响应组装最终防御 |
+| FINAL STRIKE | 汇总整个 Run | 用此前的任务成果组装最终防御 |
 
 情报更准确不等于雷达变弱，覆盖缩小也不等于扫描变慢。任务收益不合并，是为了让玩家能在“看清危险”和“实际削弱危险”之间做出可感知的取舍。
 
-每次行动还会提高跨任务敌方警戒；反复失败的代价高于成功。这使前置任务不是无成本升级，也避免通过无限试错必然抹平风险。
-
-任务奖励倍率、警戒增长、节点状态和最终战触发条件以[机制手册的任务网络章节](docs/game-mechanics.md)为准。
+任务奖励倍率、节点状态和最终战规则以[机制手册的任务网络章节](docs/game-mechanics.md)为准。
 
 ## 5. 地图、地形与动态天气
 
@@ -123,7 +119,7 @@
 
 ### 5.2 地形提供静态隐蔽
 
-地形在单次任务中不移动，也不改变类型。它降低雷达探测概率，但不会直接改变飞机速度或燃油。静态遮蔽给路线提供可靠参照，同时也可能被敌方通过历史航迹分析识别为玩家偏好。
+地形在单次任务中不移动，也不改变类型。它降低雷达探测概率，但不会直接改变飞机速度或燃油。静态遮蔽为路线提供可重复利用的可靠参照。
 
 ### 5.3 天气制造时空窗口
 
@@ -176,25 +172,19 @@ Reality
 
 完整态势既是正式任务奖励，也是开发环境的调试工具。两者共用显示能力，但都只能改变可见性，不能反向改变模拟结果。
 
-锁定节点允许只读预览当前研判地图。预览和正式出击共用任务准备逻辑，因此会反映当下的任务收益、警戒和适应状态，但不会创建 Mission 或修改 Run。
-
-## 8. 敌方跨任务响应与最终打击
-
-### 8.1 Enemy Alert 表示战略警戒
-
-Enemy Alert 跨任务保存，反映整个 Run 中敌方对持续入侵的响应。它会影响后续防空部署，并可能在最终任务触发额外警戒力量。它不同于单次任务内的 Awareness，也不同于针对飞机的 THREAT WARNING。
+锁定节点允许只读预览当前研判地图。预览和正式出击共用任务准备逻辑，因此会反映当下已经获得的任务收益，但不会创建 Mission 或修改 Run。
 
-### 8.2 Enemy Adaptation 学习实际航迹
+## 8. 任务收益与最终打击
 
-敌方适应系统只读取飞机已经飞过的轨迹，不读取计划航点。它分析地形利用、南北航路和直达倾向，用空间关系选择需要调整的雷达。成功航迹比失败航迹权重更高，但失败重试仍会留下有限情报价值。
+### 8.1 四类收益保持直接因果
 
-这种设计让敌方形成可解释但可能被误导的画像。玩家可以改变习惯规避反制，也可以主动制造错误历史偏好。
+跨任务状态只保留 INTEL 权限、Radar Scan、Radar Coverage 和 Command Link 四类直接收益。成功任务只改变对应维度，失败只影响当前节点状态，不再额外累积全局警戒或历史航迹画像。
 
-### 8.3 Final Strike 汇总整个 Run
+### 8.2 Final Strike 汇总已完成任务成果
 
-最终打击在基础任务上组装目标区火控、警戒增援和适应性拦截力量，再应用前置任务形成的扫描、覆盖、指挥链和情报结果。它不是普通任务换名，而是对整条战略路线的结算。
+最终打击固定增加目标区后备火控雷达，并继续应用此前获得的扫描、覆盖、指挥链和情报结果。它不会根据失败次数或历史航迹额外增加雷达，让最终战变化能直接追溯到玩家选择的任务类型。
 
-精确警戒阈值、画像特征、移位强度和增援规则见[游戏机制手册](docs/game-mechanics.md)。
+精确收益倍率与最终目标区守卫规则见[游戏机制手册](docs/game-mechanics.md)。精简前的双向升级体系已归档为探索方案，不再属于当前正式规则。
 
 ## 9. 行动代码与确定性生成
 
@@ -202,7 +192,7 @@ Enemy Alert 跨任务保存，反映整个 Run 中敌方对持续入侵的响应
 
 隔离随机流是重要扩展原则：新增天气参数不应改变雷达遗漏结果，增加一次 UI 预览也不应消耗正式任务的探测随机数。
 
-基础任务生成后，系统再按固定顺序应用任务收益、Enemy Alert、Enemy Adaptation、Final Strike 增援和安全约束，最后生成玩家情报。这样情报永远引用最终部署，而不是已经被后续规则移动或替换的雷达。
+基础任务生成后，系统再按固定顺序应用任务收益、Final Strike 目标区守卫和安全约束，最后生成玩家情报。这样情报永远引用最终部署，而不是应用收益前的基础雷达。
 
 具体哈希算法、子 Seed 命名和任务准备顺序见[游戏机制手册](docs/game-mechanics.md)。
 
diff --git a/docs/game-mechanics.en.md b/docs/game-mechanics.en.md
index 3190662..b996adb 100644
--- a/docs/game-mechanics.en.md
+++ b/docs/game-mechanics.en.md
@@ -131,7 +131,7 @@ Every normal mission contains at least one radar of each type:
 
 Early Warning can create cues at long range across a wide angular area but is inefficient at quickly completing the fire-control chain alone. Fire Control must point its narrow beam correctly, then builds high-quality tracking rapidly after consecutive hits. Acquisition sits between them and can help cue Fire Control through shared Contacts.
 
-Final Strike reinforcements use the same roles: target-area `FINAL-GUARD` is Fire Control, Enemy Alert `ALERT-GUARD` is Early Warning, and historical-route `ADAPT-GUARD` is Acquisition.
+Final Strike always adds one target-area `FINAL-GUARD` Fire Control radar so the final objective retains a dedicated close-range defense.
 
 STRIKE reduces the global scan rate in later missions. The multiplier applies to Wide Search rotation, Sector Search oscillation, and actual Sensor frequency. One STRIKE gives 90% rate and two give 81%. Effective Sensor interval is `base interval / scan rate`, so the reward changes real detection cadence as well as animation. It does not alter per-scan range, beam width, probability multiplier, or Contact accuracy.
 
@@ -144,7 +144,7 @@ distance from Fire Control to target center + target attack radius
 ≤ real Fire Control range - 20 u
 ```
 
-If the existing deployment fails this condition, only the Fire Control nearest the target is moved, preserving its Seed-generated relative bearing. This check runs after SEAD range reduction, Enemy Adaptation movement, and Final Strike reinforcement. Enemy Adaptation cannot move the sole Fire Control responsible for target defense.
+If the existing deployment fails this condition, only the Fire Control nearest the target is moved, preserving its Seed-generated relative bearing. This check runs after SEAD range reduction and the Final Strike target-area guard has been added.
 
 Full coverage only guarantees that an attacking aircraft is inside one Fire Control radar's real range. Narrow beams, probability, aircraft aspect, terrain, and weather still determine whether consecutive Contacts occur.
 
@@ -291,16 +291,9 @@ The network no longer stores `intelAccuracyBonus`, base intelligence-quality per
 - A completed node may open Debrief Mission. Mission view restores what was visible at completion; panoramic view exposes the frozen full enemy state.
 - Debrief reads history only and cannot modify the current Mission, network, or persistent state.
 
-### 9.2 Enemy Alert, Awareness, and THREAT WARNING
+### 9.2 Mission Settlement, Awareness, and THREAT WARNING
 
-Enemy Alert is persistent strategic readiness from 0 to 100 and currently has no natural decay:
-
-- Mission success adds 2; failure adds 10.
-- Preparing any later mission or retry multiplies base radar range by `1 + Enemy Alert / 250`.
-- At Enemy Alert ≥ 15, Final Strike adds an `ALERT-GUARD` Early Warning radar. Its range receives up to an additional 18% Alert-based increase.
-- The network's `RADAR COVERAGE` displays only the persistent SEAD modifier. Enemy Alert range increase is multiplied separately during mission preparation.
-
-Do not confuse these states. Enemy Alert persists across missions and changes later defense. Awareness is a per-mission Commander input that decays after evidence disappears. THREAT WARNING is the aircraft-specific tracking, lock, and missile state.
+Success applies only the direct effect associated with the completed node. Failure marks the current node as retryable `FAILED` without strengthening later defenses. Awareness is a per-mission Commander input that decays after evidence disappears, while THREAT WARNING is the aircraft-specific tracking, lock, and missile state. Both reset for a new mission and are not cross-mission progression resources.
 
 The four precursor missions affect distinct dimensions: INTEL changes information access, STRIKE changes temporal sampling, SEAD changes spatial coverage, and COMMAND STRIKE changes multi-radar coordination. `RADAR COVERAGE` and `RADAR SCAN` are therefore separate persistent values.
 
@@ -315,7 +308,7 @@ Each base mission generates:
 - 3–5 radars cycling through Early Warning, Acquisition, and Fire Control, with Seed-driven position, range, and initial heading.
 - One target in the upper-middle portion of the map.
 
-Enemy Alert, SEAD, STRIKE, COMMAND STRIKE, Enemy Adaptation, and Final Strike reinforcement are applied before limited intelligence is regenerated against the final radar deployment.
+SEAD, STRIKE, COMMAND STRIKE, and the Final Strike target-area guard are applied before limited intelligence is regenerated against the final radar deployment.
 
 The map is `1000×1000 u` with a `100 u` grid. F-117 insertion is fixed at `(90, 850)`, extraction at `(860, 50, 100×100)`, and target generation at `x=400–790, y=100–390`. Radar centers keep `80 u` clearance from the extraction rectangle, though real coverage may extend into extraction. Final preparation also guarantees one Fire Control radar fully covers the target's `58 u` attack zone with `20 u` margin.
 
@@ -328,34 +321,16 @@ Final reinforcement  <Node Seed>-M01:FINAL-DEFENSE
 Detection roll       <Node Seed>-M01:<Radar ID>:<Scan Count>
 ```
 
-Weather truth is a pure function of initial parameters and absolute mission time. Detection randomness depends on scan count. Exact reproduction therefore requires the same Seed, version, Run history, route edits, and time evolution. A Seed fixes the base world only; choices, failures, alert, rewards, and flown history still modify final deployment.
+Weather truth is a pure function of initial parameters and absolute mission time. Detection randomness depends on scan count. Exact reproduction therefore requires the same Seed, completed nodes, route edits, and time evolution. A Seed fixes the base world, while INTEL access and SEAD/STRIKE/COMMAND STRIKE results apply clear, deterministic modifiers during mission preparation.
 
 ## 10. Current Progression Boundary
 
 - Mission success remains in a frozen result state until the player returns to the network. There is no inserted reward-selection phase.
 - Tactical Reward and Player Build flows do not exist.
-- Progression comes from discrete intelligence access, Enemy Alert, Radar Coverage, Radar Scan, Command Link, and Enemy Adaptation.
+- Progression comes from discrete intelligence access, Radar Coverage, Radar Scan, and Command Link.
 - Gameplay variety comes from generated maps, radars, weather, and mission-network changes.
 
-## 11. Enemy Adaptation
-
-After a mission, the enemy analyzes history that actually occurred, never an unflown route:
-
-- Terrain use: proportion of trajectory samples inside masking terrain.
-- North-south preference: vertical distribution of actual trajectory samples.
-- Direct routing: straight-line distance between trajectory endpoints divided by actual flown distance.
-
-Successful routes update the profile with weight `1.0`; failed routes use `0.5`. Mission count is not an adaptation level. Radar repositioning is driven by significant features:
-
-- Terrain use at or above 35% moves coverage toward the mountain exit.
-- North-south deviation from center at or above 8% moves a radar toward that corridor.
-- Direct routing at or above 72% moves a radar toward the insertion-to-target axis.
-
-One, two, or three identified features produce reposition strengths of 22%, 32%, or 42%. The mission network displays the profile as `LOW / ACTIVE / HIGH`.
-
-`COUNTER DEPLOYMENT` lists the countermeasures applied to the current mission. Because the enemy learns historical tendencies rather than future plans, the player can change doctrine or intentionally build a misleading profile.
-
-## 12. Route-Planning Guidance
+## 11. Route-Planning Guidance
 
 - Do not treat yellow intelligence circles as true boundaries. Preserve margin for uncertainty and overlapping radar coverage.
 - Cross near radar-range edges rather than near radar centers.
@@ -366,22 +341,19 @@ One, two, or three identified features produce reposition strengths of 22%, 32%,
 - Sustained illumination or lock demands immediate beam exit. After missile launch, reduce track quality below 32 within 8 seconds.
 - Weapon release raises Awareness and makes coordinated or concentrated search more likely, although search position must still come from Belief/CMD.
 - The first INTEL completion reveals and verifies every radar; the second authorizes `TOTAL INTEL`. SEAD shrinks later danger areas, while COMMAND STRIKE weakens coordination.
-- Reusing one corridor causes later radars to move toward it. Vary north-south routing, terrain use, and attack angle.
 - Preserve fuel for extraction after the strike. Excessive detours can exceed the `2000 u` range even when they avoid radar.
 
-## 13. Final Strike
+## 12. Final Strike
 
-Final Strike assembles air defense from the complete Run history at launch:
+Final Strike assembles air defense from the direct effects of completed missions at launch:
 
 - A reserve `FINAL-GUARD` Fire Control radar is always added near the target. SEAD reduces its range but cannot prevent deployment.
-- Enemy Alert ≥ 15 adds an alert reinforcement whose range also grows slightly with Alert.
-- Enemy Adaptation with at least 2 accumulated observation weight and at least two significant features adds one adaptive interception radar according to historical north-south preference.
 - Completed STRIKE scan reduction applies to every final radar, including reinforcements: 90% after one and 81% after two.
 - COMMAND STRIKE command-link damage, discrete INTEL visibility, and SEAD range reduction remain active.
 
-`FINAL DEFENSE BRIEFING` lists the outcome of each historical condition. Reinforcements still pass through the limited-intelligence system and do not automatically expose real positions. Destroying the final target and extracting changes the Run to `VICTORY`.
+`FINAL DEFENSE BRIEFING` lists the fixed reserve Fire Control radar and the direct outcomes of completed missions. Reinforcements still pass through the limited-intelligence system and do not automatically expose real positions. Destroying the final target and extracting changes the Run to `VICTORY`.
 
-## 14. Not Yet Implemented
+## 13. Not Yet Implemented
 
 - Anti-radiation missiles and direct destruction of radars during a mission.
 - Emission exposure, live ELINT direction finding, and live player-side intelligence updates.
diff --git a/docs/game-mechanics.md b/docs/game-mechanics.md
index 4adf4e4..f5c510d 100644
--- a/docs/game-mechanics.md
+++ b/docs/game-mechanics.md
@@ -77,7 +77,7 @@
 - 语言是独立界面偏好，保存到单独的浏览器 `localStorage` 键。
 - 语言不进入 `RunState`、`MissionSession`、Seed 或成功复盘，不影响 Tick、音频、雷达探测和任务结算。
 - 领域层生成的部署记录保留稳定存档值，渲染英文界面时兼容翻译已有中文记录。
-- 中文界面将任务类型与系统术语完整显示为中文，例如“情报行动、防空压制、全域情报、雷达接触、敌情推测和敌方警戒”；英文界面显示对应英文术语。只保留 `F-117`、节点/雷达/航点编号、坐标轴和计量单位等识别符。
+- 中文界面将任务类型与系统术语完整显示为中文，例如“情报行动、防空压制、全域情报、雷达接触、敌情推测和态势警戒”；英文界面显示对应英文术语。只保留 `F-117`、节点/雷达/航点编号、坐标轴和计量单位等识别符。
 
 ## 3. 雷达如何探测飞机
 
@@ -131,7 +131,7 @@ min(0.95,
 
 Early Warning 更容易在远距离和较宽方向范围内形成早期 Contact，但难以单独快速完成火控锁定；Fire Control 必须把窄波束准确指向目标，一旦连续命中便会快速提高跟踪质量。Acquisition 位于两者之间，并通过 Commander 的 Contact 共享帮助火控雷达集中搜索。
 
-Final Strike 的增援同样承担明确职责：目标区 `FINAL-GUARD` 是 Fire Control，Enemy Alert 触发的 `ALERT-GUARD` 是 Early Warning，历史航路触发的 `ADAPT-GUARD` 是 Acquisition。
+Final Strike 固定增加一部目标区 `FINAL-GUARD` Fire Control，确保最终目标始终具备独立的近程火控防御。
 
 STRIKE 会降低后续任务的统一扫描速率。该修正同时乘到 Wide Search 的旋转角速度、Sector Search 的摆扫相位和 Sensor 的实际扫描频率：一次 STRIKE 后为 90%，两次为 81%。有效扫描间隔按 `基础扫描周期 / 扫描速率` 计算，因此它不是只改变地图动画；单次扫描的覆盖范围、波束宽度、探测概率倍率和 Contact 精度保持不变。
 
@@ -144,7 +144,7 @@ STRIKE 会降低后续任务的统一扫描速率。该修正同时乘到 Wide S
 ≤ 火控雷达实际范围 - 20 u
 ```
 
-若现有部署不满足条件，系统只移动距离目标最近的 Fire Control，并保留 Seed 生成的相对方位。该校验发生在 SEAD 缩圈、Enemy Adaptation 移位和 Final Strike 增援之后；Enemy Adaptation 也不会移动唯一承担目标防御的火控雷达。
+若现有部署不满足条件，系统只移动距离目标最近的 Fire Control，并保留 Seed 生成的相对方位。该校验发生在 SEAD 缩圈和 Final Strike 目标区守卫加入之后。
 
 完整覆盖只保证飞机攻击目标时处于 Fire Control 的真实范围内，不保证立即暴露。窄波束、概率探测、飞机朝向、地形和天气仍然决定是否形成连续 Contact。
 
@@ -291,16 +291,9 @@ Command Strike 成功后，后续任务的指挥链效率乘以 65%。配置保
 - 已完成节点可进入“复盘任务”：默认还原任务视角，也可切换全景复盘查看冻结的敌方内部状态。
 - 复盘只读取历史快照，不修改当前 Mission、任务网络或持久状态。
 
-### 9.2 Enemy Alert、Awareness 与 THREAT WARNING
+### 9.2 任务结算、Awareness 与 THREAT WARNING
 
-Enemy Alert 是跨任务持久战略警戒，初始为 0，范围为 `0–100`，当前版本不会自然下降：
-
-- 成功任务增加 2，失败增加 10。
-- 准备后续任务或失败重试时，基础雷达范围乘以 `1 + Enemy Alert / 250`。
-- Enemy Alert ≥ 15 时，Final Strike 增加一部 `ALERT-GUARD` Early Warning；其范围还会获得最高 18% 的额外 Alert 增幅。
-- 任务网络顶部 `RADAR COVERAGE` 只显示 SEAD 持久修正，不包含 Enemy Alert 倍率；两者在任务准备时相乘。
-
-不要把 Enemy Alert 与任务内状态混淆：Awareness 是单场任务内 Commander 的总体警戒，会在失去 Contact 后衰减；THREAT WARNING 是针对 F-117 的跟踪、锁定和导弹进度。
+任务成功只应用当前节点对应的直接收益；任务失败只把当前节点标记为可重试的 `FAILED`，不会额外强化后续防空。Awareness 是单场任务内 Commander 的总体态势警戒，会在失去 Contact 后衰减；THREAT WARNING 是针对 F-117 的跟踪、锁定和导弹进度。两者都会在新任务中重新初始化，不作为跨任务成长资源。
 
 四类前置任务分别作用于互不相同的系统维度：INTEL 改变玩家信息权限，STRIKE 改变雷达时间采样，SEAD 改变覆盖空间，COMMAND STRIKE 改变多雷达协同。`RADAR COVERAGE` 和 `RADAR SCAN` 因而是两个独立持久状态。
 
@@ -315,7 +308,7 @@ Enemy Alert 是跨任务持久战略警戒，初始为 0，范围为 `0–100`
 - 3–5 部雷达，类型按 Early Warning、Acquisition、Fire Control 循环，位置、范围和初始朝向由 Seed 决定。
 - 位于地图中上部的目标位置。
 
-Enemy Alert、SEAD、STRIKE、COMMAND STRIKE、Enemy Adaptation 与 Final Strike 增援全部应用完毕后，系统才针对最终雷达部署生成玩家侧有限情报，避免战前报告引用已经失效的雷达位置。
+SEAD、STRIKE、COMMAND STRIKE 与 Final Strike 目标区守卫全部应用完毕后，系统才针对最终雷达部署生成玩家侧有限情报，避免战前报告引用应用收益前的基础雷达。
 
 地图固定为 `1000×1000 u`，网格间隔 `100 u`；F-117 插入点固定为 `(90, 850)`，撤离区固定为 `(860, 50, 100×100)`，目标生成范围为 `x=400–790、y=100–390`。雷达中心必须与撤离区边界保持 `80 u` 净空，但真实覆盖允许延伸进入撤离区。任务最终准备时还会保证至少一部 Fire Control 完整覆盖目标 `58 u` 攻击区并保留 `20 u` 余量。
 
@@ -328,34 +321,16 @@ Enemy Alert、SEAD、STRIKE、COMMAND STRIKE、Enemy Adaptation 与 Final Strike
 探测概率判定  <节点 Seed>-M01:<Radar ID>:<Scan Count>
 ```
 
-天气真实状态由初始参数和任务绝对时间纯函数推导，雷达探测由扫描计数确定随机结果，因此相同 Seed、Run 历史、航线操作和时间演进可以复现。Seed 只固定基础世界：已选节点、失败次数、Enemy Alert、INTEL 权限、SEAD/STRIKE/COMMAND STRIKE 战果与历史航迹仍会在准备任务时改变最终部署。
+天气真实状态由初始参数和任务绝对时间纯函数推导，雷达探测由扫描计数确定随机结果，因此相同 Seed、已完成节点、航线操作和时间演进可以复现。Seed 固定基础世界，INTEL 权限及 SEAD/STRIKE/COMMAND STRIKE 战果在准备任务时应用清晰、确定的直接修正。
 
 ## 10. 当前成长边界
 
 - 成功后停留在只读结果状态，由玩家返回任务网络；不插入奖励选择流程。
 - 游戏不包含 Tactical Reward 或 Player Build 流程。
-- 当前成长只来自离散情报权限、Enemy Alert、Radar Coverage、Radar Scan、Command Link 和敌方适应。
+- 当前成长只来自离散情报权限、Radar Coverage、Radar Scan 和 Command Link。
 - 正式玩法差异来自程序生成地图、雷达、天气和任务网络防空变化。
 
-## 11. Enemy Adaptation
-
-任务结束后，敌方只分析已经发生的历史，不读取下一任务尚未执行的航线：
-
-- 地形利用：实际轨迹采样点落在地形遮蔽区内的比例。
-- 南北航路偏好：实际轨迹采样点在地图纵向的位置分布。
-- 直达倾向：轨迹起终点直线距离与实际已飞轨迹长度的比例。
-
-成功航迹按 `1.0` 权重、失败航迹按 `0.5` 权重更新画像。系统不再把任务次数直接当作适应等级，而是根据已形成的显著特征确定性调整雷达部署：
-
-- 地形利用率达到 35% 时，雷达向山地出口加强覆盖。
-- 南北航路偏离中线达到 8% 时，雷达向对应走廊移动。
-- 直达倾向达到 72% 时，雷达向插入点至目标的直达轴线移动。
-
-识别出一、二、三项特征时，反制移位强度分别为 22%、32% 和 42%；任务网络以 `LOW / ACTIVE / HIGH` 显示当前画像状态。
-
-任务面板中的 `COUNTER DEPLOYMENT` 会说明本场采用了哪些反制。敌方学习的是历史倾向而非未来计划，因此玩家可以主动改变打法，甚至利用既有画像制造误判。
-
-## 12. 航线规划建议
+## 11. 航线规划建议
 
 - 不要把黄色情报圈当成真实边界，给误差和多个雷达覆盖重叠留出余量。
 - 尽量从雷达覆盖边缘穿越，而不是经过雷达中心附近。
@@ -366,22 +341,19 @@ Enemy Alert、SEAD、STRIKE、COMMAND STRIKE、Enemy Adaptation 与 Final Strike
 - 出现持续照射或火控锁定时应立即规划脱离雷达波束；导弹来袭后必须在 8 秒内把跟踪质量压到 32 以下。
 - 攻击会提高 Awareness，使 Commander 更倾向协同或集中搜索；实际搜索方位仍来自 Belief/CMD。
 - 任务网络中的第一次 INTEL 会补齐全部雷达并精确核实坐标与型号，第二次授权 `TOTAL INTEL`；SEAD 缩小后续危险区，Command Strike 削弱多雷达协同。
-- 连续使用同一走廊会让后续雷达向该区域移动；适时改变南北路线、地形利用方式和突击角度。
 - 规划时必须为目标攻击后的撤离段保留燃油；过度绕飞虽然能避开雷达，但可能导致总航程超过 `2000 u`。
 
-## 13. Final Strike
+## 12. Final Strike
 
-最终打击不是普通任务换名，而是在出击时根据完整 Run 历史组装防空体系：
+最终打击不是普通任务换名，而是在出击时根据已完成任务的直接效果组装防空体系：
 
 - 目标区固定增加一部后备 Fire Control；SEAD 只缩小其覆盖，不阻止其上线。
-- Enemy Alert ≥ 15：增加一部警戒增援雷达，其覆盖还会随 Alert 小幅增加。
-- Enemy Adaptation 累计观察权重至少为 2 且识别两项以上显著特征：根据历史南北航路偏好增加一部自适应截击雷达。
 - 已完成 STRIKE 的扫描速率削弱继续作用于最终战全部雷达；一次为 90%，两次为 81%。
 - Command Strike 的指挥链削弱、INTEL 的离散显示权限和 SEAD 的覆盖削弱仍会继续生效。
 
-进入最终任务后，`FINAL DEFENSE BRIEFING` 会列出每项历史造成的结果；新增雷达也会经过有限情报系统，不会向玩家直接暴露真实位置。成功摧毁目标并撤离后，本次 Run 状态变为 `VICTORY`。
+进入最终任务后，`FINAL DEFENSE BRIEFING` 会列出固定后备火控与已完成任务产生的直接结果；新增雷达也会经过有限情报系统，不会向玩家直接暴露真实位置。成功摧毁目标并撤离后，本次 Run 状态变为 `VICTORY`。
 
-## 14. 当前尚未实现
+## 13. 当前尚未实现
 
 - 反辐射导弹与直接摧毁任务内雷达。
 - 雷达开机辐射暴露、实时 ELINT 测向与玩家侧实时更新情报。
diff --git a/src/domain/airDefenseCommander.ts b/src/domain/airDefenseCommander.ts
index d2727c3..d3e1d2e 100644
--- a/src/domain/airDefenseCommander.ts
+++ b/src/domain/airDefenseCommander.ts
@@ -33,7 +33,7 @@ function biasForIntent(intent: CommanderIntent): RadarUtilityScores {
   }
 }
 
-/** Commander 只接收敌方警戒与 Belief，不接收 AircraftState 或目标打击位置。 */
+/** Commander 只接收任务内态势警戒与 Belief，不接收 AircraftState 或目标打击位置。 */
 export function advanceCommander(
   state: CommanderState,
   awareness: AwarenessState,
diff --git a/src/domain/awarenessSystem.ts b/src/domain/awarenessSystem.ts
index ec47fcf..e736e5e 100644
--- a/src/domain/awarenessSystem.ts
+++ b/src/domain/awarenessSystem.ts
@@ -8,7 +8,7 @@ export function awarenessStage(value: number): AwarenessStage {
   return "CALM";
 }
 
-/** 敌方警戒只由已经获得的 Contact 与已知打击事件变化，不读取飞机真实状态。 */
+/** 任务内态势警戒只由已经获得的 Contact 与已知打击事件变化，不读取飞机真实状态。 */
 export function advanceAwareness(
   state: AwarenessState,
   contacts: readonly RadarContact[],
diff --git a/src/domain/campaignBalance.ts b/src/domain/campaignBalance.ts
index 3be5f81..803f1ad 100644
--- a/src/domain/campaignBalance.ts
+++ b/src/domain/campaignBalance.ts
@@ -4,16 +4,12 @@ import type { MissionNodeType } from "./types";
 export const campaignBalance = {
   /** 两级情报权限各由一次 INTEL 解锁，任务网络不得生成没有新奖励的第三次行动。 */
   maxIntelMissions: 2,
-  successAlertDelta: 2,
-  failureAlertDelta: 10,
   seadRadarCoverageMultiplier: 0.9,
   radarCoverageFloor: 0.55,
   commandCoordinationMultiplier: 0.65,
   commanderCoordinationFloor: 0.45,
   strikeRadarScanRateMultiplier: 0.9,
   radarScanRateFloor: 0.65,
-  failedMissionAdaptationWeight: 0.5,
-  successfulMissionAdaptationWeight: 1,
 } as const;
 
 export const missionEffectDescriptions: Record<MissionNodeType, string> = {
@@ -64,7 +60,3 @@ export function getMissionEffectDescription(
   if (key === "INTEL_GENERIC") return missionEffectDescriptions.INTEL;
   return missionEffectDescriptions[key];
 }
-
-export function getMissionAlertDelta(succeeded: boolean): number {
-  return succeeded ? campaignBalance.successAlertDelta : campaignBalance.failureAlertDelta;
-}
diff --git a/src/domain/enemyAdaptation.test.ts b/src/domain/enemyAdaptation.test.ts
deleted file mode 100644
index a2713d9..0000000
--- a/src/domain/enemyAdaptation.test.ts
+++ /dev/null
@@ -1,93 +0,0 @@
-import { describe, expect, it } from "vitest";
-import { createMission, createRun } from "./factories";
-import { analyzeCompletedMission, applyEnemyCounterDeployment, createPlayerTacticalProfile, getAdaptationAssessment } from "./enemyAdaptation";
-
-describe("Enemy Adaptation", () => {
-  it("只分析真实已飞轨迹，不读取未来规划", () => {
-    const mission = createMission("ADAPT-HISTORY");
-    const withRoute = {
-      ...mission,
-      flightPath: [
-        { x: 90, y: 850 },
-        { x: 300, y: 800 },
-      ],
-      route: {
-        activeWaypointIndex: 2,
-        waypoints: [
-          { ...mission.route.waypoints[0]!, status: "COMPLETED" as const },
-          { id: "flown", kind: "NAVIGATION" as const, status: "COMPLETED" as const, position: { x: 300, y: 800 } },
-          { id: "future", kind: "NAVIGATION" as const, status: "PENDING" as const, position: { x: 900, y: 50 } },
-        ],
-      },
-    };
-
-    const profile = analyzeCompletedMission(createPlayerTacticalProfile(), withRoute);
-
-    expect(profile.missionSamples).toBe(1);
-    expect(profile.southernRouteBias).toBeGreaterThan(0.7);
-  });
-
-  it("没有足够飞行历史时不更新画像", () => {
-    const mission = createMission("ADAPT-NO-HISTORY");
-    const initial = createPlayerTacticalProfile();
-
-    expect(analyzeCompletedMission(initial, mission)).toBe(initial);
-  });
-
-  it("相同画像会生成可复现的反制部署", () => {
-    const mission = createMission("ADAPT-DEPLOYMENT");
-    const enemyState = {
-      ...createRun("ADAPT-RUN").enemyState,
-      tacticalProfile: {
-        missionSamples: 2,
-        terrainMaskingPreference: 0.8,
-        southernRouteBias: 0.82,
-        aggressiveRouting: 0.9,
-      },
-    };
-
-    const first = applyEnemyCounterDeployment(mission, enemyState);
-    const second = applyEnemyCounterDeployment(mission, enemyState);
-    const protectedFireControl = mission.radars.find((radar) => radar.type === "FIRE_CONTROL")!;
-
-    expect(second.radars).toEqual(first.radars);
-    expect(first.radars).not.toEqual(mission.radars);
-    expect(first.adaptationNotes).toContain("山地出口增设搜索覆盖");
-    expect(first.adaptationNotes).toContain("南部航路搜索加强");
-    expect(first.adaptationNotes).toContain("直达目标轴线增加拦截覆盖");
-    expect(first.radars.find((radar) => radar.id === protectedFireControl.id)?.position).toEqual(
-      protectedFireControl.position,
-    );
-  });
-
-  it("没有历史样本时不改变雷达部署", () => {
-    const mission = createMission("ADAPT-BASELINE");
-    const result = applyEnemyCounterDeployment(mission, createRun("ADAPT-BASELINE-RUN").enemyState);
-
-    expect(result.radars).toEqual(mission.radars);
-    expect(result.adaptationNotes).toEqual([]);
-  });
-
-  it("根据显著画像数量派生状态与反制强度", () => {
-    const initial = createPlayerTacticalProfile();
-    expect(getAdaptationAssessment(initial)).toMatchObject({ signalCount: 0, status: "LOW", deploymentStrength: 0 });
-    expect(getAdaptationAssessment({ ...initial, aggressiveRouting: 0.8 }))
-      .toMatchObject({ signalCount: 1, status: "ACTIVE", deploymentStrength: 0.22 });
-    expect(getAdaptationAssessment({ ...initial, aggressiveRouting: 0.8, southernRouteBias: 0.7 }))
-      .toMatchObject({ signalCount: 2, status: "HIGH", deploymentStrength: 0.32 });
-    expect(getAdaptationAssessment({ missionSamples: 2, aggressiveRouting: 0.8, southernRouteBias: 0.7, terrainMaskingPreference: 0.5 }))
-      .toMatchObject({ signalCount: 3, status: "HIGH", deploymentStrength: 0.42 });
-  });
-
-  it("支持半权重航迹并与旧存档整数权重进行加权平均", () => {
-    const mission = {
-      ...createMission("ADAPT-WEIGHTED"),
-      flightPath: [{ x: 90, y: 800 }, { x: 400, y: 800 }],
-    };
-    const legacy = { missionSamples: 1, terrainMaskingPreference: 0.3, southernRouteBias: 0.4, aggressiveRouting: 0.5 };
-    const profile = analyzeCompletedMission(legacy, mission, 0.5);
-
-    expect(profile.missionSamples).toBe(1.5);
-    expect(profile.southernRouteBias).toBeCloseTo((0.4 + 0.8 * 0.5) / 1.5);
-  });
-});
diff --git a/src/domain/enemyAdaptation.ts b/src/domain/enemyAdaptation.ts
deleted file mode 100644
index 7e61b48..0000000
--- a/src/domain/enemyAdaptation.ts
+++ /dev/null
@@ -1,153 +0,0 @@
-import { gameConfig } from "../config/gameConfig";
-import type { MissionSession, PersistentEnemyState, PlayerTacticalProfile, RadarState, Vector2 } from "./types";
-
-export function createPlayerTacticalProfile(): PlayerTacticalProfile {
-  return {
-    missionSamples: 0,
-    terrainMaskingPreference: 0,
-    southernRouteBias: 0.5,
-    aggressiveRouting: 0,
-  };
-}
-
-export interface AdaptationAssessment {
-  terrainMasking: boolean;
-  routeBias: boolean;
-  aggressiveRouting: boolean;
-  signalCount: number;
-  status: "LOW" | "ACTIVE" | "HIGH";
-  deploymentStrength: number;
-}
-
-/** 只有形成足够鲜明的实际航迹特征时，敌军才获得可执行的反制依据。 */
-export function getAdaptationAssessment(profile: PlayerTacticalProfile): AdaptationAssessment {
-  const terrainMasking = profile.terrainMaskingPreference >= 0.35;
-  const routeBias = Math.abs(profile.southernRouteBias - 0.5) >= 0.08;
-  const aggressiveRouting = profile.aggressiveRouting >= 0.72;
-  const signalCount = [terrainMasking, routeBias, aggressiveRouting].filter(Boolean).length;
-  return {
-    terrainMasking,
-    routeBias,
-    aggressiveRouting,
-    signalCount,
-    status: signalCount === 0 ? "LOW" : signalCount === 1 ? "ACTIVE" : "HIGH",
-    deploymentStrength: signalCount === 0 ? 0 : signalCount === 1 ? 0.22 : signalCount === 2 ? 0.32 : 0.42,
-  };
-}
-
-function distance(first: Vector2, second: Vector2): number {
-  return Math.hypot(first.x - second.x, first.y - second.y);
-}
-
-function blend(previous: number, observed: number, previousWeight: number, observationWeight: number): number {
-  return (previous * previousWeight + observed * observationWeight) / (previousWeight + observationWeight);
-}
-
-/** 任务结束后只分析按位移采样的真实已飞轨迹，不读取未执行航点。 */
-export function analyzeCompletedMission(
-  profile: PlayerTacticalProfile,
-  mission: MissionSession,
-  observationWeight = 1,
-): PlayerTacticalProfile {
-  const flownPoints = mission.flightPath;
-  if (flownPoints.length < 2 || observationWeight <= 0) return profile;
-
-  const terrainPoints = flownPoints.filter((point) => mission.terrain.some((zone) =>
-    point.x >= zone.x && point.x <= zone.x + zone.width
-      && point.y >= zone.y && point.y <= zone.y + zone.height)).length;
-  const terrainPreference = terrainPoints / flownPoints.length;
-  const southernBias = flownPoints.reduce((sum, point) => sum + point.y / gameConfig.world.height, 0) / flownPoints.length;
-  const flownDistance = flownPoints.slice(1).reduce(
-    (sum, point, index) => sum + distance(flownPoints[index]!, point),
-    0,
-  );
-  const directDistance = distance(flownPoints[0]!, flownPoints.at(-1)!);
-  const aggressiveRouting = flownDistance === 0 ? 0 : Math.min(1, directDistance / flownDistance);
-  const samples = profile.missionSamples;
-  const nextSamples = samples + observationWeight;
-
-  return {
-    missionSamples: nextSamples,
-    terrainMaskingPreference: blend(profile.terrainMaskingPreference, terrainPreference, samples, observationWeight),
-    southernRouteBias: blend(profile.southernRouteBias, southernBias, samples, observationWeight),
-    aggressiveRouting: blend(profile.aggressiveRouting, aggressiveRouting, samples, observationWeight),
-  };
-}
-
-function clampPosition(position: Vector2): Vector2 {
-  return {
-    x: Math.max(80, Math.min(gameConfig.world.width - 80, position.x)),
-    y: Math.max(80, Math.min(gameConfig.world.height - 80, position.y)),
-  };
-}
-
-function moveRadar(radar: RadarState, target: Vector2, strength: number): RadarState {
-  return {
-    ...radar,
-    position: clampPosition({
-      x: radar.position.x + (target.x - radar.position.x) * strength,
-      y: radar.position.y + (target.y - radar.position.y) * strength,
-    }),
-  };
-}
-
-function moveNearestRadar(
-  radars: RadarState[],
-  target: Vector2,
-  strength: number,
-  usedRadarIds: Set<string>,
-  protectedRadarId?: string,
-): void {
-  const radar = radars
-    .filter((candidate) => !usedRadarIds.has(candidate.id) && candidate.id !== protectedRadarId)
-    .sort((first, second) => distance(first.position, target) - distance(second.position, target))[0];
-  if (!radar) return;
-  const index = radars.findIndex((candidate) => candidate.id === radar.id);
-  radars[index] = moveRadar(radar, target, strength);
-  usedRadarIds.add(radar.id);
-}
-
-/** 根据跨任务画像调整后续部署；只使用历史汇总值和新任务生成内容。 */
-export function applyEnemyCounterDeployment(
-  mission: MissionSession,
-  enemyState: PersistentEnemyState,
-): MissionSession {
-  const profile = enemyState.tacticalProfile;
-  const assessment = getAdaptationAssessment(profile);
-  if (profile.missionSamples === 0 || mission.radars.length === 0 || assessment.signalCount === 0) {
-    return { ...mission, adaptationNotes: [] };
-  }
-
-  const radars = [...mission.radars];
-  const notes: string[] = [];
-  const strength = assessment.deploymentStrength;
-  const usedRadarIds = new Set<string>();
-  // 目标区最近的火控雷达承担固定防御职责，不参与历史航路反制移位。
-  const protectedFireControlId = radars
-    .filter((radar) => radar.type === "FIRE_CONTROL")
-    .sort((first, second) => distance(first.position, mission.target.position) - distance(second.position, mission.target.position))[0]?.id;
-
-  const primaryTerrain = mission.terrain[0];
-  if (assessment.terrainMasking && primaryTerrain) {
-    const exit = { x: primaryTerrain.x + primaryTerrain.width, y: primaryTerrain.y + primaryTerrain.height / 2 };
-    moveNearestRadar(radars, exit, strength, usedRadarIds, protectedFireControlId);
-    notes.push("山地出口增设搜索覆盖");
-  }
-
-  if (assessment.routeBias) {
-    const corridorY = profile.southernRouteBias * gameConfig.world.height;
-    moveNearestRadar(radars, { x: gameConfig.world.width * 0.58, y: corridorY }, strength, usedRadarIds, protectedFireControlId);
-    notes.push(profile.southernRouteBias > 0.5 ? "南部航路搜索加强" : "北部航路搜索加强");
-  }
-
-  if (assessment.aggressiveRouting) {
-    const directAxis = {
-      x: (mission.route.waypoints[0]!.position.x + mission.target.position.x) / 2,
-      y: (mission.route.waypoints[0]!.position.y + mission.target.position.y) / 2,
-    };
-    moveNearestRadar(radars, directAxis, strength, usedRadarIds, protectedFireControlId);
-    notes.push("直达目标轴线增加拦截覆盖");
-  }
-
-  return { ...mission, radars, adaptationNotes: notes };
-}
diff --git a/src/domain/factories.ts b/src/domain/factories.ts
index dd30325..8987819 100644
--- a/src/domain/factories.ts
+++ b/src/domain/factories.ts
@@ -4,7 +4,6 @@ import { generateMissionContent } from "../procedural/missionGenerator";
 import { generateCampaign } from "../procedural/campaignGenerator";
 import { createInitialRoute, insertionPoint } from "./route";
 import { generateRadarIntel } from "./intelSystem";
-import { createPlayerTacticalProfile } from "./enemyAdaptation";
 import { createEngagementState } from "./engagementSystem";
 import { advanceWeather } from "./weatherSystem";
 import { ensureTargetFireControlCoverage } from "./targetDefense";
@@ -36,7 +35,6 @@ export function createMission(seed: string): MissionSession {
       fuelRemaining: gameConfig.aircraft.fuelCapacityDistance,
       fuelCapacity: gameConfig.aircraft.fuelCapacityDistance,
     },
-    flightPath: [{ ...insertionPoint }],
     route: createInitialRoute(),
     terrain: generated.terrain,
     weather: advanceWeather(generated.weather, 0),
@@ -52,7 +50,6 @@ export function createMission(seed: string): MissionSession {
     extractionArea: { ...gameConfig.mission.extractionArea },
     radarScanRateModifier: 1,
     commanderCoordinationModifier: 1,
-    adaptationNotes: [],
     finalStrikeNotes: [],
     events: [],
   };
@@ -64,12 +61,10 @@ export function createRun(seed: string = gameConfig.initialSeed): RunState {
   return {
     seed,
     campaign: { ...campaign, currentNodeId: firstNode.id },
-    resources: { enemyAlert: 0 },
     enemyState: {
       radarCoverageModifier: 1,
       radarScanRateModifier: 1,
       commanderCoordinationModifier: 1,
-      tacticalProfile: createPlayerTacticalProfile(),
     },
     missionDebriefs: {},
     currentMission: createMission(firstNode.missionSeed),
diff --git a/src/domain/finalStrike.test.ts b/src/domain/finalStrike.test.ts
index be86eb8..618cc2d 100644
--- a/src/domain/finalStrike.test.ts
+++ b/src/domain/finalStrike.test.ts
@@ -1,12 +1,10 @@
 import { describe, expect, it } from "vitest";
-import { createMission, createRun } from "./factories";
+import { createMission } from "./factories";
 import { applyFinalStrikeDefense, type FinalStrikeContext } from "./finalStrike";
 
 function context(overrides: Partial<FinalStrikeContext> = {}): FinalStrikeContext {
   return {
     completedNodeTypes: [],
-    enemyAlert: 0,
-    tacticalProfile: createRun("FINAL-CONTEXT").enemyState.tacticalProfile,
     ...overrides,
   };
 }
@@ -29,43 +27,22 @@ describe("Final Strike 动态防空体系", () => {
     expect(finalMission.radars.some((radar) => radar.id === "FINAL-GUARD")).toBe(true);
   });
 
-  it("高 Alert 与历史画像会分别增加警戒和自适应雷达", () => {
-    const mission = createMission("FINAL-ESCALATION");
+  it("最终战不再生成警戒或历史航迹增援", () => {
+    const mission = createMission("FINAL-SIMPLIFIED");
     const finalMission = applyFinalStrikeDefense(mission, context({
-      enemyAlert: 30,
-      tacticalProfile: {
-        missionSamples: 3,
-        terrainMaskingPreference: 0.5,
-        southernRouteBias: 0.8,
-        aggressiveRouting: 0.85,
-      },
+      completedNodeTypes: ["INTEL", "STRIKE", "SEAD", "COMMAND_STRIKE"],
     }));
 
-    expect(finalMission.radars.some((radar) => radar.id === "ALERT-GUARD")).toBe(true);
-    expect(finalMission.radars.some((radar) => radar.id === "ADAPT-GUARD")).toBe(true);
-  });
-
-  it("仅在至少两项显著画像特征形成后部署自适应雷达", () => {
-    const mission = createMission("FINAL-ADAPTATION-SIGNALS");
-    const low = applyFinalStrikeDefense(mission, context({
-      tacticalProfile: {
-        missionSamples: 3,
-        terrainMaskingPreference: 0.1,
-        southernRouteBias: 0.5,
-        aggressiveRouting: 0.8,
-      },
-    }));
-
-    expect(low.radars.some((radar) => radar.id === "ADAPT-GUARD")).toBe(false);
-    expect(low.finalStrikeNotes).toContain("历史航迹未形成高可信反制画像");
+    expect(finalMission.radars).toHaveLength(mission.radars.length + 1);
+    expect(finalMission.radars.some((radar) => radar.id === "ALERT-GUARD")).toBe(false);
+    expect(finalMission.radars.some((radar) => radar.id === "ADAPT-GUARD")).toBe(false);
+    expect(finalMission.finalStrikeNotes).toContain("指挥打击战果削弱最终指挥链");
+    expect(finalMission.finalStrikeNotes).toContain("情报战果已核实最终目标雷达坐标与型号");
   });
 
   it("相同任务历史会生成完全一致的最终体系", () => {
     const mission = createMission("FINAL-REPLAY");
-    const history = context({
-      enemyAlert: 25,
-      tacticalProfile: { ...context().tacticalProfile, missionSamples: 2 },
-    });
+    const history = context({ completedNodeTypes: ["INTEL", "SEAD"] });
 
     expect(applyFinalStrikeDefense(mission, history)).toEqual(applyFinalStrikeDefense(mission, history));
   });
diff --git a/src/domain/finalStrike.ts b/src/domain/finalStrike.ts
index ad08fce..1ac6492 100644
--- a/src/domain/finalStrike.ts
+++ b/src/domain/finalStrike.ts
@@ -1,13 +1,10 @@
 import { gameConfig } from "../config/gameConfig";
 import { SeededRandom } from "../core/SeededRandom";
 import { createRadarOperatorState } from "./radarOperatorAI";
-import { getAdaptationAssessment } from "./enemyAdaptation";
-import type { MissionNodeType, MissionSession, PlayerTacticalProfile, RadarState, RadarType } from "./types";
+import type { MissionNodeType, MissionSession, RadarState, RadarType } from "./types";
 
 export interface FinalStrikeContext {
   completedNodeTypes: MissionNodeType[];
-  enemyAlert: number;
-  tacticalProfile: PlayerTacticalProfile;
 }
 
 function clamp(value: number, min: number, max: number): number {
@@ -60,36 +57,6 @@ export function applyFinalStrikeDefense(
   ));
   notes.push("目标区后备火控雷达上线");
 
-  if (context.enemyAlert >= 15) {
-    radars.push(createGuardRadar(
-      "ALERT-GUARD",
-      mission.target.position.x - 185,
-      mission.target.position.y + 165,
-      averageRange * (1 + Math.min(0.18, context.enemyAlert / 500)),
-      random.range(0, 360),
-      "EARLY_WARNING",
-    ));
-    notes.push(`敌方警戒 ${context.enemyAlert}：增援警戒雷达部署`);
-  } else {
-    notes.push("敌方警戒较低：未触发警戒增援");
-  }
-
-  const adaptation = getAdaptationAssessment(context.tacticalProfile);
-  if (context.tacticalProfile.missionSamples >= 2 && adaptation.signalCount >= 2) {
-    const corridorY = context.tacticalProfile.southernRouteBias * gameConfig.world.height;
-    radars.push(createGuardRadar(
-      "ADAPT-GUARD",
-      gameConfig.world.width * 0.64,
-      corridorY,
-      averageRange * 0.86,
-      random.range(0, 360),
-      "ACQUISITION",
-    ));
-    notes.push(`${context.tacticalProfile.southernRouteBias > 0.5 ? "南部" : "北部"}历史航路部署自适应截击雷达`);
-  } else {
-    notes.push("历史航迹未形成高可信反制画像");
-  }
-
   if (completed.has("COMMAND_STRIKE")) notes.push("指挥打击战果削弱最终指挥链");
   if (completed.has("INTEL")) notes.push("情报战果已核实最终目标雷达坐标与型号");
 
diff --git a/src/domain/types.ts b/src/domain/types.ts
index 1eaff60..6216574 100644
--- a/src/domain/types.ts
+++ b/src/domain/types.ts
@@ -35,25 +35,11 @@ export interface CampaignState {
   edges: CampaignEdge[];
 }
 
-export interface RunResources {
-  enemyAlert: number;
-}
-
 export interface PersistentEnemyState {
   radarCoverageModifier: number;
   /** STRIKE 造成的跨任务雷达扫描速率修正，1 为正常速率。 */
   radarScanRateModifier: number;
   commanderCoordinationModifier: number;
-  tacticalProfile: PlayerTacticalProfile;
-}
-
-/** 只由已经执行过的任务更新，不读取当前任务的未来航线。 */
-export interface PlayerTacticalProfile {
-  /** 已分析航迹的累计观察权重；成功为 1，失败为 0.5，旧存档整数值保持兼容。 */
-  missionSamples: number;
-  terrainMaskingPreference: number;
-  southernRouteBias: number;
-  aggressiveRouting: number;
 }
 
 export interface Waypoint {
@@ -264,8 +250,6 @@ export interface MissionSession {
   status: MissionStatus;
   elapsedMs: number;
   aircraft: AircraftState;
-  /** 按最小位移采样的真实已飞轨迹，仅在任务结束后用于跨任务画像。 */
-  flightPath: Vector2[];
   route: RouteState;
   terrain: TerrainZone[];
   weather: WeatherCell[];
@@ -282,7 +266,6 @@ export interface MissionSession {
   /** 本任务实际使用的雷达扫描速率修正，同时驱动扫描动画与 Sensor 周期。 */
   radarScanRateModifier: number;
   commanderCoordinationModifier: number;
-  adaptationNotes: string[];
   finalStrikeNotes: string[];
   events: GameEvent[];
 }
@@ -298,7 +281,6 @@ export interface MissionDebrief {
 export interface RunState {
   seed: string;
   campaign: CampaignState;
-  resources: RunResources;
   enemyState: PersistentEnemyState;
   missionDebriefs: Record<string, MissionDebrief>;
   currentMission?: MissionSession;
diff --git a/src/game/gamePersistence.test.ts b/src/game/gamePersistence.test.ts
index 4363faf..5ceecb1 100644
--- a/src/game/gamePersistence.test.ts
+++ b/src/game/gamePersistence.test.ts
@@ -9,7 +9,6 @@ describe("任务进度保存", () => {
     const state = createRun("SAVE-RESTORE");
     const changed = {
       ...state,
-      resources: { ...state.resources, enemyAlert: 37 },
       currentMission: {
         ...state.currentMission!,
         elapsedMs: 12_500,
@@ -21,7 +20,6 @@ describe("任务进度保存", () => {
 
     const restored = loadRunProgress();
     expect(restored?.seed).toBe("SAVE-RESTORE");
-    expect(restored?.resources.enemyAlert).toBe(37);
     expect(restored?.currentMission?.elapsedMs).toBe(12_500);
     expect(restored?.currentMission?.aircraft.fuelRemaining).toBe(1450);
   });
@@ -88,11 +86,21 @@ describe("任务进度保存", () => {
     expect(loadRunProgress()?.currentMission?.extractionArea).toEqual({ x: 860, y: 50, width: 100, height: 100 });
   });
 
-  it("恢复旧存档时移除废弃的情报质量字段", () => {
+  it("恢复旧存档时移除废弃的情报质量与敌方升级字段", () => {
     const state = createRun("SAVE-LEGACY-INTEL-QUALITY");
     const legacyState = {
       ...state,
-      resources: { ...state.resources, intelAccuracyBonus: 0.2 },
+      resources: { enemyAlert: 30, intelAccuracyBonus: 0.2 },
+      enemyState: {
+        ...state.enemyState,
+        adaptationLevel: 2,
+        tacticalProfile: {
+          missionSamples: 2,
+          terrainMaskingPreference: 0.5,
+          southernRouteBias: 0.8,
+          aggressiveRouting: 0.75,
+        },
+      },
       campaign: {
         ...state.campaign,
         nodes: state.campaign.nodes.map((node) => ({
@@ -100,13 +108,24 @@ describe("任务进度保存", () => {
           preview: { ...node.preview, intelAccuracy: 0.88 },
         })),
       },
-      currentMission: { ...state.currentMission!, intelAccuracy: 0.98 },
+      currentMission: {
+        ...state.currentMission!,
+        intelAccuracy: 0.98,
+        flightPath: [{ x: 90, y: 900 }, { x: 400, y: 800 }],
+        adaptationNotes: ["南部航路搜索加强"],
+        finalStrikeNotes: ["目标区后备火控雷达上线", "历史航迹未形成高可信反制画像"],
+      },
     };
     window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: legacyState }));
 
     const restored = loadRunProgress();
-    expect(restored?.resources).toEqual({ enemyAlert: 0 });
+    expect(restored).not.toHaveProperty("resources");
+    expect(restored?.enemyState).not.toHaveProperty("adaptationLevel");
+    expect(restored?.enemyState).not.toHaveProperty("tacticalProfile");
     expect(restored?.currentMission).not.toHaveProperty("intelAccuracy");
+    expect(restored?.currentMission).not.toHaveProperty("flightPath");
+    expect(restored?.currentMission).not.toHaveProperty("adaptationNotes");
+    expect(restored?.currentMission?.finalStrikeNotes).toEqual(["目标区后备火控雷达上线"]);
     restored?.campaign.nodes.forEach((node) => expect(node.preview).not.toHaveProperty("intelAccuracy"));
   });
 
diff --git a/src/game/gamePersistence.ts b/src/game/gamePersistence.ts
index 9c0fb18..cf29184 100644
--- a/src/game/gamePersistence.ts
+++ b/src/game/gamePersistence.ts
@@ -18,7 +18,7 @@ function isRunState(value: unknown): value is RunState {
   return typeof state.seed === "string"
     && (state.status === "ACTIVE" || state.status === "VICTORY" || state.status === "DEFEAT")
     && Boolean(state.campaign && Array.isArray(state.campaign.nodes))
-    && Boolean(state.resources && state.enemyState)
+    && Boolean(state.enemyState)
     && (!state.currentMission || Boolean(state.currentMission.route && state.currentMission.aircraft));
 }
 
@@ -32,34 +32,53 @@ export function saveRunProgress(state: RunState): void {
 }
 
 function restoreMissionCompatibility(mission: MissionSession, scanRateModifier: number): MissionSession {
-  // v1 旧存档可能仍包含已经移除的 intelAccuracy；显式剥离，避免下次保存继续携带废弃字段。
-  const { intelAccuracy: _legacyIntelAccuracy, ...currentMission } = mission as MissionSession & {
+  // v1 旧存档可能仍包含已移除的情报质量与敌方升级字段；显式剥离，避免下次保存继续携带废弃状态。
+  const {
+    intelAccuracy: _legacyIntelAccuracy,
+    flightPath: _legacyFlightPath,
+    adaptationNotes: _legacyAdaptationNotes,
+    ...currentMission
+  } = mission as MissionSession & {
     intelAccuracy?: number;
+    flightPath?: unknown;
+    adaptationNotes?: unknown;
   };
   return {
     ...currentMission,
     radarScanRateModifier: mission.radarScanRateModifier ?? scanRateModifier,
+    finalStrikeNotes: (currentMission.finalStrikeNotes ?? []).filter((note) => !isRemovedEnemyEscalationNote(note)),
     // 固定任务区域属于当前规则配置，恢复旧存档时同步迁移，避免画面与撤离判定继续使用旧尺寸。
     extractionArea: { ...gameConfig.mission.extractionArea },
   };
 }
 
+/** 旧存档中的警戒与航迹适应简报不再属于当前规则，恢复时统一清理。 */
+function isRemovedEnemyEscalationNote(note: string): boolean {
+  return /^(?:低 Enemy Alert|敌方警戒较低|Enemy Alert \d+|敌方警戒 \d+)：/.test(note)
+    || note === "历史航迹未形成高可信反制画像"
+    || /^(?:南部|北部)历史航路部署自适应截击雷达$/.test(note);
+}
+
 export function loadRunProgress(): RunState | undefined {
   try {
     const raw = window.localStorage.getItem(RUN_SAVE_KEY);
     if (!raw) return undefined;
     const payload = JSON.parse(raw) as Partial<SavedRun>;
     if (payload.version !== SAVE_VERSION || !isRunState(payload.state)) return undefined;
-    const legacyStatus = (payload.state.currentMission as { status?: string } | undefined)?.status;
-    const completedStrikeCount = payload.state.campaign.nodes
+    const legacyState = payload.state as RunState & {
+      resources?: unknown;
+      enemyState: RunState["enemyState"] & { adaptationLevel?: number; tacticalProfile?: unknown };
+    };
+    const legacyStatus = (legacyState.currentMission as { status?: string } | undefined)?.status;
+    const completedStrikeCount = legacyState.campaign.nodes
       .filter((node) => node.type === "STRIKE" && node.status === "COMPLETED").length;
-    const radarScanRateModifier = payload.state.enemyState.radarScanRateModifier
+    const radarScanRateModifier = legacyState.enemyState.radarScanRateModifier
       ?? Math.max(
         campaignBalance.radarScanRateFloor,
         campaignBalance.strikeRadarScanRateMultiplier ** completedStrikeCount,
       );
     const missionDebriefs = Object.fromEntries(
-      Object.entries(payload.state.missionDebriefs ?? {}).map(([nodeId, debrief]) => [
+      Object.entries(legacyState.missionDebriefs ?? {}).map(([nodeId, debrief]) => [
         nodeId,
         {
           ...debrief,
@@ -67,11 +86,17 @@ export function loadRunProgress(): RunState | undefined {
         } satisfies MissionDebrief,
       ]),
     );
+    const { resources: _legacyResources, ...currentState } = legacyState;
+    const {
+      adaptationLevel: _legacyAdaptationLevel,
+      tacticalProfile: _legacyTacticalProfile,
+      ...currentEnemyState
+    } = legacyState.enemyState;
     const restored: RunState = {
-      ...payload.state,
+      ...currentState,
       campaign: {
-        ...payload.state.campaign,
-        nodes: payload.state.campaign.nodes.map((node) => ({
+        ...legacyState.campaign,
+        nodes: legacyState.campaign.nodes.map((node) => ({
           ...node,
           preview: {
             radarDensity: node.preview.radarDensity,
@@ -80,14 +105,13 @@ export function loadRunProgress(): RunState | undefined {
           },
         })),
       },
-      resources: { enemyAlert: payload.state.resources.enemyAlert },
-      enemyState: { ...payload.state.enemyState, radarScanRateModifier },
+      enemyState: { ...currentEnemyState, radarScanRateModifier },
       missionDebriefs,
       // 旧版暂停存档直接恢复执行；新版本刷新运行中任务也不再制造暂停状态。
       currentMission: legacyStatus === "PAUSED"
-        ? { ...restoreMissionCompatibility(payload.state.currentMission!, radarScanRateModifier), status: "RUNNING" }
-        : payload.state.currentMission
-          ? restoreMissionCompatibility(payload.state.currentMission, radarScanRateModifier)
+        ? { ...restoreMissionCompatibility(legacyState.currentMission!, radarScanRateModifier), status: "RUNNING" }
+        : legacyState.currentMission
+          ? restoreMissionCompatibility(legacyState.currentMission, radarScanRateModifier)
           : undefined,
     };
     syncEventSequenceFromRun(restored);
diff --git a/src/game/gameReducer.test.ts b/src/game/gameReducer.test.ts
index 5e63b63..20bf267 100644
--- a/src/game/gameReducer.test.ts
+++ b/src/game/gameReducer.test.ts
@@ -10,7 +10,6 @@ describe("gameReducer", () => {
     state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: secondNode.id });
     state = {
       ...state,
-      resources: { ...state.resources, enemyAlert: 25 },
       enemyState: {
         ...state.enemyState,
         radarCoverageModifier: 0.85,
@@ -24,13 +23,11 @@ describe("gameReducer", () => {
     };
 
     const campaignBeforeReset = state.campaign;
-    const resourcesBeforeReset = state.resources;
     const enemyStateBeforeReset = state.enemyState;
     state = gameReducer(state, { type: "RESET" });
 
     expect(state.campaign).toBe(campaignBeforeReset);
     expect(state.campaign.currentNodeId).toBe("C0-1");
-    expect(state.resources).toBe(resourcesBeforeReset);
     expect(state.enemyState).toBe(enemyStateBeforeReset);
     expect(state.currentMission?.id).toBe(`mission-${secondNode.missionSeed}`);
     expect(state.currentMission?.status).toBe("PLANNING");
@@ -234,16 +231,14 @@ describe("gameReducer", () => {
     expect(state.campaign.nodes.find((node) => node.id === "C0-0")?.status).toBe("COMPLETED");
     expect(state.campaign.nodes.find((node) => node.id === "C0-1")?.status).toBe("EXPIRED");
     expect(getIntelAccessTier(state.campaign)).toBe(1);
-    expect(state.resources).toEqual({ enemyAlert: 2 });
     expect(state.campaign.nodes.filter((node) => node.layer === 1).every((node) => node.status === "AVAILABLE")).toBe(true);
   });
 
-  it("普通失败不推进 Campaign，保留当前层选择并提高 Enemy Alert", () => {
+  it("普通失败不推进 Campaign，并保留当前层重试或改选", () => {
     let state = createRun("CAMPAIGN-FAILURE");
     state = { ...state, currentMission: { ...state.currentMission!, status: "FAILED" } };
     state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
     expect(state.status).toBe("ACTIVE");
-    expect(state.resources.enemyAlert).toBe(10);
     expect(state.campaign.nodes.find((node) => node.id === "C0-0")?.status).toBe("FAILED");
     expect(state.campaign.nodes.find((node) => node.id === "C0-1")?.status).toBe("AVAILABLE");
     expect(state.campaign.currentNodeId).toBe("C0-0");
@@ -264,11 +259,10 @@ describe("gameReducer", () => {
     };
     state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
     expect(state.enemyState.radarCoverageModifier).toBeCloseTo(0.9);
-    expect(state.resources.enemyAlert).toBe(2);
     const available = state.campaign.nodes.find((node) => node.status === "AVAILABLE")!;
     const baseline = createMission(available.missionSeed).radars[0]!.range;
     state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: available.id });
-    expect(state.currentMission!.radars[0]!.range).toBeCloseTo(baseline * 0.9 * 1.008);
+    expect(state.currentMission!.radars[0]!.range).toBeCloseTo(baseline * 0.9);
     expect(state.currentMission!.radars.some((radar) => radar.type === "FIRE_CONTROL"
       && Math.hypot(
         radar.position.x - state.currentMission!.target.position.x,
@@ -375,48 +369,7 @@ describe("gameReducer", () => {
     expect(state.currentMission!.commanderCoordinationModifier).toBeCloseTo(0.65);
   });
 
-  it("Enemy Alert 会扩大后续任务雷达覆盖", () => {
-    let state = createRun("ALERT-EFFECT");
-    const node = state.campaign.nodes.find((candidate) => candidate.status === "AVAILABLE")!;
-    const baseline = createMission(node.missionSeed).radars[0]!.range;
-    state = { ...state, resources: { ...state.resources, enemyAlert: 50 } };
-    state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: node.id });
-    expect(state.currentMission!.radars[0]!.range).toBeCloseTo(baseline * 1.2);
-  });
-
-  it("完成任务后学习已飞航线并反制后续部署", () => {
-    let state = createRun("ADAPTATION-FLOW");
-    const mission = state.currentMission!;
-    state = {
-      ...state,
-      currentMission: {
-        ...mission,
-        status: "SUCCESS",
-        flightPath: [
-          { x: 90, y: 850 },
-          { x: 350, y: 850 },
-          { x: 700, y: 820 },
-        ],
-        route: {
-          activeWaypointIndex: 2,
-          waypoints: [
-            { ...mission.route.waypoints[0]!, status: "COMPLETED" },
-            { id: "south-1", kind: "NAVIGATION", status: "COMPLETED", position: { x: 350, y: 850 } },
-            { id: "south-2", kind: "NAVIGATION", status: "COMPLETED", position: { x: 700, y: 820 } },
-          ],
-        },
-      },
-    };
-    state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
-    expect(state.enemyState.tacticalProfile.missionSamples).toBe(1);
-    expect(state.enemyState.tacticalProfile.southernRouteBias).toBeGreaterThan(0.7);
-
-    const nextNode = state.campaign.nodes.find((node) => node.status === "AVAILABLE")!;
-    state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: nextNode.id });
-    expect(state.currentMission!.adaptationNotes).toContain("南部航路搜索加强");
-  });
-
-  it("选择 Final Strike 时根据完整 Run 历史生成最终防空", () => {
+  it("选择 Final Strike 时只应用任务直接收益与固定目标区守卫", () => {
     let state = createRun("FINAL-FLOW");
     const finalNode = state.campaign.nodes.find((node) => node.type === "FINAL_STRIKE")!;
     const seadNode = state.campaign.nodes.find((node) => node.type === "SEAD")!;
@@ -429,44 +382,17 @@ describe("gameReducer", () => {
             ? { ...node, status: "AVAILABLE" }
             : node.id === seadNode.id ? { ...node, status: "COMPLETED" } : node),
       },
-      resources: { ...state.resources, enemyAlert: 25 },
-      enemyState: {
-        ...state.enemyState,
-        tacticalProfile: {
-          missionSamples: 2,
-          terrainMaskingPreference: 0.5,
-          southernRouteBias: 0.8,
-          aggressiveRouting: 0.5,
-        },
-      },
     };
 
     state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: finalNode.id });
 
     expect(state.currentMission!.finalStrikeNotes).toContain("目标区后备火控雷达上线");
     expect(state.currentMission!.radars.some((radar) => radar.id === "FINAL-GUARD")).toBe(true);
-    expect(state.currentMission!.radars.some((radar) => radar.id === "ALERT-GUARD")).toBe(true);
-    expect(state.currentMission!.radars.some((radar) => radar.id === "ADAPT-GUARD")).toBe(true);
+    expect(state.currentMission!.radars.some((radar) => radar.id === "ALERT-GUARD")).toBe(false);
+    expect(state.currentMission!.radars.some((radar) => radar.id === "ADAPT-GUARD")).toBe(false);
     expect(state.currentMission!.radarIntel).toHaveLength(state.currentMission!.radars.length);
   });
 
-  it("失败航迹只按半权重更新敌方画像", () => {
-    let state = createRun("FAILED-ADAPTATION-WEIGHT");
-    state = {
-      ...state,
-      currentMission: {
-        ...state.currentMission!,
-        status: "FAILED",
-        flightPath: [{ x: 90, y: 800 }, { x: 400, y: 800 }],
-      },
-    };
-
-    state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
-
-    expect(state.enemyState.tacticalProfile.missionSamples).toBe(0.5);
-    expect(state.resources.enemyAlert).toBe(10);
-  });
-
   it("STRIKE 战果累计降低所有后续任务的雷达扫描速率", () => {
     let state = createRun("STRIKE-SCAN-RATE");
     const firstStrike = state.campaign.nodes.find((node) => node.id === "C0-1")!;
diff --git a/src/game/gameReducer.ts b/src/game/gameReducer.ts
index c9a54ca..4e001d4 100644
--- a/src/game/gameReducer.ts
+++ b/src/game/gameReducer.ts
@@ -9,13 +9,12 @@ import { advanceRadarSensors } from "../domain/radarSensor";
 import { canAttackTarget, isInsideExtraction } from "../domain/missionRules";
 import { generateRadarIntel } from "../domain/intelSystem";
 import { getIntelAccessTier } from "../domain/intelAccess";
-import { analyzeCompletedMission, applyEnemyCounterDeployment } from "../domain/enemyAdaptation";
 import { applyFinalStrikeDefense } from "../domain/finalStrike";
 import { advanceEngagement } from "../domain/engagementSystem";
 import { advanceWeather, getWeatherSpeedFactor } from "../domain/weatherSystem";
 import { ensureTargetFireControlCoverage } from "../domain/targetDefense";
 import { enforceExtractionRadarClearance } from "../domain/radarDeployment";
-import { campaignBalance, getMissionAlertDelta } from "../domain/campaignBalance";
+import { campaignBalance } from "../domain/campaignBalance";
 import {
   addWaypoint,
   moveWaypoint,
@@ -25,21 +24,12 @@ import {
 import type { CampaignNode, MissionSession, RunState, Vector2 } from "../domain/types";
 
 const MAX_STORED_EVENTS = 200;
-const FLIGHT_PATH_SAMPLE_DISTANCE = 20;
 
 function appendEvents(mission: MissionSession, events: MissionSession["events"]): MissionSession["events"] {
   if (events.length === 0) return mission.events;
   return [...mission.events, ...events].slice(-MAX_STORED_EVENTS);
 }
 
-function sampleFlightPath(mission: MissionSession, position: Vector2): Vector2[] {
-  const last = mission.flightPath.at(-1);
-  if (last && Math.hypot(position.x - last.x, position.y - last.y) < FLIGHT_PATH_SAMPLE_DISTANCE) {
-    return mission.flightPath;
-  }
-  return [...mission.flightPath, { ...position }];
-}
-
 export type GameAction =
   | { type: "NEW_RUN"; seed: string }
   | { type: "SELECT_CAMPAIGN_NODE"; nodeId: string }
@@ -59,28 +49,25 @@ function getEditMode(state: RunState): "PLANNING" | "RUNNING" | undefined {
 
 /**
  * 使用当前 Run 的持久状态准备指定节点任务。
- * 节点选择与任务重置必须共用这条路径，避免遗漏情报、防空削弱或敌方适应效果。
+ * 节点选择与任务重置必须共用这条路径，避免遗漏情报与任务成果带来的防空削弱。
  */
 export function prepareCampaignMission(state: RunState, node: CampaignNode): MissionSession {
   const selectedMission = createMission(node.missionSeed);
-  const alertCoverageMultiplier = 1 + state.resources.enemyAlert / 250;
   const adjustedRadars = selectedMission.radars.map((radar) => ({
     ...radar,
-    range: radar.range * state.enemyState.radarCoverageModifier * alertCoverageMultiplier,
+    range: radar.range * state.enemyState.radarCoverageModifier,
   }));
-  const adaptedMission = applyEnemyCounterDeployment({
+  const adjustedMission = {
     ...selectedMission,
     radars: adjustedRadars,
-  }, state.enemyState);
+  };
   const finalMission = node.type === "FINAL_STRIKE"
-    ? applyFinalStrikeDefense(adaptedMission, {
+    ? applyFinalStrikeDefense(adjustedMission, {
       completedNodeTypes: state.campaign.nodes
         .filter((candidate) => candidate.status === "COMPLETED")
         .map((candidate) => candidate.type),
-      enemyAlert: state.resources.enemyAlert,
-      tacticalProfile: state.enemyState.tacticalProfile,
     })
-    : adaptedMission;
+    : adjustedMission;
   const radars = ensureTargetFireControlCoverage(
     enforceExtractionRadarClearance(finalMission.radars, finalMission.extractionArea),
     finalMission.target,
@@ -150,14 +137,6 @@ export function gameReducer(state: RunState, action: GameAction): RunState {
         // 所有失败都不推进 Campaign：失败节点可重试，同层备选保持 AVAILABLE，下一层保持锁定。
         return node;
       });
-      const alertDelta = getMissionAlertDelta(succeeded);
-      const tacticalProfile = analyzeCompletedMission(
-        state.enemyState.tacticalProfile,
-        mission,
-        succeeded
-          ? campaignBalance.successfulMissionAdaptationWeight
-          : campaignBalance.failedMissionAdaptationWeight,
-      );
       // 除 Final Strike 成功外，结算后 Run 均保持 ACTIVE，失败任务可继续重试。
       const runStatus = succeeded
         ? currentNode.type === "FINAL_STRIKE" ? "VICTORY" as const : "ACTIVE" as const
@@ -166,12 +145,8 @@ export function gameReducer(state: RunState, action: GameAction): RunState {
         ...state,
         status: runStatus,
         campaign: { ...state.campaign, nodes, currentNodeId: succeeded ? undefined : currentNode.id },
-        resources: {
-          enemyAlert: Math.max(0, Math.min(100, state.resources.enemyAlert + alertDelta)),
-        },
         enemyState: {
           ...state.enemyState,
-          tacticalProfile,
           radarCoverageModifier: succeeded && currentNode.type === "SEAD"
             ? Math.max(
               campaignBalance.radarCoverageFloor,
@@ -468,7 +443,6 @@ export function gameReducer(state: RunState, action: GameAction): RunState {
         status: terminalStatus,
         elapsedMs: nextTimestamp,
         aircraft,
-        flightPath: sampleFlightPath(mission, aircraft.position),
         route: result.route,
         target,
         weather,
diff --git a/src/i18n/I18n.test.tsx b/src/i18n/I18n.test.tsx
index 6857f02..1249032 100644
--- a/src/i18n/I18n.test.tsx
+++ b/src/i18n/I18n.test.tsx
@@ -62,41 +62,18 @@ describe("游戏界面国际化", () => {
     expect(localStorage.getItem("f117-tactical-command-system:language:v1")).toBe("en");
   });
 
-  it("既有存档中的静态与动态部署记录均可翻译", () => {
-    expect(localizeBriefingNote("山地出口增设搜索覆盖", "en")).toBe(
-      "Additional search coverage positioned at the mountain exit",
-    );
-    expect(localizeBriefingNote("Enemy Alert 22：增援警戒雷达部署", "en")).toBe(
-      "ENEMY ALERT 22: reinforcement surveillance radar deployed",
-    );
-    expect(localizeBriefingNote("南部历史航路部署自适应截击雷达", "en")).toBe(
-      "Adaptive interceptor radar deployed along the historical southern route",
-    );
-    expect(localizeBriefingNote("低 Enemy Alert：未触发警戒增援", "zh")).toBe(
-      "敌方警戒较低：未触发警戒增援",
-    );
-    expect(localizeBriefingNote("Enemy Alert 22：增援警戒雷达部署", "zh")).toBe(
-      "敌方警戒 22：增援警戒雷达部署",
-    );
+  it("当前最终防御简报均可翻译且目录不再包含已删除系统", () => {
     const currentBriefingNotes = [
       "最终目标启用分层防空戒备",
       "目标区后备火控雷达上线",
-      "低 Enemy Alert：未触发警戒增援",
-      "敌方警戒较低：未触发警戒增援",
-      "历史航迹未形成高可信反制画像",
-      "Command Strike 战果削弱最终指挥链",
       "指挥打击战果削弱最终指挥链",
       "情报战果已核实最终目标雷达坐标与型号",
-      "山地出口增设搜索覆盖",
-      "南部航路搜索加强",
-      "北部航路搜索加强",
-      "直达目标轴线增加拦截覆盖",
-      "Enemy Alert 22：增援警戒雷达部署",
-      "敌方警戒 22：增援警戒雷达部署",
-      "北部历史航路部署自适应截击雷达",
     ];
     currentBriefingNotes.forEach((note) => {
       expect(localizeBriefingNote(note, "en")).not.toMatch(/[\u3400-\u9fff]/u);
     });
+    expect(collectStrings(localeCatalogs.en).map(([, value]) => value)).not.toEqual(
+      expect.arrayContaining(["ENEMY ALERT", "ENEMY ADAPTATION"]),
+    );
   });
 });
diff --git a/src/i18n/I18n.tsx b/src/i18n/I18n.tsx
index b39aa30..3b4c354 100644
--- a/src/i18n/I18n.tsx
+++ b/src/i18n/I18n.tsx
@@ -49,12 +49,10 @@ export const localeCatalogs = {
     campaign: {
       kicker: "任务网络控制",
       title: "任务网络",
-      enemyAlert: "敌方警戒",
       intelAccess: "情报权限",
       radarCoverage: "雷达覆盖",
       radarScan: "雷达扫描",
       commandLink: "指挥链路",
-      enemyAdaptation: "敌方适应",
       graphLabel: "任务节点连线",
       previewKicker: "任务预览",
       missionCode: "任务代号",
@@ -63,13 +61,7 @@ export const localeCatalogs = {
       limitedIntelligence: "有限情报",
       radarIdentificationVerified: "雷达识别已核实",
       totalIntelligenceAccess: "全域情报已授权",
-      finalStrikeWarning: "最终目标防空序列持续重构，部署态势将在出击时确认。",
-      historicalAnalysis: "敌方历史分析",
-      terrainUse: "地形利用",
-      southern: "南部",
-      northern: "北部",
-      routePreference: "航路偏好",
-      directRouting: "直达倾向",
+      finalStrikeWarning: "最终目标防空部署将在出击时确认。",
       debriefMission: "复盘任务",
       missionCompleted: "任务已完成",
       networkCompleted: "任务网络完成",
@@ -213,16 +205,14 @@ export const localeCatalogs = {
       missionIntel: "任务情报",
       knownRadarIntel: "已知雷达情报",
       unlocatedSignals: "未定位信号",
-      adaptationStatus: "敌方适应状态",
       radarScanRate: "雷达扫描速率",
-      counterDeployment: "反制部署",
       finalDefenseBriefing: "最终防御简报",
       enemySystemState: "敌方系统状态",
       internal: "内部",
       structuredEvents: "结构化事件",
       waitingEvents: "等待操作事件…",
       airDefenseCommander: "防空指挥官",
-      alert: "警戒",
+      awareness: "态势",
       radarOperatorAi: "雷达操作员决策",
       utility: "效用值",
       totalIntelOn: "全域情报开启",
@@ -265,7 +255,7 @@ export const localeCatalogs = {
       radarIntelError: "雷达情报 / 误差区",
     },
     enemy: {
-      enemyAlert: "敌方警戒",
+      awareness: "态势警戒",
       activeContact: "有效接触点",
       beliefPeak: "推测概率峰值",
       commander: "指挥官",
@@ -314,7 +304,6 @@ export const localeCatalogs = {
         LOCKED: "火控锁定",
         MISSILE_INBOUND: "导弹来袭",
       },
-      adaptationStatus: { LOW: "低", ACTIVE: "活跃", HIGH: "高" },
       eventType: {
         WAYPOINT_ADDED: "新增航点",
         WAYPOINT_MOVED: "调整航点",
@@ -375,12 +364,10 @@ export const localeCatalogs = {
     campaign: {
       kicker: "MISSION NETWORK CONTROL",
       title: "MISSION NETWORK",
-      enemyAlert: "ENEMY ALERT",
       intelAccess: "INTEL ACCESS",
       radarCoverage: "RADAR COVERAGE",
       radarScan: "RADAR SCAN",
       commandLink: "CMD LINK",
-      enemyAdaptation: "ENEMY ADAPTATION",
       graphLabel: "Mission node connections",
       previewKicker: "MISSION PREVIEW",
       missionCode: "MISSION CODE",
@@ -389,13 +376,7 @@ export const localeCatalogs = {
       limitedIntelligence: "LIMITED INTELLIGENCE",
       radarIdentificationVerified: "RADAR IDENTIFICATION VERIFIED",
       totalIntelligenceAccess: "TOTAL INTELLIGENCE ACCESS",
-      finalStrikeWarning: "Final-target air defenses continue to reorganize. Deployment will be confirmed at launch.",
-      historicalAnalysis: "ENEMY HISTORICAL ANALYSIS",
-      terrainUse: "TERRAIN USE",
-      southern: "SOUTHERN",
-      northern: "NORTHERN",
-      routePreference: "ROUTE PREFERENCE",
-      directRouting: "DIRECT ROUTING",
+      finalStrikeWarning: "Final-target air defenses will be confirmed at launch.",
       debriefMission: "DEBRIEF MISSION",
       missionCompleted: "MISSION COMPLETED",
       networkCompleted: "MISSION NETWORK COMPLETED",
@@ -539,16 +520,14 @@ export const localeCatalogs = {
       missionIntel: "MISSION INTEL",
       knownRadarIntel: "KNOWN RADAR INTEL",
       unlocatedSignals: "UNLOCATED SIGNALS",
-      adaptationStatus: "ENEMY ADAPTATION",
       radarScanRate: "RADAR SCAN RATE",
-      counterDeployment: "COUNTER DEPLOYMENT",
       finalDefenseBriefing: "FINAL DEFENSE BRIEFING",
       enemySystemState: "ENEMY SYSTEM STATE",
       internal: "INTERNAL",
       structuredEvents: "STRUCTURED EVENTS",
       waitingEvents: "AWAITING OPERATION EVENTS…",
       airDefenseCommander: "AIR DEFENSE COMMANDER",
-      alert: "ALERT",
+      awareness: "AWARENESS",
       radarOperatorAi: "RADAR OPERATOR AI",
       utility: "UTILITY",
       totalIntelOn: "TOTAL INTEL ON",
@@ -591,7 +570,7 @@ export const localeCatalogs = {
       radarIntelError: "RADAR INTEL / ERROR ZONE",
     },
     enemy: {
-      enemyAlert: "ENEMY ALERT",
+      awareness: "AWARENESS",
       activeContact: "ACTIVE CONTACTS",
       beliefPeak: "BELIEF PEAK",
       commander: "COMMANDER",
@@ -640,7 +619,6 @@ export const localeCatalogs = {
         LOCKED: "FIRE-CONTROL LOCK",
         MISSILE_INBOUND: "MISSILE INBOUND",
       },
-      adaptationStatus: { LOW: "LOW", ACTIVE: "ACTIVE", HIGH: "HIGH" },
       eventType: {
         WAYPOINT_ADDED: "WAYPOINT ADDED",
         WAYPOINT_MOVED: "WAYPOINT MOVED",
@@ -727,39 +705,20 @@ export function useI18n(): I18nContextValue {
   return useContext(I18nContext);
 }
 
-/** 兼容既有复盘存档中的中文部署记录，并将所有当前可生成记录映射为英文。 */
+/** 兼容既有复盘存档中的指挥打击旧称，并将当前最终防御简报映射为英文。 */
 export function localizeBriefingNote(note: string, language: Language): string {
   if (language === "zh") {
     const chineseCompatibilityNotes: Record<string, string> = {
-      "低 Enemy Alert：未触发警戒增援": "敌方警戒较低：未触发警戒增援",
       "Command Strike 战果削弱最终指挥链": "指挥打击战果削弱最终指挥链",
     };
-    if (chineseCompatibilityNotes[note]) return chineseCompatibilityNotes[note];
-    const alertMatch = note.match(/^Enemy Alert (\d+)：增援警戒雷达部署$/);
-    return alertMatch ? `敌方警戒 ${alertMatch[1]}：增援警戒雷达部署` : note;
+    return chineseCompatibilityNotes[note] ?? note;
   }
   const exactNotes: Record<string, string> = {
     "最终目标启用分层防空戒备": "Layered air-defense readiness activated for the final objective",
     "目标区后备火控雷达上线": "Reserve fire-control radar activated in the target area",
-    "低 Enemy Alert：未触发警戒增援": "Low ENEMY ALERT: no surveillance reinforcement deployed",
-    "敌方警戒较低：未触发警戒增援": "Low ENEMY ALERT: no surveillance reinforcement deployed",
-    "历史航迹未形成高可信反制画像": "Historical flight paths have not formed a high-confidence countermeasure profile",
     "Command Strike 战果削弱最终指挥链": "COMMAND STRIKE effects have degraded the final command chain",
     "指挥打击战果削弱最终指挥链": "COMMAND STRIKE effects have degraded the final command chain",
     "情报战果已核实最终目标雷达坐标与型号": "INTEL results have verified final-objective radar coordinates and types",
-    "山地出口增设搜索覆盖": "Additional search coverage positioned at the mountain exit",
-    "南部航路搜索加强": "Search coverage reinforced along the southern route",
-    "北部航路搜索加强": "Search coverage reinforced along the northern route",
-    "直达目标轴线增加拦截覆盖": "Interception coverage added along the direct target axis",
   };
-  if (exactNotes[note]) return exactNotes[note];
-
-  const alertMatch = note.match(/^(?:Enemy Alert|敌方警戒) (\d+)：增援警戒雷达部署$/);
-  if (alertMatch) return `ENEMY ALERT ${alertMatch[1]}: reinforcement surveillance radar deployed`;
-  const routeMatch = note.match(/^(南部|北部)历史航路部署自适应截击雷达$/);
-  if (routeMatch) {
-    const direction = routeMatch[1] === "南部" ? "southern" : "northern";
-    return `Adaptive interceptor radar deployed along the historical ${direction} route`;
-  }
-  return note;
+  return exactNotes[note] ?? note;
 }
diff --git a/src/ui/App.tsx b/src/ui/App.tsx
index c8d1ed0..fd0a0ca 100644
--- a/src/ui/App.tsx
+++ b/src/ui/App.tsx
@@ -3,7 +3,6 @@ import { useGameController } from "../game/useGameController";
 import { CampaignMap } from "./CampaignMap";
 import { useGameAudio } from "../audio/useGameAudio";
 import f117SideSilhouette from "../assets/f117-side-silhouette.png";
-import { getAdaptationAssessment } from "../domain/enemyAdaptation";
 import { getIntelAccessTier } from "../domain/intelAccess";
 import type { MissionDebrief } from "../domain/types";
 import type { MapElementSelection } from "./mapSelection";
@@ -160,7 +159,6 @@ export function App() {
             showBelief={showBelief}
             canUseAiDebug={canUseAiDebug}
             onToggleBelief={() => setShowBelief((value) => !value)}
-            adaptationStatus={getAdaptationAssessment(state.enemyState.tacticalProfile).status}
             mapSelection={mapSelection}
             onMapSelectionChange={setMapSelection}
             onOpenCampaign={() => setCampaignView(true)}
diff --git a/src/ui/CampaignMap.copy.test.tsx b/src/ui/CampaignMap.copy.test.tsx
index 197a1f0..1514fb9 100644
--- a/src/ui/CampaignMap.copy.test.tsx
+++ b/src/ui/CampaignMap.copy.test.tsx
@@ -7,15 +7,16 @@ import { I18nProvider } from "../i18n/I18n";
 afterEach(cleanup);
 
 describe("任务网络入口文案", () => {
-  it("顶部只显示有效战略状态", () => {
+  it("顶部只显示四类直接任务收益状态", () => {
     const state = createRun("CAMPAIGN-STATUS-COPY");
     render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
     expect(screen.queryByText("INTEL QUALITY")).not.toBeInTheDocument();
     expect(screen.queryByText("情报可信度")).not.toBeInTheDocument();
     expect(screen.getByText("雷达覆盖")).toBeInTheDocument();
     expect(screen.getByText("雷达扫描")).toBeInTheDocument();
-    expect(screen.getByText("敌方适应")).toBeInTheDocument();
-    expect(screen.getByText("低")).toBeInTheDocument();
+    expect(screen.getByText("指挥链路")).toBeInTheDocument();
+    expect(screen.queryByText("敌方警戒")).not.toBeInTheDocument();
+    expect(screen.queryByText("敌方适应")).not.toBeInTheDocument();
   });
 
   it("可执行节点使用规划任务", () => {
diff --git a/src/ui/CampaignMap.tsx b/src/ui/CampaignMap.tsx
index 649f3aa..1ff5201 100644
--- a/src/ui/CampaignMap.tsx
+++ b/src/ui/CampaignMap.tsx
@@ -1,7 +1,6 @@
 import { useMemo, useState } from "react";
 import type { MissionDebrief, MissionSession, RunState } from "../domain/types";
 import type { GameAction } from "../game/gameReducer";
-import { getAdaptationAssessment } from "../domain/enemyAdaptation";
 import { getIntelAccessTier } from "../domain/intelAccess";
 import { prepareCampaignMission } from "../game/gameReducer";
 import { useI18n } from "../i18n/I18n";
@@ -25,7 +24,6 @@ export function CampaignMap({ state, dispatch, onLaunch, onPreview, onDebrief }:
     () => state.campaign.nodes.find((node) => node.id === selectedId) ?? firstAvailable,
     [firstAvailable, selectedId, state.campaign.nodes],
   );
-  const adaptation = getAdaptationAssessment(state.enemyState.tacticalProfile);
   const intelAccessTier = getIntelAccessTier(state.campaign);
   const intelNodes = state.campaign.nodes
     .filter((node) => node.type === "INTEL")
@@ -67,12 +65,10 @@ export function CampaignMap({ state, dispatch, onLaunch, onPreview, onDebrief }:
       <div className="campaign-header">
         <div><span className="section-kicker">{copy.campaign.kicker}</span><h2>{copy.campaign.title}</h2></div>
         <div className="campaign-resources">
-          <span>{copy.campaign.enemyAlert} <strong>{state.resources.enemyAlert}</strong></span>
           <span>{copy.campaign.intelAccess} <strong>{intelAccessTier}/2</strong></span>
           <span>{copy.campaign.radarCoverage} <strong>{(state.enemyState.radarCoverageModifier * 100).toFixed(0)}%</strong></span>
           <span>{copy.campaign.radarScan} <strong>{(state.enemyState.radarScanRateModifier * 100).toFixed(0)}%</strong></span>
           <span>{copy.campaign.commandLink} <strong>{(state.enemyState.commanderCoordinationModifier * 100).toFixed(0)}%</strong></span>
-          <span>{copy.campaign.enemyAdaptation} <strong>{copy.enums.adaptationStatus[adaptation.status]}</strong></span>
         </div>
       </div>
       <div className="campaign-content">
@@ -113,12 +109,6 @@ export function CampaignMap({ state, dispatch, onLaunch, onPreview, onDebrief }:
             <p>{selectedEffect}{copy.common.sentencePeriod}</p>
             <p>{intelAccessTier === 0 ? copy.campaign.limitedIntelligence : intelAccessTier === 1 ? copy.campaign.radarIdentificationVerified : copy.campaign.totalIntelligenceAccess}</p>
             {selected.type === "FINAL_STRIKE" && <p>{copy.campaign.finalStrikeWarning}</p>}
-            {state.enemyState.tacticalProfile.missionSamples > 0 && <div className="campaign-build">
-              <span className="section-kicker">{copy.campaign.historicalAnalysis}</span>
-              <div>{copy.campaign.terrainUse} {(state.enemyState.tacticalProfile.terrainMaskingPreference * 100).toFixed(0)}%</div>
-              <div>{state.enemyState.tacticalProfile.southernRouteBias > 0.5 ? copy.campaign.southern : copy.campaign.northern} {copy.campaign.routePreference} {(Math.abs(state.enemyState.tacticalProfile.southernRouteBias - 0.5) * 200).toFixed(0)}%</div>
-              <div>{copy.campaign.directRouting} {(state.enemyState.tacticalProfile.aggressiveRouting * 100).toFixed(0)}%</div>
-            </div>}
             <button
               className="primary-button"
               data-tutorial="mission-entry"
diff --git a/src/ui/EnemySystemPanels.tsx b/src/ui/EnemySystemPanels.tsx
index 7eeb419..1bcf147 100644
--- a/src/ui/EnemySystemPanels.tsx
+++ b/src/ui/EnemySystemPanels.tsx
@@ -11,7 +11,7 @@ export function EnemyStateSummary({ mission, density }: EnemyStateSummaryProps)
   const { copy } = useI18n();
   const beliefPeak = getBeliefPeak(mission.beliefMap, mission.elapsedMs);
   if (density === "compact") return <dl className="telemetry-grid debug-telemetry-grid">
-    <div><dt>{copy.enemy.enemyAlert}</dt><dd>{mission.awareness.value.toFixed(1)}%</dd></div>
+    <div><dt>{copy.enemy.awareness}</dt><dd>{mission.awareness.value.toFixed(1)}%</dd></div>
     <div><dt>{copy.enemy.activeContact}</dt><dd>{mission.radarContacts.length}</dd></div>
     <div><dt>{copy.enemy.beliefPeak}</dt><dd>{(beliefPeak.probability * 100).toFixed(1)}%</dd></div>
     <div><dt>{copy.enemy.commander}</dt><dd>{copy.enums.commanderIntent[mission.commander.intent]}</dd></div>
@@ -22,7 +22,7 @@ export function EnemyStateSummary({ mission, density }: EnemyStateSummaryProps)
     <div><dt>{copy.enemy.activeContact}</dt><dd>{mission.radarContacts.length}</dd></div>
     <div><dt>{copy.enemy.beliefPeak}</dt><dd>{(beliefPeak.probability * 100).toFixed(1)}% / {beliefPeak.isValid ? copy.common.valid : copy.common.lost}</dd></div>
     <div><dt>{copy.enemy.estimatedPosition}</dt><dd>{beliefPeak.position ? `${beliefPeak.position.x.toFixed(0)}, ${beliefPeak.position.y.toFixed(0)}` : copy.common.unknown}</dd></div>
-    <div><dt>{copy.enemy.enemyAlert}</dt><dd>{mission.awareness.value.toFixed(1)} / {copy.enums.awarenessStage[mission.awareness.stage]}</dd></div>
+    <div><dt>{copy.enemy.awareness}</dt><dd>{mission.awareness.value.toFixed(1)} / {copy.enums.awarenessStage[mission.awareness.stage]}</dd></div>
   </dl>;
 }
 
diff --git a/src/ui/styles.css b/src/ui/styles.css
index 927c58c..4e61645 100644
--- a/src/ui/styles.css
+++ b/src/ui/styles.css
@@ -287,9 +287,6 @@ button:disabled { opacity: 0.32; cursor: not-allowed; }
 .campaign-preview dd { margin: 0; color: #c5d8d2; text-align: right; }
 .campaign-preview p { min-height: 0; margin: 14px 0 0; color: #72978b; font-size: 10px; line-height: 1.7; }
 .campaign-preview > .primary-button { width: 100%; margin-top: 18px; }
-.campaign-build { margin-top: 20px; padding-top: 14px; border-top: 1px solid #1f4036; }
-.campaign-build div { margin-top: 7px; color: #9dbbb2; font-size: 9px; }
-
 @media (max-height: 760px) {
   .topbar { flex-basis: 62px; height: 62px; }
   .panel-section { padding: 14px 18px; }
diff --git a/src/ui/workspaces/IntelligenceWorkspace.tsx b/src/ui/workspaces/IntelligenceWorkspace.tsx
index 5000164..0779dc3 100644
--- a/src/ui/workspaces/IntelligenceWorkspace.tsx
+++ b/src/ui/workspaces/IntelligenceWorkspace.tsx
@@ -1,6 +1,5 @@
 import type { MissionSession } from "../../domain/types";
 import type { MapElementSelection } from "../mapSelection";
-import { DeploymentBriefingPanel } from "../DeploymentBriefingPanel";
 import { MapElementPanel } from "../MapElementPanel";
 import { TacticalMapStage } from "../TacticalMapStage";
 import { TacticalWorkspace } from "../TacticalWorkspace";
@@ -41,7 +40,6 @@ export function IntelligenceWorkspace({ mission, showBelief, mapSelection, onMap
     />}
     rightPanel={<aside className="telemetry-panel">
       <MapElementPanel mission={mission} showBelief={showBelief} selection={mapSelection} onSelectionChange={onMapSelectionChange} defaultExpandedGroups />
-      <DeploymentBriefingPanel title={copy.mission.counterDeployment} notes={mission.adaptationNotes} defaultExpanded />
     </aside>}
   />;
 }
diff --git a/src/ui/workspaces/MissionWorkspace.tsx b/src/ui/workspaces/MissionWorkspace.tsx
index 6ec663a..cc2641a 100644
--- a/src/ui/workspaces/MissionWorkspace.tsx
+++ b/src/ui/workspaces/MissionWorkspace.tsx
@@ -19,7 +19,6 @@ interface MissionWorkspaceProps {
   showBelief: boolean;
   canUseAiDebug: boolean;
   onToggleBelief: () => void;
-  adaptationStatus: "LOW" | "ACTIVE" | "HIGH";
   mapSelection: MapElementSelection | null;
   onMapSelectionChange: (selection: MapElementSelection | null) => void;
   onOpenCampaign: () => void;
@@ -29,7 +28,7 @@ interface MissionWorkspaceProps {
 
 export function MissionWorkspace(props: MissionWorkspaceProps) {
   const { copy } = useI18n();
-  const { mission, selectedIndex, onSelect, dispatch, showBelief, canUseAiDebug, onToggleBelief, adaptationStatus, mapSelection, onMapSelectionChange } = props;
+  const { mission, selectedIndex, onSelect, dispatch, showBelief, canUseAiDebug, onToggleBelief, mapSelection, onMapSelectionChange } = props;
   const activeWaypoint = mission.route.waypoints[mission.route.activeWaypointIndex];
   const recentEvents = mission.events.slice(-5).reverse();
   const visibleRadarIntel = mission.radarIntel.filter((report) => report.level !== "UNKNOWN");
@@ -67,18 +66,17 @@ export function MissionWorkspace(props: MissionWorkspaceProps) {
       </dl></CollapsibleSection>
       <CollapsibleSection title={copy.mission.missionIntel} defaultExpanded={false}><dl className="telemetry-grid">
         <div><dt>{copy.mission.knownRadarIntel}</dt><dd>{formatCount(visibleRadarIntel.length, copy.common.countUnit)}</dd></div>
-        <div><dt>{copy.mission.unlocatedSignals}</dt><dd>{formatCount(mission.radarIntel.length - visibleRadarIntel.length, copy.common.countUnit)}</dd></div><div><dt>{copy.mission.adaptationStatus}</dt><dd>{copy.enums.adaptationStatus[adaptationStatus]}</dd></div>
+        <div><dt>{copy.mission.unlocatedSignals}</dt><dd>{formatCount(mission.radarIntel.length - visibleRadarIntel.length, copy.common.countUnit)}</dd></div>
         <div><dt>{copy.mission.radarScanRate}</dt><dd>{(mission.radarScanRateModifier * 100).toFixed(0)}%</dd></div>
       </dl></CollapsibleSection>
       <MapElementPanel mission={mission} showBelief={showBelief} selection={mapSelection} onSelectionChange={onMapSelectionChange} />
-      <DeploymentBriefingPanel title={copy.mission.counterDeployment} notes={mission.adaptationNotes} />
       <DeploymentBriefingPanel title={copy.mission.finalDefenseBriefing} notes={mission.finalStrikeNotes} meta={mission.radars.length} />
       {showBelief && <CollapsibleSection className="debug-group" title={copy.mission.enemySystemState} meta={copy.mission.internal} defaultExpanded={false}>
         <CollapsibleSection className="event-section" title={copy.mission.structuredEvents} meta={mission.events.length}><ol className="event-list">
           {recentEvents.length === 0 && <li className="empty-event">{copy.mission.waitingEvents}</li>}
           {recentEvents.map((event) => <li key={event.id}><time>{(event.timestamp / 1000).toFixed(1).padStart(5, "0")}</time><span>{copy.enums.eventType[event.type]}</span></li>)}
         </ol></CollapsibleSection>
-        <CollapsibleSection className="commander-section" title={copy.mission.airDefenseCommander} meta={`${copy.mission.alert} ${mission.awareness.value.toFixed(0)}%`}>
+        <CollapsibleSection className="commander-section" title={copy.mission.airDefenseCommander} meta={`${copy.mission.awareness} ${mission.awareness.value.toFixed(0)}%`}>
           <EnemyStateSummary mission={mission} density="detailed" />
           <div className="commander-intent">{copy.enums.commanderIntent[mission.commander.intent]}</div>
           <div className="score-grid commander-scores"><span>{copy.enemy.commanderUtilityShort.monitor} {mission.commander.utilityScores.MONITOR.toFixed(0)}</span><span>{copy.enemy.commanderUtilityShort.coordinate} {mission.commander.utilityScores.COORDINATED_SEARCH.toFixed(0)}</span><span>{copy.enemy.commanderUtilityShort.focus} {mission.commander.utilityScores.CONCENTRATE_SEARCH.toFixed(0)}</span></div>
diff --git a/.agentdocs/proposals/20260903234232-explore-escalating-campaign-rewards.md b/.agentdocs/proposals/20260903234232-explore-escalating-campaign-rewards.md
new file mode 100644
--- /dev/null
+++ b/.agentdocs/proposals/20260903234232-explore-escalating-campaign-rewards.md
@@ -0,0 +1,76 @@
+# 探索方案：带敌方升级反馈的任务奖励系统
+
+> 状态：历史探索方案。该体系曾作为当前实现运行，现因任务奖励精简而退出正式规则；本文仅用于复盘、比较或未来重新设计，不代表当前游戏行为。
+
+## 探索目标
+- 让每次任务选择同时产生玩家侧长期收益和敌方侧长期反应，形成贯穿整个 Run 的双向升级。
+- 让 Final Strike（最终打击）的防空体系由任务成果、失败代价和实际飞行历史共同塑造。
+- 保持敌方不作弊：适应系统只分析已经飞过的真实轨迹，不读取未来计划航点。
+
+## 任务网络与直接收益
+- 任务网络固定为三个顺序二选一阶段与 Final Strike。
+- 只有摧毁目标并成功撤离才完成节点、关闭同层选择并解锁下一层；失败节点可重试，同层备选仍可改选。
+- `INTEL`（情报行动）：第一次完成后，后续任务补齐全部雷达并精确核实坐标与型号；第二次完成后授权 `TOTAL INTEL`（全域情报），显示真实雷达覆盖、Contact、Belief Map 和敌方 AI 内部态势。
+- `STRIKE`（打击）：每次成功使所有后续雷达扫描速率乘以 `0.90`，同时影响地图波束运动和 Radar Sensor 实际扫描周期；最低为 `0.65`。
+- `SEAD`（防空压制）：每次成功使后续雷达覆盖乘以 `0.90`；最低为 `0.55`，但不阻止最终目标区后备火控雷达上线。
+- `COMMAND STRIKE`（指挥打击）：每次成功使后续 Commander 协调能力乘以 `0.65`；最低为 `0.45`，同时削弱协同搜索、Contact 共享和联合跟踪。
+- `FINAL STRIKE`：对最终目标实施纵深精确打击，成功后结束本次 Run。
+
+## Enemy Alert：跨任务敌方警戒
+- 初始值为 `0`，范围为 `0–100`，不会自然下降。
+- 任意任务成功后增加 `2`，失败后增加 `10`。
+- 准备后续任务或失败重试时，基础雷达范围乘以 `1 + Enemy Alert / 250`；该倍率与 SEAD 覆盖修正相乘。
+- Enemy Alert ≥ `15` 时，Final Strike 增加一部 `ALERT-GUARD` Early Warning（远程预警）雷达。
+- `ALERT-GUARD` 的范围还会乘以 `1 + min(0.18, Enemy Alert / 500)`。
+- Enemy Alert 不等于单任务 Awareness（态势警戒）或 THREAT WARNING（威胁告警）：前者跨任务改变部署，后两者只描述当前任务状态。
+
+## Enemy Adaptation：历史航迹适应
+- 任务执行时按至少 `20 u` 的位移间隔记录真实已飞轨迹 `flightPath`。
+- 成功任务以 `1.0` 权重写入画像，失败任务以 `0.5` 权重写入画像；少于两个有效轨迹点时不更新。
+- 画像记录三类特征：地形利用率、南北航路偏好、直达目标倾向。
+- 显著特征阈值：地形利用率 ≥ `0.35`；南北偏差 `|southernRouteBias - 0.5| ≥ 0.08`；直达倾向 ≥ `0.72`。
+- 0/1/2/3 个显著特征对应部署强度 `0% / 22% / 32% / 42%`，界面状态对应 `LOW / ACTIVE / HIGH / HIGH`。
+- 后续普通任务可根据画像移动雷达到山地出口、偏好航路或直达轴线；唯一承担目标防御的 Fire Control（火控）雷达不得移动。
+- 累计观察权重至少为 `2` 且形成至少两项显著特征时，Final Strike 增加一部沿历史南北航路部署的 `ADAPT-GUARD` Acquisition（搜索截获）雷达。
+
+## Final Strike 组装顺序
+1. 生成 Seed 决定的基础地形、天气、目标和雷达网络。
+2. 应用 SEAD 的 Radar Coverage（雷达覆盖）修正。
+3. 应用 Enemy Alert 的雷达范围增幅。
+4. 应用 Enemy Adaptation 的普通任务反制移位。
+5. Final Strike 固定增加目标区 `FINAL-GUARD` Fire Control 雷达。
+6. 根据 Enemy Alert 决定是否增加 `ALERT-GUARD`。
+7. 根据历史画像决定是否增加 `ADAPT-GUARD`。
+8. 执行撤离区净空和目标区最低 Fire Control 覆盖约束。
+9. 针对最终雷达部署重新生成玩家侧有限情报。
+10. 将 STRIKE 扫描速率和 COMMAND STRIKE 协调修正写入任务会话。
+
+## 原实现边界
+- `RunState.resources.enemyAlert` 保存跨任务警戒。
+- `PersistentEnemyState.tacticalProfile` 保存玩家历史画像。
+- `MissionSession.flightPath` 保存当前任务的实际飞行轨迹。
+- `MissionSession.adaptationNotes` 保存反制部署说明。
+- `src/domain/enemyAdaptation.ts` 负责画像分析、特征评估和普通任务雷达移位。
+- `src/domain/finalStrike.ts` 负责 `FINAL-GUARD`、`ALERT-GUARD` 与 `ADAPT-GUARD`。
+- `src/game/gameReducer.ts` 在任务准备和结算阶段串联警戒、画像及四类直接收益。
+
+## 观察到的问题
+- 玩家完成任务同时获得直接收益并必然推高 Enemy Alert，奖励与惩罚被绑在同一个结算点，增加理解成本。
+- Enemy Alert、Radar Coverage、Radar Scan、Command Link 和 Enemy Adaptation 同时出现在任务网络顶部，战略状态过多。
+- 失败已经需要重试，又会显著扩大后续雷达范围并留下半权重画像，可能形成滚雪球惩罚。
+- Enemy Adaptation 的反制移位会改变 Seed 基础部署，削弱玩家对任务奖励因果关系的直接判断。
+- Final Strike 同时混合固定守卫、Alert 增援和画像增援，难以区分挑战来自任务选择还是自动升级。
+
+## 未来重新探索的前置问题
+- 是否能用单一、可预测的压力资源取代 Enemy Alert 与画像系统，而不与任务直接收益重复？
+- 敌方变化是否应该来自玩家主动选择的高风险节点，而不是所有成功和失败的自动结算？
+- 若重新引入历史学习，应优先提供玩家可观察、可反制的信号，而不是只改变下一张地图的雷达位置。
+- Final Strike 的变化是否应完全由已完成任务类型决定，从而保持清晰的因果链？
+
+## 恢复参考
+- 历史实现记录：`workflow/20260826223103-balance-campaign-mission-effects.md`。
+- STRIKE 扫描收益记录：`workflow/20260826225554-strike-scan-rate-and-system-docs.md`。
+- Enemy Adaptation 初始实现：`workflow/20260818194100-phase-11-enemy-adaptation.md`。
+- Final Strike 初始实现：`workflow/20260818195200-phase-12-final-strike.md`。
+- 如需恢复，不应直接复制旧代码；应先根据当前状态模型、存档兼容和 UI 信息密度重新评审边界。
+
`````

## 测试用例

### TC-001 新 Run 不再包含跨任务警戒与画像
- 类型：领域模型测试
- 优先级：高
- 操作步骤：
  1. 创建新的 Run。
  2. 检查 `RunState` 与 `MissionSession`。
- 预期结果：
  - 不存在 `resources.enemyAlert`。
  - 不存在 `enemyState.tacticalProfile`。
  - 不存在 `flightPath` 与 `adaptationNotes`。
- 是否通过：通过。

### TC-002 成功与失败不再强化后续防空
- 类型：Reducer 集成测试
- 优先级：高
- 操作步骤：
  1. 分别结算成功与失败任务。
  2. 准备后续普通任务。
  3. 检查雷达覆盖和部署。
- 预期结果：
  - 失败只改变节点状态。
  - 雷达不会因任务次数或失败次数获得额外覆盖倍率。
  - 后续部署不包含历史航迹反制。
- 是否通过：通过。

### TC-003 Final Strike 只保留固定防御与直接收益
- 类型：领域与 Reducer 集成测试
- 优先级：高
- 操作步骤：
  1. 使用包含四类已完成任务的上下文准备 Final Strike。
  2. 检查雷达 ID、修正值和简报。
- 预期结果：
  - 存在 `FINAL-GUARD`。
  - 不存在 `ALERT-GUARD` 与 `ADAPT-GUARD`。
  - STRIKE、SEAD、COMMAND STRIKE 与 INTEL 的直接效果继续生效。
- 是否通过：通过。

### TC-004 旧存档迁移
- 类型：持久化兼容测试
- 优先级：高
- 操作步骤：
  1. 构造包含旧警戒、画像、航迹、反制说明和旧最终战简报的存档。
  2. 调用存档恢复。
- 预期结果：
  - 旧存档可恢复。
  - 所有已废弃字段和简报被剥离。
  - 仍保留有效的扫描速率等直接任务收益。
- 是否通过：通过。

### TC-005 UI 不再展示旧系统
- 类型：组件测试与浏览器验收
- 优先级：高
- 操作步骤：
  1. 打开任务网络。
  2. 检查顶部战略状态。
  3. 进入任务规划并展开任务情报。
- 预期结果：
  - 顶部只显示情报权限、雷达覆盖、雷达扫描、指挥链路。
  - 不显示敌方警戒、敌方适应、历史分析或反制部署。
  - 浏览器控制台无错误。
- 是否通过：通过。

## 验证结果
- `npm run typecheck`：通过。
- `npm run test`：通过，32 个测试文件、146 项测试全部成功。
- `npm run build`：通过。
- 浏览器实际页面：通过；任务网络与任务情报均未检出旧系统文案或面板，控制台无错误。
