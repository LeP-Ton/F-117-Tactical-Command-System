# 会话-1：ZERO RETURN Phase 0+1 航线规划原型

## 背景与目标
- 按 `.temp/plan.md` 从 Phase 0 开始实施，本轮完成 Phase 0+1。
- 建立可扩展的 Roguelike 状态边界，以及可操作的 2D 航线规划和自动驾驶原型。

## 约束与原则
- `RunState` 与 `MissionSession` 严格分离，Canvas 不持有领域状态。
- 不提前实现雷达、Belief Map、Commander AI、攻击和 Campaign Map。
- 当前仅适配桌面浏览器与鼠标操作。

## 阶段与 TODO
- [x] 建立 React、TypeScript、Vite 和 Vitest 工程。
- [x] 实现 Run、Campaign、Mission、SeededRandom 和 EventBus。
- [x] 实现航点编辑、自动驾驶、暂停重规划和重置。
- [x] 实现 Canvas 战术地图、遥测和结构化事件界面。
- [x] 完成类型检查、测试、构建和本地服务响应验证。

## 关键风险
- 当前浏览器控制通道无可用实例，Canvas 视觉与鼠标交互仍需人工验收。
- `npm install` 报告 5 个第三方依赖漏洞；未执行可能引入破坏性升级的 `npm audit fix --force`。
- Phase 2 必须继续遵守 Reality → Sensor → Contact → AI，禁止 AI 读取玩家真实位置。

## 当前进展
- Phase 0+1 已完成，5 个测试文件共 10 个测试全部通过。
- TypeScript 类型检查、Vite 生产构建和本地服务响应验证通过。

## 代码变更

- 工程配置（新增）
```diff
+ package.json：定义 React/Vite/TypeScript/Vitest 依赖和 dev、typecheck、test、build 命令。
+ package-lock.json：由 npm 10.8.2 根据 package.json 生成依赖锁定结果。
+ tsconfig.json、tsconfig.app.json、tsconfig.node.json：启用严格类型检查和项目引用。
+ vite.config.ts：接入 React 与 jsdom 测试环境。
+ index.html、.gitignore：增加 Web 入口与产物忽略规则。
```

- 核心领域（新增）
```diff
+ src/config/gameConfig.ts：集中定义 1000×1000 地图、速度、时间步长和交互参数。
+ src/core/SeededRandom.ts：实现基于字符串 Seed 的 Mulberry32 可复现随机数。
+ src/core/EventBus.ts：实现可订阅、发布和取消订阅的类型安全事件总线。
+ src/domain/types.ts：新增 Run、Campaign、Mission、Aircraft、Route、Waypoint、GameEvent 类型。
+ src/domain/route.ts：实现航点添加、移动、删除、排序、世界边界限制和编辑锁定。
+ src/domain/autopilot.ts：实现位置插值、航向计算、多航段消费和路线完成判定。
+ src/domain/factories.ts：实现 Run、Mission 和结构化事件工厂。
```

- 游戏状态与界面（新增）
```diff
+ src/game/gameReducer.ts：统一处理规划、执行、暂停、重规划、时间推进和重置。
+ src/game/useGameController.ts：连接 reducer、requestAnimationFrame 游戏循环和 EventBus。
+ src/ui/TacticalMap.tsx：绘制战术网格、撤离区、路线、航点和 F-117，处理点击与拖动。
+ src/ui/ControlPanel.tsx：实现任务控制、航点列表、排序和删除操作。
+ src/ui/App.tsx：组装运行信息、战术地图、遥测和事件日志。
+ src/ui/styles.css：实现军用战术终端风格和桌面布局。
+ src/main.tsx：挂载 React 应用。
```

- 测试与文档（新增/更新）
```diff
+ src/core/*.test.ts：覆盖 Seed 和 EventBus。
+ src/domain/*.test.ts：覆盖航线约束与自动驾驶。
+ src/game/gameReducer.test.ts：覆盖暂停重规划和 Run/Mission 状态隔离。
+ README.md：记录运行、玩法、阶段边界和架构。
- AGENTS.md：项目无业务源码、无技术栈、无运行入口。
+ AGENTS.md：记录 Phase 0+1 状态、Web 技术栈、分层架构和运行命令。
+ .agentdocs/index.md：登记本变更文档和关键架构记忆。
```

## 测试用例

### TC-001 Seed 与事件基础设施
- 操作：运行 SeededRandom 和 EventBus 单元测试。
- 预期：相同 Seed 序列一致；事件可发布并取消订阅。
- 是否通过：通过。

### TC-002 航线与自动驾驶
- 操作：测试航点增删改排序、锁定约束、位置推进和多航段完成。
- 预期：未来航点可编辑，已执行航点锁定，低帧率下不会跳过逻辑。
- 是否通过：通过。

### TC-003 暂停重规划与状态隔离
- 操作：规划、开始、暂停、修改未来路线、继续，并检查 Run/Campaign。
- 预期：暂停时不移动，继续执行新路线，Mission 更新不破坏 Run/Campaign。
- 是否通过：通过。

### TC-004 质量门禁
- 操作：执行 `npm run typecheck`、`npm run test`、`npm run build`。
- 预期：类型检查通过、10 个测试通过、生产构建成功。
- 是否通过：通过。

### TC-005 浏览器交互
- 操作：在桌面浏览器验证添加、拖动、排序、删除、开始、暂停、继续和重置。
- 预期：Canvas、控制面板和遥测同步，缩放后世界坐标一致。
- 是否通过：通过（用户于后续会话确认测试正常运行）。
