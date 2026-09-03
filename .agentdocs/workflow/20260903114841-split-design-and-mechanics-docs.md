# 拆分设计文档与精确机制手册并补齐英文版本

## 背景与目标
- 原 `README.md` 与 `docs/game-mechanics.md` 在任务循环、任务收益、雷达、天气、敌方指挥、适应和最终战等主题上存在约 70%–80% 的语义重复。
- 两份文档同时保存平衡数值，已经造成同一事实需要同步维护；继续增加英文版本会把维护面扩大为四份大型重复文档。
- 本次明确文档职责：README 解释设计目的、系统关系、架构和开发方式；机制手册作为精确数值、阈值、状态转换与奖励公式的唯一文档来源。
- 新增完整英文 README 与英文机制手册，并建立四份文档之间的语言导航。

## 约束与原则
- README 必须仍能让开发者完整理解任务、地图、雷达、天气、指挥、情报、适应、生成与复盘系统为什么存在和如何协作。
- README 不再重复维护会随平衡变化的百分比、距离、周期、阈值和公式。
- 机制手册必须承接从 README 删除的所有唯一数值，不得因去重丢失规则。
- 中英文文档章节结构和事实含义保持对应；英文不是摘要版。
- 本次不修改运行时代码、任务难度、Seed、存档或界面行为。

## 阶段与 TODO
- [x] 对比两份既有文档的章节与语义重叠。
- [x] 重构中文 README 为设计与开发入口。
- [x] 将精确规则集中到中文机制手册并补齐原 README 独有数据。
- [x] 新增英文 README。
- [x] 新增英文机制手册。
- [x] 在四份文档顶部增加语言与职责导航。
- [x] 更新 `AGENTS.md` 文档事实来源认知。
- [x] 更新 `.agentdocs/index.md` 的读取路由。
- [x] 验证相对链接、双语章节结构、README 数值去重和工程状态。

## 关键风险
- 只缩短 README 可能删除雷达角速度、类型倍率或固定地图坐标等原本仅存在于 README 的精确数据。
- 中英文手册若章节数量或规则值不一致，会重新形成两个事实版本。
- README 若继续出现平衡数值，后续调整仍需跨文档同步，无法真正解决重复问题。
- 文档内语言切换说明必须与刚实现的弹窗选择交互保持一致。

## 当前进展
- 中文与英文 README 均为 291 行，章节结构一一对应；中文 README 从 564 行降至 291 行。
- 中文与英文机制手册均为 390 行，14 个一级规则章节及全部子章节一一对应。
- README 已不包含可变平衡百分比、距离、秒数和小数参数，只保留设计语义与机制手册链接。
- 机制手册新增完整探测概率公式、三类雷达广域角速度/探测倍率/Contact 精度和固定插入点、撤离区、目标生成范围，承接被 README 删除的唯一事实。
- 四份文档的相对 Markdown 链接全部存在。
- 机制手册中的语言说明已更新为当前语言选择弹窗及其关闭方式。

## 代码变更
- 本次没有运行时代码变更。

```diff
 src/**/*.ts   +0 -0
 src/**/*.tsx  +0 -0
 src/**/*.css  +0 -0
```

## 文档变更
- `README.md`：由“设计与精确规则混合文档”重构为中文设计与开发入口。

```diff
- 564 行：设计哲学、系统解释、精确数值表、阈值、公式、架构与开发命令混合维护
+ 291 行：设计哲学、系统关系、架构、开发命令和扩展边界
+ 顶部增加 [简体中文](README.md) | [English](README.en.md)
+ 所有精确数值与公式改为链接到 docs/game-mechanics.md
+ 增加“文档职责”章节，明确单一事实来源
```

- `README.en.md`：新增与中文 README 完整对应的英文设计与开发入口。

```diff
--- /dev/null
+++ b/README.en.md
@@ +1,291 @@
+# F-117 Tactical Command System
+[简体中文](README.md) | [English](README.en.md)
+
+## 1. Product Direction and Design Philosophy
+## 2. System Overview
+## 3. Single-Mission Loop
+## 4. Mission Network and Strategic Rewards
+## 5. Map, Terrain, and Dynamic Weather
+## 6. Radar, Air-Defense Command, and Engagement
+## 7. Intelligence Access and Observability
+## 8. Persistent Enemy Response and Final Strike
+## 9. Operation Code and Deterministic Generation
+## 10. Debrief, Persistence, Events, and Audio
+## 11. Code Architecture
+## 12. Development and Deployment
+## 13. Documentation Responsibilities
+## 14. Current Boundaries
```

- `docs/game-mechanics.md`：升级为中文精确规则的唯一文档来源，更新语言弹窗说明并承接去重后的唯一数值。

```diff
 # 《F-117 Tactical Command System（F-117 战术指挥系统）》游戏机制手册
 
-本文是当前版本的精确规则与数值参考；设计目标、系统哲学、架构边界和扩展原则见根目录 `README.md`。
+[简体中文](game-mechanics.md) | [English](game-mechanics.en.md)
+
+本文是当前版本精确规则、数值、阈值和状态转换的唯一文档来源；设计目标、系统哲学、架构边界和扩展原则见根目录 [README.md](../README.md)。
@@
-- 顶部语言按钮可在任何任务阶段即时切换。
+- 顶部语言按钮显示当前语言，点击后通过语言选择弹窗切换；弹窗从集中配置生成候选项，便于扩展更多语言。
+- 弹窗支持选择后关闭、点击外部关闭和 `Escape` 关闭；切换可以在任何任务阶段进行。
@@
+单次扫描的精确概率为：
+
+min(0.95,
+  0.46
+  × 雷达类型探测倍率
+  × max(0, 1 - (距离 / 真实范围)^1.7)
+  × (0.38 + sin²(飞机朝向与雷达方位夹角) × 0.92)
+  × 命中地形倍率乘积
+  × 命中天气倍率乘积
+  × 波束命中因子
+)
@@
-| 类型 | 基础覆盖 | 扫描周期 | 波束宽度 | Contact / 火控特点 |
+| 类型 | 基础覆盖 | Sensor 周期 | 广域角速度 | 波束 | 探测倍率 | Contact 精度 | 火控贡献 |
+| Early Warning | 380–470 u | 0.40 s | 28°/s | 36° | 0.82× | 0.72× | 0.55× |
+| Acquisition | 270–360 u | 0.25 s | 38°/s | 24° | 1.00× | 1.00× | 1.00× |
+| Fire Control | 180–260 u | 0.16 s | 52°/s | 12° | 1.18× | 1.35× | 1.50× |
@@
-地图固定为 `1000×1000 u`，网格间隔 `100 u`；撤离区位于东北区域。
+地图固定为 `1000×1000 u`，网格间隔 `100 u`；F-117 插入点固定为 `(90, 850)`，撤离区固定为 `(850, 30, 120×120)`，目标生成范围为 `x=400–790、y=100–390`。
```

- `docs/game-mechanics.en.md`：新增与中文机制手册逐章对应的英文精确规则手册。

```diff
--- /dev/null
+++ b/docs/game-mechanics.en.md
@@ +1,390 @@
+# F-117 Tactical Command System — Game Mechanics Manual
+[简体中文](game-mechanics.md) | [English](game-mechanics.en.md)
+
+## 1. Objective
+## 2. What the Player Can See
+## 3. Radar Detection
+## 4. Radar Contact and Enemy Knowledge
+## 5. Radar Operator Actions
+## 6. Air-Defense Engagement and Survival Pressure
+## 7. Belief Map
+## 8. Air Defense Commander
+## 9. Mission Network and Persistent Effects
+## 10. Current Progression Boundary
+## 11. Enemy Adaptation
+## 12. Route-Planning Guidance
+## 13. Final Strike
+## 14. Not Yet Implemented
```

- `AGENTS.md`：将新的文档职责写入项目检索认知。

```diff
 ## 文档与检索方法
 - 项目检索时，先读取 `.agentdocs/index.md` 根索引。
+- `README.md` 与 `README.en.md` 分别承担中英文设计哲学、系统关系、代码架构和开发入口；`docs/game-mechanics.md` 与 `docs/game-mechanics.en.md` 是中英文精确规则、数值、阈值和状态转换的唯一文档来源。README 不重复维护可变平衡数据。
```

- `.agentdocs/index.md`：登记中英文设计文档与规则手册的不同读取场景。

```diff
-`../README.md` - 当前版本主游戏设计文档；需要理解设计哲学、任务网络、地图、雷达、天气、指挥、交战、适应、确定性生成与架构边界时优先读取。
-`../docs/game-mechanics.md` - 当前版本精确规则与数值参考；需要核对玩家目标、有限情报、雷达动作、敌方认知、Commander 和任务网络规则时读取。
+`../README.md` - 中文设计与开发入口；需要理解设计哲学、系统关系、代码架构和扩展边界时读取，不作为可变平衡数值来源。
+`../README.en.md` - 与中文 README 职责一致的英文设计与开发入口；向英文开发者介绍项目时读取。
+`../docs/game-mechanics.md` - 中文精确规则、数值、阈值和状态转换的唯一文档来源；核对任务、雷达、天气、指挥、交战、生成或平衡规则时读取。
+`../docs/game-mechanics.en.md` - 与中文机制手册对齐的英文精确规则来源；向英文玩家或开发者解释当前规则时读取。
```

## 测试用例
### TC-001 README 与机制手册职责去重
- 类型：文档结构检查
- 优先级：高
- 操作步骤：扫描中英文 README 中的百分比、距离、秒数和小数平衡参数。
- 预期结果：README 不保存可变平衡数值，所有精确规则由机制手册承担。
- 是否通过：通过。

### TC-002 中英文结构对应
- 类型：文档一致性检查
- 优先级：高
- 操作步骤：分别比较中英文 README 与中英文机制手册的二级、三级标题数量。
- 预期结果：每组双语文档章节结构一致。
- 是否通过：通过，README 均为 291 行，机制手册均为 390 行。

### TC-003 文档链接有效
- 类型：链接检查
- 优先级：高
- 操作步骤：解析四份公开文档中的相对 Markdown 链接并检查目标文件是否存在。
- 预期结果：不存在失效的相对链接。
- 是否通过：通过。

### TC-004 工程回归
- 类型：自动化验证
- 优先级：中
- 操作步骤：运行 `npm run typecheck`、`npm run test -- --run` 与 `npm run build`。
- 预期结果：文档重构不影响工程状态。
- 是否通过：通过，30 个测试文件、144 个测试用例全部通过，生产构建成功。
