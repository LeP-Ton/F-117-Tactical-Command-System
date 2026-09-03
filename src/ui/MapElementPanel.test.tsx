import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMission } from "../domain/factories";
import { MapElementPanel } from "./MapElementPanel";
import { I18nProvider } from "../i18n/I18n";

afterEach(cleanup);

describe("MapElementPanel 地图元素分类", () => {
  it("默认折叠四类元素，并保留元素选择回调", () => {
    const mission = createMission("MAP-ELEMENT-GROUPS");
    const onSelectionChange = vi.fn();

    render(
      <MapElementPanel
        mission={mission}
        showBelief={false}
        selection={null}
        onSelectionChange={onSelectionChange}
      />,
    );

    for (const title of ["任务目标", "航线", "环境", "雷达"]) {
      expect(screen.getByRole("button", { name: new RegExp(title) })).toHaveAttribute("aria-expanded", "false");
    }

    fireEvent.click(screen.getByRole("button", { name: /任务目标/ }));
    expect(screen.getByText("指挥掩体")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /F-117/ }));
    expect(onSelectionChange).toHaveBeenCalledWith({ kind: "AIRCRAFT" });
  });

  it("情报预览可让四类元素默认展开", () => {
    const { container } = render(<MapElementPanel mission={createMission("MAP-PREVIEW")} showBelief={false} selection={null} onSelectionChange={vi.fn()} defaultExpandedGroups />);
    const headings = container.querySelectorAll(".map-element-group > .collapsible-heading");
    expect(headings).toHaveLength(4);
    headings.forEach((heading) => expect(heading).toHaveAttribute("aria-expanded", "true"));
  });

  it("一级 INTEL 核实后的雷达不再保留未知问号", () => {
    const mission = createMission("MAP-VERIFIED-RADAR");
    const report = mission.radarIntel[0]!;
    mission.radarIntel = [{
      ...report,
      level: "CONFIRMED",
      estimatedPosition: { x: 300, y: 300 },
      positionErrorRadius: 0,
    }];
    render(<MapElementPanel mission={mission} showBelief={false} selection={null} onSelectionChange={vi.fn()} defaultExpandedGroups />);

    expect(screen.getByText(new RegExp(`^${report.radarId} ·`))).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`^${report.radarId}\\?`))).not.toBeInTheDocument();
    expect(screen.getByText("已确认 · 坐标与型号已核实")).toBeInTheDocument();
  });

  it("英文模式翻译环境、航点和雷达动态状态", () => {
    const mission = createMission("MAP-ELEMENTS-ENGLISH");
    const report = mission.radarIntel[0]!;
    mission.radarIntel = [{
      ...report,
      level: "CONFIRMED",
      estimatedPosition: { x: 320, y: 320 },
      positionErrorRadius: 0,
    }];
    render(<I18nProvider initialLanguage="en" persist={false}>
      <MapElementPanel mission={mission} showBelief={false} selection={null} onSelectionChange={vi.fn()} defaultExpandedGroups />
    </I18nProvider>);

    expect(screen.getByRole("button", { name: /^ENVIRONMENT/ })).toBeInTheDocument();
    expect(screen.getByText("COMMAND BUNKER")).toBeInTheDocument();
    expect(screen.getByText(/Coordinates and type verified/)).toBeInTheDocument();
    expect(screen.getAllByText(/Navigation control point/).length).toBeGreaterThan(0);
  });
});
