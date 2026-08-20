export interface Vector2 {
  x: number;
  y: number;
}

export type RunStatus = "ACTIVE" | "VICTORY" | "DEFEAT";
export type MissionStatus = "PLANNING" | "RUNNING" | "PAUSED" | "SUCCESS" | "FAILED";

export type MissionNodeType = "INTEL" | "STRIKE" | "SEAD" | "COMMAND_STRIKE" | "FINAL_STRIKE";
export type CampaignNodeStatus = "AVAILABLE" | "LOCKED" | "COMPLETED" | "FAILED" | "EXPIRED";

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
  nodes: CampaignNode[];
  edges: CampaignEdge[];
}

export interface RunResources {
  enemyAlert: number;
  /** 跨任务积累的情报质量加成，直接影响后续雷达情报准确度。 */
  intelAccuracyBonus: number;
}

export interface PersistentEnemyState {
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
  /** 剩余可飞行距离，单位与地图坐标一致。 */
  fuelRemaining: number;
  fuelCapacity: number;
}

export interface TerrainZone {
  id: string;
  kind: "MOUNTAIN";
  x: number;
  y: number;
  width: number;
  height: number;
  detectionFactor: number;
}

export type WeatherKind = "CLOUD" | "RAIN" | "STORM" | "FOG";

/** 动态天气单元；当前位置由任务时间和 Seed 生成的演化参数确定。 */
export interface WeatherCell {
  id: string;
  kind: WeatherKind;
  initialKind: WeatherKind;
  x: number;
  y: number;
  width: number;
  height: number;
  detectionFactor: number;
  origin: Vector2;
  baseSize: { width: number; height: number };
  velocity: Vector2;
  baseIntensity: number;
  phaseSeconds: number;
  evolutionPeriodSeconds: number;
}

export interface WeatherForecast {
  weatherId: string;
  horizonSeconds: number;
  kind: WeatherKind;
  estimatedPosition: Vector2;
  estimatedSize: { width: number; height: number };
  intensityTrend: "增强" | "稳定" | "减弱";
  confidence: "高" | "中" | "低";
}

export interface RadarState {
  id: string;
  position: Vector2;
  range: number;
  sweepAngleDegrees: number;
  scanAccumulatorSeconds: number;
  scanCount: number;
  operator: RadarOperatorState;
}

export type RadarOperatorMode = "WIDE_SEARCH" | "SECTOR_SEARCH" | "FOCUSED_TRACK";

export type RadarUtilityScores = Record<RadarOperatorMode, number>;

export interface RadarOperatorState {
  mode: RadarOperatorMode;
  utilityScores: RadarUtilityScores;
  decisionAccumulatorSeconds: number;
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
}

export type CommanderIntent = "MONITOR" | "COORDINATED_SEARCH" | "CONCENTRATE_SEARCH";
export type CommanderUtilityScores = Record<CommanderIntent, number>;

export interface CommanderState {
  intent: CommanderIntent;
  utilityScores: CommanderUtilityScores;
  decisionAccumulatorSeconds: number;
  targetPosition?: Vector2;
}

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
  | "AWARENESS_STAGE_CHANGED"
  | "COMMANDER_ORDER"
  | "ATTACK"
  | "EXTRACTION"
  | "MISSION_SUCCESS"
  | "MISSION_FAILED"
  | "THREAT_STAGE_CHANGED"
  | "MISSILE_LAUNCHED"
  | "MISSILE_DEFEATED"
  | "AIRCRAFT_DESTROYED"
  | "FUEL_EXHAUSTED";

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
  /** 按最小位移采样的真实已飞轨迹，仅在任务结束后用于跨任务画像。 */
  flightPath: Vector2[];
  route: RouteState;
  terrain: TerrainZone[];
  weather: WeatherCell[];
  weatherForecast: WeatherForecast[];
  radars: RadarState[];
  radarIntel: RadarIntelReport[];
  radarContacts: RadarContact[];
  beliefMap: BeliefMapState;
  awareness: AwarenessState;
  engagement: EngagementState;
  commander: CommanderState;
  target: MissionTarget;
  extractionArea: ExtractionArea;
  intelAccuracy: number;
  commanderCoordinationModifier: number;
  adaptationNotes: string[];
  finalStrikeNotes: string[];
  events: GameEvent[];
}

export interface RunState {
  seed: string;
  campaign: CampaignState;
  resources: RunResources;
  enemyState: PersistentEnemyState;
  currentMission?: MissionSession;
  status: RunStatus;
}
