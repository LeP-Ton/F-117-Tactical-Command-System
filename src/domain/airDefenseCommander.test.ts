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
  active: true,
  operator: createRadarOperatorState(),
};
const contact: RadarContact = {
  id: "C1", radarId: "R1", timestamp: 1000,
  estimatedPosition: { x: 700, y: 700 }, confidence: 0.9, signalStrength: 0.8, errorRadius: 30,
};

describe("Air Defense Commander", () => {
  it("平静且无 Belief 时维持监视", () => {
    const result = advanceCommander(
      createCommanderState(),
      { value: 0, stage: "CALM" },
      createBeliefMap(),
      [radar],
      1000,
      1,
    );
    expect(result.commander.intent).toBe("MONITOR");
    expect(result.radars[0]?.operator.commanderBias.WIDE_SEARCH).toBeGreaterThan(0);
  });

  it("高警戒与明确 Belief 触发集中搜索", () => {
    const belief = advanceBeliefMap(createBeliefMap(), [contact], 1000, 0);
    const result = advanceCommander(
      createCommanderState(),
      { value: 85, stage: "HUNTING" },
      belief,
      [radar],
      1000,
      1,
    );
    expect(result.commander.intent).toBe("CONCENTRATE_SEARCH");
    expect(result.radars[0]?.operator.commanderBias.FOCUSED_TRACK).toBe(30);
    expect(result.radars[0]?.operator.focusBearingDegrees).toBeDefined();
  });

  it("Commander 接口和状态不包含真实飞机位置", () => {
    const result = advanceCommander(
      createCommanderState(),
      { value: 50, stage: "SEARCHING" },
      createBeliefMap(),
      [radar],
      1000,
      1,
    );
    expect(result.commander).not.toHaveProperty("realPlayerPosition");
  });

  it("Ambush Doctrine 只在开局短暂静默并能恢复", () => {
    const opening = advanceCommander(
      createCommanderState("AMBUSH"),
      { value: 0, stage: "CALM" },
      createBeliefMap(),
      [radar],
      1000,
      1,
    );
    expect(opening.commander.intent).toBe("NETWORK_SILENCE");
    const recovered = advanceCommander(
      opening.commander,
      { value: 0, stage: "CALM" },
      createBeliefMap(),
      opening.radars,
      7000,
      1,
    );
    expect(recovered.commander.intent).toBe("MONITOR");
  });

  it("受损指挥链会按比例降低雷达协调偏置", () => {
    const belief = advanceBeliefMap(createBeliefMap(), [contact], 1000, 0);
    const full = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 1000, 1, 1);
    const damaged = advanceCommander(createCommanderState(), { value: 85, stage: "HUNTING" }, belief, [radar], 1000, 1, 0.5);
    expect(damaged.radars[0]!.operator.commanderBias.FOCUSED_TRACK).toBeCloseTo(
      full.radars[0]!.operator.commanderBias.FOCUSED_TRACK * 0.5,
    );
  });

  it("Belief 失联后清除 CMD 目标位置", () => {
    const belief = advanceBeliefMap(createBeliefMap(), [contact], 1000, 0);
    const acquired = advanceCommander(
      createCommanderState(),
      { value: 60, stage: "SEARCHING" },
      belief,
      [radar],
      1000,
      1,
    );
    const expiredBelief = advanceBeliefMap(belief, [], 14000, 13);
    const lost = advanceCommander(
      acquired.commander,
      { value: 40, stage: "SUSPICIOUS" },
      expiredBelief,
      acquired.radars,
      14000,
      1,
    );
    expect(acquired.commander.targetPosition).toBeDefined();
    expect(lost.commander.targetPosition).toBeUndefined();
  });
});
