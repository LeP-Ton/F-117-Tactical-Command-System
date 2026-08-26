# 规划任务入口文案统一

## 背景与目标
- 任务网络入口、进入后的页面标题和返回按钮需要采用统一动作口径。

## 阶段与 TODO
- [x] 任务网络“执行任务”改为“规划任务”。
- [x] 规划页面“任务规划”改为“规划任务”。
- [x] 规划页面“任务网络”改为“返回任务网络”。
- [x] 返回按钮接入统一黄色全宽样式。
- [x] 补充入口和页面测试。

## 代码变更
```diff
-                  : selected.status === "LOCKED" ? "预览任务" : "执行任务"}
+                  : selected.status === "LOCKED" ? "预览任务" : "规划任务"}
```

```diff
-  PLANNING: "任务规划",
+  PLANNING: "规划任务",
-            <button className="secondary-button" onClick={onOpenCampaign}>任务网络</button>
+            <button className="primary-button return-network-button" onClick={onOpenCampaign}>返回任务网络</button>
```

```diff
+  it("可执行节点使用规划任务", () => {
+    expect(screen.getByRole("button", { name: "规划任务" })).toBeInTheDocument();
+  });
+  it("规划页面使用规划任务标题和统一返回按钮", () => {
+    expect(screen.getByRole("heading", { name: "规划任务" })).toBeInTheDocument();
+    expect(screen.getByRole("button", { name: "返回任务网络" })).toHaveClass("primary-button", "return-network-button");
+  });
```

## 验证结果
- `npm run typecheck`：通过。
- `npm run test`：通过，27 个测试文件、119 个测试全部通过。
- `npm run build`：通过。
