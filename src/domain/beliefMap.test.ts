import { describe, expect, it } from "vitest";
import { advanceBeliefMap, createBeliefMap, getBeliefPeak } from "./beliefMap";
import type { RadarContact } from "./types";

function contact(x: number, y: number, timestamp = 1000, confidence = 0.9): RadarContact {
  return {
    id: `C-${timestamp}`,
    radarId: "R1",
    timestamp,
    estimatedPosition: { x, y },
    confidence,
    signalStrength: 0.8,
    errorRadius: 35,
  };
}

describe("Belief Map", () => {
  it("高置信度 Contact 在估算位置附近形成概率峰值", () => {
    const belief = advanceBeliefMap(createBeliefMap(), [contact(500, 500)], 1000, 0);
    const peak = getBeliefPeak(belief);
    expect(peak.position?.x).toBeCloseTo(500, -2);
    expect(peak.position?.y).toBeCloseTo(500, -2);
    expect(peak.probability).toBeGreaterThan(0);
    expect(belief.probabilities.reduce((sum, value) => sum + value, 0)).toBeLessThanOrEqual(1);
  });

  it("失去 Contact 后概率扩散并衰减", () => {
    const observed = advanceBeliefMap(createBeliefMap(), [contact(500, 500)], 1000, 0);
    const originalPeak = getBeliefPeak(observed).probability;
    const propagated = advanceBeliefMap(observed, [], 2000, 1);
    expect(getBeliefPeak(propagated).probability).toBeLessThan(originalPeak);
    expect(propagated.probabilities.filter((value) => value > 0.0001).length).toBeGreaterThan(
      observed.probabilities.filter((value) => value > 0.0001).length,
    );
  });

  it("连续 Contact 形成有上限的速度估计", () => {
    const first = advanceBeliefMap(createBeliefMap(), [contact(100, 100, 1000)], 1000, 0);
    const second = advanceBeliefMap(first, [contact(900, 900, 2000)], 2000, 0);
    expect(Math.hypot(second.estimatedVelocity.x, second.estimatedVelocity.y)).toBeLessThanOrEqual(18.0001);
  });

  it("空 Belief 不返回地图左上角的伪定位", () => {
    const peak = getBeliefPeak(createBeliefMap());
    expect(peak.isValid).toBe(false);
    expect(peak.position).toBeUndefined();
  });

  it("失联超时后定位失效", () => {
    const observed = advanceBeliefMap(createBeliefMap(), [contact(500, 500)], 1000, 0);
    const expired = advanceBeliefMap(observed, [], 14000, 13);
    expect(getBeliefPeak(expired, 14000).isValid).toBe(false);
    expect(getBeliefPeak(expired, 14000).position).toBeUndefined();
  });

  it("向地图外传播时概率流失而不是堆积在边缘", () => {
    const first = advanceBeliefMap(createBeliefMap(), [contact(900, 500, 1000)], 1000, 0);
    const second = advanceBeliefMap(first, [contact(980, 500, 2500)], 2500, 0);
    const before = second.probabilities.reduce((sum, value) => sum + value, 0);
    const propagated = advanceBeliefMap(second, [], 6500, 4);
    const after = propagated.probabilities.reduce((sum, value) => sum + value, 0);
    expect(after).toBeLessThan(before);
  });

  it("接口只消费 Contact，不需要真实飞机状态", () => {
    const belief = advanceBeliefMap(createBeliefMap(), [contact(300, 400)], 1000, 0.25);
    expect(belief).not.toHaveProperty("realPlayerPosition");
  });
});
