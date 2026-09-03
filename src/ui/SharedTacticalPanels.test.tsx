import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createMission } from "../domain/factories";
import { EnemyStateSummary, RadarOperatorList } from "./EnemySystemPanels";
import { TacticalMapStage } from "./TacticalMapStage";
import { WeatherForecastPanel } from "./WeatherForecastPanel";
import { IntelligenceWorkspace } from "./workspaces/IntelligenceWorkspace";
import { DebriefWorkspace } from "./workspaces/DebriefWorkspace";

const originalGetContext = HTMLCanvasElement.prototype.getContext;
beforeAll(() => Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: vi.fn(() => null) }));
afterAll(() => Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: originalGetContext }));
afterEach(cleanup);

describe("战术工作区共享组件", () => {
  it("地图舞台按任务情报变体生成标题和有限情报图例", () => {
    const mission = createMission("SHARED-MAP-STAGE");
    render(<TacticalMapStage
      variant="INTELLIGENCE"
      mission={mission}
      showBelief={false}
      selectedIndex={null}
      onSelect={vi.fn()}
      dispatch={vi.fn()}
      mapSelection={null}
      readOnly
      statusText="CURRENT ESTIMATE"
    />);

    expect(screen.getByText("任务情报")).toBeInTheDocument();
    expect(screen.getByText("CURRENT ESTIMATE")).toBeInTheDocument();
    expect(screen.getByText("雷达情报 / 误差区")).toBeInTheDocument();
  });

  it("天气预报沿用调用方指定的折叠状态", () => {
    const mission = createMission("SHARED-WEATHER");
    render(<WeatherForecastPanel mission={mission} defaultExpanded={false} />);
    expect(screen.getByRole("button", { name: /天气预报/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("天气预报使用任务绝对时刻并隐藏已经过期的条目", () => {
    const mission = { ...createMission("SHARED-WEATHER-TIMELINE"), elapsedMs: 45_000 };
    render(<WeatherForecastPanel mission={mission} />);

    expect(screen.queryByText(/任务时刻 \+30秒/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/任务时刻 \+(60|90)秒/)).toHaveLength(mission.weather.length * 2);
  });

  it("敌方状态摘要提供固定的精简与详细密度", () => {
    const mission = createMission("SHARED-ENEMY-SUMMARY");
    const { rerender } = render(<EnemyStateSummary mission={mission} density="compact" />);
    expect(screen.getByText("指挥官")).toBeInTheDocument();
    expect(screen.queryByText("指挥链效率")).not.toBeInTheDocument();
    rerender(<EnemyStateSummary mission={mission} density="detailed" />);
    expect(screen.getByText("指挥链效率")).toBeInTheDocument();
    expect(screen.getByText("雷达数量")).toBeInTheDocument();
  });

  it("雷达操作员列表在中文模式显示三项中文效用缩写", () => {
    const mission = createMission("SHARED-OPERATORS");
    render(<RadarOperatorList mission={mission} />);
    expect(screen.getByText(mission.radars[0]!.id)).toBeInTheDocument();
    expect(screen.getAllByText(/^广 /)).toHaveLength(mission.radars.length);
    expect(screen.getAllByText(/^扇 /)).toHaveLength(mission.radars.length);
    expect(screen.getAllByText(/^跟 /)).toHaveLength(mission.radars.length);
  });

  it("预览与复盘页面标题匹配入口文案且共用返回按钮样式", () => {
    const mission = createMission("WORKSPACE-COPY");
    const { rerender } = render(<IntelligenceWorkspace mission={mission} showBelief={false} mapSelection={null} onMapSelectionChange={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "预览任务" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回任务网络" })).toHaveClass("primary-button", "return-network-button");

    rerender(<DebriefWorkspace debrief={{ nodeId: "C0-0", completedAt: 0, intelAccessTier: 0, mission }} mapSelection={null} onMapSelectionChange={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "复盘任务" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回任务网络" })).toHaveClass("primary-button", "return-network-button");
  });
});
