import { describe, expect, it } from "vitest";
import { generateRewardChoices } from "./rewardGenerator";

describe("Reward Generator", () => {
  it("空奖励池对任意 Seed 都不生成选项", () => {
    const first = generateRewardChoices("RUN", [], 0);
    expect(first).toEqual(generateRewardChoices("RUN", [], 0));
    expect(first).toEqual([]);
  });

  it("已有模块状态不会使空池产生奖励", () => {
    const owned = ["LOW_OBSERVABLE_MAINTENANCE", "SIGNAL_HISTORY"];
    expect(generateRewardChoices("RUN", owned, 1).some((id) => owned.includes(id))).toBe(false);
  });
});
