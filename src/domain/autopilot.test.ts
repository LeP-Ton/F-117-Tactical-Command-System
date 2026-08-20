import { describe, expect, it } from "vitest";
import { advanceAutopilot } from "./autopilot";
import type { AircraftState, RouteState } from "./types";

const aircraft: AircraftState = {
  position: { x: 0, y: 0 },
  headingDegrees: 0,
  speed: 100,
  fuelRemaining: 2000,
  fuelCapacity: 2000,
};

const route: RouteState = {
  activeWaypointIndex: 1,
  waypoints: [
    { id: "insertion", kind: "INSERTION", position: { x: 0, y: 0 }, status: "LOCKED" },
    { id: "a", kind: "NAVIGATION", position: { x: 30, y: 0 }, status: "PENDING" },
    { id: "b", kind: "NAVIGATION", position: { x: 60, y: 0 }, status: "PENDING" },
  ],
};

describe("自动驾驶", () => {
  it("单帧可以连续通过多个短航段", () => {
    const result = advanceAutopilot(aircraft, route, 1);
    expect(result.reachedWaypointIds).toEqual(["a", "b"]);
    expect(result.aircraft.position).toEqual({ x: 60, y: 0 });
    expect(result.routeCompleted).toBe(true);
    expect(result.distanceTraveled).toBe(60);
  });

  it("移动中更新位置和航向", () => {
    const result = advanceAutopilot(aircraft, route, 0.1);
    expect(result.aircraft.position.x).toBeCloseTo(10);
    expect(result.aircraft.headingDegrees).toBeCloseTo(90);
    expect(result.route.activeWaypointIndex).toBe(1);
  });
});
