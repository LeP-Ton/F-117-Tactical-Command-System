import { describe, expect, it } from "vitest";
import { createMission } from "./factories";
import { generateRadarIntel } from "./intelSystem";

describe("雷达有限情报系统", () => {
  const mission = createMission("INTEL-SYSTEM-TEST");

  it("相同 Seed 会按固定规则生成完全一致的报告", () => {
    const first = generateRadarIntel(mission.seed, mission.radars);
    const second = generateRadarIntel(mission.seed, mission.radars);

    expect(second).toEqual(first);
  });

  it("有限情报的位置与范围误差遵循固定基线", () => {
    const reports = generateRadarIntel(mission.seed, mission.radars);
    reports.forEach((report) => {
      if (!report.estimatedPosition) return;
      expect(report.positionErrorRadius).toBeGreaterThanOrEqual(50);
      expect(report.positionErrorRadius).toBeLessThanOrEqual(70);
      const radar = mission.radars.find((candidate) => candidate.id === report.radarId)!;
      if (report.estimatedRange !== undefined) {
        expect(report.estimatedRange).toBeGreaterThanOrEqual(radar.range * 0.92);
        expect(report.estimatedRange).toBeLessThanOrEqual(radar.range * 1.08);
      }
    });
  });

  it("所有估计坐标均限制在战术地图内", () => {
    const reports = generateRadarIntel(mission.seed, mission.radars);

    reports.forEach((report) => {
      if (!report.estimatedPosition) return;
      expect(report.estimatedPosition.x).toBeGreaterThanOrEqual(0);
      expect(report.estimatedPosition.x).toBeLessThanOrEqual(1000);
      expect(report.estimatedPosition.y).toBeGreaterThanOrEqual(0);
      expect(report.estimatedPosition.y).toBeLessThanOrEqual(1000);
    });
  });

  it("玩家报告不泄露雷达实时开关、扫描角度和操作员状态", () => {
    const [report] = generateRadarIntel(mission.seed, mission.radars);

    expect(report).not.toHaveProperty("active");
    expect(report).not.toHaveProperty("sweepAngleDegrees");
    expect(report).not.toHaveProperty("operator");
    expect(report).not.toHaveProperty("position");
    expect(report).not.toHaveProperty("range");
  });
});
