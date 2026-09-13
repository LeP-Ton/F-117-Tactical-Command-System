# 移除撞击倒计时后的规避提示

## 背景与目标

- 导弹来袭时，撞击倒计时后附带的规避提示不再需要。
- 中英文界面都只保留倒计时名称、剩余秒数和威胁阶段。

## 修改内容

- `src/ui/workspaces/MissionWorkspace.tsx`
  - 删除倒计时数值后的规避提示。
  - 当前显示收敛为“撞击倒计时 7.4 秒”或“IMPACT COUNTDOWN 7.4 s”。
- `src/i18n/I18n.tsx`
  - 删除不再使用的中英文 `evade` 文案字段。
- `src/ui/SharedTacticalPanels.test.tsx`
  - 增加中英文导弹倒计时回归测试，确认规避提示不再出现。

## 影响与风险

- 仅改变玩家可见文案，不改变导弹飞行时间、命中判定、告警颜色或音效。
- 删除了失效的双语字段，语言目录结构仍由现有测试保护。

## 测试用例

### TC-001 中英文倒计时文案

- 类型：组件测试
- 优先级：高
- 前置条件：威胁阶段为 `MISSILE_INBOUND`，剩余时间为 `7.4` 秒。
- 预期结果：英文只显示 `IMPACT COUNTDOWN 7.4 s`，中文只显示 `撞击倒计时 7.4 秒`，均不包含规避或脱离照射提示。
- 验证状态：通过

### TC-002 工程验证

- `npm run typecheck`：通过
- `npm run test -- --run src/ui/SharedTacticalPanels.test.tsx src/i18n/I18n.test.tsx`：11 项相关测试全部通过
- `npm run test -- --run`：32 个测试文件、154 项测试全部通过
- `npm run build`：通过，Vite 完成 81 个模块的生产构建
