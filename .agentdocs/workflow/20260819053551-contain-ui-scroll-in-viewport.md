# 将战术 UI 与滚动限制在视口内

## 背景与目标
- 上一版仅固定 `.workspace` 高度，但根节点与 `.app-shell` 仍可被内容撑高，无法彻底阻止全局滚动。
- 本次将整个应用固定在视口内，顶栏占用固定高度，战术工作区使用剩余空间。
- 左右面板超出部分只在面板内部滚动，地图尺寸不受 AI DEBUG 内容影响。

## 约束与原则
- 禁止 `html/body/#root` 产生全局滚动。
- Campaign 页面若内容超高，在 Campaign 容器内部滚动。
- 战术地图、左右面板始终处于当前视口范围。
- 保留低高度窗口的 62px 顶栏布局。

## 阶段与 TODO
- [x] 固定根节点与应用外壳尺寸。
- [x] 固定顶栏 flex 占位，防止被压缩。
- [x] 工作区使用剩余高度并隐藏外溢。
- [x] 左右面板限制高度并独立滚动。
- [x] Campaign 改为容器内部滚动。
- [x] 完成类型检查、测试和生产构建。

## 代码变更

### `src/ui/styles.css`
```diff
 * { box-sizing: border-box; }
 
-body { margin: 0; min-width: 1080px; min-height: 100vh; background: radial-gradient(circle at 50% 20%, #10201b 0%, #050a09 55%); }
+html, body, #root { width: 100%; height: 100%; overflow: hidden; }
+body { margin: 0; min-width: 1080px; background: radial-gradient(circle at 50% 20%, #10201b 0%, #050a09 55%); }
 button { font: inherit; }
 
-.app-shell { min-height: 100vh; display: flex; flex-direction: column; }
-.topbar { height: 76px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #24463c; background: rgba(5, 12, 10, 0.92); }
+.app-shell { width: 100%; height: 100vh; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
+.topbar { flex: 0 0 76px; height: 76px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #24463c; background: rgba(5, 12, 10, 0.92); }

-.workspace { flex: 1; height: calc(100vh - 76px); min-height: 0; display: grid; grid-template-columns: 290px minmax(500px, 1fr) 270px; overflow: hidden; }
-.control-panel, .telemetry-panel { min-height: 0; overflow-y: auto; background: rgba(7, 16, 14, 0.86); }
+.workspace { flex: 1 1 auto; width: 100%; height: auto; min-height: 0; display: grid; grid-template-columns: 290px minmax(500px, 1fr) 270px; overflow: hidden; }
+.control-panel, .telemetry-panel { height: 100%; min-height: 0; max-height: 100%; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; background: rgba(7, 16, 14, 0.86); }

-.map-stage { position: relative; min-height: 0; overflow: hidden; background: #07100e; }
+.map-stage { position: relative; height: 100%; min-height: 0; overflow: hidden; background: #07100e; }

-.campaign-screen { min-height: calc(100vh - 76px); padding: 24px; background: radial-gradient(circle at 45% 45%, #10231d, #050b09 70%); }
+.campaign-screen { flex: 1 1 auto; height: auto; min-height: 0; padding: 24px; overflow: auto; overscroll-behavior: contain; background: radial-gradient(circle at 45% 45%, #10231d, #050b09 70%); }

 @media (max-height: 760px) {
-  .topbar { height: 62px; }
-  .workspace { height: calc(100vh - 62px); }
+  .topbar { flex-basis: 62px; height: 62px; }
```

## 测试用例

### TC-001 右侧面板内部滚动
- 操作：进入战术地图，开启 AI DEBUG，滚动右侧区域。
- 预期：右侧内容在面板内部滚动，顶栏与地图保持固定，全局页面不滚动。
- 是否通过：待浏览器手工验证。

### TC-002 地图尺寸稳定
- 操作：反复切换 AI DEBUG ON/OFF。
- 预期：地图 Canvas 宽高和世界缩放保持一致。
- 是否通过：待浏览器手工验证。

### TC-003 Campaign 内部滚动
- 操作：在低高度窗口打开 Campaign。
- 预期：Campaign 容器内部可滚动，不产生 body 全局滚动。
- 是否通过：待浏览器手工验证。

### TC-004 全量回归
- `npm run typecheck`：通过。
- `npm run test -- --run`：20 个测试文件、84 项测试全部通过。
- `npm run build`：通过。
- `git diff --check`：通过。

## 当前进展
- 全局滚动已从 CSS 根层禁用。
- 战术左右栏和 Campaign 页面分别承担自身内容滚动。
