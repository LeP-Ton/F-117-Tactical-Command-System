# 精简核心雷达认知与交战链路

## 背景与目标
- 保留具有辨识度的 Contact、Belief/CMD、Commander 与雷达搜索可视化。
- 删除没有双向玩法价值的雷达静默、难以理解的 Awareness、仅增加随机差异的 Doctrine，以及多阶段机体损伤。
- 让玩家只需理解一条链路：被雷达发现会累积跟踪，跟踪驱动敌方搜索和导弹，命中即失败。

## 约束与原则
- Campaign 节点结构和任务类型暂不调整。
- 保留 Command Link 对多雷达共享、决策延迟、搜索误差和联合火控的影响。
- Commander 不读取飞机真实位置，只读取跟踪进度、Belief 和已知目标打击位置。
- 不恢复 Tactical Reward 或 Player Build。

## 阶段与 TODO
- [x] 删除雷达静默与网络静默。
- [x] 删除全部 Commander Doctrine。
- [x] 删除 Awareness 并让 Commander 使用跟踪进度。
- [x] 实现投弹后围绕目标区集中搜索。
- [x] 将导弹命中改为立即摧毁飞机并结束 Run。
- [x] 同步 UI、测试、项目认知与机制手册。
- [x] 完成类型检查和自动化测试。

## 关键风险
- 删除 Awareness 后，Commander 必须仍能区分监视、协同搜索和集中搜索。
- Belief 失效时不得生成地图边缘伪 CMD；目标摧毁后的目标区搜索是明确的已知位置，不是飞机定位。
- 删除雷达 `active` 后 Sensor 必须持续扫描，不能保留隐式关机分支。

## 代码变更

### 雷达 Operator
```diff
- type RadarOperatorMode = "WIDE_SEARCH" | "SECTOR_SEARCH" | "FOCUSED_TRACK" | "SHUTDOWN";
+ type RadarOperatorMode = "WIDE_SEARCH" | "SECTOR_SEARCH" | "FOCUSED_TRACK";

- RadarState.active
- RadarOperatorState.lastShutdownAt
- shutdownDurationMs
- shutdownCooldownMs
- SHUTDOWN Utility、保持时间、冷却与 active 切换
+ 无 Contact 时始终保持 WIDE_SEARCH
```

### Commander 与认知输入
```diff
- type CommanderIntent = "MONITOR" | "COORDINATED_SEARCH" | "CONCENTRATE_SEARCH" | "NETWORK_SILENCE";
+ type CommanderIntent = "MONITOR" | "COORDINATED_SEARCH" | "CONCENTRATE_SEARCH";

- CommanderDoctrine
- CommanderState.doctrine
- AwarenessState / AwarenessStage
- awarenessSystem.ts 及其测试
- AWARENESS_STAGE_CHANGED
+ Commander 直接读取 Engagement.trackProgress
+ Belief 有效时使用 CMD；目标摧毁且 Belief 无效时使用目标位置作为搜索中心
```

### 任务生成与 Final Strike
```diff
- CampaignNode.preview.doctrine
- 随机 Doctrine 生成
- Final Strike 根据失败和路线画像切换 Doctrine
+ 相同 Seed 继续复现地形、天气、雷达、目标与情报精度
```

### 命中与失败
```diff
- RunResources.airframeCondition
- EngagementState.hits
- MissionSession.detectionModifier
- hitDamage / damagedSpeedMultiplier / damagedDetectionMultiplier
- 首次命中受损、第二次命中摧毁
- AIRCRAFT_HIT
+ 导弹首次命中立即令任务 FAILED、Run DEFEAT
+ AIRCRAFT_DESTROYED
```

### UI
```diff
- AIRFRAME 百分比
- Doctrine 预览与 Commander 标题
- Awareness 数值和进度条
- 静默模式、N/X Utility 评分与雷达开关颜色
+ Commander 标题显示当前 TRACK 百分比
+ Operator 只显示 W/S/F 三项 Utility
+ AI DEBUG 继续显示 Contact、Belief 热力图、CMD 和 Commander 意图
```

## 测试用例

### TC-001 雷达持续搜索
- 操作：无 Contact 推进 Operator 决策。
- 预期：雷达保持 `WIDE_SEARCH`，不存在关机状态。
- 是否通过：是。

### TC-002 Commander 跟踪响应
- 操作：分别输入 0、中等和高跟踪进度。
- 预期：依次选择监视、协同搜索和集中搜索。
- 是否通过：是。

### TC-003 打击后搜索
- 操作：Belief 为空时提供已摧毁目标位置。
- 预期：Commander 集中搜索目标区并输出有效目标位置。
- 是否通过：是。

### TC-004 单次命中失败
- 操作：让保持制导的导弹倒计时归零。
- 预期：产生 `AIRCRAFT_DESTROYED`，任务失败，Run 进入 `DEFEAT`。
- 是否通过：是。

### TC-005 自动化回归
- `npm.cmd run typecheck`：通过。
- `npm.cmd run test -- --run`：16 个测试文件、73 个测试通过。
- `npm.cmd run build`：通过。
