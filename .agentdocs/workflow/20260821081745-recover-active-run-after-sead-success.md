# 修复 SEAD 成功后 C2 错显 Run 结束

## 背景与目标
- 用户实际场景为 C1-0 防空压制已显示 `COMPLETED`，但 C2-0/C2-1 的执行按钮显示“飞机损失 // RUN 结束”。
- 会话-51误将问题理解为飞机损失后仍解锁 C2；该会话修复的是另一处真实问题，但未覆盖本场景。
- 本次修复成功 Mission 结算后继承陈旧 `DEFEAT` 的状态不变量问题。

## 约束与原则
- Mission `SUCCESS` 表示飞机已完成撤离，不可能同时处于飞机损失状态。
- 非 Final Strike 成功后，Run 必须显式为 `ACTIVE`；Final Strike 成功为 `VICTORY`。
- 只有 Mission 失败且 Run 为 `DEFEAT` 时，才阻止下一层解锁。
- 保留会话-51对真实飞机损失终止 Campaign 的修复。

## 阶段与 TODO
- [x] 重新按 `C1-0 COMPLETED → C2` 路径核对 reducer 与 UI。
- [x] 从成功任务结果显式派生 Run 状态。
- [x] 修正下一层解锁对陈旧 `DEFEAT` 的判断。
- [x] 增加 C1-0 成功但全局状态陈旧的精确回归测试。
- [x] 执行类型检查、完整测试、生产构建和差异检查。

## 代码变更
- `src/game/gameReducer.ts`

```diff
       const succeeded = mission.status === "SUCCESS";
-      const runDefeated = state.status === "DEFEAT";
+      // 成功 Mission 不可能同时损失飞机；仅失败 Mission 才允许 DEFEAT 阻断后续层。
+      const runDefeated = !succeeded && state.status === "DEFEAT";
@@
       const tacticalProfile = analyzeCompletedMission(state.enemyState.tacticalProfile, mission);
+      // Mission 成功意味着飞机已安全撤离；非最终节点必须恢复 ACTIVE，不能继承陈旧的 DEFEAT。
+      const runStatus = succeeded
+        ? currentNode.type === "FINAL_STRIKE" ? "VICTORY" as const : "ACTIVE" as const
+        : state.status;
       return {
         ...state,
-        status: succeeded && currentNode.type === "FINAL_STRIKE" ? "VICTORY" : state.status,
+        status: runStatus,
```

- `src/game/gameReducer.test.ts`

```diff
+  it("C1-0 SEAD 已完成时清除陈旧 DEFEAT 并允许执行 C2", () => {
+    let state = createRun("SEAD-STALE-DEFEAT");
+    state = {
+      ...state,
+      status: "DEFEAT",
+      campaign: {
+        ...state.campaign,
+        currentNodeId: "C1-0",
+        nodes: state.campaign.nodes.map((node) => node.id === "C1-0"
+          ? { ...node, status: "AVAILABLE" }
+          : node),
+      },
+      currentMission: { ...state.currentMission!, status: "SUCCESS" },
+    };
+
+    state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
+
+    expect(state.campaign.nodes.find((node) => node.id === "C1-0")?.status).toBe("COMPLETED");
+    expect(state.status).toBe("ACTIVE");
+    expect(state.campaign.nodes.filter((node) => node.layer === 2)
+      .every((node) => node.status === "AVAILABLE")).toBe(true);
+  });
```

## 测试用例
### TC-001 C1-0 成功修复陈旧 Run 状态
- 类型：状态回归测试
- 优先级：高
- 前置条件：C1-0 Mission 为 `SUCCESS`，模拟全局残留 `DEFEAT`。
- 操作步骤：派发 `RETURN_CAMPAIGN`。
- 预期结果：C1-0 为 `COMPLETED`，Run 为 `ACTIVE`，C2-0/C2-1 均为 `AVAILABLE`。
- 是否通过：通过。

### TC-002 飞机实际损失仍终止 Run
- 类型：既有回归测试
- 优先级：高
- 预期结果：失败 Mission 且 Run 为 `DEFEAT` 时，下一层保持锁定。
- 是否通过：通过。

### TC-003 完整工程验证
- 类型：完整回归
- 优先级：高
- 操作步骤：执行 `npm run typecheck`、`npm run test -- --run`、`npm run build` 和 `git diff --check`。
- 预期结果：全部通过。
- 是否通过：通过。
