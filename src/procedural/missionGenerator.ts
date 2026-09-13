import { gameConfig } from "../config/gameConfig";
import { SeededRandom } from "../core/SeededRandom";
import { createCommanderState } from "../domain/airDefenseCommander";
import { mapToSimulationPosition } from "../domain/mapCoordinates";
import { createRadarOperatorState } from "../domain/radarOperatorAI";
import { generateWeatherForecast } from "../domain/weatherSystem";
import { radarTypeProfiles } from "../domain/radarTypes";
import type { ExtractionArea, RadarState, RadarType, TerrainZone, WeatherCell } from "../domain/types";

export interface GeneratedMissionContent {
  terrain: TerrainZone[];
  weather: WeatherCell[];
  weatherForecast: ReturnType<typeof generateWeatherForecast>;
  radars: RadarState[];
  targetPosition: { x: number; y: number };
  extractionArea: ExtractionArea;
  commander: ReturnType<typeof createCommanderState>;
}

/** 撤离区使用独立随机流，新增或调整其他任务内容时不会改变已生成的撤离位置。 */
export function generateExtractionArea(seed: string): ExtractionArea {
  const random = new SeededRandom(`${seed}:EXTRACTION`);
  const center = random.pick(gameConfig.mission.extractionCenters);
  const simulationCenter = mapToSimulationPosition(center);
  const size = gameConfig.mission.extractionSize;
  return {
    x: simulationCenter.x - size / 2,
    y: simulationCenter.y - size / 2,
    width: size,
    height: size,
  };
}

export function generateMissionContent(seed: string): GeneratedMissionContent {
  const random = new SeededRandom(`${seed}:MISSION-CONTENT`);
  const radarCoordinateRange = gameConfig.radar.deploymentCoordinateRange;
  const targetCoordinateRange = gameConfig.mission.targetCoordinateRange;
  const terrainCount = random.integer(2, 4);
  const radarCount = random.integer(3, 5);
  const weatherCount = random.integer(1, 2);
  const terrain = Array.from({ length: terrainCount }, (_, index): TerrainZone => ({
    id: `RIDGE-${index + 1}`,
    kind: "MOUNTAIN",
    x: random.range(170, 760),
    y: random.range(210, 760),
    width: random.range(120, 230),
    height: random.range(90, 180),
    detectionFactor: random.range(0.35, 0.58),
  }));
  const weather = Array.from({ length: weatherCount }, (_, index): WeatherCell => {
    const kind = random.pick(["CLOUD", "RAIN", "STORM", "FOG"] as const);
    const x = random.range(120, 760);
    const y = random.range(120, 760);
    const width = random.range(140, 260);
    const height = random.range(120, 230);
    const baseIntensity = random.range(0.35, 0.85);
    return {
      id: `WEATHER-${index + 1}`,
      kind,
      initialKind: kind,
      x, y, width, height,
      detectionFactor: 1,
      origin: { x, y },
      baseSize: { width, height },
      velocity: { x: random.range(-1.8, 1.8), y: random.range(-1.8, 1.8) },
      baseIntensity,
      phaseSeconds: random.range(0, 35),
      evolutionPeriodSeconds: random.range(55, 95),
    };
  });
  const typeSequence: readonly RadarType[] = ["EARLY_WARNING", "ACQUISITION", "FIRE_CONTROL"];
  const radars = Array.from({ length: radarCount }, (_, index): RadarState => {
    const type = typeSequence[index % typeSequence.length]!;
    const profile = radarTypeProfiles[type];
    return {
      id: `${type === "EARLY_WARNING" ? "EW" : type === "ACQUISITION" ? "ACQ" : "FC"}-${String(index + 1).padStart(2, "0")}`,
      type,
      position: {
        x: random.range(...radarCoordinateRange),
        y: random.range(...radarCoordinateRange),
      },
      range: random.range(...profile.range),
      sweepAngleDegrees: random.range(0, 360),
      scanAccumulatorSeconds: 0,
      scanCount: 0,
      operator: createRadarOperatorState(),
    };
  });
  return {
    terrain,
    weather,
    weatherForecast: generateWeatherForecast(seed, weather),
    radars,
    targetPosition: {
      x: random.range(...targetCoordinateRange),
      y: random.range(...targetCoordinateRange),
    },
    extractionArea: generateExtractionArea(seed),
    commander: createCommanderState(),
  };
}
