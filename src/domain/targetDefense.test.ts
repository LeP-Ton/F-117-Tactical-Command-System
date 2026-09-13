import { describe, expect, it } from "vitest";
import { createMission } from "./factories";
import { ensureTargetFireControlCoverage, TARGET_FIRE_CONTROL_MARGIN } from "./targetDefense";

function isCovered(mission: ReturnType<typeof createMission>): boolean {
  return mission.radars.some((radar) => radar.type === "FIRE_CONTROL"
    && Math.hypot(
      radar.position.x - mission.target.position.x,
      radar.position.y - mission.target.position.y,
    ) + mission.target.attackRadius <= radar.range - TARGET_FIRE_CONTROL_MARGIN + 0.000001);
}

describe("目标区火控覆盖", () => {
  it("不同 Seed 的初始任务始终由 Fire Control 完整覆盖攻击区", () => {
    for (let index = 0; index < 100; index += 1) {
      const mission = createMission(`TARGET-COVERAGE-${index}`);
      expect(isCovered(mission)).toBe(true);
      const displaced = mission.radars.map((radar) => radar.type === "FIRE_CONTROL"
        ? { ...radar, position: { x: 900, y: 900 } }
        : radar);
      const redeployed = ensureTargetFireControlCoverage(displaced, mission.target);
      expect(isCovered({ ...mission, radars: redeployed })).toBe(true);
      redeployed.forEach((radar) => {
        expect(radar.position.x).toBeGreaterThanOrEqual(200);
        expect(radar.position.x).toBeLessThanOrEqual(800);
        expect(radar.position.y).toBeGreaterThanOrEqual(200);
        expect(radar.position.y).toBeLessThanOrEqual(800);
      });
    }
  });

  it("覆盖不足时在部署范围内移动最近火控雷达并保持其他雷达不变", () => {
    const mission = createMission("TARGET-REDEPLOY");
    const fireControl = mission.radars.find((radar) => radar.type === "FIRE_CONTROL")!;
    const displaced = mission.radars.map((radar) => radar.id === fireControl.id
      ? { ...radar, position: { x: 900, y: 900 } }
      // 位于东南撤离区附近的雷达是合法部署，不得再因撤离区净空规则而移动。
      : radar.type === "ACQUISITION"
        ? { ...radar, position: { x: 800, y: 800 } }
        : radar);
    const result = ensureTargetFireControlCoverage(displaced, mission.target);
    const restored = result.find((radar) => radar.id === fireControl.id)!;
    expect(restored.position).not.toEqual({ x: 900, y: 900 });
    expect(restored.position.x).toBeGreaterThanOrEqual(200);
    expect(restored.position.x).toBeLessThanOrEqual(800);
    expect(restored.position.y).toBeGreaterThanOrEqual(200);
    expect(restored.position.y).toBeLessThanOrEqual(800);
    expect(isCovered({ ...mission, radars: result })).toBe(true);
    expect(result.filter((radar) => radar.id !== fireControl.id)).toEqual(
      displaced.filter((radar) => radar.id !== fireControl.id),
    );
  });
});
