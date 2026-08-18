# 会话-61：Phase 10 Persistent Campaign Effects

## 背景与目标
- 在奖励池清空后，继续强化“地图与雷达构建驱动 Roguelike”的产品方向。
- 让更多 Campaign 节点真实改变后续 Mission 的防空网络与可用情报。

## 约束与原则
- 所有效果保存在 RunState，不污染单 Mission 状态边界。
- 节点预览必须与实际效果一致。
- Enemy Alert 是敌方反制资源，必须能抵消玩家对防空体系的削弱。

## 阶段与 TODO
- [x] 增加 Intel Accuracy 与 Commander Coordination 持久状态。
- [x] 增加 Command Strike 节点。
- [x] 将 Recon、ELINT、SEAD、Command Strike 结果应用到后续 Mission。
- [x] 将 Enemy Alert 转换为未来雷达覆盖增益。
- [x] 增加调试显示、测试和质量门禁。

## 代码变更
```diff
 src/domain/types.ts
+ MissionNodeType 新增 COMMAND_STRIKE。
+ RunResources 新增 intelAccuracyBonus。
+ PersistentEnemyState 新增 commanderCoordinationModifier。
+ MissionSession 新增 commanderCoordinationModifier。

 src/procedural/campaignGenerator.ts
+ 第三层保证包含 Command Strike，节点预览说明指挥链破坏效果。

 src/domain/factories.ts
+ 初始化 Intel Accuracy Bonus、Radar Coverage Modifier 和 Commander Coordination Modifier。

 src/game/gameReducer.ts
+ Recon 成功使后续 Intel Accuracy +6%，ELINT 成功 +10%，累计上限 +24%。
+ SEAD 成功使后续 Radar Coverage ×0.85，最低 55%。
+ Command Strike 成功使后续 Commander Coordination ×0.75，最低 45%。
+ Enemy Alert 使未来 Radar Coverage 乘以 1 + Alert/250。

 src/domain/airDefenseCommander.ts
+ Commander 向 Radar Operator 分配的全部 Utility Bias 按 Coordination Modifier 缩放。

 src/ui/CampaignMap.tsx
+ 增加 Command Strike 标签以及 Intel Accuracy、Radar Network、Command Link 调试值。

 src/ui/App.tsx
- PHASE 09
+ PHASE 10
+ Mission 遥测显示当前指挥链效率。

 src/game/gameReducer.test.ts
+ 覆盖 Recon 情报、SEAD 覆盖、Command Strike 协调和 Enemy Alert 增援的跨任务效果。

 src/domain/airDefenseCommander.test.ts
+ 覆盖受损指挥链按比例降低 Operator Utility Bias。
```

## 测试用例

### TC-001 Recon/ELINT 情报效果
- 操作：完成 Recon 或 ELINT 后进入新 Mission。
- 预期：任务 Intel Accuracy 按 Run Bonus 提升，最高不超过 99%。
- 是否通过：通过。

### TC-002 SEAD 防空压制
- 操作：完成 SEAD 后进入新 Mission。
- 预期：新任务雷达范围按持久 Radar Coverage Modifier 缩小。
- 是否通过：通过。

### TC-003 Command Strike 指挥破坏
- 操作：完成 Command Strike 后触发 Commander 集中搜索。
- 预期：后续 Mission 的 Operator Utility Bias 按 75% 缩放。
- 是否通过：通过。

### TC-004 Enemy Alert 增援
- 操作：将 Enemy Alert 提升到 50 后启动任务。
- 预期：雷达基础覆盖范围扩大到 120%。
- 是否通过：通过。

### TC-005 全量回归
- 操作：执行 `npm run typecheck`、`npm run test`、`npm run build`。
- 预期：类型检查、57 个测试和生产构建全部通过。
- 是否通过：通过。

## 当前进展与风险
- Phase 10 已完成；下一阶段为 Enemy Adaptation。
- 当前持久效果直接作用于生成后的 Mission 参数，便于调试与复现。
- Enemy Alert 与 SEAD 可互相抵消，后续需要结合完整 Run 调整数值平衡。
