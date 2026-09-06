import { beforeEach, describe, expect, it } from "vitest";
import { createRun } from "../domain/factories";
import { loadRunProgress, RUN_SAVE_KEY, saveRunProgress } from "./gamePersistence";

describe("任务进度保存", () => {
  beforeEach(() => window.localStorage.clear());

  it("保存并恢复完整 Run 状态", () => {
    const state = createRun("SAVE-RESTORE");
    const changed = {
      ...state,
      currentMission: {
        ...state.currentMission!,
        elapsedMs: 12_500,
        aircraft: { ...state.currentMission!.aircraft, fuelRemaining: 1450 },
      },
    };

    saveRunProgress(changed);

    const restored = loadRunProgress();
    expect(restored?.seed).toBe("SAVE-RESTORE");
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

  it("恢复旧存档时将撤离区迁移到当前固定区域", () => {
    const state = createRun("SAVE-LEGACY-EXTRACTION");
    const legacyState = {
      ...state,
      currentMission: {
        ...state.currentMission!,
        extractionArea: { x: 850, y: 30, width: 120, height: 120 },
      },
    };
    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: legacyState }));

    expect(loadRunProgress()?.currentMission?.extractionArea).toEqual({ x: 860, y: 50, width: 100, height: 100 });
  });

  it("恢复旧存档时移除废弃的情报质量与敌方升级字段", () => {
    const state = createRun("SAVE-LEGACY-INTEL-QUALITY");
    const legacyState = {
      ...state,
      resources: { enemyAlert: 30, intelAccuracyBonus: 0.2 },
      enemyState: {
        ...state.enemyState,
        adaptationLevel: 2,
        tacticalProfile: {
          missionSamples: 2,
          terrainMaskingPreference: 0.5,
          southernRouteBias: 0.8,
          aggressiveRouting: 0.75,
        },
      },
      campaign: {
        ...state.campaign,
        nodes: state.campaign.nodes.map((node) => ({
          ...node,
          preview: { ...node.preview, intelAccuracy: 0.88 },
        })),
      },
      currentMission: {
        ...state.currentMission!,
        intelAccuracy: 0.98,
        flightPath: [{ x: 90, y: 900 }, { x: 400, y: 800 }],
        adaptationNotes: ["南部航路搜索加强"],
        finalStrikeNotes: ["目标区后备火控雷达上线", "历史航迹未形成高可信反制画像"],
      },
    };
    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: legacyState }));

    const restored = loadRunProgress();
    expect(restored).not.toHaveProperty("resources");
    expect(restored?.enemyState).not.toHaveProperty("adaptationLevel");
    expect(restored?.enemyState).not.toHaveProperty("tacticalProfile");
    expect(restored?.currentMission).not.toHaveProperty("intelAccuracy");
    expect(restored?.currentMission).not.toHaveProperty("flightPath");
    expect(restored?.currentMission).not.toHaveProperty("adaptationNotes");
    expect(restored?.currentMission?.finalStrikeNotes).toEqual(["目标区后备火控雷达上线"]);
    restored?.campaign.nodes.forEach((node) => expect(node.preview).not.toHaveProperty("intelAccuracy"));
  });

  it("损坏或版本不兼容的存档不会阻断初始化", () => {
    window.localStorage.setItem(RUN_SAVE_KEY, "{broken");
    expect(loadRunProgress()).toBeUndefined();
    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 999, state: createRun("OLD") }));
    expect(loadRunProgress()).toBeUndefined();
  });
});
