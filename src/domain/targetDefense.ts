import { gameConfig } from "../config/gameConfig";
import type { MissionTarget, RadarState, Vector2 } from "./types";

export const TARGET_FIRE_CONTROL_MARGIN = 20;

function distance(first: Vector2, second: Vector2): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function clampPosition(position: Vector2): Vector2 {
  return {
    x: Math.max(80, Math.min(gameConfig.world.width - 80, position.x)),
    y: Math.max(80, Math.min(gameConfig.world.height - 80, position.y)),
  };
}

/**
 * 保证至少一部火控雷达完整覆盖目标攻击区。只在覆盖不足时移动最近的火控雷达，
 * 保留 Seed 生成的相对方位，并在范围内预留固定余量。
 */
export function ensureTargetFireControlCoverage(
  radars: RadarState[],
  target: MissionTarget,
): RadarState[] {
  const fireControls = radars.filter((radar) => radar.type === "FIRE_CONTROL");
  if (fireControls.length === 0) return radars;
  if (fireControls.some((radar) => distance(radar.position, target.position) + target.attackRadius
    <= radar.range - TARGET_FIRE_CONTROL_MARGIN)) return radars;

  const selected = fireControls
    .sort((first, second) => distance(first.position, target.position) - distance(second.position, target.position))[0]!;
  const dx = selected.position.x - target.position.x;
  const dy = selected.position.y - target.position.y;
  const currentDistance = Math.hypot(dx, dy);
  const angle = currentDistance > 0 ? Math.atan2(dy, dx) : 0;
  const deploymentDistance = Math.max(0, selected.range - target.attackRadius - TARGET_FIRE_CONTROL_MARGIN);
  const position = clampPosition({
    x: target.position.x + Math.cos(angle) * deploymentDistance,
    y: target.position.y + Math.sin(angle) * deploymentDistance,
  });

  return radars.map((radar) => radar.id === selected.id ? { ...radar, position } : radar);
}
