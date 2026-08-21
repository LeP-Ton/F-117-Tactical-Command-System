# 允许飞机损失后重新执行任务

## 背景与目标
- 旧规则把导弹击毁飞机视为整个 Run `DEFEAT`，玩家只能重新生成 Run，无法重试当前节点。
- 这与“所有失败不推进 Campaign、当前层可重试”的统一规则冲突。
- 改为飞机损失只结束当前 Mission；返回 Campaign 后当前节点与同层备选均可执行。

## 约束与原则
- 只有摧毁目标并进入撤离区才算成功并推进下一层。
- 包括飞机损失、燃油耗尽、未摧毁目标和错过撤离在内的所有失败，都使 Enemy Alert 增加 `10`。
- 失败不会关闭当前层选择，也不会解锁下一层。
- 兼容热更新保留的旧版 `FAILED + DEFEAT` 状态，允许直接重试该 FAILED 节点。

## 阶段与 TODO
- [x] 导弹命中不再把 Run 设置为 `DEFEAT`。
- [x] 所有失败结算后恢复 `ACTIVE` 并保留当前层节点。
- [x] Campaign UI 允许旧版 FAILED 节点重试。
- [x] reducer 在选择旧 FAILED 节点时修复节点与 Run 状态。
- [x] 更新 AGENTS、README、机制手册和 TODO。
- [x] 执行类型检查、完整测试、构建和差异检查。

## 代码变更
- `src/game/gameReducer.ts`

```diff
     case "SELECT_CAMPAIGN_NODE": {
       const node = state.campaign.nodes.find((candidate) => candidate.id === action.nodeId);
-      if (!node || node.status !== "AVAILABLE") return state;
+      const legacyDefeatRetry = state.status === "DEFEAT" && node?.status === "FAILED";
+      if (!node || (node.status !== "AVAILABLE" && !legacyDefeatRetry)) return state;
       return {
         ...state,
-        status: state.status === "DEFEAT" && mission.status === "SUCCESS" ? "ACTIVE" : state.status,
+        status: "ACTIVE",
+        campaign: {
+          ...state.campaign,
+          currentNodeId: node.id,
+          nodes: legacyDefeatRetry
+            ? state.campaign.nodes.map((candidate) => candidate.id === node.id
+              ? { ...candidate, status: "AVAILABLE" as const }
+              : candidate)
+            : state.campaign.nodes,
+        },
@@
-        if (runDefeated) {
-          if (node.id === currentNode.id) return { ...node, status: "FAILED" as const };
-          if (node.layer === currentNode.layer && node.status === "AVAILABLE") {
-            return { ...node, status: "EXPIRED" as const };
-          }
-        }
-        // 普通失败不推进 Campaign：当前节点与同层备选均保持 AVAILABLE，可重试或改选。
+        // 所有失败都不推进 Campaign：当前节点与同层备选均保持 AVAILABLE，可重试或改选。
@@
-        : state.status;
+        : "ACTIVE" as const;
@@
-        status: aircraftDestroyed ? "DEFEAT" : state.status,
+        status: state.status,
```

- `src/ui/CampaignMap.tsx`

```diff
+  const canRetryLegacyDefeat = state.status === "DEFEAT" && selected?.status === "FAILED";
-  const canContinueRun = state.status === "ACTIVE" || hasAvailableNode;
+  const canContinueRun = state.status === "ACTIVE" || hasAvailableNode || canRetryLegacyDefeat;
@@
-              disabled={selected.status !== "AVAILABLE" || !canContinueRun}
+              disabled={(selected.status !== "AVAILABLE" && !canRetryLegacyDefeat) || !canContinueRun}
```

- `src/game/gameReducer.test.ts`

```diff
-  it("导弹首次命中即摧毁飞机并使整个 Run 失败", () => {
+  it("导弹命中摧毁飞机但只结束当前任务，返回后允许重试", () => {
@@
-    expect(state.status).toBe("DEFEAT");
+    expect(state.status).toBe("ACTIVE");
+    state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
+    expect(state.campaign.nodes.filter((node) => node.layer === 0)
+      .every((node) => node.status === "AVAILABLE")).toBe(true);
@@
+  it("旧版飞机损失状态允许重新执行 FAILED 节点", () => {
+    // 选择旧版 FAILED 节点后恢复 ACTIVE、AVAILABLE 和 PLANNING。
+  });
```

- `AGENTS.md`、`README.md`、`docs/game-mechanics.md`、`TODO.md`

```diff
-导弹命中会立即摧毁飞机并令 Run DEFEAT。
+导弹命中会摧毁飞机并结束当前 Mission，但返回 Campaign 后可重试或改选，不结束 Run。
```

## 测试用例
### TC-001 飞机损失后重试
- 类型：状态回归测试
- 优先级：高
- 预期结果：导弹命中后 Mission `FAILED`、Run `ACTIVE`；返回后当前层保持 `AVAILABLE`，下一层保持 `LOCKED`。
- 是否通过：通过。

### TC-002 旧版 DEFEAT 状态迁移
- 类型：兼容性测试
- 优先级：高
- 前置条件：节点 `FAILED`、Run `DEFEAT`、Mission `FAILED`。
- 操作步骤：选择旧 FAILED 节点。
- 预期结果：Run 恢复 `ACTIVE`，节点恢复 `AVAILABLE`，任务进入 `PLANNING`。
- 是否通过：通过。

### TC-003 完整工程验证
- 类型：完整回归
- 优先级：高
- 操作步骤：执行 `npm run typecheck`、`npm run test -- --run`、`npm run build` 和 `git diff --check`。
- 预期结果：全部通过。
- 是否通过：通过。
