import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createMission } from "../domain/factories";
import { EnemyStateSummary, RadarOperatorList } from "./EnemySystemPanels";
import { TacticalMapStage } from "./TacticalMapStage";
import { WeatherForecastPanel } from "./WeatherForecastPanel";
import { IntelligenceWorkspace } from "./workspaces/IntelligenceWorkspace";
import { DebriefWorkspace } from "./workspaces/DebriefWorkspace";
import { MissionWorkspace } from "./workspaces/MissionWorkspace";
import { I18nProvider } from "../i18n/I18n";

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

  it("英文威胁状态位于辐射威胁下方且使用独立样式", () => {
    const mission = createMission("THREAT-STATUS-LAYOUT");
    render(<I18nProvider initialLanguage="en" persist={false}>
      <MissionWorkspace
        mission={mission}
        selectedIndex={null}
        onSelect={vi.fn()}
        dispatch={vi.fn()}
        showBelief={false}
        canUseAiDebug={false}
        onToggleBelief={vi.fn()}
        mapSelection={null}
        onMapSelectionChange={vi.fn()}
        onOpenCampaign={vi.fn()}
        onReturnCampaign={vi.fn()}
      />
    </I18nProvider>);

    const heading = screen.getByText("THREAT WARNING");
    const radiationThreat = screen.getByText("RADIATION THREAT 0%");
    const stage = screen.getByText("NO ANOMALY DETECTED");
    expect(heading.parentElement).toHaveClass("section-heading");
    expect(stage).toHaveClass("threat-stage");
    expect(radiationThreat.nextElementSibling).toBe(stage);
  });

  it("导弹撞击倒计时不再显示中英文规避提示", () => {
    const mission = createMission("MISSILE-COUNTDOWN-COPY");
    mission.engagement = {
      ...mission.engagement,
      stage: "MISSILE_INBOUND",
      missileTimeRemainingSeconds: 7.4,
    };
    const props = {
      mission,
      selectedIndex: null,
      onSelect: vi.fn(),
      dispatch: vi.fn(),
      showBelief: false,
      canUseAiDebug: false,
      onToggleBelief: vi.fn(),
      mapSelection: null,
      onMapSelectionChange: vi.fn(),
      onOpenCampaign: vi.fn(),
      onReturnCampaign: vi.fn(),
    };
    const { unmount } = render(<I18nProvider initialLanguage="en" persist={false}>
      <MissionWorkspace {...props} />
    </I18nProvider>);

    expect(screen.getByText("IMPACT COUNTDOWN 7.4 s")).toBeInTheDocument();
    expect(screen.queryByText(/EVADE|BREAK ILLUMINATION/)).not.toBeInTheDocument();

    unmount();
    render(<I18nProvider initialLanguage="zh" persist={false}>
      <MissionWorkspace {...props} />
    </I18nProvider>);

    expect(screen.getByText("撞击倒计时 7.4 秒")).toBeInTheDocument();
    expect(screen.queryByText(/规避机动|脱离照射/)).not.toBeInTheDocument();
  });

  it("预览与复盘页面标题匹配入口文案且共用返回按钮样式", () => {
    const mission = createMission("WORKSPACE-COPY");
    const { rerender } = render(<IntelligenceWorkspace mission={mission} showBelief={false} mapSelection={null} onMapSelectionChange={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "预览任务" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回任务网络" })).toHaveClass("primary-button", "return-network-button");

    rerender(<DebriefWorkspace debrief={{ nodeId: "C0-0", completedAt: 0, intelAccessTier: 0, mission }} mapSelection={null} onMapSelectionChange={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "复盘任务" })).toBeInTheDocument();
    expect(screen.getByText("100.0, 100.0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回任务网络" })).toHaveClass("primary-button", "return-network-button");
  });
});
