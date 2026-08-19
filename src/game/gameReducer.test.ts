import { describe, expect, it } from "vitest";
import { createMission, createRun } from "../domain/factories";
import { gameReducer } from "./gameReducer";

describe("gameReducer", () => {
  it("重置任务会保留当前战役节点与 Run 持久状态", () => {
    let state = createRun("RESET-CURRENT-NODE");
    const secondNode = state.campaign.nodes.find((node) => node.id === "C0-1")!;
    state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: secondNode.id });
    state = {
      ...state,
      resources: { ...state.resources, enemyAlert: 25, intelAccuracyBonus: 0.1 },
      enemyState: {
        ...state.enemyState,
        radarCoverageModifier: 0.85,
        commanderCoordinationModifier: 0.75,
      },
      missionHistory: [{ missionId: "earlier-mission", outcome: "SUCCESS" }],
      currentMission: {
        ...state.currentMission!,
        status: "PAUSED",
        elapsedMs: 12_000,
      },
    };

    const campaignBeforeReset = state.campaign;
    const resourcesBeforeReset = state.resources;
    const enemyStateBeforeReset = state.enemyState;
    const historyBeforeReset = state.missionHistory;
    state = gameReducer(state, { type: "RESET" });

    expect(state.campaign).toBe(campaignBeforeReset);
    expect(state.campaign.currentNodeId).toBe("C0-1");
    expect(state.resources).toBe(resourcesBeforeReset);
    expect(state.enemyState).toBe(enemyStateBeforeReset);
    expect(state.missionHistory).toBe(historyBeforeReset);
    expect(state.currentMission?.id).toBe(`mission-${secondNode.missionSeed}`);
    expect(state.currentMission?.status).toBe("PLANNING");
    expect(state.currentMission?.elapsedMs).toBe(0);
    expect(state.currentMission?.commanderCoordinationModifier).toBeCloseTo(0.75);
    expect(state.currentMission?.events.map((event) => event.type)).toEqual(["MISSION_RESET"]);
  });

  it("规划、开始、暂停、重规划并继续", () => {
    let state = createRun("TEST");
    state = gameReducer(state, { type: "ADD_WAYPOINT", position: { x: 200, y: 800 } });
    state = gameReducer(state, { type: "START" });
    expect(state.currentMission?.status).toBe("RUNNING");

    state = gameReducer(state, { type: "PAUSE" });
    const pausedPosition = state.currentMission?.aircraft.position;
    state = gameReducer(state, { type: "TICK", deltaSeconds: 1 });
    expect(state.currentMission?.aircraft.position).toEqual(pausedPosition);

    state = gameReducer(state, { type: "MOVE_WAYPOINT", index: 1, position: { x: 300, y: 700 } });
    state = gameReducer(state, { type: "RESUME" });
    expect(state.currentMission?.status).toBe("RUNNING");
    expect(state.currentMission?.route.waypoints[1]?.position).toEqual({ x: 300, y: 700 });
  });

  it("任务更新不破坏 Run 与 Campaign 状态", () => {
    const state = createRun("BOUNDARY");
    const updated = gameReducer(state, { type: "ADD_WAYPOINT", position: { x: 400, y: 400 } });
    expect(updated.seed).toBe("BOUNDARY");
    expect(updated.campaign).toEqual(state.campaign);
    expect(updated.currentMission).not.toBe(state.currentMission);
  });

  it("进入攻击范围会自动投弹、消耗武器并显著提高警戒", () => {
    let state = createRun("STRIKE");
    const mission = state.currentMission!;
    state = {
      ...state,
      currentMission: {
        ...mission,
        status: "RUNNING",
        aircraft: { ...mission.aircraft, position: { ...mission.target.position } },
        route: {
          activeWaypointIndex: 1,
          waypoints: [
            mission.route.waypoints[0]!,
            { id: "continue", kind: "NAVIGATION", status: "PENDING", position: { x: 950, y: 950 } },
          ],
        },
      },
    };
    state = gameReducer(state, { type: "TICK", deltaSeconds: 0.01 });
    expect(state.currentMission?.target.destroyed).toBe(true);
    expect(state.currentMission?.awareness.value).toBeGreaterThan(30);
    expect(state.currentMission?.events.some((event) => event.type === "ATTACK" && event.data.automatic === true)).toBe(true);
  });

  it("新任务基础飞行速度为 3.6 u/s", () => {
    expect(createRun("SLOW-FLIGHT").currentMission?.aircraft.speed).toBe(3.6);
  });

  it("摧毁目标并进入撤离区后记录成功", () => {
    let state = createRun("SUCCESS");
    const mission = state.currentMission!;
    const extractionPoint = { x: 900, y: 80 };
    state = {
      ...state,
      currentMission: {
        ...mission,
        status: "RUNNING",
        target: { ...mission.target, destroyed: true },
        aircraft: { ...mission.aircraft, position: extractionPoint },
        route: {
          activeWaypointIndex: 1,
          waypoints: [
            mission.route.waypoints[0]!,
            { id: "extract", kind: "NAVIGATION", position: extractionPoint, status: "PENDING" },
          ],
        },
      },
    };
    state = gameReducer(state, { type: "TICK", deltaSeconds: 0.01 });
    expect(state.currentMission?.status).toBe("SUCCESS");
    expect(state.missionHistory.at(-1)?.outcome).toBe("SUCCESS");
  });

  it("航线结束但目标未摧毁时记录失败", () => {
    let state = createRun("FAILURE");
    const mission = state.currentMission!;
    const endpoint = { ...mission.aircraft.position };
    state = {
      ...state,
      currentMission: {
        ...mission,
        status: "RUNNING",
        route: {
          activeWaypointIndex: 1,
          waypoints: [
            mission.route.waypoints[0]!,
            { id: "end", kind: "NAVIGATION", position: endpoint, status: "PENDING" },
          ],
        },
      },
    };
    state = gameReducer(state, { type: "TICK", deltaSeconds: 0.01 });
    expect(state.currentMission?.status).toBe("FAILED");
    expect(state.missionHistory.at(-1)?.outcome).toBe("FAILED");
  });

  it("返回战役地图会完成节点、发放 Recon 奖励并解锁下一层", () => {
    let state = createRun("CAMPAIGN-SUCCESS");
    state = { ...state, currentMission: { ...state.currentMission!, status: "SUCCESS" } };
    state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
    expect(state.campaign.completedNodeIds).toContain("C0-0");
    expect(state.resources.intelAccuracyBonus).toBeCloseTo(0.06);
    expect(state.campaign.nodes.filter((node) => node.layer === 1).every((node) => node.status === "AVAILABLE")).toBe(true);
  });

  it("失败不会结束 Run，但会提高 Enemy Alert", () => {
    let state = createRun("CAMPAIGN-FAILURE");
    state = { ...state, currentMission: { ...state.currentMission!, status: "FAILED" } };
    state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
    expect(state.status).toBe("ACTIVE");
    expect(state.resources.enemyAlert).toBe(10);
    expect(state.campaign.nodes.find((node) => node.id === "C0-0")?.status).toBe("FAILED");
  });

  it("SEAD 成功会永久降低后续任务雷达覆盖", () => {
    let state = createRun("SEAD-EFFECT");
    state = {
      ...state,
      campaign: { ...state.campaign, currentNodeId: "C1-1" },
      currentMission: { ...state.currentMission!, status: "SUCCESS" },
    };
    state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
    expect(state.enemyState.radarCoverageModifier).toBeCloseTo(0.85);
    const available = state.campaign.nodes.find((node) => node.status === "AVAILABLE")!;
    const baseline = createMission(available.missionSeed).radars[0]!.range;
    state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: available.id });
    expect(state.currentMission!.radars[0]!.range).toBeCloseTo(baseline * 0.85);
  });

  it("Recon 与 ELINT 会提高后续任务情报精度", () => {
    let state = createRun("INTEL-EFFECT");
    state = { ...state, currentMission: { ...state.currentMission!, status: "SUCCESS" } };
    state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
    expect(state.resources.intelAccuracyBonus).toBeCloseTo(0.06);
    const nextNode = state.campaign.nodes.find((node) => node.status === "AVAILABLE")!;
    const baseline = createMission(nextNode.missionSeed).intelAccuracy;
    state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: nextNode.id });
    expect(state.currentMission!.intelAccuracy).toBeCloseTo(Math.min(0.99, baseline + 0.06));
  });

  it("Command Strike 会永久降低后续 Commander 协调效率", () => {
    let state = createRun("COMMAND-EFFECT");
    state = {
      ...state,
      campaign: { ...state.campaign, currentNodeId: "C2-0" },
      currentMission: { ...state.currentMission!, status: "SUCCESS" },
    };
    state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
    expect(state.enemyState.commanderCoordinationModifier).toBeCloseTo(0.75);
    const nextNode = state.campaign.nodes.find((node) => node.status === "AVAILABLE")!;
    state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: nextNode.id });
    expect(state.currentMission!.commanderCoordinationModifier).toBeCloseTo(0.75);
  });

  it("Enemy Alert 会扩大后续任务雷达覆盖", () => {
    let state = createRun("ALERT-EFFECT");
    const node = state.campaign.nodes.find((candidate) => candidate.status === "AVAILABLE")!;
    const baseline = createMission(node.missionSeed).radars[0]!.range;
    state = { ...state, resources: { ...state.resources, enemyAlert: 50 } };
    state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: node.id });
    expect(state.currentMission!.radars[0]!.range).toBeCloseTo(baseline * 1.2);
  });

  it("完成任务后学习已飞航线并反制后续部署", () => {
    let state = createRun("ADAPTATION-FLOW");
    const mission = state.currentMission!;
    state = {
      ...state,
      currentMission: {
        ...mission,
        status: "SUCCESS",
        route: {
          activeWaypointIndex: 2,
          waypoints: [
            { ...mission.route.waypoints[0]!, status: "COMPLETED" },
            { id: "south-1", kind: "NAVIGATION", status: "COMPLETED", position: { x: 350, y: 850 } },
            { id: "south-2", kind: "NAVIGATION", status: "COMPLETED", position: { x: 700, y: 820 } },
          ],
        },
      },
    };
    state = gameReducer(state, { type: "RETURN_CAMPAIGN" });
    expect(state.enemyState.adaptationLevel).toBe(1);
    expect(state.enemyState.tacticalProfile.missionSamples).toBe(1);
    expect(state.enemyState.tacticalProfile.southernRouteBias).toBeGreaterThan(0.7);

    const nextNode = state.campaign.nodes.find((node) => node.status === "AVAILABLE")!;
    state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: nextNode.id });
    expect(state.currentMission!.adaptationNotes).toContain("南部航路搜索加强");
  });

  it("选择 Final Strike 时根据完整 Run 历史生成最终防空", () => {
    let state = createRun("FINAL-FLOW");
    const finalNode = state.campaign.nodes.find((node) => node.type === "FINAL_STRIKE")!;
    const seadNode = state.campaign.nodes.find((node) => node.type === "SEAD")!;
    state = {
      ...state,
      campaign: {
        ...state.campaign,
        completedNodeIds: [seadNode.id],
        nodes: state.campaign.nodes.map((node) => node.id === finalNode.id ? { ...node, status: "AVAILABLE" } : node),
      },
      resources: { ...state.resources, enemyAlert: 25 },
      enemyState: { ...state.enemyState, adaptationLevel: 2 },
    };

    state = gameReducer(state, { type: "SELECT_CAMPAIGN_NODE", nodeId: finalNode.id });

    expect(state.currentMission!.finalStrikeNotes).toContain("SEAD 战果阻止目标区后备雷达上线");
    expect(state.currentMission!.radars.some((radar) => radar.id === "ALERT-GUARD")).toBe(true);
    expect(state.currentMission!.radars.some((radar) => radar.id === "ADAPT-GUARD")).toBe(true);
    expect(state.currentMission!.radarIntel).toHaveLength(state.currentMission!.radars.length);
  });

  it("导弹首次命中即摧毁飞机并使整个 Run 失败", () => {
    let state = createRun("MISSILE-HIT");
    const mission = state.currentMission!;
    state = {
      ...state,
      currentMission: {
        ...mission,
        status: "RUNNING",
        engagement: {
          stage: "MISSILE_INBOUND",
          trackProgress: 100,
          missileTimeRemainingSeconds: 0.01,
          launches: 1,
        },
        route: {
          activeWaypointIndex: 1,
          waypoints: [
            mission.route.waypoints[0]!,
            { id: "survival", kind: "NAVIGATION", status: "PENDING", position: { x: 500, y: 500 } },
          ],
        },
      },
    };

    state = gameReducer(state, { type: "TICK", deltaSeconds: 0.02 });

    expect(state.status).toBe("DEFEAT");
    expect(state.currentMission!.status).toBe("FAILED");
    expect(state.currentMission!.events.some((event) => event.type === "AIRCRAFT_DESTROYED")).toBe(true);
    expect(state.currentMission!.events.at(-1)?.data.reason).toBe("AIRCRAFT_DESTROYED");
  });
});
