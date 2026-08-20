import { gameConfig } from "../config/gameConfig";
import { getBeliefPeak } from "./beliefMap";
import { bearingDegrees } from "./detectionModel";
import type {
  AwarenessState,
  BeliefMapState,
  CommanderIntent,
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

export function createCommanderState(): CommanderState {
  return {
    intent: "MONITOR",
    utilityScores: { MONITOR: 70, COORDINATED_SEARCH: 20, CONCENTRATE_SEARCH: 10 },
    decisionAccumulatorSeconds: 0,
  };
}

function biasForIntent(intent: CommanderIntent): RadarUtilityScores {
  switch (intent) {
    case "MONITOR": return { WIDE_SEARCH: 16, SECTOR_SEARCH: 0, FOCUSED_TRACK: 0 };
    case "COORDINATED_SEARCH": return { WIDE_SEARCH: 0, SECTOR_SEARCH: 22, FOCUSED_TRACK: 6 };
    case "CONCENTRATE_SEARCH": return { WIDE_SEARCH: 0, SECTOR_SEARCH: 8, FOCUSED_TRACK: 30 };
  }
}

/** Commander 只接收敌方警戒与 Belief，不接收 AircraftState 或目标打击位置。 */
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
  const decisionIntervalSeconds = gameConfig.commander.decisionIntervalSeconds
    / Math.max(0.25, coordinationModifier);
  if (accumulator < decisionIntervalSeconds) {
    return {
      commander: { ...state, decisionAccumulatorSeconds: accumulator },
      radars,
      orderChanged: false,
    };
  }
  accumulator %= decisionIntervalSeconds;
  const peak = getBeliefPeak(beliefMap, timestamp);
  const confidence = peak.isValid ? Math.min(1, peak.probability * 12) : 0;
  const scores: CommanderUtilityScores = {
    MONITOR: 72 - awareness.value * 0.72,
    COORDINATED_SEARCH: 22 + awareness.value * 0.62 + confidence * 18,
    CONCENTRATE_SEARCH: 8 + awareness.value * 0.72 + confidence * 32,
  };
  const intent = (Object.entries(scores) as [CommanderIntent, number][])
    .reduce((best, candidate) => candidate[1] > best[1] ? candidate : best)[0];
  const hasBelief = peak.position !== undefined;
  const baseBias = biasForIntent(intent);
  const bias: RadarUtilityScores = {
    WIDE_SEARCH: baseBias.WIDE_SEARCH * coordinationModifier,
    SECTOR_SEARCH: baseBias.SECTOR_SEARCH * coordinationModifier,
    FOCUSED_TRACK: baseBias.FOCUSED_TRACK * coordinationModifier,
  };
  const coordinatedRadars = radars.map((radar, index) => {
    const baseBearing = hasBelief
      ? bearingDegrees(radar.position.x, radar.position.y, peak.position!.x, peak.position!.y)
      : radar.operator.focusBearingDegrees;
    const sectorOffset = intent === "COORDINATED_SEARCH" ? (index - (radars.length - 1) / 2) * 24 : 0;
    const coordinationError = hasBelief
      ? (1 - coordinationModifier)
        * gameConfig.commander.maximumBearingErrorDegrees
        * (index % 2 === 0 ? -1 : 1)
        * (0.6 + (index % 3) * 0.2)
      : 0;
    return {
      ...radar,
      operator: {
        ...radar.operator,
        commanderBias: bias,
        focusBearingDegrees: baseBearing === undefined
          ? undefined
          : (baseBearing + sectorOffset + coordinationError + 360) % 360,
      },
    };
  });
  return {
    commander: {
      ...state,
      intent,
      utilityScores: scores,
      decisionAccumulatorSeconds: accumulator,
      targetPosition: hasBelief
        ? state.targetPosition
          ? {
              x: state.targetPosition.x * 0.65 + peak.position!.x * 0.35,
              y: state.targetPosition.y * 0.65 + peak.position!.y * 0.35,
            }
          : peak.position
        : undefined,
    },
    radars: coordinatedRadars,
    orderChanged: intent !== state.intent,
  };
}
