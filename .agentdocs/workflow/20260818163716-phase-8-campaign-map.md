# 会话-42：Phase 8 Campaign Map

## 背景与目标
- 按 `.temp/plan.md` 继续实现 Phase 8。
- 将独立 Mission 串成可选择、可解锁、会积累历史效果的 Roguelike Run。

## 约束与原则
- Campaign 与 Mission 状态继续严格分离。
- 节点奖励必须改变 Run 资源或后续任务，而不只是显示文本。
- 单 Mission 失败不会立即结束 Run，Final Strike 成功才结束本次 Run。

## 阶段与 TODO
- [x] 定义 Campaign Node、Edge、状态、预览和任务类型。
- [x] 实现 Seed 可复现的分层 Campaign DAG。
- [x] 实现节点选择、任务启动、结果回写和后续解锁。
- [x] 实现 Intel、Enemy Alert 与持久 SEAD 雷达覆盖效果。
- [x] 实现 Campaign Map UI、测试和质量门禁。

## 代码变更
```diff
 src/domain/types.ts
+ 新增 MissionNodeType、CampaignNodeStatus、CampaignNode、CampaignEdge。
+ CampaignState 新增 nodes 与 edges。
+ PersistentEnemyState 新增 radarCoverageModifier。

+ src/procedural/campaignGenerator.ts
+ 根据 Run Seed 生成 6–7 个四层节点和层间边。
+ 首层固定包含 Recon/Strike，第二层包含 ELINT/SEAD，末层为 Final Strike。
+ 节点预览包含 Radar Density、Weather、Intel Accuracy、Doctrine 和战略效果。

 src/domain/factories.ts
- Run 只初始化空 CampaignState。
+ Run 初始化完整 Campaign Graph，并准备首个可用任务。

 src/game/gameReducer.ts
+ 新增 SELECT_CAMPAIGN_NODE 与 RETURN_CAMPAIGN。
+ 成功/失败会更新节点状态并解锁下一层，失败增加 Enemy Alert 但 Run 继续。
+ Recon/ELINT 增加 Intel，SEAD 降低 Enemy Alert 并永久降低后续雷达覆盖。
+ Final Strike 成功将 RunStatus 更新为 VICTORY。

+ src/ui/CampaignMap.tsx
+ 绘制 Campaign DAG、节点状态、Run 资源与任务预览，并提供任务启动入口。

 src/ui/ControlPanel.tsx
+ 新增战役地图入口和任务终态返回按钮。

 src/ui/App.tsx
- PHASE 07
+ PHASE 08
+ 在 Campaign Map 与 Tactical Mission 视图之间切换。

 src/ui/styles.css
+ 新增战役图、节点、连线、预览面板和资源栏样式。

+ src/procedural/campaignGenerator.test.ts
+ 覆盖 Seed 复现、节点数量、类型、最终节点与合法层间边。

 src/game/gameReducer.test.ts
+ 覆盖节点完成、解锁、Recon 奖励、失败 Alert 和 SEAD 跨任务覆盖削弱。
```

## 测试用例

### TC-001 Campaign Seed 复现
- 操作：使用相同 Run Seed 两次生成 Campaign。
- 预期：节点、边、预览和 Mission Seed 完全一致。
- 是否通过：通过。

### TC-002 Campaign 结构
- 操作：连续生成十个 Campaign。
- 预期：每个包含 6–9 节点、至少三种类型、两个起始节点和一个 Final Strike，边只连接相邻层。
- 是否通过：通过。

### TC-003 节点结果与解锁
- 操作：完成 Recon 后返回地图，再模拟一次任务失败。
- 预期：Recon 发放 Intel 并解锁下一层；失败提高 Alert 但 Run 保持 ACTIVE。
- 是否通过：通过。

### TC-004 持久 SEAD 效果
- 操作：完成 SEAD 后启动另一个任务。
- 预期：radarCoverageModifier 降至 0.85，后续任务所有雷达范围同步缩小。
- 是否通过：通过。

### TC-005 全量回归
- 操作：执行 `npm run typecheck`、`npm run test`、`npm run build`。
- 预期：类型检查、45 个测试和生产构建全部通过。
- 是否通过：通过。

## 当前进展与风险
- Phase 8 已完成；Phase 9 Player Build 与任务后三选一奖励尚未实现。
- 当前任一已完成节点即可解锁其下一层连接，后续可增加更复杂的前置条件。
- Recon 与 ELINT 当前通过 Intel 资源表达，具体情报揭示消费会在 Build/Intel 系统中深化。
