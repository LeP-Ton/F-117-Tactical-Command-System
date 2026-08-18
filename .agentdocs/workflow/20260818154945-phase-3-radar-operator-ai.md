# 会话-19：Phase 3 Radar Operator Utility AI

## 背景与目标
- 用户确认 RADAR-03 Contact 黄圈正常，继续进入 Phase 3。
- 让每台雷达基于不完美 Contact 自主改变扫描行为，并保证评分可调试。

## 约束与原则
- Operator API 不接收 `AircraftState`，只读取属于该雷达的 `RadarContact`。
- 所有模式评分保存在 `RadarOperatorState`，不得使用不可解释的隐藏决策。
- 模式切换需要影响真实扫描行为，而不只是更新 UI 文本。

## 阶段与 TODO
- [x] 定义 Operator 模式、效用评分、Contact 记忆和模式事件。
- [x] 实现 Wide Search、Sector Search、Focused Track、Shutdown。
- [x] 让传感器扫描方式响应 Operator 模式。
- [x] 增加地图模式标签、结构化事件和评分调试面板。
- [x] 完成测试、类型检查和生产构建。

## 代码变更

- 类型与参数
```diff
 src/domain/types.ts
+ RadarOperatorMode = WIDE_SEARCH | SECTOR_SEARCH | FOCUSED_TRACK | SHUTDOWN。
+ RadarState 新增 operator，包含全部评分、决策计时、Contact 记忆和聚焦方位。
+ GameEventType 新增 RADAR_MODE_CHANGED。

 src/config/gameConfig.ts
+ 新增决策间隔、聚焦/扇区证据窗口、关机持续时间与冷却时间。
```

- Operator 与 Sensor
```diff
+ src/domain/radarOperatorAI.ts
+ 基于 Contact 年龄、置信度和当前模式计算 W/S/F/X 四项 Utility 分数。
+ 高置信度新 Contact 触发 Focused Track，证据变旧后依次退回 Sector/Wide。
+ 长期无证据时允许短暂 Shutdown，并通过冷却防止重复关机。
+ 输出 RadarModeChange，且函数签名不接受真实飞机状态。

 src/domain/radarSensor.ts
- 雷达统一进行 360° 匀速扫描。
+ Wide 维持全向扫描，Sector 围绕 Contact 方位摆扫，Focused 指向 Contact 估算位置，Shutdown 停止扫描。

 src/domain/factories.ts
+ 所有雷达通过统一工厂初始化 Operator 状态。

 src/game/gameReducer.ts
+ Sensor 生成 Contact 后推进 Operator，保存模式并发出 RADAR_MODE_CHANGED 事件。
```

- 界面与测试
```diff
 src/ui/TacticalMap.tsx
+ 雷达标签显示当前模式，Shutdown 使用暗色状态。

 src/ui/App.tsx
+ 新增 Radar Operator AI 调试区，展示模式和 W/S/F/X 分数。
+ 事件日志支持雷达模式切换。

 src/ui/styles.css
+ 新增 Operator 卡片、评分网格和关机模式样式。

+ src/domain/radarOperatorAI.test.ts
+ 覆盖高置信度聚焦、证据老化、扇区/广域回退、关机保持和冷却恢复。
```

## 测试用例

### TC-001 Contact 驱动聚焦
- 操作：向 Operator 输入高置信度的新 Contact。
- 预期：Focused Track 得分最高，雷达切换为聚焦跟踪。
- 是否通过：通过。

### TC-002 证据老化
- 操作：逐步增加同一 Contact 的年龄。
- 预期：模式按 Focused → Sector → Wide 回退。
- 是否通过：通过。

### TC-003 静默关机
- 操作：让雷达长期无 Contact，再推进关机持续期和冷却期。
- 预期：雷达短时关机，持续期结束后恢复 Wide，冷却期间不会立即重复关机。
- 是否通过：通过。

### TC-004 全量回归
- 操作：执行 `npm run typecheck`、`npm run test`、`npm run build`。
- 预期：类型检查、18 个测试和生产构建全部通过。
- 是否通过：通过。

## 当前进展与风险
- Phase 3 已完成；Phase 4 Belief Map 尚未实现。
- 当前 Operator 只使用自身 Contact，雷达间协同属于 Phase 5 Commander。
- Utility 参数为首版可调值，需要结合实际游玩观察模式切换频率。
