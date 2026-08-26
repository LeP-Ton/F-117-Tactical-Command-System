import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createMission } from "../domain/factories";
import { EnemyStateSummary, RadarOperatorList } from "./EnemySystemPanels";
import { TacticalMapStage } from "./TacticalMapStage";
import { WeatherForecastPanel } from "./WeatherForecastPanel";

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

    expect(screen.getByText("MISSION INTELLIGENCE")).toBeInTheDocument();
    expect(screen.getByText("CURRENT ESTIMATE")).toBeInTheDocument();
    expect(screen.getByText("雷达情报 / 误差区")).toBeInTheDocument();
  });

  it("天气预报沿用调用方指定的折叠状态", () => {
    const mission = createMission("SHARED-WEATHER");
    render(<WeatherForecastPanel mission={mission} defaultExpanded={false} />);
    expect(screen.getByRole("button", { name: /WEATHER FORECAST/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("敌方状态摘要提供固定的精简与详细密度", () => {
    const mission = createMission("SHARED-ENEMY-SUMMARY");
    const { rerender } = render(<EnemyStateSummary mission={mission} density="compact" />);
    expect(screen.getByText("Commander")).toBeInTheDocument();
    expect(screen.queryByText("指挥链效率")).not.toBeInTheDocument();
    rerender(<EnemyStateSummary mission={mission} density="detailed" />);
    expect(screen.getByText("指挥链效率")).toBeInTheDocument();
    expect(screen.getByText("雷达数量")).toBeInTheDocument();
  });

  it("Radar Operator 列表统一显示模式与三项 Utility", () => {
    const mission = createMission("SHARED-OPERATORS");
    render(<RadarOperatorList mission={mission} />);
    expect(screen.getByText(mission.radars[0]!.id)).toBeInTheDocument();
    expect(screen.getAllByText(/^W /)).toHaveLength(mission.radars.length);
    expect(screen.getAllByText(/^S /)).toHaveLength(mission.radars.length);
    expect(screen.getAllByText(/^F /)).toHaveLength(mission.radars.length);
  });
});
