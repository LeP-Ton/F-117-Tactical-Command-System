import { gameConfig } from "../config/gameConfig";
import type { ExtractionArea, RadarState, Vector2 } from "./types";

const RADAR_MAP_MARGIN = 80;

function isInsideExpandedArea(position: Vector2, area: ExtractionArea, clearance: number): boolean {
  return position.x > area.x - clearance
    && position.x < area.x + area.width + clearance
    && position.y > area.y - clearance
    && position.y < area.y + area.height + clearance;
}

/**
 * 将雷达中心移出撤离区的固定净空范围。只调整违反约束的雷达，且选择地图内
 * 位移最短的可行边界；这不会限制雷达搜索半径覆盖撤离区。
 */
export function enforceExtractionRadarClearance(
  radars: RadarState[],
  extractionArea: ExtractionArea,
  clearance = gameConfig.mission.extractionRadarClearance,
): RadarState[] {
  const candidates = (position: Vector2): Vector2[] => [
    { x: extractionArea.x - clearance, y: position.y },
    { x: extractionArea.x + extractionArea.width + clearance, y: position.y },
    { x: position.x, y: extractionArea.y - clearance },
    { x: position.x, y: extractionArea.y + extractionArea.height + clearance },
  ].filter((candidate) => candidate.x >= RADAR_MAP_MARGIN
    && candidate.x <= gameConfig.world.width - RADAR_MAP_MARGIN
    && candidate.y >= RADAR_MAP_MARGIN
    && candidate.y <= gameConfig.world.height - RADAR_MAP_MARGIN);

  return radars.map((radar) => {
    if (!isInsideExpandedArea(radar.position, extractionArea, clearance)) return radar;
    const position = candidates(radar.position)
      .sort((first, second) => Math.hypot(first.x - radar.position.x, first.y - radar.position.y)
        - Math.hypot(second.x - radar.position.x, second.y - radar.position.y))[0];
    return position ? { ...radar, position } : radar;
  });
}
