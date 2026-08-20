import { gameConfig } from "../config/gameConfig";
import type { MissionSession, PersistentEnemyState, PlayerTacticalProfile, RadarState, Vector2 } from "./types";

export function createPlayerTacticalProfile(): PlayerTacticalProfile {
  return {
    missionSamples: 0,
    terrainMaskingPreference: 0,
    southernRouteBias: 0.5,
    aggressiveRouting: 0,
  };
}

export function getAdaptationLevel(profile: PlayerTacticalProfile): number {
  return Math.min(5, profile.missionSamples);
}

function distance(first: Vector2, second: Vector2): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function blend(previous: number, observed: number, previousSamples: number): number {
  return (previous * previousSamples + observed) / (previousSamples + 1);
}

/** 任务结束后只分析按位移采样的真实已飞轨迹，不读取未执行航点。 */
export function analyzeCompletedMission(
  profile: PlayerTacticalProfile,
  mission: MissionSession,
): PlayerTacticalProfile {
  const flownPoints = mission.flightPath;
  if (flownPoints.length < 2) return profile;

  const terrainPoints = flownPoints.filter((point) => mission.terrain.some((zone) =>
    point.x >= zone.x && point.x <= zone.x + zone.width
      && point.y >= zone.y && point.y <= zone.y + zone.height)).length;
  const terrainPreference = terrainPoints / flownPoints.length;
  const southernBias = flownPoints.reduce((sum, point) => sum + point.y / gameConfig.world.height, 0) / flownPoints.length;
  const flownDistance = flownPoints.slice(1).reduce(
    (sum, point, index) => sum + distance(flownPoints[index]!, point),
    0,
  );
  const directDistance = distance(flownPoints[0]!, flownPoints.at(-1)!);
  const aggressiveRouting = flownDistance === 0 ? 0 : Math.min(1, directDistance / flownDistance);
  const samples = profile.missionSamples;

  return {
    missionSamples: samples + 1,
    terrainMaskingPreference: blend(profile.terrainMaskingPreference, terrainPreference, samples),
    southernRouteBias: blend(profile.southernRouteBias, southernBias, samples),
    aggressiveRouting: blend(profile.aggressiveRouting, aggressiveRouting, samples),
  };
}

function clampPosition(position: Vector2): Vector2 {
  return {
    x: Math.max(80, Math.min(gameConfig.world.width - 80, position.x)),
    y: Math.max(80, Math.min(gameConfig.world.height - 80, position.y)),
  };
}

function moveRadar(radar: RadarState, target: Vector2, strength: number): RadarState {
  return {
    ...radar,
    position: clampPosition({
      x: radar.position.x + (target.x - radar.position.x) * strength,
      y: radar.position.y + (target.y - radar.position.y) * strength,
    }),
  };
}

function moveNearestRadar(
  radars: RadarState[],
  target: Vector2,
  strength: number,
  usedRadarIds: Set<string>,
): void {
  const radar = radars
    .filter((candidate) => !usedRadarIds.has(candidate.id))
    .sort((first, second) => distance(first.position, target) - distance(second.position, target))[0];
  if (!radar) return;
  const index = radars.findIndex((candidate) => candidate.id === radar.id);
  radars[index] = moveRadar(radar, target, strength);
  usedRadarIds.add(radar.id);
}

/** 根据跨任务画像调整后续部署；只使用历史汇总值和新任务生成内容。 */
export function applyEnemyCounterDeployment(
  mission: MissionSession,
  enemyState: PersistentEnemyState,
): MissionSession {
  const profile = enemyState.tacticalProfile;
  if (profile.missionSamples === 0 || mission.radars.length === 0) {
    return { ...mission, adaptationNotes: [] };
  }

  const radars = [...mission.radars];
  const notes: string[] = [];
  const strength = Math.min(0.42, 0.12 + getAdaptationLevel(profile) * 0.06);
  const usedRadarIds = new Set<string>();

  const primaryTerrain = mission.terrain[0];
  if (profile.terrainMaskingPreference >= 0.35 && primaryTerrain) {
    const exit = { x: primaryTerrain.x + primaryTerrain.width, y: primaryTerrain.y + primaryTerrain.height / 2 };
    moveNearestRadar(radars, exit, strength, usedRadarIds);
    notes.push("山地出口增设搜索覆盖");
  }

  if (Math.abs(profile.southernRouteBias - 0.5) >= 0.08) {
    const corridorY = profile.southernRouteBias * gameConfig.world.height;
    moveNearestRadar(radars, { x: gameConfig.world.width * 0.58, y: corridorY }, strength, usedRadarIds);
    notes.push(profile.southernRouteBias > 0.5 ? "南部航路搜索加强" : "北部航路搜索加强");
  }

  if (profile.aggressiveRouting >= 0.72) {
    const directAxis = {
      x: (mission.route.waypoints[0]!.position.x + mission.target.position.x) / 2,
      y: (mission.route.waypoints[0]!.position.y + mission.target.position.y) / 2,
    };
    moveNearestRadar(radars, directAxis, strength, usedRadarIds);
    notes.push("直达目标轴线增加拦截覆盖");
  }

  return { ...mission, radars, adaptationNotes: notes };
}
