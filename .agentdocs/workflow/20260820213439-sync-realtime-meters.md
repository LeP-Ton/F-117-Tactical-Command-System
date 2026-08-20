# 修复实时进度条与数据不同步

## 背景与目标
- `FUEL RANGE` 在持续飞行时视觉长度经常大于实际百分比，暂停后才恢复正常。
- `THREAT WARNING` 已有辐射威胁数值时，进度条视觉上几乎没有增长。

## 根因
- 游戏循环约每 `50ms` 更新一次内联 `width`。
- 燃油与威胁进度条设置了 `160ms` 的宽度过渡，下一次状态更新总在上一次动画完成前到达。
- 浏览器因此不断从当前动画中间状态重启动画，造成燃油条持续滞后、威胁条难以追上目标宽度；暂停后没有新状态打断，动画才完成。

## 约束与原则
- 高频实时仪表必须直接映射领域状态，不使用比状态更新周期更长的补间动画。
- 同类的 Awareness 调试仪表一并移除宽度动画，避免相同问题潜伏。

## 阶段与 TODO
- [x] 核对 Fuel、Threat 和 Awareness 的数据来源与 CSS。
- [x] 移除三个实时仪表的 `transition: width`。
- [x] 完成类型检查、自动化测试、构建和差异检查。

## 代码变更

- `src/ui/styles.css`
```diff
-.awareness-meter i { display: block; height: 100%; background: linear-gradient(90deg, #5dc8a7, #e1ad4d, #dc6046); transition: width 180ms linear; }
+.awareness-meter i { display: block; height: 100%; background: linear-gradient(90deg, #5dc8a7, #e1ad4d, #dc6046); }
-.fuel-meter i { display: block; height: 100%; background: linear-gradient(90deg, #d55c42, #d5ae4e 24%, #58b493); transition: width 160ms linear; }
+.fuel-meter i { display: block; height: 100%; background: linear-gradient(90deg, #d55c42, #d5ae4e 24%, #58b493); }
-.threat-progress i { display: block; height: 100%; background: linear-gradient(90deg, #5fae91, #e0b64d, #e2523b); transition: width 160ms linear; }
+.threat-progress i { display: block; height: 100%; background: linear-gradient(90deg, #5fae91, #e0b64d, #e2523b); }
```

## 测试结果
- `npm run typecheck`：通过。
- `npm run test -- --run`：19 个测试文件、88 项测试通过。
- `npm run build`：通过。
- `git diff --check`：通过。
