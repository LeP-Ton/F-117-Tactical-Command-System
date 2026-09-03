import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRun } from "../domain/factories";
import { CampaignMap } from "./CampaignMap";
import { I18nProvider } from "../i18n/I18n";

afterEach(cleanup);

describe("任务网络入口文案", () => {
  it("顶部只显示有效战略状态", () => {
    const state = createRun("CAMPAIGN-STATUS-COPY");
    render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
    expect(screen.queryByText("INTEL QUALITY")).not.toBeInTheDocument();
    expect(screen.queryByText("情报可信度")).not.toBeInTheDocument();
    expect(screen.getByText("雷达覆盖")).toBeInTheDocument();
    expect(screen.getByText("雷达扫描")).toBeInTheDocument();
    expect(screen.getByText("敌方适应")).toBeInTheDocument();
    expect(screen.getByText("低")).toBeInTheDocument();
  });

  it("可执行节点使用规划任务", () => {
    const state = createRun("CAMPAIGN-PLANNING-COPY");
    render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
    expect(screen.getByRole("button", { name: "规划任务" })).toBeInTheDocument();
  });

  it("两个 INTEL 节点始终显示互不混淆且符合当前路线的实际奖励", () => {
    const state = createRun("CAMPAIGN-INTEL-REWARD-COPY");
    const view = render(<CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);

    expect(screen.getByText("一级情报核实：补齐后续任务全部雷达，并精确核实坐标与型号。")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /C2-0/ }));
    expect(screen.getByText("二级情报候选：完成前序情报行动后授权全域情报；若前序缺失则降为一级情报核实。")).toBeInTheDocument();

    const afterFirstIntel = {
      ...state,
      campaign: {
        ...state.campaign,
        nodes: state.campaign.nodes.map((node) => node.id === "C0-0"
          ? { ...node, status: "COMPLETED" as const }
          : node),
      },
    };
    view.rerender(<CampaignMap state={afterFirstIntel} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
    expect(screen.getByText("二级情报授权：开放全域情报，显示真实雷达覆盖与完整敌方态势。")).toBeInTheDocument();

    const afterSkippingFirstIntel = {
      ...state,
      campaign: {
        ...state.campaign,
        nodes: state.campaign.nodes.map((node) => node.id === "C0-0"
          ? { ...node, status: "EXPIRED" as const }
          : node),
      },
    };
    view.rerender(<CampaignMap state={afterSkippingFirstIntel} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />);
    expect(screen.getByText("一级情报补录：核实全部雷达坐标与型号；本次任务网络无法再授权全域情报。")).toBeInTheDocument();
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

  it("英文模式覆盖任务状态、奖励和操作入口", () => {
    const state = createRun("CAMPAIGN-ENGLISH-COPY");
    render(<I18nProvider initialLanguage="en" persist={false}>
      <CampaignMap state={state} dispatch={vi.fn()} onLaunch={vi.fn()} onPreview={vi.fn()} onDebrief={vi.fn()} />
    </I18nProvider>);

    expect(screen.getByRole("heading", { name: "MISSION NETWORK" })).toBeInTheDocument();
    expect(screen.getByText("RADAR COVERAGE")).toBeInTheDocument();
    expect(screen.getAllByText("INTEL").length).toBeGreaterThan(0);
    expect(screen.getByText(/PRIMARY INTEL: Reveal every radar in subsequent missions/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PLAN MISSION" })).toBeInTheDocument();
  });
});
