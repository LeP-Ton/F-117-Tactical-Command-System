import { gameConfig } from "../config/gameConfig";
import type { AwarenessStage, AwarenessState, RadarContact } from "./types";

export function awarenessStage(value: number): AwarenessStage {
  if (value >= gameConfig.awareness.huntingThreshold) return "HUNTING";
  if (value >= gameConfig.awareness.searchingThreshold) return "SEARCHING";
  if (value >= gameConfig.awareness.suspiciousThreshold) return "SUSPICIOUS";
  return "CALM";
}

/** 敌方警戒只由已经获得的 Contact 与已知打击事件变化，不读取飞机真实状态。 */
export function advanceAwareness(
  state: AwarenessState,
  contacts: readonly RadarContact[],
  deltaSeconds: number,
): AwarenessState {
  const evidence = contacts.reduce(
    (sum, contact) => sum
      + contact.confidence * gameConfig.awareness.contactGain
      + contact.signalStrength * gameConfig.awareness.signalGain,
    0,
  );
  const value = Math.max(
    0,
    Math.min(100, state.value - gameConfig.awareness.decayPerSecond * deltaSeconds + evidence),
  );
  return { value, stage: awarenessStage(value) };
}
