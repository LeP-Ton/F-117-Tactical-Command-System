import { gameConfig } from "../config/gameConfig";
import { advanceAutopilot } from "../domain/autopilot";
import { advanceBeliefMap } from "../domain/beliefMap";
import { advanceAwareness, awarenessStage } from "../domain/awarenessSystem";
import { advanceCommander } from "../domain/airDefenseCommander";
import { createGameEvent, createMission, createRun } from "../domain/factories";
import { advanceRadarOperators } from "../domain/radarOperatorAI";
import { advanceRadarSensors } from "../domain/radarSensor";
import { canAttackTarget, isInsideExtraction } from "../domain/missionRules";
import { generateRadarIntel } from "../domain/intelSystem";
import { analyzeCompletedMission, applyEnemyCounterDeployment } from "../domain/enemyAdaptation";
import { applyFinalStrikeDefense } from "../domain/finalStrike";
import { advanceEngagement } from "../domain/engagementSystem";
import { advanceWeather, getWeatherSpeedFactor } from "../domain/weatherSystem";
import {
  addWaypoint,
  moveWaypoint,
  removeWaypoint,
  reorderWaypoint,
} from "../domain/route";
import type { CampaignNode, MissionSession, RunState, Vector2 } from "../domain/types";

const MAX_STORED_EVENTS = 200;
const FLIGHT_PATH_SAMPLE_DISTANCE = 20;

function appendEvents(mission: MissionSession, events: MissionSession["events"]): MissionSession["events"] {
  if (events.length === 0) return mission.events;
  return [...mission.events, ...events].slice(-MAX_STORED_EVENTS);
}

function sampleFlightPath(mission: MissionSession, position: Vector2): Vector2[] {
  const last = mission.flightPath.at(-1);
  if (last && Math.hypot(position.x - last.x, position.y - last.y) < FLIGHT_PATH_SAMPLE_DISTANCE) {
    return mission.flightPath;
  }
  return [...mission.flightPath, { ...position }];
}

export type GameAction =
  | { type: "NEW_RUN"; seed: string }
  | { type: "SELECT_CAMPAIGN_NODE"; nodeId: string }
  | { type: "RETURN_CAMPAIGN" }
  | { type: "ADD_WAYPOINT"; position: Vector2 }
  | { type: "MOVE_WAYPOINT"; index: number; position: Vector2 }
  | { type: "REMOVE_WAYPOINT"; index: number }
  | { type: "REORDER_WAYPOINT"; fromIndex: number; toIndex: number }
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK"; deltaSeconds: number }
  | { type: "RESET" };

function isEditable(state: RunState): boolean {
  const status = state.currentMission?.status;
  return status === "PLANNING" || status === "PAUSED";
}

/**
 * 使用当前 Run 的持久状态准备指定节点任务。
 * 节点选择与任务重置必须共用这条路径，避免遗漏情报、防空削弱或敌方适应效果。
 */
function prepareCampaignMission(state: RunState, node: CampaignNode): MissionSession {
  const selectedMission = createMission(node.missionSeed);
  const alertCoverageMultiplier = 1 + state.resources.enemyAlert / 250;
  const adjustedRadars = selectedMission.radars.map((radar) => ({
    ...radar,
    range: radar.range * state.enemyState.radarCoverageModifier * alertCoverageMultiplier,
  }));
  const adjustedIntelAccuracy = Math.min(0.99, selectedMission.intelAccuracy + state.resources.intelAccuracyBonus);
  const adaptedMission = applyEnemyCounterDeployment({
    ...selectedMission,
    radars: adjustedRadars,
    intelAccuracy: adjustedIntelAccuracy,
  }, state.enemyState);
  const finalMission = node.type === "FINAL_STRIKE"
    ? applyFinalStrikeDefense(adaptedMission, {
      completedNodeTypes: state.campaign.nodes
        .filter((candidate) => candidate.status === "COMPLETED")
        .map((candidate) => candidate.type),
      enemyAlert: state.resources.enemyAlert,
      tacticalProfile: state.enemyState.tacticalProfile,
    })
    : adaptedMission;

  return {
    ...finalMission,
    radarIntel: generateRadarIntel(selectedMission.seed, finalMission.radars, adjustedIntelAccuracy),
    intelAccuracy: adjustedIntelAccuracy,
    commanderCoordinationModifier: state.enemyState.commanderCoordinationModifier,
  };
}

export function gameReducer(state: RunState, action: GameAction): RunState {
  const mission = state.currentMission;
  if (!mission) return state;

  switch (action.type) {
    case "NEW_RUN":
      return createRun(action.seed.trim() || gameConfig.initialSeed);
    case "SELECT_CAMPAIGN_NODE": {
      const node = state.campaign.nodes.find((candidate) => candidate.id === action.nodeId);
      if (!node || node.status !== "AVAILABLE") return state;
      return {
        ...state,
        campaign: { ...state.campaign, currentNodeId: node.id },
        currentMission: prepareCampaignMission(state, node),
      };
    }
    case "RETURN_CAMPAIGN": {
      if (mission.status !== "SUCCESS" && mission.status !== "FAILED") return state;
      const currentNode = state.campaign.nodes.find((node) => node.id === state.campaign.currentNodeId);
      if (!currentNode) return state;
      const succeeded = mission.status === "SUCCESS";
      const nextLayer = currentNode.layer + 1;
      const nodes = state.campaign.nodes.map((node) => {
        if (node.id === currentNode.id) return { ...node, status: succeeded ? "COMPLETED" as const : "FAILED" as const };
        if (node.layer === currentNode.layer && node.status === "AVAILABLE") {
          return { ...node, status: "EXPIRED" as const };
        }
        if (node.layer === nextLayer && node.status === "LOCKED") return { ...node, status: "AVAILABLE" as const };
        return node;
      });
      const alertDelta = succeeded && currentNode.type === "SEAD" ? -8 : succeeded ? 2 : 10;
      const tacticalProfile = analyzeCompletedMission(state.enemyState.tacticalProfile, mission);
      return {
        ...state,
        status: succeeded && currentNode.type === "FINAL_STRIKE" ? "VICTORY" : state.status,
        campaign: { ...state.campaign, nodes, currentNodeId: undefined },
        resources: {
          ...state.resources,
          enemyAlert: Math.max(0, Math.min(100, state.resources.enemyAlert + alertDelta)),
          intelAccuracyBonus: Math.min(
            0.24,
            state.resources.intelAccuracyBonus
              + (succeeded && currentNode.type === "INTEL" ? 0.1 : 0),
          ),
        },
        enemyState: {
          ...state.enemyState,
          tacticalProfile,
          radarCoverageModifier: succeeded && currentNode.type === "SEAD"
            ? Math.max(0.55, state.enemyState.radarCoverageModifier * 0.85)
            : state.enemyState.radarCoverageModifier,
          commanderCoordinationModifier: succeeded && currentNode.type === "COMMAND_STRIKE"
            ? Math.max(0.45, state.enemyState.commanderCoordinationModifier * 0.75)
            : state.enemyState.commanderCoordinationModifier,
        },
      };
    }
    case "ADD_WAYPOINT": {
      if (!isEditable(state)) return state;
      const waypoint = {
        id: `wp-${Math.round(mission.elapsedMs)}-${mission.route.waypoints.length}`,
        kind: "NAVIGATION" as const,
        position: action.position,
        status: "PENDING" as const,
      };
      const event = createGameEvent(mission, "WAYPOINT_ADDED", { waypointId: waypoint.id });
      return {
        ...state,
        currentMission: {
          ...mission,
          route: addWaypoint(mission.route, waypoint),
          events: appendEvents(mission, [event]),
        },
      };
    }
    case "MOVE_WAYPOINT": {
      if (!isEditable(state)) return state;
      const route = moveWaypoint(mission.route, action.index, action.position);
      if (route === mission.route) return state;
      return {
        ...state,
        currentMission: {
          ...mission,
          route,
          events: appendEvents(mission, [createGameEvent(mission, "WAYPOINT_MOVED", { index: action.index })]),
        },
      };
    }
    case "REMOVE_WAYPOINT": {
      if (!isEditable(state)) return state;
      const route = removeWaypoint(mission.route, action.index);
      if (route === mission.route) return state;
      return {
        ...state,
        currentMission: {
          ...mission,
          route,
          events: appendEvents(mission, [createGameEvent(mission, "WAYPOINT_REMOVED", { index: action.index })]),
        },
      };
    }
    case "REORDER_WAYPOINT": {
      if (!isEditable(state)) return state;
      const route = reorderWaypoint(mission.route, action.fromIndex, action.toIndex);
      if (route === mission.route) return state;
      return {
        ...state,
        currentMission: {
          ...mission,
          route,
          events: appendEvents(mission, [createGameEvent(mission, "WAYPOINT_REORDERED", {
              fromIndex: action.fromIndex,
              toIndex: action.toIndex,
            })]),
        },
      };
    }
    case "START": {
      if (mission.status !== "PLANNING" || mission.route.waypoints.length < 2) return state;
      return {
        ...state,
        currentMission: {
          ...mission,
          status: "RUNNING",
          events: appendEvents(mission, [createGameEvent(mission, "MISSION_STARTED")]),
        },
      };
    }
    case "PAUSE": {
      if (mission.status !== "RUNNING") return state;
      return {
        ...state,
        currentMission: {
          ...mission,
          status: "PAUSED",
          events: appendEvents(mission, [createGameEvent(mission, "MISSION_PAUSED")]),
        },
      };
    }
    case "RESUME": {
      if (mission.status !== "PAUSED" || mission.route.activeWaypointIndex >= mission.route.waypoints.length) {
        return state;
      }
      return {
        ...state,
        currentMission: {
          ...mission,
          status: "RUNNING",
          events: appendEvents(mission, [createGameEvent(mission, "MISSION_RESUMED")]),
        },
      };
    }
    case "TICK": {
      if (mission.status !== "RUNNING") return state;
      const weatherSpeedFactor = getWeatherSpeedFactor(mission.aircraft.position, mission.weather);
      const flightAircraft = {
        ...mission.aircraft,
        speed: gameConfig.aircraft.speed * weatherSpeedFactor,
      };
      // 只允许飞机移动剩余燃油能够覆盖的距离，避免最后一帧透支航程。
      const fuelLimitedSeconds = flightAircraft.speed > 0
        ? Math.min(action.deltaSeconds, mission.aircraft.fuelRemaining / flightAircraft.speed)
        : 0;
      const result = advanceAutopilot(flightAircraft, mission.route, fuelLimitedSeconds);
      const aircraft = {
        ...result.aircraft,
        fuelRemaining: Math.max(0, mission.aircraft.fuelRemaining - result.distanceTraveled),
      };
      const nextTimestamp = mission.elapsedMs + action.deltaSeconds * 1000;
      const autoAttack = canAttackTarget({ ...mission, aircraft });
      const target = autoAttack ? { ...mission.target, destroyed: true } : mission.target;
      const weather = advanceWeather(mission.weather, nextTimestamp);
      const radarResult = advanceRadarSensors(
        mission.seed,
        mission.radars,
        aircraft,
        mission.terrain,
        weather,
        nextTimestamp,
        action.deltaSeconds,
      );
      const reachedEvents = result.reachedWaypointIds.map((waypointId) =>
        createGameEvent(mission, "WAYPOINT_REACHED", { waypointId }),
      );
      const completionEvents = result.routeCompleted
        ? [createGameEvent(mission, "ROUTE_COMPLETED")]
        : [];
      const contactEvents = radarResult.contacts.map((contact) =>
        ({
          ...createGameEvent(
            mission,
            "RADAR_CONTACT",
            { radarId: contact.radarId, confidence: contact.confidence, errorRadius: contact.errorRadius },
            contact.radarId,
          ),
          timestamp: nextTimestamp,
        }),
      );
      const radarContacts = [
        ...mission.radarContacts.filter(
          (contact) => nextTimestamp - contact.timestamp <= gameConfig.radar.contactLifetimeMs,
        ),
        ...radarResult.contacts,
      ];
      const beliefMap = advanceBeliefMap(
        mission.beliefMap,
        radarResult.contacts,
        nextTimestamp,
        action.deltaSeconds,
      );
      const sensorAwareness = advanceAwareness(mission.awareness, radarResult.contacts, action.deltaSeconds);
      const awarenessValue = autoAttack
        ? Math.min(100, sensorAwareness.value + gameConfig.mission.attackAwarenessGain)
        : sensorAwareness.value;
      const awareness = { value: awarenessValue, stage: awarenessStage(awarenessValue) };
      const engagementResult = advanceEngagement(
        mission.engagement,
        radarResult.contacts,
        action.deltaSeconds,
        mission.commanderCoordinationModifier,
      );
      const commanderResult = advanceCommander(
        mission.commander,
        awareness,
        beliefMap,
        radarResult.radars,
        nextTimestamp,
        action.deltaSeconds,
        mission.commanderCoordinationModifier,
      );
      const operatorResult = advanceRadarOperators(
        commanderResult.radars,
        radarContacts,
        nextTimestamp,
        action.deltaSeconds,
        mission.commanderCoordinationModifier,
      );
      const modeEvents = operatorResult.changes.map((change) => ({
        ...createGameEvent(
          mission,
          "RADAR_MODE_CHANGED",
          { from: change.from, to: change.to, scores: change.scores },
          change.radarId,
        ),
        timestamp: nextTimestamp,
      }));
      const awarenessEvents = awareness.stage !== mission.awareness.stage
        ? [{
          ...createGameEvent(
            mission,
            "AWARENESS_STAGE_CHANGED",
            { from: mission.awareness.stage, to: awareness.stage, value: awareness.value },
            "AWARENESS_SYSTEM",
          ),
          timestamp: nextTimestamp,
        }]
        : [];
      const commanderEvents = commanderResult.orderChanged
        ? [{
          ...createGameEvent(
            mission,
            "COMMANDER_ORDER",
            { intent: commanderResult.commander.intent, scores: commanderResult.commander.utilityScores },
            "AIR_DEFENSE_COMMANDER",
          ),
          timestamp: nextTimestamp,
        }]
        : [];
      const attackEvents = autoAttack
        ? [{
          ...createGameEvent(
            mission,
            "ATTACK",
            { targetId: mission.target.id, position: mission.target.position, automatic: true },
            "F-117",
          ),
          timestamp: nextTimestamp,
        }]
        : [];
      const threatEvents = engagementResult.state.stage !== mission.engagement.stage
        ? [{
          ...createGameEvent(
            mission,
            "THREAT_STAGE_CHANGED",
            { from: mission.engagement.stage, to: engagementResult.state.stage },
            "THREAT_SYSTEM",
          ),
          timestamp: nextTimestamp,
        }]
        : [];
      const engagementEvents = [
        ...(engagementResult.missileLaunched
          ? [{ ...createGameEvent(mission, "MISSILE_LAUNCHED", {}, "AIR_DEFENSE_NETWORK"), timestamp: nextTimestamp }]
          : []),
        ...(engagementResult.missileDefeated
          ? [{ ...createGameEvent(mission, "MISSILE_DEFEATED", {}, "F-117"), timestamp: nextTimestamp }]
          : []),
        ...(engagementResult.aircraftHit
          ? [{ ...createGameEvent(mission, "AIRCRAFT_DESTROYED", {}, "AIR_DEFENSE_NETWORK"), timestamp: nextTimestamp }]
          : []),
      ];
      const aircraftDestroyed = engagementResult.aircraftHit;
      const extracted = target.destroyed
        && isInsideExtraction(aircraft.position, mission.extractionArea);
      const fuelExhausted = aircraft.fuelRemaining <= 0 && !extracted;
      const terminalStatus = aircraftDestroyed
        ? "FAILED"
        : extracted
          ? "SUCCESS"
          : fuelExhausted || result.routeCompleted ? "FAILED" : mission.status;
      const resultEvents = aircraftDestroyed
        ? [{
          ...createGameEvent(mission, "MISSION_FAILED", { reason: "AIRCRAFT_DESTROYED" }, "AIR_DEFENSE_NETWORK"),
          timestamp: nextTimestamp,
        }]
        : extracted
          ? [
            { ...createGameEvent(mission, "EXTRACTION", {}, "F-117"), timestamp: nextTimestamp },
            { ...createGameEvent(mission, "MISSION_SUCCESS"), timestamp: nextTimestamp },
          ]
          : fuelExhausted
          ? [
            { ...createGameEvent(mission, "FUEL_EXHAUSTED", {}, "F-117"), timestamp: nextTimestamp },
            { ...createGameEvent(mission, "MISSION_FAILED", { reason: "FUEL_EXHAUSTED" }, "F-117"), timestamp: nextTimestamp },
          ]
          : result.routeCompleted
          ? [{
            ...createGameEvent(
              mission,
              "MISSION_FAILED",
              { reason: target.destroyed ? "MISSED_EXTRACTION" : "TARGET_NOT_DESTROYED" },
            ),
            timestamp: nextTimestamp,
          }]
          : [];
      const tickEvents = [
        ...reachedEvents,
        ...contactEvents,
        ...awarenessEvents,
        ...commanderEvents,
        ...modeEvents,
        ...attackEvents,
        ...threatEvents,
        ...engagementEvents,
        ...completionEvents,
        ...resultEvents,
      ];
      return {
        ...state,
        status: aircraftDestroyed ? "DEFEAT" : state.status,
        currentMission: {
          ...mission,
          status: terminalStatus,
          elapsedMs: nextTimestamp,
          aircraft,
          flightPath: sampleFlightPath(mission, aircraft.position),
          route: result.route,
          target,
          weather,
          radars: operatorResult.radars,
          radarContacts,
          beliefMap,
          awareness,
          engagement: engagementResult.state,
          commander: commanderResult.commander,
          events: appendEvents(mission, tickEvents),
        },
      };
    }
    case "RESET": {
      const currentNode = state.campaign.nodes.find((node) => node.id === state.campaign.currentNodeId);
      if (!currentNode) return state;
      const resetMission = prepareCampaignMission(state, currentNode);
      return {
        ...state,
        currentMission: {
          ...resetMission,
          events: [createGameEvent(resetMission, "MISSION_RESET")],
        },
      };
    }
  }
}
