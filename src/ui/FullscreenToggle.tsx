import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../i18n/I18n";

function fullscreenIsSupported(): boolean {
  return document.fullscreenEnabled && typeof document.documentElement.requestFullscreen === "function";
}

export function FullscreenToggle() {
  const { copy } = useI18n();
  const [isFullscreen, setIsFullscreen] = useState(() => document.fullscreenElement !== null);
  const supported = fullscreenIsSupported();

  const syncFullscreenState = useCallback(() => {
    // 浏览器也可以通过 Escape 或系统级控件退出全屏，因此状态必须以 Fullscreen API 为准。
    setIsFullscreen(document.fullscreenElement !== null);
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, [syncFullscreenState]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // 浏览器可能因权限或非用户手势拒绝请求；保持当前界面和真实全屏状态不变。
    } finally {
      syncFullscreenState();
    }
  };

  const label = isFullscreen ? copy.app.exitFullscreen : copy.app.enterFullscreen;

  return <button
    type="button"
    className={`fullscreen-trigger ${isFullscreen ? "active" : ""}`}
    onClick={() => { void toggleFullscreen(); }}
    disabled={!supported}
    aria-label={label}
    aria-pressed={isFullscreen}
    title={supported ? label : copy.app.fullscreenUnavailable}
  >
    <svg className="fullscreen-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={isFullscreen
        ? "M9 3v6H3 M15 3v6h6 M21 15h-6v6 M3 15h6v6"
        : "M8 3H3v5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5"}
      />
    </svg>
    <span>{label}</span>
  </button>;
}
