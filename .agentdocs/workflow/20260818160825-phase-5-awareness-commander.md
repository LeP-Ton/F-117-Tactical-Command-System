# 会话-28：Phase 5 Awareness 与 Air Defense Commander

## 背景与目标
- 用户确认 Phase 4 测试正常，继续实现 Phase 5。
- 让多台独立雷达在任务警戒与 Commander 命令下形成整体搜索行为。

## 约束与原则
- Awareness 只根据 Radar Contact 增长，失去证据后缓慢衰减。
- Commander 不接收 `AircraftState`，只读取 Awareness、Belief Map 与 RadarState。
- Commander 通过可调试的 Utility 评分和 Operator 偏置下达命令。

## 阶段与 TODO
- [x] 实现 0–100 Awareness 和四个警戒阶段。
- [x] 实现 Analytical Commander Utility AI。
- [x] 实现 Monitor、Coordinated Search、Concentrate Search、Network Silence 命令结构。
- [x] 将 Commander 偏置、目标方位与 Radar Operator 串联。
- [x] 完成调试界面、测试和质量门禁。

## 代码变更
```diff
 src/config/gameConfig.ts
+ 新增 Awareness 证据增益、衰减、阶段阈值和 Commander 决策间隔。

 src/domain/types.ts
+ 新增 AwarenessState、CommanderState、CommanderIntent 与评分类型。
+ RadarOperatorState 新增 commanderBias。
+ MissionSession 新增 awareness、commander；事件新增阶段变化和 Commander 命令。

+ src/domain/awarenessSystem.ts
+ Contact 的 confidence 与 signalStrength 提升 Awareness，无证据时按时间衰减。
+ Awareness 映射 CALM、SUSPICIOUS、SEARCHING、HUNTING。

+ src/domain/airDefenseCommander.ts
+ 根据 Awareness 与 Belief 峰值计算 M/C/F/N 四项 Utility 分数。
+ 为雷达分配 Wide、Sector、Focused、Shutdown 偏置和基于 Belief 的搜索方位。

 src/domain/radarOperatorAI.ts
- Operator 评分仅包含本地 Contact 证据。
+ Operator 评分叠加 Commander 偏置，同时保留本地 Contact 自主判断。

 src/game/gameReducer.ts
+ 数据流调整为 Sensor → Contact → Belief/Awareness → Commander → Radar Operator。
+ 记录 AWARENESS_STAGE_CHANGED 与 COMMANDER_ORDER 事件。

 src/ui/App.tsx
- PHASE 04
+ PHASE 05
+ 新增 Awareness 值/阶段、Commander 意图、M/C/F/N 评分与警戒条。

 src/ui/TacticalMap.tsx
+ Belief Debug 中显示 Commander 目标标记。

+ src/domain/awarenessSystem.test.ts
+ src/domain/airDefenseCommander.test.ts
+ 覆盖证据增长、衰减、阶段阈值、监视、集中搜索、雷达偏置和数据隔离。
```

## 测试用例

### TC-001 Awareness 演化
- 操作：连续输入 Contact 后停止输入并推进时间。
- 预期：警戒跨阶段上升，无证据时缓慢下降且不低于零。
- 是否通过：通过。

### TC-002 Commander 监视
- 操作：在 CALM 且 Belief 为空时执行决策。
- 预期：选择 Monitor，并提高 Wide Search 偏置。
- 是否通过：通过。

### TC-003 Commander 集中搜索
- 操作：提供高 Awareness 和明确 Belief 峰值。
- 预期：选择 Concentrate Search，提高 Focused Track 偏置并分配目标方位。
- 是否通过：通过。

### TC-004 AI 数据隔离
- 操作：检查 Commander API 与状态。
- 预期：不需要 AircraftState，不保存真实玩家位置。
- 是否通过：通过。

### TC-005 全量回归
- 操作：执行 `npm run typecheck`、`npm run test`、`npm run build`。
- 预期：类型检查、28 个测试和生产构建全部通过。
- 是否通过：通过。

## 当前进展与风险
- Phase 5 已完成；Phase 6 单 Mission 的目标、攻击、撤离和胜负尚未实现。
- 当前 Commander Doctrine 固定为 Analytical，其他 Doctrine 属于后续程序生成阶段。
- Commander Utility 参数仍需通过实际游玩调整，调试面板已展示所有评分。
