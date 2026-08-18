# 会话-37：Phase 7 程序生成 Mission

## 背景与目标
- 按 `.temp/plan.md` 继续实现 Phase 7。
- 消除固定任务布局，让相同 Seed 可复现、不同 Seed 形成不同防空问题。

## 约束与原则
- 所有关键随机只使用 `SeededRandom`，不得调用 `Math.random()`。
- 相同 Seed 必须复现 Terrain、Weather、Radar、Target、Intel 和 Doctrine。
- 所有生成对象必须位于逻辑地图范围内，并满足最低内容数量。

## 阶段与 TODO
- [x] 扩展 SeededRandom 的整数与集合选择能力。
- [x] 实现 Terrain、Weather、Radar Network、Target 和 Intel 程序生成。
- [x] 实现四种 Commander Doctrine 生成与行为差异。
- [x] 将天气接入探测模型，增加 Seed 输入和生成调试信息。
- [x] 完成连续十任务生成测试与质量门禁。

## 代码变更
```diff
 src/core/SeededRandom.ts
+ 新增 integer 与 pick，所有程序生成继续使用同一确定性随机源。

 src/domain/types.ts
+ 新增 WeatherZone、CommanderDoctrine、intelAccuracy 和 generationInfo。
+ MissionSession 新增 weather。

+ src/procedural/missionGenerator.ts
+ 每个 Seed 生成 2–4 个 Terrain、1–2 个 Weather、3–5 台 Radar、Target、Intel Accuracy 和 Doctrine。

 src/domain/factories.ts
- 使用固定地形、三台固定雷达、固定目标和 Analytical Commander。
+ 通过 Mission Generator 初始化全部任务内容。

 src/domain/detectionModel.ts
+ Weather Factor 进入雷达探测概率公式。

 src/domain/radarSensor.ts
+ Sensor 接收 Weather，并将天气影响计入 Contact signalStrength。

 src/domain/airDefenseCommander.ts
- Doctrine 固定为 Analytical。
+ 支持 Conservative、Aggressive、Ambush、Analytical 的评分差异。
+ Ambush 只在开局短暂静默，随后恢复搜索以避免永久离线。

 src/game/gameReducer.ts
+ 新增 NEW_RUN，可按输入 Seed 创建完整新 Run。

 src/ui/App.tsx
- PHASE 06
+ PHASE 07
+ 新增 RUN SEED 输入、生成任务按钮、情报精度和生成规模。

 src/ui/TacticalMap.tsx
+ 绘制 Cloud 与 Storm 天气区域。

+ src/procedural/missionGenerator.test.ts
+ 覆盖相同 Seed 复现、不同 Seed 差异、十任务边界与 Doctrine 集合。

 src/domain/detectionModel.test.ts
+ 覆盖恶劣天气降低探测概率。

 src/domain/airDefenseCommander.test.ts
+ 覆盖 Ambush 开局静默与恢复搜索。
```

## 测试用例

### TC-001 Seed 复现
- 操作：使用相同 Seed 两次生成完整 Mission。
- 预期：任务数据深度相等。
- 是否通过：通过。

### TC-002 Seed 多样性
- 操作：使用不同 Seed 生成任务。
- 预期：雷达布局和目标位置不同。
- 是否通过：通过。

### TC-003 连续十任务
- 操作：连续生成十个不同 Seed。
- 预期：内容数量与地图边界合法，十个布局签名均不同。
- 是否通过：通过。

### TC-004 天气与 Doctrine
- 操作：比较晴空和 Storm 探测概率，并验证 Doctrine 集合及 Ambush 生命周期。
- 预期：天气降低探测；Doctrine 合法；Ambush 可从静默恢复。
- 是否通过：通过。

### TC-005 全量回归
- 操作：执行 `npm run typecheck`、`npm run test`、`npm run build`。
- 预期：类型检查、39 个测试和生产构建全部通过。
- 是否通过：通过。

## 当前进展与风险
- Phase 7 已完成；Phase 8 Campaign Map 尚未实现。
- Intel Accuracy 当前作为任务情报元数据展示，情报误差可视化将在 Campaign/Intel 层深化。
- 程序生成保证结构合法和多样性，但路线可玩性仍需持续进行人工验证。
