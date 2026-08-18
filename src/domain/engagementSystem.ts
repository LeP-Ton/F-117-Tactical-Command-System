import { gameConfig } from "../config/gameConfig";
import type { EngagementState, RadarContact, ThreatStage } from "./types";

export interface EngagementResult {
  state: EngagementState;
  missileLaunched: boolean;
  missileDefeated: boolean;
  aircraftHit: boolean;
}

export function createEngagementState(): EngagementState {
  return { stage: "UNDETECTED", trackProgress: 0, launches: 0, hits: 0 };
}

function stageFromProgress(progress: number): ThreatStage {
  if (progress >= gameConfig.engagement.lockedThreshold) return "LOCKED";
  if (progress >= gameConfig.engagement.trackedThreshold) return "TRACKED";
  if (progress >= gameConfig.engagement.suspectedThreshold) return "SUSPECTED";
  return "UNDETECTED";
}

/**
 * 新 Contact 提升跟踪质量；失去新证据后持续衰减。导弹飞行期间若跟踪质量
 * 降到制导阈值以下则脱锁，避免一次探测直接造成不可逆的随机死亡。
 */
export function advanceEngagement(
  current: EngagementState,
  newContacts: readonly RadarContact[],
  deltaSeconds: number,
  coordinationModifier: number,
): EngagementResult {
  const evidence = newContacts.reduce(
    (sum, contact) => sum + (contact.confidence * 0.72 + contact.signalStrength * 0.28),
    0,
  );
  const gained = evidence * gameConfig.engagement.contactGain * coordinationModifier;
  const decayed = newContacts.length === 0 ? gameConfig.engagement.decayPerSecond * deltaSeconds : 0;
  let trackProgress = Math.max(0, Math.min(100, current.trackProgress + gained - decayed));

  if (current.stage === "MISSILE_INBOUND") {
    const remaining = Math.max(0, (current.missileTimeRemainingSeconds ?? 0) - deltaSeconds);
    if (trackProgress < gameConfig.engagement.missileGuidanceBreakThreshold) {
      return {
        state: { ...current, stage: stageFromProgress(trackProgress), trackProgress, missileTimeRemainingSeconds: undefined },
        missileLaunched: false,
        missileDefeated: true,
        aircraftHit: false,
      };
    }
    if (remaining <= 0) {
      trackProgress = gameConfig.engagement.trackedThreshold;
      return {
        state: {
          ...current,
          stage: "TRACKED",
          trackProgress,
          missileTimeRemainingSeconds: undefined,
          hits: current.hits + 1,
        },
        missileLaunched: false,
        missileDefeated: false,
        aircraftHit: true,
      };
    }
    return {
      state: { ...current, trackProgress, missileTimeRemainingSeconds: remaining },
      missileLaunched: false,
      missileDefeated: false,
      aircraftHit: false,
    };
  }

  if (trackProgress >= gameConfig.engagement.launchThreshold) {
    return {
      state: {
        ...current,
        stage: "MISSILE_INBOUND",
        trackProgress,
        missileTimeRemainingSeconds: gameConfig.engagement.missileFlightSeconds,
        launches: current.launches + 1,
      },
      missileLaunched: true,
      missileDefeated: false,
      aircraftHit: false,
    };
  }

  return {
    state: { ...current, stage: stageFromProgress(trackProgress), trackProgress },
    missileLaunched: false,
    missileDefeated: false,
    aircraftHit: false,
  };
}
