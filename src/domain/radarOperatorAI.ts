import { gameConfig } from "../config/gameConfig";
import { bearingDegrees } from "./detectionModel";
import type {
  RadarContact,
  RadarOperatorMode,
  RadarState,
  RadarUtilityScores,
} from "./types";

export interface RadarModeChange {
  radarId: string;
  from: RadarOperatorMode;
  to: RadarOperatorMode;
  scores: RadarUtilityScores;
}

export interface RadarOperatorResult {
  radars: RadarState[];
  changes: RadarModeChange[];
}

export function createRadarOperatorState() {
  return {
    mode: "WIDE_SEARCH" as const,
    utilityScores: { WIDE_SEARCH: 52, SECTOR_SEARCH: 18, FOCUSED_TRACK: 8 },
    commanderBias: { WIDE_SEARCH: 0, SECTOR_SEARCH: 0, FOCUSED_TRACK: 0 },
    decisionAccumulatorSeconds: 0,
  };
}

function newestContact(radarId: string, contacts: RadarContact[]): RadarContact | undefined {
  return contacts
    .filter((contact) => contact.radarId === radarId)
    .sort((first, second) => second.timestamp - first.timestamp)[0];
}

function newestNetworkContact(contacts: RadarContact[]): RadarContact | undefined {
  return [...contacts].sort((first, second) => second.timestamp - first.timestamp)[0];
}

/** Operator 只消费不完美 Contact，不接收 AircraftState。 */
export function advanceRadarOperators(
  radars: RadarState[],
  contacts: RadarContact[],
  timestamp: number,
  deltaSeconds: number,
  coordinationModifier = 1,
): RadarOperatorResult {
  const changes: RadarModeChange[] = [];
  const nextRadars = radars.map((radar) => {
    let accumulator = radar.operator.decisionAccumulatorSeconds + deltaSeconds;
    if (accumulator < gameConfig.radar.operatorDecisionIntervalSeconds) {
      return {
        ...radar,
        operator: { ...radar.operator, decisionAccumulatorSeconds: accumulator },
      };
    }
    accumulator %= gameConfig.radar.operatorDecisionIntervalSeconds;

    const localContact = newestContact(radar.id, contacts);
    const sharedContact = newestNetworkContact(contacts);
    const sharedContactAge = sharedContact ? timestamp - sharedContact.timestamp : Number.POSITIVE_INFINITY;
    const sharedMemoryMs = gameConfig.radar.sharedContactMemoryMs * coordinationModifier;
    // 本地 Contact 始终可用；跨雷达 Contact 的共享窗口随指挥链受损而缩短。
    const contact = localContact ?? (sharedContactAge <= sharedMemoryMs ? sharedContact : undefined);
    const contactAge = contact ? timestamp - contact.timestamp : Number.POSITIVE_INFINITY;
    const focusedEvidence = contactAge <= gameConfig.radar.focusedContactMemoryMs;
    const sectorEvidence = contactAge <= gameConfig.radar.sectorContactMemoryMs;
    const scores: RadarUtilityScores = {
      WIDE_SEARCH: (sectorEvidence ? 22 : 52) + radar.operator.commanderBias.WIDE_SEARCH,
      SECTOR_SEARCH: (sectorEvidence ? 48 + (contact?.confidence ?? 0) * 22 : 18) + radar.operator.commanderBias.SECTOR_SEARCH,
      FOCUSED_TRACK: (focusedEvidence ? 42 + (contact?.confidence ?? 0) * 68 : 8) + radar.operator.commanderBias.FOCUSED_TRACK,
    };
    const mode = (Object.entries(scores) as [RadarOperatorMode, number][])
      .reduce((best, candidate) => candidate[1] > best[1] ? candidate : best)[0];
    const focusBearingDegrees = contact
      ? bearingDegrees(radar.position.x, radar.position.y, contact.estimatedPosition.x, contact.estimatedPosition.y)
      : radar.operator.focusBearingDegrees;

    if (mode !== radar.operator.mode) {
      changes.push({ radarId: radar.id, from: radar.operator.mode, to: mode, scores });
    }
    return {
      ...radar,
      operator: {
        ...radar.operator,
        mode,
        utilityScores: scores,
        decisionAccumulatorSeconds: accumulator,
        focusBearingDegrees,
      },
    };
  });

  return { radars: nextRadars, changes };
}
