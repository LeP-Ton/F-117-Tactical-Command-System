# 增加可扩展语言选择弹窗

## 背景与目标
- 顶部语言按钮原先通过 `zh ↔ en` 三元表达式直接翻转，只适用于两种语言。
- 按钮显示的是“另一种语言”，无法表达当前语言，也无法在增加第三种语言时自然扩展。
- 本次改为独立语言选择弹窗，由集中配置渲染所有候选语言并标记当前项。

## 约束与原则
- 语言偏好仍由现有国际化上下文保存，不进入任务存档、Seed 或模拟状态。
- 保持顶部控件 `30px` 等高规则，只允许弹窗内部选项使用独立高度。
- 支持键盘与指针关闭方式，并在键盘关闭或完成选择后恢复触发按钮焦点。
- 不更新 `AGENTS.md`，因为双语能力与状态边界没有变化，本次只优化选择交互与扩展结构。

## 阶段与 TODO
- [x] 将语言选项抽为集中式配置。
- [x] 将直接切换按钮替换为语言选择弹窗。
- [x] 增加当前语言标记、外部点击关闭和 `Escape` 关闭。
- [x] 补齐中英文弹窗文案并删除两语言翻转文案。
- [x] 增加组件交互测试。
- [x] 在实际页面验证布局、切换与键盘关闭。
- [x] 完成类型检查、完整测试与生产构建。

## 关键风险
- 顶部统一按钮高度选择器不能误伤弹窗内部语言选项。
- 切换语言会立即替换无障碍名称，焦点恢复必须指向重渲染后的同一触发按钮。
- 点击弹窗外部关闭时应保留用户点击位置的自然焦点行为，不强制抢回焦点。

## 当前进展
- 顶部按钮显示当前语言“中文”或 `EN`，不再显示目标语言。
- 弹窗从 `languageOptions` 集中配置渲染“简体中文”和 `English`，新增语言时无需改写顶部切换逻辑。
- 当前语言以金色选中状态和“当前 / CURRENT”标记呈现。
- 弹窗支持选择、再次点击触发按钮、点击外部和 `Escape` 关闭。
- 浏览器实测触发按钮保持 `30px` 高，两个语言选项均为 `36px` 高，弹窗不会改变其他顶部控件尺寸。

## 代码变更
- `src/ui/LanguageSelector.tsx`：新增集中配置驱动的语言选择弹窗。

```diff
--- /dev/null
+++ b/src/ui/LanguageSelector.tsx
@@
+import { useEffect, useRef, useState } from "react";
+import { useI18n, type Language } from "../i18n/I18n";
+
+interface LanguageOption {
+  id: Language;
+  shortLabel: string;
+  nativeLabel: string;
+}
+
+/**
+ * 所有可选语言集中维护在这里。后续增加语言时只需扩展语言目录与本列表，
+ * 顶部工具栏不再依赖“两种语言互相翻转”的特殊逻辑。
+ */
+export const languageOptions = [
+  { id: "zh", shortLabel: "中文", nativeLabel: "简体中文" },
+  { id: "en", shortLabel: "EN", nativeLabel: "English" },
+] satisfies readonly LanguageOption[];
+
+export function LanguageSelector() {
+  const { language, setLanguage, copy } = useI18n();
+  const [open, setOpen] = useState(false);
+  const rootRef = useRef<HTMLDivElement>(null);
+  const triggerRef = useRef<HTMLButtonElement>(null);
+  const selectedOptionRef = useRef<HTMLButtonElement>(null);
+  const currentOption = languageOptions.find((option) => option.id === language) ?? languageOptions[0];
+
+  const closeAndRestoreFocus = () => {
+    setOpen(false);
+    triggerRef.current?.focus();
+  };
+
+  useEffect(() => {
+    if (!open) return;
+    selectedOptionRef.current?.focus();
+
+    const handleKeyDown = (event: KeyboardEvent) => {
+      if (event.key !== "Escape") return;
+      event.preventDefault();
+      closeAndRestoreFocus();
+    };
+    const handlePointerDown = (event: PointerEvent) => {
+      if (rootRef.current?.contains(event.target as Node)) return;
+      setOpen(false);
+    };
+
+    document.addEventListener("keydown", handleKeyDown);
+    document.addEventListener("pointerdown", handlePointerDown);
+    return () => {
+      document.removeEventListener("keydown", handleKeyDown);
+      document.removeEventListener("pointerdown", handlePointerDown);
+    };
+  }, [open]);
+
+  return <div className="language-selector" ref={rootRef}>
+    <button
+      ref={triggerRef}
+      type="button"
+      className="language-trigger"
+      aria-label={copy.app.selectLanguage}
+      aria-haspopup="dialog"
+      aria-expanded={open}
+      onClick={() => setOpen((value) => !value)}
+    >
+      <span>{currentOption.shortLabel}</span>
+      <i className={open ? "expanded" : ""} aria-hidden="true" />
+    </button>
+    {open && <div className="language-popover" role="dialog" aria-label={copy.app.languageDialogTitle}>
+      <div className="language-popover-title">{copy.app.languageDialogTitle}</div>
+      <div className="language-option-list">
+        {languageOptions.map((option) => {
+          const selected = option.id === language;
+          return <button
+            key={option.id}
+            ref={selected ? selectedOptionRef : undefined}
+            type="button"
+            className={`language-option ${selected ? "active" : ""}`}
+            aria-pressed={selected}
+            onClick={() => {
+              setLanguage(option.id);
+              closeAndRestoreFocus();
+            }}
+          >
+            <span className="language-option-code">{option.id.toUpperCase()}</span>
+            <span className="language-option-name">{option.nativeLabel}</span>
+            {selected && <span className="language-option-status">{copy.app.currentLanguage}</span>}
+          </button>;
+        })}
+      </div>
+    </div>}
+  </div>;
+}
```

- `src/ui/App.tsx`：使用语言选择组件替代内联二元切换按钮。

```diff
 import { MissionWorkspace } from "./workspaces/MissionWorkspace";
 import { GameplayGuide } from "./GameplayGuide";
+import { LanguageSelector } from "./LanguageSelector";
 import { useI18n } from "../i18n/I18n";
@@
 export function App() {
-  const { language, setLanguage, copy } = useI18n();
+  const { copy } = useI18n();
@@
       </div>
       <div className="topbar-controls">
-        <button
-          type="button"
-          className="language-trigger"
-          aria-label={copy.app.switchLanguage}
-          title={copy.app.switchLanguage}
-          onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
-        >
-          {copy.app.languageButton}
-        </button>
+        <LanguageSelector />
```

- `src/i18n/I18n.tsx`：用选择弹窗文案替代目标语言翻转文案。

```diff
       operationCode: "行动代码",
       initializeNetwork: "初始化任务网络",
-      switchLanguage: "切换为英文",
-      languageButton: "EN",
+      selectLanguage: "选择语言",
+      languageDialogTitle: "界面语言",
+      currentLanguage: "当前",
@@
       operationCode: "OPERATION CODE",
       initializeNetwork: "INITIALIZE MISSION NETWORK",
-      switchLanguage: "Switch to Chinese",
-      languageButton: "中文",
+      selectLanguage: "Select language",
+      languageDialogTitle: "INTERFACE LANGUAGE",
+      currentLanguage: "CURRENT",
```

- `src/i18n/I18n.test.tsx`：调整国际化基础测试，不再依赖已删除的翻转按钮文案。

```diff
 function LanguageProbe() {
   const { language, setLanguage, copy } = useI18n();
   return <>
     <span>{copy.campaign.title}</span>
-    <button onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>{copy.app.languageButton}</button>
+    <button aria-label={copy.app.selectLanguage} onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>{language}</button>
@@
     expect(collectKeyPaths(localeCatalogs.en)).toEqual(collectKeyPaths(localeCatalogs.zh));
     const untranslatedEnglish = collectStrings(localeCatalogs.en)
-      .filter(([path, value]) => path !== "app.languageButton" && /[\u3400-\u9fff]/u.test(value));
+      .filter(([, value]) => /[\u3400-\u9fff]/u.test(value));
@@
-    fireEvent.click(screen.getByRole("button", { name: "EN" }));
+    fireEvent.click(screen.getByRole("button", { name: "选择语言" }));
```

- `src/ui/styles.css`：增加弹窗与选项样式，并限制顶部等高规则只作用于外层控件。

```diff
 .topbar-controls { display: flex; align-items: center; gap: 16px; }
-.topbar-controls button, .seed-control input { box-sizing: border-box; height: 30px; }
+.topbar-controls > button, .language-selector > .language-trigger, .audio-control > button, .seed-control input, .seed-control > button { box-sizing: border-box; height: 30px; }
 .guide-trigger, .language-trigger { padding: 7px 10px; color: #dcb35a; border-color: #765b2b; font-size: 9px; letter-spacing: 0.08em; white-space: nowrap; }
-.language-trigger { min-width: 38px; color: #8eb6aa; border-color: #31584b; }
+.language-selector { position: relative; }
+.language-trigger { min-width: 58px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #8eb6aa; border-color: #31584b; }
+.language-trigger i { width: 6px; height: 6px; border-right: 1px solid currentColor; border-bottom: 1px solid currentColor; transform: translateY(-2px) rotate(45deg); transition: transform 140ms ease; }
+.language-trigger i.expanded { transform: translateY(2px) rotate(225deg); }
+.language-popover { position: absolute; z-index: 40; top: calc(100% + 9px); left: 0; width: 210px; padding: 12px; border: 1px solid #31584b; background: rgba(5, 15, 12, 0.98); box-shadow: 0 14px 32px rgba(0, 0, 0, 0.5), inset 0 0 24px rgba(31, 73, 60, 0.08); }
+.language-popover-title { padding: 2px 3px 10px; color: #648c80; font-size: 9px; letter-spacing: 0.12em; }
+.language-option-list { display: grid; gap: 6px; }
+.language-option-list .language-option { width: 100%; height: 36px; display: grid; grid-template-columns: 30px 1fr auto; align-items: center; gap: 9px; padding: 0 9px; text-align: left; }
+.language-option.active { border-color: #b88a35; color: #f1c466; background: rgba(98, 70, 22, 0.24); }
+.language-option-code { color: #638f80; font-size: 8px; letter-spacing: 0.08em; }
+.language-option.active .language-option-code { color: #c89d48; }
+.language-option-name { font-size: 10px; }
+.language-option-status { color: #b88a35; font-size: 7px; letter-spacing: 0.08em; }
```

- `src/ui/LanguageSelector.test.tsx`：覆盖候选列表、选中状态、语言切换、焦点恢复及关闭方式。

```diff
--- /dev/null
+++ b/src/ui/LanguageSelector.test.tsx
@@
+import { cleanup, fireEvent, render, screen } from "@testing-library/react";
+import { afterEach, describe, expect, it } from "vitest";
+import { I18nProvider, useI18n } from "../i18n/I18n";
+import { LanguageSelector, languageOptions } from "./LanguageSelector";
+
+afterEach(() => {
+  cleanup();
+  localStorage.clear();
+});
+
+function SelectorProbe() {
+  const { copy } = useI18n();
+  return <>
+    <LanguageSelector />
+    <span>{copy.campaign.title}</span>
+  </>;
+}
+
+describe("语言选择弹窗", () => {
+  it("从集中配置渲染全部语言并标记当前项", () => {
+    render(<I18nProvider initialLanguage="zh"><SelectorProbe /></I18nProvider>);
+
+    const trigger = screen.getByRole("button", { name: "选择语言" });
+    expect(trigger).toHaveTextContent("中文");
+    expect(trigger).toHaveAttribute("aria-expanded", "false");
+
+    fireEvent.click(trigger);
+    expect(screen.getByRole("dialog", { name: "界面语言" })).toBeInTheDocument();
+    expect(screen.getAllByRole("button")).toHaveLength(languageOptions.length + 1);
+    expect(screen.getByRole("button", { name: /简体中文/ })).toHaveAttribute("aria-pressed", "true");
+    expect(screen.getByRole("button", { name: /English/ })).toHaveAttribute("aria-pressed", "false");
+  });
+
+  it("选择语言后立即更新界面、关闭弹窗并恢复触发按钮焦点", () => {
+    render(<I18nProvider initialLanguage="zh"><SelectorProbe /></I18nProvider>);
+
+    fireEvent.click(screen.getByRole("button", { name: "选择语言" }));
+    fireEvent.click(screen.getByRole("button", { name: /English/ }));
+
+    expect(screen.getByText("MISSION NETWORK")).toBeInTheDocument();
+    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
+    expect(screen.getByRole("button", { name: "Select language" })).toHaveFocus();
+    expect(localStorage.getItem("f117-tactical-command-system:language:v1")).toBe("en");
+  });
+
+  it("支持 Escape 与点击弹窗外部关闭", () => {
+    render(<I18nProvider initialLanguage="zh"><SelectorProbe /></I18nProvider>);
+    const trigger = screen.getByRole("button", { name: "选择语言" });
+
+    fireEvent.click(trigger);
+    fireEvent.keyDown(document, { key: "Escape" });
+    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
+    expect(trigger).toHaveFocus();
+
+    fireEvent.click(trigger);
+    fireEvent.pointerDown(document.body);
+    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
+  });
+});
```

## 测试用例
### TC-001 语言候选与当前状态
- 类型：组件测试 / 浏览器验证
- 优先级：高
- 操作步骤：点击顶部当前语言按钮。
- 预期结果：弹窗列出全部配置语言，当前项显示选中色及状态文案。
- 是否通过：通过。

### TC-002 选择语言
- 类型：组件测试 / 浏览器验证
- 优先级：高
- 操作步骤：在中文界面选择 `English`。
- 预期结果：弹窗关闭，整页立即切换为英文，按钮显示 `EN`，偏好保存为 `en`。
- 是否通过：通过。

### TC-003 关闭与焦点
- 类型：组件测试 / 浏览器验证
- 优先级：中
- 操作步骤：分别使用 `Escape` 和点击外部关闭弹窗。
- 预期结果：两种方式均关闭弹窗；`Escape` 将焦点恢复到触发按钮。
- 是否通过：通过。

### TC-004 工程校验
- 类型：自动化验证
- 优先级：高
- 操作步骤：运行 `npm run typecheck`、`npm run test -- --run` 和 `npm run build`。
- 预期结果：类型检查、全部测试与生产构建通过。
- 是否通过：通过，30 个测试文件、144 个测试用例全部通过。
