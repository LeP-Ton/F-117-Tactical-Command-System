import { describe, expect, it } from "vitest";
import { createMission } from "./factories";
import { canAttackTarget, isInsideExtraction } from "./missionRules";

describe("Mission Rules", () => {
  it("只有进入攻击半径且有武器时才能攻击", () => {
    const mission = createMission("ATTACK");
    mission.status = "PAUSED";
    expect(canAttackTarget(mission)).toBe(false);
    mission.aircraft.position = { ...mission.target.position };
    expect(canAttackTarget(mission)).toBe(true);
    mission.weaponsRemaining = 0;
    expect(canAttackTarget(mission)).toBe(false);
  });

  it("撤离区边界包含边缘位置", () => {
    const mission = createMission("EXTRACT");
    expect(isInsideExtraction({ x: 850, y: 30 }, mission.extractionArea)).toBe(true);
    expect(isInsideExtraction({ x: 970, y: 150 }, mission.extractionArea)).toBe(true);
    expect(isInsideExtraction({ x: 849, y: 30 }, mission.extractionArea)).toBe(false);
  });
});
