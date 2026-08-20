# 保证目标区 Fire Control 覆盖

## 背景与目标
- 随机部署可能让 Fire Control 远离目标，使目标区缺少明确火控威胁。
- 将“至少一部 Fire Control 完整覆盖目标攻击区”设为任务最终不变量。

## 约束与原则
- 覆盖整个攻击区而非仅覆盖目标中心。
- 在实际范围内额外保留 `20 u` 余量。
- 只在覆盖不足时移动最近 Fire Control，保留 Seed 决定的相对方位。
- 不扩大雷达范围，不把进入覆盖等同于必然探测。
- Enemy Adaptation 不移动唯一目标区 Fire Control。

## 阶段与 TODO
- [x] 增加目标区火控覆盖校验领域函数。
- [x] 接入初始任务创建。
- [x] 接入 Campaign、SEAD、Enemy Adaptation 与 Final Strike 后的最终准备阶段。
- [x] 保护目标区 Fire Control 不被历史反制移位。
- [x] 增加多 Seed、重部署、SEAD 和适应保护测试。

## 代码变更

- `src/domain/targetDefense.ts`
```diff
+export const TARGET_FIRE_CONTROL_MARGIN = 20;
+export function ensureTargetFireControlCoverage(radars, target): RadarState[] {
+  const fireControls = radars.filter((radar) => radar.type === "FIRE_CONTROL");
+  if (fireControls.some((radar) => distance(radar.position, target.position) + target.attackRadius
+    <= radar.range - TARGET_FIRE_CONTROL_MARGIN)) return radars;
+  const selected = nearestFireControlToTarget;
+  const deploymentDistance = selected.range - target.attackRadius - TARGET_FIRE_CONTROL_MARGIN;
+  return moveSelectedRadarWhilePreservingSeedBearing(radars, selected, deploymentDistance);
+}
```

- `src/domain/factories.ts`
```diff
+  const target = { id: "COMMAND-BUNKER", position: generated.targetPosition, attackRadius, destroyed: false };
+  const radars = ensureTargetFireControlCoverage(generated.radars, target);
-  radars: generated.radars,
+  radars,
-  radarIntel: generateRadarIntel(seed, generated.radars, accuracy),
+  radarIntel: generateRadarIntel(seed, radars, accuracy),
```

- `src/game/gameReducer.ts`
```diff
+  const radars = ensureTargetFireControlCoverage(finalMission.radars, finalMission.target);
   return {
     ...finalMission,
-    radarIntel: generateRadarIntel(selectedMission.seed, finalMission.radars, adjustedIntelAccuracy),
+    radars,
+    radarIntel: generateRadarIntel(selectedMission.seed, radars, adjustedIntelAccuracy),
```

- `src/domain/enemyAdaptation.ts`
```diff
+const protectedFireControlId = closestFireControlToTarget?.id;
-filter((candidate) => !usedRadarIds.has(candidate.id))
+filter((candidate) => !usedRadarIds.has(candidate.id) && candidate.id !== protectedFireControlId)
```

- `src/domain/targetDefense.test.ts`、`src/domain/enemyAdaptation.test.ts`、`src/game/gameReducer.test.ts`
```diff
+it("不同 Seed 的初始任务始终由 Fire Control 完整覆盖攻击区", ...);
+it("覆盖不足时移动最近火控雷达并保持其他雷达不变", ...);
+expect(adaptedProtectedFireControl.position).toEqual(originalPosition);
+expect(seadMissionHasCompleteFireControlCoverage).toBe(true);
```

- `AGENTS.md`、`README.md`、`docs/game-mechanics.md`、`TODO.md`
```diff
+每场任务最终至少一部 Fire Control 完整覆盖目标攻击区并保留 20 u 余量。
+唯一承担目标防御的火控雷达不参与 Enemy Adaptation 移位。
```

## 测试结果
- `npm run typecheck`：通过。
- `npm run test -- --run`：20 个测试文件、93 项测试通过。
- `npm run build`：通过。
- `git diff --check`：通过。
