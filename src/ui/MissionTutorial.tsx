import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { distanceBetween, isInsideExtraction } from "../domain/missionRules";
import type { MissionSession } from "../domain/types";
import { useI18n } from "../i18n/I18n";

export type TutorialContext = "CAMPAIGN" | "PLANNING" | "RUNNING" | "RESULT" | "INTELLIGENCE" | "DEBRIEF";

interface MissionTutorialProps {
  context: TutorialContext;
  mission: MissionSession;
  onDismiss: () => void;
  onComplete: () => void;
}

interface FocusRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const tutorialSteps = [
  { id: "network", context: "CAMPAIGN", target: "mission-network", advance: "NEXT" },
  { id: "assessment", context: "CAMPAIGN", target: "mission-assessment", advance: "NEXT" },
  { id: "planningEntry", context: "CAMPAIGN", target: "mission-entry", advance: "EXTERNAL" },
  { id: "map", context: "PLANNING", target: "tactical-map", advance: "NEXT" },
  { id: "route", context: "PLANNING", target: "tactical-map", advance: "ROUTE_READY" },
  { id: "launch", context: "PLANNING", target: "confirm-route", advance: "EXTERNAL" },
  { id: "execution", context: "RUNNING", target: "mission-telemetry", advance: "COMPLETE" },
] as const;

type TutorialStepId = (typeof tutorialSteps)[number]["id"];

function getInitialStep(context: TutorialContext): number {
  if (context === "PLANNING") return 3;
  if (context === "RUNNING" || context === "RESULT") return 6;
  return 0;
}

function normalizeStep(index: number, context: TutorialContext): number {
  if (context === "CAMPAIGN" && index > 2) return 2;
  if (context === "PLANNING" && (index < 3 || index > 5)) return 3;
  if ((context === "RUNNING" || context === "RESULT") && index < 6) return 6;
  return index;
}

/**
 * 在真实任务界面上运行的情境式引导。组件只观察页面与任务状态，不派发任何游戏动作，
 * 高亮区域仍保持可点击，因此玩家始终是在正式任务规则下完成教学步骤。
 */
export function MissionTutorial({ context, mission, onDismiss, onComplete }: MissionTutorialProps) {
  const { copy } = useI18n();
  const [stepIndex, setStepIndex] = useState(() => getInitialStep(context));
  const [focusRect, setFocusRect] = useState<FocusRect | null>(null);
  const resolvedStepIndex = normalizeStep(stepIndex, context);
  const step = tutorialSteps[resolvedStepIndex];
  const routeChecks = useMemo(() => {
    const plannedWaypoints = mission.route.waypoints.slice(1);
    const finalWaypoint = plannedWaypoints[plannedWaypoints.length - 1];
    return {
      target: plannedWaypoints.some((waypoint) => distanceBetween(waypoint.position, mission.target.position) <= mission.target.attackRadius),
      extraction: finalWaypoint ? isInsideExtraction(finalWaypoint.position, mission.extractionArea) : false,
    };
  }, [mission.extractionArea, mission.route.waypoints, mission.target.attackRadius, mission.target.position]);
  const routeReady = routeChecks.target && routeChecks.extraction;

  useEffect(() => {
    if (resolvedStepIndex !== stepIndex) setStepIndex(resolvedStepIndex);
  }, [resolvedStepIndex, stepIndex]);

  useEffect(() => {
    if (context === "INTELLIGENCE" || context === "DEBRIEF") {
      setFocusRect(null);
      return;
    }
    const target = document.querySelector<HTMLElement>(`[data-tutorial="${step.target}"]`);
    if (!target) {
      setFocusRect(null);
      return;
    }

    const updateRect = () => {
      const rect = target.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        setFocusRect(null);
        return;
      }
      const scaler = target.closest<HTMLElement>(".viewport-scaler");
      const scalerRect = scaler?.getBoundingClientRect();
      // getBoundingClientRect 返回缩放后的物理坐标，浮层定位则运行在缩放容器的逻辑坐标系中。
      const scale = scaler && scalerRect && scaler.clientWidth > 0 ? scalerRect.width / scaler.clientWidth : 1;
      const logicalViewportWidth = window.innerWidth / scale;
      const logicalViewportHeight = window.innerHeight / scale;
      const logicalRect = {
        top: rect.top / scale,
        left: rect.left / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      };
      const inset = 6;
      setFocusRect({
        top: Math.max(8, logicalRect.top - inset),
        left: Math.max(8, logicalRect.left - inset),
        width: Math.min(logicalViewportWidth - Math.max(8, logicalRect.left - inset) - 8, logicalRect.width + inset * 2),
        height: Math.min(logicalViewportHeight - Math.max(8, logicalRect.top - inset) - 8, logicalRect.height + inset * 2),
      });
    };

    let pendingFrame: number | undefined;
    const scheduleRectUpdate = () => {
      if (pendingFrame !== undefined) {
        if (typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(pendingFrame);
        else window.clearTimeout(pendingFrame);
      }
      const commitUpdate = () => {
        pendingFrame = undefined;
        updateRect();
      };
      // 等 React 完成本轮布局再读取坐标，避免任务预览内容刚变化时仍取得旧位置。
      pendingFrame = typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame(commitUpdate)
        : window.setTimeout(commitUpdate, 0);
    };

    updateRect();
    window.addEventListener("resize", scheduleRectUpdate);
    window.addEventListener("scroll", scheduleRectUpdate, true);
    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(scheduleRectUpdate);
    resizeObserver?.observe(target);
    // “规划任务”按钮会因任务说明行数变化而整体移动，但按钮自身尺寸可能完全不变。
    // 因此该步骤还需观察整个任务预览区的内容变更，而不能只监听按钮 ResizeObserver。
    const layoutRoot = step.target === "mission-entry"
      ? target.closest<HTMLElement>('[data-tutorial="mission-assessment"]')
      : null;
    const mutationObserver = layoutRoot && typeof MutationObserver !== "undefined"
      ? new MutationObserver(scheduleRectUpdate)
      : undefined;
    if (layoutRoot) {
      mutationObserver?.observe(layoutRoot, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
      });
    }
    return () => {
      window.removeEventListener("resize", scheduleRectUpdate);
      window.removeEventListener("scroll", scheduleRectUpdate, true);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      if (pendingFrame !== undefined) {
        if (typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(pendingFrame);
        else window.clearTimeout(pendingFrame);
      }
    };
  }, [context, step.target]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  const isSuspended = context === "INTELLIGENCE" || context === "DEBRIEF";
  const stepCopy = copy.tutorial.steps[step.id as TutorialStepId];
  const canGoBack = resolvedStepIndex > 0 && tutorialSteps[resolvedStepIndex - 1]?.context === step.context;
  const logicalViewport = document.querySelector<HTMLElement>(".viewport-scaler");
  const logicalViewportWidth = logicalViewport?.clientWidth ?? window.innerWidth;
  const logicalViewportHeight = logicalViewport?.clientHeight ?? window.innerHeight;
  const cardHorizontal = focusRect && focusRect.left + focusRect.width / 2 > logicalViewportWidth / 2 ? "left" : "right";
  const cardVertical = focusRect && focusRect.top + focusRect.height / 2 > logicalViewportHeight / 2 ? "top" : "bottom";
  const focusStyle = focusRect ? {
    top: focusRect.top,
    left: focusRect.left,
    width: focusRect.width,
    height: focusRect.height,
  } as CSSProperties : undefined;

  return <>
    {focusStyle && <div className="tutorial-focus-frame" style={focusStyle} aria-hidden="true" />}
    <aside
      className={`mission-tutorial tutorial-card-${cardHorizontal} tutorial-card-${cardVertical}`}
      role="complementary"
      aria-label={copy.tutorial.label}
      aria-live="polite"
    >
      <header className="tutorial-header">
        <div>
          <span>{copy.tutorial.kicker}</span>
          <strong>{isSuspended ? copy.tutorial.suspendedTitle : stepCopy.title}</strong>
        </div>
        <button type="button" className="tutorial-close" onClick={onDismiss} aria-label={copy.tutorial.exit}><i aria-hidden="true" /></button>
      </header>
      <div className="tutorial-progress" aria-label={copy.tutorial.progressLabel}>
        <i style={{ width: `${((resolvedStepIndex + 1) / tutorialSteps.length) * 100}%` }} />
        <span>{resolvedStepIndex + 1} / {tutorialSteps.length}</span>
      </div>
      <div className="tutorial-body">
        <p>{isSuspended ? copy.tutorial.suspendedBody : stepCopy.body}</p>
        {!isSuspended && step.id === "route" && <ul className="tutorial-route-checks">
          <li className={routeChecks.target ? "complete" : ""}>{routeChecks.target ? "◆" : "◇"} {copy.tutorial.routeTarget}</li>
          <li className={routeChecks.extraction ? "complete" : ""}>{routeChecks.extraction ? "◆" : "◇"} {copy.tutorial.routeExtraction}</li>
        </ul>}
      </div>
      <footer className="tutorial-actions">
        {canGoBack && !isSuspended
          ? <button type="button" onClick={() => setStepIndex(resolvedStepIndex - 1)}>{copy.tutorial.back}</button>
          : <span />}
        {isSuspended
          ? <span className="tutorial-await">{copy.tutorial.suspendedAction}</span>
          : step.advance === "EXTERNAL"
            ? <span className="tutorial-await">{copy.tutorial.awaitAction}</span>
            : step.advance === "COMPLETE"
              ? <button type="button" className="tutorial-primary" onClick={onComplete}>{copy.tutorial.complete}</button>
              : <button
                type="button"
                className="tutorial-primary"
                disabled={step.advance === "ROUTE_READY" && !routeReady}
                onClick={() => setStepIndex(resolvedStepIndex + 1)}
              >{copy.tutorial.next}</button>}
      </footer>
    </aside>
  </>;
}
