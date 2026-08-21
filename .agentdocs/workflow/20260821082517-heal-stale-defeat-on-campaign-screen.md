# 修复已进入 Campaign 页面后的陈旧 DEFEAT 显示

## 背景与目标
- 截图确认 C1-0 已为 `COMPLETED`、C2-0/C2-1 已为 `AVAILABLE`，但右侧按钮仍显示“飞机损失 // RUN 结束”。
- 会话-54只在 `RETURN_CAMPAIGN` 结算动作发生时修正状态；开发热更新保留的旧内存状态已经停留在 Campaign 页面，不会再次触发该动作。
- 目标是让现有矛盾状态立即在 UI 自愈，并在选择 C2 时把领域状态恢复为 `ACTIVE`。

## 约束与原则
- 仅当旧状态同时满足 `DEFEAT + 上一 Mission SUCCESS + 存在 AVAILABLE 节点` 时允许自愈。
- 真正飞机损失为 `Mission FAILED + Run DEFEAT`，仍显示 Run 结束且不能继续。
- UI 即时恢复按钮，reducer 在选择下一节点时完成真实状态修复。

## 阶段与 TODO
- [x] 根据截图重新核对节点、Mission 与 Run 三层状态。
- [x] Campaign 按钮识别可恢复的旧内存状态。
- [x] 选择 AVAILABLE 节点时清理陈旧 `DEFEAT`。
- [x] 增加已停留在 Campaign 页面场景的 reducer 测试。
- [x] 完成浏览器界面检查与完整工程验证。

## 代码变更
- `src/ui/CampaignMap.tsx`

```diff
+  const hasAvailableNode = state.campaign.nodes.some((node) => node.status === "AVAILABLE");
+  // 热更新可能保留旧版产生的矛盾状态；成功 Mission + 可用后续节点应视为可继续的 Run。
+  const canContinueRun = state.status === "ACTIVE"
+    || (state.status === "DEFEAT" && state.currentMission?.status === "SUCCESS" && hasAvailableNode);
@@
-              disabled={selected.status !== "AVAILABLE" || state.status !== "ACTIVE"}
+              disabled={selected.status !== "AVAILABLE" || !canContinueRun}
@@
-              {state.status === "VICTORY" ? "RUN 已完成" : state.status === "DEFEAT" ? "飞机损失 // RUN 结束" : "执行任务"}
+              {state.status === "VICTORY"
+                ? "RUN 已完成"
+                : state.status === "DEFEAT" && !canContinueRun
+                  ? "飞机损失 // RUN 结束"
+                  : "执行任务"}
```

- `src/game/gameReducer.ts`

```diff
       return {
         ...state,
+        // AVAILABLE 节点来自已成功结算的 Campaign 时，选择节点同时清理旧版残留的 DEFEAT。
+        status: state.status === "DEFEAT" && mission.status === "SUCCESS" ? "ACTIVE" : state.status,
         campaign: { ...state.campaign, currentNodeId: node.id },
```

- `src/game/gameReducer.test.ts`

```diff
+  it("已停留在 Campaign 的旧状态选择 C2 时自愈陈旧 DEFEAT", () => {
+    // 构造截图状态：C1-0 COMPLETED、C2 AVAILABLE、上一 Mission SUCCESS、Run DEFEAT。
+    state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: "C2-0" });
+    expect(state.status).toBe("ACTIVE");
+    expect(state.campaign.currentNodeId).toBe("C2-0");
+    expect(state.currentMission?.status).toBe("PLANNING");
+  });
```

## 测试用例
### TC-001 截图状态即时恢复
- 类型：UI 状态验证
- 优先级：高
- 前置条件：上一 Mission 为 `SUCCESS`，存在 `AVAILABLE` 后续节点，Run 残留 `DEFEAT`。
- 预期结果：按钮显示“执行任务”且可点击，不再显示“飞机损失 // RUN 结束”。
- 是否通过：通过。

### TC-002 选择 C2 完成领域状态自愈
- 类型：reducer 回归测试
- 优先级：高
- 操作步骤：在截图等价状态下选择 C2-0。
- 预期结果：Run 恢复 `ACTIVE`，C2-0 成为当前节点，新 Mission 为 `PLANNING`。
- 是否通过：通过。

### TC-003 真实飞机损失保持终止
- 类型：既有回归测试
- 优先级：高
- 预期结果：Mission `FAILED` 且 Run `DEFEAT` 时没有可用后续节点，按钮仍显示 Run 结束。
- 是否通过：通过。

### TC-004 完整工程验证
- 类型：完整回归
- 优先级：高
- 操作步骤：执行 `npm run typecheck`、`npm run test -- --run`、`npm run build` 和 `git diff --check`。
- 预期结果：全部通过。
- 是否通过：通过。
