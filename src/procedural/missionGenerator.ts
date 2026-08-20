import { SeededRandom } from "../core/SeededRandom";
import { createCommanderState } from "../domain/airDefenseCommander";
import { createRadarOperatorState } from "../domain/radarOperatorAI";
import { generateWeatherForecast } from "../domain/weatherSystem";
import type { RadarState, TerrainZone, WeatherCell } from "../domain/types";

export interface GeneratedMissionContent {
  terrain: TerrainZone[];
  weather: WeatherCell[];
  weatherForecast: ReturnType<typeof generateWeatherForecast>;
  radars: RadarState[];
  targetPosition: { x: number; y: number };
  intelAccuracy: number;
  commander: ReturnType<typeof createCommanderState>;
}

export function generateMissionContent(seed: string): GeneratedMissionContent {
  const random = new SeededRandom(`${seed}:MISSION-CONTENT`);
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
  const radars = Array.from({ length: radarCount }, (_, index): RadarState => ({
    id: `RADAR-${String(index + 1).padStart(2, "0")}`,
    position: { x: random.range(230, 900), y: random.range(140, 800) },
    range: random.range(235, 350),
    sweepAngleDegrees: random.range(0, 360),
    scanAccumulatorSeconds: 0,
    scanCount: 0,
    operator: createRadarOperatorState(),
  }));
  return {
    terrain,
    weather,
    weatherForecast: generateWeatherForecast(seed, weather),
    radars,
    targetPosition: { x: random.range(400, 790), y: random.range(100, 390) },
    intelAccuracy: random.range(0.68, 0.94),
    commander: createCommanderState(),
  };
}
