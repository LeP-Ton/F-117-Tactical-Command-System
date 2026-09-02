# 作战简报沉浸式文案优化

## 背景与目标
- “玩法说明”“任务模拟继续运行”属于游戏外术语，削弱军事终端沉浸感。
- 有限情报段只解释 INTEL，未说明任务网络其他行动的价值。
- 关闭按钮应采用图形而不是文字。

## 阶段与 TODO
- [x] “玩法说明”统一为“作战简报”。
- [x] 标题英文改为 `OPERATION BRIEFING`。
- [x] 关闭按钮改为 CSS 叉形图标并保留无障碍名称。
- [x] 执行提示仅在 Mission 为 RUNNING 时显示。
- [x] 提示改为“任务执行中 // 飞行控制持续生效”。
- [x] 展开有限情报的两级 INTEL 权限说明。
- [x] 补充五类任务的战术价值。
- [x] 同步 README 与机制手册。

## 代码变更
```diff
 interface GameplayGuideProps {
+  missionRunning: boolean;
 }
-export function GameplayGuide({ open, onClose, triggerRef }: GameplayGuideProps) {
+export function GameplayGuide({ open, onClose, triggerRef, missionRunning }: GameplayGuideProps) {
-  <span className="section-kicker">OPERATION MANUAL</span><h2>玩法说明</h2>
-  <button className="guide-close">关闭</button>
-  <p className="guide-live-warning">任务模拟继续运行</p>
+  <span className="section-kicker">OPERATION BRIEFING</span><h2>作战简报</h2>
+  <button className="guide-close" aria-label="关闭作战简报"><span aria-hidden="true" /></button>
+  {missionRunning && <p className="guide-live-warning">任务执行中 // 飞行控制持续生效</p>}
```

```diff
-  ["有限情报", "雷达位置与覆盖可能存在误差。完成 INTEL 任务可逐步核实雷达并授权完整敌方态势。"],
+  ["有限情报", "初始情报可能遗漏雷达，位置和覆盖也存在误差。首次完成 INTEL 可核实全部雷达坐标与型号；第二次完成后授权完整敌方态势。"],
+  ["任务类型", "INTEL 核实情报；SEAD 削弱后续雷达覆盖；COMMAND STRIKE 破坏敌方协同；STRIKE 完成当前打击；FINAL STRIKE 根据全部行动历史形成最终决战。"],
```

```diff
-  <button className="guide-trigger">玩法说明</button>
-  <GameplayGuide open={guideOpen} ... />
+  <button className="guide-trigger">作战简报</button>
+  <GameplayGuide open={guideOpen} missionRunning={mission.status === "RUNNING"} ... />
```

```diff
-.guide-close { color: #dfb85d; border-color: #80632e; }
+.guide-close { position: relative; width: 32px; height: 32px; ... }
+.guide-close span::before, .guide-close span::after { content: ""; position: absolute; ... }
+.guide-close span::before { transform: rotate(45deg); }
+.guide-close span::after { transform: rotate(-45deg); }
```

## 验证结果
- `npm run typecheck`：通过。
- `npm run test`：通过，28 个测试文件、122 个测试全部通过。
- `npm run build`：通过。
- `git diff --check`：通过。
