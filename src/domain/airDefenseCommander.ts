import { gameConfig } from "../config/gameConfig";
import { getBeliefPeak } from "./beliefMap";
import { bearingDegrees } from "./detectionModel";
import type {
  AwarenessState,
  BeliefMapState,
  CommanderIntent,
  CommanderDoctrine,
  CommanderState,
  CommanderUtilityScores,
  RadarState,
  RadarUtilityScores,
} from "./types";

export interface CommanderResult {
  commander: CommanderState;
  radars: RadarState[];
  orderChanged: boolean;
}

export function createCommanderState(doctrine: CommanderDoctrine = "ANALYTICAL"): CommanderState {
  return {
    doctrine,
    intent: "MONITOR",
    utilityScores: { MONITOR: 70, COORDINATED_SEARCH: 20, CONCENTRATE_SEARCH: 10, NETWORK_SILENCE: 12 },
    decisionAccumulatorSeconds: 0,
    lastDecisionAt: 0,
  };
}

function biasForIntent(intent: CommanderIntent): RadarUtilityScores {
  switch (intent) {
    case "MONITOR": return { WIDE_SEARCH: 16, SECTOR_SEARCH: 0, FOCUSED_TRACK: 0, SHUTDOWN: 0 };
    case "COORDINATED_SEARCH": return { WIDE_SEARCH: 0, SECTOR_SEARCH: 22, FOCUSED_TRACK: 6, SHUTDOWN: 0 };
    case "CONCENTRATE_SEARCH": return { WIDE_SEARCH: 0, SECTOR_SEARCH: 8, FOCUSED_TRACK: 30, SHUTDOWN: 0 };
    case "NETWORK_SILENCE": return { WIDE_SEARCH: 0, SECTOR_SEARCH: 0, FOCUSED_TRACK: 0, SHUTDOWN: 62 };
  }
}

/** Commander 只接收 Awareness、Belief 和雷达状态，不接收 AircraftState。 */
export function advanceCommander(
  state: CommanderState,
  awareness: AwarenessState,
  beliefMap: BeliefMapState,
  radars: RadarState[],
  timestamp: number,
  deltaSeconds: number,
  coordinationModifier = 1,
): CommanderResult {
  let accumulator = state.decisionAccumulatorSeconds + deltaSeconds;
  if (accumulator < gameConfig.commander.decisionIntervalSeconds) {
    return {
      commander: { ...state, decisionAccumulatorSeconds: accumulator },
      radars,
      orderChanged: false,
    };
  }
  accumulator %= gameConfig.commander.decisionIntervalSeconds;
  const peak = getBeliefPeak(beliefMap);
  const confidence = Math.min(1, peak.probability * 12);
  const scores: CommanderUtilityScores = {
    MONITOR: 72 - awareness.value * 0.72,
    COORDINATED_SEARCH: 22 + awareness.value * 0.62 + confidence * 18,
    CONCENTRATE_SEARCH: 8 + awareness.value * 0.72 + confidence * 32,
    NETWORK_SILENCE: awareness.stage === "CALM" && timestamp > 25000 ? 34 : 4,
  };
  if (state.doctrine === "CONSERVATIVE") {
    scores.MONITOR += 14;
    scores.CONCENTRATE_SEARCH -= 8;
  } else if (state.doctrine === "AGGRESSIVE") {
    scores.COORDINATED_SEARCH += 12;
    scores.CONCENTRATE_SEARCH += 14;
  } else if (state.doctrine === "AMBUSH") {
    // 首轮短暂静默制造伏击窗口，随后必须恢复搜索，避免防空网络永久离线。
    scores.NETWORK_SILENCE += awareness.stage === "CALM" && timestamp < 6000 ? 72 : 0;
    scores.CONCENTRATE_SEARCH += awareness.stage === "HUNTING" ? 18 : 0;
  }
  const intent = (Object.entries(scores) as [CommanderIntent, number][])
    .reduce((best, candidate) => candidate[1] > best[1] ? candidate : best)[0];
  const hasBelief = peak.probability > 0;
  const baseBias = biasForIntent(intent);
  const bias: RadarUtilityScores = {
    WIDE_SEARCH: baseBias.WIDE_SEARCH * coordinationModifier,
    SECTOR_SEARCH: baseBias.SECTOR_SEARCH * coordinationModifier,
    FOCUSED_TRACK: baseBias.FOCUSED_TRACK * coordinationModifier,
    SHUTDOWN: baseBias.SHUTDOWN * coordinationModifier,
  };
  const coordinatedRadars = radars.map((radar, index) => {
    const baseBearing = hasBelief
      ? bearingDegrees(radar.position.x, radar.position.y, peak.position.x, peak.position.y)
      : radar.operator.focusBearingDegrees;
    const sectorOffset = intent === "COORDINATED_SEARCH" ? (index - (radars.length - 1) / 2) * 24 : 0;
    return {
      ...radar,
      operator: {
        ...radar.operator,
        commanderBias: bias,
        focusBearingDegrees: baseBearing === undefined ? undefined : (baseBearing + sectorOffset + 360) % 360,
      },
    };
  });
  return {
    commander: {
      ...state,
      intent,
      utilityScores: scores,
      decisionAccumulatorSeconds: accumulator,
      lastDecisionAt: timestamp,
      targetPosition: hasBelief ? peak.position : state.targetPosition,
    },
    radars: coordinatedRadars,
    orderChanged: intent !== state.intent,
  };
}
