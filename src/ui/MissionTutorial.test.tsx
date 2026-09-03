import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMission } from "../domain/factories";
import { I18nProvider } from "../i18n/I18n";
import { MissionTutorial, type TutorialContext } from "./MissionTutorial";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderTutorial(context: TutorialContext = "CAMPAIGN", mission = createMission("MISSION-TUTORIAL")) {
  const onDismiss = vi.fn();
  const onComplete = vi.fn();
  const result = render(<I18nProvider initialLanguage="zh" persist={false}>
    <div data-tutorial="mission-network" />
    <div data-tutorial="mission-assessment">
      <span data-testid="assessment-copy">任务简报</span>
      <button data-tutorial="mission-entry">规划任务</button>
    </div>
    <div data-tutorial="tactical-map" />
    <button data-tutorial="confirm-route">确认航线</button>
    <aside data-tutorial="mission-telemetry" />
    <MissionTutorial context={context} mission={mission} onDismiss={onDismiss} onComplete={onComplete} />
  </I18nProvider>);
  return { ...result, mission, onDismiss, onComplete };
}

describe("MissionTutorial", () => {
  it("在任务网络中逐步解释网络、收益与规划入口", () => {
    renderTutorial();
    expect(screen.getByRole("complementary", { name: "任务引导" })).toBeInTheDocument();
    expect(screen.getByText("读取任务网络")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByText("评估任务收益")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByText("选择首项任务")).toBeInTheDocument();
    expect(screen.getByText("在高亮区域完成操作后自动继续")).toBeInTheDocument();
  });

  it("切换任务改变预览高度后重新定位规划任务引导框", async () => {
    renderTutorial();
    const entryButton = screen.getByRole("button", { name: "规划任务" });
    let buttonTop = 420;
    vi.spyOn(entryButton, "getBoundingClientRect").mockImplementation(() => ({
      x: 920,
      y: buttonTop,
      top: buttonTop,
      left: 920,
      right: 1220,
      bottom: buttonTop + 48,
      width: 300,
      height: 48,
      toJSON: () => ({}),
    } as DOMRect));

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));

    const focusFrame = document.querySelector<HTMLElement>(".tutorial-focus-frame");
    await waitFor(() => expect(focusFrame).toHaveStyle({ top: "414px" }));

    buttonTop = 510;
    screen.getByTestId("assessment-copy").textContent = "切换节点后高度发生变化的任务简报";
    await waitFor(() => expect(focusFrame).toHaveStyle({ top: "504px" }));
  });

  it("进入规划页后跳转到地图与完整航线引导", () => {
    const { rerender, mission, onDismiss, onComplete } = renderTutorial();
    rerender(<I18nProvider initialLanguage="zh" persist={false}>
      <div data-tutorial="tactical-map" />
      <button data-tutorial="confirm-route">确认航线</button>
      <MissionTutorial context="PLANNING" mission={mission} onDismiss={onDismiss} onComplete={onComplete} />
    </I18nProvider>);

    expect(screen.getByText("识别战术地图")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByText("构建完整航线")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeDisabled();
    expect(screen.getByText(/至少一个航点位于目标攻击圈/)).toBeInTheDocument();
    expect(screen.getByText(/最终航点位于撤离区/)).toBeInTheDocument();
  });

  it("目标航点与最终撤离航点齐备后允许进入确认步骤", () => {
    const mission = createMission("MISSION-TUTORIAL-ROUTE");
    mission.route.waypoints.push({
      id: "tutorial-target",
      kind: "NAVIGATION",
      position: { ...mission.target.position },
      status: "PENDING",
    });
    mission.route.waypoints.push({
      id: "tutorial-extraction",
      kind: "NAVIGATION",
      position: {
        x: mission.extractionArea.x + mission.extractionArea.width / 2,
        y: mission.extractionArea.y + mission.extractionArea.height / 2,
      },
      status: "PENDING",
    });
    renderTutorial("PLANNING", mission);

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByText("构建完整航线")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByText("确认出动条件")).toBeInTheDocument();
  });

  it("在执行阶段完成或退出引导均不派发游戏动作", () => {
    const first = renderTutorial("RUNNING");
    expect(screen.getByText("执行与动态修正")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "结束引导" }));
    expect(first.onComplete).toHaveBeenCalledTimes(1);
    cleanup();

    const second = renderTutorial();
    fireEvent.click(screen.getByRole("button", { name: "退出任务引导" }));
    expect(second.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("只读情报与复盘页暂挂引导", () => {
    renderTutorial("INTELLIGENCE");
    expect(screen.getByText("引导暂挂")).toBeInTheDocument();
    expect(screen.getByText("返回任务网络以继续")).toBeInTheDocument();
  });
});
