import { beforeEach, describe, expect, it } from "vitest";
import { createRun } from "../domain/factories";
import { loadRunProgress, RUN_SAVE_KEY, saveRunProgress } from "./gamePersistence";

describe("任务进度保存", () => {
  beforeEach(() => window.localStorage.clear());

  it("保存并恢复完整 Run 状态", () => {
    const state = createRun("SAVE-RESTORE");
    const changed = {
      ...state,
      resources: { ...state.resources, enemyAlert: 37 },
      currentMission: {
        ...state.currentMission!,
        elapsedMs: 12_500,
        aircraft: { ...state.currentMission!.aircraft, fuelRemaining: 1450 },
      },
    };

    saveRunProgress(changed);

    const restored = loadRunProgress();
    expect(restored?.seed).toBe("SAVE-RESTORE");
    expect(restored?.resources.enemyAlert).toBe(37);
    expect(restored?.currentMission?.elapsedMs).toBe(12_500);
    expect(restored?.currentMission?.aircraft.fuelRemaining).toBe(1450);
  });

  it("刷新时运行中的任务保持执行状态", () => {
    const state = createRun("SAVE-RUNNING");
    saveRunProgress({
      ...state,
      currentMission: { ...state.currentMission!, status: "RUNNING" },
    });

    expect(loadRunProgress()?.currentMission?.status).toBe("RUNNING");
  });

  it("旧版暂停存档迁移为运行状态并补全复盘集合", () => {
    const state = createRun("SAVE-LEGACY-PAUSED");
    const legacyState = {
      ...state,
      missionDebriefs: undefined,
      currentMission: { ...state.currentMission!, status: "PAUSED" },
    };
    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: legacyState }));

    const restored = loadRunProgress();
    expect(restored?.currentMission?.status).toBe("RUNNING");
    expect(restored?.missionDebriefs).toEqual({});
  });

  it("损坏或版本不兼容的存档不会阻断初始化", () => {
    window.localStorage.setItem(RUN_SAVE_KEY, "{broken");
    expect(loadRunProgress()).toBeUndefined();
    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 999, state: createRun("OLD") }));
    expect(loadRunProgress()).toBeUndefined();
  });
});
