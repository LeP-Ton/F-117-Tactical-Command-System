import { describe, expect, it } from "vitest";
import { createMission, createRun } from "./factories";
import { applyFinalStrikeDefense, type FinalStrikeContext } from "./finalStrike";

function context(overrides: Partial<FinalStrikeContext> = {}): FinalStrikeContext {
  return {
    completedNodeTypes: [],
    enemyAlert: 0,
    tacticalProfile: createRun("FINAL-CONTEXT").enemyState.tacticalProfile,
    ...overrides,
  };
}

describe("Final Strike 动态防空体系", () => {
  it("未完成 SEAD 时部署目标区后备雷达", () => {
    const mission = createMission("FINAL-NO-SEAD");
    const finalMission = applyFinalStrikeDefense(mission, context());

    expect(finalMission.radars.length).toBe(mission.radars.length + 1);
    expect(finalMission.radars.some((radar) => radar.id === "FINAL-GUARD")).toBe(true);
    expect(finalMission.finalStrikeNotes).toContain("目标区后备火控雷达上线");
  });

  it("SEAD 不再阻止最终战后备火控雷达上线", () => {
    const mission = createMission("FINAL-SEAD");
    const finalMission = applyFinalStrikeDefense(mission, context({ completedNodeTypes: ["SEAD"] }));

    expect(finalMission.radars).toHaveLength(mission.radars.length + 1);
    expect(finalMission.radars.some((radar) => radar.id === "FINAL-GUARD")).toBe(true);
  });

  it("高 Alert 与历史画像会分别增加警戒和自适应雷达", () => {
    const mission = createMission("FINAL-ESCALATION");
    const finalMission = applyFinalStrikeDefense(mission, context({
      enemyAlert: 30,
      tacticalProfile: {
        missionSamples: 3,
        terrainMaskingPreference: 0.5,
        southernRouteBias: 0.8,
        aggressiveRouting: 0.85,
      },
    }));

    expect(finalMission.radars.some((radar) => radar.id === "ALERT-GUARD")).toBe(true);
    expect(finalMission.radars.some((radar) => radar.id === "ADAPT-GUARD")).toBe(true);
  });

  it("仅在至少两项显著画像特征形成后部署自适应雷达", () => {
    const mission = createMission("FINAL-ADAPTATION-SIGNALS");
    const low = applyFinalStrikeDefense(mission, context({
      tacticalProfile: {
        missionSamples: 3,
        terrainMaskingPreference: 0.1,
        southernRouteBias: 0.5,
        aggressiveRouting: 0.8,
      },
    }));

    expect(low.radars.some((radar) => radar.id === "ADAPT-GUARD")).toBe(false);
    expect(low.finalStrikeNotes).toContain("历史航迹未形成高可信反制画像");
  });

  it("相同任务历史会生成完全一致的最终体系", () => {
    const mission = createMission("FINAL-REPLAY");
    const history = context({
      enemyAlert: 25,
      tacticalProfile: { ...context().tacticalProfile, missionSamples: 2 },
    });

    expect(applyFinalStrikeDefense(mission, history)).toEqual(applyFinalStrikeDefense(mission, history));
  });
});
