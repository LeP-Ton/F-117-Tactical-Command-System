import { describe, expect, it } from "vitest";
import { addWaypoint, createInitialRoute, moveWaypoint, removeWaypoint, reorderWaypoint } from "./route";

function routeWithWaypoints() {
  let route = createInitialRoute();
  route = addWaypoint(route, { id: "a", kind: "NAVIGATION", position: { x: 200, y: 200 }, status: "PENDING" });
  route = addWaypoint(route, { id: "b", kind: "NAVIGATION", position: { x: 300, y: 300 }, status: "PENDING" });
  return route;
}

describe("航线编辑", () => {
  it("插入点不可移动或删除", () => {
    const route = routeWithWaypoints();
    expect(moveWaypoint(route, 0, { x: 500, y: 500 })).toBe(route);
    expect(removeWaypoint(route, 0)).toBe(route);
  });

  it("可以移动、排序和删除未来航点", () => {
    const route = routeWithWaypoints();
    const moved = moveWaypoint(route, 1, { x: 220, y: 240 });
    expect(moved.waypoints[1]?.position).toEqual({ x: 220, y: 240 });
    const reordered = reorderWaypoint(moved, 1, 2);
    expect(reordered.waypoints.map((waypoint) => waypoint.id)).toEqual(["insertion", "b", "a"]);
    expect(removeWaypoint(reordered, 2).waypoints).toHaveLength(2);
  });

  it("已飞过航点不可编辑", () => {
    const route = { ...routeWithWaypoints(), activeWaypointIndex: 2 };
    expect(removeWaypoint(route, 1)).toBe(route);
  });
});
