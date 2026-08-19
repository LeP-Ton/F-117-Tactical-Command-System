# 恢复敌方警戒值并保持无网络静默

## 背景与目标
- 恢复 Awareness 作为 Commander 的全局搜索强度输入。
- 保持会话-36 对雷达静默、网络静默与 Doctrine 的删除结果。
- 明确区分 Awareness 与玩家可见的跟踪进度，避免两者职责混淆。

## 约束与原则
- Awareness 不读取飞机真实位置，只消费 Radar Contact 和已知投弹事件。
- Awareness 不直接发射导弹；锁定、导弹与脱锁仍完全由 Engagement 跟踪进度负责。
- 不恢复 `SHUTDOWN`、`NETWORK_SILENCE` 或 Commander Doctrine。

## 阶段与 TODO
- [x] 恢复 Awareness 类型、配置、领域系统与测试。
- [x] Commander 改回读取 Awareness 与 Belief。
- [x] 恢复投弹警戒增量和警戒阶段事件。
- [x] 恢复 AI DEBUG 警戒数值、阶段和进度条。
- [x] 更新核心认知与机制手册。
- [x] 完成类型检查与自动化测试。

## 代码变更

### Awareness 状态
```diff
+ type AwarenessStage = "CALM" | "SUSPICIOUS" | "SEARCHING" | "HUNTING";
+ interface AwarenessState { value: number; stage: AwarenessStage }
+ MissionSession.awareness
+ GameEventType.AWARENESS_STAGE_CHANGED
+ gameConfig.awareness 阈值、Contact 增益与衰减参数
+ gameConfig.mission.attackAwarenessGain = 34
+ awarenessSystem.ts 与 awarenessSystem.test.ts
```

### Commander
```diff
- advanceCommander(state, trackProgress, beliefMap, ...)
+ advanceCommander(state, awareness, beliefMap, ...)

- MONITOR / COORDINATED_SEARCH / CONCENTRATE_SEARCH 根据 trackProgress 评分
+ MONITOR / COORDINATED_SEARCH / CONCENTRATE_SEARCH 根据 awareness.value 评分

  // 未恢复 NETWORK_SILENCE，Commander 仍只有三个意图。
```

### 主循环与 UI
```diff
+ Contact 提升 Awareness，无 Contact 时缓慢衰减
+ 自动投弹额外增加 34 点 Awareness
+ 警戒阶段变化产生 AWARENESS_STAGE_CHANGED 事件
+ AI DEBUG 显示警戒数值、阶段和 ALERT 进度条
  // THREAT WARNING 继续独立显示跟踪、锁定和导弹进度。
```

## 测试用例

### TC-001 Contact 累积警戒
- 预期：连续 Contact 使 Awareness 上升并跨越阶段。
- 是否通过：是。

### TC-002 警戒衰减
- 预期：没有新证据时缓慢下降且不低于零。
- 是否通过：是。

### TC-003 Commander 响应
- 预期：低、中、高 Awareness 分别驱动监视、协同搜索和集中搜索，不产生静默意图。
- 是否通过：是。

### TC-004 投弹警戒
- 预期：自动投弹后 Awareness 增加超过 30 点，并组织目标区集中搜索。
- 是否通过：是。

### TC-005 自动化验证
- `npm.cmd run typecheck`：通过。
- `npm.cmd run test -- --run`：17 个测试文件、76 个测试通过。
- `npm.cmd run build`：通过。
