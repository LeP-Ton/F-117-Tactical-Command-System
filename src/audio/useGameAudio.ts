import { useEffect, useRef, useState } from "react";
import type { MissionSession } from "../domain/types";
import { gameAudio } from "./gameAudio";

export function useGameAudio(mission: MissionSession | undefined) {
  const [muted, setMutedState] = useState(false);
  const [volume, setVolumeState] = useState(0.35);
  const missionId = useRef(mission?.id);
  const processedEventCount = useRef(mission?.events.length ?? 0);

  useEffect(() => {
    const unlock = () => void gameAudio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      gameAudio.dispose();
    };
  }, []);

  useEffect(() => {
    if (!mission) return;
    if (missionId.current !== mission.id) {
      missionId.current = mission.id;
      processedEventCount.current = mission.events.length;
      gameAudio.syncMission(mission.status, mission.engagement.stage);
      return;
    }
    mission.events.slice(processedEventCount.current).forEach((event) => gameAudio.playEvent(event));
    processedEventCount.current = mission.events.length;
  }, [mission?.events, mission?.id, mission?.status, mission?.engagement.stage]);

  useEffect(() => {
    if (!mission) return;
    gameAudio.syncMission(mission.status, mission.engagement.stage);
  }, [mission?.engagement.stage, mission?.status]);

  const setMuted = (nextMuted: boolean) => {
    setMutedState(nextMuted);
    gameAudio.setMuted(nextMuted);
  };
  const setVolume = (nextVolume: number) => {
    setVolumeState(nextVolume);
    gameAudio.setVolume(nextVolume);
  };

  return { muted, volume, setMuted, setVolume };
}
