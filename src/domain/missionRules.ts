import type { ExtractionArea, MissionSession, Vector2 } from "./types";

export function distanceBetween(first: Vector2, second: Vector2): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function canAttackTarget(mission: MissionSession): boolean {
  return mission.weaponsRemaining > 0
    && !mission.target.destroyed
    && (mission.status === "RUNNING" || mission.status === "PAUSED")
    && distanceBetween(mission.aircraft.position, mission.target.position) <= mission.target.attackRadius;
}

export function isInsideExtraction(position: Vector2, area: ExtractionArea): boolean {
  return position.x >= area.x
    && position.x <= area.x + area.width
    && position.y >= area.y
    && position.y <= area.y + area.height;
}
