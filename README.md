# F-117 Tactical Command System（F-117 战术指挥系统）

以 F-117 隐身攻击机为主题的 2D 动态战术航线规划游戏。当前核心变化来自程序生成地图、雷达网络、天气、敌方认知与 Campaign 防空体系。

完整规则、雷达动作、敌方认知链与 Campaign 持久效果参见[游戏机制手册](docs/game-mechanics.md)。

## 运行

```bash
npm install
npm run dev
```

生产验证：

```bash
npm run typecheck
npm run test
npm run build
```

## 当前玩法

1. 点击战术地图添加航点。
2. 拖动未执行航点调整位置，或在左侧列表中上移、下移、删除。
3. 点击“开始执行”，F-117 将自动沿路线飞行。
4. 飞行中点击“暂停 / 重规划”，修改未来航点后继续执行。
5. 点击“重置任务”恢复初始规划状态。
6. 飞抵目标攻击半径后自动投放精确制导武器。
7. 摧毁目标后进入东北撤离区完成任务；航线结束但未满足条件会失败。

顶部 `RUN SEED` 可以输入任意字符串并生成任务。相同 Seed 会复现 Terrain、Weather、Radar Network、Target 与 Intel Accuracy。

每个 Run 会生成 6–7 个分层 Campaign 节点。选择节点前可以预览雷达密度、天气、情报可信度和战略效果；完成任务后返回战役地图解锁下一层。

成功完成任务后直接返回 Campaign Map，不存在 Tactical Reward 或 Player Build 流程。

Campaign 选择会持续重构后续防空体系：Recon/ELINT 提高情报精度，SEAD 缩小雷达覆盖，Command Strike 降低雷达协调，Enemy Alert 则扩大后续雷达覆盖。

雷达扫描线经过飞机时会按距离、朝向、地形遮蔽与天气计算探测概率。默认视图中的黄色区域表示玩家对敌方雷达的有限情报；敌方获得的 Radar Contact 只在 AI DEBUG 中显示。

每台雷达会根据自己的 Contact 证据在广域搜索、扇区搜索和聚焦跟踪间切换。开启 AI DEBUG 后，右侧调试面板会显示当前模式与 W/S/F 效用评分。

敌方会把所有 Radar Contact 融合进 24×24 Belief Map。点击地图右上角 `AI DEBUG` 可以显示或隐藏敌方内部状态；失去接触后，热区会沿估计运动方向扩散并衰减。

Radar Contact 会累积任务内 Awareness（敌方警戒值）；Air Defense Commander 根据 Awareness 与 Belief 选择持续监视、协同搜索或集中搜索，并通过 Utility 偏置协调各 Radar Operator。投弹只提高 Awareness，不会把目标区当成飞机位置。雷达静默与网络静默仍未启用。

连续高质量 Contact 会依次形成疑似搜索、持续跟踪、火控锁定和导弹来袭。导弹飞行期间切断雷达新证据可使其脱锁；未能脱锁会直接摧毁飞机并结束本次 Run。

游戏使用 Web Audio API 合成 Contact、警戒升级、火控锁定、导弹来袭、脱锁、投弹、成功与失败音效。顶部 `SOUND ON/OFF` 和 `VOL` 可控制静音与总音量；浏览器会在首次点击或按键后启用音频。

任务结束后，敌方会分析已经实际飞过的航点，形成地形利用、南北航路和直达倾向画像；后续任务可能针对山地出口、偏好航路或直达轴线调整雷达部署。

Final Strike 会根据 Campaign 历史动态组装最终防空：SEAD 决定后备雷达、Enemy Alert 决定警戒增援、Enemy Adaptation 决定历史航路截击部署，Command Strike 与情报任务则继续影响指挥链和有限情报。

当前仅适配桌面浏览器和鼠标操作。

## 架构边界

- `src/core`：确定性随机数与通用事件总线。
- `src/domain`：Run、Campaign、Mission、航线和自动驾驶等纯领域逻辑。
- `src/domain/radarSensor.ts`：唯一允许读取飞机真实状态的 Sensor Simulation，并且只向后续系统输出带误差 Contact。
- `src/game`：游戏状态 reducer、事件发布与帧循环。
- `src/ui`：React 控制界面与 Canvas 战术地图。
- `src/config`：地图、飞机和交互参数。

`RunState` 与 `MissionSession` 始终分离，Campaign 和 Enemy Adaptation 不依赖 UI 重构即可演进。
