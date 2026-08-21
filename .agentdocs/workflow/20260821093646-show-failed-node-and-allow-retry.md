# 失败节点保留 FAILED 并允许重新执行

## 背景与目标
- 会话-62允许所有失败重试，但失败结算后把当前节点继续显示为 `AVAILABLE`，无法表达上一次执行失败。
- 调整为失败节点显示 `FAILED`，同时把 `FAILED` 定义为合法的重试入口；同层另一任务保持 `AVAILABLE`。
- 返回 Campaign 时默认选中刚失败的节点，让玩家直接看到结果和重新执行按钮。

## 约束与原则
- `FAILED` 表示上次执行结果，不再表示永久禁用。
- 选择 `FAILED` 节点时恢复为 `AVAILABLE` 并创建新的 `PLANNING` Mission。
- 同层备选不失效，下一层不解锁。
- 成功后的 `COMPLETED / EXPIRED / 下一层 AVAILABLE` 规则不变。

## 阶段与 TODO
- [x] 失败结算把当前节点标记为 `FAILED`。
- [x] reducer 接受 `FAILED` 节点重新执行。
- [x] Campaign 默认选中刚失败的节点。
- [x] FAILED 节点按钮保持可点击。
- [x] 更新项目认知、README、机制手册和 TODO。
- [x] 执行状态测试、类型检查、完整测试、构建与差异检查。

## 代码变更
- `src/game/gameReducer.ts`

```diff
-      const legacyDefeatRetry = state.status === "DEFEAT" && node?.status === "FAILED";
-      if (!node || (node.status !== "AVAILABLE" && !legacyDefeatRetry)) return state;
+      const retryFailedNode = node?.status === "FAILED";
+      if (!node || (node.status !== "AVAILABLE" && !retryFailedNode)) return state;
@@
-          nodes: legacyDefeatRetry
+          nodes: retryFailedNode
@@
+        if (node.id === currentNode.id) return { ...node, status: "FAILED" as const };
-        // 所有失败都不推进 Campaign：当前节点与同层备选均保持 AVAILABLE，可重试或改选。
+        // 所有失败都不推进 Campaign：失败节点可重试，同层备选保持 AVAILABLE，下一层保持锁定。
@@
-        campaign: { ...state.campaign, nodes, currentNodeId: undefined },
+        campaign: { ...state.campaign, nodes, currentNodeId: succeeded ? undefined : currentNode.id },
```

- `src/ui/CampaignMap.tsx`

```diff
-  const [selectedId, setSelectedId] = useState(firstAvailable?.id ?? state.campaign.nodes[0]?.id ?? "");
+  const [selectedId, setSelectedId] = useState(
+    state.campaign.currentNodeId ?? firstAvailable?.id ?? state.campaign.nodes[0]?.id ?? "",
+  );
@@
-  const canRetryLegacyDefeat = state.status === "DEFEAT" && selected?.status === "FAILED";
+  const canRetryFailedNode = selected?.status === "FAILED" && state.status !== "VICTORY";
@@
-              disabled={(selected.status !== "AVAILABLE" && !canRetryLegacyDefeat) || !canContinueRun}
+              disabled={(selected.status !== "AVAILABLE" && !canRetryFailedNode) || !canContinueRun}
```

- `src/game/gameReducer.test.ts`

```diff
-    expect(state.campaign.nodes.filter((node) => node.layer === 0)
-      .every((node) => node.status === "AVAILABLE")).toBe(true);
+    expect(state.campaign.nodes.find((node) => node.id === "C0-0")?.status).toBe("FAILED");
+    expect(state.campaign.nodes.find((node) => node.id === "C0-1")?.status).toBe("AVAILABLE");
+    expect(state.campaign.currentNodeId).toBe("C0-0");
+    state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: "C0-0" });
+    expect(state.currentMission?.status).toBe("PLANNING");
```

- `AGENTS.md`、`README.md`、`docs/game-mechanics.md`、`TODO.md`

```diff
-失败后当前层保持 AVAILABLE，可重试或改选。
+失败后当前节点显示为可重试的 FAILED，同层备选保持 AVAILABLE，下一层保持锁定。
```

## 测试用例
### TC-001 普通失败显示与重试
- 类型：状态回归测试
- 优先级：高
- 预期结果：当前节点 `FAILED`、同层备选 `AVAILABLE`、下一层 `LOCKED`；选择失败节点后进入 `PLANNING`。
- 是否通过：通过。

### TC-002 飞机损失显示与重试
- 类型：状态回归测试
- 优先级：高
- 预期结果：行为与其他失败一致，节点显示 `FAILED` 且可重新执行。
- 是否通过：通过。

### TC-003 完整工程验证
- 类型：完整回归
- 优先级：高
- 操作步骤：执行 `npm run typecheck`、`npm run test -- --run`、`npm run build` 和 `git diff --check`。
- 预期结果：全部通过。
- 是否通过：通过。
