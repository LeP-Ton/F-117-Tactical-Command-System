# 强制任务网络最多包含两个 INTEL 行动

## 背景与目标

- INTEL 权限只有两次有效提升：第一次核实雷达坐标与型号，第二次授权 `TOTAL INTEL`。
- 当前固定拓扑虽然恰好包含两个 INTEL 节点，但代码没有表达“最多两个”的生成约束，未来扩展任务网络时可能误加没有新奖励的第三个 INTEL。
- 将上限集中到任务平衡配置，并同时用于 Campaign 生成与权限派生。

## 必要性检查

- 当前分支：`main`。
- 与上文持续使用的分支一致，可以继续实施。

## 约束与原则

- 当前任务网络仍在第一阶段和第三阶段各提供一次 INTEL，不改变现有拓扑。
- 玩家可以完成 0–2 次 INTEL；若首次选择 STRIKE，后续仅能取得一级情报权限。
- 不增加第三级权限，不改变既有 INTEL 奖励或存档结构。
- 生成器对超过上限的拓扑快速失败，避免静默生成低价值任务。

## 阶段与 TODO

- [x] 增加集中式 `maxIntelMissions` 上限。
- [x] 让情报权限派生复用同一上限。
- [x] 在任务网络生成时强制校验 INTEL 数量。
- [x] 增加生成器回归测试。
- [x] 更新 README、机制手册和核心认知。
- [x] 完成类型检查、自动化测试和生产构建。

## 代码变更

### `src/domain/campaignBalance.ts`

```diff
 export const campaignBalance = {
+  /** 两级情报权限各由一次 INTEL 解锁，任务网络不得生成没有新奖励的第三次行动。 */
+  maxIntelMissions: 2,
   successAlertDelta: 2,
   failureAlertDelta: 10,
 } as const;
```

### `src/domain/intelAccess.ts`

```diff
+import { campaignBalance } from "./campaignBalance";
 import type { CampaignState } from "./types";
+
 export type IntelAccessTier = 0 | 1 | 2;
+
 export function getIntelAccessTier(campaign: CampaignState): IntelAccessTier {
-  return Math.min(2, campaign.nodes.filter((node) => node.type === "INTEL" && node.status === "COMPLETED").length) as IntelAccessTier;
+  return Math.min(
+    campaignBalance.maxIntelMissions,
+    campaign.nodes.filter((node) => node.type === "INTEL" && node.status === "COMPLETED").length,
+  ) as IntelAccessTier;
 }
```

### `src/procedural/campaignGenerator.ts`

```diff
-import { getMissionEffectDescription } from "../domain/campaignBalance";
+import { campaignBalance, getMissionEffectDescription } from "../domain/campaignBalance";

       const id = `C${layer}-${index}`;
       const missionSeed = `${seed}:${id}`;
       const generated = generateMissionContent(missionSeed);
-      if (type === "INTEL") intelOrdinal += 1;
+      if (type === "INTEL") {
+        intelOrdinal += 1;
+        if (intelOrdinal > campaignBalance.maxIntelMissions) {
+          throw new Error(`任务网络最多允许 ${campaignBalance.maxIntelMissions} 个 INTEL 节点`);
+        }
+      }
       nodes.push({
```

### `src/procedural/campaignGenerator.test.ts`

```diff
 import { describe, expect, it } from "vitest";
+import { campaignBalance } from "../domain/campaignBalance";
 import { generateCampaign } from "./campaignGenerator";

       expect(campaign.nodes).toHaveLength(7);
       expect(new Set(campaign.nodes.map((node) => node.type)).size).toBeGreaterThanOrEqual(3);
       expect(campaign.nodes.filter((node) => node.type === "FINAL_STRIKE")).toHaveLength(1);
+      expect(campaign.nodes.filter((node) => node.type === "INTEL").length)
+        .toBeLessThanOrEqual(campaignBalance.maxIntelMissions);
       expect(campaign.nodes.filter((node) => node.status === "AVAILABLE")).toHaveLength(2);
```

## 文档变更

### `README.md`

```diff
 每个 Run 由三个顺序二选一阶段和一个 Final Strike 组成。节点状态包括：

+任务网络最多包含两个 INTEL 节点，分别对应两级情报权限；玩家可以完成 0–2 次。若首次阶段放弃 INTEL，后续仅剩一次情报行动机会，因此本 Run 无法取得第二级 `TOTAL INTEL`。
```

### `docs/game-mechanics.md`

```diff
 每个 Run 包含三个顺序二选一阶段与一个 Final Strike。只有摧毁目标并成功进入撤离区，当前节点才变为 `COMPLETED`。

+任务网络最多允许两个 INTEL 节点，因为权限只有 `0/2 → 1/2 → 2/2` 两次有效提升。当前拓扑分别在第一阶段和第三阶段提供一次 INTEL 机会；若玩家第一次选择 STRIKE，第三阶段的 INTEL 只会授予一级雷达识别，本 Run 不再有机会取得 `TOTAL INTEL`。生成器会拒绝包含第三个 INTEL 的拓扑，避免产生没有新权限奖励的低价值任务。
```

### `AGENTS.md`

```diff
-- 情报权限由已完成 INTEL 节点派生：一次完成后精确识别后续任务全部雷达位置与类型，两次后正式解锁 `TOTAL INTEL`。
+- 情报权限由已完成 INTEL 节点派生：任务网络最多包含两个 INTEL 节点，一次完成后精确识别后续任务全部雷达位置与类型，两次后正式解锁 `TOTAL INTEL`。
```

### `.agentdocs/index.md`

```diff
 ## 当前变更文档
+`workflow/20260902170448-enforce-two-intel-mission-limit.md` - 会话-124：集中并强制任务网络最多两个 INTEL 行动的规则。
```

## 测试用例

### TC-001 当前拓扑遵守上限

- 类型：生成器测试。
- 前置条件：使用任意 OPERATION CODE 生成任务网络。
- 操作步骤：统计生成节点中 `type === "INTEL"` 的数量。
- 预期结果：数量不超过 `campaignBalance.maxIntelMissions`，当前拓扑为两个。
- 是否通过：是。

### TC-002 权限上限使用同一配置

- 类型：类型检查与既有领域测试。
- 操作步骤：完成 0、1、2 个 INTEL 节点并派生权限。
- 预期结果：分别得到 `0/2`、`1/2`、`2/2`，权限上限与任务数量上限一致。
- 是否通过：是。

### TC-003 未来拓扑误加第三个 INTEL

- 类型：生成器防御性约束。
- 操作步骤：在阶段配置中加入第三个 INTEL 后生成任务网络。
- 预期结果：生成器抛出“任务网络最多允许 2 个 INTEL 节点”，不生成无新奖励节点。
- 是否通过：由代码路径保证；当前正式拓扑不会触发异常。

## 验证结果

- `npm run typecheck`：通过。
- `npm run test -- --run`：通过，28 个测试文件、133 项测试全部成功。
- `npm run build`：通过，Vite 生产构建成功。
- `git diff --check`：通过。
