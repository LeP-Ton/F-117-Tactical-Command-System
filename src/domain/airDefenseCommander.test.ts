import { describe, expect, it } from "vitest";
import { advanceCommander, createCommanderState } from "./airDefenseCommander";
import { advanceBeliefMap, createBeliefMap } from "./beliefMap";
import { createRadarOperatorState } from "./radarOperatorAI";
import type { RadarContact, RadarState } from "./types";

const radar: RadarState = {
  id: "R1",
  position: { x: 100, y: 100 },
  range: 300,
  sweepAngleDegrees: 0,
  scanAccumulatorSeconds: 0,
  scanCount: 0,
  operator: createRadarOperatorState(),
};

const contact: RadarContact = {
  id: "C1",
  radarId: "R1",
  timestamp: 1000,
  estimatedPosition: { x: 700, y: 700 },
  confidence: 0.9,
  signalStrength: 0.8,
  errorRadius: 30,
};

describe("Air Defense Commander", () => {
  it("低警戒且无 Belief 时维持监视", () => {
    const result = advanceCommander(createCommanderState(), { value: 0, stage: "CALM" }, createBeliefMap(), [radar], 1000, 1);
    expect(result.commander.intent).toBe("MONITOR");
    expect(result.radars[0]?.operator.commanderBias.WIDE_SEARCH).toBeGreaterThan(0);
  });

  it("高警戒与明确 Belief 触发集中搜索", () => {
    const belief = advanceBeliefMap(createBeliefMap(), [contact], 1000, 0);
    const result = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 1000, 1);
    expect(result.commander.intent).toBe("CONCENTRATE_SEARCH");
    expect(result.radars[0]?.operator.commanderBias.FOCUSED_TRACK).toBe(30);
    expect(result.radars[0]?.operator.focusBearingDegrees).toBeDefined();
  });

  it("中等警戒触发协同搜索", () => {
    const result = advanceCommander(createCommanderState(), { value: 45, stage: "SEARCHING" }, createBeliefMap(), [radar], 1000, 1);
    expect(result.commander.intent).toBe("COORDINATED_SEARCH");
  });

  it("Commander 接口和状态不包含真实飞机位置", () => {
    const result = advanceCommander(createCommanderState(), { value: 50, stage: "SEARCHING" }, createBeliefMap(), [radar], 1000, 1);
    expect(result.commander).not.toHaveProperty("realPlayerPosition");
  });

  it("受损指挥链会按比例降低雷达协调偏置", () => {
    const belief = advanceBeliefMap(createBeliefMap(), [contact], 1000, 0);
    const full = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 2000, 2, 1);
    const damaged = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 2000, 2, 0.5);
    expect(damaged.radars[0]!.operator.commanderBias.FOCUSED_TRACK).toBeCloseTo(
      full.radars[0]!.operator.commanderBias.FOCUSED_TRACK * 0.5,
    );
  });

  it("受损指挥链延长 Commander 决策间隔", () => {
    const belief = advanceBeliefMap(createBeliefMap(), [contact], 1000, 0);
    const full = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 1000, 1, 1);
    const damaged = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 1000, 1, 0.5);
    expect(full.commander.intent).toBe("CONCENTRATE_SEARCH");
    expect(damaged.commander.intent).toBe("MONITOR");
    expect(damaged.commander.targetPosition).toBeUndefined();
  });

  it("Belief 失联后清除 CMD 目标位置", () => {
    const belief = advanceBeliefMap(createBeliefMap(), [contact], 1000, 0);
    const acquired = advanceCommander(createCommanderState(), { value: 60, stage: "SEARCHING" }, belief, [radar], 1000, 1);
    const expiredBelief = advanceBeliefMap(belief, [], 14000, 13);
    const lost = advanceCommander(acquired.commander, { value: 40, stage: "SUSPICIOUS" }, expiredBelief, acquired.radars, 14000, 1);
    expect(acquired.commander.targetPosition).toBeDefined();
    expect(lost.commander.targetPosition).toBeUndefined();
  });
});
