import { useEffect, useMemo, useReducer, useRef } from "react";
import { gameConfig } from "../config/gameConfig";
import { EventBus } from "../core/EventBus";
import { createRun } from "../domain/factories";
import type { GameEvent } from "../domain/types";
import { gameReducer } from "./gameReducer";

export function useGameController() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createRun());
  const eventBus = useMemo(() => new EventBus<GameEvent>(), []);
  const publishedCount = useRef(0);
  const lastFrame = useRef<number | null>(null);
  const mission = state.currentMission;

  // 将 reducer 生成的领域事件发布给未来的复盘、雷达和 AI 订阅者。
  useEffect(() => {
    const events = mission?.events ?? [];
    events.slice(publishedCount.current).forEach((event) => eventBus.publish(event));
    publishedCount.current = events.length;
  }, [eventBus, mission?.events]);

  useEffect(() => {
    if (mission?.status !== "RUNNING") {
      lastFrame.current = null;
      return;
    }

    let frameId = 0;
    const loop = (timestamp: number) => {
      if (lastFrame.current === null) lastFrame.current = timestamp;
      const deltaSeconds = Math.min(
        (timestamp - lastFrame.current) / 1000,
        gameConfig.loop.maxDeltaSeconds,
      );
      lastFrame.current = timestamp;
      dispatch({ type: "TICK", deltaSeconds });
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [mission?.status]);

  return { state, dispatch, eventBus };
}
