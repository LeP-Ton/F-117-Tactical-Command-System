# 统一 Campaign 成功与推进口径

## 背景与目标
- 旧规则允许普通任务失败后仍解锁下一阶段，与“轰炸目标并成功撤离才算任务成功”的 Mission 判定不一致。
- 统一为只有 Mission `SUCCESS` 才推进 Campaign；普通失败不完成节点、不关闭同层选择、不解锁下一层。

## 约束与原则
- 成功条件保持不变：目标已经摧毁，且飞机进入撤离区。
- 普通失败仍使 Enemy Alert 增加 `10`，并学习实际飞行历史。
- 普通失败后当前节点和同层备选均保持 `AVAILABLE`，玩家可以重试或改选。
- 飞机被摧毁仍使 Run `DEFEAT`，当前节点 `FAILED`，同层备选 `EXPIRED`，后续层保持锁定。

## 阶段与 TODO
- [x] 重构 `RETURN_CAMPAIGN` 节点状态转换。
- [x] 修改普通失败回归测试。
- [x] 更新 AGENTS、README、机制手册和 TODO 的规则描述。
- [x] 执行类型检查、完整测试、生产构建和差异检查。

## 代码变更
- `src/game/gameReducer.ts`

```diff
       const nodes = state.campaign.nodes.map((node) => {
-        if (node.id === currentNode.id) return { ...node, status: succeeded ? "COMPLETED" as const : "FAILED" as const };
-        if (node.layer === currentNode.layer && node.status === "AVAILABLE") {
-          return { ...node, status: "EXPIRED" as const };
+        if (succeeded) {
+          if (node.id === currentNode.id) return { ...node, status: "COMPLETED" as const };
+          if (node.layer === currentNode.layer && node.status === "AVAILABLE") {
+            return { ...node, status: "EXPIRED" as const };
+          }
+          if (node.layer === nextLayer && node.status === "LOCKED") {
+            return { ...node, status: "AVAILABLE" as const };
+          }
         }
-        if (!runDefeated && node.layer === nextLayer && node.status === "LOCKED") {
-          return { ...node, status: "AVAILABLE" as const };
+        if (runDefeated) {
+          if (node.id === currentNode.id) return { ...node, status: "FAILED" as const };
+          if (node.layer === currentNode.layer && node.status === "AVAILABLE") {
+            return { ...node, status: "EXPIRED" as const };
+          }
         }
+        // 普通失败不推进 Campaign：当前节点与同层备选均保持 AVAILABLE，可重试或改选。
         return node;
```

- `src/game/gameReducer.test.ts`

```diff
-  it("失败不会结束 Run，但会提高 Enemy Alert", () => {
+  it("普通失败不推进 Campaign，保留当前层选择并提高 Enemy Alert", () => {
@@
-    expect(state.campaign.nodes.find((node) => node.id === "C0-0")?.status).toBe("FAILED");
-    expect(state.campaign.nodes.find((node) => node.id === "C0-1")?.status).toBe("EXPIRED");
-    expect(state.campaign.nodes.filter((node) => node.layer === 1).every((node) => node.status === "AVAILABLE")).toBe(true);
+    expect(state.campaign.nodes.filter((node) => node.layer === 0)
+      .every((node) => node.status === "AVAILABLE")).toBe(true);
+    expect(state.campaign.nodes.filter((node) => node.layer === 1)
+      .every((node) => node.status === "LOCKED")).toBe(true);
```

- `AGENTS.md`

```diff
-- Campaign 固定为三个顺序二选一阶段与 Final Strike；执行节点后同层另一选择失效，普通失败仍推进并提高 Enemy Alert。
+- Campaign 固定为三个顺序二选一阶段与 Final Strike；只有摧毁目标并成功撤离才完成节点、关闭同层选择并解锁下一阶段，普通失败只提高 Enemy Alert 并保留当前层供重试或改选。
```

- `README.md`

```diff
-每个 Run 包含三个顺序二选一阶段和一个 Final Strike。执行节点后同层另一选择会失效，再解锁下一阶段；普通任务失败仍会推进，但会显著提高 Enemy Alert。
+每个 Run 包含三个顺序二选一阶段和一个 Final Strike。只有摧毁目标并成功撤离，当前节点才会完成、同层另一选择才会失效并解锁下一阶段；普通任务失败只会显著提高 Enemy Alert，当前层仍可重试或改选。
```

- `docs/game-mechanics.md`

```diff
-每个 Run 包含三个顺序二选一阶段与一个 Final Strike。执行一个节点后，同层另一节点变为 `EXPIRED`，随后解锁下一阶段。
+每个 Run 包含三个顺序二选一阶段与一个 Final Strike。只有摧毁目标并成功进入撤离区，当前节点才变为 `COMPLETED`、同层另一节点变为 `EXPIRED`，随后解锁下一阶段。普通失败不会推进 Campaign，当前层保持可重试或改选。
```

- `TODO.md`

```diff
-- [x] 执行节点后同层另一节点进入 `EXPIRED`，再解锁下一阶段。
-- [x] 普通任务失败仍推进并增加 Enemy Alert；飞机被摧毁仍立即结束 Run。
+- [x] 只有摧毁目标并成功撤离后，同层另一节点才进入 `EXPIRED`，再解锁下一阶段。
+- [x] 普通任务失败不推进 Campaign，只增加 Enemy Alert 并保留当前层供重试或改选；飞机被摧毁立即结束 Run。
```

## 测试用例
### TC-001 成功任务推进 Campaign
- 类型：既有回归测试
- 优先级：高
- 预期结果：当前节点 `COMPLETED`，同层备选 `EXPIRED`，下一层 `AVAILABLE`。
- 是否通过：通过。

### TC-002 普通失败不推进 Campaign
- 类型：状态回归测试
- 优先级：高
- 预期结果：当前层节点保持 `AVAILABLE`，下一层保持 `LOCKED`，Enemy Alert 增加 `10`。
- 是否通过：通过。

### TC-003 飞机损失终止 Run
- 类型：既有回归测试
- 优先级：高
- 预期结果：Run `DEFEAT`，后续层不解锁。
- 是否通过：通过。

### TC-004 完整工程验证
- 类型：完整回归
- 优先级：高
- 操作步骤：执行 `npm run typecheck`、`npm run test -- --run`、`npm run build` 和 `git diff --check`。
- 预期结果：全部通过。
- 是否通过：通过。
