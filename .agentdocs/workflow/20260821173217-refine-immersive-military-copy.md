# 统一沉浸式军事指挥终端文案

## 背景与目标
- 项目定位为“解谜 + 动态规划”的军事模拟游戏。
- 玩家界面不应直接解释自动投弹、警戒衰减、燃油设计依据等幕后机制。
- 全量检查玩家可见文案，删减冗余提示，并把关键解谜信息改写为态势与情报语言。

## 约束与原则
- 保留影响路线决策的武器释放圈、地形遮蔽、天气衰减、雷达误差和战役效果。
- 删除操作教程、存档提示、程序生成规模和数值设计依据。
- AI DEBUG 内部诊断文案不承担玩家沉浸职责，保持调试可读性。
- 旧存档中的 `preview.effect` 可能保留旧文本，因此 Campaign UI 按任务类型使用新的固定简报。

## 分析结论
- 方案 A：只修改用户点名的五项。排除原因：同屏仍存在“点击地图”“本地自动保存”“生成规模”“PROCEDURAL”“RUN SEED”“LV”等同类元文案，口径会继续割裂。
- 方案 B：删除所有解释性信息。排除原因：会同时删除武器释放圈、遮蔽率和战役收益，破坏解谜与动态规划所需反馈。
- 采用方案 C：删除幕后规则与教程，把必要数值转换成军用态势术语，并统一战役/任务状态语气。

## 阶段与 TODO
- [x] 删除目标区自动投弹与警戒机制说明。
- [x] 删除燃油设计依据、Contact 衰减说明、路线操作教程。
- [x] 删除地图元素“点击定位”、存档状态与生成规模文案。
- [x] 将地形/天气参数改写为雷达遮蔽与信号衰减。
- [x] 将 Run/Seed/Procedural/LV 等元术语改写为作战系统术语。
- [x] 重写战役任务效果与最终目标简报。
- [x] 完成自动化、构建和浏览器文案回归。

## 关键风险
- 精简教程会提高新玩家首次上手门槛；操作方法应移入独立游戏说明书或首次进入时的非任务态引导。
- “雷达遮蔽”和“信号衰减”仍公开精确百分比，这是有意保留的规划情报，而非机制解释。

## 代码变更

### 任务控制与目标区
```diff
--- src/ui/ControlPanel.tsx
+++ src/ui/ControlPanel.tsx
-  RUNNING: "自动执行",
-  PAUSED: "暂停重规划",
+  RUNNING: "任务执行",
+  PAUSED: "航线修订",
+const statusMessages = { PLANNING: "等待航线确认", RUNNING: "航电系统在线", PAUSED: "航线编辑授权", SUCCESS: "任务目标达成", FAILED: "任务终止" };
-{mission.status === "RUNNING" ? "航电系统在线" : "等待指令"}
+{statusMessages[mission.status]}
-开始执行
+确认航线
-暂停 / 重规划
+暂停 / 修订航线
-重置任务
+重置航线
-目标已摧毁 // 前往撤离区
+目标摧毁 // 转入撤离航段
-目标仍有效 // 自动攻击待命
+目标有效 // 武器待命
-<p className="hint">进入目标半径 ... 自动投弹；攻击会显著提高敌方警戒。</p>
-<p className="hint">点击地图添加航点，拖动航点调整位置。飞行中需先暂停...</p>
```

### 遥测、燃油与威胁
```diff
--- src/ui/App.tsx
+++ src/ui/App.tsx
-<label>RUN SEED</label>
+<label>OPERATION CODE</label>
-<button>生成任务</button>
+<button>初始化战役</button>
-<dt>任务 Seed</dt>
+<dt>任务代码</dt>
-<div><dt>任务存档</dt><dd>本地自动保存</dd></div>
-<div><dt>生成规模</dt><dd>...</dd></div>
-<dt>天气减速</dt>
+<dt>气象速度损失</dt>
-<dt>敌方适应</dt><dd>LV.{adaptationLevel}</dd>
+<dt>敌方反制指数</dt><dd>{adaptationLevel}</dd>
-可用航程 ... // 满油航程等于地图两条边
+可用航程 ...
-撞击倒计时 ... // 立即改变航向并切断照射
+撞击倒计时 ... // 规避机动 · 脱离照射
-辐射威胁 ... // 失去新 Contact 后会逐步下降
+辐射威胁 ...
```

### 地图元素
```diff
--- src/ui/MapElementPanel.tsx
+++ src/ui/MapElementPanel.tsx
-<CollapsibleSection title="MAP ELEMENTS" meta="点击定位">
+<CollapsibleSection title="MAP ELEMENTS">
-己方飞机 · 点击高亮当前真实位置
+己方机位 · 航向与位置实时更新
-任务目标 · 攻击半径 ...
+指定目标 · 武器释放圈 ...
-摧毁目标后进入此区域完成撤离
+指定撤离空域
-飞行路线控制点
+导航控制点
-雷达探测系数 ... · 静态掩护区
+雷达遮蔽 ... · 地形掩护区
-探测系数 ... · 动态移动/演化
+信号衰减 ... · 动态气象单元
```

### 战役网络
```diff
--- src/ui/CampaignMap.tsx
+++ src/ui/CampaignMap.tsx
+const missionBriefings = { INTEL: "获取敌防空网电子情报...", STRIKE: "打击战役目标...", SEAD: "压制敌防空节点...", COMMAND_STRIKE: "打击敌指挥链...", FINAL_STRIKE: "对最终目标实施纵深精确打击。" };
-PROCEDURAL CAMPAIGN
+AIR CAMPAIGN
-ADAPT LV.{adaptationLevel}
+ADAPT INDEX {adaptationLevel}
-雷达密度
+预估雷达节点
-<p>{selected.preview.effect}</p>
+<p>{missionBriefings[selected.type]}</p>
-最终防空体系将在出击时根据本次 Run ... 动态组装。
+最终目标防空序列持续重构，部署态势将在出击时确认。
-RUN 已完成
+战役完成
-飞机损失 // RUN 结束
+战役终止 // 飞机损失

--- src/procedural/campaignGenerator.ts
+++ src/procedural/campaignGenerator.ts
-INTEL: "提高后续任务的雷达情报质量"
+INTEL: "获取敌防空网电子情报，提升后续目标识别质量"
-STRIKE: "直接推进战役，但不会削弱后续防空"
+STRIKE: "打击战役目标，不改变敌防空网当前战备状态"
-SEAD: "压低 Enemy Alert，削弱未来防空"
+SEAD: "压制敌防空节点，削弱后续雷达覆盖"
-COMMAND_STRIKE: "破坏指挥链，降低后续雷达协调能力"
+COMMAND_STRIKE: "打击敌指挥链，削弱后续协同搜索能力"
-FINAL_STRIKE: "完成本次 Run 的最终打击"
+FINAL_STRIKE: "对最终目标实施纵深精确打击"
```

### 项目核心认知
```diff
--- AGENTS.md
+++ AGENTS.md
+- 产品定位为解谜与动态规划导向的军事模拟游戏；玩家界面应模拟作战指挥终端，只呈现态势、情报、告警和指令，游戏机制说明、操作教程及程序生成元信息统一放入说明文档。
```

## 测试用例

### TC-001 禁止机制解释进入任务视图
- 检查目标、燃油、威胁与航点区域。
- 预期：不出现自动投弹说明、满油设计依据、Contact 衰减说明和路线操作教程。
- 是否通过：通过（浏览器 DOM 实测）。

### TC-002 保留规划情报
- 检查地图元素与任务预览。
- 预期：仍显示武器释放圈、雷达遮蔽、信号衰减、雷达位置误差和任务战略效果。
- 是否通过：通过（浏览器 DOM 实测）。

### TC-003 移除元游戏术语
- 检查顶部、Campaign 与遥测。
- 预期：不出现 `RUN SEED`、`PROCEDURAL CAMPAIGN`、`LV.0`、本地自动保存和生成规模。
- 是否通过：通过（浏览器 DOM 实测）。

### TC-004 自动化回归
- `npm run typecheck`：通过。
- `npm run test -- --run`：通过，23 个测试文件、103 项测试。
- `npm run build`：通过。
