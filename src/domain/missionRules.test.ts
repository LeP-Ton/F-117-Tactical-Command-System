import { describe, expect, it } from "vitest";
import { createMission } from "./factories";
import { simulationToMapPosition } from "./mapCoordinates";
import { canAttackTarget, distanceToExtraction, isInsideExtraction } from "./missionRules";

describe("Mission Rules", () => {
  it("任务使用固定起点、50 u 攻击半径和合法随机撤离区", () => {
    const mission = createMission("MISSION-GEOMETRY");
    const extractionCenters = [
      { x: 100, y: 900 },
      { x: 900, y: 900 },
      { x: 900, y: 100 },
    ];
    expect(mission.aircraft.position).toEqual({ x: 100, y: 900 });
    expect(mission.route.waypoints[0]?.position).toEqual({ x: 100, y: 900 });
    expect(simulationToMapPosition(mission.aircraft.position)).toEqual({ x: 100, y: 100 });
    expect(mission.target.attackRadius).toBe(50);
    expect(mission.extractionArea).toMatchObject({ width: 100, height: 100 });
    expect(extractionCenters).toContainEqual(simulationToMapPosition({
      x: mission.extractionArea.x + mission.extractionArea.width / 2,
      y: mission.extractionArea.y + mission.extractionArea.height / 2,
    }));
  });

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
    const area = mission.extractionArea;
    expect(isInsideExtraction({ x: area.x, y: area.y }, area)).toBe(true);
    expect(isInsideExtraction({ x: area.x + area.width, y: area.y + area.height }, area)).toBe(true);
    expect(isInsideExtraction({ x: area.x - 1, y: area.y }, area)).toBe(false);
  });

  it("撤离距离按最近边界计算并在区域内归零", () => {
    const area = { x: 100, y: 100, width: 50, height: 40 };
    expect(distanceToExtraction({ x: 80, y: 120 }, area)).toBe(20);
    expect(distanceToExtraction({ x: 80, y: 80 }, area)).toBeCloseTo(Math.hypot(20, 20));
    expect(distanceToExtraction({ x: 120, y: 120 }, area)).toBe(0);
  });
});
