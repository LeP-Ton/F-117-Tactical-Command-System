# 修复飞机损失后仍解锁后续节点

## 背景与目标
- 玩家在 C1-0 防空压制任务中损失飞机后返回 Campaign，C2 节点仍被普通失败逻辑解锁。
- 此时 Run 已是 `DEFEAT`，按钮却同时显示可用后续节点与“飞机损失 // RUN 结束”，状态互相矛盾。
- 保留“普通任务失败仍推进 Campaign”的规则，仅让真正的飞机损失终止后续节点解锁。

## 约束与原则
- 不改变 SEAD 成功后的雷达覆盖削弱效果。
- 不改变燃油耗尽、未摧毁目标或错过撤离区等普通失败的推进规则。
- `RunState.status === "DEFEAT"` 是飞机损失后的唯一 Run 终止判据。

## 阶段与 TODO
- [x] 定位 `RETURN_CAMPAIGN` 无条件解锁下一层的问题。
- [x] 区分普通任务失败与飞机损失导致的 Run 失败。
- [x] 增加飞机损失返回 Campaign 的回归断言。
- [x] 执行类型检查、完整测试、生产构建和差异检查。

## 代码变更
- `src/game/gameReducer.ts`

```diff
       const succeeded = mission.status === "SUCCESS";
+      const runDefeated = state.status === "DEFEAT";
       const nextLayer = currentNode.layer + 1;
@@
-        if (node.layer === nextLayer && node.status === "LOCKED") return { ...node, status: "AVAILABLE" as const };
+        // 普通任务失败仍推进战役；飞机已损失时 Run 终止，后续节点必须保持锁定。
+        if (!runDefeated && node.layer === nextLayer && node.status === "LOCKED") {
+          return { ...node, status: "AVAILABLE" as const };
+        }
```

- `src/game/gameReducer.test.ts`

```diff
     expect(state.currentMission!.events.at(-1)?.data.reason).toBe("AIRCRAFT_DESTROYED");
+
+    state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
+    expect(state.campaign.nodes.filter((node) => node.layer === 1)
+      .every((node) => node.status === "LOCKED")).toBe(true);
+    expect(state.campaign.nodes.some((node) => node.status === "AVAILABLE")).toBe(false);
```

## 测试用例
### TC-001 飞机损失终止 Campaign
- 类型：状态回归测试
- 优先级：高
- 前置条件：导弹命中飞机，Mission 为 `FAILED` 且 Run 为 `DEFEAT`。
- 操作步骤：派发 `RETURN_CAMPAIGN`。
- 预期结果：当前节点结算失败，下一层保持 `LOCKED`，不存在 `AVAILABLE` 节点。
- 是否通过：通过。

### TC-002 普通失败继续推进
- 类型：既有回归测试
- 优先级：高
- 前置条件：Mission 为 `FAILED`，Run 仍为 `ACTIVE`。
- 预期结果：下一层正常解锁，Enemy Alert 增加。
- 是否通过：通过。

### TC-003 工程验证
- 类型：完整回归
- 优先级：高
- 操作步骤：执行 `npm run typecheck`、`npm run test -- --run`、`npm run build` 和 `git diff --check`。
- 预期结果：全部通过。
- 是否通过：通过。
