# 统一战术工作区左右面板宽度

## 背景与目标
- 战术工作区左侧控制面板宽度为 `290px`，右侧态势面板宽度为 `270px`，两侧并不对称。
- 将右侧面板调整为与左侧相同的 `290px`，中间地图继续自适应占据剩余宽度。
- 使用单一 CSS 变量约束左右列宽，避免后续只修改一侧再次造成不一致。

## 实现结果
- `.workspace` 新增 `--tactical-sidebar-width: 290px`。
- 左右网格列均引用该变量，实际宽度统一为 `290px`。
- 中间地图列仍为 `minmax(500px, 1fr)`，页面整体缩放和侧栏内部滚动规则不变。

## 代码变更

### `src/ui/styles.css`
```diff
@@
-.workspace { flex: 1 1 auto; width: 100%; height: auto; min-height: 0; display: grid; grid-template-columns: 290px minmax(500px, 1fr) 270px; overflow: hidden; }
+.workspace { --tactical-sidebar-width: 290px; flex: 1 1 auto; width: 100%; height: auto; min-height: 0; display: grid; grid-template-columns: var(--tactical-sidebar-width) minmax(500px, 1fr) var(--tactical-sidebar-width); overflow: hidden; }
```

## 测试用例

### TC-001 左右面板等宽
- 类型：样式检查。
- 优先级：高。
- 操作：检查 `.workspace` 的网格列定义。
- 预期：第一列和第三列均引用 `--tactical-sidebar-width`，变量值为 `290px`。
- 是否通过：通过。

### TC-002 中间地图自适应
- 类型：回归检查。
- 优先级：中。
- 操作：检查 `.workspace` 的中间列定义。
- 预期：中间列仍为 `minmax(500px, 1fr)`。
- 是否通过：通过。

### TC-003 工程验证
- `npm run typecheck`：通过。
- `npm run test -- --run`：32 个测试文件、153 项测试全部通过。
- `npm run build`：通过，Vite 完成 81 个模块的生产构建。
