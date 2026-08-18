# 项目：F-117 战术航线规划 Roguelike

你是一名资深游戏开发工程师、系统设计师、Roguelike 设计师和游戏 AI 工程师。

请开发一款以 F-117 隐身攻击机为核心题材的 2D 战术航线规划 Roguelike。

项目暂定名：

# ZERO RETURN

本项目不是传统飞行模拟器，也不是固定关卡解谜游戏。

核心定位：

> 玩家在程序生成的防空战役中驾驶 F-117，通过不完整情报规划渗透路线、攻击关键目标、构筑战术能力，并利用敌方防空 AI 的认知偏差完成任务。
>
> 敌方防空系统不会作弊读取玩家位置，而是通过雷达接触、Belief Map 和历史行为推测玩家的位置与战术。
>
> 一个完整 Run 中，玩家不断改变敌方防空网络，而敌方 Commander 也会逐渐学习并反制玩家。

核心体验必须围绕：

**Plan → Discover → Replan → Deceive → Strike → Adapt**

展开。

---

# 一、产品核心原则

本项目从架构层面就是一款：

**Roguelike + Tactical Route Planning + Imperfect Information + Adaptive AI**

不是：

```text
单关游戏
+
后续增加 Roguelike 模式
```

而是：

```text
Roguelike Run
    ↓
Campaign
    ↓
Mission
    ↓
Route Planning
    ↓
Radar / Belief / Commander AI
```

即使当前迭代只实现一个 Mission，也必须从第一天保留：

```text
RunState
CampaignState
PlayerBuild
EnemyAdaptation
MissionHistory
ProceduralGeneration
```

禁止围绕：

```text
Level1
Level2
Level3
```

设计游戏结构。

---

# 二、核心设计目标

游戏最终必须回答：

> 当每一局的地图、防空网络、任务、情报、天气、玩家 Build 和 AI 行为都不同，并且敌人只能根据不完整信息寻找玩家时，能否形成持续可重玩的隐身猫鼠博弈？

玩家学习的应该是：

> 游戏系统。

而不是：

> 某一关的正确答案。

如果玩家重玩后只需要记住：

```text
A → B → C → Target
```

说明设计失败。

---

# 三、游戏三层循环

游戏存在三个互相嵌套的循环。

---

## Layer 1：Mission Loop

单次任务约：

```text
10 ~ 20 分钟
```

循环：

```text
查看有限情报
↓
规划 F-117 航线
↓
开始执行
↓
发现新的雷达 / 威胁 / 情报
↓
观察敌方搜索变化
↓
重新规划
↓
欺骗 / 绕过防空系统
↓
攻击目标
↓
敌方进入高警戒
↓
规划撤离
↓
成功脱离
```

核心：

# Plan → Discover → Replan

而不是：

```text
Plan → 自动执行到底
```

---

## Layer 2：Campaign Loop

一个 Run 由大约：

```text
6 ~ 10 个 Mission
```

组成。

玩家不断：

```text
选择任务节点
↓
执行任务
↓
获得情报 / 战术模块
↓
改变防空网络
↓
敌人适应
↓
选择下一任务
```

例如：

```text
             Recon
            /     \
      SEAD           ELINT
       |               |
     Strike        Deep Strike
        \             /
         Command Node
              |
        Final Strike
```

---

## Layer 3：Adaptive Run Loop

整个 Run 中：

```text
玩家 Build
     ↕
敌方学习
     ↕
防空体系变化
     ↕
玩家改变打法
```

最终形成：

> 玩家和 AI 共同塑造这一局的战术历史。

---

# 四、Run 基础结构

定义：

```ts
interface RunState {
  seed: string

  campaign: CampaignState

  playerBuild: PlayerBuild

  resources: RunResources

  enemyState: PersistentEnemyState

  missionHistory: MissionResult[]

  currentMission?: MissionSession

  status: RunStatus
}
```

其中至少包含：

```text
Campaign Map
Player Build
Intel
Aircraft Condition
Enemy Alert
Enemy Adaptation
Mission History
```

---

# 五、Campaign Map

每次 Run 根据 Seed 程序生成一个战役节点图。

参考：

```text
              Recon
             /     \
START → Strike      ELINT
          |          |
        SEAD      Intel
           \       /
          Deep Strike
               |
          Major Target
               |
          Final Strike
```

节点类型至少预留：

```ts
type MissionNodeType =
  | 'STRIKE'
  | 'DEEP_STRIKE'
  | 'RECON'
  | 'ELINT'
  | 'SEAD'
  | 'DECOY'
  | 'INTELLIGENCE'
  | 'MAINTENANCE'
  | 'COMMAND_STRIKE'
  | 'MAJOR_TARGET'
  | 'FINAL_STRIKE'
```

---

# 六、不同 Campaign 节点必须真正改变 Run

不要仅仅：

```text
Strike = 普通战斗
Elite = 强敌
Rest = 回血
```

必须贴合防空战。

例如：

---

## RECON

任务完成后：

```text
揭示未来 2~3 个节点部分信息
```

可能发现：

```text
Radar density
SAM density
Weather
Commander doctrine
Mission rewards
```

---

## ELINT

获得电子情报。

例如：

```text
识别一种敌方雷达
↓
未来任务显示其扫描模式
```

或者：

```text
Reveal Radar Frequencies
```

---

## SEAD

攻击雷达 / 防空节点。

成功后：

```text
某区域 Radar Coverage -30%
```

但敌方可能在后续部署：

```text
Mobile Radar
```

---

## COMMAND STRIKE

攻击防空指挥节点。

影响：

```text
Radar Belief Sharing ↓
Commander Decision Delay ↑
```

后续雷达之间的信息共享能力降低。

---

## DECOY

任务目的不是摧毁目标。

而是：

> 制造假入侵方向。

成功：

```text
Enemy Belief Bias
```

影响未来 1~2 场任务。

---

## MAINTENANCE

恢复：

```text
Aircraft Condition
```

但放弃一次战略机会。

---

# 七、任务选择必须形成战略路线

玩家应该经常遇到：

```text
我先炸雷达？
还是先获取情报？
还是直接打高价值目标？
```

例如：

```text
Radar Station
Command Center
Fighter Base
```

只能选择一个。

不同选择永久影响后续 Run。

例如：

### 摧毁 Radar Station

```text
Radar Coverage ↓
```

### 摧毁 Command Center

```text
Belief Sharing ↓
Commander Coordination ↓
```

### 摧毁 Fighter Base

```text
CAP Frequency ↓
```

因此任务奖励不是：

```text
金币 +100
```

而是：

# 改变后续游戏规则。

---

# 八、Mission 程序生成

每个 Mission 必须根据：

```text
Run Seed
Mission Seed
Campaign State
Enemy State
Player History
```

程序生成。

至少随机生成：

```text
Terrain
Radar Deployment
Radar Types
Radar Initial State
Target Position
Weather
Intel Accuracy
Threat Density
Commander Doctrine
Potential Mobile Radar
```

不能存在一个固定的：

```text
最佳路线
```

---

# 九、不完整情报

进入任务时，玩家不能看到完整防空地图。

信息必须有：

```text
confidence
```

例如：

```text
Radar A
CONFIRMED
95%

Radar B
PROBABLE
62%

SAM Site
POSSIBLE
38%

Mobile Radar
UNKNOWN
```

甚至可能出现：

```text
INTEL ERROR
```

情报：

```text
Radar 4 OFFLINE
```

实际：

```text
Radar 4 ACTIVE
```

但错误必须由游戏规则和情报可信度产生，而不是无理由随机恶心玩家。

---

# 十、Mission Map

采用 2D 战术地图。

逻辑尺寸例如：

```text
1000 × 1000
```

包含：

```text
Insertion Point
Extraction Area
Targets
Terrain
Radar Network
Unknown Contacts
Weather Areas
Waypoint Route
```

第一版不要求真实地理数据。

---

# 十一、F-117 航线规划

玩家不是以 WASD 手动驾驶为主要玩法。

主要控制：

```text
Waypoint
Heading
Altitude
Speed
Route Branch
```

玩家能够：

```text
添加 waypoint
删除 waypoint
拖动 waypoint
重新排序
暂停
重新规划后续路线
```

F-117 根据航路自动执行。

---

# 十二、路线不是简单的一条线

后续允许玩家建立条件路线。

例如：

```text
Waypoint B

IF Radar-03 ACTIVE
    → Route D

ELSE
    → Route C
```

形成：

```text
              B
            /   \
      Radar ON   OFF
          ↓       ↓
          D       C
           \     /
            TARGET
```

预留：

```ts
interface RouteCondition {
  type: RouteConditionType
  params: unknown
}
```

后续可以让高级 Build 解锁更多条件节点。

---

# 十三、隐身 / Exposure 模型

不要设计固定：

```text
stealth = 90
```

隐身必须是动态结果。

至少考虑：

```text
distance
aspect angle
terrain masking
radar type
radar mode
weather
aircraft condition
```

简化：

```ts
detectionProbability =
  baseDetection
  * distanceFactor
  * aspectFactor
  * terrainFactor
  * radarModeFactor
  * weatherFactor
```

飞机正面或尾部朝向雷达：

```text
RCS Risk 较低
```

飞机侧面对雷达：

```text
RCS Risk 较高
```

因此：

> 航向本身就是隐身策略。

---

# 十四、Radar Sensor

Radar Sensor 不是 AI。

它只负责：

> 雷达当前是否获得 Contact。

结构建议：

```ts
interface RadarContact {
  radarId: string
  timestamp: number

  estimatedPosition: Vector2

  confidence: number
  signalStrength: number
  errorRadius: number
}
```

Radar 不允许把真实位置直接交给敌 AI。

流程：

```text
Real Aircraft
↓
Radar Sensor
↓
Imperfect Radar Contact
↓
Enemy AI
```

---

# 十五、Radar Operator AI

每台雷达有自己的操作 AI。

第一版：

# Utility AI

行为：

```text
Wide Search
Sector Search
Focused Track
Shutdown
```

后续：

```text
Change Frequency
Ambush
Silent Watch
Relocate
```

AI 给行为评分：

```text
Wide Search       38
Sector Search     72
Focused Track     61
Shutdown          10
```

选择最高效用行为。

所有评分必须允许 Debug。

---

# 十六、Belief Map

Belief Map 是整个游戏 AI 的核心。

敌人不应该保存：

```ts
knownPlayerPosition
```

而应该保存：

```text
Probability Distribution
```

例如：

```text
3%   7%   12%   5%

4%  18%   42%  11%

2%  12%   26%   8%
```

表示：

> 敌人认为 F-117 可能在哪里。

实现二维概率网格。

例如：

```text
24 × 24
```

---

# 十七、Belief 更新

收到 Radar Contact 时：

根据：

```text
estimatedPosition
confidence
errorRadius
```

在附近增加概率。

高 confidence：

```text
分布集中
```

低 confidence：

```text
分布模糊
```

---

# 十八、Belief Propagation

飞机失去 Contact 后：

AI 不能立即忘记。

概率根据：

```text
Possible Speed
Heading Estimate
Elapsed Time
```

向周围扩散。

例如：

```text
      60%

       ↓

    10 15 10
    15 25 15
     5 10  5
```

同时逐渐 decay。

这允许：

> AI 合理地猜错。

---

# 十九、Enemy Awareness

Mission 内拥有：

```ts
enemyAwareness: number
```

范围：

```text
0 - 100
```

阶段：

```text
CALM
SUSPICIOUS
SEARCHING
HUNTING
```

Awareness 会影响：

```text
Radar activity
Radar scan rate
Commander aggressiveness
Future SAM readiness
Fighter CAP
```

攻击目标后：

```text
Awareness 显著上升
```

因此撤离阶段通常比进入阶段更加危险。

---

# 二十、Air Defense Commander

Commander 是整个防空系统的大脑。

第一版：

```text
Belief Map
+
Utility AI
```

Commander 可以：

```text
改变雷达扫描区域
激活额外雷达
关闭雷达伏击
分配搜索区域
改变防空单位状态
```

但看不到：

```text
真实 F-117 坐标
```

---

# 二十一、不同 Commander Doctrine

每次 Run 或区域随机不同指挥风格。

例如：

---

## Conservative

特点：

```text
较少激活全部雷达
更重视保护核心目标
较慢提高警戒
```

---

## Aggressive

```text
频繁扩大搜索
快速提高警戒
更容易调动资源
```

---

## Ambush

```text
大量雷达保持关闭
发现异常后突然启动
```

---

## Analytical

```text
高度依赖连续证据
Belief 推演能力较强
```

---

## Adaptive

后期解锁。

根据玩家历史调整策略。

---

# 二十二、Enemy Adaptation

这是 Roguelike 最关键的长期 AI 系统。

整个 Run 保存：

```ts
interface PlayerTacticalProfile {
  terrainMaskingPreference: number
  aggressiveRouting: number
  southernExtractionBias: number
  radarDeceptionUsage: number
  lowAltitudePreference: number
  missionRiskTolerance: number
}
```

注意：

这些数据必须根据：

```text
玩家历史行为
```

统计得到。

不是读取玩家未来计划。

---

# 二十三、AI 根据玩家历史反制

例如：

前两场任务：

```text
玩家频繁利用山区
```

AI 得到：

```text
Terrain Masking Preference 78%
```

下一关可能：

```text
在山谷出口部署 Mobile Radar
```

玩家经常：

```text
攻击后向南撤离
```

敌人：

```text
增加南部搜索权重
```

玩家发现以后可以故意：

```text
制造南撤假象
↓
向北撤退
```

形成：

# 玩家预测 AI 如何预测玩家。

---

# 二十四、玩家 Build

不要主要设计：

```text
Stealth +10
Speed +15
Fuel +20
```

Roguelike Build 的核心应该是：

# 获得新的信息与战术能力。

例如：

---

## Passive Receiver

显示：

```text
附近雷达方位
```

---

## ELINT Database

收到信号后：

```text
识别雷达类型
```

---

## Signal History

雷达关闭后：

```text
保留历史扫描方向
```

---

## Predictive Navigation

显示：

```text
未来 20 秒预计暴露风险
```

---

## Terrain Analysis

自动显示：

```text
Terrain Masking Zone
```

---

## Contingency Routing

解锁：

```text
IF radar active
→ alternate route
```

---

## False Contact Generator

允许制造：

```text
低置信度虚假 Radar Contact
```

但拥有：

```text
Cooldown / Limited Charges
```

---

## Threat Prediction

根据 Belief 和雷达行为预测：

```text
Enemy Search Direction
```

---

# 二十五、Build 流派

系统应允许自然形成不同玩法。

例如：

---

## GHOST BUILD

```text
Terrain Analysis
Precision Navigation
Low Observable Maintenance
```

玩法：

> 尽量完全不被发现。

---

## INTELLIGENCE BUILD

```text
ELINT Database
Signal History
Threat Prediction
```

玩法：

> 获取大量信息后寻找最佳路线。

---

## DECEPTION BUILD

```text
False Contact Generator
Radar Manipulation
Route Feint
```

玩法：

> 主动操纵 Belief Map。

---

## RISK BUILD

```text
Fast Route Planning
Emergency Replan
High-Speed Escape
```

玩法：

> 接受更多弱回波，换取快速任务完成。

Build 必须改变决策方式，而不是只有数值不同。

---

# 二十六、奖励选择

任务后可以提供：

```text
3 选 1 Tactical Module
```

但不要让系统变成传统卡牌游戏。

奖励可以是：

```text
Tactical Module
Intel
Aircraft Repair
Campaign Effect
Enemy Disruption
```

---

# 二十七、Run 资源

第一版控制在少量资源。

推荐：

---

## AIRFRAME CONDITION

```text
100%
```

代表：

```text
机体维护状态
隐身涂层
导航可靠性
```

会跨 Mission 保留。

---

## INTEL

用于：

```text
揭示节点
提高任务情报精度
预览雷达信息
```

---

## ENEMY ALERT

整个 Run 的全局警戒。

不同于 Mission Awareness。

例如：

```text
LOW
ELEVATED
HIGH
FULL ALERT
```

如果玩家频繁：

```text
高暴露完成任务
```

则后续任务：

```text
Radar density ↑
Radar readiness ↑
Intel reliability ↓
```

---

# 二十八、Mission Failure

单个任务失败不一定结束 Run。

例如：

```text
未摧毁目标
但成功撤离
```

结果：

```text
Mission Failed
Enemy Alert +10
Aircraft survives
Run continues
```

真正 Run Over：

```text
F-117 destroyed
```

或者特殊最终失败条件。

这样可以避免：

> 60 分钟 Run 因一个小错误立即全部结束。

---

# 二十九、Final Strike

每个 Run 最终进入：

# Integrated Air Defense Network

Final Mission 的结构取决于：

> 玩家之前整个 Campaign 的选择。

例如：

如果玩家之前摧毁：

```text
Command Center
```

最终：

```text
Radar Belief Sharing ↓
```

如果摧毁：

```text
Fighter Base
```

最终：

```text
CAP ↓
```

如果忽视：

```text
Radar Network
```

最终：

```text
High Radar Density
```

因此 Final Strike 必须是：

> 整个 Run 历史的结果。

而不是：

```text
Boss HP × 3
```

---

# 三十、Meta Progression

永久成长保持轻量。

不要：

```text
永久 Stealth +20%
```

主要解锁：

```text
New Tactical Modules
New Radar Types
New Commander Doctrines
New Regions
New Mission Types
New Weather
New Starting Builds
New Challenge Modifiers
```

甚至部分解锁会：

> 提高游戏复杂度和难度。

---

# 三十一、Seed

所有程序生成与关键随机必须支持：

```ts
new Run(seed)
```

相同 Seed 应尽量复现：

```text
Campaign graph
Mission generation
Radar deployment
Reward pool
Random events
```

方便：

```text
Debug
Replay
Daily Challenge
AI comparison
```

---

# 三十二、游戏 AI 禁止作弊

这是硬性规则。

Commander、Radar Operator、未来 Fighter AI 都不得直接读取：

```text
player.position
player.route
futureWaypoint
```

只有 Sensor Simulation 可以访问真实世界状态。

必须保证：

```text
Reality
↓
Sensor
↓
Imperfect Observation
↓
Belief
↓
Decision
```

AI 可以犯错。

而且：

> 合理地犯错是游戏乐趣的一部分。

---

# 三十三、Debug 模式

必须实现开发者 Debug Overlay。

建议：

```text
F1
```

开启。

显示：

```text
Run Seed
Mission Seed

Mission Awareness
Global Enemy Alert

Radar State
Radar Utility Scores
Radar Contacts

Belief Map Heatmap

Commander Intent
Commander Orders

Player Tactical Profile
Enemy Adaptation

Procedural Generation Info
```

正常玩家模式不要展示完整 AI 内部信息。

---

# 三十四、事件日志

所有重要事件结构化记录：

```ts
interface GameEvent {
  timestamp: number
  missionId: string
  type: string
  source?: string
  data: Record<string, unknown>
}
```

记录：

```text
Radar Contact
Belief Update
Radar Mode Change
Commander Order
Player Route Change
Attack
Extraction
Mission Result
Campaign Mutation
Enemy Adaptation
Build Choice
```

未来可以把这些日志用于：

```text
战后复盘
LLM 分析
Replay
AI Training
```

---

# 三十五、LLM 使用原则

当前核心游戏逻辑：

**不依赖 LLM。**

不要让 LLM：

```text
决定雷达是否发现玩家
实时模拟雷达波
直接控制单位位置
直接读取玩家位置
```

未来 LLM 可以作为：

# Strategic Commander Layer

输入：

```text
Belief Summary
Player Tactical Profile
Campaign History
Available Units
Current Doctrine
```

输出：

```ts
interface StrategicIntent {
  intent: string
  confidence: number
  targetRegion?: string
}
```

例如：

```json
{
  "intent": "ambush_likely_southern_extraction",
  "confidence": 0.74
}
```

然后传统游戏 AI 执行。

---

# 三十六、推荐代码架构

```text
src/

game/
  Game
  GameLoop
  EventBus

run/
  RunState
  RunManager
  RunResources
  MetaProgression

campaign/
  CampaignState
  CampaignGenerator
  CampaignGraph
  CampaignMutation

mission/
  MissionSession
  MissionGenerator
  MissionObjective
  MissionResult

aircraft/
  Aircraft
  Autopilot
  Route
  Waypoint
  ConditionalRoute

radar/
  Radar
  RadarSensor
  DetectionModel
  RadarOperatorAI

ai/
  BeliefMap
  BeliefPropagation
  AwarenessSystem
  AirDefenseCommander
  UtilityAI
  PlayerTacticalProfile
  EnemyAdaptation

build/
  TacticalModule
  ModuleRegistry
  PlayerBuild
  RewardGenerator

world/
  Terrain
  Weather
  Target
  Map

procedural/
  SeededRandom
  RadarNetworkGenerator
  TerrainGenerator
  ThreatGenerator

ui/
  TacticalMap
  RoutePlanner
  CampaignMap
  BuildPanel
  MissionHUD
  DebugOverlay

config/
  radar
  aircraft
  ai
  generation
  campaign
  balance
```

根据当前项目技术栈可以调整。

但必须保持：

```text
Run State
≠
Mission State
```

---

# 三十七、推荐核心数据关系

```text
Game
│
└── RunState
    │
    ├── CampaignState
    ├── PlayerBuild
    ├── RunResources
    ├── EnemyAdaptation
    ├── MissionHistory
    │
    └── MissionSession
        │
        ├── AircraftState
        ├── RouteState
        ├── RadarNetwork
        ├── BeliefMap
        ├── Awareness
        ├── CommanderState
        └── ObjectiveState
```

---

# 三十八、参数全部配置化

不要硬编码重要平衡参数。

例如：

```ts
export const beliefConfig = {
  gridSize: 24,
  diffusionRate: 0.12,
  decayRate: 0.98,
}
```

```ts
export const campaignConfig = {
  minMissionCount: 6,
  maxMissionCount: 9,
  rewardChoices: 3,
}
```

```ts
export const adaptationConfig = {
  historyWindow: 4,
  learningRate: 0.2,
}
```

方便快速调试。

---

# 三十九、开发阶段

虽然产品架构从第一天就是 Roguelike，但实现必须逐阶段推进。

---

## Phase 0：架构

首先建立：

```text
RunState
CampaignState
MissionSession
SeededRandom
Event System
```

哪怕部分字段暂时未使用。

确保未来不需要推翻单关架构。

---

## Phase 1：Route Planning

完成：

```text
2D Tactical Map
F-117
Waypoint Editing
Autopilot
Pause / Replan
```

验收：

> 玩家可以规划并修改一条航线。

---

## Phase 2：Radar Simulation

完成：

```text
Radar Sweep
Detection Probability
Aspect Factor
Terrain Masking
Radar Contact
```

验收：

> 同一航线存在概率性探测结果。

---

## Phase 3：Radar Operator AI

完成：

```text
Wide Search
Sector Search
Focused Track
Utility Scoring
```

验收：

> 雷达会根据 Contact 改变搜索方式。

---

## Phase 4：Belief Map

完成：

```text
Belief Update
Belief Diffusion
Belief Decay
```

验收：

> AI 不知道真实位置，但可以形成合理的位置推测。

---

## Phase 5：Commander

完成：

```text
Awareness
Commander Utility AI
Radar Coordination
```

验收：

> 多台雷达形成整体搜索行为。

---

## Phase 6：Single Mission Loop

完成：

```text
Target
Attack
Extraction
Mission Failure
Mission Success
```

此时验证：

# 单 Mission 的猫鼠玩法是否成立。

但绝不能把这里当成产品完成。

---

## Phase 7：Procedural Mission Generator

加入：

```text
Random Terrain
Random Radar Layout
Random Target
Random Intel Accuracy
Random Weather
Commander Doctrine
```

验收：

> 连续生成 10 个任务，不存在明显固定解法。

---

## Phase 8：Campaign Map

实现：

```text
Procedural Campaign Graph
Mission Node Selection
Mission Preview
Campaign Effects
```

此时正式形成：

> Roguelike Run。

---

## Phase 9：Player Build

实现：

```text
Tactical Modules
Reward Choices
Build State
Module Synergy
```

至少实现三种可识别玩法：

```text
Ghost
Intelligence
Deception
```

---

## Phase 10：Persistent Campaign Effects

实现：

```text
Destroy Radar
↓
Future Radar Coverage Changes

Destroy Command
↓
Belief Sharing Changes
```

确保前一任务会改变后一任务。

---

## Phase 11：Enemy Adaptation

实现：

```text
PlayerTacticalProfile
Historical Analysis
Counter Deployment
```

验收：

> 连续使用同一种战术，敌人会逐渐出现合理反制。

---

## Phase 12：Final Strike

根据：

```text
Campaign History
```

动态生成最终防空体系。

---

## Phase 13：Meta Progression

最后再加入：

```text
Unlocks
New Modules
New Radars
New Doctrines
Challenges
```

---

# 四十、首个可玩版本验收标准

首个真正称得上：

# F-117 Roguelike Prototype

的版本至少必须包含：

* [ ] RunState 与 MissionState 分离。
* [ ] 程序生成 Campaign Graph。
* [ ] 至少 3 种任务节点。
* [ ] 程序生成 Mission。
* [ ] 玩家可以规划并修改航线。
* [ ] F-117 自动执行路线。
* [ ] 雷达概率探测。
* [ ] 朝向影响隐身。
* [ ] Radar Contact 有误差。
* [ ] Radar Operator AI。
* [ ] Belief Map。
* [ ] Belief Propagation。
* [ ] Commander AI。
* [ ] AI 无法读取玩家真实位置。
* [ ] Enemy Awareness。
* [ ] 至少 6 个 Tactical Modules。
* [ ] 任务后三选一奖励。
* [ ] 至少 2 种 Build 能产生明显不同玩法。
* [ ] 前一个 Mission 可以改变未来 Mission。
* [ ] Enemy Alert 跨任务保留。
* [ ] Mission History。
* [ ] Enemy Adaptation 基础版本。
* [ ] Final Mission。
* [ ] Seed 可复现。
* [ ] Debug Overlay。

如果缺少：

```text
Campaign
Procedural Generation
Build
Persistent Effects
Enemy Adaptation
```

则只能称为：

> Tactical Mission Prototype

不能称为 Roguelike Prototype。

---

# 四十一、玩法验收标准

最终重点验证以下四个问题。

---

## Test A：有没有固定答案？

让测试者重复同类任务。

如果开始背：

```text
固定路线
固定等待时间
固定雷达规律
```

说明程序生成不足。

---

## Test B：玩家是否会 Replan？

如果玩家：

```text
任务开始规划一次
↓
之后不再修改
```

说明：

```text
未知情报
动态敌人
突发变化
```

不足。

---

## Test C：玩家是否能欺骗 AI？

理想情况：

```text
Radar 捕获弱信号
↓
Commander 搜索错误方向
↓
玩家观察到搜索变化
↓
玩家利用错误认知突破
```

如果玩家只是在：

```text
躲雷达圆圈
```

说明 Belief / Commander 系统没有发挥作用。

---

## Test D：一个 Run 有没有历史？

理想情况：

```text
Mission 1
玩家采用 Terrain Masking

Mission 2
继续 Terrain Masking

Mission 3
敌人开始反制

Mission 4
玩家改变打法

Mission 5
敌人重新适应
```

如果每个 Mission 都像完全独立的新关卡：

说明 Roguelike Campaign 层没有成立。

---

# 四十二、当前不要优先实现

在核心 Roguelike 成立之前，不要优先投入：

```text
真实 3D 驾驶舱
高精度飞行动力学
真实军事数据库
复杂导弹制导
多人模式
剧情动画
大量美术资源
开放世界
真实卫星地图
大量机型
LLM 实时控制单位
```

不要因为这些内容影响核心系统开发。

---

# 四十三、Codex 工作方式

开始实现前：

1. 完整阅读本规格。
2. 阅读当前仓库。
3. 判断已有技术栈。
4. 基于现有架构制定实施方案。
5. 明确当前处于哪个 Phase。
6. 不提前实现后续大量功能。
7. 但必须保持 Roguelike 架构兼容。

每完成一个 Phase：

```text
实现
↓
运行
↓
测试
↓
修复
↓
检查设计目标
↓
进入下一 Phase
```

如果发现当前架构会阻碍：

```text
Run
Campaign
Procedural Generation
Build
Enemy Adaptation
```

优先修正架构，而不是继续堆功能。

---

# 四十四、最终设计公式

始终使用下面公式判断一个功能是否应该存在：

```text
ZERO RETURN

Procedural Campaign
        ×
Route Planning
        ×
Imperfect Information
        ×
Adaptive Defense AI
        ×
Tactical Build
```

其中任何一个核心项缺失都会明显削弱产品：

```text
没有 Procedural Campaign
→ 线性解谜

没有 Route Planning
→ 普通策略 Roguelike

没有 Imperfect Information
→ 数学最短路径题

没有 Adaptive AI
→ 静态雷达躲避游戏

没有 Tactical Build
→ Run 之间变化不足
```

最终目标不是做：

> 一款关于 F-117 的小游戏。

而是：

> **一款每个 Run 都会生成不同防空战争，并且玩家与敌方 AI 在整个 Run 中不断互相学习、欺骗和适应的隐身战术 Roguelike。**
