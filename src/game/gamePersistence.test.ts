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

  it("旧存档缺少扫描速率字段时补为正常速率", () => {
    const state = createRun("SAVE-LEGACY-SCAN-RATE");
    const legacyEnemyState = { ...state.enemyState } as Partial<typeof state.enemyState>;
    const legacyMission = { ...state.currentMission! } as Partial<NonNullable<typeof state.currentMission>>;
    delete legacyEnemyState.radarScanRateModifier;
    delete legacyMission.radarScanRateModifier;
    const legacyState = {
      ...state,
      campaign: {
        ...state.campaign,
        nodes: state.campaign.nodes.map((node) => node.id === "C0-1"
          ? { ...node, status: "COMPLETED" as const }
          : node),
      },
      enemyState: legacyEnemyState,
      currentMission: legacyMission,
    };
    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: legacyState }));

    const restored = loadRunProgress();
    expect(restored?.enemyState.radarScanRateModifier).toBeCloseTo(0.9);
    expect(restored?.currentMission?.radarScanRateModifier).toBeCloseTo(0.9);
  });

  it("恢复旧存档时移除废弃的情报质量字段", () => {
    const state = createRun("SAVE-LEGACY-INTEL-QUALITY");
    const legacyState = {
      ...state,
      resources: { ...state.resources, intelAccuracyBonus: 0.2 },
      campaign: {
        ...state.campaign,
        nodes: state.campaign.nodes.map((node) => ({
          ...node,
          preview: { ...node.preview, intelAccuracy: 0.88 },
        })),
      },
      currentMission: { ...state.currentMission!, intelAccuracy: 0.98 },
    };
    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: legacyState }));

    const restored = loadRunProgress();
    expect(restored?.resources).toEqual({ enemyAlert: 0 });
    expect(restored?.currentMission).not.toHaveProperty("intelAccuracy");
    restored?.campaign.nodes.forEach((node) => expect(node.preview).not.toHaveProperty("intelAccuracy"));
  });

  it("损坏或版本不兼容的存档不会阻断初始化", () => {
    window.localStorage.setItem(RUN_SAVE_KEY, "{broken");
    expect(loadRunProgress()).toBeUndefined();
    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 999, state: createRun("OLD") }));
    expect(loadRunProgress()).toBeUndefined();
  });
});
