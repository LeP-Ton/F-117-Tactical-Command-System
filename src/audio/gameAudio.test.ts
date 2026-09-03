import { describe, expect, it } from "vitest";
import { cueForEvent, normalizeVolume } from "./gameAudio";
import type { GameEvent, GameEventType } from "../domain/types";

function event(type: GameEventType, data: Record<string, unknown> = {}): GameEvent {
  return { id: type, timestamp: 0, missionId: "M1", type, data };
}

describe("游戏音效事件映射", () => {
  it("核心战斗事件映射到明确音效", () => {
    expect(cueForEvent(event("RADAR_CONTACT"))).toBe("CONTACT");
    expect(cueForEvent(event("MISSILE_LAUNCHED"))).toBe("MISSILE");
    expect(cueForEvent(event("MISSILE_DEFEATED"))).toBe("MISSILE_DEFEATED");
    expect(cueForEvent(event("ATTACK"))).toBe("ATTACK");
    expect(cueForEvent(event("MISSION_SUCCESS"))).toBe("SUCCESS");
    expect(cueForEvent(event("AIRCRAFT_DESTROYED"))).toBe("FAILURE");
  });

  it("只有进入锁定阶段时播放锁定警报", () => {
    expect(cueForEvent(event("THREAT_STAGE_CHANGED", { to: "LOCKED" }))).toBe("LOCK");
    expect(cueForEvent(event("THREAT_STAGE_CHANGED", { to: "TRACKED" }))).toBeUndefined();
  });

  it("警戒只在阶段提升时提示", () => {
    expect(cueForEvent(event("AWARENESS_STAGE_CHANGED", { from: "CALM", to: "SUSPICIOUS" }))).toBe("ALERT");
    expect(cueForEvent(event("AWARENESS_STAGE_CHANGED", { from: "SEARCHING", to: "SUSPICIOUS" }))).toBeUndefined();
  });

  it("不需要声音的内部事件不会生成提示", () => {
    expect(cueForEvent(event("COMMANDER_ORDER"))).toBeUndefined();
  });
});

describe("游戏音量边界", () => {
  it("允许直接把主音量调至零以完全关闭声音", () => {
    expect(normalizeVolume(0)).toBe(0);
    expect(normalizeVolume(-0.2)).toBe(0);
    expect(normalizeVolume(1.2)).toBe(1);
  });
});
