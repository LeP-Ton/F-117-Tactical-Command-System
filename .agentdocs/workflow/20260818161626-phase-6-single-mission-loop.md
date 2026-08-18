# 会话-33：Phase 6 单 Mission 循环

## 背景与目标
- 按 `.temp/plan.md` 继续实现 Phase 6。
- 在既有航线规划与防空 AI 上加入目标、攻击、撤离、成功和失败，验证单任务猫鼠玩法闭环。

## 约束与原则
- 攻击由玩家在有效半径内手动触发，不自动代替战术决策。
- 目标摧毁后显著提高 Enemy Awareness，使撤离阶段更危险。
- 单任务结果写入 RunState 的 Mission History，保持 Run/Mission 边界。

## 阶段与 TODO
- [x] 定义目标、武器、撤离区与任务终态。
- [x] 实现攻击窗口、武器消耗和攻击警戒跃升。
- [x] 实现撤离成功与航线结束失败判定。
- [x] 实现目标、攻击半径、撤离区和任务结果 UI。
- [x] 完成测试、类型检查和生产构建。

## 代码变更
```diff
 src/config/gameConfig.ts
+ 新增攻击半径、攻击警戒增益和撤离区配置。

 src/domain/types.ts
- MissionStatus 包含 ROUTE_COMPLETE。
+ MissionStatus 使用 SUCCESS、FAILED 终态。
+ 新增 MissionTarget、ExtractionArea、武器数量和攻击/撤离/结果事件。

+ src/domain/missionRules.ts
+ 实现目标距离、攻击可用条件和撤离区边界判定。

 src/domain/factories.ts
+ 初始任务增加 COMMAND-BUNKER、1 枚武器和东北撤离区。

 src/game/gameReducer.ts
+ 新增 ATTACK_TARGET，成功攻击消耗武器、摧毁目标并提高 Awareness。
+ 飞机在目标摧毁后进入撤离区时成功；航线结束但未满足条件时失败。
+ 终态写入 missionHistory，并记录 ATTACK、EXTRACTION、MISSION_SUCCESS、MISSION_FAILED。

 src/ui/ControlPanel.tsx
+ 新增任务目标状态、距离、武器数量和投放按钮。

 src/ui/TacticalMap.tsx
+ 绘制目标、攻击半径、摧毁状态和配置化撤离区。

 src/ui/App.tsx
- PHASE 05
+ PHASE 06
+ 新增目标状态、任务结果和攻击/撤离事件显示。

+ src/domain/missionRules.test.ts
 src/game/gameReducer.test.ts
+ 覆盖攻击限制、武器消耗、警戒跃升、成功撤离、失败和 Mission History。
```

## 测试用例

### TC-001 攻击窗口
- 操作：分别在目标半径外、半径内和无武器状态尝试攻击。
- 预期：仅在任务进行中、半径内、目标有效且有武器时允许攻击。
- 是否通过：通过。

### TC-002 攻击后果
- 操作：在有效位置投放武器。
- 预期：目标摧毁、武器减一、Awareness 显著上升并记录 ATTACK。
- 是否通过：通过。

### TC-003 成功撤离
- 操作：摧毁目标后进入撤离区。
- 预期：任务状态为 SUCCESS，Mission History 记录成功。
- 是否通过：通过。

### TC-004 任务失败
- 操作：未摧毁目标即完成全部航点。
- 预期：任务状态为 FAILED，Mission History 记录失败原因。
- 是否通过：通过。

### TC-005 全量回归
- 操作：执行 `npm run typecheck`、`npm run test`、`npm run build`。
- 预期：类型检查、33 个测试和生产构建全部通过。
- 是否通过：通过。

## 当前进展与风险
- Phase 6 已完成，当前可以验证单 Mission 的 Plan → Discover → Replan → Strike → Extract。
- Phase 7 程序生成 Mission 尚未实现，当前目标、雷达和地形布局仍固定。
- 当前武器命中为确定结果，复杂命中与毁伤模型不属于核心验证范围。
