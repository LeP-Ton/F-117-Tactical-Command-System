# 增加撤离区雷达部署净空

## 背景与目标
- 初始生成雷达与固定撤离区存在少量坐标重叠，后续 Enemy Adaptation 和 Final Strike 增援也没有撤离区约束。
- 禁止雷达中心部署在撤离区及其周围 `80 u` 净空范围内，但允许雷达探测范围覆盖撤离区，保留撤离阶段风险。

## 约束与原则
- 仅移动违反净空约束的雷达，其他 Seed 部署保持不变。
- 选择地图有效范围内位移最短的净空边界，保证调整确定且可复现。
- 所有初始任务与 Campaign 后处理共用同一约束函数。

## 阶段与 TODO
- [x] 增加统一撤离区雷达净空配置与领域函数。
- [x] 接入初始任务生成。
- [x] 接入 Enemy Adaptation、Final Strike 后的最终部署，并与目标火控覆盖联合求解。
- [x] 增加直接边界测试与 100 个 Seed 的净空、目标火控联合验证。
- [x] 执行类型检查、完整测试、构建及差异检查。

## 代码变更
- `src/config/gameConfig.ts`

```diff
+    /** 雷达中心与撤离区边界的最小部署间距；探测范围仍可覆盖撤离区。 */
+    extractionRadarClearance: 80,
```

- `src/domain/radarDeployment.ts`

```diff
+const RADAR_MAP_MARGIN = 80;
+
+function isInsideExpandedArea(position: Vector2, area: ExtractionArea, clearance: number): boolean {
+  return position.x > area.x - clearance
+    && position.x < area.x + area.width + clearance
+    && position.y > area.y - clearance
+    && position.y < area.y + area.height + clearance;
+}
+
+export function enforceExtractionRadarClearance(
+  radars: RadarState[],
+  extractionArea: ExtractionArea,
+  clearance = gameConfig.mission.extractionRadarClearance,
+): RadarState[] {
+  const candidates = (position: Vector2): Vector2[] => [
+    { x: extractionArea.x - clearance, y: position.y },
+    { x: extractionArea.x + extractionArea.width + clearance, y: position.y },
+    { x: position.x, y: extractionArea.y - clearance },
+    { x: position.x, y: extractionArea.y + extractionArea.height + clearance },
+  ].filter(/* 地图有效边界 */);
+  return radars.map(/* 违规雷达移动至最近可行边界 */);
+}
```

- `src/domain/targetDefense.ts`

```diff
+function respectsExtractionClearance(position: Vector2, extractionArea?: ExtractionArea): boolean {
+  // 判断火控候选位置是否同时满足撤离净空。
+}
 export function ensureTargetFireControlCoverage(
   radars: RadarState[],
   target: MissionTarget,
+  extractionArea?: ExtractionArea,
 ): RadarState[] {
+  // 从原始相对方位开始环绕目标寻找位置，联合满足目标覆盖与撤离净空。
+  const position = Array.from({ length: 360 }, (_, offset) => angle + offset * Math.PI / 180)
+    .map(/* 生成地图内候选位置 */)
+    .find((candidate) => respectsExtractionClearance(candidate, extractionArea))
+    ?? clampPosition(target.position);
 }
```

- `src/domain/factories.ts`

```diff
-  const radars = ensureTargetFireControlCoverage(generated.radars, target);
+  const radars = ensureTargetFireControlCoverage(
+    enforceExtractionRadarClearance(generated.radars, gameConfig.mission.extractionArea),
+    target,
+    gameConfig.mission.extractionArea,
+  );
```

- `src/game/gameReducer.ts`

```diff
-  const radars = ensureTargetFireControlCoverage(finalMission.radars, finalMission.target);
+  const radars = ensureTargetFireControlCoverage(
+    enforceExtractionRadarClearance(finalMission.radars, finalMission.extractionArea),
+    finalMission.target,
+    finalMission.extractionArea,
+  );
```

- `src/domain/radarDeployment.test.ts`

```diff
+  it("把撤离区内及净空范围内的雷达移动到最近可行边界", () => { /* ... */ });
+  it("程序生成任务中的所有雷达均遵守 80u 撤离净空", () => {
+    /* 100 Seeds 同时验证所有雷达净空和至少一部 Fire Control 完整覆盖目标区。 */
+  });
```

- `AGENTS.md`

```diff
+- 所有初始、适应性和 Final Strike 雷达部署最终统一执行撤离区净空约束：雷达中心不得进入撤离区周围 80 u，探测范围仍可覆盖撤离区。
```

## 测试用例
### TC-001 违规雷达移出净空区
- 类型：单元测试
- 优先级：高
- 预期结果：区内雷达和相邻雷达移动到最近可行边界，安全雷达保持不变。
- 是否通过：通过。

### TC-002 多 Seed 初始部署净空与目标覆盖
- 类型：生成回归测试
- 优先级：高
- 操作步骤：生成 `CLEARANCE-0` 至 `CLEARANCE-99` 共 100 个任务。
- 预期结果：所有雷达中心均不进入撤离区周围 `80 u`，且每个任务仍有 Fire Control 完整覆盖目标攻击区并保留 `20 u` 余量。
- 是否通过：通过。

### TC-003 完整工程验证
- 类型：回归测试
- 优先级：高
- 操作步骤：执行 `npm run typecheck`、`npm run test -- --run`、`npm run build` 与 `git diff --check`。
- 预期结果：全部通过。
- 是否通过：通过。
