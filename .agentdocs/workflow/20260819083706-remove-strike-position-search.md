# 移除投弹后的目标区定位回退

## 背景与目标
- 修正会话-39 恢复 Awareness 时残留的会话-36 行为。
- 恢复原警戒值时期的搜索方式：投弹只提高 Awareness，搜索方位只来自 Belief/CMD。
- 保持网络静默与雷达关机已删除。

## 约束与原则
- 目标遭到打击是敌方已知事件，可以提高总体警戒。
- 目标位置不等于飞机位置，不能作为 Commander 的定位回退。
- Belief 失效后必须清除 CMD，不得继续围绕目标区伪装成飞机定位。

## 阶段与 TODO
- [x] 删除 Commander 的打击位置参数。
- [x] 删除投弹产生的集中搜索额外加分。
- [x] 删除 Belief 无效时使用目标位置的回退。
- [x] 删除主循环向 Commander 传递目标位置。
- [x] 同步测试、核心认知与机制说明。
- [x] 完成自动化验证。

## 代码变更
```diff
- advanceCommander(..., coordinationModifier, strikePosition?)
+ advanceCommander(..., coordinationModifier)

- MONITOR: 72 - awareness.value * 0.72 - strikePenalty
+ MONITOR: 72 - awareness.value * 0.72

- CONCENTRATE_SEARCH: base + strikeBonus
+ CONCENTRATE_SEARCH: base

- const searchPosition = peak.position ?? strikePosition;
+ const hasBelief = peak.position !== undefined;

- targetPosition 使用 searchPosition
+ targetPosition 只使用有效 peak.position

- gameReducer 向 Commander 传入已摧毁目标位置
+ 投弹只通过 attackAwarenessGain 提高 Awareness
```

## 测试用例

### TC-001 Belief 失效
- 预期：Commander 清除 CMD，不回退到目标位置。
- 是否通过：是。

### TC-002 投弹警戒
- 预期：投弹提高 Awareness，但不直接提供搜索位置或强制集中搜索。
- 是否通过：是。

### TC-003 静默保持删除
- 预期：源码不存在 `NETWORK_SILENCE` 与 `SHUTDOWN` 行为。
- 是否通过：是。

### TC-004 自动化验证
- `npm.cmd run typecheck`：通过。
- `npm.cmd run test -- --run`：17 个测试文件、75 个测试通过。
- `npm.cmd run build`：通过。
