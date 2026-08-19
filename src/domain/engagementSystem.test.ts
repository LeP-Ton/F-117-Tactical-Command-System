import { describe, expect, it } from "vitest";
import { advanceEngagement, createEngagementState } from "./engagementSystem";
import type { RadarContact } from "./types";

const strongContact: RadarContact = {
  id: "CONTACT-1",
  radarId: "RADAR-01",
  timestamp: 1000,
  estimatedPosition: { x: 500, y: 500 },
  confidence: 0.9,
  signalStrength: 0.85,
  errorRadius: 20,
};

const supportingContact: RadarContact = {
  ...strongContact,
  id: "CONTACT-2",
  radarId: "RADAR-02",
  confidence: 0.8,
};

describe("防空交战系统", () => {
  it("连续高质量 Contact 会逐级建立跟踪并发射导弹", () => {
    let state = createEngagementState();
    let launched = false;

    for (let index = 0; index < 12; index += 1) {
      const result = advanceEngagement(state, [strongContact], 0.25, 1);
      state = result.state;
      launched ||= result.missileLaunched;
    }

    expect(launched).toBe(true);
    expect(state.stage).toBe("MISSILE_INBOUND");
    expect(state.missileTimeRemainingSeconds).toBeDefined();
  });

  it("失去新证据后跟踪质量会下降", () => {
    const result = advanceEngagement(
      { ...createEngagementState(), stage: "TRACKED", trackProgress: 55 },
      [],
      2,
      1,
    );

    expect(result.state.trackProgress).toBe(27);
    expect(result.state.stage).toBe("SUSPECTED");
  });

  it("指挥链只削弱多雷达联合证据，不削弱最强本地 Contact", () => {
    const singleFull = advanceEngagement(createEngagementState(), [strongContact], 0.25, 1);
    const singleDamaged = advanceEngagement(createEngagementState(), [strongContact], 0.25, 0.45);
    const networkFull = advanceEngagement(createEngagementState(), [strongContact, supportingContact], 0.25, 1);
    const networkDamaged = advanceEngagement(createEngagementState(), [strongContact, supportingContact], 0.25, 0.45);
    expect(singleDamaged.state.trackProgress).toBeCloseTo(singleFull.state.trackProgress);
    expect(networkDamaged.state.trackProgress).toBeGreaterThan(singleDamaged.state.trackProgress);
    expect(networkDamaged.state.trackProgress).toBeLessThan(networkFull.state.trackProgress);
  });

  it("导弹飞行中脱离制导阈值会使导弹失效", () => {
    const result = advanceEngagement({
      stage: "MISSILE_INBOUND",
      trackProgress: 40,
      missileTimeRemainingSeconds: 7,
      launches: 1,
    }, [], 1, 1);

    expect(result.missileDefeated).toBe(true);
    expect(result.aircraftHit).toBe(false);
    expect(result.state.stage).toBe("SUSPECTED");
  });

  it("倒计时结束且仍保持制导时命中飞机", () => {
    const result = advanceEngagement({
      stage: "MISSILE_INBOUND",
      trackProgress: 100,
      missileTimeRemainingSeconds: 0.1,
      launches: 1,
    }, [], 0.2, 1);

    expect(result.aircraftHit).toBe(true);
    expect(result.state.stage).toBe("TRACKED");
  });
});
