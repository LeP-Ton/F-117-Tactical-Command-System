import { gameConfig } from "../config/gameConfig";
import { SeededRandom } from "../core/SeededRandom";
import type { RadarIntelLevel, RadarIntelReport, RadarState } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getIntelLevel(confidence: number): RadarIntelLevel {
  if (confidence >= 0.85) return "CONFIRMED";
  if (confidence >= 0.65) return "PROBABLE";
  return "POSSIBLE";
}

/**
 * 根据任务 Seed 生成玩家可见的战前雷达情报。同一个 Seed 可复现；精度越高，
 * 雷达暴露数量越多，位置与覆盖半径误差越小。真实 RadarState 不会写入报告。
 */
export function generateRadarIntel(
  missionSeed: string,
  radars: readonly RadarState[],
  intelAccuracy: number,
): RadarIntelReport[] {
  const accuracy = clamp(intelAccuracy, 0, 1);

  return radars.map((radar) => {
    const random = new SeededRandom(`${missionSeed}:INTEL:${radar.id}`);
    const confidence = clamp(accuracy + random.range(-0.18, 0.1), 0.08, 0.99);
    const revealed = random.next() < clamp(0.18 + accuracy * 0.92, 0, 1);

    if (!revealed) {
      return {
        radarId: radar.id,
        level: "UNKNOWN",
        positionErrorRadius: 0,
      };
    }

    const positionErrorRadius = Math.max(5, (1 - accuracy) * 210 + random.range(4, 24));
    const offsetDistance = random.range(0, positionErrorRadius);
    const offsetAngle = random.range(0, Math.PI * 2);
    const estimatedPosition = {
      x: clamp(radar.position.x + Math.cos(offsetAngle) * offsetDistance, 0, gameConfig.world.width),
      y: clamp(radar.position.y + Math.sin(offsetAngle) * offsetDistance, 0, gameConfig.world.height),
    };
    const level = getIntelLevel(confidence);
    const rangeErrorRatio = (1 - accuracy) * 0.35;

    return {
      radarId: radar.id,
      level,
      estimatedPosition,
      positionErrorRadius,
      estimatedRange: level === "POSSIBLE"
        ? undefined
        : radar.range * (1 + random.range(-rangeErrorRatio, rangeErrorRatio)),
    };
  });
}
