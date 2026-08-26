import { gameConfig } from "../config/gameConfig";
import { createBeliefMap } from "./beliefMap";
import { generateMissionContent } from "../procedural/missionGenerator";
import { generateCampaign } from "../procedural/campaignGenerator";
import { createInitialRoute, insertionPoint } from "./route";
import { generateRadarIntel } from "./intelSystem";
import { createPlayerTacticalProfile } from "./enemyAdaptation";
import { createEngagementState } from "./engagementSystem";
import { advanceWeather } from "./weatherSystem";
import { ensureTargetFireControlCoverage } from "./targetDefense";
import { enforceExtractionRadarClearance } from "./radarDeployment";
import type { GameEvent, GameEventType, MissionSession, RunState } from "./types";

export function createMission(seed: string): MissionSession {
  const generated = generateMissionContent(seed);
  const target = {
    id: "COMMAND-BUNKER",
    position: generated.targetPosition,
    attackRadius: gameConfig.mission.attackRadius,
    destroyed: false,
  };
  const radars = ensureTargetFireControlCoverage(
    enforceExtractionRadarClearance(generated.radars, gameConfig.mission.extractionArea),
    target,
    gameConfig.mission.extractionArea,
  );
  return {
    id: `mission-${seed}`,
    seed: `${seed}-M01`,
    status: "PLANNING",
    elapsedMs: 0,
    aircraft: {
      position: { ...insertionPoint },
      headingDegrees: 0,
      speed: gameConfig.aircraft.speed,
      fuelRemaining: gameConfig.aircraft.fuelCapacityDistance,
      fuelCapacity: gameConfig.aircraft.fuelCapacityDistance,
    },
    flightPath: [{ ...insertionPoint }],
    route: createInitialRoute(),
    terrain: generated.terrain,
    weather: advanceWeather(generated.weather, 0),
    weatherForecast: generated.weatherForecast,
    radars,
    radarIntel: generateRadarIntel(`${seed}-M01`, radars, generated.intelAccuracy),
    radarContacts: [],
    beliefMap: createBeliefMap(),
    awareness: { value: 0, stage: "CALM" },
    engagement: createEngagementState(),
    commander: generated.commander,
    target,
    extractionArea: { ...gameConfig.mission.extractionArea },
    intelAccuracy: generated.intelAccuracy,
    commanderCoordinationModifier: 1,
    adaptationNotes: [],
    finalStrikeNotes: [],
    events: [],
  };
}

export function createRun(seed: string = gameConfig.initialSeed): RunState {
  const campaign = generateCampaign(seed);
  const firstNode = campaign.nodes.find((node) => node.status === "AVAILABLE")!;
  return {
    seed,
    campaign: { ...campaign, currentNodeId: firstNode.id },
    resources: { enemyAlert: 0, intelAccuracyBonus: 0 },
    enemyState: {
      radarCoverageModifier: 1,
      commanderCoordinationModifier: 1,
      tacticalProfile: createPlayerTacticalProfile(),
    },
    missionDebriefs: {},
    currentMission: createMission(firstNode.missionSeed),
    status: "ACTIVE",
  };
}

let eventSequence = 0;

/** 恢复存档后同步事件序号，避免新事件与存档中的事件 ID 冲突。 */
export function syncEventSequenceFromRun(state: RunState): void {
  const maximum = state.currentMission?.events.reduce((current, event) => {
    const sequence = Number(event.id.match(/-(\d+)$/)?.[1] ?? 0);
    return Math.max(current, sequence);
  }, 0) ?? 0;
  eventSequence = Math.max(eventSequence, maximum);
}

export function createGameEvent(
  mission: MissionSession,
  type: GameEventType,
  data: Record<string, unknown> = {},
  source = "PLAYER",
): GameEvent {
  eventSequence += 1;
  return {
    id: `${mission.id}-${eventSequence}`,
    timestamp: mission.elapsedMs,
    missionId: mission.id,
    type,
    source,
    data,
  };
}
