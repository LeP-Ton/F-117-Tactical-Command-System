import { describe, expect, it } from "vitest";
import { advanceAwareness, awarenessStage } from "./awarenessSystem";
import type { AwarenessState, RadarContact } from "./types";

const contact: RadarContact = {
  id: "C1",
  radarId: "R1",
  timestamp: 1000,
  estimatedPosition: { x: 400, y: 500 },
  confidence: 0.9,
  signalStrength: 0.8,
  errorRadius: 25,
};

describe("Enemy Awareness", () => {
  it("Contact 证据提高警戒并跨越阶段", () => {
    let state: AwarenessState = { value: 0, stage: "CALM" };
    state = advanceAwareness(state, [contact], 0);
    state = advanceAwareness(state, [contact], 0);
    expect(state.value).toBeGreaterThan(18);
    expect(state.stage).not.toBe("CALM");
  });

  it("无新证据时缓慢衰减且不低于零", () => {
    const decayed = advanceAwareness({ value: 50, stage: "SEARCHING" }, [], 10);
    expect(decayed.value).toBeLessThan(50);
    expect(advanceAwareness({ value: 0, stage: "CALM" }, [], 10).value).toBe(0);
  });

  it("阶段阈值映射正确", () => {
    expect(awarenessStage(0)).toBe("CALM");
    expect(awarenessStage(20)).toBe("SUSPICIOUS");
    expect(awarenessStage(50)).toBe("SEARCHING");
    expect(awarenessStage(80)).toBe("HUNTING");
  });
});
