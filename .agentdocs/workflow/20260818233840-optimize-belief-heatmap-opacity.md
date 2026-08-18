# Belief 热力图透明度优化

## 背景与目标
- 修复失联后极弱残余概率因相对归一化仍显示为高亮色块的问题。
- 同时表达概率在地图内的相对分布和整个 Belief 的绝对可信强度。

## 约束与原则
- 有效 Belief 保持清晰可读。
- 失联 Belief 可以保留为模糊记忆，但必须显著变暗。
- 概率质量接近零时完全隐藏热力图。
- 仅影响 AI DEBUG 绘制，不改变 Belief、Commander 与雷达决策。

## 阶段与 TODO
- [x] 新增热力图透明度参数。
- [x] 新增绝对概率到透明度的映射函数。
- [x] TacticalMap 接入有效、失联和隐藏三种显示强度。
- [x] 增加失联变暗与空 Belief 隐藏测试。
- [x] 完成类型检查、测试和构建。

## 代码变更

### `src/config/gameConfig.ts`
```diff
     minimumPeakProbability: 0.003,
     minimumTotalProbability: 0.03,
+    heatmapReferencePeakProbability: 0.05,
+    heatmapReferenceTotalProbability: 0.3,
+    heatmapValidOpacityFloor: 0.45,
+    heatmapInvalidOpacityMultiplier: 0.18,
+    heatmapMinimumOpacity: 0.02,
```

### `src/domain/beliefMap.ts`
```diff
+/** 将绝对概率强度映射为热力图透明度，避免极弱残余概率仍被相对归一化显示为高亮。 */
+export function getBeliefHeatmapOpacityScale(estimate: BeliefEstimate): number {
+  const peakStrength = Math.min(1, estimate.probability / gameConfig.belief.heatmapReferencePeakProbability);
+  const massStrength = Math.min(1, estimate.totalProbability / gameConfig.belief.heatmapReferenceTotalProbability);
+  const absoluteStrength = peakStrength * massStrength;
+  const opacity = estimate.isValid
+    ? gameConfig.belief.heatmapValidOpacityFloor
+      + (1 - gameConfig.belief.heatmapValidOpacityFloor) * absoluteStrength
+    : gameConfig.belief.heatmapInvalidOpacityMultiplier * absoluteStrength;
+  return opacity < gameConfig.belief.heatmapMinimumOpacity ? 0 : opacity;
+}
```

### `src/ui/TacticalMap.tsx`
```diff
 import { gameConfig } from "../config/gameConfig";
+import { getBeliefHeatmapOpacityScale, getBeliefPeak } from "../domain/beliefMap";

         const peak = Math.max(...mission.beliefMap.probabilities, 0.0001);
+        const estimate = getBeliefPeak(mission.beliefMap, mission.elapsedMs);
+        const opacityScale = getBeliefHeatmapOpacityScale(estimate);
         mission.beliefMap.probabilities.forEach((probability, index) => {
           const intensity = Math.min(1, probability / peak);
-          if (intensity < 0.015) return;
+          if (intensity < 0.015 || opacityScale === 0) return;
           const x = (index % mission.beliefMap.gridSize) * cellWidth;
           const y = Math.floor(index / mission.beliefMap.gridSize) * cellHeight;
-          context.fillStyle = `rgba(255, ${Math.round(185 - intensity * 105)}, 45, ${0.08 + intensity * 0.48})`;
+          const alpha = (0.08 + intensity * 0.48) * opacityScale;
+          context.fillStyle = `rgba(255, ${Math.round(185 - intensity * 105)}, 45, ${alpha})`;
           context.fillRect(x, y, cellWidth, cellHeight);
```

### `src/domain/beliefMap.test.ts`
```diff
-import { advanceBeliefMap, createBeliefMap, getBeliefPeak } from "./beliefMap";
+import { advanceBeliefMap, createBeliefMap, getBeliefHeatmapOpacityScale, getBeliefPeak } from "./beliefMap";

     expect(getBeliefPeak(expired, 14000).isValid).toBe(false);
     expect(getBeliefPeak(expired, 14000).position).toBeUndefined();
+    expect(getBeliefHeatmapOpacityScale(getBeliefPeak(expired, 14000))).toBeLessThan(0.2);
   });
+
+  it("无概率质量时完全隐藏热力图", () => {
+    expect(getBeliefHeatmapOpacityScale(getBeliefPeak(createBeliefMap()))).toBe(0);
+  });
```

## 测试用例

### TC-001 失联热力图变暗
- 前置条件：已有 Contact，随后失联超过 12 秒。
- 预期：Belief 定位失效，热力图透明度比例低于 0.2。
- 是否通过：通过。

### TC-002 空 Belief 隐藏
- 前置条件：新任务尚无 Contact。
- 预期：热力图透明度为 0，不绘制色块。
- 是否通过：通过。

### TC-003 全量回归
- `npm run typecheck`：通过。
- `npm run test -- --run`：20 个测试文件、84 项测试全部通过。
- `npm run build`：通过。
- `git diff --check`：通过。

## 当前进展
- 有效定位仍显示完整热力图。
- 失联残余概率最多按 18% 强度显示，随后随绝对概率继续变暗并最终隐藏。
