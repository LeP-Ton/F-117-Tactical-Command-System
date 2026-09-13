import { beforeEach, describe, expect, it } from "vitest";
import { createRun } from "../domain/factories";
import { loadRunProgress, RUN_SAVE_KEY, saveRunProgress } from "./gamePersistence";

describe("任务进度保存", () => {
  beforeEach(() => window.localStorage.clear());

  it("保存并恢复完整 Run 状态", () => {
    const state = createRun("SAVE-RESTORE");
    const savedExtractionArea = { x: 850, y: 850, width: 100, height: 100 };
    const changed = {
      ...state,
      currentMission: {
        ...state.currentMission!,
        elapsedMs: 12_500,
        aircraft: { ...state.currentMission!.aircraft, fuelRemaining: 1450 },
        extractionArea: savedExtractionArea,
        route: {
          ...state.currentMission!.route,
          waypoints: [
            ...state.currentMission!.route.waypoints,
            { id: "saved-route", kind: "NAVIGATION" as const, status: "PENDING" as const, position: { x: 450, y: 550 } },
          ],
        },
      },
    };

    saveRunProgress(changed);

    const payload = JSON.parse(window.localStorage.getItem(RUN_SAVE_KEY)!);
    expect(payload.version).toBe(2);
    expect(payload.mapCoordinateOrigin).toBe("BOTTOM_LEFT");
    const restored = loadRunProgress();
    expect(restored?.seed).toBe("SAVE-RESTORE");
    expect(restored?.currentMission?.elapsedMs).toBe(12_500);
    expect(restored?.currentMission?.aircraft.fuelRemaining).toBe(1450);
    expect(restored?.currentMission?.extractionArea).toEqual(savedExtractionArea);
    expect(restored?.currentMission?.route).toEqual(changed.currentMission.route);
  });

  it("刷新时运行中的任务保持执行状态", () => {
    const state = createRun("SAVE-RUNNING");
    saveRunProgress({
      ...state,
      currentMission: { ...state.currentMission!, status: "RUNNING" },
    });

    expect(loadRunProgress()?.currentMission?.status).toBe("RUNNING");
  });

  it("刷新时规划任务同步当前攻击半径但保留既有航线", () => {
    const state = createRun("SAVE-PLANNING-RADIUS");
    const route = {
      ...state.currentMission!.route,
      waypoints: [
        ...state.currentMission!.route.waypoints,
        { id: "planned-route", kind: "NAVIGATION" as const, status: "PENDING" as const, position: { x: 500, y: 500 } },
      ],
    };
    saveRunProgress({
      ...state,
      currentMission: {
        ...state.currentMission!,
        target: { ...state.currentMission!.target, attackRadius: 100 },
        route,
      },
    });

    const restored = loadRunProgress();
    expect(restored?.currentMission?.target.attackRadius).toBe(50);
    expect(restored?.currentMission?.route).toEqual(route);
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

  it("版本 1 的规划任务按节点 Seed 重建并清除旧航线", () => {
    const state = createRun("SAVE-LEGACY-EXTRACTION");
    const legacyState = {
      ...state,
      currentMission: {
        ...state.currentMission!,
        extractionArea: { x: 850, y: 30, width: 120, height: 120 },
        route: {
          ...state.currentMission!.route,
          waypoints: [
            ...state.currentMission!.route.waypoints,
            { id: "legacy-route", kind: "NAVIGATION" as const, status: "PENDING" as const, position: { x: 500, y: 500 } },
          ],
        },
      },
    };
    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: legacyState }));

    const restored = loadRunProgress();
    expect([
      { x: 50, y: 50, width: 100, height: 100 },
      { x: 850, y: 50, width: 100, height: 100 },
      { x: 850, y: 850, width: 100, height: 100 },
    ]).toContainEqual(restored?.currentMission?.extractionArea);
    expect(restored?.currentMission?.route.waypoints).toEqual([
      { id: "insertion", kind: "INSERTION", position: { x: 100, y: 900 }, status: "LOCKED" },
    ]);
    expect(restored?.currentMission?.radarScanRateModifier).toBe(state.enemyState.radarScanRateModifier);
  });

  it("版本 1 的运行中任务与历史复盘保留旧地图", () => {
    const state = createRun("SAVE-LEGACY-HISTORY");
    const legacyExtractionArea = { x: 860, y: 50, width: 100, height: 100 };
    const legacyMission = {
      ...state.currentMission!,
      status: "RUNNING" as const,
      extractionArea: legacyExtractionArea,
      route: {
        ...state.currentMission!.route,
        waypoints: [
          ...state.currentMission!.route.waypoints,
          { id: "active-route", kind: "NAVIGATION" as const, status: "PENDING" as const, position: { x: 600, y: 600 } },
        ],
      },
    };
    const legacyState = {
      ...state,
      currentMission: legacyMission,
      missionDebriefs: {
        "C0-0": {
          nodeId: "C0-0",
          completedAt: 5000,
          intelAccessTier: 0 as const,
          mission: { ...legacyMission, status: "SUCCESS" as const },
        },
      },
    };
    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: legacyState }));

    const restored = loadRunProgress();
    expect(restored?.currentMission?.extractionArea).toEqual(legacyExtractionArea);
    expect(restored?.currentMission?.route).toEqual(legacyMission.route);
    expect(restored?.missionDebriefs["C0-0"]?.mission.extractionArea).toEqual(legacyExtractionArea);
  });

  it("无坐标标记的版本 2 规划任务会重建到左下原点规则", () => {
    const state = createRun("SAVE-V2-COORDINATE-MIGRATION");
    const legacyState = {
      ...state,
      currentMission: {
        ...state.currentMission!,
        aircraft: { ...state.currentMission!.aircraft, position: { x: 100, y: 100 } },
        route: {
          activeWaypointIndex: 1,
          waypoints: [
            { id: "insertion", kind: "INSERTION" as const, position: { x: 100, y: 100 }, status: "LOCKED" as const },
            { id: "legacy-route", kind: "NAVIGATION" as const, position: { x: 500, y: 500 }, status: "PENDING" as const },
          ],
        },
      },
    };
    window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 2, savedAt: Date.now(), state: legacyState }));

    const restored = loadRunProgress();
    expect(restored?.currentMission?.aircraft.position).toEqual({ x: 100, y: 900 });
    expect(restored?.currentMission?.route.waypoints).toEqual([
      { id: "insertion", kind: "INSERTION", position: { x: 100, y: 900 }, status: "LOCKED" },
    ]);
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
        status: "RUNNING" as const,
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
