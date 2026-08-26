import { describe, expect, it } from "vitest";
import { createMission } from "./factories";
import { canAttackTarget, distanceToExtraction, isInsideExtraction } from "./missionRules";

describe("Mission Rules", () => {
  it("只有进入攻击半径且目标仍有效时才能攻击", () => {
    const mission = createMission("ATTACK");
    mission.status = "PLANNING";
    expect(canAttackTarget(mission)).toBe(false);
    mission.status = "RUNNING";
    mission.aircraft.position = { ...mission.target.position };
    expect(canAttackTarget(mission)).toBe(true);
    mission.target.destroyed = true;
    expect(canAttackTarget(mission)).toBe(false);
  });

  it("撤离区边界包含边缘位置", () => {
    const mission = createMission("EXTRACT");
    expect(isInsideExtraction({ x: 850, y: 30 }, mission.extractionArea)).toBe(true);
    expect(isInsideExtraction({ x: 970, y: 150 }, mission.extractionArea)).toBe(true);
    expect(isInsideExtraction({ x: 849, y: 30 }, mission.extractionArea)).toBe(false);
  });

  it("撤离距离按最近边界计算并在区域内归零", () => {
    const area = { x: 100, y: 100, width: 50, height: 40 };
    expect(distanceToExtraction({ x: 80, y: 120 }, area)).toBe(20);
    expect(distanceToExtraction({ x: 80, y: 80 }, area)).toBeCloseTo(Math.hypot(20, 20));
    expect(distanceToExtraction({ x: 120, y: 120 }, area)).toBe(0);
  });
});
