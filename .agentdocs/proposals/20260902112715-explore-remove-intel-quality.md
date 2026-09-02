# 探索方案：移除情报质量数值系统

> 状态：已在会话-121采纳并实施。本文保留为设计来源与备选方案记录；最终代码差异和验收结果以对应 workflow 变更文档为准。

## 背景判断

当前 INTEL 同时维护两套成长：

1. 连续数值 `intelAccuracyBonus`：每次 INTEL 增加 10%，代码上限为 24%。
2. 离散权限 `IntelAccessTier`：第一次 INTEL 精确识别雷达位置与类型，第二次 INTEL 解锁 `TOTAL INTEL`。

两套成长存在覆盖关系：

- Tier 0 时，`intelAccuracy` 会影响雷达发现率、位置误差、范围误差和情报等级。
- Tier 1 会强制显示全部雷达，改用真实位置、真实类型和 0 位置误差；连续情报质量只剩范围估算可能受益。
- Tier 2 的 `TOTAL INTEL` 会显示真实雷达位置、类型、覆盖、扫描、Contact、Belief、Commander 和 Operator；范围估算也被真实范围替代。
- 正常任务网络最多完成两次 INTEL，因此 `+24%` 上限无法通过正式流程达到，实际最高只有 `+20%`。

结论：第一次 INTEL 后，连续情报质量的大部分作用已经被 Tier 1 覆盖；第二次 INTEL 后，原本影响全部被 Tier 2 的真实态势覆盖。继续同时保留百分比成长和权限成长会增加数据、文案与测试复杂度，却不再形成独立决策价值。

## 推荐探索方向

将 INTEL 简化为纯权限成长，不再维护跨任务情报质量百分比：

| 权限 | 玩家获得的信息 |
|---|---|
| `0/2 LIMITED` | 使用固定参数生成有限雷达情报：可能遗漏雷达，位置与范围存在确定性误差 |
| `1/2 VERIFIED` | 全部雷达位置与类型准确；覆盖范围仍沿用有限情报的估算结果，不公开真实扫描和敌方内部状态 |
| `2/2 TOTAL INTEL` | 显示真实范围、真实扫描、Contact、Belief、Commander 和 Operator |

INTEL 任务本身不再发放 `+10%` 数值，只负责把权限从 `0 → 1 → 2`。第一次与第二次奖励仍然明显，但不再出现一个很快失效的附属百分比。

## 预期数据模型调整

### 删除跨任务字段

```diff
 export interface RunResources {
   enemyAlert: number;
-  intelAccuracyBonus: number;
 }
```

```diff
 export const campaignBalance = {
-  intelAccuracyGain: 0.1,
-  intelAccuracyBonusCap: 0.24,
 };
```

任务结算不再修改情报百分比：

```diff
 resources: {
   ...state.resources,
   enemyAlert: nextAlert,
-  intelAccuracyBonus: Math.min(...),
 }
```

旧存档中的 `intelAccuracyBonus` 可在读取时直接忽略，无需提升存档版本，也不需要迁移为其他资源。

### 移除程序生成的连续情报精度

推荐彻底删除以下字段，避免系统只是从“全局加成”退化成仍然难以解释的随机百分比：

```diff
 export interface GeneratedMissionContent {
-  intelAccuracy: number;
 }

 export interface MissionSession {
-  intelAccuracy: number;
 }

 export interface CampaignNode {
   preview: {
-    intelAccuracy: number;
   };
 }
```

任务网络预览中的“情报可信度 XX%”一并移除，因为它不再对应任何可成长、可比较的玩家资源。

### 有限情报生成接口

将连续参数接口：

```diff
-generateRadarIntel(missionSeed, radars, intelAccuracy)
+generateLimitedRadarIntel(missionSeed, radars)
```

Tier 0 使用一组集中配置的固定基线，例如：

- 发现概率基线。
- 位置误差半径区间。
- 范围误差比例。
- `CONFIRMED / PROBABLE / POSSIBLE` 的确定性分布。

随机结果仍由 `<Mission Seed>:INTEL:<Radar ID>` 决定，因此相同 OPERATION CODE、Run 历史和节点仍可完整复现。这里的“固定”指规则参数固定，不是每张地图得到完全相同的雷达遗漏和误差。

Tier 1 继续复用同一份 Tier 0 报告中的 `estimatedRange`，只覆盖：

```diff
 radarType: 真实类型
 estimatedPosition: 真实位置
 positionErrorRadius: 0
 level: CONFIRMED
```

这样第一次 INTEL 的边界仍然明确：坐标与型号核实完成，但雷达实际功率和覆盖范围仍是估计。

Tier 2 不修改情报报告本身，只授予真实敌方态势显示权限。关闭 `TOTAL INTEL` 时仍可回看 Tier 1 的估算范围。

## UI 与文案调整

- 任务网络顶部继续只显示 `INTEL ACCESS 0/2、1/2、2/2`，不恢复 `INTEL QUALITY`。
- 删除任务预览中的“情报可信度 XX%”。
- 删除任务内部 `MISSION INTEL` 的“情报精度 XX%”。
- 保留“已知雷达情报”和“未定位信号”，因为 Tier 0 仍可能遗漏雷达。
- INTEL 任务说明统一为：第一次核实雷达坐标与型号，第二次授权完整敌方态势。
- README、机制手册和 AGENTS.md 删除 `+10%`、`+20%`、`24%`、`68%–94%` 与 `99%` 等连续精度说明。

## 预期收益

- INTEL 奖励只保留一条可理解的权限进度，不再同时维护百分比与层级。
- 第一次和第二次 INTEL 都有明确且不重叠的价值。
- 删除无法通过正常流程达到的 24% 上限。
- 减少 `RunResources`、Mission、Campaign Preview 和生成器之间的耦合。
- 玩家不再看到“情报可信度”与实际已精确坐标互相矛盾的状态。

## 风险与待验证点

- Tier 0 不再因任务 Seed 获得不同的总体情报精度，地图间差异只来自逐雷达确定性误差；需要验证是否降低 Run 的多样性。
- 固定有限情报参数需要重新校准，避免 Tier 0 经常遗漏过多雷达或几乎不遗漏。
- Tier 1 若某部雷达原始报告没有 `estimatedRange`，需要明确继续显示“范围未知”，不能因为坐标核实而泄露真实范围。
- 已保存的历史复盘应继续读取当时冻结的雷达情报；删除字段时不能破坏旧复盘渲染。

## 备选的最小改动方案

如果后续验证认为 Tier 0 仍需要任务级情报差异，可以只删除 `RunResources.intelAccuracyBonus` 和 INTEL 的 `+10%` 奖励，但保留 Seed 生成的基础 `intelAccuracy`。这种方案改动较小，却仍保留一个不直接受玩家控制的“情报可信度”百分比。

推荐优先探索完整移除方案，因为它的数据边界最清晰；最小方案仅作为风险回退。

## 建议验收用例

- 未完成 INTEL：相同 Seed 的遗漏、位置误差和范围误差可复现。
- 第一次 INTEL：全部雷达位置和类型准确，位置误差为 0，范围仍为估算或未知。
- 第二次 INTEL：`TOTAL INTEL` 显示真实范围和完整敌方内部状态。
- 任务网络与任务面板不再出现任何情报质量百分比。
- 旧存档包含 `intelAccuracyBonus` 时仍能恢复，并安全忽略旧字段。
- INTEL 权限、锁定任务预览、任务视角复盘和全景复盘行为保持正确。
- `npm run typecheck`、`npm run test` 和 `npm run build` 全部通过。
