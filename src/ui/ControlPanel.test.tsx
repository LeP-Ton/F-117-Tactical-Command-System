import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMission } from "../domain/factories";
import { ControlPanel } from "./ControlPanel";

afterEach(cleanup);

describe("ControlPanel 航点操作", () => {
  it("飞机运行中禁用航点排序和删除按钮", () => {
    const mission = createMission("RUNNING-WAYPOINT-CONTROLS");
    mission.status = "RUNNING";
    mission.route.waypoints.push({
      id: "test-waypoint",
      kind: "NAVIGATION",
      position: { x: 300, y: 700 },
      status: "PENDING",
    });

    render(
      <ControlPanel
        mission={mission}
        selectedIndex={1}
        onSelect={vi.fn()}
        dispatch={vi.fn()}
        onOpenCampaign={vi.fn()}
        onReturnCampaign={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "上移" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "下移" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "删除" })).toBeDisabled();
  });

  it("暂停后允许删除选中的可编辑航点", () => {
    const mission = createMission("PAUSED-WAYPOINT-CONTROLS");
    mission.status = "PAUSED";
    mission.route.waypoints.push({
      id: "test-waypoint",
      kind: "NAVIGATION",
      position: { x: 300, y: 700 },
      status: "PENDING",
    });
    const dispatch = vi.fn();

    render(
      <ControlPanel
        mission={mission}
        selectedIndex={1}
        onSelect={vi.fn()}
        dispatch={dispatch}
        onOpenCampaign={vi.fn()}
        onReturnCampaign={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "REMOVE_WAYPOINT", index: 1 });
  });
});
