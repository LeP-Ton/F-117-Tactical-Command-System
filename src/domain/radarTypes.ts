import type { RadarType } from "./types";

export interface RadarTypeProfile {
  label: string;
  range: readonly [number, number];
  scanIntervalSeconds: number;
  sweepDegreesPerSecond: number;
  beamWidthDegrees: number;
  detectionProbabilityMultiplier: number;
  contactAccuracyMultiplier: number;
  engagementQuality: number;
}

/** 三类雷达的唯一参数来源，确保生成、Sensor、火控和 UI 使用同一职责定义。 */
export const radarTypeProfiles: Record<RadarType, RadarTypeProfile> = {
  EARLY_WARNING: {
    label: "预警",
    range: [380, 470],
    scanIntervalSeconds: 0.4,
    sweepDegreesPerSecond: 28,
    beamWidthDegrees: 36,
    detectionProbabilityMultiplier: 0.82,
    contactAccuracyMultiplier: 0.72,
    engagementQuality: 0.55,
  },
  ACQUISITION: {
    label: "搜索",
    range: [270, 360],
    scanIntervalSeconds: 0.25,
    sweepDegreesPerSecond: 38,
    beamWidthDegrees: 24,
    detectionProbabilityMultiplier: 1,
    contactAccuracyMultiplier: 1,
    engagementQuality: 1,
  },
  FIRE_CONTROL: {
    label: "火控",
    range: [180, 260],
    scanIntervalSeconds: 0.16,
    sweepDegreesPerSecond: 52,
    beamWidthDegrees: 12,
    detectionProbabilityMultiplier: 1.18,
    contactAccuracyMultiplier: 1.35,
    engagementQuality: 1.5,
  },
};
