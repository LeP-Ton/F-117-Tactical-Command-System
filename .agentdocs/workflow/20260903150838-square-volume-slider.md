# 音量滑杆直角化

## 背景与目标
- 顶部音量控件原生滑杆使用圆角轨道和圆形滑块，与战术终端的硬边视觉语言不一致。
- 将轨道改为直角矩形，将调节滑块改为直角等边菱形，同时保留音量填充反馈。

## 约束与原则
- 不修改静音、音量存储或 Web Audio 行为。
- 保持现有控件宽度及顶部工具栏布局不变。
- 同时覆盖 Chromium/WebKit 与 Firefox 的范围输入样式。

## 阶段与 TODO
- [x] 为音量输入传入当前百分比 CSS 变量。
- [x] 将滑杆轨道改为无圆角矩形。
- [x] 将滑块改为旋转 `45deg` 的等边方形。
- [x] 保留键盘焦点反馈并验证音量填充同步。

## 关键风险
- 浏览器对 `range` 伪元素的实现不同，需要分别声明 WebKit 与 Firefox 样式。
- 自定义外观会移除浏览器默认焦点效果，因此需要补回键盘可见焦点。

## 当前进展
- 音量轨道已使用硬边边框、金色已调区域和深色剩余区域。
- 音量滑块已改为 `12px × 12px`、旋转 45° 的金色直角菱形。
- 实际浏览器键盘调节时，CSS 填充百分比会随 React 音量状态同步更新。

## 代码变更
- `src/ui/App.tsx`
```diff
-import { useCallback, useEffect, useRef, useState } from "react";
+import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
@@
-          <input id="master-volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label={copy.app.volumeLabel} />
+          <input
+            id="master-volume"
+            type="range"
+            min="0"
+            max="1"
+            step="0.05"
+            value={volume}
+            style={{ "--audio-volume": `${volume * 100}%` } as CSSProperties}
+            onChange={(event) => setVolume(Number(event.target.value))}
+            aria-label={copy.app.volumeLabel}
+          />
```

- `src/ui/styles.css`
```diff
-.audio-control input { width: 76px; accent-color: #c1943f; }
+.audio-control input[type="range"] {
+  width: 76px;
+  height: 18px;
+  margin: 0 4px;
+  padding: 0;
+  border: 0;
+  outline: 0;
+  appearance: none;
+  -webkit-appearance: none;
+  background: transparent;
+  cursor: pointer;
+}
+.audio-control input[type="range"]::-webkit-slider-runnable-track {
+  height: 6px;
+  border: 1px solid #66706d;
+  border-radius: 0;
+  background: linear-gradient(to right, #c1943f 0, #c1943f var(--audio-volume), #232927 var(--audio-volume), #232927 100%);
+}
+.audio-control input[type="range"]::-webkit-slider-thumb {
+  width: 12px;
+  height: 12px;
+  margin-top: -4px;
+  border: 1px solid #e0b457;
+  border-radius: 0;
+  appearance: none;
+  -webkit-appearance: none;
+  background: #c1943f;
+  transform: rotate(45deg);
+}
+.audio-control input[type="range"]::-moz-range-track {
+  height: 4px;
+  border: 1px solid #66706d;
+  border-radius: 0;
+  background: linear-gradient(to right, #c1943f 0, #c1943f var(--audio-volume), #232927 var(--audio-volume), #232927 100%);
+}
+.audio-control input[type="range"]::-moz-range-progress { background: transparent; }
+.audio-control input[type="range"]::-moz-range-thumb {
+  width: 12px;
+  height: 12px;
+  border: 1px solid #e0b457;
+  border-radius: 0;
+  background: #c1943f;
+  transform: rotate(45deg);
+}
+.audio-control input[type="range"]:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 2px rgba(224, 180, 87, 0.32); }
+.audio-control input[type="range"]:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 2px rgba(224, 180, 87, 0.32); }
```

## 测试用例
### TC-001 直角轨道与菱形滑块
- 类型：浏览器渲染检查
- 优先级：高
- 操作步骤：
  1. 打开游戏顶部工具栏。
  2. 检查音量轨道与滑块。
- 预期结果：轨道四角无圆角；滑块为直角等边菱形。
- 是否通过：通过。

### TC-002 音量填充同步
- 类型：交互测试
- 优先级：高
- 操作步骤：聚焦音量滑杆并通过键盘改变数值。
- 预期结果：音量值与金色填充终点同步变化。
- 是否通过：通过，验证由 `35%` 更新到 `60%`。

### TC-003 工程验证
- 类型：自动化测试
- 优先级：高
- 操作步骤：运行类型检查、测试与生产构建。
- 预期结果：全部通过。
- 是否通过：通过，`npm run typecheck`、`npm run test`（31 个测试文件、147 个用例）与 `npm run build` 均成功。
