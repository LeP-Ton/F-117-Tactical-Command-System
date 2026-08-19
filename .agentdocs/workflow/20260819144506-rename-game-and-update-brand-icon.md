# 游戏品牌更名与 F-117 图标更新

## 背景与目标
- 将游戏正式名称统一为 `F-117 Tactical Command System（F-117 战术指挥系统）`。
- 将左上角 `ZR` 菱形文字标记替换为 F-117 侧面矢量剪影。

## 约束与原则
- 机型名称依据游戏主题统一采用 `F-117`；用户描述中的 `F-177` 按笔误处理。
- 图标使用内联 SVG，避免新增位图资源，并保证不同显示缩放比例下清晰。
- 保持现有顶部栏高度和交互逻辑不变。

## 阶段与 TODO
- [x] 更新浏览器页面标题与顶部品牌文案。
- [x] 更新项目包名、README 和机制手册标题。
- [x] 将 ZR 标记替换为 F-117 侧面矢量剪影。
- [x] 更新项目核心认知与文档索引。
- [x] 完成类型检查、自动化测试与生产构建验证。

## 关键风险
- 更长的英文品牌名可能在较窄视口中占用更多顶部栏空间。
- SVG 为风格化侧面剪影，用于品牌识别，不作为飞机结构的工程制图。

## 代码变更
- `src/ui/App.tsx`
```diff
-          <div className="brand-mark">ZR</div>
+          <div className="brand-mark" aria-label="F-117 侧面剪影">
+            {/* 使用矢量轮廓保证战术界面在不同缩放比例下保持清晰。 */}
+            <svg viewBox="0 0 96 40" role="img" aria-hidden="true">
+              <path d="M3 25.2 21.5 20l9.8-9.8h10.5l7.1 5.9 31.7 3.2 12.4 5.9-40.7 1.6-14.7 6.8H25.4l5.8-7.2L3 25.2Z" />
+              <path d="m42.6 15.8 6.5-10.2h7.3l-1.6 11.1M20.4 20.3l-7.1-5.7h7.8l9.4 2.1" />
+            </svg>
+          </div>
-            <h1>ZERO RETURN</h1>
-            <p>F-117 战术航线规划系统 // PHASE 12</p>
+            <h1>F-117 TACTICAL COMMAND SYSTEM</h1>
+            <p>F-117 战术指挥系统 // PHASE 12</p>
```
- `src/ui/styles.css`
```diff
-.brand-mark { width: 40px; height: 40px; display: grid; place-items: center; color: #07100e; background: #d3a744; font-weight: 900; clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); }
-.brand-block h1 { margin: 0; color: #f0c15d; font-size: 21px; letter-spacing: 0.2em; }
+.brand-mark { width: 64px; height: 40px; display: grid; place-items: center; color: #d3a744; }
+.brand-mark svg { width: 100%; height: 100%; overflow: visible; }
+.brand-mark path:first-child { fill: currentColor; }
+.brand-mark path:last-child { fill: none; stroke: #f0c15d; stroke-width: 2.2; stroke-linecap: square; stroke-linejoin: bevel; }
+.brand-block h1 { margin: 0; color: #f0c15d; font-size: 18px; letter-spacing: 0.12em; }
```
- `index.html`
```diff
-    <title>ZERO RETURN</title>
+    <title>F-117 Tactical Command System（F-117 战术指挥系统）</title>
```
- `package.json`、`package-lock.json`
```diff
-  "name": "zero-return",
+  "name": "f117-tactical-command-system",
```
- `README.md`
```diff
-# ZERO RETURN
+# F-117 Tactical Command System（F-117 战术指挥系统）
```
- `docs/game-mechanics.md`
```diff
-# 《F-117：夜鹰航线》游戏机制手册
+# 《F-117 Tactical Command System（F-117 战术指挥系统）》游戏机制手册
```
- `AGENTS.md`
```diff
-- 项目名称：`f117-nighthawk-route`（中文名：`F-117：夜鹰航线`）。
+- 项目名称：`F-117 Tactical Command System`（中文名：`F-117 战术指挥系统`，包名：`f117-tactical-command-system`）。
```
- `.agentdocs/index.md`
```diff
+`workflow/20260819144506-rename-game-and-update-brand-icon.md` - 会话-2：游戏更名为 F-117 Tactical Command System（F-117 战术指挥系统），并将左上角 ZR 菱形标记替换为 F-117 侧面矢量剪影；核对品牌名称或顶部图标时读取。
-- 项目正式目录名为 `f117-nighthawk-route`。
-- 项目中文名为 `F-117：夜鹰航线`。
+- 项目名称为 `F-117 Tactical Command System`，中文名为 `F-117 战术指挥系统`，包名为 `f117-tactical-command-system`。
```

## 测试用例
### TC-001 品牌名称统一
- 类型：静态检查
- 优先级：高
- 操作步骤：检索旧品牌名称与旧包名。
- 预期结果：运行时代码及当前核心文档不再出现旧品牌名称与旧包名。
- 是否通过：通过；旧品牌名称与旧包名在运行时代码及当前核心文档中无残留。

### TC-002 顶部图标显示
- 类型：视觉测试
- 优先级：高
- 前置条件：启动本地开发服务器。
- 操作步骤：打开游戏，查看左上角品牌区域。
- 预期结果：显示金色 F-117 侧面剪影，不再显示 ZR 菱形标记；顶部栏不溢出。
- 是否通过：待人工验证；浏览器控制技能未连接到可用浏览器，未能执行截图核验。

### TC-003 工程回归
- 类型：自动化测试
- 优先级：高
- 操作步骤：依次执行 `npm run typecheck`、`npm run test` 与 `npm run build`。
- 预期结果：所有命令成功完成。
- 是否通过：通过；类型检查成功，18 个测试文件共 79 项测试通过，生产构建成功。
