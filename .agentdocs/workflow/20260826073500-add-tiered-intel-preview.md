# 分级情报权限与锁定任务地图预览

## 目标与结果
- [x] INTEL 完成次数派生 0/1/2 级权限，无存档迁移。
- [x] 一级情报精确显示全部雷达位置与类型，但不替换真实范围。
- [x] 二级情报让后续任务 AI DEBUG 默认开启且可关闭。
- [x] 锁定节点以“查看情报”替代执行按钮，并进入只读战术工作区。

## 代码变更
```diff
+ src/domain/intelAccess.ts：新增 IntelAccessTier 与 getIntelAccessTier。
~ src/game/gameReducer.ts：导出统一任务准备函数；一级情报生成精确位置/类型报告。
~ src/ui/App.tsx：按情报等级控制 AI DEBUG 权限和任务进入默认状态。
~ src/ui/CampaignMap.tsx：锁定节点的执行按钮替换为“查看情报”，不增加并列按钮或弹窗。
~ src/ui/App.tsx：情报预览复用战术工作区，显示“任务情报”并隐藏任务执行模块。
~ src/ui/TacticalMap.tsx：增加 readOnly，预览中屏蔽航点操作。
+ src/domain/intelAccess.test.ts：覆盖三级权限派生。
```

## 验证
- `npm run typecheck`：通过。
- `npm run test`：25 个测试文件、107 项测试通过。
- `npm run build`：通过。

## 会话-86 修订
- 删除独立“查看地图情报”按钮与弹出预览框。
- 仅锁定节点将主按钮替换为“查看情报”；可执行节点仍只显示“执行任务”。
- 查看情报进入同一战术地图布局，但左侧仅保留任务情报和返回入口，右侧仅保留地图元素。
- 情报态不显示航线规划、任务控制、THREAT WARNING、FUEL RANGE、FLIGHT STATUS 或其他执行期模块，地图完全只读。

## 会话-87 修订
- 任务情报页补充 `WEATHER FORECAST` 与存在反制记录时的 `COUNTER DEPLOYMENT`。
- 任务情报页的 `MAP ELEMENTS` 四个分类默认全部展开；正常任务页仍默认折叠。

## 会话-88 修订
- 恢复与航线规划页一致的侧栏职责：`WEATHER FORECAST` 移至左侧任务情报下方，右侧保留 `MAP ELEMENTS` 与 `COUNTER DEPLOYMENT`。

## 会话-92 修订
- 正式界面将 `AI DEBUG` 改名为 `TOTAL INTEL`，授权状态改为 `TOTAL INTELLIGENCE ACCESS`，右侧内部状态组改为 `ENEMY SYSTEM STATE`。
- 本地开发不再自动开放完整态势；正常环境均需 `INTEL ACCESS 2/2`，仅显式 `?ai-debug=1` 提供开发覆盖。

## 会话-93 修订
- 任务网络预览区的主按钮增加顶部间距，避免紧贴说明文字。
- 规划态标题由“航线规划”统一为“任务规划”；所有玩家可见“战役地图/战役”导航口径统一为“任务网络”。
