# 会话-49：Phase 9 Player Build

## 背景与目标
- 按 `.temp/plan.md` 继续实现 Phase 9。
- 让任务奖励形成跨 Mission 的战术能力组合，而不是单纯数值成长。

## 约束与原则
- 奖励由 Run Seed 与奖励序号确定，相同状态可复现。
- 已拥有模块不重复进入奖励池。
- 模块必须改变信息、路线、隐身或欺骗决策，至少形成两种明显不同玩法。

## 阶段与 TODO
- [x] 建立六个 Tactical Module 注册表和四种 Archetype。
- [x] 实现成功任务后三选一奖励和跨任务 Player Build。
- [x] 实现 Ghost、Intelligence、Deception、Risk 模块效果。
- [x] 实现 False Contact 主动能力和正常 AI 数据流。
- [x] 完成 Build/奖励 UI、测试和质量门禁。

## 代码变更
```diff
 src/domain/types.ts
+ 新增 TacticalModule、ModuleArchetype、Mission 模块参数和 Run pendingRewardIds。
+ 事件新增 BUILD_CHOICE 与 FALSE_CONTACT。

+ src/build/moduleRegistry.ts
+ 注册 Low Observable Maintenance、Terrain Analysis、Signal History、Threat Prediction、False Contact Generator、Precision Navigation。
+ applyBuildToMission 在新任务创建时集中应用 Build。

+ src/build/rewardGenerator.ts
+ 基于 Run Seed、奖励序号和已拥有模块生成最多三个不重复选项。

 src/domain/detectionModel.ts
+ 增加 aircraftModifier，使低可探测维护降低最终探测概率。

 src/domain/radarSensor.ts
+ 接收 Mission detectionModifier。

 src/game/gameReducer.ts
+ 成功任务生成三选一奖励，未选择前禁止返回 Campaign。
+ CHOOSE_REWARD 写入跨任务 Player Build。
+ Signal History 延长 Contact 生命周期；False Contact Generator 生成一次带误差虚假证据并污染 Belief/Awareness。
+ 新 Mission 应用隐身、地形、记忆、威胁预测、欺骗充能和攻击窗口效果。

 src/ui/ControlPanel.tsx
+ 新增奖励卡片、Build 列表和制造虚假 Contact 按钮。

 src/ui/CampaignMap.tsx
+ 显示当前 Player Build。

 src/ui/TacticalMap.tsx
+ Threat Prediction 模块允许在关闭 Belief Debug 时继续显示 Commander 目标。

 src/ui/App.tsx
- PHASE 08
+ PHASE 09
+ 显示 Build Choice 和 False Contact 事件。

+ src/build/moduleRegistry.test.ts
+ src/build/rewardGenerator.test.ts
+ 覆盖模块数量、流派、实际效果、奖励复现、三选一和去重。

 src/game/gameReducer.test.ts
+ 覆盖成功奖励、返回拦截、Build 写入和虚假 Contact 污染 Belief。
```

## 模块效果
- Ghost：低可探测维护使探测概率 ×0.82；地形分析使遮蔽因子进一步 ×0.82。
- Intelligence：信号历史使 Contact 生命周期 ×1.75；威胁预测在普通视图显示 Commander 推测目标。
- Deception：每个 Mission 可制造一次虚假 Contact，影响 Belief、Awareness 与后续 Commander 搜索。
- Risk：精确导航将攻击半径增加 24，允许更快掠过目标。

## 测试用例

### TC-001 三选一奖励
- 操作：完成任务并使用相同 Seed 生成奖励。
- 预期：三个选项互不重复且可复现，不包含已拥有模块。
- 是否通过：通过。

### TC-002 Build 应用
- 操作：组合 Ghost、Intelligence、Deception 模块创建新 Mission。
- 预期：探测、遮蔽、Contact 生命周期、预测显示和充能均按模块改变。
- 是否通过：通过。

### TC-003 虚假 Contact
- 操作：在运行中使用 False Contact Generator。
- 预期：消耗一次充能，生成虚假 Radar Contact，并在错误位置形成 Belief 概率。
- 是否通过：通过。

### TC-004 奖励流程约束
- 操作：成功后直接返回 Campaign，再选择奖励后返回。
- 预期：未选择时返回被拒绝，选择后模块写入 Build 并允许继续。
- 是否通过：通过。

### TC-005 全量回归
- 操作：执行 `npm run typecheck`、`npm run test`、`npm run build`。
- 预期：类型检查、53 个测试和生产构建全部通过。
- 是否通过：通过。

## 当前进展与风险
- Phase 9 已完成；Phase 10 将继续扩展更多 Campaign Persistent Effects。
- 当前六个模块足以验证多流派，后续需要结合实际游玩调平奖励价值。
- False Contact 目前生成预设镜像方向，后续可升级为地图选点或条件路线能力。
