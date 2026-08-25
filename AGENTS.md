# 项目整体认知

## 基本信息
- 项目名称：`F-117 Tactical Command System`（中文名：`F-117 战术指挥系统`，包名：`f117-tactical-command-system`）。
- 产品定位为解谜与动态规划导向的军事模拟游戏；玩家界面应模拟作战指挥终端，只呈现态势、情报、告警和指令，游戏机制说明、操作教程及程序生成元信息统一放入说明文档，不在任务界面中直接解释。
- 当前状态：已完成 Phase 0–12；当前产品聚焦纯动态航线规划，Campaign 选择与玩家历史会持续改变后续任务及 Final Strike 的情报、雷达部署、Enemy Alert 与 Commander 协调。

## 技术选型与核心架构
- 客户端采用 React 18、TypeScript、Vite 与 HTML Canvas；测试采用 Vitest。
- 核心分层为 `core`（基础设施）、`domain`（纯领域逻辑）、`game`（状态与循环）、`ui`（交互与渲染）、`config`（参数配置）。
- `RunState` 与 `MissionSession` 严格分离；Seed、Campaign 和 Enemy Adaptation 均保留独立扩展边界。
- Canvas 只负责绘制与坐标交互，游戏状态以 reducer 和领域模型为唯一事实来源。
- 雷达架构遵循 Reality → Radar Sensor → Imperfect Contact；只有 Sensor 层可读取飞机真实状态，后续 AI 只能消费带误差 Contact。
- 雷达网络由 Early Warning（远程宽波束、低火控质量）、Acquisition（中程均衡）与 Fire Control（近程窄波束、高精度高火控质量）三类组成；类型差异统一影响覆盖、扫描周期、波束、探测率、Contact 误差与锁定贡献。
- 每场任务最终准备完成后，至少一部 Fire Control 必须完整覆盖目标攻击区并保留 `20 u` 余量；唯一承担目标防御的火控雷达不参与 Enemy Adaptation 移位。
- 每台 Radar Operator 独立保存模式、Contact 记忆和全部 Utility 评分；支持 Wide Search、Sector Search 与 Focused Track，雷达始终开机扫描。
- Belief Map 使用 24×24 概率网格，仅融合 Radar Contact；支持误差高斯注入、运动估计、扩散与衰减，完整内部状态只在调试热力图中展示。
- Air Defense Commander 只读取 Awareness、Belief Map 与雷达状态，通过可解释 Utility 评分、跨雷达 Contact 共享和 Operator 偏置协调雷达，不读取飞机真实位置或把目标位置作为定位回退；指挥链受损会延迟决策、缩短共享窗口并扩大搜索方位误差。
- Awareness 是任务内敌方总体警戒值，由 Contact 累积、失联后缓慢衰减、投弹时显著提升；它只驱动 Commander 搜索强度，不取代玩家可见的跟踪、锁定与导弹进度。
- 防空交战采用 Contact → 跟踪质量 → 火控锁定 → 导弹来袭链路；最强 Contact 保留本地火控能力，额外雷达证据通过指挥链形成联合跟踪，失去新证据可脱锁；导弹命中会摧毁飞机并令当前 Mission 失败，但玩家可返回当前 Campaign 层重试或改选。
- 飞机基础速度为 `3.6 u/s`，满油可飞行 `2000 u`（当前地图两条边之和）；燃油按真实累计飞行距离消耗，耗尽后停止并令当前任务失败。运行中进入攻击半径后自动投弹并提高 Awareness，随后玩家必须进入撤离区。
- 普通玩家视图通过 THREAT WARNING 显示可行动的模糊威胁阶段和导弹倒计时；真实 Contact、Belief 与 AI 评分仍只在 AI DEBUG 中显示。
- 音效使用原生 Web Audio API 合成并由领域事件驱动；锁定与导弹警报属于可清理循环音，暂停、脱锁、任务结束或组件卸载时必须停止，顶部提供静音与总音量控制。
- Mission Generator 根据 Seed 分别生成静态 Terrain、动态 Weather Cell、Radar Network、Target 与 Intel Accuracy；天气的位置、范围、强度与类型由任务绝对时间确定性演化，相同 Seed 与时间必须完整复现。
- 所有初始、适应性和 Final Strike 雷达部署最终统一执行撤离区净空约束：雷达中心不得进入撤离区周围 80 u，探测范围仍可覆盖撤离区。
- 玩家在规划阶段获得带位置与尺度误差的 `T+30/60/90s` 天气预报；预报只提供有限情报，不能泄露未来真实天气状态。
- Weather Cell 会降低飞机有效速度：Cloud 10%、Fog 15%、Rain 20%、Storm 30%；重叠时取最强减速，不进行连乘，燃油仍按实际飞行距离消耗。
- Campaign 固定为三个顺序二选一阶段与 Final Strike；只有摧毁目标并成功撤离才完成节点、关闭同层选择并解锁下一阶段；包括飞机损失在内的所有失败都会把当前节点标记为可重试的 `FAILED`、提高 Enemy Alert，并保留同层备选供改选。
- Tactical Reward 与 Player Build 已完整移除；当前核心玩法差异来自动态航线、程序生成雷达/地形/天气、敌方 Belief 与 Commander 行为。
- 持久战役效果包括：Intel 行动提高后续 Intel Accuracy，SEAD 降低 Radar Coverage，Command Strike 降低 Commander Coordination，Enemy Alert 提高未来 Radar Coverage。
- Enemy Adaptation 只分析按实际位移采样的已飞轨迹，形成地形利用、南北航路和直达倾向画像；雷达按空间距离选择反制部署对象，禁止读取未来计划航点。
- Final Strike 根据已完成节点、Enemy Alert、适应等级和玩家画像动态增加后备、警戒与截击雷达，随后统一重新生成有限情报。
- 正常战术视图只显示由 Intel Accuracy 决定的雷达估计位置、误差区与估计覆盖；真实雷达、敌方 Contact、Belief 和 AI 决策仅在 AI DEBUG 中显示。
- Intel 行动的情报加成会提高后续任务的雷达发现率，并缩小位置与覆盖估计误差。
- 战役只保留一个有效情报资源“情报质量”（代码字段 `intelAccuracyBonus`）；不再维护无用途的独立 Intel 点数。
- 任务事件最多保留最近 200 条并按事件 ID 驱动音频；结构化事件与敌方内部评分只在 AI DEBUG 中显示。
- Run、Campaign 与当前 Mission 每秒自动保存到浏览器 `localStorage`；刷新时恢复完整状态，飞行中的 Mission 安全转为暂停，并恢复离开前的 Campaign/战术视图。
- 右侧 `MAP ELEMENTS` 解释并定位飞机、目标、撤离区、航点、地形、动态天气和玩家已知雷达；普通视图不得借此泄露真实雷达位置。
- `main` 分支通过 GitHub Actions 构建并部署到 GitHub Pages，Vite 使用相对资源基址兼容仓库子路径。

## 运行方式
- 安装依赖：`npm install`。
- 本地运行：`npm run dev`。
- 类型检查：`npm run typecheck`。
- 自动化测试：`npm run test`。
- 生产构建：`npm run build`。

## 文档与检索方法
- 项目检索时，先读取 `.agentdocs/index.md` 根索引。
- 根据根索引中记录的读取场景，按需读取 `.agentdocs/workflow/` 下的具体变更文档。
- 不直接全量检索 `.agentdocs/workflow/`。
- 每次代码变更均在 `.agentdocs/workflow/` 新建带时间前缀的 Markdown 变更文档，并在 `.agentdocs/index.md` 登记。
- 尚未实施的设计提案、临时方案和废案统一记录在 `.agentdocs/proposals/`，并在索引的“设计提案与废案”区域登记；不得混入已落地的 `workflow/` 变更历史。
- 影响项目整体或核心认知的变更，应同步更新本文件。
