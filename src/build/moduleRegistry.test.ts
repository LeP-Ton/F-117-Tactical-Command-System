import { describe, expect, it } from "vitest";
import { createMission } from "../domain/factories";
import { applyBuildToMission, tacticalModules } from "./moduleRegistry";

describe("Tactical Module Registry", () => {
  it("当前正式奖励池为空", () => {
    expect(tacticalModules).toEqual([]);
  });

  it("Ghost Build 降低探测并强化地形遮蔽", () => {
    const base = createMission("GHOST");
    const built = applyBuildToMission(base, ["LOW_OBSERVABLE_MAINTENANCE", "TERRAIN_ANALYSIS"]);
    expect(built.detectionModifier).toBe(0.82);
    expect(built.terrain[0]!.maskingFactor).toBeLessThan(base.terrain[0]!.maskingFactor);
  });

  it("Intelligence 与 Deception Build 改变任务能力", () => {
    const built = applyBuildToMission(createMission("INTEL"), [
      "SIGNAL_HISTORY", "THREAT_PREDICTION", "FALSE_CONTACT_GENERATOR",
    ]);
    expect(built.contactLifetimeMultiplier).toBe(1.75);
    expect(built.threatPredictionEnabled).toBe(true);
    expect(built.falseContactCharges).toBe(1);
  });
});
