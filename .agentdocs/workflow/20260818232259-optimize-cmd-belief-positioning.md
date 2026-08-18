# CMD 定位与 Belief 失联行为优化

## 背景与目标
- 修复 CMD 因 Contact 噪声产生过大速度估计、概率在地图边缘堆积、旧定位长期不失效的问题。
- 保持 Reality → Radar Sensor → Imperfect Contact → Belief → Commander 数据边界，不读取飞机真实位置。

## 约束与原则
- 保留雷达误差与敌方错误判断，不将 CMD 改为真实定位。
- 参数集中在 `gameConfig.belief`，便于后续试玩调优。
- 空或过期 Belief 必须返回“无定位”，不能产生地图左上角伪坐标。

## 阶段与 TODO
- [x] 改为同雷达近期 Contact 趋势加权估速并限制速度。
- [x] 修正边界传播，允许越界概率流失。
- [x] 增加 Belief 有效期、峰值与总概率阈值。
- [x] 使用局部概率质心并平滑 CMD 位置。
- [x] 更新 AI DEBUG 状态与自动化测试。
- [x] 完成类型检查、测试与生产构建。

## 代码变更

### 配置与状态类型
```diff
-    maxEstimatedSpeed: 100,
+    maxEstimatedSpeed: 18,
+    velocityObservationWindowMs: 12000,
+    velocityMinimumSpanMs: 1000,
+    velocitySmoothing: 0.3,
+    velocityDecayRate: 0.94,
+    maximumObservationCount: 48,
+    maximumBeliefAgeMs: 12000,
+    minimumPeakProbability: 0.003,
+    minimumTotalProbability: 0.03,

 export interface BeliefObservation {
   position: Vector2;
   timestamp: number;
+  radarId: string;
+  confidence: number;
+  errorRadius: number;
 }

 export interface BeliefMapState {
   gridSize: number;
   probabilities: number[];
   propagationAccumulatorSeconds: number;
   estimatedVelocity: Vector2;
   lastObservation?: BeliefObservation;
+  recentObservations: BeliefObservation[];
+  lastEvidenceAt?: number;
   lastUpdatedAt: number;
 }
```

### Belief Map
```diff
-import type { BeliefMapState, RadarContact, Vector2 } from "./types";
+import type { BeliefMapState, BeliefObservation, RadarContact, Vector2 } from "./types";

     estimatedVelocity: { x: 0, y: 0 },
+    recentObservations: [],
     lastUpdatedAt: 0,

+function estimateVelocity(state: BeliefMapState, observations: BeliefObservation[]): Vector2 {
+  const byRadar = new Map<string, BeliefObservation[]>();
+  observations.forEach((observation) => {
+    const history = byRadar.get(observation.radarId) ?? [];
+    history.push(observation);
+    byRadar.set(observation.radarId, history);
+  });
+  const estimates = [...byRadar.values()].flatMap((history) => {
+    const first = history[0];
+    const last = history.at(-1);
+    if (!first || !last || last.timestamp - first.timestamp < gameConfig.belief.velocityMinimumSpanMs) return [];
+    const seconds = (last.timestamp - first.timestamp) / 1000;
+    const reliability = Math.min(first.confidence, last.confidence)
+      / Math.max(1, (first.errorRadius + last.errorRadius) / 2);
+    return [{
+      velocity: {
+        x: (last.position.x - first.position.x) / seconds,
+        y: (last.position.y - first.position.y) / seconds,
+      },
+      reliability,
+    }];
+  });
+  if (estimates.length === 0) return state.estimatedVelocity;
+  const totalWeight = estimates.reduce((sum, estimate) => sum + estimate.reliability, 0) || 1;
+  const measured = estimates.reduce((velocity, estimate) => ({
+    x: velocity.x + estimate.velocity.x * estimate.reliability / totalWeight,
+    y: velocity.y + estimate.velocity.y * estimate.reliability / totalWeight,
+  }), { x: 0, y: 0 });
+  const speed = Math.hypot(measured.x, measured.y);
+  const scale = speed > gameConfig.belief.maxEstimatedSpeed
+    ? gameConfig.belief.maxEstimatedSpeed / speed
+    : 1;
+  const smoothing = gameConfig.belief.velocitySmoothing;
+  return {
+    x: state.estimatedVelocity.x * (1 - smoothing) + measured.x * scale * smoothing,
+    y: state.estimatedVelocity.y * (1 - smoothing) + measured.y * scale * smoothing,
+  };
+}

-  let estimatedVelocity = state.estimatedVelocity;
-  if (state.lastObservation && contact.timestamp > state.lastObservation.timestamp) {
-    const seconds = (contact.timestamp - state.lastObservation.timestamp) / 1000;
-    const rawVelocity = {
-      x: (contact.estimatedPosition.x - state.lastObservation.position.x) / seconds,
-      y: (contact.estimatedPosition.y - state.lastObservation.position.y) / seconds,
-    };
-    const speed = Math.hypot(rawVelocity.x, rawVelocity.y);
-    const scale = speed > gameConfig.belief.maxEstimatedSpeed
-      ? gameConfig.belief.maxEstimatedSpeed / speed
-      : 1;
-    estimatedVelocity = { x: rawVelocity.x * scale, y: rawVelocity.y * scale };
-  }
+  const observation: BeliefObservation = {
+    position: { ...contact.estimatedPosition },
+    timestamp: contact.timestamp,
+    radarId: contact.radarId,
+    confidence: contact.confidence,
+    errorRadius: contact.errorRadius,
+  };
+  const recentObservations = [...state.recentObservations, observation]
+    .filter((item) => contact.timestamp - item.timestamp <= gameConfig.belief.velocityObservationWindowMs)
+    .slice(-gameConfig.belief.maximumObservationCount);
+  const estimatedVelocity = estimateVelocity(state, recentObservations);

-    lastObservation: { position: { ...contact.estimatedPosition }, timestamp: contact.timestamp },
+    lastObservation: observation,
+    recentObservations,
+    lastEvidenceAt: contact.timestamp,

-      next[neighborIndex] = (next[neighborIndex] ?? 0) + probability * diffusion / neighbors.length;
+      next[neighborIndex] = (next[neighborIndex] ?? 0) + probability * diffusion / 4;
-    const directedX = Math.max(0, Math.min(state.gridSize - 1, x + Math.sign(shiftX)));
-    const directedY = Math.max(0, Math.min(state.gridSize - 1, y + Math.sign(shiftY)));
-    next[y * state.gridSize + directedX] = (next[y * state.gridSize + directedX] ?? 0) + probability * Math.abs(shiftX);
-    next[directedY * state.gridSize + x] = (next[directedY * state.gridSize + x] ?? 0) + probability * Math.abs(shiftY);
+    const directedX = x + Math.sign(shiftX);
+    const directedY = y + Math.sign(shiftY);
+    if (directedX >= 0 && directedX < state.gridSize) {
+      next[y * state.gridSize + directedX] = (next[y * state.gridSize + directedX] ?? 0) + probability * Math.abs(shiftX);
+    }
+    if (directedY >= 0 && directedY < state.gridSize) {
+      next[directedY * state.gridSize + x] = (next[directedY * state.gridSize + x] ?? 0) + probability * Math.abs(shiftY);
+    }

-      x: state.estimatedVelocity.x * 0.985,
-      y: state.estimatedVelocity.y * 0.985,
+      x: state.estimatedVelocity.x * gameConfig.belief.velocityDecayRate,
+      y: state.estimatedVelocity.y * gameConfig.belief.velocityDecayRate,

-export function getBeliefPeak(state: BeliefMapState): { position: Vector2; probability: number } {
+export interface BeliefEstimate {
+  position?: Vector2;
+  probability: number;
+  totalProbability: number;
+  ageMs?: number;
+  isValid: boolean;
+}
+export function getBeliefPeak(state: BeliefMapState, timestamp = state.lastUpdatedAt): BeliefEstimate {
   const maximum = Math.max(...state.probabilities);
   const index = state.probabilities.indexOf(maximum);
   const cellWidth = gameConfig.world.width / state.gridSize;
   const cellHeight = gameConfig.world.height / state.gridSize;
+  const totalProbability = state.probabilities.reduce((sum, value) => sum + value, 0);
+  const ageMs = state.lastEvidenceAt === undefined ? undefined : Math.max(0, timestamp - state.lastEvidenceAt);
+  const isValid = index >= 0
+    && ageMs !== undefined
+    && ageMs <= gameConfig.belief.maximumBeliefAgeMs
+    && maximum >= gameConfig.belief.minimumPeakProbability
+    && totalProbability >= gameConfig.belief.minimumTotalProbability;
+  if (!isValid) return { probability: Math.max(0, maximum), totalProbability, ageMs, isValid: false };
+  const peakX = index % state.gridSize;
+  const peakY = Math.floor(index / state.gridSize);
+  let weightedX = 0;
+  let weightedY = 0;
+  let localWeight = 0;
+  for (let y = Math.max(0, peakY - 1); y <= Math.min(state.gridSize - 1, peakY + 1); y += 1) {
+    for (let x = Math.max(0, peakX - 1); x <= Math.min(state.gridSize - 1, peakX + 1); x += 1) {
+      const weight = state.probabilities[y * state.gridSize + x] ?? 0;
+      weightedX += (x + 0.5) * cellWidth * weight;
+      weightedY += (y + 0.5) * cellHeight * weight;
+      localWeight += weight;
+    }
+  }
   return {
     position: {
-      x: (index % state.gridSize + 0.5) * cellWidth,
-      y: (Math.floor(index / state.gridSize) + 0.5) * cellHeight,
+      x: weightedX / localWeight,
+      y: weightedY / localWeight,
     },
     probability: Math.max(0, maximum),
+    totalProbability,
+    ageMs,
+    isValid: true,
   };
 }
```

### Commander 与调试界面
```diff
-  const peak = getBeliefPeak(beliefMap);
-  const confidence = Math.min(1, peak.probability * 12);
+  const peak = getBeliefPeak(beliefMap, timestamp);
+  const confidence = peak.isValid ? Math.min(1, peak.probability * 12) : 0;
-  const hasBelief = peak.probability > 0;
+  const hasBelief = peak.position !== undefined;
-      ? bearingDegrees(radar.position.x, radar.position.y, peak.position.x, peak.position.y)
+      ? bearingDegrees(radar.position.x, radar.position.y, peak.position!.x, peak.position!.y)
-      targetPosition: hasBelief ? peak.position : state.targetPosition,
+      targetPosition: hasBelief
+        ? state.targetPosition
+          ? {
+              x: state.targetPosition.x * 0.65 + peak.position!.x * 0.35,
+              y: state.targetPosition.y * 0.65 + peak.position!.y * 0.35,
+            }
+          : peak.position
+        : undefined,

-  const beliefPeak = getBeliefPeak(mission.beliefMap);
+  const beliefPeak = getBeliefPeak(mission.beliefMap, mission.elapsedMs);
-  <dd>{(beliefPeak.probability * 100).toFixed(1)}%</dd>
+  <dd>{(beliefPeak.probability * 100).toFixed(1)}% / {beliefPeak.isValid ? "有效" : "失联"}</dd>
-  <dd>{beliefPeak.probability > 0 ? `${beliefPeak.position.x.toFixed(0)}, ${beliefPeak.position.y.toFixed(0)}` : "未知"}</dd>
+  <dd>{beliefPeak.position ? `${beliefPeak.position.x.toFixed(0)}, ${beliefPeak.position.y.toFixed(0)}` : "未知"}</dd>
```

### 测试变更
```diff
-    expect(peak.position.x).toBeCloseTo(500, -2);
-    expect(peak.position.y).toBeCloseTo(500, -2);
+    expect(peak.position?.x).toBeCloseTo(500, -2);
+    expect(peak.position?.y).toBeCloseTo(500, -2);
-    expect(Math.hypot(second.estimatedVelocity.x, second.estimatedVelocity.y)).toBeLessThanOrEqual(100.0001);
+    expect(Math.hypot(second.estimatedVelocity.x, second.estimatedVelocity.y)).toBeLessThanOrEqual(18.0001);
+  新增：空 Belief 不产生伪定位。
+  新增：失联超过 12 秒后定位失效。
+  新增：向地图外传播时概率总量下降。
+  新增：Commander 在 Belief 失联后清除 CMD 目标位置。
```

## 测试用例

### TC-001 空 Belief 安全返回
- 操作：读取全零 Belief 的峰值。
- 预期：`isValid=false`，`position` 未定义，不出现左上角 CMD。
- 是否通过：通过。

### TC-002 失联超时
- 操作：注入 Contact 后无新证据推进 13 秒。
- 预期：Belief 失效，Commander 清除 CMD。
- 是否通过：通过。

### TC-003 边界传播
- 操作：建立向地图外运动的估计并推进 4 秒。
- 预期：概率总量下降，不在边界截断堆积。
- 是否通过：通过。

### TC-004 全量回归
- `npm run typecheck`：通过。
- `npm run test -- --run`：20 个测试文件、83 项测试全部通过。
- `npm run build`：通过。

## 当前进展
- CMD 定位优化已完成。
- 建议通过 AI DEBUG 实际试玩观察 CMD 收敛、失联消失与重新捕获行为，再按体验调整 12 秒有效期和速度上限。
