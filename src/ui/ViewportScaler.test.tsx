import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { calculateViewportScale, ViewportScaler } from "./ViewportScaler";

const originalViewport = { width: window.innerWidth, height: window.innerHeight };

function setViewport(width: number, height: number): void {
  Object.defineProperties(window, {
    innerWidth: { configurable: true, value: width },
    innerHeight: { configurable: true, value: height },
  });
}

afterEach(() => {
  cleanup();
  setViewport(originalViewport.width, originalViewport.height);
});

describe("全局视口自适应", () => {
  it("以 1500×720 为基准按宽高较小倍率等比缩放", () => {
    expect(calculateViewportScale(1500, 720)).toBe(1);
    expect(calculateViewportScale(1920, 1080)).toBe(1.28);
    expect(calculateViewportScale(2560, 1080)).toBe(1.5);
    expect(calculateViewportScale(1700, 823)).toBe(1.1333);
  });

  it("极小视口继续缩小以保证高度边界，并限制最大缩放", () => {
    expect(calculateViewportScale(320, 180)).toBe(0.2133);
    expect(calculateViewportScale(3840, 2160)).toBe(2);
  });

  it("窗口尺寸变化后同步更新全部子元素的统一缩放容器", async () => {
    setViewport(1500, 720);
    render(<ViewportScaler><span>战术界面</span></ViewportScaler>);
    const scaler = screen.getByText("战术界面").parentElement;

    expect(scaler).toHaveAttribute("data-ui-scale", "1");
    expect(scaler).toHaveStyle({ width: "100%", height: "100%", transform: "scale(1)" });
    expect(scaler?.style.getPropertyValue("--logical-viewport-width")).toBe("1500px");
    expect(scaler?.style.getPropertyValue("--logical-viewport-height")).toBe("720px");

    setViewport(2250, 1080);
    fireEvent(window, new Event("resize"));

    await waitFor(() => expect(scaler).toHaveAttribute("data-ui-scale", "1.5"));
    expect(scaler).toHaveStyle({ transform: "scale(1.5)" });
  });
});
