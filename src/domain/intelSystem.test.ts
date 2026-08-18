import { describe, expect, it } from "vitest";
import { createMission } from "./factories";
import { generateRadarIntel } from "./intelSystem";

describe("雷达有限情报系统", () => {
  const mission = createMission("INTEL-SYSTEM-TEST");

  it("相同 Seed 与精度会生成完全一致的报告", () => {
    const first = generateRadarIntel(mission.seed, mission.radars, 0.68);
    const second = generateRadarIntel(mission.seed, mission.radars, 0.68);

    expect(second).toEqual(first);
  });

  it("提高情报精度不会减少已定位雷达，并会缩小位置误差", () => {
    const low = generateRadarIntel(mission.seed, mission.radars, 0.35);
    const high = generateRadarIntel(mission.seed, mission.radars, 0.95);
    const lowVisible = low.filter((report) => report.estimatedPosition);
    const highVisible = high.filter((report) => report.estimatedPosition);
    const averageError = (reports: typeof lowVisible) => reports.reduce(
      (sum, report) => sum + report.positionErrorRadius,
      0,
    ) / Math.max(1, reports.length);

    expect(highVisible.length).toBeGreaterThanOrEqual(lowVisible.length);
    expect(averageError(highVisible)).toBeLessThan(averageError(lowVisible));
  });

  it("所有估计坐标均限制在战术地图内", () => {
    const reports = generateRadarIntel(mission.seed, mission.radars, 0.5);

    reports.forEach((report) => {
      if (!report.estimatedPosition) return;
      expect(report.estimatedPosition.x).toBeGreaterThanOrEqual(0);
      expect(report.estimatedPosition.x).toBeLessThanOrEqual(1000);
      expect(report.estimatedPosition.y).toBeGreaterThanOrEqual(0);
      expect(report.estimatedPosition.y).toBeLessThanOrEqual(1000);
    });
  });

  it("玩家报告不泄露雷达实时开关、扫描角度和操作员状态", () => {
    const [report] = generateRadarIntel(mission.seed, mission.radars, 0.8);

    expect(report).not.toHaveProperty("active");
    expect(report).not.toHaveProperty("sweepAngleDegrees");
    expect(report).not.toHaveProperty("operator");
    expect(report).not.toHaveProperty("position");
    expect(report).not.toHaveProperty("range");
  });
});
