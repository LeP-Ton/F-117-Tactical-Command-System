# 任务入口文案与侧栏分割线统一

## 背景与目标
- 任务网络入口按钮与进入后的页面标题应使用同一口径。
- 所有返回任务网络按钮应保持相同文案、宽度和黄色主按钮视觉。
- 修复 THREAT WARNING 与 FUEL RANGE 之间异常红色分割线。

## 约束与原则
- 不修改任务权限、页面跳转或 Campaign 行为。
- 保留威胁告警文字、进度条和导弹来袭辉光，仅恢复模块分割线颜色。

## 阶段与 TODO
- [x] “任务复盘”统一为“复盘任务”。
- [x] “查看情报”统一为“预览任务”。
- [x] 对应页面标题同步更新。
- [x] 返回任务网络按钮增加统一全宽黄色样式。
- [x] 修复威胁模块底部分割线颜色覆盖。
- [x] 增加任务网络和 Workspace 文案测试。

## 根因
- `.panel-section` 使用底边框分隔相邻模块。
- `.threat-section { border-color: rgba(216, 104, 67, 0.35) }` 覆盖了该底边框，因此 THREAT WARNING 与 FUEL RANGE 之间呈红色。
- 修复后仅指定标准 `border-bottom-color`，其他威胁告警颜色不受影响。

## 代码变更
```diff
-                ? selectedDebrief ? "任务复盘" : "任务已完成"
+                ? selectedDebrief ? "复盘任务" : "任务已完成"
-                  : selected.status === "LOCKED" ? "查看情报" : "执行任务"}
+                  : selected.status === "LOCKED" ? "预览任务" : "执行任务"}
```

```diff
-        <h2>任务情报</h2>
+        <h2>预览任务</h2>
-        <h2>任务复盘</h2>
+        <h2>复盘任务</h2>
-          <button className="primary-button" onClick={onClose}>返回任务网络</button>
+          <button className="primary-button return-network-button" onClick={onClose}>返回任务网络</button>
```

```diff
 .primary-button { flex: 1 0 100%; border-color: #b88a35; color: #f1c466; background: rgba(98, 70, 22, 0.24); }
+.return-network-button { width: 100%; flex: 1 0 100%; }
-.threat-section { border-color: rgba(216, 104, 67, 0.35); }
+.threat-section { border-bottom-color: #173329; }
-.threat-missile_inbound { border-color: #e2523b; box-shadow: inset 0 0 24px rgba(226, 82, 59, 0.1); }
+.threat-missile_inbound { border-bottom-color: #173329; box-shadow: inset 0 0 24px rgba(226, 82, 59, 0.1); }
```

```diff
+describe("任务网络入口文案", () => {
+  it("锁定节点使用预览任务", ...);
+  it("已完成节点使用复盘任务", ...);
+});
+it("预览与复盘页面标题匹配入口文案且共用返回按钮样式", ...);
```

## 测试用例
### TC-001 任务网络入口
- 预期：锁定节点显示“预览任务”，有快照的已完成节点显示“复盘任务”。
- 是否通过：通过。

### TC-002 页面标题
- 预期：预览页标题为“预览任务”，复盘页标题为“复盘任务”。
- 是否通过：通过。

### TC-003 返回按钮
- 预期：所有“返回任务网络”按钮同时具有 `primary-button` 和 `return-network-button`。
- 是否通过：通过。

### TC-004 分割线
- 预期：THREAT WARNING 底边框保持标准绿色，导弹来袭时红色告警内容仍保留。
- 是否通过：通过。

## 验证结果
- `npm run typecheck`：通过。
- `npm run test`：通过，27 个测试文件、117 个测试全部通过。
- `npm run build`：通过。
- `git diff --check`：通过。
