export interface Vector2 {
  x: number;
  y: number;
}

export type RunStatus = "ACTIVE" | "VICTORY" | "DEFEAT";
export type MissionStatus = "PLANNING" | "RUNNING" | "PAUSED" | "SUCCESS" | "FAILED";

export type MissionNodeType = "STRIKE" | "RECON" | "ELINT" | "SEAD" | "COMMAND_STRIKE" | "DEEP_STRIKE" | "FINAL_STRIKE";
export type CampaignNodeStatus = "AVAILABLE" | "LOCKED" | "COMPLETED" | "FAILED";

export interface CampaignNode {
  id: string;
  type: MissionNodeType;
  status: CampaignNodeStatus;
  layer: number;
  position: Vector2;
  missionSeed: string;
  preview: {
    radarDensity: number;
    weather: string;
    intelAccuracy: number;
    doctrine: CommanderDoctrine;
    effect: string;
  };
}

export interface CampaignEdge {
  from: string;
  to: string;
}

export interface CampaignState {
  seed: string;
  currentNodeId?: string;
  completedNodeIds: string[];
  nodes: CampaignNode[];
  edges: CampaignEdge[];
}

export interface PlayerBuild {
  moduleIds: string[];
}

export type ModuleArchetype = "GHOST" | "INTELLIGENCE" | "DECEPTION" | "RISK";

export interface TacticalModule {
  id: string;
  name: string;
  archetype: ModuleArchetype;
  description: string;
}

export interface RunResources {
  airframeCondition: number;
  intel: number;
  enemyAlert: number;
  intelAccuracyBonus: number;
}

export interface PersistentEnemyState {
  adaptationLevel: number;
  radarCoverageModifier: number;
  commanderCoordinationModifier: number;
  tacticalProfile: PlayerTacticalProfile;
}

/** 只由已经执行过的任务更新，不读取当前任务的未来航线。 */
export interface PlayerTacticalProfile {
  missionSamples: number;
  terrainMaskingPreference: number;
  southernRouteBias: number;
  aggressiveRouting: number;
  contactTolerance: number;
}

export interface MissionResult {
  missionId: string;
  outcome: "SUCCESS" | "FAILED" | "ABORTED";
}

export interface Waypoint {
  id: string;
  position: Vector2;
  kind: "INSERTION" | "NAVIGATION";
  status: "LOCKED" | "PENDING" | "COMPLETED";
}

export interface RouteState {
  waypoints: Waypoint[];
  activeWaypointIndex: number;
}

export interface AircraftState {
  position: Vector2;
  headingDegrees: number;
  speed: number;
}

export interface TerrainZone {
  id: string;
  kind: "MOUNTAIN";
  x: number;
  y: number;
  width: number;
  height: number;
  maskingFactor: number;
}

export interface WeatherZone {
  id: string;
  kind: "CLOUD" | "STORM";
  x: number;
  y: number;
  width: number;
  height: number;
  detectionFactor: number;
}

export interface RadarState {
  id: string;
  position: Vector2;
  range: number;
  sweepAngleDegrees: number;
  scanAccumulatorSeconds: number;
  scanCount: number;
  active: boolean;
  operator: RadarOperatorState;
}

export type RadarOperatorMode = "WIDE_SEARCH" | "SECTOR_SEARCH" | "FOCUSED_TRACK" | "SHUTDOWN";

export type RadarUtilityScores = Record<RadarOperatorMode, number>;

export interface RadarOperatorState {
  mode: RadarOperatorMode;
  utilityScores: RadarUtilityScores;
  decisionAccumulatorSeconds: number;
  modeChangedAt: number;
  lastShutdownAt?: number;
  lastContactAt?: number;
  focusBearingDegrees?: number;
  commanderBias: RadarUtilityScores;
}

export interface RadarContact {
  id: string;
  radarId: string;
  timestamp: number;
  estimatedPosition: Vector2;
  confidence: number;
  signalStrength: number;
  errorRadius: number;
}

export type RadarIntelLevel = "CONFIRMED" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";

/** 玩家在任务开始前获得的雷达情报；它只保存估计值，不泄露敌方实时状态。 */
export interface RadarIntelReport {
  radarId: string;
  level: RadarIntelLevel;
  confidence: number;
  estimatedPosition?: Vector2;
  positionErrorRadius: number;
  estimatedRange?: number;
}

export interface BeliefObservation {
  position: Vector2;
  timestamp: number;
  radarId: string;
  confidence: number;
  errorRadius: number;
}

export interface BeliefMapState {
  gridSize: number;
  probabilities: number[];
  propagationAccumulatorSeconds: number;
  estimatedVelocity: Vector2;
  lastObservation?: BeliefObservation;
  recentObservations: BeliefObservation[];
  lastEvidenceAt?: number;
  lastUpdatedAt: number;
}

export type AwarenessStage = "CALM" | "SUSPICIOUS" | "SEARCHING" | "HUNTING";

export interface AwarenessState {
  value: number;
  stage: AwarenessStage;
}

export type ThreatStage = "UNDETECTED" | "SUSPECTED" | "TRACKED" | "LOCKED" | "MISSILE_INBOUND";

export interface EngagementState {
  stage: ThreatStage;
  trackProgress: number;
  missileTimeRemainingSeconds?: number;
  launches: number;
  hits: number;
}

export type CommanderIntent = "MONITOR" | "COORDINATED_SEARCH" | "CONCENTRATE_SEARCH" | "NETWORK_SILENCE";
export type CommanderUtilityScores = Record<CommanderIntent, number>;

export interface CommanderState {
  doctrine: CommanderDoctrine;
  intent: CommanderIntent;
  utilityScores: CommanderUtilityScores;
  decisionAccumulatorSeconds: number;
  lastDecisionAt: number;
  targetPosition?: Vector2;
}

export type CommanderDoctrine = "CONSERVATIVE" | "AGGRESSIVE" | "AMBUSH" | "ANALYTICAL";

export interface MissionTarget {
  id: string;
  position: Vector2;
  attackRadius: number;
  destroyed: boolean;
}

export interface ExtractionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type GameEventType =
  | "WAYPOINT_ADDED"
  | "WAYPOINT_MOVED"
  | "WAYPOINT_REMOVED"
  | "WAYPOINT_REORDERED"
  | "MISSION_STARTED"
  | "MISSION_PAUSED"
  | "MISSION_RESUMED"
  | "MISSION_RESET"
  | "WAYPOINT_REACHED"
  | "ROUTE_COMPLETED"
  | "RADAR_CONTACT"
  | "RADAR_MODE_CHANGED"
  | "BELIEF_UPDATED"
  | "AWARENESS_STAGE_CHANGED"
  | "COMMANDER_ORDER"
  | "ATTACK"
  | "EXTRACTION"
  | "MISSION_SUCCESS"
  | "MISSION_FAILED"
  | "BUILD_CHOICE"
  | "FALSE_CONTACT"
  | "THREAT_STAGE_CHANGED"
  | "MISSILE_LAUNCHED"
  | "MISSILE_DEFEATED"
  | "AIRCRAFT_HIT";

export interface GameEvent {
  id: string;
  timestamp: number;
  missionId: string;
  type: GameEventType;
  source?: string;
  data: Record<string, unknown>;
}

export interface MissionSession {
  id: string;
  seed: string;
  status: MissionStatus;
  elapsedMs: number;
  aircraft: AircraftState;
  route: RouteState;
  terrain: TerrainZone[];
  weather: WeatherZone[];
  radars: RadarState[];
  radarIntel: RadarIntelReport[];
  radarContacts: RadarContact[];
  beliefMap: BeliefMapState;
  awareness: AwarenessState;
  engagement: EngagementState;
  commander: CommanderState;
  target: MissionTarget;
  extractionArea: ExtractionArea;
  weaponsRemaining: number;
  intelAccuracy: number;
  generationInfo: {
    terrainCount: number;
    radarCount: number;
    weatherCount: number;
  };
  detectionModifier: number;
  contactLifetimeMultiplier: number;
  falseContactCharges: number;
  threatPredictionEnabled: boolean;
  commanderCoordinationModifier: number;
  adaptationNotes: string[];
  finalStrikeNotes: string[];
  events: GameEvent[];
}

export interface RunState {
  seed: string;
  campaign: CampaignState;
  playerBuild: PlayerBuild;
  resources: RunResources;
  enemyState: PersistentEnemyState;
  missionHistory: MissionResult[];
  pendingRewardIds: string[];
  currentMission?: MissionSession;
  status: RunStatus;
}
