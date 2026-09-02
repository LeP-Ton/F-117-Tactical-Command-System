# 区分两次 INTEL 行动奖励说明

## 背景与目标

- 第一次与第二次 INTEL 原先共用“逐级核实雷达身份并授权敌方态势”，无法让玩家在任务网络中判断当前节点的具体收益。
- 将第一次行动明确为雷达坐标与型号核实，将第二次行动明确为 `TOTAL INTEL` 完整敌方态势授权。
- 现有存档可能保存旧 `preview.effect`，任务网络必须按节点顺序动态获取当前文案，不能依赖陈旧存档文字。

## 约束与原则

- 只调整奖励说明，不改变 INTEL 权限计算、任务结算、Seed 或存档结构。
- 非 INTEL 任务继续使用集中式任务收益文案。
- Campaign 生成数据与任务网络实际展示读取同一个纯函数，避免两处再次分叉。

## 阶段与 TODO

- [x] 增加按 INTEL 次序返回奖励说明的纯函数。
- [x] Campaign Generator 为两次 INTEL 写入不同预览说明。
- [x] 任务网络按节点次序动态显示说明，兼容旧存档。
- [x] 增加生成器与 UI 回归测试。
- [x] 完成类型检查、自动化测试和生产构建。

## 代码变更

### `src/domain/campaignBalance.ts`

```diff
 export const missionEffectDescriptions: Record<MissionNodeType, string> = {
-  INTEL: "获取敌防空网电子情报，逐级核实雷达身份并授权敌方态势",
+  INTEL: "核实后续任务全部雷达坐标与型号",
   STRIKE: "打击敌雷达保障节点，降低后续雷达扫描速率",
   SEAD: "压制敌防空节点，缩小后续雷达覆盖范围",
   COMMAND_STRIKE: "打击敌指挥链，削弱后续协同搜索与联合跟踪能力",
   FINAL_STRIKE: "对最终目标实施纵深精确打击",
 };

+/** INTEL 的两次行动授予不同权限，不能使用同一条笼统奖励说明。 */
+export function getMissionEffectDescription(type: MissionNodeType, intelOrdinal = 1): string {
+  if (type !== "INTEL") return missionEffectDescriptions[type];
+  return intelOrdinal >= 2
+    ? "授权 TOTAL INTEL，开放真实雷达覆盖与完整敌方态势"
+    : missionEffectDescriptions.INTEL;
+}
```

### `src/procedural/campaignGenerator.ts`

```diff
-import { missionEffectDescriptions } from "../domain/campaignBalance";
+import { getMissionEffectDescription } from "../domain/campaignBalance";

 export function generateCampaign(seed: string): CampaignState {
   const nodes: CampaignNode[] = [];
+  let intelOrdinal = 0;
   stageTypes.forEach((types, layer) => {
     types.forEach((type, index) => {
       const id = `C${layer}-${index}`;
       const missionSeed = `${seed}:${id}`;
       const generated = generateMissionContent(missionSeed);
+      if (type === "INTEL") intelOrdinal += 1;
       nodes.push({
         preview: {
           radarDensity: generated.radars.length,
           weather: generated.weather.map((cell) => cell.kind).join(" + "),
-          effect: missionEffectDescriptions[type],
+          effect: getMissionEffectDescription(type, intelOrdinal),
         },
       });
     });
   });
```

### `src/ui/CampaignMap.tsx`

```diff
-import { missionEffectDescriptions } from "../domain/campaignBalance";
+import { getMissionEffectDescription } from "../domain/campaignBalance";

   const adaptation = getAdaptationAssessment(state.enemyState.tacticalProfile);
   const intelAccessTier = getIntelAccessTier(state.campaign);
+  const selectedIntelOrdinal = selected?.type === "INTEL"
+    ? state.campaign.nodes
+      .filter((node) => node.type === "INTEL")
+      .sort((left, right) => left.layer - right.layer)
+      .findIndex((node) => node.id === selected.id) + 1
+    : 0;

-            <p>{missionEffectDescriptions[selected.type]}。</p>
+            <p>{getMissionEffectDescription(selected.type, selectedIntelOrdinal)}。</p>
```

## 测试变更

### `src/procedural/campaignGenerator.test.ts`

```diff
+  it("两次 INTEL 使用不同且准确的奖励说明", () => {
+    const intelNodes = generateCampaign("INTEL-REWARD-COPY").nodes
+      .filter((node) => node.type === "INTEL")
+      .sort((left, right) => left.layer - right.layer);
+
+    expect(intelNodes[0]?.preview.effect).toBe("核实后续任务全部雷达坐标与型号");
+    expect(intelNodes[1]?.preview.effect).toBe("授权 TOTAL INTEL，开放真实雷达覆盖与完整敌方态势");
+  });
```

### `src/ui/CampaignMap.copy.test.tsx`

```diff
+  it("第一次与第二次 INTEL 显示不同奖励", () => {
+    const state = createRun("CAMPAIGN-INTEL-REWARD-COPY");
+    render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
+
+    expect(screen.getByText("核实后续任务全部雷达坐标与型号。")).toBeInTheDocument();
+    fireEvent.click(screen.getByRole("button", { name: /C2-0/ }));
+    expect(screen.getByText("授权 TOTAL INTEL，开放真实雷达覆盖与完整敌方态势。")).toBeInTheDocument();
+  });
```

## 测试用例

### TC-001 新生成任务网络的奖励说明

- 类型：生成器测试
- 操作：生成任务网络并按层级读取两个 INTEL 节点。
- 预期：第一次说明为坐标与型号核实，第二次说明为 `TOTAL INTEL` 授权。
- 是否通过：是。

### TC-002 任务网络实际展示

- 类型：UI 渲染测试
- 操作：依次选择 C0-0 与 C2-0。
- 预期：右侧任务预览显示对应的不同奖励说明。
- 是否通过：是。

### TC-003 旧存档文案兼容

- 类型：实现边界检查
- 操作：任务网络不读取存档中的旧 `preview.effect`，而是根据当前节点在 INTEL 序列中的位置重新派生。
- 预期：旧 Run 也立即显示新文案，不需要存档迁移。
- 是否通过：是。

## 验证结果

- `npm run typecheck`：通过。
- `npm run test -- --run`：通过，28 个测试文件、133 项测试全部成功。
- `npm run build`：通过，Vite 生产构建成功。
