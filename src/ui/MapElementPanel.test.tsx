import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMission } from "../domain/factories";
import { MapElementPanel } from "./MapElementPanel";

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
    fireEvent.click(screen.getByRole("button", { name: /F-117/ }));
    expect(onSelectionChange).toHaveBeenCalledWith({ kind: "AIRCRAFT" });
  });
});
