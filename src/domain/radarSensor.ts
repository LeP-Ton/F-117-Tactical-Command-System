import { gameConfig } from "../config/gameConfig";
import { SeededRandom } from "../core/SeededRandom";
import { calculateDetectionFactors } from "./detectionModel";
import type { AircraftState, RadarContact, RadarState, TerrainZone, WeatherCell } from "./types";
import { radarTypeProfiles } from "./radarTypes";

interface RadarSimulationResult {
  radars: RadarState[];
  contacts: RadarContact[];
}

export function advanceRadarSensors(
  missionSeed: string,
  radars: RadarState[],
  aircraft: AircraftState,
  terrain: TerrainZone[],
  weather: WeatherCell[],
  timestamp: number,
  deltaSeconds: number,
  scanRateModifier = 1,
): RadarSimulationResult {
  const contacts: RadarContact[] = [];
  const nextRadars = radars.map((radar) => {
    const profile = radarTypeProfiles[radar.type];
    let accumulator = radar.scanAccumulatorSeconds + deltaSeconds;
    let scanCount = radar.scanCount;
    const effectiveScanRate = Math.max(0.01, scanRateModifier);
    const effectiveScanInterval = profile.scanIntervalSeconds / effectiveScanRate;
    const wideSweep = (radar.sweepAngleDegrees
      + profile.sweepDegreesPerSecond * effectiveScanRate * deltaSeconds) % 360;
    const sectorSweep = radar.operator.focusBearingDegrees === undefined
      ? wideSweep
      : radar.operator.focusBearingDegrees + Math.sin(timestamp * effectiveScanRate / 1300) * 42;
    const focusedSweep = radar.operator.focusBearingDegrees ?? radar.sweepAngleDegrees;
    const sweepAngleDegrees = radar.operator.mode === "FOCUSED_TRACK"
      ? focusedSweep
      : radar.operator.mode === "SECTOR_SEARCH"
        ? sectorSweep
        : wideSweep;
    const nextRadar = {
      ...radar,
      sweepAngleDegrees: (sweepAngleDegrees + 360) % 360,
    };

    while (accumulator >= effectiveScanInterval) {
      accumulator -= effectiveScanInterval;
      scanCount += 1;
      const factors = calculateDetectionFactors(nextRadar, aircraft, terrain, weather);
      const random = new SeededRandom(`${missionSeed}:${radar.id}:${scanCount}`);
      if (random.next() < factors.probability) {
        const confidence = Math.max(0.12, Math.min(0.96, (factors.probability + 0.28) * profile.contactAccuracyMultiplier));
        const errorRadius = gameConfig.radar.maxErrorRadius
          - confidence * (gameConfig.radar.maxErrorRadius - gameConfig.radar.minErrorRadius);
        const errorAngle = random.range(0, Math.PI * 2);
        const errorDistance = random.range(0, errorRadius);
        contacts.push({
          id: `${radar.id}-${scanCount}`,
          radarId: radar.id,
          timestamp,
          estimatedPosition: {
            x: aircraft.position.x + Math.cos(errorAngle) * errorDistance,
            y: aircraft.position.y + Math.sin(errorAngle) * errorDistance,
          },
          confidence,
          signalStrength: factors.distance * factors.aspect * factors.terrain * factors.weather,
          errorRadius,
          engagementQuality: profile.engagementQuality,
        });
      }
    }
    return { ...nextRadar, scanAccumulatorSeconds: accumulator, scanCount };
  });

  return { radars: nextRadars, contacts };
}
