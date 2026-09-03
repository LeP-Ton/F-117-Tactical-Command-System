import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../i18n/I18n";
import { FullscreenToggle } from "./FullscreenToggle";

let fullscreenElement: Element | null;
let requestFullscreen: ReturnType<typeof vi.fn>;
let exitFullscreen: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fullscreenElement = null;
  requestFullscreen = vi.fn(async () => {
    fullscreenElement = document.documentElement;
    document.dispatchEvent(new Event("fullscreenchange"));
  });
  exitFullscreen = vi.fn(async () => {
    fullscreenElement = null;
    document.dispatchEvent(new Event("fullscreenchange"));
  });

  Object.defineProperties(document, {
    fullscreenEnabled: { configurable: true, value: true },
    fullscreenElement: { configurable: true, get: () => fullscreenElement },
    exitFullscreen: { configurable: true, value: exitFullscreen },
  });
  Object.defineProperty(document.documentElement, "requestFullscreen", {
    configurable: true,
    value: requestFullscreen,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("全屏切换", () => {
  it("进入和退出全屏时同步按钮状态", async () => {
    render(<I18nProvider initialLanguage="zh" persist={false}><FullscreenToggle /></I18nProvider>);

    const enterButton = screen.getByRole("button", { name: "全屏显示" });
    const enterIconPath = enterButton.querySelector("svg path")?.getAttribute("d");
    expect(enterIconPath).toBeTruthy();
    fireEvent.click(enterButton);

    await waitFor(() => expect(requestFullscreen).toHaveBeenCalledOnce());
    const exitButton = screen.getByRole("button", { name: "退出全屏" });
    expect(exitButton).toHaveAttribute("aria-pressed", "true");
    expect(exitButton.querySelector("svg path")?.getAttribute("d")).not.toBe(enterIconPath);

    fireEvent.click(exitButton);

    await waitFor(() => expect(exitFullscreen).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "全屏显示" })).toHaveAttribute("aria-pressed", "false");
  });

  it("通过 Escape 退出时根据浏览器事件恢复入口文案", async () => {
    fullscreenElement = document.documentElement;
    render(<I18nProvider initialLanguage="en" persist={false}><FullscreenToggle /></I18nProvider>);

    expect(screen.getByRole("button", { name: "EXIT FULLSCREEN" })).toBeInTheDocument();
    fullscreenElement = null;
    document.dispatchEvent(new Event("fullscreenchange"));

    await waitFor(() => expect(screen.getByRole("button", { name: "FULLSCREEN" })).toHaveAttribute("aria-pressed", "false"));
  });

  it("浏览器不支持 Fullscreen API 时禁用入口并提供原因", () => {
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: false });
    render(<I18nProvider initialLanguage="zh" persist={false}><FullscreenToggle /></I18nProvider>);

    expect(screen.getByRole("button", { name: "全屏显示" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "全屏显示" })).toHaveAttribute("title", "当前浏览器不支持全屏显示");
  });
});
