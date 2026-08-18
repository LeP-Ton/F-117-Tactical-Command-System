import { gameConfig } from "../config/gameConfig";
import type { AircraftState, RadarState, TerrainZone, WeatherZone } from "./types";

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

export function isInsideTerrain(aircraft: AircraftState, terrain: TerrainZone): boolean {
  return aircraft.position.x >= terrain.x
    && aircraft.position.x <= terrain.x + terrain.width
    && aircraft.position.y >= terrain.y
    && aircraft.position.y <= terrain.y + terrain.height;
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
  terrainZones: TerrainZone[],
  weatherZones: WeatherZone[] = [],
  aircraftModifier = 1,
): DetectionFactors {
  const distance = Math.hypot(
    aircraft.position.x - radar.position.x,
    aircraft.position.y - radar.position.y,
  );
  const distanceFactor = Math.max(0, 1 - Math.pow(distance / radar.range, 1.7));
  const radarBearing = bearingDegrees(
    radar.position.x,
    radar.position.y,
    aircraft.position.x,
    aircraft.position.y,
  );
  const beamDifference = angleDifference(radar.sweepAngleDegrees, radarBearing);
  const beamFactor = beamDifference <= gameConfig.radar.beamWidthDegrees / 2 ? 1 : 0;

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
  const terrainFactor = terrainZones
    .filter((terrain) => isInsideTerrain(aircraft, terrain))
    .reduce((factor, terrain) => factor * terrain.maskingFactor, 1);
  const weatherFactor = weatherZones
    .filter((weather) => aircraft.position.x >= weather.x
      && aircraft.position.x <= weather.x + weather.width
      && aircraft.position.y >= weather.y
      && aircraft.position.y <= weather.y + weather.height)
    .reduce((factor, weather) => factor * weather.detectionFactor, 1);
  const probability = Math.min(
    0.95,
    gameConfig.radar.baseDetectionProbability * distanceFactor * aspectFactor * terrainFactor * weatherFactor * beamFactor * aircraftModifier,
  );

  return { distance: distanceFactor, aspect: aspectFactor, terrain: terrainFactor, weather: weatherFactor, beam: beamFactor, probability };
}
