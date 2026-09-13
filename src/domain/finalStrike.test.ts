import { describe, expect, it } from "vitest";
import { createMission } from "./factories";
import { applyFinalStrikeDefense, type FinalStrikeContext } from "./finalStrike";

function context(overrides: Partial<FinalStrikeContext> = {}): FinalStrikeContext {
  return {
    completedNodeTypes: [],
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
    finalMission.radars.forEach((radar) => {
      expect(radar.position.x).toBeGreaterThanOrEqual(200);
      expect(radar.position.x).toBeLessThanOrEqual(800);
      expect(radar.position.y).toBeGreaterThanOrEqual(200);
      expect(radar.position.y).toBeLessThanOrEqual(800);
    });
  });

  it("SEAD 不再阻止最终战后备火控雷达上线", () => {
    const mission = createMission("FINAL-SEAD");
    const finalMission = applyFinalStrikeDefense(mission, context({ completedNodeTypes: ["SEAD"] }));

    expect(finalMission.radars).toHaveLength(mission.radars.length + 1);
    expect(finalMission.radars.some((radar) => radar.id === "FINAL-GUARD")).toBe(true);
  });

  it("最终战不再生成警戒或历史航迹增援", () => {
    const mission = createMission("FINAL-SIMPLIFIED");
    const finalMission = applyFinalStrikeDefense(mission, context({
      completedNodeTypes: ["INTEL", "STRIKE", "SEAD", "COMMAND_STRIKE"],
    }));

    expect(finalMission.radars).toHaveLength(mission.radars.length + 1);
    expect(finalMission.radars.some((radar) => radar.id === "ALERT-GUARD")).toBe(false);
    expect(finalMission.radars.some((radar) => radar.id === "ADAPT-GUARD")).toBe(false);
    expect(finalMission.finalStrikeNotes).toContain("指挥打击战果削弱最终指挥链");
    expect(finalMission.finalStrikeNotes).toContain("情报战果已核实最终目标雷达坐标与型号");
  });

  it("相同任务历史会生成完全一致的最终体系", () => {
    const mission = createMission("FINAL-REPLAY");
    const history = context({ completedNodeTypes: ["INTEL", "SEAD"] });

    expect(applyFinalStrikeDefense(mission, history)).toEqual(applyFinalStrikeDefense(mission, history));
  });

  it("批量最终战增援均保持在雷达部署范围内", () => {
    for (let index = 0; index < 100; index += 1) {
      const finalMission = applyFinalStrikeDefense(createMission(`FINAL-BOUNDS-${index}`), context());
      finalMission.radars.forEach((radar) => {
        expect(radar.position.x).toBeGreaterThanOrEqual(200);
        expect(radar.position.x).toBeLessThanOrEqual(800);
        expect(radar.position.y).toBeGreaterThanOrEqual(200);
        expect(radar.position.y).toBeLessThanOrEqual(800);
      });
    }
  });
});
