# 完整游戏机制手册

## 背景与目标
- 现有 README 只能提供快速上手，雷达动作、敌方认知和 Campaign 效果分散在阶段变更记录中。
- 新增一份面向玩家和测试人员的完整机制手册，并以当前代码行为为准修正过时说明。

## 约束与原则
- 只记录当前已经实现的行为，未实现机制单独列出。
- 清晰区分玩家雷达情报、敌方 Radar Contact 和 AI DEBUG 内部状态。
- `.agentdocs/workflow` 继续作为开发变更记录，不承担玩家手册职责。

## 阶段与 TODO
- [x] 核对 Radar Operator、Sensor、Belief、Awareness、Commander 与 Campaign 源码。
- [x] 创建完整游戏机制手册。
- [x] 在 README 与根索引中增加入口。
- [x] 修正 README 中过时的调试开关与黄色标记描述。

## 代码变更
- `docs/game-mechanics.md`
```diff
+# 《F-117：夜鹰航线》游戏机制手册
+
+## 1. 游戏目标
+## 2. 玩家能看到什么
+### 2.1 正常视图：有限情报
+### 2.2 情报精度
+### 2.3 AI DEBUG
+## 3. 雷达如何探测飞机
+## 4. Radar Contact 与敌方认知
+## 5. 雷达的四种动作
+### 5.1 WIDE_SEARCH：广域搜索
+### 5.2 SECTOR_SEARCH：扇区搜索
+### 5.3 FOCUSED_TRACK：聚焦跟踪
+### 5.4 SHUTDOWN：静默关机
+## 6. Belief Map 与 Enemy Awareness
+## 7. Air Defense Commander
+### 7.1 Commander Doctrine
+### 7.2 指挥链效率
+## 8. Campaign 与持久效果
+## 9. 当前奖励与 Build 状态
+## 10. 航线规划建议
+## 11. 当前尚未实现
```
- `README.md`
```diff
+完整规则、雷达动作、敌方认知链与 Campaign 持久效果参见[游戏机制手册](docs/game-mechanics.md)。
@@
-雷达扫描线经过飞机时会按距离、朝向与地形遮蔽计算探测概率。黄色误差圈表示 Radar Contact（雷达接触）的估算位置，不代表敌方获得了飞机真实坐标。
+雷达扫描线经过飞机时会按距离、朝向、地形遮蔽与天气计算探测概率。默认视图中的黄色区域表示玩家对敌方雷达的有限情报；敌方获得的 Radar Contact 只在 AI DEBUG 中显示。
@@
-每台雷达会根据自己的 Contact 证据在广域搜索、扇区搜索、聚焦跟踪和静默关机间切换。右侧调试面板显示当前模式与 W/S/F/X 效用评分。
+每台雷达会根据自己的 Contact 证据在广域搜索、扇区搜索、聚焦跟踪和静默关机间切换。开启 AI DEBUG 后，右侧调试面板会显示当前模式与 W/S/F/X 效用评分。
@@
-敌方会把所有 Radar Contact 融合进 24×24 Belief Map。点击地图右上角 `BELIEF DEBUG` 可以显示或隐藏概率热力图；失去接触后，热区会沿估计运动方向扩散并衰减。
+敌方会把所有 Radar Contact 融合进 24×24 Belief Map。点击地图右上角 `AI DEBUG` 可以显示或隐藏敌方内部状态；失去接触后，热区会沿估计运动方向扩散并衰减。
```
- `.agentdocs/index.md`
```diff
+`../docs/game-mechanics.md` - 当前版本完整游戏机制手册；需要理解玩家目标、有限情报、雷达动作、敌方认知、Commander 和 Campaign 规则时优先读取。
+`workflow/20260818174200-game-mechanics-manual.md` - 会话-76：新增完整游戏机制手册并修正 README 过时描述；需要追溯机制文档结构与入口调整时读取。
```

## 测试用例
### TC-001 文档结构检查
- 类型：文档检查
- 操作：检查手册是否覆盖目标、情报、探测、Contact、雷达动作、Belief、Awareness、Commander、Campaign、奖励状态与未实现边界。
- 预期：所有机制均有独立章节。
- 是否通过：是。

### TC-002 术语一致性检查
- 类型：静态检索
- 操作：检索 README 和手册中的 `BELIEF DEBUG`、`AI DEBUG`、四种雷达模式及黄色标记说明。
- 预期：界面开关统一为 AI DEBUG，玩家情报与敌方 Contact 不混淆。
- 是否通过：是。
