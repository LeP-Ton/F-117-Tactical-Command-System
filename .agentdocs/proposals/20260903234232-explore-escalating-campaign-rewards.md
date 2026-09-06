# 探索方案：带敌方升级反馈的任务奖励系统

> 状态：历史探索方案。该体系曾作为当前实现运行，现因任务奖励精简而退出正式规则；本文仅用于复盘、比较或未来重新设计，不代表当前游戏行为。

## 探索目标
- 让每次任务选择同时产生玩家侧长期收益和敌方侧长期反应，形成贯穿整个 Run 的双向升级。
- 让 Final Strike（最终打击）的防空体系由任务成果、失败代价和实际飞行历史共同塑造。
- 保持敌方不作弊：适应系统只分析已经飞过的真实轨迹，不读取未来计划航点。

## 任务网络与直接收益
- 任务网络固定为三个顺序二选一阶段与 Final Strike。
- 只有摧毁目标并成功撤离才完成节点、关闭同层选择并解锁下一层；失败节点可重试，同层备选仍可改选。
- `INTEL`（情报行动）：第一次完成后，后续任务补齐全部雷达并精确核实坐标与型号；第二次完成后授权 `TOTAL INTEL`（全域情报），显示真实雷达覆盖、Contact、Belief Map 和敌方 AI 内部态势。
- `STRIKE`（打击）：每次成功使所有后续雷达扫描速率乘以 `0.90`，同时影响地图波束运动和 Radar Sensor 实际扫描周期；最低为 `0.65`。
- `SEAD`（防空压制）：每次成功使后续雷达覆盖乘以 `0.90`；最低为 `0.55`，但不阻止最终目标区后备火控雷达上线。
- `COMMAND STRIKE`（指挥打击）：每次成功使后续 Commander 协调能力乘以 `0.65`；最低为 `0.45`，同时削弱协同搜索、Contact 共享和联合跟踪。
- `FINAL STRIKE`：对最终目标实施纵深精确打击，成功后结束本次 Run。

## Enemy Alert：跨任务敌方警戒
- 初始值为 `0`，范围为 `0–100`，不会自然下降。
- 任意任务成功后增加 `2`，失败后增加 `10`。
- 准备后续任务或失败重试时，基础雷达范围乘以 `1 + Enemy Alert / 250`；该倍率与 SEAD 覆盖修正相乘。
- Enemy Alert ≥ `15` 时，Final Strike 增加一部 `ALERT-GUARD` Early Warning（远程预警）雷达。
- `ALERT-GUARD` 的范围还会乘以 `1 + min(0.18, Enemy Alert / 500)`。
- Enemy Alert 不等于单任务 Awareness（态势警戒）或 THREAT WARNING（威胁告警）：前者跨任务改变部署，后两者只描述当前任务状态。

## Enemy Adaptation：历史航迹适应
- 任务执行时按至少 `20 u` 的位移间隔记录真实已飞轨迹 `flightPath`。
- 成功任务以 `1.0` 权重写入画像，失败任务以 `0.5` 权重写入画像；少于两个有效轨迹点时不更新。
- 画像记录三类特征：地形利用率、南北航路偏好、直达目标倾向。
- 显著特征阈值：地形利用率 ≥ `0.35`；南北偏差 `|southernRouteBias - 0.5| ≥ 0.08`；直达倾向 ≥ `0.72`。
- 0/1/2/3 个显著特征对应部署强度 `0% / 22% / 32% / 42%`，界面状态对应 `LOW / ACTIVE / HIGH / HIGH`。
- 后续普通任务可根据画像移动雷达到山地出口、偏好航路或直达轴线；唯一承担目标防御的 Fire Control（火控）雷达不得移动。
- 累计观察权重至少为 `2` 且形成至少两项显著特征时，Final Strike 增加一部沿历史南北航路部署的 `ADAPT-GUARD` Acquisition（搜索截获）雷达。

## Final Strike 组装顺序
1. 生成 Seed 决定的基础地形、天气、目标和雷达网络。
2. 应用 SEAD 的 Radar Coverage（雷达覆盖）修正。
3. 应用 Enemy Alert 的雷达范围增幅。
4. 应用 Enemy Adaptation 的普通任务反制移位。
5. Final Strike 固定增加目标区 `FINAL-GUARD` Fire Control 雷达。
6. 根据 Enemy Alert 决定是否增加 `ALERT-GUARD`。
7. 根据历史画像决定是否增加 `ADAPT-GUARD`。
8. 执行撤离区净空和目标区最低 Fire Control 覆盖约束。
9. 针对最终雷达部署重新生成玩家侧有限情报。
10. 将 STRIKE 扫描速率和 COMMAND STRIKE 协调修正写入任务会话。

## 原实现边界
- `RunState.resources.enemyAlert` 保存跨任务警戒。
- `PersistentEnemyState.tacticalProfile` 保存玩家历史画像。
- `MissionSession.flightPath` 保存当前任务的实际飞行轨迹。
- `MissionSession.adaptationNotes` 保存反制部署说明。
- `src/domain/enemyAdaptation.ts` 负责画像分析、特征评估和普通任务雷达移位。
- `src/domain/finalStrike.ts` 负责 `FINAL-GUARD`、`ALERT-GUARD` 与 `ADAPT-GUARD`。
- `src/game/gameReducer.ts` 在任务准备和结算阶段串联警戒、画像及四类直接收益。

## 观察到的问题
- 玩家完成任务同时获得直接收益并必然推高 Enemy Alert，奖励与惩罚被绑在同一个结算点，增加理解成本。
- Enemy Alert、Radar Coverage、Radar Scan、Command Link 和 Enemy Adaptation 同时出现在任务网络顶部，战略状态过多。
- 失败已经需要重试，又会显著扩大后续雷达范围并留下半权重画像，可能形成滚雪球惩罚。
- Enemy Adaptation 的反制移位会改变 Seed 基础部署，削弱玩家对任务奖励因果关系的直接判断。
- Final Strike 同时混合固定守卫、Alert 增援和画像增援，难以区分挑战来自任务选择还是自动升级。

## 未来重新探索的前置问题
- 是否能用单一、可预测的压力资源取代 Enemy Alert 与画像系统，而不与任务直接收益重复？
- 敌方变化是否应该来自玩家主动选择的高风险节点，而不是所有成功和失败的自动结算？
- 若重新引入历史学习，应优先提供玩家可观察、可反制的信号，而不是只改变下一张地图的雷达位置。
- Final Strike 的变化是否应完全由已完成任务类型决定，从而保持清晰的因果链？

## 恢复参考
- 历史实现记录：`workflow/20260826223103-balance-campaign-mission-effects.md`。
- STRIKE 扫描收益记录：`workflow/20260826225554-strike-scan-rate-and-system-docs.md`。
- Enemy Adaptation 初始实现：`workflow/20260818194100-phase-11-enemy-adaptation.md`。
- Final Strike 初始实现：`workflow/20260818195200-phase-12-final-strike.md`。
- 如需恢复，不应直接复制旧代码；应先根据当前状态模型、存档兼容和 UI 信息密度重新评审边界。
