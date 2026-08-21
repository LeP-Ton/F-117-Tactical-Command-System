# 首次部署时自动启用 GitHub Pages

## 背景与目标
- 首次 Pages 工作流已被 `main` 推送触发，但 `actions/configure-pages@v5` 因仓库尚未启用 Pages 而失败。
- 让部署工作流在首次运行时自动创建并启用 GitHub Pages，避免依赖手工进入仓库 Settings 操作。

## 约束与原则
- 保持现有 Actions 构建与部署结构不变。
- 只调整 Pages 初始化行为，不修改应用构建产物。

## 阶段与 TODO
- [x] 从 GitHub Actions 日志确认失败位于 `configure-pages`。
- [x] 开启 `enablement`，允许工作流首次部署时初始化 Pages。
- [ ] 推送后确认工作流成功且在线地址返回 HTTP 200。

## 关键风险
- 自动启用仍依赖工作流 `pages: write` 权限；当前工作流已经声明该权限。

## 代码变更
```diff
--- .github/workflows/deploy-pages.yml
+++ .github/workflows/deploy-pages.yml
       - uses: actions/configure-pages@v5
+        with:
+          # 仓库首次部署时自动启用以 GitHub Actions 为来源的 Pages。
+          enablement: true
```

## 测试用例

### TC-001 首次启用并部署 Pages
- 类型：部署测试
- 优先级：高
- 前置条件：仓库尚未启用 GitHub Pages。
- 操作步骤：推送修正提交到 `main`，等待 `Deploy GitHub Pages` 工作流完成。
- 预期结果：`configure-pages`、构建、上传与部署步骤全部成功，在线地址返回 HTTP 200。
- 是否通过：待推送验证。
