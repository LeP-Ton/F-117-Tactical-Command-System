import { describe, expect, it } from "vitest";
import { createMission } from "../domain/factories";
import { generateMissionContent } from "./missionGenerator";

describe("Mission Generator", () => {
  it("相同 Seed 完整复现任务内容", () => {
    expect(generateMissionContent("DAILY-117")).toEqual(generateMissionContent("DAILY-117"));
    expect(createMission("DAILY-117")).toEqual(createMission("DAILY-117"));
  });

  it("不同 Seed 生成不同防空布局", () => {
    const first = generateMissionContent("ALPHA");
    const second = generateMissionContent("BRAVO");
    expect(first.radars).not.toEqual(second.radars);
    expect(first.targetPosition).not.toEqual(second.targetPosition);
  });

  it("连续生成十个任务均满足数量和地图边界", () => {
    const signatures = new Set<string>();
    for (let index = 0; index < 10; index += 1) {
      const generated = generateMissionContent(`BATCH-${index}`);
      const terrain = generated.terrain;
      const weather = generated.weather;
      expect(terrain.length).toBeGreaterThanOrEqual(2);
      expect(terrain.length).toBeLessThanOrEqual(4);
      expect(generated.radars.length).toBeGreaterThanOrEqual(3);
      expect(generated.radars.length).toBeLessThanOrEqual(5);
      expect(new Set(generated.radars.map((radar) => radar.type))).toEqual(
        new Set(["EARLY_WARNING", "ACQUISITION", "FIRE_CONTROL"]),
      );
      expect(weather.length).toBeGreaterThanOrEqual(1);
      expect(generated).not.toHaveProperty("intelAccuracy");
      generated.radars.forEach((radar) => {
        expect(radar.position.x).toBeGreaterThanOrEqual(0);
        expect(radar.position.x).toBeLessThanOrEqual(1000);
        expect(radar.position.y).toBeGreaterThanOrEqual(0);
        expect(radar.position.y).toBeLessThanOrEqual(1000);
      });
      signatures.add(JSON.stringify({ radars: generated.radars, target: generated.targetPosition }));
    }
    expect(signatures.size).toBe(10);
  });

});
