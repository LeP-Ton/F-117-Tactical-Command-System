# 调整任务网络术语并恢复航点操作提示

## 背景与目标
- 按指定口径简化 Campaign 页面术语。
- 恢复航点编辑提示，确保首次规划操作仍然明确。

## 约束与原则
- 仅修改指定玩家可见文案，不改变 Campaign、航线编辑或任务结算逻辑。
- 航点提示使用用户指定的完整原文。

## 阶段与 TODO
- [x] “防空战役网络”改为“任务网络”。
- [x] “节点”改为“任务代号”。
- [x] “预估雷达节点”改为“预估雷达数量”。
- [x] 恢复航点添加、拖动和飞行中暂停重规划提示。
- [x] 完成类型检查、自动化测试和生产构建。

## 关键风险
- 无领域逻辑风险；仅需防止后续全局文案精简再次误删操作提示。

## 代码变更

```diff
--- src/ui/CampaignMap.tsx
+++ src/ui/CampaignMap.tsx
-        <div><span className="section-kicker">AIR CAMPAIGN</span><h2>防空战役网络</h2></div>
+        <div><span className="section-kicker">AIR CAMPAIGN</span><h2>任务网络</h2></div>
-              <div><dt>节点</dt><dd>{selected.id}</dd></div>
-              <div><dt>预估雷达节点</dt><dd>{selected.preview.radarDensity}</dd></div>
+              <div><dt>任务代号</dt><dd>{selected.id}</dd></div>
+              <div><dt>预估雷达数量</dt><dd>{selected.preview.radarDensity}</dd></div>

--- src/ui/ControlPanel.tsx
+++ src/ui/ControlPanel.tsx
         </div>
+        <p className="hint">点击地图添加航点，拖动航点调整位置。飞行中需先暂停才能重规划。</p>
       </CollapsibleSection>
```

## 测试用例

### TC-001 Campaign 术语
- 前置条件：进入任务网络。
- 预期结果：标题显示“任务网络”，简报字段显示“任务代号”和“预估雷达数量”。
- 是否通过：通过（代码检查与生产构建）。

### TC-002 航点操作提示
- 前置条件：进入战术航线规划页并展开航点序列。
- 预期结果：操作按钮下方显示指定的航点添加、拖动和暂停重规划提示。
- 是否通过：通过（组件编译与生产构建）。

### TC-003 自动化回归
- `npm run typecheck`：通过。
- `npm run test -- --run`：通过，23 个测试文件、103 项测试。
- `npm run build`：通过。
