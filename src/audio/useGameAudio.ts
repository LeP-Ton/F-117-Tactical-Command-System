import { useEffect, useRef, useState } from "react";
import type { MissionSession } from "../domain/types";
import { gameAudio } from "./gameAudio";

export function useGameAudio(mission: MissionSession | undefined) {
  const [volume, setVolumeState] = useState(0.35);
  const missionId = useRef(mission?.id);
  const lastProcessedEventId = useRef(mission?.events.at(-1)?.id);

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
      lastProcessedEventId.current = mission.events.at(-1)?.id;
      gameAudio.syncMission(mission.status, mission.engagement.stage);
      return;
    }
    const previousIndex = lastProcessedEventId.current
      ? mission.events.findIndex((event) => event.id === lastProcessedEventId.current)
      : -1;
    // 事件环形截断时旧 ID 可能已消失；只消费当前尾部，避免把保留历史重复播放。
    const unprocessedEvents = previousIndex >= 0
      ? mission.events.slice(previousIndex + 1)
      : mission.events.slice(-1);
    unprocessedEvents.forEach((event) => gameAudio.playEvent(event));
    lastProcessedEventId.current = mission.events.at(-1)?.id;
  }, [mission?.events, mission?.id, mission?.status, mission?.engagement.stage]);

  useEffect(() => {
    if (!mission) return;
    gameAudio.syncMission(mission.status, mission.engagement.stage);
  }, [mission?.engagement.stage, mission?.status]);

  const setVolume = (nextVolume: number) => {
    setVolumeState(nextVolume);
    gameAudio.setVolume(nextVolume);
  };

  return { volume, setVolume };
}
