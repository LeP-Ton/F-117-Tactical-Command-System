import { describe, expect, it } from "vitest";
import { advanceRadarOperators, createRadarOperatorState } from "./radarOperatorAI";
import type { RadarContact, RadarState } from "./types";

function createRadar(id = "R1"): RadarState {
  return {
    id,
    position: { x: 100, y: 100 },
    range: 300,
    sweepAngleDegrees: 0,
    scanAccumulatorSeconds: 0,
    scanCount: 0,
    operator: createRadarOperatorState(),
  };
}

function createContact(timestamp: number, confidence: number, radarId = "R1"): RadarContact {
  return {
    id: "C1",
    radarId,
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

  it("长时间无证据时持续广域搜索", () => {
    const result = advanceRadarOperators([createRadar()], [], 21000, 0.5);
    expect(result.radars[0]?.operator.mode).toBe("WIDE_SEARCH");
  });

  it("高效指挥链允许其他雷达使用共享 Contact，受损后共享窗口缩短", () => {
    const networkContact = createContact(1000, 0.9, "R1");
    const coordinated = advanceRadarOperators([createRadar("R2")], [networkContact], 4000, 0.5, 1);
    const disrupted = advanceRadarOperators([createRadar("R2")], [networkContact], 4000, 0.5, 0.45);
    expect(coordinated.radars[0]?.operator.mode).toBe("FOCUSED_TRACK");
    expect(disrupted.radars[0]?.operator.mode).not.toBe("FOCUSED_TRACK");
  });
});
