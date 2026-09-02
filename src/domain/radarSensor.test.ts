import { describe, expect, it } from "vitest";
import { advanceRadarSensors } from "./radarSensor";
import { createRadarOperatorState } from "./radarOperatorAI";
import type { AircraftState, RadarState } from "./types";

describe("Radar Sensor", () => {
  const radar: RadarState = {
    id: "R-DETERMINISTIC", type: "ACQUISITION", position: { x: 0, y: 0 }, range: 1000,
    sweepAngleDegrees: 90, scanAccumulatorSeconds: 0.24, scanCount: 8,
    operator: createRadarOperatorState(),
  };
  const aircraft: AircraftState = {
    position: { x: 50, y: 0 }, headingDegrees: 0, speed: 70, fuelRemaining: 2000, fuelCapacity: 2000,
  };

  it("相同任务状态产生可复现结果", () => {
    const first = advanceRadarSensors("SEED", [radar], aircraft, [], [], 1000, 0.02);
    const second = advanceRadarSensors("SEED", [radar], aircraft, [], [], 1000, 0.02);
    expect(first).toEqual(second);
  });

  it("Contact 只包含误差观测，不暴露真实坐标字段", () => {
    const result = advanceRadarSensors(
      "CONTACT-SEED",
      [{ ...radar, scanAccumulatorSeconds: 4, scanCount: 0 }],
      aircraft,
      [],
      [],
      2000,
      0.01,
    );
    expect(result.contacts.length).toBeGreaterThan(0);
    result.contacts.forEach((contact) => {
      expect(contact.errorRadius).toBeGreaterThan(0);
      expect(contact.confidence).toBeGreaterThan(0);
      expect(contact).not.toHaveProperty("realPosition");
    });
  });

  it("火控雷达扫描周期短于预警雷达", () => {
    const early = advanceRadarSensors("TYPE", [{ ...radar, type: "EARLY_WARNING", scanAccumulatorSeconds: 0 }], aircraft, [], [], 500, 0.2);
    const fireControl = advanceRadarSensors("TYPE", [{ ...radar, type: "FIRE_CONTROL", scanAccumulatorSeconds: 0 }], aircraft, [], [], 500, 0.2);
    expect(early.radars[0]!.scanCount).toBe(8);
    expect(fireControl.radars[0]!.scanCount).toBe(9);
  });

  it("扫描速率修正同时降低波束旋转速度与实际扫描频率", () => {
    const source = { ...radar, sweepAngleDegrees: 0, scanAccumulatorSeconds: 0, scanCount: 0 };
    const normal = advanceRadarSensors("SCAN-RATE", [source], aircraft, [], [], 500, 0.25, 1);
    const reduced = advanceRadarSensors("SCAN-RATE", [source], aircraft, [], [], 500, 0.25, 0.9);

    expect(normal.radars[0]!.scanCount).toBe(1);
    expect(reduced.radars[0]!.scanCount).toBe(0);
    expect(reduced.radars[0]!.sweepAngleDegrees).toBeCloseTo(normal.radars[0]!.sweepAngleDegrees * 0.9);
  });
});
