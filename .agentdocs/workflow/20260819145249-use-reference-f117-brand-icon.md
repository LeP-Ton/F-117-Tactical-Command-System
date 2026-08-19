# 使用参考图片更新 F-117 品牌图标

## 背景与目标
- 会话-2 的手绘 SVG 侧面图标不符合预期。
- 改用用户指定的 `.temp/image copy 2.png` 原始 F-117 侧面轮廓，并在界面中显示为金色。

## 约束与原则
- 严格保留参考图片的轮廓、比例和朝向，不重新绘制机体。
- 参考 PNG 的 Alpha 通道实际完全不透明，因此使用 SVG 颜色矩阵按亮度提取黑色机体，并将颜色统一为 `#D3A744`。
- 保留参考源文件不变，将项目使用副本放入 `src/assets/`。

## 阶段与 TODO
- [x] 检查参考图片内容与尺寸。
- [x] 复制参考图到项目资源目录。
- [x] 删除会话-2 的手绘 SVG，通过 SVG 滤镜接入参考图轮廓。
- [x] 补充 Vite 静态资源类型声明。
- [x] 完成类型检查、自动化测试与生产构建复验。

## 关键风险
- 参考图白底为完全不透明像素，不能直接使用 Alpha 蒙版；颜色矩阵将白色映射为透明、黑色映射为金色，并通过 Alpha 曲线抑制浅色水印。
- 参考图片宽高比约为 4.93:1，因此顶部图标宽度由 64px 调整为 92px，以保持侧面轮廓可辨识。

## 代码变更
- `src/assets/f117-side-silhouette.png`
```diff
+ 新增二进制图片：从 `.temp/image copy 2.png` 原样复制，858 × 174，RGBA PNG。
```
- `src/ui/App.tsx`
```diff
+import f117SideSilhouette from "../assets/f117-side-silhouette.png";
-            {/* 使用矢量轮廓保证战术界面在不同缩放比例下保持清晰。 */}
-            <svg viewBox="0 0 96 40" role="img" aria-hidden="true">
-              <path d="M3 25.2 21.5 20l9.8-9.8h10.5l7.1 5.9 31.7 3.2 12.4 5.9-40.7 1.6-14.7 6.8H25.4l5.8-7.2L3 25.2Z" />
-              <path d="m42.6 15.8 6.5-10.2h7.3l-1.6 11.1M20.4 20.3l-7.1-5.7h7.8l9.4 2.1" />
-            </svg>
+            {/* 按亮度提取参考图中的黑色机体：白底透明，机体统一映射为金色。 */}
+            <svg className="brand-aircraft-silhouette" viewBox="0 0 858 174" aria-hidden="true">
+              <defs>
+                <filter id="gold-aircraft-silhouette" colorInterpolationFilters="sRGB">
+                  <feColorMatrix values="0 0 0 0 0.827  0 0 0 0 0.655  0 0 0 0 0.267  -0.2126 -0.7152 -0.0722 0 1" />
+                  <feComponentTransfer>
+                    <feFuncA type="table" tableValues="0 0 0 0.1 0.45 0.8 1" />
+                  </feComponentTransfer>
+                </filter>
+              </defs>
+              <image href={f117SideSilhouette} width="858" height="174" filter="url(#gold-aircraft-silhouette)" />
+            </svg>
```
- `src/ui/styles.css`
```diff
-.brand-mark { width: 64px; height: 40px; display: grid; place-items: center; color: #d3a744; }
-.brand-mark svg { width: 100%; height: 100%; overflow: visible; }
-.brand-mark path:first-child { fill: currentColor; }
-.brand-mark path:last-child { fill: none; stroke: #f0c15d; stroke-width: 2.2; stroke-linecap: square; stroke-linejoin: bevel; }
+.brand-mark { width: 92px; height: 40px; display: grid; place-items: center; }
+.brand-aircraft-silhouette { width: 100%; height: auto; overflow: visible; }
```
- `.agentdocs/index.md`
```diff
+`workflow/20260819145249-use-reference-f117-brand-icon.md` - 会话-3：使用 `.temp/image copy 2.png` 的原始 F-117 侧面轮廓替换手绘 SVG，并通过 SVG 亮度滤镜统一呈现金色、移除白底；核对顶部品牌图标来源、比例或颜色时读取。
```
- `src/vite-env.d.ts`
```diff
+/// <reference types="vite/client" />
```

## 测试用例
### TC-001 参考图一致性
- 类型：资源校验
- 优先级：高
- 操作步骤：比较参考图与项目资源副本的 SHA-1。
- 预期结果：两者哈希一致，原始轮廓未被修改。
- 是否通过：通过；两者 SHA-1 均为 `14ba3667b633cd4ff44221a6d2e29193f19bbdc1`。

### TC-002 金色图标显示
- 类型：视觉测试
- 优先级：高
- 前置条件：启动本地开发服务器。
- 操作步骤：打开游戏并检查左上角图标。
- 预期结果：显示参考图中的 F-117 侧面轮廓，颜色为 `#D3A744`，无白底且不变形。
- 是否通过：待人工验证。

### TC-003 工程回归
- 类型：自动化测试
- 优先级：高
- 操作步骤：执行 `npm run typecheck`、`npm run test` 和 `npm run build`。
- 预期结果：所有命令成功完成。
- 是否通过：通过；类型检查成功，18 个测试文件共 79 项测试通过，生产构建成功并输出图标资源。
