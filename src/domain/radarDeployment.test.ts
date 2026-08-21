import { describe, expect, it } from "vitest";
import { gameConfig } from "../config/gameConfig";
import { createMission } from "./factories";
import { createRadarOperatorState } from "./radarOperatorAI";
import { enforceExtractionRadarClearance } from "./radarDeployment";
import type { RadarState } from "./types";

function radarAt(x: number, y: number): RadarState {
  return {
    id: "TEST-RADAR",
    type: "ACQUISITION",
    position: { x, y },
    range: 300,
    sweepAngleDegrees: 0,
    scanAccumulatorSeconds: 0,
    scanCount: 0,
    operator: createRadarOperatorState(),
  };
}

describe("撤离区雷达部署净空", () => {
  it("把撤离区内及净空范围内的雷达移动到最近可行边界", () => {
    const area = gameConfig.mission.extractionArea;
    const [inside, nearby, safe] = enforceExtractionRadarClearance([
      radarAt(880, 120),
      { ...radarAt(830, 180), id: "NEARBY" },
      { ...radarAt(700, 300), id: "SAFE" },
    ], area);

    expect(inside?.position).toEqual({ x: 770, y: 120 });
    expect(nearby?.position).toEqual({ x: 830, y: 230 });
    expect(safe?.position).toEqual({ x: 700, y: 300 });
  });

  it("程序生成任务中的所有雷达均遵守 80u 撤离净空", () => {
    for (let index = 0; index < 100; index += 1) {
      const mission = createMission(`CLEARANCE-${index}`);
      for (const radar of mission.radars) {
        const area = mission.extractionArea;
        const clearance = gameConfig.mission.extractionRadarClearance;
        const violates = radar.position.x > area.x - clearance
          && radar.position.x < area.x + area.width + clearance
          && radar.position.y > area.y - clearance
          && radar.position.y < area.y + area.height + clearance;
        expect(violates).toBe(false);
      }
      const targetFireControl = mission.radars.some((radar) => radar.type === "FIRE_CONTROL"
        && Math.hypot(
          radar.position.x - mission.target.position.x,
          radar.position.y - mission.target.position.y,
        ) + mission.target.attackRadius <= radar.range - 20 + 1e-6);
      expect(targetFireControl, mission.seed).toBe(true);
    }
  });
});
