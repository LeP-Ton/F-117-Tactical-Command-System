import type { MissionNodeType } from "./types";

/** 任务网络的持久收益参数集中在此处，避免结算、最终战与说明文案各自维护数值。 */
export const campaignBalance = {
  /** 两级情报权限各由一次 INTEL 解锁，任务网络不得生成没有新奖励的第三次行动。 */
  maxIntelMissions: 2,
  successAlertDelta: 2,
  failureAlertDelta: 10,
  seadRadarCoverageMultiplier: 0.9,
  radarCoverageFloor: 0.55,
  commandCoordinationMultiplier: 0.65,
  commanderCoordinationFloor: 0.45,
  strikeRadarScanRateMultiplier: 0.9,
  radarScanRateFloor: 0.65,
  failedMissionAdaptationWeight: 0.5,
  successfulMissionAdaptationWeight: 1,
} as const;

export const missionEffectDescriptions: Record<MissionNodeType, string> = {
  INTEL: "核实后续任务全部雷达坐标与型号",
  STRIKE: "打击敌雷达保障节点，降低后续雷达扫描速率",
  SEAD: "压制敌防空节点，缩小后续雷达覆盖范围",
  COMMAND_STRIKE: "打击敌指挥链，削弱后续协同搜索与联合跟踪能力",
  FINAL_STRIKE: "对最终目标实施纵深精确打击",
};

/** INTEL 的两次行动授予不同权限，不能使用同一条笼统奖励说明。 */
export function getMissionEffectDescription(type: MissionNodeType, intelOrdinal = 1): string {
  if (type !== "INTEL") return missionEffectDescriptions[type];
  return intelOrdinal >= 2
    ? "授权 TOTAL INTEL，开放真实雷达覆盖与完整敌方态势"
    : missionEffectDescriptions.INTEL;
}

export function getMissionAlertDelta(succeeded: boolean): number {
  return succeeded ? campaignBalance.successAlertDelta : campaignBalance.failureAlertDelta;
}
