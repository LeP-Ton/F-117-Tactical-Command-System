# 统一撤离区与地图目标标签字号

## 背景与目标
- 撤离区标签使用 `15px`，大于雷达与打击目标标签的 `12px`，在缩小后的撤离区内显得拥挤。
- 将撤离区标签字号统一到地图目标标注层级，同时保持居中位置和区域尺寸不变。

## 约束与原则
- 不改变撤离区位置、范围、成功判定或雷达净空。
- 不改变标签文字、颜色和居中方式。
- 仅统一 Canvas 字号。

## 阶段与 TODO
- [x] 将撤离区标签从 `15px` 调整为 `12px`。
- [x] 在实际地图中确认标签仍保持水平、垂直居中。
- [x] 运行类型检查、全量测试和生产构建。

## 当前进展
- 撤离区、雷达和打击目标标签均使用 `12px monospace`。
- 标签在 `100×100 u` 撤离区内具有充足留白。
- 31 个测试文件、147 项测试与生产构建全部通过。

## 代码变更

### `src/ui/TacticalMap.tsx`
```diff
       context.strokeRect(extractionArea.x, extractionArea.y, extractionArea.width, extractionArea.height);
       context.fillStyle = "#60c8a6";
-      context.font = "15px monospace";
+      context.font = "12px monospace";
       context.textAlign = "center";
       context.textBaseline = "middle";
```

## 测试用例

### TC-001 标签字号与居中
- 类型：浏览器视觉测试
- 优先级：高
- 操作步骤：进入任务规划地图并观察东北撤离区。
- 预期结果：撤离区标签与雷达、打击目标字号一致，并保持矩形中心对齐。
- 是否通过：通过。

### TC-002 工程验证
- 类型：自动化测试
- 优先级：高
- 执行命令：`npm run typecheck`、`npm run test`、`npm run build`。
- 预期结果：全部通过。
- 是否通过：通过；31 个测试文件、147 项测试全部通过，生产构建完成。
