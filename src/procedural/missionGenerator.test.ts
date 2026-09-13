import { describe, expect, it } from "vitest";
import { createMission } from "../domain/factories";
import { generateExtractionArea, generateMissionContent } from "./missionGenerator";

const extractionAreas = [
  { x: 50, y: 50, width: 100, height: 100 },
  { x: 850, y: 50, width: 100, height: 100 },
  { x: 850, y: 850, width: 100, height: 100 },
];

describe("Mission Generator", () => {
  it("相同 Seed 完整复现任务内容", () => {
    expect(generateMissionContent("DAILY-117")).toEqual(generateMissionContent("DAILY-117"));
    expect(generateExtractionArea("DAILY-117")).toEqual(generateExtractionArea("DAILY-117"));
    expect(createMission("DAILY-117")).toEqual(createMission("DAILY-117"));
  });

  it("不同 Seed 生成不同防空布局", () => {
    const first = generateMissionContent("ALPHA");
    const second = generateMissionContent("BRAVO");
    expect(first.radars).not.toEqual(second.radars);
    expect(first.targetPosition).not.toEqual(second.targetPosition);
  });

  it("批量任务均满足目标、雷达和撤离区边界", () => {
    const signatures = new Set<string>();
    const observedExtractionAreas = new Set<string>();
    for (let index = 0; index < 100; index += 1) {
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
        expect(radar.position.x).toBeGreaterThanOrEqual(200);
        expect(radar.position.x).toBeLessThanOrEqual(800);
        expect(radar.position.y).toBeGreaterThanOrEqual(200);
        expect(radar.position.y).toBeLessThanOrEqual(800);
      });
      expect(generated.targetPosition.x).toBeGreaterThanOrEqual(300);
      expect(generated.targetPosition.x).toBeLessThanOrEqual(700);
      expect(generated.targetPosition.y).toBeGreaterThanOrEqual(300);
      expect(generated.targetPosition.y).toBeLessThanOrEqual(700);
      expect(extractionAreas).toContainEqual(generated.extractionArea);
      observedExtractionAreas.add(JSON.stringify(generated.extractionArea));
      signatures.add(JSON.stringify({
        radars: generated.radars,
        target: generated.targetPosition,
        extractionArea: generated.extractionArea,
      }));
    }
    expect(signatures.size).toBe(100);
    expect(observedExtractionAreas.size).toBe(3);
  });
});
