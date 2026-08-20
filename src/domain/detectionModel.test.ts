import { describe, expect, it } from "vitest";
import { calculateDetectionFactors } from "./detectionModel";
import { createRadarOperatorState } from "./radarOperatorAI";
import type { AircraftState, RadarState, TerrainZone, WeatherCell } from "./types";

const radar: RadarState = {
  id: "R1", position: { x: 0, y: 0 }, range: 500, sweepAngleDegrees: 90,
  scanAccumulatorSeconds: 0, scanCount: 0,
  operator: createRadarOperatorState(),
};
const aircraft: AircraftState = { position: { x: 100, y: 0 }, headingDegrees: 0, speed: 70 };

describe("雷达探测模型", () => {
  it("侧面对雷达的暴露高于机头朝向雷达", () => {
    const noseOn = calculateDetectionFactors(radar, { ...aircraft, headingDegrees: 270 }, [], []);
    const sideOn = calculateDetectionFactors(radar, aircraft, [], []);
    expect(sideOn.aspect).toBeGreaterThan(noseOn.aspect);
    expect(sideOn.probability).toBeGreaterThan(noseOn.probability);
  });

  it("地形遮蔽降低探测概率", () => {
    const terrain: TerrainZone = {
      id: "ridge", kind: "MOUNTAIN", x: 50, y: -50,
      width: 100, height: 100, detectionFactor: 0.4,
    };
    const exposed = calculateDetectionFactors(radar, aircraft, [], []);
    const masked = calculateDetectionFactors(radar, aircraft, [terrain], []);
    expect(masked.probability).toBeCloseTo(exposed.probability * 0.4);
  });

  it("扫描波束未覆盖飞机时无法探测", () => {
    const factors = calculateDetectionFactors({ ...radar, sweepAngleDegrees: 180 }, aircraft, [], []);
    expect(factors.beam).toBe(0);
    expect(factors.probability).toBe(0);
  });

  it("恶劣天气降低探测概率", () => {
    const clear = calculateDetectionFactors(radar, aircraft, [], []);
    const storm: WeatherCell = {
      id: "storm", kind: "STORM", initialKind: "STORM", x: 50, y: -50, width: 100, height: 100, detectionFactor: 0.55,
      origin: { x: 50, y: -50 }, baseSize: { width: 100, height: 100 }, velocity: { x: 0, y: 0 },
      baseIntensity: 0.8, phaseSeconds: 0, evolutionPeriodSeconds: 60,
    };
    const stormFactors = calculateDetectionFactors(radar, aircraft, [], [storm]);
    expect(stormFactors.probability).toBeCloseTo(clear.probability * 0.55);
  });

});
