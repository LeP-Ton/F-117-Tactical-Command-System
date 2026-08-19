import { describe, expect, it } from "vitest";
import { advanceRadarSensors } from "./radarSensor";
import { createRadarOperatorState } from "./radarOperatorAI";
import type { AircraftState, RadarState } from "./types";

describe("Radar Sensor", () => {
  const radar: RadarState = {
    id: "R-DETERMINISTIC", position: { x: 0, y: 0 }, range: 1000,
    sweepAngleDegrees: 90, scanAccumulatorSeconds: 0.24, scanCount: 8,
    operator: createRadarOperatorState(),
  };
  const aircraft: AircraftState = { position: { x: 50, y: 0 }, headingDegrees: 0, speed: 70 };

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
});
