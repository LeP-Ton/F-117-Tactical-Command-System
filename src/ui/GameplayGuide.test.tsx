import { createRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameplayGuide } from "./GameplayGuide";

afterEach(cleanup);

function renderGuide(onClose = vi.fn()) {
  const triggerRef = createRef<HTMLButtonElement>();
  render(<><button ref={triggerRef}>操作说明</button><GameplayGuide open onClose={onClose} triggerRef={triggerRef} missionRunning /></>);
  return { onClose, triggerRef };
}

describe("GameplayGuide", () => {
  it("显示操作说明与执行状态提示", () => {
    renderGuide();
    expect(screen.getByRole("dialog", { name: "操作说明" })).toBeInTheDocument();
    expect(screen.getByText("任务执行中 // 飞行控制持续生效")).toBeInTheDocument();
    expect(screen.getByText("实时调整")).toBeInTheDocument();
    expect(screen.getByText("任务类型")).toBeInTheDocument();
    expect(screen.getByText(/STRIKE 降低后续雷达扫描速率/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭操作说明" })).toHaveFocus();
  });

  it("非执行阶段不显示实时任务提示", () => {
    const triggerRef = createRef<HTMLButtonElement>();
    render(<><button ref={triggerRef}>操作说明</button><GameplayGuide open onClose={vi.fn()} triggerRef={triggerRef} missionRunning={false} /></>);
    expect(screen.queryByText("任务执行中 // 飞行控制持续生效")).not.toBeInTheDocument();
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
});
