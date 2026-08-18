# 移除无效资源与失活系统

## 背景与目标
- 依据会话-32 的机制审查，删除没有形成玩家决策闭环的状态和代码。
- 将重复的 `INTEL` 与 `INTEL ACC` 收敛为唯一有效的“情报质量”。
- 移除已清空奖励池后仍残留的 Tactical Reward、Player Build、虚假 Contact、空 EventBus 与空转适应指标。

## 约束与原则
- 保留机体受损引起的探测修正、多雷达协同、Belief、Commander 与 Campaign 持久效果。
- 不在本轮擅自设计任务类型差异化玩法。
- 保持自动投弹、战役解锁与最终打击行为不变。

## 阶段与 TODO
- [x] 合并战役情报资源。
- [x] 删除 Reward/Build 与虚假 Contact 链路。
- [x] 删除无订阅者 EventBus。
- [x] 删除无消费方的接触容忍指标。
- [x] 删除固定单目标任务中的武器计数状态。
- [x] 更新界面、测试、README、机制手册与核心认知。
- [x] 完成类型检查、自动化测试和生产构建。

## 关键风险
- 删除 RunState 与 MissionSession 字段会影响创建、Reducer、UI 和测试中的结构一致性。
- 删除固定武器计数后，必须继续依靠目标摧毁状态阻止重复投弹。
- 工作区包含会话-28 的既有修改，本次只修改审查范围内文件，不覆盖既有成果。

## 代码变更

### 领域模型与创建逻辑
```diff
- interface PlayerBuild / TacticalModule / ModuleArchetype
- RunResources.intel
- PlayerTacticalProfile.contactTolerance
- GameEventType: BUILD_CHOICE / FALSE_CONTACT
- MissionSession.weaponsRemaining
- MissionSession.contactLifetimeMultiplier
- MissionSession.falseContactCharges
- MissionSession.threatPredictionEnabled
- RunState.playerBuild
- RunState.pendingRewardIds
+ RunResources.intelAccuracyBonus 添加“唯一情报质量资源”注释

- resources: { airframeCondition: 100, intel: 0, enemyAlert: 0, intelAccuracyBonus: 0 }
+ resources: { airframeCondition: 100, enemyAlert: 0, intelAccuracyBonus: 0 }
```

### 战役与任务规则
```diff
- const selectedMission = applyBuildToMission(createMission(node.missionSeed), state.playerBuild.moduleIds);
+ const selectedMission = createMission(node.missionSeed);

- intel: state.resources.intel + intelGain,
+ // Recon 与 ELINT 只直接增加 intelAccuracyBonus

- contactLifetimeMs * mission.contactLifetimeMultiplier
+ contactLifetimeMs

- return mission.weaponsRemaining > 0 && !mission.target.destroyed
+ return !mission.target.destroyed

- CHOOSE_REWARD 分支
- DEPLOY_FALSE_CONTACT 分支
- 成功任务生成 pendingRewardIds
- 自动投弹递减 weaponsRemaining
```

### 敌方适应
```diff
- contactTolerance: 0,
- const contactCount = mission.events.filter((event) => event.type === "RADAR_CONTACT").length;
- const contactTolerance = Math.min(1, contactCount / 8);
- contactTolerance: blend(profile.contactTolerance, contactTolerance, samples),
```

### 控制器与界面
```diff
- import { EventBus } from "../core/EventBus";
- const eventBus = useMemo(() => new EventBus<GameEvent>(), []);
- reducer 事件二次发布 effect
- return { state, dispatch, eventBus };
+ return { state, dispatch };

- INTEL {state.resources.intel}
- INTEL ACC
+ INTEL QUALITY

- 奖励三选一面板
- Player Build 面板
- 制造虚假 Contact 按钮
- 接触容忍百分比
- 武器 {mission.weaponsRemaining}
+ {mission.target.destroyed ? "弹药已投放" : "弹药待命"}
```

### 删除文件
```diff
- src/build/moduleRegistry.ts
- src/build/moduleRegistry.test.ts
- src/build/rewardGenerator.ts
- src/build/rewardGenerator.test.ts
- src/core/EventBus.ts
- src/core/EventBus.test.ts
```

### 测试同步
```diff
- expect(state.currentMission?.weaponsRemaining).toBe(0);
- expect(state.resources.intel).toBe(2);
+ expect(state.resources.intelAccuracyBonus).toBeCloseTo(0.06);

- 空奖励池流程测试
- 虚假 Contact 流程测试
- 测试画像中的 contactTolerance 字段

- mission.weaponsRemaining = 0;
+ mission.target.destroyed = true;
```

### 文档与样式
```diff
- 奖励卡片、Build 列表与欺骗按钮 CSS
- README/机制手册中“保留 Build 扩展框架”的描述
- Enemy Adaptation 的接触容忍说明
+ 明确情报质量为唯一有效情报资源
+ 明确 Reward/Build 空框架已经移除
+ 更新 AGENTS.md 整体与核心认知
```

## 测试用例

### TC-001 类型检查
- 操作：`npm.cmd run typecheck`
- 预期：TypeScript 无错误。
- 是否通过：是。

### TC-002 自动化回归
- 操作：`npm.cmd run test -- --run`
- 预期：战役、雷达、敌方适应、自动投弹和最终打击测试全部通过。
- 是否通过：是，17 个测试文件、79 个测试全部通过。

### TC-003 生产构建
- 操作：`npm.cmd run build`
- 预期：Vite 成功生成生产资源。
- 是否通过：是。
