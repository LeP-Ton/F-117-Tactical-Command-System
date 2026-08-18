# 项目整体认知

## 基本信息
- 项目名称：`f117-nighthawk-route`（中文名：`F-117：夜鹰航线`）。
- 当前状态：已完成 Phase 0–12；当前产品聚焦纯动态航线规划，Campaign 选择与玩家历史会持续改变后续任务及 Final Strike 的情报、雷达部署、Enemy Alert 与 Commander 协调。

## 技术选型与核心架构
- 客户端采用 React 18、TypeScript、Vite 与 HTML Canvas；测试采用 Vitest。
- 核心分层为 `core`（基础设施）、`domain`（纯领域逻辑）、`game`（状态与循环）、`ui`（交互与渲染）、`config`（参数配置）。
- `RunState` 与 `MissionSession` 严格分离；Seed、Campaign 和 Enemy Adaptation 均保留独立扩展边界。
- Canvas 只负责绘制与坐标交互，游戏状态以 reducer 和领域模型为唯一事实来源。
- 雷达架构遵循 Reality → Radar Sensor → Imperfect Contact；只有 Sensor 层可读取飞机真实状态，后续 AI 只能消费带误差 Contact。
- 每台 Radar Operator 独立保存模式、Contact 记忆和全部 Utility 评分；目前支持 Wide Search、Sector Search、Focused Track、Shutdown。
- Belief Map 使用 24×24 概率网格，仅融合 Radar Contact；支持误差高斯注入、运动估计、扩散与衰减，完整内部状态只在调试热力图中展示。
- Air Defense Commander 只读取 Awareness、Belief Map 与雷达状态，通过可解释 Utility 评分、跨雷达 Contact 共享和 Operator 偏置协调雷达，不读取飞机真实位置；指挥链受损会延迟决策、缩短共享窗口并扩大搜索方位误差。
- 防空交战采用 Contact → 跟踪质量 → 火控锁定 → 导弹来袭链路；最强 Contact 保留本地火控能力，额外雷达证据通过指挥链形成联合跟踪，失去新证据可脱锁，命中造成持久机体损伤，机体归零会令 Run DEFEAT。
- 飞机基础速度为 `7.2 u/s`；运行中进入攻击半径后自动投弹，目标摧毁会显著提升 Awareness，随后必须进入撤离区；航线结束但条件未满足判定失败。
- 普通玩家视图通过 THREAT WARNING 显示可行动的模糊威胁阶段和导弹倒计时；真实 Contact、Belief 与 AI 评分仍只在 AI DEBUG 中显示。
- Mission Generator 根据 Seed 生成 Terrain、Weather、Radar Network、Target、Intel Accuracy 与 Commander Doctrine；相同 Seed 必须完整复现。
- Campaign Generator 根据 Run Seed 生成分层 DAG（有向无环图）；节点结果解锁下一层并修改 Intel、Enemy Alert 或后续雷达覆盖。
- Tactical Reward 与 Player Build 空框架已移除；当前核心玩法不依赖奖励模块，差异性来自动态航线、程序生成雷达/地形/天气、敌方 Belief 与 Commander 行为。
- 持久战役效果包括：Recon/ELINT 提高后续 Intel Accuracy，SEAD 降低 Radar Coverage，Command Strike 降低 Commander Coordination，Enemy Alert 提高未来 Radar Coverage。
- Enemy Adaptation 只分析已完成航点，形成地形利用、南北航路和直达倾向画像，并据此调整后续雷达部署；禁止读取未来计划航点。
- Final Strike 根据已完成节点、Enemy Alert、适应等级、玩家画像和失败历史动态增加后备/警戒/截击雷达并选择 Commander Doctrine，随后统一重新生成有限情报。
- 正常战术视图只显示由 Intel Accuracy 决定的雷达估计位置、误差区与估计覆盖；真实雷达、敌方 Contact、Belief 和 AI 决策仅在 AI DEBUG 中显示。
- Recon/ELINT 的情报加成会提高后续任务的雷达发现率，并缩小位置与覆盖估计误差。
- 战役只保留一个有效情报资源“情报质量”（代码字段 `intelAccuracyBonus`）；不再维护无用途的独立 Intel 点数。

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
- 影响项目整体或核心认知的变更，应同步更新本文件。
