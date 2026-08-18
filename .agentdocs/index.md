# 项目文档索引

## 当前变更文档
`workflow/20260819073234-remove-redundant-systems.md` - 会话-33：统一情报质量资源，移除失活 Reward/Build、虚假 Contact、空 EventBus、接触容忍与固定武器计数；排查系统冗余或追踪简化边界时读取。
`workflow/20260819063213-strengthen-radar-network-coordination.md` - 会话-28：强化跨雷达 Contact 共享、联合火控、Commander 响应延迟与搜索方位误差；理解多雷达协同和 Command Strike 实际价值时读取。
`workflow/20260819053551-contain-ui-scroll-in-viewport.md` - 会话-17：固定根节点与应用外壳到视口，禁止全局滚动并让左右面板、Campaign 各自内部滚动；排查 UI 溢出或滚动边界时读取。
`workflow/20260819052414-fix-ai-debug-map-resize.md` - 会话-16：固定战术工作区高度并让左右面板独立滚动，修复切换 AI DEBUG 导致地图缩放变化；排查地图尺寸或三栏布局时读取。
`workflow/20260818233840-optimize-belief-heatmap-opacity.md` - 会话-14：让 Belief 热力图按绝对概率和有效状态缩放透明度；需要追踪失联残余色块变暗与隐藏逻辑时读取。
`workflow/20260818232259-optimize-cmd-belief-positioning.md` - 会话-10：优化 Belief 速度估计、边界传播、失联失效与 CMD 平滑定位；需要追踪敌方位置推测和地图边缘伪定位修复时读取。
`../docs/game-mechanics.md` - 当前版本完整游戏机制手册；需要理解玩家目标、有限情报、雷达动作、敌方认知、Commander 和 Campaign 规则时优先读取。
`workflow/20260818143124-rename-project-directory.md` - 会话-1：初始化项目认知文档，并将项目目录由 `f117-simulator` 更名为 `f117-nighthawk-route`；需要追溯项目命名与目录初始化时读取。
`workflow/20260818151940-phase-0-1-route-planning.md` - 会话-1：建立 ZERO RETURN Web 工程、Roguelike 状态边界与战术航线规划原型；需要了解当前架构、交互、测试和 Phase 边界时读取。
`workflow/20260818153427-phase-2-radar-simulation.md` - 会话-14：实现 Phase 2 雷达扫描、动态探测概率、地形遮蔽和误差 Contact；需要了解 Sensor/AI 数据边界与雷达参数时读取。
`workflow/20260818154945-phase-3-radar-operator-ai.md` - 会话-19：实现 Phase 3 Radar Operator Utility AI、四种搜索模式和评分调试；需要了解雷达行为决策与 Contact 记忆时读取。
`workflow/20260818155716-phase-4-belief-map.md` - 会话-24：实现 Phase 4 Belief Map 概率融合、扩散衰减和调试热力图；需要了解敌方位置认知模型时读取。
`workflow/20260818160825-phase-5-awareness-commander.md` - 会话-28：实现 Phase 5 Enemy Awareness、Air Defense Commander 与雷达协调；需要了解任务警戒和防空指挥决策时读取。
`workflow/20260818161626-phase-6-single-mission-loop.md` - 会话-33：实现 Phase 6 目标攻击、撤离、胜负与 Mission History；需要了解单任务完整循环与验收方式时读取。
`workflow/20260818162233-phase-7-procedural-mission.md` - 会话-37：实现 Phase 7 Seed 程序生成 Mission、天气探测与 Doctrine；需要了解任务生成规则和复现方法时读取。
`workflow/20260818163716-phase-8-campaign-map.md` - 会话-42：实现 Phase 8 Campaign Map、任务预览、节点解锁和持久 SEAD 效果；需要了解 Run 战略路线时读取。
`workflow/20260818165517-phase-9-player-build.md` - 会话-49：实现 Phase 9 Tactical Modules、三选一奖励和 Ghost/Intelligence/Deception Build；需要了解模块效果与奖励流程时读取。
`workflow/20260818170254-clear-reward-pool.md` - 会话-57：按产品方向清空当前奖励池并保留扩展框架；需要确认当前核心玩法和奖励状态时优先读取。
`workflow/20260818170712-phase-10-persistent-effects.md` - 会话-61：深化 Phase 10 跨任务情报、防空覆盖、Alert 与指挥链效果；需要理解 Campaign 如何重构后续防空体系时读取。
`workflow/20260818172730-limited-radar-intelligence.md` - 会话-68：让情报精度实际控制雷达发现率与估计误差，并拆分玩家视图和 AI DEBUG；需要理解有限情报边界与地图显示规则时读取。
`workflow/20260818174200-game-mechanics-manual.md` - 会话-76：新增完整游戏机制手册并修正 README 过时描述；需要追溯机制文档结构与入口调整时读取。
`workflow/20260818194100-phase-11-enemy-adaptation.md` - 会话-79：实现基于已执行航线历史的玩家画像与后续雷达反制部署；需要理解 Enemy Adaptation 数据边界和反制规则时读取。
`workflow/20260818195200-phase-12-final-strike.md` - 会话-84：实现基于完整 Campaign 历史动态组装的 Final Strike 防空体系；需要理解最终战增援、Doctrine 与历史结算规则时读取。
`workflow/20260818200200-slower-flight-auto-strike.md` - 会话-88：将飞行速度降至十分之一并改为进入攻击范围自动投弹；需要理解当前飞行节奏与攻击触发规则时读取。
`workflow/20260818202500-air-defense-engagement.md` - 会话-94：实现可逆的跟踪、锁定、导弹、脱锁、持久损伤与 Run 失败链路；需要理解路线风险和防空交战规则时读取。

## 关键记忆
- 项目正式目录名为 `f117-nighthawk-route`。
- 项目中文名为 `F-117：夜鹰航线`。
- 当前完成 Phase 0–12，采用 React、TypeScript、Vite 与 HTML Canvas。
- `RunState` 与 `MissionSession` 分离，Canvas 不持有领域状态。
- 只有 Radar Sensor 可读取飞机真实状态，后续 AI 只能消费带误差 Radar Contact。
- Radar Operator 基于自身 Contact 和历史状态计算 Utility 评分，不共享真实飞机信息。
- Belief Map 仅消费 Contact，以 24×24 网格保存概率分布并进行运动传播、扩散和衰减。
- Commander 只读取 Awareness、Belief 与雷达状态，通过 Utility 偏置协调各 Radar Operator。
- 单 Mission 已形成 Plan → Infiltrate → Strike → High-alert Extraction → Result 闭环。
- Mission 的地形、天气、雷达、目标、情报精度和 Commander Doctrine 均由 Seed 确定生成。
- Campaign Graph 由 Run Seed 生成，任务结果会修改节点、Intel、Enemy Alert 与后续雷达覆盖。
- 当前 Tactical Reward Pool 为空，成功任务直接返回 Campaign；奖励与 Build 代码仅作为未来扩展框架。
- 当前 Roguelike 差异集中在程序生成地图、雷达网络、天气、Doctrine 与 Campaign 防空构建，不依赖玩家奖励。
- Recon/ELINT、SEAD、Command Strike 与 Enemy Alert 会分别修改后续任务的情报精度、雷达覆盖或 Commander 协调。
- 默认战术地图只呈现带误差的玩家雷达情报；敌方真实雷达、Contact、Belief、警戒和 Utility 仅在 AI DEBUG 中呈现。
- Enemy Adaptation 仅分析已完成航点和历史 Contact，并根据地形利用、南北航路及直达倾向调整后续任务的雷达部署。
- Final Strike 会综合 SEAD、Command Strike、情报任务、Enemy Alert、适应等级与失败历史动态生成最终防空体系。
- 飞机基础速度为 `7.2 u/s`，运行中进入目标攻击半径后自动投弹，无需玩家手动操作。
- 连续 Contact 会累积跟踪并触发导弹；切断新证据可以脱锁，首次命中造成持久损伤，第二次命中结束 Run。
- 检索时先读取本索引，再按需读取具体 workflow 文档。
