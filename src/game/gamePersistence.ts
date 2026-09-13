import { gameConfig } from "../config/gameConfig";
import { syncEventSequenceFromRun } from "../domain/factories";
import { campaignBalance } from "../domain/campaignBalance";
import type { MissionDebrief, MissionSession, RunState } from "../domain/types";
import { generateExtractionArea } from "../procedural/missionGenerator";
import { prepareCampaignMission } from "./gameReducer";

export const RUN_SAVE_KEY = "f117-tactical-command-system:run:v1";
const SAVE_VERSION = 2;
const SUPPORTED_SAVE_VERSIONS = new Set([1, SAVE_VERSION]);
const MAP_COORDINATE_ORIGIN = "BOTTOM_LEFT";

interface SavedRun {
  version: number;
  savedAt: number;
  mapCoordinateOrigin?: typeof MAP_COORDINATE_ORIGIN;
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
    const payload: SavedRun = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      mapCoordinateOrigin: MAP_COORDINATE_ORIGIN,
      state,
    };
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
    // 尚未出动的规划任务同步当前攻击区尺寸；执行中、结果与复盘继续保留当时规则。
    target: mission.status === "PLANNING"
      ? { ...currentMission.target, attackRadius: gameConfig.mission.attackRadius }
      : currentMission.target,
    radarScanRateModifier: mission.radarScanRateModifier ?? scanRateModifier,
    finalStrikeNotes: (currentMission.finalStrikeNotes ?? []).filter((note) => !isRemovedEnemyEscalationNote(note)),
    // 已执行任务与复盘必须保留当时的撤离区；极旧存档缺失该字段时才使用 Seed 确定的当前规则补全。
    extractionArea: currentMission.extractionArea ?? generateExtractionArea(getMissionContentSeed(mission)),
  };
}

/** MissionSession 的运行 Seed 带有 `-M01` 后缀，地图内容仍由工厂输入的节点 Seed 生成。 */
function getMissionContentSeed(mission: MissionSession): string {
  const missionIdPrefix = "mission-";
  return mission.id.startsWith(missionIdPrefix)
    ? mission.id.slice(missionIdPrefix.length)
    : mission.seed.replace(/-M01$/, "");
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
    if (!payload.version || !SUPPORTED_SAVE_VERSIONS.has(payload.version) || !isRunState(payload.state)) return undefined;
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
    const needsPlanningCoordinateMigration = legacyStatus === "PLANNING"
      && (payload.version === 1 || payload.mapCoordinateOrigin !== MAP_COORDINATE_ORIGIN);
    if (needsPlanningCoordinateMigration) {
      const currentNode = restored.campaign.nodes.find((node) => node.id === restored.campaign.currentNodeId);
      // v1 或会话-17期间产生的无坐标标记 v2 规划任务按当前规则重建，并丢弃尚未执行的旧航线。
      if (currentNode) restored.currentMission = prepareCampaignMission(restored, currentNode);
    }
    syncEventSequenceFromRun(restored);
    return restored;
  } catch {
    return undefined;
  }
}
