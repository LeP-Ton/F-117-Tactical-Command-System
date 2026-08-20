# 第二批：合并同质任务并建立顺序二选一 Campaign

## 背景与目标
- 旧 Campaign 虽呈现 DAG，但层间全连接、同层节点可全部执行，未形成真实路线选择。
- `RECON/ELINT` 与 `STRIKE/DEEP_STRIKE` 的任务行为高度同质。

## 约束与原则
- 保留 Intel、SEAD、Command Strike、Enemy Alert 与 Final Strike 的持久作用。
- 普通任务失败继续推进，飞机摧毁仍立即结束 Run。
- 相同 Seed 继续复现任务内容。

## 阶段与 TODO
- [x] 合并任务类型。
- [x] 固定三个二选一阶段和 Final Strike。
- [x] 选择后关闭同层节点并解锁下一层。
- [x] 从节点状态派生完整历史。
- [x] 更新 UI、测试和机制文档。

## 代码变更
- `src/domain/types.ts`
```diff
-export type MissionNodeType = "STRIKE" | "RECON" | "ELINT" | "SEAD" | "COMMAND_STRIKE" | "DEEP_STRIKE" | "FINAL_STRIKE";
-export type CampaignNodeStatus = "AVAILABLE" | "LOCKED" | "COMPLETED" | "FAILED";
+export type MissionNodeType = "INTEL" | "STRIKE" | "SEAD" | "COMMAND_STRIKE" | "FINAL_STRIKE";
+export type CampaignNodeStatus = "AVAILABLE" | "LOCKED" | "COMPLETED" | "FAILED" | "EXPIRED";
```
- `src/procedural/campaignGenerator.ts`
```diff
-const middleTypes: readonly MissionNodeType[] = ["STRIKE", "ELINT", "SEAD", "DEEP_STRIKE"];
+const stageTypes: readonly (readonly MissionNodeType[])[] = [
+  ["INTEL", "STRIKE"],
+  ["SEAD", "COMMAND_STRIKE"],
+  ["INTEL", "STRIKE"],
+  ["FINAL_STRIKE"],
+];
-  const layerCounts = [2, 2, random.integer(1, 2), 1];
+  stageTypes.forEach((types, layer) => {
+    types.forEach((type, index) => {
-  return { seed: `${seed}-CAMPAIGN`, completedNodeIds: [], nodes, edges };
+  return { seed: `${seed}-CAMPAIGN`, nodes, edges };
```
- `src/game/gameReducer.ts`
```diff
-      const outgoingIds = new Set(
-        state.campaign.edges.filter((edge) => edge.from === currentNode.id).map((edge) => edge.to),
-      );
+      const nextLayer = currentNode.layer + 1;
       const nodes = state.campaign.nodes.map((node) => {
         if (node.id === currentNode.id) return { ...node, status: succeeded ? "COMPLETED" as const : "FAILED" as const };
-        if (outgoingIds.has(node.id) && node.status === "LOCKED") return { ...node, status: "AVAILABLE" as const };
+        if (node.layer === currentNode.layer && node.status === "AVAILABLE") {
+          return { ...node, status: "EXPIRED" as const };
+        }
+        if (node.layer === nextLayer && node.status === "LOCKED") return { ...node, status: "AVAILABLE" as const };
         return node;
       });
-              + (succeeded && currentNode.type === "RECON" ? 0.06 : 0)
-              + (succeeded && currentNode.type === "ELINT" ? 0.1 : 0),
+              + (succeeded && currentNode.type === "INTEL" ? 0.1 : 0),
```
- `src/ui/CampaignMap.tsx`、`src/ui/styles.css`
```diff
 const typeLabels = {
+  INTEL: "情报行动",
   STRIKE: "打击",
-  RECON: "侦察",
-  ELINT: "电子情报",
-  DEEP_STRIKE: "纵深打击",
 } as const;
+.node-expired { opacity: 0.24; filter: grayscale(1); }
```
- Campaign 测试改为固定 7 节点，并分别验证成功与普通失败都会关闭同层节点、解锁下一层。

## 测试结果
- `npm run typecheck`：通过。
- `npm run test`：18 个测试文件、81 项测试通过。
- `npm run build`：通过。
- `git diff --check`：通过。
