import { useEffect, useReducer, useRef } from "react";
import { gameConfig } from "../config/gameConfig";
import { createRun } from "../domain/factories";
import { gameReducer } from "./gameReducer";
import { loadRunProgress, saveRunProgress } from "./gamePersistence";

export function useGameController() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => loadRunProgress() ?? createRun());
  const lastFrame = useRef<number | null>(null);
  const stateRef = useRef(state);
  const mission = state.currentMission;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const saveBeforeUnload = () => saveRunProgress(stateRef.current);
    const saveInterval = window.setInterval(() => saveRunProgress(stateRef.current), 1000);
    window.addEventListener("beforeunload", saveBeforeUnload);
    return () => {
      window.clearInterval(saveInterval);
      window.removeEventListener("beforeunload", saveBeforeUnload);
    };
  }, []);

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
