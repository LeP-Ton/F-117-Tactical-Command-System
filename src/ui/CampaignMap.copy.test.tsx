import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRun } from "../domain/factories";
import { CampaignMap } from "./CampaignMap";

afterEach(cleanup);

describe("任务网络入口文案", () => {
  it("可执行节点使用规划任务", () => {
    const state = createRun("CAMPAIGN-PLANNING-COPY");
    render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
    expect(screen.getByRole("button", { name: "规划任务" })).toBeInTheDocument();
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
