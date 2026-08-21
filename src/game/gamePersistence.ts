import { syncEventSequenceFromRun } from "../domain/factories";
import type { RunState } from "../domain/types";

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

export function loadRunProgress(): RunState | undefined {
  try {
    const raw = window.localStorage.getItem(RUN_SAVE_KEY);
    if (!raw) return undefined;
    const payload = JSON.parse(raw) as Partial<SavedRun>;
    if (payload.version !== SAVE_VERSION || !isRunState(payload.state)) return undefined;
    const restored = payload.state.currentMission?.status === "RUNNING"
      ? {
        ...payload.state,
        currentMission: { ...payload.state.currentMission, status: "PAUSED" as const },
      }
      : payload.state;
    syncEventSequenceFromRun(restored);
    return restored;
  } catch {
    return undefined;
  }
}
