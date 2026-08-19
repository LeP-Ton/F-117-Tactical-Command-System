import { describe, expect, it } from "vitest";
import { createMission, createRun } from "./factories";
import { applyFinalStrikeDefense, type FinalStrikeContext } from "./finalStrike";

function context(overrides: Partial<FinalStrikeContext> = {}): FinalStrikeContext {
  return {
    completedNodeTypes: [],
    enemyAlert: 0,
    adaptationLevel: 0,
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
    expect(finalMission.finalStrikeNotes).toContain("未执行 SEAD：目标区后备雷达上线");
  });

  it("SEAD 战果会阻止后备雷达上线", () => {
    const mission = createMission("FINAL-SEAD");
    const finalMission = applyFinalStrikeDefense(mission, context({ completedNodeTypes: ["SEAD"] }));

    expect(finalMission.radars).toHaveLength(mission.radars.length);
    expect(finalMission.radars.some((radar) => radar.id === "FINAL-GUARD")).toBe(false);
  });

  it("高 Alert 与历史画像会分别增加警戒和自适应雷达", () => {
    const mission = createMission("FINAL-ESCALATION");
    const finalMission = applyFinalStrikeDefense(mission, context({
      enemyAlert: 30,
      adaptationLevel: 3,
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

  it("相同任务历史会生成完全一致的最终体系", () => {
    const mission = createMission("FINAL-REPLAY");
    const history = context({ enemyAlert: 25, adaptationLevel: 2 });

    expect(applyFinalStrikeDefense(mission, history)).toEqual(applyFinalStrikeDefense(mission, history));
  });
});
