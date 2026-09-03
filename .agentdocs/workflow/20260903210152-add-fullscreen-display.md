# 支持全屏显示

## 背景与目标
- 在顶部控制区提供明确的全屏入口，让任务网络、规划、执行与复盘界面均可进入浏览器全屏。
- 全屏状态变化必须以浏览器 Fullscreen API 为准，并与中英文界面同步。

## 约束与原则
- 不把全屏偏好写入 Run、Mission、Seed 或本地存档，避免影响模拟状态与复现结果。
- 支持按钮再次退出，以及用户按 Escape 或通过系统控件退出后的状态回写。
- 浏览器不支持 Fullscreen API 时保留入口但禁用，并通过标题说明原因。

## 阶段与 TODO
- [x] 新增独立全屏切换组件并接入顶部控制区。
- [x] 增加简体中文与 English 文案。
- [x] 增加全屏、退出、外部退出与不支持场景测试。
- [x] 完成类型检查、完整自动化测试、生产构建与浏览器交互验证。

## 关键风险
- 全屏可以由按钮外部的 Escape 或系统级控件结束，只在点击回调中维护状态会产生陈旧文案。
- 浏览器可能因权限、策略或非用户手势拒绝全屏请求，失败不得破坏当前页面。

## 当前进展
- 顶部栏已增加带状态图标的“全屏显示 / 退出全屏”入口。
- 组件监听 `fullscreenchange`，退出方式不受限于按钮本身。
- 全屏请求被拒绝时保持原界面；不支持的浏览器会禁用入口并显示原因。

## 代码变更

### `src/ui/FullscreenToggle.tsx`（新增）
```diff
--- /dev/null
+++ b/src/ui/FullscreenToggle.tsx
@@ -0,0 +1,51 @@
+import { useCallback, useEffect, useState } from "react";
+import { useI18n } from "../i18n/I18n";
+
+function fullscreenIsSupported(): boolean {
+  return document.fullscreenEnabled && typeof document.documentElement.requestFullscreen === "function";
+}
+
+export function FullscreenToggle() {
+  const { copy } = useI18n();
+  const [isFullscreen, setIsFullscreen] = useState(() => document.fullscreenElement !== null);
+  const supported = fullscreenIsSupported();
+
+  const syncFullscreenState = useCallback(() => {
+    // 浏览器也可以通过 Escape 或系统级控件退出全屏，因此状态必须以 Fullscreen API 为准。
+    setIsFullscreen(document.fullscreenElement !== null);
+  }, []);
+
+  useEffect(() => {
+    document.addEventListener("fullscreenchange", syncFullscreenState);
+    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
+  }, [syncFullscreenState]);
+
+  const toggleFullscreen = async () => {
+    try {
+      if (document.fullscreenElement) {
+        await document.exitFullscreen();
+      } else {
+        await document.documentElement.requestFullscreen();
+      }
+    } catch {
+      // 浏览器可能因权限或非用户手势拒绝请求；保持当前界面和真实全屏状态不变。
+    } finally {
+      syncFullscreenState();
+    }
+  };
+
+  const label = isFullscreen ? copy.app.exitFullscreen : copy.app.enterFullscreen;
+
+  return <button
+    type="button"
+    className={`fullscreen-trigger ${isFullscreen ? "active" : ""}`}
+    onClick={() => { void toggleFullscreen(); }}
+    disabled={!supported}
+    aria-label={label}
+    aria-pressed={isFullscreen}
+    title={supported ? label : copy.app.fullscreenUnavailable}
+  >
+    <i aria-hidden="true" />
+    <span>{label}</span>
+  </button>;
+}
```

### `src/ui/App.tsx`
```diff
--- a/src/ui/App.tsx
+++ b/src/ui/App.tsx
@@ -12,6 +12,7 @@
 import { MissionWorkspace } from "./workspaces/MissionWorkspace";
 import { GameplayGuide } from "./GameplayGuide";
 import { LanguageSelector } from "./LanguageSelector";
+import { FullscreenToggle } from "./FullscreenToggle";
 import { MissionTutorial, type TutorialContext } from "./MissionTutorial";
 import { useI18n } from "../i18n/I18n";
@@ -114,6 +115,7 @@
       <div className="topbar-controls">
         <LanguageSelector />
         <button ref={guideTriggerRef} type="button" className="guide-trigger" onClick={() => setGuideOpen(true)}>{copy.app.instructions}</button>
+        <FullscreenToggle />
         <div className="audio-control">
```

### `src/i18n/I18n.tsx`
```diff
--- a/src/i18n/I18n.tsx
+++ b/src/i18n/I18n.tsx
@@ -44,6 +44,9 @@
       selectLanguage: "选择语言",
       languageDialogTitle: "界面语言",
       currentLanguage: "当前",
+      enterFullscreen: "全屏显示",
+      exitFullscreen: "退出全屏",
+      fullscreenUnavailable: "当前浏览器不支持全屏显示",
@@ -388,6 +391,9 @@
       selectLanguage: "Select language",
       languageDialogTitle: "INTERFACE LANGUAGE",
       currentLanguage: "CURRENT",
+      enterFullscreen: "FULLSCREEN",
+      exitFullscreen: "EXIT FULLSCREEN",
+      fullscreenUnavailable: "Fullscreen is not supported by this browser",
```

### `src/ui/styles.css`
```diff
--- a/src/ui/styles.css
+++ b/src/ui/styles.css
@@ -22,7 +22,13 @@
 .topbar-controls { display: flex; align-items: center; gap: 16px; }
 .topbar-controls > button, .language-selector > .language-trigger, .audio-control > button, .seed-control input, .seed-control > button { box-sizing: border-box; height: 30px; }
-.guide-trigger, .language-trigger { padding: 7px 10px; color: #dcb35a; border-color: #765b2b; font-size: 9px; letter-spacing: 0.08em; white-space: nowrap; }
+.guide-trigger, .language-trigger, .fullscreen-trigger { padding: 7px 10px; color: #dcb35a; border-color: #765b2b; font-size: 9px; letter-spacing: 0.08em; white-space: nowrap; }
+.fullscreen-trigger { display: flex; align-items: center; gap: 7px; color: #8eb6aa; border-color: #31584b; }
+.fullscreen-trigger.active { color: #f1c466; border-color: #b88a35; background: rgba(98, 70, 22, 0.24); }
+.fullscreen-trigger i { position: relative; width: 10px; height: 10px; border: 1px solid currentColor; }
+.fullscreen-trigger i::before { content: ""; position: absolute; inset: 2px; border: 1px solid #0b1b17; background: #0b1b17; }
+.fullscreen-trigger:hover:not(:disabled) i::before { border-color: #102a23; background: #102a23; }
+.fullscreen-trigger.active i::before { border-color: rgba(98, 70, 22, 0.24); background: rgba(98, 70, 22, 0.24); }
 .language-selector { position: relative; }
```

### `src/ui/FullscreenToggle.test.tsx`（新增）
```diff
--- /dev/null
+++ b/src/ui/FullscreenToggle.test.tsx
@@ -0,0 +1,71 @@
+import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
+import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
+import { I18nProvider } from "../i18n/I18n";
+import { FullscreenToggle } from "./FullscreenToggle";
+
+let fullscreenElement: Element | null;
+let requestFullscreen: ReturnType<typeof vi.fn>;
+let exitFullscreen: ReturnType<typeof vi.fn>;
+
+beforeEach(() => {
+  fullscreenElement = null;
+  requestFullscreen = vi.fn(async () => {
+    fullscreenElement = document.documentElement;
+    document.dispatchEvent(new Event("fullscreenchange"));
+  });
+  exitFullscreen = vi.fn(async () => {
+    fullscreenElement = null;
+    document.dispatchEvent(new Event("fullscreenchange"));
+  });
+
+  Object.defineProperties(document, {
+    fullscreenEnabled: { configurable: true, value: true },
+    fullscreenElement: { configurable: true, get: () => fullscreenElement },
+    exitFullscreen: { configurable: true, value: exitFullscreen },
+  });
+  Object.defineProperty(document.documentElement, "requestFullscreen", {
+    configurable: true,
+    value: requestFullscreen,
+  });
+});
+
+afterEach(() => {
+  cleanup();
+  vi.restoreAllMocks();
+});
+
+describe("全屏切换", () => {
+  it("进入和退出全屏时同步按钮状态", async () => {
+    render(<I18nProvider initialLanguage="zh" persist={false}><FullscreenToggle /></I18nProvider>);
+
+    fireEvent.click(screen.getByRole("button", { name: "全屏显示" }));
+
+    await waitFor(() => expect(requestFullscreen).toHaveBeenCalledOnce());
+    const exitButton = screen.getByRole("button", { name: "退出全屏" });
+    expect(exitButton).toHaveAttribute("aria-pressed", "true");
+
+    fireEvent.click(exitButton);
+
+    await waitFor(() => expect(exitFullscreen).toHaveBeenCalledOnce());
+    expect(screen.getByRole("button", { name: "全屏显示" })).toHaveAttribute("aria-pressed", "false");
+  });
+
+  it("通过 Escape 退出时根据浏览器事件恢复入口文案", async () => {
+    fullscreenElement = document.documentElement;
+    render(<I18nProvider initialLanguage="en" persist={false}><FullscreenToggle /></I18nProvider>);
+
+    expect(screen.getByRole("button", { name: "EXIT FULLSCREEN" })).toBeInTheDocument();
+    fullscreenElement = null;
+    document.dispatchEvent(new Event("fullscreenchange"));
+
+    await waitFor(() => expect(screen.getByRole("button", { name: "FULLSCREEN" })).toHaveAttribute("aria-pressed", "false"));
+  });
+
+  it("浏览器不支持 Fullscreen API 时禁用入口并提供原因", () => {
+    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: false });
+    render(<I18nProvider initialLanguage="zh" persist={false}><FullscreenToggle /></I18nProvider>);
+
+    expect(screen.getByRole("button", { name: "全屏显示" })).toBeDisabled();
+    expect(screen.getByRole("button", { name: "全屏显示" })).toHaveAttribute("title", "当前浏览器不支持全屏显示");
+  });
+});
```

## 测试用例

### TC-001 顶部入口进入与退出全屏
- 类型：功能测试
- 优先级：高
- 关联模块：`FullscreenToggle`
- 前置条件：浏览器支持 Fullscreen API，页面已加载。
- 操作步骤：
  1. 点击顶部“全屏显示”。
  2. 观察按钮状态。
  3. 点击“退出全屏”。
- 预期结果：
  - 页面进入浏览器全屏，按钮显示“退出全屏”并进入激活态。
  - 再次点击后退出全屏，按钮恢复“全屏显示”。
- 是否通过：通过（自动化测试与浏览器实测）。

### TC-002 外部退出状态同步
- 类型：状态同步测试
- 优先级：高
- 关联模块：`FullscreenToggle`
- 前置条件：页面处于全屏状态。
- 操作步骤：通过 Escape 或浏览器系统控件退出全屏。
- 预期结果：按钮恢复“全屏显示”，`aria-pressed` 为 `false`。
- 是否通过：通过（自动化测试）。

### TC-003 不支持全屏的降级行为
- 类型：兼容性测试
- 优先级：中
- 关联模块：`FullscreenToggle`
- 前置条件：浏览器不提供 Fullscreen API。
- 操作步骤：加载页面并检查顶部全屏入口。
- 预期结果：入口禁用，标题提示当前浏览器不支持全屏显示。
- 是否通过：通过（自动化测试）。

## 验证记录
- `npm run typecheck`：通过。
- `npm run test`：通过，33 个测试文件、157 项测试全部通过。
- `npm run build`：通过，Vite 生产构建成功。
- 本地浏览器验证：入口可见且可操作；进入后切换为“退出全屏”，退出后恢复；顶部栏无横向溢出。
