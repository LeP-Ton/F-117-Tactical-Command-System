# 会话-57：清空当前奖励池，聚焦动态航线规划

## 背景与目标
- 用户明确当前希望做成纯粹的动态航线规划。
- Roguelike 变化主要体现在地图、雷达网络和 Campaign 防空构建，不通过玩家奖励 Build 驱动。
- 奖励系统需要保持可扩展，但当前正式奖励池必须为空。

## 约束与原则
- 不删除奖励注册、确定性生成、Build 持久化和 Mission 应用接口。
- 当前流程不得展示空奖励或空 Build 面板。
- 成功任务在空奖励池状态下可以直接返回 Campaign。

## 阶段与 TODO
- [x] 清空 Tactical Module 正式注册表。
- [x] 保留 Reward Generator 与 Build 扩展接口。
- [x] 隐藏空奖励和空 Build UI。
- [x] 调整任务成功流程和测试。
- [x] 更新项目核心认知与文档。

## 代码变更
```diff
 src/build/moduleRegistry.ts
- tacticalModules 包含六个 Ghost/Intelligence/Deception/Risk 奖励。
+ tacticalModules = []，并注明当前聚焦动态航线规划，未来可通过注册表恢复扩展。
+ applyBuildToMission 保留为兼容和扩展挂载点。

 src/ui/ControlPanel.tsx
- 空 Player Build 仍显示“尚未获得模块”。
+ 仅在实际存在模块或能力充能时显示 Build 区域。

 src/ui/CampaignMap.tsx
- Campaign Preview 始终显示空 Build 区域。
+ 仅在 Player Build 非空时显示 Build 区域。

 src/build/moduleRegistry.test.ts
- 断言当前至少存在六个模块。
+ 断言当前正式奖励池为空，同时保留扩展效果挂载测试。

 src/build/rewardGenerator.test.ts
- 断言生成三个不重复奖励。
+ 断言空池对任意 Seed 都返回空奖励。

 src/game/gameReducer.test.ts
- 成功后必须三选一才能返回 Campaign。
+ 成功后 pendingRewardIds 为空，可直接返回 Campaign。
```

## 测试用例

### TC-001 空奖励池
- 操作：使用不同 Seed 和不同已拥有模块调用 Reward Generator。
- 预期：均返回空数组。
- 是否通过：通过。

### TC-002 成功任务流程
- 操作：成功完成 Mission。
- 预期：不显示奖励三选一，可直接返回 Campaign Map。
- 是否通过：通过。

### TC-003 空界面隐藏
- 操作：在新 Run 和 Campaign Map 中检查奖励及 Build 区域。
- 预期：不显示空奖励卡片和空 Build 面板。
- 是否通过：通过。

### TC-004 扩展框架保留
- 操作：通过保留的 Build 应用接口注入测试模块 ID。
- 预期：模块效果挂载逻辑仍可工作，未来恢复奖励无需修改主流程。
- 是否通过：通过。

### TC-005 全量回归
- 操作：执行 `npm run typecheck`、`npm run test`、`npm run build`。
- 预期：类型检查、53 个测试和生产构建全部通过。
- 是否通过：通过。

## 当前进展与风险
- 当前正式奖励数量为 0。
- Phase 9 文档保留为历史实现记录；当前状态以本变更文档为准。
- 后续新增奖励前需重新确认其是否会削弱“动态航线规划”这一核心体验。
