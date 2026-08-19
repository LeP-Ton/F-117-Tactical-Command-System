import { SeededRandom } from "../core/SeededRandom";
import { createCommanderState } from "../domain/airDefenseCommander";
import { createRadarOperatorState } from "../domain/radarOperatorAI";
import type { RadarState, TerrainZone, WeatherZone } from "../domain/types";

export interface GeneratedMissionContent {
  terrain: TerrainZone[];
  weather: WeatherZone[];
  radars: RadarState[];
  targetPosition: { x: number; y: number };
  intelAccuracy: number;
  commander: ReturnType<typeof createCommanderState>;
  generationInfo: { terrainCount: number; radarCount: number; weatherCount: number };
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
    maskingFactor: random.range(0.35, 0.58),
  }));
  const weather = Array.from({ length: weatherCount }, (_, index): WeatherZone => {
    const kind = random.pick(["CLOUD", "STORM"] as const);
    return {
      id: `WEATHER-${index + 1}`,
      kind,
      x: random.range(120, 760),
      y: random.range(120, 760),
      width: random.range(140, 260),
      height: random.range(120, 230),
      detectionFactor: kind === "STORM" ? random.range(0.5, 0.68) : random.range(0.72, 0.88),
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
    radars,
    targetPosition: { x: random.range(400, 790), y: random.range(100, 390) },
    intelAccuracy: random.range(0.68, 0.94),
    commander: createCommanderState(),
    generationInfo: { terrainCount, radarCount, weatherCount },
  };
}
