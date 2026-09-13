import { gameConfig } from "../config/gameConfig";
import type { Vector2 } from "./types";

/**
 * 玩家地图使用左下角原点、Y 轴向上的坐标；Canvas 与任务内部状态仍使用左上角原点。
 * 所有玩家可见坐标和用户指定的部署坐标都必须通过这里转换，避免两套坐标含义再次混用。
 */
export function mapToSimulationPosition(position: Vector2): Vector2 {
  return {
    x: position.x,
    y: gameConfig.world.height - position.y,
  };
}

/** 点坐标的上下翻转是自身的逆变换。 */
export const simulationToMapPosition = mapToSimulationPosition;

/** 将内部矩形的左上角转换为玩家地图中的左下角。 */
export function simulationAreaToMapOrigin(area: { x: number; y: number; height: number }): Vector2 {
  return {
    x: area.x,
    y: gameConfig.world.height - area.y - area.height,
  };
}
