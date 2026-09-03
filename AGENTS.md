# 项目整体认知

## 基本信息
- 项目名称：`F-117 Tactical Command System`（中文名：`F-117 战术指挥系统`，包名：`f117-tactical-command-system`）。
- 产品定位为解谜与动态规划导向的军事模拟游戏；玩家界面应模拟作战指挥终端，只呈现态势、情报、告警和指令，游戏机制说明、操作教程及程序生成元信息统一放入说明文档，不在任务界面中直接解释。
- 当前状态：已完成 Phase 0–12；当前产品聚焦有限情报下的动态航线规划，任务网络选择与玩家历史会持续改变后续任务及 Final Strike 的情报、雷达部署、Enemy Alert 与 Commander 协调。

## 技术选型与核心架构
- 客户端采用 React 18、TypeScript、Vite 与 HTML Canvas；测试采用 Vitest。
- 核心分层为 `core`（基础设施）、`domain`（纯领域逻辑）、`game`（状态与循环）、`ui`（交互与渲染）、`i18n`（中英文文案与渲染期本地化）、`config`（参数配置）。
- `RunState` 与 `MissionSession` 严格分离；Seed、Campaign 和 Enemy Adaptation 均保留独立扩展边界。
- Canvas 只负责绘制与坐标交互，游戏状态以 reducer 和领域模型为唯一事实来源。
- 游戏内全部玩家可见文案支持简体中文与 English 即时切换；中文界面的任务类型与系统术语必须完整中文化，仅保留 `F-117`、任务/雷达/天气/航点编号、坐标轴和计量单位等必要识别符。语言偏好独立保存，不进入 `RunState`、`MissionSession`、Seed 或复盘快照，Canvas 与 React 必须消费同一语言目录且切换不得改变模拟状态。
- 雷达架构遵循 Reality → Radar Sensor → Imperfect Contact；只有 Sensor 层可读取飞机真实状态，后续 AI 只能消费带误差 Contact。
- 雷达网络由 Early Warning（远程宽波束、低火控质量）、Acquisition（中程均衡）与 Fire Control（近程窄波束、高精度高火控质量）三类组成；类型差异统一影响覆盖、扫描周期、波束、探测率、Contact 误差与锁定贡献。
- 每场任务最终准备完成后，至少一部 Fire Control 必须完整覆盖目标攻击区并保留 `20 u` 余量；唯一承担目标防御的火控雷达不参与 Enemy Adaptation 移位。
- 每台 Radar Operator 独立保存模式、Contact 记忆和全部 Utility 评分；支持 Wide Search、Sector Search 与 Focused Track，雷达始终开机扫描。
- Belief Map 使用 24×24 概率网格，仅融合 Radar Contact；支持误差高斯注入、运动估计、扩散与衰减，完整内部状态只在 `TOTAL INTEL`、全景复盘或开发调试视图中展示。
- Air Defense Commander 只读取 Awareness、Belief Map 与雷达状态，通过可解释 Utility 评分、跨雷达 Contact 共享和 Operator 偏置协调雷达，不读取飞机真实位置或把目标位置作为定位回退；指挥链受损会延迟决策、缩短共享窗口并扩大搜索方位误差。
- Awareness 是任务内敌方总体警戒值，由 Contact 累积、失联后缓慢衰减、投弹时显著提升；它只驱动 Commander 搜索强度，不取代玩家可见的跟踪、锁定与导弹进度，也不等于跨任务的 Enemy Alert。
- 防空交战采用 Contact → 跟踪质量 → 火控锁定 → 导弹来袭链路；最强 Contact 保留本地火控能力，额外雷达证据通过指挥链形成联合跟踪，失去新证据可脱锁；导弹命中会摧毁飞机并令当前 Mission 失败，但玩家可返回当前任务网络层重试或改选。
- 飞机基础速度为 `3.6 u/s`，满油可飞行 `2000 u`（当前地图两条边之和）；燃油按真实累计飞行距离消耗，耗尽后停止并令当前任务失败。运行中进入攻击半径后自动投弹并提高 Awareness，随后玩家必须进入撤离区。
- 普通玩家视图通过 THREAT WARNING 显示可行动的模糊威胁阶段和导弹倒计时；真实 Contact、Belief 与 AI 评分只在 `TOTAL INTEL`、全景复盘或开发调试视图中显示。
- 音效使用原生 Web Audio API 合成并由领域事件驱动；锁定与导弹警报属于可清理循环音，脱锁、任务结束或组件卸载时必须停止，顶部提供静音与总音量控制。
- Mission Generator 根据 Seed 分别生成静态 Terrain、动态 Weather Cell、Radar Network 与 Target；天气的位置、范围、强度与类型由任务绝对时间确定性演化，相同 Seed 与时间必须完整复现。最终部署完成后再按固定有限情报基线生成玩家侧雷达报告。
- OPERATION CODE 是 Run 根 Seed：字符串使用 FNV-1a 映射为 32 位状态并由 Mulberry32 生成确定性随机流；节点、任务内容、雷达情报、天气预报、最终战增援和逐次雷达探测使用带命名后缀的独立子 Seed，完整复现还要求相同 Run 历史、航线操作与任务时间。
- 撤离区固定为东北侧 `(860, 50, 100×100)` 正方形；所有初始、适应性和 Final Strike 雷达部署最终统一执行撤离区净空约束：雷达中心不得进入撤离区周围 80 u，探测范围仍可覆盖撤离区。
- 玩家在规划阶段获得带位置与尺度误差的任务绝对时刻 `T+30/60/90s` 出动前天气预报；它不是滚动预报，执行到对应时刻后过期条目与轮廓隐藏。
- Weather Cell 会降低飞机有效速度：Cloud 10%、Fog 15%、Rain 20%、Storm 30%；重叠时取最强减速，不进行连乘，燃油仍按实际飞行距离消耗。
- 任务网络固定为三个顺序二选一阶段与 Final Strike；只有摧毁目标并成功撤离才完成节点、关闭同层选择并解锁下一阶段；包括飞机损失在内的所有失败都会把当前节点标记为可重试的 `FAILED`、提高 Enemy Alert，并保留同层备选供改选。
- 任务开始后不可暂停、重置或返回任务网络；飞行中只允许实时编辑当前目标航点之后的路径。成功撤离会冻结任务地图快照，整个 Run 内可从已完成节点进行任务视角与全景敌方态势双视角复盘。
- Tactical Reward 与 Player Build 已完整移除；当前核心玩法差异来自动态航线、程序生成雷达/地形/天气、敌方 Belief 与 Commander 行为。
- 持久任务效果按不同维度分工：Intel 行动只提升离散情报权限；每次 STRIKE 使所有后续雷达扫描速率乘以 90%，同时作用于扫描动画和 Sensor 周期；SEAD 只使后续 Radar Coverage 乘以 90%，不阻止最终火控增援；Command Strike 使 Commander Coordination 乘以 65%；所有成功任务使 Enemy Alert 增加 2，失败增加 10。
- Enemy Alert 是 `0–100` 的跨任务持久警戒，当前不会自然下降；后续基础雷达范围乘以 `1 + Alert / 250`，Final Strike 在 Alert ≥ 15 时追加警戒雷达。任务网络顶部 `RADAR COVERAGE` 只显示 SEAD 修正，不包含 Alert 倍率。
- Enemy Adaptation 只分析按实际位移采样的已飞轨迹，成功与失败航迹分别按 1.0 与 0.5 权重形成地形利用、南北航路和直达倾向画像；反制强度由已识别画像特征数量决定，雷达按空间距离选择部署对象，禁止读取未来计划航点。
- Final Strike 固定部署目标区后备 Fire Control，并根据 Enemy Alert 和玩家画像动态增加警戒与截击雷达；SEAD 只缩小覆盖，不阻止后备火控；只有累计观察权重至少为 2 且形成两项以上显著画像特征时才部署自适应截击雷达，随后统一重新生成有限情报。
- 未完成 INTEL 时，正常战术视图按固定基线生成有限雷达情报：每部雷达发现概率 90%、位置误差半径 `50–70 u`、范围估算误差 `±8%`，逐雷达结果由 Seed 确定；真实雷达、敌方 Contact、Belief 和 AI 决策仅在 `TOTAL INTEL` 或开发调试视图中显示。
- 情报权限由已完成 INTEL 节点派生：任务网络最多包含两个 INTEL 节点，一次完成后精确识别后续任务全部雷达位置与类型，两次后正式解锁默认开启且可关闭的 `TOTAL INTEL` 完整敌方态势；锁定节点可只读预览当前研判地图但不可执行。
- 任务网络不维护连续情报质量资源、任务基础情报精度或独立 Intel 点数；INTEL 的长期收益完全由已完成节点派生的离散权限表示。
- 任务事件最多保留最近 200 条并按事件 ID 驱动音频；结构化事件与敌方内部评分只在 `TOTAL INTEL`、全景复盘或开发调试视图中显示。
- Run、Campaign、当前 Mission 与成功任务复盘每秒自动保存到浏览器 `localStorage`；刷新时恢复完整状态，飞行中的 Mission 保持执行并强制返回战术视图。
- 右侧 `MAP ELEMENTS` 解释并定位飞机、目标、撤离区、航点、地形、动态天气和玩家已知雷达；普通视图不得借此泄露真实雷达位置。
- Mission Generator 当前没有严格的路径可达性或数学可通关证明；只保证撤离区雷达净空与目标区最低 Fire Control 覆盖等局部约束。
- `main` 分支通过 GitHub Actions 构建并部署到 GitHub Pages，Vite 使用相对资源基址兼容仓库子路径。

## 运行方式
- 安装依赖：`npm install`。
- 本地运行：`npm run dev`。
- 类型检查：`npm run typecheck`。
- 自动化测试：`npm run test`。
- 生产构建：`npm run build`。

## 文档与检索方法
- 项目检索时，先读取 `.agentdocs/index.md` 根索引。
- `README.md` 与 `README.en.md` 分别承担中英文设计哲学、系统关系、代码架构和开发入口；`docs/game-mechanics.md` 与 `docs/game-mechanics.en.md` 是中英文精确规则、数值、阈值和状态转换的唯一文档来源。README 不重复维护可变平衡数据。
- 根据根索引中记录的读取场景，按需读取 `.agentdocs/workflow/` 下的具体变更文档。
- 不直接全量检索 `.agentdocs/workflow/`。
- 每次代码变更均在 `.agentdocs/workflow/` 新建带时间前缀的 Markdown 变更文档，并在 `.agentdocs/index.md` 登记。
- 尚未实施的设计提案、临时方案和废案统一记录在 `.agentdocs/proposals/`，并在索引的“设计提案与废案”区域登记；不得混入已落地的 `workflow/` 变更历史。
- 影响项目整体或核心认知的变更，应同步更新本文件。
