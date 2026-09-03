import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMission } from "../domain/factories";
import { ControlPanel } from "./ControlPanel";

afterEach(cleanup);

describe("ControlPanel 航点操作", () => {
  it("规划页面使用规划任务标题和统一返回按钮", () => {
    const mission = createMission("PLANNING-PAGE-COPY");
    render(
      <ControlPanel
        mission={mission}
        selectedIndex={null}
        onSelect={vi.fn()}
        dispatch={vi.fn()}
        onOpenCampaign={vi.fn()}
        onReturnCampaign={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "规划任务" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回任务网络" })).toHaveClass("primary-button", "return-network-button");
    expect(screen.getByText("指挥掩体")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /航点序列/ })).toHaveTextContent("0 个");
  });

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
    expect(screen.queryByText("◆")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /天气预报/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("执行中允许删除当前目标之后的航点", () => {
    const mission = createMission("RUNNING-FUTURE-WAYPOINT-CONTROLS");
    mission.status = "RUNNING";
    mission.route.waypoints.push({
      id: "current-waypoint",
      kind: "NAVIGATION",
      position: { x: 300, y: 700 },
      status: "PENDING",
    });
    mission.route.waypoints.push({
      id: "future-waypoint",
      kind: "NAVIGATION",
      position: { x: 500, y: 500 },
      status: "PENDING",
    });
    const dispatch = vi.fn();

    render(
      <ControlPanel
        mission={mission}
        selectedIndex={2}
        onSelect={vi.fn()}
        dispatch={dispatch}
        onOpenCampaign={vi.fn()}
        onReturnCampaign={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "REMOVE_WAYPOINT", index: 2 });
  });
});
