import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRun } from "../domain/factories";
import { CampaignMap } from "./CampaignMap";

afterEach(cleanup);

describe("任务网络入口文案", () => {
  it("顶部只显示有效战略状态", () => {
    const state = createRun("CAMPAIGN-STATUS-COPY");
    render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
    expect(screen.queryByText("INTEL QUALITY")).not.toBeInTheDocument();
    expect(screen.queryByText("情报可信度")).not.toBeInTheDocument();
    expect(screen.getByText("RADAR COVERAGE")).toBeInTheDocument();
    expect(screen.getByText("RADAR SCAN")).toBeInTheDocument();
    expect(screen.getByText("ENEMY ADAPTATION")).toBeInTheDocument();
    expect(screen.getByText("LOW")).toBeInTheDocument();
  });

  it("可执行节点使用规划任务", () => {
    const state = createRun("CAMPAIGN-PLANNING-COPY");
    render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
    expect(screen.getByRole("button", { name: "规划任务" })).toBeInTheDocument();
  });

  it("第一次与第二次 INTEL 显示不同奖励", () => {
    const state = createRun("CAMPAIGN-INTEL-REWARD-COPY");
    render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);

    expect(screen.getByText("核实后续任务全部雷达坐标与型号。")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /C2-0/ }));
    expect(screen.getByText("授权 TOTAL INTEL，开放真实雷达覆盖与完整敌方态势。")).toBeInTheDocument();
  });

  it("锁定节点使用预览任务", () => {
    const state = createRun("CAMPAIGN-PREVIEW-COPY");
    render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /C1-0/ }));
    expect(screen.getByRole("button", { name: "预览任务" })).toBeInTheDocument();
  });

  it("已完成节点使用复盘任务", () => {
    const state = createRun("CAMPAIGN-DEBRIEF-COPY");
    const nodeId = state.campaign.currentNodeId!;
    const mission = { ...state.currentMission!, status: "SUCCESS" as const };
    state.campaign.nodes = state.campaign.nodes.map((node) => node.id === nodeId ? { ...node, status: "COMPLETED" as const } : node);
    state.missionDebriefs[nodeId] = { nodeId, completedAt: 0, intelAccessTier: 0, mission };
    render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
    expect(screen.getByRole("button", { name: "复盘任务" })).toBeInTheDocument();
  });
});
