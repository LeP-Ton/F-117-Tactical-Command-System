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

export function canEditWaypoint(route: RouteState, index: number): boolean {
  const waypoint = route.waypoints[index];
  return Boolean(waypoint && waypoint.kind !== "INSERTION" && index >= route.activeWaypointIndex);
}

export function addWaypoint(route: RouteState, waypoint: Waypoint): RouteState {
  return { ...route, waypoints: [...route.waypoints, waypoint] };
}

export function moveWaypoint(route: RouteState, index: number, position: Vector2): RouteState {
  if (!canEditWaypoint(route, index)) return route;
  return {
    ...route,
    waypoints: route.waypoints.map((waypoint, waypointIndex) =>
      waypointIndex === index ? { ...waypoint, position: clampToWorld(position) } : waypoint,
    ),
  };
}

export function removeWaypoint(route: RouteState, index: number): RouteState {
  if (!canEditWaypoint(route, index)) return route;
  return { ...route, waypoints: route.waypoints.filter((_, waypointIndex) => waypointIndex !== index) };
}

export function reorderWaypoint(route: RouteState, fromIndex: number, toIndex: number): RouteState {
  if (!canEditWaypoint(route, fromIndex) || !canEditWaypoint(route, toIndex)) return route;
  const waypoints = [...route.waypoints];
  const [waypoint] = waypoints.splice(fromIndex, 1);
  if (!waypoint) return route;
  waypoints.splice(toIndex, 0, waypoint);
  return { ...route, waypoints };
}
