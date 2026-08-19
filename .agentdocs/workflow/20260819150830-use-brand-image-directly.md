# 直接使用用户更新后的 F-117 品牌图片

## 背景与目标
- 用户已自行更新 `src/assets/f117-side-silhouette.png`。
- 顶部品牌区域应直接显示该图片，不再叠加 SVG 或颜色处理效果。

## 约束与原则
- 图片内容以用户提供的资源文件为准。
- 不使用 SVG、滤镜、蒙版、颜色矩阵或其他视觉效果。
- CSS 仅负责在既有品牌容器内等比例完整显示图片。

## 阶段与 TODO
- [x] 检查用户更新后的图片资源。
- [x] 将 SVG 滤镜渲染替换为普通 `img` 元素。
- [x] 删除图像效果相关 CSS，仅保留尺寸与适配规则。
- [x] 完成类型检查、自动化测试与生产构建。

## 关键风险
- 图片最终背景、颜色和边缘完全取决于资源文件本身，代码不再进行修正。

## 代码变更
- `src/ui/App.tsx`
```diff
-            {/* 按亮度提取参考图中的黑色机体：白底透明，机体统一映射为金色。 */}
-            <svg className="brand-aircraft-silhouette" viewBox="0 0 858 174" aria-hidden="true">
-              <defs>
-                <filter id="gold-aircraft-silhouette" colorInterpolationFilters="sRGB">
-                  <feColorMatrix values="0 0 0 0 0.827  0 0 0 0 0.655  0 0 0 0 0.267  -0.2126 -0.7152 -0.0722 0 1" />
-                  <feComponentTransfer>
-                    <feFuncA type="table" tableValues="0 0 0 0.1 0.45 0.8 1" />
-                  </feComponentTransfer>
-                </filter>
-              </defs>
-              <image href={f117SideSilhouette} width="858" height="174" filter="url(#gold-aircraft-silhouette)" />
-            </svg>
+            <img className="brand-aircraft-silhouette" src={f117SideSilhouette} alt="" />
```
- `src/ui/styles.css`
```diff
-.brand-aircraft-silhouette { width: 100%; height: auto; overflow: visible; }
+.brand-aircraft-silhouette { display: block; width: 100%; height: 100%; object-fit: contain; }
```
- `.agentdocs/index.md`
```diff
+`workflow/20260819150830-use-brand-image-directly.md` - 会话-4：直接使用用户更新后的 `f117-side-silhouette.png`，移除 SVG 颜色矩阵及所有图像效果；核对顶部品牌图标渲染方式时读取。
```

## 测试用例
### TC-001 直接图片渲染
- 类型：静态检查
- 优先级：高
- 操作步骤：检查顶部品牌图标 JSX 与对应 CSS。
- 预期结果：使用普通 `img` 元素；不存在 SVG、滤镜、蒙版或颜色处理。
- 是否通过：通过。

### TC-002 工程回归
- 类型：自动化测试
- 优先级：高
- 操作步骤：执行 `npm run typecheck`、`npm run test` 和 `npm run build`。
- 预期结果：所有命令成功完成。
- 是否通过：通过；类型检查成功，18 个测试文件共 79 项测试通过，生产构建成功。
