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

/** 根据任务 Seed 和固定基线生成 Tier 0 有限情报；真实 RadarState 不会写入报告。 */
export function generateRadarIntel(
  missionSeed: string,
  radars: readonly RadarState[],
): RadarIntelReport[] {
  return radars.map((radar) => {
    const random = new SeededRandom(`${missionSeed}:INTEL:${radar.id}`);
    const confidence = random.range(...gameConfig.intel.confidenceRange);
    const revealed = random.next() < gameConfig.intel.revealProbability;

    if (!revealed) {
      return {
        radarId: radar.id,
        radarType: radar.type,
        level: "UNKNOWN",
        positionErrorRadius: 0,
      };
    }

    const positionErrorRadius = random.range(...gameConfig.intel.positionErrorRadiusRange);
    const offsetDistance = random.range(0, positionErrorRadius);
    const offsetAngle = random.range(0, Math.PI * 2);
    const estimatedPosition = {
      x: clamp(radar.position.x + Math.cos(offsetAngle) * offsetDistance, 0, gameConfig.world.width),
      y: clamp(radar.position.y + Math.sin(offsetAngle) * offsetDistance, 0, gameConfig.world.height),
    };
    const level = getIntelLevel(confidence);
    return {
      radarId: radar.id,
      radarType: radar.type,
      level,
      estimatedPosition,
      positionErrorRadius,
      estimatedRange: level === "POSSIBLE"
        ? undefined
        : radar.range * (1 + random.range(-gameConfig.intel.rangeErrorRatio, gameConfig.intel.rangeErrorRatio)),
    };
  });
}
