import { gameConfig } from "../config/gameConfig";
import type { AircraftState, RouteState } from "./types";

export interface AutopilotResult {
  aircraft: AircraftState;
  route: RouteState;
  reachedWaypointIds: string[];
  routeCompleted: boolean;
  distanceTraveled: number;
}

/**
 * 推进飞机，并消费本帧剩余距离，确保低帧率下也能连续通过多个短航段。
 */
export function advanceAutopilot(
  aircraft: AircraftState,
  route: RouteState,
  deltaSeconds: number,
): AutopilotResult {
  let remainingDistance = aircraft.speed * Math.max(0, deltaSeconds);
  let nextAircraft = { ...aircraft, position: { ...aircraft.position } };
  let activeWaypointIndex = route.activeWaypointIndex;
  const waypoints = route.waypoints.map((waypoint) => ({ ...waypoint }));
  const reachedWaypointIds: string[] = [];
  let distanceTraveled = 0;

  while (remainingDistance > 0 && activeWaypointIndex < waypoints.length) {
    const target = waypoints[activeWaypointIndex];
    if (!target) break;
    const dx = target.position.x - nextAircraft.position.x;
    const dy = target.position.y - nextAircraft.position.y;
    const distance = Math.hypot(dx, dy);
    nextAircraft.headingDegrees = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;

    if (distance <= Math.max(gameConfig.aircraft.waypointArrivalRadius, remainingDistance)) {
      nextAircraft.position = { ...target.position };
      remainingDistance = Math.max(0, remainingDistance - distance);
      distanceTraveled += distance;
      target.status = "COMPLETED";
      reachedWaypointIds.push(target.id);
      activeWaypointIndex += 1;
      continue;
    }

    nextAircraft.position = {
      x: nextAircraft.position.x + (dx / distance) * remainingDistance,
      y: nextAircraft.position.y + (dy / distance) * remainingDistance,
    };
    distanceTraveled += remainingDistance;
    remainingDistance = 0;
  }

  return {
    aircraft: nextAircraft,
    route: { waypoints, activeWaypointIndex },
    reachedWaypointIds,
    routeCompleted: waypoints.length > 1 && activeWaypointIndex >= waypoints.length,
    distanceTraveled,
  };
}
