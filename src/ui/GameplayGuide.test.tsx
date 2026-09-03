import { createRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameplayGuide } from "./GameplayGuide";
import { I18nProvider } from "../i18n/I18n";

afterEach(cleanup);

function renderGuide(onClose = vi.fn()) {
  const triggerRef = createRef<HTMLButtonElement>();
  const onStartTutorial = vi.fn();
  render(<><button ref={triggerRef}>操作说明</button><GameplayGuide open onClose={onClose} onStartTutorial={onStartTutorial} triggerRef={triggerRef} missionRunning /></>);
  return { onClose, onStartTutorial, triggerRef };
}

describe("GameplayGuide", () => {
  it("显示操作说明与执行状态提示", () => {
    renderGuide();
    expect(screen.getByRole("dialog", { name: "操作说明" })).toBeInTheDocument();
    expect(screen.getByText("任务执行中 // 作战进程未中断")).toBeInTheDocument();
    expect(screen.getByText("实时调整")).toBeInTheDocument();
    expect(screen.getByText("任务效果")).toBeInTheDocument();
    expect(screen.getByText(/打击任务降低后续雷达扫描速率/)).toBeInTheDocument();
    expect(screen.getByText(/若放弃首次情报行动/)).toBeInTheDocument();
    expect(screen.getByText(/敌方警戒会在每次任务后上升/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭操作说明" })).toHaveFocus();
  });

  it("非执行阶段不显示实时任务提示", () => {
    const triggerRef = createRef<HTMLButtonElement>();
    render(<><button ref={triggerRef}>操作说明</button><GameplayGuide open onClose={vi.fn()} onStartTutorial={vi.fn()} triggerRef={triggerRef} missionRunning={false} /></>);
    expect(screen.queryByText("任务执行中 // 作战进程未中断")).not.toBeInTheDocument();
  });

  it("可从操作说明启动情境式任务引导", () => {
    const { onStartTutorial } = renderGuide();
    fireEvent.click(screen.getByRole("button", { name: "开始任务引导" }));
    expect(onStartTutorial).toHaveBeenCalledTimes(1);
  });

  it("关闭按钮、遮罩和 Escape 都会关闭并恢复入口焦点", () => {
    const first = renderGuide();
    fireEvent.click(screen.getByRole("button", { name: "关闭操作说明" }));
    expect(first.onClose).toHaveBeenCalledTimes(1);
    expect(first.triggerRef.current).toHaveFocus();
    cleanup();

    const second = renderGuide();
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);
    expect(second.onClose).toHaveBeenCalledTimes(1);
    expect(second.triggerRef.current).toHaveFocus();
    cleanup();

    const third = renderGuide();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(third.onClose).toHaveBeenCalledTimes(1);
    expect(third.triggerRef.current).toHaveFocus();
  });

  it("英文模式显示完整的操作与任务效果说明", () => {
    const triggerRef = createRef<HTMLButtonElement>();
    render(<I18nProvider initialLanguage="en" persist={false}>
      <button ref={triggerRef}>OPERATING INSTRUCTIONS</button>
      <GameplayGuide open onClose={vi.fn()} onStartTutorial={vi.fn()} triggerRef={triggerRef} missionRunning />
    </I18nProvider>);

    expect(screen.getByRole("dialog", { name: "OPERATING INSTRUCTIONS" })).toBeInTheDocument();
    expect(screen.getByText("MISSION IN PROGRESS // OPERATION CONTINUES")).toBeInTheDocument();
    expect(screen.getByText("MISSION EFFECTS")).toBeInTheDocument();
    expect(screen.getByText(/STRIKE reduces subsequent radar scan rate/)).toBeInTheDocument();
  });
});
