import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

// 1500px 的最小逻辑宽度可容纳完整双语顶部栏；720px 则是所有非滚动主视图的高度基线。
export const referenceViewport = { width: 1500, height: 720 } as const;
const maximumScale = 2;

export function calculateViewportScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 1;
  const fittedScale = Math.min(width / referenceViewport.width, height / referenceViewport.height);
  return Math.round(Math.min(maximumScale, fittedScale) * 10_000) / 10_000;
}

function readViewportScale(): number {
  return calculateViewportScale(window.innerWidth, window.innerHeight);
}

interface ViewportScalerProps {
  children: ReactNode;
}

type ViewportScalerStyle = CSSProperties & {
  "--logical-viewport-width": string;
  "--logical-viewport-height": string;
};

export function ViewportScaler({ children }: ViewportScalerProps) {
  const [scale, setScale] = useState(readViewportScale);

  useEffect(() => {
    // 窗口缩放、浏览器全屏和移动端可视区域变化都统一重算应用比例。
    const updateScale = () => setScale(readViewportScale());
    window.addEventListener("resize", updateScale);
    window.visualViewport?.addEventListener("resize", updateScale);
    document.addEventListener("fullscreenchange", updateScale);
    return () => {
      window.removeEventListener("resize", updateScale);
      window.visualViewport?.removeEventListener("resize", updateScale);
      document.removeEventListener("fullscreenchange", updateScale);
    };
  }, []);

  const style = {
    width: `${100 / scale}%`,
    height: `${100 / scale}%`,
    transform: `scale(${scale})`,
    "--logical-viewport-width": `${window.innerWidth / scale}px`,
    "--logical-viewport-height": `${window.innerHeight / scale}px`,
  } as ViewportScalerStyle;

  return <div className="viewport-scaler" style={style} data-ui-scale={scale}>{children}</div>;
}
