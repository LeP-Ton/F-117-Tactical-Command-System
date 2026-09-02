import { describe, expect, it } from "vitest";
import { createMission, createRun } from "./factories";
import { analyzeCompletedMission, applyEnemyCounterDeployment, createPlayerTacticalProfile, getAdaptationAssessment } from "./enemyAdaptation";

describe("Enemy Adaptation", () => {
  it("只分析真实已飞轨迹，不读取未来规划", () => {
    const mission = createMission("ADAPT-HISTORY");
    const withRoute = {
      ...mission,
      flightPath: [
        { x: 90, y: 850 },
        { x: 300, y: 800 },
      ],
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
      tacticalProfile: {
        missionSamples: 2,
        terrainMaskingPreference: 0.8,
        southernRouteBias: 0.82,
        aggressiveRouting: 0.9,
      },
    };

    const first = applyEnemyCounterDeployment(mission, enemyState);
    const second = applyEnemyCounterDeployment(mission, enemyState);
    const protectedFireControl = mission.radars.find((radar) => radar.type === "FIRE_CONTROL")!;

    expect(second.radars).toEqual(first.radars);
    expect(first.radars).not.toEqual(mission.radars);
    expect(first.adaptationNotes).toContain("山地出口增设搜索覆盖");
    expect(first.adaptationNotes).toContain("南部航路搜索加强");
    expect(first.adaptationNotes).toContain("直达目标轴线增加拦截覆盖");
    expect(first.radars.find((radar) => radar.id === protectedFireControl.id)?.position).toEqual(
      protectedFireControl.position,
    );
  });

  it("没有历史样本时不改变雷达部署", () => {
    const mission = createMission("ADAPT-BASELINE");
    const result = applyEnemyCounterDeployment(mission, createRun("ADAPT-BASELINE-RUN").enemyState);

    expect(result.radars).toEqual(mission.radars);
    expect(result.adaptationNotes).toEqual([]);
  });

  it("根据显著画像数量派生状态与反制强度", () => {
    const initial = createPlayerTacticalProfile();
    expect(getAdaptationAssessment(initial)).toMatchObject({ signalCount: 0, status: "LOW", deploymentStrength: 0 });
    expect(getAdaptationAssessment({ ...initial, aggressiveRouting: 0.8 }))
      .toMatchObject({ signalCount: 1, status: "ACTIVE", deploymentStrength: 0.22 });
    expect(getAdaptationAssessment({ ...initial, aggressiveRouting: 0.8, southernRouteBias: 0.7 }))
      .toMatchObject({ signalCount: 2, status: "HIGH", deploymentStrength: 0.32 });
    expect(getAdaptationAssessment({ missionSamples: 2, aggressiveRouting: 0.8, southernRouteBias: 0.7, terrainMaskingPreference: 0.5 }))
      .toMatchObject({ signalCount: 3, status: "HIGH", deploymentStrength: 0.42 });
  });

  it("支持半权重航迹并与旧存档整数权重进行加权平均", () => {
    const mission = {
      ...createMission("ADAPT-WEIGHTED"),
      flightPath: [{ x: 90, y: 800 }, { x: 400, y: 800 }],
    };
    const legacy = { missionSamples: 1, terrainMaskingPreference: 0.3, southernRouteBias: 0.4, aggressiveRouting: 0.5 };
    const profile = analyzeCompletedMission(legacy, mission, 0.5);

    expect(profile.missionSamples).toBe(1.5);
    expect(profile.southernRouteBias).toBeCloseTo((0.4 + 0.8 * 0.5) / 1.5);
  });
});
