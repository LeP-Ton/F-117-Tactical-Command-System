import { gameConfig } from "../config/gameConfig";
import { advanceAutopilot } from "../domain/autopilot";
import { advanceBeliefMap, getBeliefPeak } from "../domain/beliefMap";
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
import {
  addWaypoint,
  moveWaypoint,
  removeWaypoint,
  reorderWaypoint,
} from "../domain/route";
import type { CampaignNode, MissionSession, RunState, Vector2 } from "../domain/types";

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
        .filter((candidate) => state.campaign.completedNodeIds.includes(candidate.id))
        .map((candidate) => candidate.type),
      enemyAlert: state.resources.enemyAlert,
      adaptationLevel: state.enemyState.adaptationLevel,
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
      const completedNodeIds = succeeded
        ? [...new Set([...state.campaign.completedNodeIds, currentNode.id])]
        : state.campaign.completedNodeIds;
      const outgoingIds = new Set(
        state.campaign.edges.filter((edge) => edge.from === currentNode.id).map((edge) => edge.to),
      );
      const nodes = state.campaign.nodes.map((node) => {
        if (node.id === currentNode.id) return { ...node, status: succeeded ? "COMPLETED" as const : "FAILED" as const };
        if (outgoingIds.has(node.id) && node.status === "LOCKED") return { ...node, status: "AVAILABLE" as const };
        return node;
      });
      const alertDelta = succeeded && currentNode.type === "SEAD" ? -8 : succeeded ? 2 : 10;
      const tacticalProfile = analyzeCompletedMission(state.enemyState.tacticalProfile, mission);
      const learnedFromMission = tacticalProfile.missionSamples > state.enemyState.tacticalProfile.missionSamples;
      return {
        ...state,
        status: succeeded && currentNode.type === "FINAL_STRIKE" ? "VICTORY" : state.status,
        campaign: { ...state.campaign, nodes, completedNodeIds, currentNodeId: undefined },
        resources: {
          ...state.resources,
          enemyAlert: Math.max(0, Math.min(100, state.resources.enemyAlert + alertDelta)),
          intelAccuracyBonus: Math.min(
            0.24,
            state.resources.intelAccuracyBonus
              + (succeeded && currentNode.type === "RECON" ? 0.06 : 0)
              + (succeeded && currentNode.type === "ELINT" ? 0.1 : 0),
          ),
        },
        enemyState: {
          ...state.enemyState,
          tacticalProfile,
          adaptationLevel: learnedFromMission
            ? Math.min(5, state.enemyState.adaptationLevel + 1)
            : state.enemyState.adaptationLevel,
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
        id: `wp-${mission.events.length + mission.route.waypoints.length}`,
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
          events: [...mission.events, event],
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
          events: [
            ...mission.events,
            createGameEvent(mission, "WAYPOINT_MOVED", { index: action.index }),
          ],
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
          events: [
            ...mission.events,
            createGameEvent(mission, "WAYPOINT_REMOVED", { index: action.index }),
          ],
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
          events: [
            ...mission.events,
            createGameEvent(mission, "WAYPOINT_REORDERED", {
              fromIndex: action.fromIndex,
              toIndex: action.toIndex,
            }),
          ],
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
          events: [...mission.events, createGameEvent(mission, "MISSION_STARTED")],
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
          events: [...mission.events, createGameEvent(mission, "MISSION_PAUSED")],
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
          events: [...mission.events, createGameEvent(mission, "MISSION_RESUMED")],
        },
      };
    }
    case "TICK": {
      if (mission.status !== "RUNNING") return state;
      const result = advanceAutopilot(mission.aircraft, mission.route, action.deltaSeconds);
      const nextTimestamp = mission.elapsedMs + action.deltaSeconds * 1000;
      const autoAttack = canAttackTarget({ ...mission, aircraft: result.aircraft });
      const target = autoAttack ? { ...mission.target, destroyed: true } : mission.target;
      const radarResult = advanceRadarSensors(
        mission.seed,
        mission.radars,
        result.aircraft,
        mission.terrain,
        mission.weather,
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
      const beliefEvents = radarResult.contacts.length > 0
        ? [{
          ...createGameEvent(
            mission,
            "BELIEF_UPDATED",
            { contactCount: radarResult.contacts.length, peak: getBeliefPeak(beliefMap) },
            "BELIEF_SYSTEM",
          ),
          timestamp: nextTimestamp,
        }]
        : [];
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
      const aircraft = result.aircraft;
      const extracted = target.destroyed
        && isInsideExtraction(aircraft.position, mission.extractionArea);
      const terminalStatus = aircraftDestroyed
        ? "FAILED"
        : extracted
          ? "SUCCESS"
          : result.routeCompleted ? "FAILED" : mission.status;
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
      const missionResult = terminalStatus === "SUCCESS" || terminalStatus === "FAILED"
        ? [{ missionId: mission.id, outcome: terminalStatus === "SUCCESS" ? "SUCCESS" as const : "FAILED" as const }]
        : [];
      return {
        ...state,
        status: aircraftDestroyed ? "DEFEAT" : state.status,
        missionHistory: [...state.missionHistory, ...missionResult],
        currentMission: {
          ...mission,
          status: terminalStatus,
          elapsedMs: nextTimestamp,
          aircraft,
          route: result.route,
          target,
          radars: operatorResult.radars,
          radarContacts,
          beliefMap,
          awareness,
          engagement: engagementResult.state,
          commander: commanderResult.commander,
          events: [
            ...mission.events,
            ...reachedEvents,
            ...contactEvents,
            ...beliefEvents,
            ...awarenessEvents,
            ...commanderEvents,
            ...modeEvents,
            ...attackEvents,
            ...threatEvents,
            ...engagementEvents,
            ...completionEvents,
            ...resultEvents,
          ],
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
