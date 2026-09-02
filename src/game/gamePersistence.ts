import { syncEventSequenceFromRun } from "../domain/factories";
import { campaignBalance } from "../domain/campaignBalance";
import type { MissionDebrief, MissionSession, RunState } from "../domain/types";

export const RUN_SAVE_KEY = "f117-tactical-command-system:run:v1";
const SAVE_VERSION = 1;

interface SavedRun {
  version: number;
  savedAt: number;
  state: RunState;
}

function isRunState(value: unknown): value is RunState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<RunState>;
  return typeof state.seed === "string"
    && (state.status === "ACTIVE" || state.status === "VICTORY" || state.status === "DEFEAT")
    && Boolean(state.campaign && Array.isArray(state.campaign.nodes))
    && Boolean(state.resources && state.enemyState)
    && (!state.currentMission || Boolean(state.currentMission.route && state.currentMission.aircraft));
}

export function saveRunProgress(state: RunState): void {
  try {
    const payload: SavedRun = { version: SAVE_VERSION, savedAt: Date.now(), state };
    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(payload));
  } catch {
    // 隐私模式、容量不足或存储被禁用时保持游戏可运行。
  }
}

function restoreMissionCompatibility(mission: MissionSession, scanRateModifier: number): MissionSession {
  // v1 旧存档可能仍包含已经移除的 intelAccuracy；显式剥离，避免下次保存继续携带废弃字段。
  const { intelAccuracy: _legacyIntelAccuracy, ...currentMission } = mission as MissionSession & {
    intelAccuracy?: number;
  };
  return {
    ...currentMission,
    radarScanRateModifier: mission.radarScanRateModifier ?? scanRateModifier,
  };
}

export function loadRunProgress(): RunState | undefined {
  try {
    const raw = window.localStorage.getItem(RUN_SAVE_KEY);
    if (!raw) return undefined;
    const payload = JSON.parse(raw) as Partial<SavedRun>;
    if (payload.version !== SAVE_VERSION || !isRunState(payload.state)) return undefined;
    const legacyStatus = (payload.state.currentMission as { status?: string } | undefined)?.status;
    const completedStrikeCount = payload.state.campaign.nodes
      .filter((node) => node.type === "STRIKE" && node.status === "COMPLETED").length;
    const radarScanRateModifier = payload.state.enemyState.radarScanRateModifier
      ?? Math.max(
        campaignBalance.radarScanRateFloor,
        campaignBalance.strikeRadarScanRateMultiplier ** completedStrikeCount,
      );
    const missionDebriefs = Object.fromEntries(
      Object.entries(payload.state.missionDebriefs ?? {}).map(([nodeId, debrief]) => [
        nodeId,
        {
          ...debrief,
          mission: restoreMissionCompatibility(debrief.mission, debrief.mission.radarScanRateModifier ?? 1),
        } satisfies MissionDebrief,
      ]),
    );
    const restored: RunState = {
      ...payload.state,
      campaign: {
        ...payload.state.campaign,
        nodes: payload.state.campaign.nodes.map((node) => ({
          ...node,
          preview: {
            radarDensity: node.preview.radarDensity,
            weather: node.preview.weather,
            effect: node.preview.effect,
          },
        })),
      },
      resources: { enemyAlert: payload.state.resources.enemyAlert },
      enemyState: { ...payload.state.enemyState, radarScanRateModifier },
      missionDebriefs,
      // 旧版暂停存档直接恢复执行；新版本刷新运行中任务也不再制造暂停状态。
      currentMission: legacyStatus === "PAUSED"
        ? { ...restoreMissionCompatibility(payload.state.currentMission!, radarScanRateModifier), status: "RUNNING" }
        : payload.state.currentMission
          ? restoreMissionCompatibility(payload.state.currentMission, radarScanRateModifier)
          : undefined,
    };
    syncEventSequenceFromRun(restored);
    return restored;
  } catch {
    return undefined;
  }
}
