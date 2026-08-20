# 增加天气飞行减速

## 背景与目标
- 让动态天气不仅影响雷达探测，也直接改变航线执行节奏。
- 在天气范围内为 F-117 增加 10%–30% 的分级减速。

## 约束与原则
- Cloud 10%、Fog 15%、Rain 20%、Storm 30%。
- 多天气重叠时取最强效果，不做乘法叠加。
- 燃油按真实飞行距离计算；减速增加任务时间，但不额外缩短总航程。
- 离开天气后速度恢复基础值 `3.6 u/s`。

## 阶段与 TODO
- [x] 增加天气位置命中和速度倍率计算。
- [x] 在任务 Tick 开始时应用有效速度。
- [x] 将有效速度接入燃油限制与自动驾驶。
- [x] 增加遥测减速显示。
- [x] 补充各天气类型、重叠和实际移动测试。

## 代码变更

- `src/domain/weatherSystem.ts`
```diff
+const speedFactors: Record<WeatherKind, number> = {
+  CLOUD: 0.9,
+  FOG: 0.85,
+  RAIN: 0.8,
+  STORM: 0.7,
+};
+export function getWeatherSpeedFactor(position, cells): number {
+  return cells.reduce((factor, cell) => {
+    const inside = position.x >= cell.x
+      && position.x <= cell.x + cell.width
+      && position.y >= cell.y
+      && position.y <= cell.y + cell.height;
+    return inside ? Math.min(factor, speedFactors[cell.kind]) : factor;
+  }, 1);
+}
```

- `src/game/gameReducer.ts`
```diff
-import { advanceWeather } from "../domain/weatherSystem";
+import { advanceWeather, getWeatherSpeedFactor } from "../domain/weatherSystem";
@@
+      const weatherSpeedFactor = getWeatherSpeedFactor(mission.aircraft.position, mission.weather);
+      const flightAircraft = {
+        ...mission.aircraft,
+        speed: gameConfig.aircraft.speed * weatherSpeedFactor,
+      };
-      const fuelLimitedSeconds = mission.aircraft.speed > 0
-        ? Math.min(action.deltaSeconds, mission.aircraft.fuelRemaining / mission.aircraft.speed)
+      const fuelLimitedSeconds = flightAircraft.speed > 0
+        ? Math.min(action.deltaSeconds, mission.aircraft.fuelRemaining / flightAircraft.speed)
         : 0;
-      const result = advanceAutopilot(mission.aircraft, mission.route, fuelLimitedSeconds);
+      const result = advanceAutopilot(flightAircraft, mission.route, fuelLimitedSeconds);
```

- `src/ui/App.tsx`
```diff
+import { getWeatherSpeedFactor } from "../domain/weatherSystem";
+const weatherSpeedFactor = getWeatherSpeedFactor(mission.aircraft.position, mission.weather);
-<div><dt>速度</dt><dd>{mission.aircraft.speed} u/s</dd></div>
+<div><dt>速度</dt><dd>{mission.aircraft.speed.toFixed(2)} u/s</dd></div>
+<div><dt>天气减速</dt><dd>{weatherSpeedFactor < 1 ? `${((1 - weatherSpeedFactor) * 100).toFixed(0)}%` : "无"}</dd></div>
```

- `src/domain/weatherSystem.test.ts`、`src/game/gameReducer.test.ts`
```diff
+it("四种天气分别造成 10% 至 30% 减速，重叠时取最强效果", ...);
+it("飞机进入风暴区域后减速 30%", ...);
+expect(state.currentMission!.aircraft.speed).toBeCloseTo(2.52);
+expect(state.currentMission!.aircraft.position.x - start.x).toBeCloseTo(2.52);
```

- `AGENTS.md`、`README.md`、`docs/game-mechanics.md`、`TODO.md`
```diff
+Cloud、Fog、Rain、Storm 分别造成 10%、15%、20%、30% 飞行减速。
+重叠时取最强效果，燃油仍按真实飞行距离消耗。
```

## 测试结果
- `npm run typecheck`：通过。
- `npm run test -- --run`：19 个测试文件、88 项测试通过。
- `npm run build`：通过。
- `git diff --check`：通过。
