# 恢复两次 INTEL 行动的差异化奖励说明

## 背景与目标

- 会话-122曾将两次 INTEL 分别描述为“核实雷达坐标与型号”和“授权 TOTAL INTEL”。
- 会话-128为修复跳过第一次 INTEL 后的奖励误报，改为按已完成次数显示下一档奖励，却导致任务网络初始状态下两个 INTEL 节点再次显示同一条一级说明。
- 本次同时保留两个约束：两个节点必须可辨识，说明也必须与当前路线真正能够获得的权限一致。

## 约束与原则

- 不修改 INTEL 权限派生、任务结算、任务网络拓扑、Seed 或存档结构。
- 第二个 INTEL 在前序尚未决策、已经完成和已经错过时使用不同说明。
- 中英文必须表达同一奖励语义。

## 阶段与 TODO

- [x] 扩展 INTEL 奖励文案语义键，区分一级、二级候选、二级授权和一级补录。
- [x] 根据任务网络中的前序 INTEL 状态派生当前准确说明。
- [x] 让生成器静态元数据也区分两个 INTEL 节点。
- [x] 增加中文四种路线状态与英文文案回归测试。
- [x] 完成类型检查和定向自动化测试。

## 关键行为

- 第一个 INTEL：显示“一级情报核实”。
- 第二个 INTEL、前序仍可完成：显示“二级情报候选”，明确授权条件和降级结果。
- 第二个 INTEL、前序已完成：显示“二级情报授权”。
- 第二个 INTEL、前序已错过：显示“一级情报补录”，明确本次任务网络无法再授权 TOTAL INTEL。

## 代码变更

### `src/domain/campaignBalance.ts`

```diff
-export type MissionEffectKey = Exclude<MissionNodeType, "INTEL"> | "INTEL_GENERIC" | "INTEL_1" | "INTEL_2";
+export type MissionEffectKey = Exclude<MissionNodeType, "INTEL">
+  | "INTEL_GENERIC"
+  | "INTEL_1"
+  | "INTEL_2"
+  | "INTEL_2_CONDITIONAL"
+  | "INTEL_2_RECOVERY";
+
+export type IntelEffectContext = "STANDARD" | "CONDITIONAL" | "RECOVERY";
 
 /** 将任务类型与当前 INTEL 奖励层级转换为稳定语义键，供任意语言的界面共同消费。 */
-export function getMissionEffectKey(type: MissionNodeType, rewardLevel?: 1 | 2): MissionEffectKey {
+export function getMissionEffectKey(
+  type: MissionNodeType,
+  rewardLevel?: 1 | 2,
+  intelContext: IntelEffectContext = "STANDARD",
+): MissionEffectKey {
   if (type !== "INTEL") return type;
+  if (intelContext === "CONDITIONAL") return "INTEL_2_CONDITIONAL";
+  if (intelContext === "RECOVERY") return "INTEL_2_RECOVERY";
   if (rewardLevel === 1) return "INTEL_1";
   if (rewardLevel === 2) return "INTEL_2";
   return "INTEL_GENERIC";
 }
@@
-export function getMissionEffectDescription(type: MissionNodeType, rewardLevel?: 1 | 2): string {
-  const key = getMissionEffectKey(type, rewardLevel);
+export function getMissionEffectDescription(
+  type: MissionNodeType,
+  rewardLevel?: 1 | 2,
+  intelContext: IntelEffectContext = "STANDARD",
+): string {
+  const key = getMissionEffectKey(type, rewardLevel, intelContext);
   if (key === "INTEL_1") return "补齐后续任务全部雷达，并精确核实坐标与型号";
   if (key === "INTEL_2") return "授权 TOTAL INTEL，开放真实雷达覆盖与完整敌方态势";
+  if (key === "INTEL_2_CONDITIONAL") return "完成前序 INTEL 后授权 TOTAL INTEL；若前序缺失则降为一级情报核实";
+  if (key === "INTEL_2_RECOVERY") return "补录一级情报，核实全部雷达坐标与型号；本次任务网络无法再授权 TOTAL INTEL";
   if (key === "INTEL_GENERIC") return missionEffectDescriptions.INTEL;
   return missionEffectDescriptions[key];
 }
```

### `src/procedural/campaignGenerator.ts`

```diff
-          // INTEL 的实际奖励由已完成次数决定；静态节点只保存不会误导分支选择的通用说明。
-          effect: getMissionEffectDescription(type),
+          // 第二个 INTEL 节点生成时前序选择尚未确定，因此静态元数据明确记录其授权条件。
+          effect: getMissionEffectDescription(
+            type,
+            type === "INTEL" ? 1 : undefined,
+            type === "INTEL" && intelOrdinal === 2 ? "CONDITIONAL" : "STANDARD",
+          ),
```

### `src/ui/CampaignMap.tsx`

```diff
   const intelAccessTier = getIntelAccessTier(state.campaign);
-  const completedIntelNodes = state.campaign.nodes
-    .filter((node) => node.type === "INTEL" && node.status === "COMPLETED");
+  const intelNodes = state.campaign.nodes
+    .filter((node) => node.type === "INTEL")
+    .sort((left, right) => left.layer - right.layer);
+  const completedIntelNodes = intelNodes.filter((node) => node.status === "COMPLETED");
+  const selectedIntelOrdinal = selected?.type === "INTEL"
+    ? intelNodes.findIndex((node) => node.id === selected.id) + 1
+    : 0;
   const selectedIntelRewardLevel = selected?.type === "INTEL"
     ? Math.min(2, selected.status === "COMPLETED"
       ? completedIntelNodes.filter((node) => node.layer <= selected.layer).length
       : completedIntelNodes.length + 1) as 1 | 2
     : undefined;
+  const priorIntelNodes = selectedIntelOrdinal > 1
+    ? intelNodes.slice(0, selectedIntelOrdinal - 1)
+    : [];
+  // 第二情报节点必须同时说明“前序仍可完成”和“前序已经错过”两种真实收益，避免把两次行动写成同一句。
+  const selectedIntelContext = selected?.type === "INTEL"
+    && selectedIntelOrdinal > 1
+    && selectedIntelRewardLevel === 1
+    ? priorIntelNodes.some((node) => node.status !== "EXPIRED" && node.status !== "COMPLETED")
+      ? "CONDITIONAL" as const
+      : "RECOVERY" as const
+    : "STANDARD" as const;
@@
   const selectedEffect = selected
-    ? copy.campaign.effect[getMissionEffectKey(selected.type, selectedIntelRewardLevel)]
+    ? copy.campaign.effect[getMissionEffectKey(selected.type, selectedIntelRewardLevel, selectedIntelContext)]
     : "";
```

### `src/i18n/I18n.tsx`

```diff
-        INTEL_1: "补齐后续任务全部雷达，并精确核实坐标与型号",
-        INTEL_2: "授权 TOTAL INTEL，开放真实雷达覆盖与完整敌方态势",
+        INTEL_1: "一级情报核实：补齐后续任务全部雷达，并精确核实坐标与型号",
+        INTEL_2: "二级情报授权：开放 TOTAL INTEL 真实雷达覆盖与完整敌方态势",
+        INTEL_2_CONDITIONAL: "二级情报候选：完成前序 INTEL 后授权 TOTAL INTEL；若前序缺失则降为一级情报核实",
+        INTEL_2_RECOVERY: "一级情报补录：核实全部雷达坐标与型号；本次任务网络无法再授权 TOTAL INTEL",
@@
-        INTEL_1: "Reveal every radar in subsequent missions and verify its coordinates and type",
-        INTEL_2: "Authorize TOTAL INTEL with true radar coverage and complete enemy-system state",
+        INTEL_1: "PRIMARY INTEL: Reveal every radar in subsequent missions and verify its coordinates and type",
+        INTEL_2: "SECONDARY INTEL: Authorize TOTAL INTEL with true radar coverage and complete enemy-system state",
+        INTEL_2_CONDITIONAL: "SECONDARY INTEL CANDIDATE: Complete the prior INTEL mission to authorize TOTAL INTEL; otherwise this mission falls back to primary identification",
+        INTEL_2_RECOVERY: "PRIMARY INTEL RECOVERY: Verify all radar coordinates and types; TOTAL INTEL can no longer be authorized in this mission network",
```

### `src/procedural/campaignGenerator.test.ts`

```diff
-  it("INTEL 静态节点使用不依赖分支历史的通用说明", () => {
+  it("两个 INTEL 静态节点分别说明一级收益与二级授权条件", () => {
@@
-    expect(intelNodes.map((node) => node.preview.effect)).toEqual([
-      "根据当前情报权限补齐雷达识别或授权完整敌方态势",
-      "根据当前情报权限补齐雷达识别或授权完整敌方态势",
-    ]);
+    expect(intelNodes.map((node) => node.preview.effect)).toEqual([
+      "补齐后续任务全部雷达，并精确核实坐标与型号",
+      "完成前序 INTEL 后授权 TOTAL INTEL；若前序缺失则降为一级情报核实",
+    ]);
```

### `src/ui/CampaignMap.copy.test.tsx`

```diff
-  it("INTEL 根据已完成次数显示下一项实际奖励", () => {
+  it("两个 INTEL 节点始终显示互不混淆且符合当前路线的实际奖励", () => {
@@
-    expect(screen.getByText("补齐后续任务全部雷达，并精确核实坐标与型号。")).toBeInTheDocument();
+    expect(screen.getByText("一级情报核实：补齐后续任务全部雷达，并精确核实坐标与型号。")).toBeInTheDocument();
     fireEvent.click(screen.getByRole("button", { name: /C2-0/ }));
-    expect(screen.getByText("补齐后续任务全部雷达，并精确核实坐标与型号。")).toBeInTheDocument();
+    expect(screen.getByText("二级情报候选：完成前序 INTEL 后授权 TOTAL INTEL；若前序缺失则降为一级情报核实。")).toBeInTheDocument();
@@
-    expect(screen.getByText("授权 TOTAL INTEL，开放真实雷达覆盖与完整敌方态势。")).toBeInTheDocument();
+    expect(screen.getByText("二级情报授权：开放 TOTAL INTEL 真实雷达覆盖与完整敌方态势。")).toBeInTheDocument();
+
+    const afterSkippingFirstIntel = {
+      ...state,
+      campaign: {
+        ...state.campaign,
+        nodes: state.campaign.nodes.map((node) => node.id === "C0-0"
+          ? { ...node, status: "EXPIRED" as const }
+          : node),
+      },
+    };
+    view.rerender(<CampaignMap state={afterSkippingFirstIntel} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
+    expect(screen.getByText("一级情报补录：核实全部雷达坐标与型号；本次任务网络无法再授权 TOTAL INTEL。")).toBeInTheDocument();
@@
-    expect(screen.getByText(/Reveal every radar in subsequent missions/)).toBeInTheDocument();
+    expect(screen.getByText(/PRIMARY INTEL: Reveal every radar in subsequent missions/)).toBeInTheDocument();
```

## 测试用例

### TC-001 初始任务网络文案区分

- 操作：先后选中第一和第二个 INTEL 节点。
- 预期：分别显示一级核实和带前序条件的二级候选说明，不再相同。
- 是否通过：是。

### TC-002 完成前序 INTEL

- 操作：将第一节点置为已完成并选中第二节点。
- 预期：第二节点明确显示 TOTAL INTEL 二级授权。
- 是否通过：是。

### TC-003 错过前序 INTEL

- 操作：将第一节点置为已失效并选中第二节点。
- 预期：第二节点明确显示一级补录及无法再取得 TOTAL INTEL。
- 是否通过：是。

### TC-004 中英文结构一致

- 操作：执行 i18n 目录结构测试并渲染英文任务网络。
- 预期：新增语义键在两种语言中完全对应，英文一级奖励正常显示。
- 是否通过：是。

## 验证结果

- `npm run typecheck`：通过。
- `npm run test -- --run src/procedural/campaignGenerator.test.ts src/ui/CampaignMap.copy.test.tsx src/i18n/I18n.test.tsx`：通过，3 个测试文件、13 项测试全部成功。
- `npm run test -- --run`：通过，29 个测试文件、141 项测试全部成功。
- `npm run build`：通过，Vite 生产构建成功。
- `git diff --check`：通过。
