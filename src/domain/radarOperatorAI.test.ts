import { describe, expect, it } from "vitest";
import { advanceRadarOperators, createRadarOperatorState } from "./radarOperatorAI";
import type { RadarContact, RadarState } from "./types";

function createRadar(): RadarState {
  return {
    id: "R1",
    position: { x: 100, y: 100 },
    range: 300,
    sweepAngleDegrees: 0,
    scanAccumulatorSeconds: 0,
    scanCount: 0,
    active: true,
    operator: createRadarOperatorState(),
  };
}

function createContact(timestamp: number, confidence: number): RadarContact {
  return {
    id: "C1",
    radarId: "R1",
    timestamp,
    estimatedPosition: { x: 220, y: 100 },
    confidence,
    signalStrength: 0.7,
    errorRadius: 30,
  };
}

describe("Radar Operator Utility AI", () => {
  it("高置信度新 Contact 触发聚焦跟踪", () => {
    const result = advanceRadarOperators([createRadar()], [createContact(1000, 0.9)], 1000, 0.5);
    expect(result.radars[0]?.operator.mode).toBe("FOCUSED_TRACK");
    expect(result.radars[0]?.operator.utilityScores.FOCUSED_TRACK).toBeGreaterThan(
      result.radars[0]?.operator.utilityScores.SECTOR_SEARCH ?? 0,
    );
    expect(result.changes[0]).toMatchObject({ from: "WIDE_SEARCH", to: "FOCUSED_TRACK" });
  });

  it("Contact 变旧后由扇区搜索退回广域搜索", () => {
    const focused = advanceRadarOperators([createRadar()], [createContact(1000, 0.8)], 1000, 0.5).radars;
    const sector = advanceRadarOperators(focused, [createContact(1000, 0.8)], 6500, 0.5).radars;
    expect(sector[0]?.operator.mode).toBe("SECTOR_SEARCH");
    const wide = advanceRadarOperators(sector, [createContact(1000, 0.8)], 11000, 0.5).radars;
    expect(wide[0]?.operator.mode).toBe("WIDE_SEARCH");
  });

  it("长时间无证据时短暂关机并按冷却恢复", () => {
    const shutdown = advanceRadarOperators([createRadar()], [], 21000, 0.5).radars;
    expect(shutdown[0]?.operator.mode).toBe("SHUTDOWN");
    expect(shutdown[0]?.active).toBe(false);
    const holding = advanceRadarOperators(shutdown, [], 22500, 0.5).radars;
    expect(holding[0]?.operator.mode).toBe("SHUTDOWN");
    const restored = advanceRadarOperators(holding, [], 25001, 0.5).radars;
    expect(restored[0]?.operator.mode).toBe("WIDE_SEARCH");
    expect(restored[0]?.active).toBe(true);
  });
});
