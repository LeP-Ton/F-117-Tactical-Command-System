import type { MissionSession, TacticalModule } from "../domain/types";

/**
 * 当前产品聚焦纯动态航线规划，因此正式奖励池保持为空。
 * 后续只需向该注册表添加模块，现有奖励生成、Build 持久化和任务应用流程即可复用。
 */
export const tacticalModules: TacticalModule[] = [];

export function getModule(moduleId: string): TacticalModule | undefined {
  return tacticalModules.find((module) => module.id === moduleId);
}

export function applyBuildToMission(mission: MissionSession, moduleIds: string[]): MissionSession {
  const has = (id: string) => moduleIds.includes(id);
  return {
    ...mission,
    detectionModifier: has("LOW_OBSERVABLE_MAINTENANCE") ? 0.82 : 1,
    contactLifetimeMultiplier: has("SIGNAL_HISTORY") ? 1.75 : 1,
    falseContactCharges: has("FALSE_CONTACT_GENERATOR") ? 1 : 0,
    threatPredictionEnabled: has("THREAT_PREDICTION"),
    terrain: has("TERRAIN_ANALYSIS")
      ? mission.terrain.map((terrain) => ({ ...terrain, maskingFactor: terrain.maskingFactor * 0.82 }))
      : mission.terrain,
    target: has("PRECISION_NAVIGATION")
      ? { ...mission.target, attackRadius: mission.target.attackRadius + 24 }
      : mission.target,
  };
}
