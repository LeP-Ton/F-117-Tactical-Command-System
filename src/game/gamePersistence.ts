import { syncEventSequenceFromRun } from "../domain/factories";
import { campaignBalance } from "../domain/campaignBalance";
import type { MissionDebrief, MissionSession, RunState } from "../domain/types";
import { gameConfig } from "../config/gameConfig";

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
    && Boolean(state.enemyState)
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
  // v1 旧存档可能仍包含已移除的情报质量与敌方升级字段；显式剥离，避免下次保存继续携带废弃状态。
  const {
    intelAccuracy: _legacyIntelAccuracy,
    flightPath: _legacyFlightPath,
    adaptationNotes: _legacyAdaptationNotes,
    ...currentMission
  } = mission as MissionSession & {
    intelAccuracy?: number;
    flightPath?: unknown;
    adaptationNotes?: unknown;
  };
  return {
    ...currentMission,
    radarScanRateModifier: mission.radarScanRateModifier ?? scanRateModifier,
    finalStrikeNotes: (currentMission.finalStrikeNotes ?? []).filter((note) => !isRemovedEnemyEscalationNote(note)),
    // 固定任务区域属于当前规则配置，恢复旧存档时同步迁移，避免画面与撤离判定继续使用旧尺寸。
    extractionArea: { ...gameConfig.mission.extractionArea },
  };
}

/** 旧存档中的警戒与航迹适应简报不再属于当前规则，恢复时统一清理。 */
function isRemovedEnemyEscalationNote(note: string): boolean {
  return /^(?:低 Enemy Alert|敌方警戒较低|Enemy Alert \d+|敌方警戒 \d+)：/.test(note)
    || note === "历史航迹未形成高可信反制画像"
    || /^(?:南部|北部)历史航路部署自适应截击雷达$/.test(note);
}

export function loadRunProgress(): RunState | undefined {
  try {
    const raw = window.localStorage.getItem(RUN_SAVE_KEY);
    if (!raw) return undefined;
    const payload = JSON.parse(raw) as Partial<SavedRun>;
    if (payload.version !== SAVE_VERSION || !isRunState(payload.state)) return undefined;
    const legacyState = payload.state as RunState & {
      resources?: unknown;
      enemyState: RunState["enemyState"] & { adaptationLevel?: number; tacticalProfile?: unknown };
    };
    const legacyStatus = (legacyState.currentMission as { status?: string } | undefined)?.status;
    const completedStrikeCount = legacyState.campaign.nodes
      .filter((node) => node.type === "STRIKE" && node.status === "COMPLETED").length;
    const radarScanRateModifier = legacyState.enemyState.radarScanRateModifier
      ?? Math.max(
        campaignBalance.radarScanRateFloor,
        campaignBalance.strikeRadarScanRateMultiplier ** completedStrikeCount,
      );
    const missionDebriefs = Object.fromEntries(
      Object.entries(legacyState.missionDebriefs ?? {}).map(([nodeId, debrief]) => [
        nodeId,
        {
          ...debrief,
          mission: restoreMissionCompatibility(debrief.mission, debrief.mission.radarScanRateModifier ?? 1),
        } satisfies MissionDebrief,
      ]),
    );
    const { resources: _legacyResources, ...currentState } = legacyState;
    const {
      adaptationLevel: _legacyAdaptationLevel,
      tacticalProfile: _legacyTacticalProfile,
      ...currentEnemyState
    } = legacyState.enemyState;
    const restored: RunState = {
      ...currentState,
      campaign: {
        ...legacyState.campaign,
        nodes: legacyState.campaign.nodes.map((node) => ({
          ...node,
          preview: {
            radarDensity: node.preview.radarDensity,
            weather: node.preview.weather,
            effect: node.preview.effect,
          },
        })),
      },
      enemyState: { ...currentEnemyState, radarScanRateModifier },
      missionDebriefs,
      // 旧版暂停存档直接恢复执行；新版本刷新运行中任务也不再制造暂停状态。
      currentMission: legacyStatus === "PAUSED"
        ? { ...restoreMissionCompatibility(legacyState.currentMission!, radarScanRateModifier), status: "RUNNING" }
        : legacyState.currentMission
          ? restoreMissionCompatibility(legacyState.currentMission, radarScanRateModifier)
          : undefined,
    };
    syncEventSequenceFromRun(restored);
    return restored;
  } catch {
    return undefined;
  }
}
