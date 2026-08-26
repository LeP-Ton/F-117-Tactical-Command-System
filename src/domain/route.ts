import { gameConfig } from "../config/gameConfig";
import type { RouteState, Vector2, Waypoint } from "./types";

export const insertionPoint: Vector2 = { x: 90, y: 850 };

export function createInitialRoute(): RouteState {
  return {
    activeWaypointIndex: 1,
    waypoints: [
      {
        id: "insertion",
        kind: "INSERTION",
        position: { ...insertionPoint },
        status: "LOCKED",
      },
    ],
  };
}

export function clampToWorld(position: Vector2): Vector2 {
  return {
    x: Math.max(0, Math.min(gameConfig.world.width, position.x)),
    y: Math.max(0, Math.min(gameConfig.world.height, position.y)),
  };
}

export type WaypointEditMode = "PLANNING" | "RUNNING";

export function canEditWaypoint(route: RouteState, index: number, mode: WaypointEditMode = "PLANNING"): boolean {
  const waypoint = route.waypoints[index];
  const firstEditableIndex = mode === "RUNNING" ? route.activeWaypointIndex + 1 : 1;
  return Boolean(waypoint && waypoint.kind !== "INSERTION" && index >= firstEditableIndex);
}

export function addWaypoint(route: RouteState, waypoint: Waypoint): RouteState {
  return { ...route, waypoints: [...route.waypoints, waypoint] };
}

export function moveWaypoint(route: RouteState, index: number, position: Vector2, mode: WaypointEditMode = "PLANNING"): RouteState {
  if (!canEditWaypoint(route, index, mode)) return route;
  return {
    ...route,
    waypoints: route.waypoints.map((waypoint, waypointIndex) =>
      waypointIndex === index ? { ...waypoint, position: clampToWorld(position) } : waypoint,
    ),
  };
}

export function removeWaypoint(route: RouteState, index: number, mode: WaypointEditMode = "PLANNING"): RouteState {
  if (!canEditWaypoint(route, index, mode)) return route;
  return { ...route, waypoints: route.waypoints.filter((_, waypointIndex) => waypointIndex !== index) };
}

export function reorderWaypoint(route: RouteState, fromIndex: number, toIndex: number, mode: WaypointEditMode = "PLANNING"): RouteState {
  if (!canEditWaypoint(route, fromIndex, mode) || !canEditWaypoint(route, toIndex, mode)) return route;
  const waypoints = [...route.waypoints];
  const [waypoint] = waypoints.splice(fromIndex, 1);
  if (!waypoint) return route;
  waypoints.splice(toIndex, 0, waypoint);
  return { ...route, waypoints };
}

/** 计算完整规划航线的折线长度。 */
export function getPlannedRouteDistance(route: RouteState): number {
  return route.waypoints.slice(1).reduce((total, waypoint, index) => {
    const previous = route.waypoints[index];
    return previous ? total + Math.hypot(
      waypoint.position.x - previous.position.x,
      waypoint.position.y - previous.position.y,
    ) : total;
  }, 0);
}

/** 从飞机当前位置出发，沿尚未执行的航点计算剩余航程。 */
export function getRemainingRouteDistance(route: RouteState, aircraftPosition: Vector2): number {
  const activeWaypoint = route.waypoints[route.activeWaypointIndex];
  if (!activeWaypoint) return 0;
  let distance = Math.hypot(
    activeWaypoint.position.x - aircraftPosition.x,
    activeWaypoint.position.y - aircraftPosition.y,
  );
  for (let index = route.activeWaypointIndex + 1; index < route.waypoints.length; index += 1) {
    const previous = route.waypoints[index - 1];
    const waypoint = route.waypoints[index];
    if (previous && waypoint) distance += Math.hypot(
      waypoint.position.x - previous.position.x,
      waypoint.position.y - previous.position.y,
    );
  }
  return distance;
}
