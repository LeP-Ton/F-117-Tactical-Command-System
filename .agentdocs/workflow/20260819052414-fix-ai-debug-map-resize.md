# 修复 AI DEBUG 切换导致战术地图尺寸变化

## 背景与目标
- 从战役防空网络进入战术地图后，切换 AI DEBUG 会追加右侧 Commander 与 Radar Operator 内容。
- 原三列 Grid 的行高由最高栏目决定，右栏变高会同步撑高地图 Canvas，导致同一 `1000×1000` 世界重新缩放。
- 目标是固定战术工作区为可视区域高度，使左右栏目内部滚动，地图尺寸不受栏目内容影响。

## 约束与原则
- 不修改 Canvas 坐标换算和游戏世界尺寸。
- 不影响 Campaign Map 的独立布局。
- 保留低高度窗口下的 62px 顶栏适配。

## 阶段与 TODO
- [x] 固定战术工作区高度并禁止外层内容撑开。
- [x] 左右面板改为独立纵向滚动。
- [x] 移除地图区域的 620px 最小高度约束。
- [x] 同步低高度媒体查询。
- [x] 完成类型检查、测试和生产构建。

## 代码变更

### `src/ui/styles.css`
```diff
-.workspace { flex: 1; min-height: calc(100vh - 76px); display: grid; grid-template-columns: 290px minmax(500px, 1fr) 270px; }
-.control-panel, .telemetry-panel { background: rgba(7, 16, 14, 0.86); }
+.workspace { flex: 1; height: calc(100vh - 76px); min-height: 0; display: grid; grid-template-columns: 290px minmax(500px, 1fr) 270px; overflow: hidden; }
+.control-panel, .telemetry-panel { min-height: 0; overflow-y: auto; background: rgba(7, 16, 14, 0.86); }

-.map-stage { position: relative; min-height: 620px; overflow: hidden; background: #07100e; }
+.map-stage { position: relative; min-height: 0; overflow: hidden; background: #07100e; }

 @media (max-height: 760px) {
   .topbar { height: 62px; }
-  .workspace { min-height: calc(100vh - 62px); }
+  .workspace { height: calc(100vh - 62px); }
 }
```

## 测试用例

### TC-001 AI DEBUG 尺寸稳定
- 前置条件：从 Campaign Map 进入战术地图。
- 操作：反复切换 AI DEBUG ON/OFF。
- 预期：地图外框和世界缩放保持一致，右侧内容独立滚动。
- 是否通过：待浏览器手工验证。

### TC-002 低高度窗口
- 前置条件：浏览器高度不超过 760px。
- 操作：进入战术地图并切换 AI DEBUG。
- 预期：工作区使用 `100vh - 62px`，无页面级纵向撑高。
- 是否通过：待浏览器手工验证。

### TC-003 全量回归
- `npm run typecheck`：通过。
- `npm run test -- --run`：20 个测试文件、84 项测试全部通过。
- `npm run build`：通过。
- `git diff --check`：通过。

## 当前进展
- CSS 布局修复已完成。
- 当前环境无可用浏览器控制实例，需在实际页面确认地图尺寸与左右栏滚动体验。
