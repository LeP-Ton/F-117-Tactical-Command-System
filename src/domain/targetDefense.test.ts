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
    for (let index = 0; index < 30; index += 1) {
      expect(isCovered(createMission(`TARGET-COVERAGE-${index}`))).toBe(true);
    }
  });

  it("覆盖不足时移动最近火控雷达并保持其他雷达不变", () => {
    const mission = createMission("TARGET-REDEPLOY");
    const fireControl = mission.radars.find((radar) => radar.type === "FIRE_CONTROL")!;
    const displaced = mission.radars.map((radar) => radar.id === fireControl.id
      ? { ...radar, position: { x: 80, y: 900 } }
      : radar);
    const result = ensureTargetFireControlCoverage(displaced, mission.target);
    const restored = result.find((radar) => radar.id === fireControl.id)!;
    expect(restored.position).not.toEqual({ x: 80, y: 900 });
    expect(result.filter((radar) => radar.id !== fireControl.id)).toEqual(
      displaced.filter((radar) => radar.id !== fireControl.id),
    );
  });
});
