# 会话-14：Phase 2 雷达模拟

## 背景与目标
- 用户确认 Phase 0+1 浏览器测试正常，继续进入 `.temp/plan.md` 的 Phase 2。
- 实现雷达扫描、动态探测概率、朝向影响、地形遮蔽和带误差 Radar Contact。

## 约束与原则
- 只有 Radar Sensor 可以读取飞机真实状态。
- Contact 不包含真实坐标，只提供估算位置、置信度、信号强度和误差半径。
- 探测随机由 Mission Seed、雷达 ID 和扫描序号确定，相同状态可复现。

## 阶段与 TODO
- [x] 扩展 Radar、Terrain、Contact 与 Mission 数据模型。
- [x] 实现雷达波束旋转和固定间隔扫描。
- [x] 实现距离、朝向、地形、波束探测因子。
- [x] 接入游戏循环、结构化事件、Canvas 和遥测。
- [x] 增加测试并完成全部质量门禁。

## 代码变更

- 探测模型与传感器
```diff
+ src/domain/detectionModel.ts
+ 计算雷达方位、波束角差、距离衰减、机体朝向暴露和地形遮蔽。
+ 输出可解释 DetectionFactors，并限制最终概率不超过 0.95。

+ src/domain/radarSensor.ts
+ 按固定扫描间隔推进每台雷达，使用 SeededRandom 决定是否形成 Contact。
+ Contact 位置加入确定性方向和距离误差，不保存 realPosition。
```

- 状态和配置
```diff
 src/config/gameConfig.ts
+ 新增扫描间隔、旋转速度、波束宽度、基础概率、Contact 生命周期和误差范围。

 src/domain/types.ts
+ 新增 TerrainZone、RadarState、RadarContact。
+ MissionSession 新增 terrain、radars、radarContacts。
+ GameEventType 新增 RADAR_CONTACT。

 src/domain/factories.ts
+ 初始任务增加两片地形遮蔽区和三台不同位置、半径及初始角度的雷达。
+ createGameEvent 支持记录真实事件来源。

 src/game/gameReducer.ts
+ TICK 在自动驾驶后推进 Radar Sensor、清理过期 Contact 并生成 RADAR_CONTACT 事件。
```

- UI 与文档
```diff
 src/ui/TacticalMap.tsx
+ 绘制地形遮蔽区、雷达覆盖范围、旋转扫描线和 Contact 误差圈。

 src/ui/App.tsx
- PHASE 01
+ PHASE 02
+ 显示活动雷达数、有效 Contact 数和雷达接触事件。

 src/ui/styles.css
+ 增加雷达图例样式。

 README.md
+ 记录 Phase 2 玩法、Contact 语义和 Sensor 数据边界。

 AGENTS.md
- 当前完成 Phase 0+1。
+ 当前完成 Phase 0+1+2，并记录 Reality → Sensor → Imperfect Contact 核心约束。

 .agentdocs/workflow/20260818151940-phase-0-1-route-planning.md
- 浏览器交互：待验证。
+ 浏览器交互：通过（用户确认）。
```

- 测试
```diff
+ src/domain/detectionModel.test.ts
+ 覆盖侧向暴露、机头低暴露、地形遮蔽和波束外零概率。

+ src/domain/radarSensor.test.ts
+ 覆盖结果可复现、实际生成 Contact、误差语义及不泄漏真实位置字段。
```

## 测试用例

### TC-001 朝向影响探测
- 操作：对相同位置分别计算机头与侧面对雷达的概率。
- 预期：侧面对雷达的概率更高。
- 是否通过：通过。

### TC-002 地形与波束
- 操作：比较遮蔽区内外概率，并将扫描波束转离飞机。
- 预期：地形降低概率；波束未覆盖时概率为零。
- 是否通过：通过。

### TC-003 Contact 数据隔离
- 操作：运行固定 Seed 扫描并检查 Contact。
- 预期：结果可复现，Contact 包含误差且不存在真实坐标字段。
- 是否通过：通过。

### TC-004 全量回归
- 操作：执行 `npm run typecheck`、`npm run test`、`npm run build`。
- 预期：类型检查、15 个测试和生产构建全部通过。
- 是否通过：通过。

## 当前进展与风险
- Phase 2 已完成，Phase 3 Radar Operator AI 尚未实现。
- 用户于后续会话确认 RADAR-03 扫过飞机时正常出现黄色 Contact 误差圈，Phase 2 浏览器验证通过。
- 当前雷达和地形布局固定；程序生成属于后续 Phase 7。
- Radar Contact 目前显示在开发原型界面，正式玩家信息可见性需在后续 Intel/Debug 模式中拆分。
