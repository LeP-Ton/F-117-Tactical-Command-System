import { describe, expect, it } from "vitest";
import { createMission, createRun } from "./factories";
import { analyzeCompletedMission, applyEnemyCounterDeployment, createPlayerTacticalProfile } from "./enemyAdaptation";

describe("Enemy Adaptation", () => {
  it("只分析已经完成的航点，不读取未来规划", () => {
    const mission = createMission("ADAPT-HISTORY");
    const withRoute = {
      ...mission,
      route: {
        activeWaypointIndex: 2,
        waypoints: [
          { ...mission.route.waypoints[0]!, status: "COMPLETED" as const },
          { id: "flown", kind: "NAVIGATION" as const, status: "COMPLETED" as const, position: { x: 300, y: 800 } },
          { id: "future", kind: "NAVIGATION" as const, status: "PENDING" as const, position: { x: 900, y: 50 } },
        ],
      },
    };

    const profile = analyzeCompletedMission(createPlayerTacticalProfile(), withRoute);

    expect(profile.missionSamples).toBe(1);
    expect(profile.southernRouteBias).toBeGreaterThan(0.7);
  });

  it("没有足够飞行历史时不更新画像", () => {
    const mission = createMission("ADAPT-NO-HISTORY");
    const initial = createPlayerTacticalProfile();

    expect(analyzeCompletedMission(initial, mission)).toBe(initial);
  });

  it("相同画像会生成可复现的反制部署", () => {
    const mission = createMission("ADAPT-DEPLOYMENT");
    const enemyState = {
      ...createRun("ADAPT-RUN").enemyState,
      adaptationLevel: 3,
      tacticalProfile: {
        missionSamples: 2,
        terrainMaskingPreference: 0.8,
        southernRouteBias: 0.82,
        aggressiveRouting: 0.9,
      },
    };

    const first = applyEnemyCounterDeployment(mission, enemyState);
    const second = applyEnemyCounterDeployment(mission, enemyState);

    expect(second.radars).toEqual(first.radars);
    expect(first.radars).not.toEqual(mission.radars);
    expect(first.adaptationNotes).toContain("山地出口增设搜索覆盖");
    expect(first.adaptationNotes).toContain("南部航路搜索加强");
    expect(first.adaptationNotes).toContain("直达目标轴线增加拦截覆盖");
  });

  it("没有历史样本时不改变雷达部署", () => {
    const mission = createMission("ADAPT-BASELINE");
    const result = applyEnemyCounterDeployment(mission, createRun("ADAPT-BASELINE-RUN").enemyState);

    expect(result.radars).toEqual(mission.radars);
    expect(result.adaptationNotes).toEqual([]);
  });
});
