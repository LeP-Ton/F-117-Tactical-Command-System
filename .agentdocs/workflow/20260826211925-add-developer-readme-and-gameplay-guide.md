# 开发者 README 与游戏内玩法说明

## 背景与目标
- 旧 README 和机制手册仍描述暂停、刷新后暂停及任意 AI DEBUG 等过时规则。
- 为开发者提供可独立理解任务网络、雷达数据链和架构边界的入口。
- 为玩家提供按需打开、不会破坏战术界面沉浸感的简明玩法说明。

## 约束与原则
- 说明弹窗不 dispatch、不暂停 Tick、不停止音频、不写入存档。
- 游戏内只说明玩家需要掌握的规则；精确算法继续放在开发者文档和机制手册。
- 保留会话-102/103 的入口文案和 UI 修改。

## 阶段与 TODO
- [x] 重写开发者 README。
- [x] 修正机制手册的暂停、INTEL、TOTAL INTEL、预览与复盘规则。
- [x] 新增顶部玩法说明入口和独立弹窗。
- [x] 支持按钮、遮罩和 Escape 关闭。
- [x] 打开时聚焦关闭按钮，关闭后恢复入口焦点。
- [x] 增加独立滚动与实时任务继续运行提示。
- [x] 增加玩法说明渲染和交互测试。

## 代码变更
```diff
+interface GameplayGuideProps {
+  open: boolean;
+  onClose: () => void;
+  triggerRef: RefObject<HTMLButtonElement | null>;
+}
+export function GameplayGuide({ open, onClose, triggerRef }: GameplayGuideProps) {
+  const closeButtonRef = useRef<HTMLButtonElement>(null);
+  useEffect(() => {
+    if (!open) return;
+    closeButtonRef.current?.focus();
+    const handleKeyDown = (event: KeyboardEvent) => {
+      if (event.key === "Escape") {
+        onClose();
+        triggerRef.current?.focus();
+      }
+    };
+    window.addEventListener("keydown", handleKeyDown);
+    return () => window.removeEventListener("keydown", handleKeyDown);
+  }, [onClose, open, triggerRef]);
+  if (!open) return null;
+  return <div className="guide-backdrop">...</div>;
+}
```

```diff
-import { useEffect, useRef, useState } from "react";
+import { useCallback, useEffect, useRef, useState } from "react";
+  const [guideOpen, setGuideOpen] = useState(false);
+  const guideTriggerRef = useRef<HTMLButtonElement>(null);
+  const closeGuide = useCallback(() => setGuideOpen(false), []);
+  <button ref={guideTriggerRef} className="guide-trigger" onClick={() => setGuideOpen(true)}>玩法说明</button>
+  <GameplayGuide open={guideOpen} onClose={closeGuide} triggerRef={guideTriggerRef} />
```

```diff
+.guide-backdrop { position: fixed; z-index: 20; inset: 0; display: grid; place-items: center; ... }
+.gameplay-guide { width: min(760px, calc(100vw - 64px)); max-height: calc(100vh - 64px); ... }
+.gameplay-guide-content { min-height: 0; overflow-y: auto; ... }
```

```diff
+describe("GameplayGuide", () => {
+  it("显示简明玩法与任务持续运行提示", ...);
+  it("关闭按钮、遮罩和 Escape 都会关闭并恢复入口焦点", ...);
+});
```

## 文档变更
- README 新增开发运行、单任务循环、任务网络、INTEL 权限、三类雷达、防空交战、敌方认知数据链、环境、复盘、存档和扩展边界。
- 机制手册移除旧暂停流程，补充执行中未来航点调整。
- AI DEBUG 说明更新为二次 INTEL 解锁的 `TOTAL INTEL` 与开发参数入口。
- 增加锁定节点预览、成功快照和双视角复盘说明。

## 测试用例
### TC-001 说明内容
- 预期：弹窗具备 dialog 语义，显示玩法章节和“任务模拟继续运行”。
- 是否通过：通过。

### TC-002 关闭与焦点
- 预期：按钮、遮罩、Escape 均调用关闭；焦点回到顶部入口。
- 是否通过：通过。

### TC-003 文档一致性
- 预期：README 和机制手册不再把暂停、刷新后暂停或任意 AI DEBUG 描述为当前规则。
- 是否通过：通过。

## 验证结果
- `npm run typecheck`：通过。
- `npm run test`：通过，28 个测试文件、121 个测试全部通过。
- `npm run build`：通过。
- `git diff --check`：通过。
