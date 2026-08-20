import { gameConfig } from "../config/gameConfig";
import type { AircraftState, RadarState, TerrainZone, WeatherCell } from "./types";
import { radarTypeProfiles } from "./radarTypes";

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function angleDifference(first: number, second: number): number {
  const difference = Math.abs(normalizeAngle(first) - normalizeAngle(second));
  return Math.min(difference, 360 - difference);
}

export function bearingDegrees(fromX: number, fromY: number, toX: number, toY: number): number {
  return normalizeAngle((Math.atan2(toY - fromY, toX - fromX) * 180) / Math.PI + 90);
}

export function isInsideEnvironmentArea(aircraft: AircraftState, zone: TerrainZone | WeatherCell): boolean {
  return aircraft.position.x >= zone.x
    && aircraft.position.x <= zone.x + zone.width
    && aircraft.position.y >= zone.y
    && aircraft.position.y <= zone.y + zone.height;
}

export interface DetectionFactors {
  distance: number;
  aspect: number;
  terrain: number;
  weather: number;
  beam: number;
  probability: number;
}

/** 仅 Sensor 层可用真实飞机状态，并输出可解释的探测概率因子。 */
export function calculateDetectionFactors(
  radar: RadarState,
  aircraft: AircraftState,
  terrain: TerrainZone[],
  weather: WeatherCell[],
): DetectionFactors {
  const distance = Math.hypot(
    aircraft.position.x - radar.position.x,
    aircraft.position.y - radar.position.y,
  );
  const profile = radarTypeProfiles[radar.type];
  const distanceFactor = Math.max(0, 1 - Math.pow(distance / radar.range, 1.7));
  const radarBearing = bearingDegrees(
    radar.position.x,
    radar.position.y,
    aircraft.position.x,
    aircraft.position.y,
  );
  const beamDifference = angleDifference(radar.sweepAngleDegrees, radarBearing);
  const beamFactor = beamDifference <= profile.beamWidthDegrees / 2 ? 1 : 0;

  // 机头/机尾朝向雷达时 RCS 风险低，侧面对雷达时风险高。
  const aircraftToRadar = bearingDegrees(
    aircraft.position.x,
    aircraft.position.y,
    radar.position.x,
    radar.position.y,
  );
  const aspectDifference = angleDifference(aircraft.headingDegrees, aircraftToRadar);
  const sideExposure = Math.sin((aspectDifference * Math.PI) / 180) ** 2;
  const aspectFactor = 0.38 + sideExposure * 0.92;
  const terrainFactor = terrain
    .filter((zone) => isInsideEnvironmentArea(aircraft, zone))
    .reduce((factor, zone) => factor * zone.detectionFactor, 1);
  const weatherFactor = weather
    .filter((zone) => isInsideEnvironmentArea(aircraft, zone))
    .reduce((factor, zone) => factor * zone.detectionFactor, 1);
  const probability = Math.min(
    0.95,
    gameConfig.radar.baseDetectionProbability * profile.detectionProbabilityMultiplier
      * distanceFactor * aspectFactor * terrainFactor * weatherFactor * beamFactor,
  );

  return { distance: distanceFactor, aspect: aspectFactor, terrain: terrainFactor, weather: weatherFactor, beam: beamFactor, probability };
}
