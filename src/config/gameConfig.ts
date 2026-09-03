export const gameConfig = {
  world: {
    width: 1000,
    height: 1000,
    gridStep: 100,
  },
  aircraft: {
    speed: 3.6,
    /** 满油航程等于 1000×1000 地图两条边的总长度。 */
    fuelCapacityDistance: 2000,
    waypointArrivalRadius: 5,
  },
  loop: {
    maxDeltaSeconds: 0.05,
  },
  interaction: {
    waypointHitRadius: 18,
  },
  radar: {
    baseDetectionProbability: 0.46,
    contactLifetimeMs: 8000,
    minErrorRadius: 16,
    maxErrorRadius: 85,
    operatorDecisionIntervalSeconds: 0.5,
    focusedContactMemoryMs: 4500,
    // 活动 Contact 只保留 8 秒，扇区搜索记忆与该事实来源保持一致。
    sectorContactMemoryMs: 8000,
    sharedContactMemoryMs: 4500,
  },
  /** Tier 0 有限情报使用固定规则，逐雷达差异仍由 Mission Seed 确定生成。 */
  intel: {
    revealProbability: 0.9,
    confidenceRange: [0.6, 0.88] as const,
    positionErrorRadiusRange: [50, 70] as const,
    rangeErrorRatio: 0.08,
  },
  belief: {
    gridSize: 24,
    propagationIntervalSeconds: 0.25,
    diffusionRate: 0.16,
    decayRate: 0.992,
    evidencePersistence: 0.42,
    maxEstimatedSpeed: 18,
    velocityObservationWindowMs: 12000,
    velocityMinimumSpanMs: 1000,
    velocitySmoothing: 0.3,
    velocityDecayRate: 0.94,
    maximumObservationCount: 48,
    maximumBeliefAgeMs: 12000,
    minimumPeakProbability: 0.003,
    minimumTotalProbability: 0.03,
    heatmapReferencePeakProbability: 0.05,
    heatmapReferenceTotalProbability: 0.3,
    heatmapValidOpacityFloor: 0.45,
    heatmapInvalidOpacityMultiplier: 0.18,
    heatmapMinimumOpacity: 0.02,
  },
  awareness: {
    contactGain: 16,
    signalGain: 7,
    decayPerSecond: 0.22,
    suspiciousThreshold: 18,
    searchingThreshold: 42,
    huntingThreshold: 72,
  },
  commander: {
    decisionIntervalSeconds: 1,
    maximumBearingErrorDegrees: 32,
  },
  engagement: {
    suspectedThreshold: 16,
    trackedThreshold: 42,
    lockedThreshold: 72,
    launchThreshold: 100,
    contactGain: 12,
    decayPerSecond: 14,
    missileGuidanceBreakThreshold: 32,
    missileFlightSeconds: 8,
  },
  mission: {
    attackRadius: 58,
    attackAwarenessGain: 34,
    extractionArea: { x: 850, y: 30, width: 120, height: 120 },
    /** 雷达中心与撤离区边界的最小部署间距；探测范围仍可覆盖撤离区。 */
    extractionRadarClearance: 80,
  },
  initialSeed: "ZERO-RETURN-001",
} as const;
