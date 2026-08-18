import { gameConfig } from "../config/gameConfig";
import { createBeliefMap } from "./beliefMap";
import { generateMissionContent } from "../procedural/missionGenerator";
import { generateCampaign } from "../procedural/campaignGenerator";
import { createInitialRoute, insertionPoint } from "./route";
import { generateRadarIntel } from "./intelSystem";
import { createPlayerTacticalProfile } from "./enemyAdaptation";
import { createEngagementState } from "./engagementSystem";
import type { GameEvent, GameEventType, MissionSession, RunState } from "./types";

export function createMission(seed: string): MissionSession {
  const generated = generateMissionContent(seed);
  return {
    id: `mission-${seed}`,
    seed: `${seed}-M01`,
    status: "PLANNING",
    elapsedMs: 0,
    aircraft: {
      position: { ...insertionPoint },
      headingDegrees: 0,
      speed: gameConfig.aircraft.speed,
    },
    route: createInitialRoute(),
    terrain: generated.terrain,
    weather: generated.weather,
    radars: generated.radars,
    radarIntel: generateRadarIntel(`${seed}-M01`, generated.radars, generated.intelAccuracy),
    radarContacts: [],
    beliefMap: createBeliefMap(),
    awareness: { value: 0, stage: "CALM" },
    engagement: createEngagementState(),
    commander: generated.commander,
    target: {
      id: "COMMAND-BUNKER",
      position: generated.targetPosition,
      attackRadius: gameConfig.mission.attackRadius,
      destroyed: false,
    },
    extractionArea: { ...gameConfig.mission.extractionArea },
    weaponsRemaining: 1,
    intelAccuracy: generated.intelAccuracy,
    generationInfo: generated.generationInfo,
    detectionModifier: 1,
    contactLifetimeMultiplier: 1,
    falseContactCharges: 0,
    threatPredictionEnabled: false,
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
    playerBuild: { moduleIds: [] },
    resources: { airframeCondition: 100, intel: 0, enemyAlert: 0, intelAccuracyBonus: 0 },
    enemyState: {
      adaptationLevel: 0,
      radarCoverageModifier: 1,
      commanderCoordinationModifier: 1,
      tacticalProfile: createPlayerTacticalProfile(),
    },
    missionHistory: [],
    pendingRewardIds: [],
    currentMission: createMission(firstNode.missionSeed),
    status: "ACTIVE",
  };
}

let eventSequence = 0;

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
