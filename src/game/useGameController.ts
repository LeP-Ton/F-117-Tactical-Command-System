import { useEffect, useReducer, useRef } from "react";
import { gameConfig } from "../config/gameConfig";
import { createRun } from "../domain/factories";
import { gameReducer } from "./gameReducer";

export function useGameController() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createRun());
  const lastFrame = useRef<number | null>(null);
  const mission = state.currentMission;

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

  return { state, dispatch };
}
