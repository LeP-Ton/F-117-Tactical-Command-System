# 飞机基础速度减半

## 背景与目标
- 将飞机飞行速度调整为修改前的一半。
- 延长航线执行时间，让雷达扫描、Contact、Belief 与 Commander 搜索有更充分的演化窗口。

## 约束与原则
- 只调整基础速度，不修改地图尺寸、航点抵达半径或雷达扫描频率。
- 保持 Seed 复现、自动投弹、撤离和失败规则不变。

## 阶段与 TODO
- [x] 基础速度由 7.2 调整为 3.6 u/s。
- [x] 同步自动化断言与核心文档。
- [x] 完成类型检查、测试与构建。

## 代码变更
```diff
  aircraft: {
-   speed: 7.2,
+   speed: 3.6,
  }

- expect(createRun("SLOW-FLIGHT").currentMission?.aircraft.speed).toBe(7.2);
+ expect(createRun("SLOW-FLIGHT").currentMission?.aircraft.speed).toBe(3.6);

- 飞机基础速度为 `7.2 u/s`
+ 飞机基础速度为 `3.6 u/s`
```

## 测试用例

### TC-001 新任务速度
- 操作：创建新 Run。
- 预期：当前任务飞机速度为 3.6 u/s。
- 是否通过：是。

### TC-002 自动化回归
- `npm.cmd run typecheck`：通过。
- `npm.cmd run test -- --run`：17 个测试文件、75 个测试通过。
- `npm.cmd run build`：通过。
