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
  INTEL: "根据当前情报权限补齐雷达识别或授权完整敌方态势",
  STRIKE: "打击敌雷达保障节点，降低后续雷达扫描速率",
  SEAD: "压制敌防空节点，缩小后续雷达覆盖范围",
  COMMAND_STRIKE: "打击敌指挥链，削弱后续协同搜索与联合跟踪能力",
  FINAL_STRIKE: "对最终目标实施纵深精确打击",
};

export type MissionEffectKey = Exclude<MissionNodeType, "INTEL">
  | "INTEL_GENERIC"
  | "INTEL_1"
  | "INTEL_2"
  | "INTEL_2_CONDITIONAL"
  | "INTEL_2_RECOVERY";

export type IntelEffectContext = "STANDARD" | "CONDITIONAL" | "RECOVERY";

/** 将任务类型与当前 INTEL 奖励层级转换为稳定语义键，供任意语言的界面共同消费。 */
export function getMissionEffectKey(
  type: MissionNodeType,
  rewardLevel?: 1 | 2,
  intelContext: IntelEffectContext = "STANDARD",
): MissionEffectKey {
  if (type !== "INTEL") return type;
  if (intelContext === "CONDITIONAL") return "INTEL_2_CONDITIONAL";
  if (intelContext === "RECOVERY") return "INTEL_2_RECOVERY";
  if (rewardLevel === 1) return "INTEL_1";
  if (rewardLevel === 2) return "INTEL_2";
  return "INTEL_GENERIC";
}

/**
 * INTEL 奖励取决于此前实际完成次数，而不是节点位于任务网络中的顺序。
 * 不传 rewardLevel 时返回适合静态节点元数据的通用说明。
 */
export function getMissionEffectDescription(
  type: MissionNodeType,
  rewardLevel?: 1 | 2,
  intelContext: IntelEffectContext = "STANDARD",
): string {
  const key = getMissionEffectKey(type, rewardLevel, intelContext);
  if (key === "INTEL_1") return "补齐后续任务全部雷达，并精确核实坐标与型号";
  if (key === "INTEL_2") return "授权全域情报，开放真实雷达覆盖与完整敌方态势";
  if (key === "INTEL_2_CONDITIONAL") return "完成前序情报行动后授权全域情报；若前序缺失则降为一级情报核实";
  if (key === "INTEL_2_RECOVERY") return "补录一级情报，核实全部雷达坐标与型号；本次任务网络无法再授权全域情报";
  if (key === "INTEL_GENERIC") return missionEffectDescriptions.INTEL;
  return missionEffectDescriptions[key];
}

export function getMissionAlertDelta(succeeded: boolean): number {
  return succeeded ? campaignBalance.successAlertDelta : campaignBalance.failureAlertDelta;
}
