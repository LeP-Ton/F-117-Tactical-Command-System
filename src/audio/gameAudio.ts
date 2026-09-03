import type { GameEvent, MissionStatus, ThreatStage } from "../domain/types";

export type SoundCue =
  | "CONTACT"
  | "ALERT"
  | "LOCK"
  | "MISSILE"
  | "MISSILE_DEFEATED"
  | "ATTACK"
  | "SUCCESS"
  | "FAILURE"
  | "UI";

/** 将领域事件映射为音效语义，音频实现不反向依赖游戏状态。 */
export function cueForEvent(event: GameEvent): SoundCue | undefined {
  switch (event.type) {
    case "RADAR_CONTACT": return "CONTACT";
    case "AWARENESS_STAGE_CHANGED": {
      const rank = { CALM: 0, SUSPICIOUS: 1, SEARCHING: 2, HUNTING: 3 } as const;
      const from = event.data.from as keyof typeof rank;
      const to = event.data.to as keyof typeof rank;
      return rank[to] > rank[from] ? "ALERT" : undefined;
    }
    case "THREAT_STAGE_CHANGED": return event.data.to === "LOCKED" ? "LOCK" : undefined;
    case "MISSILE_LAUNCHED": return "MISSILE";
    case "MISSILE_DEFEATED": return "MISSILE_DEFEATED";
    case "ATTACK": return "ATTACK";
    case "MISSION_SUCCESS": return "SUCCESS";
    case "MISSION_FAILED":
    case "AIRCRAFT_DESTROYED": return "FAILURE";
    case "WAYPOINT_ADDED":
    case "WAYPOINT_MOVED":
    case "WAYPOINT_REMOVED": return "UI";
    default: return undefined;
  }
}

type AlarmMode = "LOCK" | "MISSILE";

/** 将音量约束在 Web Audio 主增益允许的 0–1 范围，0 即完全关闭声音。 */
export function normalizeVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}

/** 使用 Web Audio 合成座舱提示音，避免引入外部音频素材与加载状态。 */
export class GameAudioEngine {
  private context?: AudioContext;
  private master?: GainNode;
  private alarmTimer?: number;
  private alarmMode?: AlarmMode;
  private volume = 0.35;
  private lastContactAt = 0;
  private lastFailureAt = 0;

  async unlock(): Promise<void> {
    if (typeof AudioContext === "undefined") return;
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
      this.applyVolume();
    }
    if (this.context.state === "suspended") await this.context.resume();
  }

  setVolume(volume: number): void {
    this.volume = normalizeVolume(volume);
    this.applyVolume();
  }

  playEvent(event: GameEvent): void {
    const cue = cueForEvent(event);
    if (!cue || !this.context) return;

    if (cue === "CONTACT") {
      const now = performance.now();
      if (now - this.lastContactAt < 280) return;
      this.lastContactAt = now;
    }
    if (cue === "FAILURE") {
      const now = performance.now();
      if (now - this.lastFailureAt < 600) return;
      this.lastFailureAt = now;
    }

    switch (cue) {
      case "CONTACT":
        this.tone(780, 0.055, 0.045, "sine");
        break;
      case "ALERT":
        this.sequence([420, 560], 0.075, 0.05);
        break;
      case "LOCK":
        this.startAlarm("LOCK");
        break;
      case "MISSILE":
        this.startAlarm("MISSILE");
        break;
      case "MISSILE_DEFEATED":
        this.stopAlarm();
        this.sequence([720, 520, 360], 0.09, 0.06);
        break;
      case "ATTACK":
        this.noiseBurst(0.38, 0.16);
        this.tone(110, 0.45, 0.13, "sawtooth");
        break;
      case "SUCCESS":
        this.stopAlarm();
        this.sequence([440, 554, 659, 880], 0.12, 0.07);
        break;
      case "FAILURE":
        this.stopAlarm();
        this.noiseBurst(0.55, 0.22);
        this.sequence([320, 240, 160], 0.16, 0.1);
        break;
      case "UI":
        this.tone(520, 0.035, 0.025, "square");
        break;
    }
  }

  syncMission(status: MissionStatus, threatStage: ThreatStage): void {
    if (status !== "RUNNING") {
      this.stopAlarm();
      return;
    }
    if (threatStage === "MISSILE_INBOUND") this.startAlarm("MISSILE");
    else if (threatStage === "LOCKED") this.startAlarm("LOCK");
    else this.stopAlarm();
  }

  dispose(): void {
    this.stopAlarm();
  }

  private applyVolume(): void {
    if (!this.master || !this.context) return;
    this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.015);
  }

  private startAlarm(mode: AlarmMode): void {
    if (!this.context || this.alarmMode === mode) return;
    this.stopAlarm();
    this.alarmMode = mode;
    const pulse = () => {
      if (mode === "MISSILE") this.sequence([940, 620], 0.085, 0.085);
      else this.sequence([760, 760], 0.07, 0.055);
    };
    pulse();
    this.alarmTimer = window.setInterval(pulse, mode === "MISSILE" ? 360 : 620);
  }

  private stopAlarm(): void {
    if (this.alarmTimer !== undefined) window.clearInterval(this.alarmTimer);
    this.alarmTimer = undefined;
    this.alarmMode = undefined;
  }

  private sequence(frequencies: number[], duration: number, gain: number): void {
    frequencies.forEach((frequency, index) => {
      this.tone(frequency, duration, gain, "square", index * duration * 1.15);
    });
  }

  private tone(
    frequency: number,
    duration: number,
    gainValue: number,
    type: OscillatorType,
    delay = 0,
  ): void {
    if (!this.context || !this.master) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private noiseBurst(duration: number, gainValue: number): void {
    if (!this.context || !this.master) return;
    const frameCount = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, frameCount, this.context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length);
    }
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    gain.gain.value = gainValue;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.master);
    source.start();
  }
}

export const gameAudio = new GameAudioEngine();
