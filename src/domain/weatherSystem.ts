import { gameConfig } from "../config/gameConfig";
import { SeededRandom } from "../core/SeededRandom";
import type { WeatherCell, WeatherForecast, WeatherKind } from "./types";

const weatherCycle: readonly WeatherKind[] = ["CLOUD", "RAIN", "STORM", "RAIN", "FOG"];

function wrap(value: number, maximum: number): number {
  return ((value % maximum) + maximum) % maximum;
}

function kindFactor(kind: WeatherKind, intensity: number): number {
  const ranges: Record<WeatherKind, readonly [number, number]> = {
    CLOUD: [0.72, 0.88],
    RAIN: [0.62, 0.8],
    STORM: [0.45, 0.66],
    FOG: [0.68, 0.84],
  };
  const [minimum, maximum] = ranges[kind];
  return maximum - (maximum - minimum) * intensity;
}

/** 从初始参数与绝对任务时间推导天气，避免帧率差异造成演化漂移。 */
export function projectWeatherCell(cell: WeatherCell, elapsedSeconds: number): WeatherCell {
  const evolutionTime = elapsedSeconds + cell.phaseSeconds;
  const evolutionIndex = Math.floor(evolutionTime / cell.evolutionPeriodSeconds);
  const initialKindIndex = weatherCycle.indexOf(cell.initialKind);
  const kind = weatherCycle[(initialKindIndex + evolutionIndex) % weatherCycle.length]!;
  const wave = Math.sin((evolutionTime / cell.evolutionPeriodSeconds) * Math.PI * 2);
  const intensity = Math.max(0.15, Math.min(1, cell.baseIntensity + wave * 0.22));
  const sizeScale = 0.82 + intensity * 0.36;
  const width = cell.baseSize.width * sizeScale;
  const height = cell.baseSize.height * sizeScale;

  return {
    ...cell,
    kind,
    x: wrap(cell.origin.x + cell.velocity.x * elapsedSeconds, gameConfig.world.width + width) - width / 2,
    y: wrap(cell.origin.y + cell.velocity.y * elapsedSeconds, gameConfig.world.height + height) - height / 2,
    width,
    height,
    detectionFactor: kindFactor(kind, intensity),
  };
}

export function advanceWeather(cells: WeatherCell[], elapsedMs: number): WeatherCell[] {
  return cells.map((cell) => projectWeatherCell(cell, elapsedMs / 1000));
}

/** 预报包含由任务 Seed 固定生成的位置与尺度误差，但不泄露完整真实演化。 */
export function generateWeatherForecast(
  missionSeed: string,
  cells: WeatherCell[],
  horizons: readonly number[] = [30, 60, 90],
): WeatherForecast[] {
  return cells.flatMap((cell) => horizons.map((horizonSeconds) => {
    const projected = projectWeatherCell(cell, horizonSeconds);
    const earlier = projectWeatherCell(cell, Math.max(0, horizonSeconds - 8));
    const random = new SeededRandom(`${missionSeed}:FORECAST:${cell.id}:${horizonSeconds}`);
    const error = 12 + horizonSeconds * 0.45;
    const sizeError = random.range(0.88, 1.12);
    const areaBefore = earlier.width * earlier.height;
    const areaAfter = projected.width * projected.height;
    return {
      weatherId: cell.id,
      horizonSeconds,
      kind: projected.kind,
      estimatedPosition: {
        x: projected.x + random.range(-error, error),
        y: projected.y + random.range(-error, error),
      },
      estimatedSize: { width: projected.width * sizeError, height: projected.height * sizeError },
      intensityTrend: areaAfter > areaBefore * 1.03 ? "增强" : areaAfter < areaBefore * 0.97 ? "减弱" : "稳定",
      confidence: horizonSeconds <= 30 ? "高" : horizonSeconds <= 60 ? "中" : "低",
    };
  }));
}
